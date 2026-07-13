<script setup>
// POP-UAT 테스트 수행 상세
import { ref, watch } from 'vue'
import BaseModal from '@/components/ui/BaseModal.vue'

const props = defineProps({
  visible: { type: Boolean, default: false },
  row: { type: Object, default: null },
  disabled: { type: Boolean, default: false },
})

const emit = defineEmits(['close', 'save', 'register-error'])

const steps = ref([])

watch(
  () => props.row,
  (row) => {
    if (!row) return
    steps.value = row.steps.map((s) => ({ ...s }))
  },
  { immediate: true },
)

function onResultChange(step) {
  if (step.result === '오류' && props.row) {
    props.row.result = '오류'
  }
}

function save() {
  emit('save', { steps: steps.value })
  emit('close')
}
</script>

<template>
  <BaseModal
    :visible="visible"
    :title="row ? `${row.caseId} 테스트 수행` : '테스트 수행'"
    @close="$emit('close')"
  >
    <template v-if="row">
      <div class="meta">
        <span>{{ row.caseName }}</span>
        <span>{{ row.screenName }}</span>
        <span>{{ row.round }}</span>
      </div>

      <table class="step-table">
        <thead>
          <tr>
            <th>No</th>
            <th>절차</th>
            <th>예상결과</th>
            <th>결과</th>
            <th></th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="step in steps" :key="step.no">
            <td>{{ step.no }}</td>
            <td>{{ step.procedure }}</td>
            <td>{{ step.expected }}</td>
            <td>
              <select
                v-model="step.result"
                class="inp"
                :disabled="disabled"
                @change="onResultChange(step)"
              >
                <option v-for="r in ['대기', '정상', '오류', '기타']" :key="r" :value="r">{{ r }}</option>
              </select>
            </td>
            <td>
              <button
                v-if="step.result === '오류'"
                type="button"
                class="err-btn"
                :disabled="disabled"
                @click="$emit('register-error', { step, row })"
              >
                오류등록
              </button>
            </td>
          </tr>
        </tbody>
      </table>

      <p v-if="disabled" class="dim-note">테스트 기간 외 케이스는 수행할 수 없습니다.</p>
    </template>

    <template #footer>
      <button type="button" class="btn btn--ghost" @click="$emit('close')">닫기</button>
      <button type="button" class="btn btn--primary" :disabled="disabled" @click="save">저장</button>
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

.step-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 12px;
}

.step-table th,
.step-table td {
  padding: 8px 10px;
  border: 1px solid var(--line);
  text-align: left;
}

.step-table th {
  background: var(--field);
}

.inp {
  height: 28px;
  padding: 0 8px;
  border: 1px solid var(--line);
  border-radius: 6px;
  font-family: inherit;
  font-size: 11px;
}

.err-btn {
  border: none;
  background: none;
  color: #c0392b;
  font-size: 11px;
  font-weight: 600;
  cursor: pointer;
  text-decoration: underline;
  font-family: inherit;
  padding: 0;
}

.err-btn:disabled {
  opacity: 0.4;
  cursor: not-allowed;
}

.dim-note {
  margin-top: 10px;
  font-size: 12px;
  color: #c0392b;
}
</style>
