<script setup>
// PAG-M-PST-01 프로젝트 현황 — h-pms ProjectStatusPage UI 기준
import { computed, onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import {
  projectStatusMeta,
  projectStatusList,
  requestDepts,
  devDepts,
  stageOptions,
  pageSizeOptions,
  calculateStatusKpi,
  filterProjectStatusList,
  initiatorOptions,
  devTypeOptions,
  summaryOptions,
} from '@/entities/project-status/mock/projectStatus'
import { getScheduleChange } from '@/entities/dashboard/mock/scheduleChange'
import ScheduleChangeModal from '@/pages/integrated/dashboard/ScheduleChangeModal.vue'
import RequirementListModal from '@/pages/integrated/dashboard/RequirementListModal.vue'
import SearchFilterBar from '@/shared/ui/SearchFilterBar.vue'
import FilterSelectPill from '@/shared/ui/FilterSelectPill.vue'
import FilterTextPill from '@/shared/ui/FilterTextPill.vue'
import FilterDateRange from '@/shared/ui/FilterDateRange.vue'
import HpPagination from '@/shared/ui/HpPagination.vue'
import { useProjectStore } from '@/app/stores/project'

const router = useRouter()
const projectStore = useProjectStore()

const loading = ref(false)
const allProjects = ref([...projectStatusList])
const statusKpi = ref(calculateStatusKpi(allProjects.value))
const barsFilled = ref(false)

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

const showScheduleModal = ref(false)
const scheduleModalData = ref(null)
const showRequirementModal = ref(false)
const requirementContext = ref(null)
const showInProgressTip = ref(false)

const filteredProjects = computed(() =>
  filterProjectStatusList(allProjects.value, activeKpi.value, appliedFilters.value),
)

const pagedProjects = computed(() => {
  const start = (currentPage.value - 1) * pageSize.value
  return filteredProjects.value.slice(start, start + pageSize.value)
})

const totalPages = computed(() =>
  Math.max(1, Math.ceil(filteredProjects.value.length / pageSize.value)),
)

const filteredCount = computed(() => filteredProjects.value.length)

function startBarAnimation() {
  barsFilled.value = false
  requestAnimationFrame(() => {
    setTimeout(() => {
      barsFilled.value = true
    }, 60)
  })
}

onMounted(() => {
  loading.value = true
  statusKpi.value = calculateStatusKpi(allProjects.value)
  loading.value = false
  startBarAnimation()
})

function resetFilters() {
  barsFilled.value = false
  filters.value = emptyFilters()
  appliedFilters.value = { ...filters.value }
  activeKpi.value = 'total'
  currentPage.value = 1
  startBarAnimation()
}

function search() {
  barsFilled.value = false
  appliedFilters.value = {
    ...filters.value,
    systems: [...filters.value.systems],
    bizCategories: [...filters.value.bizCategories],
  }
  currentPage.value = 1
  startBarAnimation()
}

function onKpiClick(key) {
  barsFilled.value = false
  activeKpi.value = key
  filters.value.stage = '전체'
  appliedFilters.value = { ...filters.value }
  currentPage.value = 1
  startBarAnimation()
}

function onProjectClick(row) {
  projectStore.setCurrentProject({ id: row.projectId, name: row.name, isDraft: false })
  router.push('/workspace/info')
}

function onDeptClick(row) {
  requirementContext.value = {
    id: row.id,
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
  window.alert('서버 엑셀 다운로드 API 연동 예정')
}

function onPageSizeChange() {
  currentPage.value = 1
  barsFilled.value = false
  startBarAnimation()
}
</script>

<template>
  <div class="project-status admin-page hp-anim-enter">
    <p class="project-status__hint">{{ projectStatusMeta.hint }}</p>

    <template v-if="!loading">
      <SearchFilterBar
        v-model:expanded="filterExpanded"
        v-model:search="filters.keyword"
        search-placeholder="프로젝트명 또는 프로젝트ID"
        @reset="resetFilters"
        @search="search"
      >
        <template #primary>
          <FilterSelectPill
            v-model="filters.requestDept"
            class="sfb-w-lg"
            label="요청부서"
            empty-label="선택"
            :options="[{ value: '', label: '선택' }, ...requestDepts]"
          />
          <FilterSelectPill
            v-model="filters.devDept"
            class="sfb-w-lg"
            label="담당개발부서"
            empty-label="선택"
            :options="[{ value: '', label: '선택' }, ...devDepts]"
          />
          <FilterSelectPill
            v-model="filters.stage"
            class="sfb-w-md"
            label="처리단계"
            :options="stageOptions"
          />
        </template>

        <template #expand>
          <FilterDateRange
            label="오픈일"
            :from="filters.openDateFrom"
            :to="filters.openDateTo"
            fill
            @update:from="filters.openDateFrom = $event"
            @update:to="filters.openDateTo = $event"
          />
          <FilterTextPill
            v-model="filters.manager"
            label="담당자"
            placeholder="담당자명"
            fill
            @enter="search"
          />
          <FilterTextPill
            v-model="filters.itVoc"
            label="IT-VOC"
            placeholder="IT-VOC 번호"
            fill
            @enter="search"
          />
          <FilterTextPill
            v-model="filters.jira"
            label="JIRA"
            placeholder="JIRA 번호"
            fill
            @enter="search"
          />
          <FilterSelectPill
            v-model="filters.initiator"
            label="발의주체"
            empty-label="선택"
            fill
            :options="[{ value: '', label: '선택' }, ...initiatorOptions]"
          />
          <FilterSelectPill
            v-model="filters.devType"
            label="개발구분"
            empty-label="선택"
            fill
            :options="[{ value: '', label: '선택' }, ...devTypeOptions]"
          />
          <FilterSelectPill
            v-model="filters.summary"
            label="적요"
            empty-label="선택"
            fill
            :options="[{ value: '', label: '선택' }, ...summaryOptions]"
          />
        </template>
      </SearchFilterBar>

      <section class="kpi-row">
        <button type="button" class="kpi card card--panel" :class="{ 'kpi--active': activeKpi === 'total' }" @click="onKpiClick('total')">
          <span class="kpi__lab">전체 프로젝트</span>
          <span class="kpi__num">{{ statusKpi.total }}<small>건</small></span>
        </button>
        <button type="button" class="kpi card card--panel" :class="{ 'kpi--active': activeKpi === 'received' }" @click="onKpiClick('received')">
          <span class="kpi__lab">접수</span>
          <span class="kpi__num kpi__num--gray">{{ statusKpi.received }}<small>건</small></span>
        </button>
        <button
          type="button"
          class="kpi card card--panel kpi--tip"
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
        <button type="button" class="kpi card card--panel" :class="{ 'kpi--active': activeKpi === 'completed' }" @click="onKpiClick('completed')">
          <span class="kpi__lab">완료</span>
          <span class="kpi__num kpi__num--green">{{ statusKpi.completed }}<small>건</small></span>
        </button>
        <button type="button" class="kpi card card--panel" :class="{ 'kpi--active': activeKpi === 'rejected' }" @click="onKpiClick('rejected')">
          <span class="kpi__lab">반려</span>
          <span class="kpi__num kpi__num--red">{{ statusKpi.rejected }}<small>건</small></span>
        </button>
      </section>

      <section class="card card--panel listcard">
        <div class="listcard__toolbar">
          <span class="listcard__cnt">총 <b>{{ filteredCount }}</b>건</span>
          <div class="listcard__actions">
            <select v-model="pageSize" class="listcard__pagesize" @change="onPageSizeChange">
              <option v-for="n in pageSizeOptions" :key="n" :value="n">{{ n }}건씩 보기</option>
            </select>
            <button type="button" class="btn btn--ghost" @click="onExcelDownload">엑셀 다운로드</button>
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
                <th>예정일 / 오픈일</th>
                <th>요청부서</th>
                <th>담당개발부서</th>
                <th>IT-VOC</th>
                <th>JIRA</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="row in pagedProjects" :key="row.id" class="tbl__row">
                <td>{{ row.no }}</td>
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
                    <div class="bar hp-anim-progress" :class="{ 'is-filled': barsFilled }">
                      <i :style="{ width: barsFilled ? `${row.progress}%` : '0%' }"></i>
                    </div>
                    <span>{{ row.progress }}%</span>
                  </div>
                </td>
                <td class="tbl__dates">
                  <span>{{ row.scheduledOpenDate }}</span>
                  <span class="tbl__dates-sep"> / </span>
                  <template v-if="row.actualOpenDate">
                    <button v-if="row.isOverdue" type="button" class="tbl__date tbl__date--over" @click="onOverdueClick(row)">
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

        <HpPagination v-model:page="currentPage" :total-pages="totalPages" />
      </section>

      <ScheduleChangeModal v-model="showScheduleModal" :data="scheduleModalData" />
      <RequirementListModal v-model="showRequirementModal" :context="requirementContext" />
    </template>
  </div>
</template>

<style scoped>
.project-status {
  padding: 1rem 1.5rem 1.5rem;
}

.project-status__hint {
  margin: 0 0 0.9rem;
  font-size: 0.7rem;
  color: var(--muted);
  background: var(--color-bg-subtle);
  border: 1px solid var(--line);
  display: inline-block;
  padding: 0.15rem 0.6rem;
  border-radius: 999px;
}

.kpi-row {
  display: grid;
  grid-template-columns: repeat(5, 1fr);
  gap: 0.6rem;
  margin-bottom: 0.9rem;
}

.kpi {
  text-align: left;
  padding: 0.75rem 0.85rem;
  cursor: pointer;
  position: relative;
  border: 1px solid var(--line);
}

.kpi--active {
  border-color: var(--teal);
  background: var(--teal-50);
}

.kpi__lab {
  font-size: 0.7rem;
  color: var(--muted);
  display: flex;
  align-items: center;
  gap: 0.25rem;
}

.kpi__info {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 14px;
  height: 14px;
  border-radius: 50%;
  background: var(--orange-bg);
  color: var(--orange);
  font-size: 0.6rem;
  font-weight: 800;
}

.kpi__num {
  display: block;
  font-size: 1.35rem;
  font-weight: 800;
  margin-top: 0.1rem;
}

.kpi__num small {
  font-size: 0.8rem;
  font-weight: 600;
  margin-left: 0.1rem;
}

.kpi__num--blue { color: var(--blue); }
.kpi__num--green { color: var(--green); }
.kpi__num--red { color: var(--red); }
.kpi__num--gray { color: var(--muted); }

.kpi__tooltip {
  position: absolute;
  left: 0.75rem;
  right: 0.75rem;
  top: calc(100% + 0.4rem);
  background: #1f2937;
  color: #f9fafb;
  font-size: 0.65rem;
  padding: 0.5rem 0.6rem;
  border-radius: 8px;
  line-height: 1.5;
  z-index: 5;
  pointer-events: none;
}

.listcard {
  overflow: hidden;
}

.listcard__toolbar {
  display: flex;
  align-items: center;
  padding: 0.9rem 1rem;
  gap: 0.75rem;
  border-bottom: 1px solid var(--line);
}

.listcard__cnt {
  font-size: 0.75rem;
}

.listcard__cnt b {
  color: var(--teal);
}

.listcard__actions {
  margin-left: auto;
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.listcard__pagesize {
  height: 28px;
  border: 1px solid var(--color-border);
  border-radius: 6px;
  padding: 0 0.5rem;
  font-size: 0.7rem;
  font-family: inherit;
}

.listcard__scroll {
  overflow-x: auto;
}

.tbl {
  width: 100%;
  border-collapse: collapse;
  font-size: 0.75rem;
}

.tbl thead th {
  background: var(--color-bg-subtle);
  color: var(--color-text);
  font-weight: 600;
  text-align: center;
  padding: 0.55rem 0.75rem;
  border-bottom: 1px solid var(--line);
  white-space: nowrap;
  vertical-align: bottom;
}

.tbl tbody td {
  padding: 0.65rem 0.75rem;
  border-bottom: 1px solid var(--line-2);
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
  color: var(--teal);
  text-decoration: underline;
  text-underline-offset: 2px;
  cursor: pointer;
  text-align: left;
}

.tbl__dates {
  white-space: nowrap;
}

.tbl__dates-sep {
  color: var(--muted);
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
  color: var(--muted);
}

.prog-wrap {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  min-width: 100px;
}

.bar {
  flex: 1;
  height: 6px;
  background: var(--line);
  border-radius: 6px;
  overflow: hidden;
  min-width: 50px;
}

.bar i {
  display: block;
  height: 100%;
  border-radius: inherit;
  background: var(--teal);
}

.stbadge {
  font-size: 0.65rem;
  font-weight: 700;
  padding: 0.15rem 0.55rem;
  border-radius: 20px;
  display: inline-block;
  white-space: nowrap;
  background: var(--line);
}

.stbadge.recv { color: var(--muted); background: var(--line-2); }
.stbadge.prog { color: var(--blue); background: var(--blue-bg); }
.stbadge.test { color: var(--orange); background: var(--orange-bg); }
.stbadge.done { color: var(--green); background: var(--green-bg); }
.stbadge.rej { color: var(--red); background: var(--red-bg); }

@media (max-width: 1200px) {
  .kpi-row {
    grid-template-columns: repeat(3, 1fr);
  }
  .listcard__toolbar {
    flex-wrap: wrap;
  }
}
</style>
