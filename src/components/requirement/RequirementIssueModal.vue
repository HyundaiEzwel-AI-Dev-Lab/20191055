<script setup>
// 요구사항 이슈/협의 레이어 팝업
import BaseModal from '@/components/ui/BaseModal.vue'
import { computed } from 'vue'

const props = defineProps({
  modelValue: { type: Boolean, default: false },
  requirement: { type: Object, default: null },
})

const emit = defineEmits(['update:modelValue'])

const title = computed(() => {
  if (!props.requirement) return '이슈/협의'
  return `이슈/협의 — ${props.requirement.reqId} ${props.requirement.name}`
})

function close() {
  emit('update:modelValue', false)
}
</script>

<template>
  <BaseModal
    :title="title"
    :visible="modelValue && !!requirement"
    @close="close"
  >
    <template v-if="requirement">
      <div v-if="!requirement.issues?.length" class="empty">
        등록된 이슈/협의가 없습니다.
      </div>
      <article v-for="issue in requirement.issues" :key="issue.id" class="issue">
        <header class="issue__head">
          <span class="issue__author">{{ issue.author }} / {{ issue.dept }}</span>
          <span class="issue__time">{{ issue.createdAt }}</span>
        </header>
        <p class="issue__body">{{ issue.body }}</p>
      </article>
    </template>

    <template #footer>
      <button type="button" class="btn btn--primary" @click="close">확인</button>
    </template>
  </BaseModal>
</template>

<style scoped>
.empty {
  text-align: center;
  padding: 32px;
  color: var(--lnb-muted);
  font-size: 12px;
}

.issue {
  padding: 12px 0;
  border-bottom: 1px solid var(--lnb-line);
}

.issue:last-child {
  border-bottom: none;
}

.issue__head {
  display: flex;
  gap: 10px;
  margin-bottom: 6px;
  flex-wrap: wrap;
}

.issue__author {
  font-size: 12px;
  font-weight: 700;
}

.issue__time {
  font-size: 11px;
  color: var(--lnb-muted);
}

.issue__body {
  margin: 0;
  font-size: 12.5px;
  line-height: 1.6;
  color: var(--lnb-txt);
}
</style>
