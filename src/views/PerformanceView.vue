<script setup>
// PAG-M-DAS-06 실적관리
import { computed, ref } from 'vue'
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
} from '@/data/performance'
import ExcelDownloadButton from '@/components/ui/ExcelDownloadButton.vue'
import { mockExcelDownload } from '@/utils/excelDownload'

const filterExpanded = ref(false)
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

function buildConicGradient(items) {
  const total = items.reduce((s, i) => s + i.count, 0)
  if (!total) return 'conic-gradient(var(--lnb-line) 0 100%)'
  let acc = 0
  const stops = items.map((item) => {
    const start = (acc / total) * 100
    acc += item.count
    const end = (acc / total) * 100
    return `${item.color} ${start}% ${end}%`
  })
  return `conic-gradient(${stops.join(', ')})`
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
  appliedFilters.value = { ...filters.value }
}

function search() {
  appliedFilters.value = { ...filters.value }
}

function onExcelDownload() {
  mockExcelDownload('실적 관리', filteredRecords.value.length)
}

function onMonthPresetChange() {
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
        <p class="performance__hint-time">조회시점 {{ performanceMeta.queryTime }}</p>
      </div>
    </div>

    <!-- 검색조건 -->
    <section class="filter card">
      <div class="filter__row">
        <div class="filter__field">
          <label>부서</label>
          <select v-model="filters.dept" class="filter__select">
            <option v-for="d in deptOptions" :key="d" :value="d">{{ d }}</option>
          </select>
        </div>
        <div class="filter__field filter__field--range">
          <label>오픈일</label>
          <div class="filter__range">
            <input v-model="filters.openFrom" class="filter__input filter__input--date" type="date" />
            <span>~</span>
            <input v-model="filters.openTo" class="filter__input filter__input--date" type="date" />
          </div>
        </div>
        <div class="filter__field">
          <label>기간</label>
          <select v-model="filters.monthPreset" class="filter__select" @change="onMonthPresetChange">
            <option v-for="m in monthPresets" :key="m" :value="m">{{ m }}</option>
          </select>
        </div>
        <div class="filter__field">
          <label>상태</label>
          <select v-model="filters.status" class="filter__select">
            <option v-for="s in statusOptions" :key="s" :value="s">{{ s }}</option>
          </select>
        </div>
      </div>

      <div v-if="filterExpanded" class="filter__row filter__row--expand">
        <div class="filter__field">
          <label>프로젝트</label>
          <input
            v-model="filters.project"
            class="filter__input"
            type="text"
            placeholder="프로젝트명 또는 ID"
          />
        </div>
        <div class="filter__field">
          <label>담당자</label>
          <input
            v-model="filters.member"
            class="filter__input"
            type="text"
            placeholder="이름 또는 사번"
          />
        </div>
        <div class="filter__field">
          <label>발의주체</label>
          <select v-model="filters.initiator" class="filter__select">
            <option value="">선택</option>
            <option v-for="i in initiators" :key="i.label" :value="i.label">{{ i.label }}</option>
          </select>
        </div>
        <div class="filter__field">
          <label>개발구분</label>
          <select v-model="filters.devType" class="filter__select">
            <option value="">선택</option>
            <option v-for="d in devTypes" :key="d.label" :value="d.label">{{ d.label }}</option>
          </select>
        </div>
        <div class="filter__field">
          <label>적요</label>
          <select v-model="filters.summary" class="filter__select">
            <option value="">선택</option>
            <option v-for="s in summaries" :key="s.label" :value="s.label">{{ s.label }}</option>
          </select>
        </div>
      </div>

      <button type="button" class="filter__expand" @click="filterExpanded = !filterExpanded">
        {{ filterExpanded ? '－ 검색조건 접기' : '＋ 검색조건 확장' }}
      </button>

      <div class="filter__actions">
        <button type="button" class="btn btn--ghost" @click="resetFilters">초기화</button>
        <button type="button" class="btn btn--primary" @click="search">조회</button>
      </div>
    </section>

    <!-- 실적 요약 -->
    <section class="kpi-row card pad">
      <div class="kpi">
        <span class="kpi__lab">수행 프로젝트</span>
        <span class="kpi__num">{{ performanceSummary.projectCount }}<small>건</small></span>
      </div>
      <div class="kpi">
        <span class="kpi__lab">장기프로젝트</span>
        <span class="kpi__num kpi__num--orange">{{ performanceSummary.longTermProjects }}<small>건</small></span>
      </div>
      <div class="kpi">
        <span class="kpi__lab">평균 개발 공수</span>
        <span class="kpi__num">{{ performanceSummary.avgDevWorkload }}<small>M</small></span>
      </div>
      <div class="kpi">
        <span class="kpi__lab">인당 프로젝트</span>
        <span class="kpi__num kpi__num--blue">{{ performanceSummary.projectsPerPerson }}<small>건</small></span>
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
              <b>{{ item.count }}</b>
            </li>
          </ul>
        </div>
      </section>

      <section class="card pad">
        <h3 class="sec-title">적요</h3>
        <div class="hbar">
          <div v-for="item in summaries" :key="item.label" class="hbar__row">
            <span class="hbar__lab">{{ item.label }}</span>
            <div class="hbar__track">
              <span class="hbar__fill" :style="{ width: `${(item.count / summaryMax) * 100}%` }"></span>
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
        <ExcelDownloadButton push-end @click="onExcelDownload" />
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
            <template v-for="person in filteredRecords" :key="person.id">
              <tr
                v-for="(proj, pIdx) in person.projects"
                :key="`${person.id}-${pIdx}`"
                class="tbl__row"
              >
                <template v-if="pIdx === 0">
                  <td :rowspan="person.projects.length">{{ person.no }}</td>
                  <td :rowspan="person.projects.length">{{ person.dept }}</td>
                  <td :rowspan="person.projects.length" class="tbl__person">
                    {{ person.name }}
                    <span class="tbl__emp">({{ person.empId }})</span>
                  </td>
                  <td :rowspan="person.projects.length">{{ person.position }}</td>
                  <td :rowspan="person.projects.length">{{ person.projectCount }}건</td>
                  <td :rowspan="person.projects.length">{{ person.totalMd }} MD</td>
                </template>
                <td class="tbl__proj">{{ proj.name }}</td>
                <td>{{ proj.md }}MD</td>
                <td>{{ proj.openDate }}</td>
                <td>{{ proj.taskCount }}건</td>
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
        <button type="button" class="pager__pg">«</button>
        <button type="button" class="pager__pg pager__pg--on">1</button>
        <button type="button" class="pager__pg">2</button>
        <button type="button" class="pager__pg">3</button>
        <button type="button" class="pager__pg">»</button>
        <span class="pager__info">100건씩 보기</span>
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
  font-size: 13px;
  color: var(--teal-600);
}

.performance__hint-body {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.performance__hint-body p {
  margin: 0;
  font-size: 12px;
  font-weight: 500;
  line-height: 1.5;
  color: var(--lnb-txt);
}

.performance__hint-time {
  margin-top: 4px !important;
  font-size: 11px !important;
  font-weight: 500 !important;
  color: var(--lnb-muted) !important;
}

.card {
  background: var(--lnb-side);
  border: 1px solid var(--lnb-line);
  border-radius: 10px;
}

.pad {
  padding: 14px 16px;
}

.sec-title {
  margin: 0 0 12px;
  font-size: 13px;
  font-weight: 700;
  color: var(--lnb-txt);
}

.filter {
  padding: 14px 16px;
  margin-bottom: 16px;
}

.filter__row {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 10px 14px;
}

.filter__row--expand {
  margin-top: 10px;
  grid-template-columns: repeat(5, 1fr);
}

.filter__field {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.filter__field--range {
  grid-column: span 1;
}

.filter__field label {
  font-size: 11px;
  color: var(--lnb-muted);
  font-weight: 600;
}

.filter__input,
.filter__select {
  height: 32px;
  background: var(--lnb-hover);
  border: 1px solid var(--lnb-line);
  border-radius: 7px;
  padding: 0 10px;
  font-size: 12px;
  font-family: inherit;
  color: var(--lnb-txt);
}

.filter__input {
  background: #fff;
}

.filter__range {
  display: flex;
  align-items: center;
  gap: 6px;
}

.filter__input--date {
  flex: 1;
  min-width: 0;
}

.filter__expand {
  margin-top: 8px;
  border: none;
  background: none;
  font-size: 11.5px;
  color: var(--teal-600);
  cursor: pointer;
  font-family: inherit;
  padding: 0;
}

.filter__actions {
  display: flex;
  justify-content: flex-end;
  gap: 8px;
  margin-top: 12px;
}

.btn {
  height: 32px;
  padding: 0 14px;
  border-radius: 7px;
  font-size: 12.5px;
  font-weight: 600;
  font-family: inherit;
  cursor: pointer;
  border: 1px solid transparent;
}

.btn--primary {
  background: var(--teal);
  color: #fff;
}

.btn--primary:hover {
  background: var(--teal-600);
}

.btn--ghost {
  background: var(--lnb-side);
  border-color: var(--lnb-line);
  color: var(--lnb-txt);
}

.btn--ghost:hover {
  border-color: var(--teal-100);
  color: var(--teal-600);
}

.kpi-row {
  display: flex;
  gap: 14px;
  margin-bottom: 16px;
}

.kpi {
  flex: 1;
  background: var(--lnb-side);
  border: 1px solid var(--lnb-line);
  border-radius: 10px;
  padding: 14px 16px;
}

.kpi__lab {
  font-size: 11.5px;
  color: var(--lnb-muted);
}

.kpi__num {
  display: block;
  font-size: 22px;
  font-weight: 800;
  margin-top: 2px;
  color: var(--lnb-logo);
}

.kpi__num small {
  font-size: 13px;
  font-weight: 600;
  margin-left: 2px;
}

.kpi__num--blue { color: var(--blue); }
.kpi__num--orange { color: var(--orange); }

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
  width: 130px;
  height: 130px;
  border-radius: 50%;
  position: relative;
  flex-shrink: 0;
}

.donut__hole {
  position: absolute;
  inset: 26px;
  background: var(--lnb-side);
  border-radius: 50%;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
}

.donut__val {
  font-size: 18px;
  font-weight: 800;
  color: var(--lnb-logo);
}

.donut__lab {
  font-size: 10px;
  color: var(--lnb-muted);
}

.legend {
  list-style: none;
  margin: 0;
  padding: 0;
  display: flex;
  flex-direction: column;
  gap: 6px;
  font-size: 12px;
  flex: 1;
}

.legend__item {
  display: flex;
  align-items: center;
  gap: 8px;
}

.legend__item b {
  margin-left: auto;
  font-weight: 700;
}

.legend__sw {
  width: 10px;
  height: 10px;
  border-radius: 3px;
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
  font-size: 12px;
}

.hbar__lab {
  width: 80px;
  color: var(--lnb-txt);
  text-align: right;
  flex-shrink: 0;
}

.hbar__track {
  flex: 1;
  height: 18px;
  background: #f0f3f4;
  border-radius: 5px;
  overflow: hidden;
}

.hbar__fill {
  display: block;
  height: 100%;
  background: var(--teal);
  border-radius: 5px;
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
}

.listcard__head .sec-title {
  margin: 0;
}

.listcard__cnt {
  margin-left: auto;
  font-size: 12px;
}

.listcard__cnt b {
  color: var(--teal-600);
}

.listcard__scroll {
  overflow-x: auto;
}

.tbl {
  width: 100%;
  border-collapse: collapse;
  font-size: 12px;
}

.tbl thead th {
  background: #fafbfc;
  color: var(--lnb-muted);
  font-weight: 600;
  text-align: center;
  padding: 9px 10px;
  border-bottom: 1px solid var(--lnb-line);
  white-space: nowrap;
}

.tbl__subhead th {
  font-size: 11px;
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

.tbl tbody tr:last-child td {
  border-bottom: none;
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
  font-size: 10.5px;
  color: var(--lnb-muted);
  font-weight: 400;
}

.tbl__proj {
  text-align: left;
  max-width: 220px;
  line-height: 1.4;
}

.sched-badge {
  font-size: 11px;
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
  font-size: 12px;
  cursor: pointer;
  font-family: inherit;
}

.pager__pg--on {
  background: var(--teal);
  border-color: var(--teal);
  color: #fff;
  font-weight: 700;
}

.pager__info {
  font-size: 11px;
  color: var(--lnb-muted);
  margin-left: 8px;
}

@media (max-width: 1200px) {
  .dash-grid--3 {
    grid-template-columns: 1fr;
  }
  .filter__row,
  .filter__row--expand {
    grid-template-columns: repeat(2, 1fr);
  }
  .kpi-row {
    flex-wrap: wrap;
  }
  .kpi {
    min-width: calc(50% - 7px);
  }
}
</style>
