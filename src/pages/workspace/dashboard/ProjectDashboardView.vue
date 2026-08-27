<script setup>
// PAG-S-DAS-01 프로젝트 대시보드 — h-pms UI + mock
import { computed, onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import { useProjectStore } from '@/app/stores/project'
import { useAuthStore } from '@/app/stores/auth'
import {
  buildProjectDashboardMock,
  toApiDashboard,
  formatPeriod,
  statusTone,
  projectDashboardMeta,
} from '@/entities/dashboard/mock/projectDashboard'
import { routeForTaskType } from '@/entities/inbox/mock/inbox'
import ErrorBanner from '@/shared/ui/ErrorBanner.vue'
import LoadingOverlay from '@/shared/ui/LoadingOverlay.vue'
import HpDonutChart from '@/shared/ui/HpDonutChart.vue'

const router = useRouter()
const projectStore = useProjectStore()
const authStore = useAuthStore()

const loading = ref(false)
const error = ref(null)
const data = ref(null)
const barsFilled = ref(false)

const hasProject = computed(() => !!projectStore.currentProject?.id)

const LEGEND = projectDashboardMeta.legend

const TYPE_ICONS = {
  기획: { label: '기', color: 'var(--teal, #119a8a)' },
  디자인: { label: '디', color: 'var(--blue, #3b82f6)' },
  퍼블리싱: { label: '퍼', color: 'var(--orange, #e08a2b)' },
  개발: { label: '개', color: 'var(--green, #16a34a)' },
  DEV테스트: { label: 'DEV', color: 'var(--gray, #6b7280)' },
  운영테스트: { label: '운영', color: 'var(--gray, #6b7280)' },
  단위테스트: { label: '단', color: 'var(--gray, #6b7280)' },
  STG테스트: { label: 'STG', color: 'var(--gray, #6b7280)' },
}

function toMessage(err) {
  return err instanceof Error ? err.message : String(err)
}

function pct(rate) {
  return Math.round((rate ?? 0) * 1000) / 10
}

// 계획 대비 차이는 부호로 색을 구분한다: 음수 빨강 / 양수 teal / 0%는 회색.
function diffTone(diffLabel) {
  const match = diffLabel.match(/(-?\+?\d+(?:\.\d+)?)/)
  const n = match ? Number(match[1]) : 0
  if (n < 0) return 'negative'
  if (n > 0) return 'positive'
  return 'zero'
}

const progressSegments = computed(() => {
  const done = pct(data.value?.totalProgress?.execRate ?? 0)
  return [
    { value: done, color: 'var(--teal)' },
    { value: 100 - done, color: 'var(--lnb-line)' },
  ]
})

function formatAsOf(iso) {
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return iso
  const pad = (n) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`
}

function typeIcon(type) {
  return TYPE_ICONS[type] || { label: type?.slice(0, 1) || '-', color: 'var(--lnb-muted)' }
}

function complianceLabel(status) {
  return LEGEND.find((l) => l.key === status)?.label || status
}

function complianceClass(compliance) {
  if (compliance === '경과') return 'compliance--경과'
  if (compliance === '단축') return 'compliance--단축'
  if (compliance === '정상') return 'compliance--정상'
  return 'compliance--정상'
}

async function loadData() {
  loading.value = true
  error.value = null
  barsFilled.value = false
  data.value = null
  try {
    if (!projectStore.currentProject?.id) return
    const raw = buildProjectDashboardMock(
      projectStore.currentProject.id,
      projectStore.currentProject.name,
      authStore.user?.id,
    )
    data.value = toApiDashboard(raw)
    requestAnimationFrame(() => {
      setTimeout(() => {
        barsFilled.value = true
      }, 60)
    })
  } catch (err) {
    error.value = toMessage(err)
  } finally {
    loading.value = false
  }
}

onMounted(loadData)

function goWbs() {
  router.push({ path: '/workspace/wbs' })
}

function goScheduleRow(row) {
  const path = routeForTaskType(row.taskType || '')
  if (path === '/workspace/wbs') {
    router.push({ path: '/workspace/wbs', query: { task: row.taskName } })
    return
  }
  router.push(path)
}
</script>

<template>
  <div class="proj-dash hp-anim-enter">
    <h1 class="proj-dash__title">
      프로젝트 현황
      <span v-if="data" class="proj-dash__title-asof">기준일 : {{ formatAsOf(data.asOf) }}</span>
    </h1>

    <ErrorBanner v-if="error" :message="error" />
    <LoadingOverlay :visible="loading" />

    <p v-if="!loading && !hasProject" class="proj-dash__hint">
      프로젝트 현황을 보려면 프로젝트를 선택해야 합니다.
    </p>
    <p v-else-if="!loading && !data && !error" class="proj-dash__hint">
      선택한 프로젝트의 대시보드 데이터를 불러오지 못했습니다.
    </p>

    <template v-if="!loading && data">
      <div class="proj-dash__sections">
        <!-- 총 공정률 + 지연/단축 정보를 하나의 통합 카드로 -->
        <section class="card card--panel pad proj-dash__hero">
          <h3 class="sec-title proj-dash__hero-title">
            <span class="proj-dash__hero-icon" aria-hidden="true">
              <span class="proj-dash__hero-icon-bar proj-dash__hero-icon-bar--1" />
              <span class="proj-dash__hero-icon-bar proj-dash__hero-icon-bar--2" />
              <span class="proj-dash__hero-icon-bar proj-dash__hero-icon-bar--3" />
            </span>
            진행율
          </h3>
          <div class="hero-body">
            <!-- 진척 게이지는 공용 SVG 도넛. 값/잔여 두 조각이라 간격은 0이다 -->
            <HpDonutChart
              class="hp-anim-chart hero-donut"
              :segments="progressSegments"
              :size="150"
              :thickness="17"
              :gap="0"
              rounded
              :aria-label="`실행기준 공정률 ${pct(data.totalProgress.execRate)}%`"
            >
              <span class="ring-cap">총 공정률</span>
              <b class="ring-val">{{ pct(data.totalProgress.execRate) }}%</b>
            </HpDonutChart>

            <div class="hero-mid">
              <div class="hero-mid__stats">
                <div class="hero-mid__stat">
                  <span class="hero-mid__lab">계획기준</span>
                  <span class="hero-mid__val">{{ pct(data.totalProgress.planRate) }}%</span>
                </div>
                <span class="hero-mid__sep" />
                <div class="hero-mid__stat">
                  <span class="hero-mid__lab">실행기준</span>
                  <span class="hero-mid__val">{{ pct(data.totalProgress.execRate) }}%</span>
                </div>
                <div class="hero-diff">
                  <span class="hero-diff__lab">계획 대비 차이</span>
                  <b
                    class="hero-diff__val"
                    :class="`hero-diff__val--${diffTone(data.totalProgress.diffLabel)}`"
                  >{{ data.totalProgress.diffLabel.replace('계획 대비 ', '') }}</b>
                </div>
              </div>

              <div class="hero-progress">
                <div class="hero-progress__track">
                  <div
                    class="hero-progress__fill"
                    :style="{ width: barsFilled ? `${pct(data.totalProgress.execRate)}%` : '0%' }"
                  />
                  <div class="hero-progress__marker" :style="{ left: `${pct(data.totalProgress.planRate)}%` }" />
                </div>
                <div class="hero-progress__legend">
                  <span><i class="hero-progress__swatch hero-progress__swatch--marker" />계획 위치</span>
                  <span><i class="hero-progress__swatch hero-progress__swatch--fill" />실행 진행률</span>
                </div>
              </div>
            </div>

            <div class="hero-right">
              <div class="hero-right__stat hero-right__stat--clickable" @click="goWbs">
                <span class="hero-right__lab hero-right__lab--delay">경과(예상)</span>
                <span class="hero-right__num hero-right__num--delay">{{ data.delaySummary.expectedDelay }}<small>건</small></span>
              </div>
              <span class="hero-right__sep" />
              <div class="hero-right__stat">
                <span class="hero-right__lab">정상</span>
                <span class="hero-right__num">{{ data.delaySummary.normal }}<small>건</small></span>
              </div>
              <span class="hero-right__sep" />
              <div class="hero-right__stat hero-right__stat--clickable" @click="goWbs">
                <span class="hero-right__lab hero-right__lab--shorten">단축(예상)</span>
                <span class="hero-right__num hero-right__num--shorten">{{ data.delaySummary.expectedShorten }}<small>건</small></span>
              </div>
            </div>
          </div>
        </section>

        <section class="card card--panel pad">
          <h3 class="sec-title proj-dash__hero-title">
            <span class="proj-dash__bars-icon" aria-hidden="true">
              <span class="proj-dash__bars-icon-bar proj-dash__bars-icon-bar--1" />
              <span class="proj-dash__bars-icon-bar proj-dash__bars-icon-bar--2" />
              <span class="proj-dash__bars-icon-bar proj-dash__bars-icon-bar--3" />
            </span>
            업무별 공정률 요약
          </h3>
          <div class="type-pills">
            <div v-for="item in data.typeSummary" :key="item.type" class="type-pill">
              <span class="type-pill__dot" :style="{ background: typeIcon(item.type).color }" />
              <span class="type-pill__name">{{ item.type }}</span>
              <span class="type-pill__rate">{{ item.rate != null ? `${item.rate}%` : '- %' }}</span>
            </div>
          </div>
        </section>

        <section class="detail-section">
          <div class="listcard__head">
            <h3 class="sec-title">업무별 상세 현황</h3>
            <p class="note listcard__note">계획 대비 실행일 기준 +1일 이상: 지연 | -1일 이하: 단축</p>
          </div>
          <div class="mw-table-card">
            <div class="mw-table-wrap">
              <table class="data-table mw-tasktable">
                <thead>
                  <tr>
                    <th>업무유형</th>
                    <th>담당자</th>
                    <th>계획일정</th>
                    <th>실행일정</th>
                    <th>실행 공정률</th>
                    <th>계획대비</th>
                    <th>계획준수</th>
                  </tr>
                </thead>
                <tbody>
                  <tr
                    v-for="row in data.details"
                    :key="row.wbsItemId"
                    class="click"
                    @click="goScheduleRow(row)"
                  >
                    <td class="cell--center">
                      <span class="type-icon" :style="{ background: typeIcon(row.taskType).color }">
                        {{ typeIcon(row.taskType).label }}
                      </span>
                      {{ row.taskType }}
                    </td>
                    <td class="cell--center">
                      {{ row.assignee }}
                      <span v-if="row.empId" class="emp-id">({{ row.empId }})</span>
                    </td>
                    <td class="cell--center">{{ formatPeriod(row.planStart, row.planEnd) }}</td>
                    <td class="cell--center">{{ formatPeriod(row.execStart, row.execEnd, !row.execEnd) }}</td>
                    <td class="cell--right">{{ row.execRate }}%</td>
                    <td
                      class="cell--center"
                      :class="{
                        'text-delay': row.compliance === '경과',
                        'text-shorten': row.compliance === '단축',
                      }"
                    >
                      {{ row.planDiff }}
                    </td>
                    <td class="cell--center">
                      <span class="status-dot" :class="`status-dot--${statusTone(row.status)}`" />
                      <span class="compliance" :class="complianceClass(row.compliance)">
                        {{ row.compliance || complianceLabel(row.status) }}
                      </span>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
          <div v-if="!data.details.length" class="empty">WBS 일정 항목이 없습니다.</div>
        </section>
      </div>
    </template>
  </div>
</template>

<style scoped>
.proj-dash {
  padding: 14px 18px 28px;
  color: var(--lnb-txt);
  font-size: calc(13px + var(--font-size-offset));
}
.proj-dash__title {
  font-size: calc(18px + var(--font-size-offset));
  font-weight: 700;
  margin: 0 0 14px;
  display: flex;
  align-items: baseline;
  gap: 8px;
}
.proj-dash__hint {
  font-size: calc(12px + var(--font-size-offset));
  font-weight: 500;
  color: var(--lnb-muted);
}
.proj-dash__title-asof {
  margin-left: auto;
  font-size: calc(12px + var(--font-size-offset));
  font-weight: 500;
  color: var(--lnb-muted);
}
.sec-title {
  margin: 0 0 12px;
  padding-bottom: 0;
  border-bottom: none;
  font-size: calc(14px + var(--font-size-offset));
  font-weight: 700;
}
.pad { padding: 14px 16px; }
.note {
  margin: 8px 0 0;
  font-size: calc(11px + var(--font-size-offset));
  color: var(--lnb-muted);
  line-height: 1.4;
}

.proj-dash__sections {
  display: flex;
  flex-direction: column;
  gap: var(--space-md, 16px);
}

.proj-dash__hero-title {
  display: flex;
  align-items: center;
  gap: 10px;
}
.proj-dash__hero-icon {
  display: inline-flex;
  flex-direction: column;
  gap: 3px;
  width: 18px;
}
.proj-dash__hero-icon-bar {
  display: block;
  height: 3px;
  border-radius: 2px;
  background: var(--lnb-txt);
}
.proj-dash__hero-icon-bar--1 { opacity: 0.35; }
.proj-dash__hero-icon-bar--2 { opacity: 0.65; }
.proj-dash__hero-icon-bar--3 { opacity: 1; }

.hero-body {
  display: flex;
  align-items: center;
  gap: 24px;
  flex-wrap: wrap;
}
.hero-donut { flex: none; }

.hero-mid {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 14px;
  min-width: 260px;
}
.hero-mid__stats {
  display: flex;
  align-items: center;
  gap: 12px;
  flex-wrap: wrap;
}
.hero-mid__stat { white-space: nowrap; }
.hero-mid__lab {
  display: block;
  font-size: calc(11px + var(--font-size-offset));
  color: var(--lnb-muted);
  margin-bottom: 4px;
}
.hero-mid__val {
  font-size: calc(18px + var(--font-size-offset));
  font-weight: 800;
  color: var(--lnb-txt);
}
.hero-mid__sep {
  width: 1px;
  height: 26px;
  background: var(--lnb-line);
  flex: none;
}
.hero-diff {
  display: flex;
  align-items: center;
  gap: 8px;
  background: var(--teal-50, #eaf6f3);
  border-radius: 10px;
  padding: 8px 16px;
}
.hero-diff__lab {
  font-size: calc(12px + var(--font-size-offset));
  color: var(--teal);
}
.hero-diff__val {
  font-size: calc(16px + var(--font-size-offset));
  font-weight: 800;
  color: var(--teal);
}
.hero-diff__val--negative { color: var(--red, #d33); }
.hero-diff__val--positive { color: var(--teal); }
.hero-diff__val--zero { color: var(--lnb-muted); }

.hero-progress__track {
  position: relative;
  height: 20px;
  border-radius: 10px;
  background: var(--lnb-line);
}
.hero-progress__fill {
  position: absolute;
  inset: 0 auto 0 0;
  height: 100%;
  background: var(--teal);
  border-radius: 10px;
  transition: width 0.4s ease;
}
.hero-progress__marker {
  position: absolute;
  top: -3px;
  bottom: -3px;
  width: 3px;
  background: var(--lnb-txt);
  border-radius: 2px;
}
.hero-progress__legend {
  display: flex;
  align-items: center;
  gap: 14px;
  margin-top: 8px;
  font-size: calc(11px + var(--font-size-offset));
  color: var(--lnb-muted);
  flex-wrap: wrap;
}
.hero-progress__legend span {
  display: inline-flex;
  align-items: center;
  gap: 5px;
}
.hero-progress__swatch {
  display: inline-block;
  width: 9px;
  height: 9px;
  border-radius: 2px;
}
.hero-progress__swatch--marker { width: 3px; height: 10px; background: var(--lnb-txt); }
.hero-progress__swatch--fill { background: var(--teal); }

.hero-right {
  flex: 1.3;
  min-width: 260px;
  display: flex;
  align-items: center;
  justify-content: space-around;
  gap: 0;
  padding-left: 18px;
  border-left: 1px solid var(--lnb-line);
  text-align: center;
}
.hero-right__stat { min-width: 0; }
.hero-right__stat--clickable { cursor: pointer; }
.hero-right__stat--clickable:hover { opacity: 0.85; }
.hero-right__sep {
  width: 1px;
  height: 36px;
  background: var(--lnb-line);
  flex: none;
}
.hero-right__lab {
  display: block;
  font-size: calc(12px + var(--font-size-offset));
  font-weight: 700;
  color: var(--lnb-txt);
  margin-bottom: 6px;
  white-space: nowrap;
}
.hero-right__lab--delay { color: var(--red, #d33); }
.hero-right__lab--shorten { color: var(--teal); }
.hero-right__num {
  font-size: calc(19px + var(--font-size-offset));
  font-weight: 800;
  color: var(--lnb-txt);
}
.hero-right__num small {
  font-size: calc(12px + var(--font-size-offset));
  font-weight: 600;
}
.hero-right__num--delay { color: var(--red, #d33); }
.hero-right__num--shorten { color: var(--teal); }

.proj-dash__bars-icon {
  display: inline-flex;
  align-items: flex-end;
  gap: 2.5px;
  height: 14px;
}
.proj-dash__bars-icon-bar {
  display: block;
  width: 3px;
  border-radius: 1px;
  background: var(--lnb-txt);
}
.proj-dash__bars-icon-bar--1 { height: 6px; }
.proj-dash__bars-icon-bar--2 { height: 10px; }
.proj-dash__bars-icon-bar--3 { height: 8px; }

.type-pills {
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
}
.type-pill {
  display: flex;
  align-items: center;
  gap: 10px;
  background: var(--lnb-hover);
  border-radius: 999px;
  padding: 10px 18px 10px 12px;
}
.type-pill__dot {
  width: 24px;
  height: 24px;
  border-radius: 50%;
  flex: none;
}
.type-pill__name {
  font-size: calc(13.5px + var(--font-size-offset));
  font-weight: 700;
  color: var(--color-text-2, var(--lnb-txt));
}
.type-pill__rate {
  font-size: calc(15px + var(--font-size-offset));
  font-weight: 800;
  color: var(--lnb-muted);
}
.listcard__head {
  display: flex;
  align-items: baseline;
  gap: 8px;
  margin-bottom: 10px;
}
.listcard__head .sec-title {
  margin-bottom: 0;
  border-bottom: none;
  padding-bottom: 0;
}
.listcard__note {
  margin: 0;
  padding: 0;
}
.mw-table-card {
  background: var(--bg-surface);
  border: 1px solid var(--border-default);
  border-radius: var(--r-card);
  box-shadow: var(--shadow-card);
  overflow: hidden;
  margin-top: 8px;
}
.mw-table-wrap { overflow-x: auto; }
.mw-tasktable { border: none; border-radius: 0; box-shadow: none; }
.mw-tasktable tbody tr.click { cursor: pointer; }
.mw-tasktable tbody tr.click:hover { background: var(--teal-50, var(--lnb-hover)); }
.type-icon {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 18px;
  height: 18px;
  border-radius: 50%;
  margin-right: 6px;
  font-size: calc(8px + var(--font-size-offset));
  font-weight: 700;
  color: #fff;
  vertical-align: middle;
}
.status-dot {
  display: inline-block;
  width: 8px;
  height: 8px;
  border-radius: 50%;
  margin-right: 6px;
  background: var(--lnb-muted);
}
.status-dot--normal { background: var(--teal, #119a8a); }
.status-dot--delay { background: var(--red, #d33); }
.status-dot--shorten { background: var(--green, #16a34a); }
.status-dot--wait { background: var(--gray, #6b7280); }
.emp-id {
  margin-left: 4px;
  color: var(--lnb-muted);
  font-size: calc(11px + var(--font-size-offset));
}
.text-delay { color: var(--red, #d33); font-weight: 600; }
.text-shorten { color: var(--green, #16a34a); font-weight: 600; }
.compliance {
  font-size: calc(11px + var(--font-size-offset));
  padding: 2px 8px;
  border-radius: 999px;
  font-weight: 600;
}
.compliance--정상 {
  background: var(--lnb-hover);
  color: var(--gray, #6b7280);
}
.compliance--경과 {
  background: var(--red-bg, #fde8e8);
  color: var(--red, #d33);
}
.compliance--단축 {
  background: var(--green-bg, #e8f7ee);
  color: var(--green, #16a34a);
}
.empty {
  text-align: center;
  color: var(--lnb-muted);
  padding: 24px 12px;
}
@media (max-width: 1100px) {
  .hero-body { flex-direction: column; align-items: stretch; }
  .hero-right { border-left: none; border-top: 1px solid var(--lnb-line); padding-left: 0; padding-top: 14px; }
}
</style>
