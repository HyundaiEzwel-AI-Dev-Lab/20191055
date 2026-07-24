<script setup>
import { ref, watch } from 'vue'
import BaseModal from '@/components/ui/BaseModal.vue'

const props = defineProps({
  visible: { type: Boolean, default: false },
})

const emit = defineEmits(['close', 'confirm'])

const projectName = ref('')
const error = ref('')

watch(
  () => props.visible,
  (open) => {
    if (open) {
      projectName.value = ''
      error.value = ''
    }
  },
)

function close() {
  emit('close')
}

function submit() {
  const name = projectName.value.trim()
  if (!name) {
    error.value = '프로젝트 이름을 입력해 주세요.'
    return
  }
  emit('confirm', name)
}
</script>

<template>
  <BaseModal
    :visible="visible"
    title="프로젝트 이름을 등록해 주세요"
    @close="close"
  >
    <div class="register-form">
      <label class="register-form__label" for="project-name-input">프로젝트명</label>
      <input
        id="project-name-input"
        v-model="projectName"
        class="register-form__input"
        type="text"
        placeholder="프로젝트명을 입력하세요"
        maxlength="100"
        @keyup.enter="submit"
      />
      <p v-if="error" class="register-form__error">{{ error }}</p>
    </div>

    <template #footer>
      <button type="button" class="btn btn--ghost" @click="close">취소</button>
      <button type="button" class="btn btn--primary" @click="submit">완료</button>
    </template>
  </BaseModal>
</template>

<style scoped>
.register-form {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.register-form__label {
  font-size: calc(12px + var(--font-size-offset, 0px));
  font-weight: 600;
  color: var(--ink-2);
}

.register-form__input {
  width: 100%;
  padding: 8px 10px;
  font-size: calc(13px + var(--font-size-offset, 0px));
  border: 1px solid var(--line);
  border-radius: var(--radius-sm);
}

.register-form__input:focus {
  outline: none;
  border-color: var(--teal);
}

.register-form__error {
  margin: 0;
  font-size: calc(12px + var(--font-size-offset, 0px));
  color: var(--red);
}
</style>
