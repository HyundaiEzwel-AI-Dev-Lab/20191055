<script setup>
// PAG-S-UAT-09 테스트 수행 — 케이스 아코디언 + 테스터별 절차 그리드
import { computed, onMounted, ref, watch } from 'vue'
import { useRoute } from 'vue-router'
import { useTestContext } from '@/app/composables/useTestContext'
import { useAuthStore } from '@/app/stores/auth'
import {
  getTestRunList,
  computeTestRunKpi,
  matchTestRunFilters,
  isCaseDimmed,
} from '@/entities/test-run/mock/testRun'
import { getDefectList, updateDefect, addDefect } from '@/entities/defect/mock/testDefect'
import TestErrorRegisterModal from '@/pages/workspace/test/perform/TestErrorRegisterModal.vue'
import TestRunTesterChangeModal from '@/pages/workspace/test/perform/TestRunTesterChangeModal.vue'
import TestRunInfoModal from '@/pages/workspace/test/perform/TestRunInfoModal.vue'
import TestNoteModal from '@/pages/workspace/test/scenario/TestNoteModal.vue'
import { scenarioMeta } from '@/entities/scenario/mock/scenario'
import DefectDetailModal from '@/pages/workspace/test/defects/DefectDetailModal.vue'
import BaseModal from '@/shared/ui/BaseModal.vue'
import ExcelDownloadButton from '@/shared/ui/ExcelDownloadButton.vue'
import BaseTooltip from '@/shared/ui/BaseTooltip.vue'
import { mockExcelDownload } from '@/shared/file-excel/excelDownload'

const { mode, config, pageTitle } = useTestContext()
const route = useRoute()
const auth = useAuthStore()
const currentUser = computed(() => auth.user?.name || '')

const rows = ref([])
const expanded = ref(new Set())
const myTestsOnly = ref(false)
const errorTarget = ref(null)
const showErrorDetail = ref(false)
const errorDetailTarget = ref(null)
const filterExpanded = ref(false)
const showTesterChange = ref(false)
const showRunInfo = ref(false)
const runInfoTarget = ref(null)
const showCommonNoteModal = ref(false)

const filters = ref({
  system: '전체',
  bizCategory: '전체',
  keyword: '',
  tester: '',
  round: '전체',
  result: '전체',
  executionType: '전체',
  screenKeyword: '',
  dateFrom: '',
  dateTo: '',
})

function loadRows() {
  rows.value = getTestRunList(mode.value, auth.user?.id)
  expanded.value = new Set()
}

onMounted(() => {
  loadRows()
  if (route.query.system) filters.value.system = String(route.query.system)
  if (route.query.result) filters.value.result = String(route.query.result)
  if (route.query.tester) filters.value.tester = String(route.query.tester)
})
watch(mode, loadRows)

const filtered = computed(() =>
  rows.value.filter((r) =>
    matchTestRunFilters(r, filters.value, myTestsOnly.value),
  ),
)

const kpi = computed(() => computeTestRunKpi(filtered.value))

const period = computed(() => config.value.testPeriod)

const hasOutOfPeriod = computed(() => filtered.value.some((r) => isCaseDimmed(r, period.value)))

const allExpanded = computed(
  () => filtered.value.length > 0 && filtered.value.every((r) => expanded.value.has(r.id)),
)

function resetFilters() {
  filters.value = {
    system: '전체',
    bizCategory: '전체',
    keyword: '',
    tester: '',
    round: '전체',
    result: '전체',
    executionType: '전체',
    screenKeyword: '',
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

function isMyColumn(name) {
  return !currentUser.value || name === currentUser.value
}

// 오류등록/조치여부는 담당자별이 아니라 절차(스텝) 1건당 공용으로 관리한다 (SB p162, POP-S-UAT-13).
// 내가 담당한 테스터 컬럼 중 '오류'로 표시된 항목이 있으면 그 컬럼을 등록 대상으로 사용한다.
function myErrorTesterFor(row, step) {
  return row.testers.find((name) => isMyColumn(name) && step.byTester[name]?.result === '오류')
}

function openTesterChange() {
  showTesterChange.value = true
}

function onTesterChangeSave(payload) {
  for (const p of payload) {
    const row = rows.value.find((r) => r.id === p.caseId)
    if (!row) continue
    if (p.tester) {
      row.testers = p.tester.split(',').map((s) => s.trim()).filter(Boolean)
      row.testerCount = row.testers.length
    }
    if (p.planStart) row.planStart = p.planStart
    if (p.planEnd) row.planEnd = p.planEnd
  }
}

function openRunInfo(row) {
  runInfoTarget.value = row
  showRunInfo.value = true
}

function onRunInfoSave(info) {
  if (!runInfoTarget.value) return
  runInfoTarget.value.testerInfo = info
}

function onCommonNoteSave(text) {
  scenarioMeta.commonNote[mode.value] = text
}

function viewErrors(row, step) {
  // 케이스 + 절차 단위로 등록된 오류를 모두 보여준다 (담당자별로 쪼개지 않음).
  const list = getDefectList(mode.value).filter(
    (d) => d.caseId === row.caseId && d.stepNo === step.no,
  )
  if (!list.length) {
    window.alert('등록된 오류가 없습니다.')
    return
  }
  errorDetailTarget.value = list[0]
  showErrorDetail.value = true
}

function onErrorDetailSave(updates) {
  if (!errorDetailTarget.value) return
  updateDefect(errorDetailTarget.value.id, updates)
  const refreshed = getDefectList(mode.value).find((d) => d.id === errorDetailTarget.value.id)
  if (!refreshed) return
  errorDetailTarget.value = refreshed
  const row = rows.value.find((r) => r.caseId === refreshed.caseId)
  const step = row?.steps.find((s) => s.no === refreshed.stepNo)
  if (step) step.fixStatus = refreshed.status
  // 결함 "조치확인(테스터 입력)" 결과(수정완료/재처리요청)를 원래 오류를 등록한
  // 테스터의 결과 셀에 자동 동기화한다 (SB p.165 테스트결과 자동변경정책).
  if (step && refreshed.tester && ['수정완료', '재처리요청', 'DEV확인', '운영확인'].includes(refreshed.result)) {
    const cell = step.byTester[refreshed.tester]
    if (cell) {
      cell.result = refreshed.result
      cell.executedAt = (refreshed.updatedAt || '').slice(0, 10) || cell.executedAt
    }
    recalcRow(row)
  }
}

function openErrorRegister(row, step, testerName) {
  errorTarget.value = { row, step, testerName }
}

function closeErrorRegister() {
  errorTarget.value = null
}

function onErrorRegistered(payload) {
  const { row, step, testerName } = errorTarget.value
  // 결함관리(PAG-S-UAT-14)·오류 목록(POP-S-UAT-13 사이드바)에 실제로 반영되도록 결함을 등록한다.
  const newDefect = addDefect(payload, mode.value)
  const cell = step.byTester[testerName]
  if (cell) {
    cell.result = '오류'
    if (!cell.executedAt) cell.executedAt = '2026-04-17'
  }
  // 조치여부는 절차(스텝) 1건에 공용으로 붙는다 — 담당자별로 각각 생기지 않는다.
  step.fixStatus = newDefect.status
  row.errorCount = (row.errorCount || 0) + 1
  row.fixPending = (row.fixPending || 0) + 1
  row.result = '오류'
  recalcRow(row)
  closeErrorRegister()
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
  const label = `테스트 수행 (${mode.value === 'uat' ? '운영' : 'DEV'})`
  mockExcelDownload(label, filtered.value, [
    { key: 'reqId', label: '요구사항ID' },
    { key: 'executionType', label: '수행유형' },
    { key: 'systemPath', label: '시스템경로' },
    { key: 'screenName', label: '화면명' },
    { key: 'caseId', label: '케이스ID' },
    { key: 'caseName', label: '케이스명' },
    { key: 'planStart', label: '계획시작' },
    { key: 'planEnd', label: '계획종료' },
    { key: 'testerCount', label: '테스터수' },
    { key: 'progress', label: '진척(%)' },
    { key: 'result', label: '결과' },
    { key: 'errorCount', label: '오류수' },
    { key: 'fixDone', label: '조치완료' },
    { key: 'fixPending', label: '조치대기' },
    { key: 'lastExecutedAt', label: '최종수행일시' },
  ])
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
        <div class="filter__field">
          <label>차수</label>
          <select v-model="filters.round" class="filter__inp">
            <option v-for="o in config.roundOptions" :key="o" :value="o">{{ o }}</option>
          </select>
        </div>
        <div class="filter__field filter__field--case">
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
        <label class="chk chk--toggle">
          <input v-model="myTestsOnly" type="checkbox" />
          <span class="chk__switch"></span>
          내 테스트만
        </label>
      </div>

      <div v-if="filterExpanded" class="filter__row">
        <div class="filter__field filter__field--range">
          <label>계획일</label>
          <div class="filter__range">
            <input v-model="filters.dateFrom" class="filter__inp" type="date" @click="$event.target.showPicker?.()" />
            <span>~</span>
            <input v-model="filters.dateTo" class="filter__inp" type="date" @click="$event.target.showPicker?.()" />
          </div>
        </div>
        <div class="filter__field filter__field--wide">
          <label>요구사항/화면명</label>
          <input
            v-model="filters.screenKeyword"
            class="filter__inp"
            type="text"
            placeholder="요구사항 ID, 화면명"
          />
        </div>
        <div class="filter__field">
          <label>수행구분</label>
          <select v-model="filters.executionType" class="filter__inp">
            <option v-for="o in config.executionTypeOptions" :key="o" :value="o">{{ o }}</option>
          </select>
        </div>
      </div>

      <button type="button" class="filter__expand" @click="filterExpanded = !filterExpanded">
        검색조건
        <span class="filter__expand-icon" :class="{ 'is-open': filterExpanded }">▾</span>
      </button>

      <div class="filter__actions">
        <button type="button" class="btn btn--ghost" @click="resetFilters">초기화</button>
        <button type="button" class="btn btn--primary">조회</button>
      </div>
    </div>

    <p v-if="hasOutOfPeriod" class="period-banner">
      ⚠ 테스트 가능 기간이 아닌 케이스가 포함되어 있습니다. 딤 처리된 케이스는 기간 외 케이스입니다.
    </p>

    <div class="period card">
      <div class="period__head">
        <b>테스트 기간 (WBS 기준)</b>
        <span class="muted">{{ period.start }} ~ {{ period.end }}</span>
        <button type="button" class="note-link" @click="showCommonNoteModal = true">테스트 참고사항</button>
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
        <div class="kpi-chip kpi-chip--warn"><span class="kpi-chip__lab">미조치</span><span class="kpi-chip__num">{{ kpi.pending }}</span></div>
        <div class="kpi-chip"><span class="kpi-chip__lab">기타</span><span class="kpi-chip__num">{{ kpi.etc }}</span></div>
      </div>
    </div>

    <div class="toolbar">
      <span class="toolbar__count">
        총 {{ filtered.length }}건
        <button type="button" class="toolbar__expand-btn" @click="allExpanded ? collapseAll() : expandAll()">
          {{ allExpanded ? '전체 접기' : '전체 열기' }}
        </button>
      </span>
      <div class="toolbar__btns">
        <button type="button" class="btn btn--primary btn--sm" @click="openTesterChange">테스터/계획변경</button>
        <ExcelDownloadButton @click="onExcelDownload" />
      </div>
    </div>

    <div class="case-list">
      <div
        v-for="(row, idx) in filtered"
        :key="row.id"
        class="case-item card"
        :class="{ dimmed: isCaseDimmed(row, period), open: expanded.has(row.id) }"
      >
        <div class="case-head" @click="toggleExpand(row.id)">
          <span class="case-head__arrow">{{ expanded.has(row.id) ? '▲' : '▼' }}</span>
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
          <button
            type="button"
            class="case-head__info-btn"
            @click.stop="openRunInfo(row)"
          >
            수행정보({{ row.testerCount }})
          </button>
        </div>

        <div v-if="expanded.has(row.id)" class="case-body">
          <table class="step-grid">
            <thead>
              <tr>
                <th rowspan="2">NO</th>
                <th rowspan="2">절차</th>
                <th rowspan="2">예상결과</th>
                <th v-for="name in row.testers" :key="name" :colspan="2" class="tester-group">
                  {{ name }}
                  <span class="tester-group__date">계획일 {{ row.testerPlanDates?.[name] || '-' }}</span>
                </th>
                <th rowspan="2">오류등록</th>
                <th rowspan="2">조치여부</th>
              </tr>
              <tr>
                <template v-for="name in row.testers" :key="`${name}-sub`">
                  <th>결과</th>
                  <th>
                    실행일
                    <BaseTooltip text="최초 테스트 결과 저장일시입니다. 결과 변경 시, 최종 변경일은 실행일에 마우스 오버 시 확인할 수 있습니다." />
                  </th>
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
                      :disabled="!isMyColumn(name) || ['수정완료', '재처리요청', 'DEV확인', '운영확인'].includes(step.byTester[name]?.result)"
                      @change="setStepResult(row, step, name, $event.target.value)"
                    >
                      <option value="대기">대기</option>
                      <option value="정상">정상</option>
                      <option value="오류">오류</option>
                      <option value="기타">기타</option>
                      <option v-if="step.byTester[name]?.result === '수정완료'" value="수정완료">수정완료</option>
                      <option v-if="step.byTester[name]?.result === '재처리요청'" value="재처리요청">재처리요청</option>
                      <option v-if="step.byTester[name]?.result === 'DEV확인'" value="DEV확인">DEV확인</option>
                      <option v-if="step.byTester[name]?.result === '운영확인'" value="운영확인">운영확인</option>
                    </select>
                  </td>
                  <td class="center" :title="`최종수정일: ${step.byTester[name]?.executedAt || '-'}`">
                    {{ step.byTester[name]?.executedAt || '-' }}
                  </td>
                </template>
                <!-- 오류등록/조치여부는 담당자별이 아니라 절차(케이스) 1건당 공용 컬럼이다. -->
                <td class="center error-actions">
                  <button
                    type="button"
                    class="link-btn link-btn--register"
                    :disabled="!myErrorTesterFor(row, step)"
                    @click="openErrorRegister(row, step, myErrorTesterFor(row, step))"
                  >
                    등록
                  </button>
                  <button type="button" class="link-btn link-btn--lookup" @click="viewErrors(row, step)">조회</button>
                </td>
                <td class="center">
                  <span
                    v-if="step.fixStatus"
                    class="fix-tag"
                    :class="{ pending: ['접수', '처리예정'].includes(step.fixStatus) }"
                  >
                    {{ step.fixStatus }}
                  </span>
                  <span v-else class="muted">-</span>
                </td>
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
    <TestRunTesterChangeModal
      v-model="showTesterChange"
      :cases="filtered"
      @save="onTesterChangeSave"
    />
    <TestRunInfoModal v-model="showRunInfo" :case-row="runInfoTarget" @save="onRunInfoSave" />
    <TestNoteModal
      v-model="showCommonNoteModal"
      :note="scenarioMeta.commonNote[mode]"
      anchor-top-right
      @save="onCommonNoteSave"
    />
    <BaseModal :visible="showErrorDetail" title="오류 상세" wide @close="showErrorDetail = false">
      <DefectDetailModal :row="errorDetailTarget" :config="config" @save="onErrorDetailSave" />
    </BaseModal>
  </div>
</template>

<style scoped>
.test-run {
  padding: 14px 18px 28px;
  color: var(--ink);
  font-size: calc(13px + var(--font-size-offset, 0px));
}

.test-run__title {
  font-size: calc(18px + var(--font-size-offset, 0px));
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
  align-items: flex-end;
  gap: 16px;
  margin-bottom: 10px;
}

.filter__field--case {
  width: 300px;
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
  font-size: calc(11px + var(--font-size-offset, 0px));
  color: var(--muted);
  font-weight: 600;
}

.filter__inp {
  height: 32px;
  padding: 0 10px;
  border: 1px solid var(--line);
  border-radius: 7px;
  font-family: inherit;
  font-size: calc(12px + var(--font-size-offset, 0px));
}

.filter__actions {
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: 8px;
}

.filter__field--range {
  min-width: 220px;
}

.filter__range {
  display: flex;
  align-items: center;
  gap: 6px;
}

.filter__range .filter__inp {
  flex: 1;
}

.filter__expand {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  border: none;
  background: none;
  color: var(--teal-600);
  font-size: calc(11.5px + var(--font-size-offset, 0px));
  cursor: pointer;
  padding: 0;
  margin-bottom: 10px;
  font-family: inherit;
}

.filter__expand-icon {
  display: inline-block;
  transition: transform var(--transition-fast);
}

.filter__expand-icon.is-open {
  transform: rotate(180deg);
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

.btn--ghost {
  background: var(--lnb-side);
  border-color: var(--line);
  color: var(--ink);
}

.btn--ghost:hover {
  border-color: var(--teal-100);
  color: var(--teal-600);
}

.period-banner {
  margin: 0 0 12px;
  padding: 10px 14px;
  background: var(--orange-bg);
  border: 1px solid var(--orange);
  border-radius: 8px;
  color: var(--orange);
  font-size: calc(12px + var(--font-size-offset, 0px));
}

.chk {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: calc(12px + var(--font-size-offset, 0px));
  margin-right: auto;
}

.chk--toggle {
  margin-right: 0;
  margin-left: auto;
  cursor: pointer;
}

.chk--toggle input {
  display: none;
}

.chk__switch {
  position: relative;
  width: 32px;
  height: 18px;
  border-radius: 10px;
  background: var(--line);
  transition: background var(--transition-fast);
}

.chk__switch::after {
  content: '';
  position: absolute;
  top: 2px;
  left: 2px;
  width: 14px;
  height: 14px;
  border-radius: 50%;
  background: #fff;
  transition: transform var(--transition-fast);
}

.chk--toggle input:checked + .chk__switch {
  background: var(--teal);
}

.chk--toggle input:checked + .chk__switch::after {
  transform: translateX(14px);
}

.note-link {
  margin-left: auto;
  border: none;
  background: none;
  color: var(--teal-600);
  font-weight: 600;
  font-size: calc(12px + var(--font-size-offset, 0px));
  cursor: pointer;
  font-family: inherit;
  padding: 0;
}

.period {
  padding: 12px 16px;
  margin-bottom: 12px;
}

.period__head {
  display: flex;
  align-items: center;
  gap: 10px;
  font-size: calc(12px + var(--font-size-offset, 0px));
  margin-bottom: 10px;
}

.ref-link {
  margin-left: auto;
  font-size: calc(11px + var(--font-size-offset, 0px));
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
  font-size: calc(10px + var(--font-size-offset, 0px));
  color: var(--muted);
  font-weight: 600;
}

.kpi-chip__num {
  font-size: calc(18px + var(--font-size-offset, 0px));
  font-weight: 700;
}

.kpi-chip--ok .kpi-chip__num { color: var(--teal-600); }
.kpi-chip--err .kpi-chip__num { color: var(--red); }
.kpi-chip--warn .kpi-chip__num { color: var(--orange); }

.toolbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 8px;
  font-size: calc(12px + var(--font-size-offset, 0px));
}

.toolbar__count {
  display: inline-flex;
  align-items: center;
  gap: 8px;
}

.toolbar__expand-btn {
  height: 24px;
  padding: 0 10px;
  border: 1px solid var(--line);
  border-radius: 6px;
  background: var(--lnb-side);
  color: var(--ink);
  font-size: calc(11.5px + var(--font-size-offset, 0px));
  cursor: pointer;
  font-family: inherit;
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
  grid-template-columns: 28px 36px 72px 64px 1.2fr 88px 80px 1fr 120px 40px 56px 48px 64px 40px 56px 100px 84px;
  gap: 6px;
  align-items: center;
  width: 100%;
  padding: 10px 12px;
  border: none;
  background: var(--lnb-side);
  font-family: inherit;
  font-size: calc(11px + var(--font-size-offset, 0px));
  text-align: left;
  cursor: pointer;
}

.case-head__info-btn {
  height: 22px;
  padding: 0 8px;
  border: 1px solid var(--teal-100);
  background: var(--teal-50);
  color: var(--teal-600);
  border-radius: 12px;
  font-size: calc(10px + var(--font-size-offset, 0px));
  font-weight: 600;
  cursor: pointer;
  font-family: inherit;
  white-space: nowrap;
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
.case-head__result.err { color: var(--red); font-weight: 600; }
.case-head__result.wait { color: var(--muted); }
.case-head__result.retry { color: var(--orange); }
.case-head__result.fixed { color: var(--teal-600); }

.case-body {
  padding: 12px;
  overflow-x: auto;
}

.step-grid {
  width: 100%;
  border-collapse: collapse;
  font-size: calc(11px + var(--font-size-offset, 0px));
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

.tester-group__date {
  display: block;
  margin-top: 2px;
  font-size: calc(11px + var(--font-size-offset, 0px));
  font-weight: 500;
  color: var(--muted);
}

.center {
  text-align: center;
}

.result-sel {
  width: 100%;
  height: 28px;
  border: 1px solid var(--line);
  border-radius: 5px;
  font-size: calc(11px + var(--font-size-offset, 0px));
  font-family: inherit;
}

.result-sel.ok { border-color: var(--teal-400); color: var(--teal-700); }
.result-sel.err { border-color: var(--red); color: var(--red); }
.result-sel.wait { color: var(--muted); }

.link-btn {
  border: none;
  background: none;
  color: var(--teal-600);
  cursor: pointer;
  font-size: calc(11px + var(--font-size-offset, 0px));
}

.link-btn:disabled {
  color: var(--muted);
  cursor: not-allowed;
}

.error-actions {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 10px;
}

.link-btn--register {
  color: var(--teal-600);
  font-weight: 700;
}

.link-btn--lookup {
  color: var(--muted);
}

.fix-tag {
  font-size: calc(10px + var(--font-size-offset, 0px));
  padding: 2px 6px;
  border-radius: 4px;
  background: var(--teal-50);
  color: var(--teal-700);
}

.fix-tag.pending {
  background: var(--orange-bg);
  color: var(--orange);
}

.empty {
  text-align: center;
  padding: 32px;
  color: var(--muted);
  font-size: calc(13px + var(--font-size-offset, 0px));
}

.muted {
  color: var(--muted);
}
</style>
