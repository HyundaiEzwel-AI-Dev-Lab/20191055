<script setup>
// POP-S-WBS-03 일정 변동 사유
import BaseModal from '@/components/ui/BaseModal.vue'

defineProps({
  modelValue: { type: Boolean, default: false },
  task: { type: Object, default: null },
})

const emit = defineEmits(['update:modelValue'])

function close() {
  emit('update:modelValue', false)
}
</script>

<template>
  <BaseModal
    title="일정 변동 사유"
    :visible="modelValue && !!task"
    @close="close"
  >
    <template v-if="task">
      <div class="reason-box">
        <p class="reason-box__text">
          {{ task.scheduleReason || '변동 사유가 등록되지 않았습니다.' }}
        </p>
        <p class="reason-box__meta">
          {{ task.changedBy }}{{ task.changedByEmpId ? `(${task.changedByEmpId})` : '' }}
          {{ task.changedAt }}
        </p>
      </div>
    </template>

    <template #footer>
      <button type="button" class="btn btn--primary" @click="close">확인</button>
    </template>
  </BaseModal>
</template>

<style scoped>
.reason-box {
  background: var(--teal-50);
  border: 1px solid var(--teal-100);
  border-radius: var(--radius-lg);
  padding: 14px 16px;
}

.reason-box__text {
  margin: 0;
  font-size: calc(13px + var(--font-size-offset, 0px));
  line-height: 1.6;
  color: var(--lnb-txt);
}

.reason-box__meta {
  margin: 10px 0 0;
  font-size: calc(12px + var(--font-size-offset, 0px));
  color: var(--lnb-muted);
}
</style>
