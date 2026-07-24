<script setup>
// POP-S-WBS-07 실행일 변경(다건) 부속 — 홀딩 상태 업무 재착수 팝업 (보정계획일 확인)
import BaseModal from '@/components/ui/BaseModal.vue'
import { formatDateRange } from '@/data/wbs'

const props = defineProps({
  modelValue: { type: Boolean, default: false },
  task: { type: Object, default: null },
})

const emit = defineEmits(['update:modelValue', 'confirm'])

function close() {
  emit('update:modelValue', false)
}

function confirm() {
  emit('confirm', props.task)
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
            {{ formatDateRange(task.planStart, task.correctedPlanEnd) }}
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
