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
      <p class="task-name">{{ task.requirementName }} ({{ task.wbsId }})</p>
      <div class="reason-box">
        <p>{{ task.scheduleReason || '변동 사유가 등록되지 않았습니다.' }}</p>
        <p class="reason-box__meta">
          {{ task.changedBy }} · {{ task.changedAt }}
        </p>
      </div>
    </template>

    <template #footer>
      <button type="button" class="btn btn--primary" @click="close">확인</button>
    </template>
  </BaseModal>
</template>

<style scoped>
.task-name {
  margin: 0 0 12px;
  font-size: 13px;
  font-weight: 600;
}

.reason-box {
  background: var(--teal-50);
  border: 1px solid var(--teal-100);
  border-radius: 10px;
  padding: 14px 16px;
}

.reason-box p {
  margin: 0;
  font-size: 13px;
  line-height: 1.6;
}

.reason-box__meta {
  margin-top: 10px !important;
  font-size: 11px;
  color: var(--lnb-muted);
}
</style>
