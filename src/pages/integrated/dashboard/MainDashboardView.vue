<script setup>
// FO 목업(20191055) views/MainDashboardView.vue(PAG-M-DAS-01) 이관 — 메인 대시보드/전체 프로젝트 현황.
// 실 API 배선(GET /api/projects 전건 집계 + 신규 schedule-change-history) — entities/dashboard/api.ts.
// 차트는 FO 원본과 동일하게 순수 CSS conic-gradient로 구현한다 — 차트 라이브러리를 새로 추가하지
// 않는다(YAGNI, 지시사항 준수). 엑셀 다운로드는 아직 서버 API가 없어 mock 스텁을 그대로 쓴다
// (다른 화면들도 전부 같은 패턴 — UnitTestPage/ScenarioPage의 onExcelDownload 선례).
import { computed, onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import {
  dashboardMeta,
  dashboardAxes,
  dashboardProjects,
  requestDepts as mockRequestDepts,
  devDepts as mockDevDepts,
  stageOptions as mockStageOptions,
  NO_OPEN_DATE,
  UNSPECIFIED_LABEL,
  buildDashboardStats,
  filterCurrentYearOpen,
} from '@/entities/dashboard/mock/dashboard'
import { getScheduleChange } from '@/entities/dashboard/mock/scheduleChange'
import { pageSizeOptions } from '@/shared/lib/commonOptions'
import { mockExcelDownload } from '@/shared/file-excel/excelDownload'
import RequirementListModal from '@/pages/integrated/dashboard/RequirementListModal.vue'
import ScheduleChangeModal from '@/pages/integrated/dashboard/ScheduleChangeModal.vue'
import HpPagination from '@/shared/ui/HpPagination.vue'
import { useProjectStore } from '@/app/stores/project'
import HpDonutChart from '@/shared/ui/HpDonutChart.vue'
import SearchFilterBar from '@/shared/ui/SearchFilterBar.vue'

import FilterSelectPill from '@/shared/ui/FilterSelectPill.vue'
import FilterDateRange from '@/shared/ui/FilterDateRange.vue'

const router = useRouter()
const projectStore = useProjectStore()

const meta = ref({ yearScope: '', queryTime: '' })
// 차트 축(라벨·색·정렬순서)만 들고 있는다. 건수는 조회필터 결과로 stats가 매번 다시 센다 —
// SB-PAG-M-DAS-01-R02("조회 결과 변경 시 자동 갱신").
const axes = ref({ initiators: [], devTypes: [], summaries: [] })
const allProjects = ref([])
const requestDepts = ref([])
const devDepts = ref([])
const stageOptions = ref(['전체'])
const barsFilled = ref(false)

onMounted(() => {
  barsFilled.value = false
  meta.value = dashboardMeta
  axes.value = {
    initiators: dashboardAxes.initiators,
    devTypes: dashboardAxes.devTypes,
    summaries: dashboardAxes.summaries,
  }
  allProjects.value = dashboardProjects
  requestDepts.value = mockRequestDepts
  devDepts.value = mockDevDepts
  stageOptions.value = mockStageOptions
  requestAnimationFrame(() => {
    setTimeout(() => {
      barsFilled.value = true
    }, 60)
  })
})

const filterExpanded = ref(false)
const filters = ref({
  keyword: '', requestDept: '', devDept: '', stage: '전체', initiator: '', devType: '', summary: '', openFrom: '', openTo: '',
})
const appliedFilters = ref({ ...filters.value })
const pageSize = ref(20)
const currentPage = ref(1)

const showScheduleModal = ref(false)
const scheduleModalData = ref(null)
const showRequirementModal = ref(false)
const requirementContext = ref(null)

/*
 * 도넛은 공용 `HpDonutChart`(SVG)가 그린다. 종전 CSS conic-gradient는 세그먼트 경계를
 * 안티에일리어싱하지 않아 원본 크기에서 계단으로 보였다(빌더는 실적 대시보드와 사본이었다).
 * 집계 소스는 조회필터 결과인 stats다 — SB-PAG-M-DAS-01-R02(조회 결과 변경 시 자동 갱신).
 */
const toSegments = (items) =>
  items.map((i) => ({ value: i.count, color: i.color, label: i.label }))
const initiatorSegments = computed(() => toSegments(stats.value.initiators))
const devTypeSegments = computed(() => toSegments(stats.value.devTypes))
const initiatorTotal = computed(() => stats.value.initiators.reduce((s, i) => s + i.count, 0))
const devTypeTotal = computed(() => stats.value.devTypes.reduce((s, i) => s + i.count, 0))
const summaryMax = computed(() => Math.max(...stats.value.summaries.map((s) => s.count), 1))
const gaugePercent = computed(() => `${(stats.value.completionRate / 2).toFixed(1)}%`)

// 조회필터 선택지는 공통코드 항목만 노출한다 — '미지정'은 집계용 가상 항목이라 선택해도
// 걸리는 행이 없다(코드 미지정 행의 값은 '-'다).
const initiatorOptions = computed(() => axes.value.initiators.filter((i) => i.label !== UNSPECIFIED_LABEL))
const devTypeOptions = computed(() => axes.value.devTypes.filter((i) => i.label !== UNSPECIFIED_LABEL))
const summaryOptions = computed(() => axes.value.summaries.filter((i) => i.label !== UNSPECIFIED_LABEL))

function pct(count, total) {
  return total ? Math.round((count / total) * 100) : 0
}

const STAGE_SORT_PRIORITY = { 테스트: 0, 처리중: 1, 협의중: 2, 접수: 3, 완료: 4, 반려: 5 }

// 미정 행을 정렬에서 맨 뒤로 보내기 위한 대체 키. 날짜 문자열끼리 비교하므로 실재하지 않는
// 먼 미래값을 쓴다 — '-'를 그대로 비교하면 어떤 날짜보다 작아 목록 최상단을 차지한다.
const NO_OPEN_DATE_SORT_KEY = '9999-12-31'

const filteredProjects = computed(() => {
  const f = appliedFilters.value
  const list = allProjects.value.filter((p) => {
    if (f.keyword && !p.name.includes(f.keyword) && !p.id.includes(f.keyword)) return false
    if (f.requestDept && p.requestDept !== f.requestDept) return false
    if (f.devDept && p.devDept !== f.devDept) return false
    if (f.stage !== '전체' && p.stage !== f.stage) return false
    if (f.initiator && p.initiator !== f.initiator) return false
    if (f.devType && p.devType !== f.devType) return false
    if (f.summary && p.summary !== f.summary) return false
    // 오픈기간을 지정하면 오픈예정일 미정 행은 어느 쪽 칸을 채웠든 일관되게 제외한다.
    // 문자열 비교에 맡기면 '-'가 날짜보다 작아, 시작일만 지정하면 빠지고 종료일만 지정하면
    // 남는 비대칭이 생긴다(같은 프로젝트가 조건에 따라 나왔다 안 나왔다 함).
    if (f.openFrom || f.openTo) {
      if (p.scheduledOpenDate === NO_OPEN_DATE) return false
      if (f.openFrom && p.scheduledOpenDate < f.openFrom) return false
      if (f.openTo && p.scheduledOpenDate > f.openTo) return false
    }
    return true
  })
  // SB-PAG-M-DAS-01-R03: 오픈예정일 오름차순 → 상태 → 프로젝트번호.
  return [...list].sort((a, b) => {
    const aDate = a.scheduledOpenDate === NO_OPEN_DATE ? NO_OPEN_DATE_SORT_KEY : a.scheduledOpenDate
    const bDate = b.scheduledOpenDate === NO_OPEN_DATE ? NO_OPEN_DATE_SORT_KEY : b.scheduledOpenDate
    if (aDate !== bDate) return aDate < bDate ? -1 : 1
    const byStage = (STAGE_SORT_PRIORITY[a.stage] ?? 99) - (STAGE_SORT_PRIORITY[b.stage] ?? 99)
    if (byStage !== 0) return byStage
    return a.id.localeCompare(b.id)
  })
})

// 조회 시점 연도는 번들의 queryTime에서 뽑는다 — new Date()를 새로 부르면 자정을 넘겨 머문
// 세션에서 목록 기준(fetchDashboardBundle 시점)과 현황분석 기준이 어긋난다. R01(기준일시)도
// 화면 전체가 하나의 조회 시점을 공유하라는 규칙이다.
// meta는 로드 전 빈 문자열이라 NaN이 나올 수 있다 — 그때만 오늘 연도로 떨어뜨린다.
const currentYear = computed(() => {
  const parsed = Number(meta.value.queryTime.slice(0, 4))
  return Number.isNaN(parsed) ? new Date().getFullYear() : parsed
})

// 조회필터(filteredProjects)를 그대로 타되, 거기서 당해년도만 다시 좁힌다 —
// 순서를 뒤집으면 R02(조회 결과 변경 시 자동 갱신)가 깨진다.
const analysisRows = computed(() => filterCurrentYearOpen(filteredProjects.value, currentYear.value))
const stats = computed(() => buildDashboardStats(analysisRows.value, axes.value))

const pagedProjects = computed(() => {
  const start = (currentPage.value - 1) * pageSize.value
  return filteredProjects.value.slice(start, start + pageSize.value)
})

const totalPages = computed(() => Math.max(1, Math.ceil(filteredProjects.value.length / pageSize.value)))

function onPageSizeChange() {
  currentPage.value = 1
}

function resetFilters() {
  filters.value = { keyword: '', requestDept: '', devDept: '', stage: '전체', initiator: '', devType: '', summary: '', openFrom: '', openTo: '' }
  appliedFilters.value = { ...filters.value }
  currentPage.value = 1
}

function search() {
  appliedFilters.value = { ...filters.value }
  currentPage.value = 1
}

/** 펼침 패널 조건만 태그로 남긴다 — 툴바에 보이는 검색어·부서·단계는 중복이라 제외. */
const filterTags = computed(() => {
  const f = filters.value
  const tags = []
  if (f.initiator) tags.push({ key: 'initiator', label: '발의주체', value: f.initiator })
  if (f.devType) tags.push({ key: 'devType', label: '개발구분', value: f.devType })
  if (f.summary) tags.push({ key: 'summary', label: '적요', value: f.summary })
  if (f.openFrom || f.openTo) {
    tags.push({ key: 'openRange', label: '오픈기간', value: `${f.openFrom || '…'} ~ ${f.openTo || '…'}` })
  }
  return tags
})

function removeFilterTag(key) {
  const f = filters.value
  if (key === 'openRange') {
    f.openFrom = ''
    f.openTo = ''
  } else {
    f[key] = ''
  }
}

function onExcelDownload() {
  mockExcelDownload('메인 대시보드', filteredProjects.value, [
    { key: 'no', label: 'No.' },
    { key: 'stage', label: '처리단계' },
    { key: 'name', label: '프로젝트명' },
    { key: 'progress', label: '공정률(%)' },
    { key: 'scheduledOpenDate', label: '오픈예정일' },
    { key: 'actualOpenDate', label: '오픈일' },
    { key: 'requestDept', label: '요청부서' },
    { key: 'devDept', label: '담당개발부서' },
  ])
}

// 프로젝트 정보 화면(ProjectInfoPage.vue:95)은 URL이 아니라 projectStore에서 대상 프로젝트를
// 읽는다. 그래서 이동 전에 선택 상태를 먼저 세팅해야 한다 — 빠뜨리면 projectGuard가
// 튕기거나(선택 이력 없음), 직전에 선택돼 있던 다른 프로젝트가 조용히 열린다.
//
// id에는 반드시 row.id(projectNo, 예 "PJ0001")를 넣는다. row.projectId는 요구사항 조회용
// 숫자 PK라 여기 쓰면 ProjectInfoPage가 잘못된 키로 조회한다.
// 목록은 fetchDashboardBundle이 isDraft:false로만 조회하므로 초안 프로젝트가 섞일 수 없다 —
// isDraft는 false 고정이 안전하다.
function onProjectClick(row) {
  projectStore.setCurrentProject({ id: row.id, name: row.name, isDraft: false })
  router.push('/workspace/info')
}

function onDeptClick(row) {
  requirementContext.value = { id: row.id, projectId: row.projectId, name: row.name, requestDept: row.requestDept, stage: row.stage }
  showRequirementModal.value = true
}

function onOverdueClick(row) {
  const data = getScheduleChange(row.id)
  if (!data) return
  scheduleModalData.value = data
  showScheduleModal.value = true
}
</script>

<template>
  <div class="dashboard hp-anim-enter">
    <p class="hint">{{ meta.yearScope }} (조회시점 {{ meta.queryTime }})</p>

    <SearchFilterBar
      v-model:expanded="filterExpanded"
      v-model:search="filters.keyword"
      search-placeholder="프로젝트명 또는 ID"
      :applied-tags="filterTags"
      @reset="resetFilters"
      @search="search"
      @remove-tag="removeFilterTag"
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
        <FilterSelectPill
          v-model="filters.initiator"
          label="발의주체"
          fill
          :options="[{ value: '', label: '전체' }, ...initiatorOptions.map((i) => i.label)]"
        />
        <FilterSelectPill
          v-model="filters.devType"
          label="개발구분"
          fill
          :options="[{ value: '', label: '전체' }, ...devTypeOptions.map((d) => d.label)]"
        />
        <FilterSelectPill
          v-model="filters.summary"
          label="적요"
          fill
          :options="[{ value: '', label: '전체' }, ...summaryOptions.map((s) => s.label)]"
        />
        <FilterDateRange
          label="오픈기간"
          :from="filters.openFrom"
          :to="filters.openTo"
          fill
          @update:from="filters.openFrom = $event"
          @update:to="filters.openTo = $event"
        />
      </template>
    </SearchFilterBar>

    <p class="scope-caption">
      현황분석 · {{ currentYear }}년 오픈 프로젝트 {{ analysisRows.length }}건 기준
    </p>

    <div class="dash-grid dash-grid--2">
      <section class="card card--panel pad">
        <h3 class="sec-title">처리단계</h3>
        <div class="kpi-row">
          <div class="kpi kpi--neutral">
            <span class="kpi__dot"></span>
            <span class="kpi__lab">전체</span>
            <span class="kpi__num">{{ stats.stageKpi.total }}</span>
          </div>
          <div class="kpi kpi--gray">
            <span class="kpi__dot"></span>
            <span class="kpi__lab">접수</span>
            <span class="kpi__num">{{ stats.stageKpi.received }}</span>
          </div>
          <div class="kpi kpi--blue">
            <span class="kpi__dot"></span>
            <span class="kpi__lab">진행중</span>
            <span class="kpi__num">{{ stats.stageKpi.inProgress }}</span>
          </div>
          <div class="kpi kpi--green">
            <span class="kpi__dot"></span>
            <span class="kpi__lab">완료</span>
            <span class="kpi__num">{{ stats.stageKpi.completed }}</span>
          </div>
          <div class="kpi kpi--red">
            <span class="kpi__dot"></span>
            <span class="kpi__lab">반려</span>
            <span class="kpi__num">{{ stats.stageKpi.rejected }}</span>
          </div>
        </div>
      </section>

      <section class="card card--panel pad gauge-card">
        <h3 class="sec-title">완료율</h3>
        <div class="gauge hp-anim-chart" :style="{ '--p': gaugePercent }">
          <div class="gauge__arc"></div>
          <div class="gauge__hole"><b>{{ stats.completionRate }}%</b></div>
        </div>
      </section>
    </div>

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
            <li v-for="item in stats.initiators" :key="item.label">
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
            <li v-for="item in stats.devTypes" :key="item.label">
              <span class="sw" :style="{ background: item.color }"></span>
              {{ item.label }} <span class="pct">{{ pct(item.count, devTypeTotal) }}%</span> <b>{{ item.count }}</b>
            </li>
          </ul>
        </div>
      </section>

      <section class="card card--panel pad">
        <h3 class="sec-title">적요</h3>
        <div class="hbar">
          <div v-for="item in stats.summaries" :key="item.label" class="hbar__row">
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
        <h3 class="sec-title">프로젝트 목록</h3>
        <span>총 <b>{{ filteredProjects.length }}</b>건</span>
        <select v-model="pageSize" @change="onPageSizeChange">
          <option v-for="n in pageSizeOptions" :key="n" :value="n">{{ n }}건씩 보기</option>
        </select>
        <button type="button" class="ghost" @click="onExcelDownload">엑셀 다운로드</button>
      </div>
      <div class="listcard__scroll">
        <table class="tbl">
          <thead>
            <tr>
              <th>No.</th><th>처리단계</th><th>프로젝트명</th><th>공정률</th>
              <th>오픈예정일</th><th>오픈일</th><th>요청부서</th><th>담당개발부서</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="row in pagedProjects" :key="row.id" class="click" @click="onProjectClick(row)">
              <td>{{ row.no }}</td>
              <td><span class="stbadge">{{ row.stage }}</span></td>
              <td><button type="button" class="link" @click.stop="onProjectClick(row)">{{ row.name }}</button></td>
              <td>
                <div class="prog-wrap">
                  <div class="bar hp-anim-progress" :class="{ 'is-filled': barsFilled }">
                    <i :style="{ width: barsFilled ? `${row.progress}%` : '0%' }"></i>
                  </div>
                  <span>{{ row.progress }}%</span>
                </div>
              </td>
              <td>
                <span v-if="!row.isCompleted && row.dDay" :class="{ urgent: row.isUrgent }">{{ row.scheduledOpenDate }} ({{ row.dDay }})</span>
                <span v-else>{{ row.scheduledOpenDate }}</span>
              </td>
              <td>
                <template v-if="row.isCompleted && row.actualOpenDate">
                  <button v-if="row.isOverdue" type="button" class="link over" @click.stop="onOverdueClick(row)">{{ row.actualOpenDate }}</button>
                  <span v-else>{{ row.actualOpenDate }}</span>
                </template>
                <span v-else class="empty-cell">-</span>
              </td>
              <td><button type="button" class="link" @click.stop="onDeptClick(row)">{{ row.requestDept }}</button></td>
              <td>{{ row.devDept }}</td>
            </tr>
          </tbody>
        </table>
      </div>
      <HpPagination v-model:page="currentPage" :total-pages="totalPages" />
    </section>

    <ScheduleChangeModal v-model="showScheduleModal" :data="scheduleModalData" />
    <RequirementListModal v-model="showRequirementModal" :context="requirementContext" />
  </div>
</template>

<style scoped>
/* font-size는 --font-size-* 토큰 또는 calc(Npx + var(--font-size-offset))을 쓴다.
   rem은 --font-size-offset에 반응하지 않아 내설정>글자 크기가 먹지 않는다(layout.css:3-11 선례). */
.dashboard { padding: 1rem 1.5rem 1.5rem; }
.hint { margin: 0 0 0.9rem; font-size: var(--font-size-xs); color: var(--lnb-muted); background: var(--lnb-hover); border: 1px solid var(--lnb-line); display: inline-block; padding: 0.15rem 0.6rem; border-radius: 999px; }
.scope-caption { margin: 0 0 0.45rem; font-size: var(--font-size-xs); color: var(--lnb-muted); }
.pad { padding: 0.9rem 1rem; }
.ghost { height: 32px; padding: 0 0.9rem; border-radius: 7px; font-size: calc(12.5px + var(--font-size-offset)); cursor: pointer; transition: background var(--transition-fast), border-color var(--transition-fast), color var(--transition-fast); background: var(--lnb-side); color: var(--lnb-txt); border: 1px solid var(--lnb-line); }
.ghost:hover { background: var(--lnb-hover); }
.ghost:focus-visible { outline: 2px solid var(--teal); outline-offset: 2px; }
.dash-grid { display: grid; gap: 0.9rem; margin-bottom: 0.9rem; }
.dash-grid--2 { grid-template-columns: 1fr 260px; }
.dash-grid--3 { grid-template-columns: repeat(3, 1fr); }
.kpi-row { display: flex; gap: 12px; margin-bottom: var(--space-lg); }
.kpi { flex: 1; border: none; border-radius: var(--radius-card); padding: 16px 16px 14px; transition: transform var(--transition-fast); }
.kpi:hover { transform: translateY(-2px); }
.kpi__dot { display: block; width: 10px; height: 10px; border-radius: 50%; background: currentColor; margin-bottom: 10px; }
.kpi__lab { display: block; font-size: calc(11.5px + var(--font-size-offset)); color: currentColor; opacity: 0.75; font-weight: 600; }
.kpi__num { display: block; font-size: calc(28px + var(--font-size-offset)); font-weight: 800; margin-top: 4px; color: currentColor; }
.kpi--neutral { background: var(--gray-bg); color: var(--lnb-logo); }
.kpi--gray { background: var(--gray-bg); color: var(--gray); }
.kpi--blue { background: var(--blue-bg); color: var(--blue); }
.kpi--green { background: var(--green-bg); color: var(--green); }
.kpi--red { background: var(--red-bg); color: var(--red); }
.gauge-card { display: flex; flex-direction: column; align-items: center; }
.gauge { --p: 11.1%; width: 150px; height: 84px; position: relative; overflow: hidden; }
.gauge__arc { width: 150px; height: 150px; border-radius: 50%; background: conic-gradient(from 270deg, var(--teal) 0 var(--p), var(--lnb-line) var(--p) 50%, transparent 50%); }
.gauge__hole { position: absolute; left: 26px; right: 26px; bottom: 0; top: 26px; background: var(--lnb-side); border-radius: 150px 150px 0 0; display: flex; align-items: flex-end; justify-content: center; padding-bottom: 2px; }
.gauge__hole b { font-size: calc(17px + var(--font-size-offset)); }
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
/* 실적 대시보드와 같은 단색. 종전에는 이 화면만 그라디언트여서 같은 막대가 달라 보였다. */
.hbar__fill { display: block; height: 100%; background: var(--teal); border-radius: inherit; }
.hbar__val { width: 26px; text-align: right; font-weight: 700; flex-shrink: 0; }
.listcard__head { display: flex; align-items: center; gap: 0.5rem; padding: 0.9rem 1rem 0.75rem; font-size: var(--font-size-sm); border-bottom: 1px solid var(--lnb-line); }
.listcard__head select { height: 28px; border: 1px solid var(--lnb-line); background: var(--lnb-side); color: var(--lnb-txt); border-radius: 6px; padding: 0 0.4rem; font-size: var(--font-size-xs); }
.listcard__head span { margin-left: auto; }
.listcard__scroll { overflow-x: auto; padding: 0.9rem 1rem 0; }
.tbl { width: 100%; border-collapse: collapse; font-size: var(--font-size-sm); }
.tbl thead th { background: var(--lnb-hover); text-align: center; padding: 0.5rem 0.6rem; border-bottom: 1px solid var(--lnb-line); white-space: nowrap; }
.tbl tbody td { padding: 0.6rem 0.6rem; border-bottom: 1px solid var(--lnb-line); }
.tbl tbody tr.click { cursor: pointer; }
.tbl tbody tr.click:hover { background: var(--teal-50); }
.link { border: none; background: none; color: var(--teal); text-decoration: underline; cursor: pointer; font: inherit; padding: 0; }
.link.over { color: var(--red); }
.urgent { color: var(--red); font-weight: 700; }
.empty-cell { color: var(--lnb-muted); }
.prog-wrap { display: flex; align-items: center; gap: 0.5rem; min-width: 110px; }
.stbadge { font-size: var(--font-size-xs); font-weight: 700; padding: 0.15rem 0.5rem; border-radius: 20px; background: var(--lnb-line); }

@media (max-width: 1200px) {
  .dash-grid--3 { grid-template-columns: 1fr; }
  .dash-grid--2 { grid-template-columns: 1fr; }
}
</style>
