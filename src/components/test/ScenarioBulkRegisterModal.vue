<script setup>
// POP-UAT-03 시나리오 일괄등록
import { ref } from 'vue'
import BaseModal from '@/components/ui/BaseModal.vue'
import ExcelDownloadButton from '@/components/ui/ExcelDownloadButton.vue'
import { mockExcelDownload } from '@/utils/excelDownload'
import { getBulkRegisterPreview } from '@/data/scenario'

const props = defineProps({
  visible: { type: Boolean, default: false },
  mode: { type: String, default: 'dev' },
})

const emit = defineEmits(['close', 'register'])

const fileName = ref('')
const previewRows = ref([])
const uploading = ref(false)

function reset() {
  fileName.value = ''
  previewRows.value = []
  uploading.value = false
}

function onFileChange(e) {
  const file = e.target.files?.[0]
  if (!file) return
  fileName.value = file.name
  uploading.value = true
  setTimeout(() => {
    previewRows.value = getBulkRegisterPreview(props.mode)
    uploading.value = false
  }, 400)
}

function downloadTemplate() {
  mockExcelDownload(
    '시나리오 일괄등록 양식',
    [
      {
        caseId: 'TC-001',
        caseName: '샘플 케이스명',
        screenName: '화면명',
        systemPath: 'FO>법인숙박',
        screenPath: '여행레저>복지혜택',
        round: '1차',
        stepNo: 1,
        procedure: '테스트 절차 입력',
        expected: '예상결과 입력',
      },
    ],
    [
      { key: 'caseId', label: '케이스ID' },
      { key: 'caseName', label: '케이스명' },
      { key: 'screenName', label: '화면명' },
      { key: 'systemPath', label: '시스템경로' },
      { key: 'screenPath', label: '화면경로' },
      { key: 'round', label: '차수' },
      { key: 'stepNo', label: '절차NO' },
      { key: 'procedure', label: '테스트절차' },
      { key: 'expected', label: '예상결과' },
    ],
  )
}

function register() {
  if (!previewRows.value.length) return
  emit('register', previewRows.value)
  reset()
  emit('close')
}

function close() {
  reset()
  emit('close')
}
</script>

<template>
  <BaseModal :visible="visible" title="시나리오 일괄등록 (POP-UAT-03)" @close="close">
    <p class="guide">
      엑셀 양식을 다운로드한 뒤 케이스·절차 정보를 입력하고 업로드하세요.
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

    <div v-if="previewRows.length" class="preview">
      <h4>미리보기 ({{ previewRows.length }}건)</h4>
      <table class="preview-table">
        <thead>
          <tr>
            <th>케이스 ID</th>
            <th>케이스명</th>
            <th>화면명</th>
            <th>차수</th>
            <th>절차 수</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="row in previewRows" :key="row.caseId">
            <td>{{ row.caseId }}</td>
            <td>{{ row.caseName }}</td>
            <td>{{ row.screenName }}</td>
            <td>{{ row.round }}</td>
            <td>{{ row.steps.length }}</td>
          </tr>
        </tbody>
      </table>
    </div>

    <template #footer>
      <button type="button" class="btn btn--ghost" @click="close">취소</button>
      <button
        type="button"
        class="btn btn--primary"
        :disabled="!previewRows.length || uploading"
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
  color: var(--ink-2);
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
  color: var(--ink-2);
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
  color: var(--muted);
  margin: 0 0 12px;
}

.preview h4 {
  margin: 0 0 8px;
  font-size: 13px;
}

.preview-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 11px;
}

.preview-table th,
.preview-table td {
  padding: 6px 8px;
  border: 1px solid var(--line);
  text-align: left;
}

.preview-table th {
  background: var(--field);
}
</style>
