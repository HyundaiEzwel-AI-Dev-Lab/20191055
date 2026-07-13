<script setup>
// PAG-S-WBS-01/08 WBS 관리
import { computed, onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import {
  wbsMeta,
  taskTypeOptions,
  progressStatusOptions,
  scheduleComplianceOptions,
  systemOptions,
  assigneeOptions,
  getWbsTasks,
  formatDateRange,
  statusLabel,
  statusClass,
  matchWbsFilters,
  getCalendarTasks,
  getCalendarRange,
  getTaskTypeColor,
  calendarBlockLabel,
} from '@/data/wbs'
import WbsScheduleModal from '@/components/wbs/WbsScheduleModal.vue'
import WbsScheduleReasonModal from '@/components/wbs/WbsScheduleReasonModal.vue'
import ExcelDownloadButton from '@/components/ui/ExcelDownloadButton.vue'
import { mockExcelDownload } from '@/utils/excelDownload'

const router = useRouter()

const tasks = ref([])
const viewMode = ref('list')
const myTasksOnly = ref(false)
const showExcluded = ref(false)
const selectedIds = ref(new Set())
const hoverReqId = ref(null)

const filters = ref({
  keyword: '',
  taskType: '전체',
  system: '',
  progressStatus: '전체',
  scheduleCompliance: '전체',
  progressBaseDate: wbsMeta.progressBaseDate,
  showExcluded: false,
})

const appliedFilters = ref({ ...filters.value })

const showScheduleModal = ref(false)
const scheduleTarget = ref(null)
const showReasonModal = ref(false)
const reasonTarget = ref(null)
const showCopyAlert = ref(false)
const showSaveAlert = ref(false)

const calYear = ref(2026)
const calMonth = ref(4)
const showDayPopup = ref(false)
const dayPopupTasks = ref([])
const dayPopupLabel = ref('')

const filteredTasks = computed(() =>
  tasks.value.filter((row) =>
    matchWbsFilters(row, appliedFilters.value, myTasksOnly.value),
  ),
)

const calendarTasks = computed(() =>
  getCalendarTasks(filteredTasks.value, calYear.value, calMonth.value),
)

const calendarDays = computed(() => {
  const first = new Date(calYear.value, calMonth.value - 1, 1)
  const last = new Date(calYear.value, calMonth.value, 0)
  const startPad = first.getDay()
  const days = []
  for (let i = 0; i < startPad; i++) days.push({ empty: true })
  for (let d = 1; d <= last.getDate(); d++) {
    days.push({ day: d, date: `${calYear.value}-${String(calMonth.value).padStart(2, '0')}-${String(d).padStart(2, '0')}` })
  }
  return days
})

const selectedRows = computed(() => tasks.value.filter((t) => selectedIds.value.has(t.id)))

onMounted(() => {
  tasks.value = getWbsTasks()
})

function resetFilters() {
  filters.value = {
    keyword: '',
    taskType: '전체',
    system: '',
    progressStatus: '전체',
    scheduleCompliance: '전체',
    progressBaseDate: wbsMeta.progressBaseDate,
    showExcluded: false,
  }
  appliedFilters.value = { ...filters.value }
}

function search() {
  appliedFilters.value = { ...filters.value, showExcluded: showExcluded.value }
}

function toggleSelect(id, disabled) {
  if (disabled) return
  const next = new Set(selectedIds.value)
  if (next.has(id)) next.delete(id)
  else next.add(id)
  selectedIds.value = next
}

function toggleSelectAll(checked) {
  if (checked) {
    selectedIds.value = new Set(
      filteredTasks.value.filter((t) => !t.excluded).map((t) => t.id),
    )
  } else {
    selectedIds.value = new Set()
  }
}

function isAllSelected() {
  const selectable = filteredTasks.value.filter((t) => !t.excluded)
  return selectable.length > 0 && selectable.every((t) => selectedIds.value.has(t.id))
}

function onAssigneeChange(row, assignee) {
  row.assignee = assignee
  row.assigneeDisplay = assignee
  row.changedAt = new Date().toISOString().slice(0, 19).replace('T', ' ')
  row.changedBy = '김현대'
}

function onScheduleClick(row) {
  if (row.excluded || row.status === '취소') return
  scheduleTarget.value = row
  showScheduleModal.value = true
}

function onScheduleSave(payload) {
  if (!scheduleTarget.value) return
  Object.assign(scheduleTarget.value, payload)
  scheduleTarget.value.changedAt = new Date().toISOString().slice(0, 19).replace('T', ' ')
  scheduleTarget.value.changedBy = '김현대'
}

function onStatusClick(row) {
  if (row.status === '완료' && row.scheduleStatus === 'delay') {
    reasonTarget.value = row
    showReasonModal.value = true
  }
}

function onRequirementClick(row) {
  if (row.requirementId) {
    router.push('/project/requirement')
  }
}

function onExclude() {
  if (!selectedRows.value.length) {
    window.alert('작업제외할 업무를 선택하세요.')
    return
  }
  selectedRows.value.forEach((row) => {
    if (!row.planStart && !row.assignee) {
      row.excluded = true
      row.status = '취소'
    }
  })
  selectedIds.value = new Set()
}

function onCopy() {
  if (!selectedRows.value.length) {
    window.alert('복사할 업무단위를 선택하세요.')
    return
  }
  showCopyAlert.value = true
}

function onExcelDownload() {
  mockExcelDownload('WBS 관리', filteredTasks.value.length)
}

function confirmCopy() {
  const copies = selectedRows.value.map((row, i) => ({
    ...JSON.parse(JSON.stringify(row)),
    id: `w-copy-${Date.now()}-${i}`,
    wbsId: `WBS-${String(tasks.value.length + i + 1).padStart(3, '0')}`,
    assignee: '',
    assigneeDisplay: '선택',
    planStart: null,
    planEnd: null,
    execStart: null,
    execEnd: null,
    planProgress: 0,
    execProgress: 0,
    status: '대기',
    scheduleStatus: null,
    excluded: false,
    changedAt: null,
    changedBy: null,
  }))
  tasks.value.push(...copies)
  showCopyAlert.value = false
  selectedIds.value = new Set()
}

function onSave() {
  if (!window.confirm('변경사항을 저장하시겠습니까?')) return
  showSaveAlert.value = true
}

function onScheduleChange() {
  window.alert('일정변경 (POP-S-WBS-04)\n선택한 WBS 업무의 일정 일괄 변경 요청 팝업입니다.')
}

function tasksForDay(dateStr) {
  return calendarTasks.value.filter((t) => {
    const range = getCalendarRange(t)
    if (!range?.start) return false
    const start = range.start
    const end = range.end || range.start
    return dateStr >= start && dateStr <= end
  })
}

function openDayPopup(dateStr, day) {
  const list = tasksForDay(dateStr)
  if (!list.length) return
  dayPopupTasks.value = list
  dayPopupLabel.value = `${calMonth.value}/${day} 수행 업무 (${list.length}건)`
  showDayPopup.value = true
}

function prevMonth() {
  if (calMonth.value === 1) {
    calMonth.value = 12
    calYear.value--
  } else calMonth.value--
}

function nextMonth() {
  if (calMonth.value === 12) {
    calMonth.value = 1
    calYear.value++
  } else calMonth.value++
}
</script>

<template>
  <div class="wbs">
    <div class="wbs__head">
      <h1 class="wbs__title">
        WBS 관리
        <span class="wbs__hint">{{ wbsMeta.hint }}</span>
      </h1>
      <div class="view-toggle">
        <button
          type="button"
          class="view-toggle__btn"
          :class="{ 'view-toggle__btn--on': viewMode === 'list' }"
          @click="viewMode = 'list'"
        >
          목록형
        </button>
        <button
          type="button"
          class="view-toggle__btn"
          :class="{ 'view-toggle__btn--on': viewMode === 'calendar' }"
          @click="viewMode = 'calendar'"
        >
          캘린더형
        </button>
        <span class="wbs__progress">총 공정률 <b>{{ wbsMeta.totalProgress }}%</b></span>
      </div>
    </div>

    <!-- 검색 -->
    <section class="filter card">
      <div class="filter__row">
        <div class="filter__field">
          <label>통합검색</label>
          <input
            v-model="filters.keyword"
            class="filter__input"
            type="text"
            placeholder="화면명, 요구사항명"
          />
        </div>
        <div class="filter__field">
          <label>업무유형</label>
          <select v-model="filters.taskType" class="filter__select">
            <option v-for="o in taskTypeOptions" :key="o" :value="o">{{ o }}</option>
          </select>
        </div>
        <div class="filter__field">
          <label>업무범주</label>
          <select v-model="filters.system" class="filter__select">
            <option value="">시스템 선택</option>
            <option v-for="s in systemOptions" :key="s" :value="s">{{ s }}</option>
          </select>
        </div>
        <div class="filter__field">
          <label>진행상태</label>
          <select v-model="filters.progressStatus" class="filter__select">
            <option v-for="o in progressStatusOptions" :key="o" :value="o">{{ o }}</option>
          </select>
        </div>
        <div class="filter__field">
          <label>계획준수</label>
          <select v-model="filters.scheduleCompliance" class="filter__select">
            <option v-for="o in scheduleComplianceOptions" :key="o" :value="o">{{ o }}</option>
          </select>
        </div>
        <div class="filter__field">
          <label>공정률 기준날짜</label>
          <input v-model="filters.progressBaseDate" class="filter__input" type="date" />
        </div>
      </div>
      <div class="filter__actions">
        <button type="button" class="btn btn--ghost" @click="resetFilters">초기화</button>
        <button type="button" class="btn btn--primary" @click="search">조회</button>
      </div>
    </section>

    <!-- 툴바 -->
    <div class="toolbar">
      <button
        type="button"
        class="toolbar__toggle"
        :class="{ 'toolbar__toggle--on': myTasksOnly }"
        @click="myTasksOnly = !myTasksOnly"
      >
        내 업무만
      </button>
      <span class="toolbar__count">총 <b>{{ filteredTasks.length }}</b>건</span>
      <label class="toolbar__check">
        <input v-model="showExcluded" type="checkbox" @change="search" />
        작업제외
      </label>
      <ExcelDownloadButton @click="onExcelDownload" />
      <div class="toolbar__spacer" />
      <button type="button" class="btn btn--ghost btn--sm" @click="onScheduleChange">일정변경</button>
      <button type="button" class="btn btn--ghost btn--sm" @click="onCopy">복사</button>
      <button type="button" class="btn btn--ghost btn--sm" @click="onExclude">작업제외</button>
      <button type="button" class="btn btn--primary btn--sm" @click="onSave">저장</button>
    </div>

    <!-- 목록형 -->
    <div v-if="viewMode === 'list'" class="listcard">
      <div class="listcard__scroll">
        <table class="wbs-table">
          <thead>
            <tr>
              <th class="col-check">
                <input type="checkbox" :checked="isAllSelected()" @change="toggleSelectAll($event.target.checked)" />
              </th>
              <th>시스템/업무구분</th>
              <th>화면경로</th>
              <th>화면명</th>
              <th>요구사항명</th>
              <th>업무유형</th>
              <th>담당자</th>
              <th>난이도</th>
              <th>계획일정</th>
              <th>실행일정</th>
              <th>계획공정률</th>
              <th>실행공정률</th>
              <th>상태</th>
              <th>확정여부</th>
              <th>변경일시</th>
              <th>변경자</th>
            </tr>
          </thead>
          <tbody>
            <tr
              v-for="row in filteredTasks"
              :key="row.id"
              class="wbs-row"
              :class="{ 'wbs-row--excluded': row.excluded }"
            >
              <td class="col-check">
                <input
                  type="checkbox"
                  :checked="selectedIds.has(row.id)"
                  :disabled="row.excluded"
                  @change="toggleSelect(row.id, row.excluded)"
                />
              </td>
              <td>{{ row.systemPath }}</td>
              <td>{{ row.screenPath }}</td>
              <td>{{ row.screenName }}</td>
              <td class="req-cell">
                <button
                  v-if="row.requirementId"
                  type="button"
                  class="req-link"
                  @click="onRequirementClick(row)"
                  @mouseenter="hoverReqId = row.id"
                  @mouseleave="hoverReqId = null"
                >
                  {{ row.requirementName }}
                </button>
                <span v-else>{{ row.requirementName }}</span>
                <div v-if="hoverReqId === row.id && row.requirementPreview" class="req-tooltip">
                  {{ row.requirementPreview }}
                </div>
              </td>
              <td>{{ row.taskType }}</td>
              <td>
                <select
                  v-if="!row.excluded && row.status !== '취소' && row.taskType !== '테스트'"
                  :value="row.assignee"
                  class="assignee-select"
                  @change="onAssigneeChange(row, $event.target.value)"
                >
                  <option value="">선택</option>
                  <option
                    v-for="a in assigneeOptions[row.taskType] || []"
                    :key="a"
                    :value="a"
                  >
                    {{ a }}
                  </option>
                </select>
                <span v-else class="assignee-text">{{ row.assigneeDisplay }}</span>
              </td>
              <td>{{ row.difficulty }}</td>
              <td>
                <button
                  type="button"
                  class="schedule-link"
                  :disabled="row.excluded"
                  @click="onScheduleClick(row)"
                >
                  {{ formatDateRange(row.planStart, row.planEnd) }}
                </button>
              </td>
              <td>{{ formatDateRange(row.execStart, row.execEnd) }}</td>
              <td>
                <div class="prog-wrap">
                  <div class="prog-bar"><i :style="{ width: `${row.planProgress}%` }" /></div>
                  <span>{{ row.planProgress }}%</span>
                </div>
              </td>
              <td>
                <div class="prog-wrap">
                  <div class="prog-bar"><i :style="{ width: `${row.execProgress}%` }" /></div>
                  <span>{{ row.execProgress }}%</span>
                </div>
              </td>
              <td>
                <button
                  type="button"
                  class="st"
                  :class="`st--${statusClass(row)}`"
                  :disabled="!(row.status === '완료' && row.scheduleStatus === 'delay')"
                  @click="onStatusClick(row)"
                >
                  {{ statusLabel(row) }}
                </button>
              </td>
              <td>{{ row.confirmed }}</td>
              <td class="muted">{{ row.changedAt || '—' }}</td>
              <td>{{ row.changedBy || '—' }}</td>
            </tr>
            <tr v-if="!filteredTasks.length">
              <td colspan="16" class="empty-row">조회 결과가 없습니다.</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <!-- 캘린더형 -->
    <div v-else class="calendar card">
      <div class="calendar__nav">
        <button type="button" class="cal-nav-btn" @click="prevMonth">‹</button>
        <span class="calendar__title">{{ calYear }}년 {{ calMonth }}월</span>
        <button type="button" class="cal-nav-btn" @click="nextMonth">›</button>
        <button type="button" class="cal-today-btn">오늘</button>
      </div>
      <div class="calendar__weekdays">
        <span v-for="d in ['일', '월', '화', '수', '목', '금', '토']" :key="d">{{ d }}</span>
      </div>
      <div class="calendar__grid">
        <div
          v-for="(cell, idx) in calendarDays"
          :key="idx"
          class="calendar__cell"
          :class="{ 'calendar__cell--empty': cell.empty }"
        >
          <template v-if="!cell.empty">
            <span class="calendar__day">{{ cell.day }}</span>
            <div class="calendar__blocks">
              <div
                v-for="(task, ti) in tasksForDay(cell.date).slice(0, 2)"
                :key="task.id"
                class="cal-block"
                :style="{ background: getTaskTypeColor(task.taskType) }"
                :title="calendarBlockLabel(task, ti)"
              >
                {{ calendarBlockLabel(task, ti).slice(0, 18) }}…
              </div>
              <button
                v-if="tasksForDay(cell.date).length > 2"
                type="button"
                class="cal-more"
                @click="openDayPopup(cell.date, cell.day)"
              >
                +{{ tasksForDay(cell.date).length - 2 }} 더보기
              </button>
            </div>
          </template>
        </div>
      </div>
      <p class="calendar__hint">
        ※ 캘린더 표기: 대기=계획일정, 진행중=실행시작~계획종료, 완료=실행일정
      </p>
    </div>

    <WbsScheduleModal
      v-model="showScheduleModal"
      :task="scheduleTarget"
      @save="onScheduleSave"
    />
    <WbsScheduleReasonModal v-model="showReasonModal" :task="reasonTarget" />

    <Teleport to="body">
      <div v-if="showCopyAlert" class="alert-scrim" @mousedown.self="showCopyAlert = false">
        <div class="alert-box">
          <p>선택한 업무단위를 복사하시겠습니까?<br />시스템~업무유형만 복사되며 담당자는 '선택', 계획일정 미등록, 상태 대기로 생성됩니다.</p>
          <div class="alert-box__actions">
            <button type="button" class="btn btn--ghost" @click="showCopyAlert = false">취소</button>
            <button type="button" class="btn btn--primary" @click="confirmCopy">확인</button>
          </div>
        </div>
      </div>

      <div v-if="showSaveAlert" class="alert-scrim" @mousedown.self="showSaveAlert = false">
        <div class="alert-box">
          <p>변경사항이 저장되었습니다.</p>
          <button type="button" class="btn btn--primary" @click="showSaveAlert = false">확인</button>
        </div>
      </div>

      <div v-if="showDayPopup" class="alert-scrim" @mousedown.self="showDayPopup = false">
        <div class="alert-box alert-box--wide">
          <div class="alert-box__head">
            <span>{{ dayPopupLabel }}</span>
            <button type="button" class="alert-box__close" @click="showDayPopup = false">✕</button>
          </div>
          <ul class="day-list">
            <li v-for="t in dayPopupTasks" :key="t.id">
              {{ calendarBlockLabel(t, 0) }}
            </li>
          </ul>
        </div>
      </div>
    </Teleport>
  </div>
</template>

<style scoped>
.wbs {
  --teal: #119a8a;
  --teal-600: #0e8275;
  --teal-50: #e6f4f2;
  --teal-100: #cfe9e5;
  --ink: #1f2a30;
  --ink-2: #48565e;
  --muted: #7c8a92;
  --line: #e3e8eb;
  --line-2: #eef1f3;
  --field: #f1f4f5;
  --green: #1f9d57;
  --green-bg: #e6f6ec;
  --red: #e0524a;
  --red-bg: #fdecea;
  --orange: #e08a2b;
  --orange-bg: #fcf0e1;
  --blue: #2f6fed;
  --blue-bg: #e8f0ff;
  --gray: #8a97a0;
  --gray-bg: #eef1f3;

  padding: 14px 18px 28px;
  font-size: 13px;
  color: var(--ink);
}

.wbs__head {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 12px;
  margin-bottom: 12px;
  flex-wrap: wrap;
}

.wbs__title {
  font-size: 16px;
  font-weight: 700;
  margin: 0;
  display: flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
}

.wbs__hint {
  font-size: 11px;
  font-weight: 500;
  color: var(--muted);
  background: #fff;
  border: 1px solid var(--line);
  padding: 2px 8px;
  border-radius: 20px;
}

.view-toggle {
  display: flex;
  align-items: center;
  gap: 8px;
}

.view-toggle__btn {
  height: 28px;
  padding: 0 12px;
  border: 1px solid var(--line);
  border-radius: 7px;
  background: #fff;
  font-size: 12px;
  cursor: pointer;
  font-family: inherit;
  color: var(--ink-2);
}

.view-toggle__btn--on {
  background: var(--teal-50);
  border-color: var(--teal-100);
  color: var(--teal-600);
  font-weight: 700;
}

.wbs__progress {
  font-size: 12px;
  color: var(--ink-2);
  margin-left: 8px;
}

.wbs__progress b {
  color: var(--teal-600);
  font-size: 14px;
}

.card {
  background: #fff;
  border: 1px solid var(--line);
  border-radius: 10px;
}

.filter {
  padding: 14px 16px;
  margin-bottom: 12px;
}

.filter__row {
  display: grid;
  grid-template-columns: repeat(6, 1fr);
  gap: 10px 14px;
  margin-bottom: 12px;
}

.filter__field {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.filter__field label {
  font-size: 11px;
  color: var(--muted);
  font-weight: 600;
}

.filter__input,
.filter__select {
  height: 32px;
  padding: 0 10px;
  border: 1px solid var(--line);
  border-radius: 7px;
  font-family: inherit;
  font-size: 12px;
  background: var(--field);
}

.filter__actions {
  display: flex;
  justify-content: flex-end;
  gap: 8px;
}

.toolbar {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 10px;
  flex-wrap: wrap;
}

.toolbar__toggle {
  height: 28px;
  padding: 0 12px;
  border: 1px solid var(--line);
  border-radius: 7px;
  background: #fff;
  font-size: 12px;
  cursor: pointer;
  font-family: inherit;
  color: var(--muted);
}

.toolbar__toggle--on {
  background: var(--teal-50);
  border-color: var(--teal-100);
  color: var(--teal-600);
  font-weight: 700;
}

.toolbar__count {
  font-size: 12px;
  color: var(--ink-2);
}

.toolbar__count b {
  color: var(--teal-600);
}

.toolbar__check {
  display: flex;
  align-items: center;
  gap: 5px;
  font-size: 12px;
  color: var(--ink-2);
  cursor: pointer;
}

.toolbar__spacer {
  flex: 1;
}

.listcard {
  background: #fff;
  border: 1px solid var(--line);
  border-radius: 10px;
  overflow: hidden;
}

.listcard__scroll {
  overflow-x: auto;
}

.wbs-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 12px;
  min-width: 1400px;
}

.wbs-table thead th {
  background: #fafbfc;
  color: var(--muted);
  font-weight: 600;
  text-align: left;
  padding: 9px 10px;
  border-bottom: 1px solid var(--line);
  white-space: nowrap;
}

.wbs-table tbody td {
  padding: 9px 10px;
  border-bottom: 1px solid var(--line-2);
  color: var(--ink-2);
  vertical-align: middle;
}

.col-check {
  width: 36px;
  text-align: center;
}

.wbs-row:hover {
  background: var(--teal-50);
}

.wbs-row--excluded {
  opacity: 0.5;
  background: var(--gray-bg);
}

.wbs-row--excluded:hover {
  background: var(--gray-bg);
}

.req-cell {
  position: relative;
  min-width: 120px;
}

.req-link {
  border: none;
  background: none;
  color: var(--ink);
  font-weight: 600;
  cursor: pointer;
  font-family: inherit;
  font-size: 12px;
  padding: 0;
  text-align: left;
}

.req-link:hover {
  color: var(--teal-600);
  text-decoration: underline;
}

.req-tooltip {
  position: absolute;
  left: 0;
  top: 100%;
  z-index: 10;
  width: 280px;
  padding: 10px 12px;
  background: #fff;
  border: 1px solid var(--line);
  border-radius: 8px;
  box-shadow: 0 4px 16px rgba(20, 40, 50, 0.12);
  font-size: 11.5px;
  line-height: 1.5;
  white-space: pre-wrap;
  color: var(--ink-2);
}

.assignee-select {
  height: 24px;
  padding: 0 6px;
  border: 1px solid var(--line);
  border-radius: 6px;
  font-size: 11.5px;
  font-family: inherit;
  background: #fff;
  min-width: 72px;
}

.assignee-text {
  font-size: 11.5px;
}

.schedule-link {
  border: none;
  background: none;
  color: var(--teal-600);
  text-decoration: underline;
  cursor: pointer;
  font-family: inherit;
  font-size: 12px;
  padding: 0;
}

.schedule-link:disabled {
  color: var(--muted);
  cursor: not-allowed;
  text-decoration: none;
}

.prog-wrap {
  display: flex;
  align-items: center;
  gap: 6px;
  min-width: 80px;
}

.prog-bar {
  flex: 1;
  height: 6px;
  background: #eef1f3;
  border-radius: 6px;
  overflow: hidden;
  min-width: 40px;
}

.prog-bar i {
  display: block;
  height: 100%;
  background: var(--teal);
}

.st {
  font-size: 11px;
  font-weight: 700;
  padding: 3px 8px;
  border-radius: 20px;
  border: none;
  font-family: inherit;
  white-space: nowrap;
}

.st:disabled {
  cursor: default;
}

.st--recv {
  color: var(--gray);
  background: var(--gray-bg);
}

.st--prog {
  color: var(--blue);
  background: var(--blue-bg);
}

.st--done {
  color: var(--green);
  background: var(--green-bg);
}

.st--delay {
  color: var(--orange);
  background: var(--orange-bg);
}

.st--cancel {
  color: var(--red);
  background: var(--red-bg);
}

.st:not(:disabled):hover {
  opacity: 0.85;
  cursor: pointer;
}

.muted {
  color: var(--muted);
  font-size: 11px;
  white-space: nowrap;
}

.empty-row {
  text-align: center;
  padding: 32px !important;
  color: var(--muted);
}

.calendar {
  padding: 16px;
}

.calendar__nav {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 12px;
}

.calendar__title {
  font-weight: 700;
  font-size: 14px;
  min-width: 120px;
  text-align: center;
}

.cal-nav-btn,
.cal-today-btn {
  height: 28px;
  padding: 0 10px;
  border: 1px solid var(--line);
  border-radius: 6px;
  background: #fff;
  cursor: pointer;
  font-family: inherit;
  font-size: 12px;
}

.cal-today-btn {
  margin-left: auto;
  color: var(--teal-600);
}

.calendar__weekdays {
  display: grid;
  grid-template-columns: repeat(7, 1fr);
  gap: 4px;
  margin-bottom: 4px;
  text-align: center;
  font-size: 11px;
  color: var(--muted);
  font-weight: 600;
}

.calendar__grid {
  display: grid;
  grid-template-columns: repeat(7, 1fr);
  gap: 4px;
}

.calendar__cell {
  min-height: 88px;
  border: 1px solid var(--line-2);
  border-radius: 6px;
  padding: 4px;
  background: #fafbfc;
}

.calendar__cell--empty {
  background: transparent;
  border-color: transparent;
}

.calendar__day {
  font-size: 11px;
  font-weight: 600;
  color: var(--ink-2);
}

.calendar__blocks {
  margin-top: 4px;
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.cal-block {
  font-size: 9px;
  color: #fff;
  padding: 2px 4px;
  border-radius: 3px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.cal-more {
  border: none;
  background: none;
  color: var(--teal-600);
  font-size: 10px;
  cursor: pointer;
  padding: 0;
  text-align: left;
  font-family: inherit;
}

.calendar__hint {
  margin: 12px 0 0;
  font-size: 11px;
  color: var(--muted);
}

.btn {
  height: 32px;
  padding: 0 14px;
  border-radius: 7px;
  font-size: 12.5px;
  font-weight: 600;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  font-family: inherit;
  cursor: pointer;
  border: 1px solid transparent;
}

.btn--sm {
  height: 28px;
  padding: 0 10px;
  font-size: 12px;
}

.btn--primary {
  background: var(--teal);
  color: #fff;
}

.btn--primary:hover {
  background: var(--teal-600);
}

.btn--ghost {
  background: #fff;
  border-color: var(--line);
  color: var(--ink-2);
}

.btn--ghost:hover {
  border-color: var(--teal-100);
  color: var(--teal-600);
}

.alert-scrim {
  position: fixed;
  inset: 0;
  background: rgba(18, 30, 34, 0.34);
  z-index: 1300;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 16px;
}

.alert-box {
  width: 340px;
  background: #fff;
  border-radius: 14px;
  padding: 24px 22px 18px;
  text-align: center;
  box-shadow: 0 6px 24px rgba(20, 40, 50, 0.12);
}

.alert-box--wide {
  width: 420px;
  text-align: left;
  padding: 16px 18px;
}

.alert-box p {
  margin: 0 0 18px;
  font-size: 13.5px;
  line-height: 1.6;
}

.alert-box__actions {
  display: flex;
  gap: 8px;
}

.alert-box__actions .btn {
  flex: 1;
}

.alert-box__head {
  display: flex;
  align-items: center;
  margin-bottom: 12px;
  font-weight: 700;
  font-size: 13px;
}

.alert-box__close {
  margin-left: auto;
  border: none;
  background: none;
  color: var(--muted);
  cursor: pointer;
  font-size: 14px;
}

.day-list {
  margin: 0;
  padding: 0;
  list-style: none;
}

.day-list li {
  padding: 8px 0;
  border-bottom: 1px solid var(--line-2);
  font-size: 12px;
  color: var(--ink-2);
}

.day-list li:last-child {
  border-bottom: none;
}
</style>
