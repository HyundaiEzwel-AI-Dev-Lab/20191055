<script setup>
/**
 * WBS 캘린더형 — 내업무 InboxCalendar와 동일한 주 단위 span 바 형태
 * PAG-S-WBS-08
 */
import { computed, ref, watch } from 'vue'
import {
  getCalendarRange,
  getTaskTypeColor,
  calendarBlockLabel,
} from '@/data/wbs'

const props = defineProps({
  tasks: { type: Array, default: () => [] },
  year: { type: Number, required: true },
  month: { type: Number, required: true },
})

const emit = defineEmits(['update:year', 'update:month', 'select'])

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

const typeIndexMap = computed(() => {
  const counts = {}
  const map = {}
  for (const t of props.tasks) {
    const key = t.taskType || '기타'
    counts[key] = (counts[key] || 0) + 1
    map[t.id] = counts[key]
  }
  return map
})

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

function layoutWeekBars(weekCells) {
  const weekStart = weekCells[0].iso
  const weekEnd = weekCells[6].iso

  const segments = props.tasks
    .map((t) => {
      const range = getCalendarRange(t)
      if (!range?.start) return null
      const start = range.start
      const end = range.end || range.start
      if (end < weekStart || start > weekEnd) return null
      const segStart = start > weekStart ? start : weekStart
      const segEnd = end < weekEnd ? end : weekEnd
      const startCol = weekCells.findIndex((c) => c.iso === segStart)
      const endCol = weekCells.findIndex((c) => c.iso === segEnd)
      if (startCol < 0 || endCol < 0) return null
      const typeIdx = typeIndexMap.value[t.id] || 1
      const label = calendarBlockLabel(t, typeIdx > 1 ? typeIdx - 1 : 0)
      return {
        id: t.id,
        task: t,
        label,
        color: getTaskTypeColor(t.taskType),
        done: t.status === '완료',
        delayed: t.scheduleStatus === 'delay' || t.status === '진행중' && t.scheduleStatus === 'delay',
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

function onBarClick(bar) {
  if (bar.done) return
  emit('select', bar.task)
}

function blockStyle(bar) {
  if (bar.done) return {}
  return {
    borderLeftColor: bar.color,
    background: `${bar.color}22`,
  }
}
</script>

<template>
  <div class="wbs-cal card">
    <div class="cal__bar">
      <button type="button" class="cal__nav" @click="prevMonth">‹</button>
      <span class="cal__label">{{ calendarLabel }}</span>
      <button type="button" class="cal__nav" @click="nextMonth">›</button>
      <button type="button" class="cal__today" @click="goToday">오늘</button>
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
        :class="{ out: !cell.inMonth, today: cell.isToday }"
      >
        <div class="cal__day">{{ cell.day }}</div>
      </div>

      <div
        class="cal-week__lanes"
        :style="{ gridTemplateRows: `repeat(${week.maxLanes}, 24px)` }"
      >
        <div
          v-for="bar in week.bars"
          :key="`${bar.id}-w${wi}`"
          class="tblock"
          :class="{
            done: bar.done,
            delayed: bar.delayed,
            'continues-prev': bar.continuesPrev,
            'continues-next': bar.continuesNext,
          }"
          :style="{
            gridColumn: `${bar.startCol + 1} / span ${bar.span}`,
            gridRow: bar.lane + 1,
            ...blockStyle(bar),
          }"
          :title="bar.label"
          @click="onBarClick(bar)"
        >
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
  background: var(--lnb-side, #fff);
  border: 1px solid var(--lnb-line);
  border-radius: var(--radius-lg, 10px);
}

.cal__bar {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 12px 14px;
  border-bottom: 1px solid var(--lnb-line);
}

.cal__label {
  font-size: 14px;
  font-weight: 600;
  min-width: 110px;
  color: var(--lnb-logo, #1c1d21);
}

.cal__nav {
  width: 28px;
  height: 28px;
  border: 1px solid var(--lnb-line);
  border-radius: var(--radius-sm, 6px);
  background: #fff;
  cursor: pointer;
  font-size: 16px;
  line-height: 1;
  color: var(--lnb-txt);
}

.cal__today {
  margin-left: 4px;
  height: 28px;
  padding: 0 12px;
  border: 1px solid var(--lnb-line);
  border-radius: var(--radius-sm, 6px);
  background: #fff;
  font-size: 12px;
  cursor: pointer;
  font-family: inherit;
}

.cal__grid {
  display: grid;
  grid-template-columns: repeat(7, 1fr);
}

.cal__head {
  border-bottom: 1px solid var(--lnb-line);
  background: var(--field, #f1f4f5);
}

.cal__wd {
  text-align: center;
  font-size: 11px;
  color: var(--lnb-muted);
  padding: 8px 0;
  font-weight: 600;
}

.cal__wd.sun {
  color: var(--red, #e0524a);
}

.cal__wd.sat {
  color: var(--blue, #2f6fed);
}

.cal-week {
  display: grid;
  grid-template-columns: repeat(7, 1fr);
  border-bottom: 1px solid var(--lnb-line);
}

.cal__cell {
  min-height: auto;
  padding: 4px 5px 2px;
  border-right: 1px solid var(--lnb-line);
}

.cal__cell:nth-child(7n) {
  border-right: none;
}

.cal__cell.out {
  background: var(--field, #f1f4f5);
}

.cal__cell.out .cal__day {
  opacity: 0.45;
}

.cal__cell.today {
  background: var(--lnb-hover, #f5f6f7);
}

.cal__day {
  font-size: 12px;
  color: var(--lnb-txt);
  padding: 2px 4px;
  font-weight: 500;
}

.cal__cell.today .cal__day {
  color: var(--teal);
  font-weight: 700;
}

.cal-week__lanes {
  grid-column: 1 / -1;
  display: grid;
  grid-template-columns: repeat(7, 1fr);
  gap: 3px 2px;
  padding: 2px 4px 6px;
  min-height: 52px;
}

.tblock {
  font-size: 10.5px;
  line-height: 1.3;
  padding: 3px 6px;
  border-radius: 4px;
  border-left: 3px solid var(--teal);
  color: var(--lnb-txt);
  cursor: pointer;
  overflow: hidden;
  white-space: nowrap;
  text-overflow: ellipsis;
  background: var(--teal-50);
}

.tblock.done {
  background: var(--field, #eef1f3);
  color: var(--lnb-muted);
  border-left-color: var(--lnb-muted);
  cursor: default;
}

.tblock.delayed {
  box-shadow: inset 0 0 0 1px var(--red, #e0524a);
}

.tblock.continues-prev {
  border-top-left-radius: 0;
  border-bottom-left-radius: 0;
}

.tblock.continues-next {
  border-top-right-radius: 0;
  border-bottom-right-radius: 0;
}

.tblock__name {
  display: block;
  overflow: hidden;
  text-overflow: ellipsis;
}

.cal__hint {
  margin: 0;
  padding: 10px 14px;
  font-size: 11px;
  color: var(--lnb-muted);
  border-top: 1px solid var(--lnb-line);
  line-height: 1.5;
}
</style>
