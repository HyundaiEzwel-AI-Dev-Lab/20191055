<script setup>
// PAG-S-REQ-01 요구사항 관리
import { computed, onMounted, ref } from 'vue'
import {
  requirementMeta,
  taskTypeOptions,
  statusOptions,
  priorityOptions,
  confirmOptions,
  periodOptions,
  pageSizeOptions,
  systemOptions,
  bizCategoryMap,
  getRequirementList,
  statusClass,
  priorityClass,
  confirmClass,
  matchFilters,
} from '@/data/requirement'
import RequirementIssueModal from '@/components/requirement/RequirementIssueModal.vue'
import RequirementFormModal from '@/components/requirement/RequirementFormModal.vue'
import RequirementBulkRegisterModal from '@/components/requirement/RequirementBulkRegisterModal.vue'
import RequirementScreenSearchModal from '@/components/requirement/RequirementScreenSearchModal.vue'
import ExcelDownloadButton from '@/components/ui/ExcelDownloadButton.vue'
import { mockExcelDownload } from '@/utils/excelDownload'

const requirements = ref([])
const filterExpanded = ref(false)
const filters = ref({
  keyword: '',
  taskType: '전체',
  system: '',
  bizCategory: '',
  status: '전체',
  priority: '전체',
  confirm: '전체',
  periodType: '등록일',
  dateFrom: '2026-01-01',
  dateTo: '2026-01-31',
})

const appliedFilters = ref({ ...filters.value })
const pageSize = ref(20)
const currentPage = ref(1)
const expandedIds = ref(new Set())
const expandAll = ref(false)
const selectedIds = ref(new Set())
const showRegisterMenu = ref(false)

const showIssueModal = ref(false)
const issueTarget = ref(null)
const showFormModal = ref(false)
const formMode = ref('register')
const formTarget = ref(null)
const showBulkModal = ref(false)

const showSaveAlert = ref(null)
const saveAlertCount = ref(0)
const confirmTipOpen = ref(false)
const showScreenSearchModal = ref(false)
const screenSettingSystem = ref('')

const bizCategoryFilterOptions = computed(() => bizCategoryMap[filters.value.system] || [])

const confirmSelectOptions = ['미확정', '확정']
const confirmTooltip =
  '요청자와 테크담당 모두 확정 시 WBS 업무가 생성됩니다.\n- 확정 : 요구사항 확인 완료 (확정 후 변경 불가)\n- 미확정 : 요구사항 확인 전 상태 (초기 등록 상태)'

const filteredList = computed(() =>
  requirements.value.filter((row) => matchFilters(row, appliedFilters.value)),
)

const pagedList = computed(() => {
  const start = (currentPage.value - 1) * pageSize.value
  return filteredList.value.slice(start, start + pageSize.value)
})

const totalPages = computed(() =>
  Math.max(1, Math.ceil(filteredList.value.length / pageSize.value)),
)

const allExpandedOnPage = computed(
  () =>
    pagedList.value.length > 0 &&
    pagedList.value.every((row) => expandedIds.value.has(row.id)),
)

const selectedRows = computed(() =>
  requirements.value.filter((r) => selectedIds.value.has(r.id)),
)

const canExpandAll = computed(() => pageSize.value === 20)

onMounted(() => {
  requirements.value = getRequirementList()
})

function resetFilters() {
  filters.value = {
    keyword: '',
    taskType: '전체',
    system: '',
    bizCategory: '',
    status: '전체',
    priority: '전체',
    confirm: '전체',
    periodType: '등록일',
    dateFrom: '2026-01-01',
    dateTo: '2026-01-31',
  }
  appliedFilters.value = { ...filters.value }
  currentPage.value = 1
}

function search() {
  appliedFilters.value = { ...filters.value }
  currentPage.value = 1
  expandedIds.value = new Set()
  expandAll.value = false
}

function onSystemFilterChange() {
  filters.value.bizCategory = ''
}

function toggleExpand(id) {
  const next = new Set(expandedIds.value)
  if (next.has(id)) next.delete(id)
  else {
    next.clear()
    next.add(id)
  }
  expandedIds.value = next
}

function toggleExpandAll() {
  if (!canExpandAll.value) return
  if (allExpandedOnPage.value) {
    expandedIds.value = new Set()
    expandAll.value = false
  } else {
    expandedIds.value = new Set(pagedList.value.map((r) => r.id))
    expandAll.value = true
  }
}

function toggleSelect(id) {
  const next = new Set(selectedIds.value)
  if (next.has(id)) next.delete(id)
  else next.add(id)
  selectedIds.value = next
}

function toggleSelectAll(checked) {
  if (checked) {
    selectedIds.value = new Set(pagedList.value.map((r) => r.id))
  } else {
    selectedIds.value = new Set()
  }
}

function isAllSelected() {
  return (
    pagedList.value.length > 0 &&
    pagedList.value.every((r) => selectedIds.value.has(r.id))
  )
}

function isConfirmLocked(row) {
  if (row.status === '반려') return true
  if (row.confirmLocked) return true
  // 접수 상태에서는 확정 전환 불가 (SB 94)
  if (row.status === '접수') return true
  return false
}

function onConfirmChange(row, field, value) {
  if (isConfirmLocked(row)) return
  row[field] = value
  if (value === '확정') {
    const atField = field === 'confirmRequester' ? 'confirmRequesterAt' : 'confirmTechAt'
    row[atField] = new Date().toISOString().slice(0, 19).replace('T', ' ')
  }
}

function onIssueClick(row) {
  issueTarget.value = row
  showIssueModal.value = true
}

function openRegister() {
  showRegisterMenu.value = false
  formMode.value = 'register'
  formTarget.value = null
  showFormModal.value = true
}

function openBulkRegister() {
  showRegisterMenu.value = false
  showBulkModal.value = true
}

function onBulkRegister(items) {
  const now = new Date().toISOString().slice(0, 19).replace('T', ' ')
  items.forEach((form, idx) => {
    const nextNo = requirements.value.length + 1 + idx
    requirements.value.unshift({
      id: `req-bulk-${Date.now()}-${idx}`,
      reqId: `REQ-${String(nextNo).padStart(3, '0')}`,
      systemPath: `${form.system}>${form.bizCategory}`,
      screenPath: form.screenMenu || '-',
      screenName: form.screenMenu || '-',
      reqType: form.reqType.startsWith('추가') ? '추가' : '최초',
      name: form.name,
      taskTypes: [...form.taskTypes],
      status: form.status || '접수',
      priority: form.priority || '보통',
      confirmRequester: '미확정',
      confirmTech: '미확정',
      issueCount: 0,
      registeredBy: '김현대',
      registeredAt: now,
      updatedBy: null,
      updatedAt: null,
      requester: '김현대',
      original: form.original,
      analysis: '',
      system: form.system,
      bizCategory: form.bizCategory,
      screenMenu: form.screenMenu || '',
      memo: '',
      issues: [],
    })
  })
  currentPage.value = 1
}

function openEdit(row) {
  formMode.value = 'edit'
  formTarget.value = row
  showFormModal.value = true
}

function findDuplicateRequirement(form) {
  const screenKey = form.screenMenu || form.screenName || ''
  return requirements.value.find(
    (r) =>
      r.system === form.system &&
      r.bizCategory === form.bizCategory &&
      (r.screenMenu || r.screenName || '') === screenKey &&
      r.status !== '반려',
  )
}

function buildRequirementRow(form, seqOffset) {
  const nextNo = requirements.value.length + 1 + seqOffset
  return {
    id: `req-new-${Date.now()}-${seqOffset}`,
    reqId: `REQ-${String(nextNo).padStart(3, '0')}`,
    systemPath: `${form.system}>${form.bizCategory}`,
    screenPath: form.screenPath || form.screenMenu || '-',
    screenName: form.screenName || form.screenMenu || '-',
    reqType: form.reqType.startsWith('추가') ? '추가' : '최초',
    name: form.name,
    taskTypes: [...form.taskTypes],
    status: form.status,
    priority: form.priority,
    confirmRequester: form.confirmRequester ? '확정' : '미확정',
    confirmTech: form.confirmTech ? '확정' : '미확정',
    issueCount: 0,
    registeredBy: '김현대',
    registeredAt: new Date().toISOString().slice(0, 19).replace('T', ' '),
    updatedBy: null,
    updatedAt: null,
    requester: '김현대',
    original: form.original,
    analysis: form.analysis,
    system: form.system,
    bizCategory: form.bizCategory,
    screenMenu: form.screenMenu || form.screenName || '',
    memo: form.memo,
    attachments: [...(form.attachments || [])],
    issues: [],
  }
}

function onFormSave(payload) {
  if (formMode.value === 'register' || formMode.value === 'copy') {
    const forms = Array.isArray(payload) ? payload : [payload]
    if (formMode.value === 'copy') {
      const dup = findDuplicateRequirement(forms[0])
      if (dup) {
        const newTaskTypes = forms[0].taskTypes.filter((t) => !dup.taskTypes.includes(t))
        if (!newTaskTypes.length) {
          window.alert(`동일한 시스템, 업무유형, 화면명으로 이미 등록된 요구사항입니다(ID : ${dup.reqId})`)
          return
        }
        window.alert(`동일 시스템의 기존 요구사항(ID ${dup.reqId})에 업무유형을 추가합니다.`)
        dup.taskTypes.push(...newTaskTypes)
        showFormModal.value = false
        return
      }
    }
    forms.forEach((form, idx) => {
      requirements.value.unshift(buildRequirementRow(form, idx))
    })
  } else if (formTarget.value) {
    const form = payload
    if (form.screenOnly) {
      Object.assign(formTarget.value, {
        screenPath: form.screenPath || form.screenMenu || formTarget.value.screenPath,
        screenName: form.screenName || form.screenMenu || formTarget.value.screenName,
        screenMenu: form.screenMenu || form.screenName || '',
        updatedBy: '김현대',
        updatedAt: new Date().toISOString().slice(0, 19).replace('T', ' '),
      })
    } else {
      const bothOn = !!form.confirmRequester && !!form.confirmTech
      const now = new Date().toISOString().slice(0, 19).replace('T', ' ')
      if (form.confirmRequester && formTarget.value.confirmRequester !== '확정') {
        formTarget.value.confirmRequesterAt = now
      }
      if (form.confirmTech && formTarget.value.confirmTech !== '확정') {
        formTarget.value.confirmTechAt = now
      }
      if (!formTarget.value.changeHistory) formTarget.value.changeHistory = []
      formTarget.value.changeHistory.push({
        id: `ch-${Date.now()}`,
        round: formTarget.value.changeHistory.length + 1,
        reason: form.changeReason || '',
        changedBy: '김현대',
        changedAt: now,
        before: {
          name: formTarget.value.name,
          analysis: formTarget.value.analysis,
          status: formTarget.value.status,
          priority: formTarget.value.priority,
          taskTypes: [...formTarget.value.taskTypes],
          memo: formTarget.value.memo,
        },
        after: {
          name: form.name,
          analysis: form.analysis,
          status: form.status,
          priority: form.priority,
          taskTypes: [...form.taskTypes],
          memo: form.memo,
        },
      })
      Object.assign(formTarget.value, {
        name: form.name,
        analysis: form.analysis,
        status: form.status,
        priority: form.priority,
        taskTypes: [...form.taskTypes],
        confirmRequester: form.confirmRequester ? '확정' : '미확정',
        confirmTech: form.confirmTech ? '확정' : '미확정',
        confirmLocked: bothOn || formTarget.value.confirmLocked,
        memo: form.memo,
        attachments: [...(form.attachments || [])],
        system: form.system,
        bizCategory: form.bizCategory,
        systemPath: `${form.system}>${form.bizCategory}`,
        screenPath: form.screenPath || form.screenMenu || formTarget.value.screenPath,
        screenName: form.screenName || form.screenMenu || formTarget.value.screenName,
        screenMenu: form.screenMenu || form.screenName || '',
        updatedBy: '김현대',
        updatedAt: now,
      })
    }
  }
  window.alert('저장되었습니다.')
  showFormModal.value = false
}

function onSaveConfirm() {
  if (!selectedRows.value.length) {
    showSaveAlert.value = 'none'
    return
  }
  const hasUnconfirmed = selectedRows.value.some(
    (r) => r.confirmRequester !== '확정' || r.confirmTech !== '확정',
  )
  if (hasUnconfirmed) {
    showSaveAlert.value = 'unconfirmed'
    return
  }
  selectedRows.value.forEach((r) => {
    r.confirmLocked = true
  })
  saveAlertCount.value = selectedRows.value.length
  showSaveAlert.value = 'done'
  selectedIds.value = new Set()
}

function onCopy() {
  if (!selectedRows.value.length) {
    window.alert('복사할 요구사항을 선택하세요.')
    return
  }
  if (selectedRows.value.length > 1) {
    window.alert('요구사항 복사는 1건만 선택해 주세요.')
    return
  }
  formMode.value = 'copy'
  formTarget.value = selectedRows.value[0]
  showFormModal.value = true
}

function onScreenSetting() {
  if (!selectedRows.value.length) {
    window.alert('화면경로를 설정할 요구사항을 선택하세요.')
    return
  }
  const keys = new Set(
    selectedRows.value.map((r) => `${r.system}|${r.bizCategory}`),
  )
  if (keys.size > 1) {
    window.alert('서로 다른 시스템/업무구분이 선택되어 있습니다. 동일한 시스템/업무구분만 선택해 주세요.')
    return
  }
  screenSettingSystem.value = selectedRows.value[0].system
  showScreenSearchModal.value = true
}

function onScreenSelect(picked) {
  const now = new Date().toISOString().slice(0, 19).replace('T', ' ')
  selectedRows.value.forEach((row) => {
    row.screenPath = picked.path
    row.screenName = picked.name
    row.screenMenu = picked.name
    row.updatedBy = '김현대'
    row.updatedAt = now
  })
  window.alert(`선택한 ${selectedRows.value.length}건의 화면경로가 설정되었습니다.`)
  selectedIds.value = new Set()
}

function onExcelDownload() {
  mockExcelDownload('요구사항 관리', filteredList.value, [
    { key: 'reqId', label: '요구사항ID' },
    { key: 'systemPath', label: '시스템/업무' },
    { key: 'screenPath', label: '화면경로' },
    { key: 'screenName', label: '화면명' },
    { key: 'name', label: '요구사항명' },
    { key: 'reqType', label: '요건유형' },
    { key: 'status', label: '상태' },
    { key: 'priority', label: '우선순위' },
    { key: 'confirmRequester', label: '요청자확정' },
    { key: 'confirmTech', label: '테크확정' },
    { key: 'issueCount', label: '이슈수' },
    { key: 'registeredBy', label: '등록자' },
    { key: 'registeredAt', label: '등록일시' },
  ])
}

function onPageSizeChange() {
  currentPage.value = 1
  expandedIds.value = new Set()
}
</script>

<template>
  <div class="requirement">
    <h1 class="requirement__title">
      요구사항 관리
      <span class="requirement__hint">{{ requirementMeta.hint }}</span>
    </h1>

    <!-- 검색조건 -->
    <section class="filter card">
      <div class="filter__row filter__row--7">
        <div class="filter__field">
          <label>통합검색</label>
          <input
            v-model="filters.keyword"
            class="filter__input"
            type="text"
            placeholder="요구사항명, ID"
          />
        </div>
        <div class="filter__field">
          <label>업무유형</label>
          <select v-model="filters.taskType" class="filter__select">
            <option v-for="o in taskTypeOptions" :key="o" :value="o">{{ o }}</option>
          </select>
        </div>
        <div class="filter__field">
          <label>시스템</label>
          <select v-model="filters.system" class="filter__select" @change="onSystemFilterChange">
            <option value="">시스템 선택</option>
            <option v-for="s in systemOptions" :key="s" :value="s">{{ s }}</option>
          </select>
        </div>
        <div class="filter__field">
          <label>업무구분</label>
          <select v-model="filters.bizCategory" class="filter__select" :disabled="!filters.system">
            <option value="">업무구분 선택</option>
            <option v-for="b in bizCategoryFilterOptions" :key="b" :value="b">{{ b }}</option>
          </select>
        </div>
        <div class="filter__field">
          <label>상태</label>
          <select v-model="filters.status" class="filter__select">
            <option v-for="o in statusOptions" :key="o" :value="o">{{ o }}</option>
          </select>
        </div>
        <div class="filter__field">
          <label>우선순위</label>
          <select v-model="filters.priority" class="filter__select">
            <option v-for="o in priorityOptions" :key="o" :value="o">{{ o }}</option>
          </select>
        </div>
        <div class="filter__field">
          <label>요건확정</label>
          <select v-model="filters.confirm" class="filter__select">
            <option v-for="o in confirmOptions" :key="o" :value="o">{{ o }}</option>
          </select>
        </div>
      </div>

      <div v-if="filterExpanded" class="filter__row filter__row--3">
        <div class="filter__field">
          <label>기간</label>
          <select v-model="filters.periodType" class="filter__select">
            <option v-for="p in periodOptions" :key="p" :value="p">{{ p }}</option>
          </select>
        </div>
        <div class="filter__field filter__field--range">
          <label>&nbsp;</label>
          <div class="filter__range">
            <input v-model="filters.dateFrom" class="filter__input" type="date" />
            <span>~</span>
            <input v-model="filters.dateTo" class="filter__input" type="date" />
          </div>
        </div>
      </div>

      <button
        type="button"
        class="filter__expand"
        @click="filterExpanded = !filterExpanded"
      >
        {{ filterExpanded ? '▲ 검색조건 접기' : '＋ 검색조건 확장' }}
      </button>

      <div class="filter__actions">
        <button type="button" class="btn btn--ghost" @click="resetFilters">초기화</button>
        <button type="button" class="btn btn--primary" @click="search">조회</button>
      </div>
    </section>

    <p class="notice card">{{ requirementMeta.notice }}</p>

    <!-- 툴바 -->
    <div class="toolbar">
      <span class="toolbar__count">총 <b>{{ filteredList.length }}</b>건</span>
      <select v-model="pageSize" class="toolbar__mini" @change="onPageSizeChange">
        <option v-for="n in pageSizeOptions" :key="n" :value="n">{{ n }}건씩 보기</option>
      </select>
      <button
        type="button"
        class="toolbar__mini"
        :disabled="!canExpandAll"
        @click="toggleExpandAll"
      >
        {{ allExpandedOnPage ? '전체접기' : '전체열기' }}
      </button>
      <div class="toolbar__spacer" />
      <button type="button" class="btn btn--ghost btn--sm" @click="onScreenSetting">
        화면설정
      </button>
      <button type="button" class="btn btn--ghost btn--sm" @click="onCopy">복사</button>
      <button type="button" class="btn btn--ghost btn--sm" @click="onSaveConfirm">저장</button>
      <div class="register-wrap">
        <button
          type="button"
          class="btn btn--primary btn--sm register-btn"
          @click="showRegisterMenu = !showRegisterMenu"
        >
          등록 ▾
        </button>
        <div v-if="showRegisterMenu" class="register-menu">
          <button type="button" @click="openBulkRegister">일괄등록</button>
          <button type="button" @click="openRegister">개별등록</button>
        </div>
      </div>
      <ExcelDownloadButton @click="onExcelDownload" />
    </div>

    <!-- 목록 -->
    <div class="listcard">
      <div class="listcard__scroll">
        <table class="req-table">
          <thead>
            <tr>
              <th class="col-check" rowspan="2">
                <input
                  type="checkbox"
                  :checked="isAllSelected()"
                  @change="toggleSelectAll($event.target.checked)"
                />
              </th>
              <th rowspan="2">요구사항 ID</th>
              <th rowspan="2">시스템/업무</th>
              <th rowspan="2">화면경로</th>
              <th rowspan="2">화면명</th>
              <th rowspan="2">요구사항명</th>
              <th rowspan="2">구분</th>
              <th rowspan="2">업무유형</th>
              <th rowspan="2">상태</th>
              <th rowspan="2">우선순위</th>
              <th colspan="2" class="confirm-head">
                <div class="confirm-head__title">
                  <span>요건확정</span>
                  <button
                    type="button"
                    class="confirm-tip"
                    :aria-expanded="confirmTipOpen"
                    @click.stop="confirmTipOpen = !confirmTipOpen"
                    @blur="confirmTipOpen = false"
                  >
                    !
                  </button>
                  <div v-if="confirmTipOpen" class="confirm-tip__bubble" role="tooltip">
                    {{ confirmTooltip }}
                  </div>
                </div>
              </th>
              <th rowspan="2">이슈</th>
              <th rowspan="2">등록자</th>
            </tr>
            <tr class="confirm-subhead">
              <th>요청자</th>
              <th>테크</th>
            </tr>
          </thead>
          <tbody>
            <template v-for="row in pagedList" :key="row.id">
              <tr
                class="req-row"
                :class="{
                  'req-row--rejected': row.status === '반려',
                  'req-row--expanded': expandedIds.has(row.id),
                }"
              >
                <td class="col-check">
                  <input
                    type="checkbox"
                    :checked="selectedIds.has(row.id)"
                    :disabled="row.status === '반려'"
                    @change="toggleSelect(row.id)"
                  />
                </td>
                <td><b>{{ row.reqId }}</b></td>
                <td>{{ row.systemPath }}</td>
                <td>{{ row.screenPath }}</td>
                <td>{{ row.screenName }}</td>
                <td>
                  <button type="button" class="name-link" @click="toggleExpand(row.id)">
                    {{ row.name }}
                  </button>
                </td>
                <td>{{ row.reqType }}</td>
                <td>
                  <div class="task-types">
                    <span v-for="t in row.taskTypes" :key="t">{{ t }}</span>
                  </div>
                </td>
                <td>
                  <span class="st" :class="`st--${statusClass(row.status)}`">{{ row.status }}</span>
                </td>
                <td>
                  <span class="pri" :class="`pri--${priorityClass(row.priority)}`">
                    {{ row.priority }}
                  </span>
                </td>
                <td>
                  <select
                    class="confirm-select"
                    :class="`confirm-select--${confirmClass(row.confirmRequester)}`"
                    :value="row.confirmRequester === '확정' ? '확정' : '미확정'"
                    :disabled="isConfirmLocked(row)"
                    @change="onConfirmChange(row, 'confirmRequester', $event.target.value)"
                  >
                    <option v-for="o in confirmSelectOptions" :key="o" :value="o">{{ o }}</option>
                  </select>
                </td>
                <td>
                  <select
                    class="confirm-select"
                    :class="`confirm-select--${confirmClass(row.confirmTech)}`"
                    :value="row.confirmTech === '확정' ? '확정' : '미확정'"
                    :disabled="isConfirmLocked(row)"
                    @change="onConfirmChange(row, 'confirmTech', $event.target.value)"
                  >
                    <option v-for="o in confirmSelectOptions" :key="o" :value="o">{{ o }}</option>
                  </select>
                </td>
                <td>
                  <button
                    type="button"
                    class="issue-link"
                    @click="onIssueClick(row)"
                  >
                    {{ row.issueCount }}
                  </button>
                </td>
                <td class="reg-cell">
                  {{ row.registeredBy }}<br />
                  <span class="muted">{{ row.registeredAt.slice(0, 10) }}</span>
                </td>
              </tr>

              <tr v-if="expandedIds.has(row.id)" class="detail-row">
                <td colspan="14">
                  <div class="detail-panel">
                    <div class="detail-panel__blocks">
                      <div class="detail-panel__content">
                        <p class="detail-panel__label">요구사항 원안</p>
                        <p class="detail-panel__text">{{ row.original || '-' }}</p>
                      </div>
                      <div class="detail-panel__content">
                        <p class="detail-panel__label">요구사항 분석</p>
                        <p class="detail-panel__text">{{ row.analysis || '-' }}</p>
                      </div>
                    </div>
                    <div class="detail-panel__meta">
                      <span>
                        등록 {{ row.registeredBy }} {{ row.registeredAt }}
                        <template v-if="row.updatedAt">
                          | 수정 {{ row.updatedBy }} {{ row.updatedAt }}
                        </template>
                        <template v-else>| 수정 —</template>
                      </span>
                      <button type="button" class="btn btn--ghost btn--sm" @click="openEdit(row)">
                        상세/수정
                      </button>
                    </div>
                  </div>
                </td>
              </tr>
            </template>

            <tr v-if="!pagedList.length">
              <td colspan="14" class="empty-row">조회 결과가 없습니다.</td>
            </tr>
          </tbody>
        </table>
      </div>

      <div class="pager">
        <button
          type="button"
          class="pager__btn"
          :disabled="currentPage <= 1"
          @click="currentPage = 1"
        >
          «
        </button>
        <button
          type="button"
          class="pager__btn"
          :disabled="currentPage <= 1"
          @click="currentPage--"
        >
          ‹
        </button>
        <button
          v-for="p in Math.min(totalPages, 8)"
          :key="p"
          type="button"
          class="pager__btn"
          :class="{ 'pager__btn--on': currentPage === p }"
          @click="currentPage = p"
        >
          {{ p }}
        </button>
        <button
          type="button"
          class="pager__btn"
          :disabled="currentPage >= totalPages"
          @click="currentPage++"
        >
          ›
        </button>
        <button
          type="button"
          class="pager__btn"
          :disabled="currentPage >= totalPages"
          @click="currentPage = totalPages"
        >
          »
        </button>
      </div>
    </div>

    <RequirementIssueModal v-model="showIssueModal" :requirement="issueTarget" />
    <RequirementFormModal
      v-model="showFormModal"
      :mode="formMode"
      :data="formTarget"
      @save="onFormSave"
    />
    <RequirementBulkRegisterModal v-model="showBulkModal" @register="onBulkRegister" />
    <RequirementScreenSearchModal
      v-model="showScreenSearchModal"
      :system="screenSettingSystem"
      @select="onScreenSelect"
    />

    <!-- Alerts -->
    <Teleport to="body">
      <div v-if="showSaveAlert" class="alert-scrim" @mousedown.self="showSaveAlert = null">
        <div class="alert-box">
          <p v-if="showSaveAlert === 'none'">요건확정 처리할 요구사항을 선택하세요.</p>
          <p v-else-if="showSaveAlert === 'unconfirmed'">미확정 상태입니다. 확정 후 저장하세요.</p>
          <p v-else>선택한 {{ saveAlertCount }}건이 요건확정 처리되었습니다.</p>
          <button type="button" class="btn btn--primary" @click="showSaveAlert = null">확인</button>
        </div>
      </div>
    </Teleport>
  </div>
</template>

<style scoped>
.requirement {
  padding: 14px 18px 28px;
  color: var(--ink);
  font-size: 13px;
}

.requirement__title {
  font-size: 16px;
  font-weight: 700;
  margin: 2px 2px 12px;
  display: flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
}

.requirement__hint {
  font-size: 11px;
  font-weight: 500;
  color: var(--muted);
  background: var(--lnb-side);
  border: 1px solid var(--line);
  padding: 2px 8px;
  border-radius: 20px;
}

.card {
  background: var(--lnb-side);
  border: 1px solid var(--line);
  border-radius: 10px;
}

.filter {
  padding: 14px 16px;
  margin-bottom: 14px;
}

.filter__row {
  display: grid;
  gap: 10px 14px;
  margin-bottom: 10px;
}

.filter__row--7 {
  grid-template-columns: repeat(7, 1fr);
}

.filter__row--4 {
  grid-template-columns: repeat(4, 1fr);
}

.filter__field {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.filter__field label {
  font-size: 11px;
  color: var(--muted);
  font-weight: 600;
}

.filter__input,
.filter__select {
  height: 32px;
  padding: 0 10px;
  border: 1px solid var(--line);
  border-radius: 7px;
  font-family: inherit;
  font-size: 12px;
  background: var(--field);
}

.filter__range {
  display: flex;
  align-items: center;
  gap: 6px;
}

.filter__range .filter__input {
  flex: 1;
}

.filter__expand {
  border: none;
  background: none;
  color: var(--teal-600);
  font-size: 11.5px;
  cursor: pointer;
  padding: 0;
  margin-bottom: 10px;
  font-family: inherit;
}

.filter__actions {
  display: flex;
  justify-content: flex-end;
  gap: 8px;
}

.notice {
  margin-bottom: 12px;
  padding: 12px 14px;
  background: var(--teal-50);
  border-color: var(--teal-100);
  color: var(--teal-600);
  font-size: 12px;
  line-height: 1.5;
}

.toolbar {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 10px;
  flex-wrap: wrap;
}

.toolbar__count {
  font-size: 12px;
  color: var(--ink-2);
}

.toolbar__count b {
  color: var(--teal-600);
}

.toolbar__mini {
  height: 24px;
  padding: 0 8px;
  border: 1px solid var(--line);
  border-radius: 6px;
  background: var(--lnb-side);
  font-size: 11.5px;
  color: var(--ink-2);
  font-family: inherit;
  cursor: pointer;
}

.toolbar__mini:disabled {
  opacity: 0.45;
  cursor: not-allowed;
}

.toolbar__spacer {
  flex: 1;
}

.register-wrap {
  position: relative;
}

.register-btn {
  min-width: 72px;
}

.register-menu {
  position: absolute;
  right: 0;
  top: calc(100% + 4px);
  background: var(--lnb-side);
  border: 1px solid var(--line);
  border-radius: 8px;
  box-shadow: 0 4px 16px rgba(20, 40, 50, 0.1);
  z-index: 20;
  overflow: hidden;
  min-width: 100px;
}

.register-menu button {
  display: block;
  width: 100%;
  padding: 9px 14px;
  border: none;
  background: none;
  text-align: left;
  font-size: 12px;
  cursor: pointer;
  font-family: inherit;
}

.register-menu button:hover {
  background: var(--teal-50);
  color: var(--teal-600);
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

.req-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 12px;
  min-width: 1200px;
}

.req-table thead th {
  background: var(--lnb-hover);
  color: var(--muted);
  font-weight: 600;
  text-align: left;
  padding: 9px 11px;
  border-bottom: 1px solid var(--line);
  white-space: nowrap;
}

.req-table tbody td {
  padding: 10px 11px;
  border-bottom: 1px solid var(--line-2);
  color: var(--ink-2);
  vertical-align: middle;
}

.col-check {
  width: 36px;
  text-align: center;
}

.req-row:hover {
  background: var(--teal-50);
}

.req-row--rejected {
  opacity: 0.55;
  background: var(--gray-bg);
}

.req-row--rejected:hover {
  background: var(--gray-bg);
}

.name-link {
  border: none;
  background: none;
  color: var(--ink);
  font-weight: 700;
  cursor: pointer;
  text-align: left;
  font-family: inherit;
  font-size: 12px;
  padding: 0;
}

.name-link:hover {
  color: var(--teal-600);
  text-decoration: underline;
}

.task-types {
  display: flex;
  flex-direction: column;
  gap: 2px;
  line-height: 1.3;
}

.st {
  font-size: 11px;
  font-weight: 700;
  padding: 3px 9px;
  border-radius: 20px;
  display: inline-block;
}

.st--recv {
  color: var(--gray);
  background: var(--gray-bg);
}

.st--done {
  color: var(--green);
  background: var(--green-bg);
}

.st--rej {
  color: var(--red);
  background: var(--red-bg);
}

.pri {
  font-size: 11px;
  font-weight: 700;
  padding: 3px 9px;
  border-radius: 20px;
}

.pri--h {
  color: var(--red);
  background: var(--red-bg);
}

.pri--m {
  color: var(--orange);
  background: var(--orange-bg);
}

.pri--l {
  color: var(--gray);
  background: var(--gray-bg);
}

.confirm-head {
  text-align: center;
  vertical-align: middle;
  background: var(--field);
}

.confirm-head__title {
  position: relative;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 4px;
  font-size: 11px;
  font-weight: 700;
  line-height: 1.2;
}

.confirm-subhead th {
  font-size: 11px;
  font-weight: 600;
  background: var(--field);
  padding: 6px 8px;
}

.confirm-tip {
  width: 16px;
  height: 16px;
  border-radius: 50%;
  border: 1px solid var(--lnb-line);
  background: var(--lnb-side);
  color: var(--teal-600);
  font-size: 10px;
  font-weight: 800;
  line-height: 1;
  cursor: pointer;
  font-family: inherit;
  padding: 0;
}

.confirm-tip__bubble {
  position: absolute;
  top: calc(100% + 6px);
  left: 50%;
  transform: translateX(-50%);
  z-index: 20;
  width: 260px;
  padding: 10px 12px;
  border: 1px solid var(--lnb-line);
  border-radius: var(--radius-md, 8px);
  background: var(--lnb-side);
  box-shadow: var(--shadow-sm, 0 4px 12px rgba(0, 0, 0, 0.08));
  color: var(--lnb-txt);
  font-size: 11px;
  font-weight: 500;
  line-height: 1.55;
  white-space: pre-line;
  text-align: left;
}

.confirm-select {
  min-width: 72px;
  height: 26px;
  padding: 0 6px;
  border: 1px solid var(--lnb-line);
  border-radius: var(--radius-sm, 6px);
  background: var(--lnb-side);
  font-size: 11px;
  font-weight: 600;
  font-family: inherit;
  cursor: pointer;
}

.confirm-select--pending {
  color: var(--orange);
}

.confirm-select--confirmed {
  color: var(--teal-600);
  background: var(--teal-50);
  border-color: var(--teal-100);
}

.confirm-select:disabled {
  opacity: 0.75;
  cursor: not-allowed;
}

.issue-link {
  border: none;
  background: none;
  color: var(--teal-600);
  text-decoration: underline;
  cursor: pointer;
  font-family: inherit;
  font-size: 12px;
  font-weight: 600;
}

.reg-cell {
  white-space: nowrap;
  font-size: 11.5px;
}

.muted {
  color: var(--muted);
}

.detail-row td {
  padding: 0;
  background: var(--lnb-hover);
}

.detail-panel {
  padding: 14px 16px 14px 48px;
}

.detail-panel__blocks {
  display: flex;
  flex-direction: column;
  gap: 12px;
  margin-bottom: 10px;
}

.detail-panel__label {
  margin: 0 0 6px;
  font-size: 11px;
  font-weight: 700;
  color: var(--teal-600);
}

.detail-panel__text {
  margin: 0;
  font-size: 12.5px;
  line-height: 1.6;
  color: var(--ink-2);
  white-space: pre-wrap;
  display: -webkit-box;
  -webkit-line-clamp: 10;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.detail-panel__meta {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  font-size: 11px;
  color: var(--muted);
  flex-wrap: wrap;
}

.empty-row {
  text-align: center;
  padding: 32px !important;
  color: var(--muted);
}

.pager {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 4px;
  padding: 16px;
}

.pager__btn {
  min-width: 28px;
  height: 28px;
  border-radius: 7px;
  border: 1px solid var(--line);
  background: var(--lnb-side);
  color: var(--ink-2);
  font-size: 12px;
  cursor: pointer;
  font-family: inherit;
}

.pager__btn--on {
  background: var(--teal);
  border-color: var(--teal);
  color: var(--color-text-inverse);
  font-weight: 700;
}

.pager__btn:disabled {
  opacity: 0.4;
  cursor: not-allowed;
}

.btn {
  height: 32px;
  padding: 0 14px;
  border-radius: 7px;
  font-size: 12.5px;
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
  font-size: 12px;
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
  font-size: 13.5px;
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
