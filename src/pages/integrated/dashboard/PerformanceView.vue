<script setup>
// pasted into PerformanceView.vue
import { computed, onMounted, ref, watch } from 'vue'
import {
  performanceMeta,
  performanceSummary,
  performanceRecords,
  deptOptions as mockDeptOptions,
  statusOptions as mockStatusOptions,
  initiators as mockInitiators,
  devTypes as mockDevTypes,
  summaries as mockSummaries,
} from '@/entities/dashboard/mock/performance'
import { pageSizeOptions } from '@/shared/lib/commonOptions'
import BaseTooltip from '@/shared/ui/BaseTooltip.vue'
import HpPagination from '@/shared/ui/HpPagination.vue'
import HpDonutChart from '@/shared/ui/HpDonutChart.vue'
import SearchFilterBar from '@/shared/ui/SearchFilterBar.vue'
import FilterSelectPill from '@/shared/ui/FilterSelectPill.vue'
import FilterTextPill from '@/shared/ui/FilterTextPill.vue'
import FilterDateRange from '@/shared/ui/FilterDateRange.vue'

const scheduleStatusLabel = {
  DELAYED: '경과',
  SHORTENED: '단축',
  NORMAL: '정상',
  NONE: '-',
}
const scheduleStatusClass = {
  DELAYED: 'delay',
  SHORTENED: 'short',
  NORMAL: 'normal',
  NONE: 'none',
}

function mapScheduleStatus(status) {
  if (status === 'delay') return 'DELAYED'
  if (status === 'short') return 'SHORTENED'
  if (status === 'normal') return 'NORMAL'
  return 'NONE'
}

function mapPerson(row) {
  return {
    assigneeId: row.id,
    name: row.name,
    empNo: row.empId,
    dept: row.dept,
    position: row.position,
    projectCount: row.projectCount,
    totalMd: row.totalMd,
    projects: row.projects.map((p, i) => ({
      projectId: p.id || `${row.id}-${i}`,
      name: p.name,
      projectMd: p.md,
      openDate: p.openDate,
      taskCount: p.taskCount,
      delayedCount: p.delayedCount,
      planMd: p.planMd,
      execMd: p.execMd,
      scheduleStatus: mapScheduleStatus(p.scheduleStatus),
    })),
  }
}

const sourcePersons = performanceRecords.map(mapPerson)
const projectCatalog = []
sourcePersons.forEach((person) => {
  person.projects.forEach((p) => {
    if (!projectCatalog.some((x) => x.id === p.projectId)) {
      projectCatalog.push({ id: p.projectId, projectNo: p.projectId, name: p.name })
    }
  })
})

const meta = ref({ notice: performanceMeta.notice, queryTime: performanceMeta.queryTime })
const summary = ref({ ...performanceSummary })
const initiators = ref([...mockInitiators])
const devTypes = ref([...mockDevTypes])
const summaries = ref([...mockSummaries])
const records = ref([])
const recordsTotal = ref(0)
const totalPages = ref(1)
const deptOptions = ref([...mockDeptOptions])
const statusOptions = ref([...mockStatusOptions])
const monthPresets = ref(['당해년도', '전월', '당월', '직접입력'])
const initiatorOptions = ref(initiators.value.map((i) => i.label))
const devTypeOptions = ref(devTypes.value.map((d) => d.label))
const summaryOptions = ref(summaries.value.map((s) => s.label))

const filterExpanded = ref(false)
const pageSize = ref(20)
const currentPage = ref(1)
const barsFilled = ref(false)
const loadFailed = ref(false)
const projectHint = ref(false)
const projectCandidates = ref([])
const projectSuggestOpen = ref(false)
let projectSearchTimer = null

function toIsoDate(d) {
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

function monthRange(offset) {
  const now = new Date()
  const from = new Date(now.getFullYear(), now.getMonth() + offset, 1)
  const to = new Date(now.getFullYear(), now.getMonth() + offset + 1, 0)
  return { from: toIsoDate(from), to: toIsoDate(to) }
}

function yearRange() {
  const y = new Date().getFullYear()
  return { from: `${y}-01-01`, to: `${y}-12-31` }
}

function buildDefaultFilters() {
  const year = yearRange()
  return {
    dept: '전체',
    openFrom: year.from,
    openTo: year.to,
    monthPreset: '당해년도',
    status: '전체',
    projectId: null,
    projectLabel: '',
    member: '',
    initiator: '',
    devType: '',
    summary: '',
  }
}

const defaultFilters = buildDefaultFilters()
const filters = ref({ ...defaultFilters })
const appliedFilters = ref({ ...defaultFilters })

function startBarAnimation() {
  requestAnimationFrame(() => {
    setTimeout(() => {
      barsFilled.value = true
    }, 60)
  })
}

function filterPersons() {
  const f = appliedFilters.value
  return sourcePersons.filter((row) => {
    if (f.dept !== '전체' && row.dept !== f.dept) return false
    if (f.member) {
      const q = f.member.toLowerCase()
      if (!row.name.includes(q) && !String(row.empNo).includes(q)) return false
    }
    if (f.projectId != null) {
      const hasProject = row.projects.some((p) => p.projectId === f.projectId)
      if (!hasProject) return false
    }
    if (f.initiator || f.devType || f.summary) {
      // mock has no per-person axis fields — keep all rows when expand filters set
    }
    return true
  })
}

function load() {
  barsFilled.value = false
  const list = filterPersons()
  recordsTotal.value = list.length
  totalPages.value = Math.max(1, Math.ceil(list.length / pageSize.value))
  if (currentPage.value > totalPages.value) currentPage.value = totalPages.value
  const start = (currentPage.value - 1) * pageSize.value
  records.value = list.slice(start, start + pageSize.value)
  loadFailed.value = false
  startBarAnimation()
}

onMounted(load)

watch(currentPage, () => load())
watch(pageSize, () => {
  if (currentPage.value !== 1) currentPage.value = 1
  else load()
})

const toSegments = (items) => items.map((i) => ({ value: i.count, color: i.color, label: i.label }))
const initiatorSegments = computed(() => toSegments(initiators.value))
const devTypeSegments = computed(() => toSegments(devTypes.value))
const initiatorTotal = computed(() => initiators.value.reduce((s, i) => s + i.count, 0))
const devTypeTotal = computed(() => devTypes.value.reduce((s, i) => s + i.count, 0))
const summaryMax = computed(() => Math.max(...summaries.value.map((s) => s.count), 1))
const isEmptyResult = computed(() => !loadFailed.value && summary.value.projectCount === 0)
const recordsEmptyMessage = computed(() => {
  if (loadFailed.value) return '조회에 실패했습니다. 다시 조회해 주세요.'
  if (isEmptyResult.value) return '조회 구간에 완료·반려 프로젝트가 없습니다.'
  return '조회 조건에 해당하는 투입 인력이 없습니다.'
})
const statusSelectOptions = computed(() => statusOptions.value.map((s) => ({ value: s, label: s })))

function onMonthPresetSelect(value) {
  filters.value.monthPreset = value
  onMonthPresetChange()
}

function pct(count, total) {
  return total ? Math.round((count / total) * 100) : 0
}

function onPageSizeChange() {
  currentPage.value = 1
  load()
}

function onMonthPresetChange() {
  if (filters.value.monthPreset === '당해년도') {
    const range = yearRange()
    filters.value.openFrom = range.from
    filters.value.openTo = range.to
  } else if (filters.value.monthPreset === '전월') {
    const range = monthRange(-1)
    filters.value.openFrom = range.from
    filters.value.openTo = range.to
  } else if (filters.value.monthPreset === '당월') {
    const range = monthRange(0)
    filters.value.openFrom = range.from
    filters.value.openTo = range.to
  }
}

function onProjectLabelChange(value) {
  filters.value.projectLabel = value
  onProjectLabelInput()
}

function onProjectLabelInput() {
  filters.value.projectId = null
  projectHint.value = false
  const keyword = filters.value.projectLabel.trim()
  if (projectSearchTimer) clearTimeout(projectSearchTimer)
  if (keyword.length < 2) {
    projectCandidates.value = []
    projectSuggestOpen.value = false
    return
  }
  projectSearchTimer = setTimeout(() => {
    const q = keyword.toLowerCase()
    projectCandidates.value = projectCatalog.filter(
      (c) => c.name.toLowerCase().includes(q) || String(c.projectNo).toLowerCase().includes(q),
    )
    projectSuggestOpen.value = projectCandidates.value.length > 0
  }, 250)
}

function selectProjectCandidate(candidate) {
  filters.value.projectId = candidate.id
  filters.value.projectLabel = `${candidate.projectNo} ${candidate.name}`
  projectCandidates.value = []
  projectSuggestOpen.value = false
  projectHint.value = false
}

function clearProjectFilter() {
  filters.value.projectId = null
  filters.value.projectLabel = ''
  projectCandidates.value = []
  projectSuggestOpen.value = false
  projectHint.value = false
}

function search() {
  if (!filters.value.openFrom || !filters.value.openTo) return
  if (filters.value.openFrom > filters.value.openTo) return
  projectHint.value = Boolean(filters.value.projectLabel.trim()) && filters.value.projectId == null
  appliedFilters.value = {
    ...filters.value,
    projectId: filters.value.projectId,
    projectLabel: filters.value.projectId ? filters.value.projectLabel : '',
  }
  currentPage.value = 1
  load()
}

const filterTags = computed(() => {
  const f = filters.value
  const tags = []
  if (f.projectId != null) tags.push({ key: 'project', label: '프로젝트', value: f.projectLabel })
  if (f.member) tags.push({ key: 'member', label: '담당자', value: f.member })
  if (f.initiator) tags.push({ key: 'initiator', label: '발의주체', value: f.initiator })
  if (f.devType) tags.push({ key: 'devType', label: '개발구분', value: f.devType })
  if (f.summary) tags.push({ key: 'summary', label: '적요', value: f.summary })
  return tags
})

function removeFilterTag(key) {
  if (key === 'project') {
    clearProjectFilter()
    return
  }
  filters.value[key] = ''
}

function resetFilters() {
  const next = buildDefaultFilters()
  filters.value = { ...next }
  appliedFilters.value = { ...next }
  projectHint.value = false
  projectCandidates.value = []
  projectSuggestOpen.value = false
  currentPage.value = 1
  load()
}
</script>

<template>
  <div class="performance hp-anim-enter">
    <p class="hint">{{ meta.notice }}</p>

    <SearchFilterBar
      v-model:expanded="filterExpanded"
      :show-search="false"
      :applied-tags="filterTags"
      @reset="resetFilters"
      @search="search"
      @remove-tag="removeFilterTag"
    >
      <template #primary>
        <FilterSelectPill
          v-model="filters.dept"
          class="sfb-w-sm"
          label="부서"
          :options="deptOptions"
        />
        <!-- 오픈일은 월 프리셋 + 기간이 한 조건이었다 — 순서만 유지하고 알약 두 개로 나눈다. -->
        <FilterSelectPill
          class="sfb-w-sm"
          label="오픈월"
          :model-value="filters.monthPreset"
          :options="monthPresets"
          @update:model-value="onMonthPresetSelect"
        />
        <FilterDateRange
          label="오픈일"
          :from="filters.openFrom"
          :to="filters.openTo"
          @update:from="filters.openFrom = $event"
          @update:to="filters.openTo = $event"
        />
        <FilterSelectPill
          v-model="filters.status"
          class="sfb-w-lg"
          label="상태"
          :options="statusSelectOptions"
        />
      </template>

      <template #expand>
        <!-- 프로젝트는 부분일치가 아니라 목록에서 고른 1건(projectId)만 조건이 된다
             (SB-PAG-M-DAS-06-R02). 입력칸은 후보 검색용이다. -->
        <div class="project-suggest">
          <FilterTextPill
            label="프로젝트"
            placeholder="프로젝트명 또는 ID (2글자+)"
            fill
            :model-value="filters.projectLabel"
            @update:model-value="onProjectLabelChange"
            @enter="search"
            @focus="projectSuggestOpen = projectCandidates.length > 0"
          >
            <template #trailing>
              <button
                v-if="filters.projectLabel"
                type="button"
                class="project-suggest__clear"
                aria-label="프로젝트 필터 지우기"
                @click="clearProjectFilter"
              >×</button>
            </template>
          </FilterTextPill>
          <ul v-if="projectSuggestOpen" class="project-suggest__list">
            <li v-for="c in projectCandidates" :key="c.id">
              <button type="button" @mousedown.prevent="selectProjectCandidate(c)">
                {{ c.projectNo }} {{ c.name }}
              </button>
            </li>
          </ul>
          <span v-if="projectHint" class="project-suggest__hint">
            목록에서 프로젝트를 선택해야 조건이 적용됩니다
          </span>
        </div>
        <FilterTextPill
          v-model="filters.member"
          label="담당자"
          placeholder="이름 또는 사번"
          fill
          @enter="search"
        />
        <FilterSelectPill
          v-model="filters.initiator"
          label="발의주체"
          fill
          :options="[{ value: '', label: '전체' }, ...initiatorOptions]"
        />
        <FilterSelectPill
          v-model="filters.devType"
          label="개발구분"
          fill
          :options="[{ value: '', label: '전체' }, ...devTypeOptions]"
        />
        <FilterSelectPill
          v-model="filters.summary"
          label="적요"
          fill
          :options="[{ value: '', label: '전체' }, ...summaryOptions]"
        />
      </template>
    </SearchFilterBar>

    <p class="query-time">조회시점 {{ meta.queryTime }}</p>

    <p v-if="loadFailed" class="state-msg state-msg--error">
      실적 데이터 조회에 실패했습니다. 아래 값은 집계 결과가 아닙니다 — 다시 조회해 주세요.
    </p>
    <p v-else-if="isEmptyResult" class="state-msg">
      조회 구간({{ appliedFilters.openFrom }} ~ {{ appliedFilters.openTo }})에 완료·반려 프로젝트가 없습니다.
    </p>

    <section class="card card--panel pad kpi-row">
      <div class="kpi kpi--neutral">
        <span class="kpi__dot"></span>
        <span class="kpi__body"><span class="kpi__lab">수행 프로젝트</span><span class="kpi__num">{{ summary.projectCount }}<small>건</small></span></span>
      </div>
      <div class="kpi kpi--red">
        <span class="kpi__dot"></span>
        <span class="kpi__body">
          <!-- 2026-08-20 확정 — 공수 단위가 MD 달력일이 되면서 MM 환산을 걷어냈고 임계값도
               달력일로 다시 정했다. 서버 PerformanceService.LONG_TERM_CALENDAR_DAYS와 같은 값이어야 한다. -->
          <span class="kpi__lab">장기프로젝트 <BaseTooltip text="계획시작일부터 오픈일까지 60일 이상인 프로젝트의 수" /></span>
          <span class="kpi__num">{{ summary.longTermProjects }}<small>건</small></span>
        </span>
      </div>
      <div class="kpi kpi--violet">
        <span class="kpi__dot"></span>
        <span class="kpi__body">
          <!-- 종전에는 영업일 ÷ 20으로 MM을 보여줬다. MD 일수를 그대로 쓴다(2026-08-20 확정). -->
          <span class="kpi__lab">평균 개발 공수 <BaseTooltip text="업무유형 '개발'의 평균 공수(달력일, 주말 포함)" /></span>
          <span class="kpi__num">{{ summary.avgDevWorkload }}<small>MD</small></span>
        </span>
      </div>
      <div class="kpi kpi--blue">
        <span class="kpi__dot"></span>
        <span class="kpi__body">
          <span class="kpi__lab">프로젝트당 투입 인원
            <BaseTooltip text="조회된 프로젝트에 투입 등록된 인원(중복 제거) ÷ 조회된 프로젝트 수" />
          </span>
          <span class="kpi__num">{{ summary.membersPerProject }}<small>명</small></span>
        </span>
      </div>
    </section>

    <div class="dash-grid dash-grid--3">
      <section class="card card--panel pad">
        <h3 class="sec-title">발의주체</h3>
        <div class="chart-row">
          <HpDonutChart
            class="hp-anim-chart"
            :segments="initiatorSegments"
            :size="120"
            :thickness="32"
            :aria-label="'발의주체 분포'"
          >
            <span class="donut__val">{{ initiatorTotal }}</span>
            <span class="donut__lab">전체</span>
          </HpDonutChart>
          <ul class="legend">
            <li v-for="item in initiators" :key="item.label">
              <span class="sw" :style="{ background: item.color }"></span>
              {{ item.label }} <span class="pct">{{ pct(item.count, initiatorTotal) }}%</span> <b>{{ item.count }}</b>
            </li>
          </ul>
        </div>
      </section>

      <section class="card card--panel pad">
        <h3 class="sec-title">개발구분</h3>
        <div class="chart-row">
          <HpDonutChart
            class="hp-anim-chart"
            :segments="devTypeSegments"
            :size="120"
            :thickness="32"
            :aria-label="'개발구분 분포'"
          >
            <span class="donut__val">{{ devTypeTotal }}</span>
            <span class="donut__lab">전체</span>
          </HpDonutChart>
          <ul class="legend">
            <li v-for="item in devTypes" :key="item.label">
              <span class="sw" :style="{ background: item.color }"></span>
              {{ item.label }} <span class="pct">{{ pct(item.count, devTypeTotal) }}%</span> <b>{{ item.count }}</b>
            </li>
          </ul>
        </div>
      </section>

      <section class="card card--panel pad">
        <h3 class="sec-title">적요</h3>
        <div class="hbar">
          <div v-for="item in summaries" :key="item.label" class="hbar__row">
            <span class="hbar__lab">{{ item.label }}</span>
            <div class="hbar__track">
              <span
                class="hbar__fill hp-anim-progress"
                :class="{ 'is-filled': barsFilled }"
                :style="{ width: barsFilled ? `${(item.count / summaryMax) * 100}%` : '0%' }"
              ></span>
            </div>
            <span class="hbar__val">{{ item.count }}</span>
          </div>
        </div>
      </section>
    </div>

    <section class="card card--panel listcard">
      <div class="listcard__head">
        <h3 class="sec-title">인력별 실적</h3>
        <span>총 <b>{{ recordsTotal }}</b>명</span>
        <select v-model="pageSize" @change="onPageSizeChange">
          <option v-for="n in pageSizeOptions" :key="n" :value="n">{{ n }}건씩 보기</option>
        </select>
        <!-- [SB 미근거 / 2026-08-19 비활성] FO 목업(20191055 PerformanceView.vue:164) 유래.
             SB-PAG-M-DAS-06에 엑셀 다운로드 규정이 없어 껐다. 되살릴 때는
             script/20260819/performance-sb-reconciliation.md §2-E E5를 함께 본다.
        <button type="button" class="ghost" @click="onExcelDownload">엑셀 다운로드</button>
        -->
      </div>
      <div class="listcard__scroll">
        <table class="tbl tbl--grouped">
          <thead>
            <tr>
              <th rowspan="2">No.</th>
              <th colspan="3">인력 정보</th>
              <th colspan="2">투입 프로젝트</th>
              <th colspan="3">프로젝트</th>
              <th colspan="5">투입 결과</th>
            </tr>
            <tr class="tbl__subhead">
              <th>부서</th><th>담당자</th><th>직급</th>
              <th>투입 프로젝트</th><th>투입 공수 합계</th>
              <th>프로젝트명</th><th>공수</th><th>오픈일</th>
              <th>참여 업무 수</th><th>경과 수</th><th>계획 공수</th><th>실행 공수</th><th>계획 준수</th>
            </tr>
          </thead>
          <tbody>
            <tr v-if="!records.length">
              <td colspan="14" class="tbl__empty">{{ recordsEmptyMessage }}</td>
            </tr>
            <template v-for="(person, personIdx) in records" :key="person.assigneeId">
              <tr v-if="person.projects.length === 0" class="tbl__row">
                <td>{{ (currentPage - 1) * pageSize + personIdx + 1 }}</td>
                <td>{{ person.dept || '-' }}</td>
                <td class="tbl__person">{{ person.name }}<span class="tbl__emp">({{ person.empNo || '-' }})</span></td>
                <td>{{ person.position || '-' }}</td>
                <td>0건</td>
                <td>0 MD</td>
                <td colspan="8" class="tbl__empty">투입 프로젝트 없음</td>
              </tr>
              <tr v-for="(proj, pIdx) in person.projects" v-else :key="`${person.assigneeId}-${proj.projectId}`" class="tbl__row">
                <template v-if="pIdx === 0">
                  <td :rowspan="person.projects.length">{{ (currentPage - 1) * pageSize + personIdx + 1 }}</td>
                  <td :rowspan="person.projects.length">{{ person.dept || '-' }}</td>
                  <td :rowspan="person.projects.length" class="tbl__person">
                    {{ person.name }}<span class="tbl__emp">({{ person.empNo || '-' }})</span>
                  </td>
                  <td :rowspan="person.projects.length">{{ person.position || '-' }}</td>
                  <td :rowspan="person.projects.length">{{ person.projectCount }}건</td>
                  <td :rowspan="person.projects.length">{{ person.totalMd }} MD</td>
                </template>
                <td class="tbl__proj">{{ proj.name }}</td>
                <td>{{ proj.projectMd }} MD</td>
                <td>{{ proj.openDate ?? '-' }}</td>
                <td>{{ proj.taskCount > 0 ? `${proj.taskCount}건` : '-' }}</td>
                <td>{{ proj.delayedCount ? `${proj.delayedCount}건` : '-' }}</td>
                <td>{{ proj.planMd }} MD</td>
                <td>{{ proj.execMd }} MD</td>
                <td>
                  <span class="sched-badge" :class="scheduleStatusClass[proj.scheduleStatus]">
                    {{ scheduleStatusLabel[proj.scheduleStatus] }}
                  </span>
                </td>
              </tr>
            </template>
          </tbody>
        </table>
      </div>
      <HpPagination v-model:page="currentPage" :total-pages="totalPages" />
    </section>
  </div>
</template>

<style scoped>
/* font-size는 --font-size-* 토큰 또는 calc(Npx + var(--font-size-offset))을 쓴다.
   rem은 --font-size-offset에 반응하지 않아 내설정>글자 크기가 먹지 않는다(layout.css:3-11 선례). */
.performance { padding: 1rem 1.5rem 1.5rem; }
.hint { margin: 0 0 0.9rem; font-size: var(--font-size-xs); color: var(--lnb-muted); background: var(--lnb-hover); border: 1px solid var(--lnb-line); display: inline-block; padding: 0.15rem 0.6rem; border-radius: 999px; }
.query-time { margin: -0.4rem 0 0.9rem; font-size: var(--font-size-xs); color: var(--lnb-muted); }
.state-msg { margin: -0.4rem 0 0.9rem; font-size: var(--font-size-sm); color: var(--lnb-txt); background: var(--lnb-hover); border: 1px solid var(--lnb-line); border-radius: 8px; padding: 0.5rem 0.7rem; }
.state-msg--error { color: var(--red); background: var(--red-bg); border-color: var(--red); }
.pad { padding: 0.9rem 1rem; }
.sec-title { margin: 0 0 0.7rem; font-size: var(--font-size-md); font-weight: 700; padding-bottom: 10px; border-bottom: 1px solid var(--lnb-line); }
.ghost { height: 32px; padding: 0 0.9rem; border-radius: 7px; font-size: calc(12.5px + var(--font-size-offset)); cursor: pointer; background: var(--lnb-side); border: 1px solid var(--lnb-line); color: var(--lnb-txt); }
.project-suggest { position: relative; }
.project-suggest__clear { border: none; background: none; color: var(--lnb-muted); cursor: pointer; font-size: var(--font-size-lg); line-height: 1; padding: 0 0.2rem; }
.project-suggest__list { position: absolute; z-index: 5; left: 0; right: 0; top: calc(100% + 2px); margin: 0; padding: 0.25rem 0; list-style: none; background: var(--lnb-side); border: 1px solid var(--lnb-line); border-radius: 6px; max-height: 180px; overflow-y: auto; box-shadow: 0 4px 12px rgba(0,0,0,0.08); }
.project-suggest__list button { display: block; width: 100%; text-align: left; border: none; background: none; padding: 0.4rem 0.6rem; font: inherit; font-size: var(--font-size-sm); color: var(--lnb-txt); cursor: pointer; }
.project-suggest__list button:hover { background: var(--lnb-hover); }
.project-suggest__hint { display: block; margin-top: 0.2rem; color: var(--red); font-size: calc(10px + var(--font-size-offset)); }
.kpi-row { display: flex; gap: 12px; margin-bottom: 16px; }
.kpi { flex: 1; display: flex; align-items: center; gap: 10px; border: none; border-radius: var(--radius-card); padding: 16px 16px 14px; transition: transform var(--transition-fast); }
.kpi:hover { transform: translateY(-2px); }
.kpi__dot { flex-shrink: 0; width: 10px; height: 10px; border-radius: 50%; background: currentColor; }
.kpi__body { display: flex; align-items: baseline; gap: 8px; flex-wrap: wrap; }
.kpi__lab { display: inline-flex; align-items: center; gap: 4px; font-size: calc(11.5px + var(--font-size-offset)); color: currentColor; opacity: 0.75; font-weight: 600; }
.kpi__num { display: inline-block; font-size: calc(22px + var(--font-size-offset)); font-weight: 800; color: currentColor; }
.kpi__num small { font-size: var(--font-size-md); font-weight: 600; margin-left: 2px; }
.kpi--neutral { background: var(--gray-bg); color: var(--lnb-logo); }
.kpi--red { background: var(--red-bg); color: var(--red); }
.kpi--violet { background: var(--purple-bg); color: var(--purple); }
.kpi--blue { background: var(--blue-bg); color: var(--blue); }
.dash-grid { display: grid; gap: 0.9rem; margin-bottom: 0.9rem; }
.dash-grid--3 { grid-template-columns: repeat(3, 1fr); }
.chart-row { display: flex; gap: 0.9rem; align-items: center; }
.donut__val { font-size: calc(17px + var(--font-size-offset)); font-weight: 800; }
.donut__lab { font-size: calc(10px + var(--font-size-offset)); color: var(--lnb-muted); }
.legend { list-style: none; margin: 0; padding: 0; display: flex; flex-direction: column; gap: 0.35rem; font-size: var(--font-size-sm); flex: 1; }
.legend li { display: flex; align-items: center; gap: 0.45rem; }
.legend b { margin-left: auto; }
.legend .pct { color: var(--lnb-muted); font-size: var(--font-size-xs); }
.sw { width: 9px; height: 9px; border-radius: 50%; flex-shrink: 0; }
.hbar { display: flex; flex-direction: column; gap: 0.6rem; }
.hbar__row { display: flex; align-items: center; gap: 0.6rem; font-size: var(--font-size-sm); }
.hbar__lab { width: 78px; text-align: right; flex-shrink: 0; }
.hbar__track { flex: 1; height: 16px; background: var(--lnb-hover); border-radius: 8px; overflow: hidden; }
.hbar__fill { display: block; height: 100%; border-radius: inherit; background: var(--teal); }
.hbar__val { width: 26px; text-align: right; font-weight: 700; flex-shrink: 0; }
.listcard__head { display: flex; align-items: center; gap: 0.5rem; padding: 0.9rem 1rem 0.75rem; font-size: var(--font-size-sm); border-bottom: 1px solid var(--lnb-line); }
.listcard__head select { height: 28px; border: 1px solid var(--lnb-line); border-radius: 6px; padding: 0 0.4rem; font-size: var(--font-size-xs); color: var(--lnb-txt); background: var(--lnb-side); }
.listcard__head span { margin-left: auto; }
.listcard__scroll { overflow-x: auto; padding: 0.9rem 1rem 0; }
.tbl { width: 100%; border-collapse: collapse; font-size: var(--font-size-sm); }
.tbl thead th { background: var(--lnb-hover); text-align: center; padding: 0.5rem 0.6rem; border-bottom: 1px solid var(--lnb-line); white-space: nowrap; }
.tbl__subhead th { font-size: var(--font-size-xs); font-weight: 500; }
.tbl tbody td { padding: 0.6rem 0.6rem; border-bottom: 1px solid var(--lnb-line); text-align: center; }
.tbl__row:hover { background: var(--teal-50); }
.tbl__person { font-weight: 600; text-align: left; }
.tbl__emp { display: block; font-size: calc(10px + var(--font-size-offset)); color: var(--lnb-muted); font-weight: 400; }
.tbl__proj { text-align: left; max-width: 220px; line-height: 1.4; }
.tbl__empty { color: var(--lnb-muted); text-align: left; }
.sched-badge { font-size: var(--font-size-xs); font-weight: 700; padding: 0.15rem 0.55rem; border-radius: 20px; display: inline-block; white-space: nowrap; }
.sched-badge.delay { color: var(--red); background: var(--red-bg); }
.sched-badge.normal { color: var(--green); background: var(--green-bg); }
.sched-badge.short { color: var(--blue); background: var(--blue-bg); }
.sched-badge.none { color: var(--lnb-muted); background: var(--lnb-hover); }

@media (max-width: 1200px) {
  .dash-grid--3 { grid-template-columns: 1fr; }
  .kpi-row { flex-wrap: wrap; }
  .kpi { min-width: calc(50% - 0.35rem); }
}
</style>
