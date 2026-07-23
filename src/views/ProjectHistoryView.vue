<script setup>
// PAG-M-PST-03 / PAG-S-INF-05 프로젝트 변경이력 (통합·개별 공용)
import { computed, onMounted, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useProjectStore } from '@/stores/project'
import { useTabsStore } from '@/stores/tabs'
import { useSubTabsStore } from '@/stores/subTabs'
import {
  changeCategoryOptions,
  changePeriodOptions,
  pageSizeOptions,
  historyDevDeptOptions,
  getProjectHistory,
  getAllProjectHistory,
  matchHistoryFilters,
  splitDateTime,
  resolveHistoryTemplate,
  detailRouteForHistory,
  HISTORY_TEMPLATE,
  formatReqLabel,
  createHistoryDefaultFilters,
  getPeriodDateRange,
} from '@/data/projectHistory'
import ExcelDownloadButton from '@/components/ui/ExcelDownloadButton.vue'
import { mockExcelDownload } from '@/utils/excelDownload'

const route = useRoute()
const router = useRouter()
const projectStore = useProjectStore()
const tabsStore = useTabsStore()
const subTabsStore = useSubTabsStore()

/** 통합관리 진입 시 전체, 프로젝트 메뉴 진입 시 현재 프로젝트만 */
const isIntegrated = computed(() => route.name === 'project-history')

const rows = ref([])
const filters = ref(createHistoryDefaultFilters())
const appliedFilters = ref({ ...filters.value })
const pageSize = ref(20)
const currentPage = ref(1)
const expandedId = ref(null)

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
  filters.value = createHistoryDefaultFilters()
  appliedFilters.value = { ...filters.value }
  currentPage.value = 1
  expandedId.value = null
}

function onPeriodChange() {
  const range = getPeriodDateRange(filters.value.period)
  filters.value.dateFrom = range.from
  filters.value.dateTo = range.to
}

function search() {
  const { dateFrom, dateTo } = filters.value
  if (dateFrom && dateTo && dateFrom > dateTo) {
    window.alert('시작일은 종료일보다 클 수 없습니다.')
    return
  }
  appliedFilters.value = { ...filters.value }
  currentPage.value = 1
  expandedId.value = null
}

function toggleExpand(id) {
  expandedId.value = expandedId.value === id ? null : id
}

function openProject(project, routePath = '/project/info') {
  const id = project.id || project.projectId || project.projectKey
  const name = project.name || project.projectName || project.project || '프로젝트'
  const stage = project.stage || '처리중'
  projectStore.setCurrentProject({ id, name, stage })
  tabsStore.openProjectTab({
    projectId: id,
    title: name,
    projectName: name,
    route: routePath,
  })
  const subId = routePath.includes('wbs')
    ? 'wbs'
    : routePath.includes('requirement')
      ? 'requirement'
      : 'info'
  const subTitle =
    subId === 'wbs' ? 'WBS' : subId === 'requirement' ? '요구사항' : '프로젝트 정보'
  subTabsStore.openSubTab(id, { id: subId, title: subTitle, route: routePath })
  router.push(routePath)
}

function openDetail(row) {
  openProject(
    {
      id: row.projectKey,
      name: row.projectName,
      stage: '처리중',
    },
    detailRouteForHistory(row),
  )
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

function templateKind(row) {
  return resolveHistoryTemplate(row)
}

function wbsTaskPath(chg) {
  if (chg.taskName) return chg.taskName
  return [chg.system, chg.biz, chg.screen].filter(Boolean).join(' / ') || '-'
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
        <div class="filter__field filter__field--date">
          <label>변경일</label>
          <div class="filter__date">
            <select v-model="filters.period" class="filter__select filter__select--period" @change="onPeriodChange">
              <option v-for="o in changePeriodOptions" :key="o.value" :value="o.value">
                {{ o.label }}
              </option>
            </select>
            <div class="filter__range">
              <input v-model="filters.dateFrom" class="filter__input filter__input--date" type="date" />
              <span class="filter__range-sep">~</span>
              <input v-model="filters.dateTo" class="filter__input filter__input--date" type="date" />
            </div>
          </div>
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
                    <!-- Case 1-1) 프로젝트 설정값 -->
                    <table v-if="templateKind(row) === HISTORY_TEMPLATE.projectSetting" class="data-table detail-table">
                      <tbody>
                        <tr>
                          <th>변경항목</th>
                          <td>{{ row.setting?.field || row.item }}</td>
                        </tr>
                        <tr>
                          <th>원래값</th>
                          <td class="before">{{ row.setting?.before ?? row.before ?? '-' }}</td>
                        </tr>
                        <tr>
                          <th>변경값</th>
                          <td class="after">{{ row.setting?.after ?? row.after ?? '-' }}</td>
                        </tr>
                      </tbody>
                    </table>

                    <!-- Case 1-2) 프로젝트 이슈등록 -->
                    <table v-else-if="templateKind(row) === HISTORY_TEMPLATE.projectIssue" class="data-table detail-table">
                      <tbody>
                        <tr>
                          <th>변경항목</th>
                          <td>{{ row.item }}</td>
                        </tr>
                        <tr>
                          <th>내용</th>
                          <td class="detail-table__body">{{ row.issueBody || row.detail?.body || '-' }}</td>
                        </tr>
                      </tbody>
                    </table>

                    <!-- Case 2) WBS (복수 시 리스트) -->
                    <table
                      v-else-if="templateKind(row) === HISTORY_TEMPLATE.wbs"
                      class="data-table detail-table"
                    >
                      <template v-for="(chg, cIdx) in (row.wbsChanges || [])" :key="cIdx">
                        <tbody class="wbs-block">
                          <tr>
                            <th>변경항목</th>
                            <td>{{ chg.changeItem || row.item }}</td>
                          </tr>
                          <tr>
                            <th>변경업무</th>
                            <td>{{ wbsTaskPath(chg) }}</td>
                          </tr>
                          <tr>
                            <th>요구사항 (명/ID)</th>
                            <td>{{ formatReqLabel(chg) }}</td>
                          </tr>
                          <tr>
                            <th>원래값</th>
                            <td class="before">{{ chg.before || '-' }}</td>
                          </tr>
                          <tr>
                            <th>변경값</th>
                            <td class="after">{{ chg.after || '-' }}</td>
                          </tr>
                          <tr>
                            <th>변경사유</th>
                            <td>{{ chg.reason || '-' }}</td>
                          </tr>
                        </tbody>
                      </template>
                    </table>

                    <!-- Case 3-1) 요구사항 설정값 (우선순위·상태) -->
                    <table v-else-if="templateKind(row) === HISTORY_TEMPLATE.reqPriority" class="data-table detail-table">
                      <tbody>
                        <tr>
                          <th>변경항목</th>
                          <td>{{ row.fieldLabel || row.item }}</td>
                        </tr>
                        <tr>
                          <th>요구사항 (명/ID)</th>
                          <td>{{ formatReqLabel(row) }}</td>
                        </tr>
                        <tr>
                          <th>원래값</th>
                          <td class="before">{{ row.priority?.before ?? row.before ?? '-' }}</td>
                        </tr>
                        <tr>
                          <th>변경값</th>
                          <td class="after">{{ row.priority?.after ?? row.after ?? '-' }}</td>
                        </tr>
                      </tbody>
                    </table>

                    <!-- Case 3-2) 요구사항 이슈등록 -->
                    <table v-else-if="templateKind(row) === HISTORY_TEMPLATE.reqIssue" class="data-table detail-table">
                      <tbody>
                        <tr>
                          <th>변경항목</th>
                          <td>{{ row.item }}</td>
                        </tr>
                        <tr>
                          <th>요구사항 (명/ID)</th>
                          <td>{{ formatReqLabel(row) }}</td>
                        </tr>
                        <tr>
                          <th>내용</th>
                          <td class="detail-table__body">{{ row.issueBody || row.detail?.body || '-' }}</td>
                        </tr>
                      </tbody>
                    </table>

                    <!-- Case 3-3) 요구사항 상세변경 -->
                    <table v-else-if="templateKind(row) === HISTORY_TEMPLATE.reqDetail" class="data-table detail-table">
                      <tbody>
                        <tr>
                          <th>변경항목</th>
                          <td>{{ row.item }}</td>
                        </tr>
                        <tr>
                          <th>요구사항 (명/ID)</th>
                          <td>{{ formatReqLabel(row) }}</td>
                        </tr>
                        <tr>
                          <th>변경사유</th>
                          <td>{{ row.reqDetail?.reason || row.reason || '-' }}</td>
                        </tr>
                        <tr>
                          <th>변경 전 내용</th>
                          <td class="detail-table__body before">{{ row.reqDetail?.before || row.beforeBody || '-' }}</td>
                        </tr>
                        <tr>
                          <th>변경 후 내용</th>
                          <td class="detail-table__body after">{{ row.reqDetail?.after || row.afterBody || '-' }}</td>
                        </tr>
                      </tbody>
                    </table>

                    <!-- fallback -->
                    <table v-else class="data-table detail-table">
                      <tbody>
                        <tr v-for="(line, lineIdx) in row.changeLines" :key="lineIdx">
                          <th>{{ line.label }}</th>
                          <td>
                            <b class="before">{{ line.before }}</b>
                            →
                            <b class="after">{{ line.after }}</b>
                          </td>
                        </tr>
                      </tbody>
                    </table>

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
  </div>
</template>

<style scoped>
.project-history {
  padding: 8px 24px 28px;
  color: var(--ink);
  font-size: 13px;
}

.filter {
  padding: 14px 16px;
  margin-bottom: 12px;
}

.filter__row {
  display: grid;
  gap: 12px 16px;
  margin-bottom: 12px;
}

.filter__row--3 {
  grid-template-columns: minmax(140px, 0.8fr) minmax(280px, 1.6fr) minmax(140px, 1fr);
}

.filter__row--4 {
  grid-template-columns: minmax(120px, 0.7fr) minmax(280px, 1.5fr) minmax(140px, 1fr) minmax(120px, 0.8fr);
}

.filter__field {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.filter__field label {
  font-size: 12px;
  font-weight: 600;
  color: var(--lnb-muted);
}

.filter__input,
.filter__select {
  padding: 7px 10px;
  font-size: 12px;
  border: 1px solid var(--lnb-line);
  border-radius: var(--radius-sm, 6px);
  background: var(--lnb-side);
  color: var(--lnb-txt);
  font-family: inherit;
}

.filter__date {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 8px;
}

.filter__select--period {
  width: auto;
  min-width: 110px;
  flex-shrink: 0;
}

.filter__range {
  display: flex;
  align-items: center;
  gap: 6px;
  flex: 1;
  min-width: 0;
}

.filter__range-sep {
  color: var(--lnb-muted);
  font-size: 12px;
  flex-shrink: 0;
}

.filter__input--date {
  flex: 1;
  min-width: 0;
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
  margin-left: auto;
  padding: 4px 8px;
  font-size: 12px;
  border: 1px solid var(--line);
  border-radius: var(--radius-sm, 6px);
  background: var(--lnb-side);
  color: var(--lnb-txt);
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
  background: var(--line-2);
  font-weight: 700;
  color: var(--ink-2);
  white-space: nowrap;
}

.data-table__row {
  cursor: pointer;
}

.data-table__row:hover {
  background: var(--lnb-hover);
}

.data-table__row.open {
  background: var(--teal-50);
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
  background: var(--line-2);
}

.detail-panel {
  padding: 12px 14px 14px 42px;
}

.detail-panel__label {
  margin: 0 0 4px;
  font-size: 11px;
  font-weight: 600;
  color: var(--muted);
}

.detail-panel__meta {
  margin: 0 0 8px;
  font-size: 12px;
  font-weight: 600;
  color: var(--ink-2);
}

.detail-table {
  margin: 0 0 10px;
  background: var(--bg, #fff);
  border: 1px solid var(--line);
}

.detail-table th,
.detail-table td {
  padding: 14px 16px;
}

.detail-table th {
  width: 160px;
  white-space: nowrap;
  vertical-align: top;
}

.detail-table td {
  vertical-align: top;
}

.detail-table__body {
  padding: 16px;
  font-size: 13px;
  line-height: 1.7;
  white-space: pre-wrap;
}

.wbs-block + .wbs-block tr:first-child th,
.wbs-block + .wbs-block tr:first-child td {
  border-top: 2px solid var(--teal-600);
}

.before {
  color: var(--muted);
  font-weight: 600;
}

.after {
  color: var(--teal-600);
  font-weight: 600;
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
