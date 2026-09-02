<script setup>
// POP-S-WBS-07 실행일 변경(다건) 부속 — 홀딩 상태 업무 재착수 팝업 (보정계획일 확인)
import { computed } from 'vue'
import BaseModal from '@/shared/ui/BaseModal.vue'
import { formatDateRange, wbsMockToday } from '@/entities/wbs/mock/wbs'

const props = defineProps({
  modelValue: { type: Boolean, default: false },
  task: { type: Object, default: null },
})

const emit = defineEmits(['update:modelValue', 'confirm'])

function parseYmd(ymd) {
  if (!ymd) return null
  const [y, m, d] = ymd.split('-').map(Number)
  return new Date(y, m - 1, d)
}

function formatYmd(date) {
  const p = (n) => String(n).padStart(2, '0')
  return `${date.getFullYear()}-${p(date.getMonth() + 1)}-${p(date.getDate())}`
}

function countCalendarDays(start, end) {
  const s = parseYmd(start)
  const e = parseYmd(end)
  if (!s || !e || e < s) return 0
  return Math.round((e.getTime() - s.getTime()) / 86400000) + 1
}

/**
 * 재착수 시 반영될 보정 계획종료일(h-pms WbsRestartModal 이관). task.correctedPlanEnd는 홀딩
 * 요청 기간 전량이 반영된 날짜라, 예정보다 일찍 재착수하면 미실현 홀딩일수만큼 당겨서 보여줘야
 * 안내문("계획 종료일이 보정 계획일로 반영됩니다")과 실제 반영값이 어긋나지 않는다.
 */
function correctedPlanEnd(planEnd, holdStart, holdEnd) {
  if (!planEnd || !holdStart || !holdEnd) return null
  const requested = countCalendarDays(holdStart, holdEnd)
  if (requested <= 0) return planEnd
  const elapsed = Math.max(0, countCalendarDays(holdStart, wbsMockToday) - 1)
  const unrealized = requested - Math.min(requested, elapsed)
  if (unrealized <= 0) return planEnd
  const end = parseYmd(planEnd)
  if (!end) return planEnd
  end.setDate(end.getDate() - unrealized)
  return formatYmd(end)
}

/** 미리보기(correctedText)와 실제 반영값이 어긋나지 않도록, 확정 시에도 같은 보정값을 함께 넘긴다. */
const correctedEnd = computed(() => {
  const task = props.task
  if (!task) return null
  return correctedPlanEnd(
    task.correctedPlanEnd ?? task.planEnd,
    task.holdStart ?? null,
    task.holdEnd ?? null,
  )
})

const correctedText = computed(() => {
  const task = props.task
  if (!task) return '-'
  return formatDateRange(task.planStart, correctedEnd.value)
})

function close() {
  emit('update:modelValue', false)
}

function confirm() {
  emit('confirm', props.task, correctedEnd.value)
  close()
}
</script>

<template>
  <BaseModal title="홀딩 업무 재착수" :visible="modelValue && !!task" @close="close">
    <template v-if="task">
      <div class="info-grid">
        <div class="info-grid__row">
          <span class="info-grid__label">업무명</span>
          <span class="info-grid__val">{{ task.taskName || task.requirementName }}</span>
        </div>
        <div class="info-grid__row">
          <span class="info-grid__label">WBS ID</span>
          <span class="info-grid__val">{{ task.wbsId }}</span>
        </div>
        <div class="info-grid__row">
          <span class="info-grid__label">홀딩 기간</span>
          <span class="info-grid__val">{{ formatDateRange(task.holdStart, task.holdEnd) }}</span>
        </div>
        <div class="info-grid__row">
          <span class="info-grid__label">재착수 예정일</span>
          <span class="info-grid__val">{{ task.restartDate || '-' }}</span>
        </div>
        <div class="info-grid__row">
          <span class="info-grid__label">보정 계획일</span>
          <span class="info-grid__val info-grid__val--highlight">
            {{ correctedText }}
          </span>
        </div>
      </div>
      <p class="guide">재착수 처리 시 상태가 '진행중'으로 변경되고, 계획 종료일이 보정 계획일로 반영됩니다.</p>
    </template>

    <template #footer>
      <button type="button" class="btn btn--ghost" @click="close">취소</button>
      <button type="button" class="btn btn--primary" @click="confirm">재착수 처리</button>
    </template>
  </BaseModal>
</template>

<style scoped>
.info-grid {
  display: flex;
  flex-direction: column;
  gap: 10px;
  background: var(--teal-50);
  border: 1px solid var(--teal-100);
  border-radius: var(--radius-lg);
  padding: 14px 16px;
}

.info-grid__row {
  display: flex;
  gap: 12px;
}

.info-grid__label {
  flex: 0 0 88px;
  font-size: calc(12px + var(--font-size-offset, 0px));
  font-weight: 600;
  color: var(--lnb-muted);
}

.info-grid__val {
  font-size: calc(13px + var(--font-size-offset, 0px));
  color: var(--lnb-txt);
}

.info-grid__val--highlight {
  font-weight: 700;
  color: var(--teal);
}

.guide {
  margin: 12px 0 0;
  font-size: calc(11px + var(--font-size-offset, 0px));
  line-height: 1.55;
  color: var(--lnb-muted);
}
</style>
