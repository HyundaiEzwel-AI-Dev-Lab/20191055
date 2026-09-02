<script setup>
// POP-S-WBS-02 일정관리 — 계획/실행 2열, 홀딩 시 재착수, 일정변경 이력
import { computed, ref, watch } from 'vue'
import BaseModal from '@/shared/ui/BaseModal.vue'
import {
  priorityOptions,
  difficultyOptions,
  wbsMockToday,
  calcExecProgress,
  calcRestartRange,
} from '@/entities/wbs/mock/wbs'
import ScheduleReasonInputModal from '@/pages/workspace/wbs/ScheduleReasonInputModal.vue'
import WbsPlanChangeRequestDetailModal from '@/pages/workspace/wbs/WbsPlanChangeRequestDetailModal.vue'
import WbsRestartModal from '@/pages/workspace/wbs/WbsRestartModal.vue'

const props = defineProps({
  modelValue: { type: Boolean, default: false },
  task: { type: Object, default: null },
  changeRequests: { type: Array, default: () => [] },
})

const emit = defineEmits(['update:modelValue', 'save', 'open-multi-change'])

const planStart = ref('')
const planEnd = ref('')
const execStart = ref('')
const execEnd = ref('')
const taskName = ref('')
const taskDetail = ref('')
const infoCollapsed = ref(false)
const priority = ref('보통')
const difficulty = ref('중')
const remark = ref('')

const showStartAlert = ref(false)
const showCompleteAlert = ref(false)
const showDelayReason = ref(false)
const pendingCompleteDate = ref('')
const showRestartModal = ref(false)
const historyRows = ref([])
const detailRequest = ref(null)

const hasPlan = computed(() => !!(planStart.value && planEnd.value))
const isTaskNameLocked = computed(
  () => props.task?.taskType === '기획' || props.task?.taskType === '테스트',
)
const planStartLocked = computed(() => !!props.task?.planStart || !!execStart.value)
const planEndLocked = computed(() => !!props.task?.planEnd)
const isCompleted = computed(() => !!(execEnd.value || props.task?.status === '완료'))
const isHolding = computed(() => {
  if (isCompleted.value) return false
  return props.task?.status === '홀딩' || !!props.task?.holdStart
})
const canRequestChange = computed(() => hasPlan.value && !isCompleted.value)
const canStart = computed(() => hasPlan.value && !execStart.value && !isHolding.value)
const canComplete = computed(() => !!execStart.value && !execEnd.value && !isHolding.value)
const canRestart = computed(() => isHolding.value)
const canUncomplete = computed(() => !!(execEnd.value && planEnd.value && execEnd.value <= planEnd.value))

const holdPeriodText = computed(() => {
  const t = props.task
  if (!t?.holdStart || !t?.holdEnd) return ''
  return `(중단일정 ${t.holdStart} ~ ${t.holdEnd})`
})

const correctedPlanText = computed(() => {
  const t = props.task
  if (!t || !isHolding.value) return ''
  if (t.planStart && t.correctedPlanEnd) return `${t.planStart} ~ ${t.correctedPlanEnd}`
  const range = calcRestartRange(t, t.holdStart, t.holdEnd)
  if (!range.start || !range.end) return ''
  return `${range.start} ~ ${range.end}`
})

const scheduleButtonLabel = computed(() => {
  if (canRestart.value) return '재착수'
  if (!execStart.value) return '착수'
  return '완료'
})

const scheduleButtonDisabled = computed(() => {
  if (canRestart.value) return false
  return execStart.value ? !canComplete.value : !canStart.value
})

const lastUpdatedText = computed(() => {
  const at = props.task?.changedAt
  if (!at) return ''
  const date = String(at).slice(0, 10)
  const name = props.task?.changedBy
  return name ? `${date} (${name})` : date
})

const progressLabel = computed(() => {
  const n = props.task?.execProgress
  return n == null || n === '' ? '-' : `${n}%`
})

const screenLabel = computed(() => {
  const t = props.task
  if (!t) return '-'
  if (t.screenPath && t.screenPath !== '-' && t.screenName && t.screenName !== '-') {
    return `${t.screenPath}/${t.screenName}`
  }
  return t.screenName && t.screenName !== '-' ? t.screenName : t.screenPath || '-'
})

watch(
  () => props.changeRequests,
  (rows) => {
    historyRows.value = (rows || []).map((row) => ({ ...row }))
  },
  { immediate: true },
)

watch(
  () => props.modelValue,
  (open) => {
    if (!open || !props.task) return
    const t = props.task
    planStart.value = t.planStart || ''
    planEnd.value = t.planEnd || ''
    execStart.value = t.execStart || ''
    execEnd.value = t.execEnd || ''
    taskName.value = t.taskName || ''
    taskDetail.value = t.taskDetail || ''
    infoCollapsed.value = !!(t.planStart && t.planEnd)
    priority.value = t.priority || '보통'
    difficulty.value = t.difficulty || '중'
    remark.value = t.remark || ''
    showStartAlert.value = false
    showCompleteAlert.value = false
    showDelayReason.value = false
    showRestartModal.value = false
    detailRequest.value = null
    historyRows.value = (props.changeRequests || []).map((row) => ({ ...row }))
  },
)

function close() {
  emit('update:modelValue', false)
}

function buildPayload(extra = {}) {
  return {
    planStart: planStart.value || null,
    planEnd: planEnd.value || null,
    execStart: execStart.value || null,
    execEnd: execEnd.value || null,
    taskName: taskName.value.trim(),
    taskDetail: taskDetail.value,
    priority: priority.value,
    difficulty: difficulty.value,
    remark: remark.value,
    ...extra,
  }
}

function save() {
  const missing = []
  if (!taskName.value.trim()) missing.push('업무명')
  if (!planStart.value) missing.push('계획 시작일')
  if (!planEnd.value) missing.push('계획 종료일')
  if (missing.length) {
    window.alert(`${missing.join(', ')}을 입력하세요.`)
    return
  }
  if (planStart.value > planEnd.value) {
    window.alert('계획 종료일은 시작일 이후여야 합니다.')
    return
  }
  const extra = {}
  if (!props.task?.status || props.task.status === '대기') {
    if (execStart.value && !execEnd.value) extra.status = '진행중'
    else if (!execStart.value) extra.status = '대기'
  }
  if (execEnd.value) {
    extra.status = '완료'
    extra.execProgress = 100
  } else if (execStart.value) {
    extra.execProgress = calcExecProgress(
      {
        ...props.task,
        execStart: execStart.value,
        execEnd: null,
        planEnd: planEnd.value,
        status: isHolding.value ? '홀딩' : '진행중',
        excluded: false,
      },
      wbsMockToday,
    )
  }
  emit('save', buildPayload(extra))
  close()
}

function onScheduleButtonClick() {
  if (canRestart.value) {
    showRestartModal.value = true
    return
  }
  if (execStart.value) onCompleteClick()
  else onStartClick()
}

function onStartClick() {
  if (!hasPlan.value) {
    window.alert('계획일이 등록되어야 실행일정(착수/완료)를 체크할 수 있습니다.')
    return
  }
  showStartAlert.value = true
}

function applyStart() {
  const today = wbsMockToday
  execStart.value = today
  showStartAlert.value = false
  const execProgress = calcExecProgress(
    { ...props.task, execStart: today, execEnd: null, planEnd: planEnd.value, status: '진행중', excluded: false },
    today,
  )
  emit('save', buildPayload({ status: '진행중', execStart: today, execProgress }))
}

function onCompleteClick() {
  showCompleteAlert.value = true
}

function applyComplete() {
  showCompleteAlert.value = false
  const end = wbsMockToday
  pendingCompleteDate.value = end
  if (planEnd.value && end > planEnd.value) {
    showDelayReason.value = true
    return
  }
  finishComplete(end, null)
}

function finishComplete(end, reason) {
  execEnd.value = end
  emit(
    'save',
    buildPayload({
      status: '완료',
      execEnd: end,
      execProgress: 100,
      scheduleStatus: reason ? 'delay' : end < planEnd.value ? 'short' : 'normal',
      scheduleReason: reason,
    }),
  )
}

function onUncompleteClick() {
  if (
    !window.confirm(
      '실행 완료 취소하시겠습니까? 취소 시, 변경이력이 생성되며, 공정률이 재산정됩니다.',
    )
  ) {
    return
  }
  const restartedAt = execStart.value
  execEnd.value = ''
  const execProgress = calcExecProgress(
    { ...props.task, execStart: restartedAt, execEnd: null, planEnd: planEnd.value, status: '진행중', excluded: false },
    wbsMockToday,
  )
  emit(
    'save',
    buildPayload({
      status: '진행중',
      execEnd: null,
      execProgress,
      scheduleStatus: null,
      scheduleReason: null,
    }),
  )
}

function onDelayReasonSave(reason) {
  finishComplete(pendingCompleteDate.value, reason)
}

function applyRestart(row, correctedEnd) {
  const t = row || props.task
  if (!t) return
  const extra = {
    status: '진행중',
    holdStart: null,
    holdEnd: null,
    restartDate: null,
  }
  // 모달 미리보기가 쓴 보정값(예정보다 일찍 재착수 시 미실현 홀딩일수만큼 당긴 날짜)을
  // 그대로 적용한다 — t.correctedPlanEnd(홀딩 전량 반영)만 쓰면 화면에 보여준 날짜와
  // 실제 반영값이 어긋난다.
  const nextPlanEnd = correctedEnd || t.correctedPlanEnd
  if (nextPlanEnd) {
    extra.planEnd = nextPlanEnd
    planEnd.value = nextPlanEnd
  }
  extra.execProgress = calcExecProgress(
    { ...t, ...extra, execEnd: null, excluded: false },
    wbsMockToday,
  )
  emit('save', buildPayload(extra))
}

function requestStatusLabel(status) {
  if (status === 'PENDING') return '승인요청'
  if (status === 'APPROVED') return '승인'
  if (status === 'REJECTED') return '반려'
  return '취소'
}

function openChangeRequestDetail(row) {
  detailRequest.value = row
}

function onHistoryCancelClick(row) {
  if (row.status !== 'PENDING') return
  if (
    !window.confirm(
      "취소된 요청은 승인 대상에서 제외되며, 진행상태가 '취소'로 변경됩니다. 취소하시겠습니까?",
    )
  ) {
    return
  }
  applyChangeRequestCancelled(row)
}

function applyChangeRequestCancelled(row) {
  historyRows.value = historyRows.value.map((item) =>
    item.id === row.id ? { ...item, status: 'REQUEST_CANCELLED' } : item,
  )
  detailRequest.value = null
}

function openMultiChange() {
  if (!canRequestChange.value) return
  emit('open-multi-change', props.task)
  close()
}
</script>

<template>
  <BaseModal
    title="WBS 관리"
    :visible="modelValue && !!task"
    wide
    @close="close"
  >
    <template v-if="task">
      <table class="info-grid">
        <thead>
          <tr>
            <th>시스템/업무구분</th>
            <th>화면경로/화면명</th>
            <th>업무ID</th>
            <th>요구사항명</th>
            <th>업무유형/담당자</th>
            <th>공정률</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>{{ task.systemPath || '-' }}</td>
            <td>{{ screenLabel }}</td>
            <td>{{ task.wbsId || '-' }}</td>
            <td>{{ task.requirementName || '-' }}</td>
            <td>{{ task.taskType || '-' }} / {{ task.assigneeDisplay || task.assignee || '-' }}</td>
            <td>{{ task.planProgress ?? '-' }}% / {{ progressLabel }}</td>
          </tr>
        </tbody>
      </table>

      <section class="panel">
        <header class="panel__head">
          <span class="panel__title">업무 정보</span>
          <button
            type="button"
            class="fold-btn"
            :class="{ 'fold-btn--closed': infoCollapsed }"
            :aria-expanded="!infoCollapsed"
            @click="infoCollapsed = !infoCollapsed"
          >
            ▾
          </button>
        </header>
        <div v-show="!infoCollapsed" class="panel__body">
          <div class="field">
            <label class="field__lab">업무명 <i>*</i></label>
            <input
              v-model="taskName"
              class="inp inp--block"
              type="text"
              maxlength="100"
              :disabled="isTaskNameLocked"
            />
          </div>
          <div class="field">
            <label class="field__lab">업무 상세</label>
            <textarea v-model="taskDetail" class="ta" rows="2" maxlength="1000" />
          </div>
          <div class="field field--split">
            <div>
              <span class="field__lab">난이도</span>
              <div class="seg">
                <button
                  v-for="d in difficultyOptions"
                  :key="d"
                  type="button"
                  class="seg__btn"
                  :class="{ 'seg__btn--on': difficulty === d }"
                  @click="difficulty = d"
                >
                  {{ d }}
                </button>
              </div>
            </div>
            <div>
              <span class="field__lab">우선순위</span>
              <div class="seg">
                <button
                  v-for="p in priorityOptions"
                  :key="p"
                  type="button"
                  class="seg__btn"
                  :class="{ 'seg__btn--on': priority === p }"
                  @click="priority = p"
                >
                  {{ p }}
                </button>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section class="panel panel--change">
        <header class="panel__head">
          <span class="panel__title">일정 관리</span>
          <button
            type="button"
            class="btn btn--ghost btn--sm"
            :disabled="!canRequestChange"
            @click="openMultiChange"
          >
            일정변경 요청
          </button>
        </header>
        <p class="notice">
          계획일이 등록되어야 실행일정(착수/완료)를 체크할 수 있습니다. (계획일 이전 착수할 경우 착수 버튼 클릭)<br />
          착수 버튼 클릭 시, 착수일이 즉시 체크됩니다.<br />
          버튼 클릭 이후에는 [일정변경 요청] 버튼을 통해서만 일정을 변경할 수 있습니다.
        </p>
        <div class="schedule-cols">
          <div class="schedule-col">
            <span class="field__lab">계획일정 <i>*</i></span>
            <span class="range">
              <input
                v-model="planStart"
                class="inp"
                type="date"
                :max="planEnd || undefined"
                :disabled="planStartLocked"
                aria-label="계획 시작일"
                @click="$event.target.showPicker?.()"
              />
              <span class="tilde">~</span>
              <input
                v-model="planEnd"
                class="inp"
                type="date"
                :min="planStart || undefined"
                :disabled="planEndLocked"
                aria-label="계획 종료일"
                @click="$event.target.showPicker?.()"
              />
            </span>
          </div>
          <div class="schedule-col">
            <span class="field__lab">실행일정</span>
            <span v-if="execStart" class="exec-start-label">
              {{ execStart }}<template v-if="execEnd"> ~ {{ execEnd }}</template>
            </span>
            <span v-else class="exec-empty">미착수</span>
            <span v-if="holdPeriodText" class="hold-period">{{ holdPeriodText }}</span>
            <p v-if="correctedPlanText" class="corrected-plan">보정계획일 {{ correctedPlanText }}</p>
            <button
              v-if="!execEnd"
              type="button"
              class="action-btn"
              :disabled="scheduleButtonDisabled"
              @click="onScheduleButtonClick"
            >
              {{ scheduleButtonLabel }}
            </button>
            <button
              v-else-if="canUncomplete"
              type="button"
              class="uncomplete-btn"
              @click="onUncompleteClick"
            >
              완료취소
            </button>
          </div>
        </div>
      </section>

      <section v-if="hasPlan" class="panel">
        <header class="panel__head">
          <span class="panel__title">추가 정보</span>
        </header>
        <div class="panel__body">
          <label class="field">
            비고
            <textarea v-model="remark" class="ta" maxlength="500" rows="3" />
            <span class="char-count">{{ remark.length }}/500자</span>
          </label>
        </div>
      </section>

      <section v-if="hasPlan" class="panel">
        <header class="panel__head">
          <span class="panel__title">일정변경 이력</span>
        </header>
        <p class="history__title">변동 이력</p>
        <table class="history__table">
          <thead>
            <tr>
              <th>No.</th>
              <th>변경 전 계획일</th>
              <th>변경 후 계획일</th>
              <th>변동 사유</th>
              <th>등록자</th>
              <th>등록일시</th>
              <th>상태</th>
            </tr>
          </thead>
          <tbody>
            <tr v-if="!historyRows.length">
              <td colspan="7" class="history-empty">변경 이력이 없습니다.</td>
            </tr>
            <tr
              v-for="row in historyRows"
              :key="row.id"
              class="history-row"
              @click="openChangeRequestDetail(row)"
            >
              <td>{{ row.no }}</td>
              <td>{{ row.beforeStart }} ~ {{ row.beforeEnd }}</td>
              <td>{{ row.afterStart }} ~ {{ row.afterEnd }}</td>
              <td>{{ row.reason }}</td>
              <td>{{ row.registeredBy }}</td>
              <td>{{ row.registeredAt }}</td>
              <td>
                {{ requestStatusLabel(row.status) }}
                <button
                  v-if="row.status === 'PENDING'"
                  type="button"
                  class="history-cancel"
                  @click.stop="onHistoryCancelClick(row)"
                >
                  요청취소
                </button>
              </td>
            </tr>
          </tbody>
        </table>
      </section>
    </template>

    <template #footer>
      <span v-if="lastUpdatedText" class="last-modified">{{ lastUpdatedText }}</span>
      <button type="button" class="btn btn--primary" @click="save">저장</button>
    </template>
  </BaseModal>

  <ScheduleReasonInputModal
    v-model="showDelayReason"
    :scheduled-date="planEnd"
    :actual-date="pendingCompleteDate"
    @save="onDelayReasonSave"
  />
  <WbsRestartModal v-model="showRestartModal" :task="showRestartModal ? task : null" @confirm="applyRestart" />
  <WbsPlanChangeRequestDetailModal
    :request="detailRequest"
    @close="detailRequest = null"
    @cancel="applyChangeRequestCancelled"
  />

  <Teleport to="body">
    <div v-if="showStartAlert" class="alert-scrim" @mousedown.self="showStartAlert = false">
      <div class="alert-box">
        <p>{{ wbsMockToday.slice(5) }}로 착수일이 저장됩니다.<br />착수하시겠습니까?</p>
        <div class="alert-box__actions">
          <button type="button" class="btn btn--ghost" @click="showStartAlert = false">취소</button>
          <button type="button" class="btn btn--primary" @click="applyStart">확인</button>
        </div>
      </div>
    </div>
    <div v-if="showCompleteAlert" class="alert-scrim" @mousedown.self="showCompleteAlert = false">
      <div class="alert-box">
        <p>{{ wbsMockToday.slice(5) }}로 완료일이 저장됩니다.<br />완료하시겠습니까?</p>
        <div class="alert-box__actions">
          <button type="button" class="btn btn--ghost" @click="showCompleteAlert = false">취소</button>
          <button type="button" class="btn btn--primary" @click="applyComplete">확인</button>
        </div>
      </div>
    </div>
  </Teleport>
</template>

<style scoped>
.info-grid {
  width: 100%;
  border-collapse: collapse;
  margin-bottom: 14px;
  background: var(--lnb-hover);
  border-radius: var(--radius-lg);
  overflow: hidden;
}

.info-grid th,
.info-grid td {
  padding: 6px 10px;
  text-align: left;
  border: none;
}

.info-grid th {
  font-size: calc(11px + var(--font-size-offset, 0px));
  font-weight: 600;
  color: var(--lnb-muted);
  white-space: nowrap;
}

.info-grid td {
  font-size: calc(12px + var(--font-size-offset, 0px));
  font-weight: 600;
  color: var(--lnb-txt);
}

.panel {
  margin-bottom: 14px;
  padding: 14px;
  border: 1px solid var(--lnb-line);
  border-radius: var(--radius-lg);
}

.panel--change {
  background: var(--teal-50);
  border-color: var(--teal-100);
}

.panel__head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 10px;
}

.panel__title {
  margin: 0;
  font-size: calc(13px + var(--font-size-offset, 0px));
  font-weight: 700;
}

.fold-btn {
  width: 22px;
  height: 22px;
  border: none;
  background: none;
  color: var(--lnb-muted);
  font-size: calc(12px + var(--font-size-offset, 0px));
  cursor: pointer;
  transition: transform var(--transition-fast);
}

.fold-btn--closed {
  transform: rotate(-90deg);
}

.field {
  margin-bottom: 12px;
  position: relative;
}

.field__lab {
  display: flex;
  align-items: center;
  gap: 4px;
  margin-bottom: 6px;
  font-size: calc(12px + var(--font-size-offset, 0px));
  font-weight: 600;
  color: var(--lnb-txt);
}

.field__lab i {
  color: var(--red);
  font-style: normal;
}

.field--split {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 10px 16px;
}

.schedule-cols {
  display: grid;
  grid-template-columns: minmax(0, 1fr) minmax(0, 1fr);
  gap: 12px 20px;
  align-items: start;
}

.schedule-col {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 6px;
  min-width: 0;
}

.schedule-col + .schedule-col {
  padding-left: 20px;
  border-left: 1px solid var(--lnb-line);
}

.range {
  display: flex;
  align-items: center;
  gap: 6px;
  width: 100%;
}

.tilde {
  color: var(--lnb-muted);
}

.exec-start-label {
  font-size: calc(12px + var(--font-size-offset, 0px));
  font-weight: 600;
  color: var(--teal);
}

.exec-empty,
.hold-period {
  font-size: calc(12px + var(--font-size-offset, 0px));
  color: var(--lnb-muted);
}

.corrected-plan {
  margin: 0;
  font-size: calc(12px + var(--font-size-offset, 0px));
  color: var(--lnb-txt);
}

.action-btn {
  height: 32px;
  padding: 0 12px;
  border: 1px solid var(--teal);
  border-radius: var(--radius-md);
  background: var(--teal);
  color: var(--color-text-inverse);
  font-size: calc(12px + var(--font-size-offset, 0px));
  font-weight: 600;
  font-family: inherit;
  cursor: pointer;
}

.action-btn:disabled {
  border-color: var(--lnb-line);
  background: var(--lnb-hover);
  color: var(--lnb-muted);
  cursor: not-allowed;
}

.uncomplete-btn {
  height: 32px;
  padding: 0 12px;
  border: 1px solid var(--lnb-line);
  border-radius: var(--radius-md);
  background: var(--lnb-side);
  color: var(--teal);
  font-size: calc(12px + var(--font-size-offset, 0px));
  font-weight: 600;
  font-family: inherit;
  cursor: pointer;
}

.inp--block {
  width: 100%;
  box-sizing: border-box;
}

.inp {
  flex: 1;
  min-width: 0;
  height: 32px;
  padding: 0 10px;
  border: 1px solid var(--lnb-line);
  border-radius: var(--radius-md);
  font-family: inherit;
  font-size: calc(12px + var(--font-size-offset, 0px));
  background: var(--lnb-side);
  color: var(--lnb-txt);
}

.inp:disabled {
  background: var(--lnb-hover);
  color: var(--lnb-muted);
}

.ta {
  width: 100%;
  box-sizing: border-box;
  padding: 8px 10px;
  border: 1px solid var(--lnb-line);
  border-radius: var(--radius-md);
  font-family: inherit;
  font-size: calc(12px + var(--font-size-offset, 0px));
  resize: vertical;
  background: var(--lnb-side);
  color: var(--lnb-txt);
}

.seg {
  display: inline-flex;
  border: 1px solid var(--lnb-line);
  border-radius: var(--radius-md);
  overflow: hidden;
}

.seg__btn {
  height: 28px;
  padding: 0 12px;
  border: none;
  border-right: 1px solid var(--lnb-line);
  background: var(--lnb-side);
  font-family: inherit;
  font-size: calc(12px + var(--font-size-offset, 0px));
  color: var(--lnb-txt);
  cursor: pointer;
}

.seg__btn:last-child {
  border-right: none;
}

.seg__btn--on {
  background: var(--teal);
  color: var(--color-text-inverse);
  font-weight: 700;
}

.char-count {
  display: block;
  margin-top: 4px;
  text-align: right;
  font-size: calc(11px + var(--font-size-offset, 0px));
  color: var(--lnb-muted);
}

.history__title {
  margin: 0 0 8px;
  font-size: calc(12px + var(--font-size-offset, 0px));
  font-weight: 700;
}

.history__table {
  width: 100%;
  border-collapse: collapse;
  font-size: calc(11px + var(--font-size-offset, 0px));
}

.history__table thead th {
  background: var(--lnb-hover);
  text-align: center;
  padding: 8px 10px;
  border-bottom: 1px solid var(--lnb-line);
}

.history__table tbody td {
  padding: 8px 10px;
  border-bottom: 1px solid var(--lnb-line);
  text-align: center;
}

.history-empty {
  color: var(--lnb-muted);
}

.history-row {
  cursor: pointer;
}

.history-cancel {
  margin-left: 6px;
  border: none;
  background: none;
  color: var(--teal);
  font-size: calc(11px + var(--font-size-offset, 0px));
  font-weight: 700;
  cursor: pointer;
  font-family: inherit;
}

.last-modified {
  margin-right: auto;
  font-size: calc(11px + var(--font-size-offset, 0px));
  color: var(--lnb-muted);
}

.alert-scrim {
  position: fixed;
  inset: 0;
  z-index: 1300;
  background: rgba(0, 0, 0, 0.45);
  display: flex;
  align-items: center;
  justify-content: center;
}

.alert-box {
  width: 360px;
  padding: 20px;
  background: var(--lnb-side);
  border-radius: var(--radius-lg);
  box-shadow: var(--shadow-md);
}

.alert-box p {
  margin: 0 0 14px;
  font-size: calc(13px + var(--font-size-offset, 0px));
  line-height: 1.55;
}

.alert-box__actions {
  display: flex;
  justify-content: flex-end;
  gap: 8px;
}

.btn--primary {
  background: var(--teal);
  border-color: var(--teal);
  color: var(--color-text-inverse);
}

.btn--primary:hover {
  background: var(--teal-600);
}

.btn--ghost {
  background: var(--lnb-side);
  border-color: var(--lnb-line);
  color: var(--lnb-txt);
}
</style>
