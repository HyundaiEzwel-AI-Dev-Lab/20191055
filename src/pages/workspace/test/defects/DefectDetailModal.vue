<script setup>
// PAG-S-UAT-15 결함 상세 — 목록 선택 시 하단에 표시되는 마스터-디테일 패널
import { computed, ref, watch } from 'vue'
import { actionStatusValues } from '@/shared/lib/testConfig'

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
const confirmComment = ref('')
const retryCollapsed = ref(false)

const retryHistory = computed(() => (props.row?.history || []).filter((h) => h.action === '재처리요청'))

/** 운영확인은 DEV확인이 이미 완료되고, 배포상태가 '운영배포'일 때만 활성화 (SB p.173) */
const canConfirmOps = computed(
  () => props.row?.result === 'DEV확인' && form.value.deployStatus === '운영배포',
)

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

function saveAll() {
  if (!props.row) return
  if (confirmStatus.value === '운영확인' && !canConfirmOps.value) {
    window.alert('운영확인은 DEV확인 완료 후 배포상태가 "운영배포"일 때만 처리할 수 있습니다.')
    return
  }
  if (!window.confirm('처리내용을 저장하시겠습니까?')) return
  const updates = {
    status: form.value.status,
    dueDate: form.value.dueDate,
    deployStatus: form.value.deployStatus,
    attachments: [...form.value.attachments],
  }
  if (form.value.comment) {
    appendHistory(form.value.status, form.value.comment)
  }
  if (confirmStatus.value) {
    updates.result = confirmStatus.value
    appendHistory(confirmStatus.value, confirmComment.value || `${confirmStatus.value} 처리`)
  }
  emit('save', updates)
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

      <div class="field">
        <label>조치상태</label>
        <div class="step-tabs">
          <button
            v-for="s in actionStatusValues"
            :key="s"
            type="button"
            class="step-tab"
            :class="{ 'is-on': form.status === s }"
            @click="form.status = s"
          >
            {{ s }}
          </button>
        </div>
      </div>

      <div class="field">
        <label>조치자 (수정불가)</label>
        <div class="inp inp--ro">{{ row.assignee }}</div>
      </div>

      <div class="form-row">
        <div class="field">
          <label>조치 예정일</label>
          <input v-model="form.dueDate" class="inp" type="date" @click="$event.target.showPicker?.()" />
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
        <div v-if="!config.showDeployStatus" class="step-tabs">
          <button
            type="button"
            class="step-tab"
            :class="{ 'is-on': confirmStatus === '수정완료' }"
            @click="confirmStatus = '수정완료'"
          >
            수정완료
          </button>
          <button
            type="button"
            class="step-tab"
            :class="{ 'is-on': confirmStatus === '재처리요청' }"
            @click="confirmStatus = '재처리요청'"
          >
            재처리요청
          </button>
        </div>
        <div v-else class="step-tabs">
          <button
            type="button"
            class="step-tab"
            :class="{ 'is-on': confirmStatus === 'DEV확인' }"
            @click="confirmStatus = 'DEV확인'"
          >
            DEV확인
          </button>
          <button
            type="button"
            class="step-tab"
            :class="{ 'is-on': confirmStatus === '운영확인' }"
            :disabled="!canConfirmOps"
            :title="!canConfirmOps ? 'DEV확인 완료 + 배포상태 운영배포일 때만 선택 가능' : undefined"
            @click="confirmStatus = '운영확인'"
          >
            운영확인
          </button>
          <button
            type="button"
            class="step-tab"
            :class="{ 'is-on': confirmStatus === '재처리요청' }"
            @click="confirmStatus = '재처리요청'"
          >
            재처리요청
          </button>
        </div>
        <div class="field">
          <label>최종확인자</label>
          <div class="inp inp--ro">
            {{ CURRENT_USER }}
            <span class="confirm-at">{{ row.history?.[0]?.at || row.registeredAt }}</span>
          </div>
        </div>
        <div class="field">
          <label>확인내용</label>
          <textarea v-model="confirmComment" class="inp textarea" rows="2" placeholder="확인 내용 입력" />
        </div>
      </div>

      <div v-if="retryHistory.length" class="history">
        <button type="button" class="history__toggle" @click="retryCollapsed = !retryCollapsed">
          <h4>재처리요청 이력 ({{ retryHistory.length }}건)</h4>
          <span>{{ retryCollapsed ? '▼' : '▲' }}</span>
        </button>
        <table v-if="!retryCollapsed" class="history-tbl">
          <thead>
            <tr>
              <th>No</th>
              <th>요청일</th>
              <th>요청자</th>
              <th>요청내용</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="(h, i) in retryHistory" :key="h.id">
              <td class="center">{{ i + 1 }}</td>
              <td>{{ h.at }}</td>
              <td>{{ h.author }} ({{ h.role }})</td>
              <td>{{ h.body }}</td>
            </tr>
          </tbody>
        </table>
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
      <button type="button" class="btn btn--primary" @click="saveAll">처리내용 저장</button>
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
  font-size: calc(14px + var(--font-size-offset, 0px));
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
  font-size: calc(12px + var(--font-size-offset, 0px));
}

.lbl {
  display: inline-block;
  min-width: 56px;
  margin-right: 6px;
  color: var(--muted);
  font-weight: 600;
  font-size: calc(11px + var(--font-size-offset, 0px));
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
  font-size: calc(13px + var(--font-size-offset, 0px));
}

.desc {
  margin: 0;
  font-size: calc(12px + var(--font-size-offset, 0px));
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
  font-size: calc(11px + var(--font-size-offset, 0px));
  color: var(--muted);
  font-weight: 600;
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

.history h4 {
  margin: 0 0 8px;
  font-size: calc(13px + var(--font-size-offset, 0px));
}

.history-item {
  padding: 8px 0;
  border-top: 1px solid var(--line);
  font-size: calc(12px + var(--font-size-offset, 0px));
}

.history-item header {
  display: flex;
  gap: 8px;
  margin-bottom: 4px;
  color: var(--muted);
  font-size: calc(11px + var(--font-size-offset, 0px));
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

.confirm-block {
  margin-bottom: 14px;
  padding: 12px 14px;
  background: var(--field);
  border-radius: 8px;
}

.confirm-block h4 {
  margin: 0 0 10px;
  font-size: calc(13px + var(--font-size-offset, 0px));
}

.step-tabs {
  display: flex;
  gap: 8px;
  margin-bottom: 10px;
}

.step-tab {
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

.step-tab.is-on {
  background: var(--teal-50);
  border-color: var(--teal-600);
  color: var(--teal-600);
}

.step-tab:disabled {
  opacity: 0.4;
  cursor: not-allowed;
}

.confirm-at {
  margin-left: auto;
  font-size: calc(11px + var(--font-size-offset, 0px));
  color: var(--muted);
}

.history__toggle {
  display: flex;
  align-items: center;
  justify-content: space-between;
  width: 100%;
  border: none;
  background: none;
  cursor: pointer;
  padding: 0;
  font-family: inherit;
  color: var(--muted);
}

.history-tbl {
  width: 100%;
  border-collapse: collapse;
  font-size: calc(11.5px + var(--font-size-offset, 0px));
  margin-top: 6px;
}

.history-tbl th,
.history-tbl td {
  padding: 6px 8px;
  border-bottom: 1px solid var(--line);
  text-align: left;
}

.history-tbl th {
  background: var(--field);
  font-weight: 600;
}

.history-tbl .center {
  text-align: center;
}
</style>
