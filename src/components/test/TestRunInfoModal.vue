<script setup>
// 테스트 수행 · 수행정보 등록/상세 팝업 — 테스터별 계획일/수행일/메모
import { reactive, watch } from 'vue'
import BaseModal from '@/components/ui/BaseModal.vue'

const props = defineProps({
  modelValue: { type: Boolean, default: false },
  caseRow: { type: Object, default: null },
})

const emit = defineEmits(['update:modelValue', 'save'])

const form = reactive({})

watch(
  () => props.modelValue,
  (open) => {
    if (!open || !props.caseRow) return
    Object.keys(form).forEach((k) => delete form[k])
    for (const name of props.caseRow.testers) {
      const existing = props.caseRow.testerInfo?.[name]
      form[name] = {
        planStart: existing?.planStart || props.caseRow.planStart || '',
        planEnd: existing?.planEnd || props.caseRow.planEnd || '',
        execDate: existing?.execDate || '',
        memo: existing?.memo || '',
      }
    }
  },
)

function close() {
  emit('update:modelValue', false)
}

function save() {
  if (!window.confirm('수행정보를 저장하시겠습니까?')) return
  emit('save', { ...form })
  close()
}
</script>

<template>
  <BaseModal
    :title="`수행정보 (${caseRow?.testers?.length || 0})`"
    :visible="modelValue"
    wide
    @close="close"
  >
    <template v-if="caseRow">
      <p class="guide">{{ caseRow.caseName }} — 테스터별 계획일/수행일/메모를 입력하세요.</p>

      <div class="summary">
        <div class="summary__row">
          <span class="summary__label">요구사항ID</span>
          <span class="summary__val">{{ caseRow.reqId || '-' }}</span>
          <span class="summary__label">시스템/업무</span>
          <span class="summary__val">{{ caseRow.systemPath || '-' }}</span>
          <span class="summary__label">차수</span>
          <span class="summary__val">{{ caseRow.round || '-' }}</span>
        </div>
        <div class="summary__row">
          <span class="summary__label">화면명</span>
          <span class="summary__val">{{ caseRow.screenName || '-' }}</span>
          <span class="summary__label">케이스ID</span>
          <span class="summary__val">{{ caseRow.caseId || '-' }}</span>
          <span class="summary__label">계획기간</span>
          <span class="summary__val">{{ caseRow.planStart || '-' }} ~ {{ caseRow.planEnd || '-' }}</span>
        </div>
      </div>

      <table class="tbl">
        <thead>
          <tr>
            <th>테스터</th>
            <th>계획일</th>
            <th>수행일</th>
            <th>메모</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="name in caseRow.testers" :key="name">
            <td>{{ name }}</td>
            <td class="plan-range">
              <input v-model="form[name].planStart" class="inp inp--date" type="date" />
              <span>~</span>
              <input v-model="form[name].planEnd" class="inp inp--date" type="date" />
            </td>
            <td><input v-model="form[name].execDate" class="inp inp--date" type="date" /></td>
            <td><input v-model="form[name].memo" class="inp" type="text" placeholder="메모 입력" /></td>
          </tr>
        </tbody>
      </table>
    </template>

    <template #footer>
      <button type="button" class="btn btn--ghost" @click="close">취소</button>
      <button type="button" class="btn btn--primary" @click="save">저장</button>
    </template>
  </BaseModal>
</template>

<style scoped>
.guide {
  margin: 0 0 12px;
  font-size: calc(12px + var(--font-size-offset, 0px));
  color: var(--lnb-muted);
}

.summary {
  margin-bottom: 14px;
  padding: 10px 14px;
  border: 1px solid var(--lnb-line);
  border-radius: var(--radius-md, 8px);
  background: var(--lnb-hover);
}

.summary__row {
  display: grid;
  grid-template-columns: auto 1fr auto 1fr auto 1fr;
  gap: 6px 10px;
  font-size: calc(12px + var(--font-size-offset, 0px));
}

.summary__row + .summary__row {
  margin-top: 6px;
}

.summary__label {
  font-weight: 600;
  color: var(--lnb-muted);
}

.summary__val {
  color: var(--lnb-txt);
}

.plan-range {
  display: flex;
  align-items: center;
  gap: 6px;
}

.tbl {
  width: 100%;
  border-collapse: collapse;
  font-size: calc(12px + var(--font-size-offset, 0px));
}

.tbl th,
.tbl td {
  padding: 8px 10px;
  border: 1px solid var(--lnb-line);
  text-align: left;
}

.tbl th {
  background: var(--lnb-hover);
  font-weight: 600;
}

.inp {
  width: 100%;
  height: 30px;
  padding: 0 8px;
  border: 1px solid var(--lnb-line);
  border-radius: 6px;
  font-family: inherit;
  font-size: calc(12px + var(--font-size-offset, 0px));
  box-sizing: border-box;
  background: var(--lnb-side);
}

.inp--date {
  min-width: 130px;
}
</style>
