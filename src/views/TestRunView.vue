<script setup>
// PAG-S-UAT-09 테스트 수행 — 케이스 아코디언 + 테스터별 절차 그리드
import { computed, onMounted, ref, watch } from 'vue'
import { useTestContext } from '@/composables/useTestContext'
import {
  getTestRunList,
  computeTestRunKpi,
  matchTestRunFilters,
  isCaseDimmed,
} from '@/data/testRun'
import TestErrorRegisterModal from '@/components/test/TestErrorRegisterModal.vue'
import ExcelDownloadButton from '@/components/ui/ExcelDownloadButton.vue'
import { mockExcelDownload } from '@/utils/excelDownload'

const { mode, config, pageTitle } = useTestContext()

const rows = ref([])
const expanded = ref(new Set())
const myTestsOnly = ref(false)
const errorTarget = ref(null)

const filters = ref({
  system: '전체',
  bizCategory: '전체',
  keyword: '',
  tester: '',
  round: '전체',
  result: '전체',
  dateFrom: '',
  dateTo: '',
})

function loadRows() {
  rows.value = getTestRunList(mode.value)
  expanded.value = new Set()
}

onMounted(loadRows)
watch(mode, loadRows)

const filtered = computed(() =>
  rows.value.filter((r) =>
    matchTestRunFilters(r, filters.value, myTestsOnly.value),
  ),
)

const kpi = computed(() => computeTestRunKpi(filtered.value))

const period = computed(() => config.value.testPeriod)

const resultOptions = ['전체', '대기', '정상', '오류', '재처리요청', '수정완료', '기타']

function resetFilters() {
  filters.value = {
    system: '전체',
    bizCategory: '전체',
    keyword: '',
    tester: '',
    round: '전체',
    result: '전체',
    dateFrom: '',
    dateTo: '',
  }
}

function toggleExpand(id) {
  const next = new Set(expanded.value)
  if (next.has(id)) next.delete(id)
  else next.add(id)
  expanded.value = next
}

function expandAll() {
  expanded.value = new Set(filtered.value.map((r) => r.id))
}

function collapseAll() {
  expanded.value = new Set()
}

function resultClass(val) {
  const map = {
    정상: 'ok',
    오류: 'err',
    대기: 'wait',
    재처리요청: 'retry',
    수정완료: 'fixed',
    기타: 'etc',
  }
  return map[val] || ''
}

function openErrorRegister(row, step, testerName) {
  errorTarget.value = { row, step, testerName }
}

function closeErrorRegister() {
  errorTarget.value = null
}

function onErrorRegistered(payload) {
  const { row, step, testerName } = errorTarget.value
  const cell = step.byTester[testerName]
  if (cell) {
    cell.result = '오류'
    cell.fixStatus = '접수'
  }
  row.errorCount = (row.errorCount || 0) + 1
  row.fixPending = (row.fixPending || 0) + 1
  row.result = '오류'
  closeErrorRegister()
  void payload
}

function setStepResult(row, step, testerName, result) {
  const cell = step.byTester[testerName]
  if (!cell) return
  cell.result = result
  if (result !== '대기' && !cell.executedAt) {
    cell.executedAt = '2026-04-17'
  }
  recalcRow(row)
}

function recalcRow(row) {
  let done = 0
  let hasError = false
  let hasRetry = false
  let allOk = true
  for (const step of row.steps) {
    for (const name of row.testers) {
      const t = step.byTester[name]
      if (t?.result && t.result !== '대기') done += 1
      if (t?.result === '오류') hasError = true
      if (t?.result === '재처리요청') hasRetry = true
      if (!t || t.result === '대기') allOk = false
    }
  }
  row.stepDone = done
  const totalCells = row.stepTotal * row.testers.length
  row.progress = totalCells ? Math.round((done / totalCells) * 100) : 0
  if (allOk && done === totalCells) row.result = '정상'
  else if (hasError) row.result = '오류'
  else if (hasRetry) row.result = '재처리요청'
  else if (done > 0) row.result = '진행'
  else row.result = '대기'
}

function onExcelDownload() {
  mockExcelDownload(`테스트 수행 (${mode.value === 'uat' ? '운영' : 'DEV'})`, filtered.value.length)
}
</script>

<template>
  <div class="test-run">
    <h1 class="test-run__title">{{ pageTitle }}</h1>

    <div class="filter card">
      <div class="filter__row">
        <div class="filter__field">
          <label>업무범주</label>
          <select v-model="filters.system" class="filter__inp">
            <option value="전체">시스템 선택</option>
            <option v-for="s in config.systemOptions" :key="s" :value="s">{{ s }}</option>
          </select>
        </div>
        <div class="filter__field">
          <label>업무구분</label>
          <select v-model="filters.bizCategory" class="filter__inp">
            <option v-for="o in config.bizCategoryOptions" :key="o" :value="o">{{ o }}</option>
          </select>
        </div>
        <div class="filter__field filter__field--wide">
          <label>케이스</label>
          <input
            v-model="filters.keyword"
            class="filter__inp"
            type="text"
            placeholder="케이스명, 케이스 ID"
          />
        </div>
        <div class="filter__field">
          <label>테스터</label>
          <input
            v-model="filters.tester"
            class="filter__inp"
            type="text"
            placeholder="테스터"
          />
        </div>
      </div>
      <div class="filter__actions">
        <label class="chk">
          <input v-model="myTestsOnly" type="checkbox" />
          내 테스트만
        </label>
        <button type="button" class="btn btn--ghost" @click="resetFilters">초기화</button>
        <button type="button" class="btn btn--primary">조회</button>
      </div>
    </div>

    <div class="period card">
      <div class="period__head">
        <b>테스트 기간 (WBS 기준)</b>
        <span class="muted">{{ period.start }} ~ {{ period.end }}</span>
        <a href="#" class="ref-link" @click.prevent>참고사항</a>
      </div>
      <div class="kpi-row">
        <div class="kpi-chip"><span class="kpi-chip__lab">전체</span><span class="kpi-chip__num">{{ kpi.total }}</span></div>
        <div class="kpi-chip"><span class="kpi-chip__lab">대기</span><span class="kpi-chip__num">{{ kpi.wait }}</span></div>
        <div class="kpi-chip"><span class="kpi-chip__lab">진행</span><span class="kpi-chip__num">{{ kpi.progress }}</span></div>
        <div class="kpi-chip kpi-chip--warn"><span class="kpi-chip__lab">지연</span><span class="kpi-chip__num">{{ kpi.delay }}</span></div>
        <div class="kpi-chip kpi-chip--ok"><span class="kpi-chip__lab">정상</span><span class="kpi-chip__num">{{ kpi.ok }}</span></div>
        <div class="kpi-chip kpi-chip--err"><span class="kpi-chip__lab">오류</span><span class="kpi-chip__num">{{ kpi.error }}</span></div>
        <div class="kpi-chip"><span class="kpi-chip__lab">재처리요청</span><span class="kpi-chip__num">{{ kpi.retry }}</span></div>
        <div class="kpi-chip"><span class="kpi-chip__lab">수정완료</span><span class="kpi-chip__num">{{ kpi.fixed }}</span></div>
        <div class="kpi-chip kpi-chip--warn"><span class="kpi-chip__lab">접수</span><span class="kpi-chip__num">{{ kpi.pending }}</span></div>
        <div class="kpi-chip"><span class="kpi-chip__lab">기타</span><span class="kpi-chip__num">{{ kpi.etc }}</span></div>
      </div>
    </div>

    <div class="toolbar">
      <span class="toolbar__count">총 {{ filtered.length }}건</span>
      <div class="toolbar__btns">
        <ExcelDownloadButton @click="onExcelDownload" />
        <button type="button" class="btn btn--ghost btn--sm" @click="expandAll">전체 펼치기</button>
        <button type="button" class="btn btn--ghost btn--sm" @click="collapseAll">전체 접기</button>
      </div>
    </div>

    <div class="case-list">
      <div
        v-for="(row, idx) in filtered"
        :key="row.id"
        class="case-item card"
        :class="{ dimmed: isCaseDimmed(row, period), open: expanded.has(row.id) }"
      >
        <button type="button" class="case-head" @click="toggleExpand(row.id)">
          <span class="case-head__no">{{ idx + 1 }}</span>
          <span class="case-head__req">{{ row.reqId }}</span>
          <span class="case-head__type">{{ row.executionType }}</span>
          <span class="case-head__path" :title="row.systemPath">{{ row.systemPath }}</span>
          <span class="case-head__screen">{{ row.screenName }}</span>
          <span class="case-head__id">{{ row.caseId }}</span>
          <span class="case-head__name">{{ row.caseName }}</span>
          <span class="case-head__date">{{ row.planStart }} ~ {{ row.planEnd }}</span>
          <span class="case-head__testers">{{ row.testerCount }}</span>
          <span class="case-head__steps">{{ row.stepDone }}/{{ row.stepTotal * row.testerCount }}</span>
          <span class="case-head__prog">{{ row.progress }}%</span>
          <span class="case-head__result" :class="resultClass(row.result)">{{ row.result }}</span>
          <span class="case-head__err">{{ row.errorCount }}</span>
          <span class="case-head__fix">{{ row.fixDone }}/{{ row.fixPending }}</span>
          <span class="case-head__at">{{ row.lastExecutedAt || '-' }}</span>
          <span class="case-head__arrow">{{ expanded.has(row.id) ? '▲' : '▼' }}</span>
        </button>

        <div v-if="expanded.has(row.id)" class="case-body">
          <table class="step-grid">
            <thead>
              <tr>
                <th rowspan="2">NO</th>
                <th rowspan="2">절차</th>
                <th rowspan="2">예상결과</th>
                <th v-for="name in row.testers" :key="name" :colspan="4" class="tester-group">
                  {{ name }}
                </th>
              </tr>
              <tr>
                <template v-for="name in row.testers" :key="`${name}-sub`">
                  <th>결과</th>
                  <th>실행일</th>
                  <th>오류등록</th>
                  <th>조치여부</th>
                </template>
              </tr>
            </thead>
            <tbody>
              <tr v-for="step in row.steps" :key="step.no">
                <td class="center">{{ step.no }}</td>
                <td>{{ step.procedure }}</td>
                <td>{{ step.expected }}</td>
                <template v-for="name in row.testers" :key="`${step.no}-${name}`">
                  <td>
                    <select
                      class="result-sel"
                      :class="resultClass(step.byTester[name]?.result)"
                      :value="step.byTester[name]?.result"
                      @change="setStepResult(row, step, name, $event.target.value)"
                    >
                      <option value="대기">대기</option>
                      <option value="정상">정상</option>
                      <option value="오류">오류</option>
                      <option value="재처리요청">재처리요청</option>
                      <option value="수정완료">수정완료</option>
                      <option value="기타">기타</option>
                    </select>
                  </td>
                  <td class="center">{{ step.byTester[name]?.executedAt || '-' }}</td>
                  <td class="center">
                    <button
                      type="button"
                      class="link-btn"
                      :disabled="step.byTester[name]?.result === '정상'"
                      @click="openErrorRegister(row, step, name)"
                    >
                      등록
                    </button>
                  </td>
                  <td class="center">
                    <span
                      v-if="step.byTester[name]?.fixStatus"
                      class="fix-tag"
                      :class="{ pending: step.byTester[name]?.fixStatus === '접수' }"
                    >
                      {{ step.byTester[name].fixStatus }}
                    </span>
                    <span v-else class="muted">-</span>
                  </td>
                </template>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <p v-if="!filtered.length" class="empty">조회 결과가 없습니다.</p>
    </div>

    <TestErrorRegisterModal
      :visible="!!errorTarget"
      :case-row="errorTarget?.row"
      :step="errorTarget?.step"
      :mode="mode"
      @close="closeErrorRegister"
      @register="onErrorRegistered"
    />
  </div>
</template>

<style scoped>
.test-run__title {
  font-size: 18px;
  font-weight: 700;
  margin: 0 0 14px;
}

.filter {
  padding: 14px 16px;
  margin-bottom: 12px;
}

.filter__row {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
  margin-bottom: 10px;
}

.filter__field {
  display: flex;
  flex-direction: column;
  gap: 4px;
  min-width: 120px;
}

.filter__field--wide {
  flex: 1;
  min-width: 180px;
}

.filter__field label {
  font-size: 11px;
  color: var(--muted);
  font-weight: 600;
}

.filter__inp {
  height: 32px;
  padding: 0 10px;
  border: 1px solid var(--line);
  border-radius: 7px;
  font-family: inherit;
  font-size: 12px;
}

.filter__actions {
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: 8px;
}

.chk {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 12px;
  margin-right: auto;
}

.period {
  padding: 12px 16px;
  margin-bottom: 12px;
}

.period__head {
  display: flex;
  align-items: center;
  gap: 10px;
  font-size: 12px;
  margin-bottom: 10px;
}

.ref-link {
  margin-left: auto;
  font-size: 11px;
  color: var(--teal-600);
}

.kpi-row {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.kpi-chip {
  flex: 1;
  min-width: 72px;
  padding: 8px 10px;
  background: var(--field);
  border-radius: 8px;
  text-align: center;
}

.kpi-chip__lab {
  display: block;
  font-size: 10px;
  color: var(--muted);
  font-weight: 600;
}

.kpi-chip__num {
  font-size: 18px;
  font-weight: 700;
}

.kpi-chip--ok .kpi-chip__num { color: var(--teal-600); }
.kpi-chip--err .kpi-chip__num { color: #c0392b; }
.kpi-chip--warn .kpi-chip__num { color: #b8860b; }

.toolbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 8px;
  font-size: 12px;
}

.toolbar__btns {
  display: flex;
  gap: 6px;
}

.case-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.case-item {
  overflow: hidden;
  padding: 0;
}

.case-item.dimmed {
  opacity: 0.45;
  pointer-events: none;
}

.case-head {
  display: grid;
  grid-template-columns: 36px 72px 64px 1.2fr 88px 80px 1fr 120px 40px 56px 48px 64px 40px 56px 100px 28px;
  gap: 6px;
  align-items: center;
  width: 100%;
  padding: 10px 12px;
  border: none;
  background: #fff;
  font-family: inherit;
  font-size: 11px;
  text-align: left;
  cursor: pointer;
}

.case-item.open .case-head {
  background: var(--teal-50);
  border-bottom: 1px solid var(--line);
}

.case-head__path {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  color: var(--ink-2);
}

.case-head__result.ok { color: var(--teal-600); font-weight: 600; }
.case-head__result.err { color: #c0392b; font-weight: 600; }
.case-head__result.wait { color: var(--muted); }
.case-head__result.retry { color: #b8860b; }
.case-head__result.fixed { color: var(--teal-600); }

.case-body {
  padding: 12px;
  overflow-x: auto;
}

.step-grid {
  width: 100%;
  border-collapse: collapse;
  font-size: 11px;
  min-width: 800px;
}

.step-grid th,
.step-grid td {
  padding: 6px 8px;
  border: 1px solid var(--line);
  vertical-align: middle;
}

.step-grid th {
  background: var(--field);
  font-weight: 600;
  text-align: center;
}

.tester-group {
  background: var(--teal-50);
  color: var(--teal-700);
}

.center {
  text-align: center;
}

.result-sel {
  width: 100%;
  height: 28px;
  border: 1px solid var(--line);
  border-radius: 5px;
  font-size: 11px;
  font-family: inherit;
}

.result-sel.ok { border-color: var(--teal-400); color: var(--teal-700); }
.result-sel.err { border-color: #e74c3c; color: #c0392b; }
.result-sel.wait { color: var(--muted); }

.link-btn {
  border: none;
  background: none;
  color: var(--teal-600);
  cursor: pointer;
  font-size: 11px;
}

.link-btn:disabled {
  color: var(--muted);
  cursor: not-allowed;
}

.fix-tag {
  font-size: 10px;
  padding: 2px 6px;
  border-radius: 4px;
  background: var(--teal-50);
  color: var(--teal-700);
}

.fix-tag.pending {
  background: #fef3cd;
  color: #856404;
}

.empty {
  text-align: center;
  padding: 32px;
  color: var(--muted);
  font-size: 13px;
}

.muted {
  color: var(--muted);
}
</style>
