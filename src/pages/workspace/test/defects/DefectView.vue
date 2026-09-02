<script setup>
// PAG-S-UAT-14 결함관리
import { computed, onMounted, ref, watch } from 'vue'
import { useRoute } from 'vue-router'
import { useTestContext } from '@/app/composables/useTestContext'
import {
  defectStatusOptions,
  defectGradeOptions,
  deployStatusOptions,
  bizCategoryOptions,
  pageSizeOptions,
  defectStatusClass,
} from '@/shared/lib/testConfig'
import { getDefectList, matchDefectFilters } from '@/entities/defect/mock/testDefect'
import ErrorDetailModal from '@/pages/workspace/test/defects/ErrorDetailModal.vue'
import ExcelDownloadButton from '@/shared/ui/ExcelDownloadButton.vue'
import SearchFilterBar from '@/shared/ui/SearchFilterBar.vue'
import FilterSelectPill from '@/shared/ui/FilterSelectPill.vue'
import FilterTextPill from '@/shared/ui/FilterTextPill.vue'
import FilterDateRange from '@/shared/ui/FilterDateRange.vue'
import HpPagination from '@/shared/ui/HpPagination.vue'
import { mockExcelDownload } from '@/shared/file-excel/excelDownload'
import { useAuthStore } from '@/app/stores/auth'

const { mode, config, pageTitle } = useTestContext()
const route = useRoute()
const authStore = useAuthStore()

const rows = ref([])
const filters = ref({
  keyword: '',
  round: '전체',
  status: '전체',
  grade: '전체',
  deployStatus: '전체',
  bizCategory: '전체',
  system: '전체',
  tester: '',
  assignee: '',
  title: '',
  registeredFrom: '',
  registeredTo: '',
})
const appliedFilters = ref({ ...filters.value })
const pageSize = ref(20)
const currentPage = ref(1)
const filterExpanded = ref(false)

const detailTarget = ref(null)
const showDetail = ref(false)

/** matchDefectFilters(엔티티 mock 소유)가 다루지 않는 조건 — mock 파일은 수정 대상이 아니라
 * 여기서만 추가로 거른다. system은 systemPath 첫 세그먼트('FO>...')로 판정한다. */
function matchExtraFilters(row, f) {
  if (f.system && f.system !== '전체' && (row.systemPath || '').split('>')[0] !== f.system) return false
  if (f.title?.trim() && !row.title.includes(f.title.trim())) return false
  if (f.registeredFrom && row.registeredAt.slice(0, 10) < f.registeredFrom) return false
  if (f.registeredTo && row.registeredAt.slice(0, 10) > f.registeredTo) return false
  return true
}

const filteredList = computed(() =>
  rows.value.filter(
    (row) =>
      matchDefectFilters(row, appliedFilters.value, config.value) && matchExtraFilters(row, appliedFilters.value),
  ),
)

/** 목록의 '등록자(최종확인자)' — 등록한 테스터와, 조치확인(수정완료/재처리요청/DEV확인/운영확인)을
 * 실제로 남긴 사람이 다를 때만 괄호로 덧붙인다. */
const CONFIRM_ACTIONS = ['수정완료', '재처리요청', 'DEV확인', '운영확인']
function registrantLabel(row) {
  const registered = row.tester || '-'
  const confirmed = (row.history || []).find((h) => CONFIRM_ACTIONS.includes(h.action))?.author
  if (!confirmed || confirmed === registered) return registered
  return `${registered} (${confirmed})`
}

const pagedList = computed(() => {
  const start = (currentPage.value - 1) * pageSize.value
  return filteredList.value.slice(start, start + pageSize.value)
})

const totalPages = computed(() =>
  Math.max(1, Math.ceil(filteredList.value.length / pageSize.value)),
)

function loadData() {
  rows.value = getDefectList(mode.value, authStore.user?.id)
  currentPage.value = 1
}

onMounted(() => {
  loadData()
  if (route.query.bizCategory) {
    filters.value.bizCategory = String(route.query.bizCategory)
    appliedFilters.value = { ...filters.value }
  }
  if (route.query.tester) {
    filters.value.tester = String(route.query.tester)
    appliedFilters.value = { ...filters.value }
  }
})
watch(mode, loadData)

function resetFilters() {
  filters.value = {
    keyword: '',
    round: '전체',
    status: '전체',
    grade: '전체',
    deployStatus: '전체',
    bizCategory: '전체',
    system: '전체',
    tester: '',
    assignee: '',
    title: '',
    registeredFrom: '',
    registeredTo: '',
  }
  appliedFilters.value = { ...filters.value }
  currentPage.value = 1
}

function search() {
  appliedFilters.value = { ...filters.value }
  currentPage.value = 1
}

const filterTags = computed(() => {
  const f = appliedFilters.value
  const tags = []
  if (f.keyword?.trim()) tags.push({ key: 'keyword', label: '통합검색', value: f.keyword })
  if (f.tester?.trim()) tags.push({ key: 'tester', label: '등록자', value: f.tester })
  if (f.status && f.status !== '전체') tags.push({ key: 'status', label: '조치상태', value: f.status })
  if (f.round && f.round !== '전체') tags.push({ key: 'round', label: '차수', value: f.round })
  if (f.assignee?.trim()) tags.push({ key: 'assignee', label: '조치자', value: f.assignee })
  if (config.value.showDeployStatus && f.deployStatus && f.deployStatus !== '전체') {
    tags.push({ key: 'deployStatus', label: '배포상태', value: f.deployStatus })
  }
  if (f.title?.trim()) tags.push({ key: 'title', label: '오류제목', value: f.title })
  if (f.grade && f.grade !== '전체') tags.push({ key: 'grade', label: '오류등급', value: f.grade })
  if (f.bizCategory && f.bizCategory !== '전체') {
    tags.push({ key: 'bizCategory', label: '업무범주', value: f.bizCategory })
  }
  if (f.system && f.system !== '전체') tags.push({ key: 'system', label: '시스템', value: f.system })
  if (f.registeredFrom || f.registeredTo) {
    tags.push({
      key: 'registeredRange',
      label: '오류등록일',
      value: `${f.registeredFrom || '…'} ~ ${f.registeredTo || '…'}`,
    })
  }
  return tags
})

function removeFilterTag(key) {
  if (key === 'registeredRange') {
    filters.value.registeredFrom = ''
    filters.value.registeredTo = ''
  } else if (key === 'keyword' || key === 'tester' || key === 'assignee' || key === 'title') {
    filters.value[key] = ''
  } else {
    filters.value[key] = '전체'
  }
  search()
}

function openDetail(row) {
  detailTarget.value = row
  showDetail.value = true
}

function onErrorChanged() {
  loadData()
}

function onExcelDownload() {
  const label = `결함 관리 (${mode.value === 'uat' ? '운영' : 'DEV'})`
  mockExcelDownload(label, filteredList.value, [
    { key: 'defectId', label: '결함ID' },
    { key: 'round', label: '차수' },
    { key: 'systemPath', label: '시스템/업무/화면경로' },
    { key: 'caseId', label: '케이스' },
    { key: 'caseName', label: '케이스명' },
    { key: 'screenName', label: '화면명' },
    { key: 'stepNo', label: '절차' },
    { key: 'title', label: '결함제목' },
    { key: 'grade', label: '등급' },
    { key: 'result', label: '결과' },
    { key: 'occurrencePhase', label: '발생시점' },
    { key: 'deployStatus', label: '배포상태' },
    { key: 'status', label: '조치상태' },
    { key: 'dueDate', label: '조치예정일' },
    { key: 'tester', label: '테스터' },
    { key: 'assignee', label: '담당자' },
    { key: 'registeredAt', label: '등록일' },
    { key: 'updatedBy', label: '최종수정자' },
    { key: 'updatedAt', label: '최종수정일' },
  ])
}
</script>

<template>
  <div class="defect">
    <h1 class="defect__title">{{ pageTitle }}</h1>

    <SearchFilterBar
      v-model:expanded="filterExpanded"
      v-model:search="filters.keyword"
      search-placeholder="케이스명, 케이스ID, 오류제목, 오류ID"
      panel-class="sfb__panel-grid--auto"
      :applied-tags="filterTags"
      @reset="resetFilters"
      @search="search"
      @remove-tag="removeFilterTag"
    >
      <template #primary>
        <FilterTextPill v-model="filters.tester" label="등록자" placeholder="등록자" />
        <FilterSelectPill v-model="filters.status" label="조치상태" :options="defectStatusOptions" />
        <FilterSelectPill v-model="filters.round" label="차수" :options="config.roundOptions" />
      </template>
      <template #expand>
        <FilterTextPill v-model="filters.title" label="오류제목" placeholder="오류제목" fill />
        <FilterTextPill v-model="filters.assignee" label="조치자" placeholder="조치자" fill />
        <FilterSelectPill
          v-if="config.showDeployStatus"
          v-model="filters.deployStatus"
          label="배포상태"
          fill
          :options="deployStatusOptions"
        />
        <FilterDateRange
          label="오류등록일"
          :from="filters.registeredFrom"
          :to="filters.registeredTo"
          fill
          @update:from="filters.registeredFrom = $event"
          @update:to="filters.registeredTo = $event"
        />
        <FilterSelectPill v-model="filters.grade" label="오류등급" fill :options="defectGradeOptions" />
        <FilterSelectPill v-model="filters.bizCategory" label="업무범주" fill :options="bizCategoryOptions" />
        <FilterSelectPill v-model="filters.system" label="시스템" fill :options="config.systemOptions" />
      </template>
    </SearchFilterBar>

    <div class="toolbar">
      <span class="toolbar__count">총 <b>{{ filteredList.length }}</b>건</span>
      <select v-model="pageSize" class="hp-pagesize-select" @change="currentPage = 1">
        <option v-for="n in pageSizeOptions" :key="n" :value="n">{{ n }}건씩 보기</option>
      </select>
      <ExcelDownloadButton class="toolbar__excel" @click="onExcelDownload" />
    </div>

    <div class="listcard">
      <div class="listcard__scroll">
        <table class="data-table">
          <thead>
            <tr>
              <th class="col-no">No</th>
              <th class="col-round">차수</th>
              <th>시스템/업무/화면경로</th>
              <th>화면명</th>
              <th>케이스ID</th>
              <th>케이스명</th>
              <th>오류ID</th>
              <th v-if="config.showOccurrencePhase">발생시점</th>
              <th>등급</th>
              <th>오류제목</th>
              <th>등록자(최종확인자)</th>
              <th>등록일</th>
              <th>결과</th>
              <th>조치상태</th>
              <th v-if="config.showDeployStatus">배포상태</th>
              <th>조치자</th>
              <th>조치예정일</th>
              <th>최종수정자</th>
              <th>최종수정일</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="(row, idx) in pagedList" :key="row.id">
              <td class="col-no cell--center">{{ (currentPage - 1) * pageSize + idx + 1 }}</td>
              <td class="col-round cell--center">{{ row.round }}</td>
              <td>{{ row.systemPath || '-' }}</td>
              <td>{{ row.screenName }}</td>
              <td class="cell--center">{{ row.caseId }}</td>
              <td>{{ row.caseName }}</td>
              <td class="cell--center">{{ row.defectId }}</td>
              <td v-if="config.showOccurrencePhase" class="cell--center">{{ row.occurrencePhase }}</td>
              <td class="cell--center">
                <span class="grade" :class="`grade--${row.grade.toLowerCase()}`">{{ row.grade }}</span>
              </td>
              <td>
                <button type="button" class="link-btn" @click="openDetail(row)">{{ row.title }}</button>
              </td>
              <td class="cell--center">{{ registrantLabel(row) }}</td>
              <td class="cell--center">{{ row.registeredAt }}</td>
              <td class="cell--center">{{ row.result }}</td>
              <td class="cell--center">
                <span class="badge" :class="`badge--${defectStatusClass(row.status)}`">{{ row.status }}</span>
              </td>
              <td v-if="config.showDeployStatus" class="cell--center">{{ row.deployStatus }}</td>
              <td class="cell--center">{{ row.assignee }}</td>
              <td class="cell--center">{{ row.dueDate || '-' }}</td>
              <td class="cell--center">{{ row.updatedBy || '-' }}</td>
              <td class="cell--center">{{ row.updatedAt || '-' }}</td>
            </tr>
            <tr v-if="!pagedList.length">
              <td
                :colspan="17 + (config.showOccurrencePhase ? 1 : 0) + (config.showDeployStatus ? 1 : 0)"
                class="empty"
              >
                조회 결과가 없습니다.
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <HpPagination v-model:page="currentPage" :total-pages="totalPages" />

    <ErrorDetailModal
      :visible="showDetail"
      :case-row="detailTarget"
      :initial-defect-id="detailTarget?.id"
      :mode="mode"
      :config="config"
      @close="showDetail = false"
      @changed="onErrorChanged"
    />
  </div>
</template>

<style scoped>
.defect {
  padding: 14px 18px 28px;
  color: var(--ink);
  font-size: calc(13px + var(--font-size-offset, 0px));
}

.defect__title {
  font-size: calc(18px + var(--font-size-offset, 0px));
  font-weight: 700;
  margin: 0 0 14px;
}

.toolbar {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 10px;
}

.toolbar__count { font-size: calc(12px + var(--font-size-offset, 0px)); }
.toolbar__count b { color: var(--teal-600); }

.toolbar__excel {
  margin-left: auto;
}

/* .listcard/.data-table 배경·테두리·라운드는 shared/styles/components.css 전역 정의를 그대로
   쓴다 — 가로 스크롤 처리만 이 화면 몫이다. */
.listcard__scroll { overflow-x: auto; }

.col-no { width: 40px; text-align: center !important; }
.col-round { width: 52px; text-align: center !important; }

.grade { font-weight: 600; font-size: calc(11px + var(--font-size-offset, 0px)); }
.grade--critical { color: var(--red); }
.grade--major { color: var(--orange); }
.grade--minor { color: var(--gray); }

/* 조치상태 배지 톤(ok/err/wait/prog/muted)은 defectStatusClass() 전용 이름이라
   shared/styles/components.css의 공용 뱃지 팔레트(success/warning/danger/info)에는 없다. */
.badge--ok { background: var(--green-bg); color: var(--green); }
.badge--err { background: var(--red-bg); color: var(--red); }
.badge--wait { background: var(--gray-bg); color: var(--gray); }
.badge--prog { background: var(--blue-bg); color: var(--blue); }
.badge--muted { background: var(--gray-bg); color: var(--gray); }

.link-btn {
  border: none;
  background: none;
  color: var(--teal-600);
  font-weight: 600;
  cursor: pointer;
  font-family: inherit;
  text-decoration: underline;
}

.empty { text-align: center !important; color: var(--muted); padding: 24px !important; }
</style>
