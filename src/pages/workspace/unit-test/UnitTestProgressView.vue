<script setup>
// PAG-S-UAT-16 진척관리 (단위테스트 전용, A11)
// h-pms가 2026-09-01 이 화면을 ProgressPage.vue(DEV/UAT/STG 공용, pageMode==='unit')에 합쳤다.
// 목업은 두 화면 분리를 유지하고, 단위테스트에 해당하는 마크업·동작만 이 파일에 반영한다.
// 단위테스트는 케이스 결과(대기/정상/오류/테스트불가/개선필요)만 있고 DEV/운영처럼 절차
// 상태(대기/진행/지연)나 요청자 개념이 없다 — 그 상태를 요구하는 UI는 대기/완료 2분류로
// 좁히거나(테스트 진행 현황), 대응 데이터가 없는 섹션(요청자 수행 현황)은 생략한다.
import { computed, onMounted, ref, watchEffect } from 'vue'
import { useRouter } from 'vue-router'
import { getUnitTestProgressData, getUnitTestList } from '@/entities/unit-test/mock/unitTest'
import ExcelDownloadButton from '@/shared/ui/ExcelDownloadButton.vue'
import HpDonutChart from '@/shared/ui/HpDonutChart.vue'
import BaseModal from '@/shared/ui/BaseModal.vue'
import { mockExcelDownload } from '@/shared/file-excel/excelDownload'
import { useAuthStore } from '@/app/stores/auth'

const router = useRouter()
const authStore = useAuthStore()
const data = ref(null)
const rows = ref([])

function loadData() {
  data.value = getUnitTestProgressData(authStore.user?.id)
  rows.value = getUnitTestList(authStore.user?.id)
}

onMounted(loadData)

const kpi = computed(() => {
  const k = data.value?.kpi
  if (!k) return null
  const pendingDefects = k.defectTotal - k.defectFixed
  return {
    ...k,
    pendingDefects,
    pendingTotal: k.defectTotal,
    pendingDefectRate: k.defectTotal ? Math.round((pendingDefects / k.defectTotal) * 100) : 0,
  }
})

/** 진행률 도넛 = 완료 + 잔여. h-pms 이관 — CSS conic-gradient 대신 공용 HpDonutChart(SVG). */
const progressSegments = computed(() => {
  const done = Math.min(100, Math.max(0, kpi.value?.progressRate ?? 0))
  return [
    { value: done, color: 'var(--teal-500)' },
    { value: 100 - done, color: 'var(--line-2)' },
  ]
})

/**
 * 시스템별 상세 진척 현황 — mock의 getUnitTestProgressData는 시스템당 결함 "총건수"만 주므로,
 * 결함처리 그룹(미조치/조치완료)은 케이스 원본(rows)에서 직접 집계한다. 조치완료 기준은
 * DEV/UAT confirmLabel과 같은 규칙(status === '처리완료')이다.
 */
const systemDetail = computed(() => {
  const map = new Map()
  rows.value.forEach((r) => {
    if (!map.has(r.system)) {
      map.set(r.system, { system: r.system, total: 0, done: 0, defects: 0, defectsDone: 0 })
    }
    const e = map.get(r.system)
    e.total += 1
    if (r.testResult && r.testResult !== '대기') e.done += 1
    e.defects += r.defects.length
    e.defectsDone += r.defects.filter((d) => d.status === '처리완료').length
  })
  return [...map.values()].map((e) => ({
    ...e,
    wait: e.total - e.done,
    progressRate: e.total ? Math.round((e.done / e.total) * 100) : 0,
    defectRate: e.total ? Math.round((e.defects / e.total) * 100) : 0,
    pending: e.defects - e.defectsDone,
    fixRate: e.defects ? Math.round((e.defectsDone / e.defects) * 100) : 0,
  }))
})

const systemDetailTotals = computed(() => {
  const list = systemDetail.value
  const sum = (key) => list.reduce((acc, r) => acc + (r[key] || 0), 0)
  const total = sum('total')
  const defects = sum('defects')
  return {
    total,
    wait: sum('wait'),
    done: sum('done'),
    progressRate: total ? Math.round((sum('done') / total) * 100) : 0,
    defects,
    pending: sum('pending'),
    defectsDone: sum('defectsDone'),
    fixRate: defects ? Math.round((sum('defectsDone') / defects) * 100) : 0,
  }
})

/**
 * 테스터별 테스트 및 결함확인 현황 — h-pms 이관(2026-09-01)으로 "담당자별 수행현황" 표에
 * 결함조치 확인 그룹을 합친다. 등록/확인 역시 케이스 원본에서 집계한다(담당자별 defects는
 * mock 집계 함수가 안 주는 값).
 */
const byTester = computed(() => {
  const map = new Map()
  rows.value.forEach((r) => {
    if (!map.has(r.assignee)) {
      map.set(r.assignee, { name: r.assignee, assigned: 0, done: 0, registered: 0, confirmed: 0 })
    }
    const e = map.get(r.assignee)
    e.assigned += 1
    if (r.testResult && r.testResult !== '대기') e.done += 1
    e.registered += r.defects.length
    e.confirmed += r.defects.filter((d) => d.status === '처리완료').length
  })
  return [...map.values()].map((e) => ({
    ...e,
    wait: e.assigned - e.done,
    rate: e.assigned ? Math.round((e.done / e.assigned) * 100) : 0,
    unconfirmed: e.registered - e.confirmed,
    confirmRate: e.registered ? Math.round((e.confirmed / e.registered) * 100) : 0,
  }))
})

const byTesterTotals = computed(() => {
  const list = byTester.value
  const sum = (key) => list.reduce((acc, r) => acc + (r[key] || 0), 0)
  const assigned = sum('assigned')
  const registered = sum('registered')
  return {
    assigned,
    wait: sum('wait'),
    done: sum('done'),
    rate: assigned ? Math.round((sum('done') / assigned) * 100) : 0,
    registered,
    confirmed: sum('confirmed'),
    unconfirmed: sum('unconfirmed'),
    confirmRate: registered ? Math.round((sum('confirmed') / registered) * 100) : 0,
  }
})

/**
 * SB 3a 이관 — 기본노출 높이(scrollHeight)가 이 값을 넘으면 "더보기" 버튼을 켠다.
 * .overflow-gate의 인라인 max-height와 같은 값이어야 한다.
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

const fullViewTarget = ref(null)
function openFullView(target) {
  fullViewTarget.value = target
}
function closeFullView() {
  fullViewTarget.value = null
}

/*
 * 단위테스트는 "테스트 수행"·"결함관리"가 따로 없다(케이스+결과+결함이 UnitTestView.vue 한
 * 화면에 다 있다). 그 화면은 아직 system/assignee 쿼리를 읽지 않으므로(필터 모델에 system은
 * 있지만 담당자 필터가 없다) 지금은 전건 목록이 열린다 — h-pms도 대상 화면이 계약을 갖추기
 * 전엔 같은 상태였다.
 */
function goToCase(system, status) {
  router.push({ path: '/workspace/unit-test', query: { system: system || undefined, status: status || undefined } })
}

function goToCaseByAssignee(name) {
  router.push({ path: '/workspace/unit-test', query: { assignee: name || undefined } })
}

function onExcelDownload() {
  mockExcelDownload('단위테스트_진척관리_시스템별', systemDetail.value, [
    { key: 'system', label: '시스템' },
    { key: 'total', label: '총건수' },
    { key: 'done', label: '완료' },
    { key: 'progressRate', label: '진행률(%)' },
    { key: 'defects', label: '결함건수' },
    { key: 'fixRate', label: '결함처리율(%)' },
  ])
}
</script>

<template>
  <div v-if="data && kpi" class="progress-page">
    <div class="progress-page__head">
      <h1 class="progress-page__title">진척 관리 (단위테스트)</h1>
      <ExcelDownloadButton @click="onExcelDownload" />
    </div>
    <p class="progress-page__hint">테스트 진척·결함 처리 현황 · 1시간마다 갱신 (목업 {{ data.updatedAt }})</p>

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
        <div class="kpi-card__sub">{{ kpi.done }} / {{ kpi.total }}</div>
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
        <!-- 단위테스트는 케이스 상태가 대기/완료 둘뿐이다 — DEV/운영의 대기/진행/지연 3단
             상태는 이 데이터모델에 없어 2행으로 좁힌다. -->
        <div class="status-row">
          <HpDonutChart :segments="progressSegments" :size="150" :thickness="19" :gap="0" rounded :aria-label="`진행률 ${kpi.progressRate}%`">
            <span class="donut__l">진행률</span>
            <span class="donut__v">{{ kpi.progressRate }}%</span>
          </HpDonutChart>
          <button type="button" class="total-box" @click="goToCase()">
            <span>전체</span><b>{{ kpi.total }}</b>
          </button>
          <div class="stage-list">
            <button type="button" class="stage-row" @click="goToCase(null, '대기')">
              <span><i class="dot dot--wait" />대기</span><b>{{ kpi.total - kpi.done }}</b>
            </button>
            <button type="button" class="stage-row" @click="goToCase()">
              <span><i class="dot dot--run" />완료</span><b>{{ kpi.done }}</b>
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
        <p v-if="!systemDetail.length" class="empty-row">조회 결과가 없습니다.</p>
        <div v-else class="overflow-gate" :style="{ maxHeight: `${OVERFLOW_MAX_HEIGHT.systemProgress}px` }" :ref="(v) => (systemProgressGate.el.value = v)">
          <div class="hbar-row">
            <button v-for="row in systemDetail" :key="row.system" type="button" class="hbar-item" @click="goToCase(row.system)">
              <span class="hbar-item__lab">{{ row.system }}</span>
              <div class="hbar-item__track">
                <span class="hbar-item__done" :style="{ width: `${row.progressRate}%` }" />
                <span class="hbar-item__defect" :style="{ width: `${row.defectRate}%` }" />
              </div>
              <span class="hbar-item__val">완료 {{ row.progressRate }}% · 결함 {{ row.defects }}건({{ row.defectRate }}%)</span>
            </button>
          </div>
        </div>
      </section>
    </div>

    <section class="panel card">
      <div class="panel__head">
        <h3>시스템별 상세 테스트 진척 현황</h3>
        <button v-if="systemDetailGate.overflow.value" type="button" class="more-btn" @click="openFullView('systemDetail')">
          더보기
        </button>
      </div>
      <div class="overflow-gate" :style="{ maxHeight: `${OVERFLOW_MAX_HEIGHT.systemDetail}px` }" :ref="(v) => (systemDetailGate.el.value = v)">
      <div class="inner-table__scroll">
      <table class="inner-table">
        <thead>
          <tr>
            <th rowspan="2">시스템</th>
            <th colspan="4" class="group-head">테스트진행</th>
            <th colspan="4" class="group-head group-head--defect">결함처리</th>
          </tr>
          <tr>
            <th>공정률</th>
            <th>총건수</th>
            <th>대기</th>
            <th>완료</th>
            <th>처리율</th>
            <th>총 결함</th>
            <th>미조치</th>
            <th>조치완료</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="row in systemDetail" :key="row.system">
            <td>{{ row.system }}</td>
            <td class="progress-rate">{{ row.progressRate }}%</td>
            <td><button type="button" class="count-link" @click="goToCase(row.system)">{{ row.total }}</button></td>
            <td><button type="button" class="count-link" @click="goToCase(row.system, '대기')">{{ row.wait }}</button></td>
            <td>{{ row.done }}</td>
            <td class="fix-rate">{{ row.fixRate }}%</td>
            <td><button type="button" class="count-link" @click="goToCase(row.system)">{{ row.defects }}</button></td>
            <td><button type="button" class="count-link" @click="goToCase(row.system)">{{ row.pending }}</button></td>
            <td>{{ row.defectsDone }}</td>
          </tr>
          <tr v-if="!systemDetail.length">
            <td colspan="9" class="empty-row">조회 결과가 없습니다.</td>
          </tr>
          <tr v-if="systemDetail.length" class="total-row">
            <td>전체 합계</td>
            <td>{{ systemDetailTotals.progressRate }}%</td>
            <td>{{ systemDetailTotals.total }}</td>
            <td>{{ systemDetailTotals.wait }}</td>
            <td>{{ systemDetailTotals.done }}</td>
            <td>{{ systemDetailTotals.fixRate }}%</td>
            <td>{{ systemDetailTotals.defects }}</td>
            <td>{{ systemDetailTotals.pending }}</td>
            <td>{{ systemDetailTotals.defectsDone }}</td>
          </tr>
        </tbody>
      </table>
      </div>
      </div>
    </section>

    <section class="panel card">
      <div class="panel__head">
        <h3>담당자별 테스트 및 결함확인 현황</h3>
        <button v-if="testerGate.overflow.value" type="button" class="more-btn" @click="openFullView('tester')">
          더보기
        </button>
      </div>
      <div class="overflow-gate" :style="{ maxHeight: `${OVERFLOW_MAX_HEIGHT.tester}px` }" :ref="(v) => (testerGate.el.value = v)">
      <div class="inner-table__scroll">
      <table class="inner-table">
        <thead>
          <tr>
            <th rowspan="2">담당자</th>
            <th colspan="3" class="group-head">테스트 수행</th>
            <th colspan="4" class="group-head group-head--defect">결함조치 확인</th>
          </tr>
          <tr>
            <th>배정</th>
            <th>완료</th>
            <th>진행률</th>
            <th>등록</th>
            <th>확인</th>
            <th>미확인</th>
            <th>확인률</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="row in byTester" :key="row.name">
            <td><button type="button" class="count-link" @click="goToCaseByAssignee(row.name)">{{ row.name }}</button></td>
            <td>{{ row.assigned }}</td>
            <td>{{ row.done }}</td>
            <td>
              <div class="prog">
                <i :style="{ width: `${row.rate}%` }" />
                <span>{{ row.rate }}%</span>
              </div>
            </td>
            <td>{{ row.registered }}</td>
            <td>{{ row.confirmed }}</td>
            <td>{{ row.unconfirmed }}</td>
            <td>{{ row.confirmRate }}%</td>
          </tr>
          <tr v-if="!byTester.length">
            <td colspan="8" class="empty-row">조회 결과가 없습니다.</td>
          </tr>
          <tr v-if="byTester.length" class="total-row">
            <td>전체 합계</td>
            <td>{{ byTesterTotals.assigned }}</td>
            <td>{{ byTesterTotals.done }}</td>
            <td>{{ byTesterTotals.rate }}%</td>
            <td>{{ byTesterTotals.registered }}</td>
            <td>{{ byTesterTotals.confirmed }}</td>
            <td>{{ byTesterTotals.unconfirmed }}</td>
            <td>{{ byTesterTotals.confirmRate }}%</td>
          </tr>
        </tbody>
      </table>
      </div>
      </div>
    </section>

    <BaseModal :visible="fullViewTarget === 'systemProgress'" title="시스템별 테스트 진행 및 결함 발생 현황" wide @close="closeFullView">
      <div class="hbar-row">
        <button v-for="row in systemDetail" :key="row.system" type="button" class="hbar-item" @click="closeFullView(); goToCase(row.system)">
          <span class="hbar-item__lab">{{ row.system }}</span>
          <div class="hbar-item__track">
            <span class="hbar-item__done" :style="{ width: `${row.progressRate}%` }" />
            <span class="hbar-item__defect" :style="{ width: `${row.defectRate}%` }" />
          </div>
          <span class="hbar-item__val">완료 {{ row.progressRate }}% · 결함 {{ row.defects }}건({{ row.defectRate }}%)</span>
        </button>
      </div>
    </BaseModal>

    <BaseModal :visible="fullViewTarget === 'systemDetail'" title="시스템별 상세 테스트 진척 현황" xwide @close="closeFullView">
      <div class="inner-table__scroll">
      <table class="inner-table">
        <thead>
          <tr>
            <th rowspan="2">시스템</th>
            <th colspan="4" class="group-head">테스트진행</th>
            <th colspan="4" class="group-head group-head--defect">결함처리</th>
          </tr>
          <tr>
            <th>공정률</th>
            <th>총건수</th>
            <th>대기</th>
            <th>완료</th>
            <th>처리율</th>
            <th>총 결함</th>
            <th>미조치</th>
            <th>조치완료</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="row in systemDetail" :key="row.system + '-full'">
            <td>{{ row.system }}</td>
            <td class="progress-rate">{{ row.progressRate }}%</td>
            <td><button type="button" class="count-link" @click="closeFullView(); goToCase(row.system)">{{ row.total }}</button></td>
            <td><button type="button" class="count-link" @click="closeFullView(); goToCase(row.system, '대기')">{{ row.wait }}</button></td>
            <td>{{ row.done }}</td>
            <td class="fix-rate">{{ row.fixRate }}%</td>
            <td><button type="button" class="count-link" @click="closeFullView(); goToCase(row.system)">{{ row.defects }}</button></td>
            <td><button type="button" class="count-link" @click="closeFullView(); goToCase(row.system)">{{ row.pending }}</button></td>
            <td>{{ row.defectsDone }}</td>
          </tr>
          <tr v-if="!systemDetail.length">
            <td colspan="9" class="empty-row">조회 결과가 없습니다.</td>
          </tr>
          <tr v-if="systemDetail.length" class="total-row">
            <td>전체 합계</td>
            <td>{{ systemDetailTotals.progressRate }}%</td>
            <td>{{ systemDetailTotals.total }}</td>
            <td>{{ systemDetailTotals.wait }}</td>
            <td>{{ systemDetailTotals.done }}</td>
            <td>{{ systemDetailTotals.fixRate }}%</td>
            <td>{{ systemDetailTotals.defects }}</td>
            <td>{{ systemDetailTotals.pending }}</td>
            <td>{{ systemDetailTotals.defectsDone }}</td>
          </tr>
        </tbody>
      </table>
      </div>
    </BaseModal>

    <BaseModal :visible="fullViewTarget === 'tester'" title="담당자별 테스트 및 결함확인 현황" xwide @close="closeFullView">
      <div class="inner-table__scroll">
      <table class="inner-table">
        <thead>
          <tr>
            <th rowspan="2">담당자</th>
            <th colspan="3" class="group-head">테스트 수행</th>
            <th colspan="4" class="group-head group-head--defect">결함조치 확인</th>
          </tr>
          <tr>
            <th>배정</th>
            <th>완료</th>
            <th>진행률</th>
            <th>등록</th>
            <th>확인</th>
            <th>미확인</th>
            <th>확인률</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="row in byTester" :key="row.name + '-full'">
            <td><button type="button" class="count-link" @click="closeFullView(); goToCaseByAssignee(row.name)">{{ row.name }}</button></td>
            <td>{{ row.assigned }}</td>
            <td>{{ row.done }}</td>
            <td>
              <div class="prog">
                <i :style="{ width: `${row.rate}%` }" />
                <span>{{ row.rate }}%</span>
              </div>
            </td>
            <td>{{ row.registered }}</td>
            <td>{{ row.confirmed }}</td>
            <td>{{ row.unconfirmed }}</td>
            <td>{{ row.confirmRate }}%</td>
          </tr>
          <tr v-if="!byTester.length">
            <td colspan="8" class="empty-row">조회 결과가 없습니다.</td>
          </tr>
          <tr v-if="byTester.length" class="total-row">
            <td>전체 합계</td>
            <td>{{ byTesterTotals.assigned }}</td>
            <td>{{ byTesterTotals.done }}</td>
            <td>{{ byTesterTotals.rate }}%</td>
            <td>{{ byTesterTotals.registered }}</td>
            <td>{{ byTesterTotals.confirmed }}</td>
            <td>{{ byTesterTotals.unconfirmed }}</td>
            <td>{{ byTesterTotals.confirmRate }}%</td>
          </tr>
        </tbody>
      </table>
      </div>
    </BaseModal>
  </div>
</template>

<style scoped>
.progress-page {
  padding: 14px 18px 28px;
  color: var(--ink);
  font-size: calc(13px + var(--font-size-offset, 0px));
}

.progress-page__head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  margin: 0 0 4px;
}

.progress-page__title {
  margin: 0;
  font-size: calc(18px + var(--font-size-offset, 0px));
  font-weight: 700;
}

.progress-page__hint {
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

.grid-2 > .panel {
  min-width: 0;
}

.inner-table__scroll {
  overflow-x: auto;
}

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

.group-head--defect {
  background: var(--red-bg);
  color: var(--red);
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

.progress-rate {
  font-weight: 700;
  color: var(--teal-600);
}

.fix-rate {
  font-weight: 700;
  color: var(--teal-600);
}
</style>
