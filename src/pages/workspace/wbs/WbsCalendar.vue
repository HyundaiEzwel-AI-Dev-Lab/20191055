<script setup>
/**
 * WBS 캘린더형 — 내업무 InboxCalendar와 동일한 주 단위 span 바 형태
 * PAG-S-WBS-08
 */
import { computed, ref, watch } from 'vue'
import {
  getCalendarRange,
  getTaskTypeColor,
  calcDday,
} from '@/entities/wbs/mock/wbs'

const props = defineProps({
  tasks: { type: Array, default: () => [] },
  year: { type: Number, required: true },
  month: { type: Number, required: true },
})

const emit = defineEmits(['update:year', 'update:month'])

const WEEKDAYS = ['일', '월', '화', '수', '목', '금', '토']
const today = new Date(2026, 3, 15) // mock today aligned with WBS base

const cursor = ref(new Date(props.year, props.month - 1, 1))

watch(
  () => [props.year, props.month],
  ([y, m]) => {
    cursor.value = new Date(y, m - 1, 1)
  },
)

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
    const maxLanes = Math.max(2, ...bars.map((b) => b.lane + 1), 0)
    weeks.push({ cells, bars, maxLanes })
  }
  return weeks
})

/**
 * 같은 주·같은 업무유형이 2건 이상이면 `개발1`/`개발2` 접미사(h-pms WbsCalendar 이식).
 * 등장 순서 = 주 시작일부터 표시시작일, 동일하면 업무 id.
 */
function typeSuffixMapForWeek(weekEntries) {
  const sorted = [...weekEntries].sort(
    (a, b) => a.start.localeCompare(b.start) || String(a.task.id).localeCompare(String(b.task.id)),
  )
  const byType = new Map()
  for (const { task } of sorted) {
    const list = byType.get(task.taskType) || []
    list.push(task.id)
    byType.set(task.taskType, list)
  }
  const result = new Map()
  for (const ids of byType.values()) {
    if (ids.length < 2) continue
    ids.forEach((id, i) => result.set(id, String(i + 1)))
  }
  return result
}

/** 홀딩은 "[홀딩] " 접두, 완료·취소는 D-day를 붙이지 않는다(h-pms blockLabel 규칙). */
function blockLabel(task, suffix, holding, dday) {
  const type = task.taskType + (suffix || '')
  const name = task.taskName || task.requirementName || task.screenName
  const prefix = holding ? '[홀딩] ' : ''
  const base = `${prefix}[${type}] ${name} – ${task.assigneeDisplay}`
  return dday ? `${base} (${dday})` : base
}

function layoutWeekBars(weekCells) {
  const weekStart = weekCells[0].iso
  const weekEnd = weekCells[6].iso

  const weekEntries = props.tasks
    .map((t) => {
      const range = getCalendarRange(t)
      if (!range?.start) return null
      const start = range.start
      const end = range.end || range.start
      if (end < weekStart || start > weekEnd) return null
      return { task: t, start, end }
    })
    .filter(Boolean)

  const suffixes = typeSuffixMapForWeek(weekEntries)

  const segments = weekEntries
    .map(({ task: t, start, end }) => {
      const segStart = start > weekStart ? start : weekStart
      const segEnd = end < weekEnd ? end : weekEnd
      const startCol = weekCells.findIndex((c) => c.iso === segStart)
      const endCol = weekCells.findIndex((c) => c.iso === segEnd)
      if (startCol < 0 || endCol < 0) return null
      const done = t.status === '완료'
      const cancelled = t.status === '취소'
      const holding = t.status === '홀딩'
      const dday = done || cancelled ? '' : calcDday(end)
      return {
        id: t.id,
        task: t,
        label: blockLabel(t, suffixes.get(t.id), holding, dday),
        tooltip: `${start} ~ ${end}`,
        color: getTaskTypeColor(t.taskType),
        done,
        cancelled,
        holding,
        startCol,
        endCol,
        span: endCol - startCol + 1,
        continuesPrev: start < weekStart,
        continuesNext: end > weekEnd,
        lane: 0,
      }
    })
    .filter(Boolean)
    .sort((a, b) => a.startCol - b.startCol || b.span - a.span)

  assignLanes(segments)
  return segments
}

function assignLanes(segments) {
  const laneEnds = []
  for (const seg of segments) {
    let lane = 0
    while (laneEnds[lane] !== undefined && laneEnds[lane] >= seg.startCol) lane++
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

function syncEmit() {
  emit('update:year', cursor.value.getFullYear())
  emit('update:month', cursor.value.getMonth() + 1)
}

function prevMonth() {
  cursor.value = new Date(cursor.value.getFullYear(), cursor.value.getMonth() - 1, 1)
  syncEmit()
}

function nextMonth() {
  cursor.value = new Date(cursor.value.getFullYear(), cursor.value.getMonth() + 1, 1)
  syncEmit()
}

function goToday() {
  cursor.value = new Date(today.getFullYear(), today.getMonth(), 1)
  syncEmit()
}

// PAG-S-WBS-08는 순수 렌더링 화면이라 업무 블록 클릭이 없다(h-pms 이식) — 대신 호버 시
// 살짝 뜨는 그림자·스윕 애니메이션으로 반응만 준다. 같은 업무가 여러 주에 걸쳐 나뉘어도
// wbsTaskId(=id) 하나로 동시에 반응한다.
const hoveredTaskId = ref(null)

function hoverShadow(bar) {
  return hoveredTaskId.value === bar.task.id ? 'var(--shadow-md)' : undefined
}

function blockStyle(bar) {
  if (bar.done || bar.cancelled) return {}
  return {
    borderLeftColor: bar.color,
    background: `color-mix(in srgb, ${bar.color} 13%, transparent)`,
  }
}
</script>

<template>
  <div class="wbs-cal card">
    <div class="cal__bar">
      <span class="cal__bar__side" />
      <div class="cal__bar__center">
        <button type="button" class="cal__nav" title="이전 달" @click="prevMonth">‹</button>
        <span class="cal__label">{{ calendarLabel }}</span>
        <button type="button" class="cal__nav" title="다음 달" @click="nextMonth">›</button>
      </div>
      <span class="cal__bar__side cal__bar__side--right">
        <button type="button" class="cal__today" @click="goToday">오늘</button>
      </span>
    </div>

    <div class="cal__grid cal__head">
      <div
        v-for="(w, i) in WEEKDAYS"
        :key="w"
        class="cal__wd"
        :class="{ sun: i === 0, sat: i === 6 }"
      >
        {{ w }}
      </div>
    </div>

    <div v-for="(week, wi) in calendarWeeks" :key="wi" class="cal-week">
      <div
        v-for="cell in week.cells"
        :key="cell.iso"
        class="cal__cell"
        :class="{
          out: !cell.inMonth,
          today: cell.isToday,
          sun: cell.date.getDay() === 0,
          sat: cell.date.getDay() === 6,
        }"
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
          class="tblock"
          :class="{
            done: bar.done,
            cancelled: bar.cancelled,
            holding: bar.holding,
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
          :title="bar.tooltip"
          @mouseenter="hoveredTaskId = bar.id"
          @mouseleave="hoveredTaskId = null"
        >
          <span v-if="bar.holding" class="tblock__badge">일시중단</span>
          <span class="tblock__name">{{ bar.label }}</span>
        </div>
      </div>
    </div>

    <p class="cal__hint">
      ※ 캘린더 표기: 대기=계획일정, 진행중=실행시작~계획종료, 완료=실행일정 · 주차 높이는 업무 수에 따라 확장
    </p>
  </div>
</template>

<style scoped>
.wbs-cal {
  overflow: hidden;
  background: var(--lnb-side);
  border: 1px solid var(--lnb-line);
  border-radius: var(--radius-lg, 10px);
}

.cal__bar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px 14px;
  border-bottom: 1px solid var(--lnb-line);
}

.cal__bar__side {
  flex: 1;
}

.cal__bar__side--right {
  display: flex;
  justify-content: flex-end;
}

.cal__bar__center {
  display: flex;
  align-items: center;
  gap: 8px;
}

.cal__label {
  font-size: calc(14px + var(--font-size-offset, 0px));
  font-weight: 600;
  min-width: 110px;
  color: var(--lnb-logo);
}

.cal__nav {
  width: 28px;
  height: 28px;
  border: 1px solid var(--lnb-line);
  border-radius: var(--radius-sm, 6px);
  background: var(--lnb-side);
  cursor: pointer;
  font-size: calc(16px + var(--font-size-offset, 0px));
  line-height: 1;
  color: var(--lnb-txt);
}

.cal__today {
  margin-left: 4px;
  height: 28px;
  padding: 0 12px;
  border: 1px solid var(--lnb-line);
  border-radius: var(--radius-sm, 6px);
  background: var(--lnb-side);
  font-size: calc(12px + var(--font-size-offset, 0px));
  cursor: pointer;
  font-family: inherit;
}

.cal__grid {
  display: grid;
  grid-template-columns: repeat(7, 1fr);
}

.cal__head {
  border-bottom: 1px solid var(--lnb-line);
  background: var(--field);
}

.cal__wd {
  text-align: center;
  font-size: calc(11px + var(--font-size-offset, 0px));
  color: var(--lnb-muted);
  padding: 8px 0;
  font-weight: 600;
}

.cal__wd.sun {
  color: var(--red);
}

.cal__wd.sat {
  color: var(--blue);
}

/* 요일 칸 사이 세로 구분선을 날짜 숫자 줄뿐 아니라 그 아래 업무 바 줄까지 이어지게 한다(h-pms 이식,
   2026-08-26). .cal__cell 각각의 border-right로 주면 날짜 숫자 줄 높이만큼만 그어지므로,
   .cal-week 자신의 배경에 한 번에 그어 두 줄 전체 높이를 통과시킨다. */
.cal-week {
  display: grid;
  grid-template-columns: repeat(7, 1fr);
  border-bottom: 1px solid var(--lnb-line);
  background-image: repeating-linear-gradient(
    to right,
    var(--lnb-line) 0,
    var(--lnb-line) 1px,
    transparent 1px,
    transparent calc(100% / 7)
  );
}

.cal__cell {
  min-height: auto;
  padding: 4px 5px 2px;
}

.cal__cell.out {
  background: var(--field);
}

.cal__cell.out .cal__day {
  opacity: 0.45;
}

.cal__cell.today {
  background: var(--lnb-hover);
}

.cal__cell.sun:not(.today) {
  background: var(--red-bg);
}

.cal__cell.sat:not(.today) {
  background: var(--blue-bg);
}

.cal__day {
  font-size: calc(12px + var(--font-size-offset, 0px));
  color: var(--lnb-txt);
  padding: 2px 4px;
  font-weight: 500;
}

.cal__cell.today .cal__day {
  color: var(--teal);
  font-weight: 700;
}

.cal-week:last-child {
  border-bottom: none;
}

.cal-week__lanes {
  grid-column: 1 / -1;
  display: grid;
  grid-template-columns: repeat(7, 1fr);
  gap: 5px 0;
  padding: 2px 4px 6px;
  min-height: 52px;
}

/* 모양·호버 스윕·배지는 내업무 캘린더(MyWorkCalendar) 스타일로 맞춘다(h-pms 이식, 2026-08-26).
   색은 업무유형색(getTaskTypeColor)을 그대로 쓰고 여기선 모양/인터랙션만 이식한다. */
.tblock {
  display: flex;
  align-items: center;
  gap: 6px;
  overflow: hidden;
  min-height: 30px;
  padding: 7px 11px;
  margin: 0 2px;
  border-radius: 8px;
  border: 1px solid transparent;
  border-left: 4px solid var(--teal);
  background: var(--teal-50);
  color: var(--lnb-txt);
  font-size: calc(10.5px + var(--font-size-offset, 0px));
  line-height: 1.3;
  background-image: linear-gradient(100deg, rgba(255, 255, 255, 0) 32%, rgba(255, 255, 255, 0.55) 50%, rgba(255, 255, 255, 0) 68%);
  background-size: 220% 100%;
  background-repeat: no-repeat;
  background-position: -60% 0;
  transition: box-shadow 0.18s ease, transform 0.18s ease;
  /* PAG-S-WBS-08는 순수 렌더링이라 블록 클릭이 없다 — cursor는 기본값을 둔다(pointer를 주면
     눌리는 줄 알고 클릭하게 된다). */
}

.tblock.is-hover {
  animation: wbsCalBarSweep 1.15s ease-in-out infinite;
  transform: translateY(-1px);
}

@keyframes wbsCalBarSweep {
  from { background-position: -60% 0; }
  to { background-position: 160% 0; }
}

@media (prefers-reduced-motion: reduce) {
  .tblock.is-hover { animation: none; }
}

.tblock.done,
.tblock.cancelled {
  background: var(--field, var(--line-2));
  color: var(--lnb-muted);
  border-left-color: var(--lnb-muted);
}

.tblock.holding {
  background: var(--field, var(--line-2));
  border-left-color: var(--lnb-muted);
  opacity: 0.9;
}

.tblock__badge {
  flex-shrink: 0;
  font-size: calc(10px + var(--font-size-offset, 0px));
  font-weight: 700;
  color: #fff;
  background: var(--lnb-muted);
  padding: 2px 6px;
  border-radius: 4px;
}

/* 주 경계를 넘는 바는 잘린 쪽 라운드·여백을 죽여 연속으로 읽히게 한다. */
.tblock.continues-prev {
  border-top-left-radius: 0;
  border-bottom-left-radius: 0;
  margin-left: 0;
}

.tblock.continues-next {
  border-top-right-radius: 0;
  border-bottom-right-radius: 0;
  margin-right: 0;
}

.tblock__name {
  display: block;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  font-weight: 600;
}

.cal__hint {
  margin: 0;
  padding: 10px 14px;
  font-size: calc(11px + var(--font-size-offset, 0px));
  color: var(--lnb-muted);
  border-top: 1px solid var(--lnb-line);
  line-height: 1.5;
}
</style>
