<script setup>
// POP-S-WBS-04 WBS 일정변경 (일괄)
import { computed, ref, watch } from 'vue'
import BaseModal from '@/components/ui/BaseModal.vue'
import { formatDateRange } from '@/data/wbs'

const props = defineProps({
  modelValue: { type: Boolean, default: false },
  tasks: { type: Array, default: () => [] },
})

const emit = defineEmits(['update:modelValue', 'request'])

const planStart = ref('')
const planEnd = ref('')
const reason = ref('')

watch(
  () => props.modelValue,
  (open) => {
    if (!open) return
    planStart.value = ''
    planEnd.value = ''
    reason.value = ''
  },
)

const count = computed(() => props.tasks.length)

function close() {
  emit('update:modelValue', false)
}

function submit() {
  if (!planStart.value || !planEnd.value) {
    window.alert('계획일정을 입력해 주세요.')
    return
  }
  if (planStart.value > planEnd.value) {
    window.alert('계획 종료일은 시작일 이후여야 합니다.')
    return
  }
  if (!reason.value.trim()) {
    window.alert('변경 사유를 입력해 주세요.')
    return
  }
  if (!window.confirm(`${count.value}건의 일정변경을 승인요청하시겠습니까?`)) return

  emit('request', {
    planStart: planStart.value,
    planEnd: planEnd.value,
    reason: reason.value.trim(),
    tasks: props.tasks,
  })
  close()
}
</script>

<template>
  <BaseModal
    title="일정변경"
    :visible="modelValue"
    wide
    @close="close"
  >
    <p class="lead">선택한 WBS 업무 <b>{{ count }}</b>건의 계획일정을 일괄 변경 요청합니다.</p>

    <div class="table-wrap">
      <table class="tbl">
        <thead>
          <tr>
            <th>WBS ID</th>
            <th>요구사항</th>
            <th>업무유형</th>
            <th>담당자</th>
            <th>현재 계획일정</th>
            <th>최종수정</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="row in tasks" :key="row.id">
            <td>{{ row.wbsId }}</td>
            <td class="name">{{ row.requirementName }}</td>
            <td>{{ row.taskType }}</td>
            <td>{{ row.assigneeDisplay || '-' }}</td>
            <td>{{ formatDateRange(row.planStart, row.planEnd) }}</td>
            <td>{{ row.changedAt ? `${row.changedAt} (${row.changedBy})` : '-' }}</td>
          </tr>
        </tbody>
      </table>
    </div>

    <div class="section">
      <h4 class="section__title">변경 계획일정 <span class="req">*</span></h4>
      <div class="date-row">
        <input v-model="planStart" class="inp" type="date" />
        <span>~</span>
        <input v-model="planEnd" class="inp" type="date" />
      </div>
    </div>

    <div class="section">
      <h4 class="section__title">변경 사유 <span class="req">*</span></h4>
      <textarea
        v-model="reason"
        class="ta"
        rows="3"
        placeholder="일정 변경 사유를 입력하세요."
      />
    </div>

    <template #footer>
      <button type="button" class="btn btn--ghost" @click="close">취소</button>
      <button type="button" class="btn btn--primary" @click="submit">승인요청</button>
    </template>
  </BaseModal>
</template>

<style scoped>
.lead {
  margin: 0 0 12px;
  font-size: 13px;
  color: var(--lnb-txt);
}

.lead b {
  color: var(--teal);
}

.table-wrap {
  max-height: 220px;
  overflow: auto;
  margin-bottom: 14px;
  border: 1px solid var(--lnb-line);
  border-radius: 8px;
}

.tbl {
  width: 100%;
  border-collapse: collapse;
  font-size: 12px;
}

.tbl th,
.tbl td {
  padding: 8px 10px;
  border-bottom: 1px solid var(--lnb-line);
  text-align: left;
  white-space: nowrap;
}

.tbl th {
  position: sticky;
  top: 0;
  background: var(--lnb-hover);
  font-weight: 600;
  color: var(--lnb-muted);
}

.tbl .name {
  max-width: 220px;
  overflow: hidden;
  text-overflow: ellipsis;
}

.section {
  margin-bottom: 14px;
}

.section__title {
  margin: 0 0 8px;
  font-size: 12px;
  font-weight: 700;
}

.req {
  color: var(--red);
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
  background: var(--lnb-side);
  color: var(--lnb-txt);
}

.ta {
  width: 100%;
  box-sizing: border-box;
  padding: 8px 10px;
  border: 1px solid var(--lnb-line);
  border-radius: 7px;
  font-family: inherit;
  font-size: 12px;
  resize: vertical;
  background: var(--lnb-side);
  color: var(--lnb-txt);
}
</style>
