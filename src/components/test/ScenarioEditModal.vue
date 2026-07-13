<script setup>
// PAG-S-UAT-04 시나리오 편집
import { ref, watch } from 'vue'
import BaseModal from '@/components/ui/BaseModal.vue'

const props = defineProps({
  visible: { type: Boolean, default: false },
  row: { type: Object, default: null },
  executionTypeOptions: { type: Array, default: () => [] },
})

const emit = defineEmits(['close', 'save'])

const form = ref({
  caseName: '',
  executionType: '오픈 전',
  note: '',
  steps: [],
})

watch(
  () => props.row,
  (row) => {
    if (!row) return
    form.value = {
      caseName: row.caseName,
      executionType: row.executionType,
      note: row.note || '',
      steps: row.steps.map((s) => ({ ...s })),
    }
  },
  { immediate: true },
)

function addStep() {
  const no = form.value.steps.length + 1
  form.value.steps.push({ no, procedure: '', expected: '' })
}

function removeStep(idx) {
  form.value.steps.splice(idx, 1)
  form.value.steps.forEach((s, i) => {
    s.no = i + 1
  })
}

function save() {
  emit('save', { ...form.value })
  emit('close')
}
</script>

<template>
  <BaseModal
    :visible="visible"
    title="시나리오 편집 (PAG-S-UAT-04)"
    @close="$emit('close')"
  >
    <template v-if="row">
      <div class="meta">
        <span>{{ row.caseId }}</span>
        <span>{{ row.screenName }}</span>
        <span>{{ row.round }}</span>
      </div>

      <div class="form-block">
        <label>케이스명</label>
        <input v-model="form.caseName" class="inp" type="text" />
      </div>

      <div class="form-block">
        <label>수행구분</label>
        <select v-model="form.executionType" class="inp">
          <option v-for="o in executionTypeOptions" :key="o" :value="o">{{ o }}</option>
        </select>
      </div>

      <div class="form-block">
        <label>테스트 참고사항</label>
        <textarea v-model="form.note" class="inp textarea" rows="2" />
      </div>

      <div class="steps-head">
        <h4>절차 / 예상결과</h4>
        <button type="button" class="btn btn--ghost btn--sm" @click="addStep">+ 절차 추가</button>
      </div>

      <table class="step-table">
        <thead>
          <tr>
            <th>No</th>
            <th>절차</th>
            <th>예상결과</th>
            <th></th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="(step, idx) in form.steps" :key="step.no">
            <td>{{ step.no }}</td>
            <td><input v-model="step.procedure" class="inp" type="text" /></td>
            <td><input v-model="step.expected" class="inp" type="text" /></td>
            <td>
              <button type="button" class="link-btn" @click="removeStep(idx)">삭제</button>
            </td>
          </tr>
        </tbody>
      </table>
    </template>

    <template #footer>
      <button type="button" class="btn btn--ghost" @click="$emit('close')">닫기</button>
      <button type="button" class="btn btn--primary" @click="save">저장</button>
    </template>
  </BaseModal>
</template>

<style scoped>
.meta {
  display: flex;
  gap: 12px;
  font-size: 12px;
  color: var(--muted);
  margin-bottom: 12px;
}

.form-block {
  display: flex;
  flex-direction: column;
  gap: 6px;
  margin-bottom: 12px;
}

.form-block label {
  font-size: 11px;
  color: var(--muted);
  font-weight: 600;
}

.inp {
  height: 32px;
  padding: 0 10px;
  border: 1px solid var(--line);
  border-radius: 7px;
  font-family: inherit;
  font-size: 12px;
  width: 100%;
}

.textarea {
  height: auto;
  padding: 8px 10px;
}

.steps-head {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 8px;
}

.steps-head h4 {
  margin: 0;
  font-size: 13px;
}

.step-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 12px;
}

.step-table th,
.step-table td {
  padding: 6px 8px;
  border: 1px solid var(--line);
}

.step-table th {
  background: var(--field);
}

.link-btn {
  border: none;
  background: none;
  color: var(--teal-600);
  cursor: pointer;
  font-size: 11px;
}
</style>
