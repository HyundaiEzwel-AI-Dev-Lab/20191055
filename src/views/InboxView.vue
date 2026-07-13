<script setup>
// PAG-M-MY-01/02/03 내업무 (진입화면)
import { ref, computed } from 'vue'
import {
  summary,
  progressProjects,
  myTasks,
  waitingProjects,
} from '@/data/inbox'
import InboxCalendar from '@/components/inbox/InboxCalendar.vue'

const viewMode = ref('card') // card | calendar

// ---- 카드형: 진행중 프로젝트 롤링 ----
const projectPage = ref(0)
const PROJECTS_PER_PAGE = 3
const pagedProjects = computed(() => {
  const start = projectPage.value * PROJECTS_PER_PAGE
  return progressProjects.slice(start, start + PROJECTS_PER_PAGE)
})
const maxProjectPage = computed(() =>
  Math.max(0, Math.ceil(progressProjects.length / PROJECTS_PER_PAGE) - 1),
)
function prevProjects() {
  if (projectPage.value > 0) projectPage.value--
}
function nextProjects() {
  if (projectPage.value < maxProjectPage.value) projectPage.value++
}

// ---- 카드형: 대기 프로젝트 롤링 ----
const waitingPage = ref(0)
const WAITING_PER_PAGE = 3
const pagedWaiting = computed(() => {
  const start = waitingPage.value * WAITING_PER_PAGE
  return waitingProjects.slice(start, start + WAITING_PER_PAGE)
})
const maxWaitingPage = computed(() =>
  Math.max(0, Math.ceil(waitingProjects.length / WAITING_PER_PAGE) - 1),
)
function prevWaiting() {
  if (waitingPage.value > 0) waitingPage.value--
}
function nextWaiting() {
  if (waitingPage.value < maxWaitingPage.value) waitingPage.value++
}
</script>

<template>
  <div class="inbox">
    <!-- 상단 요약 바 -->
    <div class="summary">
      <div class="summary__stats">
        <div class="summary__item">
          <span class="k">진행 프로젝트</span><b>{{ summary.progressProjects }}</b><span class="u">건</span>
        </div>
        <span class="summary__divider"></span>
        <div class="summary__item">
          <span class="k">내 할 일</span><b>{{ summary.myTasks }}</b><span class="u">건</span>
        </div>
        <span class="summary__divider"></span>
        <div class="summary__item">
          <span class="k">금주 마감</span><b>{{ summary.weekDue }}</b><span class="u">건</span>
        </div>
        <span class="summary__divider"></span>
        <div class="summary__item">
          <span class="k">대기</span><b>{{ summary.waiting }}</b><span class="u">건</span>
        </div>
        <span class="summary__divider"></span>
        <div class="summary__item summary__item--danger">
          <span class="k">지연</span><b class="r">{{ summary.delayed }}</b><span class="u">건</span>
        </div>
      </div>
      <div class="summary__sp"></div>
      <div class="viewtoggle">
        <span :class="{ on: viewMode === 'card' }" @click="viewMode = 'card'">카드형</span>
        <span :class="{ on: viewMode === 'calendar' }" @click="viewMode = 'calendar'">캘린더형</span>
      </div>
    </div>

    <!-- ================= 카드형 ================= -->
    <template v-if="viewMode === 'card'">
      <!-- 진행중 -->
      <section class="block">
        <div class="block__head">
          <h3>진행중 <span class="cnt">({{ progressProjects.length }})</span></h3>
          <div class="roll">
            <button class="roll__btn" :disabled="projectPage === 0" @click="prevProjects">◀</button>
            <button class="roll__btn" :disabled="projectPage >= maxProjectPage" @click="nextProjects">▶</button>
          </div>
        </div>

        <div v-if="progressProjects.length" class="pcards">
          <div v-for="p in pagedProjects" :key="p.id" class="pcard">
            <div class="pcard__top">
              <span class="pcard__dday">{{ p.openDate }} ( {{ p.dday }} )</span>
              <span class="stbadge" :class="p.stageType">{{ p.stage }}</span>
            </div>
            <div class="pcard__name">{{ p.name }}</div>
            <div class="pcard__prog">
              <div class="bar"><i :style="{ width: p.progress + '%' }"></i></div>
              <span class="pct">{{ p.progress }}%</span>
            </div>
            <div class="pcard__stats">
              <div><span>배정</span><b>{{ p.members }}</b></div>
              <div><span>업무</span><b>{{ p.tasks }}</b></div>
              <div><span>완료</span><b>{{ p.done }}</b></div>
            </div>
          </div>
        </div>
        <div v-else class="empty">• 배정된 프로젝트가 없습니다.</div>
      </section>

      <!-- 내 할 일 -->
      <section class="block">
        <div class="block__head">
          <h3>내 할 일 <span class="cnt">({{ myTasks.length }})</span></h3>
        </div>

        <div v-if="myTasks.length" class="listcard">
          <table class="tbl">
            <thead>
              <tr>
                <th>업무명</th>
                <th style="width:220px">마감일 (D-day)</th>
                <th style="width:110px">공정률</th>
                <th style="width:34%">프로젝트명</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="t in myTasks" :key="t.id" class="click">
                <td>{{ t.name }}</td>
                <td class="due-cell">
                  <span :class="{ delay: t.delayed }">{{ t.dueLabel }}</span>
                  <span v-if="t.dday" class="dday" :class="{ delay: t.delayed }"> ({{ t.dday }})</span>
                  <span v-if="t.delayed" class="stbadge rej ml">지연</span>
                </td>
                <td>{{ t.progress === null ? '-%' : t.progress + '%' }}</td>
                <td class="ell">{{ t.project }}</td>
              </tr>
            </tbody>
          </table>
        </div>
        <div v-else class="empty">• 진행중인 업무가 없습니다.</div>
      </section>

      <!-- 대기 -->
      <section class="block">
        <div class="block__head">
          <h3>대기 <span class="cnt">({{ waitingProjects.length }})</span></h3>
          <div class="roll">
            <button class="roll__btn" :disabled="waitingPage === 0" @click="prevWaiting">◀</button>
            <button class="roll__btn" :disabled="waitingPage >= maxWaitingPage" @click="nextWaiting">▶</button>
          </div>
        </div>

        <div v-if="waitingProjects.length" class="wcards">
          <div v-for="w in pagedWaiting" :key="w.id" class="wcard click">
            <div class="wcard__meta">{{ w.owner }} | {{ w.openDate }}</div>
            <div class="wcard__name">{{ w.name }}</div>
            <span class="stbadge recv">{{ w.stage }}</span>
          </div>
        </div>
        <div v-else class="empty">• 접수된 프로젝트가 없습니다.</div>
      </section>
    </template>

    <!-- ================= 캘린더형 ================= -->
    <InboxCalendar v-else />
  </div>
</template>

<style scoped>
.inbox {
  font-family: var(--font-family);
  color: var(--lnb-txt);
  padding: 4px 24px 28px;
}

/* 요약 바 */
.summary {
  display: flex;
  align-items: center;
  gap: 18px;
  background: var(--lnb-side);
  border: 1px solid var(--lnb-line);
  border-radius: 10px;
  padding: 12px 16px;
  font-size: 13px;
  color: var(--lnb-txt);
  margin-bottom: 12px;
}
.summary__stats {
  display: flex;
  align-items: center;
  gap: 20px;
}
.summary__divider {
  width: 1px;
  height: 16px;
  background: var(--lnb-line);
}
.summary__item {
  display: flex;
  align-items: baseline;
  gap: 6px;
  white-space: nowrap;
}
.summary__item--danger {
  padding: 3px 10px;
  border-radius: 20px;
  background: var(--red-bg);
}
.summary__item .k {
  color: var(--lnb-muted);
}
.summary__item .u {
  color: var(--lnb-muted);
  font-size: 12px;
}
.summary__item b {
  font-size: 16px;
  color: var(--lnb-logo);
  font-weight: 800;
}
.summary__item b.r {
  color: var(--red);
}
.summary__sp {
  flex: 1;
}
.viewtoggle {
  display: inline-flex;
  border: 1px solid var(--lnb-line);
  border-radius: 8px;
  background: #fff;
  overflow: hidden;
}
.viewtoggle span {
  padding: 6px 14px;
  font-size: 12px;
  color: var(--lnb-muted);
  cursor: pointer;
}
.viewtoggle span.on {
  background: var(--lnb-hover);
  color: var(--lnb-logo);
  font-weight: 700;
}

/* 블록 공통 */
.block {
  margin-bottom: 18px;
}
.block__head {
  display: flex;
  align-items: center;
  margin-bottom: 10px;
}
.block__head h3 {
  font-size: 14px;
  font-weight: 700;
  margin: 0;
}
.block__head .cnt {
  color: var(--lnb-logo);
}
.roll {
  margin-left: auto;
  display: flex;
  gap: 4px;
}
.roll__btn {
  width: 26px;
  height: 26px;
  border: 1px solid var(--lnb-line);
  border-radius: 6px;
  background: #fff;
  color: var(--lnb-txt);
  font-size: 10px;
  cursor: pointer;
}
.roll__btn:disabled {
  opacity: 0.4;
  cursor: not-allowed;
}

/* 진행중 프로젝트 카드 */
.pcards {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 14px;
}
.pcard {
  background: var(--lnb-side);
  border: 1px solid var(--lnb-line);
  border-radius: 10px;
  padding: 14px 16px;
  cursor: pointer;
  transition: border-color 0.15s, box-shadow 0.15s;
}
.pcard:hover {
  border-color: var(--lnb-logo);
  box-shadow: 0 2px 8px rgba(20, 40, 50, 0.08);
}
.pcard__top {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 8px;
}
.pcard__dday {
  font-size: 11.5px;
  color: var(--lnb-muted);
}
.pcard__name {
  font-size: 13.5px;
  font-weight: 700;
  line-height: 1.4;
  margin-bottom: 12px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.pcard__prog {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 12px;
}
.bar {
  flex: 1;
  height: 6px;
  background: #eef1f3;
  border-radius: 6px;
  overflow: hidden;
}
.bar i {
  display: block;
  height: 100%;
  background: var(--lnb-logo);
}
.pct {
  font-size: 12px;
  font-weight: 700;
  color: var(--lnb-logo);
  width: 38px;
  text-align: right;
}
.pcard__stats {
  display: flex;
  gap: 18px;
  border-top: 1px solid var(--lnb-line);
  padding-top: 10px;
}
.pcard__stats div {
  font-size: 12px;
  color: var(--lnb-muted);
}
.pcard__stats b {
  color: var(--lnb-logo);
  margin-left: 6px;
  font-size: 13px;
}

/* 상태 뱃지 */
.stbadge {
  font-size: 11px;
  font-weight: 700;
  padding: 3px 9px;
  border-radius: 20px;
  display: inline-block;
  white-space: nowrap;
}
.stbadge.recv {
  color: var(--gray);
  background: var(--gray-bg);
}
.stbadge.prog {
  color: var(--blue);
  background: var(--blue-bg);
}
.stbadge.test {
  color: var(--orange);
  background: var(--orange-bg);
}
.stbadge.done {
  color: var(--green);
  background: var(--green-bg);
}
.stbadge.rej {
  color: var(--red);
  background: var(--red-bg);
}
.stbadge.ml {
  margin-left: 6px;
}

/* 내 할 일 테이블 */
.listcard {
  background: var(--lnb-side);
  border: 1px solid var(--lnb-line);
  border-radius: 10px;
  overflow: hidden;
}
.tbl {
  width: 100%;
  border-collapse: collapse;
  font-size: 12.5px;
}
.tbl thead th {
  background: #fafbfc;
  color: var(--lnb-muted);
  font-weight: 600;
  text-align: left;
  padding: 9px 12px;
  border-bottom: 1px solid var(--lnb-line);
  white-space: nowrap;
}
.tbl tbody td {
  padding: 11px 12px;
  border-bottom: 1px solid var(--lnb-line);
  color: var(--lnb-txt);
}
.tbl tbody tr:last-child td {
  border-bottom: none;
}
.tbl tbody tr.click {
  cursor: pointer;
}
.tbl tbody tr.click:hover {
  background: var(--lnb-hover);
}
.ell {
  max-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.dday {
  color: var(--lnb-muted);
}
.delay {
  color: var(--red);
  font-weight: 700;
}
.due-cell {
  white-space: nowrap;
}

/* 대기 카드 */
.wcards {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 14px;
}
.wcard {
  background: var(--lnb-side);
  border: 1px solid var(--lnb-line);
  border-radius: 10px;
  padding: 14px 16px;
  cursor: pointer;
}
.wcard:hover {
  border-color: var(--lnb-logo);
}
.wcard__meta {
  font-size: 11.5px;
  color: var(--lnb-muted);
  margin-bottom: 8px;
}
.wcard__name {
  font-size: 13.5px;
  font-weight: 700;
  margin-bottom: 10px;
}

.empty {
  background: var(--lnb-side);
  border: 1px dashed var(--lnb-line);
  border-radius: 10px;
  padding: 22px;
  color: var(--lnb-muted);
  font-size: 12.5px;
}
</style>
