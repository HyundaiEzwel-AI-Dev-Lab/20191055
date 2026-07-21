<script setup>
// POP-S-REQ-03 요구사항 일괄등록 (엑셀 업로드) — SB 91~92
import { computed, ref, watch } from 'vue'
import BaseModal from '@/components/ui/BaseModal.vue'
import { mockExcelDownload } from '@/utils/excelDownload'
import {
  getRequirementBulkPreview,
  normalizeRequirementBulkRow,
  requirementBulkTemplateColumns,
  requirementBulkTemplateSample,
  validateRequirementBulkRow,
} from '@/data/requirement'

const props = defineProps({
  modelValue: { type: Boolean, default: false },
})

const emit = defineEmits(['update:modelValue', 'register'])

const fileName = ref('')
const fileSizeLabel = ref('')
const dragOver = ref(false)
const uploading = ref(false)
const validated = ref(false)
const checkedRows = ref([])
const phase = ref('idle') // idle | result

const summary = computed(() => {
  const total = checkedRows.value.length
  const ok = checkedRows.value.filter((r) => r._ok).length
  const fail = total - ok
  return { total, ok, fail }
})

const allPassed = computed(
  () => validated.value && summary.value.total > 0 && summary.value.fail === 0,
)

const failedRows = computed(() => checkedRows.value.filter((r) => !r._ok))

watch(
  () => props.modelValue,
  (open) => {
    if (!open) reset()
  },
)

function reset() {
  fileName.value = ''
  fileSizeLabel.value = ''
  dragOver.value = false
  uploading.value = false
  validated.value = false
  checkedRows.value = []
  phase.value = 'idle'
}

function close() {
  reset()
  emit('update:modelValue', false)
}

function downloadTemplate() {
  mockExcelDownload(
    '요구사항 일괄등록 양식',
    requirementBulkTemplateSample,
    requirementBulkTemplateColumns,
  )
}

function acceptFile(file) {
  if (!file) return
  const lower = file.name.toLowerCase()
  if (!lower.endsWith('.xlsx') && !lower.endsWith('.xls') && !lower.endsWith('.csv')) {
    window.alert('정해진 양식의 엑셀파일만 업로드할 수 있습니다.')
    return
  }
  fileName.value = file.name
  const kb = Math.max(1, Math.round(file.size / 1024))
  fileSizeLabel.value = `${kb}KB`
  validated.value = false
  checkedRows.value = []
  phase.value = 'idle'
}

function onFileChange(e) {
  acceptFile(e.target.files?.[0])
  e.target.value = ''
}

function onDrop(e) {
  dragOver.value = false
  acceptFile(e.dataTransfer?.files?.[0])
}

function removeFile() {
  fileName.value = ''
  fileSizeLabel.value = ''
  validated.value = false
  checkedRows.value = []
  phase.value = 'idle'
}

function runUpload() {
  if (!fileName.value) {
    window.alert('첨부할 파일을 선택해 주세요.')
    return
  }
  if (!window.confirm('파일을 업로드 하시겠습니까?')) return

  uploading.value = true
  setTimeout(() => {
    const raw = getRequirementBulkPreview()
    checkedRows.value = raw.map((row) => {
      const validation = validateRequirementBulkRow(row)
      return {
        ...row,
        _ok: validation.ok,
        _errors: validation.errors,
        _validation: validation,
      }
    })
    validated.value = true
    phase.value = 'result'
    uploading.value = false
  }, 450)
}

function onConfirm() {
  if (!validated.value) {
    close()
    return
  }
  if (summary.value.fail > 0) {
    close()
    return
  }
  const payload = checkedRows.value.map((row) =>
    normalizeRequirementBulkRow(row, row._validation),
  )
  emit('register', payload)
  window.alert(
    `총 ${payload.length}건 모두 유효성 검사가 완료되었습니다.\n등록된 요구사항은 요구사항 관리 메뉴에서 확인할 수 있습니다.`,
  )
  close()
}
</script>

<template>
  <BaseModal title="일괄 등록 (엑셀 업로드)" :visible="modelValue" wide @close="close">
    <p class="guide">
      정해진 양식의 엑셀파일만 업로드할 수 있습니다.<br />
      파일 업로드 후 유효성 검사 시 실패 건수가 없어야 요구사항을 등록할 수 있습니다.
    </p>

    <section class="upload-panel">
      <div class="upload-panel__head">
        <h4>엑셀업로드</h4>
        <div class="upload-panel__actions">
          <button type="button" class="btn btn--ghost btn--sm" @click="downloadTemplate">
            양식 다운로드
          </button>
          <label class="btn btn--ghost btn--sm file-btn">
            파일추가
            <input type="file" accept=".xlsx,.xls,.csv" hidden @change="onFileChange" />
          </label>
        </div>
      </div>

      <div
        class="dropzone"
        :class="{ 'dropzone--over': dragOver, 'dropzone--has': !!fileName }"
        @dragover.prevent="dragOver = true"
        @dragleave.prevent="dragOver = false"
        @drop.prevent="onDrop"
      >
        <template v-if="!fileName">
          <p>첨부할 파일을 마우스로 끌어서 추가할 수 있습니다.</p>
        </template>
        <template v-else>
          <div class="file-chip">
            <span class="file-chip__name">{{ fileName }}</span>
            <span class="file-chip__size">{{ fileSizeLabel }}</span>
            <button type="button" class="file-chip__x" @click="removeFile">×</button>
          </div>
        </template>
      </div>

      <div class="upload-panel__footer">
        <button
          type="button"
          class="btn btn--primary btn--sm"
          :disabled="!fileName || uploading"
          @click="runUpload"
        >
          {{ uploading ? '업로드 중…' : '파일 업로드' }}
        </button>
      </div>
    </section>

    <section v-if="phase === 'result'" class="result-panel">
      <h4>유효성 결과</h4>
      <div class="summary">
        <span>전체 <b>{{ summary.total }}</b>건</span>
        <span class="summary--ok">정상 <b>{{ summary.ok }}</b>건</span>
        <span class="summary--fail">실패 <b>{{ summary.fail }}</b>건</span>
      </div>

      <p v-if="allPassed" class="result-msg result-msg--ok">
        총 {{ summary.total }}건 모두 유효성 검사가 완료되었습니다.<br />
        등록된 요구사항은 요구사항 관리 메뉴에서 확인할 수 있습니다.
      </p>

      <template v-else>
        <p class="result-msg result-msg--fail">파일 업로드 실패 내역 확인</p>
        <div class="table-wrap">
          <table class="fail-table">
            <thead>
              <tr>
                <th>NO</th>
                <th>요건구분</th>
                <th>중요도</th>
                <th>적용시스템</th>
                <th>요청사항명</th>
                <th>요구사항 원안</th>
                <th>업무구분</th>
                <th>화면명</th>
                <th>업무유형</th>
                <th>실패 사유</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="row in failedRows" :key="row.rowNo" class="is-fail">
                <td>{{ row.rowNo }}</td>
                <td>{{ row.reqType }}</td>
                <td>{{ row.priority || '-' }}</td>
                <td>{{ row.system || '-' }}</td>
                <td>{{ row.name || '-' }}</td>
                <td class="cell-clip">{{ row.original || '-' }}</td>
                <td>{{ row.bizCategory || '-' }}</td>
                <td>{{ row.screenMenu || '-' }}</td>
                <td>{{ row.taskTypes || '-' }}</td>
                <td class="fail-reason">{{ (row._errors || []).join(', ') }}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </template>
    </section>

    <template #footer>
      <button type="button" class="btn btn--ghost" @click="close">취소</button>
      <button type="button" class="btn btn--primary" @click="onConfirm">확인</button>
    </template>
  </BaseModal>
</template>

<style scoped>
.guide {
  margin: 0 0 14px;
  font-size: 12px;
  color: var(--lnb-muted);
  line-height: 1.55;
}

.upload-panel {
  border: 1px solid var(--lnb-line);
  border-radius: var(--radius-md, 8px);
  padding: 14px;
  margin-bottom: 16px;
  background: var(--lnb-side);
}

.upload-panel__head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
  margin-bottom: 10px;
}

.upload-panel__head h4,
.result-panel h4 {
  margin: 0;
  font-size: 13px;
  font-weight: 700;
}

.upload-panel__actions {
  display: flex;
  gap: 6px;
}

.file-btn {
  cursor: pointer;
  display: inline-flex;
  align-items: center;
}

.dropzone {
  min-height: 88px;
  border: 1px dashed var(--lnb-line);
  border-radius: var(--radius-md, 8px);
  background: var(--field);
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 16px;
  color: var(--lnb-muted);
  font-size: 12px;
  text-align: center;
}

.dropzone--over {
  border-color: var(--teal);
  background: var(--teal-50);
}

.dropzone--has {
  border-style: solid;
  justify-content: flex-start;
}

.file-chip {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 6px 10px;
  border: 1px solid var(--lnb-line);
  border-radius: var(--radius-sm, 6px);
  background: var(--lnb-side);
  font-size: 12px;
}

.file-chip__name {
  font-weight: 600;
  color: var(--lnb-txt);
}

.file-chip__size {
  color: var(--lnb-muted);
}

.file-chip__x {
  border: none;
  background: none;
  cursor: pointer;
  font-size: 16px;
  color: var(--lnb-muted);
  line-height: 1;
  padding: 0 2px;
}

.upload-panel__footer {
  display: flex;
  justify-content: flex-end;
  margin-top: 10px;
}

.result-panel {
  margin-top: 4px;
}

.summary {
  display: flex;
  gap: 14px;
  margin: 10px 0 12px;
  font-size: 12px;
  color: var(--lnb-txt);
}

.summary b {
  font-weight: 700;
}

.summary--ok b {
  color: var(--green);
}

.summary--fail b {
  color: var(--red);
}

.result-msg {
  margin: 0 0 12px;
  padding: 10px 12px;
  border-radius: var(--radius-md, 8px);
  font-size: 12px;
  line-height: 1.55;
  font-weight: 600;
}

.result-msg--ok {
  background: var(--green-bg);
  color: var(--green);
}

.result-msg--fail {
  background: var(--red-bg);
  color: var(--red);
}

.table-wrap {
  border: 1px solid var(--lnb-line);
  border-radius: var(--radius-md, 8px);
  overflow: auto;
  max-height: 280px;
}

.fail-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 11px;
  min-width: 900px;
}

.fail-table th,
.fail-table td {
  padding: 7px 8px;
  border-bottom: 1px solid var(--lnb-line);
  text-align: left;
  vertical-align: top;
}

.fail-table th {
  background: var(--lnb-side);
  color: var(--lnb-muted);
  font-weight: 600;
  white-space: nowrap;
  position: sticky;
  top: 0;
}

.is-fail td {
  background: var(--red-bg);
}

.fail-reason {
  color: var(--red);
  font-weight: 700;
  max-width: 180px;
}

.cell-clip {
  max-width: 140px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
</style>
