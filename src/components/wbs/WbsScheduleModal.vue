<script setup>
// POP-S-WBS-02 WBS 일정관리
import { computed, ref, watch } from 'vue'
import BaseModal from '@/components/ui/BaseModal.vue'

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
  <BaseModal
    :title="title"
    :visible="modelValue && !!task"
    @close="close"
  >
    <template v-if="task">
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
    </template>

    <template #footer>
      <button type="button" class="btn btn--ghost" @click="close">취소</button>
      <button type="button" class="btn btn--primary" @click="save">저장</button>
    </template>
  </BaseModal>
</template>

<style scoped>
.info-dl {
  margin: 0 0 16px;
  background: var(--lnb-hover);
  border-radius: 10px;
  overflow: hidden;
}

.info-dl__row {
  display: grid;
  grid-template-columns: 90px 1fr;
  gap: 8px;
  padding: 10px 14px;
  font-size: 12px;
  border-bottom: 1px solid var(--lnb-line);
}

.info-dl__row:last-child {
  border-bottom: none;
}

.info-dl__row dt {
  color: var(--lnb-muted);
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
  border: 1px solid var(--lnb-line);
  border-radius: 7px;
  font-family: inherit;
  font-size: 12px;
}
</style>
