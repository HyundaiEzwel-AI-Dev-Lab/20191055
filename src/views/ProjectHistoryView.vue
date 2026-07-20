<script setup>
// PAG-M-PST-03 / PAG-S-INF-05 프로젝트 변경이력 (통합·개별 공용)
import { computed, onMounted, ref, watch } from 'vue'
import { useRoute } from 'vue-router'
import { useProjectStore } from '@/stores/project'
import {
  changeCategoryOptions,
  changePeriodOptions,
  pageSizeOptions,
  historyDevDeptOptions,
  getProjectHistory,
  getAllProjectHistory,
  matchHistoryFilters,
  splitDateTime,
} from '@/data/projectHistory'
import ProjectHistoryDetailModal from '@/components/project/ProjectHistoryDetailModal.vue'
import ExcelDownloadButton from '@/components/ui/ExcelDownloadButton.vue'
import { mockExcelDownload } from '@/utils/excelDownload'

const route = useRoute()
const projectStore = useProjectStore()

/** 통합관리 진입 시 전체, 프로젝트 메뉴 진입 시 현재 프로젝트만 */
const isIntegrated = computed(() => route.name === 'project-history')

const rows = ref([])
const filters = ref(createDefaultFilters())
const appliedFilters = ref({ ...filters.value })
const pageSize = ref(20)
const currentPage = ref(1)
const expandedId = ref(null)
const detailTarget = ref(null)
const showDetailModal = ref(false)

const colSpan = computed(() => (isIntegrated.value ? 7 : 5))

const filteredList = computed(() =>
  rows.value.filter((row) => matchHistoryFilters(row, appliedFilters.value)),
)

const pagedList = computed(() => {
  const start = (currentPage.value - 1) * pageSize.value
  return filteredList.value.slice(start, start + pageSize.value)
})

const totalPages = computed(() =>
  Math.max(1, Math.ceil(filteredList.value.length / pageSize.value)),
)

function createDefaultFilters() {
  return {
    category: '전체',
    period: '1m',
    keyword: '',
    projectQuery: '',
    devDept: '전체',
  }
}

function loadData() {
  if (isIntegrated.value) {
    rows.value = getAllProjectHistory()
  } else {
    const project = projectStore.currentProject
    rows.value = project?.id ? getProjectHistory(project.id, project.name) : []
  }
  expandedId.value = null
  currentPage.value = 1
}

onMounted(loadData)
watch(() => route.name, loadData)
watch(() => projectStore.currentProject?.id, () => {
  if (!isIntegrated.value) loadData()
})

function resetFilters() {
  filters.value = createDefaultFilters()
  appliedFilters.value = { ...filters.value }
  currentPage.value = 1
  expandedId.value = null
}

function search() {
  appliedFilters.value = { ...filters.value }
  currentPage.value = 1
  expandedId.value = null
}

function toggleExpand(id) {
  expandedId.value = expandedId.value === id ? null : id
}

function openDetail(row) {
  detailTarget.value = row
  showDetailModal.value = true
}

function onExcelDownload() {
  const cols = [
    ...(isIntegrated.value
      ? [
          { key: 'projectCode', label: '프로젝트ID' },
          { key: 'projectName', label: '프로젝트명' },
          { key: 'devDept', label: '담당개발부서' },
        ]
      : []),
    { key: 'category', label: '변경구분' },
    { key: 'item', label: '변경항목' },
    { key: 'changedAt', label: '변경일시' },
    { key: 'changedBy', label: '변경자' },
    { key: 'changedByDept', label: '부서' },
    { key: 'changeSummary', label: '변경내용' },
  ]
  mockExcelDownload(
    isIntegrated.value ? '프로젝트 변경이력(전체)' : '프로젝트 변경이력',
    filteredList.value.map((row) => ({
      ...row,
      changeSummary: (row.changeLines || [])
        .map((line) => `${line.label}: ${line.before || '-'} → ${line.after || '-'}`)
        .join(' / '),
    })),
    cols,
  )
}

function displayNo(index) {
  return filteredList.value.length - ((currentPage.value - 1) * pageSize.value + index)
}
</script>

<template>
  <div class="project-history">
    <section class="filter card">
      <div class="filter__row" :class="isIntegrated ? 'filter__row--4' : 'filter__row--3'">
        <div class="filter__field">
          <label>변경구분</label>
          <select v-model="filters.category" class="filter__select">
            <option v-for="o in changeCategoryOptions" :key="o" :value="o">{{ o }}</option>
          </select>
        </div>
        <div class="filter__field">
          <label>변경일</label>
          <select v-model="filters.period" class="filter__select">
            <option v-for="o in changePeriodOptions" :key="o.value" :value="o.value">
              {{ o.label }}
            </option>
          </select>
        </div>
        <div v-if="isIntegrated" class="filter__field">
          <label>프로젝트</label>
          <input
            v-model="filters.projectQuery"
            class="filter__input"
            type="text"
            placeholder="프로젝트명 or 프로젝트ID 입력"
            @keyup.enter="search"
          />
        </div>
        <div v-if="isIntegrated" class="filter__field">
          <label>담당개발부서</label>
          <select v-model="filters.devDept" class="filter__select">
            <option v-for="o in historyDevDeptOptions" :key="o" :value="o">{{ o }}</option>
          </select>
        </div>
        <div v-if="!isIntegrated" class="filter__field">
          <label>변경항목</label>
          <input
            v-model="filters.keyword"
            class="filter__input"
            type="text"
            placeholder="변경항목, 변경자 검색"
            @keyup.enter="search"
          />
        </div>
      </div>
      <div class="filter__actions">
        <button type="button" class="btn btn--ghost" @click="resetFilters">초기화</button>
        <button type="button" class="btn btn--primary" @click="search">조회</button>
      </div>
    </section>

    <div class="toolbar">
      <span class="toolbar__count">총 <b>{{ filteredList.length }}</b>건</span>
      <select v-model="pageSize" class="toolbar__mini" @change="currentPage = 1">
        <option v-for="n in pageSizeOptions" :key="n" :value="n">{{ n }}건씩 보기</option>
      </select>
      <ExcelDownloadButton @click="onExcelDownload" />
    </div>

    <div class="listcard card">
      <div class="listcard__scroll">
        <table class="data-table">
          <thead>
            <tr>
              <th class="col-no">NO</th>
              <th>변경구분</th>
              <th>변경항목</th>
              <th v-if="isIntegrated">프로젝트ID</th>
              <th v-if="isIntegrated">프로젝트명</th>
              <th>변경일시</th>
              <th>변경자</th>
            </tr>
          </thead>
          <tbody>
            <template v-for="(row, idx) in pagedList" :key="row.id">
              <tr
                class="data-table__row"
                :class="{ open: expandedId === row.id }"
                @click="toggleExpand(row.id)"
              >
                <td class="col-no">
                  <span class="expand-mark">{{ expandedId === row.id ? '▾' : '▸' }}</span>
                  {{ displayNo(idx) }}
                </td>
                <td><b class="category">{{ row.category }}</b></td>
                <td>{{ row.item }}</td>
                <td v-if="isIntegrated">{{ row.projectCode }}</td>
                <td v-if="isIntegrated" class="name-cell">{{ row.projectName }}</td>
                <td class="datetime">
                  <span>{{ splitDateTime(row.changedAt).date }}</span>
                  <span class="datetime__time">{{ splitDateTime(row.changedAt).time }}</span>
                </td>
                <td>{{ row.changedBy }}</td>
              </tr>
              <tr v-if="expandedId === row.id" class="detail-row">
                <td :colspan="colSpan">
                  <div class="detail-panel">
                    <p class="detail-panel__hint">
                      변경 내용 영역 · 변경항목에 따라 템플릿에 맞춰 표기
                    </p>
                    <p
                      v-for="(line, lineIdx) in row.changeLines"
                      :key="lineIdx"
                      class="detail-panel__line"
                    >
                      {{ line.label }}
                      <b class="detail-panel__before">{{ line.before }}</b>
                      →
                      <b class="detail-panel__after">{{ line.after }}</b>
                    </p>
                    <button
                      type="button"
                      class="btn btn--ghost btn--sm"
                      @click.stop="openDetail(row)"
                    >
                      상세보기
                    </button>
                  </div>
                </td>
              </tr>
            </template>
            <tr v-if="!pagedList.length">
              <td :colspan="colSpan" class="empty">조회된 변경이력이 없습니다.</td>
            </tr>
          </tbody>
        </table>
      </div>

      <div v-if="totalPages > 1" class="pager">
        <button
          type="button"
          class="pager__btn"
          :disabled="currentPage <= 1"
          @click="currentPage--"
        >
          ‹
        </button>
        <button
          v-for="p in totalPages"
          :key="p"
          type="button"
          class="pager__btn"
          :class="{ 'is-active': currentPage === p }"
          @click="currentPage = p"
        >
          {{ p }}
        </button>
        <button
          type="button"
          class="pager__btn"
          :disabled="currentPage >= totalPages"
          @click="currentPage++"
        >
          ›
        </button>
      </div>
    </div>

    <ProjectHistoryDetailModal
      :visible="showDetailModal"
      :record="detailTarget"
      @close="showDetailModal = false"
    />
  </div>
</template>

<style scoped>
.project-history {
  padding: 8px 24px 28px;
  color: var(--ink);
  font-size: 13px;
}

.filter {
  margin-bottom: 12px;
}

.filter__row {
  display: grid;
  gap: 12px 16px;
  margin-bottom: 12px;
}

.filter__row--3 {
  grid-template-columns: repeat(3, minmax(0, 1fr));
}

.filter__row--4 {
  grid-template-columns: repeat(4, minmax(0, 1fr));
}

.filter__field {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.filter__field label {
  font-size: 12px;
  font-weight: 600;
  color: var(--ink-2);
}

.filter__input,
.filter__select {
  padding: 7px 10px;
  font-size: 12px;
  border: 1px solid var(--line);
  border-radius: 6px;
  background: #fff;
}

.filter__actions {
  display: flex;
  justify-content: flex-end;
  gap: 8px;
}

.toolbar {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 8px;
}

.toolbar__count {
  font-size: 12px;
  color: var(--ink-2);
}

.toolbar__count b {
  color: var(--teal-600);
}

.toolbar__mini {
  padding: 4px 8px;
  font-size: 12px;
  border: 1px solid var(--line);
  border-radius: 6px;
  background: #fff;
}

.listcard {
  padding: 0;
  overflow: hidden;
}

.listcard__scroll {
  overflow-x: auto;
}

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
  vertical-align: middle;
}

.data-table th {
  background: #fafbfc;
  font-weight: 700;
  color: var(--ink-2);
  white-space: nowrap;
}

.data-table__row {
  cursor: pointer;
}

.data-table__row:hover {
  background: #f8fafb;
}

.data-table__row.open {
  background: #f3f8f7;
}

.col-no {
  width: 64px;
  white-space: nowrap;
}

.name-cell {
  max-width: 220px;
}

.expand-mark {
  display: inline-block;
  width: 14px;
  color: var(--muted);
}

.category {
  color: var(--ink);
}

.datetime {
  white-space: nowrap;
}

.datetime__time {
  display: block;
  font-size: 11px;
  color: var(--muted);
}

.detail-row td {
  padding: 0;
  background: #fafbfc;
}

.detail-panel {
  padding: 10px 14px 12px 42px;
}

.detail-panel__hint {
  margin: 0 0 8px;
  font-size: 11px;
  color: var(--muted);
}

.detail-panel__line {
  margin: 0 0 8px;
  font-size: 13px;
}

.detail-panel__before {
  color: var(--muted);
  font-weight: 600;
}

.detail-panel__after {
  color: var(--teal-600);
}

.empty {
  text-align: center;
  padding: 32px 12px !important;
  color: var(--muted);
}

.pager {
  display: flex;
  justify-content: center;
  gap: 4px;
  padding: 12px;
}
</style>
