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
import { getDefectList } from '@/entities/defect/mock/testDefect'
import ErrorDetailModal from '@/pages/workspace/test/defects/ErrorDetailModal.vue'
import TestRunTesterChangeModal from '@/pages/workspace/test/perform/TestRunTesterChangeModal.vue'
import TestRunInfoModal from '@/pages/workspace/test/perform/TestRunInfoModal.vue'
import TestNoteModal from '@/pages/workspace/test/scenario/TestNoteModal.vue'
import { scenarioMeta } from '@/entities/scenario/mock/scenario'
import ExcelDownloadButton from '@/shared/ui/ExcelDownloadButton.vue'
import BaseTooltip from '@/shared/ui/BaseTooltip.vue'
import SearchFilterBar from '@/shared/ui/SearchFilterBar.vue'
import FilterSelectPill from '@/shared/ui/FilterSelectPill.vue'
import FilterTextPill from '@/shared/ui/FilterTextPill.vue'
import FilterDateRange from '@/shared/ui/FilterDateRange.vue'
import { mockExcelDownload } from '@/shared/file-excel/excelDownload'

const { mode, config, pageTitle } = useTestContext()
const route = useRoute()
const auth = useAuthStore()
const currentUser = computed(() => auth.user?.name || '')

const rows = ref([])
const expanded = ref(new Set())
const myTestsOnly = ref(false)
const errorTarget = ref(null)
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

/** 필터는 실시간 반영 — 조회 버튼은 Enter/클릭 진입점만 제공 */
function search() {}

const systemFilterOptions = computed(() =>
  (config.value.systemOptions || []).map((s) =>
    s === '전체' ? { value: '전체', label: '시스템 선택' } : s,
  ),
)

const filterTags = computed(() => {
  const f = filters.value
  const tags = []
  if (f.system && f.system !== '전체') tags.push({ key: 'system', label: '업무범주', value: f.system })
  if (f.bizCategory && f.bizCategory !== '전체') {
    tags.push({ key: 'bizCategory', label: '업무구분', value: f.bizCategory })
  }
  if (f.round && f.round !== '전체') tags.push({ key: 'round', label: '차수', value: f.round })
  if (f.keyword?.trim()) tags.push({ key: 'keyword', label: '케이스', value: f.keyword })
  if (f.tester?.trim()) tags.push({ key: 'tester', label: '테스터', value: f.tester })
  if (myTestsOnly.value) tags.push({ key: 'myTestsOnly', label: '내 테스트만', value: 'ON' })
  if (f.dateFrom || f.dateTo) {
    tags.push({
      key: 'dateRange',
      label: '계획일',
      value: `${f.dateFrom || ''} ~ ${f.dateTo || ''}`,
    })
  }
  if (f.screenKeyword?.trim()) {
    tags.push({ key: 'screenKeyword', label: '요구사항/화면명', value: f.screenKeyword })
  }
  if (f.executionType && f.executionType !== '전체') {
    tags.push({ key: 'executionType', label: '수행구분', value: f.executionType })
  }
  return tags
})

function removeFilterTag(key) {
  if (key === 'dateRange') {
    filters.value.dateFrom = ''
    filters.value.dateTo = ''
  } else if (key === 'myTestsOnly') {
    myTestsOnly.value = false
  } else if (key === 'keyword' || key === 'tester' || key === 'screenKeyword') {
    filters.value[key] = ''
  } else {
    filters.value[key] = '전체'
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

function openError(row, step) {
  const testerName = row.testers.find((name) => isMyColumn(name)) || ''
  errorTarget.value = { row, step, testerName }
}

function closeError() {
  errorTarget.value = null
}

/** 오류등록 팝업(ErrorDetailModal)에서 등록/조치/확인이 저장될 때마다 호출된다.
 * 오류등록/조치여부는 절차(스텝) 1건당 공용 컬럼이라, 등록한 테스터의 결과셀과
 * step.fixStatus, 케이스 집계(errorCount/fixPending)를 여기서 동기화한다. */
function onErrorChanged(defect) {
  const row = rows.value.find((r) => r.caseId === defect.caseId)
  if (!row) return
  const step = row.steps.find((s) => s.no === defect.stepNo)
  if (step) {
    step.fixStatus = defect.status
    const cell = step.byTester[defect.tester]
    if (cell) {
      cell.result = defect.result
      cell.executedAt = (defect.updatedAt || defect.registeredAt || '').slice(0, 10) || cell.executedAt
    }
  }
  const caseDefects = getDefectList(mode.value).filter((d) => d.caseId === row.caseId)
  row.errorCount = caseDefects.length
  row.fixPending = caseDefects.filter((d) => !['처리완료', '오류아님', '수정제외'].includes(d.status)).length
  row.fixDone = caseDefects.filter((d) => d.status === '처리완료').length
  recalcRow(row)
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

    <SearchFilterBar
      v-model:expanded="filterExpanded"
      v-model:search="filters.keyword"
      search-placeholder="케이스명, 케이스 ID"
      :applied-tags="filterTags"
      @reset="resetFilters"
      @search="search"
      @remove-tag="removeFilterTag"
    >
      <template #primary>
        <FilterSelectPill
          v-model="filters.system"
          label="업무범주"
          empty-label="시스템 선택"
          :options="systemFilterOptions"
        />
        <FilterSelectPill
          v-model="filters.bizCategory"
          label="업무구분"
          :options="config.bizCategoryOptions"
        />
        <FilterSelectPill v-model="filters.round" label="차수" :options="config.roundOptions" />
        <FilterTextPill v-model="filters.tester" label="테스터" placeholder="테스터" />
        <label class="chk chk--toggle">
          <input v-model="myTestsOnly" type="checkbox" />
          <span class="chk__switch"></span>
          내 테스트만
        </label>
      </template>
      <template #expand>
        <FilterDateRange
          label="계획일"
          :from="filters.dateFrom"
          :to="filters.dateTo"
          @update:from="filters.dateFrom = $event"
          @update:to="filters.dateTo = $event"
        />
        <FilterTextPill
          v-model="filters.screenKeyword"
          label="요구사항/화면명"
          placeholder="요구사항 ID, 화면명"
        />
        <FilterSelectPill
          v-model="filters.executionType"
          label="수행구분"
          :options="config.executionTypeOptions"
        />
      </template>
    </SearchFilterBar>

    <p v-if="hasOutOfPeriod" class="period-banner">
      ⚠ 테스트 가능 기간이 아닙니다.
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
                      :title="isMyColumn(name) ? '' : `담당 테스터(${name})만 결과를 입력할 수 있습니다.`"
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
                <!-- 오류등록/조치여부는 담당자별이 아니라 절차(케이스) 1건당 공용 컬럼이다.
                     등록과 조회가 동일한 팝업(ErrorDetailModal)을 쓰므로 버튼은 하나면 된다. -->
                <td class="center error-actions">
                  <button type="button" class="link-btn" @click="openError(row, step)">오류등록</button>
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

    <ErrorDetailModal
      :visible="!!errorTarget"
      :case-row="errorTarget?.row"
      :step="errorTarget?.step"
      :tester-name="errorTarget?.testerName"
      :mode="mode"
      :config="config"
      @close="closeError"
      @changed="onErrorChanged"
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
  margin-left: 0;
  cursor: pointer;
  flex-shrink: 0;
  white-space: nowrap;
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
  font-weight: 700;
  cursor: pointer;
  font-size: calc(11px + var(--font-size-offset, 0px));
}

.error-actions {
  text-align: center;
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
