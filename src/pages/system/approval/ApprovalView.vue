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

/**
 * 승인상태 기본값은 승인요청이다 — 결재함에 들어오는 이유가 "처리할 것이 있나"라서, 처리
 * 끝난 건까지 섞어 보여주면 매번 상태를 좁히는 손이 한 번 더 든다. 전체를 보려면 상태를
 * 선택으로 바꾼다.
 */
function defaultFilters() {
  return {
    status: '승인요청',
    type: '',
    project: '',
    requester: '',
    dateType: '요청일',
    dateFrom: '',
    dateTo: '',
  }
}

const filters = ref(defaultFilters())
const applied = ref({ ...filters.value })
const filterExpanded = ref(false)
const pageSize = ref(20)
const currentPage = ref(1)
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
  // 승인상태는 기본값(승인요청)이 걸려 있어 목록이 이미 좁혀진 상태다 — 태그로 보여주지
  // 않으면 "왜 승인완료 건이 안 보이나"를 알 수 없다.
  if (filters.value.status) tags.push({ key: 'status', label: '승인상태', value: filters.value.status })
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

const selectedRow = ref(filtered.value[0] || null)

const selectedGroup = computed(() => {
  if (!selectedRow.value) return null
  return isHoldRequest(selectedRow.value) ? 'HOLD' : 'SCHEDULE'
})

function reasonText(row) {
  if (isHoldRequest(row)) return row.detail?.suspendReason || row.reason || '-'
  return row.reason || '-'
}

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

/** 일시중단 상세 — 홀딩 요청은 업무 단위 세부내역이 목업 데이터에 없어 요청 1건을 1행으로 보여준다. */
const holdDetailRows = computed(() => {
  if (!selectedRow.value || selectedGroup.value !== 'HOLD') return []
  const row = selectedRow.value
  return [
    {
      assignee: row.requester,
      period: dateRangeText(row.holdStartDate, row.holdEndDate),
      expectedResume: row.expectedResumeDate || row.detail?.expectedResumeDate || '-',
      reason: reasonText(row),
    },
  ]
})

/** 처리 가능한 것은 승인요청 상태뿐이다. */
function isPending(row) {
  return row.status === '승인요청'
}

/** 상세 카드의 안내 문구용 — 눌러 본 행이 이미 처리된 건인지. */
const selectedRowDecidable = computed(() => !!selectedRow.value && isPending(selectedRow.value))

/** 일괄 처리 대상 — 단건·다건 승인/반려를 지원한다. */
const selectedIds = ref([])

function toggleSelect(row) {
  const index = selectedIds.value.indexOf(row.id)
  if (index >= 0) selectedIds.value.splice(index, 1)
  else selectedIds.value.push(row.id)
}

// 전체선택은 현재 페이지의 처리 가능한 행만 본다 — 안 보이는 페이지까지 묶으면 확인 창에서
// 본 건수와 실제 처리 건수가 갈린다.
const selectablePaged = computed(() => paged.value.filter(isPending))
const allSelected = computed(() =>
  selectablePaged.value.length > 0 && selectablePaged.value.every((r) => selectedIds.value.includes(r.id)),
)

function toggleSelectAll(event) {
  selectedIds.value = event.target.checked ? selectablePaged.value.map((r) => r.id) : []
}

const canDecide = computed(() => selectedIds.value.length > 0)

function search() {
  applied.value = { ...filters.value }
  currentPage.value = 1
  selectedRow.value = filtered.value[0] || null
  // 체크도 비운다 — 남겨 두면 필터를 바꾼 뒤 목록에 없는 건이 일괄 처리 대상으로 남는다.
  selectedIds.value = []
}

function resetFilters() {
  filters.value = defaultFilters()
  search()
}

function removeFilterTag(key) {
  if (key === 'status') filters.value.status = ''
  else if (key === 'type') filters.value.type = ''
  else if (key === 'project') filters.value.project = ''
  search()
}

function selectRow(row) {
  selectedRow.value = row
}

/** 반려 사유는 확인 창에서 받는다(선택 입력) — 비워 두면 사유 없이 반려 처리한다. */
function decide(status) {
  const targets = [...selectedIds.value]
  if (!targets.length) return

  const label = status === '승인완료' ? '승인' : '반려'
  const scope = targets.length > 1 ? `선택한 ${targets.length}건` : '선택한 요청'

  let reason
  if (status === '승인반려') {
    const input = window.prompt(`${scope}을 반려 처리하시겠습니까?\n반려 사유(선택 입력)`, '')
    if (input === null) return
    reason = input.trim() || undefined
  } else if (!window.confirm(`${scope}을 ${label} 처리하시겠습니까?`)) {
    return
  }

  deciding.value = true
  try {
    const today = new Date().toISOString().slice(0, 10)
    targets.forEach((id) => {
      const target = rows.find((r) => r.id === id)
      if (!target) return
      target.status = status
      target.approveDate = today
      if (status === '승인반려') target.rejectionReason = reason
    })
    window.alert(`${targets.length}건을 ${label} 처리했습니다.`)
    search()
  } finally {
    deciding.value = false
  }
}

/** 프로젝트 바로가기 — 이동 대상은 WBS 화면뿐이다. */
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
      v-model:search="filters.project"
      search-placeholder="프로젝트명"
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
      </template>
    </SearchFilterBar>

    <div class="toolbar">
      <span class="toolbar__count">승인요청 내역 · 총 <b>{{ filtered.length }}</b>건</span>
      <select v-model="pageSize" class="hp-pagesize-select" @change="currentPage = 1">
        <option v-for="n in pageSizeOptions" :key="n" :value="n">{{ n }}건씩 보기</option>
      </select>
    </div>

    <div class="listcard card--panel">
      <div class="listcard__scroll">
        <table class="data-table" style="min-width: 1080px">
          <thead>
            <tr>
              <th style="width: 40px" class="cell--center">
                <input
                  type="checkbox"
                  :checked="allSelected"
                  :disabled="!selectablePaged.length"
                  @change="toggleSelectAll"
                />
              </th>
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
              <!-- 체크박스 클릭은 행 선택(상세 카드 갱신)과 별개다 — 겹치면 체크 한 번에
                   상세가 같이 튀어 어느 건을 보고 있는지 흐려진다. -->
              <td class="cell--center" @click.stop>
                <input
                  type="checkbox"
                  :checked="selectedIds.includes(row.id)"
                  :disabled="!isPending(row)"
                  @change="toggleSelect(row)"
                />
              </td>
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
              <td colspan="11" class="empty">조회 결과가 없습니다.</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <HpPagination v-model:page="currentPage" :total-pages="totalPages" />

    <section v-if="selectedRow" class="card card--panel detail-card">
      <div class="detail-card__head">
        <h3 class="detail-card__title">신청요청 상세</h3>
        <button type="button" class="btn btn--ghost btn--sm" @click="goProject">프로젝트 바로가기</button>
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
        <div class="detail-table-wrap">
          <table class="data-table detail-table">
            <thead>
              <tr>
                <th>담당자</th>
                <th>중단 기간</th>
                <th>재개 예정일</th>
                <th>요청 사유</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="(line, idx) in holdDetailRows" :key="idx">
                <td class="cell--center">{{ line.assignee }}</td>
                <td class="cell--center">{{ line.period }}</td>
                <td class="cell--center">{{ line.expectedResume }}</td>
                <td>{{ line.reason }}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <!-- 이미 반려된 건은 무슨 사유로 반려됐는지가 상세에 남아야 한다(입력은 반려 확인 창에서 받는다). -->
      <div v-if="selectedRow.rejectionReason" class="detail-field detail-field--reason">
        <label>반려 사유</label>
        <div class="detail-value detail-value--block">{{ selectedRow.rejectionReason }}</div>
      </div>

      <div class="detail-card__foot">
        <span v-if="!selectedRowDecidable" class="detail-card__note">이미 처리된 요청입니다.</span>
        <span v-else-if="!canDecide" class="detail-card__note">처리할 요청을 선택해 주세요.</span>
        <span v-else-if="selectedIds.length > 1" class="detail-card__note">{{ selectedIds.length }}건 선택</span>
        <button
          type="button"
          class="btn btn--ghost btn--sm"
          :disabled="!canDecide || deciding"
          @click="decide('승인반려')"
        >
          반려
        </button>
        <button
          type="button"
          class="btn btn--primary btn--sm"
          :disabled="!canDecide || deciding"
          @click="decide('승인완료')"
        >
          승인
        </button>
      </div>
    </section>
  </main>
</template>

<style scoped>
.data-table tbody tr { cursor: pointer; }
.tbl__muted { color: var(--lnb-muted); }
.empty { text-align: center !important; color: var(--lnb-muted); padding: 24px !important; white-space: normal; }

.link-btn { border: none; background: none; color: var(--teal); font-weight: 600; text-decoration: underline; cursor: pointer; font-family: inherit; font-size: inherit; padding: 0; }

.detail-card__head { display: flex; align-items: center; justify-content: space-between; gap: 12px; margin-bottom: 12px; }
.detail-card__title { margin: 0; font-size: calc(15.2px + var(--font-size-offset)); color: var(--lnb-logo); }

.detail-grid { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 10px 16px; }
.detail-grid--3 { grid-template-columns: repeat(3, minmax(0, 1fr)); }
.detail-field { display: flex; flex-direction: column; gap: 4px; font-size: calc(12.48px + var(--font-size-offset)); }
.detail-field label { color: var(--lnb-muted); font-weight: 600; }
.detail-value { border: 1px solid var(--lnb-line); border-radius: 6px; padding: 6px 10px; min-height: 32px; display: flex; align-items: center; font-size: calc(12.8px + var(--font-size-offset)); background: var(--lnb-hover); color: var(--lnb-txt); }
.detail-value--block { align-items: flex-start; min-height: 64px; padding: 8px 10px; white-space: pre-wrap; line-height: 1.5; }

.detail-section { margin-top: 14px; padding-top: 14px; border-top: 1px solid var(--lnb-line); }
.detail-section__title { margin: 0 0 10px; font-size: calc(13px + var(--font-size-offset)); font-weight: 700; color: var(--lnb-logo); }
.detail-table-wrap { overflow-x: auto; }
.detail-table { min-width: 720px; }

.detail-field--reason { margin-top: 14px; padding-top: 14px; border-top: 1px solid var(--lnb-line); }
.detail-card__foot { display: flex; align-items: center; justify-content: flex-end; gap: 8px; margin-top: 16px; padding-top: 14px; border-top: 1px solid var(--lnb-line); }
.detail-card__note { margin-right: auto; font-size: calc(12px + var(--font-size-offset)); color: var(--lnb-muted); }
</style>
