<script setup>
// POP-S-WBS-02 WBS 일정관리
import { computed, ref, watch } from 'vue'

const props = defineProps({
  modelValue: { type: Boolean, default: false },
  task: { type: Object, default: null },
})

const emit = defineEmits(['update:modelValue', 'save'])

const planStart = ref('')
const planEnd = ref('')
const execStart = ref('')
const execEnd = ref('')

watch(
  () => props.modelValue,
  (open) => {
    if (!open || !props.task) return
    planStart.value = props.task.planStart || ''
    planEnd.value = props.task.planEnd || ''
    execStart.value = props.task.execStart || ''
    execEnd.value = props.task.execEnd || ''
  },
)

const title = computed(() =>
  props.task ? `WBS 일정관리 — ${props.task.requirementName}` : 'WBS 일정관리',
)

function close() {
  emit('update:modelValue', false)
}

function save() {
  emit('save', {
    planStart: planStart.value,
    planEnd: planEnd.value,
    execStart: execStart.value || null,
    execEnd: execEnd.value || null,
  })
  close()
}
</script>

<template>
  <Teleport to="body">
    <div v-if="modelValue && task" class="modal-scrim" @mousedown.self="close">
      <div class="modal" role="dialog">
        <div class="modal__head">
          <span class="modal__title">{{ title }}</span>
          <button type="button" class="modal__close" aria-label="닫기" @click="close">✕</button>
        </div>

        <div class="modal__body">
          <dl class="info-dl">
            <div class="info-dl__row">
              <dt>업무유형</dt>
              <dd>{{ task.taskType }}</dd>
            </div>
            <div class="info-dl__row">
              <dt>담당자</dt>
              <dd>{{ task.assigneeDisplay }}</dd>
            </div>
            <div class="info-dl__row">
              <dt>WBS ID</dt>
              <dd>{{ task.wbsId }}</dd>
            </div>
          </dl>

          <div class="section">
            <h4 class="section__title">계획일정</h4>
            <div class="date-row">
              <input v-model="planStart" class="inp" type="date" />
              <span>~</span>
              <input v-model="planEnd" class="inp" type="date" />
            </div>
          </div>

          <div class="section">
            <h4 class="section__title">실행일정</h4>
            <div class="date-row">
              <input v-model="execStart" class="inp" type="date" />
              <span>~</span>
              <input v-model="execEnd" class="inp" type="date" />
            </div>
          </div>
        </div>

        <div class="modal__foot">
          <button type="button" class="btn btn--ghost" @click="close">취소</button>
          <button type="button" class="btn btn--primary" @click="save">저장</button>
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

.modal__body {
  padding: 18px;
}

.info-dl {
  margin: 0 0 16px;
  background: var(--line-2);
  border-radius: 10px;
  overflow: hidden;
}

.info-dl__row {
  display: grid;
  grid-template-columns: 90px 1fr;
  gap: 8px;
  padding: 10px 14px;
  font-size: 12px;
  border-bottom: 1px solid var(--line);
}

.info-dl__row:last-child {
  border-bottom: none;
}

.info-dl__row dt {
  color: var(--muted);
}

.info-dl__row dd {
  margin: 0;
  font-weight: 600;
}

.section {
  margin-bottom: 14px;
}

.section__title {
  margin: 0 0 8px;
  font-size: 12px;
  font-weight: 700;
}

.date-row {
  display: flex;
  align-items: center;
  gap: 8px;
}

.inp {
  flex: 1;
  height: 32px;
  padding: 0 10px;
  border: 1px solid var(--line);
  border-radius: 7px;
  font-family: inherit;
  font-size: 12px;
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

.btn--primary:hover {
  background: var(--teal-600);
}

.btn--ghost {
  background: #fff;
  border-color: var(--line);
}
</style>
