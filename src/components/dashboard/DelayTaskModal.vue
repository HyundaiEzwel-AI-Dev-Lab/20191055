<script setup>
// POP-M-DAS-05 경과 업무 상세 팝업
import { computed } from 'vue'

const props = defineProps({
  modelValue: { type: Boolean, default: false },
  data: { type: Object, default: null },
})

const emit = defineEmits(['update:modelValue'])

const title = computed(() => {
  if (!props.data) return '경과 업무 상세'
  return `경과 업무 상세 (총 ${props.data.total}건)`
})

function close() {
  emit('update:modelValue', false)
}
</script>

<template>
  <Teleport to="body">
    <div
      v-if="modelValue && data"
      class="modal-scrim"
      @mousedown.self="close"
    >
      <div class="modal" role="dialog" aria-labelledby="delay-task-title">
        <div class="modal__head">
          <span id="delay-task-title" class="modal__title">{{ title }}</span>
          <button type="button" class="modal__close" aria-label="닫기" @click="close">✕</button>
        </div>

        <div class="modal__body">
          <p class="modal__sub">
            {{ data.personName }} · {{ data.projectName }}
          </p>
          <div class="delay-list">
            <article v-for="task in data.tasks" :key="task.id" class="delay-item">
              <div class="delay-item__grid">
                <div class="delay-item__field">
                  <span class="delay-item__lab">업무구분</span>
                  <span>{{ task.workType }}</span>
                </div>
                <div class="delay-item__field delay-item__field--wide">
                  <span class="delay-item__lab">요구사항명</span>
                  <span>{{ task.requirement }}</span>
                </div>
                <div class="delay-item__field">
                  <span class="delay-item__lab">경과일정</span>
                  <span class="delay-item__dates">
                    {{ task.planEnd }} → {{ task.actualEnd }}
                    <b class="delay-item__plus">+{{ task.delayDays }}일</b>
                  </span>
                </div>
              </div>
              <div class="delay-item__reason">
                <span class="delay-item__lab">사유</span>
                <p>{{ task.reason }}</p>
              </div>
            </article>
          </div>
        </div>

        <div class="modal__foot">
          <button type="button" class="btn btn--primary" @click="close">닫기</button>
        </div>
      </div>
    </div>
  </Teleport>
</template>

<style scoped>
.modal-scrim {
  position: fixed;
  inset: 0;
  background: rgba(18, 30, 34, 0.34);
  z-index: 1200;
  display: flex;
  align-items: flex-start;
  justify-content: center;
  padding: 70px 16px;
  font-family: var(--font-family);
  color: var(--lnb-txt);
}

.modal {
  width: 680px;
  max-width: 92vw;
  max-height: 84vh;
  overflow: hidden;
  display: flex;
  flex-direction: column;
  background: #fff;
  border-radius: 14px;
  box-shadow: 0 6px 24px rgba(20, 40, 50, 0.12);
}

.modal__head {
  display: flex;
  align-items: center;
  padding: 15px 18px;
  border-bottom: 1px solid var(--lnb-line);
  flex-shrink: 0;
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
  color: var(--lnb-muted);
  cursor: pointer;
  border-radius: 6px;
  font-size: 14px;
}

.modal__close:hover {
  background: var(--lnb-hover);
}

.modal__body {
  padding: 16px 18px;
  overflow-y: auto;
  flex: 1;
}

.modal__sub {
  margin: 0 0 12px;
  font-size: 12px;
  color: var(--lnb-muted);
}

.modal__foot {
  display: flex;
  justify-content: flex-end;
  padding: 14px 18px;
  border-top: 1px solid var(--lnb-line);
  flex-shrink: 0;
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

.delay-list {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.delay-item {
  border: 1px solid var(--lnb-line);
  border-radius: 10px;
  padding: 12px 14px;
  background: #fafbfc;
}

.delay-item__grid {
  display: grid;
  grid-template-columns: 80px 1fr;
  gap: 8px 12px;
  font-size: 12px;
  margin-bottom: 10px;
}

.delay-item__field {
  display: contents;
}

.delay-item__field--wide {
  grid-column: span 2;
}

.delay-item__lab {
  color: var(--lnb-muted);
  font-weight: 600;
}

.delay-item__dates {
  display: flex;
  align-items: center;
  gap: 6px;
  flex-wrap: wrap;
}

.delay-item__plus {
  color: var(--red);
  font-size: 11px;
  font-weight: 700;
  padding: 2px 8px;
  border-radius: 20px;
  background: var(--red-bg);
}

.delay-item__reason {
  border-top: 1px solid var(--lnb-line);
  padding-top: 10px;
  font-size: 12px;
}

.delay-item__reason p {
  margin: 4px 0 0;
  line-height: 1.6;
  color: var(--lnb-txt);
}
</style>
