<script setup>
// PAG-M-PST-03 / PAG-S-INF-05 프로젝트 변경이력 (통합·개별 공용)
// h-pms ProjectHistoryPage.vue 이식 — 실 API 대신 entities/project/mock/projectHistory의
// 로컬 목업으로 동일한 화면 동작(조회조건/상세 아코디언/페이징)을 재현한다.
import { computed, onMounted, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useProjectStore } from '@/app/stores/project'
import { useTabsStore } from '@/app/stores/tabs'
import { useSubTabsStore } from '@/app/stores/subTabs'
import { useAuthStore } from '@/app/stores/auth'
import {
  changeCategoryOptions,
  changePeriodOptions,
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
  projectHistoryMeta,
} from '@/entities/project/mock/projectHistory'
import SearchFilterBar from '@/shared/ui/SearchFilterBar.vue'
import FilterSelectPill from '@/shared/ui/FilterSelectPill.vue'
import FilterTextPill from '@/shared/ui/FilterTextPill.vue'
import FilterDateRange from '@/shared/ui/FilterDateRange.vue'
import HpPagination from '@/shared/ui/HpPagination.vue'
import BaseTooltip from '@/shared/ui/BaseTooltip.vue'

const route = useRoute()
const router = useRouter()
const projectStore = useProjectStore()
const tabsStore = useTabsStore()
const subTabsStore = useSubTabsStore()
const authStore = useAuthStore()

/** 통합관리 진입 시 전체, 프로젝트 메뉴 진입 시 현재 프로젝트만 */
const isIntegrated = computed(() => route.name === 'project-history')
const pageHint = computed(() =>
  isIntegrated.value ? projectHistoryMeta.integratedHint : projectHistoryMeta.projectHint,
)

/** h-pms 스펙(SB-PAG-S-INF-05-F01)은 페이지당 20건 고정 — 건수 선택 UI가 없다. */
const PAGE_SIZE = 20

const rows = ref([])
const filters = ref(createHistoryDefaultFilters())
const appliedFilters = ref({ ...filters.value })
const currentPage = ref(1)
const expandedId = ref(null)

/** h-pms의 4가지 기간 프리셋(오늘/최근 3일/최근 1주일/최근 1개월)만 노출한다. */
const periodPillOptions = changePeriodOptions
  .filter((o) => ['today', '3d', '7d', '1m'].includes(o.value))
  .map((o) => ({ value: o.value, label: o.label }))

const filterTags = computed(() => {
  const f = appliedFilters.value
  const defaults = createHistoryDefaultFilters()
  const tags = []
  if (f.category && f.category !== '전체') {
    tags.push({ key: 'category', label: '변경구분', value: f.category })
  }
  if (f.period && f.period !== defaults.period) {
    const opt = changePeriodOptions.find((o) => o.value === f.period)
    tags.push({ key: 'period', label: '변경일', value: opt?.label || f.period })
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
  return tags
})

const colSpan = computed(() => (isIntegrated.value ? 7 : 5))

const filteredList = computed(() =>
  rows.value.filter((row) => matchHistoryFilters(row, appliedFilters.value)),
)

const pagedList = computed(() => {
  const start = (currentPage.value - 1) * PAGE_SIZE
  return filteredList.value.slice(start, start + PAGE_SIZE)
})

const totalPages = computed(() => Math.max(1, Math.ceil(filteredList.value.length / PAGE_SIZE)))

function rowNo(index) {
  return (currentPage.value - 1) * PAGE_SIZE + index + 1
}

function loadData() {
  if (isIntegrated.value) {
    rows.value = getAllProjectHistory()
  } else {
    const project = projectStore.currentProject
    rows.value = project?.id
      ? getProjectHistory(project.id, project.name, authStore.user?.id)
      : []
  }
  expandedId.value = null
}

onMounted(loadData)
watch(() => route.name, loadData)
watch(() => projectStore.currentProject?.id, () => {
  if (!isIntegrated.value) loadData()
})

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
  loadData()
  appliedFilters.value = { ...filters.value }
  currentPage.value = 1
}

function resetFilters() {
  filters.value = createHistoryDefaultFilters()
  search()
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

/**
 * "상세보기" — h-pms는 구분별 대상 화면으로 RouterLink 이동만 하지만, 이 목업은 사이드 탭
 * 시스템을 쓰고 있어 openProject로 탭까지 함께 열어준다(h-pms에 없는 이 앱 고유 동작).
 */
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
    <h1 class="project-history__title">
      프로젝트 변경이력
      <BaseTooltip :text="pageHint" />
    </h1>

    <SearchFilterBar
      :show-search="false"
      :applied-tags="filterTags"
      @reset="resetFilters"
      @search="search"
      @remove-tag="removeFilterTag"
    >
      <template #primary>
        <FilterSelectPill
          v-model="filters.category"
          class="sfb-w-sm"
          label="변경구분"
          :options="changeCategoryOptions"
        />
        <FilterSelectPill
          :model-value="filters.period"
          class="sfb-w-sm"
          label="변경일"
          :options="periodPillOptions"
          @update:model-value="onPeriodSelect"
        />
        <FilterDateRange
          :from="filters.dateFrom"
          :to="filters.dateTo"
          @update:from="filters.dateFrom = $event"
          @update:to="filters.dateTo = $event"
        />
        <FilterTextPill
          v-if="isIntegrated"
          v-model="filters.projectQuery"
          class="sfb-w-md"
          label="프로젝트"
          placeholder="프로젝트명 or 프로젝트ID 입력"
          @enter="search"
        />
        <FilterSelectPill
          v-if="isIntegrated"
          v-model="filters.devDept"
          class="sfb-w-sm"
          label="담당개발부서"
          :options="historyDevDeptOptions"
        />
      </template>
    </SearchFilterBar>

    <p v-if="!isIntegrated && !projectStore.currentProject?.id" class="notice">
      프로젝트를 먼저 선택해 주세요.
    </p>

    <template v-else>
      <div class="card card--panel listcard">
        <div class="listcard__scroll">
          <table class="data-table">
            <thead>
              <tr>
                <th class="col-no">NO</th>
                <th class="col-datetime">변경일시</th>
                <th class="col-category">변경구분</th>
                <th>변경항목</th>
                <th v-if="isIntegrated" class="col-projid">프로젝트ID</th>
                <th v-if="isIntegrated" class="col-projname">프로젝트명</th>
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
                  <td class="col-no cell--center">{{ rowNo(idx) }}</td>
                  <td class="datetime">
                    <span>{{ splitDateTime(row.changedAt).date }}</span>
                    <span class="datetime__time">{{ splitDateTime(row.changedAt).time }}</span>
                  </td>
                  <td>{{ row.category }}</td>
                  <td>{{ row.item }}</td>
                  <td v-if="isIntegrated">{{ row.projectCode }}</td>
                  <td v-if="isIntegrated" class="name-cell">{{ row.projectName }}</td>
                  <td>{{ formatChangedBy(row.changedBy) }}</td>
                </tr>
                <tr v-if="expandedId === row.id" class="detail-row">
                  <td :colspan="colSpan">
                    <div class="detail-panel">
                      <!-- Case 1-1) 프로젝트 설정값 -->
                      <dl v-if="templateKind(row) === HISTORY_TEMPLATE.projectSetting">
                        <div><dt>변경항목</dt><dd>{{ row.setting?.field || row.item }}</dd></div>
                        <div><dt>원래값</dt><dd>{{ row.setting?.before ?? row.before ?? '-' }}</dd></div>
                        <div><dt>변경값</dt><dd>{{ row.setting?.after ?? row.after ?? '-' }}</dd></div>
                      </dl>

                      <!-- Case 1-2) 프로젝트 이슈등록 -->
                      <dl v-else-if="templateKind(row) === HISTORY_TEMPLATE.projectIssue">
                        <div><dt>변경항목</dt><dd>{{ row.item }}</dd></div>
                        <div><dt>내용</dt><dd>{{ row.issueBody || row.detail?.body || '-' }}</dd></div>
                      </dl>

                      <!-- Case 2) WBS (복수 시 리스트) -->
                      <div v-else-if="templateKind(row) === HISTORY_TEMPLATE.wbs">
                        <div v-for="(chg, cIdx) in row.wbsChanges || []" :key="cIdx" class="wbs-block">
                          <dl>
                            <div><dt>변경항목</dt><dd>{{ chg.changeItem || row.item }}</dd></div>
                            <div><dt>변경업무</dt><dd>{{ wbsTaskPath(chg) }}</dd></div>
                            <div>
                              <dt>요구사항</dt>
                              <dd>{{ formatReqLabel(chg) }}</dd>
                            </div>
                            <div><dt>원래값</dt><dd>{{ chg.before || '-' }}</dd></div>
                            <div><dt>변경값</dt><dd>{{ chg.after || '-' }}</dd></div>
                            <div><dt>변경사유</dt><dd>{{ chg.reason || '-' }}</dd></div>
                          </dl>
                        </div>
                      </div>

                      <!-- Case 3-1) 요구사항 설정값 (우선순위·상태) -->
                      <dl v-else-if="templateKind(row) === HISTORY_TEMPLATE.reqPriority">
                        <div><dt>변경항목</dt><dd>{{ row.fieldLabel || row.item }}</dd></div>
                        <div><dt>요구사항</dt><dd>{{ formatReqLabel(row) }}</dd></div>
                        <div><dt>원래값</dt><dd>{{ row.priority?.before ?? row.before ?? '-' }}</dd></div>
                        <div><dt>변경값</dt><dd>{{ row.priority?.after ?? row.after ?? '-' }}</dd></div>
                      </dl>

                      <!-- Case 3-2) 요구사항 이슈등록 -->
                      <dl v-else-if="templateKind(row) === HISTORY_TEMPLATE.reqIssue">
                        <div><dt>변경항목</dt><dd>{{ row.item }}</dd></div>
                        <div><dt>요구사항</dt><dd>{{ formatReqLabel(row) }}</dd></div>
                        <div><dt>내용</dt><dd>{{ row.issueBody || row.detail?.body || '-' }}</dd></div>
                      </dl>

                      <!-- Case 3-3) 요구사항 상세변경 -->
                      <dl v-else-if="templateKind(row) === HISTORY_TEMPLATE.reqDetail">
                        <div><dt>변경항목</dt><dd>{{ row.item }}</dd></div>
                        <div><dt>요구사항</dt><dd>{{ formatReqLabel(row) }}</dd></div>
                        <div><dt>변경사유</dt><dd>{{ row.reqDetail?.reason || row.reason || '-' }}</dd></div>
                        <div><dt>변경 전 내용</dt><dd>{{ row.reqDetail?.before || row.beforeBody || '-' }}</dd></div>
                        <div><dt>변경 후 내용</dt><dd>{{ row.reqDetail?.after || row.afterBody || '-' }}</dd></div>
                      </dl>

                      <!-- fallback -->
                      <dl v-else>
                        <div v-for="(line, lineIdx) in row.changeLines" :key="lineIdx">
                          <dt>{{ line.label }}</dt>
                          <dd>{{ line.before }} → {{ line.after }}</dd>
                        </div>
                      </dl>

                      <div class="detail-actions">
                        <button type="button" class="btn btn--ghost btn--sm" @click.stop="openDetail(row)">
                          상세보기
                        </button>
                      </div>
                    </div>
                  </td>
                </tr>
              </template>
              <tr v-if="!pagedList.length">
                <td :colspan="colSpan" class="empty">변경이력이 없습니다</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <HpPagination v-model:page="currentPage" :total-pages="totalPages" />
    </template>
  </div>
</template>

<style scoped>
.project-history {
  padding: 8px 24px 28px;
  color: var(--ink);
  font-size: calc(13px + var(--font-size-offset, 0px));
}

.project-history__title {
  display: flex;
  align-items: center;
  gap: 8px;
  margin: 0 0 14px;
  font-size: calc(19px + var(--font-size-offset, 0px));
  font-weight: 700;
  color: var(--ink);
}

.listcard {
  padding: 0;
}

.listcard__scroll {
  overflow-x: auto;
}

.col-no {
  width: 56px;
}

.col-datetime {
  width: 140px;
}

.col-category {
  width: 96px;
}

.col-projid {
  width: 120px;
}

.col-projname {
  width: 200px;
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

.data-table__row {
  cursor: pointer;
}

.data-table__row:hover,
.data-table__row.open {
  background: var(--color-bg-subtle);
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
  background: var(--color-bg-subtle);
}

.detail-panel {
  padding: 14px 16px 16px 42px;
}

.wbs-block + .wbs-block {
  margin-top: 14px;
  padding-top: 14px;
  border-top: 1px dashed var(--lnb-line);
}

dl {
  margin: 0;
}

dl div {
  display: grid;
  grid-template-columns: 140px 1fr;
  padding: 4px 0;
  font-size: calc(12px + var(--font-size-offset, 0px));
}

dt {
  color: var(--muted);
}

dd {
  margin: 0;
  white-space: pre-wrap;
}

.detail-actions {
  display: flex;
  justify-content: flex-end;
  padding-top: 10px;
}

.empty {
  text-align: center !important;
  padding: 32px 12px !important;
  color: var(--muted);
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
