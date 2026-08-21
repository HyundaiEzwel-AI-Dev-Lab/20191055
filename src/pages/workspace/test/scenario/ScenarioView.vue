<script setup>
// PAG-S-UAT-01 시나리오 관리
import { computed, onMounted, onUnmounted, ref, watch } from 'vue'
import { useRouter } from 'vue-router'
import { useTestContext } from '@/app/composables/useTestContext'
import { bizCategoryOptions, pageSizeOptions, systemOptions } from '@/shared/lib/testConfig'
import {
  scenarioMeta,
  getScenarioList,
  matchScenarioFilters,
} from '@/entities/scenario/mock/scenario'
import ScenarioBulkRegisterModal from '@/pages/workspace/test/scenario/ScenarioBulkRegisterModal.vue'
import TestNoteModal from '@/pages/workspace/test/scenario/TestNoteModal.vue'
import ExcelDownloadButton from '@/shared/ui/ExcelDownloadButton.vue'
import SearchFilterBar from '@/shared/ui/SearchFilterBar.vue'
import FilterSelectPill from '@/shared/ui/FilterSelectPill.vue'
import FilterTextPill from '@/shared/ui/FilterTextPill.vue'
import FilterDateRange from '@/shared/ui/FilterDateRange.vue'
import { mockExcelDownload } from '@/shared/file-excel/excelDownload'
import { addScenarioCases } from '@/entities/scenario/mock/scenario'
import { useAuthStore } from '@/app/stores/auth'

const router = useRouter()
const authStore = useAuthStore()
const { mode, config, pageTitle } = useTestContext()

const rows = ref([])
const filterExpanded = ref(false)
const selectedRound = ref('')
const filters = ref({
  keyword: '',
  system: '전체',
  bizCategory: '전체',
  executionType: '전체',
  dateFrom: '',
  dateTo: '',
  screenKeyword: '',
})
const appliedFilters = ref({ ...filters.value, round: '' })
const pageSize = ref(20)
const currentPage = ref(1)
const expandedIds = ref(new Set())
const expandAll = ref(false)

const showBulkModal = ref(false)
const showCommonNoteModal = ref(false)
const showEditMenu = ref(false)

const roundTabs = computed(() => config.value.roundOptions.filter((r) => r !== '전체'))

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
  rows.value = getScenarioList(mode.value, authStore.user?.id)
  selectedRound.value = roundTabs.value[0]
  appliedFilters.value = { ...filters.value, round: selectedRound.value }
  expandedIds.value = new Set()
  currentPage.value = 1
}

onMounted(loadData)
watch(mode, loadData)

function closeEditMenuOnOutsideClick(e) {
  if (!e.target.closest('.split-btn')) showEditMenu.value = false
}
watch(showEditMenu, (open) => {
  if (open) document.addEventListener('mousedown', closeEditMenuOnOutsideClick)
  else document.removeEventListener('mousedown', closeEditMenuOnOutsideClick)
})
onUnmounted(() => document.removeEventListener('mousedown', closeEditMenuOnOutsideClick))

function resetFilters() {
  filters.value = {
    keyword: '',
    system: '전체',
    bizCategory: '전체',
    executionType: '전체',
    dateFrom: '',
    dateTo: '',
    screenKeyword: '',
  }
  appliedFilters.value = { ...filters.value, round: selectedRound.value }
  currentPage.value = 1
}

function search() {
  appliedFilters.value = { ...filters.value, round: selectedRound.value }
  currentPage.value = 1
  expandedIds.value = new Set()
}

const filterTags = computed(() => {
  const f = appliedFilters.value
  const tags = []
  if (f.system && f.system !== '전체') tags.push({ key: 'system', label: '시스템', value: f.system })
  if (f.bizCategory && f.bizCategory !== '전체') {
    tags.push({ key: 'bizCategory', label: '업무범주', value: f.bizCategory })
  }
  if (f.executionType && f.executionType !== '전체') {
    tags.push({ key: 'executionType', label: '수행구분', value: f.executionType })
  }
  if (f.keyword?.trim()) tags.push({ key: 'keyword', label: '케이스', value: f.keyword })
  if (f.dateFrom || f.dateTo) {
    tags.push({
      key: 'dateRange',
      label: '계획일',
      value: `${f.dateFrom || ''} ~ ${f.dateTo || ''}`,
    })
  }
  if (f.screenKeyword?.trim()) {
    tags.push({ key: 'screenKeyword', label: '요구사항/화면명', value: f.screenKeyword })
  }
  return tags
})

function removeFilterTag(key) {
  if (key === 'dateRange') {
    filters.value.dateFrom = ''
    filters.value.dateTo = ''
  } else if (key === 'keyword' || key === 'screenKeyword') {
    filters.value[key] = ''
  } else {
    filters.value[key] = '전체'
  }
  search()
}

function selectRound(round) {
  selectedRound.value = round
  appliedFilters.value = { ...appliedFilters.value, round }
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
  showEditMenu.value = false
  router.push({
    name: 'scenario-edit',
    params: { mode: mode.value },
    query: { round: selectedRound.value, ...(row ? { caseId: row.caseId } : {}) },
  })
}

function goRequirement(row) {
  if (!row.reqId) return
  router.push({ path: '/workspace/requirement', query: { reqId: row.reqId } })
}

function onCommonNoteSave(text) {
  scenarioMeta.commonNote[mode.value] = text
}

function onBulkRegister() {
  showBulkModal.value = true
}

function onExcelDownload() {
  const label = `시나리오 관리 (${mode.value === 'uat' ? '운영' : 'DEV'})`
  mockExcelDownload(label, filteredList.value, [
    { key: 'reqId', label: '요구사항ID' },
    { key: 'executionType', label: '수행유형' },
    { key: 'systemPath', label: '시스템경로' },
    { key: 'screenPath', label: '화면경로' },
    { key: 'screenName', label: '화면명' },
    { key: 'caseId', label: '케이스ID' },
    { key: 'caseName', label: '케이스명' },
    { key: 'round', label: '차수' },
    { key: 'planDate', label: '계획일' },
    { key: 'stepCount', label: '절차수' },
    { key: 'note', label: '비고' },
  ])
}

function onBulkConfirm(items) {
  addScenarioCases(items, mode.value)
  loadData()
  window.alert(`${items.length}건의 케이스가 등록되었습니다.`)
}
</script>

<template>
  <div class="scenario">
    <div class="scenario__head">
      <div class="scenario__head-left">
        <h1 class="scenario__title">{{ pageTitle }}</h1>
        <div class="round-tabs">
          <button
            v-for="r in roundTabs"
            :key="r"
            type="button"
            class="round-tab"
            :class="{ 'round-tab--on': selectedRound === r }"
            @click="selectRound(r)"
          >
            {{ r }}
          </button>
        </div>
      </div>
      <button
        type="button"
        class="memo-btn"
        title="테스트 참고사항"
        @click="showCommonNoteModal = true"
      >
        📝 테스트 참고사항
      </button>
    </div>

    <SearchFilterBar
      v-model:expanded="filterExpanded"
      v-model:search="filters.keyword"
      search-placeholder="케이스 ID, 케이스명"
      :applied-tags="filterTags"
      @reset="resetFilters"
      @search="search"
      @remove-tag="removeFilterTag"
    >
      <template #primary>
        <FilterSelectPill v-model="filters.system" label="시스템" :options="systemOptions" />
        <FilterSelectPill v-model="filters.bizCategory" label="업무범주" :options="bizCategoryOptions" />
        <FilterSelectPill
          v-model="filters.executionType"
          label="수행구분"
          :options="config.executionTypeOptions"
        />
      </template>
      <template #expand>
        <FilterDateRange
          label="계획일"
          :from="filters.dateFrom"
          :to="filters.dateTo"
          @update:from="filters.dateFrom = $event"
          @update:to="filters.dateTo = $event"
        />
        <FilterTextPill
          v-model="filters.screenKeyword"
          label="요구사항/화면명"
          placeholder="화면명, 요구사항 ID"
        />
      </template>
    </SearchFilterBar>

    <div class="toolbar">
      <span class="toolbar__count">총 <b>{{ filteredList.length }}</b>건</span>
      <select v-model="pageSize" class="toolbar__mini" @change="currentPage = 1">
        <option v-for="n in pageSizeOptions" :key="n" :value="n">{{ n }}건씩 보기</option>
      </select>
      <button type="button" class="toolbar__mini" @click="toggleExpandAll">
        {{ allExpandedOnPage ? '전체접기' : '전체열기' }}
      </button>
      <div class="toolbar__spacer" />
      <div class="split-btn">
        <button type="button" class="split-btn__main" @click="onBulkRegister">일괄등록</button>
        <button
          type="button"
          class="split-btn__toggle"
          :class="{ 'split-btn__toggle--on': showEditMenu }"
          @click="showEditMenu = !showEditMenu"
        >
          ▾
        </button>
        <div v-if="showEditMenu" class="split-btn__menu">
          <button type="button" class="split-btn__item" @click="openEdit()">시나리오 편집</button>
        </div>
      </div>
      <ExcelDownloadButton @click="onExcelDownload" />
    </div>

    <div class="listcard">
      <div class="listcard__scroll">
        <table class="data-table">
          <thead>
            <tr>
              <th class="col-expand"></th>
              <th class="col-no">No</th>
              <th>요구사항 ID</th>
              <th>수행구분</th>
              <th>시스템/업무</th>
              <th>화면경로</th>
              <th>화면명</th>
              <th>케이스 ID</th>
              <th>케이스명</th>
              <th>절차</th>
            </tr>
          </thead>
          <tbody>
            <template v-for="(row, idx) in pagedList" :key="row.id">
              <tr
                class="main-row"
                :class="{
                  'main-row--open': expandedIds.has(row.id),
                  'main-row--req-rejected': row.wbsExcluded,
                }"
              >
                <td>
                  <button type="button" class="expand-btn" @click="toggleExpand(row.id)">
                    {{ expandedIds.has(row.id) ? '▲' : '▼' }}
                  </button>
                </td>
                <td class="col-no">{{ (currentPage - 1) * pageSize + idx + 1 }}</td>
                <td>
                  <button v-if="row.reqId" type="button" class="link-btn" @click="goRequirement(row)">
                    {{ row.reqId }}
                  </button>
                  <span v-else>-</span>
                </td>
                <td>{{ row.executionType }}</td>
                <td>{{ row.systemPath || '-' }}</td>
                <td>{{ row.screenPath || '-' }}</td>
                <td>{{ row.screenName || '-' }}</td>
                <td>{{ row.caseId || '-' }}</td>
                <td>
                  <button type="button" class="name-link" @click="toggleExpand(row.id)">
                    {{ row.caseName || '미등록' }}
                  </button>
                  <span v-if="row.wbsExcluded" class="badge badge--danger lock-badge">작업제외</span>
                </td>
                <td>{{ row.stepCount || 0 }}</td>
              </tr>
              <tr v-if="expandedIds.has(row.id)" class="detail-row">
                <td colspan="10">
                  <div class="step-panel">
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
              <td colspan="11" class="empty">조회 결과가 없습니다.</td>
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
    <TestNoteModal
      v-model="showCommonNoteModal"
      anchor-top-right
      :note="scenarioMeta.commonNote[mode]"
      @save="onCommonNoteSave"
    />
  </div>
</template>

<style scoped>
.scenario {
  padding: 14px 18px 28px;
  color: var(--ink);
  font-size: calc(13px + var(--font-size-offset, 0px));
}

.scenario__head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin: 0 0 14px;
}

.scenario__head-left {
  display: flex;
  align-items: center;
  gap: 16px;
}

.scenario__title {
  font-size: calc(18px + var(--font-size-offset, 0px));
  font-weight: 700;
  margin: 0;
}

.round-tabs {
  display: flex;
  gap: 4px;
}

.round-tab {
  height: 30px;
  padding: 0 14px;
  border: 1px solid var(--line);
  border-radius: 999px;
  background: var(--lnb-side);
  color: var(--ink-2);
  font-size: calc(12px + var(--font-size-offset, 0px));
  font-weight: 600;
  cursor: pointer;
  font-family: inherit;
}

.round-tab--on {
  background: var(--teal);
  border-color: var(--teal);
  color: var(--color-text-inverse);
}

.memo-btn {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  height: 32px;
  padding: 0 12px;
  border: 1px solid var(--line);
  border-radius: 7px;
  background: var(--lnb-side);
  color: var(--ink);
  font-weight: 600;
  font-size: calc(12px + var(--font-size-offset, 0px));
  cursor: pointer;
  font-family: inherit;
}

.memo-btn:hover {
  border-color: var(--teal-100);
  color: var(--teal-600);
}

.toolbar {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 10px;
  flex-wrap: wrap;
}

.toolbar__count { font-size: calc(12px + var(--font-size-offset, 0px)); color: var(--ink-2); }
.toolbar__count b { color: var(--teal-600); }
.toolbar__mini {
  height: 24px;
  padding: 0 8px;
  border: 1px solid var(--line);
  border-radius: 6px;
  background: var(--lnb-side);
  color: var(--ink);
  font-size: calc(11.5px + var(--font-size-offset, 0px));
  font-family: inherit;
  cursor: pointer;
}
.toolbar__spacer { flex: 1; }

.split-btn {
  position: relative;
  display: flex;
  height: 28px;
  border-radius: 7px;
  overflow: visible;
}

.split-btn__main,
.split-btn__toggle {
  border: none;
  background: var(--teal);
  color: var(--color-text-inverse);
  cursor: pointer;
  font-family: inherit;
  font-weight: 600;
}

.split-btn__main {
  padding: 0 12px;
  font-size: calc(12px + var(--font-size-offset, 0px));
  border-radius: 7px 0 0 7px;
  border-right: 1px solid rgba(255, 255, 255, 0.3);
}

.split-btn__main:hover,
.split-btn__toggle:hover {
  background: var(--teal-600);
}

.split-btn__toggle {
  width: 26px;
  border-radius: 0 7px 7px 0;
  font-size: calc(11px + var(--font-size-offset, 0px));
}

.split-btn__toggle--on {
  background: var(--teal-600);
}

.split-btn__menu {
  position: absolute;
  top: calc(100% + 4px);
  right: 0;
  z-index: 10;
  min-width: 140px;
  padding: 4px;
  border: 1px solid var(--line);
  border-radius: 8px;
  background: var(--lnb-side);
  box-shadow: var(--shadow-md, 0 4px 12px rgba(0, 0, 0, 0.12));
}

.split-btn__item {
  display: block;
  width: 100%;
  padding: 8px 10px;
  border: none;
  border-radius: 6px;
  background: none;
  color: var(--ink);
  text-align: left;
  font-size: calc(12px + var(--font-size-offset, 0px));
  cursor: pointer;
  font-family: inherit;
}

.split-btn__item:hover {
  background: var(--teal-50);
  color: var(--teal-600);
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

.col-expand { width: 36px; }
.col-no { width: 40px; text-align: center !important; }

.name-link {
  border: none;
  background: none;
  color: var(--ink);
  font-weight: 600;
  cursor: pointer;
  font-family: inherit;
  font-size: inherit;
  text-align: left;
  padding: 0;
}

.name-link:hover {
  color: var(--teal-600);
  text-decoration: underline;
}

.expand-btn {
  border: none;
  background: none;
  cursor: pointer;
  font-size: calc(10px + var(--font-size-offset, 0px));
  color: var(--muted);
}

.main-row--open { background: var(--teal-50); }

.main-row--req-rejected td {
  text-decoration: line-through;
  color: var(--muted);
}

.main-row--req-rejected .name-link {
  text-decoration: line-through;
  color: var(--muted);
}

.lock-badge { margin-left: 6px; }

.detail-row td {
  padding: 0;
  background: var(--lnb-hover);
}

.step-panel { padding: 12px 16px 16px 48px; }

.inner-table {
  width: 100%;
  border-collapse: collapse;
  font-size: calc(11px + var(--font-size-offset, 0px));
  background: var(--lnb-side);
  table-layout: fixed;
}

.inner-table th,
.inner-table td {
  padding: 6px 10px;
  border: 1px solid var(--line);
  background: var(--lnb-side);
}

.inner-table th { background: var(--field); }

.inner-table th:first-child,
.inner-table td:first-child {
  width: 48px;
  text-align: center;
}

.inner-table th:nth-child(2),
.inner-table th:nth-child(3) {
  width: calc(50% - 24px);
}

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
  background: var(--lnb-side);
  font-size: calc(12px + var(--font-size-offset, 0px));
  cursor: pointer;
  font-family: inherit;
}

.pager__btn:disabled { opacity: 0.4; cursor: not-allowed; }
.pager__info { font-size: calc(12px + var(--font-size-offset, 0px)); color: var(--ink-2); }
</style>
