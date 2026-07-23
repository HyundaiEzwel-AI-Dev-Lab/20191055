<script setup>
// PAG-S-UAT-15 결함 상세 — 목록 선택 시 하단에 표시되는 마스터-디테일 패널
import { computed, ref, watch } from 'vue'
import { actionStatusValues } from '@/data/testConfig'

const CURRENT_USER = '김현대'

const props = defineProps({
  row: { type: Object, default: null },
  config: { type: Object, default: () => ({}) },
})

const emit = defineEmits(['save'])

const form = ref({
  status: '접수',
  comment: '',
  dueDate: '',
  deployStatus: '',
  attachments: [],
})

const confirmStatus = ref('')
const confirmDevChecked = ref(false)
const confirmStgChecked = ref(false)
const confirmOpsChecked = ref(false)
const confirmComment = ref('')

const retryHistory = computed(() => (props.row?.history || []).filter((h) => h.action === '재처리요청'))

watch(
  () => props.row,
  (row) => {
    if (!row) return
    form.value = {
      status: row.status,
      comment: '',
      dueDate: row.dueDate || '',
      deployStatus: row.deployStatus || '',
      attachments: [],
    }
    confirmStatus.value = ''
    confirmDevChecked.value = false
    confirmStgChecked.value = false
    confirmOpsChecked.value = false
    confirmComment.value = ''
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

function appendHistory(action, body) {
  if (!props.row) return
  if (!props.row.history) props.row.history = []
  props.row.history.unshift({
    id: `h-${Date.now()}`,
    author: CURRENT_USER,
    role: '테스터',
    at: new Date().toISOString().slice(0, 16).replace('T', ' '),
    action,
    body,
  })
}

function save() {
  if (!props.row) return
  if (!window.confirm('결함 정보를 저장하시겠습니까?')) return
  const updates = {
    status: form.value.status,
    dueDate: form.value.dueDate,
    deployStatus: form.value.deployStatus,
    attachments: [...form.value.attachments],
  }
  if (form.value.comment) {
    appendHistory(form.value.status, form.value.comment)
  }
  emit('save', updates)
}

function setStatus(status) {
  if (!window.confirm(`${status} 처리하시겠습니까?`)) return
  form.value.status = status
  appendHistory(status, form.value.comment || `${status} 처리`)
  emit('save', { status })
}

function saveConfirm() {
  if (!confirmStatus.value) {
    window.alert('확인상태를 선택해 주세요.')
    return
  }
  if (!window.confirm(`${confirmStatus.value}(으)로 확인 처리하시겠습니까?`)) return
  appendHistory(
    confirmStatus.value,
    confirmComment.value ||
      `DEV확인:${confirmDevChecked.value ? 'Y' : 'N'} STG확인:${confirmStgChecked.value ? 'Y' : 'N'} 운영확인:${confirmOpsChecked.value ? 'Y' : 'N'}`,
  )
  emit('save', { result: confirmStatus.value })
}
</script>

<template>
  <section v-if="row" class="card detail-card">
    <div class="detail-card__head">
      <h3 class="detail-card__title">결함 상세 — {{ row.defectId }}</h3>
    </div>
      <div class="meta-grid">
        <div><span class="lbl">케이스</span>{{ row.caseId }} · {{ row.caseName }}</div>
        <div><span class="lbl">화면</span>{{ row.screenName }}</div>
        <div><span class="lbl">차수/절차</span>{{ row.round }} · {{ row.stepNo }}번</div>
        <div><span class="lbl">등급</span><span class="grade">{{ row.grade }}</span></div>
        <div v-if="config.showOccurrencePhase"><span class="lbl">발생시점</span>{{ row.occurrencePhase }}</div>
        <div><span class="lbl">등록자</span>{{ row.tester }}</div>
        <div><span class="lbl">등록일</span>{{ row.registeredAt }}</div>
      </div>

      <div class="block">
        <h4>{{ row.title }}</h4>
        <p class="desc">{{ row.description || row.stepProcedure }}</p>
      </div>

      <div class="form-row">
        <div class="field">
          <label>조치상태</label>
          <select v-model="form.status" class="inp">
            <option v-for="s in actionStatusValues" :key="s" :value="s">{{ s }}</option>
          </select>
        </div>
        <div class="field">
          <label>조치자 (수정불가)</label>
          <div class="inp inp--ro">{{ row.assignee }}</div>
        </div>
      </div>

      <div class="form-row">
        <div class="field">
          <label>조치 예정일</label>
          <input v-model="form.dueDate" class="inp" type="date" />
        </div>
        <div class="field" v-if="config.showDeployStatus">
          <label>배포상태</label>
          <select v-model="form.deployStatus" class="inp" :disabled="form.status !== '처리완료'">
            <option value="">선택</option>
            <option value="DEV배포">DEV배포</option>
            <option value="STG배포">STG배포</option>
            <option value="운영배포">운영배포</option>
          </select>
        </div>
      </div>

      <div class="field">
        <label>처리 메모</label>
        <textarea v-model="form.comment" class="inp textarea" rows="3" placeholder="조치 내용 입력" />
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

      <div class="confirm-block">
        <h4>조치 확인 (테스터 입력)</h4>
        <div class="confirm-radios">
          <label class="radio-item">
            <input v-model="confirmStatus" type="radio" value="수정완료" />
            수정완료
          </label>
          <label class="radio-item">
            <input v-model="confirmStatus" type="radio" value="재처리요청" />
            재처리요청
          </label>
        </div>
        <div class="confirm-checks">
          <label class="chk-item"><input v-model="confirmDevChecked" type="checkbox" />DEV확인</label>
          <label class="chk-item"><input v-model="confirmStgChecked" type="checkbox" />STG확인</label>
          <label class="chk-item"><input v-model="confirmOpsChecked" type="checkbox" />운영확인</label>
        </div>
        <div class="form-row">
          <div class="field">
            <label>최종확인자</label>
            <div class="inp inp--ro">{{ CURRENT_USER }}</div>
          </div>
        </div>
        <div class="field">
          <label>확인내용</label>
          <textarea v-model="confirmComment" class="inp textarea" rows="2" placeholder="확인 내용 입력" />
        </div>
        <button type="button" class="btn btn--primary btn--sm" @click="saveConfirm">확인 저장</button>
      </div>

      <div v-if="retryHistory.length" class="history">
        <h4>재처리요청 이력</h4>
        <article v-for="h in retryHistory" :key="h.id" class="history-item" :title="h.body">
          <header>
            <span>{{ h.author }} ({{ h.role }})</span>
            <span class="action">{{ h.action }}</span>
            <span class="at">{{ h.at }}</span>
          </header>
          <p>{{ h.body }}</p>
        </article>
      </div>

      <div v-if="row.history?.length" class="history">
        <h4>처리 이력</h4>
        <article v-for="h in row.history" :key="h.id" class="history-item">
          <header>
            <span>{{ h.author }} ({{ h.role }})</span>
            <span class="action">{{ h.action }}</span>
            <span class="at">{{ h.at }}</span>
          </header>
          <p>{{ h.body }}</p>
        </article>
      </div>

    <div class="detail-card__foot">
      <button type="button" class="btn btn--ghost" @click="setStatus('오류아님')">오류아님</button>
      <button type="button" class="btn btn--primary" @click="setStatus('처리완료')">처리완료</button>
      <button type="button" class="btn btn--primary" @click="save">저장</button>
    </div>
  </section>
</template>

<style scoped>
.detail-card {
  margin-top: 14px;
  padding: 16px 18px;
}

.detail-card__head {
  margin-bottom: 14px;
}

.detail-card__title {
  margin: 0;
  font-size: 14px;
  font-weight: 700;
}

.detail-card__foot {
  display: flex;
  justify-content: flex-end;
  gap: 8px;
  margin-top: 16px;
  padding-top: 14px;
  border-top: 1px solid var(--line);
}

.meta-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 8px 16px;
  margin-bottom: 14px;
  font-size: 12px;
}

.lbl {
  display: inline-block;
  min-width: 56px;
  margin-right: 6px;
  color: var(--muted);
  font-weight: 600;
  font-size: 11px;
}

.grade {
  font-weight: 700;
  color: var(--red);
}

.block {
  margin-bottom: 14px;
  padding: 10px 12px;
  background: var(--field);
  border-radius: 8px;
}

.block h4 {
  margin: 0 0 6px;
  font-size: 13px;
}

.desc {
  margin: 0;
  font-size: 12px;
  line-height: 1.5;
  color: var(--ink-2);
}

.form-row {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 10px;
  margin-bottom: 10px;
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

.history h4 {
  margin: 0 0 8px;
  font-size: 13px;
}

.history-item {
  padding: 8px 0;
  border-top: 1px solid var(--line);
  font-size: 12px;
}

.history-item header {
  display: flex;
  gap: 8px;
  margin-bottom: 4px;
  color: var(--muted);
  font-size: 11px;
}

.history-item .action {
  color: var(--teal-600);
  font-weight: 600;
}

.history-item p {
  margin: 0;
  color: var(--ink-2);
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
  font-size: 11.5px;
}

.attach__x {
  border: none;
  background: none;
  cursor: pointer;
  font-size: 11px;
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
  font-size: 12px;
  cursor: pointer;
}

.attach__input {
  position: absolute;
  inset: 0;
  opacity: 0;
  cursor: pointer;
}

.confirm-block {
  margin-bottom: 14px;
  padding: 12px 14px;
  background: var(--teal-50);
  border-radius: 8px;
}

.confirm-block h4 {
  margin: 0 0 10px;
  font-size: 13px;
}

.confirm-radios,
.confirm-checks {
  display: flex;
  gap: 16px;
  margin-bottom: 10px;
}

.radio-item,
.chk-item {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 12.5px;
  cursor: pointer;
}
</style>
