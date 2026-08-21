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
import { getDefectList, matchDefectFilters, computeDefectKpi } from '@/entities/defect/mock/testDefect'
import ErrorDetailModal from '@/pages/workspace/test/defects/ErrorDetailModal.vue'
import ExcelDownloadButton from '@/shared/ui/ExcelDownloadButton.vue'
import SearchFilterBar from '@/shared/ui/SearchFilterBar.vue'
import FilterSelectPill from '@/shared/ui/FilterSelectPill.vue'
import FilterTextPill from '@/shared/ui/FilterTextPill.vue'
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
  tester: '',
  assignee: '',
})
const appliedFilters = ref({ ...filters.value })
const pageSize = ref(20)
const currentPage = ref(1)
const filterExpanded = ref(false)

const detailTarget = ref(null)
const showDetail = ref(false)

const filteredList = computed(() =>
  rows.value.filter((row) => matchDefectFilters(row, appliedFilters.value, config.value)),
)

const kpi = computed(() => computeDefectKpi(filteredList.value))

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
    tester: '',
    assignee: '',
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
  if (f.grade && f.grade !== '전체') tags.push({ key: 'grade', label: '오류등급', value: f.grade })
  if (f.bizCategory && f.bizCategory !== '전체') {
    tags.push({ key: 'bizCategory', label: '업무범주', value: f.bizCategory })
  }
  return tags
})

function removeFilterTag(key) {
  if (key === 'keyword' || key === 'tester' || key === 'assignee') {
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
        <FilterTextPill v-model="filters.assignee" label="조치자" placeholder="조치자" />
        <FilterSelectPill
          v-if="config.showDeployStatus"
          v-model="filters.deployStatus"
          label="배포상태"
          :options="deployStatusOptions"
        />
        <FilterSelectPill v-model="filters.grade" label="오류등급" :options="defectGradeOptions" />
        <FilterSelectPill v-model="filters.bizCategory" label="업무범주" :options="bizCategoryOptions" />
      </template>
    </SearchFilterBar>

    <div class="kpi-row">
      <div class="kpi-card"><span class="kpi-card__lab">접수</span><span class="kpi-card__num">{{ kpi.received }}</span></div>
      <div class="kpi-card"><span class="kpi-card__lab">처리예정</span><span class="kpi-card__num">{{ kpi.scheduled }}</span></div>
      <div class="kpi-card kpi-card--ok"><span class="kpi-card__lab">처리완료</span><span class="kpi-card__num">{{ kpi.done }}</span></div>
      <div class="kpi-card"><span class="kpi-card__lab">오류아님</span><span class="kpi-card__num">{{ kpi.notError }}</span></div>
      <div class="kpi-card"><span class="kpi-card__lab">수정제외</span><span class="kpi-card__num">{{ kpi.excluded }}</span></div>
    </div>

    <div class="toolbar">
      <span class="toolbar__count">총 <b>{{ filteredList.length }}</b>건</span>
      <select v-model="pageSize" class="toolbar__mini" @change="currentPage = 1">
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
              <td class="col-no">{{ (currentPage - 1) * pageSize + idx + 1 }}</td>
              <td>{{ row.systemPath || '-' }}</td>
              <td>{{ row.screenName }}</td>
              <td>{{ row.caseId }}</td>
              <td>{{ row.caseName }}</td>
              <td>{{ row.defectId }}</td>
              <td v-if="config.showOccurrencePhase">{{ row.occurrencePhase }}</td>
              <td><span class="grade" :class="`grade--${row.grade.toLowerCase()}`">{{ row.grade }}</span></td>
              <td>
                <button type="button" class="link-btn" @click="openDetail(row)">{{ row.title }}</button>
              </td>
              <td>{{ row.tester }}</td>
              <td>{{ row.registeredAt }}</td>
              <td>{{ row.result }}</td>
              <td>
                <span class="badge" :class="`badge--${defectStatusClass(row.status)}`">{{ row.status }}</span>
              </td>
              <td v-if="config.showDeployStatus">{{ row.deployStatus }}</td>
              <td>{{ row.assignee }}</td>
              <td>{{ row.dueDate || '-' }}</td>
              <td>{{ row.updatedBy || '-' }}</td>
              <td>{{ row.updatedAt || '-' }}</td>
            </tr>
            <tr v-if="!pagedList.length">
              <td :colspan="config.showDeployStatus ? 18 : 17" class="empty">조회 결과가 없습니다.</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <ErrorDetailModal
      :visible="showDetail"
      :case-row="detailTarget"
      :initial-defect-id="detailTarget?.id"
      :mode="mode"
      :config="config"
      @close="showDetail = false"
      @changed="onErrorChanged"
    />

    <div v-if="totalPages > 1" class="pager">
      <button type="button" class="pager__btn" :disabled="currentPage <= 1" @click="currentPage -= 1">이전</button>
      <span class="pager__info">{{ currentPage }} / {{ totalPages }}</span>
      <button type="button" class="pager__btn" :disabled="currentPage >= totalPages" @click="currentPage += 1">다음</button>
    </div>
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

.kpi-row {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
  margin-bottom: 12px;
}

.kpi-card {
  flex: 1;
  min-width: 100px;
  padding: 10px 14px;
  background: var(--field);
  border-radius: 10px;
}

.kpi-card__lab {
  display: block;
  font-size: calc(11px + var(--font-size-offset, 0px));
  color: var(--muted);
  font-weight: 600;
}

.kpi-card__num {
  display: block;
  font-size: calc(20px + var(--font-size-offset, 0px));
  font-weight: 700;
  margin-top: 2px;
}

.kpi-card--ok .kpi-card__num { color: var(--teal-600); }

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

.toolbar__mini {
  height: 24px;
  padding: 0 8px;
  border: 1px solid var(--line);
  border-radius: 6px;
  font-size: calc(11.5px + var(--font-size-offset, 0px));
  font-family: inherit;
}

.listcard {
  background: var(--lnb-side);
  border: 1px solid var(--line);
  border-radius: 10px;
  overflow: hidden;
}

.listcard__scroll { overflow-x: auto; }

.data-table {
  width: 100%;
  border-collapse: collapse;
  font-size: calc(12px + var(--font-size-offset, 0px));
}

.data-table th,
.data-table td {
  padding: 10px 12px;
  border-bottom: 1px solid var(--line);
  text-align: left;
  white-space: nowrap;
}

.data-table th {
  background: var(--field);
  font-weight: 600;
  text-align: center;
}


.col-no {
  width: 40px;
  text-align: center !important;
}

.grade { font-weight: 600; font-size: calc(11px + var(--font-size-offset, 0px)); }
.grade--critical { color: var(--red); }
.grade--major { color: var(--orange); }
.grade--minor { color: var(--gray); }

.badge {
  display: inline-block;
  padding: 2px 8px;
  border-radius: 999px;
  font-size: calc(11px + var(--font-size-offset, 0px));
  font-weight: 600;
}

.badge--ok { background: var(--green-bg); color: var(--green); }
.badge--err { background: var(--red-bg); color: var(--red); }
.badge--wait { background: var(--gray-bg); color: var(--gray); }
.badge--prog { background: var(--blue-bg); color: var(--blue); }

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

.pager {
  display: flex;
  justify-content: center;
  gap: 12px;
  margin-top: 12px;
  align-items: center;
}

.pager__btn {
  height: 28px;
  padding: 0 12px;
  border: 1px solid var(--line);
  border-radius: 6px;
  background: var(--lnb-side);
  font-size: calc(12px + var(--font-size-offset, 0px));
  cursor: pointer;
  font-family: inherit;
}

.pager__btn:disabled { opacity: 0.4; cursor: not-allowed; }
.pager__info { font-size: calc(12px + var(--font-size-offset, 0px)); }
</style>
