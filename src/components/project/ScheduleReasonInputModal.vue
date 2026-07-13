<script setup>
// POP-S-INF-04 일정 변동 사유 입력
import { computed, ref, watch } from 'vue'

const props = defineProps({
  modelValue: { type: Boolean, default: false },
  scheduledOpenDate: { type: String, default: '' },
  actualOpenDate: { type: String, default: '' },
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
  <Teleport to="body">
    <div v-if="modelValue" class="modal-scrim" @mousedown.self="close">
      <div class="modal" role="dialog" aria-labelledby="schedule-reason-title">
        <div class="modal__head">
          <span id="schedule-reason-title" class="modal__title">일정 변동 사유 입력</span>
          <button type="button" class="modal__close" aria-label="닫기" @click="close">✕</button>
        </div>

        <div class="modal__body">
          <p class="modal__notice">
            오픈일이 오픈예정일을 경과하였습니다.<br />
            사유를 입력해 주세요.
          </p>

          <dl class="info-dl">
            <div class="info-dl__row">
              <dt>오픈예정일</dt>
              <dd>{{ scheduledOpenDate }}</dd>
            </div>
            <div class="info-dl__row">
              <dt>오픈일</dt>
              <dd class="info-dl__late">{{ actualOpenDate }}</dd>
            </div>
          </dl>

          <div class="reason-field">
            <textarea
              v-model="reason"
              class="reason-field__input"
              rows="4"
              maxlength="200"
              placeholder="일정 변동 사유를 입력하세요"
            />
            <span class="reason-field__count">{{ charCount }} / 200자</span>
          </div>
        </div>

        <div class="modal__foot">
          <button type="button" class="btn btn--ghost" @click="close">취소</button>
          <button
            type="button"
            class="btn btn--primary"
            :disabled="!reason.trim()"
            @click="save"
          >
            저장
          </button>
        </div>
      </div>
    </div>
  </Teleport>
</template>

<style scoped>
.modal-scrim {
  --teal: #119a8a;
  --teal-600: #0e8275;
  --ink: #1f2a30;
  --muted: #7c8a92;
  --line: #e3e8eb;
  --line-2: #eef1f3;
  --red: #e0524a;
  --shadow: 0 6px 24px rgba(20, 40, 50, 0.12);

  position: fixed;
  inset: 0;
  background: rgba(18, 30, 34, 0.34);
  z-index: 1200;
  display: flex;
  align-items: flex-start;
  justify-content: center;
  padding: 70px 16px;
  font-family: var(--font-family);
  color: var(--ink);
}

.modal {
  width: 480px;
  max-width: 92vw;
  background: #fff;
  border-radius: 14px;
  box-shadow: var(--shadow);
  overflow: hidden;
}

.modal__head {
  display: flex;
  align-items: center;
  padding: 15px 18px;
  border-bottom: 1px solid var(--line-2);
}

.modal__title {
  font-weight: 800;
  font-size: 14px;
}

.modal__close {
  margin-left: auto;
  width: 26px;
  height: 26px;
  border: none;
  background: transparent;
  color: var(--muted);
  cursor: pointer;
  border-radius: 6px;
  font-size: 14px;
}

.modal__close:hover {
  background: var(--line-2);
  color: var(--ink);
}

.modal__body {
  padding: 18px;
}

.modal__notice {
  margin: 0 0 14px;
  font-size: 13px;
  line-height: 1.6;
  color: var(--ink);
}

.info-dl {
  margin: 0 0 14px;
  background: var(--line-2);
  border-radius: 10px;
  overflow: hidden;
}

.info-dl__row {
  display: grid;
  grid-template-columns: 100px 1fr;
  gap: 8px 12px;
  padding: 11px 14px;
  font-size: 12px;
  border-bottom: 1px solid var(--line);
}

.info-dl__row:last-child {
  border-bottom: none;
}

.info-dl__row dt {
  color: var(--muted);
  font-weight: 500;
}

.info-dl__row dd {
  margin: 0;
  font-weight: 600;
}

.info-dl__late {
  color: var(--red) !important;
}

.reason-field {
  position: relative;
}

.reason-field__input {
  width: 100%;
  min-height: 96px;
  padding: 10px 12px;
  border: 1px solid var(--line);
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
  color: var(--muted);
}

.modal__foot {
  display: flex;
  justify-content: flex-end;
  gap: 8px;
  padding: 14px 18px;
  border-top: 1px solid var(--line-2);
}

.btn {
  height: 32px;
  padding: 0 18px;
  border-radius: 7px;
  font-size: 12.5px;
  font-weight: 600;
  font-family: inherit;
  cursor: pointer;
  border: 1px solid transparent;
}

.btn--primary {
  background: var(--teal);
  color: #fff;
}

.btn--primary:hover:not(:disabled) {
  background: var(--teal-600);
}

.btn--primary:disabled {
  opacity: 0.45;
  cursor: not-allowed;
}

.btn--ghost {
  background: #fff;
  border-color: var(--line);
  color: var(--ink);
}

.btn--ghost:hover {
  border-color: #cfe9e5;
  color: var(--teal-600);
}
</style>
