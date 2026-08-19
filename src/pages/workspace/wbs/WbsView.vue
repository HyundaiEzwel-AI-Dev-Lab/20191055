<script setup>
// PAG-S-WBS-01/08 WBS 관리
import { computed, onMounted, ref } from 'vue'
import { useRoute } from 'vue-router'
import {
  wbsMeta,
  taskTypeOptions,
  progressStatusOptions,
  scheduleComplianceOptions,
  systemOptions,
  assigneeOptions,
  getWbsTasks,
  formatDateRange,
  statusLabel,
  statusClass,
  matchWbsFilters,
  wbsMockToday,
  calcExecProgress,
  calcTotalProgress,
} from '@/entities/wbs/mock/wbs'
import { bizCategoryMap } from '@/entities/requirement/mock/requirement'
import WbsScheduleModal from '@/pages/workspace/wbs/WbsScheduleModal.vue'
import WbsScheduleReasonModal from '@/pages/workspace/wbs/WbsScheduleReasonModal.vue'
import WbsBulkScheduleModal from '@/pages/workspace/wbs/WbsBulkScheduleModal.vue'
import WbsRestartModal from '@/pages/workspace/wbs/WbsRestartModal.vue'
import WbsCalendar from '@/pages/workspace/wbs/WbsCalendar.vue'
import ExcelDownloadButton from '@/shared/ui/ExcelDownloadButton.vue'
import SearchFilterBar from '@/shared/ui/SearchFilterBar.vue'
import FilterSelectPill from '@/shared/ui/FilterSelectPill.vue'
import FilterTextPill from '@/shared/ui/FilterTextPill.vue'
import BaseTooltip from '@/shared/ui/BaseTooltip.vue'
import { mockExcelDownload } from '@/shared/file-excel/excelDownload'
import { addScheduleChangeRequest } from '@/entities/approval/mock/approval'
import { useProjectStore } from '@/app/stores/project'
import { useAuthStore } from '@/app/stores/auth'

const route = useRoute()
const projectStore = useProjectStore()
const authStore = useAuthStore()

const tasks = ref([])
const viewMode = ref('list')
const myTasksOnly = ref(false)
const selectedIds = ref(new Set())
const statusFilterOpen = ref(false)

const filters = ref({
  keyword: '',
  taskType: '전체',
  system: '',
  bizCategory: '',
  progressStatus: ['전체'],
  scheduleCompliance: '전체',
  progressBaseDate: wbsMeta.progressBaseDate,
  showExcluded: false,
})

const appliedFilters = ref({
  ...filters.value,
  progressStatus: [...filters.value.progressStatus],
})

const filterExpanded = ref(false)

const showScheduleModal = ref(false)
const scheduleTarget = ref(null)
const showReasonModal = ref(false)
const reasonTarget = ref(null)
const showRestartModal = ref(false)
const restartTarget = ref(null)
const showBulkScheduleModal = ref(false)
const bulkTargets = ref([])
const showCopyAlert = ref(false)
const showSaveAlert = ref(false)

const calYear = ref(2026)
const calMonth = ref(4)

const bizCategoryFilterOptions = computed(() => bizCategoryMap[filters.value.system] || [])
const systemPillOptions = [{ value: '', label: '시스템 선택' }, ...systemOptions]
const bizCategoryPillOptions = computed(() => [
  { value: '', label: '업무구분 선택' },
  ...bizCategoryFilterOptions.value,
])

const statusFilterLabel = computed(() => {
  const sel = filters.value.progressStatus || []
  if (!sel.length || sel.includes('전체')) return '전체'
  if (sel.length === 1) return sel[0]
  return `${sel[0]} 외 ${sel.length - 1}`
})

const filterTags = computed(() => {
  const f = appliedFilters.value
  const tags = []
  if (f.keyword) tags.push({ key: 'keyword', label: '통합검색', value: f.keyword })
  if (f.taskType && f.taskType !== '전체') tags.push({ key: 'taskType', label: '업무유형', value: f.taskType })
  if (f.system) tags.push({ key: 'system', label: '시스템', value: f.system })
  if (f.bizCategory) tags.push({ key: 'bizCategory', label: '업무구분', value: f.bizCategory })
  const statuses = f.progressStatus || []
  if (statuses.length && !statuses.includes('전체')) {
    tags.push({ key: 'progressStatus', label: '진행상태', value: statuses.join(', ') })
  }
  if (f.scheduleCompliance && f.scheduleCompliance !== '전체') {
    tags.push({ key: 'scheduleCompliance', label: '계획준수', value: f.scheduleCompliance })
  }
  if (f.progressBaseDate && f.progressBaseDate !== wbsMeta.progressBaseDate) {
    tags.push({ key: 'progressBaseDate', label: '공정률 기준날짜', value: f.progressBaseDate })
  }
  return tags
})

const filteredTasks = computed(() =>
  tasks.value.filter((row) =>
    matchWbsFilters(row, appliedFilters.value, myTasksOnly.value),
  ),
)

const selectedRows = computed(() => tasks.value.filter((t) => selectedIds.value.has(t.id)))
const totalProgress = computed(() => calcTotalProgress(tasks.value))
const canManageSchedule = computed(() => authStore.user?.role !== '사용자')

onMounted(() => {
  tasks.value = getWbsTasks(authStore.user?.id)
  tasks.value.forEach((t) => {
    if (t.status === '진행중') t.execProgress = calcExecProgress(t)
  })
  const assigneeQuery = String(route.query.assignee || '')
  if (assigneeQuery) {
    filters.value.keyword = assigneeQuery
    search()
  }
  const action = route.query.action
  const taskName = String(route.query.task || '')
  if ((action === 'schedule' || action === 'register') && taskName) {
    const match = tasks.value.find(
      (t) =>
        !t.excluded &&
        (t.requirementName === taskName ||
          t.screenName === taskName ||
          `${t.taskType}` === taskName ||
          t.requirementName?.includes(taskName) ||
          taskName.includes(t.requirementName || '')),
    )
    if (match) {
      scheduleTarget.value = match
      showScheduleModal.value = true
    }
  }
})

function resetFilters() {
  filters.value = {
    keyword: '',
    taskType: '전체',
    system: '',
    bizCategory: '',
    progressStatus: ['전체'],
    scheduleCompliance: '전체',
    progressBaseDate: wbsMeta.progressBaseDate,
    showExcluded: false,
  }
  appliedFilters.value = {
    ...filters.value,
    progressStatus: [...filters.value.progressStatus],
  }
}

function onSystemFilterChange() {
  filters.value.bizCategory = ''
}

function onSystemSelect(value) {
  filters.value.system = value
  onSystemFilterChange()
}

function search() {
  appliedFilters.value = {
    ...filters.value,
    progressStatus: [...filters.value.progressStatus],
  }
  statusFilterOpen.value = false
}

function removeFilterTag(key) {
  if (key === 'progressStatus') {
    filters.value.progressStatus = ['전체']
  } else if (key === 'system') {
    filters.value.system = ''
    filters.value.bizCategory = ''
  } else if (key === 'taskType') {
    filters.value.taskType = '전체'
  } else if (key === 'scheduleCompliance') {
    filters.value.scheduleCompliance = '전체'
  } else if (key === 'progressBaseDate') {
    filters.value.progressBaseDate = wbsMeta.progressBaseDate
  } else if (key === 'keyword') {
    filters.value.keyword = ''
  } else if (key === 'bizCategory') {
    filters.value.bizCategory = ''
  }
  search()
}

function toggleStatusFilter(option) {
  const cur = [...(filters.value.progressStatus || [])]
  if (option === '전체') {
    filters.value.progressStatus = ['전체']
    return
  }
  let next = cur.filter((v) => v !== '전체')
  if (next.includes(option)) next = next.filter((v) => v !== option)
  else next.push(option)
  filters.value.progressStatus = next.length ? next : ['전체']
}

function isStatusChecked(option) {
  const sel = filters.value.progressStatus || []
  if (option === '전체') return sel.includes('전체') || !sel.length
  return sel.includes(option)
}

function toggleSelect(id, disabled) {
  if (disabled) return
  const next = new Set(selectedIds.value)
  if (next.has(id)) next.delete(id)
  else next.add(id)
  selectedIds.value = next
}

function toggleSelectAll(checked) {
  if (checked) {
    selectedIds.value = new Set(
      filteredTasks.value.filter((t) => !t.excluded && isMine(t)).map((t) => t.id),
    )
  } else {
    selectedIds.value = new Set()
  }
}

function isAllSelected() {
  const selectable = filteredTasks.value.filter((t) => !t.excluded && isMine(t))
  return selectable.length > 0 && selectable.every((t) => selectedIds.value.has(t.id))
}

function isMine(row) {
  return row.assignee === authStore.displayName
}

function onAssigneeChange(row, assignee) {
  row.assignee = assignee
  row.assigneeDisplay = assignee
  row.changedAt = new Date().toISOString().slice(0, 19).replace('T', ' ')
  row.changedBy = '김현대'
}

function onTaskFieldChange(row) {
  row.changedAt = new Date().toISOString().slice(0, 19).replace('T', ' ')
  row.changedBy = '김현대'
}

function onScheduleClick(row) {
  if (row.excluded || row.status === '취소') return
  scheduleTarget.value = row
  showScheduleModal.value = true
}

function onScheduleSave(payload) {
  if (!scheduleTarget.value) return
  Object.assign(scheduleTarget.value, payload)
  if (payload.status === '완료' && payload.scheduleStatus === 'delay' && payload.scheduleReason) {
    scheduleTarget.value.scheduleReason = payload.scheduleReason
  }
  if (scheduleTarget.value.status === '진행중') {
    scheduleTarget.value.execProgress = calcExecProgress(scheduleTarget.value)
  }
  scheduleTarget.value.changedAt = new Date().toISOString().slice(0, 19).replace('T', ' ')
  scheduleTarget.value.changedBy = '김현대'
}

function onScheduleChangeRequest(payload) {
  const project = projectStore.currentProject
  const targetTasks = payload.tasks || []
  addScheduleChangeRequest({
    projectName: project?.name || project?.title || '현재 프로젝트',
    projectId: project?.id || '',
    openDate: project?.openDate || '-',
    tasks: targetTasks,
    planStart: payload.planStart || targetTasks[0]?.newPlanStart || targetTasks[0]?.planStart,
    planEnd: payload.planEnd || targetTasks[0]?.newPlanEnd || targetTasks[0]?.planEnd,
    reason: `[${payload.type || '일정변경'}] ${payload.reason || ''}`,
  })

  // 행별 변경 일정 반영 (승인요청 목업 — 목록에 즉시 반영)
  if (payload.type === '계획일 변경') {
    targetTasks.forEach((t) => {
      const live = tasks.value.find((x) => x.id === t.id)
      if (!live) return
      if (t.newPlanStart) live.planStart = t.newPlanStart
      if (t.newPlanEnd) live.planEnd = t.newPlanEnd
      if (live.status === '진행중') live.execProgress = calcExecProgress(live)
      live.changedAt = new Date().toISOString().slice(0, 19).replace('T', ' ')
      live.changedBy = '김현대'
    })
  } else if (payload.type === '실행 홀딩') {
    targetTasks.forEach((t) => {
      const live = tasks.value.find((x) => x.id === t.id)
      if (!live) return
      live.status = '홀딩'
      live.holdStart = t.holdStart
      live.holdEnd = t.holdEnd
      live.restartDate = t.restart?.start || ''
      live.correctedPlanEnd = t.restart?.end || ''
      live.changedAt = new Date().toISOString().slice(0, 19).replace('T', ' ')
      live.changedBy = '김현대'
    })
  }
}

function canRestart(row) {
  return row.status === '홀딩' && !!row.restartDate && wbsMockToday < row.restartDate
}

function onRestart(row) {
  restartTarget.value = row
  showRestartModal.value = true
}

function onRestartConfirm(row) {
  row.status = '진행중'
  if (row.correctedPlanEnd) row.planEnd = row.correctedPlanEnd
  row.execProgress = calcExecProgress(row)
  row.changedAt = new Date().toISOString().slice(0, 19).replace('T', ' ')
  row.changedBy = '김현대'
}

function onOpenMultiChangeFromSchedule(task) {
  if (!task) return
  bulkTargets.value = [task]
  showBulkScheduleModal.value = true
}

function onScheduleChange() {
  if (!selectedRows.value.length) {
    window.alert('일정변경할 업무를 선택하세요.')
    return
  }
  if (selectedRows.value.some((row) => row.status === '완료')) {
    window.alert('완료한 업무의 일정은 변경할 수 없습니다.')
    return
  }
  bulkTargets.value = [...selectedRows.value]
  showBulkScheduleModal.value = true
}

function onBulkScheduleRequest(payload) {
  onScheduleChangeRequest(payload)
  selectedIds.value = new Set()
  bulkTargets.value = []
}

function canOpenScheduleReason(row) {
  return row?.status === '완료' && row?.scheduleStatus === 'delay'
}

function onStatusClick(row) {
  if (!canOpenScheduleReason(row)) return
  reasonTarget.value = row
  showReasonModal.value = true
}

function onExclude() {
  if (!selectedRows.value.length) {
    window.alert('작업제외할 업무를 선택하세요.')
    return
  }
  const inProgress = selectedRows.value.filter((row) => row.planStart || row.assignee)
  if (inProgress.length) {
    const ok = window.confirm(
      `선택한 업무 중 ${inProgress.length}건은 이미 진행 중입니다. 작업제외 처리하시겠습니까?`,
    )
    if (!ok) return
  }
  selectedRows.value.forEach((row) => {
    row.excluded = true
    row.status = '취소'
  })
  selectedIds.value = new Set()
}

function onCopy() {
  if (!selectedRows.value.length) {
    window.alert('복사할 업무단위를 선택하세요.')
    return
  }
  showCopyAlert.value = true
}

function onExcelDownload() {
  mockExcelDownload('WBS 관리', filteredTasks.value, [
    { key: 'wbsId', label: 'WBS ID' },
    { key: 'systemPath', label: '시스템경로' },
    { key: 'taskName', label: '업무명' },
    { key: 'taskDetail', label: '업무상세' },
    { key: 'taskType', label: '업무유형' },
    { key: 'assigneeDisplay', label: '담당자' },
    { key: 'status', label: '상태' },
    { key: 'planStart', label: '계획시작' },
    { key: 'planEnd', label: '계획종료' },
    { key: 'execStart', label: '실행시작' },
    { key: 'execEnd', label: '실행종료' },
    { key: 'planProgress', label: '계획공정률(%)' },
    { key: 'execProgress', label: '실행공정률(%)' },
    { key: 'scheduleStatus', label: '일정상태' },
  ])
}

function confirmCopy() {
  const copies = selectedRows.value.map((row, i) => ({
    ...JSON.parse(JSON.stringify(row)),
    id: `w-copy-${Date.now()}-${i}`,
    wbsId: `WBS-${String(tasks.value.length + i + 1).padStart(3, '0')}`,
    assignee: '',
    assigneeDisplay: '선택',
    planStart: null,
    planEnd: null,
    execStart: null,
    execEnd: null,
    planProgress: 0,
    execProgress: 0,
    status: '대기',
    scheduleStatus: null,
    excluded: false,
    changedAt: null,
    changedBy: null,
  }))
  tasks.value.push(...copies)
  showCopyAlert.value = false
  selectedIds.value = new Set()
}

function onSave() {
  if (!window.confirm('변경사항을 저장하시겠습니까?')) return
  showSaveAlert.value = true
}

function onCalendarSelect(task) {
  onScheduleClick(task)
}
</script>

<template>
  <div class="wbs">
    <div class="wbs__head">
      <h1 class="wbs__title">
        WBS 관리
        <BaseTooltip :text="wbsMeta.hint" />
      </h1>
      <div class="view-toggle">
        <span class="wbs__progress">
          총 공정률
          <span class="progress-bar">
            <span class="progress-bar__fill" :style="{ width: `${totalProgress}%` }">{{ totalProgress }}%</span>
          </span>
        </span>
        <button
          type="button"
          class="view-toggle__btn"
          :class="{ 'view-toggle__btn--on': viewMode === 'list' }"
          @click="viewMode = 'list'"
        >
          목록형
        </button>
        <button
          type="button"
          class="view-toggle__btn"
          :class="{ 'view-toggle__btn--on': viewMode === 'calendar' }"
          @click="viewMode = 'calendar'"
        >
          캘린더형
        </button>
      </div>
    </div>

    <!-- 검색 -->
    <SearchFilterBar
      v-if="viewMode === 'list'"
      v-model:expanded="filterExpanded"
      v-model:search="filters.keyword"
      search-placeholder="업무명"
      :applied-tags="filterTags"
      @reset="resetFilters"
      @search="search"
      @remove-tag="removeFilterTag"
    >
      <template #primary>
        <FilterSelectPill v-model="filters.taskType" label="업무유형" :options="taskTypeOptions" />
        <FilterSelectPill
          :model-value="filters.system"
          label="시스템"
          :options="systemPillOptions"
          empty-label="시스템 선택"
          @update:model-value="onSystemSelect"
        />
        <div class="status-filter" @keydown.escape="statusFilterOpen = false">
          <button
            type="button"
            class="status-filter__trigger"
            @click="statusFilterOpen = !statusFilterOpen"
          >
            <span class="status-filter__label">진행상태</span>
            <span class="status-filter__sep">|</span>
            <span class="status-filter__value">{{ statusFilterLabel }}</span>
          </button>
          <div v-if="statusFilterOpen" class="status-filter__panel">
            <label
              v-for="o in progressStatusOptions"
              :key="o"
              class="status-filter__item"
            >
              <input
                type="checkbox"
                :checked="isStatusChecked(o)"
                @change="toggleStatusFilter(o)"
              />
              {{ o }}
            </label>
          </div>
        </div>
        <FilterSelectPill
          v-model="filters.scheduleCompliance"
          label="계획준수"
          :options="scheduleComplianceOptions"
        />
      </template>
      <template #expand>
        <FilterSelectPill
          v-model="filters.bizCategory"
          label="업무구분"
          :options="bizCategoryPillOptions"
          empty-label="업무구분 선택"
          :disabled="!filters.system"
        />
        <FilterTextPill
          v-model="filters.progressBaseDate"
          label="공정률 기준날짜"
          type="date"
        />
      </template>
    </SearchFilterBar>

    <!-- 툴바 (SB 112): 좌측 건수·작업제외 / 우측 엑셀·액션 -->
    <div v-if="viewMode === 'list'" class="toolbar">
      <span class="toolbar__count">총 <b>{{ filteredTasks.length }}</b>건</span>
      <button type="button" class="btn btn--ghost btn--sm" @click="onExclude">작업제외</button>
      <div class="toolbar__spacer" />
      <button
        type="button"
        class="toolbar__toggle"
        :class="{ 'toolbar__toggle--on': myTasksOnly }"
        @click="myTasksOnly = !myTasksOnly"
      >
        내 업무만
      </button>
      <button type="button" class="btn btn--ghost btn--sm" :disabled="!canManageSchedule" @click="onScheduleChange">일정변경</button>
      <button type="button" class="btn btn--ghost btn--sm" @click="onCopy">복사</button>
      <button type="button" class="btn btn--primary btn--sm" @click="onSave">저장</button>
      <ExcelDownloadButton @click="onExcelDownload" />
    </div>

    <!-- 목록형 -->
    <div v-if="viewMode === 'list'" class="listcard">
      <div class="listcard__scroll">
        <table class="wbs-table">
          <thead>
            <tr>
              <th class="col-check">
                <input type="checkbox" :checked="isAllSelected()" @change="toggleSelectAll($event.target.checked)" />
              </th>
              <th>시스템/업무구분</th>
              <th>업무명</th>
              <th>업무상세</th>
              <th>업무유형</th>
              <th>담당자</th>
              <th>난이도</th>
              <th>계획일정</th>
              <th>실행일정</th>
              <th>계획공정률</th>
              <th>실행공정률</th>
              <th>상태</th>
            </tr>
          </thead>
          <tbody>
            <tr
              v-for="row in filteredTasks"
              :key="row.id"
              class="wbs-row"
              :class="{ 'wbs-row--excluded': row.excluded }"
            >
              <td class="col-check">
                <input
                  type="checkbox"
                  :checked="selectedIds.has(row.id)"
                  :disabled="row.excluded || !isMine(row)"
                  @change="toggleSelect(row.id, row.excluded || !isMine(row))"
                />
              </td>
              <td class="system-path">
                <span>{{ row.systemPath.split('>')[0] }}</span>
                <span class="system-path__biz">{{ row.systemPath.split('>').slice(1).join('>') }}</span>
              </td>
              <td>
                <input
                  v-model="row.taskName"
                  class="task-name-input"
                  type="text"
                  maxlength="100"
                  @change="onTaskFieldChange(row)"
                />
              </td>
              <td>
                <textarea
                  v-model="row.taskDetail"
                  class="task-detail-input"
                  rows="1"
                  maxlength="1000"
                  @change="onTaskFieldChange(row)"
                />
              </td>
              <td>
                <select
                  v-if="['개발', '디자인', '퍼블리싱'].includes(row.taskType)"
                  v-model="row.taskType"
                  class="task-type-select"
                >
                  <option value="개발">개발</option>
                  <option value="디자인">디자인</option>
                  <option value="퍼블리싱">퍼블리싱</option>
                </select>
                <span v-else>{{ row.taskType }}</span>
              </td>
              <td>
                <select
                  v-if="!row.excluded && row.status !== '취소' && row.taskType !== '테스트'"
                  :value="row.assignee"
                  class="assignee-select"
                  @change="onAssigneeChange(row, $event.target.value)"
                >
                  <option value="">선택</option>
                  <option
                    v-for="a in assigneeOptions[row.taskType] || []"
                    :key="a"
                    :value="a"
                  >
                    {{ a }}
                  </option>
                </select>
                <span v-else class="assignee-text">{{ row.assigneeDisplay }}</span>
              </td>
              <td>{{ row.difficulty }}</td>
              <td>
                <button
                  type="button"
                  class="schedule-link"
                  :disabled="row.excluded"
                  @click="onScheduleClick(row)"
                >
                  {{ formatDateRange(row.planStart, row.planEnd) }}
                </button>
              </td>
              <td>{{ formatDateRange(row.execStart, row.execEnd, '미실행') }}</td>
              <td>
                <div class="prog-bar prog-bar--labeled">
                  <i :style="{ width: `${row.planProgress}%` }" />
                  <span>{{ row.planProgress }}%</span>
                </div>
              </td>
              <td>
                <div class="prog-bar prog-bar--labeled">
                  <i :style="{ width: `${row.execProgress}%` }" />
                  <span>{{ row.execProgress }}%</span>
                </div>
              </td>
              <td>
                <!-- SB 114: 완료(경과)일 때만 '경과' 클릭 → POP-S-WBS-03 -->
                <span v-if="canOpenScheduleReason(row)" class="st st--delay">
                  완료(<button type="button" class="st__reason" @click="onStatusClick(row)">경과</button>)
                </span>
                <span v-else class="st" :class="`st--${statusClass(row)}`">
                  {{ statusLabel(row) }}
                </span>
                <button
                  v-if="canRestart(row)"
                  type="button"
                  class="btn btn--ghost btn--sm restart-btn"
                  @click="onRestart(row)"
                >
                  재착수
                </button>
              </td>
            </tr>
            <tr v-if="!filteredTasks.length">
              <td colspan="12" class="empty-row">
                {{ tasks.length ? '조회 결과가 없습니다.' : '등록된 WBS 업무가 없습니다.' }}
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <!-- 캘린더형 -->
    <WbsCalendar
      v-else
      v-model:year="calYear"
      v-model:month="calMonth"
      :tasks="filteredTasks"
      @select="onCalendarSelect"
    />

    <WbsScheduleModal
      v-model="showScheduleModal"
      :task="scheduleTarget"
      @save="onScheduleSave"
      @open-multi-change="onOpenMultiChangeFromSchedule"
    />
    <WbsScheduleReasonModal v-model="showReasonModal" :task="reasonTarget" />
    <WbsRestartModal v-model="showRestartModal" :task="restartTarget" @confirm="onRestartConfirm" />
    <WbsBulkScheduleModal
      v-model="showBulkScheduleModal"
      :tasks="bulkTargets"
      @request="onBulkScheduleRequest"
    />

    <Teleport to="body">
      <div v-if="showCopyAlert" class="alert-scrim" @mousedown.self="showCopyAlert = false">
        <div class="alert-box">
          <p>선택한 업무단위를 복사하시겠습니까?<br />시스템~업무유형만 복사되며 담당자는 '선택', 계획일정 미등록, 상태 대기로 생성됩니다.</p>
          <div class="alert-box__actions">
            <button type="button" class="btn btn--ghost" @click="showCopyAlert = false">취소</button>
            <button type="button" class="btn btn--primary" @click="confirmCopy">확인</button>
          </div>
        </div>
      </div>

      <div v-if="showSaveAlert" class="alert-scrim" @mousedown.self="showSaveAlert = false">
        <div class="alert-box">
          <p>변경사항이 저장되었습니다.</p>
          <button type="button" class="btn btn--primary" @click="showSaveAlert = false">확인</button>
        </div>
      </div>
    </Teleport>
  </div>
</template>

<style scoped>
.wbs {
  padding: 14px 18px 28px;
  font-size: calc(13px + var(--font-size-offset, 0px));
  color: var(--ink);
}

.wbs__head {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 12px;
  margin-bottom: 12px;
  flex-wrap: wrap;
}

.wbs__title {
  font-size: calc(16px + var(--font-size-offset, 0px));
  font-weight: 700;
  margin: 0;
  display: flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
}

.view-toggle {
  display: flex;
  align-items: center;
  gap: 8px;
}

.view-toggle__btn {
  height: 28px;
  padding: 0 12px;
  border: 1px solid var(--line);
  border-radius: 7px;
  background: var(--lnb-side);
  font-size: calc(12px + var(--font-size-offset, 0px));
  cursor: pointer;
  font-family: inherit;
  color: var(--ink-2);
}

.view-toggle__btn--on {
  background: var(--teal-50);
  border-color: var(--teal-100);
  color: var(--teal-600);
  font-weight: 700;
}

.wbs__progress {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  margin-right: 4px;
  padding: 4px 12px 4px 14px;
  background: var(--teal-50);
  border-radius: 999px;
  font-size: calc(12px + var(--font-size-offset, 0px));
  color: var(--ink-2);
  white-space: nowrap;
}

.progress-bar {
  display: inline-block;
  position: relative;
  width: 160px;
  height: 30px;
  flex-shrink: 0;
  border: 1px solid var(--ink-2);
  border-radius: 10px;
  background: var(--lnb-side);
  overflow: hidden;
}

.progress-bar__fill {
  display: flex;
  align-items: center;
  justify-content: center;
  height: 100%;
  min-width: 28px;
  background: linear-gradient(180deg, var(--muted), var(--ink-2));
  border-right: 1px solid var(--ink-2);
  color: var(--color-text-inverse, #fff);
  font-size: calc(13px + var(--font-size-offset, 0px));
  font-weight: 700;
  white-space: nowrap;
}

.card {
  background: var(--lnb-side);
  border: 1px solid var(--line);
  border-radius: 10px;
}

.toolbar {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 10px;
  flex-wrap: wrap;
}

.toolbar__toggle {
  height: 28px;
  padding: 0 12px;
  border: 1px solid var(--line);
  border-radius: 7px;
  background: var(--lnb-side);
  font-size: calc(12px + var(--font-size-offset, 0px));
  cursor: pointer;
  font-family: inherit;
  color: var(--muted);
}

.toolbar__toggle--on {
  background: var(--teal-50);
  border-color: var(--teal-100);
  color: var(--teal-600);
  font-weight: 700;
}

.toolbar__count {
  font-size: calc(12px + var(--font-size-offset, 0px));
  color: var(--ink-2);
}

.toolbar__count b {
  color: var(--teal-600);
}

.status-filter {
  position: relative;
}

.status-filter__trigger {
  position: relative;
  display: inline-flex;
  align-items: center;
  gap: 6px;
  height: 40px;
  padding: 0 30px 0 14px;
  border: 1px solid var(--sfb-line);
  border-radius: var(--r-pill);
  font-family: inherit;
  font-size: calc(13px + var(--font-size-offset, 0px));
  background: var(--lnb-side);
  text-align: left;
  cursor: pointer;
  color: var(--lnb-logo);
  white-space: nowrap;
}

.status-filter__trigger::after {
  content: '';
  position: absolute;
  right: 12px;
  top: 50%;
  width: 9px;
  height: 6px;
  transform: translateY(-50%);
  background-color: var(--sfb-label);
  -webkit-mask: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='10' height='6'%3E%3Cpath d='M1 1l4 4 4-4' stroke='black' stroke-width='1.6' fill='none'/%3E%3C/svg%3E") no-repeat center / 9px 6px;
  mask: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='10' height='6'%3E%3Cpath d='M1 1l4 4 4-4' stroke='black' stroke-width='1.6' fill='none'/%3E%3C/svg%3E") no-repeat center / 9px 6px;
}

.status-filter__label {
  color: var(--lnb-muted);
  font-weight: 600;
}

.status-filter__sep {
  color: var(--sfb-line);
}

.status-filter__value {
  font-weight: 600;
  color: var(--lnb-logo);
}

.status-filter__panel {
  position: absolute;
  top: calc(100% + 4px);
  left: 0;
  z-index: 30;
  min-width: 140px;
  padding: 6px 0;
  border: 1px solid var(--line);
  border-radius: 8px;
  background: var(--lnb-side);
  box-shadow: var(--shadow-sm, 0 4px 12px rgba(0, 0, 0, 0.08));
}

.status-filter__item {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 6px 12px;
  font-size: calc(12px + var(--font-size-offset, 0px));
  cursor: pointer;
  color: var(--ink-2);
}

.status-filter__item:hover {
  background: var(--teal-50);
}

.toolbar__check {
  display: flex;
  align-items: center;
  gap: 5px;
  font-size: calc(12px + var(--font-size-offset, 0px));
  color: var(--ink-2);
  cursor: pointer;
}

.toolbar__spacer {
  flex: 1;
}

.listcard {
  background: var(--lnb-side);
  border: 1px solid var(--line);
  border-radius: 10px;
  overflow: hidden;
}

.listcard__scroll {
  overflow-x: auto;
}

.wbs-table {
  width: 100%;
  border-collapse: collapse;
  font-size: calc(12px + var(--font-size-offset, 0px));
  min-width: 1400px;
}

.wbs-table thead th {
  background: var(--lnb-hover);
  color: var(--ink);
  font-weight: 600;
  text-align: center;
  padding: 9px 10px;
  border-bottom: 1px solid var(--line);
  white-space: nowrap;
}

.wbs-table tbody td {
  padding: 9px 10px;
  border-bottom: 1px solid var(--line-2);
  color: var(--ink-2);
  vertical-align: middle;
}

.col-check {
  width: 36px;
  text-align: center;
}

.wbs-row:hover {
  background: var(--teal-50);
}

.wbs-row--excluded {
  opacity: 0.5;
  background: var(--gray-bg);
}

.wbs-row--excluded:hover {
  background: var(--gray-bg);
}

.task-name-input {
  width: 100%;
  min-width: 140px;
  height: 26px;
  padding: 0 8px;
  border: 1px solid var(--line);
  border-radius: 6px;
  font-family: inherit;
  font-size: calc(12px + var(--font-size-offset, 0px));
  background: var(--field);
  color: var(--ink);
}

.task-detail-input {
  width: 100%;
  min-width: 160px;
  height: 26px;
  padding: 4px 8px;
  border: 1px solid var(--line);
  border-radius: 6px;
  font-family: inherit;
  font-size: calc(12px + var(--font-size-offset, 0px));
  background: var(--field);
  color: var(--ink);
  resize: vertical;
}

.task-detail-input:focus {
  height: 64px;
}

.assignee-select {
  height: 24px;
  padding: 0 6px;
  border: 1px solid var(--line);
  border-radius: 6px;
  font-size: calc(11.5px + var(--font-size-offset, 0px));
  font-family: inherit;
  background: var(--lnb-side);
  min-width: 72px;
}

.assignee-text {
  font-size: calc(11.5px + var(--font-size-offset, 0px));
}

.schedule-link {
  border: none;
  background: none;
  color: var(--teal-600);
  text-decoration: underline;
  cursor: pointer;
  font-family: inherit;
  font-size: calc(12px + var(--font-size-offset, 0px));
  padding: 0;
}

.schedule-link:disabled {
  color: var(--muted);
  cursor: not-allowed;
  text-decoration: none;
}

.prog-bar {
  position: relative;
  min-width: 80px;
  height: 16px;
  background: var(--line-2);
  border-radius: 8px;
  overflow: hidden;
}

.prog-bar i {
  display: block;
  height: 100%;
  background: var(--teal);
}

.prog-bar--labeled span {
  position: absolute;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: calc(10px + var(--font-size-offset, 0px));
  font-weight: 700;
  color: var(--ink);
}

.system-path {
  display: flex;
  flex-direction: column;
  gap: 2px;
  line-height: 1.3;
}

.system-path__biz {
  font-size: calc(11px + var(--font-size-offset, 0px));
  color: var(--muted);
}

.task-type-select {
  height: 28px;
  padding: 0 6px;
  border: 1px solid var(--line);
  border-radius: 6px;
  font-family: inherit;
  font-size: calc(11.5px + var(--font-size-offset, 0px));
  background: var(--field);
}

.st {
  display: inline-flex;
  align-items: center;
  font-size: calc(11px + var(--font-size-offset, 0px));
  font-weight: 700;
  padding: 3px 8px;
  border-radius: 20px;
  border: none;
  font-family: inherit;
  white-space: nowrap;
}

.st--recv {
  color: var(--gray);
  background: var(--gray-bg);
}

.st--prog {
  color: var(--blue);
  background: var(--blue-bg);
}

.st--done {
  color: var(--green);
  background: var(--green-bg);
}

.st--delay {
  color: var(--orange);
  background: var(--orange-bg);
}

.st--cancel {
  color: var(--red);
  background: var(--red-bg);
}

.st--hold {
  color: var(--purple);
  background: var(--purple-bg);
}

.restart-btn {
  margin-left: 6px;
  height: 22px;
  padding: 0 8px;
  font-size: calc(10.5px + var(--font-size-offset, 0px));
}

.st__reason {
  margin: 0;
  padding: 0;
  border: none;
  background: none;
  font: inherit;
  font-weight: 700;
  color: inherit;
  text-decoration: underline;
  text-underline-offset: 2px;
  cursor: pointer;
}

.st__reason:hover {
  opacity: 0.8;
}

.muted {
  color: var(--muted);
  font-size: calc(11px + var(--font-size-offset, 0px));
  white-space: nowrap;
}

.empty-row {
  text-align: center;
  padding: 32px !important;
  color: var(--muted);
}

.calendar {
  padding: 16px;
}

.calendar__nav {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 12px;
}

.calendar__title {
  font-weight: 700;
  font-size: calc(14px + var(--font-size-offset, 0px));
  min-width: 120px;
  text-align: center;
}

.cal-nav-btn,
.cal-today-btn {
  height: 28px;
  padding: 0 10px;
  border: 1px solid var(--line);
  border-radius: 6px;
  background: var(--lnb-side);
  cursor: pointer;
  font-family: inherit;
  font-size: calc(12px + var(--font-size-offset, 0px));
}

.cal-today-btn {
  margin-left: auto;
  color: var(--teal-600);
}

.calendar__weekdays {
  display: grid;
  grid-template-columns: repeat(7, 1fr);
  gap: 4px;
  margin-bottom: 4px;
  text-align: center;
  font-size: calc(11px + var(--font-size-offset, 0px));
  color: var(--muted);
  font-weight: 600;
}

.calendar__grid {
  display: grid;
  grid-template-columns: repeat(7, 1fr);
  gap: 4px;
}

.calendar__cell {
  min-height: 88px;
  border: 1px solid var(--line-2);
  border-radius: 6px;
  padding: 4px;
  background: var(--lnb-hover);
}

.calendar__cell--empty {
  background: transparent;
  border-color: transparent;
}

.calendar__day {
  font-size: calc(11px + var(--font-size-offset, 0px));
  font-weight: 600;
  color: var(--ink-2);
}

.calendar__blocks {
  margin-top: 4px;
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.cal-block {
  font-size: calc(9px + var(--font-size-offset, 0px));
  color: var(--color-text-inverse);
  padding: 2px 4px;
  border-radius: 3px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.calendar__hint {
  margin: 12px 0 0;
  font-size: calc(11px + var(--font-size-offset, 0px));
  color: var(--muted);
}

.btn {
  height: 32px;
  padding: 0 14px;
  border-radius: 7px;
  font-size: calc(12.5px + var(--font-size-offset, 0px));
  font-weight: 600;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  font-family: inherit;
  cursor: pointer;
  border: 1px solid transparent;
}

.btn--sm {
  height: 28px;
  padding: 0 10px;
  font-size: calc(12px + var(--font-size-offset, 0px));
}

.btn--primary {
  background: var(--teal);
  color: var(--color-text-inverse);
}

.btn--primary:hover {
  background: var(--teal-600);
}

.btn--ghost {
  background: var(--lnb-side);
  border-color: var(--line);
  color: var(--ink-2);
}

.btn--ghost:hover {
  border-color: var(--teal-100);
  color: var(--teal-600);
}

.alert-scrim {
  position: fixed;
  inset: 0;
  background: rgba(18, 30, 34, 0.34);
  z-index: 1300;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 16px;
}

.alert-box {
  width: 340px;
  background: var(--lnb-side);
  border-radius: 14px;
  padding: 24px 22px 18px;
  text-align: center;
  box-shadow: 0 6px 24px rgba(20, 40, 50, 0.12);
}

.alert-box p {
  margin: 0 0 18px;
  font-size: calc(13.5px + var(--font-size-offset, 0px));
  line-height: 1.6;
}

.alert-box__actions {
  display: flex;
  gap: 8px;
}

.alert-box__actions .btn {
  flex: 1;
}

</style>
