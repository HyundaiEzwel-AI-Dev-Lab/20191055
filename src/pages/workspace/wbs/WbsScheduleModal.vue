<script setup>
// POP-S-WBS-02 일정관리 (SB 119~121) — 일정변경은 다중 일정 변경 UI(POP-S-WBS-05)로 위임
import { computed, ref, watch } from 'vue'
import BaseModal from '@/shared/ui/BaseModal.vue'
import { priorityOptions, difficultyOptions, wbsMockToday, calcExecProgress } from '@/entities/wbs/mock/wbs'

const props = defineProps({
  modelValue: { type: Boolean, default: false },
  task: { type: Object, default: null },
})

const emit = defineEmits(['update:modelValue', 'save', 'open-multi-change'])

const planStart = ref('')
const planEnd = ref('')
const execStart = ref('')
const execEnd = ref('')
const taskName = ref('')
const taskDetail = ref('')
const showTaskInfo = ref(true)
const useUnitTest = ref(true)
const confirmed = ref(false)
const priority = ref('보통')
const difficulty = ref('중')
const remark = ref('')

const showStartAlert = ref(false)
const showCompleteAlert = ref(false)
const showDelayReason = ref(false)
const delayReason = ref('')
const pendingCompleteDate = ref('')

const hasPlan = computed(() => !!(planStart.value && planEnd.value))
const isInitial = computed(() => !props.task?.planStart && !props.task?.planEnd)
const isCompleted = computed(() => !!(execEnd.value || props.task?.status === '완료'))
const planLocked = computed(() => {
  if (confirmed.value) return true
  if (!planStart.value) return false
  return planStart.value <= wbsMockToday
})
const canRequestChange = computed(() => hasPlan.value && !isCompleted.value)
const canUncomplete = computed(() => !!(execEnd.value && planEnd.value && execEnd.value <= planEnd.value))
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
    showTaskInfo.value = true
    useUnitTest.value = t.useUnitTest !== false
    confirmed.value = t.confirmed === '확정' || t.confirmed === true
    priority.value = t.priority || '보통'
    difficulty.value = t.difficulty || '중'
    remark.value = t.remark || ''
    showStartAlert.value = false
    showCompleteAlert.value = false
    showDelayReason.value = false
    delayReason.value = ''
  },
)

function close() {
  emit('update:modelValue', false)
}

function missingPlanField() {
  if (!planStart.value && !planEnd.value) return '시작일, 종료일'
  if (!planStart.value) return '시작일'
  if (!planEnd.value) return '종료일'
  return ''
}

function buildPayload(extra = {}) {
  return {
    planStart: planStart.value || null,
    planEnd: planEnd.value || null,
    execStart: execStart.value || null,
    execEnd: execEnd.value || null,
    taskName: taskName.value.trim(),
    taskDetail: taskDetail.value,
    useUnitTest: useUnitTest.value,
    confirmed: confirmed.value ? '확정' : '-',
    priority: priority.value,
    difficulty: difficulty.value,
    remark: remark.value,
    ...extra,
  }
}

function save() {
  if (!taskName.value.trim()) {
    window.alert('업무명을 입력하세요.')
    return
  }
  const miss = missingPlanField()
  if (miss) {
    window.alert(`${miss}을 입력하세요.`)
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
      { ...props.task, execStart: execStart.value, execEnd: null, planEnd: planEnd.value, status: '진행중', excluded: false },
      wbsMockToday,
    )
  }
  emit('save', buildPayload(extra))
  close()
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
    delayReason.value = ''
    showDelayReason.value = true
    return
  }
  finishComplete(end, null)
}

function finishComplete(end, reason) {
  execEnd.value = end
  const payload = buildPayload({
    status: '완료',
    execEnd: end,
    execProgress: 100,
    scheduleStatus: reason ? 'delay' : end < planEnd.value ? 'short' : 'normal',
    scheduleReason: reason,
  })
  emit('save', payload)
  showDelayReason.value = false
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

function saveDelayReason() {
  if (!delayReason.value.trim()) {
    window.alert('사유를 입력해 주세요.')
    return
  }
  finishComplete(pendingCompleteDate.value, delayReason.value.trim())
}

/** SB 123: 단건도 다중 일정 변경 UI 유지 */
function openMultiChange() {
  if (!canRequestChange.value) return
  emit('open-multi-change', props.task)
  close()
}
</script>

<template>
  <BaseModal
    title="일정 관리"
    :visible="modelValue && !!task"
    wide
    @close="close"
  >
    <template v-if="task">
      <p v-if="task.changedAt" class="last-modified">
        최종수정 {{ task.changedAt }} ({{ task.changedBy }})
      </p>

      <!-- WBS 정보 (SB 119) -->
      <div class="info-grid">
        <div class="info-grid__item">
          <span class="info-grid__lab">시스템/업무구분</span>
          <span class="info-grid__val">{{ task.systemPath || '-' }}</span>
        </div>
        <div class="info-grid__item">
          <span class="info-grid__lab">화면경로/화면명</span>
          <span class="info-grid__val">{{ screenLabel }}</span>
        </div>
        <div class="info-grid__item">
          <span class="info-grid__lab">업무 ID</span>
          <span class="info-grid__val">{{ task.wbsId || '-' }}</span>
        </div>
        <div class="info-grid__item">
          <span class="info-grid__lab">요구사항명</span>
          <span class="info-grid__val">{{ task.requirementName || '-' }}</span>
        </div>
        <div class="info-grid__item">
          <span class="info-grid__lab">업무유형 / 담당자</span>
          <span class="info-grid__val">
            {{ task.taskType || '-' }} / {{ task.assigneeDisplay || task.assignee || '-' }}
          </span>
        </div>
        <div class="info-grid__item">
          <span class="info-grid__lab">공정률</span>
          <span class="info-grid__val">{{ progressLabel }}</span>
        </div>
      </div>

      <!-- 업무 정보 (SB v1.0) -->
      <section class="panel">
        <div class="panel__head">
          <h4 class="panel__title">업무 정보</h4>
          <button
            type="button"
            class="fold-btn"
            :class="{ 'fold-btn--closed': !showTaskInfo }"
            @click="showTaskInfo = !showTaskInfo"
          >
            ▾
          </button>
        </div>
        <template v-if="showTaskInfo">
          <div class="field">
            <label class="field__lab">업무명 <i>*</i></label>
            <input v-model="taskName" class="inp inp--block" type="text" maxlength="100" />
          </div>
          <div class="field">
            <label class="field__lab">업무 상세</label>
            <textarea v-model="taskDetail" class="ta" rows="3" maxlength="1000" />
          </div>
          <div class="field field--split">
            <div>
              <label class="field__lab">난이도</label>
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
              <label class="field__lab">우선순위</label>
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
        </template>
      </section>

      <!-- 일정 관리 -->
      <section class="panel">
        <div class="panel__head">
          <h4 class="panel__title">일정 관리</h4>
          <button
            type="button"
            class="btn btn--ghost btn--sm"
            :disabled="!canRequestChange"
            @click="openMultiChange"
          >
            일정변경 요청
          </button>
        </div>

        <p class="guide">
          · 계획일이 등록되어야 실행일정(착수/완료)를 체크할 수 있습니다.
          (계획일 이전 착수할 경우 착수 버튼 클릭)<br />
          · 착수 버튼 클릭 시, 착수일이 즉시 체크됩니다.
          버튼 클릭 후에는 [일정변경 요청] 버튼을 통해서만 일정을 변경할 수 있습니다.
        </p>

        <div class="field">
          <label class="field__lab">계획일정 <i>*</i></label>
          <div class="date-row date-row--narrow">
            <input
              v-model="planStart"
              class="inp"
              type="date"
              :disabled="!isInitial && planLocked"
              @click="$event.target.showPicker?.()"
            />
            <span>~</span>
            <input
              v-model="planEnd"
              class="inp"
              type="date"
              :disabled="!isInitial && planLocked"
              @click="$event.target.showPicker?.()"
            />
          </div>
        </div>

        <div v-if="hasPlan" class="field">
          <label class="field__lab">실행일정</label>
          <div class="exec-row">
            <template v-if="!execStart">
              <button type="button" class="btn btn--primary btn--sm" @click="onStartClick">
                착수
              </button>
            </template>
            <template v-else-if="!execEnd">
              <span class="exec-date">{{ execStart }}</span>
              <span>~</span>
              <button type="button" class="btn btn--primary btn--sm" @click="onCompleteClick">
                완료
              </button>
            </template>
            <template v-else>
              <span class="exec-date">{{ execStart }}</span>
              <span>~</span>
              <span class="exec-date">{{ execEnd }}</span>
              <button
                v-if="canUncomplete"
                type="button"
                class="btn btn--ghost btn--sm"
                @click="onUncompleteClick"
              >
                완료취소
              </button>
            </template>
          </div>
        </div>
      </section>

      <!-- 추가 정보 (SB 120) — 계획 등록 후 -->
      <section v-if="hasPlan || !isInitial" class="panel">
        <h4 class="panel__title">추가 정보</h4>

        <div class="field">
          <label class="field__lab">비고 (개발내용/작업이슈)</label>
          <textarea
            v-model="remark"
            class="ta"
            rows="3"
            maxlength="500"
            placeholder="자동계산 공정률이 실제와 괴리가 클 때 메모를 작성하세요."
          />
          <span class="char-count">{{ remark.length }} / 500자</span>
        </div>
      </section>

    </template>

    <template #footer>
      <button type="button" class="btn btn--ghost" @click="close">취소</button>
      <button type="button" class="btn btn--primary" @click="save">저장</button>
    </template>
  </BaseModal>

  <!-- 확정 alert (SB 120 3b-1) -->
  <Teleport to="body">
    <div v-if="showConfirmAlert" class="alert-scrim" @mousedown.self="showConfirmAlert = false">
      <div class="alert-box">
        <p>
          확정 후 상태 재변경이 불가합니다.<br />
          (단위테스트 사용 시 케이스 자동 생성)<br />
          변경하시겠습니까?
        </p>
        <div class="alert-box__actions">
          <button type="button" class="btn btn--ghost" @click="showConfirmAlert = false">
            취소
          </button>
          <button type="button" class="btn btn--primary" @click="applyConfirm">확인</button>
        </div>
      </div>
    </div>

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
          <button type="button" class="btn btn--ghost" @click="showCompleteAlert = false">
            취소
          </button>
          <button type="button" class="btn btn--primary" @click="applyComplete">확인</button>
        </div>
      </div>
    </div>

    <!-- POP-S-WBS-10 일정 변동 사유 입력 (SB 121) -->
    <div v-if="showDelayReason" class="alert-scrim" @mousedown.self="showDelayReason = false">
      <div class="alert-box alert-box--form">
        <h4>일정 변동 사유 입력</h4>
        <p class="alert-box__msg">
          실제 완료일이 계획 완료일을 경과하였습니다.<br />
          사유를 입력해 주세요.
        </p>
        <textarea
          v-model="delayReason"
          class="ta"
          rows="3"
          maxlength="200"
          placeholder="사유를 입력하세요"
        />
        <span class="char-count">{{ delayReason.length }} / 200자</span>
        <div class="alert-box__actions">
          <button type="button" class="btn btn--ghost" @click="showDelayReason = false">
            취소
          </button>
          <button type="button" class="btn btn--primary" @click="saveDelayReason">저장</button>
        </div>
      </div>
    </div>
  </Teleport>
</template>

<style scoped>
.last-modified {
  margin: 0 0 10px;
  font-size: calc(11px + var(--font-size-offset, 0px));
  color: var(--lnb-muted);
  text-align: right;
}

.info-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 8px;
  margin-bottom: 14px;
  padding: 12px 14px;
  background: var(--lnb-hover);
  border-radius: var(--radius-lg);
}

.info-grid__item {
  display: flex;
  flex-direction: column;
  gap: 2px;
  min-width: 0;
}

.info-grid__lab {
  font-size: calc(11px + var(--font-size-offset, 0px));
  color: var(--lnb-muted);
  font-weight: 600;
}

.info-grid__val {
  font-size: calc(12px + var(--font-size-offset, 0px));
  font-weight: 600;
  color: var(--lnb-txt);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
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

.panel__title {
  margin: 0 0 10px;
  font-size: calc(13px + var(--font-size-offset, 0px));
  font-weight: 700;
}

.panel__head .panel__title {
  margin: 0;
}

.panel__actions {
  display: flex;
  justify-content: flex-end;
  gap: 8px;
  margin-top: 12px;
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

.date-row,
.exec-row {
  display: flex;
  align-items: center;
  gap: 8px;
}

.date-row--narrow {
  max-width: 300px;
}

.date-row--narrow .inp {
  flex: 0 0 135px;
}

.inp--block {
  width: 100%;
  box-sizing: border-box;
}

.inp {
  flex: 1;
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

.inp--sm {
  flex: 0 0 100px;
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

.guide {
  margin: 0 0 12px;
  padding: 10px 12px;
  background: var(--teal-50);
  border-radius: var(--radius-md);
  font-size: calc(11px + var(--font-size-offset, 0px));
  line-height: 1.6;
  color: var(--teal-700);
}

.exec-date {
  font-size: calc(13px + var(--font-size-offset, 0px));
  font-weight: 600;
}

.badge {
  margin-left: 6px;
  font-size: calc(11px + var(--font-size-offset, 0px));
  font-weight: 700;
  color: var(--blue);
  background: var(--blue-bg);
  padding: 2px 8px;
  border-radius: 20px;
}

.field--split {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 10px 16px;
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

.tabs {
  display: flex;
  gap: 4px;
  margin-bottom: 12px;
}

.tabs__btn {
  height: 30px;
  padding: 0 14px;
  border: 1px solid var(--lnb-line);
  border-radius: var(--radius-md);
  background: var(--lnb-side);
  font-family: inherit;
  font-size: calc(12px + var(--font-size-offset, 0px));
  cursor: pointer;
  color: var(--lnb-txt);
}

.tabs__btn--on {
  background: var(--teal);
  border-color: var(--teal);
  color: var(--color-text-inverse);
  font-weight: 700;
}

.readonly {
  font-size: calc(13px + var(--font-size-offset, 0px));
  font-weight: 600;
  color: var(--lnb-txt);
  padding: 6px 0;
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

.alert-box--form {
  width: 420px;
}

.alert-box h4 {
  margin: 0 0 10px;
  font-size: calc(15px + var(--font-size-offset, 0px));
}

.alert-box p,
.alert-box__msg {
  margin: 0 0 14px;
  font-size: calc(13px + var(--font-size-offset, 0px));
  line-height: 1.55;
}

.alert-box__actions {
  display: flex;
  justify-content: flex-end;
  gap: 8px;
  margin-top: 14px;
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
  background: #ffffff;
  border-color: var(--lnb-line);
  color: var(--lnb-txt);
}
</style>
