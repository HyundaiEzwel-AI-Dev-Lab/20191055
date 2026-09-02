<script setup>
// POP-S-UAT-13 오류 등록/오류 상세 — 테스트수행(신규등록)과 결함관리(조치/확인)를
// 하나의 팝업으로 통합. 좌측 오류 목록에서 선택 시 우측에 오류상세/조치상세/조치확인이
// 모두 표시된다 (SB 참고).
import { computed, ref, watch } from 'vue'
import BaseModal from '@/shared/ui/BaseModal.vue'
import { actionStatusValues } from '@/shared/lib/testConfig'
import { getDefectList, addDefect, updateDefect } from '@/entities/defect/mock/testDefect'

const CURRENT_USER = '김현대'

const props = defineProps({
  visible: { type: Boolean, default: false },
  caseRow: { type: Object, default: null },
  step: { type: Object, default: null },
  /** 신규 등록 시 이 테스터의 결과셀을 '오류'로 동기화한다. 없으면 CURRENT_USER로 등록만 한다. */
  testerName: { type: String, default: '' },
  mode: { type: String, default: 'dev' },
  config: { type: Object, default: () => ({}) },
  /** 결함관리(목록)에서 특정 오류를 곧바로 열 때 사용 */
  initialDefectId: { type: String, default: '' },
})

const emit = defineEmits(['close', 'changed'])

const existingDefects = ref([])
const selectedId = ref('')

const form = ref(blankForm())
const actionForm = ref(blankActionForm())
const confirmStatus = ref('')
const confirmComment = ref('')
const retryCollapsed = ref(false)

function blankForm() {
  return { title: '', grade: 'Major', description: '', occurrencePhase: '오픈 전', attachments: [] }
}

function blankActionForm() {
  return { status: '접수', dueDate: '', deployStatus: '', comment: '', attachments: [] }
}

const selected = computed(() => existingDefects.value.find((d) => d.id === selectedId.value) || null)

const retryHistory = computed(() => (selected.value?.history || []).filter((h) => h.action === '재처리요청'))

/** 최종확인자 — 조치확인성 액션(수정완료/재처리요청/DEV확인/운영확인)의 가장 최근 이력.
 * 아직 아무도 확인하지 않았으면 '-'로 둔다(확인 전인데 CURRENT_USER를 미리 보여주면 오해를 준다). */
const CONFIRM_ACTIONS = ['수정완료', '재처리요청', 'DEV확인', '운영확인']
const lastConfirm = computed(
  () => (selected.value?.history || []).find((h) => CONFIRM_ACTIONS.includes(h.action)) || null,
)

/** 운영확인은 DEV확인이 이미 완료되고, 배포상태가 '운영배포'일 때만 활성화 (SB p.173) */
const canConfirmOps = computed(
  () => selected.value?.result === 'DEV확인' && actionForm.value.deployStatus === '운영배포',
)

/** 조치확인 영역은 '처리완료'로 최초 변경된 뒤부터 계속 노출된다 */
const showConfirmBlock = computed(() => {
  if (!selected.value) return false
  return selected.value.status === '처리완료' || (selected.value.history || []).some((h) => h.action === '처리완료')
})

const displayProcedure = computed(() => {
  if (selected.value) return selected.value.stepProcedure || props.step?.procedure || '-'
  return props.step?.procedure || '-'
})

const displayExpected = computed(() => {
  if (!selected.value) return props.step?.expected || '-'
  if (selected.value.stepNo === props.step?.no) return props.step?.expected || '-'
  return '-'
})

function loadList() {
  const caseId = selected.value?.caseId || props.caseRow?.caseId
  if (!caseId) {
    existingDefects.value = []
    return
  }
  existingDefects.value = getDefectList(props.mode).filter((d) => d.caseId === caseId)
}

function resetForNew() {
  selectedId.value = ''
  form.value = {
    ...blankForm(),
    title: props.step ? `[${props.step.no}번] ${props.step.procedure} 오류` : '',
    occurrencePhase: props.mode === 'uat' ? '오픈 전' : '오픈 전',
  }
  actionForm.value = blankActionForm()
  confirmStatus.value = ''
  confirmComment.value = ''
}

function selectDefect(d) {
  if (!d) return
  selectedId.value = d.id
  form.value = {
    title: d.title,
    grade: d.grade,
    description: d.description || '',
    occurrencePhase: d.occurrencePhase || '오픈 전',
    attachments: [...(d.attachments || [])],
  }
  actionForm.value = {
    status: d.status,
    dueDate: d.dueDate || '',
    deployStatus: d.deployStatus || '',
    comment: '',
    attachments: [],
  }
  confirmStatus.value = ''
  confirmComment.value = ''
}

watch(
  () => props.visible,
  (open) => {
    if (!open) return
    loadList()
    if (props.initialDefectId) {
      const found = existingDefects.value.find((d) => d.id === props.initialDefectId)
      if (found) {
        selectDefect(found)
        return
      }
    }
    if (props.step) {
      const matched = existingDefects.value.find((d) => d.stepNo === props.step.no)
      if (matched) {
        selectDefect(matched)
        return
      }
    }
    resetForNew()
  },
  { immediate: true },
)

function onAttachmentChange(target, e) {
  const files = Array.from(e.target.files || [])
  files.forEach((f) => target.value.attachments.push(f.name))
  e.target.value = ''
}

function removeAttachment(target, idx) {
  target.value.attachments.splice(idx, 1)
}

function appendHistory(defect, action, body) {
  if (!defect.history) defect.history = []
  defect.history.unshift({
    id: `h-${Date.now()}`,
    author: CURRENT_USER,
    role: '테스터',
    at: new Date().toISOString().slice(0, 16).replace('T', ' '),
    action,
    body,
  })
}

function saveErrorDetail() {
  if (!form.value.title.trim()) {
    window.alert('결함 제목을 입력해 주세요.')
    return
  }
  if (!form.value.description.trim()) {
    window.alert('오류 내용을 입력해 주세요.')
    return
  }
  if (selected.value) {
    const updated = updateDefect(selected.value.id, {
      title: form.value.title.trim(),
      grade: form.value.grade,
      description: form.value.description.trim(),
      attachments: [...form.value.attachments],
    })
    loadList()
    selectDefect(updated)
    emit('changed', updated)
    return
  }
  if (!props.caseRow || !props.step) return
  const newDefect = addDefect(
    {
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
      attachments: [...form.value.attachments],
      tester: props.testerName || CURRENT_USER,
    },
    props.mode,
  )
  loadList()
  selectDefect(newDefect)
  emit('changed', newDefect)
}

/**
 * 조치 상세 저장 + 조치확인 저장을 버튼 하나로 합친다(h-pms 3차검수 §8-4 이식) — 예전엔
 * "처리내용 저장"/"확인내용 저장" 두 버튼이라 조치자와 테스터가 각자 저장을 눌러야 했다.
 * 조치상태는 항상 저장하고, 조치확인은 confirmStatus를 골랐을 때만 함께 반영한다.
 */
function saveAll() {
  if (!selected.value) return
  if (showConfirmBlock.value && confirmStatus.value === '재처리요청' && !confirmComment.value.trim()) {
    window.alert('재처리요청 내용을 입력해 주세요.')
    return
  }
  if (showConfirmBlock.value && confirmStatus.value === '운영확인' && !canConfirmOps.value) {
    window.alert('운영확인은 DEV확인 완료 후 배포상태가 "운영배포"일 때만 처리할 수 있습니다.')
    return
  }
  if (!window.confirm('처리내용을 저장하시겠습니까?')) return
  const confirming = showConfirmBlock.value && !!confirmStatus.value
  const updated = updateDefect(selected.value.id, {
    status: actionForm.value.status,
    dueDate: actionForm.value.dueDate,
    deployStatus: actionForm.value.deployStatus,
    attachments: [...actionForm.value.attachments],
    // result가 있으면 updateDefect가 조치상태를 자동 회귀시킨다(재처리요청→접수, 수정완료→처리완료).
    ...(confirming ? { result: confirmStatus.value } : {}),
  })
  if (actionForm.value.comment) appendHistory(updated, updated.status, actionForm.value.comment)
  if (confirming) appendHistory(updated, confirmStatus.value, confirmComment.value || `${confirmStatus.value} 처리`)
  loadList()
  selectDefect(updated)
  emit('changed', updated)
}
</script>

<template>
  <BaseModal :visible="visible" title="오류 상세" xwide @close="$emit('close')">
    <template v-if="caseRow || selected">
      <div class="meta card">
        <span>{{ selected?.round || caseRow?.round }} 시나리오</span>
        <span>{{ selected?.systemPath || caseRow?.systemPath }} · {{ selected?.screenName || caseRow?.screenName }}</span>
        <span>{{ selected?.caseId || caseRow?.caseId }} · {{ selected?.caseName || caseRow?.caseName }}</span>
        <span v-if="selected">절차 {{ selected.stepNo }}: {{ selected.stepProcedure }}</span>
        <span v-else-if="step">절차 {{ step.no }}: {{ step.procedure }}</span>
        <span v-if="selected && config.showOccurrencePhase">발생시점 · {{ selected.occurrencePhase }}</span>
      </div>

      <div class="layout">
        <aside class="list-col card">
          <div class="list-col__head">
            <h4 class="list-col__title">오류 목록 ({{ existingDefects.length }}건)</h4>
            <button v-if="step" type="button" class="btn btn--ghost btn--sm" @click="resetForNew">＋ 오류등록</button>
          </div>
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
                <tr
                  v-for="(d, i) in existingDefects"
                  :key="d.id"
                  :class="{ 'is-on': d.id === selectedId }"
                  @click="selectDefect(d)"
                >
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

        <div class="form-col">
          <section class="form-box card">
            <h4 class="form-box__title">오류 상세</h4>

            <div class="form-row">
              <div class="field">
                <label>테스트절차</label>
                <div class="inp inp--ro inp--wrap">{{ displayProcedure }}</div>
              </div>
              <div class="field">
                <label>예상결과</label>
                <div class="inp inp--ro inp--wrap">{{ displayExpected }}</div>
              </div>
            </div>

            <div class="field">
              <label>오류등급 *</label>
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

            <div class="form-row">
              <div class="field">
                <label>오류ID</label>
                <div class="inp inp--ro">{{ selected ? selected.defectId : '자동채번' }}</div>
              </div>
              <div v-if="mode === 'uat' && !selected" class="field">
                <label>발생시점</label>
                <select v-model="form.occurrencePhase" class="inp">
                  <option value="오픈 전">오픈 전</option>
                  <option value="오픈 후">오픈 후</option>
                </select>
              </div>
            </div>

            <div class="field">
              <label>제목 *</label>
              <input v-model="form.title" class="inp" type="text" />
            </div>

            <div class="field">
              <label>내용 *</label>
              <textarea v-model="form.description" class="inp textarea" rows="4" placeholder="[ 테스트 정보 ] / [ 재현방법 ] / [ 실제결과(오류) ]" />
            </div>

            <div class="field">
              <label>첨부파일</label>
              <div class="attach">
                <span v-for="(file, idx) in form.attachments" :key="`${file}-${idx}`" class="attach__chip">
                  {{ file }}
                  <button type="button" class="attach__x" @click="removeAttachment(form, idx)">✕</button>
                </span>
                <label class="attach__add">
                  ＋ 파일 추가
                  <input type="file" multiple class="attach__input" @change="onAttachmentChange(form, $event)" />
                </label>
              </div>
            </div>

            <div class="field">
              <label>{{ selected ? '등록자 / 등록일' : '등록자' }}</label>
              <div class="inp inp--ro">
                {{ selected ? selected.tester : (testerName || CURRENT_USER) }}
                <span v-if="selected" class="confirm-at">{{ selected.registeredAt }}</span>
              </div>
            </div>

            <div class="form-box__foot">
              <button type="button" class="btn btn--primary btn--sm" @click="saveErrorDetail">테스트 결과 저장</button>
            </div>
          </section>

          <section v-if="selected" class="form-box card">
            <h4 class="form-box__title">조치 상세</h4>

            <div class="field">
              <label>조치상태 *</label>
              <div class="step-tabs">
                <button
                  v-for="s in actionStatusValues"
                  :key="s"
                  type="button"
                  class="step-tab"
                  :class="{ 'is-on': actionForm.status === s }"
                  @click="actionForm.status = s"
                >
                  {{ s }}
                </button>
              </div>
            </div>

            <div class="form-row">
              <div class="field">
                <label>조치자</label>
                <div class="inp inp--ro">{{ selected.assignee }}</div>
              </div>
              <div class="field">
                <label>조치 예정일</label>
                <input
                  v-model="actionForm.dueDate"
                  class="inp"
                  type="date"
                  :disabled="actionForm.status !== '처리예정'"
                  @click="$event.target.showPicker?.()"
                />
              </div>
            </div>

            <div v-if="config.showDeployStatus" class="field">
              <label>배포상태</label>
              <select v-model="actionForm.deployStatus" class="inp" :disabled="actionForm.status !== '처리완료'">
                <option value="">선택</option>
                <option value="DEV배포">DEV배포</option>
                <option value="STG배포">STG배포</option>
                <option value="운영배포">운영배포</option>
              </select>
            </div>

            <div class="field">
              <label>처리내용 *</label>
              <textarea v-model="actionForm.comment" class="inp textarea" rows="3" placeholder="조치 내용을 입력하세요" />
            </div>

            <div class="field">
              <label>첨부파일</label>
              <div class="attach">
                <span v-for="(file, idx) in actionForm.attachments" :key="`${file}-${idx}`" class="attach__chip">
                  {{ file }}
                  <button type="button" class="attach__x" @click="removeAttachment(actionForm, idx)">✕</button>
                </span>
                <label class="attach__add">
                  ＋ 파일 추가
                  <input type="file" multiple class="attach__input" @change="onAttachmentChange(actionForm, $event)" />
                </label>
              </div>
            </div>
          </section>

          <section v-if="showConfirmBlock" class="form-box card confirm-block">
            <h4 class="form-box__title">조치 확인 (테스터 입력)</h4>

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
              <label>재처리요청 내용{{ confirmStatus === '재처리요청' ? ' *' : '' }}</label>
              <textarea
                v-model="confirmComment"
                class="inp textarea"
                rows="2"
                :disabled="confirmStatus !== '재처리요청'"
                placeholder="재처리요청 시 필요한 내용을 입력하세요"
              />
            </div>

            <div class="field">
              <label>최종확인자</label>
              <div class="inp inp--ro">
                {{ lastConfirm ? lastConfirm.author : '-' }}
                <span v-if="lastConfirm" class="confirm-at">{{ lastConfirm.at }}</span>
              </div>
            </div>
          </section>

          <section v-if="retryHistory.length" class="form-box card">
            <button type="button" class="history__toggle" @click="retryCollapsed = !retryCollapsed">
              <h4 class="form-box__title">재처리요청 이력 ({{ retryHistory.length }}건)</h4>
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
                  <td>{{ h.author }}</td>
                  <td>{{ h.body }}</td>
                </tr>
              </tbody>
            </table>
          </section>

          <div v-if="selected" class="form-box__foot">
            <button type="button" class="btn btn--primary btn--sm" @click="saveAll">처리내용 저장</button>
          </div>
        </div>
      </div>
    </template>

    <template #footer>
      <button type="button" class="btn btn--ghost" @click="$emit('close')">닫기</button>
    </template>
  </BaseModal>
</template>

<style scoped>
/* 배경·테두리·라운드는 전역 .card(shared/styles/components.css). 이 모달의 안쪽 여백만 남긴다. */
.card {
  padding: 14px 16px;
}

.layout {
  display: flex;
  gap: 16px;
  align-items: flex-start;
}

.list-col {
  flex: 0 0 min(46%, 440px);
  min-width: 280px;
  max-width: 520px;
}

.list-col__head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  margin-bottom: 8px;
}

.list-col__title {
  margin: 0;
  font-size: calc(12px + var(--font-size-offset, 0px));
  color: var(--muted);
}

.list-col__empty {
  margin: 0;
  font-size: calc(11.5px + var(--font-size-offset, 0px));
  color: var(--muted);
}

.list-col__scroll {
  max-height: 460px;
  overflow: auto;
}

.existing-tbl {
  width: max-content;
  min-width: 720px;
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

.existing-tbl tbody tr {
  cursor: pointer;
}

.existing-tbl tbody tr:hover,
.existing-tbl tbody tr.is-on {
  background: var(--teal-50);
}

.existing-tbl .name {
  max-width: 110px;
  overflow: hidden;
  text-overflow: ellipsis;
}

.existing-tbl .center {
  text-align: center;
}

.form-col {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.form-box__title {
  margin: 0 0 10px;
  font-size: calc(13px + var(--font-size-offset, 0px));
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

.form-box__foot {
  display: flex;
  justify-content: flex-end;
  padding-top: 4px;
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

.inp:disabled,
.textarea:disabled {
  background: var(--field);
  color: var(--muted);
  cursor: not-allowed;
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

.btn {
  height: 32px;
  padding: 0 14px;
  border-radius: 7px;
  font-size: calc(12.5px + var(--font-size-offset, 0px));
  font-weight: 600;
  font-family: inherit;
  cursor: pointer;
  border: 1px solid transparent;
}

.btn--sm {
  height: 28px;
  padding: 0 10px;
  font-size: calc(12px + var(--font-size-offset, 0px));
}

.btn--primary {
  background: var(--teal);
  color: var(--color-text-inverse);
}

.btn--primary:hover {
  background: var(--teal-600);
}

.btn--primary:disabled {
  opacity: 0.4;
  cursor: not-allowed;
}

.btn--ghost {
  background: var(--lnb-side);
  border-color: var(--line);
  color: var(--ink);
}

.btn--ghost:hover {
  border-color: var(--teal-100);
  color: var(--teal-600);
}

.confirm-block {
  background: var(--field);
}

.confirm-at {
  margin-left: auto;
  font-size: calc(11px + var(--font-size-offset, 0px));
  color: var(--muted);
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
