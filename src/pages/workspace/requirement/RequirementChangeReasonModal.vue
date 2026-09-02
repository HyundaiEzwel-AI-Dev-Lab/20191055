<script setup>
// 요구사항 상세 수정 저장 시 변경 이력 생성
import { computed, ref, watch } from 'vue'
import BaseModal from '@/shared/ui/BaseModal.vue'
import { changeReasonOptions } from '@/entities/requirement/mock/requirement'

const OTHER_CODE = 'ETC'

const props = defineProps({
  modelValue: { type: Boolean, default: false },
})

const emit = defineEmits(['update:modelValue', 'save'])

const reasonCode = ref('')
const reasonDetail = ref('')
const isOther = computed(() => reasonCode.value === OTHER_CODE)
const charCount = computed(() => reasonDetail.value.length)
const canSave = computed(() => !!reasonCode.value && (!isOther.value || !!reasonDetail.value.trim()))

watch(
  () => props.modelValue,
  (open) => {
    if (open) {
      reasonCode.value = ''
      reasonDetail.value = ''
    }
  },
)

function close() {
  emit('update:modelValue', false)
}

function save() {
  if (!canSave.value) return
  emit('save', { code: reasonCode.value, etc: isOther.value ? reasonDetail.value.trim() : null })
  close()
}
</script>

<template>
  <BaseModal title="변경 이력 생성" :visible="modelValue" @close="close">
    <p class="notice notice--plain">요구사항 수정 사유를 선택해 주세요. 저장 시 변경 이력에 기록됩니다.</p>

    <select v-model="reasonCode" class="reason-select">
      <option value="">사유 선택</option>
      <option v-for="opt in changeReasonOptions" :key="opt.code" :value="opt.code">{{ opt.label }}</option>
    </select>

    <div v-if="isOther" class="reason-field">
      <textarea
        v-model="reasonDetail"
        class="reason-field__input"
        rows="4"
        maxlength="500"
        placeholder="변경 사유를 입력하세요"
      />
      <span class="reason-field__count">{{ charCount }} / 500자</span>
    </div>

    <template #footer>
      <button type="button" class="btn btn--ghost" @click="close">취소</button>
      <button type="button" class="btn btn--primary" :disabled="!canSave" @click="save">
        저장
      </button>
    </template>
  </BaseModal>
</template>

<style scoped>
.notice--plain {
  margin: 0 0 14px;
  font-size: calc(13px + var(--font-size-offset, 0px));
  line-height: 1.6;
  color: var(--lnb-txt);
}

.reason-select {
  width: 100%;
  height: 36px;
  padding: 0 10px;
  border: 1px solid var(--lnb-line);
  border-radius: var(--radius-md, 8px);
  font-family: inherit;
  font-size: calc(13px + var(--font-size-offset, 0px));
  background: var(--lnb-side);
  color: var(--lnb-txt);
  box-sizing: border-box;
}

.reason-field {
  position: relative;
  margin-top: 12px;
}

.reason-field__input {
  width: 100%;
  min-height: 96px;
  padding: 10px 12px;
  border: 1px solid var(--lnb-line);
  border-radius: var(--radius-md, 8px);
  font-family: inherit;
  font-size: calc(13px + var(--font-size-offset, 0px));
  line-height: 1.5;
  resize: vertical;
  background: var(--lnb-side);
  color: var(--lnb-txt);
}

.reason-field__input:focus {
  outline: none;
  border-color: var(--teal);
}

.reason-field__count {
  display: block;
  margin-top: 6px;
  text-align: right;
  font-size: calc(11px + var(--font-size-offset, 0px));
  color: var(--lnb-muted);
}
</style>
