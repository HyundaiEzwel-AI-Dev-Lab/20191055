<script setup>
// PAG-S-UAT-16 진척관리
import { computed, onMounted, ref, watch } from 'vue'
import { useTestContext } from '@/composables/useTestContext'
import { getProgressData, donutStyle, gaugeStyle } from '@/data/testProgress'
import ExcelDownloadButton from '@/components/ui/ExcelDownloadButton.vue'
import { mockExcelDownload } from '@/utils/excelDownload'

const { mode, pageTitle } = useTestContext()

const data = ref(null)
const filters = ref({
  system: '전체',
  tester: '',
})
const applied = ref({ ...filters.value })

function loadData() {
  data.value = getProgressData(mode.value)
  search()
}

onMounted(loadData)
watch(mode, loadData)

const kpi = computed(() => data.value?.kpi)
const ps = computed(() => data.value?.progressStatus)

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

function search() {
  applied.value = { ...filters.value }
}

function resetFilters() {
  filters.value = { system: '전체', tester: '' }
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
    <h1 class="progress__title">{{ pageTitle }}</h1>
    <p class="progress__hint">테스트 진척·결함 처리 현황 · 1시간마다 갱신 (목업 {{ data.updatedAt }})</p>

    <section class="filter card">
      <div class="filter__row">
        <div class="filter__field">
          <label>시스템</label>
          <select v-model="filters.system" class="filter__inp">
            <option v-for="s in systemOptions" :key="s" :value="s">{{ s }}</option>
          </select>
        </div>
        <div class="filter__field">
          <label>테스터</label>
          <input
            v-model="filters.tester"
            class="filter__inp"
            type="text"
            placeholder="테스터명"
            @keyup.enter="search"
          />
        </div>
      </div>
      <div class="filter__actions">
        <button type="button" class="btn btn--ghost" @click="resetFilters">초기화</button>
        <button type="button" class="btn btn--primary" @click="search">조회</button>
        <ExcelDownloadButton @click="onExcelDownload" />
      </div>
    </section>

    <div class="kpi-grid">
      <div class="kpi-card card">
        <div class="kpi-card__head">
          <span class="kpi-card__ico">📋</span>
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
          <span class="kpi-card__ico">🐞</span>
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
          <span class="kpi-card__ico">⚠️</span>
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
        <div class="status-blocks">
          <div class="status-block">
            <span class="status-block__lab">전체</span>
            <span class="status-block__num">{{ ps.total }}</span>
          </div>
          <div class="status-block">
            <span class="status-block__lab">대기</span>
            <span class="status-block__num">{{ ps.wait }}</span>
          </div>
          <div class="status-block status-block--prog">
            <span class="status-block__lab">진행</span>
            <span class="status-block__num">{{ ps.progress }}</span>
          </div>
          <div class="status-block status-block--warn">
            <span class="status-block__lab">지연</span>
            <span class="status-block__num">{{ ps.delay }}</span>
          </div>
          <div class="status-block status-block--muted">
            <span class="status-block__lab">경미지연</span>
            <span class="status-block__num">{{ ps.delayMinor }}</span>
          </div>
        </div>
      </section>

      <section class="panel card">
        <h3>시스템별 진척·결함</h3>
        <div class="donut-row">
          <div
            v-for="row in filteredSystemProgress"
            :key="row.system"
            class="donut-item"
          >
            <div class="donut" :style="donutStyle(row.testRate)">
              <div class="donut__hole">
                <span class="donut__v">{{ row.testRate }}%</span>
                <span class="donut__l">진척</span>
              </div>
            </div>
            <div class="donut-meta">
              <b>{{ row.system }}</b>
              <span>완료 {{ row.testDone }} · 결함 {{ row.defect }} ({{ row.defectRate }}%)</span>
            </div>
          </div>
        </div>
      </section>
    </div>

    <section class="panel card">
      <h3>시스템별 상세</h3>
      <table class="inner-table">
        <thead>
          <tr>
            <th>시스템</th>
            <th>전체</th>
            <th>대기</th>
            <th>진행</th>
            <th>지연</th>
            <th>결함처리율</th>
            <th>결함</th>
            <th>미처리</th>
            <th>처리</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="row in filteredSystemDetail" :key="row.system">
            <td>{{ row.system }}</td>
            <td>{{ row.total }}</td>
            <td>{{ row.wait }}</td>
            <td>{{ row.progress }}</td>
            <td>{{ row.delay }}</td>
            <td>
              <div class="gauge-wrap">
                <div class="gauge" :style="gaugeStyle(row.fixRate)">
                  <div class="gauge__arc" />
                  <div class="gauge__hole"><b>{{ row.fixRate }}%</b></div>
                </div>
              </div>
            </td>
            <td>{{ row.defects }}</td>
            <td>{{ row.pending }}</td>
            <td>{{ row.done }}</td>
          </tr>
          <tr v-if="!filteredSystemDetail.length">
            <td colspan="9" class="empty-row">조회 결과가 없습니다.</td>
          </tr>
        </tbody>
      </table>
    </section>

    <div class="grid-2">
      <section class="panel card">
        <h3>테스터별 수행</h3>
        <table class="inner-table">
          <thead>
            <tr>
              <th>테스터</th>
              <th>배정</th>
              <th>완료</th>
              <th>진척률</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="row in filteredByTester" :key="row.name">
              <td>{{ row.name }}</td>
              <td>{{ row.assigned }}</td>
              <td>{{ row.done }}</td>
              <td>
                <div class="prog">
                  <i :style="{ width: `${row.rate}%` }" />
                  <span>{{ row.rate }}%</span>
                </div>
              </td>
            </tr>
            <tr v-if="!filteredByTester.length">
              <td colspan="4" class="empty-row">조회 결과가 없습니다.</td>
            </tr>
          </tbody>
        </table>
      </section>

      <section class="panel card">
        <h3>테스터별 결함 확인 (완료 기준: {{ data.confirmLabel }})</h3>
        <table class="inner-table">
          <thead>
            <tr>
              <th>테스터</th>
              <th>등록</th>
              <th>확인</th>
              <th>확인률</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="row in filteredDefectConfirm" :key="row.name">
              <td>{{ row.name }}</td>
              <td>{{ row.registered }}</td>
              <td>{{ row.confirmed }}</td>
              <td>{{ row.rate }}%</td>
            </tr>
            <tr v-if="!filteredDefectConfirm.length">
              <td colspan="4" class="empty-row">조회 결과가 없습니다.</td>
            </tr>
          </tbody>
        </table>
      </section>
    </div>

    <div v-if="data.unitCompare" class="grid-2">
      <section class="panel card">
        <h3>단위 vs DEV 비교</h3>
        <div class="compare-row">
          <div v-for="row in data.unitCompare" :key="row.label" class="compare-item">
            <div class="donut donut--lg" :style="donutStyle(row.rate)">
              <div class="donut__hole">
                <span class="donut__v">{{ row.rate }}%</span>
                <span class="donut__l">{{ row.label }}</span>
              </div>
            </div>
            <span class="compare-sub">{{ row.done }} / {{ row.total }}</span>
          </div>
        </div>
      </section>

      <section class="panel card">
        <h3>단계별 결함발생률</h3>
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
                <div class="prog">
                  <i :style="{ width: `${row.rate * 4}%`, maxWidth: '100%' }" />
                  <span>{{ row.rate }}%</span>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
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

    <section v-if="mode === 'uat' && data.defectByPhase" class="panel card">
      <h3>운영 단계별 결함발생률</h3>
      <div class="phase-bars">
        <div v-for="row in data.defectByPhase" :key="row.phase" class="phase-bar">
          <span class="phase-bar__lab">{{ row.phase }}</span>
          <div class="hbar hbar--err"><i :style="{ width: `${row.rate * 3}%` }" /></div>
          <span class="phase-bar__num">{{ row.count }}건 ({{ row.rate }}%)</span>
        </div>
      </div>
    </section>
  </div>
</template>

<style scoped>
.progress {
  --teal: #119a8a;
  --teal-600: #0e8275;
  --teal-700: #0a6b5f;
  --teal-400: #4fb8ab;
  --teal-50: #e6f4f2;
  --teal-100: #cfe9e5;
  --ink: #1f2a30;
  --ink-2: #48565e;
  --muted: #7c8a92;
  --line: #e3e8eb;
  --line-2: #eef1f3;
  --field: #f1f4f5;
  --blue: #2f6fed;
  --blue-bg: #e8f0ff;
  --green: #1f9d57;
  --green-bg: #e6f6ec;
  --red: #e0524a;
  --red-bg: #fdecea;
  --orange: #e08a2b;
  --orange-bg: #fcf0e1;
  --gray: #8a97a0;
  --gray-bg: #eef1f3;

  padding: 14px 18px 28px;
  color: var(--ink);
  font-size: 13px;
}

.progress__title {
  font-size: 18px;
  font-weight: 700;
  margin: 0 0 4px;
}

.progress__hint {
  font-size: 12px;
  color: var(--muted);
  margin: 0 0 14px;
}

.filter {
  padding: 12px 14px;
  margin-bottom: 14px;
}

.filter__row {
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
  margin-bottom: 10px;
}

.filter__field {
  display: flex;
  flex-direction: column;
  gap: 4px;
  min-width: 160px;
}

.filter__field label {
  font-size: 11px;
  font-weight: 600;
  color: var(--muted);
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
  gap: 8px;
  align-items: center;
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
  font-size: 24px;
}

.kpi-card__label {
  font-size: 12px;
  color: var(--muted);
}

.kpi-card__value {
  font-size: 24px;
  font-weight: 800;
  color: var(--teal-600);
}

.kpi-card__value small {
  font-size: 14px;
}

.kpi-card__value--green {
  color: #2e7d32;
}

.kpi-card__value--warn {
  color: #b8860b;
}

.kpi-card__sub {
  font-size: 11px;
  color: var(--muted);
  margin-top: 5px;
}

.hbar {
  height: 8px;
  background: #eef1f3;
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
  background: #4caf50;
}

.hbar--warn i {
  background: #ffb300;
}

.hbar--err i {
  background: #e57373;
}

.grid-2 {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 12px;
  margin-bottom: 12px;
}

.panel {
  padding: 14px 16px;
  margin-bottom: 12px;
}

.panel h3 {
  margin: 0 0 12px;
  font-size: 14px;
  font-weight: 700;
}

.status-blocks {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.status-block {
  flex: 1;
  min-width: 72px;
  padding: 10px;
  background: var(--field);
  border-radius: 8px;
  text-align: center;
}

.status-block__lab {
  display: block;
  font-size: 10px;
  color: var(--muted);
  font-weight: 600;
}

.status-block__num {
  font-size: 20px;
  font-weight: 700;
}

.status-block--prog .status-block__num {
  color: var(--teal-600);
}

.status-block--warn .status-block__num {
  color: #b8860b;
}

.status-block--muted .status-block__num {
  color: var(--muted);
}

.donut-row {
  display: flex;
  flex-wrap: wrap;
  gap: 16px;
}

.donut-item {
  display: flex;
  align-items: center;
  gap: 10px;
  min-width: 180px;
}

.donut {
  width: 72px;
  height: 72px;
  border-radius: 50%;
  position: relative;
  flex-shrink: 0;
}

.donut--lg {
  width: 100px;
  height: 100px;
}

.donut__hole {
  position: absolute;
  inset: 14px;
  background: #fff;
  border-radius: 50%;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
}

.donut--lg .donut__hole {
  inset: 18px;
}

.donut__v {
  font-size: 14px;
  font-weight: 800;
  color: var(--teal-700);
}

.donut__l {
  font-size: 9px;
  color: var(--muted);
}

.donut-meta {
  display: flex;
  flex-direction: column;
  gap: 2px;
  font-size: 11px;
}

.donut-meta b {
  font-size: 12px;
}

.inner-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 12px;
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
  color: var(--ink-2);
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

.gauge-wrap {
  display: flex;
  justify-content: center;
}

.gauge {
  width: 60px;
  height: 34px;
  position: relative;
  overflow: hidden;
}

.gauge__arc {
  width: 60px;
  height: 60px;
  border-radius: 50%;
  background: conic-gradient(from 270deg, var(--teal-500) 0 var(--p, 25%), #eef1f3 var(--p, 25%) 50%, transparent 50%);
}

.gauge__hole {
  position: absolute;
  left: 8px;
  right: 8px;
  bottom: 0;
  top: 8px;
  background: #fff;
  border-radius: 60px 60px 0 0;
  display: flex;
  align-items: flex-end;
  justify-content: center;
  padding-bottom: 2px;
}

.gauge__hole b {
  font-size: 11px;
}

.compare-row {
  display: flex;
  justify-content: space-around;
  gap: 16px;
}

.compare-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
}

.compare-sub {
  font-size: 11px;
  color: var(--muted);
}

.phase-bars {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.phase-bar {
  display: grid;
  grid-template-columns: 72px 1fr 100px;
  align-items: center;
  gap: 10px;
  font-size: 12px;
}

.phase-bar__lab {
  font-weight: 600;
}

.phase-bar__num {
  font-size: 11px;
  color: var(--muted);
  text-align: right;
}
</style>
