<script setup>
// PAG-M-PST-03 / PAG-S-INF-05 프로젝트 변경이력 (통합·개별 공용)
import { computed, onMounted, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useProjectStore } from '@/app/stores/project'
import { useTabsStore } from '@/app/stores/tabs'
import { useSubTabsStore } from '@/app/stores/subTabs'
import { useAuthStore } from '@/app/stores/auth'
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
  formatChangedBy,
  createHistoryDefaultFilters,
  getPeriodDateRange,
} from '@/entities/project/mock/projectHistory'
import SearchFilterBar from '@/shared/ui/SearchFilterBar.vue'
import FilterSelectPill from '@/shared/ui/FilterSelectPill.vue'
import FilterDateRange from '@/shared/ui/FilterDateRange.vue'

const route = useRoute()
const router = useRouter()
const projectStore = useProjectStore()
const tabsStore = useTabsStore()
const subTabsStore = useSubTabsStore()
const authStore = useAuthStore()

/** 통합관리 진입 시 전체, 프로젝트 메뉴 진입 시 현재 프로젝트만 */
const isIntegrated = computed(() => route.name === 'project-history')

const rows = ref([])
const filters = ref(createHistoryDefaultFilters())
const appliedFilters = ref({ ...filters.value })
const pageSize = ref(20)
const currentPage = ref(1)
const expandedId = ref(null)
const hasSearched = ref(false)

const searchField = computed({
  get: () => (isIntegrated.value ? filters.value.projectQuery : filters.value.keyword),
  set: (v) => {
    if (isIntegrated.value) filters.value.projectQuery = v
    else filters.value.keyword = v
  },
})

const searchPlaceholder = computed(() =>
  isIntegrated.value ? '프로젝트명 or 프로젝트ID 입력' : '변경항목, 변경자 검색',
)

const periodPillOptions = changePeriodOptions.map((o) => ({ value: o.value, label: o.label }))

const filterTags = computed(() => {
  const f = appliedFilters.value
  const defaults = createHistoryDefaultFilters()
  const tags = []
  if (f.category && f.category !== '전체') {
    tags.push({ key: 'category', label: '변경구분', value: f.category })
  }
  if (f.period && f.period !== defaults.period) {
    const opt = changePeriodOptions.find((o) => o.value === f.period)
    tags.push({ key: 'period', label: '기간', value: opt?.label || f.period })
  }
  if (f.dateFrom !== defaults.dateFrom || f.dateTo !== defaults.dateTo) {
    tags.push({
      key: 'dateRange',
      label: '변경일',
      value: `${f.dateFrom || '…'} ~ ${f.dateTo || '…'}`,
    })
  }
  if (f.projectQuery) tags.push({ key: 'projectQuery', label: '프로젝트', value: f.projectQuery })
  if (f.devDept && f.devDept !== '전체') {
    tags.push({ key: 'devDept', label: '담당개발부서', value: f.devDept })
  }
  if (f.keyword) tags.push({ key: 'keyword', label: '변경항목', value: f.keyword })
  return tags
})

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
    rows.value = hasSearched.value ? getAllProjectHistory() : []
  } else {
    const project = projectStore.currentProject
    rows.value = project?.id
      ? getProjectHistory(project.id, project.name, authStore.user?.id)
      : []
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

function onPeriodSelect(value) {
  filters.value.period = value
  onPeriodChange()
}

function search() {
  const { dateFrom, dateTo } = filters.value
  if (dateFrom && dateTo && dateFrom > dateTo) {
    window.alert('시작일은 종료일보다 클 수 없습니다.')
    return
  }
  hasSearched.value = true
  loadData()
  appliedFilters.value = { ...filters.value }
  currentPage.value = 1
  expandedId.value = null
}

function removeFilterTag(key) {
  const defaults = createHistoryDefaultFilters()
  if (key === 'dateRange') {
    filters.value.dateFrom = defaults.dateFrom
    filters.value.dateTo = defaults.dateTo
    filters.value.period = defaults.period
  } else if (key === 'period') {
    filters.value.period = defaults.period
    onPeriodChange()
  } else if (key === 'category') {
    filters.value.category = '전체'
  } else if (key === 'devDept') {
    filters.value.devDept = '전체'
  } else if (key === 'projectQuery') {
    filters.value.projectQuery = ''
  } else if (key === 'keyword') {
    filters.value.keyword = ''
  }
  search()
}

function toggleExpand(id) {
  expandedId.value = expandedId.value === id ? null : id
}

function openProject(project, routePath = '/workspace/info') {
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
    <SearchFilterBar
      v-model:search="searchField"
      :search-placeholder="searchPlaceholder"
      :applied-tags="filterTags"
      @reset="resetFilters"
      @search="search"
      @remove-tag="removeFilterTag"
    >
      <template #primary>
        <FilterSelectPill
          v-model="filters.category"
          label="변경구분"
          :options="changeCategoryOptions"
        />
        <FilterSelectPill
          :model-value="filters.period"
          label="기간"
          :options="periodPillOptions"
          @update:model-value="onPeriodSelect"
        />
        <FilterDateRange
          label="변경일"
          :from="filters.dateFrom"
          :to="filters.dateTo"
          @update:from="filters.dateFrom = $event"
          @update:to="filters.dateTo = $event"
        />
        <FilterSelectPill
          v-if="isIntegrated"
          v-model="filters.devDept"
          label="담당개발부서"
          :options="historyDevDeptOptions"
        />
      </template>
    </SearchFilterBar>

    <div class="toolbar">
      <span class="toolbar__count">총 <b>{{ filteredList.length }}</b>건</span>
      <select v-model="pageSize" class="toolbar__mini" @change="currentPage = 1">
        <option v-for="n in pageSizeOptions" :key="n" :value="n">{{ n }}건씩 보기</option>
      </select>
    </div>

    <div class="listcard card">
      <div class="listcard__scroll">
        <table class="data-table">
          <thead>
            <tr>
              <th class="col-no">NO</th>
              <th class="col-category">변경구분</th>
              <th>변경항목</th>
              <th v-if="isIntegrated" class="col-projid">프로젝트ID</th>
              <th v-if="isIntegrated" class="col-projname">프로젝트명</th>
              <th class="col-datetime">변경일시</th>
              <th class="col-changer">변경자</th>
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
                <td>{{ formatChangedBy(row.changedBy) }}</td>
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
              <td :colspan="colSpan" class="empty">
                {{ isIntegrated && !hasSearched ? '검색 조건을 입력 후 조회해 주세요.' : '조회된 변경이력이 없습니다.' }}
              </td>
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
  font-size: calc(13px + var(--font-size-offset, 0px));
}

.toolbar {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 8px;
}

.toolbar__count {
  font-size: calc(12px + var(--font-size-offset, 0px));
  color: var(--ink-2);
}

.toolbar__count b {
  color: var(--teal-600);
}

.toolbar__mini {
  margin-left: auto;
  padding: 4px 8px;
  font-size: calc(12px + var(--font-size-offset, 0px));
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
  font-size: calc(12px + var(--font-size-offset, 0px));
  table-layout: fixed;
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
  color: var(--ink);
  white-space: nowrap;
  text-align: center;
}

.data-table__row {
  cursor: pointer;
}

.data-table__row:hover {
  background: var(--teal-50);
}

.data-table__row.open {
  background: var(--lnb-hover);
}

.col-no {
  width: 64px;
  white-space: nowrap;
}

.col-category {
  width: 110px;
}

.col-projid {
  width: 120px;
}

.col-projname {
  width: 200px;
}

.col-datetime {
  width: 140px;
}

.col-changer {
  width: 130px;
}

.name-cell {
  max-width: 220px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
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
  display: inline-block;
  margin-left: 6px;
  font-size: calc(11px + var(--font-size-offset, 0px));
  color: var(--muted);
}

.detail-row td {
  padding: 0;
  background: var(--lnb-hover);
}

.detail-panel {
  padding: 12px 14px 14px 42px;
}

.detail-panel__label {
  margin: 0 0 4px;
  font-size: calc(11px + var(--font-size-offset, 0px));
  font-weight: 600;
  color: var(--muted);
}

.detail-panel__meta {
  margin: 0 0 8px;
  font-size: calc(12px + var(--font-size-offset, 0px));
  font-weight: 600;
  color: var(--ink-2);
}

.detail-table {
  margin: 0 0 10px;
  background: var(--lnb-side);
  border: 1px solid var(--lnb-line);
}

.detail-table th,
.detail-table td {
  padding: 14px 16px;
}

.detail-table th {
  width: 160px;
  white-space: nowrap;
  vertical-align: top;
  background: var(--lnb-hover);
}

.detail-table td {
  vertical-align: top;
}

.detail-table__body {
  padding: 16px;
  font-size: calc(13px + var(--font-size-offset, 0px));
  line-height: 1.7;
  white-space: pre-wrap;
}

.wbs-block + .wbs-block tr:first-child th,
.wbs-block + .wbs-block tr:first-child td {
  padding-top: 24px;
}

.before,
.after {
  color: inherit;
  font-weight: 400;
}

.empty {
  text-align: center !important;
  padding: 32px 12px !important;
  color: var(--muted);
}

.pager {
  display: flex;
  justify-content: center;
  gap: 4px;
  padding: 12px;
}

.btn--ghost {
  background: var(--lnb-side);
  border-color: var(--line);
  color: var(--ink-2);
}

.btn--ghost:hover {
  border-color: var(--teal-100);
  color: var(--teal-600);
}
</style>
