<script setup>
// PAG-S-UAT-14 결함관리
import { computed, onMounted, ref, watch } from 'vue'
import { useTestContext } from '@/composables/useTestContext'
import {
  defectStatusOptions,
  defectGradeOptions,
  deployStatusOptions,
  pageSizeOptions,
  defectStatusClass,
} from '@/data/testConfig'
import { getDefectList, matchDefectFilters, computeDefectKpi, updateDefect } from '@/data/testDefect'
import DefectDetailModal from '@/components/test/DefectDetailModal.vue'
import ExcelDownloadButton from '@/components/ui/ExcelDownloadButton.vue'
import { mockExcelDownload } from '@/utils/excelDownload'

const { mode, config, pageTitle } = useTestContext()

const rows = ref([])
const filters = ref({
  keyword: '',
  round: '전체',
  status: '전체',
  grade: '전체',
  deployStatus: '전체',
})
const appliedFilters = ref({ ...filters.value })
const pageSize = ref(20)
const currentPage = ref(1)

const showDetailModal = ref(false)
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
  rows.value = getDefectList(mode.value)
  currentPage.value = 1
}

onMounted(loadData)
watch(mode, loadData)

function resetFilters() {
  filters.value = {
    keyword: '',
    round: '전체',
    status: '전체',
    grade: '전체',
    deployStatus: '전체',
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
  showDetailModal.value = true
}

function onDefectSave(updates) {
  if (!detailTarget.value) return
  updateDefect(detailTarget.value.id, updates)
  loadData()
  const updated = rows.value.find((r) => r.id === detailTarget.value.id)
  if (updated) detailTarget.value = updated
}

function onExcelDownload() {
  const label = `결함 관리 (${mode.value === 'uat' ? '운영' : 'DEV'})`
  mockExcelDownload(label, filteredList.value, [
    { key: 'defectId', label: '결함ID' },
    { key: 'caseId', label: '케이스' },
    { key: 'screenName', label: '화면명' },
    { key: 'round', label: '차수' },
    { key: 'stepNo', label: '절차' },
    { key: 'title', label: '결함제목' },
    { key: 'grade', label: '등급' },
    { key: 'occurrencePhase', label: '발생시점' },
    { key: 'deployStatus', label: '배포상태' },
    { key: 'status', label: '조치상태' },
    { key: 'tester', label: '테스터' },
    { key: 'assignee', label: '담당자' },
    { key: 'registeredAt', label: '등록일' },
  ])
}
</script>

<template>
  <div class="defect">
    <h1 class="defect__title">{{ pageTitle }}</h1>

    <section class="filter card">
      <div class="filter__row" :class="config.showDeployStatus ? 'filter__row--5' : 'filter__row--4'">
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
              <th>결함 ID</th>
              <th>케이스</th>
              <th>화면명</th>
              <th>차수</th>
              <th>절차</th>
              <th>결함 제목</th>
              <th>등급</th>
              <th v-if="config.showOccurrencePhase">발생시점</th>
              <th v-if="config.showDeployStatus">배포상태</th>
              <th>조치상태</th>
              <th>테스터</th>
              <th>담당자</th>
              <th>등록일</th>
              <th>상세</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="row in pagedList" :key="row.id">
              <td>{{ row.defectId }}</td>
              <td>{{ row.caseId }}</td>
              <td>{{ row.screenName }}</td>
              <td>{{ row.round }}</td>
              <td>{{ row.stepNo }}</td>
              <td>{{ row.title }}</td>
              <td><span class="grade" :class="`grade--${row.grade.toLowerCase()}`">{{ row.grade }}</span></td>
              <td v-if="config.showOccurrencePhase">{{ row.occurrencePhase }}</td>
              <td v-if="config.showDeployStatus">{{ row.deployStatus }}</td>
              <td>
                <span class="badge" :class="`badge--${defectStatusClass(row.status)}`">{{ row.status }}</span>
              </td>
              <td>{{ row.tester }}</td>
              <td>{{ row.assignee }}</td>
              <td>{{ row.registeredAt }}</td>
              <td>
                <button type="button" class="link-btn" @click="openDetail(row)">보기</button>
              </td>
            </tr>
            <tr v-if="!pagedList.length">
              <td :colspan="config.showDeployStatus ? 14 : 12" class="empty">조회 결과가 없습니다.</td>
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

    <DefectDetailModal
      :visible="showDetailModal"
      :row="detailTarget"
      :config="config"
      @close="showDetailModal = false"
      @save="onDefectSave"
    />
  </div>
</template>

<style scoped>
.defect__title {
  font-size: 18px;
  font-weight: 700;
  margin: 0 0 14px;
}

.filter__row {
  display: grid;
  gap: 10px;
  margin-bottom: 10px;
}

.filter__row--4 { grid-template-columns: repeat(4, 1fr); }
.filter__row--5 { grid-template-columns: repeat(5, 1fr); }

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
  background: #fff;
  border: 1px solid var(--line);
  border-radius: 999px;
  font-size: 11px;
}

.kpi-chip b { margin-left: 4px; }
.kpi-chip--ok b { color: #1a7f4b; }
.kpi-chip--err b { color: #c0392b; }

.toolbar {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 10px;
}

.toolbar__count { font-size: 12px; }
.toolbar__count b { color: var(--teal-600); }

.toolbar__mini {
  height: 24px;
  padding: 0 8px;
  border: 1px solid var(--line);
  border-radius: 6px;
  font-size: 11.5px;
  font-family: inherit;
}

.listcard {
  background: #fff;
  border: 1px solid var(--line);
  border-radius: 10px;
  overflow: hidden;
}

.listcard__scroll { overflow-x: auto; }

.data-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 12px;
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

.grade { font-weight: 600; font-size: 11px; }
.grade--critical { color: #c0392b; }
.grade--major { color: #e67e22; }
.grade--minor { color: #5a6a7a; }

.badge {
  display: inline-block;
  padding: 2px 8px;
  border-radius: 999px;
  font-size: 11px;
  font-weight: 600;
}

.badge--ok { background: #e8f5ee; color: #1a7f4b; }
.badge--err { background: #fdecea; color: #c0392b; }
.badge--wait { background: #eef2f6; color: #5a6a7a; }
.badge--prog { background: #e8f0fe; color: #1a56db; }

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
  background: #fff;
  font-size: 12px;
  cursor: pointer;
  font-family: inherit;
}

.pager__btn:disabled { opacity: 0.4; cursor: not-allowed; }
.pager__info { font-size: 12px; }
</style>
