<script setup>
// POP-UAT 오류등록 (테스트 수행)
import { computed, ref, watch } from 'vue'
import BaseModal from '@/shared/ui/BaseModal.vue'
import { getDefectList } from '@/entities/defect/mock/testDefect'

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
  emit('register', {
    caseId: props.caseRow.caseId,
    caseName: props.caseRow.caseName,
    screenName: props.caseRow.screenName,
    systemPath: props.caseRow.systemPath,
    bizCategory: props.caseRow.bizCategory,
    round: props.caseRow.round,
    stepNo: props.step.no,
    stepProcedure: props.step.procedure,
    title: form.value.title.trim(),
    grade: form.value.grade,
    description: form.value.description.trim(),
    assignee: CURRENT_USER,
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
    title="오류 상세"
    wide
    @close="$emit('close')"
  >
    <template v-if="caseRow && step">
      <div class="meta card">
        <span>{{ caseRow.round }} 시나리오</span>
        <span>{{ caseRow.systemPath }} · {{ caseRow.screenName }}</span>
        <span>{{ caseRow.caseId }} · {{ caseRow.caseName }}</span>
        <span>절차 {{ step.no }}: {{ step.procedure }}</span>
      </div>

      <div class="layout">
        <aside class="list-col card">
          <h4 class="list-col__title">이 케이스의 등록된 오류 ({{ existingDefects.length }}건)</h4>
          <div v-if="existingDefects.length" class="list-col__scroll">
            <table class="existing-tbl">
              <thead>
                <tr>
                  <th>No</th>
                  <th>오류ID</th>
                  <th>등급</th>
                  <th>제목</th>
                  <th>테스트결과</th>
                  <th>등록자</th>
                  <th>등록일</th>
                  <th>조치상태</th>
                  <th>조치자</th>
                  <th>조치예정일</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="(d, i) in existingDefects" :key="d.id">
                  <td class="center">{{ i + 1 }}</td>
                  <td>{{ d.defectId }}</td>
                  <td>{{ d.grade }}</td>
                  <td class="name">{{ d.title }}</td>
                  <td>{{ d.result }}</td>
                  <td>{{ d.tester }}</td>
                  <td>{{ d.registeredAt }}</td>
                  <td>{{ d.status }}</td>
                  <td>{{ d.assignee }}</td>
                  <td>{{ d.dueDate || '-' }}</td>
                </tr>
              </tbody>
            </table>
          </div>
          <p v-else class="list-col__empty">등록된 오류가 없습니다.</p>
        </aside>

        <div class="form-col card">
          <div class="field">
            <label>오류등급</label>
            <div class="grade-steps">
              <button
                v-for="g in ['Critical', 'Major', 'Minor']"
                :key="g"
                type="button"
                class="grade-step"
                :class="[{ 'is-on': form.grade === g }, `grade-step--${g.toLowerCase()}`]"
                @click="form.grade = g"
              >
                {{ g }}
              </button>
            </div>
          </div>

          <div class="field">
            <label>오류ID</label>
            <div class="inp inp--ro">자동채번</div>
          </div>

          <div class="field">
            <label>결함 제목</label>
            <input v-model="form.title" class="inp" type="text" />
          </div>

          <div class="field">
            <label>테스트절차</label>
            <div class="inp inp--ro inp--wrap">{{ step.procedure }}</div>
          </div>
          <div class="field">
            <label>예상결과</label>
            <div class="inp inp--ro inp--wrap">{{ step.expected }}</div>
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

          <div class="field">
            <label>등록자</label>
            <div class="inp inp--ro">{{ CURRENT_USER }}</div>
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
        </div>
      </div>
    </template>

    <template #footer>
      <button type="button" class="btn btn--ghost" @click="$emit('close')">취소</button>
      <button type="button" class="btn btn--primary" @click="register">테스트 결과 저장</button>
    </template>
  </BaseModal>
</template>

<style scoped>
.card {
  border: 1px solid var(--line);
  border-radius: 10px;
  padding: 14px 16px;
}

.layout {
  display: flex;
  gap: 16px;
  align-items: flex-start;
}

.list-col {
  flex: 0 0 260px;
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

.list-col__scroll {
  max-height: 320px;
  overflow: auto;
}

.existing-tbl {
  width: 100%;
  border-collapse: collapse;
  font-size: calc(10.5px + var(--font-size-offset, 0px));
}

.existing-tbl th,
.existing-tbl td {
  padding: 5px 6px;
  border-bottom: 1px solid var(--line);
  text-align: left;
  white-space: nowrap;
}

.existing-tbl th {
  background: var(--field);
  font-weight: 600;
  position: sticky;
  top: 0;
}

.existing-tbl .name {
  max-width: 120px;
  overflow: hidden;
  text-overflow: ellipsis;
}

.existing-tbl .center {
  text-align: center;
}

.form-col {
  flex: 1;
  min-width: 0;
}

.meta {
  display: flex;
  flex-wrap: wrap;
  gap: 4px 16px;
  margin-bottom: 12px;
  font-size: calc(12px + var(--font-size-offset, 0px));
  color: var(--muted);
}

.grade-steps {
  display: flex;
  gap: 8px;
}

.grade-step {
  flex: 1;
  height: 32px;
  border: 1px solid var(--line);
  border-radius: 7px;
  background: var(--lnb-side);
  color: var(--muted);
  font-family: inherit;
  font-size: calc(12px + var(--font-size-offset, 0px));
  font-weight: 600;
  cursor: pointer;
}

.grade-step.is-on.grade-step--critical { background: var(--red-bg); border-color: var(--red); color: var(--red); }
.grade-step.is-on.grade-step--major { background: var(--orange-bg); border-color: var(--orange); color: var(--orange); }
.grade-step.is-on.grade-step--minor { background: var(--teal-50); border-color: var(--teal-600); color: var(--teal-600); }

.inp--wrap {
  height: auto;
  min-height: 32px;
  white-space: normal;
  word-break: break-word;
  line-height: 1.4;
  padding: 6px 10px;
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
