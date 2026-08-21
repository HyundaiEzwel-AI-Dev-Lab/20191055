<script setup>
// POP-S-REQ-02 이슈만 모아 보기 — 목록 이슈 숫자 클릭. 본문은 RequirementIssuePanel과 같다.
import { computed } from 'vue'
import BaseModal from '@/shared/ui/BaseModal.vue'
import RequirementIssuePanel from './RequirementIssuePanel.vue'

const props = defineProps({
  modelValue: { type: Boolean, default: false },
  requirement: { type: Object, default: null },
})

const emit = defineEmits(['update:modelValue', 'issue-added', 'count-change'])

const title = computed(() => {
  if (!props.requirement) return '이슈관리'
  return `이슈관리 — ${props.requirement.reqId || props.requirement.reqNo}`
})

function close() {
  emit('update:modelValue', false)
}
</script>

<template>
  <BaseModal :title="title" :visible="modelValue && !!requirement" wide @close="close">
    <RequirementIssuePanel
      v-if="requirement"
      :requirement="requirement"
      @count-change="emit('count-change', $event)"
      @issue-added="emit('issue-added', $event)"
    />
    <template #footer>
      <button type="button" class="btn btn--primary" @click="close">확인</button>
    </template>
  </BaseModal>
</template>
