<script setup>
// POP-S-TST-02 단위테스트 상세
import { computed, ref, watch } from 'vue'
import { useRouter } from 'vue-router'
import BaseModal from '@/shared/ui/BaseModal.vue'
import BaseTooltip from '@/shared/ui/BaseTooltip.vue'
import {
  actionStatusValues,
  defectGradeOptions,
  defectStatusClass,
  testResultClass,
} from '@/shared/lib/testConfig'

const ATTACH_MAX_COUNT = 3
const ATTACH_MAX_SIZE = 10 * 1024 * 1024
const ATTACH_ALLOWED_EXT = ['jpg', 'jpeg', 'png', 'doc', 'docx', 'xls', 'xlsx', 'ppt', 'pptx']
const ATTACH_HINT = '등록 가능 확장자: jpg, png, word, excel, ppt, pptx · 최대 3개, 개당 10MB 이하'
// 단위테스트 결과 중 사용자가 절차별로 직접 고를 수 있는 값('대기'는 미착수 상태라 되돌리는
// 선택지를 따로 두지 않는다) — h-pms STEP_RESULT_OPTIONS와 동일 구성.
const STEP_RESULT_OPTIONS = ['정상', '오류', '테스트불가', '개선필요']
const DEFECT_GRADES = defectGradeOptions.filter((g) => g !== '전체')

const props = defineProps({
  visible: { type: Boolean, default: false },
  row: { type: Object, default: null },
})

const emit = defineEmits(['close', 'save'])

const router = useRouter()

const memo = ref('')
const procedure = ref('')
const expected = ref('')
const steps = ref([])
const attachments = ref([])
const defects = ref([])

const defectTitle = ref('')
const defectGrade = ref('Minor')
const defectContent = ref('')
const defectActionStatus = ref('')

/** 테스트 제외 처리된 케이스는 조회만 가능하다 — 목록에서 딤 처리되는 것과 같은 조건. */
const readonly = computed(() => !!props.row?.excluded)
const readonlyMessage = '이 케이스는 테스트 제외 처리되어 조회만 가능합니다.'

watch(
  () => props.row,
  (row) => {
    if (!row) return
    memo.value = row.memo || ''
    steps.value = row.steps?.map((s) => ({ ...s })) || []
    procedure.value = steps.value[0]?.procedure || ''
    expected.value = steps.value[0]?.expected || ''
    attachments.value = row.attachments?.map((a) => ({ ...a })) || []
    defects.value = row.defects?.map((d) => ({ ...d })) || []
    defectTitle.value = ''
    defectGrade.value = 'Minor'
    defectContent.value = ''
    defectActionStatus.value = ''
  },
  { immediate: true },
)

const segmentClass = (val) => testResultClass(val)

/** 절차별 결과에서 파생되는 전체 결과 — 전부 정상이면 정상, 오류가 하나라도 있으면 오류 순. */
const overallResult = computed(() => {
  const results = steps.value.map((s) => s.result).filter(Boolean)
  if (!results.length) return props.row?.testResult || '대기'
  if (results.every((r) => r === '정상')) return '정상'
  if (results.some((r) => r === '오류')) return '오류'
  if (results.some((r) => r === '테스트불가')) return '테스트불가'
  if (results.some((r) => r === '개선필요')) return '개선필요'
  return '대기'
})

const hasErrorOrImprove = computed(() =>
  steps.value.some((s) => s.result === '오류' || s.result === '개선필요'),
)

function setStepResult(step, val) {
  if (readonly.value) return
  step.result = val
}

function goRequirement() {
  if (!props.row?.requirementId) return
  router.push({ path: '/workspace/requirement', query: { reqId: props.row.requirementId } })
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
    const ext = file.name.split('.').pop()?.toLowerCase()
    if (!ATTACH_ALLOWED_EXT.includes(ext)) {
      window.alert(`${file.name}: jpg, png, word, excel, ppt 형식만 첨부 가능합니다.`)
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
  if (readonly.value) return
  attachments.value = attachments.value.filter((a) => a.id !== id)
}

function save() {
  if (readonly.value) return
  if (hasErrorOrImprove.value) {
    if (!defectTitle.value.trim()) {
      window.alert('오류/개선필요인 경우 결함 제목을 입력해 주세요.')
      return
    }
    if (!defectActionStatus.value) {
      window.alert('조치상태를 선택해 주세요.')
      return
    }
    if (!defectContent.value.trim()) {
      window.alert('오류 내용을 입력해 주세요.')
      return
    }
  }
  const proc = procedure.value.trim()
  const exp = expected.value.trim()
  if ((proc && !exp) || (!proc && exp)) {
    window.alert('절차와 예상결과를 모두 입력해 주세요.')
    return
  }
  if (!proc && !steps.value.length) {
    window.alert('절차와 예상결과를 입력해 주세요.')
    return
  }
  if (!window.confirm('단위테스트 결과를 저장하시겠습니까?')) return

  const nextSteps = steps.value.map((s) => ({ ...s }))
  if (nextSteps.length) {
    nextSteps[0].procedure = proc
    nextSteps[0].expected = exp
  } else if (proc) {
    nextSteps.push({ no: 1, procedure: proc, expected: exp, result: '대기' })
  }

  emit('save', {
    testResult: overallResult.value,
    memo: memo.value,
    steps: nextSteps,
    attachments: attachments.value,
    defects: defects.value,
    defect: hasErrorOrImprove.value
      ? {
          title: defectTitle.value.trim(),
          grade: defectGrade.value,
          status: defectActionStatus.value,
          content: defectContent.value.trim(),
        }
      : null,
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
      <p v-if="readonly" class="notice notice--plain">{{ readonlyMessage }}</p>

      <div class="detail-grid">
        <div class="detail-item">
          <span class="detail-label">화면명</span>
          <span class="detail-value">{{ row.screenName }}</span>
        </div>
        <div class="detail-item">
          <span class="detail-label">화면경로</span>
          <span class="detail-value">{{ row.screenPath }}</span>
        </div>
        <div class="detail-item">
          <span class="detail-label">메뉴명</span>
          <span class="detail-value">{{ row.menuName || '-' }}</span>
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
          <span v-else class="detail-value">{{ row.requirementName || '-' }}</span>
        </div>
        <div class="detail-item">
          <span class="detail-label">시스템/업무</span>
          <span class="detail-value">{{ row.systemPath }}</span>
        </div>
        <div class="detail-item">
          <span class="detail-label">업무구분</span>
          <span class="detail-value">{{ row.bizCategory }}</span>
        </div>
        <div class="detail-item">
          <span class="detail-label">업무유형</span>
          <span class="detail-value">{{ row.taskType }}</span>
        </div>
        <div class="detail-item">
          <span class="detail-label">담당자</span>
          <span class="detail-value">{{ row.assignee }}</span>
        </div>
        <div class="detail-item">
          <span class="detail-label">난이도</span>
          <span class="detail-value">{{ row.difficulty }}</span>
        </div>
        <div class="detail-item">
          <span class="detail-label">최종실행일</span>
          <span class="detail-value">{{ row.lastExecutedAt || '-' }}</span>
        </div>
      </div>

      <section class="box">
        <h4 class="box__title">테스트 결과</h4>
        <span class="badge" :class="`badge--${segmentClass(overallResult)}`">{{ overallResult }}</span>
      </section>

      <section class="box">
        <h4 class="box__title">절차 / 예상결과 <span class="req">*</span></h4>
        <div class="form-block">
          <label>절차 <span class="req">*</span></label>
          <textarea
            v-model="procedure"
            class="inp textarea"
            rows="2"
            maxlength="1000"
            :disabled="readonly"
            placeholder="테스트 절차를 입력하세요"
          />
        </div>
        <div class="form-block">
          <label>예상결과 <span class="req">*</span></label>
          <textarea
            v-model="expected"
            class="inp textarea"
            rows="2"
            maxlength="1000"
            :disabled="readonly"
            placeholder="예상결과를 입력하세요"
          />
        </div>

        <p v-if="!steps.length" class="empty-hint">
          절차를 입력하고 저장하면 아래에 결과를 입력할 행이 생깁니다.
        </p>
        <table v-else class="step-table">
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
              <td>{{ step.procedure }}</td>
              <td>{{ step.expected }}</td>
              <td>
                <div class="segments">
                  <button
                    v-for="opt in STEP_RESULT_OPTIONS"
                    :key="opt"
                    type="button"
                    class="seg"
                    :class="[`seg--${segmentClass(opt)}`, { active: step.result === opt }]"
                    :disabled="readonly"
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

      <section class="box">
        <div class="attach-head">
          <h4 class="box__title">첨부파일</h4>
          <BaseTooltip :text="ATTACH_HINT" />
          <label
            v-if="attachments.length < ATTACH_MAX_COUNT && !readonly"
            class="btn btn--ghost btn--sm attach-add"
          >
            + 파일 추가
            <input type="file" multiple accept=".jpg,.jpeg,.png,.doc,.docx,.xls,.xlsx,.ppt,.pptx" class="attach-add__input" @change="onAttachmentChange" />
          </label>
        </div>
        <ul v-if="attachments.length" class="attach-list">
          <li v-for="file in attachments" :key="file.id">
            <span class="attach-name">{{ file.name }}</span>
            <span class="attach-meta">{{ file.size }} · {{ file.uploadedAt }}</span>
            <button type="button" class="link-btn" :disabled="readonly" @click="removeAttachment(file.id)">삭제</button>
          </li>
        </ul>
        <p v-else class="empty-hint">첨부된 파일이 없습니다.</p>
      </section>

      <section v-if="hasErrorOrImprove || defects.length" class="box defect-section">
        <h4 class="box__title">결함처리</h4>

        <div v-if="hasErrorOrImprove" class="defect-form">
          <div class="form-block">
            <label>결함 제목 <span class="req">*</span></label>
            <input v-model="defectTitle" type="text" class="inp" :disabled="readonly" placeholder="결함 제목" />
          </div>
          <div class="form-block">
            <label>등급</label>
            <div class="segments">
              <button
                v-for="g in DEFECT_GRADES"
                :key="g"
                type="button"
                class="seg"
                :class="{ active: defectGrade === g }"
                :disabled="readonly"
                @click="defectGrade = g"
              >
                {{ g }}
              </button>
            </div>
          </div>
          <div class="form-block">
            <label>내용 <span class="req">*</span></label>
            <textarea v-model="defectContent" class="inp textarea" rows="2" :disabled="readonly" placeholder="오류 내용을 입력하세요" />
          </div>
          <div class="form-block">
            <label>조치상태 <span class="req">*</span></label>
            <div class="segments">
              <button
                v-for="s in actionStatusValues"
                :key="s"
                type="button"
                class="seg"
                :class="[`seg--${defectStatusClass(s)}`, { active: defectActionStatus === s }]"
                :disabled="readonly"
                @click="defectActionStatus = s"
              >
                {{ s }}
              </button>
            </div>
          </div>
        </div>

        <table v-if="defects.length" class="defect-table">
          <thead>
            <tr>
              <th>등급</th>
              <th>제목</th>
              <th>내용</th>
              <th>조치상태</th>
              <th>등록일</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="d in defects" :key="d.id">
              <td class="grade">{{ d.grade || '-' }}</td>
              <td>{{ d.title || '-' }}</td>
              <td class="defect-table__content">{{ d.content || '-' }}</td>
              <td>
                <span class="badge" :class="`badge--${defectStatusClass(d.status)}`">{{ d.status }}</span>
              </td>
              <td>{{ d.registeredAt }}</td>
            </tr>
          </tbody>
        </table>
      </section>

      <div class="form-block">
        <label>메모</label>
        <textarea v-model="memo" class="inp textarea" rows="3" :disabled="readonly" placeholder="테스트 메모" />
      </div>
    </template>

    <template #footer>
      <button type="button" class="btn btn--ghost" @click="$emit('close')">닫기</button>
      <button
        type="button"
        class="btn btn--primary"
        :disabled="readonly"
        :title="readonly ? readonlyMessage : ''"
        @click="save"
      >
        저장
      </button>
    </template>
  </BaseModal>
</template>

<style scoped>
.box {
  margin-bottom: 16px;
  padding: 14px 16px;
  border: 1px solid var(--line);
  border-radius: 10px;
}

.box__title {
  margin: 0 0 10px;
  font-size: calc(13px + var(--font-size-offset, 0px));
  font-weight: 700;
  color: var(--ink);
}

.detail-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 10px 16px;
  margin-bottom: 16px;
}

.detail-item {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.detail-label {
  font-size: calc(13px + var(--font-size-offset, 0px));
  color: var(--ink);
  font-weight: 700;
}

.detail-value {
  font-size: calc(12px + var(--font-size-offset, 0px));
  font-weight: 400;
  color: var(--muted);
}

.req {
  color: var(--red);
}

.detail-link {
  text-align: left;
  font-size: calc(12px + var(--font-size-offset, 0px));
}

.segments {
  display: flex;
  flex-wrap: wrap;
  gap: 4px;
}

.seg {
  border: 1px solid var(--line);
  background: var(--lnb-side);
  border-radius: 6px;
  padding: 4px 10px;
  font-size: calc(11px + var(--font-size-offset, 0px));
  font-family: inherit;
  cursor: pointer;
  color: var(--ink-2);
}

.seg:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.seg.active {
  font-weight: 700;
  border-width: 2px;
}

.seg--ok.active { border-color: var(--green); color: var(--green); background: var(--green-bg); }
.seg--err.active { border-color: var(--red); color: var(--red); background: var(--red-bg); }
.seg--wait.active { border-color: var(--gray); color: var(--gray); background: var(--gray-bg); }
.seg--warn.active { border-color: var(--orange); color: var(--orange); background: var(--orange-bg); }
.seg--prog.active { border-color: var(--teal-400); color: var(--teal-700); background: var(--teal-50); }
.seg--muted.active { border-color: var(--gray); color: var(--gray); background: var(--gray-bg); }

.form-block {
  display: flex;
  flex-direction: column;
  gap: 6px;
  margin-bottom: 10px;
}

.form-block:last-child {
  margin-bottom: 0;
}

.form-block label {
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

.inp:disabled,
.textarea:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.textarea {
  height: auto;
  padding: 8px 10px;
  resize: vertical;
}

.attach-head {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 8px;
}

.attach-head .box__title {
  margin: 0;
}

.attach-add {
  position: relative;
  overflow: hidden;
  margin-left: auto;
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
  font-size: calc(12px + var(--font-size-offset, 0px));
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
  font-size: calc(11px + var(--font-size-offset, 0px));
}

.empty-hint {
  margin: 0;
  font-size: calc(12px + var(--font-size-offset, 0px));
  color: var(--muted);
}

.step-table,
.defect-table {
  width: 100%;
  border-collapse: collapse;
  font-size: calc(12px + var(--font-size-offset, 0px));
  margin-top: 4px;
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

.defect-table__content {
  max-width: 320px;
  word-break: break-word;
  white-space: pre-wrap;
}

.defect-section {
  background: var(--teal-50);
}

.defect-form {
  margin-bottom: 10px;
}

.grade {
  color: var(--teal-600);
  font-weight: 600;
}

.badge {
  display: inline-block;
  padding: 2px 8px;
  border-radius: 999px;
  font-size: calc(11px + var(--font-size-offset, 0px));
  font-weight: 600;
}

.badge--ok { background: var(--green-bg); color: var(--green); }
.badge--err { background: var(--red-bg); color: var(--red); }
.badge--wait { background: var(--gray-bg); color: var(--gray); }
.badge--warn { background: var(--orange-bg); color: var(--orange); }
.badge--prog { background: var(--teal-50); color: var(--teal-700); }
.badge--muted { background: var(--gray-bg); color: var(--gray); }

.link-btn {
  border: none;
  background: none;
  color: var(--teal-600);
  cursor: pointer;
  font-size: calc(11px + var(--font-size-offset, 0px));
  margin-left: auto;
}

.link-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}
</style>
