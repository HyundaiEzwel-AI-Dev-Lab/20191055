<script setup>
// POP-S-WBS-05 일정 변경 — 단건/다건 공통 UI (탭 → 안내 → 사유 → 대상 → 승인)
import { computed, ref, watch } from 'vue'
import BaseModal from '@/shared/ui/BaseModal.vue'
import {
  formatDateRange,
  bulkPlanChangeReasons,
  planChangeReasons,
  holdChangeReasons,
  approverOptions,
  assigneeOptions,
  calcRestartRange,
  wbsMockToday,
} from '@/entities/wbs/mock/wbs'

const props = defineProps({
  modelValue: { type: Boolean, default: false },
  tasks: { type: Array, default: () => [] },
  mode: { type: String, default: 'create' },
  readonly: { type: Boolean, default: false },
})

const emit = defineEmits(['update:modelValue', 'request'])

const tab = ref('plan')
/** @type {import('vue').Ref<Array<Record<string, any>>>} */
const rows = ref([])
const reason = ref('')
const reasonDetail = ref('')
const collaborator = ref('')
const approver = ref('')

const isDetail = computed(() => props.mode === 'detail')
const isReadonly = computed(() => props.readonly || isDetail.value)

// 홀딩 중인 업무는 계획일 변경 탭에서 뺀다(h-pms 2026-08-21 기획 확정 — 재착수 후에만 변경 가능).
// holdingSince는 "현재 홀딩 중인 상태"(t.holdStart)이고, row.holdStart(아래 built)는 이번에 새로
// 입력하는 중단 시작일이라 서로 다른 값이다 — 섞어 쓰면 이미 걸린 홀딩 기간이 새 요청 폼에 그대로
// 떠버린다.
const planRows = computed(() => rows.value.filter((row) => !row.execEnd && !row.holdingSince))
const holdRows = computed(() => rows.value.filter((row) => row.execStart && !row.execEnd))
const activeRows = computed(() => (tab.value === 'plan' ? planRows.value : holdRows.value))
// 선택 업무에 홀딩 중인 건이 있는지 — 계획일 변경 탭에서 빠진 이유를 안내문으로 알려주기 위함이다.
const hasHoldingTarget = computed(() => rows.value.some((row) => !row.execEnd && !!row.holdingSince))
const count = computed(() => activeRows.value.length)
const isMulti = computed(() => count.value > 1)
const isOther = computed(() => String(reason.value).includes('기타'))
const plannerOptions = computed(() => assigneeOptions.기획 || [])
const collaboratorEnabled = computed(() => !isMulti.value && plannerOptions.value.length >= 2)
// h-pms BULK_ALLOWED_*_REASON_CODES — 다건 변경은 사전 조율 전제라 사유를 "선행 업무 일정 변경"/
// "기타"로만 좁힌다. '착수일 미체크'(과거일 허용 예외)는 다건에서 제외돼 다건은 항상 과거 불가가 된다.
const BULK_ALLOWED_HOLD_REASONS = ['선행 업무 일정 변경', '기타(직접입력)']
const reasonOptions = computed(() => {
  if (tab.value === 'hold') {
    return isMulti.value ? holdChangeReasons.filter((r) => BULK_ALLOWED_HOLD_REASONS.includes(r)) : holdChangeReasons
  }
  return isMulti.value ? bulkPlanChangeReasons.filter((r) => r !== '착수일 미체크') : planChangeReasons
})
const bypassStartLock = computed(() => reason.value === '착수일 미체크')
// BR-24 — 변경 시작일은 과거로 잡을 수 없다. 예외는 '착수일 미체크' 사유뿐이다.
const needsFutureStart = computed(() => !bypassStartLock.value)
const startMinValue = computed(() => (bypassStartLock.value ? undefined : wbsMockToday))

watch(
  () => [props.modelValue, props.tasks, props.mode],
  ([open]) => {
    if (!open) return
    reason.value = ''
    reasonDetail.value = ''
    collaborator.value = ''
    approver.value = ''
    const built = (props.tasks || []).map((t) => ({
      ...t,
      changeStart: t.planStart || '',
      changeEnd: t.planEnd || '',
      holdStart: '',
      holdEnd: '',
      // 이미 걸려 있는 홀딩의 중단 시작일(현재 상태) — 입력값(holdStart)이 아니라 계획일 변경
      // 탭 제외 판정에만 쓴다.
      holdingSince: t.status === '홀딩' ? (t.holdStart ?? null) : null,
    }))
    rows.value = built
    const hasPlanTarget = built.some((row) => !row.execEnd && !row.holdingSince)
    const hasHoldTarget = built.some((row) => row.execStart && !row.execEnd)
    tab.value = !hasPlanTarget && hasHoldTarget ? 'hold' : 'plan'
  },
)

function close() {
  emit('update:modelValue', false)
}

function currentPlanText(row) {
  return formatDateRange(row.planStart, row.planEnd)
}

function currentExecText(row) {
  if (!row.execStart) return '-'
  return formatDateRange(row.execStart, row.execEnd)
}

function isStartLocked(row) {
  return !bypassStartLock.value && !!row.execStart
}

function lockedStartValue(row) {
  return row.execStart || row.planStart || row.changeStart
}

function restartInfo(row) {
  if (!row.holdStart || !row.holdEnd) return { start: '', end: '' }
  return calcRestartRange(row, row.holdStart, row.holdEnd)
}

function holdStartMin(row) {
  return row.execStart && row.execStart > wbsMockToday ? row.execStart : wbsMockToday
}

// 중단 시작일 상한 — 중단 종료일과 계획종료일 중 이른 쪽(계획종료일이 지난 뒤 홀딩이 필요하면
// 계획일정을 먼저 변경해야 한다, 2026-08-21 기획 확정). 중단 종료일에는 상한이 없다.
function holdStartMax(row) {
  const limits = [row.holdEnd, row.planEnd].filter(Boolean)
  return limits.length ? limits.reduce((a, b) => (a < b ? a : b)) : undefined
}

function onTabChange(next) {
  tab.value = next
  reason.value = ''
  reasonDetail.value = ''
}

function submit() {
  if (isDetail.value) {
    close()
    return
  }
  if (!approver.value) {
    window.alert('승인(팀장)을 입력하세요.')
    return
  }
  if (!reason.value) {
    window.alert('변경 사유를 입력하세요.')
    return
  }
  if (isOther.value && !reasonDetail.value.trim()) {
    window.alert('변경 사유 상세를 입력하세요.')
    return
  }
  if (collaboratorEnabled.value && !collaborator.value) {
    window.alert("담당 기획자를 '협조자'로 지정하세요.")
    return
  }

  const reasonText = isOther.value ? reasonDetail.value.trim() : reason.value

  if (tab.value === 'plan') {
    if (!planRows.value.length) {
      window.alert('계획일 변경 대상 업무가 없습니다.')
      return
    }
    for (const row of planRows.value) {
      const start = isStartLocked(row) ? lockedStartValue(row) : row.changeStart
      const end = row.changeEnd
      if ((!isStartLocked(row) && !start) || !end) {
        window.alert(`${row.wbsId}: 변경 일정을 입력하세요.`)
        return
      }
      if (start && end && start > end) {
        window.alert(`${row.wbsId}: 종료일은 시작일 이후여야 합니다.`)
        return
      }
      // BR-24 이중 방어 — 달력 :min을 우회한 경우(사유를 나중에 바꿈, 수기 입력)를 여기서 막는다.
      if (!isStartLocked(row) && needsFutureStart.value && start && start < wbsMockToday) {
        window.alert(`${row.wbsId}: 과거 일자는 '착수일 미체크' 사유에서만 입력할 수 있습니다.`)
        return
      }
    }
    if (
      !window.confirm(
        '계획일 변경 시 변경이력이 생성되며, 공정률 및 일정 상태가 재산정됩니다.\n계획일을 변경하시겠습니까?',
      )
    ) {
      return
    }

    const payloadTasks = planRows.value.map((row) => ({
      ...row,
      newPlanStart: isStartLocked(row) ? lockedStartValue(row) : row.changeStart,
      newPlanEnd: row.changeEnd,
    }))

    emit('request', {
      type: '계획일 변경',
      reason: reasonText,
      approver: approver.value,
      collaborator: isMulti.value ? '' : collaborator.value,
      tasks: payloadTasks,
      planStart: payloadTasks[0]?.newPlanStart,
      planEnd: payloadTasks[0]?.newPlanEnd,
    })
  } else {
    if (!holdRows.value.length) {
      window.alert('실행 홀딩 대상 업무가 없습니다.')
      return
    }
    for (const row of holdRows.value) {
      if (!row.holdStart || !row.holdEnd) {
        window.alert(`${row.wbsId}: 중단 일정을 입력하세요.`)
        return
      }
      if (row.holdStart > row.holdEnd) {
        window.alert(`${row.wbsId}: 중단 종료일은 시작일 이후여야 합니다.`)
        return
      }
      if (row.execStart && row.holdStart < row.execStart) {
        window.alert(`${row.wbsId}: 중단 시작일은 착수일(${row.execStart}) 이후여야 합니다.`)
        return
      }
      if (row.holdStart < wbsMockToday) {
        window.alert(`${row.wbsId}: 중단 시작일은 오늘 이전일 수 없습니다.`)
        return
      }
      // 홀딩은 계획일정 안에서 시작해야 한다(2026-08-21 기획 확정). 종료일은 계획종료일을 넘어도
      // 된다 — 그만큼 밀린다.
      if (row.planEnd && row.holdStart > row.planEnd) {
        window.alert(
          `${row.wbsId}: 중단 시작일은 계획종료일(${row.planEnd}) 이후로 지정할 수 없습니다. 계획일정을 먼저 변경하세요.`,
        )
        return
      }
    }
    if (
      !window.confirm(
        "홀딩 처리 시 공정률 산정이 중지되며, 상태가 '홀딩'으로 변경됩니다.\n업무를 홀딩 처리하시겠습니까?",
      )
    ) {
      return
    }

    const payloadTasks = holdRows.value.map((row) => ({
      ...row,
      restart: calcRestartRange(row, row.holdStart, row.holdEnd),
    }))

    emit('request', {
      type: '실행 홀딩',
      reason: reasonText,
      approver: approver.value,
      collaborator: isMulti.value ? '' : collaborator.value,
      tasks: payloadTasks,
      planStart: payloadTasks[0]?.planStart,
      planEnd: payloadTasks[0]?.planEnd,
    })
  }

  window.alert(
    `${count.value}건의 일정변경이 승인요청되었습니다.\n(요청자에게 웹메일이 발송됩니다 — PAG-S-WBS-09)`,
  )
  close()
}
</script>

<template>
  <BaseModal :title="isDetail ? '일정 변경 요청 상세' : '일정 변경'" :visible="modelValue" wide @close="close">
    <div v-if="!isDetail" class="tabs">
      <button
        type="button"
        class="tabs__btn"
        :class="{ 'tabs__btn--on': tab === 'plan' }"
        :disabled="!planRows.length"
        :title="!planRows.length ? '계획일 변경 대상 업무가 없습니다.' : undefined"
        @click="onTabChange('plan')"
      >
        계획일 변경
      </button>
      <button
        type="button"
        class="tabs__btn"
        :class="{ 'tabs__btn--on': tab === 'hold' }"
        :disabled="!holdRows.length"
        :title="!holdRows.length ? '실행 홀딩 대상 업무가 없습니다.' : undefined"
        @click="onTabChange('hold')"
      >
        실행 홀딩
      </button>
    </div>
    <p v-else class="detail-tab-label">{{ tab === 'hold' ? '실행 홀딩' : '계획일 변경' }}</p>

    <ul class="guide notice">
      <template v-if="isDetail">
        <li>승인자를 바꾸려면 요청을 취소하고 다시 요청하세요.</li>
        <li v-if="isReadonly">승인 완료된 요청은 수정할 수 없습니다.</li>
      </template>
      <template v-else>
        <li v-if="collaboratorEnabled">
          변경 시, 담당 팀장의 승인이 필요합니다. (기획자 배정된 경우, 담당 기획자 '협조자' 지정 필수)
        </li>
        <li v-else>
          변경 시, 담당 팀장의 승인이 필요합니다. (다건 변경은 사전 조율 전제로 협조자 지정을 생략합니다)
        </li>
        <li>
          착수 전 업무는 변경 시작일·종료일 모두 입력 가능하고, 착수 후 업무는 종료일만 변경할 수 있습니다(시작일 칸엔 착수일 표시).
        </li>
        <li v-if="tab === 'plan' && needsFutureStart">변경 시작일은 오늘 이후만 선택할 수 있습니다. 과거 일자는 '착수일 미체크' 사유에서만 입력 가능합니다.</li>
        <!-- 홀딩 중 업무가 계획일 변경 탭에서 빠지므로(planRows) 왜 안 보이는지 알려준다. -->
        <li v-if="tab === 'plan' && hasHoldingTarget">홀딩 중인 업무는 계획일정을 변경할 수 없습니다. 재착수 후 요청하세요.</li>
        <li v-if="tab === 'hold'">중단 시작일은 계획종료일 이후로 지정할 수 없습니다. 홀딩 일수는 주말·공휴일을 제외한 영업일로 산정됩니다.</li>
      </template>
    </ul>

    <h3 class="sec-title">일정 변경 사유</h3>
    <div class="reason-field">
      <label>
        변경 사유 <i class="req">*</i>
        <select v-model="reason" class="inp" :disabled="isReadonly">
          <option value="">사유 선택</option>
          <option v-for="r in reasonOptions" :key="r" :value="r">{{ r }}</option>
        </select>
      </label>
      <label v-if="isOther" class="reason-detail">
        상세 사유
        <textarea
          v-model="reasonDetail"
          class="ta"
          maxlength="500"
          rows="3"
          :disabled="isReadonly"
        />
        <span class="char-count">{{ reasonDetail.length }}/500</span>
      </label>
    </div>

    <h3 class="sec-title">변경 대상 (총 {{ count }}건)</h3>
    <div class="table-wrap">
      <table v-if="tab === 'plan'" class="rows-table data-table">
        <thead>
          <tr>
            <th>업무명</th>
            <th>업무 상세</th>
            <th>업무유형</th>
            <th>담당자</th>
            <th>공정률</th>
            <th colspan="2">현재일정</th>
            <th colspan="2" class="target-cols">변경일정</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="row in planRows" :key="row.id">
            <td class="name">{{ row.taskName || row.requirementName || '-' }}</td>
            <td class="task-detail-cell">{{ row.taskDetail || '-' }}</td>
            <td>{{ row.taskType }}</td>
            <td>{{ row.assigneeDisplay || '-' }}</td>
            <td>{{ row.planProgress != null ? `${row.planProgress}%` : '-' }}</td>
            <td>{{ row.planStart || '-' }}</td>
            <td>{{ row.planEnd || '-' }}</td>
            <td class="target-cols">
              <input
                v-if="!isStartLocked(row)"
                v-model="row.changeStart"
                class="inp inp--date"
                type="date"
                :min="startMinValue"
                :disabled="isReadonly"
                @click="$event.target.showPicker?.()"
              />
              <span v-else class="locked">{{ lockedStartValue(row) }}</span>
            </td>
            <td class="target-cols">
              <input
                v-model="row.changeEnd"
                class="inp inp--date"
                type="date"
                :disabled="isReadonly"
                @click="$event.target.showPicker?.()"
              />
            </td>
          </tr>
          <tr v-if="!planRows.length">
            <td colspan="9" class="empty">계획일 변경 대상 업무가 없습니다.</td>
          </tr>
        </tbody>
      </table>

      <table v-else class="rows-table data-table">
        <thead>
          <tr>
            <th>업무명</th>
            <th>업무 상세</th>
            <th>업무유형</th>
            <th>담당자</th>
            <th>공정률</th>
            <th>현재 계획일정</th>
            <th>현재 실행일정</th>
            <th colspan="2" class="target-cols">중단일정</th>
            <th colspan="2">재착수 예상일정</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="row in holdRows" :key="row.id">
            <td class="name">{{ row.taskName || row.requirementName || '-' }}</td>
            <td class="task-detail-cell">{{ row.taskDetail || '-' }}</td>
            <td>{{ row.taskType }}</td>
            <td>{{ row.assigneeDisplay || '-' }}</td>
            <td>{{ row.planProgress != null ? `${row.planProgress}%` : '-' }}</td>
            <td>{{ currentPlanText(row) }}</td>
            <td>{{ currentExecText(row) }}</td>
            <td class="target-cols">
              <input
                v-model="row.holdStart"
                class="inp inp--date"
                type="date"
                :min="holdStartMin(row)"
                :max="holdStartMax(row)"
                :disabled="isReadonly"
                @click="$event.target.showPicker?.()"
              />
            </td>
            <td class="target-cols">
              <input
                v-model="row.holdEnd"
                class="inp inp--date"
                type="date"
                :min="row.holdStart || undefined"
                :disabled="isReadonly"
                @click="$event.target.showPicker?.()"
              />
            </td>
            <td class="restart">{{ restartInfo(row).start || '-' }}</td>
            <td class="restart">{{ restartInfo(row).end || '-' }}</td>
          </tr>
          <tr v-if="!holdRows.length">
            <td colspan="11" class="empty">실행 홀딩 대상 업무가 없습니다.</td>
          </tr>
        </tbody>
      </table>
    </div>

    <h3 class="sec-title">일정 변경 및 승인</h3>
    <div class="approval-row">
      <label>
        공유(기획/현업)
        <select
          v-model="collaborator"
          class="inp"
          :disabled="!collaboratorEnabled || isDetail"
          :title="!collaboratorEnabled ? '기획자 2명 이상 배정된 프로젝트에서만 활성화됩니다.' : undefined"
        >
          <option value="">선택</option>
          <option v-for="p in plannerOptions" :key="p" :value="p">{{ p }}</option>
        </select>
      </label>
      <label>
        승인(팀장) <i class="req">*</i>
        <select v-model="approver" class="inp" :disabled="isDetail">
          <option value="">선택</option>
          <option v-for="a in approverOptions" :key="a" :value="a">{{ a }}</option>
        </select>
      </label>
    </div>

    <template #footer>
      <button type="button" class="btn btn--ghost" @click="close">{{ isDetail ? '닫기' : '취소' }}</button>
      <button v-if="!isDetail" type="button" class="btn btn--primary" @click="submit">
        {{ count }}건 승인요청
      </button>
    </template>
  </BaseModal>
</template>

<style scoped>
.detail-tab-label {
  margin: 0 0 10px;
  font-size: calc(13px + var(--font-size-offset, 0px));
  font-weight: 700;
  color: var(--lnb-txt);
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

.tabs__btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

/* 안내 박스 자체는 전역 .notice가 준다(h-pms 이식). <ul>이라 불릿 들여쓰기만 더한다. */
.guide {
  padding-left: 2.2rem;
  font-size: calc(11px + var(--font-size-offset, 0px));
  line-height: 1.6;
}

.sec-title {
  margin: 14px 0 8px;
  font-size: calc(13px + var(--font-size-offset, 0px));
  font-weight: 700;
  color: var(--lnb-txt);
}

.req {
  color: var(--red);
  font-style: normal;
}

.reason-field {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
  margin-bottom: 12px;
}

.reason-field label,
.approval-row label {
  display: flex;
  flex-direction: column;
  gap: 4px;
  font-size: calc(12px + var(--font-size-offset, 0px));
  color: var(--lnb-txt);
}

.reason-detail {
  flex: 1 1 22rem;
}

.table-wrap {
  margin-bottom: 12px;
  max-height: 280px;
  overflow: auto;
  border: 1px solid var(--lnb-line);
  border-radius: var(--radius-md);
}

/* 배경·padding·정렬·글자크기는 전역 .data-table이 준다 — 고정 헤더에 필요한 것만 얹는다. */
.rows-table {
  white-space: nowrap;
}

.rows-table th {
  position: sticky;
  top: 0;
  z-index: 1;
}

.name {
  max-width: 160px;
  white-space: normal;
  word-break: break-word;
}

.task-detail-cell {
  min-width: 18rem;
  max-width: 26rem;
  width: 28%;
  white-space: normal;
  overflow-wrap: anywhere;
}

.target-cols {
  background: var(--teal-50);
  width: 1%;
  padding-left: 8px;
  padding-right: 8px;
}

.inp {
  width: 100%;
  height: 32px;
  padding: 0 10px;
  border: 1px solid var(--lnb-line);
  border-radius: var(--radius-md);
  font-family: inherit;
  font-size: calc(12px + var(--font-size-offset, 0px));
  background: var(--lnb-side);
  color: var(--lnb-txt);
  box-sizing: border-box;
}

.inp:disabled {
  background: var(--lnb-hover);
  color: var(--lnb-muted);
}

.inp--date {
  width: 128px;
  height: 28px;
  padding: 0 6px;
  font-size: calc(11px + var(--font-size-offset, 0px));
}

.locked {
  display: inline-block;
  min-width: 88px;
  font-weight: 600;
  color: var(--lnb-muted);
}

.restart {
  font-size: calc(11px + var(--font-size-offset, 0px));
  color: var(--lnb-txt);
}

.empty {
  text-align: center !important;
  padding: 24px !important;
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
}

.char-count {
  display: block;
  margin-top: 4px;
  text-align: right;
  font-size: calc(11px + var(--font-size-offset, 0px));
  color: var(--lnb-muted);
}

.approval-row {
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
}
</style>
