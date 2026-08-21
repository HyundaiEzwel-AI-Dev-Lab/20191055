<script setup>
// PAG-S-DAS-01 프로젝트 대시보드
import { onMounted, ref, watch } from 'vue'
import { useRouter } from 'vue-router'
import { useProjectStore } from '@/app/stores/project'
import { useAuthStore } from '@/app/stores/auth'
import {
  projectDashboardMeta,
  getProjectDashboard,
  formatPeriod,
  statusTone,
} from '@/entities/dashboard/mock/projectDashboard'
import { routeForTaskType } from '@/entities/inbox/mock/inbox'

const router = useRouter()
const projectStore = useProjectStore()
const authStore = useAuthStore()

const data = ref(null)

function loadData() {
  const project = projectStore.currentProject
  data.value = getProjectDashboard(project?.id, project?.name, authStore.user?.id)
}

onMounted(loadData)
watch(() => projectStore.currentProject?.id, loadData)

const typeIcons = {
  기획: { label: '기', color: 'var(--teal)' },
  디자인: { label: '디', color: 'var(--blue)' },
  퍼블리싱: { label: '퍼', color: 'var(--orange)' },
  개발: { label: '개', color: 'var(--green)' },
  DEV테스트: { label: 'DEV', color: 'var(--gray)' },
  운영테스트: { label: '운영', color: 'var(--gray)' },
  단위테스트: { label: '단', color: 'var(--gray)' },
  STG테스트: { label: 'STG', color: 'var(--gray)' },
}

function typeIcon(type) {
  return typeIcons[type] || { label: type?.slice(0, 1) || '-', color: 'var(--lnb-muted)' }
}

function complianceLabel(status) {
  return projectDashboardMeta.legend.find((l) => l.key === status)?.label || status
}

function complianceClass(compliance) {
  if (compliance === '경과') return 'compliance--경과'
  if (compliance === '단축') return 'compliance--단축'
  return 'compliance--정상'
}

function goWbs() {
  router.push({ name: 'wbs' })
}

function goScheduleRow(row) {
  const path = routeForTaskType(row.taskType || '')
  if (path === '/workspace/wbs') {
    router.push({ path: '/workspace/wbs', query: { task: row.taskName } })
    return
  }
  router.push(path)
}
</script>

<template>
  <div v-if="data" class="proj-dash">
    <h1 class="proj-dash__title">
      프로젝트 현황
      <span class="proj-dash__hint">(기준일 : {{ data.updatedAt }})</span>
    </h1>

    <div class="top-grid">
      <section class="card pad progress-panel">
        <h3 class="sec-title">총 공정률 (자동계산)</h3>
        <div class="progress-main">
          <div class="gauge" :style="{ '--p': data.totalProgress.execRate }">
            <div class="gauge__hole"><b>{{ data.totalProgress.execRate }}%</b></div>
          </div>
          <div class="progress-texts">
            <div class="progress-text-row">
              <span class="progress-text-row__lab">계획기준 공정률</span>
              <span class="progress-text-row__val">{{ data.totalProgress.planRate }}%</span>
            </div>
            <div class="progress-text-row">
              <span class="progress-text-row__lab">실행기준 공정률</span>
              <span class="progress-text-row__val">{{ data.totalProgress.execRate }}%</span>
            </div>
            <div class="progress-text-row">
              <span class="progress-text-row__lab">계획 대비</span>
              <span class="progress-text-row__val progress-diff">{{ data.totalProgress.diffLabel.replace('계획 대비 ', '') }}</span>
            </div>
          </div>
        </div>
        <p class="note">총 공정률은 계획/실행 기준으로 자동 산정</p>
        <div class="period-row">
          <span>계획 {{ formatPeriod(data.totalProgress.planPeriod.start, data.totalProgress.planPeriod.end) }}</span>
          <span>실행 {{ formatPeriod(data.totalProgress.execPeriod.start, data.totalProgress.execPeriod.end) }}</span>
        </div>
      </section>

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
              <span class="schedule-card__label">
                <span class="schedule-card__check" :class="`schedule-card__check--${card.tone}`">✓</span>
                {{ card.label }}
              </span>
              <span class="schedule-card__diff">계획대비 {{ card.diffLabel }}</span>
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
        <p class="note">진행중인 일정 기준 예상 결과</p>
      </section>

      <section class="card pad summary-panel">
        <div class="summary-panel__head">
          <h3 class="sec-title">지연/단축 정보</h3>
          <span class="refresh-hint">{{ projectDashboardMeta.refreshInterval }}마다 자동 갱신</span>
        </div>
        <div class="summary-chips">
          <div class="summary-chip summary-chip--delay" @click="goWbs">
            <span class="summary-chip__lab summary-chip__lab--link">경과(예상)</span>
            <span class="summary-chip__num">{{ data.delaySummary.expectedDelay }} <small>건</small></span>
          </div>
          <div class="summary-chip summary-chip--normal">
            <span class="summary-chip__lab">정상</span>
            <span class="summary-chip__num">{{ data.delaySummary.normal }} <small>건</small></span>
          </div>
          <div class="summary-chip summary-chip--shorten" @click="goWbs">
            <span class="summary-chip__lab summary-chip__lab--link">단축(예상)</span>
            <span class="summary-chip__num">{{ data.delaySummary.expectedShorten }} <small>건</small></span>
          </div>
        </div>
        <p class="note">진행/완료 업무별 단축/지연 여부 기준</p>
      </section>
    </div>

    <section class="card pad">
      <h3 class="sec-title">업무별 공정률 요약</h3>
      <div class="type-grid">
        <article
          v-for="item in data.typeSummary"
          :key="item.type"
          class="type-card"
        >
          <span class="type-card__icon" :style="{ background: typeIcon(item.type).color }">{{
            typeIcon(item.type).label
          }}</span>
          <span class="type-card__name">{{ item.type }}</span>
          <span class="type-card__rate">{{ item.rate != null ? `${item.rate}%` : '- %' }}</span>
          <div class="type-card__bar">
            <i :style="{ width: item.rate != null ? `${item.rate}%` : '0%' }" />
          </div>
          <span class="type-card__status" :class="`type-card__status--${statusTone(item.status)}`">{{ item.statusLabel }}</span>
        </article>
      </div>
    </section>

    <section class="card listcard">
      <div class="listcard__head">
        <h3 class="sec-title">업무별 상세 현황</h3>
      </div>
      <p class="note listcard__note">{{ projectDashboardMeta.scheduleNote }}</p>
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
              @click="goScheduleRow(row)"
            >
              <td>
                <span class="type-icon" :style="{ background: typeIcon(row.taskType).color }">{{
                  typeIcon(row.taskType).label
                }}</span>
                {{ row.taskType }}
              </td>
              <td>{{ row.assignee }}<span v-if="row.empId" class="emp-id">({{ row.empId }})</span></td>
              <td>{{ formatPeriod(row.planStart, row.planEnd) }}</td>
              <td>{{ formatPeriod(row.execStart, row.execEnd, !row.execEnd) }}</td>
              <td>
                <div class="rate-cell">
                  <span>{{ row.execRate }}%</span>
                  <div class="rate-cell__bar"><i :style="{ width: `${row.execRate}%` }" /></div>
                </div>
              </td>
              <td
                :class="{
                  'text-delay': row.compliance === '경과',
                  'text-shorten': row.compliance === '단축',
                }"
              >
                {{ row.planDiff }}
              </td>
              <td>
                <span class="status-dot" :class="`status-dot--${statusTone(row.status)}`" />
                <span class="compliance" :class="complianceClass(row.compliance)">
                  {{ row.compliance || complianceLabel(row.status) }}
                </span>
              </td>
            </tr>
          </tbody>
        </table>
        <div v-if="!data.details.length" class="empty">WBS 일정 항목이 없습니다.</div>
      </div>
    </section>
  </div>
</template>

<style scoped>
.proj-dash {
  padding: 14px 18px 28px;
  color: var(--lnb-txt);
  font-size: calc(13px + var(--font-size-offset, 0px));
}

.proj-dash__title {
  font-size: calc(18px + var(--font-size-offset, 0px));
  font-weight: 700;
  margin: 0 0 14px;
  display: flex;
  align-items: baseline;
  gap: 8px;
}

.proj-dash__hint {
  font-size: calc(12px + var(--font-size-offset, 0px));
  font-weight: 500;
  color: var(--lnb-muted);
}

.sec-title {
  margin: 0 0 12px;
  padding-bottom: 10px;
  border-bottom: 1px solid var(--lnb-line);
  font-size: calc(14px + var(--font-size-offset, 0px));
  font-weight: 700;
}

.summary-panel__head .sec-title {
  margin-bottom: 0;
  padding-bottom: 0;
  border-bottom: none;
}

.top-grid {
  display: grid;
  grid-template-columns: 1fr 1.2fr 0.8fr;
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
  border: 1px solid var(--lnb-line);
  font-size: calc(11px + var(--font-size-offset, 0px));
}

.schedule-card--normal {
  background: var(--lnb-hover);
}

.schedule-card--shorten {
  background: var(--green-bg);
  border-color: var(--green);
}

.schedule-card--delay {
  background: var(--red-bg);
  border-color: var(--red);
}

.schedule-card__head {
  display: flex;
  justify-content: space-between;
  margin-bottom: 6px;
  font-weight: 700;
}

.schedule-card__label {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  font-size: calc(14px + var(--font-size-offset, 0px));
}

.schedule-card__check {
  font-size: calc(12px + var(--font-size-offset, 0px));
  font-weight: 700;
  color: var(--green);
}

.schedule-card__check--delay {
  color: var(--red);
}

.schedule-card__diff {
  font-size: calc(11px + var(--font-size-offset, 0px));
  color: var(--teal);
}

.schedule-card--delay .schedule-card__diff {
  color: var(--red);
}

.schedule-card__row {
  display: flex;
  gap: 8px;
  margin-top: 2px;
  color: var(--lnb-txt);
}

.schedule-card__key {
  min-width: 56px;
  color: var(--lnb-muted);
}

.progress-main {
  display: flex;
  align-items: center;
  gap: 20px;
  margin-bottom: 10px;
}

.progress-texts {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.progress-text-row {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: calc(12px + var(--font-size-offset, 0px));
}

.progress-text-row__lab {
  min-width: 100px;
  color: var(--lnb-muted);
}

.progress-text-row__val {
  font-weight: 700;
  color: var(--lnb-txt);
}

.progress-diff {
  color: var(--teal);
}

.period-row {
  display: flex;
  flex-direction: column;
  gap: 4px;
  font-size: calc(11px + var(--font-size-offset, 0px));
  color: var(--lnb-muted);
}

.gauge {
  width: 110px;
  height: 110px;
  flex-shrink: 0;
  position: relative;
  border-radius: 50%;
  background: conic-gradient(var(--teal) calc(var(--p) * 1%), var(--lnb-line) 0);
}

.gauge__hole {
  position: absolute;
  inset: 14px;
  border-radius: 50%;
  background: var(--lnb-side);
  display: flex;
  align-items: center;
  justify-content: center;
}

.gauge__hole b {
  font-size: calc(20px + var(--font-size-offset, 0px));
  color: var(--teal);
}

.note {
  margin: 8px 0 0;
  font-size: calc(11px + var(--font-size-offset, 0px));
  color: var(--lnb-muted);
  line-height: 1.4;
}

.summary-panel__head {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  gap: 8px;
  margin-bottom: 12px;
  padding-bottom: 10px;
  border-bottom: 1px solid var(--lnb-line);
}

.refresh-hint {
  font-size: calc(10.5px + var(--font-size-offset, 0px));
  color: var(--lnb-muted);
}

.summary-chips {
  display: flex;
  gap: 8px;
  margin-bottom: 10px;
}

.summary-chip {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 4px;
  padding: 10px 12px;
  border-radius: 8px;
  background: var(--lnb-hover);
}

.summary-chip--delay,
.summary-chip--shorten {
  cursor: pointer;
}

.summary-chip--delay:hover,
.summary-chip--shorten:hover {
  filter: brightness(0.97);
}

.summary-chip__lab {
  font-size: calc(12px + var(--font-size-offset, 0px));
  font-weight: 600;
}

.summary-chip__lab--link {
  text-decoration: underline;
}

.summary-chip__num {
  font-size: calc(22px + var(--font-size-offset, 0px));
  font-weight: 800;
}

.summary-chip__num small {
  font-size: calc(12px + var(--font-size-offset, 0px));
  font-weight: 600;
}

.summary-chip--delay .summary-chip__num {
  color: var(--red);
}

.summary-chip--normal .summary-chip__num {
  color: var(--teal);
}

.summary-chip--shorten .summary-chip__num {
  color: var(--green);
}

.type-grid {
  display: grid;
  grid-template-columns: repeat(6, 1fr);
  gap: 10px;
}

.type-card {
  padding: 12px 10px;
  border-radius: 10px;
  border: 1px solid var(--lnb-line);
  text-align: center;
  display: flex;
  flex-direction: column;
  gap: 6px;
  min-height: 100px;
}

.type-card__icon {
  align-self: center;
  width: 22px;
  height: 22px;
  border-radius: 50%;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  font-size: calc(9px + var(--font-size-offset, 0px));
  font-weight: 700;
  color: #fff;
}

.type-card__name {
  font-size: calc(14px + var(--font-size-offset, 0px));
  font-weight: 700;
  color: var(--lnb-txt);
}

.type-card__rate {
  font-size: calc(20px + var(--font-size-offset, 0px));
  font-weight: 800;
  color: var(--teal);
}

.type-card__bar {
  height: 10px;
  background: var(--lnb-line);
  border-radius: 5px;
  overflow: hidden;
}

.type-card__bar i {
  display: block;
  height: 100%;
  background: var(--teal);
  border-radius: 5px;
}

.type-card__status {
  font-size: calc(12px + var(--font-size-offset, 0px));
  color: var(--lnb-muted);
  font-weight: 600;
}

.type-card__status--delay {
  color: var(--red);
}

.type-card__status--shorten {
  color: var(--green);
}

.type-card__status--normal {
  color: var(--teal);
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

.listcard__note {
  margin: 4px 0 0;
  padding: 0 16px;
}

.listcard__scroll {
  overflow-x: auto;
  padding: 8px 0 4px;
}

.tbl {
  width: 100%;
  border-collapse: collapse;
  font-size: calc(12px + var(--font-size-offset, 0px));
}

.tbl thead th {
  background: var(--lnb-hover);
  font-weight: 600;
  text-align: center;
  padding: 9px 12px;
  border-bottom: 1px solid var(--lnb-line);
  white-space: nowrap;
}

.tbl tbody td {
  padding: 10px 12px;
  border-bottom: 1px solid var(--lnb-line);
  vertical-align: middle;
}

.tbl__row {
  cursor: pointer;
}

.tbl__row:hover {
  background: var(--teal-50);
}

.type-icon {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 18px;
  height: 18px;
  border-radius: 50%;
  margin-right: 6px;
  font-size: calc(8px + var(--font-size-offset, 0px));
  font-weight: 700;
  color: #fff;
  vertical-align: middle;
}

.status-dot {
  display: inline-block;
  width: 8px;
  height: 8px;
  border-radius: 50%;
  margin-right: 6px;
  background: var(--lnb-muted);
}

.status-dot--normal {
  background: var(--teal);
}

.status-dot--delay {
  background: var(--red);
}

.status-dot--shorten {
  background: var(--green);
}

.status-dot--wait {
  background: var(--gray);
}

.emp-id {
  margin-left: 4px;
  color: var(--lnb-muted);
  font-size: calc(11px + var(--font-size-offset, 0px));
}

.rate-cell {
  display: flex;
  align-items: center;
  gap: 8px;
}

.rate-cell__bar {
  width: 60px;
  height: 6px;
  border-radius: 3px;
  background: var(--lnb-line);
  overflow: hidden;
}

.rate-cell__bar i {
  display: block;
  height: 100%;
  background: var(--teal);
  border-radius: 3px;
}

.text-delay {
  color: var(--red);
  font-weight: 600;
}

.text-shorten {
  color: var(--green);
  font-weight: 600;
}

.compliance {
  font-size: calc(11px + var(--font-size-offset, 0px));
  padding: 2px 8px;
  border-radius: 999px;
  font-weight: 600;
}

.compliance--정상 {
  background: var(--lnb-hover);
  color: var(--gray);
}

.empty {
  text-align: center;
  color: var(--lnb-muted);
  padding: 24px 12px;
}

.compliance--경과 {
  background: var(--red-bg);
  color: var(--red);
}

.compliance--단축 {
  background: var(--green-bg);
  color: var(--green);
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
