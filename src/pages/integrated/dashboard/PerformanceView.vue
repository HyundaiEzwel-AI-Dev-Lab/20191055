<script setup>
// PAG-M-DAS-06 실적관리
import { computed, onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import {
  performanceMeta,
  performanceSummary,
  performanceRecords,
  deptOptions,
  statusOptions,
  monthPresets,
  initiators,
  devTypes,
  summaries,
  scheduleStatusLabel,
  scheduleStatusClass,
} from '@/entities/dashboard/mock/performance'
import { pageSizeOptions } from '@/shared/lib/commonOptions'
import ExcelDownloadButton from '@/shared/ui/ExcelDownloadButton.vue'
import BaseTooltip from '@/shared/ui/BaseTooltip.vue'
import SearchFilterBar from '@/shared/ui/SearchFilterBar.vue'
import FilterSelectPill from '@/shared/ui/FilterSelectPill.vue'
import FilterTextPill from '@/shared/ui/FilterTextPill.vue'
import FilterDateRange from '@/shared/ui/FilterDateRange.vue'
import { mockExcelDownload, flattenPersonProjects } from '@/shared/file-excel/excelDownload'
import { useProjectStore } from '@/app/stores/project'

const router = useRouter()
const projectStore = useProjectStore()

const filterExpanded = ref(false)
const pageSize = ref(20)
const currentPage = ref(1)
const filters = ref({
  dept: '전체',
  openFrom: '2026-01-01',
  openTo: '2026-01-31',
  monthPreset: '전월',
  status: '전체',
  project: '',
  member: '',
  initiator: '',
  devType: '',
  summary: '',
})

const appliedFilters = ref({ ...filters.value })

const initiatorGradient = computed(() => buildConicGradient(initiators))
const devTypeGradient = computed(() => buildConicGradient(devTypes))
const initiatorTotal = computed(() => initiators.reduce((s, i) => s + i.count, 0))
const devTypeTotal = computed(() => devTypes.reduce((s, i) => s + i.count, 0))
const summaryMax = computed(() => Math.max(...summaries.map((s) => s.count), 1))
const showCharts = computed(() => {
  const f = appliedFilters.value
  return !f.project && !f.member && !f.initiator && !f.devType && !f.summary
})

const barsFilled = ref(false)
onMounted(() => {
  requestAnimationFrame(() => {
    setTimeout(() => { barsFilled.value = true }, 60)
  })
})

function pct(count, total) {
  return total ? Math.round((count / total) * 100) : 0
}

const filteredRecords = computed(() => {
  const f = appliedFilters.value
  return performanceRecords.filter((row) => {
    if (f.dept !== '전체' && row.dept !== f.dept) return false
    if (f.member) {
      const q = f.member.toLowerCase()
      if (!row.name.includes(q) && !row.empId.includes(q)) return false
    }
    if (f.project) {
      const hasProject = row.projects.some((p) => p.name.includes(f.project))
      if (!hasProject) return false
    }
    return true
  })
})

const pagedRecords = computed(() => {
  const start = (currentPage.value - 1) * pageSize.value
  return filteredRecords.value.slice(start, start + pageSize.value)
})

const totalPages = computed(() =>
  Math.max(1, Math.ceil(filteredRecords.value.length / pageSize.value)),
)

function onPageSizeChange() {
  currentPage.value = 1
}

function buildConicGradient(items) {
  const total = items.reduce((s, i) => s + i.count, 0)
  if (!total) return 'conic-gradient(var(--lnb-line) 0 100%)'
  const gap = 2.4 // deg, 세그먼트 사이 여백 (마지막→첫 구간도 동일하게 적용)
  let acc = 0
  const parts = [`var(--lnb-side) 0deg ${gap / 2}deg`]
  items.forEach((item, i) => {
    const start = (acc / total) * 360
    acc += item.count
    const end = (acc / total) * 360
    const segStart = start + gap / 2
    const segEnd = end - gap / 2
    parts.push(`${item.color} ${segStart}deg ${segEnd}deg`)
    if (i < items.length - 1) {
      parts.push(`var(--lnb-side) ${segEnd}deg ${segEnd + gap}deg`)
    }
  })
  parts.push(`var(--lnb-side) ${360 - gap / 2}deg 360deg`)
  return `conic-gradient(${parts.join(', ')})`
}

function resetFilters() {
  filters.value = {
    dept: '전체',
    openFrom: '2026-01-01',
    openTo: '2026-01-31',
    monthPreset: '전월',
    status: '전체',
    project: '',
    member: '',
    initiator: '',
    devType: '',
    summary: '',
  }
}

function onProjectClick(proj) {
  projectStore.setCurrentProject({ id: proj.id || proj.name, name: proj.name })
  router.push('/workspace/info')
}

function onTaskCountClick(person, proj) {
  projectStore.setCurrentProject({ id: proj.id || proj.name, name: proj.name })
  router.push({ path: '/workspace/wbs', query: { assignee: person.name } })
}

function search() {
  appliedFilters.value = { ...filters.value }
  currentPage.value = 1
}

const FILTER_TAG_META = [
  { key: 'dept', label: '부서', skip: (v) => !v || v === '전체' },
  { key: 'status', label: '상태', skip: (v) => !v || v === '전체' },
  { key: 'project', label: '프로젝트' },
  { key: 'member', label: '담당자' },
  { key: 'initiator', label: '발의주체' },
  { key: 'devType', label: '개발구분' },
  { key: 'summary', label: '적요' },
]

const filterTags = computed(() => {
  const f = appliedFilters.value
  return FILTER_TAG_META
    .filter((m) => {
      const v = f[m.key]
      if (m.skip) return !m.skip(v)
      return v !== '' && v != null
    })
    .map((m) => ({ key: m.key, label: m.label, value: String(f[m.key]) }))
})

const FILTER_CLEAR_DEFAULTS = {
  dept: '전체',
  status: '전체',
  project: '',
  member: '',
  initiator: '',
  devType: '',
  summary: '',
}

function removeFilterTag(key) {
  const cleared = FILTER_CLEAR_DEFAULTS[key] ?? ''
  filters.value[key] = cleared
  appliedFilters.value[key] = cleared
  search()
}

function onExcelDownload() {
  const rows = flattenPersonProjects(filteredRecords.value, (person, proj) => ({
    no: person.no,
    dept: person.dept,
    name: person.name,
    empId: person.empId,
    position: person.position,
    projectCount: person.projectCount,
    totalMd: person.totalMd,
    projectName: proj?.name || '-',
    md: proj?.md ?? '-',
    openDate: proj?.openDate || '-',
    taskCount: proj?.taskCount ?? '-',
    delayCount: proj?.delayedCount ?? proj?.delayCount ?? '-',
    planMd: proj?.planMd ?? '-',
    execMd: proj?.execMd ?? '-',
    scheduleStatus: proj?.scheduleStatus || '-',
  }))
  mockExcelDownload('실적 관리', rows, [
    { key: 'no', label: 'No.' },
    { key: 'dept', label: '부서' },
    { key: 'name', label: '담당자' },
    { key: 'empId', label: '사번' },
    { key: 'position', label: '직급' },
    { key: 'projectCount', label: '투입 프로젝트' },
    { key: 'totalMd', label: '투입 공수 합계' },
    { key: 'projectName', label: '프로젝트명' },
    { key: 'md', label: '공수' },
    { key: 'openDate', label: '오픈일' },
    { key: 'taskCount', label: '참여 업무 수' },
    { key: 'delayCount', label: '경과 수' },
    { key: 'planMd', label: '계획 공수' },
    { key: 'execMd', label: '실행 공수' },
    { key: 'scheduleStatus', label: '계획 준수' },
  ])
}

function onMonthPresetChange(preset) {
  if (preset !== undefined) filters.value.monthPreset = preset
  if (filters.value.monthPreset === '전월') {
    filters.value.openFrom = '2026-01-01'
    filters.value.openTo = '2026-01-31'
  } else if (filters.value.monthPreset === '당월') {
    filters.value.openFrom = '2026-06-01'
    filters.value.openTo = '2026-06-30'
  }
}
</script>

<template>
  <div class="performance">
    <div class="performance__hint">
      <span class="performance__hint-icon">ⓘ</span>
      <div class="performance__hint-body">
        <p>{{ performanceMeta.notice }}</p>
        <p>{{ performanceMeta.chartNotice }}</p>
      </div>
    </div>

    <!-- 검색조건 -->
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
          label="부서"
          v-model="filters.dept"
          :options="deptOptions"
          empty-label="전체"
        />
        <FilterSelectPill
          label="기간"
          :model-value="filters.monthPreset"
          :options="monthPresets"
          empty-label="전월"
          @update:model-value="onMonthPresetChange"
        />
        <FilterDateRange
          label="오픈일"
          :from="filters.openFrom"
          :to="filters.openTo"
          @update:from="filters.openFrom = $event"
          @update:to="filters.openTo = $event"
        />
        <FilterSelectPill
          label="상태"
          v-model="filters.status"
          :options="statusOptions"
          empty-label="전체"
        />
      </template>
      <template #expand>
        <FilterTextPill
          label="프로젝트"
          v-model="filters.project"
          placeholder="프로젝트명 또는 ID"
          @enter="search"
        />
        <FilterTextPill
          label="담당자"
          v-model="filters.member"
          placeholder="이름 또는 사번"
          @enter="search"
        />
        <FilterSelectPill
          label="발의주체"
          v-model="filters.initiator"
          :options="[{ value: '', label: '선택' }, ...initiators.map((i) => i.label)]"
          empty-label="선택"
        />
        <FilterSelectPill
          label="개발구분"
          v-model="filters.devType"
          :options="[{ value: '', label: '선택' }, ...devTypes.map((d) => d.label)]"
          empty-label="선택"
        />
        <FilterSelectPill
          label="적요"
          v-model="filters.summary"
          :options="[{ value: '', label: '선택' }, ...summaries.map((s) => s.label)]"
          empty-label="선택"
        />
      </template>
    </SearchFilterBar>

    <p class="performance__query-time">조회시점 {{ performanceMeta.queryTime }}</p>

    <!-- 실적 요약 -->
    <section class="kpi-row card pad">
      <div class="kpi kpi--neutral">
        <span class="kpi__dot"></span>
        <span class="kpi__body">
          <span class="kpi__lab">수행 프로젝트</span>
          <span class="kpi__num">{{ performanceSummary.projectCount }}<small>건</small></span>
        </span>
      </div>
      <div class="kpi kpi--red">
        <span class="kpi__dot"></span>
        <span class="kpi__body">
          <span class="kpi__lab">
            장기프로젝트
            <BaseTooltip text="개발 공수 합계가 2MM 이상인 프로젝트의 수" />
          </span>
          <span class="kpi__num">{{ performanceSummary.longTermProjects }}<small>건</small></span>
        </span>
      </div>
      <div class="kpi kpi--violet">
        <span class="kpi__dot"></span>
        <span class="kpi__body">
          <span class="kpi__lab">
            평균 개발 공수
            <BaseTooltip text="업무유형 '개발'의 평균 공수" />
          </span>
          <span class="kpi__num">{{ performanceSummary.avgDevWorkload }}<small>M</small></span>
        </span>
      </div>
      <div class="kpi kpi--blue">
        <span class="kpi__dot"></span>
        <span class="kpi__body">
          <span class="kpi__lab">인당 프로젝트</span>
          <span class="kpi__num">{{ performanceSummary.projectsPerPerson }}<small>건</small></span>
        </span>
      </div>
    </section>

    <!-- 차트 (전체/부서 조회 시) -->
    <div v-if="showCharts" class="dash-grid dash-grid--3">
      <section class="card pad">
        <h3 class="sec-title">발의주체</h3>
        <div class="chart-row">
          <div class="donut" :style="{ background: initiatorGradient }">
            <div class="donut__hole">
              <span class="donut__val">{{ initiatorTotal }}</span>
              <span class="donut__lab">전체</span>
            </div>
          </div>
          <ul class="legend">
            <li v-for="item in initiators" :key="item.label" class="legend__item">
              <span class="legend__sw" :style="{ background: item.color }"></span>
              {{ item.label }}
              <span class="legend__pct">{{ pct(item.count, initiatorTotal) }}%</span>
              <b>{{ item.count }}</b>
            </li>
          </ul>
        </div>
      </section>

      <section class="card pad">
        <h3 class="sec-title">개발구분</h3>
        <div class="chart-row">
          <div class="donut" :style="{ background: devTypeGradient }">
            <div class="donut__hole">
              <span class="donut__val">{{ devTypeTotal }}</span>
              <span class="donut__lab">전체</span>
            </div>
          </div>
          <ul class="legend">
            <li v-for="item in devTypes" :key="item.label" class="legend__item">
              <span class="legend__sw" :style="{ background: item.color }"></span>
              {{ item.label }}
              <span class="legend__pct">{{ pct(item.count, devTypeTotal) }}%</span>
              <b>{{ item.count }}</b>
            </li>
          </ul>
        </div>
      </section>

      <section class="card pad summary-card">
        <h3 class="sec-title">적요</h3>
        <div class="hbar">
          <div v-for="item in summaries" :key="item.label" class="hbar__row">
            <span class="hbar__lab">{{ item.label }}</span>
            <div class="hbar__track">
              <span
                class="hbar__fill"
                :style="{ width: barsFilled ? `${(item.count / summaryMax) * 100}%` : '0%' }"
              ></span>
            </div>
            <span class="hbar__val">{{ item.count }}</span>
          </div>
        </div>
      </section>
    </div>

    <!-- 인력별 실적 -->
    <section class="card listcard">
      <div class="listcard__head">
        <h3 class="sec-title">인력별 실적</h3>
        <span class="listcard__cnt">총 <b>{{ filteredRecords.length }}</b>명</span>
        <select v-model="pageSize" class="listcard__pagesize listcard__pagesize--push" @change="onPageSizeChange">
          <option v-for="n in pageSizeOptions" :key="n" :value="n">{{ n }}건씩 보기</option>
        </select>
        <ExcelDownloadButton @click="onExcelDownload" />
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
              <th>부서</th>
              <th>담당자</th>
              <th>직급</th>
              <th>투입 프로젝트</th>
              <th>투입 공수 합계</th>
              <th>프로젝트명</th>
              <th>공수</th>
              <th>오픈일</th>
              <th>참여 업무 수</th>
              <th>경과 수</th>
              <th>계획 공수</th>
              <th>실행 공수</th>
              <th>계획 준수</th>
            </tr>
          </thead>
          <tbody>
            <template v-for="(person, personIdx) in pagedRecords" :key="person.id">
              <tr
                v-for="(proj, pIdx) in person.projects"
                :key="`${person.id}-${pIdx}`"
                class="tbl__row"
              >
                <template v-if="pIdx === 0">
                  <td :rowspan="person.projects.length">
                    {{ (currentPage - 1) * pageSize + personIdx + 1 }}
                  </td>
                  <td :rowspan="person.projects.length">{{ person.dept }}</td>
                  <td :rowspan="person.projects.length" class="tbl__person">
                    {{ person.name }}
                    <span class="tbl__emp">({{ person.empId }})</span>
                  </td>
                  <td :rowspan="person.projects.length">{{ person.position }}</td>
                  <td :rowspan="person.projects.length">{{ person.projectCount }}건</td>
                  <td :rowspan="person.projects.length">{{ person.totalMd }} MD</td>
                </template>
                <td class="tbl__proj">
                  <button type="button" class="tbl__link" @click="onProjectClick(proj)">
                    {{ proj.name }}
                  </button>
                </td>
                <td>{{ proj.md }}MD</td>
                <td>{{ proj.openDate }}</td>
                <td>
                  <button
                    v-if="proj.taskCount > 0"
                    type="button"
                    class="tbl__link"
                    @click="onTaskCountClick(person, proj)"
                  >
                    {{ proj.taskCount }}건
                  </button>
                  <span v-else>-</span>
                </td>
                <td>{{ proj.delayedCount ? `${proj.delayedCount}건` : '-' }}</td>
                <td>{{ proj.planMd }} MD</td>
                <td>{{ proj.execMd }} MD</td>
                <td>
                  <span
                    class="sched-badge"
                    :class="scheduleStatusClass[proj.scheduleStatus]"
                  >
                    {{ scheduleStatusLabel[proj.scheduleStatus] }}
                  </span>
                </td>
              </tr>
            </template>
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
  </div>
</template>

<style scoped>
.performance {
  font-family: var(--font-family);
  color: var(--lnb-txt);
  padding: 4px 24px 28px;
}

.performance__hint {
  display: flex;
  align-items: flex-start;
  gap: 10px;
  margin: 0 0 16px;
  padding: 12px 16px;
  background: var(--teal-50);
  border: 1px solid var(--teal-100);
  border-radius: 10px;
}

.performance__hint-icon {
  flex-shrink: 0;
  width: 18px;
  line-height: 1.5;
  font-size: calc(13px + var(--font-size-offset, 0px));
  color: var(--teal-600);
}

.performance__hint-body {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.performance__hint-body p {
  margin: 0;
  font-size: calc(12px + var(--font-size-offset, 0px));
  font-weight: 500;
  line-height: 1.5;
  color: var(--lnb-txt);
}

.performance__query-time {
  margin: -4px 0 16px;
  font-size: calc(11px + var(--font-size-offset, 0px));
  font-weight: 500;
  color: var(--lnb-muted);
}

.card {
  background: var(--lnb-side);
  border: 1px solid var(--lnb-line);
  border-radius: 14px;
  box-shadow: var(--shadow-sm);
}

.pad {
  padding: 14px 16px;
}

.sec-title {
  position: relative;
  margin: 0 0 12px;
  padding-left: 10px;
  font-size: calc(13px + var(--font-size-offset, 0px));
  font-weight: 700;
  color: var(--lnb-txt);
  padding-bottom: 10px;
  border-bottom: 1px solid var(--lnb-line);
}

.sec-title::before {
  content: '';
  position: absolute;
  left: 0;
  top: 1px;
  bottom: 1px;
  width: 3px;
  border-radius: 2px;
  background: var(--teal);
}

.kpi-row {
  display: flex;
  gap: 12px;
  margin-bottom: 16px;
}

.kpi {
  flex: 1;
  display: flex;
  align-items: center;
  gap: 10px;
  border: none;
  border-radius: 14px;
  padding: 16px 16px 14px;
  transition: transform var(--transition-fast);
}

.kpi:hover {
  transform: translateY(-2px);
}

.kpi__dot {
  flex-shrink: 0;
  width: 10px;
  height: 10px;
  border-radius: 50%;
  background: currentColor;
}

.kpi__body {
  display: flex;
  align-items: baseline;
  gap: 8px;
  flex-wrap: wrap;
}

.kpi__lab {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  font-size: calc(11.5px + var(--font-size-offset, 0px));
  color: currentColor;
  opacity: 0.75;
  font-weight: 600;
}

.kpi__num {
  display: inline-block;
  font-size: calc(22px + var(--font-size-offset, 0px));
  font-weight: 800;
  color: currentColor;
}

.kpi__num small {
  font-size: calc(13px + var(--font-size-offset, 0px));
  font-weight: 600;
  margin-left: 2px;
}

.kpi--neutral { background: var(--gray-bg); color: var(--lnb-logo); }
.kpi--red { background: var(--red-bg); color: var(--red); }
.kpi--violet { background: var(--purple-bg); color: var(--purple); }
.kpi--blue { background: var(--blue-bg); color: var(--blue); }

.dash-grid {
  display: grid;
  gap: 14px;
  margin-bottom: 16px;
}

.dash-grid--3 {
  grid-template-columns: repeat(3, 1fr);
}

.chart-row {
  display: flex;
  gap: 14px;
  align-items: center;
}

.donut {
  width: 150px;
  height: 150px;
  margin-left: 50px;
  border-radius: 50%;
  position: relative;
  flex-shrink: 0;
  filter: drop-shadow(0 6px 14px rgba(20, 30, 45, 0.12));
  animation: donut-in 0.7s cubic-bezier(0.16, 1, 0.3, 1) both;
}

@keyframes donut-in {
  from {
    opacity: 0;
    transform: scale(0.82) rotate(-50deg);
  }
  to {
    opacity: 1;
    transform: scale(1) rotate(0);
  }
}

.donut::before {
  content: '';
  position: absolute;
  inset: 0;
  border-radius: 50%;
  background: radial-gradient(circle at 30% 24%, rgba(255, 255, 255, 0.4), rgba(255, 255, 255, 0) 60%);
  pointer-events: none;
}

.donut__hole {
  position: absolute;
  inset: 34px;
  background: var(--lnb-side);
  border-radius: 50%;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
}

.donut__val {
  font-size: calc(18px + var(--font-size-offset, 0px));
  font-weight: 800;
  color: var(--lnb-logo);
}

.donut__lab {
  font-size: calc(10px + var(--font-size-offset, 0px));
  color: var(--lnb-muted);
}

.legend {
  list-style: none;
  margin: 0;
  padding: 0;
  display: flex;
  flex-direction: column;
  gap: 6px;
  font-size: calc(12px + var(--font-size-offset, 0px));
  flex: 1;
}

.legend__item {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 3px 6px;
  border-radius: 6px;
  transition: background var(--transition-fast);
}

.legend__item:hover {
  background: var(--lnb-hover);
}

.legend__item b {
  margin-left: auto;
  margin-right: 50px;
  font-weight: 700;
}

.summary-card {
  padding-left: 10px;
  padding-right: 30px;
}

.legend__pct {
  color: var(--lnb-muted);
  font-size: calc(11px + var(--font-size-offset, 0px));
}

.legend__sw {
  width: 10px;
  height: 10px;
  border-radius: 50%;
  flex-shrink: 0;
}

.hbar {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.hbar__row {
  display: flex;
  align-items: center;
  gap: 10px;
  font-size: calc(12px + var(--font-size-offset, 0px));
}

.hbar__lab {
  width: 80px;
  color: var(--lnb-txt);
  text-align: right;
  flex-shrink: 0;
}

.hbar__track {
  flex: 1;
  height: 15px;
  background: var(--lnb-hover);
  border-radius: 9px;
  overflow: hidden;
}

.hbar__fill {
  display: block;
  height: 100%;
  background: linear-gradient(90deg, var(--teal), var(--teal-600));
  border-radius: 9px;
  box-shadow: 0 0 10px rgba(17, 154, 138, 0.45);
  transition: width 0.9s cubic-bezier(0.16, 1, 0.3, 1);
}

.hbar__val {
  width: 28px;
  font-weight: 700;
  text-align: right;
  flex-shrink: 0;
}

.listcard {
  overflow: hidden;
}

.listcard__head {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 14px 16px 0;
  padding-bottom: 12px;
  border-bottom: 1px solid var(--lnb-line);
}

.listcard__head .sec-title {
  margin: 0;
}

.listcard__cnt {
  font-size: calc(12px + var(--font-size-offset, 0px));
}

.listcard__cnt b {
  color: var(--teal-600);
}

.listcard__pagesize {
  height: 28px;
  border: 1px solid var(--lnb-line);
  border-radius: var(--radius-sm, 6px);
  padding: 0 8px;
  font-size: calc(11.5px + var(--font-size-offset, 0px));
  font-family: inherit;
  background: var(--lnb-side);
  color: var(--lnb-txt);
}

.listcard__pagesize--push {
  margin-left: auto;
}

.listcard__scroll {
  overflow-x: auto;
}

.tbl {
  width: 100%;
  border-collapse: collapse;
  font-size: calc(12px + var(--font-size-offset, 0px));
}

.tbl thead th {
  background: var(--lnb-hover);
  color: var(--lnb-txt);
  font-weight: 600;
  text-align: center;
  padding: 9px 10px;
  border-bottom: 1px solid var(--lnb-line);
  white-space: nowrap;
}

.tbl__subhead th {
  font-size: calc(11px + var(--font-size-offset, 0px));
  font-weight: 500;
  padding: 7px 8px;
}

.tbl tbody td {
  padding: 10px 10px;
  border-bottom: 1px solid var(--color-border-2);
  color: var(--lnb-txt);
  vertical-align: middle;
  text-align: center;
}

.tbl__row:hover {
  background: var(--teal-50);
}

.tbl__person {
  font-weight: 600;
  text-align: left;
}

.tbl__emp {
  display: block;
  font-size: calc(10.5px + var(--font-size-offset, 0px));
  color: var(--lnb-muted);
  font-weight: 400;
}

.tbl__proj {
  text-align: left;
  max-width: 220px;
  line-height: 1.4;
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
}

.sched-badge {
  font-size: calc(11px + var(--font-size-offset, 0px));
  font-weight: 700;
  padding: 3px 9px;
  border-radius: 20px;
  display: inline-block;
  white-space: nowrap;
}

.sched-badge.delay {
  color: var(--red);
  background: var(--red-bg);
}

.sched-badge.normal {
  color: var(--green);
  background: var(--green-bg);
}

.sched-badge.short {
  color: var(--blue);
  background: var(--blue-bg);
}

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

.pager__pg--on {
  background: var(--teal);
  border-color: var(--teal);
  color: var(--color-text-inverse);
  font-weight: 700;
}

.pager__pg:disabled {
  opacity: 0.4;
  cursor: not-allowed;
}

.pager__info {
  font-size: calc(11px + var(--font-size-offset, 0px));
  color: var(--lnb-muted);
  margin-left: 8px;
}

@media (max-width: 1200px) {
  .dash-grid--3 {
    grid-template-columns: 1fr;
  }
  .kpi-row {
    flex-wrap: wrap;
  }
  .kpi {
    min-width: calc(50% - 6px);
  }
}
</style>
