<script setup>
// PAG-M-MY-01/02/03 내업무 (진입화면)
import { ref, computed, watch, onMounted, onBeforeUnmount } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { useProjectStore } from '@/stores/project'
import { useTabsStore } from '@/stores/tabs'
import { useSubTabsStore } from '@/stores/subTabs'
import {
  INBOX_GUIDE,
  getInboxBundle,
  routeForTaskType,
} from '@/data/inbox'
import { calcDday } from '@/data/wbs'
import InboxCalendar from '@/components/inbox/InboxCalendar.vue'
import WbsScheduleModal from '@/components/wbs/WbsScheduleModal.vue'
import WbsBulkScheduleModal from '@/components/wbs/WbsBulkScheduleModal.vue'

const router = useRouter()
const auth = useAuthStore()
const projectStore = useProjectStore()
const tabsStore = useTabsStore()
const subTabsStore = useSubTabsStore()

const viewMode = ref('card')
const bundle = computed(() => getInboxBundle(auth.user?.id))
const summary = computed(() => bundle.value.summary)
const progressProjects = computed(() => bundle.value.progressProjects)
const myTasks = ref([])
watch(
  () => auth.user?.id,
  () => {
    myTasks.value = JSON.parse(JSON.stringify(bundle.value.myTasks))
  },
  { immediate: true },
)
const waitingProjects = computed(() => bundle.value.waitingProjects)

const avatarPalette = ['#119a8a', '#7c5cf0', '#f59e0b', '#ec4899', '#3b82f6', '#22c55e']
function avatarColor(i) {
  return avatarPalette[i % avatarPalette.length]
}

function openProject(project, route = '/project/info', sub) {
  const id = project.id || project.projectId
  const name = project.name || project.project || '프로젝트'
  const stage = project.stage || '처리중'
  projectStore.setCurrentProject({ id, name, stage })
  tabsStore.openProjectTab({
    projectId: id,
    title: name,
    projectName: name,
    route,
  })
  const subId = sub?.id || (route.includes('wbs') ? 'wbs' : route.includes('requirement') ? 'requirement' : route.includes('unit-test') ? 'unit-test' : route.includes('test-run') ? 'test-run' : 'info')
  const subTitle = sub?.title || (subId === 'wbs' ? 'WBS' : subId === 'requirement' ? '요구사항' : subId === 'unit-test' ? '단위테스트' : subId === 'test-run' ? '테스트 수행' : '프로젝트 정보')
  subTabsStore.openSubTab(id, { id: subId, title: subTitle, route })
  router.push(route)
}

// ---- 진행중 롤링 ----
const projectPage = ref(0)
const PROJECTS_PER_PAGE = 3
const pagedProjects = computed(() => {
  const start = projectPage.value * PROJECTS_PER_PAGE
  return progressProjects.value.slice(start, start + PROJECTS_PER_PAGE)
})
const maxProjectPage = computed(() =>
  Math.max(0, Math.ceil(progressProjects.value.length / PROJECTS_PER_PAGE) - 1),
)
function prevProjects() {
  if (projectPage.value > 0) projectPage.value--
}
function nextProjects() {
  if (projectPage.value < maxProjectPage.value) projectPage.value++
}

// ---- 내 할 일 40건 페이징 (호버 시만 ◀▶) ----
const taskPage = ref(0)
const TASKS_PER_PAGE = 40
const pagedTasks = computed(() => {
  const start = taskPage.value * TASKS_PER_PAGE
  return myTasks.value.slice(start, start + TASKS_PER_PAGE)
})
const maxTaskPage = computed(() =>
  Math.max(0, Math.ceil(myTasks.value.length / TASKS_PER_PAGE) - 1),
)
const showTaskPager = computed(() => myTasks.value.length > TASKS_PER_PAGE)
function prevTasks() {
  if (taskPage.value > 0) taskPage.value--
}
function nextTasks() {
  if (taskPage.value < maxTaskPage.value) taskPage.value++
}

const moreMenu = ref(null) // { id, x, y }
function toggleMore(e, task) {
  e.stopPropagation()
  if (moreMenu.value?.id === task.id) {
    moreMenu.value = null
    return
  }
  const rect = e.currentTarget.getBoundingClientRect()
  moreMenu.value = { id: task.id, task, x: rect.right - 140, y: rect.bottom + 4 }
}
function closeMore() {
  moreMenu.value = null
}
function onDocClick() {
  closeMore()
}
onMounted(() => document.addEventListener('click', onDocClick))
onBeforeUnmount(() => document.removeEventListener('click', onDocClick))

const showScheduleModal = ref(false)
const scheduleTarget = ref(null)
const showBulkScheduleModal = ref(false)
const bulkTargets = ref([])

/** 일정 저장 결과를 내 할 일 목록에 즉시 반영 */
function applyTaskScheduleUpdate(wbsId, start, end) {
  if (!wbsId || !end) return
  const t = myTasks.value.find((x) => x.wbsId === wbsId)
  if (!t) return
  t.planStart = start || t.planStart
  t.planEnd = end
  const [, m, d] = end.split('-').map(Number)
  t.dueLabel = `${String(m).padStart(2, '0')}/${String(d).padStart(2, '0')} 마감`
  const dday = calcDday(end)
  t.dday = dday
  t.delayed = dday.startsWith('D+')
}

function onScheduleSave(payload) {
  applyTaskScheduleUpdate(scheduleTarget.value?.wbsId, payload.planStart, payload.planEnd)
}

function onOpenMultiChangeFromSchedule(task) {
  if (!task) return
  bulkTargets.value = [task]
  showBulkScheduleModal.value = true
}

function onBulkScheduleRequest(payload) {
  const targetTasks = payload.tasks || []
  if (payload.type === '계획일 변경') {
    targetTasks.forEach((t) => applyTaskScheduleUpdate(t.wbsId, t.newPlanStart, t.newPlanEnd))
  } else if (payload.type === '실행 홀딩') {
    targetTasks.forEach((t) => {
      const found = myTasks.value.find((x) => x.wbsId === t.wbsId)
      if (found) found.dueLabel = '홀딩'
    })
  }
  bulkTargets.value = []
}

function onTaskRowClick(task) {
  closeMore()
  const route = routeForTaskType(task.taskType)
  openProject(
    { id: task.projectId, name: task.project, stage: '처리중' },
    route,
  )
}
function onScheduleManage(task) {
  closeMore()
  projectStore.setCurrentProject({ id: task.projectId, name: task.project, stage: '처리중' })
  scheduleTarget.value = {
    wbsId: task.wbsId,
    requirementName: task.name,
    taskName: task.name,
    taskType: task.taskType,
    assigneeDisplay: auth.user?.name || '김현대',
    planStart: task.planStart || null,
    planEnd: task.planEnd || null,
    execStart: null,
    execEnd: null,
  }
  showScheduleModal.value = true
}
function onWbsDetail(task) {
  closeMore()
  openProject({ id: task.projectId, name: task.project, stage: '처리중' }, '/project/wbs')
}

// ---- 대기 롤링 ----
const waitingPage = ref(0)
const WAITING_PER_PAGE = 3
const pagedWaiting = computed(() => {
  const start = waitingPage.value * WAITING_PER_PAGE
  return waitingProjects.value.slice(start, start + WAITING_PER_PAGE)
})
const maxWaitingPage = computed(() =>
  Math.max(0, Math.ceil(waitingProjects.value.length / WAITING_PER_PAGE) - 1),
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
    <div class="summary">
      <div class="summary__stats">
        <div class="stat-chip stat-chip--brand">
          <span class="stat-chip__icon">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M3 7a2 2 0 0 1 2-2h4l2 2h8a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V7Z" />
            </svg>
          </span>
          <div class="stat-chip__body">
            <b>{{ summary.progressProjects }}</b>
            <span>진행 프로젝트</span>
          </div>
        </div>
        <div class="stat-chip stat-chip--blue">
          <span class="stat-chip__icon">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <rect x="3.5" y="5" width="4" height="4" rx="1" />
              <path d="M10.5 7h10" />
              <rect x="3.5" y="15" width="4" height="4" rx="1" />
              <path d="M10.5 17h10" />
            </svg>
          </span>
          <div class="stat-chip__body">
            <b>{{ summary.myTasks }}</b>
            <span>내 할 일</span>
          </div>
        </div>
        <div class="stat-chip stat-chip--orange">
          <span class="stat-chip__icon">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <circle cx="12" cy="12" r="8.5" />
              <path d="M12 7.5V12l3 2" />
            </svg>
          </span>
          <div class="stat-chip__body">
            <b>{{ summary.weekDue }}</b>
            <span>금주 마감</span>
          </div>
        </div>
        <div class="stat-chip stat-chip--gray">
          <span class="stat-chip__icon">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <circle cx="12" cy="12" r="8.5" />
              <path d="M10 9v6M14 9v6" />
            </svg>
          </span>
          <div class="stat-chip__body">
            <b>{{ summary.waiting }}</b>
            <span>대기</span>
          </div>
        </div>
        <div class="stat-chip stat-chip--red">
          <span class="stat-chip__icon">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M12 3 2 20h20L12 3Z" stroke-linejoin="round" />
              <path d="M12 9.5v4" stroke-linecap="round" />
              <circle cx="12" cy="16.5" r="0.9" fill="currentColor" stroke="none" />
            </svg>
          </span>
          <div class="stat-chip__body">
            <b>{{ summary.delayed }}</b>
            <span>지연</span>
          </div>
        </div>
      </div>
      <div class="summary__sp"></div>
      <div class="viewtoggle">
        <span :class="{ on: viewMode === 'card' }" @click="viewMode = 'card'">카드형</span>
        <span :class="{ on: viewMode === 'calendar' }" @click="viewMode = 'calendar'">캘린더형</span>
      </div>
    </div>

    <template v-if="viewMode === 'card'">
      <section class="block">
        <div class="block__head">
          <h3>진행중 <span class="cnt">({{ progressProjects.length }})</span></h3>
          <div class="roll">
            <button type="button" class="roll__btn" :disabled="projectPage === 0" @click="prevProjects">◀</button>
            <button type="button" class="roll__btn" :disabled="projectPage >= maxProjectPage" @click="nextProjects">▶</button>
          </div>
        </div>

        <div v-if="progressProjects.length" class="pcards">
          <button
            v-for="p in pagedProjects"
            :key="p.id"
            type="button"
            class="pcard"
            :class="p.stageType"
            @click="openProject(p, '/project/info')"
          >
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
              <div class="mini-stat mini-stat--assign">
                <div class="avatar-stack">
                  <span
                    v-for="(person, i) in p.assignees.slice(0, 3)"
                    :key="i"
                    class="avatar-stack__item"
                    :style="{ background: avatarColor(i) }"
                  >{{ person.charAt(0) }}</span>
                  <span v-if="p.members > 3" class="avatar-stack__item avatar-stack__more">
                    +{{ p.members - 3 }}
                  </span>
                </div>
                <span class="mini-stat__lab">배정</span>
              </div>
              <div class="mini-stat mini-stat--task">
                <div class="mini-stat__row">
                  <svg class="mini-stat__icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <rect x="5" y="4" width="14" height="17" rx="2" />
                    <path d="M9 3.5h6a1 1 0 0 1 1 1V6H8V4.5a1 1 0 0 1 1-1Z" />
                    <path d="M8.5 11h7M8.5 14.5h7M8.5 18h4" />
                  </svg>
                  <span class="mini-stat__num">{{ p.tasks }}</span>
                </div>
                <span class="mini-stat__lab">업무</span>
              </div>
              <div class="mini-stat mini-stat--done">
                <div class="mini-stat__row">
                  <svg class="mini-stat__icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.6">
                    <path d="M5 13l4 4L19 7" stroke-linecap="round" stroke-linejoin="round" />
                  </svg>
                  <span class="mini-stat__num">{{ p.done }}</span>
                </div>
                <span class="mini-stat__lab">완료</span>
              </div>
            </div>
          </button>
        </div>
        <div v-else class="empty">• 배정된 프로젝트가 없습니다.</div>
      </section>

      <section class="block">
        <div class="block__head block__head--tasks" :class="{ 'has-pager': showTaskPager }">
          <h3>내 할 일 <span class="cnt">({{ myTasks.length }})</span></h3>
          <div v-if="showTaskPager" class="roll roll--hover">
            <button type="button" class="roll__btn" :disabled="taskPage === 0" @click="prevTasks">◀</button>
            <button type="button" class="roll__btn" :disabled="taskPage >= maxTaskPage" @click="nextTasks">▶</button>
          </div>
        </div>

        <div v-if="myTasks.length" class="listcard">
          <table class="tbl">
            <thead>
              <tr>
                <th>업무명</th>
                <th style="width:220px">마감일 (D-day)</th>
                <th style="width:110px">공정률</th>
                <th style="width:34%">프로젝트명</th>
                <th style="width:44px"></th>
              </tr>
            </thead>
            <tbody>
              <tr
                v-for="t in pagedTasks"
                :key="t.id"
                class="click"
                @click="onTaskRowClick(t)"
              >
                <td>{{ t.name }}</td>
                <td class="due-cell">
                  <span :class="{ delay: t.delayed }">{{ t.dueLabel }}</span>
                  <span v-if="t.dday" class="dday" :class="{ delay: t.delayed }"> ({{ t.dday }})</span>
                  <span v-if="t.delayed" class="stbadge rej ml">지연</span>
                </td>
                <td>{{ t.progress === null ? '-%' : t.progress + '%' }}</td>
                <td class="ell">{{ t.project }}</td>
                <td class="more-cell" @click.stop>
                  <button type="button" class="more-btn" @click="toggleMore($event, t)">⋯</button>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
        <div v-else class="empty">• 진행중인 업무가 없습니다.</div>
        <p class="guide">{{ INBOX_GUIDE }}</p>
      </section>

      <section class="block">
        <div class="block__head">
          <h3>대기 <span class="cnt">({{ waitingProjects.length }})</span></h3>
          <div class="roll">
            <button type="button" class="roll__btn" :disabled="waitingPage === 0" @click="prevWaiting">◀</button>
            <button type="button" class="roll__btn" :disabled="waitingPage >= maxWaitingPage" @click="nextWaiting">▶</button>
          </div>
        </div>

        <div v-if="waitingProjects.length" class="wcards">
          <button
            v-for="w in pagedWaiting"
            :key="w.id"
            type="button"
            class="wcard click"
            @click="openProject(w, '/project/info')"
          >
            <div class="wcard__meta">{{ w.owner }} | {{ w.openDate }}</div>
            <div class="wcard__name">{{ w.name }}</div>
            <span class="stbadge recv">{{ w.stage }}</span>
          </button>
        </div>
        <div v-else class="empty">• 접수된 프로젝트가 없습니다.</div>
        <p class="guide">{{ INBOX_GUIDE }}</p>
      </section>
    </template>

    <InboxCalendar v-else />

    <Teleport to="body">
      <div
        v-if="moreMenu"
        class="more-layer"
        :style="{ left: `${moreMenu.x}px`, top: `${moreMenu.y}px` }"
        @click.stop
      >
        <button type="button" @click="onScheduleManage(moreMenu.task)">일정관리</button>
        <button type="button" @click="onWbsDetail(moreMenu.task)">WBS 상세</button>
      </div>
    </Teleport>

    <WbsScheduleModal
      v-model="showScheduleModal"
      :task="scheduleTarget"
      @save="onScheduleSave"
      @open-multi-change="onOpenMultiChangeFromSchedule"
    />
    <WbsBulkScheduleModal
      v-model="showBulkScheduleModal"
      :tasks="bulkTargets"
      @request="onBulkScheduleRequest"
    />
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
  border-radius: 14px;
  padding: 12px 16px;
  font-size: calc(13px + var(--font-size-offset, 0px));
  color: var(--lnb-txt);
  margin-bottom: 12px;
  box-shadow: var(--shadow-sm);
}
.summary__stats {
  display: flex;
  align-items: center;
  gap: 10px;
  flex-wrap: wrap;
}
.summary__sp {
  flex: 1;
}

/* 요약 스탯 칩 */
.stat-chip {
  display: flex;
  align-items: center;
  gap: 10px;
  width: 160px;
  box-sizing: border-box;
  padding: 7px 14px 7px 10px;
  border-radius: 12px;
  transition: transform 0.15s;
}
.stat-chip:hover {
  transform: translateY(-2px);
}
.stat-chip__icon {
  width: 30px;
  height: 30px;
  border-radius: 9px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  background: rgba(255, 255, 255, 0.6);
}
.stat-chip__icon svg {
  width: 16px;
  height: 16px;
}
.stat-chip__body {
  display: flex;
  flex-direction: column;
  line-height: 1.2;
  white-space: nowrap;
}
.stat-chip__body b {
  font-size: calc(17px + var(--font-size-offset, 0px));
  font-weight: 800;
}
.stat-chip__body span {
  font-size: calc(11px + var(--font-size-offset, 0px));
  opacity: 0.8;
  font-weight: 600;
}

.stat-chip--brand { background: var(--gray-bg); color: var(--lnb-logo); }
.stat-chip--brand .stat-chip__icon { color: var(--lnb-logo); }
.stat-chip--blue { background: var(--blue-bg); color: var(--blue); }
.stat-chip--orange { background: var(--orange-bg); color: var(--orange); }
.stat-chip--gray { background: var(--gray-bg); color: var(--gray); }
.stat-chip--red { background: var(--red-bg); color: var(--red); }
.viewtoggle {
  display: inline-flex;
  border: 1px solid var(--lnb-line);
  border-radius: 8px;
  background: var(--lnb-side);
  overflow: hidden;
}
.viewtoggle span {
  padding: 6px 14px;
  font-size: calc(12px + var(--font-size-offset, 0px));
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
  font-size: calc(14px + var(--font-size-offset, 0px));
  font-weight: 700;
  margin: 0;
}
.block__head .cnt {
  color: var(--lnb-logo);
}
.block__head--tasks {
  gap: 8px;
}
.block__head--tasks .roll--hover {
  margin-left: auto;
  opacity: 0;
  pointer-events: none;
  transition: opacity 0.15s;
}
.block__head--tasks.has-pager:hover .roll--hover {
  opacity: 1;
  pointer-events: auto;
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
  background: var(--lnb-side);
  color: var(--lnb-txt);
  font-size: calc(10px + var(--font-size-offset, 0px));
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
  border-left: 4px solid var(--lnb-line);
  border-radius: 14px;
  padding: 16px 18px;
  cursor: pointer;
  box-shadow: var(--shadow-sm);
  transition: transform 0.15s, box-shadow 0.15s, border-color 0.15s;
  text-align: left;
  font-family: inherit;
  color: inherit;
  width: 100%;
}
.pcard:hover {
  transform: translateY(-3px);
  box-shadow: var(--shadow-md);
}
.pcard.recv { border-left-color: var(--gray); }
.pcard.prog { border-left-color: var(--blue); }
.pcard.test { border-left-color: var(--orange); }
.pcard.done { border-left-color: var(--green); }
.pcard.rej { border-left-color: var(--red); }
.pcard__top {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 8px;
}
.pcard__dday {
  font-size: calc(11.5px + var(--font-size-offset, 0px));
  color: var(--lnb-muted);
}
.pcard__name {
  font-size: calc(13.5px + var(--font-size-offset, 0px));
  font-weight: 700;
  line-height: 1.4;
  margin-bottom: 12px;
  min-height: 2.8em;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}
.pcard__prog {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 14px;
}
.bar {
  flex: 1;
  height: 8px;
  background: var(--line-2);
  border-radius: 8px;
  overflow: hidden;
}
.bar i {
  display: block;
  height: 100%;
  background: linear-gradient(90deg, var(--teal), var(--lnb-logo));
  border-radius: 8px;
}
.pct {
  font-size: calc(12.5px + var(--font-size-offset, 0px));
  font-weight: 800;
  color: var(--lnb-logo);
  width: 38px;
  text-align: right;
}
.pcard__stats {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 8px;
}
.mini-stat {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 4px;
  padding: 8px 4px;
  border-radius: 9px;
  background: var(--lnb-hover);
  min-height: 52px;
}
.mini-stat__row {
  display: flex;
  align-items: center;
  gap: 5px;
}
.mini-stat__icon {
  width: 15px;
  height: 15px;
  flex-shrink: 0;
}
.mini-stat__num {
  font-size: calc(15px + var(--font-size-offset, 0px));
  font-weight: 800;
  color: var(--lnb-logo);
}
.mini-stat__lab {
  font-size: calc(10.5px + var(--font-size-offset, 0px));
  color: var(--lnb-muted);
  font-weight: 600;
}
.mini-stat--assign { background: var(--gray-bg); }
.mini-stat--task { background: var(--blue-bg); }
.mini-stat--task .mini-stat__num,
.mini-stat--task .mini-stat__icon { color: var(--blue); }
.mini-stat--done { background: var(--green-bg); }
.mini-stat--done .mini-stat__num,
.mini-stat--done .mini-stat__icon { color: var(--green); }

/* 배정 아바타 스택 */
.avatar-stack {
  display: flex;
  align-items: center;
}
.avatar-stack__item {
  width: 20px;
  height: 20px;
  border-radius: 50%;
  border: 2px solid var(--gray-bg);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: calc(9.5px + var(--font-size-offset, 0px));
  font-weight: 700;
  color: var(--color-text-inverse);
  margin-left: -6px;
}
.avatar-stack__item:first-child {
  margin-left: 0;
}
.avatar-stack__more {
  background: var(--lnb-logo) !important;
}

/* 상태 뱃지 */
.stbadge {
  font-size: calc(11px + var(--font-size-offset, 0px));
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
  font-size: calc(12.5px + var(--font-size-offset, 0px));
}
.tbl thead th {
  background: var(--lnb-hover);
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
  text-align: left;
  font-family: inherit;
  color: inherit;
}
.wcard:hover {
  border-color: var(--lnb-logo);
}
.wcard__meta {
  font-size: calc(11.5px + var(--font-size-offset, 0px));
  color: var(--lnb-muted);
  margin-bottom: 8px;
}
.wcard__name {
  font-size: calc(13.5px + var(--font-size-offset, 0px));
  font-weight: 700;
  margin-bottom: 10px;
}

.empty {
  background: var(--lnb-side);
  border: 1px dashed var(--lnb-line);
  border-radius: 10px;
  padding: 22px;
  color: var(--lnb-muted);
  font-size: calc(12.5px + var(--font-size-offset, 0px));
}

.guide {
  margin: 10px 2px 0;
  font-size: calc(11.5px + var(--font-size-offset, 0px));
  color: var(--lnb-muted);
  line-height: 1.55;
}

.more-cell {
  text-align: center;
}
.more-btn {
  border: none;
  background: transparent;
  font-size: calc(18px + var(--font-size-offset, 0px));
  line-height: 1;
  cursor: pointer;
  color: var(--lnb-muted);
  padding: 2px 6px;
  border-radius: 6px;
}
.more-btn:hover {
  background: var(--lnb-hover);
  color: var(--lnb-logo);
}

.more-layer {
  position: fixed;
  z-index: 10000;
  min-width: 132px;
  background: var(--lnb-side);
  border: 1px solid var(--lnb-line);
  border-radius: 8px;
  box-shadow: var(--shadow-md);
  padding: 4px;
  display: flex;
  flex-direction: column;
}
.more-layer button {
  border: none;
  background: transparent;
  text-align: left;
  padding: 8px 12px;
  font-size: calc(12.5px + var(--font-size-offset, 0px));
  font-family: inherit;
  color: var(--lnb-txt);
  cursor: pointer;
  border-radius: 6px;
}
.more-layer button:hover {
  background: var(--teal-50);
  color: var(--teal-700);
}
</style>
