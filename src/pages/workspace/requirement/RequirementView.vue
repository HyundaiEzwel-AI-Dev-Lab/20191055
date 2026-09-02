<script setup>
// PAG-S-REQ-01 요구사항 관리
import { computed, onActivated, onMounted, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
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
  hydrateRequirement,
} from '@/entities/requirement/mock/requirement'
import RequirementIssueModal from '@/pages/workspace/requirement/RequirementIssueModal.vue'
import RequirementFormModal from '@/pages/workspace/requirement/RequirementFormModal.vue'
import RequirementBulkRegisterModal from '@/pages/workspace/requirement/RequirementBulkRegisterModal.vue'
import RequirementScreenSearchModal from '@/pages/workspace/requirement/RequirementScreenSearchModal.vue'
import ExcelDownloadButton from '@/shared/ui/ExcelDownloadButton.vue'
import HpPagination from '@/shared/ui/HpPagination.vue'
import SearchFilterBar from '@/shared/ui/SearchFilterBar.vue'
import FilterSelectPill from '@/shared/ui/FilterSelectPill.vue'
import FilterDateRange from '@/shared/ui/FilterDateRange.vue'
import { mockExcelDownload } from '@/shared/file-excel/excelDownload'
import { addRequirementHistory } from '@/entities/project/mock/projectHistory'
import { useProjectStore } from '@/app/stores/project'
import { useAuthStore } from '@/app/stores/auth'

const authStore = useAuthStore()
const projectStore = useProjectStore()
const route = useRoute()
const router = useRouter()
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
const confirmTipOpen = ref(false)
const showScreenSearchModal = ref(false)
const screenSettingSystem = ref('')

const bizCategoryFilterOptions = computed(() => bizCategoryMap[filters.value.system] || [])
const systemPillOptions = [{ value: '', label: '시스템 선택' }, ...systemOptions]
const bizCategoryPillOptions = computed(() => [
  { value: '', label: '업무구분 선택' },
  ...bizCategoryFilterOptions.value,
])

const filterTags = computed(() => {
  const f = appliedFilters.value
  const tags = []
  if (f.keyword) tags.push({ key: 'keyword', label: '통합검색', value: f.keyword })
  if (f.taskType && f.taskType !== '전체') tags.push({ key: 'taskType', label: '업무유형', value: f.taskType })
  if (f.system) tags.push({ key: 'system', label: '시스템', value: f.system })
  if (f.bizCategory) tags.push({ key: 'bizCategory', label: '업무구분', value: f.bizCategory })
  if (f.status && f.status !== '전체') tags.push({ key: 'status', label: '상태', value: f.status })
  if (f.priority && f.priority !== '전체') tags.push({ key: 'priority', label: '우선순위', value: f.priority })
  if (f.confirm && f.confirm !== '전체') tags.push({ key: 'confirm', label: '요건확정', value: f.confirm })
  if (f.periodType && f.periodType !== '등록일') {
    tags.push({ key: 'periodType', label: '기간유형', value: f.periodType })
  }
  if (
    f.dateFrom !== '2026-01-01' ||
    f.dateTo !== '2026-01-31' ||
    (f.periodType && f.periodType !== '등록일')
  ) {
    tags.push({
      key: 'dateRange',
      label: f.periodType || '기간',
      value: `${f.dateFrom || '…'} ~ ${f.dateTo || '…'}`,
    })
  }
  return tags
})

const confirmSelectOptions = ['미확정', '확정']
const confirmTooltip =
  '요청자와 테크담당 모두 확정 시 WBS 업무가 생성됩니다.\n- 확정 : 최종 개발 요구사항 확인 완료 (확정 후에도 요구사항은 계속 수정 가능하며, 확정 자체는 되돌릴 수 없음)\n- 미확정 : 최종 개발 요구사항 확정 전'

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

let deepLinkOpening = false

async function openDeepLinkedRequirement() {
  const target = route.query.reqId
  if (typeof target !== 'string' || !target || deepLinkOpening) return
  deepLinkOpening = true
  try {
    await router.replace({ path: route.path, query: { ...route.query, reqId: undefined } })
    if (!requirements.value.length) {
      requirements.value = getRequirementList(authStore.user?.id)
    }
    const found = requirements.value.find((r) => r.reqId === target)
    if (found) openEdit(found)
  } finally {
    deepLinkOpening = false
  }
}

onMounted(() => {
  requirements.value = getRequirementList(authStore.user?.id)
  void openDeepLinkedRequirement()
})

onActivated(() => {
  void openDeepLinkedRequirement()
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

function removeFilterTag(key) {
  const defaults = {
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
  if (key === 'dateRange') {
    filters.value.dateFrom = defaults.dateFrom
    filters.value.dateTo = defaults.dateTo
  } else if (key === 'system') {
    filters.value.system = ''
    filters.value.bizCategory = ''
  } else if (key in defaults) {
    filters.value[key] = defaults[key]
  }
  search()
}

function onSystemFilterChange() {
  filters.value.bizCategory = ''
}

function onSystemSelect(value) {
  filters.value.system = value
  onSystemFilterChange()
}

/** 요구사항명 클릭 — 그 행 아래 원안/분석 미리보기 아코디언만 토글한다(단일 펼침).
 *  "전체열기"로 여러 행이 열려 있어도 개별 행을 누르면 그 행 하나만 남긴다. */
function toggleRow(id) {
  if (expandedIds.value.size === 1 && expandedIds.value.has(id)) {
    expandedIds.value = new Set()
    return
  }
  expandedIds.value = new Set([id])
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
  if (row.confirmRequester === '확정' && row.confirmTech === '확정') return true
  return false
}

function isConfirmationFieldLocked(row, field) {
  if (isConfirmLocked(row)) return true
  return field === 'confirmRequester' ? row.confirmRequester === '확정' : row.confirmTech === '확정'
}

/** 요건확정 select가 비활성일 때 왜 눌리지 않는지 안내한다(hover 시 title 노출). */
function confirmLockReason(row, field) {
  if (row.status === '반려') return '반려된 요구사항은 요건확정할 수 없습니다.'
  if (row.confirmRequester === '확정' && row.confirmTech === '확정') return '최종확정된 요구사항입니다.'
  if (row[field] === '확정') return '이미 확정된 항목입니다.'
  return ''
}

function onConfirmChange(row, field, value) {
  if (isConfirmationFieldLocked(row, field)) return
  const previous = row[field]
  if (value !== '확정') {
    row[field] = previous
    return
  }
  row[field] = '확정'
  const atField = field === 'confirmRequester' ? 'confirmRequesterAt' : 'confirmTechAt'
  row[atField] = new Date().toISOString().slice(0, 19).replace('T', ' ')
}

function onIssueClick(row) {
  issueTarget.value = row
  showIssueModal.value = true
}

function onIssueAdded({ requirement, body }) {
  const historyProjectId = projectStore.currentProject?.id
  if (!historyProjectId || !requirement) return
  addRequirementHistory(historyProjectId, 'issue', {
    reqName: requirement.name,
    reqId: requirement.reqId,
    issueBody: body,
  })
}

function onIssueCountChange(count) {
  const row = issueTarget.value || formTarget.value
  if (row) row.issueCount = count
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
    requirements.value.unshift(
      hydrateRequirement({
        id: `req-bulk-${Date.now()}-${idx}`,
        reqId: `REQ-${String(nextNo).padStart(3, '0')}`,
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
        screenPath: form.screenPath || form.screenMenu || '-',
        screenName: form.screenName || form.screenMenu || '-',
        memo: '',
        issues: [],
      }),
    )
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
  return hydrateRequirement({
    id: `req-new-${Date.now()}-${seqOffset}`,
    reqId: `REQ-${String(nextNo).padStart(3, '0')}`,
    reqType: form.reqType.startsWith('추가') ? '추가' : '최초',
    name: form.name,
    taskTypes: [...(form.taskTypes || [])],
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
    screenPath: form.screenPath || form.screenMenu || '-',
    screenName: form.screenName || form.screenMenu || '-',
    memo: form.memo,
    attachments: [...(form.attachments || [])],
    scopes: form.scopes,
    issues: [],
  })
}

function onFormSave(payload) {
  if (formMode.value === 'register' || formMode.value === 'copy') {
    const form = Array.isArray(payload) ? payload[0] : payload
    if (formMode.value === 'copy') {
      const dup = findDuplicateRequirement(form)
      if (dup) {
        const newTaskTypes = (form.taskTypes || []).filter((t) => !dup.taskTypes.includes(t))
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
    requirements.value.unshift(buildRequirementRow(form, 0))
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
      const now = new Date().toISOString().slice(0, 19).replace('T', ' ')
      if (!formTarget.value.changeHistory) formTarget.value.changeHistory = []
      const changeBefore = {
        name: formTarget.value.name,
        analysis: formTarget.value.analysis,
        status: formTarget.value.status,
        priority: formTarget.value.priority,
        taskTypes: [...formTarget.value.taskTypes],
        memo: formTarget.value.memo,
      }
      const changeAfter = {
        name: form.name,
        analysis: form.analysis,
        status: form.status,
        priority: form.priority,
        taskTypes: [...form.taskTypes],
        memo: form.memo,
      }
      formTarget.value.changeHistory.push({
        id: `ch-${Date.now()}`,
        round: formTarget.value.changeHistory.length + 1,
        reason: form.changeReason || '',
        changedBy: '김현대',
        changedAt: now,
        before: changeBefore,
        after: changeAfter,
      })
      // 프로젝트 변경이력(통합/개별)에도 즉시 반영 (SB p.47~54, p.81~83)
      const historyProjectId = projectStore.currentProject?.id
      if (historyProjectId) {
        if (changeBefore.priority !== changeAfter.priority) {
          addRequirementHistory(historyProjectId, 'priority', {
            reqName: changeAfter.name,
            reqId: formTarget.value.reqId,
            fieldLabel: '우선순위',
            before: changeBefore.priority,
            after: changeAfter.priority,
          })
        }
        if (changeBefore.status !== changeAfter.status) {
          addRequirementHistory(historyProjectId, 'priority', {
            reqName: changeAfter.name,
            reqId: formTarget.value.reqId,
            fieldLabel: '상태',
            before: changeBefore.status,
            after: changeAfter.status,
          })
        }
        if (changeBefore.analysis !== changeAfter.analysis || changeBefore.name !== changeAfter.name) {
          addRequirementHistory(historyProjectId, 'detail', {
            reqName: changeAfter.name,
            reqId: formTarget.value.reqId,
            reason: form.changeReason || '',
            beforeBody: changeBefore.analysis || changeBefore.name,
            afterBody: changeAfter.analysis || changeAfter.name,
          })
        }
      }
      const hydrated = hydrateRequirement({
        ...formTarget.value,
        name: form.name,
        analysis: form.analysis,
        status: form.status,
        priority: form.priority,
        taskTypes: [...(form.taskTypes || [])],
        memo: form.memo,
        attachments: [...(form.attachments || [])],
        system: form.system,
        bizCategory: form.bizCategory,
        screenPath: form.screenPath || form.screenMenu || formTarget.value.screenPath,
        screenName: form.screenName || form.screenMenu || formTarget.value.screenName,
        screenMenu: form.screenMenu || form.screenName || '',
        scopes: form.scopes,
        updatedBy: '김현대',
        updatedAt: now,
      })
      Object.assign(formTarget.value, hydrated)
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
  showSaveAlert.value = 'unsupported'
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
    const primary = row.scopes?.[0]
    if (primary) {
      primary.screenPath = picked.path
      primary.screenName = picked.name
      primary.screenCode = picked.screenCode || primary.screenCode || ''
      primary.noScreen = false
    }
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
    <SearchFilterBar
      v-model:expanded="filterExpanded"
      v-model:search="filters.keyword"
      search-placeholder="요구사항명, ID"
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
        <FilterSelectPill
          v-model="filters.bizCategory"
          label="업무구분"
          :options="bizCategoryPillOptions"
          empty-label="업무구분 선택"
          :disabled="!filters.system"
        />
        <FilterSelectPill v-model="filters.status" label="상태" :options="statusOptions" />
        <FilterSelectPill v-model="filters.priority" label="우선순위" :options="priorityOptions" />
        <FilterSelectPill v-model="filters.confirm" label="요건확정" :options="confirmOptions" />
      </template>
      <template #expand>
        <FilterSelectPill v-model="filters.periodType" label="기간" :options="periodOptions" />
        <FilterDateRange
          :from="filters.dateFrom"
          :to="filters.dateTo"
          @update:from="filters.dateFrom = $event"
          @update:to="filters.dateTo = $event"
        />
      </template>
    </SearchFilterBar>

    <p class="notice">{{ requirementMeta.notice }}</p>

    <!-- 툴바 -->
    <div class="toolbar">
      <span class="toolbar__count">총 <b>{{ filteredList.length }}</b>건</span>
      <select v-model="pageSize" class="hp-pagesize-select" @change="onPageSizeChange">
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
              <th class="col-id" rowspan="2">요구사항 ID</th>
              <th class="col-system" rowspan="2">시스템/업무</th>
              <th class="col-path" rowspan="2">화면경로</th>
              <th class="col-screen" rowspan="2">화면명</th>
              <th class="col-name" rowspan="2">요구사항명</th>
              <th class="col-div" rowspan="2">구분</th>
              <th class="col-status" rowspan="2">상태</th>
              <th class="col-pri" rowspan="2">우선순위</th>
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
              <th class="col-issue" rowspan="2">이슈</th>
              <th class="col-reg" rowspan="2">등록자</th>
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
                <td>
                  {{ row.systemPath }}
                  <span v-if="(row.scopeCount || row.scopes?.length || 1) > 1" class="scope-count">
                    +{{ (row.scopeCount || row.scopes.length) - 1 }}
                  </span>
                </td>
                <td>{{ row.screenPath }}</td>
                <td>{{ row.screenName }}</td>
                <td>
                  <button type="button" class="name-link" @click="toggleRow(row.id)">
                    {{ row.name }}
                  </button>
                </td>
                <td>{{ row.reqType }}</td>
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
                    :disabled="isConfirmationFieldLocked(row, 'confirmRequester')"
                    :title="confirmLockReason(row, 'confirmRequester')"
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
                    :disabled="isConfirmationFieldLocked(row, 'confirmTech')"
                    :title="confirmLockReason(row, 'confirmTech')"
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
                <td colspan="13">
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
              <td colspan="13" class="empty-row">조회 결과가 없습니다.</td>
            </tr>
          </tbody>
        </table>
      </div>

      <HpPagination :page="currentPage" :total-pages="totalPages" @update:page="(p) => (currentPage = p)" />
    </div>

    <RequirementIssueModal
      v-model="showIssueModal"
      :requirement="issueTarget"
      @issue-added="onIssueAdded"
      @count-change="onIssueCountChange"
    />
    <RequirementFormModal
      v-model="showFormModal"
      :mode="formMode"
      :data="formTarget"
      @save="onFormSave"
      @issue-added="onIssueAdded"
      @count-change="onIssueCountChange"
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
          <p v-else>일괄 요건확정 저장은 아직 지원되지 않는 기능입니다.</p>
          <button type="button" class="btn btn--primary" @click="showSaveAlert = null">확인</button>
        </div>
      </div>
    </Teleport>
  </div>
</template>

<style scoped>
/* h-pms 이식 — .app-shell__content가 유일한 스크롤 컨테이너라 화면 전체가 늘어나면 목록 하단
   페이지네이션이 뷰포트 밖으로 밀린다. 화면을 가용 높이에 고정하고 .listcard__scroll에만
   세로 스크롤을 둔다(CommonCodeView.vue .admin-side__scroll과 같은 정책). */
.requirement {
  height: 100%;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  padding: 14px 18px 28px;
  color: var(--ink);
  font-size: calc(13px + var(--font-size-offset, 0px));
}

.requirement__title {
  flex-shrink: 0;
  font-size: calc(16px + var(--font-size-offset, 0px));
  font-weight: 700;
  margin: 2px 2px 12px;
  display: flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
}

.requirement__hint {
  font-size: calc(11px + var(--font-size-offset, 0px));
  font-weight: 500;
  color: var(--muted);
  background: var(--lnb-side);
  border: 1px solid var(--line);
  padding: 2px 8px;
  border-radius: 20px;
}

.toolbar {
  flex-shrink: 0;
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 10px;
  flex-wrap: wrap;
}

.toolbar__count {
  font-size: calc(12px + var(--font-size-offset, 0px));
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
  font-size: calc(11.5px + var(--font-size-offset, 0px));
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
  font-size: calc(12px + var(--font-size-offset, 0px));
  cursor: pointer;
  font-family: inherit;
}

.register-menu button:hover {
  background: var(--teal-50);
  color: var(--teal-600);
}

/* 남은 세로 공간을 카드가 흡수(flex:1 + min-height:0)해 페이지네이션이 항상 보이게 한다 —
   h-pms 이식. */
.listcard {
  flex: 1;
  min-height: 0;
  display: flex;
  flex-direction: column;
  background: var(--lnb-side);
  border: 1px solid var(--line);
  border-radius: 10px;
  overflow: hidden;
}

.listcard__scroll {
  flex: 1;
  min-height: 0;
  overflow-x: auto;
  overflow-y: auto;
}

.req-table {
  width: 100%;
  border-collapse: collapse;
  font-size: calc(12px + var(--font-size-offset, 0px));
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

.col-id { width: 80px; }
.col-system { width: 100px; }
.col-path { width: 180px; }
.col-screen { width: 120px; }
.col-name { width: 140px; }
.col-div { width: 48px; }
.col-status { width: 60px; }
.col-pri { width: 64px; }
.col-issue { width: 44px; }
.col-reg { width: 84px; }

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
  font-size: calc(12px + var(--font-size-offset, 0px));
  padding: 0;
}

.name-link:hover {
  color: var(--teal-600);
  text-decoration: underline;
}

.scope-count {
  margin-left: 4px;
  color: var(--teal-600);
  font-size: calc(11px + var(--font-size-offset, 0px));
  font-weight: 700;
}

.st {
  font-size: calc(11px + var(--font-size-offset, 0px));
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
  font-size: calc(11px + var(--font-size-offset, 0px));
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
  width: 190px;
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
  font-size: calc(11px + var(--font-size-offset, 0px));
  font-weight: 700;
  line-height: 1.2;
}

.confirm-subhead th {
  font-size: calc(11px + var(--font-size-offset, 0px));
  font-weight: 600;
  background: var(--field);
  padding: 6px 8px;
}

.confirm-tip {
  width: 16px;
  height: 16px;
  border-radius: 50%;
  border: none;
  background: var(--lnb-hover);
  color: var(--lnb-muted);
  font-size: calc(10px + var(--font-size-offset, 0px));
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
  box-shadow: var(--shadow-md, 0 4px 12px rgba(0, 0, 0, 0.08));
  color: var(--lnb-txt);
  font-size: calc(11px + var(--font-size-offset, 0px));
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
  font-size: calc(11px + var(--font-size-offset, 0px));
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
  font-size: calc(12px + var(--font-size-offset, 0px));
  font-weight: 600;
}

.reg-cell {
  white-space: nowrap;
  font-size: calc(11.5px + var(--font-size-offset, 0px));
}

.muted {
  color: var(--muted);
}

.detail-row td {
  padding: 0;
  background: var(--lnb-hover);
}

/* 아코디언 펼침 시 흰 카드 + 옅은 테두리로 시각 언어를 통일한다 — h-pms 이식. */
.detail-panel {
  padding: 18px 24px 22px 48px;
}

.detail-panel__blocks {
  display: flex;
  flex-direction: column;
  gap: 16px;
  margin-bottom: 0;
}

.detail-panel__content {
  background: var(--bg-surface, #fff);
  border: 1px solid var(--lnb-line);
  border-radius: 10px;
  padding: 14px 16px;
}

.detail-panel__label {
  margin: 0 0 8px;
  font-size: calc(11px + var(--font-size-offset, 0px));
  font-weight: 700;
  color: var(--teal-600);
  text-transform: uppercase;
  letter-spacing: 0.02em;
}

.detail-panel__text {
  margin: 0;
  font-size: calc(12.5px + var(--font-size-offset, 0px));
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
  margin-top: 4px;
  padding-top: 14px;
  border-top: 1px solid var(--lnb-line);
  font-size: calc(11px + var(--font-size-offset, 0px));
  color: var(--muted);
  flex-wrap: wrap;
}

.empty-row {
  text-align: center;
  padding: 32px !important;
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
