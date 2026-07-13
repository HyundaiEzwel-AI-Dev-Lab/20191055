<script setup>
// PAG-S-UAT-01 시나리오 관리
import { computed, onMounted, ref, watch } from 'vue'
import { useRouter } from 'vue-router'
import { useTestContext } from '@/composables/useTestContext'
import { bizCategoryOptions, pageSizeOptions } from '@/data/testConfig'
import { scenarioMeta, getScenarioList, matchScenarioFilters } from '@/data/scenario'
import ScenarioBulkRegisterModal from '@/components/test/ScenarioBulkRegisterModal.vue'
import ExcelDownloadButton from '@/components/ui/ExcelDownloadButton.vue'
import { mockExcelDownload } from '@/utils/excelDownload'
import { addScenarioCases } from '@/data/scenario'

const router = useRouter()
const { mode, config, pageTitle } = useTestContext()

const rows = ref([])
const filterExpanded = ref(false)
const filters = ref({
  keyword: '',
  bizCategory: '전체',
  round: '전체',
  executionType: '전체',
  dateFrom: '',
  dateTo: '',
  screenKeyword: '',
})
const appliedFilters = ref({ ...filters.value })
const pageSize = ref(20)
const currentPage = ref(1)
const expandedIds = ref(new Set())
const expandAll = ref(false)

const showBulkModal = ref(false)

const filteredList = computed(() =>
  rows.value.filter((row) => matchScenarioFilters(row, appliedFilters.value, config.value)),
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

function loadData() {
  rows.value = getScenarioList(mode.value)
  expandedIds.value = new Set()
  currentPage.value = 1
}

onMounted(loadData)
watch(mode, loadData)

function resetFilters() {
  filters.value = {
    keyword: '',
    bizCategory: '전체',
    round: '전체',
    executionType: '전체',
    dateFrom: '',
    dateTo: '',
    screenKeyword: '',
  }
  appliedFilters.value = { ...filters.value }
  currentPage.value = 1
}

function search() {
  appliedFilters.value = { ...filters.value }
  currentPage.value = 1
  expandedIds.value = new Set()
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
  if (allExpandedOnPage.value) {
    expandedIds.value = new Set()
    expandAll.value = false
  } else {
    expandedIds.value = new Set(pagedList.value.map((r) => r.id))
    expandAll.value = true
  }
}

function openEdit(row) {
  router.push({
    name: 'scenario-edit',
    params: { mode: mode.value },
    query: row ? { caseId: row.caseId } : {},
  })
}

function onBulkRegister() {
  showBulkModal.value = true
}

function onExcelDownload() {
  mockExcelDownload(`시나리오 관리 (${mode.value === 'uat' ? '운영' : 'DEV'})`, filteredList.value.length)
}

function onBulkConfirm(items) {
  addScenarioCases(items, mode.value)
  loadData()
  window.alert(`${items.length}건의 케이스가 등록되었습니다.`)
}
</script>

<template>
  <div class="scenario">
    <h1 class="scenario__title">{{ pageTitle }}</h1>

    <section class="filter card">
      <div class="filter__row filter__row--4">
        <div class="filter__field">
          <label>케이스 검색</label>
          <input
            v-model="filters.keyword"
            class="filter__input"
            type="text"
            placeholder="케이스 ID, 케이스명"
          />
        </div>
        <div class="filter__field">
          <label>업무범주</label>
          <select v-model="filters.bizCategory" class="filter__select">
            <option v-for="o in bizCategoryOptions" :key="o" :value="o">{{ o }}</option>
          </select>
        </div>
        <div class="filter__field">
          <label>차수</label>
          <select v-model="filters.round" class="filter__select">
            <option v-for="o in config.roundOptions" :key="o" :value="o">{{ o }}</option>
          </select>
        </div>
        <div class="filter__field">
          <label>수행구분</label>
          <select v-model="filters.executionType" class="filter__select">
            <option v-for="o in config.executionTypeOptions" :key="o" :value="o">{{ o }}</option>
          </select>
        </div>
      </div>

      <div v-if="filterExpanded" class="filter__row filter__row--3">
        <div class="filter__field filter__field--range">
          <label>계획일</label>
          <div class="filter__range">
            <input v-model="filters.dateFrom" class="filter__input" type="date" />
            <span>~</span>
            <input v-model="filters.dateTo" class="filter__input" type="date" />
          </div>
        </div>
        <div class="filter__field">
          <label>요구사항/화면명</label>
          <input
            v-model="filters.screenKeyword"
            class="filter__input"
            type="text"
            placeholder="화면명, 요구사항 ID"
          />
        </div>
      </div>

      <button type="button" class="filter__expand" @click="filterExpanded = !filterExpanded">
        {{ filterExpanded ? '▲ 검색조건 접기' : '＋ 검색조건 확장' }}
      </button>

      <div class="filter__actions">
        <button type="button" class="btn btn--ghost" @click="resetFilters">초기화</button>
        <button type="button" class="btn btn--primary" @click="search">조회</button>
      </div>
    </section>

    <p class="notice card">{{ scenarioMeta.notice }}</p>

    <div class="toolbar">
      <span class="toolbar__count">총 <b>{{ filteredList.length }}</b>건</span>
      <select v-model="pageSize" class="toolbar__mini" @change="currentPage = 1">
        <option v-for="n in pageSizeOptions" :key="n" :value="n">{{ n }}건씩 보기</option>
      </select>
      <button type="button" class="toolbar__mini" @click="toggleExpandAll">
        {{ allExpandedOnPage ? '전체접기' : '전체열기' }}
      </button>
      <ExcelDownloadButton @click="onExcelDownload" />
      <div class="toolbar__spacer" />
      <button type="button" class="btn btn--ghost btn--sm" @click="openEdit()">시나리오 편집</button>
      <button type="button" class="btn btn--primary btn--sm" @click="onBulkRegister">일괄등록</button>
    </div>

    <div class="listcard">
      <div class="listcard__scroll">
        <table class="data-table">
          <thead>
            <tr>
              <th class="col-expand"></th>
              <th>요구사항 ID</th>
              <th>수행구분</th>
              <th>시스템/업무</th>
              <th>화면경로</th>
              <th>화면명</th>
              <th>케이스 ID</th>
              <th>케이스명</th>
              <th>절차</th>
              <th>편집</th>
            </tr>
          </thead>
          <tbody>
            <template v-for="row in pagedList" :key="row.id">
              <tr class="main-row" :class="{ 'main-row--open': expandedIds.has(row.id) }">
                <td>
                  <button type="button" class="expand-btn" @click="toggleExpand(row.id)">
                    {{ expandedIds.has(row.id) ? '▼' : '▶' }}
                  </button>
                </td>
                <td>{{ row.reqId }}</td>
                <td>{{ row.executionType }}</td>
                <td>{{ row.systemPath }}</td>
                <td>{{ row.screenPath }}</td>
                <td>{{ row.screenName }}</td>
                <td>{{ row.caseId }}</td>
                <td>{{ row.caseName }}</td>
                <td>{{ row.stepCount }}</td>
                <td>
                  <button type="button" class="link-btn" @click="openEdit(row)">편집</button>
                </td>
              </tr>
              <tr v-if="expandedIds.has(row.id)" class="detail-row">
                <td colspan="10">
                  <div class="step-panel">
                    <p v-if="row.note" class="step-note">참고: {{ row.note }}</p>
                    <table class="inner-table">
                      <thead>
                        <tr>
                          <th>No</th>
                          <th>절차</th>
                          <th>예상결과</th>
                        </tr>
                      </thead>
                      <tbody>
                        <tr v-for="s in row.steps" :key="s.no">
                          <td>{{ s.no }}</td>
                          <td>{{ s.procedure }}</td>
                          <td>{{ s.expected }}</td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </td>
              </tr>
            </template>
            <tr v-if="!pagedList.length">
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

    <ScenarioBulkRegisterModal
      :visible="showBulkModal"
      :mode="mode"
      @close="showBulkModal = false"
      @register="onBulkConfirm"
    />
  </div>
</template>

<style scoped>
.scenario__title {
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
.filter__row--3 { grid-template-columns: 1.2fr 1fr; }

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

.filter__range .filter__input { flex: 1; }

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
}

.toolbar {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 10px;
  flex-wrap: wrap;
}

.toolbar__count { font-size: 12px; color: var(--ink-2); }
.toolbar__count b { color: var(--teal-600); }
.toolbar__mini {
  height: 24px;
  padding: 0 8px;
  border: 1px solid var(--line);
  border-radius: 6px;
  background: #fff;
  font-size: 11.5px;
  font-family: inherit;
  cursor: pointer;
}
.toolbar__spacer { flex: 1; }

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

.col-expand { width: 36px; }

.expand-btn {
  border: none;
  background: none;
  cursor: pointer;
  font-size: 10px;
  color: var(--muted);
}

.main-row--open { background: var(--teal-50); }

.detail-row td {
  padding: 0;
  background: #fafbfc;
}

.step-panel { padding: 12px 16px 16px 48px; }

.step-note {
  margin: 0 0 8px;
  font-size: 11px;
  color: var(--teal-600);
}

.inner-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 11px;
}

.inner-table th,
.inner-table td {
  padding: 6px 10px;
  border: 1px solid var(--line);
}

.inner-table th { background: #fff; }

.link-btn {
  border: none;
  background: none;
  color: var(--teal-600);
  font-weight: 600;
  cursor: pointer;
  font-family: inherit;
  font-size: inherit;
  text-decoration: underline;
}

.empty { text-align: center !important; color: var(--muted); padding: 24px !important; }

.pager {
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 12px;
  margin-top: 12px;
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
.pager__info { font-size: 12px; color: var(--ink-2); }
</style>
