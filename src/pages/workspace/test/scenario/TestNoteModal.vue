<script setup>
// POP-S-UAT-02 테스트 참고사항 (포스트잇형 팝업) — 시나리오관리/테스트수행 공용
import { ref, watch } from 'vue'

const props = defineProps({
  modelValue: { type: Boolean, default: false },
  note: { type: String, default: '' },
})

const emit = defineEmits(['update:modelValue', 'save'])

const draft = ref('')

watch(
  () => props.modelValue,
  (open) => {
    if (open) draft.value = props.note || ''
  },
)

function close() {
  emit('update:modelValue', false)
}

function save() {
  emit('save', draft.value.trim())
  close()
}
</script>

<template>
  <Teleport to="body">
    <div v-if="modelValue" class="postit-overlay" @mousedown.self="close">
      <div class="postit">
        <button type="button" class="postit__close" @click="close">×</button>
        <p class="postit__label">테스트 참고사항</p>
        <textarea
          v-model="draft"
          class="postit__textarea"
          maxlength="200"
          placeholder="참고사항을 입력하세요"
        />
        <div class="postit__footer">
          <span class="postit__count">{{ draft.length }} / 200자</span>
          <button type="button" class="postit__save" @click="save">저장</button>
        </div>
      </div>
    </div>
  </Teleport>
</template>

<style scoped>
.postit-overlay {
  position: fixed;
  inset: 0;
  z-index: 1300;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(0, 0, 0, 0.35);
}

.postit {
  position: relative;
  width: 260px;
  min-height: 220px;
  padding: 20px 18px;
  background: #fff6a8;
  border-radius: var(--radius-md);
  box-shadow: var(--shadow-md);
  transform: rotate(-1.5deg);
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.postit__close {
  position: absolute;
  top: 8px;
  right: 10px;
  border: none;
  background: none;
  font-size: calc(16px + var(--font-size-offset, 0px));
  cursor: pointer;
  color: #6b6b30;
  line-height: 1;
}

.postit__label {
  margin: 0;
  font-size: calc(13px + var(--font-size-offset, 0px));
  font-weight: 700;
  color: #6b6b30;
}

.postit__textarea {
  flex: 1;
  width: 100%;
  min-height: 120px;
  border: none;
  background: transparent;
  resize: none;
  font-family: inherit;
  font-size: calc(13px + var(--font-size-offset, 0px));
  line-height: 1.6;
  color: #4a4a1f;
  box-sizing: border-box;
}

.postit__textarea:focus {
  outline: none;
}

.postit__footer {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.postit__count {
  font-size: calc(11px + var(--font-size-offset, 0px));
  color: #8a8a4f;
}

.postit__save {
  border: none;
  border-radius: var(--radius-sm, 6px);
  padding: 6px 14px;
  background: #4a4a1f;
  color: #fff6a8;
  font-size: calc(12px + var(--font-size-offset, 0px));
  font-weight: 700;
  cursor: pointer;
}
</style>
