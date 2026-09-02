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
import HpPagination from '@/shared/ui/HpPagination.vue'
import { mockExcelDownload } from '@/shared/file-excel/excelDownload'

const { mode, config, pageTitle } = useTestContext()
const route = useRoute()
const auth = useAuthStore()
const currentUser = computed(() => auth.user?.name || '')

/** 결과 저장/지연 판정 등에 쓰는 "오늘" — 목업 고정일(계획일 사이에 걸리도록 고정). */
const TODAY = '2026-04-17'
const PAGE_SIZE = 20

const rows = ref([])
const expanded = ref(new Set())
const myTestsOnly = ref(false)
const errorTarget = ref(null)
const filterExpanded = ref(false)
const showTesterChange = ref(false)
const showRunInfo = ref(false)
const runInfoTarget = ref(null)
const showCommonNoteModal = ref(false)
/** 상단 KPI 칩으로 고른 상태. null이면 '전체'로 조건이 붙지 않는다. */
const chipStatus = ref(null)
const page = ref(1)

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
  page.value = 1
}

onMounted(() => {
  loadRows()
  if (route.query.system) filters.value.system = String(route.query.system)
  if (route.query.result) filters.value.result = String(route.query.result)
  if (route.query.tester) filters.value.tester = String(route.query.tester)
})
watch(mode, loadRows)

/** h-pms 이식 — 지연 판정은 KPI칩 집계(computeTestRunKpi)와 같은 기준(계획종료일 경과 + 대기)을 쓴다. */
function isRowDelayed(row) {
  return row.planEnd < TODAY && row.result === '대기'
}

/** 상단 KPI 칩 클릭 필터 — 진행상태(대기/진행/지연/미조치)는 케이스 단위, 결과값(정상/오류 등)은
 * 절차(스텝) 셀 중 하나라도 그 결과면 포함한다(오류등록 여부와 같은 "포함 여부" 판정). */
function matchChipStatus(row) {
  if (!chipStatus.value) return true
  const c = chipStatus.value
  if (c === '지연') return isRowDelayed(row)
  if (c === '미조치') return row.fixPending > 0
  if (c === '대기' || c === '진행') return row.result === c
  return row.steps.some((step) => row.testers.some((name) => step.byTester[name]?.result === c))
}

const filtered = computed(() =>
  rows.value.filter(
    (r) => matchTestRunFilters(r, filters.value, myTestsOnly.value) && matchChipStatus(r),
  ),
)

const kpi = computed(() => computeTestRunKpi(filtered.value))

const period = computed(() => config.value.testPeriod)

/** h-pms 이식 — 기간 안이라도 케이스 계획 시작일이 아직 오지 않았으면 딤 처리한다. */
function isDimmed(row) {
  if (row.planStart > TODAY) return true
  return isCaseDimmed(row, period.value)
}

const totalPages = computed(() => Math.max(1, Math.ceil(filtered.value.length / PAGE_SIZE)))

const pagedRows = computed(() => {
  const start = (page.value - 1) * PAGE_SIZE
  return filtered.value.slice(start, start + PAGE_SIZE)
})

const hasOutOfPeriod = computed(() => pagedRows.value.some((r) => isDimmed(r)))

const allExpanded = computed(
  () => pagedRows.value.length > 0 && pagedRows.value.every((r) => expanded.value.has(r.id)),
)

/**
 * 상단 요약 칩(h-pms 이식) — 진행상태/결과/미조치 3구역으로 묶는다. group 필드로 구역을 표시해
 * 두고 template의 kpiGroups가 이 배열을 구역별로 걸러 쓴다.
 */
const kpiChips = computed(() => [
  { status: null, label: '전체', count: kpi.value.total, group: 'progress' },
  { status: '대기', label: '대기', count: kpi.value.wait, group: 'progress' },
  { status: '진행', label: '진행', count: kpi.value.progress, group: 'progress' },
  { status: '지연', label: '지연', count: kpi.value.delay, tone: 'warn', group: 'progress' },
  { status: '정상', label: '정상', count: kpi.value.ok, tone: 'ok', group: 'result' },
  { status: '오류', label: '오류', count: kpi.value.error, tone: 'err', group: 'result' },
  { status: '재처리요청', label: '재처리요청', count: kpi.value.retry, group: 'result' },
  { status: '수정완료', label: '수정완료', count: kpi.value.fixed, group: 'result' },
  { status: '기타', label: '기타', count: kpi.value.etc, group: 'result' },
  { status: '미조치', label: '미조치', count: kpi.value.pending, tone: 'warn', group: 'unresolved' },
])
const kpiGroups = computed(() =>
  ['progress', 'result', 'unresolved'].map((group) => ({
    group,
    chips: kpiChips.value.filter((c) => c.group === group),
  })),
)

/** 칩 클릭 필터 — 같은 칩을 다시 누르면 '전체'로 풀린다. 필터링 후에는 남은 케이스를 펼쳐
 * 어느 절차가 그 상태인지 바로 보이게 한다. */
function selectChip(status) {
  chipStatus.value = chipStatus.value === status ? null : status
  page.value = 1
  if (chipStatus.value) expandAll()
}

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
  chipStatus.value = null
  page.value = 1
}

/** 필터는 실시간 반영 — 조회 버튼은 Enter/클릭 진입점만 제공 */
function search() {
  page.value = 1
}

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
  } else if (key === 'keyword' || key === 'tester' || key === 'screenKeyword') {
    filters.value[key] = ''
  } else {
    filters.value[key] = '전체'
  }
}

/**
 * h-pms 이식 — 케이스 리스트(라벨 행 + 각 케이스 행)의 좌우 스크롤이 행마다 따로 놀지 않고
 * 하나로 묶이게 한다(어느 행을 밀어도 전체가 같이 움직인다). 절차표(.case-body)는 폭이 완전히
 * 달라 여기 넣지 않는다 — .case-head-scroll 요소끼리 scrollLeft만 동기화한다. scroll 이벤트는
 * 버블링하지 않아 캡처 단계로 상위(.case-list)에서 위임해 받는다.
 */
const caseListEl = ref(null)
let syncingCaseHeadScroll = false
function onCaseHeadScrollCapture(e) {
  const source = e.target
  if (syncingCaseHeadScroll || !source.classList?.contains('case-head-scroll')) return
  syncingCaseHeadScroll = true
  caseListEl.value?.querySelectorAll('.case-head-scroll').forEach((el) => {
    if (el !== source) el.scrollLeft = source.scrollLeft
  })
  syncingCaseHeadScroll = false
}

function toggleExpand(id) {
  const next = new Set(expanded.value)
  if (next.has(id)) next.delete(id)
  else next.add(id)
  expanded.value = next
}

function expandAll() {
  expanded.value = new Set(pagedRows.value.map((r) => r.id))
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

/** h-pms 이식 — 오류등록/조치여부는 담당자별이 아니라 절차(스텝) 1건당 공용이라, 내가 입력
 * 가능한(담당) 결과 중 '오류'인 테스터 컬럼만 신규 등록 대상으로 쓴다. */
function myErrorTesterFor(row, step) {
  return row.testers.find((name) => isMyColumn(name) && step.byTester[name]?.result === '오류') || ''
}

function openError(row, step) {
  const testerName = myErrorTesterFor(row, step)
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
    cell.executedAt = TODAY
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
          class="sfb-w-md"
          label="업무범주"
          empty-label="시스템 선택"
          :options="systemFilterOptions"
        />
        <FilterSelectPill
          v-model="filters.bizCategory"
          class="sfb-w-md"
          label="업무구분"
          :options="config.bizCategoryOptions"
        />
        <FilterSelectPill v-model="filters.round" class="sfb-w-xs" label="차수" :options="config.roundOptions" />
        <FilterTextPill v-model="filters.tester" class="sfb-w-sm" label="테스터" placeholder="테스터" />
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
      ⚠ 테스트 가능 기간이 아닙니다. (예정일 : {{ period.start }} ~ {{ period.end }}) 테스트 계획일 도래 후 진행해주세요.
    </p>

    <div class="period card">
      <div class="period__head">
        <b>테스트 기간 (WBS 기준)</b>
        <span class="muted">{{ period.start }} ~ {{ period.end }}</span>
        <button type="button" class="note-link" @click="showCommonNoteModal = true">
          <svg class="note-link__icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <circle cx="12" cy="12" r="9" />
            <line x1="12" y1="11" x2="12" y2="16" />
            <circle cx="12" cy="8" r="0.6" fill="currentColor" stroke="none" />
          </svg>
          테스트 참고사항
        </button>
      </div>
      <div class="kpi-row">
        <div
          v-for="grp in kpiGroups"
          :key="grp.group"
          class="kpi-group"
          :class="grp.group !== 'progress' ? `kpi-group--${grp.group}` : ''"
        >
          <button
            v-for="chip in grp.chips"
            :key="chip.label"
            type="button"
            class="kpi-chip"
            :class="[chip.tone ? `kpi-chip--${chip.tone}` : '', { 'kpi-chip--on': chipStatus === chip.status }]"
            :aria-pressed="chipStatus === chip.status"
            @click="selectChip(chip.status)"
          >
            <span class="kpi-chip__lab">{{ chip.label }}</span><span class="kpi-chip__num">{{ chip.count }}</span>
          </button>
        </div>
      </div>
    </div>

    <div class="toolbar">
      <span class="toolbar__count">
        총 {{ filtered.length }}건
        <button
          type="button"
          class="toolbar__expand-btn"
          :disabled="!pagedRows.length"
          @click="allExpanded ? collapseAll() : expandAll()"
        >
          {{ allExpanded ? '전체 접기' : '전체 열기' }}
        </button>
      </span>
      <div class="toolbar__btns">
        <button type="button" class="toolbar__toggle" :class="{ 'toolbar__toggle--on': myTestsOnly }" @click="myTestsOnly = !myTestsOnly">
          내 테스트만
        </button>
        <button type="button" class="btn btn--primary btn--sm" @click="openTesterChange">테스터/계획변경</button>
        <ExcelDownloadButton @click="onExcelDownload" />
      </div>
    </div>

    <div ref="caseListEl" class="case-list" @scroll.capture="onCaseHeadScrollCapture">
      <div class="case-head-scroll case-head-scroll--master">
        <div class="case-head case-head--labels">
          <span />
          <span>NO</span>
          <span>요구사항ID</span>
          <span>수행구분</span>
          <span>시스템/업무/화면경로</span>
          <span>화면명</span>
          <span>케이스ID</span>
          <span>케이스명</span>
          <span>계획일</span>
          <span>테스터</span>
          <span>절차(진행/전체)</span>
          <span>진행율</span>
          <span>결과</span>
          <span>오류건수</span>
          <span>수정/미조치</span>
          <span>최종수행일</span>
          <span />
        </div>
      </div>
      <div
        v-for="(row, idx) in pagedRows"
        :key="row.id"
        class="case-item card"
        :class="{ dimmed: isDimmed(row), open: expanded.has(row.id) }"
      >
        <div class="case-head-scroll">
          <div class="case-head" @click="toggleExpand(row.id)">
            <span class="case-head__arrow">{{ expanded.has(row.id) ? '▲' : '▼' }}</span>
            <span class="case-head__no">{{ (page - 1) * PAGE_SIZE + idx + 1 }}</span>
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
        </div>

        <div v-if="expanded.has(row.id)" class="case-body">
          <p v-if="!row.testers.length" class="no-tester">
            배정된 테스터가 없어 결과를 입력할 수 없습니다. 상단 <b>[테스터/계획변경]</b>에서 이 케이스에 테스터를 배정해 주세요.
          </p>
          <table v-else class="step-grid">
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
                     등록과 조회가 동일한 팝업(ErrorDetailModal)을 쓰므로 버튼은 하나면 된다 —
                     이미 등록된 오류가 있으면(step.fixStatus) 조회로, 없으면 등록으로 동작·색만 바뀐다. -->
                <td class="center error-actions">
                  <button
                    type="button"
                    class="err-btn"
                    :class="step.fixStatus ? 'err-btn--lookup' : 'err-btn--register'"
                    :disabled="!step.fixStatus && !myErrorTesterFor(row, step)"
                    :title="
                      step.fixStatus
                        ? '이 절차에 등록된 오류 조회'
                        : (myErrorTesterFor(row, step) ? '' : `본인이 담당한 절차의 결과를 '오류'로 설정하면 등록할 수 있습니다.`)
                    "
                    @click="openError(row, step)"
                  >
                    등록/조회
                  </button>
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

    <HpPagination v-model:page="page" :total-pages="totalPages" />

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
      :cases="rows"
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

/* h-pms 이식 — 텍스트 링크가 아니라 파란 알약형 버튼(정보 아이콘 + 텍스트)으로. */
.note-link {
  margin-left: auto;
  display: inline-flex;
  align-items: center;
  gap: 6px;
  height: 28px;
  padding: 0 14px;
  border-radius: 999px;
  border: 1px solid var(--blue);
  background: var(--blue-bg);
  color: var(--blue);
  font-weight: 600;
  font-size: calc(12px + var(--font-size-offset, 0px));
  cursor: pointer;
  font-family: inherit;
}

.note-link:hover {
  filter: brightness(0.97);
}

.note-link__icon {
  width: 15px;
  height: 15px;
  flex-shrink: 0;
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

/* h-pms 이식 — 칩을 진행상태/결과/미조치 3구역 박스로 묶는다. 박스 폭은 칩 개수에 비례하게
   flex-grow를 줘서 칩 4개짜리와 5개짜리가 억지로 같은 폭이 되지 않는다. 미조치(1개)는 늘어나면
   휑해 보여 flex-grow 없이 내용만큼만 차지한다. */
.kpi-row {
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
  align-items: stretch;
}

.kpi-group {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  flex: 4 1 0;
  padding: 10px;
  border-radius: 10px;
  border: 1px solid var(--line);
  background: var(--field);
}

.kpi-group--result {
  flex-grow: 5;
  border-color: var(--teal-100);
  background: var(--teal-50);
}

.kpi-group--unresolved {
  flex: 0 0 auto;
  border-color: var(--red);
  background: var(--red-bg);
}

/* 칩은 button이다 — 누르면 그 상태를 가진 케이스만 남는다. */
.kpi-chip {
  flex: 1;
  min-width: 72px;
  padding: 8px 10px;
  background: var(--bg-surface, #fff);
  border-radius: 8px;
  text-align: center;
  border: 1px solid transparent;
  color: inherit;
  font-family: inherit;
  cursor: pointer;
}

.kpi-chip:hover {
  border-color: var(--line);
}

.kpi-chip--on {
  border-color: var(--color-primary);
  background: var(--lnb-side);
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

.toolbar__expand-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.toolbar__btns {
  display: flex;
  align-items: center;
  gap: 6px;
}

/* h-pms 이식 — '내 테스트만'을 필터 영역의 토글 스위치가 아니라 WBS 관리 화면의 '내 업무만'과
   같은 버튼 UI·위치(총건수 옆이 아닌 액션 버튼 그룹 앞)로 통일한다. */
.toolbar__toggle {
  height: 28px;
  padding: 0 12px;
  border: 1px solid var(--line);
  border-radius: 7px;
  background: var(--lnb-side);
  font-size: calc(12px + var(--font-size-offset, 0px));
  cursor: pointer;
  font-family: inherit;
  color: var(--muted);
}

.toolbar__toggle--on {
  background: var(--teal-50);
  border-color: var(--teal-100);
  color: var(--teal-600);
  font-weight: 700;
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

/* h-pms 이식 — 계획일 등 컬럼이 좁아 두 줄로 줄바꿈되던 문제를 고정 폭 + 좌우 스크롤로 바꾼다.
   스크롤은 .case-head 행 단위(.case-head-scroll)에 둔다 — 절차표(.case-body, 테스터가 많으면
   훨씬 넓다)와 폭을 공유하지 않기 위해서다. */
.case-head-scroll {
  overflow-x: auto;
}

/* 실제 스크롤 가능 영역은 행마다 있지만, 화면에 보이는 스크롤바는 라벨 행(--master) 것 하나만
   남기고 나머지는 숨긴다. 스크롤 위치는 onCaseHeadScrollCapture가 동기화하므로 라벨 행
   스크롤바 하나만 움직여도 전체가 같이 따라간다. */
.case-head-scroll:not(.case-head-scroll--master) {
  scrollbar-width: none;
  -ms-overflow-style: none;
}

.case-head-scroll:not(.case-head-scroll--master)::-webkit-scrollbar {
  display: none;
}

.case-head {
  display: grid;
  grid-template-columns:
    28px 36px 72px 64px minmax(180px, 1.2fr) 88px 80px minmax(160px, 1fr)
    160px 52px 56px 48px 64px 40px 56px 100px 84px;
  /* 컬럼 폭 합계만큼은 줄어들지 않는다 — 좁아지면 컬럼이 찌그러지는 대신 좌우 스크롤이 뜬다. */
  min-width: 1480px;
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

.case-head--labels {
  cursor: default;
  font-weight: 600;
  color: var(--ink-2);
  background: var(--field);
  border: 1px solid var(--line);
  border-radius: 8px;
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

/* h-pms 이식 — 등록/조회는 같은 오류를 여는 버튼 하나다. 높이는 옆 결과 셀렉트(.result-sel)와
   맞춘 28px 고정이라 절차 줄바꿈으로 행 높이가 달라져도 버튼 크기는 흔들리지 않는다. */
.err-btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  height: 28px;
  min-width: 76px;
  padding: 0 4px;
  border: none;
  background: none;
  cursor: pointer;
  font-family: inherit;
  font-size: calc(11px + var(--font-size-offset, 0px));
  font-weight: 700;
}

.err-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.err-btn--register {
  color: var(--teal-600);
}

.err-btn--register:hover:not(:disabled) {
  text-decoration: underline;
}

.err-btn--lookup {
  color: var(--muted);
  font-weight: 600;
}

.err-btn--lookup:hover:not(:disabled) {
  text-decoration: underline;
}

.error-actions {
  text-align: center;
}

.no-tester {
  margin: 0;
  padding: 14px 16px;
  color: var(--muted);
  font-size: calc(13px + var(--font-size-offset, 0px));
  background: var(--field);
  border: 1px dashed var(--line);
  border-radius: 6px;
}

.no-tester b {
  color: var(--ink);
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
