<script setup>
// POP-UAT 오류등록 (테스트 수행)
import { computed, ref, watch } from 'vue'
import BaseModal from '@/components/ui/BaseModal.vue'
import { getDefectList } from '@/data/testDefect'

const CURRENT_USER = '김현대'

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
  attachments: [],
})

const existingDefects = computed(() => {
  if (!props.caseRow) return []
  return getDefectList(props.mode).filter((d) => d.caseId === props.caseRow.caseId)
})

watch(
  () => [props.caseRow, props.step],
  () => {
    if (!props.caseRow || !props.step) return
    form.value = {
      title: `[${props.step.no}번] ${props.step.procedure} 오류`,
      grade: 'Major',
      description: '',
      assignee: '이개발',
      occurrencePhase: '오픈 전',
      deployStatus: props.mode === 'uat' ? 'STG배포' : 'DEV배포',
      attachments: [],
    }
  },
  { immediate: true },
)

function onAttachmentChange(e) {
  const files = Array.from(e.target.files || [])
  files.forEach((f) => form.value.attachments.push(f.name))
  e.target.value = ''
}

function removeAttachment(idx) {
  form.value.attachments.splice(idx, 1)
}

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
    attachments: [...form.value.attachments],
    tester: CURRENT_USER,
  })
  emit('close')
}
</script>

<template>
  <BaseModal
    :visible="visible"
    title="오류등록 (POP-UAT)"
    wide
    @close="$emit('close')"
  >
    <template v-if="caseRow && step">
      <div class="layout">
        <aside class="list-col">
          <h4 class="list-col__title">이 케이스의 등록된 오류 ({{ existingDefects.length }}건)</h4>
          <ul v-if="existingDefects.length" class="existing-list">
            <li v-for="d in existingDefects" :key="d.id">
              <span class="existing-list__id">{{ d.defectId }}</span>
              <span class="existing-list__title">{{ d.title }}</span>
              <span class="existing-list__status">{{ d.status }}</span>
            </li>
          </ul>
          <p v-else class="list-col__empty">등록된 오류가 없습니다.</p>
        </aside>

        <div class="form-col">
          <div class="meta">
            <span>{{ caseRow.caseId }}</span>
            <span>{{ caseRow.caseName }}</span>
            <span>절차 {{ step.no }}: {{ step.procedure }}</span>
          </div>

          <div class="form-row">
            <div class="field">
              <label>오류ID</label>
              <div class="inp inp--ro">자동채번</div>
            </div>
            <div class="field">
              <label>등록자</label>
              <div class="inp inp--ro">{{ CURRENT_USER }}</div>
            </div>
          </div>

          <div class="form-row">
            <div class="field">
              <label>테스트절차</label>
              <div class="inp inp--ro">{{ step.procedure }}</div>
            </div>
            <div class="field">
              <label>예상결과</label>
              <div class="inp inp--ro">{{ step.expected }}</div>
            </div>
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
            <label>오류 내용 (실제 결과)</label>
            <textarea v-model="form.description" class="inp textarea" rows="5" placeholder="실제 발생한 오류 내용을 입력하세요" />
          </div>

          <div class="field">
            <label>첨부파일</label>
            <div class="attach">
              <span v-for="(file, idx) in form.attachments" :key="`${file}-${idx}`" class="attach__chip">
                {{ file }}
                <button type="button" class="attach__x" @click="removeAttachment(idx)">✕</button>
              </span>
              <label class="attach__add">
                ＋ 파일 추가
                <input type="file" multiple class="attach__input" @change="onAttachmentChange" />
              </label>
            </div>
          </div>
        </div>
      </div>
    </template>

    <template #footer>
      <button type="button" class="btn btn--ghost" @click="$emit('close')">취소</button>
      <button type="button" class="btn btn--primary" @click="register">오류등록</button>
    </template>
  </BaseModal>
</template>

<style scoped>
.layout {
  display: flex;
  gap: 16px;
  align-items: flex-start;
}

.list-col {
  flex: 0 0 190px;
  padding-right: 14px;
  border-right: 1px solid var(--line);
}

.list-col__title {
  margin: 0 0 8px;
  font-size: calc(12px + var(--font-size-offset, 0px));
  color: var(--muted);
}

.list-col__empty {
  margin: 0;
  font-size: calc(11.5px + var(--font-size-offset, 0px));
  color: var(--muted);
}

.form-col {
  flex: 1;
  min-width: 0;
}

.meta {
  display: flex;
  flex-direction: column;
  gap: 4px;
  margin-bottom: 12px;
  font-size: calc(12px + var(--font-size-offset, 0px));
  color: var(--muted);
}

.field {
  display: flex;
  flex-direction: column;
  gap: 4px;
  margin-bottom: 10px;
}

.field label {
  font-size: calc(11px + var(--font-size-offset, 0px));
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
  font-size: calc(12px + var(--font-size-offset, 0px));
}

.textarea {
  height: auto;
  padding: 8px 10px;
  resize: vertical;
}

.inp--ro {
  background: var(--field);
  color: var(--muted);
  display: flex;
  align-items: center;
}

.existing-list {
  margin: 0;
  padding: 0;
  list-style: none;
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.existing-list li {
  display: flex;
  flex-direction: column;
  gap: 2px;
  padding: 8px 10px;
  background: var(--orange-bg);
  border-radius: 8px;
  font-size: calc(11.5px + var(--font-size-offset, 0px));
  color: var(--ink-2);
}

.existing-list__id {
  font-weight: 700;
  color: var(--muted);
}

.existing-list__title {
  word-break: break-word;
}

.existing-list__status {
  color: var(--orange);
  font-weight: 600;
}

.attach {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 6px;
}

.attach__chip {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  height: 26px;
  padding: 0 6px 0 10px;
  border: 1px solid var(--line);
  background: var(--field);
  border-radius: 20px;
  font-size: calc(11.5px + var(--font-size-offset, 0px));
}

.attach__x {
  border: none;
  background: none;
  cursor: pointer;
  font-size: calc(11px + var(--font-size-offset, 0px));
  padding: 0 2px;
}

.attach__add {
  position: relative;
  display: inline-flex;
  align-items: center;
  height: 28px;
  padding: 0 12px;
  border: 1px solid var(--line);
  border-radius: 20px;
  background: var(--lnb-side);
  font-size: calc(12px + var(--font-size-offset, 0px));
  cursor: pointer;
}

.attach__input {
  position: absolute;
  inset: 0;
  opacity: 0;
  cursor: pointer;
}
</style>
