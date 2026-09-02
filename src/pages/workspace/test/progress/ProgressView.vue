<script setup>
// PAG-S-UAT-16 진척관리
// h-pms가 2026-09-01 이 화면과 단위테스트 진척관리를 pageMode 분기 하나로 합쳤다(ProgressPage.vue).
// 목업은 두 화면 분리를 유지하고, pageMode별 로직만 각 파일에 나눠 반영한다 — 이 파일은 DEV/UAT/STG분.
import { computed, onMounted, ref, watch, watchEffect } from 'vue'
import { useRouter } from 'vue-router'
import { useTestContext } from '@/app/composables/useTestContext'
import { getProgressData } from '@/entities/test-progress/mock/testProgress'
import ExcelDownloadButton from '@/shared/ui/ExcelDownloadButton.vue'
import BaseTooltip from '@/shared/ui/BaseTooltip.vue'
import SearchFilterBar from '@/shared/ui/SearchFilterBar.vue'
import FilterSelectPill from '@/shared/ui/FilterSelectPill.vue'
import HpDonutChart from '@/shared/ui/HpDonutChart.vue'
import BaseModal from '@/shared/ui/BaseModal.vue'
import { mockExcelDownload } from '@/shared/file-excel/excelDownload'
import { useAuthStore } from '@/app/stores/auth'

const { mode, pageTitle } = useTestContext()
const router = useRouter()
const authStore = useAuthStore()

/** DEV는 직전=단위테스트, 운영은 직전=DEV. 화면만 — 값은 API 연동 전 '-' */
const prevStageLabel = computed(() => (mode.value === 'uat' ? 'DEV테스트' : '단위테스트'))

const data = ref(null)
const filters = ref({
  system: '전체',
  tester: '',
})
const applied = ref({ ...filters.value })

function loadData() {
  data.value = getProgressData(mode.value, authStore.user?.id)
  search()
}

onMounted(loadData)
watch(mode, loadData)

const kpi = computed(() => data.value?.kpi)
const ps = computed(() => data.value?.progressStatus)

/**
 * 진행률 도넛 = 진행 + 잔여 두 조각. h-pms 이관(2026-09-01) — 종전 CSS conic-gradient는
 * 경계를 안티에일리어싱하지 않아 계단이 보였다. 공용 HpDonutChart(SVG)로 교체.
 */
const progressSegments = computed(() => {
  const done = Math.min(100, Math.max(0, kpi.value?.progressRate ?? 0))
  return [
    { value: done, color: 'var(--teal-500)' },
    { value: 100 - done, color: 'var(--line-2)' },
  ]
})

const systemOptions = computed(() => {
  const list = data.value?.systemDetail || []
  return ['전체', ...list.map((r) => r.system)]
})

const filteredSystemDetail = computed(() => {
  if (!data.value) return []
  return data.value.systemDetail.filter((r) => {
    if (applied.value.system !== '전체' && r.system !== applied.value.system) return false
    return true
  })
})

const filteredByTester = computed(() => {
  if (!data.value) return []
  const q = applied.value.tester.trim()
  if (!q) return data.value.byTester
  return data.value.byTester.filter((r) => r.name.includes(q))
})

const filteredDefectConfirm = computed(() => {
  if (!data.value) return []
  const q = applied.value.tester.trim()
  if (!q) return data.value.defectConfirm
  return data.value.defectConfirm.filter((r) => r.name.includes(q))
})

const filteredSystemProgress = computed(() => {
  if (!data.value) return []
  if (applied.value.system === '전체') return data.value.systemProgressDefect
  return data.value.systemProgressDefect.filter(
    (r) =>
      r.system === applied.value.system ||
      applied.value.system.includes(r.system.split(' ')[0]),
  )
})

/**
 * h-pms 이관(SB 3a, 2026-09-01) — "기본노출보다 많으면 [+더보기] → 전체 보기 팝업".
 * 개수 기준(도넛 4개/상세 5행) 대신 실제 렌더 높이(scrollHeight)가 기본노출 높이를 넘었는지로
 * 판정한다 — 글자 크기 설정(--font-size-offset)에 따라 기본노출 개수가 달라지기 때문.
 * 아래 상수는 .overflow-gate의 인라인 max-height와 같은 값이어야 한다(클리핑은 CSS, 판정은 JS).
 */
const OVERFLOW_MAX_HEIGHT = { systemProgress: 190, systemDetail: 280, tester: 260 }

function useOverflowGate(max) {
  const el = ref(null)
  const overflow = ref(false)
  watchEffect((onCleanup) => {
    const target = el.value
    if (!target) {
      overflow.value = false
      return
    }
    const check = () => {
      overflow.value = target.scrollHeight > max
    }
    check()
    if (typeof ResizeObserver === 'undefined') return
    const observer = new ResizeObserver(check)
    observer.observe(target)
    onCleanup(() => observer.disconnect())
  })
  return { el, overflow }
}

const systemProgressGate = useOverflowGate(OVERFLOW_MAX_HEIGHT.systemProgress)
const systemDetailGate = useOverflowGate(OVERFLOW_MAX_HEIGHT.systemDetail)
const testerGate = useOverflowGate(OVERFLOW_MAX_HEIGHT.tester)

/** "전체 보기" 레이어팝업 — 세 영역 중 지금 열려 있는 것(없으면 null). */
const fullViewTarget = ref(null)
function openFullView(target) {
  fullViewTarget.value = target
}
function closeFullView() {
  fullViewTarget.value = null
}

const systemDetailTotals = computed(() => {
  const rows = filteredSystemDetail.value
  const sum = (key) => rows.reduce((acc, r) => acc + (r[key] || 0), 0)
  const total = sum('total')
  return {
    total,
    wait: sum('wait'),
    progress: sum('progress'),
    delay: sum('delay'),
    progressRate: total ? Math.round(((total - sum('wait')) / total) * 100) : 0,
    defects: sum('defects'),
    pending: sum('pending'),
    done: sum('done'),
    fixRate: sum('defects') ? Math.round((sum('done') / sum('defects')) * 100) : 0,
  }
})

const byTesterTotals = computed(() => {
  const rows = filteredByTester.value
  const sum = (key) => rows.reduce((acc, r) => acc + (r[key] || 0), 0)
  const assigned = sum('assigned')
  const done = sum('done')
  return { assigned, wait: sum('wait'), delay: sum('delay'), done, rate: assigned ? Math.round((done / assigned) * 100) : 0 }
})

const defectConfirmTotals = computed(() => {
  const rows = filteredDefectConfirm.value
  const sum = (key) => rows.reduce((acc, r) => acc + (r[key] || 0), 0)
  const registered = sum('registered')
  const confirmed = sum('confirmed')
  return { registered, confirmed, rate: registered ? Math.round((confirmed / registered) * 100) : 0 }
})

/**
 * h-pms 이관(2026-09-01) — "테스터별 수행"·"테스터별 결함 확인" 별개 표 둘을 "테스터별 테스트
 * 및 결함확인 현황" 한 표로 합친다(테스터 한 명을 보려고 두 표를 오갈 필요가 없게). 두 목업
 * 배열이 이름이 어긋날 수 있어(예: 결함 미등록 테스터는 defectConfirm에 행이 없음) byTester를
 * 기준으로 defectConfirm을 매칭한다 — 없으면 0으로 채운다(가짜 등록 데이터를 만드는 게 아니라
 * "등록 결함 자체가 없다"는 뜻이라 0이 맞다).
 */
const mergedTesters = computed(() => {
  const confirmByName = new Map(filteredDefectConfirm.value.map((r) => [r.name, r]))
  return filteredByTester.value.map((r) => {
    const c = confirmByName.get(r.name) || { registered: 0, confirmed: 0 }
    const unconfirmed = c.registered - c.confirmed
    return {
      name: r.name,
      assigned: r.assigned,
      wait: r.wait,
      delay: r.delay,
      done: r.done,
      rate: r.rate,
      registered: c.registered,
      confirmed: c.confirmed,
      unconfirmed,
      confirmRate: c.registered ? Math.round((c.confirmed / c.registered) * 100) : 0,
    }
  })
})

const mergedTesterTotals = computed(() => ({
  assigned: byTesterTotals.value.assigned,
  wait: byTesterTotals.value.wait,
  delay: byTesterTotals.value.delay,
  done: byTesterTotals.value.done,
  rate: byTesterTotals.value.rate,
  registered: defectConfirmTotals.value.registered,
  confirmed: defectConfirmTotals.value.confirmed,
  unconfirmed: defectConfirmTotals.value.registered - defectConfirmTotals.value.confirmed,
  confirmRate: defectConfirmTotals.value.rate,
}))

function goToTestRun(system, result) {
  router.push({
    path: `/workspace/test/${mode.value}/perform`,
    query: { system: system ? system.split(' ')[0] : undefined, result: result || undefined },
  })
}

function goToDefect(system) {
  router.push({
    path: `/workspace/test/${mode.value}/defects`,
    query: { bizCategory: system ? system.split(' ').slice(1).join(' ') : undefined },
  })
}

function goToTestRunByTester(name, result) {
  router.push({ path: `/workspace/test/${mode.value}/perform`, query: { tester: name, result: result || undefined } })
}

function goToDefectByTester(name) {
  router.push({ path: `/workspace/test/${mode.value}/defects`, query: { tester: name } })
}

// 발의주체가 '테크'인 요청자는 요청자 수행현황 집계에서 제외한다 (B11, SB p.181)
const visibleRequesterProgress = computed(() =>
  (data.value?.requesterProgress || []).filter((r) => r.type !== 'tech'),
)

/**
 * h-pms 이관(2026-09-01) — 요청자별 표를 진행/대기/지연 3구간 가로 막대(구간마다 %·건수)로
 * 교체한다. h-pms의 /by-requester는 요청자 구분 없이 전체 합계 하나만 주므로, 목업은 요청자별
 * 행(테크 제외)을 합산해 같은 모양으로 만든다. 완료 건은 막대에 넣지 않는다(막대는 "지금
 * 진행 중인 상태" 구성비라 완료를 섞으면 %가 3구간을 넘어 의미가 흐려진다).
 */
const requesterAgg = computed(() => {
  const rows = visibleRequesterProgress.value
  const sum = (key) => rows.reduce((acc, r) => acc + (r[key] || 0), 0)
  const progress = sum('progress')
  const wait = sum('wait')
  const delay = sum('delay')
  const total = progress + wait + delay
  const pct = (n) => (total ? Math.round((n / total) * 100) : 0)
  return {
    total,
    done: sum('done'),
    progress: { count: progress, pct: pct(progress) },
    wait: { count: wait, pct: pct(wait) },
    delay: { count: delay, pct: pct(delay) },
  }
})

const requesterConfirmAgg = computed(() => {
  const rows = visibleRequesterProgress.value
  const registered = rows.reduce((acc, r) => acc + (r.defectRegistered || 0), 0)
  const confirmed = rows.reduce((acc, r) => acc + (r.defectConfirmed || 0), 0)
  const unconfirmed = registered - confirmed
  const pct = (n) => (registered ? Math.round((n / registered) * 100) : 0)
  return {
    registered,
    confirmed: { count: confirmed, pct: pct(confirmed) },
    unconfirmed: { count: unconfirmed, pct: pct(unconfirmed) },
  }
})

function search() {
  applied.value = { ...filters.value }
}

function resetFilters() {
  filters.value = { system: '전체', tester: '' }
  search()
}

const filterTags = computed(() => {
  const f = applied.value
  const tags = []
  if (f.system && f.system !== '전체') tags.push({ key: 'system', label: '시스템', value: f.system })
  if (f.tester?.trim()) tags.push({ key: 'tester', label: '테스터', value: f.tester })
  return tags
})

function removeFilterTag(key) {
  if (key === 'tester') filters.value.tester = ''
  else if (key === 'system') filters.value.system = '전체'
  search()
}

function onExcelDownload() {
  if (!data.value) return
  const label = `진척관리 (${mode.value === 'uat' ? '운영' : 'DEV'})`
  mockExcelDownload(label, filteredSystemDetail.value, [
    { key: 'system', label: '시스템' },
    { key: 'total', label: '전체' },
    { key: 'wait', label: '대기' },
    { key: 'progress', label: '진행' },
    { key: 'delay', label: '지연' },
    { key: 'fixRate', label: '결함처리율(%)' },
    { key: 'defects', label: '결함' },
    { key: 'pending', label: '미처리' },
    { key: 'done', label: '처리' },
  ])
}
</script>

<template>
  <div v-if="data" class="progress">
    <div class="progress__head">
      <h1 class="progress__title">{{ pageTitle }}</h1>
      <ExcelDownloadButton @click="onExcelDownload" />
    </div>
    <p class="progress__hint">테스트 진척·결함 처리 현황 · 1시간마다 갱신 (목업 {{ data.updatedAt }})</p>

    <SearchFilterBar
      v-model:search="filters.tester"
      search-placeholder="테스터명"
      :show-expand="false"
      :applied-tags="filterTags"
      @reset="resetFilters"
      @search="search"
      @remove-tag="removeFilterTag"
    >
      <template #primary>
        <FilterSelectPill v-model="filters.system" label="시스템" :options="systemOptions" />
      </template>
    </SearchFilterBar>

    <div class="kpi-grid">
      <div class="kpi-card card">
        <div class="kpi-card__head">
          <svg class="kpi-card__ico" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
            <rect x="5" y="4.5" width="14" height="16" rx="2" />
            <path d="M9 4.5h6v2.5H9z" />
            <path d="m8.5 13 2.2 2.2L16 10.5" />
          </svg>
          <div>
            <div class="kpi-card__label">테스트 진척률</div>
            <div class="kpi-card__value">{{ kpi.progressRate }}<small>%</small></div>
          </div>
        </div>
        <div class="hbar"><i :style="{ width: `${kpi.progressRate}%` }" /></div>
        <div class="kpi-card__sub">{{ kpi.progressDone }} / {{ kpi.progressTotal }}</div>
      </div>

      <div class="kpi-card card">
        <div class="kpi-card__head">
          <svg class="kpi-card__ico kpi-card__ico--green" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
            <circle cx="12" cy="7" r="2" />
            <path d="M10.5 5.5 9 3.5M13.5 5.5 15 3.5" />
            <ellipse cx="12" cy="14" rx="4.5" ry="6" />
            <path d="M12 8v12" />
            <path d="M7.8 11 3 9M7.5 14H2.5M7.8 17 3 19M16.2 11l4.8-2M16.5 14h5M16.2 17l4.8 2" />
          </svg>
          <div>
            <div class="kpi-card__label">결함처리</div>
            <div class="kpi-card__value kpi-card__value--green">{{ kpi.defectFixRate }}<small>%</small></div>
          </div>
        </div>
        <div class="hbar hbar--green"><i :style="{ width: `${kpi.defectFixRate}%` }" /></div>
        <div class="kpi-card__sub">{{ kpi.defectFixed }} / {{ kpi.defectTotal }}</div>
      </div>

      <div class="kpi-card card">
        <div class="kpi-card__head">
          <svg class="kpi-card__ico kpi-card__ico--warn" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
            <path d="M12 4 3 20h18z" />
            <path d="M12 10.5v4" />
            <circle cx="12" cy="17" r="0.6" fill="currentColor" stroke="none" />
          </svg>
          <div>
            <div class="kpi-card__label">미처리 결함율</div>
            <div class="kpi-card__value kpi-card__value--warn">{{ kpi.pendingDefectRate }}<small>%</small></div>
          </div>
        </div>
        <div class="hbar hbar--warn"><i :style="{ width: `${kpi.pendingDefectRate}%` }" /></div>
        <div class="kpi-card__sub">{{ kpi.pendingDefects }} / {{ kpi.pendingTotal }}</div>
      </div>
    </div>

    <div class="grid-2">
      <section class="panel card">
        <h3>테스트 진행 현황</h3>
        <div class="status-row">
          <HpDonutChart
            :segments="progressSegments"
            :size="150"
            :thickness="19"
            :gap="0"
            rounded
            :aria-label="`진행률 ${kpi.progressRate}%`"
          >
            <span class="donut__l">진행률</span>
            <span class="donut__v">{{ kpi.progressRate }}%</span>
          </HpDonutChart>
          <button type="button" class="total-box" @click="goToTestRun()">
            <span>전체</span><b>{{ ps.total }}</b>
          </button>
          <div class="stage-list">
            <button type="button" class="stage-row" @click="goToTestRun(null, '대기')">
              <span><i class="dot dot--wait" />대기</span><b>{{ ps.wait }}</b>
            </button>
            <button type="button" class="stage-row" @click="goToTestRun(null, '진행')">
              <span><i class="dot dot--run" />진행</span><b>{{ ps.progress }}</b>
            </button>
            <button type="button" class="stage-row" @click="goToTestRun(null, '지연')">
              <span><i class="dot dot--delay" />지연</span><b>{{ ps.delay }}</b>
            </button>
            <!-- 경미지연은 h-pms 응답엔 없는 필드지만 목업 mock에 있어 그대로 유지한다. -->
            <button type="button" class="stage-row" @click="goToTestRun(null, '경미지연')">
              <span><i class="dot dot--muted" />경미지연</span><b>{{ ps.delayMinor }}</b>
            </button>
          </div>
        </div>
      </section>

      <section class="panel card">
        <div class="panel__head">
          <h3>시스템별 테스트 진행 및 결함 발생 현황</h3>
          <button v-if="systemProgressGate.overflow.value" type="button" class="more-btn" @click="openFullView('systemProgress')">
            더보기
          </button>
        </div>
        <p v-if="!filteredSystemProgress.length" class="empty-row">조회 결과가 없습니다.</p>
        <div
          v-else
          class="overflow-gate"
          :style="{ maxHeight: `${OVERFLOW_MAX_HEIGHT.systemProgress}px` }"
          :ref="(v) => (systemProgressGate.el.value = v)"
        >
          <div class="hbar-row">
            <button
              v-for="row in filteredSystemProgress"
              :key="row.system"
              type="button"
              class="hbar-item"
              @click="goToDefect(row.system)"
            >
              <span class="hbar-item__lab">{{ row.system }}</span>
              <div class="hbar-item__track">
                <span class="hbar-item__done" :style="{ width: `${row.testRate}%` }" />
                <span class="hbar-item__defect" :style="{ width: `${row.defectRate}%` }" />
              </div>
              <span class="hbar-item__val">완료 {{ row.testRate }}% · 결함 {{ row.defect }}건({{ row.defectRate }}%)</span>
            </button>
          </div>
        </div>
      </section>
    </div>

    <div class="grid-2 grid-2--wide">
      <section class="panel card">
        <div class="panel__head">
          <h3>시스템별 상세 테스트 진척 현황</h3>
          <button v-if="systemDetailGate.overflow.value" type="button" class="more-btn" @click="openFullView('systemDetail')">
            더보기
          </button>
        </div>
        <div
          class="overflow-gate"
          :style="{ maxHeight: `${OVERFLOW_MAX_HEIGHT.systemDetail}px` }"
          :ref="(v) => (systemDetailGate.el.value = v)"
        >
        <div class="inner-table__scroll">
        <table class="inner-table">
          <thead>
            <tr>
              <th rowspan="2">시스템</th>
              <th colspan="3" class="group-head">{{ prevStageLabel }}</th>
              <th colspan="5" class="group-head">테스트진행</th>
              <th colspan="4" class="group-head group-head--defect">
                결함처리
                <BaseTooltip text="미조치 : 처리상태 접수 + 처리예정 / 조치완료 : 처리완료 + 오류아님 + 수정제외" />
              </th>
            </tr>
            <tr>
              <th>총 수행</th>
              <th>총 결함</th>
              <th>결함발생률</th>
              <th>공정률</th>
              <th>총건수</th>
              <th>대기</th>
              <th>진행</th>
              <th>지연</th>
              <th>처리율</th>
              <th>총 결함</th>
              <th>미조치</th>
              <th>조치완료</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="row in filteredSystemDetail" :key="row.system">
              <td>{{ row.system }}</td>
              <!-- 직전 단계 수치 — 목업 mock엔 시스템별 직전 단계 결함 내역이 없어 '-' 그대로 둔다. -->
              <td>-</td>
              <td>-</td>
              <td>-</td>
              <td class="progress-rate">{{ row.progressRate }}%</td>
              <td><button type="button" class="count-link" @click="goToTestRun(row.system)">{{ row.total }}</button></td>
              <td><button type="button" class="count-link" @click="goToTestRun(row.system, '대기')">{{ row.wait }}</button></td>
              <td><button type="button" class="count-link" @click="goToTestRun(row.system, '진행')">{{ row.progress }}</button></td>
              <td><button type="button" class="count-link" @click="goToTestRun(row.system, '지연')">{{ row.delay }}</button></td>
              <td class="fix-rate">{{ row.fixRate }}%</td>
              <td><button type="button" class="count-link" @click="goToDefect(row.system)">{{ row.defects }}</button></td>
              <td><button type="button" class="count-link" @click="goToDefect(row.system)">{{ row.pending }}</button></td>
              <td>{{ row.done }}</td>
            </tr>
            <tr v-if="!filteredSystemDetail.length">
              <td colspan="13" class="empty-row">조회 결과가 없습니다.</td>
            </tr>
            <tr v-if="filteredSystemDetail.length" class="total-row">
              <td>전체 합계</td>
              <td>-</td>
              <td>-</td>
              <td>-</td>
              <td>{{ systemDetailTotals.progressRate }}%</td>
              <td>{{ systemDetailTotals.total }}</td>
              <td>{{ systemDetailTotals.wait }}</td>
              <td>{{ systemDetailTotals.progress }}</td>
              <td>{{ systemDetailTotals.delay }}</td>
              <td>{{ systemDetailTotals.fixRate }}%</td>
              <td>{{ systemDetailTotals.defects }}</td>
              <td>{{ systemDetailTotals.pending }}</td>
              <td>{{ systemDetailTotals.done }}</td>
            </tr>
          </tbody>
        </table>
        </div>
        </div>
      </section>

      <section v-if="data.defectByPhase?.length" class="panel card">
        <h3>테스트 단계별 결함발생률</h3>
        <table class="inner-table">
          <thead>
            <tr>
              <th>차수</th>
              <th>결함수</th>
              <th>발생률</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="row in data.defectByPhase" :key="row.phase">
              <td>{{ row.phase }}</td>
              <td>{{ row.count }}</td>
              <td>
                <div class="prog prog--err">
                  <i :style="{ width: `${Math.min(row.rate * 4, 100)}%`, maxWidth: '100%' }" />
                  <span>{{ row.rate }}%</span>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </section>
    </div>

    <div class="grid-2 grid-2--wide">
      <section class="panel card">
        <div class="panel__head">
          <h3>테스터별 테스트 및 결함확인 현황 <span class="hint-sm">(확인 기준: {{ data.confirmLabel }})</span></h3>
          <button v-if="testerGate.overflow.value" type="button" class="more-btn" @click="openFullView('tester')">
            더보기
          </button>
        </div>
        <div
          class="overflow-gate"
          :style="{ maxHeight: `${OVERFLOW_MAX_HEIGHT.tester}px` }"
          :ref="(v) => (testerGate.el.value = v)"
        >
        <div class="inner-table__scroll">
        <table class="inner-table">
          <thead>
            <tr>
              <th rowspan="2">테스터</th>
              <th colspan="5" class="group-head">테스트 수행</th>
              <th colspan="4" class="group-head group-head--defect">결함조치 확인</th>
            </tr>
            <tr>
              <th>배정</th>
              <th>대기</th>
              <th>지연</th>
              <th>완료</th>
              <th>진척률</th>
              <th>등록</th>
              <th>확인</th>
              <th>미확인</th>
              <th>확인률</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="row in mergedTesters" :key="row.name">
              <td><button type="button" class="count-link" @click="goToTestRunByTester(row.name)">{{ row.name }}</button></td>
              <td><button type="button" class="count-link" @click="goToTestRunByTester(row.name)">{{ row.assigned }}</button></td>
              <td><button type="button" class="count-link" @click="goToTestRunByTester(row.name, '대기')">{{ row.wait }}</button></td>
              <td><button type="button" class="count-link" @click="goToTestRunByTester(row.name, '지연')">{{ row.delay }}</button></td>
              <td>{{ row.done }}</td>
              <td>
                <div class="prog">
                  <i :style="{ width: `${row.rate}%` }" />
                  <span>{{ row.rate }}%</span>
                </div>
              </td>
              <td><button type="button" class="count-link" @click="goToDefectByTester(row.name)">{{ row.registered }}</button></td>
              <td><button type="button" class="count-link" @click="goToDefectByTester(row.name)">{{ row.confirmed }}</button></td>
              <td><button type="button" class="count-link" @click="goToDefectByTester(row.name)">{{ row.unconfirmed }}</button></td>
              <td>{{ row.confirmRate }}%</td>
            </tr>
            <tr v-if="!mergedTesters.length">
              <td colspan="10" class="empty-row">조회 결과가 없습니다.</td>
            </tr>
            <tr v-if="mergedTesters.length" class="total-row">
              <td>전체 합계</td>
              <td>{{ mergedTesterTotals.assigned }}</td>
              <td>{{ mergedTesterTotals.wait }}</td>
              <td>{{ mergedTesterTotals.delay }}</td>
              <td>{{ mergedTesterTotals.done }}</td>
              <td>{{ mergedTesterTotals.rate }}%</td>
              <td>{{ mergedTesterTotals.registered }}</td>
              <td>{{ mergedTesterTotals.confirmed }}</td>
              <td>{{ mergedTesterTotals.unconfirmed }}</td>
              <td>{{ mergedTesterTotals.confirmRate }}%</td>
            </tr>
          </tbody>
        </table>
        </div>
        </div>
      </section>

      <section class="panel card">
        <h3>요청자 수행 현황 <span class="hint-sm">(테크담당 제외 · 전체 {{ requesterAgg.total }}건)</span></h3>
        <template v-if="requesterAgg.total || requesterConfirmAgg.registered">
          <div class="stat-bar">
            <span v-if="requesterAgg.progress.pct" class="stat-bar__seg stat-bar__seg--run" :style="{ width: `${requesterAgg.progress.pct}%` }">
              <b>{{ requesterAgg.progress.pct }}%</b><small>{{ requesterAgg.progress.count }}건</small>
            </span>
            <span v-if="requesterAgg.wait.pct" class="stat-bar__seg stat-bar__seg--wait" :style="{ width: `${requesterAgg.wait.pct}%` }">
              <b>{{ requesterAgg.wait.pct }}%</b><small>{{ requesterAgg.wait.count }}건</small>
            </span>
            <span v-if="requesterAgg.delay.pct" class="stat-bar__seg stat-bar__seg--delay" :style="{ width: `${requesterAgg.delay.pct}%` }">
              <b>{{ requesterAgg.delay.pct }}%</b><small>{{ requesterAgg.delay.count }}건</small>
            </span>
            <span v-if="!requesterAgg.total" class="stat-bar__seg stat-bar__seg--empty">진행 중인 건이 없습니다.</span>
          </div>
          <ul class="legend legend--row">
            <li><i class="legend__dot legend__dot--run" />진행</li>
            <li><i class="legend__dot legend__dot--wait" />대기</li>
            <li><i class="legend__dot legend__dot--delay" />지연</li>
          </ul>

          <h4 class="requester-subtitle">요청자 결함확인 현황</h4>
          <div class="stat-bar">
            <span v-if="requesterConfirmAgg.confirmed.pct" class="stat-bar__seg stat-bar__seg--run" :style="{ width: `${requesterConfirmAgg.confirmed.pct}%` }">
              <b>{{ requesterConfirmAgg.confirmed.pct }}%</b><small>{{ requesterConfirmAgg.confirmed.count }}건</small>
            </span>
            <span v-if="requesterConfirmAgg.unconfirmed.pct" class="stat-bar__seg stat-bar__seg--wait" :style="{ width: `${requesterConfirmAgg.unconfirmed.pct}%` }">
              <b>{{ requesterConfirmAgg.unconfirmed.pct }}%</b><small>{{ requesterConfirmAgg.unconfirmed.count }}건</small>
            </span>
            <span v-if="!requesterConfirmAgg.registered" class="stat-bar__seg stat-bar__seg--empty">등록된 결함이 없습니다.</span>
          </div>
          <ul class="legend legend--row">
            <li><i class="legend__dot legend__dot--run" />확인완료</li>
            <li><i class="legend__dot legend__dot--wait" />미확인</li>
          </ul>
        </template>
        <p v-else class="empty-row">조회 결과가 없습니다.</p>
        <p class="hint-sm requester-note">참고 완료 {{ requesterAgg.done }}건 · 등록결함 {{ requesterConfirmAgg.registered }}건</p>
      </section>
    </div>

    <section v-if="data.systemCompare" class="panel card">
      <h3>DEV vs 운영 시스템 비교</h3>
      <table class="inner-table">
        <thead>
          <tr>
            <th>시스템</th>
            <th>DEV 전체</th>
            <th>DEV 완료</th>
            <th>운영 전체</th>
            <th>운영 완료</th>
            <th>운영 결함</th>
            <th>결함률</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="row in data.systemCompare" :key="row.system">
            <td>{{ row.system }}</td>
            <td>{{ row.devTotal }}</td>
            <td>{{ row.devDone }}</td>
            <td>{{ row.uatTotal }}</td>
            <td>{{ row.uatDone }}</td>
            <td>{{ row.uatDefects }}</td>
            <td>{{ row.defectRate }}%</td>
          </tr>
        </tbody>
      </table>
    </section>

    <section v-if="data.threeStageDefectRate?.length" class="panel card">
      <h3>테스트 단계별 결함 발생률 (단위/DEV/운영 비교)</h3>
      <div class="vbar-chart">
        <div v-for="row in data.threeStageDefectRate" :key="row.stage" class="vbar">
          <span class="vbar__num">{{ row.rate }}%</span>
          <div class="vbar__track">
            <span class="vbar__fill" :style="{ height: `${Math.min(row.rate * 3, 100)}%` }" />
          </div>
          <span class="vbar__lab">{{ row.stage }}</span>
          <span class="vbar__sub">{{ row.defects }}건</span>
        </div>
      </div>
    </section>

    <BaseModal :visible="fullViewTarget === 'systemProgress'" title="시스템별 테스트 진행 및 결함 발생 현황" wide @close="closeFullView">
      <div class="hbar-row">
        <button
          v-for="row in filteredSystemProgress"
          :key="row.system"
          type="button"
          class="hbar-item"
          @click="closeFullView(); goToDefect(row.system)"
        >
          <span class="hbar-item__lab">{{ row.system }}</span>
          <div class="hbar-item__track">
            <span class="hbar-item__done" :style="{ width: `${row.testRate}%` }" />
            <span class="hbar-item__defect" :style="{ width: `${row.defectRate}%` }" />
          </div>
          <span class="hbar-item__val">완료 {{ row.testRate }}% · 결함 {{ row.defect }}건({{ row.defectRate }}%)</span>
        </button>
      </div>
    </BaseModal>

    <BaseModal :visible="fullViewTarget === 'systemDetail'" title="시스템별 상세 테스트 진척 현황" xwide @close="closeFullView">
      <div class="inner-table__scroll">
      <table class="inner-table">
        <thead>
          <tr>
            <th rowspan="2">시스템</th>
            <th colspan="3" class="group-head">{{ prevStageLabel }}</th>
            <th colspan="5" class="group-head">테스트진행</th>
            <th colspan="4" class="group-head group-head--defect">결함처리</th>
          </tr>
          <tr>
            <th>총 수행</th>
            <th>총 결함</th>
            <th>결함발생률</th>
            <th>공정률</th>
            <th>총건수</th>
            <th>대기</th>
            <th>진행</th>
            <th>지연</th>
            <th>처리율</th>
            <th>총 결함</th>
            <th>미조치</th>
            <th>조치완료</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="row in filteredSystemDetail" :key="row.system + '-full'">
            <td>{{ row.system }}</td>
            <td>-</td>
            <td>-</td>
            <td>-</td>
            <td class="progress-rate">{{ row.progressRate }}%</td>
            <td><button type="button" class="count-link" @click="closeFullView(); goToTestRun(row.system)">{{ row.total }}</button></td>
            <td><button type="button" class="count-link" @click="closeFullView(); goToTestRun(row.system, '대기')">{{ row.wait }}</button></td>
            <td><button type="button" class="count-link" @click="closeFullView(); goToTestRun(row.system, '진행')">{{ row.progress }}</button></td>
            <td><button type="button" class="count-link" @click="closeFullView(); goToTestRun(row.system, '지연')">{{ row.delay }}</button></td>
            <td class="fix-rate">{{ row.fixRate }}%</td>
            <td><button type="button" class="count-link" @click="closeFullView(); goToDefect(row.system)">{{ row.defects }}</button></td>
            <td><button type="button" class="count-link" @click="closeFullView(); goToDefect(row.system)">{{ row.pending }}</button></td>
            <td>{{ row.done }}</td>
          </tr>
          <tr v-if="!filteredSystemDetail.length">
            <td colspan="13" class="empty-row">조회 결과가 없습니다.</td>
          </tr>
          <tr v-if="filteredSystemDetail.length" class="total-row">
            <td>전체 합계</td>
            <td>-</td>
            <td>-</td>
            <td>-</td>
            <td>{{ systemDetailTotals.progressRate }}%</td>
            <td>{{ systemDetailTotals.total }}</td>
            <td>{{ systemDetailTotals.wait }}</td>
            <td>{{ systemDetailTotals.progress }}</td>
            <td>{{ systemDetailTotals.delay }}</td>
            <td>{{ systemDetailTotals.fixRate }}%</td>
            <td>{{ systemDetailTotals.defects }}</td>
            <td>{{ systemDetailTotals.pending }}</td>
            <td>{{ systemDetailTotals.done }}</td>
          </tr>
        </tbody>
      </table>
      </div>
    </BaseModal>

    <BaseModal :visible="fullViewTarget === 'tester'" title="테스터별 테스트 및 결함확인 현황" xwide @close="closeFullView">
      <div class="inner-table__scroll">
      <table class="inner-table">
        <thead>
          <tr>
            <th rowspan="2">테스터</th>
            <th colspan="5" class="group-head">테스트 수행</th>
            <th colspan="4" class="group-head group-head--defect">결함조치 확인</th>
          </tr>
          <tr>
            <th>배정</th>
            <th>대기</th>
            <th>지연</th>
            <th>완료</th>
            <th>진척률</th>
            <th>등록</th>
            <th>확인</th>
            <th>미확인</th>
            <th>확인률</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="row in mergedTesters" :key="row.name + '-full'">
            <td><button type="button" class="count-link" @click="closeFullView(); goToTestRunByTester(row.name)">{{ row.name }}</button></td>
            <td><button type="button" class="count-link" @click="closeFullView(); goToTestRunByTester(row.name)">{{ row.assigned }}</button></td>
            <td><button type="button" class="count-link" @click="closeFullView(); goToTestRunByTester(row.name, '대기')">{{ row.wait }}</button></td>
            <td><button type="button" class="count-link" @click="closeFullView(); goToTestRunByTester(row.name, '지연')">{{ row.delay }}</button></td>
            <td>{{ row.done }}</td>
            <td>
              <div class="prog">
                <i :style="{ width: `${row.rate}%` }" />
                <span>{{ row.rate }}%</span>
              </div>
            </td>
            <td><button type="button" class="count-link" @click="closeFullView(); goToDefectByTester(row.name)">{{ row.registered }}</button></td>
            <td><button type="button" class="count-link" @click="closeFullView(); goToDefectByTester(row.name)">{{ row.confirmed }}</button></td>
            <td><button type="button" class="count-link" @click="closeFullView(); goToDefectByTester(row.name)">{{ row.unconfirmed }}</button></td>
            <td>{{ row.confirmRate }}%</td>
          </tr>
          <tr v-if="!mergedTesters.length">
            <td colspan="10" class="empty-row">조회 결과가 없습니다.</td>
          </tr>
          <tr v-if="mergedTesters.length" class="total-row">
            <td>전체 합계</td>
            <td>{{ mergedTesterTotals.assigned }}</td>
            <td>{{ mergedTesterTotals.wait }}</td>
            <td>{{ mergedTesterTotals.delay }}</td>
            <td>{{ mergedTesterTotals.done }}</td>
            <td>{{ mergedTesterTotals.rate }}%</td>
            <td>{{ mergedTesterTotals.registered }}</td>
            <td>{{ mergedTesterTotals.confirmed }}</td>
            <td>{{ mergedTesterTotals.unconfirmed }}</td>
            <td>{{ mergedTesterTotals.confirmRate }}%</td>
          </tr>
        </tbody>
      </table>
      </div>
    </BaseModal>
  </div>
</template>

<style scoped>
.progress {
  padding: 14px 18px 28px;
  color: var(--ink);
  font-size: calc(13px + var(--font-size-offset, 0px));
}

.progress__head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  margin: 0 0 4px;
}

.progress__title {
  font-size: calc(18px + var(--font-size-offset, 0px));
  font-weight: 700;
  margin: 0;
}

.progress__hint {
  font-size: calc(12px + var(--font-size-offset, 0px));
  color: var(--muted);
  margin: 0 0 14px;
}

.empty-row {
  text-align: center;
  color: var(--muted);
  padding: 20px !important;
}

.kpi-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 12px;
  margin-bottom: 14px;
}

.kpi-card {
  padding: 16px;
}

.kpi-card__head {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 10px;
}

.kpi-card__ico {
  width: calc(24px + var(--font-size-offset, 0px));
  height: calc(24px + var(--font-size-offset, 0px));
  flex-shrink: 0;
  color: var(--teal-600);
}

.kpi-card__ico--green {
  color: var(--green);
}

.kpi-card__ico--warn {
  color: var(--orange);
}

.kpi-card__label {
  font-size: calc(12px + var(--font-size-offset, 0px));
  color: var(--muted);
}

.kpi-card__value {
  font-size: calc(24px + var(--font-size-offset, 0px));
  font-weight: 800;
  color: var(--teal-600);
}

.kpi-card__value small {
  font-size: calc(14px + var(--font-size-offset, 0px));
}

.kpi-card__value--green {
  color: var(--green);
}

.kpi-card__value--warn {
  color: var(--orange);
}

.kpi-card__sub {
  font-size: calc(11px + var(--font-size-offset, 0px));
  color: var(--muted);
  margin-top: 5px;
}

.hbar {
  height: 8px;
  background: var(--line-2);
  border-radius: 4px;
  overflow: hidden;
}

.hbar i {
  display: block;
  height: 100%;
  background: var(--teal-500);
  border-radius: 4px;
}

.hbar--green i {
  background: var(--green);
}

.hbar--warn i {
  background: var(--orange);
}

.grid-2 {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 12px;
  margin-bottom: 12px;
}

/* h-pms 이관 — 상세 표가 옆 차트보다 훨씬 넓다. 표 쪽에 더 많은 폭을 준다. */
.grid-2--wide {
  grid-template-columns: 7fr 3fr;
}

.grid-2 > .panel {
  min-width: 0;
}

.inner-table__scroll {
  overflow-x: auto;
}

/* SB 3a "더보기" 게이트 — max-height는 인라인 :style로 OVERFLOW_MAX_HEIGHT와 같은 값을 준다. */
.overflow-gate {
  overflow: hidden;
}

.panel {
  padding: 14px 16px;
  margin-bottom: 12px;
}

.panel h3 {
  margin: 0 0 12px;
  font-size: calc(14px + var(--font-size-offset, 0px));
  font-weight: 700;
}

.hint-sm {
  font-size: calc(11px + var(--font-size-offset, 0px));
  font-weight: 400;
  color: var(--muted);
}

.panel__head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  margin-bottom: 12px;
}

.panel__head h3 {
  margin: 0;
}

.more-btn {
  border: none;
  background: none;
  color: var(--teal-600);
  font-size: calc(11.5px + var(--font-size-offset, 0px));
  font-weight: 600;
  cursor: pointer;
  font-family: inherit;
}

.status-row {
  display: flex;
  align-items: center;
  gap: 24px;
  flex-wrap: wrap;
  justify-content: center;
}

.total-box {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 2px;
  border: none;
  border-left: 1px solid var(--line);
  border-right: 1px solid var(--line);
  padding: 0 20px;
  background: none;
  cursor: pointer;
  font-family: inherit;
  font-size: calc(12px + var(--font-size-offset, 0px));
  font-weight: 600;
  color: var(--muted);
}

.total-box b {
  display: block;
  min-width: 3ch;
  text-align: center;
  font-variant-numeric: tabular-nums;
  font-size: calc(30px + var(--font-size-offset, 0px));
  font-weight: 800;
  color: var(--ink);
}

.stage-list {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.stage-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  width: 128px;
  gap: 10px;
  background: none;
  border: none;
  padding: 2px 0;
  cursor: pointer;
  font-family: inherit;
  font-size: calc(12px + var(--font-size-offset, 0px));
  color: var(--ink-2);
}

.stage-row span {
  display: flex;
  align-items: center;
  gap: 7px;
}

.stage-row b {
  font-weight: 700;
  color: var(--ink);
  font-variant-numeric: tabular-nums;
}

.dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  flex-shrink: 0;
}

.dot--wait {
  background: var(--line-2);
}

.dot--run {
  background: var(--teal-500);
}

.dot--delay {
  background: var(--orange);
}

.dot--muted {
  background: var(--muted);
}

.count-link {
  border: none;
  background: none;
  color: var(--teal-600);
  font-weight: 600;
  cursor: pointer;
  font-family: inherit;
  font-size: inherit;
  text-decoration: underline;
  padding: 0;
}

.total-row {
  background: var(--field);
  font-weight: 700;
}

.hbar-row {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.hbar-item {
  display: grid;
  grid-template-columns: 90px 1fr auto;
  align-items: center;
  gap: 10px;
  border: none;
  background: none;
  padding: 0;
  cursor: pointer;
  font-family: inherit;
  text-align: left;
}

.hbar-item__lab {
  font-size: calc(12px + var(--font-size-offset, 0px));
  font-weight: 600;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.hbar-item__track {
  position: relative;
  height: 10px;
  background: var(--line-2);
  border-radius: 5px;
  overflow: hidden;
}

.hbar-item__done {
  position: absolute;
  inset: 0;
  display: block;
  height: 100%;
  background: var(--teal-500);
  border-radius: 5px;
}

.hbar-item__defect {
  position: absolute;
  top: 0;
  bottom: 0;
  right: 0;
  display: block;
  background: var(--red);
  opacity: 0.7;
  border-radius: 5px;
}

.hbar-item__val {
  font-size: calc(11px + var(--font-size-offset, 0px));
  color: var(--muted);
  white-space: nowrap;
}

.donut__v {
  font-size: calc(14px + var(--font-size-offset, 0px));
  font-weight: 800;
  color: var(--teal-700);
}

.donut__l {
  font-size: calc(9px + var(--font-size-offset, 0px));
  color: var(--muted);
}

.legend {
  list-style: none;
  margin: 0;
  padding: 0;
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.legend li {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: calc(12px + var(--font-size-offset, 0px));
}

.legend__dot {
  width: 10px;
  height: 10px;
  border-radius: 50%;
  display: inline-block;
  flex: none;
}

.legend__dot--wait {
  background: var(--line-2);
}

.legend__dot--run {
  background: var(--teal-500);
}

.legend__dot--delay {
  background: var(--orange);
}

.legend--row {
  flex-direction: row;
  flex-wrap: wrap;
  gap: 14px;
  margin-top: 8px;
}

.requester-note {
  margin-top: 12px;
}

.requester-subtitle {
  margin: 16px 0 8px;
  font-size: calc(12px + var(--font-size-offset, 0px));
  font-weight: 700;
  color: var(--ink-2);
}

.stat-bar {
  display: flex;
  align-items: stretch;
  height: 44px;
  border-radius: 8px;
  overflow: hidden;
}

.stat-bar__seg {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-width: 36px;
  color: var(--color-text-inverse);
  font-size: calc(11px + var(--font-size-offset, 0px));
  line-height: 1.2;
  overflow: hidden;
  white-space: nowrap;
}

.stat-bar__seg b {
  font-size: calc(14px + var(--font-size-offset, 0px));
  font-weight: 800;
}

.stat-bar__seg small {
  font-size: calc(10px + var(--font-size-offset, 0px));
  opacity: 0.9;
}

.stat-bar__seg--run {
  background: var(--teal-500);
}

.stat-bar__seg--wait {
  background: var(--line-2);
  color: var(--ink-2);
}

.stat-bar__seg--delay {
  background: var(--orange);
}

.stat-bar__seg--empty {
  flex: 1;
  background: var(--line-2);
  color: var(--muted);
  font-size: calc(12px + var(--font-size-offset, 0px));
}

.inner-table {
  width: 100%;
  border-collapse: collapse;
  font-size: calc(12px + var(--font-size-offset, 0px));
}

.inner-table th,
.inner-table td {
  padding: 8px 10px;
  border-bottom: 1px solid var(--line);
  text-align: left;
}

.inner-table th {
  background: var(--field);
  font-weight: 600;
  color: var(--ink);
}

.inner-table th.group-head {
  text-align: center;
  background: var(--teal-50);
  color: var(--teal-700);
}

.prog {
  display: flex;
  align-items: center;
  gap: 8px;
}

.prog i {
  display: block;
  height: 6px;
  max-width: 80px;
  background: var(--teal-500);
  border-radius: 3px;
}

.prog--err i {
  background: var(--red);
}

.progress-rate {
  font-weight: 700;
  color: var(--teal-600);
}

.fix-rate {
  font-weight: 700;
  color: var(--teal-600);
}

.group-head--defect {
  background: var(--red-bg);
  color: var(--red);
}

.vbar-chart {
  display: flex;
  justify-content: space-around;
  align-items: flex-end;
  gap: 24px;
  height: 180px;
  padding-top: 10px;
}

.vbar {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
  height: 100%;
  width: 64px;
}

.vbar__num {
  font-size: calc(11px + var(--font-size-offset, 0px));
  font-weight: 700;
  color: var(--teal-600);
}

.vbar__track {
  flex: 1;
  width: 32px;
  display: flex;
  align-items: flex-end;
  background: var(--line-2);
  border-radius: 4px;
  overflow: hidden;
}

.vbar__fill {
  display: block;
  width: 100%;
  background: var(--red);
  border-radius: 4px 4px 0 0;
}

.vbar__lab {
  font-size: calc(12px + var(--font-size-offset, 0px));
  font-weight: 600;
}

.vbar__sub {
  font-size: calc(10.5px + var(--font-size-offset, 0px));
  color: var(--muted);
}
</style>
