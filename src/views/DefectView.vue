<script setup>
// PAG-S-UAT-14 결함관리
import { computed, onMounted, ref, watch } from 'vue'
import { useRoute } from 'vue-router'
import { useTestContext } from '@/composables/useTestContext'
import {
  defectStatusOptions,
  defectGradeOptions,
  deployStatusOptions,
  bizCategoryOptions,
  pageSizeOptions,
  defectStatusClass,
} from '@/data/testConfig'
import { getDefectList, matchDefectFilters, computeDefectKpi, updateDefect } from '@/data/testDefect'
import DefectDetailModal from '@/components/test/DefectDetailModal.vue'
import ExcelDownloadButton from '@/components/ui/ExcelDownloadButton.vue'
import { mockExcelDownload } from '@/utils/excelDownload'
import { useAuthStore } from '@/stores/auth'

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

const detailTarget = ref(null)

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
  detailTarget.value = filteredList.value[0] || null
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
    detailTarget.value = filteredList.value[0] || null
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
  detailTarget.value = filteredList.value[0] || null
}

function openDetail(row) {
  detailTarget.value = row
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
          <input v-model="filters.keyword" class="filter__input" type="text" placeholder="결함 ID, 제목" />
        </div>
        <div class="filter__field">
          <label>차수</label>
          <select v-model="filters.round" class="filter__select">
            <option v-for="o in config.roundOptions" :key="o" :value="o">{{ o }}</option>
          </select>
        </div>
        <div class="filter__field">
          <label>업무범주</label>
          <select v-model="filters.bizCategory" class="filter__select">
            <option v-for="o in bizCategoryOptions" :key="o" :value="o">{{ o }}</option>
          </select>
        </div>
        <div class="filter__field">
          <label>조치상태</label>
          <select v-model="filters.status" class="filter__select">
            <option v-for="o in defectStatusOptions" :key="o" :value="o">{{ o }}</option>
          </select>
        </div>
        <div class="filter__field">
          <label>오류등급</label>
          <select v-model="filters.grade" class="filter__select">
            <option v-for="o in defectGradeOptions" :key="o" :value="o">{{ o }}</option>
          </select>
        </div>
        <div v-if="config.showDeployStatus" class="filter__field">
          <label>배포상태</label>
          <select v-model="filters.deployStatus" class="filter__select">
            <option v-for="o in deployStatusOptions" :key="o" :value="o">{{ o }}</option>
          </select>
        </div>
        <div class="filter__field">
          <label>등록자</label>
          <input v-model="filters.tester" class="filter__input" type="text" placeholder="등록자" />
        </div>
        <div class="filter__field">
          <label>조치자</label>
          <input v-model="filters.assignee" class="filter__input" type="text" placeholder="조치자" />
        </div>
      </div>
      <div class="filter__actions">
        <button type="button" class="btn btn--ghost" @click="resetFilters">초기화</button>
        <button type="button" class="btn btn--primary" @click="search">조회</button>
      </div>
    </section>

    <div class="kpi-bar">
      <span class="kpi-chip">전체 <b>{{ kpi.total }}</b></span>
      <span class="kpi-chip">접수 <b>{{ kpi.received }}</b></span>
      <span class="kpi-chip">처리예정 <b>{{ kpi.scheduled }}</b></span>
      <span class="kpi-chip kpi-chip--ok">처리완료 <b>{{ kpi.done }}</b></span>
      <span class="kpi-chip">오류아님 <b>{{ kpi.notError }}</b></span>
      <span class="kpi-chip">수정제외 <b>{{ kpi.excluded }}</b></span>
    </div>

    <div class="toolbar">
      <span class="toolbar__count">총 <b>{{ filteredList.length }}</b>건</span>
      <select v-model="pageSize" class="toolbar__mini" @change="currentPage = 1">
        <option v-for="n in pageSizeOptions" :key="n" :value="n">{{ n }}건씩 보기</option>
      </select>
      <ExcelDownloadButton @click="onExcelDownload" />
    </div>

    <div class="listcard">
      <div class="listcard__scroll">
        <table class="data-table">
          <thead>
            <tr>
              <th class="col-no">No</th>
              <th>결함 ID</th>
              <th>시스템/업무/화면경로</th>
              <th>케이스</th>
              <th>케이스명</th>
              <th>화면명</th>
              <th>차수</th>
              <th>절차</th>
              <th>결함 제목</th>
              <th>등급</th>
              <th>결과</th>
              <th v-if="config.showOccurrencePhase">발생시점</th>
              <th v-if="config.showDeployStatus">배포상태</th>
              <th>조치상태</th>
              <th>조치예정일</th>
              <th>테스터</th>
              <th>담당자</th>
              <th>등록일</th>
              <th>최종수정자</th>
              <th>최종수정일</th>
              <th>상세</th>
            </tr>
          </thead>
          <tbody>
            <tr
              v-for="(row, idx) in pagedList"
              :key="row.id"
              :class="{ 'is-selected': detailTarget?.id === row.id }"
              @click="openDetail(row)"
            >
              <td class="col-no">{{ (currentPage - 1) * pageSize + idx + 1 }}</td>
              <td>{{ row.defectId }}</td>
              <td>{{ row.systemPath || '-' }}</td>
              <td>{{ row.caseId }}</td>
              <td>{{ row.caseName }}</td>
              <td>{{ row.screenName }}</td>
              <td>{{ row.round }}</td>
              <td>{{ row.stepNo }}</td>
              <td>{{ row.title }}</td>
              <td><span class="grade" :class="`grade--${row.grade.toLowerCase()}`">{{ row.grade }}</span></td>
              <td>{{ row.result }}</td>
              <td v-if="config.showOccurrencePhase">{{ row.occurrencePhase }}</td>
              <td v-if="config.showDeployStatus">{{ row.deployStatus }}</td>
              <td>
                <span class="badge" :class="`badge--${defectStatusClass(row.status)}`">{{ row.status }}</span>
              </td>
              <td>{{ row.dueDate || '-' }}</td>
              <td>{{ row.tester }}</td>
              <td>{{ row.assignee }}</td>
              <td>{{ row.registeredAt }}</td>
              <td>{{ row.updatedBy || '-' }}</td>
              <td>{{ row.updatedAt || '-' }}</td>
              <td @click.stop>
                <button type="button" class="link-btn" @click="openDetail(row)">보기</button>
              </td>
            </tr>
            <tr v-if="!pagedList.length">
              <td :colspan="config.showDeployStatus ? 21 : 19" class="empty">조회 결과가 없습니다.</td>
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

    <DefectDetailModal :row="detailTarget" :config="config" @save="onDefectSave" />
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

.filter__actions {
  display: flex;
  justify-content: flex-end;
  gap: 8px;
}

.kpi-bar {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin-bottom: 12px;
}

.kpi-chip {
  padding: 6px 12px;
  background: var(--lnb-side);
  border: 1px solid var(--line);
  border-radius: 999px;
  font-size: calc(11px + var(--font-size-offset, 0px));
}

.kpi-chip b { margin-left: 4px; }
.kpi-chip--ok b { color: var(--green); }
.kpi-chip--err b { color: var(--red); }

.toolbar {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 10px;
}

.toolbar__count { font-size: calc(12px + var(--font-size-offset, 0px)); }
.toolbar__count b { color: var(--teal-600); }

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
}

.data-table tbody tr {
  cursor: pointer;
}

.data-table tbody tr.is-selected td {
  background: var(--teal-50);
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
