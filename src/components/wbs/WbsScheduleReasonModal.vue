<script setup>
// POP-S-WBS-03 일정 변동 사유
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
  <Teleport to="body">
    <div v-if="modelValue && task" class="modal-scrim" @mousedown.self="close">
      <div class="modal" role="dialog">
        <div class="modal__head">
          <span class="modal__title">일정 변동 사유</span>
          <button type="button" class="modal__close" aria-label="닫기" @click="close">✕</button>
        </div>

        <div class="modal__body">
          <p class="task-name">{{ task.requirementName }} ({{ task.wbsId }})</p>
          <div class="reason-box">
            <p>{{ task.scheduleReason || '변동 사유가 등록되지 않았습니다.' }}</p>
            <p class="reason-box__meta">
              {{ task.changedBy }} · {{ task.changedAt }}
            </p>
          </div>
        </div>

        <div class="modal__foot">
          <button type="button" class="btn btn--primary" @click="close">확인</button>
        </div>
      </div>
    </div>
  </Teleport>
</template>

<style scoped>
.modal-scrim {
  --teal: #119a8a;
  --teal-600: #0e8275;
  --teal-50: #e6f4f2;
  --teal-100: #cfe9e5;
  --ink: #1f2a30;
  --muted: #7c8a92;
  --line-2: #eef1f3;
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
  width: 440px;
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
  font-size: 14px;
}

.modal__body {
  padding: 18px;
}

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
  color: var(--muted);
}

.modal__foot {
  display: flex;
  justify-content: flex-end;
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
  border: none;
  background: var(--teal);
  color: #fff;
}

.btn:hover {
  background: var(--teal-600);
}
</style>
