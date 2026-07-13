<script setup>
// 요구사항 이슈/협의 레이어 팝업
defineProps({
  modelValue: { type: Boolean, default: false },
  requirement: { type: Object, default: null },
})

const emit = defineEmits(['update:modelValue'])

function close() {
  emit('update:modelValue', false)
}
</script>

<template>
  <Teleport to="body">
    <div v-if="modelValue && requirement" class="modal-scrim" @mousedown.self="close">
      <div class="modal" role="dialog">
        <div class="modal__head">
          <span class="modal__title">
            이슈/협의 — {{ requirement.reqId }} {{ requirement.name }}
          </span>
          <button type="button" class="modal__close" aria-label="닫기" @click="close">✕</button>
        </div>

        <div class="modal__body">
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
  --ink: #1f2a30;
  --ink-2: #48565e;
  --muted: #7c8a92;
  --line: #e3e8eb;
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
  width: 560px;
  max-width: 92vw;
  max-height: 80vh;
  display: flex;
  flex-direction: column;
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
  flex-shrink: 0;
}

.modal__title {
  font-weight: 800;
  font-size: 14px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
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
  flex-shrink: 0;
}

.modal__body {
  padding: 16px 18px;
  overflow-y: auto;
  flex: 1;
}

.modal__foot {
  display: flex;
  justify-content: flex-end;
  padding: 14px 18px;
  border-top: 1px solid var(--line-2);
  flex-shrink: 0;
}

.empty {
  text-align: center;
  padding: 32px;
  color: var(--muted);
  font-size: 12px;
}

.issue {
  padding: 12px 0;
  border-bottom: 1px solid var(--line-2);
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
  color: var(--muted);
}

.issue__body {
  margin: 0;
  font-size: 12.5px;
  line-height: 1.6;
  color: var(--ink-2);
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

.btn--primary:hover {
  background: var(--teal-600);
}
</style>
