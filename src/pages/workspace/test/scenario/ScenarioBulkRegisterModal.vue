<script setup>
// POP-UAT-03 시나리오 일괄등록
import { computed, ref } from 'vue'
import BaseModal from '@/shared/ui/BaseModal.vue'
import ExcelDownloadButton from '@/shared/ui/ExcelDownloadButton.vue'
import { mockExcelDownload } from '@/shared/file-excel/excelDownload'
import { getBulkRegisterPreview, validateScenarioBulkRow } from '@/entities/scenario/mock/scenario'

const props = defineProps({
  visible: { type: Boolean, default: false },
  mode: { type: String, default: 'dev' },
})

const emit = defineEmits(['close', 'register'])

const fileName = ref('')
const previewRows = ref([])
const uploading = ref(false)
const isDragging = ref(false)

const validRows = computed(() => previewRows.value.filter((r) => r.validation.ok))
const failedRows = computed(() => previewRows.value.filter((r) => !r.validation.ok))
const newCount = computed(() => validRows.value.filter((r) => !r.validation.isUpdate).length)
const updateCount = computed(() => validRows.value.filter((r) => r.validation.isUpdate).length)

function reset() {
  fileName.value = ''
  previewRows.value = []
  uploading.value = false
  isDragging.value = false
}

function parseFile(file) {
  if (!file) return
  fileName.value = file.name
  uploading.value = true
  setTimeout(() => {
    previewRows.value = getBulkRegisterPreview(props.mode).map((row) => ({
      ...row,
      validation: validateScenarioBulkRow(row),
    }))
    uploading.value = false
  }, 400)
}

function onFileChange(e) {
  parseFile(e.target.files?.[0])
}

function onDrop(e) {
  isDragging.value = false
  parseFile(e.dataTransfer?.files?.[0])
}

function downloadTemplate() {
  mockExcelDownload(
    '시나리오 일괄등록 양식',
    [
      {
        reqId: 'REQ-001',
        executionType: '오픈 전',
        systemBiz: 'FO>법인숙박',
        screenPath: '여행레저>복지혜택',
        screenName: '화면명',
        screenId: 'FO-001',
        caseId: 'TC-001',
        caseName: '샘플 케이스명',
        stepNo: 1,
        procedure: '테스트 절차 입력',
        expected: '예상결과 입력',
      },
    ],
    [
      { key: 'reqId', label: '요구사항 ID' },
      { key: 'executionType', label: '수행구분' },
      { key: 'systemBiz', label: '시스템 > 업무구분' },
      { key: 'screenPath', label: '화면경로' },
      { key: 'screenName', label: '화면명' },
      { key: 'screenId', label: '화면ID' },
      { key: 'caseId', label: '케이스ID' },
      { key: 'caseName', label: '케이스명' },
      { key: 'stepNo', label: 'NO' },
      { key: 'procedure', label: '테스트절차' },
      { key: 'expected', label: '예상결과' },
    ],
  )
}

function register() {
  if (!validRows.value.length) return
  if (!window.confirm(`정상 ${validRows.value.length}건을 업로드하시겠습니까?`)) return
  emit('register', validRows.value)
  reset()
  emit('close')
}

function close() {
  reset()
  emit('close')
}
</script>

<template>
  <BaseModal :visible="visible" title="시나리오 일괄 등록(엑셀 업로드)" @close="close">
    <div class="section">
      <p class="guide">
        정해진 양식의 엑셀파일만 업로드 할 수 있습니다.<br />
        파일 업로드 후 유효성 검사 시, 실패 건수가 없어야 시나리오를 등록할 수 있습니다.
      </p>
    </div>

    <div class="section">
      <div class="actions-row">
        <ExcelDownloadButton title="양식 다운로드" @click="downloadTemplate" />
        <span class="actions-row__label">양식 다운로드</span>
        <label class="upload-btn">
          파일업로드
          <input type="file" accept=".xlsx,.xls,.csv" hidden @change="onFileChange" />
        </label>
      </div>

      <div
        class="dropzone"
        :class="{ 'dropzone--active': isDragging }"
        @dragover.prevent="isDragging = true"
        @dragleave.prevent="isDragging = false"
        @drop.prevent="onDrop"
      >
        파일을 이 영역으로 드래그하여 첨부할 수 있습니다.
      </div>

      <p v-if="fileName" class="file-name">
        선택 파일: <b>{{ fileName }}</b>
        <span v-if="uploading"> · 파싱 중...</span>
      </p>
    </div>

    <div v-if="previewRows.length" class="section preview">
      <h4>유효성 결과</h4>
      <div class="summary-row">
        <span>
          전체 <b>{{ previewRows.length }}</b>건 (신규 <b>{{ newCount }}</b>건, 업데이트
          <b>{{ updateCount }}</b>건)
        </span>
        <span class="ok">정상 <b>{{ validRows.length }}</b>건</span>
        <span class="fail">실패 <b>{{ failedRows.length }}</b>건</span>
      </div>

      <template v-if="failedRows.length">
        <h4 class="fail-title">실패내역 ({{ failedRows.length }}건)</h4>
        <table class="preview-table">
          <thead>
            <tr>
              <th>요구사항ID</th>
              <th>수행구분</th>
              <th>화면명</th>
              <th>케이스ID</th>
              <th>케이스명</th>
              <th>실패 사유</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="row in failedRows" :key="row.caseId">
              <td>{{ row.reqId || '-' }}</td>
              <td>{{ row.executionType || '-' }}</td>
              <td>{{ row.screenName || '-' }}</td>
              <td>{{ row.caseId }}</td>
              <td>{{ row.caseName || '-' }}</td>
              <td class="fail">{{ row.validation.errors.join(', ') }}</td>
            </tr>
          </tbody>
        </table>
      </template>
    </div>

    <template #footer>
      <button type="button" class="btn btn--ghost" @click="close">취소</button>
      <button
        type="button"
        class="btn btn--primary"
        :disabled="!validRows.length || uploading"
        @click="register"
      >
        등록
      </button>
    </template>
  </BaseModal>
</template>

<style scoped>
.section {
  padding: 12px 14px;
  margin-bottom: 12px;
  border: 1px solid var(--line);
  border-radius: 8px;
}

.guide {
  margin: 0;
  font-size: calc(12px + var(--font-size-offset, 0px));
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
  font-size: calc(12px + var(--font-size-offset, 0px));
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
  font-size: calc(12px + var(--font-size-offset, 0px));
  font-weight: 600;
  cursor: pointer;
}

.dropzone {
  margin-bottom: 12px;
  padding: 16px;
  border: 1px dashed var(--line);
  border-radius: 8px;
  text-align: center;
  font-size: calc(11.5px + var(--font-size-offset, 0px));
  color: var(--muted);
  background: var(--field);
}

.dropzone--active {
  border-color: var(--teal-600);
  color: var(--teal-600);
  background: var(--teal-50);
}

.file-name {
  font-size: calc(12px + var(--font-size-offset, 0px));
  color: var(--muted);
  margin: 0 0 12px;
}

.preview h4 {
  margin: 0 0 8px;
  font-size: calc(13px + var(--font-size-offset, 0px));
}

.fail-title {
  margin-top: 14px;
}

.summary-row {
  display: flex;
  flex-wrap: wrap;
  gap: 14px;
  margin-bottom: 10px;
  font-size: calc(12px + var(--font-size-offset, 0px));
  color: var(--ink-2);
}

.summary-row b {
  color: var(--teal-600);
}

.summary-row .ok b {
  color: var(--green);
}

.summary-row .fail b {
  color: var(--red);
}

td.fail {
  color: var(--red);
}

.preview-table {
  width: 100%;
  border-collapse: collapse;
  font-size: calc(11px + var(--font-size-offset, 0px));
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
