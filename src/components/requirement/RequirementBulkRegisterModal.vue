<script setup>
// PAG-S-REQ-05 요구사항 일괄등록
import { computed, ref } from 'vue'
import BaseModal from '@/components/ui/BaseModal.vue'
import ExcelDownloadButton from '@/components/ui/ExcelDownloadButton.vue'
import { mockExcelDownload } from '@/utils/excelDownload'
import {
  getRequirementBulkPreview,
  normalizeRequirementBulkRow,
  requirementBulkTemplateColumns,
  requirementBulkTemplateSample,
  validateRequirementBulkRow,
} from '@/data/requirement'

defineProps({
  modelValue: { type: Boolean, default: false },
})

const emit = defineEmits(['update:modelValue', 'register'])

const fileName = ref('')
const uploading = ref(false)
const allRows = ref([])
const displayRows = ref([])
const showFailedOnly = ref(false)
const resultMessage = ref('')
const resultType = ref('') // success | fail | ''

const previewCount = computed(() => displayRows.value.length)

function reset() {
  fileName.value = ''
  uploading.value = false
  allRows.value = []
  displayRows.value = []
  showFailedOnly.value = false
  resultMessage.value = ''
  resultType.value = ''
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

function onFileChange(e) {
  const file = e.target.files?.[0]
  if (!file) return
  fileName.value = file.name
  uploading.value = true
  showFailedOnly.value = false
  resultMessage.value = ''
  resultType.value = ''
  setTimeout(() => {
    allRows.value = getRequirementBulkPreview()
    displayRows.value = [...allRows.value]
    uploading.value = false
  }, 400)
  e.target.value = ''
}

function validateAll(rows) {
  return rows.map((row) => {
    const validation = validateRequirementBulkRow(row)
    return {
      ...row,
      _ok: validation.ok,
      _errors: validation.errors,
      _validation: validation,
    }
  })
}

function register() {
  if (!allRows.value.length || uploading.value) return

  const checked = validateAll(allRows.value)
  const failed = checked.filter((r) => !r._ok)
  const passed = checked.filter((r) => r._ok)

  if (failed.length) {
    showFailedOnly.value = true
    displayRows.value = failed
    resultType.value = 'fail'
    resultMessage.value = `유효성 검사 실패 ${failed.length}건 · 실패 행만 표시합니다. 수정 후 다시 업로드하세요.`
    return
  }

  if (!window.confirm(`${passed.length}건을 일괄 등록하시겠습니까?`)) return

  const payload = passed.map((row) => normalizeRequirementBulkRow(row, row._validation))
  emit('register', payload)
  resultType.value = 'success'
  resultMessage.value = `${payload.length}건이 정상 등록되었습니다.`
  window.alert(resultMessage.value)
  close()
}
</script>

<template>
  <BaseModal
    title="요구사항 일괄등록 (PAG-S-REQ-05)"
    :visible="modelValue"
    wide
    @close="close"
  >
    <p class="guide">
      엑셀 양식을 다운로드한 뒤 요구사항 정보를 입력하고 업로드하세요.<br />
      구분·시스템·업무구분·요구사항명·원안·업무유형은 필수입니다.
    </p>

    <div class="actions-row">
      <ExcelDownloadButton title="양식 다운로드" @click="downloadTemplate" />
      <span class="actions-row__label">양식 다운로드</span>
      <label class="upload-btn">
        파일업로드
        <input type="file" accept=".xlsx,.xls,.csv" hidden @change="onFileChange" />
      </label>
    </div>

    <p v-if="fileName" class="file-name">
      선택 파일: <b>{{ fileName }}</b>
      <span v-if="uploading"> · 파싱 중...</span>
    </p>

    <p
      v-if="resultMessage"
      class="result"
      :class="resultType === 'fail' ? 'result--fail' : 'result--ok'"
    >
      {{ resultMessage }}
    </p>

    <div v-if="displayRows.length" class="preview">
      <h4>
        {{ showFailedOnly ? '유효성 실패 행' : '미리보기' }}
        ({{ previewCount }}건)
      </h4>
      <div class="table-wrap">
        <table class="preview-table">
          <thead>
            <tr>
              <th>행</th>
              <th>구분</th>
              <th>시스템/업무</th>
              <th>요구사항명</th>
              <th>업무유형</th>
              <th>우선순위</th>
              <th v-if="showFailedOnly">실패사유</th>
            </tr>
          </thead>
          <tbody>
            <tr
              v-for="row in displayRows"
              :key="row.rowNo"
              :class="{ 'is-fail': showFailedOnly }"
            >
              <td>{{ row.rowNo }}</td>
              <td>{{ row.reqType }}</td>
              <td>{{ row.system }}{{ row.bizCategory ? ` > ${row.bizCategory}` : '' }}</td>
              <td>{{ row.name || '—' }}</td>
              <td>{{ row.taskTypes || '—' }}</td>
              <td>{{ row.priority || '—' }}</td>
              <td v-if="showFailedOnly" class="fail-reason">
                {{ (row._errors || []).join(', ') }}
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <template #footer>
      <button type="button" class="btn btn--ghost" @click="close">취소</button>
      <button
        type="button"
        class="btn btn--primary"
        :disabled="!allRows.length || uploading"
        @click="register"
      >
        등록
      </button>
    </template>
  </BaseModal>
</template>

<style scoped>
.guide {
  margin: 0 0 12px;
  font-size: 12px;
  color: var(--lnb-txt);
  line-height: 1.5;
}

.actions-row {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 12px;
}

.actions-row__label {
  font-size: 12px;
  color: var(--lnb-muted);
}

.upload-btn {
  display: inline-flex;
  align-items: center;
  height: 28px;
  padding: 0 12px;
  border: 1px solid var(--teal-600);
  border-radius: 7px;
  background: var(--teal-50);
  color: var(--teal-600);
  font-size: 12px;
  font-weight: 600;
  cursor: pointer;
}

.file-name {
  font-size: 12px;
  color: var(--lnb-muted);
  margin: 0 0 12px;
}

.result {
  margin: 0 0 12px;
  padding: 10px 12px;
  border-radius: 8px;
  font-size: 12px;
  font-weight: 600;
  line-height: 1.5;
}

.result--ok {
  background: var(--green-bg);
  color: var(--green);
}

.result--fail {
  background: var(--red-bg);
  color: var(--red);
}

.preview h4 {
  margin: 0 0 8px;
  font-size: 13px;
}

.table-wrap {
  border: 1px solid var(--lnb-line);
  border-radius: 10px;
  overflow: auto;
  max-height: 320px;
}

.preview-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 11px;
}

.preview-table th,
.preview-table td {
  padding: 7px 9px;
  border-bottom: 1px solid var(--lnb-line);
  text-align: left;
  vertical-align: top;
}

.preview-table th {
  background: var(--lnb-side);
  color: var(--lnb-muted);
  font-weight: 600;
  white-space: nowrap;
  position: sticky;
  top: 0;
}

.preview-table tr:last-child td {
  border-bottom: none;
}

.is-fail td {
  background: var(--red-bg);
}

.fail-reason {
  color: var(--red);
  font-weight: 600;
  max-width: 220px;
}
</style>
