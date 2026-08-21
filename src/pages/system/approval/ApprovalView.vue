<script setup>
// PAG-M-SYS-04 신청 승인 관리
import { computed, ref } from 'vue'
import { useRouter } from 'vue-router'
import { useProjectStore } from '@/app/stores/project'
import { useTabsStore } from '@/app/stores/tabs'
import { useSubTabsStore } from '@/app/stores/subTabs'
import {
  approvalStatusOptions,
  requestTypeOptions,
  pageSizeOptions,
  approvalList,
  matchApprovalFilters,
  approvalStatusClass,
  beforeText,
  afterText,
  dateRangeText,
  isHoldRequest,
} from '@/entities/approval/mock/approval'
import SearchFilterBar from '@/shared/ui/SearchFilterBar.vue'
import FilterSelectPill from '@/shared/ui/FilterSelectPill.vue'
import FilterTextPill from '@/shared/ui/FilterTextPill.vue'
import FilterDateRange from '@/shared/ui/FilterDateRange.vue'
import HpPagination from '@/shared/ui/HpPagination.vue'

const router = useRouter()
const projectStore = useProjectStore()
const tabsStore = useTabsStore()
const subTabsStore = useSubTabsStore()

const rows = approvalList
const filters = ref({
  status: '',
  type: '',
  project: '',
  requester: '',
  dateType: '요청일',
  dateFrom: '',
  dateTo: '',
})
const applied = ref({ ...filters.value })
const filterExpanded = ref(false)
const pageSize = ref(20)
const currentPage = ref(1)
const selectedRow = ref(rows[0] || null)
const deciding = ref(false)

const statusFilterOptions = computed(() => [
  { value: '', label: '선택' },
  ...approvalStatusOptions.filter((o) => o !== '전체').map((o) => ({ value: o, label: o })),
])

const requestTypeFilterOptions = computed(() => [
  { value: '', label: '선택' },
  ...requestTypeOptions.filter((o) => o !== '전체').map((o) => ({ value: o, label: o })),
])

const filterTags = computed(() => {
  const tags = []
  if (filters.value.type) tags.push({ key: 'type', label: '요청유형', value: filters.value.type })
  if (filters.value.project) tags.push({ key: 'project', label: '프로젝트명', value: filters.value.project })
  return tags
})

const mockFilters = computed(() => ({
  status: applied.value.status || '전체',
  type: applied.value.type || '전체',
  project: applied.value.project,
  requester: applied.value.requester,
  dateType: applied.value.dateType,
  dateFrom: applied.value.dateFrom,
  dateTo: applied.value.dateTo,
}))

const filtered = computed(() => rows.filter((r) => matchApprovalFilters(r, mockFilters.value)))
const paged = computed(() => {
  const start = (currentPage.value - 1) * pageSize.value
  return filtered.value.slice(start, start + pageSize.value)
})
const totalPages = computed(() => Math.max(1, Math.ceil(filtered.value.length / pageSize.value)))

const selectedGroup = computed(() => {
  if (!selectedRow.value) return null
  return isHoldRequest(selectedRow.value) ? 'HOLD' : 'SCHEDULE'
})

const scheduleDetailRows = computed(() => {
  if (!selectedRow.value || selectedGroup.value === 'HOLD') return []
  const detailRows = selectedRow.value.detail?.scheduleRows
  if (detailRows?.length) return detailRows
  return [
    {
      taskType: '-',
      assignee: selectedRow.value.requester,
      before: beforeText(selectedRow.value),
      after: afterText(selectedRow.value),
      reason: selectedRow.value.reason,
      requestedAt: selectedRow.value.requestDate,
    },
  ]
})

const canDecide = computed(() => selectedRow.value?.status === '승인요청')

function reasonText(row) {
  if (isHoldRequest(row)) return row.detail?.suspendReason || row.reason || '-'
  return row.reason || '-'
}

function search() {
  applied.value = { ...filters.value }
  currentPage.value = 1
  selectedRow.value = filtered.value[0] || null
}

function resetFilters() {
  filters.value = {
    status: '',
    type: '',
    project: '',
    requester: '',
    dateType: '요청일',
    dateFrom: '',
    dateTo: '',
  }
  search()
}

function removeFilterTag(key) {
  if (key === 'type') filters.value.type = ''
  else if (key === 'project') filters.value.project = ''
  search()
}

function selectRow(row) {
  selectedRow.value = row
}

function decide(status) {
  const target = selectedRow.value
  if (!target || !canDecide.value) return
  const label = status === '승인완료' ? '승인' : '반려'
  if (!window.confirm(`선택한 요청을 ${label} 처리하시겠습니까?`)) return
  deciding.value = true
  try {
    target.status = status
    target.approveDate = new Date().toISOString().slice(0, 10)
    window.alert(`${label} 처리했습니다.`)
    search()
  } finally {
    deciding.value = false
  }
}

function goProject() {
  if (!selectedRow.value) return
  const row = selectedRow.value
  const route = '/workspace/wbs'
  const id = row.projectId || 'p1'
  const name = String(row.projectName || '프로젝트').replace(/\s*외\s*\d+건$/, '')
  projectStore.setCurrentProject({ id, name, stage: '처리중' })
  tabsStore.openProjectTab({ projectId: id, title: name, projectName: name, route })
  subTabsStore.openSubTab(id, { id: 'wbs', title: 'WBS', route })
  router.push(route)
}
</script>

<template>
  <main class="admin-page hp-anim-enter">
    <SearchFilterBar
      v-model:expanded="filterExpanded"
      :show-search="false"
      :applied-tags="filterTags"
      @reset="resetFilters"
      @search="search"
      @remove-tag="removeFilterTag"
    >
      <template #primary>
        <FilterSelectPill
          v-model="filters.status"
          class="sfb-w-sm"
          label="승인상태"
          empty-label="선택"
          :options="statusFilterOptions"
        />
        <FilterTextPill
          v-model="filters.requester"
          class="sfb-w-md"
          label="요청자"
          placeholder="요청자"
          @enter="search"
        />
        <FilterSelectPill
          v-model="filters.dateType"
          class="sfb-w-md"
          label="날짜구분"
          :options="[
            { value: '요청일', label: '요청일' },
            { value: '승인일', label: '승인일' },
          ]"
        />
        <FilterDateRange
          label="기간"
          v-model:from="filters.dateFrom"
          v-model:to="filters.dateTo"
        />
      </template>
      <template #expand>
        <FilterSelectPill
          v-model="filters.type"
          label="요청유형"
          empty-label="선택"
          fill
          :options="requestTypeFilterOptions"
        />
        <FilterTextPill
          v-model="filters.project"
          label="프로젝트명"
          placeholder="프로젝트명"
          fill
          @enter="search"
        />
      </template>
    </SearchFilterBar>

    <div class="toolbar">
      <span class="toolbar__count">승인요청 내역 · 총 <b>{{ filtered.length }}</b>건</span>
      <select v-model="pageSize" class="toolbar__mini" @change="currentPage = 1">
        <option v-for="n in pageSizeOptions" :key="n" :value="n">{{ n }}건씩 보기</option>
      </select>
    </div>

    <div class="listcard card--panel">
      <div class="listcard__scroll">
        <table class="data-table" style="min-width: 1080px">
          <thead>
            <tr>
              <th style="width: 48px">NO</th>
              <th>승인상태</th>
              <th>요청유형</th>
              <th>프로젝트명</th>
              <th>오픈예정일</th>
              <th>변경전</th>
              <th>변경후</th>
              <th>요청자</th>
              <th>요청일자</th>
              <th>승인일자</th>
            </tr>
          </thead>
          <tbody>
            <tr
              v-for="row in paged"
              :key="row.id"
              :class="{ 'is-selected': selectedRow?.id === row.id }"
              @click="selectRow(row)"
            >
              <td class="cell--center">{{ row.id }}</td>
              <td class="cell--center">
                <span class="badge" :class="`badge--${approvalStatusClass(row.status)}`">{{ row.status }}</span>
              </td>
              <td class="cell--center">{{ row.type }}</td>
              <td>
                <button type="button" class="link-btn" @click.stop="selectRow(row)">{{ row.projectName }}</button>
              </td>
              <td class="cell--center">{{ row.openDate || '-' }}</td>
              <td class="tbl__muted cell--center">{{ beforeText(row) }}</td>
              <td class="cell--center">{{ afterText(row) }}</td>
              <td class="cell--center">{{ row.requester }}</td>
              <td class="cell--center">{{ row.requestDate }}</td>
              <td class="cell--center">{{ row.approveDate }}</td>
            </tr>
            <tr v-if="!paged.length">
              <td colspan="10" class="empty">조회 결과가 없습니다.</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <HpPagination v-model:page="currentPage" :total-pages="totalPages" />

    <section v-if="selectedRow" class="card card--panel detail-card">
      <div class="detail-card__head">
        <h3 class="detail-card__title">승인요청 상세 · {{ selectedRow.type }}</h3>
        <button type="button" class="btn btn--ghost btn--sm" @click="goProject">프로젝트 바로가기 ↗</button>
      </div>

      <div class="detail-grid detail-grid--3">
        <div class="detail-field">
          <label>프로젝트 명</label>
          <div class="detail-value">{{ selectedRow.projectName }}</div>
        </div>
        <div class="detail-field">
          <label>오픈예정일</label>
          <div class="detail-value">{{ selectedRow.openDate || '-' }}</div>
        </div>
        <div class="detail-field">
          <label>변경 요청자</label>
          <div class="detail-value">{{ selectedRow.requester }}</div>
        </div>
      </div>

      <div v-if="selectedGroup === 'SCHEDULE'" class="detail-section">
        <h4 class="detail-section__title">일정 변경 내역</h4>
        <div class="detail-table-wrap">
          <table class="data-table detail-table">
            <thead>
              <tr>
                <th>업무유형</th>
                <th>담당자</th>
                <th>원래값</th>
                <th>변경값</th>
                <th>변경사유</th>
                <th>요청일시</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="(line, idx) in scheduleDetailRows" :key="idx">
                <td class="cell--center">{{ line.taskType }}</td>
                <td class="cell--center">{{ line.assignee }}</td>
                <td class="tbl__muted cell--center">{{ line.before }}</td>
                <td class="cell--center">{{ line.after }}</td>
                <td>{{ line.reason }}</td>
                <td class="cell--center">{{ line.requestedAt }}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <div v-else class="detail-section">
        <h4 class="detail-section__title">일시중단 요청</h4>
        <div class="detail-grid">
          <div class="detail-field detail-field--wide">
            <label>요청 사유</label>
            <div class="detail-value">{{ reasonText(selectedRow) }}</div>
          </div>
          <div class="detail-field">
            <label>중단 기간</label>
            <div class="detail-value">{{ dateRangeText(selectedRow.holdStartDate, selectedRow.holdEndDate) }}</div>
          </div>
          <div class="detail-field">
            <label>재개 예정일</label>
            <div class="detail-value">{{ selectedRow.expectedResumeDate || selectedRow.detail?.expectedResumeDate || '-' }}</div>
          </div>
          <div class="detail-field">
            <label>요청일시</label>
            <div class="detail-value">{{ selectedRow.detail?.requestedAt || selectedRow.requestDate || '-' }}</div>
          </div>
        </div>
      </div>

      <div class="detail-card__foot">
        <span v-if="!canDecide" class="detail-card__note">이미 처리된 요청입니다.</span>
        <button
          type="button"
          class="btn btn--ghost btn--sm"
          :disabled="!canDecide || deciding"
          @click="decide('승인반려')"
        >
          승인반려
        </button>
        <button
          type="button"
          class="btn btn--primary btn--sm"
          :disabled="!canDecide || deciding"
          @click="decide('승인완료')"
        >
          승인완료
        </button>
      </div>
    </section>
  </main>
</template>

<style scoped>
.data-table tbody tr { cursor: pointer; }
.tbl__muted { color: var(--lnb-muted); }
.empty { text-align: center !important; color: var(--lnb-muted); padding: 24px !important; white-space: normal; }
.cell--center { text-align: center; }

.link-btn { border: none; background: none; color: var(--teal); font-weight: 600; text-decoration: underline; cursor: pointer; font-family: inherit; font-size: inherit; padding: 0; }

.detail-card__head { display: flex; align-items: center; justify-content: space-between; gap: 12px; margin-bottom: 12px; }
.detail-card__title { margin: 0; font-size: 0.95rem; color: var(--lnb-logo); }

.detail-grid { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 10px 16px; }
.detail-grid--3 { grid-template-columns: repeat(3, minmax(0, 1fr)); }
.detail-field { display: flex; flex-direction: column; gap: 4px; font-size: 0.78rem; }
.detail-field--wide { grid-column: 1 / -1; }
.detail-field label { color: var(--lnb-muted); font-weight: 600; }
.detail-value { border: 1px solid var(--lnb-line); border-radius: 6px; padding: 6px 10px; min-height: 32px; display: flex; align-items: center; font-size: 0.8rem; background: var(--lnb-hover); color: var(--lnb-txt); }

.detail-section { margin-top: 14px; padding-top: 14px; border-top: 1px solid var(--lnb-line); }
.detail-section__title { margin: 0 0 10px; font-size: 13px; font-weight: 700; color: var(--lnb-logo); }
.detail-table-wrap { overflow-x: auto; }
.detail-table { min-width: 720px; }

.detail-card__foot { display: flex; align-items: center; justify-content: flex-end; gap: 8px; margin-top: 16px; padding-top: 14px; border-top: 1px solid var(--lnb-line); }
.detail-card__note { margin-right: auto; font-size: 0.75rem; color: var(--lnb-muted); }
</style>
