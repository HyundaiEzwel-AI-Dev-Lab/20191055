<script setup>
// PAG-S-DAS-01 프로젝트 대시보드
import { computed, onMounted, ref, watch } from 'vue'
import { useRouter } from 'vue-router'
import { useProjectStore } from '@/stores/project'
import {
  projectDashboardMeta,
  getProjectDashboard,
  formatPeriod,
  statusTone,
} from '@/data/projectDashboard'
import ExcelDownloadButton from '@/components/ui/ExcelDownloadButton.vue'
import { mockExcelDownload } from '@/utils/excelDownload'

const router = useRouter()
const projectStore = useProjectStore()

const data = ref(null)

function loadData() {
  const project = projectStore.currentProject
  data.value = getProjectDashboard(project?.id, project?.name)
}

onMounted(loadData)
watch(() => projectStore.currentProject?.id, loadData)

const gaugePlan = computed(() => `${(data.value?.totalProgress.planRate / 2).toFixed(1)}%`)

function complianceLabel(status) {
  return projectDashboardMeta.legend.find((l) => l.key === status)?.label || status
}

function goWbs() {
  router.push({ name: 'wbs' })
}

function onExcelDownload() {
  mockExcelDownload(
    '프로젝트 대시보드',
    (data.value?.details || []).map((row) => ({
      ...row,
      planPeriod: `${row.planStart || '-'} ~ ${row.planEnd || '-'}`,
      execPeriod: `${row.execStart || '-'} ~ ${row.execEnd || '진행중'}`,
    })),
    [
      { key: 'taskType', label: '업무유형' },
      { key: 'assignee', label: '담당자' },
      { key: 'planPeriod', label: '계획일정' },
      { key: 'execPeriod', label: '실행일정' },
      { key: 'execRate', label: '실행 공정률(%)' },
      { key: 'planDiff', label: '계획대비' },
      { key: 'compliance', label: '계획준수' },
    ],
  )
}
</script>

<template>
  <div v-if="data" class="proj-dash">
    <h1 class="proj-dash__title">
      프로젝트 현황
      <span class="proj-dash__hint">(기준일 : {{ data.updatedAt }})</span>
    </h1>
    <p class="proj-dash__sub">
      {{ data.projectName }} · {{ projectDashboardMeta.refreshInterval }}마다 자동 갱신 (목업)
    </p>

    <div class="top-grid">
      <section class="card pad schedule-panel">
        <h3 class="sec-title">일정 현황</h3>
        <div class="schedule-cards">
          <article
            v-for="card in data.scheduleCards"
            :key="card.id"
            class="schedule-card"
            :class="`schedule-card--${card.tone}`"
          >
            <header class="schedule-card__head">
              <span class="schedule-card__label">{{ card.label }}</span>
              <span class="schedule-card__diff">{{ card.diffLabel }}</span>
            </header>
            <div class="schedule-card__row">
              <span class="schedule-card__key">계획 기간</span>
              <span>{{ formatPeriod(card.planPeriod.start, card.planPeriod.end) }}</span>
            </div>
            <div class="schedule-card__row">
              <span class="schedule-card__key">실행 기간</span>
              <span>{{
                formatPeriod(card.execPeriod.start, card.execPeriod.end, card.execPeriod.inProgress)
              }}</span>
            </div>
          </article>
        </div>
      </section>

      <section class="card pad progress-panel">
        <h3 class="sec-title">총 공정률 (자동계산)</h3>
        <div class="progress-main">
          <div class="progress-big">
            <span class="progress-big__lab">실행 기준</span>
            <span class="progress-big__num">{{ data.totalProgress.execRate }}<small>%</small></span>
          </div>
          <div class="progress-sub">
            <div class="progress-sub__item">
              <span class="progress-sub__lab">계획기준</span>
              <div class="gauge gauge--sm" :style="{ '--p': gaugePlan }">
                <div class="gauge__arc" />
                <div class="gauge__hole"><b>{{ data.totalProgress.planRate }}%</b></div>
              </div>
            </div>
            <div class="progress-sub__item">
              <span class="progress-sub__lab">계획 대비</span>
              <span class="progress-diff">{{ data.totalProgress.diffLabel }}</span>
            </div>
          </div>
        </div>
        <div class="period-row">
          <span>계획 {{ formatPeriod(data.totalProgress.planPeriod.start, data.totalProgress.planPeriod.end) }}</span>
          <span>실행 {{ formatPeriod(data.totalProgress.execPeriod.start, data.totalProgress.execPeriod.end) }}</span>
        </div>
      </section>

      <section class="card pad summary-panel">
        <h3 class="sec-title">지연/단축 정보</h3>
        <div class="summary-chips">
          <div class="summary-chip summary-chip--delay">
            <span class="summary-chip__lab">경과(예상)</span>
            <span class="summary-chip__num">{{ data.delaySummary.expectedDelay }}<small>건</small></span>
          </div>
          <div class="summary-chip summary-chip--normal">
            <span class="summary-chip__lab">정상</span>
            <span class="summary-chip__num">{{ data.delaySummary.normal }}<small>건</small></span>
          </div>
          <div class="summary-chip summary-chip--shorten">
            <span class="summary-chip__lab">단축(예상)</span>
            <span class="summary-chip__num">{{ data.delaySummary.expectedShorten }}<small>건</small></span>
          </div>
        </div>
        <p class="note">{{ projectDashboardMeta.scheduleNote }}</p>
      </section>
    </div>

    <section class="card pad">
      <h3 class="sec-title">업무별 공정률 요약</h3>
      <div class="type-grid">
        <article
          v-for="item in data.typeSummary"
          :key="item.type"
          class="type-card"
          :class="`type-card--${statusTone(item.status)}`"
        >
          <span class="type-card__name">{{ item.type }}</span>
          <span class="type-card__rate">{{ item.rate != null ? `${item.rate}%` : '- %' }}</span>
          <div v-if="item.rate != null" class="type-card__bar">
            <i :style="{ width: `${item.rate}%` }" />
          </div>
          <span class="type-card__status">{{ item.statusLabel }}</span>
        </article>
      </div>
    </section>

    <section class="card listcard">
      <div class="listcard__head">
        <h3 class="sec-title">업무별 상세 현황</h3>
        <div class="listcard__head-actions">
          <button type="button" class="link-btn" @click="goWbs">WBS 관리 →</button>
          <ExcelDownloadButton @click="onExcelDownload" />
        </div>
      </div>
      <div class="listcard__scroll">
        <table class="tbl">
          <thead>
            <tr>
              <th>업무유형</th>
              <th>담당자</th>
              <th>계획일정</th>
              <th>실행일정</th>
              <th>실행 공정률</th>
              <th>계획대비</th>
              <th>계획준수</th>
            </tr>
          </thead>
          <tbody>
            <tr
              v-for="row in data.details"
              :key="row.id"
              class="tbl__row"
              @click="goWbs"
            >
              <td>
                <span class="status-dot" :class="`status-dot--${statusTone(row.status)}`" />
                {{ row.taskType }}
              </td>
              <td>{{ row.assignee }}</td>
              <td>{{ formatPeriod(row.planStart, row.planEnd) }}</td>
              <td>{{ formatPeriod(row.execStart, row.execEnd, !row.execEnd) }}</td>
              <td><b>{{ row.execRate }}%</b></td>
              <td :class="{ 'text-delay': row.planDiff.startsWith('+'), 'text-shorten': row.planDiff.startsWith('-') }">
                {{ row.planDiff }}
              </td>
              <td>
                <span class="compliance" :class="`compliance--${row.compliance}`">{{ complianceLabel(row.status) }}</span>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </section>

    <footer class="legend card pad">
      <span v-for="item in projectDashboardMeta.legend" :key="item.key" class="legend__item">
        <span class="status-dot" :class="`status-dot--${statusTone(item.key)}`" />
        {{ item.label }}
      </span>
      <span class="legend__note">* 총 공정률을 계획/실행 기준으로 자동 산정 · 진행/완료 업무별 단축/지연 여부 기준</span>
    </footer>
  </div>
</template>

<style scoped>
.proj-dash {
  padding: 14px 18px 28px;
  color: var(--ink);
  font-size: 13px;
}

.proj-dash__title {
  font-size: 18px;
  font-weight: 700;
  margin: 0 0 4px;
  display: flex;
  align-items: baseline;
  gap: 8px;
}

.proj-dash__hint {
  font-size: 12px;
  font-weight: 500;
  color: var(--muted);
}

.proj-dash__sub {
  font-size: 12px;
  color: var(--ink-2);
  margin: 0 0 14px;
}

.sec-title {
  margin: 0 0 12px;
  font-size: 14px;
  font-weight: 700;
}

.top-grid {
  display: grid;
  grid-template-columns: 1.2fr 1fr 0.8fr;
  gap: 12px;
  margin-bottom: 12px;
}

.pad {
  padding: 14px 16px;
}

.schedule-cards {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.schedule-card {
  padding: 10px 12px;
  border-radius: 8px;
  border: 1px solid var(--line);
  font-size: 11px;
}

.schedule-card--normal {
  background: #f8fafb;
}

.schedule-card--shorten {
  background: #e8f5ee;
  border-color: #b8dfc8;
}

.schedule-card--delay {
  background: #fef3f2;
  border-color: #f5c6c2;
}

.schedule-card__head {
  display: flex;
  justify-content: space-between;
  margin-bottom: 6px;
  font-weight: 700;
}

.schedule-card__label {
  font-size: 12px;
}

.schedule-card__diff {
  font-size: 11px;
  color: var(--teal-700);
}

.schedule-card--delay .schedule-card__diff {
  color: #c0392b;
}

.schedule-card__row {
  display: flex;
  gap: 8px;
  margin-top: 2px;
  color: var(--ink-2);
}

.schedule-card__key {
  min-width: 56px;
  color: var(--muted);
}

.progress-main {
  display: flex;
  align-items: center;
  gap: 20px;
  margin-bottom: 10px;
}

.progress-big {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.progress-big__lab {
  font-size: 11px;
  color: var(--muted);
  font-weight: 600;
}

.progress-big__num {
  font-size: 36px;
  font-weight: 800;
  color: var(--teal-600);
  line-height: 1;
}

.progress-big__num small {
  font-size: 18px;
}

.progress-sub {
  display: flex;
  gap: 16px;
}

.progress-sub__item {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
}

.progress-sub__lab {
  font-size: 10px;
  color: var(--muted);
}

.progress-diff {
  font-size: 14px;
  font-weight: 700;
  color: var(--teal-700);
}

.period-row {
  display: flex;
  flex-direction: column;
  gap: 4px;
  font-size: 11px;
  color: var(--muted);
}

.gauge {
  width: 72px;
  height: 40px;
  position: relative;
  overflow: hidden;
}

.gauge__arc {
  width: 72px;
  height: 72px;
  border-radius: 50%;
  background: conic-gradient(from 270deg, var(--teal-500) 0 var(--p, 30%), #eef1f3 var(--p, 30%) 50%, transparent 50%);
}

.gauge__hole {
  position: absolute;
  left: 10px;
  right: 10px;
  bottom: 0;
  top: 10px;
  background: #fff;
  border-radius: 72px 72px 0 0;
  display: flex;
  align-items: flex-end;
  justify-content: center;
  padding-bottom: 2px;
}

.gauge__hole b {
  font-size: 12px;
}

.summary-chips {
  display: flex;
  flex-direction: column;
  gap: 8px;
  margin-bottom: 10px;
}

.summary-chip {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 10px 12px;
  border-radius: 8px;
  background: var(--field);
}

.summary-chip__lab {
  font-size: 12px;
  font-weight: 600;
}

.summary-chip__num {
  font-size: 22px;
  font-weight: 800;
}

.summary-chip__num small {
  font-size: 12px;
  font-weight: 600;
}

.summary-chip--delay .summary-chip__num {
  color: #c0392b;
}

.summary-chip--normal .summary-chip__num {
  color: var(--teal-600);
}

.summary-chip--shorten .summary-chip__num {
  color: #1a7f4b;
}

.note {
  margin: 0;
  font-size: 10px;
  color: var(--muted);
  line-height: 1.4;
}

.type-grid {
  display: grid;
  grid-template-columns: repeat(6, 1fr);
  gap: 10px;
}

.type-card {
  padding: 12px 10px;
  border-radius: 10px;
  border: 1px solid var(--line);
  text-align: center;
  display: flex;
  flex-direction: column;
  gap: 6px;
  min-height: 100px;
}

.type-card__name {
  font-size: 11px;
  font-weight: 700;
  color: var(--ink-2);
}

.type-card__rate {
  font-size: 20px;
  font-weight: 800;
  color: var(--teal-600);
}

.type-card--wait .type-card__rate {
  color: var(--muted);
}

.type-card__bar {
  height: 6px;
  background: #eef1f3;
  border-radius: 3px;
  overflow: hidden;
}

.type-card__bar i {
  display: block;
  height: 100%;
  background: var(--teal-500);
  border-radius: 3px;
}

.type-card__status {
  font-size: 10px;
  color: var(--muted);
}

.type-card--delay {
  border-color: #f5c6c2;
  background: #fffafa;
}

.type-card--shorten {
  border-color: #b8dfc8;
  background: #f6fcf8;
}

.listcard {
  margin-top: 12px;
  overflow: hidden;
}

.listcard__head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  padding: 14px 16px 0;
}

.listcard__head-actions {
  display: flex;
  align-items: center;
  gap: 8px;
}

.listcard__scroll {
  overflow-x: auto;
  padding: 0 0 4px;
}

.tbl {
  width: 100%;
  border-collapse: collapse;
  font-size: 12px;
}

.tbl thead th {
  background: var(--field);
  font-weight: 600;
  text-align: left;
  padding: 9px 12px;
  border-bottom: 1px solid var(--line);
  white-space: nowrap;
}

.tbl tbody td {
  padding: 10px 12px;
  border-bottom: 1px solid var(--line);
  vertical-align: middle;
}

.tbl__row {
  cursor: pointer;
}

.tbl__row:hover {
  background: var(--teal-50);
}

.status-dot {
  display: inline-block;
  width: 8px;
  height: 8px;
  border-radius: 50%;
  margin-right: 6px;
  background: var(--muted);
}

.status-dot--normal {
  background: var(--teal-500);
}

.status-dot--delay {
  background: #e74c3c;
}

.status-dot--shorten {
  background: #27ae60;
}

.status-dot--wait {
  background: #bdc3c7;
}

.text-delay {
  color: #c0392b;
  font-weight: 600;
}

.text-shorten {
  color: #1a7f4b;
  font-weight: 600;
}

.compliance {
  font-size: 11px;
  padding: 2px 8px;
  border-radius: 999px;
  font-weight: 600;
}

.compliance--정상 {
  background: #eef2f6;
  color: #5a6a7a;
}

.compliance--경과 {
  background: #fdecea;
  color: #c0392b;
}

.compliance--단축 {
  background: #e8f5ee;
  color: #1a7f4b;
}

.link-btn {
  border: none;
  background: none;
  color: var(--teal-600);
  font-size: 12px;
  cursor: pointer;
  font-family: inherit;
}

.legend {
  margin-top: 12px;
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 12px;
  font-size: 11px;
  color: var(--ink-2);
}

.legend__item {
  display: inline-flex;
  align-items: center;
}

.legend__note {
  margin-left: auto;
  font-size: 10px;
  color: var(--muted);
}

@media (max-width: 1100px) {
  .top-grid {
    grid-template-columns: 1fr;
  }

  .type-grid {
    grid-template-columns: repeat(3, 1fr);
  }
}
</style>
