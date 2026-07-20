<script setup>
// POP-UAT 오류등록 (테스트 수행)
import { ref, watch } from 'vue'
import BaseModal from '@/components/ui/BaseModal.vue'

const props = defineProps({
  visible: { type: Boolean, default: false },
  caseRow: { type: Object, default: null },
  step: { type: Object, default: null },
  mode: { type: String, default: 'dev' },
})

const emit = defineEmits(['close', 'register'])

const form = ref({
  title: '',
  grade: 'Major',
  description: '',
  assignee: '이개발',
  occurrencePhase: '오픈 전',
  deployStatus: 'DEV배포',
})

watch(
  () => [props.caseRow, props.step],
  () => {
    if (!props.caseRow || !props.step) return
    form.value = {
      title: `[${props.step.no}번] ${props.step.procedure} 오류`,
      grade: 'Major',
      description: `예상: ${props.step.expected}\n실제: `,
      assignee: '이개발',
      occurrencePhase: '오픈 전',
      deployStatus: props.mode === 'uat' ? 'STG배포' : 'DEV배포',
    }
  },
  { immediate: true },
)

function register() {
  if (!props.caseRow || !props.step) return
  if (!form.value.title.trim()) {
    window.alert('결함 제목을 입력해 주세요.')
    return
  }
  if (!form.value.description.trim()) {
    window.alert('오류 내용을 입력해 주세요.')
    return
  }
  if (!form.value.assignee.trim()) {
    window.alert('담당자를 입력해 주세요.')
    return
  }
  emit('register', {
    caseId: props.caseRow.caseId,
    caseName: props.caseRow.caseName,
    screenName: props.caseRow.screenName,
    round: props.caseRow.round,
    stepNo: props.step.no,
    stepProcedure: props.step.procedure,
    title: form.value.title.trim(),
    grade: form.value.grade,
    description: form.value.description.trim(),
    assignee: form.value.assignee.trim(),
    occurrencePhase: form.value.occurrencePhase,
    deployStatus: form.value.deployStatus,
    tester: '김현대',
  })
  emit('close')
}
</script>

<template>
  <BaseModal
    :visible="visible"
    title="오류등록 (POP-UAT)"
    @close="$emit('close')"
  >
    <template v-if="caseRow && step">
      <div class="meta">
        <span>{{ caseRow.caseId }}</span>
        <span>{{ caseRow.caseName }}</span>
        <span>절차 {{ step.no }}: {{ step.procedure }}</span>
      </div>

      <div class="field">
        <label>결함 제목</label>
        <input v-model="form.title" class="inp" type="text" />
      </div>

      <div class="form-row">
        <div class="field">
          <label>오류등급</label>
          <select v-model="form.grade" class="inp">
            <option v-for="g in ['Critical', 'Major', 'Minor']" :key="g" :value="g">{{ g }}</option>
          </select>
        </div>
        <div class="field">
          <label>담당자</label>
          <input v-model="form.assignee" class="inp" type="text" />
        </div>
      </div>

      <div v-if="mode === 'uat'" class="form-row">
        <div class="field">
          <label>발생시점</label>
          <select v-model="form.occurrencePhase" class="inp">
            <option value="오픈 전">오픈 전</option>
            <option value="오픈 후">오픈 후</option>
          </select>
        </div>
        <div class="field">
          <label>배포상태</label>
          <select v-model="form.deployStatus" class="inp">
            <option value="DEV배포">DEV배포</option>
            <option value="STG배포">STG배포</option>
            <option value="운영배포">운영배포</option>
          </select>
        </div>
      </div>

      <div class="field">
        <label>오류 내용</label>
        <textarea v-model="form.description" class="inp textarea" rows="5" />
      </div>
    </template>

    <template #footer>
      <button type="button" class="btn btn--ghost" @click="$emit('close')">취소</button>
      <button type="button" class="btn btn--primary" @click="register">오류등록</button>
    </template>
  </BaseModal>
</template>

<style scoped>
.meta {
  display: flex;
  flex-direction: column;
  gap: 4px;
  margin-bottom: 12px;
  font-size: 12px;
  color: var(--muted);
}

.field {
  display: flex;
  flex-direction: column;
  gap: 4px;
  margin-bottom: 10px;
}

.field label {
  font-size: 11px;
  color: var(--muted);
  font-weight: 600;
}

.form-row {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 10px;
}

.inp {
  height: 32px;
  padding: 0 10px;
  border: 1px solid var(--line);
  border-radius: 7px;
  font-family: inherit;
  font-size: 12px;
}

.textarea {
  height: auto;
  padding: 8px 10px;
  resize: vertical;
}
</style>
