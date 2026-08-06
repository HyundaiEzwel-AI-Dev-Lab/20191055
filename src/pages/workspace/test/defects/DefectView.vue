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
import { getDefectList, matchDefectFilters, computeDefectKpi, updateDefect } from '@/entities/defect/mock/testDefect'
import DefectDetailModal from '@/pages/workspace/test/defects/DefectDetailModal.vue'
import BaseModal from '@/shared/ui/BaseModal.vue'
import ExcelDownloadButton from '@/shared/ui/ExcelDownloadButton.vue'
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

function openDetail(row) {
  detailTarget.value = row
  showDetail.value = true
}

function onDefectSave(updates) {
  if (!detailTarget.value) return
  const targetId = detailTarget.value.id
  updateDefect(targetId, updates)
  loadData()
  const updated = rows.value.find((r) => r.id === targetId)
  if (updated) detailTarget.value = updated
}

function onExcelDownload() {
  const label = `결함 관리 (${mode.value === 'uat' ? '운영' : 'DEV'})`
  mockExcelDownload(label, filteredList.value, [
    { key: 'defectId', label: '결함ID' },
    { key: 'systemPath', label: '시스템/업무/화면경로' },
    { key: 'caseId', label: '케이스' },
    { key: 'caseName', label: '케이스명' },
    { key: 'screenName', label: '화면명' },
    { key: 'round', label: '차수' },
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

    <section class="filter card">
      <div class="filter__row filter__row--auto">
        <div class="filter__field">
          <label>통합검색</label>
          <input v-model="filters.keyword" class="filter__input" type="text" placeholder="케이스명, 케이스ID, 오류제목, 오류ID" />
        </div>
        <div class="filter__field">
          <label>등록자</label>
          <input v-model="filters.tester" class="filter__input" type="text" placeholder="등록자" />
        </div>
        <div class="filter__field">
          <label>조치상태</label>
          <select v-model="filters.status" class="filter__select">
            <option v-for="o in defectStatusOptions" :key="o" :value="o">{{ o }}</option>
          </select>
        </div>
        <div class="filter__field">
          <label>차수</label>
          <select v-model="filters.round" class="filter__select">
            <option v-for="o in config.roundOptions" :key="o" :value="o">{{ o }}</option>
          </select>
        </div>
      </div>

      <div v-if="filterExpanded" class="filter__row filter__row--auto">
        <div class="filter__field">
          <label>조치자</label>
          <input v-model="filters.assignee" class="filter__input" type="text" placeholder="조치자" />
        </div>
        <div v-if="config.showDeployStatus" class="filter__field">
          <label>배포상태</label>
          <select v-model="filters.deployStatus" class="filter__select">
            <option v-for="o in deployStatusOptions" :key="o" :value="o">{{ o }}</option>
          </select>
        </div>
        <div class="filter__field">
          <label>오류등급</label>
          <select v-model="filters.grade" class="filter__select">
            <option v-for="o in defectGradeOptions" :key="o" :value="o">{{ o }}</option>
          </select>
        </div>
        <div class="filter__field">
          <label>업무범주</label>
          <select v-model="filters.bizCategory" class="filter__select">
            <option v-for="o in bizCategoryOptions" :key="o" :value="o">{{ o }}</option>
          </select>
        </div>
      </div>

      <button type="button" class="filter__expand" @click="filterExpanded = !filterExpanded">
        검색조건
        <span class="filter__expand-icon" :class="{ 'is-open': filterExpanded }">▾</span>
      </button>

      <div class="filter__actions">
        <button type="button" class="btn btn--ghost" @click="resetFilters">초기화</button>
        <button type="button" class="btn btn--primary" @click="search">조회</button>
      </div>
    </section>

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
              <th>차수</th>
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
              <td>{{ row.round }}</td>
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
              <td :colspan="config.showDeployStatus ? 19 : 18" class="empty">조회 결과가 없습니다.</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <BaseModal :visible="showDetail" title="오류 상세" wide @close="showDetail = false">
      <DefectDetailModal :row="detailTarget" :config="config" @save="onDefectSave" />
    </BaseModal>

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

.filter {
  padding: 14px 16px;
  margin-bottom: 12px;
}

.filter__row {
  display: grid;
  gap: 10px;
  margin-bottom: 10px;
}

.filter__row--auto { grid-template-columns: repeat(auto-fit, minmax(140px, 1fr)); }

.filter__field {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.filter__field label {
  font-size: calc(11px + var(--font-size-offset, 0px));
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
  font-size: calc(12px + var(--font-size-offset, 0px));
  background: var(--field);
}

.filter__expand {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  border: none;
  background: none;
  color: var(--teal-600);
  font-size: calc(11.5px + var(--font-size-offset, 0px));
  cursor: pointer;
  padding: 0;
  margin-bottom: 10px;
  font-family: inherit;
}

.filter__expand-icon {
  display: inline-block;
  transition: transform var(--transition-fast);
}

.filter__expand-icon.is-open {
  transform: rotate(180deg);
}

.filter__actions {
  display: flex;
  justify-content: flex-end;
  gap: 8px;
}

.btn {
  height: 32px;
  padding: 0 14px;
  border-radius: 7px;
  font-size: calc(12.5px + var(--font-size-offset, 0px));
  font-weight: 600;
  font-family: inherit;
  cursor: pointer;
  border: 1px solid transparent;
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
  color: var(--ink);
}

.btn--ghost:hover {
  border-color: var(--teal-100);
  color: var(--teal-600);
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
