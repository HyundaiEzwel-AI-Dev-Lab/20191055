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
  dateTypeOptions,
  pageSizeOptions,
  approvalList,
  matchApprovalFilters,
  approvalStatusClass,
  beforeText,
  afterText,
  dateRangeText,
  isHoldRequest,
} from '@/entities/approval/mock/approval'
import ExcelDownloadButton from '@/shared/ui/ExcelDownloadButton.vue'
import SearchFilterBar from '@/shared/ui/SearchFilterBar.vue'
import FilterSelectPill from '@/shared/ui/FilterSelectPill.vue'
import FilterTextPill from '@/shared/ui/FilterTextPill.vue'
import FilterDateRange from '@/shared/ui/FilterDateRange.vue'
import { mockExcelDownload } from '@/shared/file-excel/excelDownload'

const router = useRouter()
const projectStore = useProjectStore()
const tabsStore = useTabsStore()
const subTabsStore = useSubTabsStore()
const rows = approvalList
const filters = ref({
  status: '전체',
  type: '전체',
  project: '',
  requester: '',
  dateType: '요청일',
  dateFrom: '',
  dateTo: '',
})
const applied = ref({ ...filters.value })
const pageSize = ref(20)
const currentPage = ref(1)
const selectedRow = ref(rows[0] || null)
const filterExpanded = ref(false)

const statusSelectOptions = approvalStatusOptions.map((o) => ({
  value: o,
  label: o === '전체' ? '선택' : o,
}))
const typeSelectOptions = requestTypeOptions.map((o) => ({
  value: o,
  label: o === '전체' ? '선택' : o,
}))

const filtered = computed(() => rows.filter((r) => matchApprovalFilters(r, applied.value)))
const paged = computed(() => {
  const start = (currentPage.value - 1) * pageSize.value
  return filtered.value.slice(start, start + pageSize.value)
})
const totalPages = computed(() => Math.max(1, Math.ceil(filtered.value.length / pageSize.value)))

const filterTags = computed(() => {
  const a = applied.value
  const tags = []
  if (a.type && a.type !== '전체') tags.push({ key: 'type', label: '요청유형', value: a.type })
  if (a.project) tags.push({ key: 'project', label: '프로젝트명', value: a.project })
  return tags
})

const selectedGroup = computed(() => {
  if (!selectedRow.value) return null
  return isHoldRequest(selectedRow.value) ? 'HOLD' : 'SCHEDULE'
})

const scheduleDetailRows = computed(() => {
  if (!selectedRow.value || selectedGroup.value === 'HOLD') return []
  const rowsInDetail = selectedRow.value.detail?.scheduleRows
  if (rowsInDetail?.length) return rowsInDetail
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

function search() {
  applied.value = { ...filters.value }
  currentPage.value = 1
  selectedRow.value = filtered.value[0] || null
}

function resetFilters() {
  filters.value = {
    status: '전체',
    type: '전체',
    project: '',
    requester: '',
    dateType: '요청일',
    dateFrom: '',
    dateTo: '',
  }
  search()
}

function removeFilterTag(key) {
  if (key === 'type') filters.value.type = '전체'
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

  target.status = status
  target.approveDate = new Date().toISOString().slice(0, 10)
  window.alert(`${label} 처리했습니다.`)
}

function holdPeriodText(row) {
  return dateRangeText(row.holdStartDate, row.holdEndDate)
}

function holdResumeText(row) {
  return row.expectedResumeDate || row.detail?.expectedResumeDate || '-'
}

function holdReasonText(row) {
  return row.detail?.suspendReason || row.reason || '-'
}

function holdRequestedAt(row) {
  return row.detail?.requestedAt || row.requestDate || '-'
}

function goProject() {
  if (!selectedRow.value) return
  const row = selectedRow.value
  const route = '/workspace/wbs'
  const id = row.projectId || 'p1'
  const name = String(row.projectName || '프로젝트').replace(/\s*외\s*\d+건$/, '')
  projectStore.setCurrentProject({ id, name, stage: '처리중' })
  tabsStore.openProjectTab({
    projectId: id,
    title: name,
    projectName: name,
    route,
  })
  subTabsStore.openSubTab(id, { id: 'wbs', title: 'WBS', route })
  router.push(route)
}

function onExcelDownload() {
  mockExcelDownload('신청 승인 관리', filtered.value, [
    { key: 'id', label: 'NO' },
    { key: 'status', label: '승인상태' },
    { key: 'type', label: '요청유형' },
    { key: 'projectName', label: '프로젝트명' },
    { key: 'openDate', label: '오픈예정일' },
    { key: 'before', label: '변경전' },
    { key: 'after', label: '변경후' },
    { key: 'requester', label: '요청자' },
    { key: 'requestDate', label: '요청일자' },
    { key: 'approveDate', label: '승인일자' },
    { key: 'reason', label: '요청사유' },
  ])
}
</script>

<template>
  <div class="admin-page">
    <SearchFilterBar
      v-model:expanded="filterExpanded"
      :show-search="false"
      :applied-tags="filterTags"
      @reset="resetFilters"
      @search="search"
      @remove-tag="removeFilterTag"
    >
      <template #primary>
        <FilterSelectPill v-model="filters.status" label="승인상태" :options="statusSelectOptions" empty-label="선택" />
        <FilterTextPill v-model="filters.requester" label="요청자" placeholder="요청자" @enter="search" />
        <FilterSelectPill v-model="filters.dateType" label="날짜구분" :options="dateTypeOptions" />
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
          :options="typeSelectOptions"
          empty-label="선택"
          fill
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
      <div class="toolbar__actions">
        <ExcelDownloadButton @click="onExcelDownload" />
      </div>
    </div>

    <div class="listcard">
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

    <div v-if="totalPages > 1" class="pager">
      <button type="button" class="pager__btn" :disabled="currentPage <= 1" @click="currentPage -= 1">이전</button>
      <span class="pager__info">{{ currentPage }} / {{ totalPages }}</span>
      <button type="button" class="pager__btn" :disabled="currentPage >= totalPages" @click="currentPage += 1">다음</button>
    </div>

    <section v-if="selectedRow" class="card detail-card">
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
            <div class="detail-value">{{ holdReasonText(selectedRow) }}</div>
          </div>
          <div class="detail-field">
            <label>중단 기간</label>
            <div class="detail-value">{{ holdPeriodText(selectedRow) }}</div>
          </div>
          <div class="detail-field">
            <label>재개 예정일</label>
            <div class="detail-value">{{ holdResumeText(selectedRow) }}</div>
          </div>
          <div class="detail-field">
            <label>요청일시</label>
            <div class="detail-value">{{ holdRequestedAt(selectedRow) }}</div>
          </div>
        </div>
      </div>

      <div class="detail-card__foot">
        <span v-if="!canDecide" class="detail-card__note">이미 처리된 요청입니다.</span>
        <button
          type="button"
          class="btn btn--ghost btn--sm"
          :disabled="!canDecide"
          @click="decide('승인반려')"
        >
          승인반려
        </button>
        <button
          type="button"
          class="btn btn--primary btn--sm"
          :disabled="!canDecide"
          @click="decide('승인완료')"
        >
          승인완료
        </button>
      </div>
    </section>
  </div>
</template>

<style scoped>
.data-table tbody tr {
  cursor: pointer;
}

.cell--center {
  text-align: center;
}

.detail-card__head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  margin-bottom: 12px;
}

.detail-card__head .detail-card__title {
  margin: 0;
}

.detail-grid--3 {
  grid-template-columns: repeat(3, minmax(0, 1fr));
}

.detail-section {
  margin-top: 14px;
  padding-top: 14px;
  border-top: 1px solid var(--lnb-line);
}

.detail-section__title {
  margin: 0 0 10px;
  font-size: calc(13px + var(--font-size-offset, 0px));
  font-weight: 700;
  color: var(--lnb-logo);
}

.detail-table-wrap {
  overflow-x: auto;
}

.detail-table {
  min-width: 720px;
}

.detail-card__foot {
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: 8px;
  margin-top: 16px;
  padding-top: 14px;
  border-top: 1px solid var(--lnb-line);
}

.detail-card__note {
  margin-right: auto;
  font-size: 0.75rem;
  color: var(--lnb-muted);
}

.badge--cancel {
  background: var(--gray-bg);
  color: var(--gray);
  text-decoration: line-through;
}
</style>
