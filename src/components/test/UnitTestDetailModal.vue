<script setup>
// POP-S-TST-02 단위테스트 상세
import { computed, ref, watch } from 'vue'
import { useRouter } from 'vue-router'
import BaseModal from '@/components/ui/BaseModal.vue'
import {
  actionStatusValues,
  defectStatusClass,
  testResultClass,
} from '@/data/testConfig'
import { unitTestResultSegments } from '@/data/unitTest'

const ATTACH_MAX_COUNT = 3
const ATTACH_MAX_SIZE = 10 * 1024 * 1024

const props = defineProps({
  visible: { type: Boolean, default: false },
  row: { type: Object, default: null },
})

const emit = defineEmits(['close', 'save'])

const router = useRouter()

const overallResult = ref('대기')
const memo = ref('')
const steps = ref([])
const attachments = ref([])
const defects = ref([])

const showDefectForm = ref(false)
const defectTitle = ref('')
const defectGrade = ref('Minor')
const defectDescription = ref('')

watch(
  () => props.row,
  (row) => {
    if (!row) return
    overallResult.value = row.testResult || '대기'
    memo.value = row.memo || ''
    steps.value = row.steps?.map((s) => ({ ...s })) || []
    attachments.value = row.attachments?.map((a) => ({ ...a })) || []
    defects.value = row.defects?.map((d) => ({ ...d })) || []
    showDefectForm.value = false
    defectTitle.value = ''
    defectGrade.value = 'Minor'
    defectDescription.value = ''
  },
  { immediate: true },
)

const segmentClass = (val) => testResultClass(val)

function setOverallResult(val) {
  overallResult.value = val
  if (val === '오류' || val === '개선필요') showDefectForm.value = true
}

function goRequirement() {
  if (!props.row?.requirementId) return
  router.push('/project/requirement')
}

function setStepResult(step, val) {
  step.result = val
  syncOverallFromSteps()
}

function syncOverallFromSteps() {
  if (!steps.value.length) return
  const results = steps.value.map((s) => s.result)
  if (results.every((r) => r === '정상')) overallResult.value = '정상'
  else if (results.some((r) => r === '오류')) overallResult.value = '오류'
  else if (results.some((r) => r === '테스트불가')) overallResult.value = '테스트불가'
  else if (results.some((r) => r === '개선필요')) overallResult.value = '개선필요'
  else if (results.some((r) => r !== '대기')) overallResult.value = '대기'
}

function formatFileSize(bytes) {
  if (bytes < 1024) return `${bytes}B`
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)}KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)}MB`
}

function onAttachmentChange(event) {
  const files = Array.from(event.target.files || [])
  for (const file of files) {
    if (attachments.value.length >= ATTACH_MAX_COUNT) {
      window.alert(`첨부파일은 최대 ${ATTACH_MAX_COUNT}개까지 등록할 수 있습니다.`)
      break
    }
    if (file.size > ATTACH_MAX_SIZE) {
      window.alert(`${file.name}: 파일 용량은 최대 10MB까지 첨부 가능합니다.`)
      continue
    }
    attachments.value.push({
      id: `a-${Date.now()}-${attachments.value.length}`,
      name: file.name,
      size: formatFileSize(file.size),
      uploadedAt: new Date().toISOString().slice(0, 10),
    })
  }
  event.target.value = ''
}

function removeAttachment(id) {
  attachments.value = attachments.value.filter((a) => a.id !== id)
}

function updateDefectStatus(defect, status) {
  defect.status = status
}

const showDefectSection = computed(
  () => overallResult.value === '오류' || overallResult.value === '개선필요' || defects.value.length > 0,
)

const newDefect = computed(() => {
  if (!showDefectSection.value || !defectTitle.value) return null
  return {
    title: defectTitle.value,
    grade: defectGrade.value,
    description: defectDescription.value,
    status: '접수',
  }
})

function save() {
  if (!overallResult.value || overallResult.value === '대기') {
    window.alert('테스트 결과를 선택해 주세요.')
    return
  }
  if (
    (overallResult.value === '오류' || overallResult.value === '개선필요') &&
    !defectTitle.value.trim()
  ) {
    window.alert('오류/개선필요인 경우 결함 제목을 입력해 주세요.')
    return
  }
  if (steps.value.some((s) => !s.procedure.trim() || !s.expected.trim())) {
    window.alert('절차와 예상결과를 모두 입력해 주세요.')
    return
  }
  if (!window.confirm('단위테스트 결과를 저장하시겠습니까?')) return
  emit('save', {
    testResult: overallResult.value,
    memo: memo.value,
    steps: steps.value,
    attachments: attachments.value,
    defects: defects.value,
    defect: newDefect.value,
  })
  emit('close')
}
</script>

<template>
  <BaseModal
    :visible="visible"
    title="단위테스트 수행"
    wide
    @close="$emit('close')"
  >
    <template v-if="row">
      <div class="detail-grid">
        <div class="detail-item">
          <span class="detail-label">화면명</span>
          <span>{{ row.screenName }}</span>
        </div>
        <div class="detail-item">
          <span class="detail-label">화면경로</span>
          <span>{{ row.screenPath }}</span>
        </div>
        <div class="detail-item">
          <span class="detail-label">메뉴명</span>
          <span>{{ row.menuName || '-' }}</span>
        </div>
        <div class="detail-item">
          <span class="detail-label">요구사항명</span>
          <button
            v-if="row.requirementId"
            type="button"
            class="link-btn detail-link"
            @click="goRequirement"
          >
            {{ row.requirementName }}
          </button>
          <span v-else>{{ row.requirementName || '-' }}</span>
        </div>
        <div class="detail-item">
          <span class="detail-label">시스템/업무</span>
          <span>{{ row.systemPath }}</span>
        </div>
        <div class="detail-item">
          <span class="detail-label">업무구분</span>
          <span>{{ row.bizCategory }}</span>
        </div>
        <div class="detail-item">
          <span class="detail-label">업무유형</span>
          <span>{{ row.taskType }}</span>
        </div>
        <div class="detail-item">
          <span class="detail-label">담당자</span>
          <span>{{ row.assignee }}</span>
        </div>
        <div class="detail-item">
          <span class="detail-label">난이도</span>
          <span>{{ row.difficulty }}</span>
        </div>
      </div>

      <section class="section">
        <div class="section__head">
          <h4>테스트 결과</h4>
          <div class="segments">
            <button
              v-for="opt in unitTestResultSegments"
              :key="opt"
              type="button"
              class="seg"
              :class="[`seg--${segmentClass(opt)}`, { active: overallResult === opt }]"
              @click="setOverallResult(opt)"
            >
              {{ opt }}
            </button>
          </div>
        </div>
      </section>

      <section class="section">
        <h4>절차 / 예상결과 <span class="req">*</span></h4>
        <table class="step-table">
          <thead>
            <tr>
              <th>No</th>
              <th>절차</th>
              <th>예상결과</th>
              <th>결과</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="step in steps" :key="step.no">
              <td class="center">{{ step.no }}</td>
              <td>
                <textarea
                  v-model="step.procedure"
                  class="step-input"
                  rows="2"
                  maxlength="1000"
                  placeholder="절차를 입력하세요"
                />
              </td>
              <td>
                <textarea
                  v-model="step.expected"
                  class="step-input"
                  rows="2"
                  maxlength="1000"
                  placeholder="예상결과를 입력하세요"
                />
              </td>
              <td>
                <div class="segments segments--sm">
                  <button
                    v-for="opt in unitTestResultSegments.filter((o) => o !== '대기')"
                    :key="`${step.no}-${opt}`"
                    type="button"
                    class="seg seg--sm"
                    :class="[`seg--${segmentClass(opt)}`, { active: step.result === opt }]"
                    @click="setStepResult(step, opt)"
                  >
                    {{ opt }}
                  </button>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </section>

      <section class="section">
        <div class="section__head">
          <h4>첨부파일</h4>
          <label v-if="attachments.length < ATTACH_MAX_COUNT" class="btn btn--ghost btn--sm attach-add">
            + 파일 추가
            <input type="file" multiple class="attach-add__input" @change="onAttachmentChange" />
          </label>
        </div>
        <p class="file-hint">등록 가능 확장자: jpg, png, word, excel, ppt, pptx · 최대 {{ ATTACH_MAX_COUNT }}개, 개당 10MB 이하</p>
        <ul v-if="attachments.length" class="attach-list">
          <li v-for="file in attachments" :key="file.id">
            <span class="attach-name">{{ file.name }}</span>
            <span class="attach-meta">{{ file.size }} · {{ file.uploadedAt }}</span>
            <button type="button" class="link-btn" @click="removeAttachment(file.id)">삭제</button>
          </li>
        </ul>
        <p v-else class="empty-hint">첨부된 파일이 없습니다.</p>
      </section>

      <section v-if="showDefectSection" class="section defect-section">
        <h4>결함</h4>

        <div v-if="overallResult === '오류' || overallResult === '개선필요'" class="defect-form">
          <input v-model="defectTitle" class="inp" type="text" placeholder="결함 제목" />
          <select v-model="defectGrade" class="inp">
            <option v-for="g in ['Critical', 'Major', 'Minor']" :key="g" :value="g">{{ g }}</option>
          </select>
          <textarea
            v-model="defectDescription"
            class="inp textarea"
            rows="2"
            placeholder="오류 내용"
          />
        </div>

        <table v-if="defects.length" class="defect-table">
          <thead>
            <tr>
              <th>등급</th>
              <th>제목</th>
              <th>조치상태</th>
              <th>등록일</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="d in defects" :key="d.id">
              <td><span class="grade">{{ d.grade }}</span></td>
              <td>{{ d.title }}</td>
              <td>
                <select
                  :value="d.status"
                  class="status-sel"
                  :class="`status-sel--${defectStatusClass(d.status)}`"
                  @change="updateDefectStatus(d, $event.target.value)"
                >
                  <option v-for="s in actionStatusValues" :key="s" :value="s">{{ s }}</option>
                </select>
              </td>
              <td>{{ d.registeredAt }}</td>
            </tr>
          </tbody>
        </table>
      </section>

      <div class="form-block">
        <label>메모</label>
        <textarea v-model="memo" class="inp textarea" rows="3" placeholder="테스트 메모" />
      </div>
    </template>

    <template #footer>
      <button type="button" class="btn btn--ghost" @click="$emit('close')">닫기</button>
      <button type="button" class="btn btn--primary" @click="save">저장</button>
    </template>
  </BaseModal>
</template>

<style scoped>
.detail-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 10px 16px;
  margin-bottom: 16px;
  font-size: 12px;
}

.detail-item {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.detail-label {
  font-size: 11px;
  color: var(--muted);
  font-weight: 600;
}

.section {
  margin-bottom: 16px;
}

.section h4 {
  margin: 0;
  font-size: 13px;
}

.req {
  color: var(--red);
}

.detail-link {
  text-align: left;
}

.section__head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  margin-bottom: 8px;
}

.segments {
  display: flex;
  flex-wrap: wrap;
  gap: 4px;
}

.segments--sm .seg {
  padding: 2px 6px;
  font-size: 10px;
}

.seg {
  border: 1px solid var(--line);
  background: var(--lnb-side);
  border-radius: 6px;
  padding: 4px 10px;
  font-size: 11px;
  font-family: inherit;
  cursor: pointer;
  color: var(--ink-2);
}

.seg.active {
  font-weight: 700;
  border-width: 2px;
}

.seg--ok.active { border-color: #1a7f4b; color: #1a7f4b; background: #e8f5ee; }
.seg--err.active { border-color: #c0392b; color: #c0392b; background: #fdecea; }
.seg--wait.active { border-color: #5a6a7a; color: #5a6a7a; background: #eef2f6; }
.seg--warn.active { border-color: #b8860b; color: #b8860b; background: #fff8e6; }

.step-table,
.defect-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 12px;
}

.step-table th,
.step-table td,
.defect-table th,
.defect-table td {
  padding: 6px 8px;
  border: 1px solid var(--line);
}

.step-table th,
.defect-table th {
  background: var(--field);
  font-weight: 600;
}

.center {
  text-align: center;
}

.step-input {
  width: 100%;
  min-width: 160px;
  padding: 6px 8px;
  border: 1px solid var(--line);
  border-radius: 6px;
  font-family: inherit;
  font-size: 12px;
  line-height: 1.4;
  resize: vertical;
  box-sizing: border-box;
}

.attach-add {
  position: relative;
  overflow: hidden;
}

.attach-add__input {
  position: absolute;
  inset: 0;
  opacity: 0;
  cursor: pointer;
}

.attach-list {
  margin: 0;
  padding: 0;
  list-style: none;
  font-size: 12px;
}

.attach-list li {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 6px 0;
  border-bottom: 1px solid var(--line);
}

.attach-name {
  font-weight: 600;
}

.attach-meta {
  color: var(--muted);
  font-size: 11px;
}

.empty-hint {
  margin: 0;
  font-size: 12px;
  color: var(--muted);
}

.file-hint {
  margin: 0 0 8px;
  font-size: 11px;
  color: var(--muted);
}

.defect-section {
  padding: 12px;
  background: var(--teal-50);
  border-radius: 8px;
}

.defect-form {
  display: grid;
  grid-template-columns: 1fr 100px;
  gap: 8px;
  margin-bottom: 10px;
}

.defect-form .textarea {
  grid-column: 1 / -1;
}

.grade {
  color: var(--teal-600);
  font-weight: 600;
}

.status-sel {
  height: 28px;
  border: 1px solid var(--line);
  border-radius: 5px;
  font-size: 11px;
  font-family: inherit;
}

.status-sel--ok { border-color: #1a7f4b; color: #1a7f4b; }
.status-sel--wait { color: #5a6a7a; }
.status-sel--prog { border-color: var(--teal-400); color: var(--teal-700); }

.form-block {
  display: flex;
  flex-direction: column;
  gap: 6px;
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
}

.textarea {
  height: auto;
  padding: 8px 10px;
  resize: vertical;
}

.link-btn {
  border: none;
  background: none;
  color: var(--teal-600);
  cursor: pointer;
  font-size: 11px;
  margin-left: auto;
}
</style>
