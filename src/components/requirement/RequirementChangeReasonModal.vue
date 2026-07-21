<script setup>
// 요구사항 상세 수정 저장 시 변경 이력 생성
import { computed, ref, watch } from 'vue'
import BaseModal from '@/components/ui/BaseModal.vue'

const props = defineProps({
  modelValue: { type: Boolean, default: false },
})

const emit = defineEmits(['update:modelValue', 'save'])

const reason = ref('')
const charCount = computed(() => reason.value.length)

watch(
  () => props.modelValue,
  (open) => {
    if (open) reason.value = ''
  },
)

function close() {
  emit('update:modelValue', false)
}

function save() {
  if (!reason.value.trim()) return
  emit('save', reason.value.trim())
  close()
}
</script>

<template>
  <BaseModal title="변경 이력 생성" :visible="modelValue" @close="close">
    <p class="notice">요구사항 수정 사유를 입력해 주세요. 저장 시 변경 이력에 기록됩니다.</p>

    <div class="reason-field">
      <textarea
        v-model="reason"
        class="reason-field__input"
        rows="4"
        maxlength="200"
        placeholder="변경 사유를 입력하세요"
      />
      <span class="reason-field__count">{{ charCount }} / 200자</span>
    </div>

    <template #footer>
      <button type="button" class="btn btn--ghost" @click="close">취소</button>
      <button type="button" class="btn btn--primary" :disabled="!reason.trim()" @click="save">
        저장
      </button>
    </template>
  </BaseModal>
</template>

<style scoped>
.notice {
  margin: 0 0 14px;
  font-size: 13px;
  line-height: 1.6;
  color: var(--lnb-txt);
}

.reason-field {
  position: relative;
}

.reason-field__input {
  width: 100%;
  min-height: 96px;
  padding: 10px 12px;
  border: 1px solid var(--lnb-line);
  border-radius: 8px;
  font-family: inherit;
  font-size: 13px;
  line-height: 1.5;
  resize: vertical;
}

.reason-field__input:focus {
  outline: none;
  border-color: var(--teal);
}

.reason-field__count {
  display: block;
  margin-top: 6px;
  text-align: right;
  font-size: 11px;
  color: var(--lnb-muted);
}
</style>
