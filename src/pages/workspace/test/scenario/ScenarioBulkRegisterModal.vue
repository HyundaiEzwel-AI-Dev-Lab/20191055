<script setup>
// POP-UAT-03 시나리오 일괄등록
// h-pms 참고(HpBulkUploadModal 공용 팝업, 20260806-bulk-upload-modal 협업): 파일 첨부는
// 우선 첨부만 해두고 [파일 업로드]를 눌러야 검증이 돈다. 실패 0건이면 그 자리에서 바로
// 등록까지 끝나고(별도 [등록] 버튼 없음), 실패가 있으면 등록되지 않는다.
import { computed, ref } from 'vue'
import BaseModal from '@/shared/ui/BaseModal.vue'
import ExcelDownloadButton from '@/shared/ui/ExcelDownloadButton.vue'
import { mockExcelDownload } from '@/shared/file-excel/excelDownload'
import { getBulkRegisterPreview, validateScenarioBulkRow } from '@/entities/scenario/mock/scenario'

const props = defineProps({
  visible: { type: Boolean, default: false },
  mode: { type: String, default: 'dev' },
  /** 업로드 대상 차수. 상위(ScenarioView)에서 이미 확정한 값을 그대로 표시용으로 쓴다. */
  round: { type: String, default: '' },
})

const emit = defineEmits(['close', 'register'])

// h-pms ScenarioPage.vue의 POP-S-UAT-03 안내 문구.
const BULK_GUIDES = [
  '케이스ID·시스템·요구사항번호가 기존 케이스와 모두 일치하면 업데이트, 아니면 신규 등록됩니다.',
  '절차가 여러 개인 케이스는 같은 케이스ID로 여러 행을 적으면 그 순서대로 절차가 등록됩니다.',
]

const file = ref(null)
const previewRows = ref([])
const uploaded = ref(false)
const uploading = ref(false)
const isDragging = ref(false)

const validRows = computed(() => previewRows.value.filter((r) => r.validation.ok))
const failedRows = computed(() => previewRows.value.filter((r) => !r.validation.ok))
const newCount = computed(() => validRows.value.filter((r) => !r.validation.isUpdate).length)
const updateCount = computed(() => validRows.value.filter((r) => r.validation.isUpdate).length)
const registered = computed(() => uploaded.value && !failedRows.value.length)

function reset() {
  file.value = null
  previewRows.value = []
  uploaded.value = false
  uploading.value = false
  isDragging.value = false
}

function pick(f) {
  if (!f) return
  file.value = f
  // 새 파일을 고르면 직전 결과는 그 파일의 것이 아니다.
  previewRows.value = []
  uploaded.value = false
}

function onFileChange(e) {
  pick(e.target.files?.[0])
}

function onDrop(e) {
  isDragging.value = false
  pick(e.dataTransfer?.files?.[0])
}

function clearFile() {
  reset()
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

/** 실 업로드는 서버 검증이지만 목업은 고정 미리보기(getBulkRegisterPreview)로 대신한다. */
function upload() {
  if (!file.value || uploading.value) return
  if (!window.confirm('파일을 업로드 하시겠습니까?')) return
  uploading.value = true
  setTimeout(() => {
    previewRows.value = getBulkRegisterPreview(props.mode).map((row) => ({
      ...row,
      round: props.round || row.round,
      validation: validateScenarioBulkRow(row),
    }))
    uploading.value = false
    uploaded.value = true
    // 실패 0건이면 등록까지 그 자리에서 끝난다(h-pms와 동일 — 별도 [등록] 버튼 없음).
    if (validRows.value.length && !failedRows.value.length) {
      emit('register', validRows.value)
    }
  }, 400)
}

function downloadFailures() {
  mockExcelDownload(
    '시나리오-일괄등록-실패내역',
    failedRows.value.map((row) => ({
      reqId: row.reqId || '-',
      executionType: row.executionType || '-',
      screenName: row.screenName || '-',
      caseId: row.caseId,
      caseName: row.caseName || '-',
      stepCount: row.steps?.length || 0,
      reason: row.validation.errors.join(', '),
    })),
    [
      { key: 'reqId', label: '요구사항ID' },
      { key: 'executionType', label: '수행구분' },
      { key: 'screenName', label: '화면명' },
      { key: 'caseId', label: '케이스ID' },
      { key: 'caseName', label: '케이스명' },
      { key: 'stepCount', label: '절차수' },
      { key: 'reason', label: '실패 사유' },
    ],
  )
}

function close() {
  reset()
  emit('close')
}
</script>

<template>
  <BaseModal :visible="visible" title="시나리오 일괄 등록(엑셀 업로드)" @close="close">
    <ul class="guide-list">
      <li v-for="g in BULK_GUIDES" :key="g">{{ g }}</li>
    </ul>

    <section class="section">
      <h4 class="section__title">엑셀업로드</h4>

      <div class="actions-row">
        <ExcelDownloadButton title="양식 다운로드" @click="downloadTemplate" />
        <span class="actions-row__label">양식 다운로드</span>
        <label class="btn btn--ghost upload-label">
          파일추가
          <input type="file" accept=".xlsx,.xls,.csv" hidden @change="onFileChange" />
        </label>
        <button type="button" class="btn btn--ghost" :disabled="!file && !uploaded" @click="clearFile">
          초기화
        </button>
      </div>

      <div
        class="dropzone"
        :class="{ 'dropzone--active': isDragging }"
        @dragover.prevent="isDragging = true"
        @dragleave.prevent="isDragging = false"
        @drop.prevent="onDrop"
      >
        <p class="dropzone__hint">첨부할 파일을 마우스로 끌어서 추가할 수 있습니다.</p>
        <div v-if="file" class="file-chip">
          <span class="file-chip__name">{{ file.name }}</span>
          <button type="button" class="file-chip__remove" aria-label="첨부 삭제" @click="clearFile">×</button>
        </div>
      </div>

      <div class="upload-row">
        <button type="button" class="btn btn--primary" :disabled="!file || uploading" @click="upload">
          {{ uploading ? '업로드 중...' : '파일 업로드' }}
        </button>
      </div>
    </section>

    <section v-if="uploaded" class="section">
      <h4 class="section__title">유효성 결과</h4>
      <div class="summary-row">
        <span>전체 <b>{{ previewRows.length }}</b>건</span>
        <span class="ok">정상 <b>{{ validRows.length }}</b>건</span>
        <span class="fail">실패 <b>{{ failedRows.length }}</b>건</span>
      </div>

      <div v-if="registered" class="done">
        <p>총 {{ previewRows.length }}건 모두 유효성 검사가 완료되었습니다.</p>
        <p>(신규 등록 {{ newCount }}건, 업데이트 {{ updateCount }}건)</p>
      </div>

      <template v-else>
        <div class="fail-head">
          <h4 class="fail-title">실패 내역 ({{ failedRows.length }}건)</h4>
          <ExcelDownloadButton title="실패 내역 다운로드" @click="downloadFailures" />
        </div>
        <div class="preview-scroll">
          <table class="preview-table">
            <thead>
              <tr>
                <th>요구사항ID</th>
                <th>수행구분</th>
                <th>화면명</th>
                <th>케이스ID</th>
                <th>케이스명</th>
                <th>절차수</th>
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
                <td>{{ row.steps?.length || 0 }}</td>
                <td class="fail">{{ row.validation.errors.join(', ') }}</td>
              </tr>
            </tbody>
          </table>
        </div>
        <p class="fail-notice">실패 건이 있으면 등록되지 않습니다.</p>
      </template>
    </section>

    <template #footer>
      <button type="button" class="btn btn--primary" @click="close">확인</button>
    </template>
  </BaseModal>
</template>

<style scoped>
.guide-list {
  margin: 0 0 12px;
  padding: 12px 16px 12px 32px;
  border: 1px solid var(--line);
  border-radius: 8px;
  background: var(--field);
  font-size: calc(12px + var(--font-size-offset, 0px));
  color: var(--ink-2);
  line-height: 1.7;
}

.section {
  padding: 12px 14px;
  margin-bottom: 12px;
  border: 1px solid var(--line);
  border-radius: 8px;
}

.section__title {
  margin: 0 0 10px;
  font-size: calc(13px + var(--font-size-offset, 0px));
  font-weight: 700;
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

.upload-label {
  cursor: pointer;
}

.dropzone {
  margin-bottom: 12px;
  padding: 16px;
  border: 1px dashed var(--line);
  border-radius: 8px;
  text-align: center;
}

.dropzone--active {
  border-color: var(--teal-600);
  background: var(--teal-50);
}

.dropzone__hint {
  margin: 0 0 8px;
  font-size: calc(11.5px + var(--font-size-offset, 0px));
  color: var(--muted);
}

.file-chip {
  display: inline-flex;
  align-items: center;
  gap: 10px;
  padding: 6px 10px;
  border-radius: 6px;
  background: var(--field);
  font-size: calc(12px + var(--font-size-offset, 0px));
}

.file-chip__name { overflow-wrap: anywhere; }
.file-chip__remove {
  border: none;
  background: none;
  color: var(--muted);
  cursor: pointer;
  font-size: calc(13px + var(--font-size-offset, 0px));
}

.upload-row {
  margin-top: 10px;
  text-align: center;
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

.done {
  padding: 20px 0;
  text-align: center;
  font-size: calc(13px + var(--font-size-offset, 0px));
  line-height: 1.8;
}
.done p { margin: 0; }

.fail-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-top: 14px;
}

.fail-title { margin: 0; }

.preview-scroll {
  max-height: 320px;
  overflow: auto;
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

.fail-notice {
  margin: 8px 0 0;
  text-align: right;
  color: var(--red);
  font-size: calc(12px + var(--font-size-offset, 0px));
}

button:disabled { opacity: 0.5; cursor: not-allowed; }
</style>
