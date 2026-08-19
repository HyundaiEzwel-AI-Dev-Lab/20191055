<script setup>
// PAG-M-PST-01 프로젝트 현황
import { computed, ref } from 'vue'
import { useRouter } from 'vue-router'
import {
  projectStatusMeta,
  statusKpi,
  projectStatusList,
  requestDepts,
  devDepts,
  stageOptions,
  pageSizeOptions,
  matchKpiFilter,
  systemOptions,
  bizCategoryMap,
  initiatorOptions,
  devTypeOptions,
  summaryOptions,
} from '@/entities/project-status/mock/projectStatus'
import { getScheduleChange } from '@/entities/dashboard/mock/scheduleChange'
import ScheduleChangeModal from '@/pages/integrated/dashboard/ScheduleChangeModal.vue'
import RequirementListModal from '@/pages/integrated/dashboard/RequirementListModal.vue'
import ExcelDownloadButton from '@/shared/ui/ExcelDownloadButton.vue'
import SearchFilterBar from '@/shared/ui/SearchFilterBar.vue'
import FilterSelectPill from '@/shared/ui/FilterSelectPill.vue'
import FilterTextPill from '@/shared/ui/FilterTextPill.vue'
import FilterDateRange from '@/shared/ui/FilterDateRange.vue'
import SearchableSelect from '@/shared/ui/SearchableSelect.vue'
import { mockExcelDownload } from '@/shared/file-excel/excelDownload'
import { useProjectStore } from '@/app/stores/project'

const router = useRouter()
const projectStore = useProjectStore()

const bizCategoryOptions = [...new Set(Object.values(bizCategoryMap).flat())]
const selectEmptyOption = { value: '', label: '선택' }
const devDeptPillOptions = [selectEmptyOption, ...devDepts]
const initiatorPillOptions = [selectEmptyOption, ...initiatorOptions]
const devTypePillOptions = [selectEmptyOption, ...devTypeOptions]
const summaryPillOptions = [selectEmptyOption, ...summaryOptions]

function emptyFilters() {
  return {
    keyword: '',
    requestDept: '',
    devDept: '',
    stage: '전체',
    openDateFrom: '',
    openDateTo: '',
    manager: '',
    systems: [],
    bizCategories: [],
    itVoc: '',
    jira: '',
    initiator: '',
    devType: '',
    summary: '',
  }
}

const filterExpanded = ref(false)
const filters = ref(emptyFilters())

const appliedFilters = ref({ ...filters.value })
const activeKpi = ref('total')
const pageSize = ref(20)
const currentPage = ref(1)

const filterTags = computed(() => {
  const f = appliedFilters.value
  const tags = []
  if (f.keyword) tags.push({ key: 'keyword', label: '프로젝트', value: f.keyword })
  if (f.requestDept) tags.push({ key: 'requestDept', label: '요청부서', value: f.requestDept })
  if (f.devDept) tags.push({ key: 'devDept', label: '담당개발부서', value: f.devDept })
  if (f.stage && f.stage !== '전체') tags.push({ key: 'stage', label: '처리단계', value: f.stage })
  if (f.openDateFrom || f.openDateTo) {
    tags.push({
      key: 'openDate',
      label: '오픈일',
      value: `${f.openDateFrom || '…'} ~ ${f.openDateTo || '…'}`,
    })
  }
  if (f.manager) tags.push({ key: 'manager', label: '담당자', value: f.manager })
  if (f.itVoc) tags.push({ key: 'itVoc', label: 'IT-VOC', value: f.itVoc })
  if (f.jira) tags.push({ key: 'jira', label: 'JIRA', value: f.jira })
  if (f.initiator) tags.push({ key: 'initiator', label: '발의주체', value: f.initiator })
  if (f.devType) tags.push({ key: 'devType', label: '개발구분', value: f.devType })
  if (f.summary) tags.push({ key: 'summary', label: '적요', value: f.summary })
  if (f.systems.length) tags.push({ key: 'systems', label: '시스템구분', value: f.systems.join(', ') })
  if (f.bizCategories.length) {
    tags.push({ key: 'bizCategories', label: '업무구분', value: f.bizCategories.join(', ') })
  }
  return tags
})

const showScheduleModal = ref(false)
const scheduleModalData = ref(null)
const showRequirementModal = ref(false)
const requirementContext = ref(null)
const showInProgressTip = ref(false)

const filteredProjects = computed(() => {
  const f = appliedFilters.value
  return projectStatusList.filter((row) => {
    if (!matchKpiFilter(row, activeKpi.value)) return false
    if (f.keyword && !row.name.includes(f.keyword) && !row.projectId.includes(f.keyword)) return false
    if (f.requestDept && !row.requestDept.includes(f.requestDept)) return false
    if (f.devDept && row.devDept !== f.devDept) return false
    if (f.stage !== '전체' && row.stage !== f.stage) return false
    if (f.openDateFrom && row.scheduledOpenDate < f.openDateFrom) return false
    if (f.openDateTo && row.scheduledOpenDate > f.openDateTo) return false
    if (f.manager && !row.manager.includes(f.manager)) return false
    if (f.systems.length && !f.systems.some((s) => row.system.includes(s))) return false
    if (f.bizCategories.length && !f.bizCategories.some((b) => row.bizCategory.includes(b))) return false
    if (f.itVoc && !row.itVoc.includes(f.itVoc)) return false
    if (f.jira && !row.jira.toLowerCase().includes(f.jira.toLowerCase())) return false
    if (f.initiator && row.initiator !== f.initiator) return false
    if (f.devType && row.devType !== f.devType) return false
    if (f.summary && row.summary !== f.summary) return false
    return true
  })
})

const pagedProjects = computed(() => {
  const start = (currentPage.value - 1) * pageSize.value
  return filteredProjects.value.slice(start, start + pageSize.value)
})

const totalPages = computed(() => Math.max(1, Math.ceil(filteredProjects.value.length / pageSize.value)))

function resetFilters() {
  filters.value = emptyFilters()
  appliedFilters.value = { ...filters.value }
  activeKpi.value = 'total'
  currentPage.value = 1
}

function search() {
  appliedFilters.value = {
    ...filters.value,
    systems: [...filters.value.systems],
    bizCategories: [...filters.value.bizCategories],
  }
  currentPage.value = 1
}

function removeFilterTag(key) {
  const empty = emptyFilters()
  if (key === 'openDate') {
    filters.value.openDateFrom = ''
    filters.value.openDateTo = ''
  } else if (key in empty) {
    filters.value[key] = empty[key]
  }
  search()
}

function toggleSystem(system) {
  const list = filters.value.systems
  filters.value.systems = list.includes(system)
    ? list.filter((s) => s !== system)
    : [...list, system]
}

function toggleBizCategory(cat) {
  const list = filters.value.bizCategories
  filters.value.bizCategories = list.includes(cat)
    ? list.filter((c) => c !== cat)
    : [...list, cat]
}

function onKpiClick(key) {
  activeKpi.value = key
  filters.value.stage = '전체'
  appliedFilters.value = { ...filters.value }
  currentPage.value = 1
}

function onProjectClick(row) {
  projectStore.setCurrentProject({ id: row.projectId, name: row.name, stage: row.stage })
  router.push('/workspace/info')
}

function onDeptClick(row) {
  requirementContext.value = {
    id: row.id,
    projectId: row.projectId,
    name: row.name,
    requestDept: row.requestDept,
    stage: row.stage,
  }
  showRequirementModal.value = true
}

function onOverdueClick(row) {
  const data = getScheduleChange(row.id)
  if (!data) return
  scheduleModalData.value = data
  showScheduleModal.value = true
}

function onJiraClick(jira) {
  window.open(`https://jira.example.com/browse/${jira}`, '_blank')
}

function onExcelDownload() {
  mockExcelDownload('프로젝트 현황', filteredProjects.value, [
    { key: 'no', label: 'No.' },
    { key: 'projectId', label: '프로젝트ID' },
    { key: 'name', label: '프로젝트명' },
    { key: 'stage', label: '처리단계' },
    { key: 'progress', label: '공정률(%)' },
    { key: 'scheduledOpenDate', label: '오픈예정일' },
    { key: 'actualOpenDate', label: '오픈일' },
    { key: 'requestDept', label: '요청부서' },
    { key: 'devDept', label: '담당개발부서' },
    { key: 'itVoc', label: 'IT-VOC' },
    { key: 'jira', label: 'JIRA' },
  ])
}

function onPageSizeChange() {
  currentPage.value = 1
}
</script>

<template>
  <div class="project-status">
    <p class="notice">{{ projectStatusMeta.hint }}</p>

    <!-- 연간 현황 KPI -->
    <section class="kpi-row">
      <button
        type="button"
        class="kpi card"
        :class="{ 'kpi--active': activeKpi === 'total' }"
        @click="onKpiClick('total')"
      >
        <span class="kpi__lab">전체 프로젝트</span>
        <span class="kpi__num">{{ statusKpi.total }}<small>건</small></span>
      </button>
      <button
        type="button"
        class="kpi card"
        :class="{ 'kpi--active': activeKpi === 'received' }"
        @click="onKpiClick('received')"
      >
        <span class="kpi__lab">접수</span>
        <span class="kpi__num kpi__num--gray">{{ statusKpi.received }}<small>건</small></span>
      </button>
      <button
        type="button"
        class="kpi card kpi--tip"
        :class="{ 'kpi--active': activeKpi === 'inProgress' }"
        @click="onKpiClick('inProgress')"
        @mouseenter="showInProgressTip = true"
        @mouseleave="showInProgressTip = false"
      >
        <span class="kpi__lab">
          진행중
          <span class="kpi__info" title="진행중 안내">!</span>
        </span>
        <span class="kpi__num kpi__num--blue">{{ statusKpi.inProgress }}<small>건</small></span>
        <span v-if="showInProgressTip" class="kpi__tooltip">{{ projectStatusMeta.inProgressTooltip }}</span>
      </button>
      <button
        type="button"
        class="kpi card"
        :class="{ 'kpi--active': activeKpi === 'completed' }"
        @click="onKpiClick('completed')"
      >
        <span class="kpi__lab">완료</span>
        <span class="kpi__num kpi__num--green">{{ statusKpi.completed }}<small>건</small></span>
      </button>
      <button
        type="button"
        class="kpi card"
        :class="{ 'kpi--active': activeKpi === 'rejected' }"
        @click="onKpiClick('rejected')"
      >
        <span class="kpi__lab">반려</span>
        <span class="kpi__num kpi__num--red">{{ statusKpi.rejected }}<small>건</small></span>
      </button>
    </section>

    <!-- 검색조건 -->
    <SearchFilterBar
      v-model:expanded="filterExpanded"
      v-model:search="filters.keyword"
      search-placeholder="프로젝트명 또는 프로젝트ID"
      :applied-tags="filterTags"
      @reset="resetFilters"
      @search="search"
      @remove-tag="removeFilterTag"
    >
      <template #primary>
        <SearchableSelect
          v-model="filters.requestDept"
          variant="pill"
          label="요청부서"
          :options="requestDepts"
          placeholder="입력하여 검색"
        />
        <FilterSelectPill
          v-model="filters.devDept"
          label="담당개발부서"
          :options="devDeptPillOptions"
          empty-label="선택"
        />
        <FilterSelectPill v-model="filters.stage" label="처리단계" :options="stageOptions" />
      </template>
      <template #expand>
        <FilterDateRange
          label="오픈일"
          :from="filters.openDateFrom"
          :to="filters.openDateTo"
          @update:from="filters.openDateFrom = $event"
          @update:to="filters.openDateTo = $event"
        />
        <FilterTextPill
          v-model="filters.manager"
          label="담당자"
          placeholder="담당자명"
          @enter="search"
        />
        <FilterTextPill
          v-model="filters.itVoc"
          label="IT-VOC"
          placeholder="IT-VOC 번호"
          @enter="search"
        />
        <FilterTextPill
          v-model="filters.jira"
          label="JIRA"
          placeholder="JIRA 번호"
          @enter="search"
        />
        <FilterSelectPill
          v-model="filters.initiator"
          label="발의주체"
          :options="initiatorPillOptions"
          empty-label="선택"
        />
        <FilterSelectPill
          v-model="filters.devType"
          label="개발구분"
          :options="devTypePillOptions"
          empty-label="선택"
        />
        <FilterSelectPill
          v-model="filters.summary"
          label="적요"
          :options="summaryPillOptions"
          empty-label="선택"
        />
        <div class="sfb-check-groups" style="grid-column: 1 / -1">
          <div class="sfb-check-group">
            <span class="sfb-check-group__label">시스템구분</span>
            <div class="sfb-check-group__list">
              <label v-for="s in systemOptions" :key="s" class="sfb-check">
                <input
                  type="checkbox"
                  :checked="filters.systems.includes(s)"
                  @change="toggleSystem(s)"
                />
                {{ s }}
              </label>
            </div>
          </div>
          <div class="sfb-check-group">
            <span class="sfb-check-group__label">업무구분</span>
            <div class="sfb-check-group__list">
              <label v-for="c in bizCategoryOptions" :key="c" class="sfb-check">
                <input
                  type="checkbox"
                  :checked="filters.bizCategories.includes(c)"
                  @change="toggleBizCategory(c)"
                />
                {{ c }}
              </label>
            </div>
          </div>
        </div>
      </template>
    </SearchFilterBar>

    <!-- 프로젝트 목록 -->
    <section class="card listcard">
      <div class="listcard__toolbar">
        <span class="listcard__cnt">총 <b>{{ filteredProjects.length }}</b>건</span>
        <div class="listcard__actions">
          <select v-model="pageSize" class="listcard__pagesize" @change="onPageSizeChange">
            <option v-for="n in pageSizeOptions" :key="n" :value="n">{{ n }}건씩 보기</option>
          </select>
          <ExcelDownloadButton @click="onExcelDownload" />
        </div>
      </div>

      <div class="listcard__scroll">
        <table class="tbl">
          <thead>
            <tr>
              <th>No.</th>
              <th>프로젝트ID</th>
              <th>프로젝트명</th>
              <th>처리단계</th>
              <th>공정률</th>
              <th>예정일<br />오픈일</th>
              <th>요청부서</th>
              <th>담당개발부서</th>
              <th>IT-VOC</th>
              <th>JIRA</th>
            </tr>
          </thead>
          <tbody>
            <tr
              v-for="(row, idx) in pagedProjects"
              :key="row.id"
              class="tbl__row"
            >
              <td>{{ (currentPage - 1) * pageSize + idx + 1 }}</td>
              <td>{{ row.projectId }}</td>
              <td>
                <button type="button" class="tbl__link" @click="onProjectClick(row)">
                  {{ row.name }}
                </button>
              </td>
              <td>
                <span class="stbadge" :class="row.stageType">{{ row.stage }}</span>
              </td>
              <td>
                <div class="prog-wrap">
                  <div class="bar">
                    <i :style="{ width: `${row.progress}%` }"></i>
                  </div>
                  <span>{{ row.progress }}%</span>
                </div>
              </td>
              <td class="tbl__dates">
                <span>{{ row.scheduledOpenDate }}</span>
                <template v-if="row.actualOpenDate">
                  <button
                    v-if="row.isOverdue"
                    type="button"
                    class="tbl__date tbl__date--over"
                    @click="onOverdueClick(row)"
                  >
                    {{ row.actualOpenDate }}
                  </button>
                  <span v-else>{{ row.actualOpenDate }}</span>
                </template>
                <span v-else class="tbl__date--empty">-</span>
              </td>
              <td>
                <button type="button" class="tbl__link" @click="onDeptClick(row)">
                  {{ row.requestDept }}
                </button>
              </td>
              <td>{{ row.devDept }}</td>
              <td>{{ row.itVoc }}</td>
              <td>
                <button type="button" class="tbl__link" @click="onJiraClick(row.jira)">
                  {{ row.jira }}
                </button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <div class="pager">
        <button
          type="button"
          class="pager__pg"
          :disabled="currentPage <= 1"
          @click="currentPage = Math.max(1, currentPage - 1)"
        >
          «
        </button>
        <button
          v-for="p in totalPages"
          :key="p"
          type="button"
          class="pager__pg"
          :class="{ 'pager__pg--on': p === currentPage }"
          @click="currentPage = p"
        >
          {{ p }}
        </button>
        <button
          type="button"
          class="pager__pg"
          :disabled="currentPage >= totalPages"
          @click="currentPage = Math.min(totalPages, currentPage + 1)"
        >
          »
        </button>
      </div>
    </section>

    <ScheduleChangeModal v-model="showScheduleModal" :data="scheduleModalData" />
    <RequirementListModal
      v-model="showRequirementModal"
      :context="requirementContext"
    />
  </div>
</template>

<style scoped>
.project-status {
  font-family: var(--font-family);
  color: var(--lnb-txt);
  padding: 0 24px 28px;
}

.card {
  background: var(--lnb-side);
  border: 1px solid var(--lnb-line);
  border-radius: 10px;
}

.sfb-check-groups {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.sfb-check-group__label {
  display: block;
  font-size: calc(11px + var(--font-size-offset, 0px));
  color: var(--lnb-muted);
  font-weight: 600;
  margin-bottom: 4px;
}

.sfb-check-group__list {
  display: flex;
  flex-wrap: wrap;
  gap: 4px 14px;
  padding: 2px 0;
}

.sfb-check {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  font-size: calc(12px + var(--font-size-offset, 0px));
  font-weight: 500;
  color: var(--lnb-txt);
  cursor: pointer;
}

.kpi-row {
  display: grid;
  grid-template-columns: repeat(5, 1fr);
  gap: 10px;
  margin-bottom: 14px;
}

.kpi {
  text-align: left;
  padding: 12px 14px;
  cursor: pointer;
  transition: border-color 0.15s, background 0.15s;
  position: relative;
  border: 1px solid var(--lnb-line);
}

.kpi:hover {
  border-color: var(--teal-100);
}

.kpi--active {
  border-color: var(--teal);
  background: var(--teal-50);
}

.kpi__lab {
  font-size: calc(11.5px + var(--font-size-offset, 0px));
  color: var(--lnb-muted);
  display: flex;
  align-items: center;
  gap: 4px;
}

.kpi__info {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 16px;
  height: 16px;
  border-radius: 50%;
  background: var(--lnb-hover);
  color: var(--lnb-muted);
  font-size: calc(10px + var(--font-size-offset, 0px));
  font-weight: 800;
}

.kpi__num {
  display: block;
  font-size: calc(22px + var(--font-size-offset, 0px));
  font-weight: 800;
  margin-top: 2px;
  color: var(--lnb-logo);
}

.kpi__num small {
  font-size: calc(13px + var(--font-size-offset, 0px));
  font-weight: 600;
  margin-left: 2px;
}

.kpi__num--blue { color: var(--blue); }
.kpi__num--green { color: var(--green); }
.kpi__num--red { color: var(--red); }
.kpi__num--gray { color: var(--gray); }

.kpi__tooltip {
  position: absolute;
  left: 12px;
  right: 12px;
  top: calc(100% + 6px);
  background: var(--lnb-side);
  border: 1px solid var(--lnb-line);
  color: var(--lnb-txt);
  font-size: calc(11px + var(--font-size-offset, 0px));
  font-weight: 500;
  padding: 8px 12px;
  border-radius: var(--radius-md);
  box-shadow: var(--shadow-md);
  line-height: 1.5;
  z-index: 20;
  pointer-events: none;
}

.listcard {
  overflow: hidden;
}

.listcard__toolbar {
  display: flex;
  align-items: center;
  padding: 14px 16px;
  gap: 12px;
  border-bottom: 1px solid var(--lnb-line);
}

.listcard__cnt {
  font-size: calc(12px + var(--font-size-offset, 0px));
}

.listcard__cnt b {
  color: var(--teal-600);
}

.listcard__actions {
  margin-left: auto;
  display: flex;
  align-items: center;
  gap: 8px;
}

.listcard__pagesize {
  height: 28px;
  border: 1px solid var(--lnb-line);
  border-radius: 6px;
  padding: 0 8px;
  font-size: calc(11.5px + var(--font-size-offset, 0px));
  font-family: inherit;
  background: var(--lnb-side);
  color: var(--lnb-txt);
}

.listcard__scroll {
  overflow-x: auto;
}

.tbl {
  width: 100%;
  border-collapse: collapse;
  font-size: calc(12.5px + var(--font-size-offset, 0px));
}

.tbl thead th {
  background: var(--lnb-hover);
  color: var(--lnb-txt);
  font-weight: 600;
  text-align: center;
  padding: 9px 12px;
  border-bottom: 1px solid var(--lnb-line);
  white-space: nowrap;
  vertical-align: bottom;
}

.tbl tbody td {
  padding: 11px 12px;
  border-bottom: 1px solid var(--color-border-2);
  color: var(--lnb-txt);
  vertical-align: middle;
}

.tbl tbody tr:last-child td {
  border-bottom: none;
}

.tbl__row:hover {
  background: var(--teal-50);
}

.tbl__link {
  border: none;
  background: none;
  padding: 0;
  font: inherit;
  color: var(--teal-600);
  text-decoration: underline;
  text-underline-offset: 2px;
  cursor: pointer;
  text-align: left;
}

.tbl__dates {
  line-height: 1.45;
}

.tbl__dates span,
.tbl__dates button {
  display: block;
}

.tbl__date--over {
  border: none;
  background: none;
  padding: 0;
  font: inherit;
  color: var(--red);
  text-decoration: underline;
  cursor: pointer;
}

.tbl__date--empty {
  color: var(--lnb-muted);
}

.prog-wrap {
  display: flex;
  align-items: center;
  gap: 8px;
  min-width: 50px;
  max-width: 50%;
}

.bar {
  flex: 1;
  height: 6px;
  background: var(--line-2);
  border-radius: 6px;
  overflow: hidden;
  min-width: 25px;
}

.bar i {
  display: block;
  height: 100%;
  background: var(--teal);
}

.stbadge {
  font-size: calc(11px + var(--font-size-offset, 0px));
  font-weight: 700;
  padding: 3px 9px;
  border-radius: 20px;
  display: inline-block;
  white-space: nowrap;
}

.stbadge.recv { color: var(--gray); background: var(--gray-bg); }
.stbadge.prog { color: var(--blue); background: var(--blue-bg); }
.stbadge.test { color: var(--orange); background: var(--orange-bg); }
.stbadge.done { color: var(--green); background: var(--green-bg); }
.stbadge.rej { color: var(--red); background: var(--red-bg); }

.pager {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 4px;
  padding: 16px;
}

.pager__pg {
  min-width: 28px;
  height: 28px;
  border-radius: 7px;
  border: 1px solid var(--lnb-line);
  background: var(--lnb-side);
  color: var(--lnb-txt);
  font-size: calc(12px + var(--font-size-offset, 0px));
  cursor: pointer;
  font-family: inherit;
}

.pager__pg:disabled {
  opacity: 0.4;
  cursor: not-allowed;
}

.pager__pg--on {
  background: var(--teal);
  border-color: var(--teal);
  color: var(--color-text-inverse);
  font-weight: 700;
}

@media (max-width: 1200px) {
  .kpi-row {
    grid-template-columns: repeat(3, 1fr);
  }
  .listcard__toolbar {
    flex-wrap: wrap;
  }
}
</style>
