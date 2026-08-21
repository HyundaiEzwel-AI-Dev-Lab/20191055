<script setup>
/**
 * 내업무 캘린더 뷰 — PAG-M-MY-02 / PAG-M-MY-03
 * 멀티데이 업무: 주 단위 가로 span 바 (일별 중복 표기 X)
 */
import { ref, computed, watch } from 'vue'
import { projectColors } from '@/entities/inbox/mock/inboxCalendar'
import { getMyProjects } from '@/app/layouts/headerPopups'
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

const unsched = computed(() =>
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

const myProjects = computed(() => getMyProjects(auth.user?.id))

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

  const segments = calendarDerived.value
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
  return { ...task, displayStatus: task.status }
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
  const found = myProjects.value.find(
    (p) =>
      p.name === raw ||
      p.name.includes(raw) ||
      raw.includes(p.name.slice(0, Math.min(10, p.name.length))),
  )
  return found || { id: 'p1', name: raw || '프로젝트', stage: '처리중' }
}

function openScheduleModal(task) {
  const project = task.projectId
    ? { id: task.projectId, name: task.project, stage: '처리중' }
    : resolveProject(task)
  projectStore.setCurrentProject({
    id: project.id,
    name: project.name,
    stage: project.stage,
  })
  scheduleTarget.value = {
    wbsId: task.wbsId || task.id || 'WBS-CAL',
    requirementName: task.name,
    taskName: task.name,
    taskType: '개발',
    assigneeDisplay: auth.user?.name || '김현대',
    planStart: task.planStart || task.start || null,
    planEnd: task.planEnd || task.end || null,
    execStart: task.execStart || null,
    execEnd: task.execEnd || null,
    holdStart: task.holdStart || null,
    holdEnd: task.holdEnd || null,
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
    return
  }
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
      const found = sourceTasks.value.find((x) => x.wbsId === t.wbsId || x.id === t.wbsId)
      if (found) found.holdStart = found.holdStart || '2026-03-20'
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
            <div class="cal__day">{{ cell.day }}</div>
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
              }"
              :style="{ gridColumn: `${bar.startCol + 1} / span ${bar.span}`, gridRow: bar.lane + 1, ...blockStyle(bar) }"
              @click="onTaskClick(bar)"
            >
              <span v-if="statusLabel(bar)" class="tblock__badge">{{ bar }}</span>
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
      :tasks="scheduleTarget ? [scheduleTarget] : []"
      @close="scheduleTarget = null"
      @save="onScheduleSave"
      @open-multi-change="onOpenMultiChangeFromSchedule"
    />
    <WbsBulkScheduleModal
      v-if="showBulkModal"
      :tasks="bulkTargets"
      :members="bulkMembers"
      @close="closeBulkModal"
      @request-plan-change="onRequestPlanChange"
      @request-hold="onRequestHold"
    />
  </div>
</template>
<style scoped>
/* font-size는 --font-size-* 토큰 또는 calc(Npx + var(--font-size-offset))을 쓴다.
   rem은 --font-size-offset에 반응하지 않아 내설정>글자 크기가 먹지 않는다(layout.css:3-11 선례). */

.cal-view { display: flex; flex-direction: column; }
.cal-view__body { display: grid; grid-template-columns: 1fr 272px; gap: 14px; align-items: start; }
.cal-guide { margin: 12px 2px 0; font-size: calc(11.5px + var(--font-size-offset)); color: var(--lnb-muted); line-height: 1.55; }

.cal { background: var(--color-surface); border: 1px solid var(--color-border); border-radius: var(--radius-md); overflow: hidden; }
.cal__bar { display: flex; align-items: center; gap: 8px; padding: 12px 14px; border-bottom: 1px solid var(--color-border-2); }
.cal__label { min-width: 100px; font-size: var(--font-size-lg); font-weight: 600; color: var(--color-text); }
.cal__nav {
  width: 28px; height: 28px; display: flex; align-items: center; justify-content: center;
  border: 1px solid var(--color-border); border-radius: var(--radius-sm);
  background: var(--color-surface); color: var(--color-text-2); cursor: pointer;
}
.cal__nav:hover { background: var(--color-field); }
.cal__nav svg { width: 14px; height: 14px; }
.cal__today {
  margin-left: 4px; height: 28px; padding: 0 12px;
  border: 1px solid var(--color-border); border-radius: var(--radius-sm);
  background: var(--color-surface); font-size: var(--font-size-sm);
  font-family: inherit; color: var(--color-text-2); cursor: pointer;
}
.cal__today:hover { background: var(--color-field); }

.cal__grid { display: grid; grid-template-columns: repeat(7, 1fr); }
.cal__head { border-bottom: 1px solid var(--color-border); background: var(--color-bg-subtle); }
.cal__wd { text-align: center; padding: 8px 0; font-size: var(--font-size-xs); font-weight: 600; color: var(--color-text-muted); }
.cal__wd.sun { color: var(--red); }
.cal__wd.sat { color: var(--blue); }

/* 주 행 */
.cal-week { display: grid; grid-template-columns: repeat(7, 1fr); border-bottom: 1px solid var(--color-border-2); }
.cal-week:last-child { border-bottom: none; }
.cal__cell { padding: 4px 5px 2px; border-right: 1px solid var(--color-border-2); }
.cal__cell:nth-child(7n) { border-right: none; }
.cal__cell.out { background: var(--color-bg-subtle); }
.cal__cell.out .cal__day { color: var(--color-text-muted); opacity: 0.5; }
.cal__cell.today { background: var(--lnb-hover); }
.cal__day { padding: 2px 4px; font-size: var(--font-size-sm); font-weight: 500; color: var(--color-text-2); }
.cal__cell.today .cal__day { color: var(--teal); font-weight: 700; }

/* 업무 lane — 주 단위 가로 span 바 */
.cal-week__lanes {
  grid-column: 1 / -1; display: grid; grid-template-columns: repeat(7, 1fr);
  gap: 3px 2px; padding: 2px 4px 0; min-height: 52px;
}
.tblock {
  display: flex; align-items: center; gap: 4px; overflow: hidden; cursor: pointer;
  min-height: 32px; padding: 3px 6px; border-radius: 4px;
  border-left: 3px solid var(--teal); color: var(--color-text-2);
  font-size: calc(10.5px + var(--font-size-offset)); line-height: 1.3;
}
/* 주 경계를 넘는 바는 해당 끝의 라운드를 죽이고 셀 경계를 넘겨서 연속으로 읽히게 한다 */
.tblock.continues-prev { border-top-left-radius: 0; border-bottom-left-radius: 0; margin-left: -2px; padding-left: 4px; }
.tblock.continues-next { border-top-right-radius: 0; border-bottom-right-radius: 0; margin-right: -2px; }
.tblock__lines { display: flex; flex-direction: column; min-width: 0; overflow: hidden; }
.tblock__name, .tblock__project { white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.tblock__name { font-weight: 600; color: var(--color-text); }
.tblock__end { font-weight: 400; color: var(--color-text-muted); }
.tblock__project { font-weight: 400; font-size: calc(9.5px + var(--font-size-offset)); color: var(--color-text-muted); }
.tblock__badge { flex-shrink: 0; font-size: calc(9px + var(--font-size-offset)); font-weight: 700; }
.tblock.delayed .tblock__badge { color: var(--color-danger); }
.tblock.paused .tblock__badge { color: var(--color-text-muted); }
/* blockStyle()이 인라인으로 배경을 넣으므로 !important가 필요하다 */
.tblock.done { background: var(--color-field) !important; color: var(--color-text-muted); border-left-color: var(--lnb-line); cursor: default; opacity: 0.75; }
.tblock.delayed { border: 1px solid var(--color-danger); border-left-width: 3px; }
.tblock.paused { background: var(--color-field) !important; border-left-color: var(--lnb-line); opacity: 0.85; }

/* 일정 미등록 */
.unsched {
  position: sticky; top: 0; padding: 14px;
  background: var(--color-surface); border: 1px solid var(--color-border); border-radius: var(--radius-md);
}
.unsched__head { margin-bottom: 12px; font-size: var(--font-size-md); font-weight: 600; }
.unsched__head .cnt { color: var(--teal); font-weight: 700; }
.unsched__list { display: flex; flex-direction: column; gap: 10px; }
.unsched__empty { padding: 8px 0; font-size: var(--font-size-sm); color: var(--color-text-muted); }
.ucard { border: 1px solid var(--color-border); border-radius: var(--radius-sm); padding: 10px 12px; }
.ucard__proj {
  margin-bottom: 4px; font-size: var(--font-size-xs); color: var(--color-text-muted);
  overflow: hidden; text-overflow: ellipsis; white-space: nowrap;
}
.ucard__name { margin-bottom: 10px; font-size: var(--font-size-md); font-weight: 600; }
.btn-ghost {
  height: 28px; padding: 0 10px; border-radius: var(--radius-sm);
  font-size: var(--font-size-sm); font-weight: 500; font-family: inherit;
  border: 1px solid var(--color-border); background: var(--color-surface);
  color: var(--color-text-2); cursor: pointer;
}
.btn-ghost:hover { border-color: var(--teal); color: var(--teal); }
</style>
