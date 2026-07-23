<script setup>
/**
 * 내업무 캘린더 뷰 — PAG-M-MY-02 / PAG-M-MY-03
 * 멀티데이 업무: 주 단위 가로 span 바 (일별 중복 표기 X)
 */
import { ref, computed } from 'vue'
import { calendarTasks, unscheduledTasks, projectColors } from '@/data/inboxCalendar'
import { myProjects } from '@/data/headerPopups'
import { INBOX_GUIDE } from '@/data/inbox'
import { useAuthStore } from '@/stores/auth'
import { useProjectStore } from '@/stores/project'
import WbsScheduleModal from '@/components/wbs/WbsScheduleModal.vue'
import WbsBulkScheduleModal from '@/components/wbs/WbsBulkScheduleModal.vue'

const WEEKDAYS = ['일', '월', '화', '수', '목', '금', '토']
const VISIBLE_LANES = 2

const auth = useAuthStore()
const projectStore = useProjectStore()

const localTasks = ref(JSON.parse(JSON.stringify(calendarTasks)))
const localUnsched = ref(JSON.parse(JSON.stringify(unscheduledTasks)))

const isEmptyUser = computed(() => auth.user?.id === '2024099')
const tasks = computed(() => (isEmptyUser.value ? [] : localTasks.value))
const unsched = computed(() => (isEmptyUser.value ? [] : localUnsched.value))

const today = new Date(2026, 2, 20)
const cursor = ref(new Date(2026, 2, 1))
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

  const segments = tasks.value
    .filter((t) => t.end >= weekStart && t.start <= weekEnd)
    .map((t) => {
      const segStart = t.start > weekStart ? t.start : weekStart
      const segEnd = t.end < weekEnd ? t.end : weekEnd
      const startCol = weekCells.findIndex((c) => c.iso === segStart)
      const endCol = weekCells.findIndex((c) => c.iso === segEnd)
      const display = resolveTaskDisplay(t)
      return {
        ...display,
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

function resolveTaskDisplay(task) {
  const endDate = parseISO(task.end)
  const isPast = endDate < stripTime(today)
  let displayStatus = task.status
  if (task.status === 'active' && isPast) displayStatus = 'delayed'
  if (task.status === 'done') displayStatus = 'done'
  return { ...task, displayStatus }
}

function parseISO(s) {
  const [y, m, d] = s.split('-').map(Number)
  return new Date(y, m - 1, d)
}

function stripTime(d) {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate())
}

function colorOf(idx) {
  return projectColors[idx % projectColors.length]
}

function prevMonth() {
  cursor.value = new Date(cursor.value.getFullYear(), cursor.value.getMonth() - 1, 1)
}

function nextMonth() {
  cursor.value = new Date(cursor.value.getFullYear(), cursor.value.getMonth() + 1, 1)
}

function goToday() {
  cursor.value = new Date(today.getFullYear(), today.getMonth(), 1)
}

function resolveProject(task) {
  const raw = (task.project || '').replace(/\s*\([^)]*\)\s*$/, '').trim()
  const found = myProjects.find(
    (p) =>
      p.name === raw ||
      p.name.includes(raw) ||
      raw.includes(p.name.slice(0, Math.min(10, p.name.length))),
  )
  return found || { id: 'p1', name: raw || '프로젝트', stage: '처리중' }
}

function openScheduleModal(task) {
  const project = resolveProject(task)
  projectStore.setCurrentProject({
    id: project.id,
    name: project.name,
    stage: project.stage,
  })
  scheduleTarget.value = {
    wbsId: task.id || 'WBS-CAL',
    requirementName: task.name,
    taskName: task.name,
    taskType: '개발',
    assigneeDisplay: auth.user?.name || '김현대',
    planStart: task.start || null,
    planEnd: task.end || null,
    execStart: null,
    execEnd: null,
  }
  showScheduleModal.value = true
}

function onTaskClick(task) {
  if (task.displayStatus === 'done') return
  openScheduleModal(task)
}

function onScheduleRegister(task) {
  openScheduleModal({
    ...task,
    name: task.name,
    start: null,
    end: null,
    project: task.project,
  })
}

function endLabelOf(end) {
  const [, m, d] = end.split('-').map(Number)
  return `~ ${m}/${d}`
}

/** 계획일 저장 결과를 캘린더/미등록 목록에 즉시 반영 */
function applyScheduleUpdate(wbsId, start, end) {
  if (!wbsId || !start || !end) return
  const existing = localTasks.value.find((t) => t.id === wbsId)
  if (existing) {
    existing.start = start
    existing.end = end
    existing.endLabel = endLabelOf(end)
    return
  }
  const idx = localUnsched.value.findIndex((u) => u.id === wbsId)
  if (idx === -1) return
  const u = localUnsched.value[idx]
  localUnsched.value.splice(idx, 1)
  localTasks.value.push({
    id: u.id,
    name: u.name,
    endLabel: endLabelOf(end),
    project: u.project,
    start,
    end,
    color: localTasks.value.length % projectColors.length,
    status: 'active',
  })
}

function onScheduleSave(payload) {
  applyScheduleUpdate(scheduleTarget.value?.wbsId, payload.planStart, payload.planEnd)
}

function onOpenMultiChangeFromSchedule(task) {
  if (!task) return
  bulkTargets.value = [task]
  showBulkScheduleModal.value = true
}

function onBulkScheduleRequest(payload) {
  const targetTasks = payload.tasks || []
  if (payload.type === '계획일 변경') {
    targetTasks.forEach((t) => applyScheduleUpdate(t.wbsId, t.newPlanStart, t.newPlanEnd))
  } else if (payload.type === '실행 홀딩') {
    targetTasks.forEach((t) => {
      const found = localTasks.value.find((x) => x.id === t.wbsId)
      if (found) found.status = 'paused'
    })
  }
  bulkTargets.value = []
}

function blockStyle(task) {
  if (task.displayStatus === 'done' || task.displayStatus === 'paused') return {}
  const c = colorOf(task.color)
  return {
    borderLeftColor: c,
    background: `${c}18`,
  }
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
          <button class="cal__nav" title="이전 달" @click="prevMonth">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M15 18l-6-6 6-6" />
            </svg>
          </button>
          <span class="cal__label">{{ calendarLabel }}</span>
          <button class="cal__nav" title="다음 달" @click="nextMonth">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M9 18l6-6-6-6" />
            </svg>
          </button>
          <button class="cal__today" @click="goToday">오늘</button>
        </div>

        <div class="cal__grid cal__head">
          <div
            v-for="(w, i) in WEEKDAYS"
            :key="w"
            class="cal__wd"
            :class="{ sun: i === 0, sat: i === 6 }"
          >{{ w }}</div>
        </div>

        <!-- 주 단위: 멀티데이 업무 span 바 -->
        <div
          v-for="(week, wi) in calendarWeeks"
          :key="wi"
          class="cal-week"
        >
          <div
            v-for="cell in week.cells"
            :key="cell.iso"
            class="cal__cell cal__cell--head"
            :class="{ out: !cell.inMonth, today: cell.isToday }"
          >
            <div class="cal__day">{{ cell.day }}</div>
          </div>

          <div
            class="cal-week__lanes"
            :style="{ gridTemplateRows: `repeat(${week.maxLanes}, 34px)` }"
          >
            <div
              v-for="bar in week.bars"
              :key="`${bar.id}-w${wi}`"
              class="tblock tblock--span"
              :class="{
                done: bar.displayStatus === 'done',
                delayed: bar.displayStatus === 'delayed',
                paused: bar.displayStatus === 'paused',
                'continues-prev': bar.continuesPrev,
                'continues-next': bar.continuesNext,
              }"
              :style="{
                gridColumn: `${bar.startCol + 1} / span ${bar.span}`,
                gridRow: bar.lane + 1,
                ...blockStyle(bar),
              }"
              @click="onTaskClick(bar)"
            >
              <span v-if="statusLabel(bar)" class="tblock__badge">{{ statusLabel(bar) }}</span>
              <span class="tblock__lines">
                <span class="tblock__name">{{ bar.name }} <span class="tblock__end">{{ bar.endLabel }}</span></span>
                <span class="tblock__project">{{ bar.project }}</span>
              </span>
            </div>
          </div>
        </div>
      </div>

      <aside class="unsched">
        <div class="unsched__head">
          일정 미등록 업무 <span class="cnt">({{ unsched.length }})</span>
        </div>
        <div v-if="unsched.length" class="unsched__list">
          <div v-for="u in unsched" :key="u.id" class="ucard">
            <div class="ucard__proj" :title="u.project">{{ u.project }}</div>
            <div class="ucard__name">{{ u.name }}</div>
            <button class="btn-ghost" @click="onScheduleRegister(u)">일정 등록</button>
          </div>
        </div>
        <div v-else class="unsched__empty">일정 미등록 업무가 없습니다.</div>
      </aside>
    </div>
    <p class="cal-guide">{{ INBOX_GUIDE }}</p>
    <WbsScheduleModal
      v-model="showScheduleModal"
      :task="scheduleTarget"
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
.cal-view {
  display: flex;
  flex-direction: column;
}

.cal-guide {
  margin: 12px 2px 0;
  font-size: 11.5px;
  color: var(--lnb-muted);
  line-height: 1.55;
}

.cal-view__body {
  display: grid;
  grid-template-columns: 1fr 272px;
  gap: 14px;
  align-items: start;
}

.cal {
  background: var(--color-surface);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
  overflow: hidden;
}

.cal__bar {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 12px 14px;
  border-bottom: 1px solid var(--color-border-2);
}

.cal__label {
  font-size: 14px;
  font-weight: 600;
  color: var(--color-text);
  min-width: 100px;
}

.cal__nav {
  width: 28px;
  height: 28px;
  border: 1px solid var(--color-border);
  border-radius: var(--radius-sm);
  background: var(--color-surface);
  color: var(--color-text-2);
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
}

.cal__nav:hover { background: var(--color-field); }
.cal__nav svg { width: 14px; height: 14px; }

.cal__today {
  margin-left: 4px;
  height: 28px;
  padding: 0 12px;
  border: 1px solid var(--color-border);
  border-radius: var(--radius-sm);
  background: var(--color-surface);
  font-size: 12px;
  color: var(--color-text-2);
  cursor: pointer;
}

.cal__today:hover { background: var(--color-field); }

.cal__grid {
  display: grid;
  grid-template-columns: repeat(7, 1fr);
}

.cal__head {
  border-bottom: 1px solid var(--color-border);
  background: var(--color-bg-subtle);
}

.cal__wd {
  text-align: center;
  font-size: 11px;
  color: var(--color-text-muted);
  padding: 8px 0;
  font-weight: 600;
}

.cal__wd.sun { color: var(--red); }
.cal__wd.sat { color: var(--blue); }

/* 주 행 */
.cal-week {
  display: grid;
  grid-template-columns: repeat(7, 1fr);
  border-bottom: 1px solid var(--color-border-2);
}

.cal-week:last-child {
  border-bottom: none;
}

.cal__cell--head {
  min-height: auto;
  padding: 4px 5px 2px;
  border-right: 1px solid var(--color-border-2);
  border-bottom: none;
}

.cal__cell--head:nth-child(7n) {
  border-right: none;
}

.cal__cell.out { background: var(--color-bg-subtle); }
.cal__cell.out .cal__day { color: var(--color-text-muted); opacity: 0.5; }
.cal__cell.today { background: var(--lnb-hover); }

.cal__day {
  font-size: 12px;
  color: var(--color-text-2);
  padding: 2px 4px;
  font-weight: 500;
}

.cal__cell.today .cal__day {
  color: var(--teal);
  font-weight: 700;
}

/* 업무 lane — span 바 */
.cal-week__lanes {
  grid-column: 1 / -1;
  display: grid;
  grid-template-columns: repeat(7, 1fr);
  gap: 3px 2px;
  padding: 2px 4px 0;
  min-height: 52px;
}

.tblock--span {
  font-size: 10.5px;
  line-height: 1.3;
  padding: 3px 6px;
  border-radius: 4px;
  border-left: 3px solid var(--teal);
  color: var(--color-text-2);
  cursor: pointer;
  overflow: hidden;
  min-height: 32px;
  display: flex;
  align-items: center;
  gap: 4px;
}

.tblock__lines {
  display: flex;
  flex-direction: column;
  min-width: 0;
  overflow: hidden;
}

.tblock__name,
.tblock__project {
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.tblock__project {
  font-weight: 400;
  font-size: 9.5px;
  color: var(--color-text-muted);
}

.tblock--span.continues-prev {
  border-top-left-radius: 0;
  border-bottom-left-radius: 0;
  margin-left: -2px;
  padding-left: 4px;
}

.tblock--span.continues-next {
  border-top-right-radius: 0;
  border-bottom-right-radius: 0;
  margin-right: -2px;
}

.tblock__badge {
  font-size: 9px;
  font-weight: 700;
  flex-shrink: 0;
}

.tblock.delayed .tblock__badge { color: var(--color-danger); }
.tblock.paused .tblock__badge { color: var(--color-text-muted); }

.tblock__name {
  font-weight: 600;
  color: var(--color-text);
}

.tblock__end {
  font-weight: 400;
  color: var(--color-text-muted);
}

.tblock.done {
  background: var(--color-field) !important;
  color: var(--color-text-muted);
  border-left-color: var(--lnb-line);
  cursor: default;
  opacity: 0.75;
}

.tblock.delayed {
  border: 1px solid var(--color-danger);
  border-left-width: 3px;
}

.tblock.paused {
  background: var(--color-field) !important;
  border-left-color: var(--lnb-line);
  opacity: 0.85;
}

/* 일정 미등록 */
.unsched {
  background: var(--color-surface);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
  padding: 14px;
  position: sticky;
  top: 0;
}

.unsched__head {
  font-size: 13px;
  font-weight: 600;
  margin-bottom: 12px;
}

.unsched__head .cnt {
  color: var(--teal);
  font-weight: 700;
}

.unsched__list { display: flex; flex-direction: column; gap: 10px; }
.unsched__empty { font-size: 12px; color: var(--color-text-muted); padding: 8px 0; }

.ucard {
  border: 1px solid var(--color-border);
  border-radius: var(--radius-sm);
  padding: 10px 12px;
}

.ucard__proj {
  font-size: 11px;
  color: var(--color-text-muted);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  margin-bottom: 4px;
}

.ucard__name {
  font-size: 13px;
  font-weight: 600;
  margin-bottom: 10px;
}

.btn-ghost {
  height: 28px;
  padding: 0 10px;
  border-radius: var(--radius-sm);
  font-size: 12px;
  font-weight: 500;
  border: 1px solid var(--color-border);
  background: var(--color-surface);
  color: var(--color-text-2);
  cursor: pointer;
  font-family: inherit;
}

.btn-ghost:hover {
  border-color: var(--teal);
  color: var(--teal);
}

</style>
