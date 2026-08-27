<script setup>
/**
 * 내업무 캘린더 뷰 — PAG-M-MY-02 / PAG-M-MY-03 (h-pms 화면 기준 UI 이관, API는 목업 유지)
 * 멀티데이 업무: 주 단위 가로 span 바 (일별 중복 표기 X)
 */
import { ref, computed, watch } from 'vue'
import { INBOX_GUIDE } from '@/entities/inbox/mock/inbox'
import { useAuthStore } from '@/app/stores/auth'
import { useProjectStore } from '@/app/stores/project'
import WbsScheduleModal from '@/pages/workspace/wbs/WbsScheduleModal.vue'
import WbsBulkScheduleModal from '@/pages/workspace/wbs/WbsBulkScheduleModal.vue'

const props = defineProps({
  tasks: { type: Array, default: () => [] },
})
const emit = defineEmits(['saved'])

const WEEKDAYS = ['일', '월', '화', '수', '목', '금', '토']
const VISIBLE_LANES = 2
/**
 * 프로젝트 식별 컬러 — 테마와 무관하게 고정 팔레트다(저해상도 모니터에서도 흐려지지 않게
 * 명시적으로 지정한다 — CSS 변수가 아니라 리터럴인 이유).
 */
const PROJECT_COLORS = [
  { rail: '#0d9488', bg: '#d7f0ec', bd: '#8fd4c9', text: '#0a4a45' }, // teal
  { rail: '#7c3aed', bg: '#ece3fd', bd: '#c1a9f5', text: '#4c1d95' }, // purple
  { rail: '#2563eb', bg: '#dde9fd', bd: '#a6c6f7', text: '#1e40af' }, // blue
]

const auth = useAuthStore()
const projectStore = useProjectStore()

const sourceTasks = ref([])
watch(
  () => props.tasks,
  (v) => {
    sourceTasks.value = JSON.parse(JSON.stringify(v || []))
  },
  { immediate: true },
)

const projectColorIndexes = computed(() => {
  const indexes = new Map()
  sourceTasks.value.forEach((task) => {
    if (!indexes.has(task.project)) indexes.set(task.project, indexes.size)
  })
  return indexes
})

function displayEnd(task) {
  if (task.execEnd && task.planEnd && task.execEnd < task.planEnd) return task.execEnd
  return task.planEnd
}

function calendarStatus(task) {
  if (task.holdStart && !task.holdEnd) return 'paused'
  if (task.execEnd) return 'done'
  if (task.delayed) return 'delayed'
  return 'active'
}

const calendarDerived = computed(() =>
  sourceTasks.value
    .filter((task) => task.planStart && task.planEnd)
    .map((task) => ({
      id: task.id,
      name: task.name,
      endLabel: endLabelOf(displayEnd(task)),
      project: task.project,
      projectId: task.projectId,
      projectOpenDate: task.projectOpenDate || null,
      wbsId: task.wbsId,
      start: task.execStart && task.planStart && task.execStart < task.planStart ? task.execStart : task.planStart,
      end: displayEnd(task),
      color: projectColorIndexes.value.get(task.project) ?? 0,
      status: calendarStatus(task),
      planStart: task.planStart,
      planEnd: task.planEnd,
      execStart: task.execStart,
      execEnd: task.execEnd,
      holdStart: task.holdStart,
      holdEnd: task.holdEnd,
    })),
)

const unscheduled = computed(() =>
  sourceTasks.value
    .filter((task) => !task.planEnd)
    .map((task) => ({
      id: task.id,
      project: task.project,
      projectId: task.projectId,
      wbsId: task.wbsId,
      name: task.name,
    })),
)

const today = new Date()
const cursor = ref(new Date(today.getFullYear(), today.getMonth(), 1))
const showScheduleModal = ref(false)
const scheduleTarget = ref(null)
const showBulkScheduleModal = ref(false)
const bulkTargets = ref([])

const calendarLabel = computed(
  () => `${cursor.value.getFullYear()}년 ${cursor.value.getMonth() + 1}월`,
)

const calendarWeeks = computed(() => {
  const year = cursor.value.getFullYear()
  const month = cursor.value.getMonth()
  const first = new Date(year, month, 1)
  const startDay = first.getDay()
  const gridStart = new Date(year, month, 1 - startDay)

  const allCells = []
  for (let i = 0; i < 42; i++) {
    const date = new Date(gridStart)
    date.setDate(gridStart.getDate() + i)
    allCells.push({
      date,
      iso: toISO(date),
      day: date.getDate(),
      inMonth: date.getMonth() === month,
      isToday: isSameDay(date, today),
    })
  }

  const weeks = []
  for (let w = 0; w < 6; w++) {
    const cells = allCells.slice(w * 7, w * 7 + 7)
    const bars = layoutWeekBars(cells)
    const maxLanes = Math.max(VISIBLE_LANES, ...bars.map((b) => b.lane + 1), 0)
    weeks.push({ cells, bars, maxLanes })
  }
  return weeks
})

function layoutWeekBars(weekCells) {
  const weekStart = weekCells[0].iso
  const weekEnd = weekCells[6].iso

  const segments = calendarDerived.value
    .filter((t) => t.end >= weekStart && t.start <= weekEnd)
    .map((t) => {
      const segStart = t.start > weekStart ? t.start : weekStart
      const segEnd = t.end < weekEnd ? t.end : weekEnd
      const startCol = weekCells.findIndex((c) => c.iso === segStart)
      const endCol = weekCells.findIndex((c) => c.iso === segEnd)
      return {
        ...t,
        displayStatus: t.status,
        startCol,
        endCol,
        span: endCol - startCol + 1,
        continuesPrev: t.start < weekStart,
        continuesNext: t.end > weekEnd,
        lane: 0,
      }
    })
    .sort((a, b) => a.startCol - b.startCol || b.span - a.span)

  assignLanes(segments)
  return segments
}

/** 겹치지 않게 행(lane) 배치 */
function assignLanes(segments) {
  const laneEnds = []
  for (const seg of segments) {
    let lane = 0
    while (laneEnds[lane] !== undefined && laneEnds[lane] >= seg.startCol) {
      lane++
    }
    seg.lane = lane
    laneEnds[lane] = seg.endCol
  }
}

function toISO(d) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

function isSameDay(a, b) {
  return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate()
}

function colorOf(idx) {
  return PROJECT_COLORS[idx % PROJECT_COLORS.length]
}

const hoveredTaskId = ref(null)

function prevMonth() {
  cursor.value = new Date(cursor.value.getFullYear(), cursor.value.getMonth() - 1, 1)
}

function nextMonth() {
  cursor.value = new Date(cursor.value.getFullYear(), cursor.value.getMonth() + 1, 1)
}

function goToday() {
  cursor.value = new Date(today.getFullYear(), today.getMonth(), 1)
}

function openScheduleModal(task) {
  const isCalendarTask = 'start' in task
  const start = isCalendarTask ? task.start : null
  const end = isCalendarTask ? task.end : null
  const source = sourceTasks.value.find((t) => t.id === task.id) || null
  projectStore.setCurrentProject({
    id: task.projectId,
    name: task.project,
    stage: '처리중',
  })
  scheduleTarget.value = {
    wbsId: task.wbsId || task.id || 'WBS-CAL',
    requirementName: task.name,
    taskName: task.name,
    taskType: source?.taskType || '개발',
    assigneeDisplay: auth.user?.name || '김현대',
    planStart: source?.planStart ?? start,
    planEnd: source?.planEnd ?? end,
    execStart: source?.execStart || null,
    execEnd: source?.execEnd || null,
    planProgress: source?.planProgress ?? source?.progress ?? 0,
    execProgress: source?.progress ?? 0,
    holdStart: source?.holdStart || null,
    holdEnd: source?.holdEnd || null,
    restartDate: source?.expectedResume || null,
  }
  showScheduleModal.value = true
}

function onTaskClick(bar) {
  if (bar.displayStatus === 'done') return
  openScheduleModal(bar)
}

function onScheduleRegister(u) {
  openScheduleModal(u)
}

function endLabelOf(end) {
  const [, m, d] = end.split('-').map(Number)
  return `~ ${m}/${d}`
}

function formatOpenDate(iso) {
  return iso.includes('-') ? iso.replaceAll('-', '/') : iso
}

/** 계획일 저장 결과를 원본 할 일에 즉시 반영 */
function applyScheduleUpdate(wbsId, start, end) {
  if (!wbsId || !end) return
  const existing = sourceTasks.value.find((t) => t.wbsId === wbsId || t.id === wbsId)
  if (existing) {
    existing.planStart = start || existing.planStart
    existing.planEnd = end
    emit('saved', { wbsId, planStart: start, planEnd: end })
  }
}

function onScheduleSave(payload) {
  applyScheduleUpdate(scheduleTarget.value?.wbsId, payload.planStart, payload.planEnd)
  scheduleTarget.value = null
}

function onOpenMultiChangeFromSchedule(task) {
  if (!task) return
  bulkTargets.value = [task]
  showBulkScheduleModal.value = true
  scheduleTarget.value = null
}

function onBulkScheduleRequest(payload) {
  const targetTasks = payload.tasks || []
  if (payload.type === '계획일 변경') {
    targetTasks.forEach((t) => applyScheduleUpdate(t.wbsId, t.newPlanStart, t.newPlanEnd))
  } else if (payload.type === '실행 홀딩') {
    targetTasks.forEach((t) => {
      const found = sourceTasks.value.find((x) => x.wbsId === t.wbsId || x.id === t.wbsId)
      if (found) found.holdStart = found.holdStart || '2026-03-20'
    })
  }
  bulkTargets.value = []
}

function blockStyle(task) {
  if (task.displayStatus === 'done' || task.displayStatus === 'paused') return {}
  const c = colorOf(task.color)
  return { background: c.bg, borderLeftColor: c.rail }
}

/** 호버 시 좌측 레일색 기준 그림자. done/paused는 레일색이 없어 회색 그림자로 대체한다. */
function hoverShadow(task) {
  if (hoveredTaskId.value !== task.id) return undefined
  const rail = task.displayStatus === 'done' || task.displayStatus === 'paused'
    ? '100, 116, 139'
    : hexToRgb(colorOf(task.color).rail)
  return `0 4px 12px rgba(${rail}, .32)`
}

function hexToRgb(hex) {
  const n = parseInt(hex.slice(1), 16)
  return `${(n >> 16) & 255}, ${(n >> 8) & 255}, ${n & 255}`
}

function unschedColor(u) {
  return colorOf(projectColorIndexes.value.get(u.project) ?? 0).rail
}

function statusLabel(task) {
  if (task.displayStatus === 'delayed') return '지연'
  if (task.displayStatus === 'paused') return '일시중단'
  return ''
}
</script>

<template>
  <div class="cal-view">
    <div class="cal-view__body">
      <div class="cal">
        <div class="cal__bar">
          <button type="button" class="cal__nav" title="이전 달" @click="prevMonth">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M15 18l-6-6 6-6" /></svg>
          </button>
          <span class="cal__label">{{ calendarLabel }}</span>
          <button type="button" class="cal__nav" title="다음 달" @click="nextMonth">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M9 18l6-6-6-6" /></svg>
          </button>
          <button type="button" class="cal__today" @click="goToday">오늘</button>
        </div>

        <div class="cal__grid cal__head">
          <div v-for="(w, i) in WEEKDAYS" :key="w" class="cal__wd" :class="{ sun: i === 0, sat: i === 6 }">{{ w }}</div>
        </div>

        <div v-for="(week, wi) in calendarWeeks" :key="wi" class="cal-week">
          <div v-for="cell in week.cells" :key="cell.iso" class="cal__cell" :class="{ out: !cell.inMonth, today: cell.isToday }">
            <div class="cal__day-wrap">
              <span class="cal__day">{{ cell.day }}</span>
              <span v-if="cell.isToday" class="cal__today-tag">오늘</span>
            </div>
          </div>

          <div class="cal-week__lanes" :style="{ gridTemplateRows: `repeat(${week.maxLanes}, 34px)` }">
            <div
              v-for="bar in week.bars"
              :key="`${bar.id}-w${wi}`"
              class="tblock"
              :class="{
                done: bar.displayStatus === 'done',
                delayed: bar.displayStatus === 'delayed',
                paused: bar.displayStatus === 'paused',
                'continues-prev': bar.continuesPrev,
                'continues-next': bar.continuesNext,
                'is-hover': hoveredTaskId === bar.id,
              }"
              :style="{
                gridColumn: `${bar.startCol + 1} / span ${bar.span}`,
                gridRow: bar.lane + 1,
                ...blockStyle(bar),
                boxShadow: hoverShadow(bar),
              }"
              @click="onTaskClick(bar)"
              @mouseenter="hoveredTaskId = bar.id"
              @mouseleave="hoveredTaskId = null"
            >
              <span v-if="statusLabel(bar)" class="tblock__badge" :class="bar.displayStatus">{{ statusLabel(bar) }}</span>
              <span class="tblock__lines">
                <span class="tblock__name">{{ bar.name }} <span class="tblock__end">{{ bar.endLabel }}</span></span>
                <span class="tblock__project">
                  {{ bar.project }}<template v-if="bar.projectOpenDate"> ({{ formatOpenDate(bar.projectOpenDate) }})</template>
                </span>
              </span>
            </div>
          </div>
        </div>
      </div>

      <aside class="unsched">
        <div class="unsched__head">일정 미등록 업무 <span class="cnt">({{ unscheduled.length }})</span></div>
        <div v-if="unscheduled.length" class="unsched__list">
          <div v-for="u in unscheduled" :key="u.id" class="ucard">
            <div class="ucard__proj">
              <span class="ucard__dot" :style="{ background: unschedColor(u) }"></span>
              <span :title="u.project">{{ u.project }}</span>
            </div>
            <div class="ucard__name">{{ u.name }}</div>
            <button class="btn-ghost" @click="onScheduleRegister(u)">일정 등록</button>
          </div>
        </div>
        <div v-else class="unsched__empty">일정 미등록 업무가 없습니다.</div>
      </aside>
    </div>
    <p class="cal-guide">{{ INBOX_GUIDE }}</p>

    <WbsScheduleModal
      :tasks="scheduleTarget ? [scheduleTarget] : []"
      @close="scheduleTarget = null"
      @save="onScheduleSave"
      @open-multi-change="onOpenMultiChangeFromSchedule"
    />
    <WbsBulkScheduleModal
      v-model="showBulkScheduleModal"
      :tasks="bulkTargets"
      @request="onBulkScheduleRequest"
    />
  </div>
</template>
<style scoped>
/* font-size는 --font-size-* 토큰 또는 calc(Npx + var(--font-size-offset))을 쓴다.
   rem은 --font-size-offset에 반응하지 않아 내설정>글자 크기가 먹지 않는다(layout.css:3-11 선례). */

.cal-view { display: flex; flex-direction: column; }
.cal-view__body { display: grid; grid-template-columns: 1fr 320px; gap: 18px; align-items: start; }
.cal-guide { margin: 12px 2px 0; font-size: calc(11.5px + var(--font-size-offset)); color: var(--lnb-muted); line-height: 1.55; }

.cal { background: var(--lnb-side); border: 1px solid var(--lnb-line); border-radius: var(--radius-lg); box-shadow: var(--shadow-sm); overflow: hidden; }
.cal__bar { display: flex; align-items: center; gap: 8px; padding: 16px 20px; border-bottom: 1px solid var(--lnb-line); }
.cal__label { min-width: 100px; font-size: calc(18px + var(--font-size-offset)); font-weight: 800; letter-spacing: -0.02em; color: var(--lnb-txt); }
.cal__nav {
  width: 30px; height: 30px; display: flex; align-items: center; justify-content: center;
  border: 1px solid var(--lnb-line); border-radius: 9px;
  background: var(--lnb-side); color: var(--lnb-muted); cursor: pointer;
}
.cal__nav:hover { background: var(--lnb-hover); }
.cal__nav svg { width: 14px; height: 14px; }
.cal__today {
  margin-left: 4px; height: 28px; padding: 0 12px;
  border: 1px solid var(--lnb-line); border-radius: 8px;
  background: var(--lnb-side); font-size: calc(13px + var(--font-size-offset)); font-weight: 600;
  font-family: inherit; color: var(--lnb-muted); cursor: pointer;
}
.cal__today:hover { background: var(--lnb-hover); }

.cal__grid { display: grid; grid-template-columns: repeat(7, 1fr); }
.cal__head { border-bottom: 1px solid var(--lnb-line); background: var(--lnb-bg); }
.cal__wd { text-align: center; padding: 8px 0; font-size: calc(12.5px + var(--font-size-offset)); font-weight: 700; color: var(--lnb-muted); }
.cal__wd.sun { color: var(--red); }
.cal__wd.sat { color: var(--blue); }

/* 주 행 — min-height 112px, 업무 lane 수만큼 자동으로 늘어난다 */
.cal-week { position: relative; display: grid; grid-template-columns: repeat(7, 1fr); min-height: 112px; border-bottom: 1px dashed var(--lnb-line); }
.cal-week:last-child { border-bottom: none; }
.cal__cell { padding: 6px 6px 2px; border-right: 1px solid var(--lnb-line); }
.cal__cell:nth-child(7n) { border-right: none; }
.cal__cell.out { background: var(--lnb-bg); }
.cal__cell.out .cal__day { color: var(--lnb-muted); }
.cal__cell.today { background: var(--lnb-hover); }
.cal__day-wrap { display: flex; align-items: center; gap: 6px; }
.cal__day { display: inline-flex; align-items: center; justify-content: center; font-size: calc(12.5px + var(--font-size-offset)); font-weight: 600; color: var(--lnb-txt); }
/* 주말은 700 + 요일 색 */
.cal-week .cal__cell:first-child .cal__day { color: var(--red); font-weight: 700; }
.cal-week .cal__cell:last-child .cal__day { color: var(--blue); font-weight: 700; }
/* 오늘: 원형 배지 없이 teal 색+굵게만 (h-pms 기준, 2026-08-27) */
.cal__cell.today .cal__day { color: var(--teal); font-weight: 700; }
.cal__today-tag { font-size: calc(11px + var(--font-size-offset)); font-weight: 700; color: var(--lnb-txt); }

/* 업무 lane — 주 단위 가로 span 바. 날짜 셀 아래로 자연스럽게 이어 붙여
   행 높이가 lane 수만큼 늘어나게 한다(고정 높이 + 접기 금지). */
.cal-week__lanes {
  grid-column: 1 / -1;
  display: grid; grid-template-columns: repeat(7, 1fr);
  gap: 5px 0; padding-bottom: 6px;
}
.tblock {
  display: flex; align-items: center; gap: 6px; overflow: hidden; cursor: pointer;
  min-height: 30px; padding: 7px 11px; margin: 0 7px; border-radius: 8px;
  border: 1px solid transparent; border-left: 4px solid var(--teal); color: var(--lnb-txt);
  font-size: calc(10.5px + var(--font-size-offset)); line-height: 1.3;
  background-image: linear-gradient(100deg, rgba(255, 255, 255, 0) 32%, rgba(255, 255, 255, 0.55) 50%, rgba(255, 255, 255, 0) 68%);
  background-size: 220% 100%;
  background-repeat: no-repeat;
  background-position: -60% 0;
  transition: box-shadow 0.18s ease, transform 0.18s ease;
}
/* 호버 시 좌→우 하이라이트 스윕 반복 + 살짝 부상 */
.tblock.is-hover { animation: mwCalBarSweep 1.15s ease-in-out infinite; transform: translateY(-1px); }
@keyframes mwCalBarSweep {
  from { background-position: -60% 0; }
  to { background-position: 160% 0; }
}
/* 주 경계를 넘는 바는 해당 끝의 라운드를 죽이고 그 끝의 여백을 지워 연속으로 읽히게 한다 */
.tblock.continues-prev { border-top-left-radius: 0; border-bottom-left-radius: 0; margin-left: 0; }
.tblock.continues-next { border-top-right-radius: 0; border-bottom-right-radius: 0; margin-right: 0; }
.tblock__lines { display: flex; flex-direction: column; min-width: 0; overflow: hidden; }
.tblock__name, .tblock__project { white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.tblock__name { font-size: calc(13px + var(--font-size-offset)); font-weight: 700; color: var(--lnb-txt); }
.tblock__end { font-weight: 600; font-size: calc(11.5px + var(--font-size-offset)); color: var(--lnb-muted); }
.tblock__project { font-weight: 400; font-size: calc(11.5px + var(--font-size-offset)); color: var(--lnb-muted); }
/* 상태 배지 — 지연·일시중단 동일 형태: 흰 글씨, radius 4px */
.tblock__badge {
  flex-shrink: 0; font-size: calc(10.5px + var(--font-size-offset)); font-weight: 700; color: #fff;
  padding: 2px 6px; border-radius: 4px;
}
.tblock__badge.delayed { background: #dc2626; }
.tblock__badge.paused { background: #64748b; }
/* blockStyle()이 인라인으로 배경/테두리를 넣으므로 !important가 필요하다 */
.tblock.done { background: var(--lnb-bg) !important; color: var(--lnb-muted); border-left-color: var(--lnb-line) !important; cursor: default; opacity: 0.8; }
.tblock.delayed { border-color: #eda9a9 !important; background: #fce0e0 !important; border-left-color: #dc2626 !important; }
.tblock.delayed .tblock__name { color: #991b1b; }
.tblock.paused { background: #e6eaef !important; border-left-color: #64748b !important; opacity: 0.9; }
.tblock.paused .tblock__name { color: #334155; }

@media (prefers-reduced-motion: reduce) {
  .tblock.is-hover { animation: none; }
}

/* 일정 미등록 */
.unsched {
  position: sticky; top: 0; padding: 18px;
  background: var(--lnb-side); border: 1px solid var(--lnb-line); border-radius: var(--radius-lg); box-shadow: var(--shadow-sm);
}
.unsched__head { margin-bottom: 12px; font-size: calc(15.5px + var(--font-size-offset)); font-weight: 700; }
.unsched__head .cnt { color: var(--lnb-muted); font-weight: 600; }
.unsched__list { display: flex; flex-direction: column; gap: 14px; }
.unsched__empty { padding: 8px 0; font-size: var(--font-size-sm); color: var(--lnb-muted); }
.ucard { border: 1px solid var(--lnb-line); border-radius: 12px; padding: 14px; }
.ucard__proj {
  margin-bottom: 4px; display: flex; align-items: center; gap: 6px;
  font-size: calc(11.5px + var(--font-size-offset)); color: var(--lnb-muted);
  overflow: hidden;
}
.ucard__proj span:last-child { overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.ucard__dot { width: 7px; height: 7px; border-radius: 50%; flex-shrink: 0; }
.ucard__name { margin-bottom: 10px; font-size: calc(14.5px + var(--font-size-offset)); font-weight: 700; }
.btn-ghost {
  width: 100%; height: 30px; padding: 0 10px; border-radius: var(--radius-sm);
  font-size: calc(12.5px + var(--font-size-offset)); font-weight: 700; font-family: inherit;
  border: 1px solid var(--lnb-line); background: var(--lnb-side);
  color: var(--lnb-txt); cursor: pointer; transition: background var(--transition-fast), color var(--transition-fast), border-color var(--transition-fast);
}
.btn-ghost:hover { background: var(--lnb-txt); border-color: var(--lnb-txt); color: #fff; }
</style>
