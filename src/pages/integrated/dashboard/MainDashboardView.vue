<script setup>
// PAG-M-DAS-01 메인 대시보드 / 전체 프로젝트 현황
import { computed, onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import {
  dashboardMeta,
  stageKpi,
  completionRate,
  initiators,
  devTypes,
  summaries,
  dashboardProjects,
  requestDepts,
  devDepts,
  stageOptions,
} from '@/entities/dashboard/mock/dashboard'
import { pageSizeOptions } from '@/shared/lib/commonOptions'
import { getScheduleChange } from '@/entities/dashboard/mock/scheduleChange'
import ScheduleChangeModal from '@/pages/integrated/dashboard/ScheduleChangeModal.vue'
import RequirementListModal from '@/pages/integrated/dashboard/RequirementListModal.vue'
import SearchableSelect from '@/shared/ui/SearchableSelect.vue'
import SearchFilterBar from '@/shared/ui/SearchFilterBar.vue'
import FilterSelectPill from '@/shared/ui/FilterSelectPill.vue'
import FilterDateRange from '@/shared/ui/FilterDateRange.vue'
import ExcelDownloadButton from '@/shared/ui/ExcelDownloadButton.vue'
import { mockExcelDownload } from '@/shared/file-excel/excelDownload'

const router = useRouter()

const filterExpanded = ref(false)
const filters = ref({
  keyword: '',
  requestDept: '',
  devDept: '',
  stage: '전체',
  initiator: '',
  devType: '',
  summary: '',
  openFrom: '',
  openTo: '',
})

const appliedFilters = ref({ ...filters.value })
const pageSize = ref(20)
const currentPage = ref(1)

const showScheduleModal = ref(false)
const scheduleModalData = ref(null)
const showRequirementModal = ref(false)
const requirementContext = ref(null)

const initiatorGradient = computed(() => buildConicGradient(initiators))
const devTypeGradient = computed(() => buildConicGradient(devTypes))
const initiatorTotal = computed(() => initiators.reduce((s, i) => s + i.count, 0))
const devTypeTotal = computed(() => devTypes.reduce((s, i) => s + i.count, 0))
const summaryMax = computed(() => Math.max(...summaries.map((s) => s.count), 1))
const gaugePercent = computed(() => `${(completionRate / 2).toFixed(1)}%`)

// 로드 시 막대가 0에서 채워지는 진입 애니메이션
const barsFilled = ref(false)
onMounted(() => {
  requestAnimationFrame(() => {
    setTimeout(() => { barsFilled.value = true }, 60)
  })
})

function pct(count, total) {
  return total ? Math.round((count / total) * 100) : 0
}

const STAGE_SORT_PRIORITY = { 테스트: 0, 처리중: 1, 협의중: 2, 접수: 3, 완료: 4, 반려: 5 }

const filteredProjects = computed(() => {
  const f = appliedFilters.value
  const list = dashboardProjects.filter((p) => {
    if (f.keyword && !p.name.includes(f.keyword) && !p.id.includes(f.keyword)) return false
    if (f.requestDept && p.requestDept !== f.requestDept) return false
    if (f.devDept && p.devDept !== f.devDept) return false
    if (f.stage !== '전체' && p.stage !== f.stage) return false
    if (f.initiator && p.initiator !== f.initiator) return false
    if (f.devType && p.devType !== f.devType) return false
    if (f.summary && p.summary !== f.summary) return false
    return true
  })
  return [...list].sort((a, b) => {
    if (a.scheduledOpenDate !== b.scheduledOpenDate) {
      return a.scheduledOpenDate < b.scheduledOpenDate ? -1 : 1
    }
    return (STAGE_SORT_PRIORITY[a.stage] ?? 99) - (STAGE_SORT_PRIORITY[b.stage] ?? 99)
  })
})

const pagedProjects = computed(() => {
  const start = (currentPage.value - 1) * pageSize.value
  return filteredProjects.value.slice(start, start + pageSize.value)
})

const totalPages = computed(() =>
  Math.max(1, Math.ceil(filteredProjects.value.length / pageSize.value)),
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

const FILTER_TAG_META = [
  { key: 'keyword', label: '프로젝트' },
  { key: 'requestDept', label: '요청부서' },
  { key: 'devDept', label: '담당개발부서' },
  { key: 'stage', label: '처리단계', skip: (v) => !v || v === '전체' },
  { key: 'initiator', label: '발의주체' },
  { key: 'devType', label: '개발구분' },
  { key: 'summary', label: '적요' },
  { key: 'openFrom', label: '오픈시작' },
  { key: 'openTo', label: '오픈종료' },
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
  keyword: '',
  requestDept: '',
  devDept: '',
  stage: '전체',
  initiator: '',
  devType: '',
  summary: '',
  openFrom: '',
  openTo: '',
}

function removeFilterTag(key) {
  const cleared = FILTER_CLEAR_DEFAULTS[key] ?? ''
  filters.value[key] = cleared
  appliedFilters.value[key] = cleared
  search()
}

function resetFilters() {
  filters.value = {
    keyword: '',
    requestDept: '',
    devDept: '',
    stage: '전체',
    initiator: '',
    devType: '',
    summary: '',
    openFrom: '',
    openTo: '',
  }
  appliedFilters.value = { ...filters.value }
  currentPage.value = 1
}

function search() {
  appliedFilters.value = { ...filters.value }
  currentPage.value = 1
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

function onProjectClick(row) {
  router.push('/workspace/info')
}

function onRequirementClick(row) {
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
</script>

<template>
  <div class="dashboard">
    <p class="notice">
      {{ dashboardMeta.yearScope }} (조회시점 {{ dashboardMeta.queryTime }})
    </p>

    <!-- 검색조건 -->
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
        <SearchableSelect
          variant="pill"
          label="요청부서"
          v-model="filters.requestDept"
          :options="requestDepts"
          placeholder="선택"
        />
        <FilterSelectPill
          label="담당개발부서"
          v-model="filters.devDept"
          :options="[{ value: '', label: '선택' }, ...devDepts]"
          empty-label="선택"
        />
        <FilterSelectPill
          label="처리단계"
          v-model="filters.stage"
          :options="stageOptions"
          empty-label="전체"
        />
      </template>
      <template #expand>
        <FilterSelectPill
          label="발의주체"
          v-model="filters.initiator"
          :options="[{ value: '', label: '전체' }, ...initiators.map((i) => i.label)]"
          empty-label="전체"
        />
        <FilterSelectPill
          label="개발구분"
          v-model="filters.devType"
          :options="[{ value: '', label: '전체' }, ...devTypes.map((d) => d.label)]"
          empty-label="전체"
        />
        <FilterSelectPill
          label="적요"
          v-model="filters.summary"
          :options="[{ value: '', label: '전체' }, ...summaries.map((s) => s.label)]"
          empty-label="전체"
        />
        <FilterDateRange
          label="오픈기간"
          :from="filters.openFrom"
          :to="filters.openTo"
          @update:from="filters.openFrom = $event"
          @update:to="filters.openTo = $event"
        />
      </template>
    </SearchFilterBar>

    <!-- KPI + 완료율 -->
    <div class="dash-grid dash-grid--2">
      <section class="card pad">
        <h3 class="sec-title">처리단계</h3>
        <div class="kpi-row">
          <div class="kpi kpi--neutral">
            <span class="kpi__dot"></span>
            <span class="kpi__lab">전체</span>
            <span class="kpi__num">{{ stageKpi.total }}</span>
          </div>
          <div class="kpi kpi--gray">
            <span class="kpi__dot"></span>
            <span class="kpi__lab">접수</span>
            <span class="kpi__num">{{ stageKpi.received }}</span>
          </div>
          <div class="kpi kpi--blue">
            <span class="kpi__dot"></span>
            <span class="kpi__lab">진행중</span>
            <span class="kpi__num">{{ stageKpi.inProgress }}</span>
          </div>
          <div class="kpi kpi--green">
            <span class="kpi__dot"></span>
            <span class="kpi__lab">완료</span>
            <span class="kpi__num">{{ stageKpi.completed }}</span>
          </div>
          <div class="kpi kpi--red">
            <span class="kpi__dot"></span>
            <span class="kpi__lab">반려</span>
            <span class="kpi__num">{{ stageKpi.rejected }}</span>
          </div>
        </div>
      </section>

      <section class="card pad gauge-card">
        <h3 class="sec-title">완료율</h3>
        <div class="gauge" :style="{ '--p': gaugePercent }">
          <div class="gauge__arc"></div>
          <div class="gauge__hole">
            <b>{{ completionRate }}%</b>
          </div>
        </div>
      </section>
    </div>

    <!-- 차트 3종 -->
    <div class="dash-grid dash-grid--3">
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

      <section class="card pad">
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

    <!-- 프로젝트 목록 -->
    <section class="card listcard">
      <div class="listcard__head">
        <h3 class="sec-title">프로젝트 목록</h3>
        <span class="listcard__cnt">총 <b>{{ filteredProjects.length }}</b>건</span>
        <select v-model="pageSize" class="listcard__pagesize" @change="onPageSizeChange">
          <option v-for="n in pageSizeOptions" :key="n" :value="n">{{ n }}건씩 보기</option>
        </select>
        <ExcelDownloadButton @click="onExcelDownload" />
      </div>
      <div class="listcard__scroll">
        <table class="tbl">
          <thead>
            <tr>
              <th>No.</th>
              <th>처리단계</th>
              <th>프로젝트명</th>
              <th>공정률</th>
              <th>오픈예정일</th>
              <th>오픈일</th>
              <th>요청부서</th>
              <th>담당개발부서</th>
              <th>요구사항</th>
            </tr>
          </thead>
          <tbody>
            <tr
              v-for="row in pagedProjects"
              :key="row.id"
              class="tbl__row"
              @click="onProjectClick(row)"
            >
              <td>{{ row.no }}</td>
              <td>
                <span class="stbadge" :class="row.stageType">{{ row.stage }}</span>
              </td>
              <td>
                <button type="button" class="tbl__link" @click.stop="onProjectClick(row)">
                  {{ row.name }}
                </button>
              </td>
              <td>
                <div class="prog-wrap">
                  <div class="bar">
                    <i :style="{ width: `${row.progress}%` }"></i>
                  </div>
                  <span>{{ row.progress }}%</span>
                </div>
              </td>
              <td>
                <span v-if="!row.isCompleted && row.dDay" :class="{ 'tbl__date--urgent': row.isUrgent }">
                  {{ row.scheduledOpenDate }} ({{ row.dDay }})
                </span>
                <span v-else>{{ row.scheduledOpenDate }}</span>
              </td>
              <td>
                <template v-if="row.isCompleted && row.actualOpenDate">
                  <button
                    v-if="row.isOverdue"
                    type="button"
                    class="tbl__date tbl__date--over"
                    @click.stop="onOverdueClick(row)"
                  >
                    {{ row.actualOpenDate }}
                  </button>
                  <span v-else>{{ row.actualOpenDate }}</span>
                </template>
                <span v-else class="tbl__date--empty">-</span>
              </td>
              <td>{{ row.requestDept }}</td>
              <td>{{ row.devDept }}</td>
              <td>
                <button
                  type="button"
                  class="req-icon-btn"
                  title="요구사항 목록 보기"
                  @click.stop="onRequirementClick(row)"
                >
                  📋
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

    <ScheduleChangeModal
      v-model="showScheduleModal"
      :data="scheduleModalData"
    />
    <RequirementListModal
      v-model="showRequirementModal"
      :context="requirementContext"
    />
  </div>
</template>

<style scoped>
.dashboard {
  font-family: var(--font-family);
  color: var(--lnb-txt);
  padding: 0 24px 28px;
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

/* 그리드 */
.dash-grid {
  display: grid;
  gap: 14px;
  margin-bottom: 14px;
}

.dash-grid--2 {
  grid-template-columns: 1fr 280px;
}

.dash-grid--3 {
  grid-template-columns: repeat(3, 1fr);
}

/* KPI — 소프트 컬러 스탯 카드 */
.kpi-row {
  display: flex;
  gap: 12px;
}

.kpi {
  flex: 1;
  border: none;
  border-radius: 14px;
  padding: 16px 16px 14px;
  transition: transform var(--transition-fast);
}

.kpi:hover {
  transform: translateY(-2px);
}

.kpi__dot {
  display: block;
  width: 10px;
  height: 10px;
  border-radius: 50%;
  background: currentColor;
  margin-bottom: 10px;
}

.kpi__lab {
  display: block;
  font-size: calc(11.5px + var(--font-size-offset, 0px));
  color: currentColor;
  opacity: 0.75;
  font-weight: 600;
}

.kpi__num {
  display: block;
  font-size: calc(28px + var(--font-size-offset, 0px));
  font-weight: 800;
  margin-top: 4px;
  color: currentColor;
}

.kpi--neutral { background: var(--gray-bg); color: var(--lnb-logo); }
.kpi--gray { background: var(--gray-bg); color: var(--gray); }
.kpi--blue { background: var(--blue-bg); color: var(--blue); }
.kpi--green { background: var(--green-bg); color: var(--green); }
.kpi--red { background: var(--red-bg); color: var(--red); }

/* 게이지 */
.gauge-card {
  display: flex;
  flex-direction: column;
  align-items: center;
}

.gauge-card .sec-title {
  align-self: flex-start;
}

.gauge {
  --p: 11.1%;
  width: 150px;
  height: 84px;
  position: relative;
  overflow: hidden;
  animation: donut-in 0.7s cubic-bezier(0.16, 1, 0.3, 1) both;
}

.gauge__arc {
  width: 150px;
  height: 150px;
  border-radius: 50%;
  background: conic-gradient(
    from 270deg,
    var(--teal) 0 var(--p),
    var(--line-2) var(--p) 50%,
    transparent 50%
  );
  filter: drop-shadow(0 6px 14px rgba(20, 30, 45, 0.12));
}

.gauge__hole {
  position: absolute;
  left: 26px;
  right: 26px;
  bottom: 0;
  top: 26px;
  background: var(--lnb-side);
  border-radius: 150px 150px 0 0;
  display: flex;
  align-items: flex-end;
  justify-content: center;
  padding-bottom: 2px;
}

.gauge__hole b {
  font-size: calc(18px + var(--font-size-offset, 0px));
  font-weight: 800;
  color: var(--lnb-logo);
}

/* 도넛 */
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
  font-weight: 700;
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

/* 가로 막대 */
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
  height: 18px;
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

/* 테이블 */
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
  margin-left: auto;
  font-size: calc(12px + var(--font-size-offset, 0px));
  color: var(--lnb-txt);
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

.tbl__row {
  cursor: pointer;
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

.req-icon-btn {
  border: none;
  background: none;
  padding: 2px 4px;
  font-size: calc(14px + var(--font-size-offset, 0px));
  cursor: pointer;
  border-radius: 6px;
  line-height: 1;
}

.req-icon-btn:hover {
  background: var(--teal-50);
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

.tbl__date--urgent {
  color: var(--red);
  font-weight: 700;
}

.tbl__date--empty {
  color: var(--lnb-muted);
}

.prog-wrap {
  display: flex;
  align-items: center;
  gap: 8px;
  min-width: 120px;
}

.bar {
  flex: 1;
  height: 6px;
  background: var(--line-2);
  border-radius: 6px;
  overflow: hidden;
  min-width: 60px;
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

/* 페이저 */
.pager {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
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

@media (max-width: 1200px) {
  .dash-grid--3 {
    grid-template-columns: 1fr;
  }
  .dash-grid--2 {
    grid-template-columns: 1fr;
  }
}
</style>
