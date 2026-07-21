<script setup>
// POP-S-WBS-05 다중 일정 변경 (SB 123) — 단건/다건 공통 UI, 행별 일정 수정
import { computed, ref, watch } from 'vue'
import BaseModal from '@/components/ui/BaseModal.vue'
import {
  formatDateRange,
  bulkPlanChangeReasons,
  planChangeReasons,
  holdChangeReasons,
  approverOptions,
  assigneeOptions,
  calcRestartRange,
} from '@/data/wbs'

const props = defineProps({
  modelValue: { type: Boolean, default: false },
  tasks: { type: Array, default: () => [] },
})

const emit = defineEmits(['update:modelValue', 'request'])

const tab = ref('plan') // plan | hold
/** @type {import('vue').Ref<Array<Record<string, any>>>} */
const rows = ref([])
const reason = ref('')
const reasonDetail = ref('')
const collaborator = ref('')
const approver = ref('')

const count = computed(() => rows.value.length)
const isMulti = computed(() => count.value > 1)
const isOther = computed(() => String(reason.value).includes('기타'))
const plannerOptions = computed(() => assigneeOptions.기획 || [])
const collaboratorEnabled = computed(() => !isMulti.value && plannerOptions.value.length >= 2)
const reasonOptions = computed(() => {
  if (tab.value === 'hold') return holdChangeReasons
  return isMulti.value ? bulkPlanChangeReasons : planChangeReasons
})

watch(
  () => props.modelValue,
  (open) => {
    if (!open) return
    tab.value = 'plan'
    reason.value = ''
    reasonDetail.value = ''
    collaborator.value = ''
    approver.value = ''
    rows.value = (props.tasks || []).map((t) => ({
      ...t,
      changeStart: t.planStart || '',
      changeEnd: t.planEnd || '',
      holdStart: '',
      holdEnd: '',
    }))
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

/** 착수 후에만 시작일 잠금 (SB: 착수 전은 시작·종료 모두 변경 가능) */
function isStartLocked(row) {
  return !!row.execStart
}

function lockedStartValue(row) {
  return row.execStart || row.planStart || row.changeStart
}

function restartInfo(row) {
  if (!row.holdStart || !row.holdEnd) return { start: '', end: '' }
  return calcRestartRange(row, row.holdStart, row.holdEnd)
}

function restartStartText(row) {
  return restartInfo(row).start || '-'
}

function restartEndText(row) {
  return restartInfo(row).end || '-'
}

function onTabChange(next) {
  tab.value = next
  reason.value = ''
  reasonDetail.value = ''
}

function submit() {
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

  const reasonText = isOther.value ? reasonDetail.value.trim() : reason.value

  if (tab.value === 'plan') {
    for (const row of rows.value) {
      const start = isStartLocked(row) ? lockedStartValue(row) : row.changeStart
      const end = row.changeEnd
      if (!start || !end) {
        window.alert(`${row.wbsId}: 변경 일정을 입력하세요.`)
        return
      }
      if (start > end) {
        window.alert(`${row.wbsId}: 종료일은 시작일 이후여야 합니다.`)
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

    const payloadTasks = rows.value.map((row) => ({
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
      // 승인목록 요약용 (첫 건 기준)
      planStart: payloadTasks[0]?.newPlanStart,
      planEnd: payloadTasks[0]?.newPlanEnd,
    })
  } else {
    for (const row of rows.value) {
      if (!row.holdStart || !row.holdEnd) {
        window.alert(`${row.wbsId}: 중단 일정을 입력하세요.`)
        return
      }
      if (row.holdStart > row.holdEnd) {
        window.alert(`${row.wbsId}: 중단 종료일은 시작일 이후여야 합니다.`)
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

    const payloadTasks = rows.value.map((row) => ({
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
  <BaseModal title="다중 일정 변경" :visible="modelValue" wide @close="close">
    <div class="tabs">
      <button
        type="button"
        class="tabs__btn"
        :class="{ 'tabs__btn--on': tab === 'plan' }"
        @click="onTabChange('plan')"
      >
        계획일 변경
      </button>
      <button
        type="button"
        class="tabs__btn"
        :class="{ 'tabs__btn--on': tab === 'hold' }"
        @click="onTabChange('hold')"
      >
        실행 홀딩
      </button>
    </div>

    <p class="guide">
      변경 시, 담당 팀장의 승인이 필요합니다.
      (기획자 배정된 경우, 담당 기획자 ‘협조자’ 지정 필수)<br />
      대기 상태(착수 전)에서 일정 변경 시 시작일~종료일 모두 변경 가능하며,
      착수 후엔 종료일만 변경할 수 있습니다.
    </p>

    <div class="section">
      <h4 class="section__title">변경 대상 (총 {{ count }}건)</h4>
      <div class="table-wrap">
        <table class="tbl">
          <thead>
            <tr>
              <th>시스템/화면경로</th>
              <th>화면명</th>
              <th>요구사항명</th>
              <th>업무 ID</th>
              <th>업무유형</th>
              <th>담당자</th>
              <th>공정률</th>
              <th colspan="2">현재일정(계획)</th>
              <template v-if="tab === 'hold'">
                <th colspan="2">현재일정(실행)</th>
              </template>
              <template v-if="tab === 'plan'">
                <th colspan="2">변경 일정</th>
              </template>
              <template v-else>
                <th colspan="2">중단 일정</th>
                <th>재착수 예정일</th>
                <th>보정 계획일</th>
              </template>
            </tr>
            <tr class="tbl__sub">
              <th colspan="7" />
              <th>시작일</th>
              <th>종료일</th>
              <template v-if="tab === 'hold'">
                <th>착수일</th>
                <th>종료일</th>
              </template>
              <th>시작일</th>
              <th>종료일</th>
              <template v-if="tab === 'hold'">
                <th />
                <th />
              </template>
            </tr>
          </thead>
          <tbody>
            <tr v-for="row in rows" :key="row.id">
              <td>{{ row.systemPath }}</td>
              <td>{{ row.screenName }}</td>
              <td class="name">{{ row.requirementName }}</td>
              <td>{{ row.wbsId }}</td>
              <td>{{ row.taskType }}</td>
              <td>{{ row.assigneeDisplay || '-' }}</td>
              <td>{{ row.execProgress != null ? `${row.execProgress}%` : '-' }}</td>
              <td>{{ row.planStart || '-' }}</td>
              <td>{{ row.planEnd || '-' }}</td>
              <template v-if="tab === 'hold'">
                <td>{{ row.execStart || '-' }}</td>
                <td>{{ row.execEnd || '-' }}</td>
              </template>

              <template v-if="tab === 'plan'">
                <td>
                  <input
                    v-if="!isStartLocked(row)"
                    v-model="row.changeStart"
                    class="inp inp--date"
                    type="date"
                  />
                  <span v-else class="locked">{{ lockedStartValue(row) }}</span>
                </td>
                <td>
                  <input v-model="row.changeEnd" class="inp inp--date" type="date" />
                </td>
              </template>
              <template v-else>
                <td>
                  <input v-model="row.holdStart" class="inp inp--date" type="date" />
                </td>
                <td>
                  <input v-model="row.holdEnd" class="inp inp--date" type="date" />
                </td>
                <td class="restart">{{ restartStartText(row) }}</td>
                <td class="restart">{{ restartEndText(row) }}</td>
              </template>
            </tr>
            <tr v-if="!rows.length">
              <td :colspan="tab === 'hold' ? 15 : 11" class="empty">선택된 업무가 없습니다.</td>
            </tr>
          </tbody>
        </table>
      </div>
      <p v-if="tab === 'plan'" class="hint-row">
        ※ 현재일정 표시: 계획 {{ rows[0] ? currentPlanText(rows[0]) : '-' }}
        <template v-if="rows[0]?.execStart"> / 실행 {{ currentExecText(rows[0]) }}</template>
        — 행마다 변경 일정을 개별 입력합니다.
      </p>
    </div>

    <div class="section">
      <h4 class="section__title">변경 사유 <span class="req">*</span></h4>
      <select v-model="reason" class="inp">
        <option value="">사유 선택</option>
        <option v-for="r in reasonOptions" :key="r" :value="r">{{ r }}</option>
      </select>
      <textarea
        v-if="isOther"
        v-model="reasonDetail"
        class="ta"
        rows="3"
        maxlength="500"
        placeholder="상세 사유를 입력하세요"
      />
      <span v-if="isOther" class="char-count">{{ reasonDetail.length }} / 500자</span>
    </div>

    <div class="section row2">
      <div>
        <h4 class="section__title">공유 (기획/현업)</h4>
        <select v-model="collaborator" class="inp" :disabled="!collaboratorEnabled">
          <option value="">
            {{ isMulti ? '다건 변경 시 비활성화' : collaboratorEnabled ? '선택' : '기획자 1인 이하로 비활성화' }}
          </option>
          <option v-for="p in plannerOptions" :key="p" :value="p">{{ p }}</option>
        </select>
      </div>
      <div>
        <h4 class="section__title">승인 (팀장) <span class="req">*</span></h4>
        <select v-model="approver" class="inp">
          <option value="">선택</option>
          <option v-for="a in approverOptions" :key="a" :value="a">{{ a }}</option>
        </select>
      </div>
    </div>

    <template #footer>
      <button type="button" class="btn btn--ghost" @click="close">취소</button>
      <button type="button" class="btn btn--primary" @click="submit">변경요청</button>
    </template>
  </BaseModal>
</template>

<style scoped>
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
  background: #fff;
  font-family: inherit;
  font-size: 12px;
  cursor: pointer;
  color: var(--lnb-txt);
}

.tabs__btn--on {
  background: var(--teal);
  border-color: var(--teal);
  color: #fff;
  font-weight: 700;
}

.guide {
  margin: 0 0 14px;
  font-size: 11px;
  line-height: 1.55;
  color: var(--lnb-muted);
}

.section {
  margin-bottom: 14px;
}

.section__title {
  margin: 0 0 8px;
  font-size: 12px;
  font-weight: 700;
}

.req {
  color: var(--red);
}

.table-wrap {
  max-height: 280px;
  overflow: auto;
  border: 1px solid var(--lnb-line);
  border-radius: var(--radius-md);
}

.tbl {
  width: 100%;
  border-collapse: collapse;
  font-size: 11px;
}

.tbl th,
.tbl td {
  padding: 6px 8px;
  border-bottom: 1px solid var(--lnb-line);
  text-align: left;
  white-space: nowrap;
  vertical-align: middle;
}

.tbl th {
  position: sticky;
  top: 0;
  z-index: 1;
  background: var(--lnb-hover);
  font-weight: 600;
  color: var(--lnb-muted);
}

.tbl__sub th {
  top: 28px;
  font-size: 10px;
  font-weight: 500;
}

.tbl .name {
  max-width: 140px;
  overflow: hidden;
  text-overflow: ellipsis;
}

.inp {
  width: 100%;
  height: 32px;
  padding: 0 10px;
  border: 1px solid var(--lnb-line);
  border-radius: var(--radius-md);
  font-family: inherit;
  font-size: 12px;
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
  font-size: 11px;
}

.locked {
  display: inline-block;
  min-width: 88px;
  font-weight: 600;
  color: var(--lnb-muted);
}

.restart {
  font-size: 11px;
  color: var(--lnb-txt);
}

.empty {
  text-align: center !important;
  padding: 24px !important;
  color: var(--lnb-muted);
}

.hint-row {
  margin: 8px 0 0;
  font-size: 11px;
  color: var(--lnb-muted);
}

.ta {
  width: 100%;
  margin-top: 8px;
  box-sizing: border-box;
  padding: 8px 10px;
  border: 1px solid var(--lnb-line);
  border-radius: var(--radius-md);
  font-family: inherit;
  font-size: 12px;
  resize: vertical;
  background: var(--lnb-side);
}

.char-count {
  display: block;
  margin-top: 4px;
  text-align: right;
  font-size: 11px;
  color: var(--lnb-muted);
}

.row2 {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 12px;
}
</style>
