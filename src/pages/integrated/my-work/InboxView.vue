<script setup>
// PAG-M-MY-01/02/03 내업무 (진입화면) — h-pms 화면 기준 UI 이관, API는 목업 유지
import { ref, computed, watch, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/app/stores/auth'
import { useProjectStore } from '@/app/stores/project'
import { useTabsStore } from '@/app/stores/tabs'
import { useSubTabsStore } from '@/app/stores/subTabs'
import {
  INBOX_GUIDE,
  getInboxBundle,
  routeForTaskType,
} from '@/entities/inbox/mock/inbox'
import { calcDday } from '@/entities/wbs/mock/wbs'
import InboxCalendar from '@/pages/integrated/my-work/InboxCalendar.vue'
import WbsScheduleModal from '@/pages/workspace/wbs/WbsScheduleModal.vue'
import WbsBulkScheduleModal from '@/pages/workspace/wbs/WbsBulkScheduleModal.vue'
import HpDropdownMenu from '@/shared/ui/HpDropdownMenu.vue'

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

// 필터 칩은 읽기 전용 요약이 아니라 "내 할 일" 표를 거른다. '진행 프로젝트'/'대기'는 업무 단위
// 속성이 없어 표 필터로 표현할 수 없으므로, 대기는 담당 업무가 없다는 뜻으로 빈 목록을,
// 진행 프로젝트는 전체와 동일한 목록을 보여준다.
const taskFilter = ref('all')
function setTaskFilter(key) {
  taskFilter.value = key
  taskPage.value = 0
}

const barsFilled = ref(false)
function startBarAnimation() {
  requestAnimationFrame(() => {
    setTimeout(() => {
      barsFilled.value = true
    }, 60)
  })
}
onMounted(startBarAnimation)
watch(() => auth.user?.id, () => startBarAnimation())

function toStageType(stage) {
  const map = {
    접수: 'recv',
    협의중: 'nego',
    처리중: 'prog',
    개발: 'prog',
    설계: 'prog',
    테스트: 'test',
    완료: 'done',
    반려: 'rej',
  }
  return map[stage] || 'prog'
}

function openProject(project, route = '/workspace/info', sub) {
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
const PROJECTS_PER_PAGE = 4
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
// 카드형만 미완료(execEnd 없음). 캘린더에는 완료 포함 전체를 넘긴다.
const cardTasks = computed(() => myTasks.value.filter((t) => !t.execEnd))

// 노출 순서(전체 → 진행 프로젝트 → 대기 → 금주 마감 → 지연)
const FILTER_CHIPS = computed(() => [
  { key: 'all', label: '전체', count: cardTasks.value.length },
  { key: 'progress', label: '진행 프로젝트', count: summary.value.progressProjects },
  { key: 'waiting', label: '대기', count: summary.value.waiting },
  { key: 'weekDue', label: '금주 마감', count: summary.value.weekDue },
  { key: 'delayed', label: '지연', count: summary.value.delayed },
])

const filteredCardTasks = computed(() => {
  switch (taskFilter.value) {
    case 'weekDue':
      return cardTasks.value.filter((t) => t.weekDue)
    case 'delayed':
      return cardTasks.value.filter((t) => t.delayed)
    // 대기 프로젝트는 아직 담당 업무가 배정되지 않은 상태라 표에 걸리는 행이 없는 것이 맞다.
    case 'waiting':
      return []
    case 'progress':
    case 'all':
    default:
      return cardTasks.value
  }
})

const pagedTasks = computed(() => {
  const start = taskPage.value * TASKS_PER_PAGE
  return filteredCardTasks.value.slice(start, start + TASKS_PER_PAGE)
})
const maxTaskPage = computed(() =>
  Math.max(0, Math.ceil(filteredCardTasks.value.length / TASKS_PER_PAGE) - 1),
)
const showTaskPager = computed(() => filteredCardTasks.value.length > TASKS_PER_PAGE)
function prevTasks() {
  if (taskPage.value > 0) taskPage.value--
}
function nextTasks() {
  if (taskPage.value < maxTaskPage.value) taskPage.value++
}

const moreMenu = ref(null) // { id, task, anchor }
const MORE_MENU_ITEMS = [
  { id: 'schedule', label: '일정관리' },
  { id: 'wbs', label: 'WBS 상세' },
]
function toggleMore(e, task) {
  e.stopPropagation()
  if (moreMenu.value?.id === task.id) {
    moreMenu.value = null
    return
  }
  moreMenu.value = { id: task.id, task, anchor: e.currentTarget }
}
function closeMore() {
  moreMenu.value = null
}
function onMoreSelect(id) {
  const task = moreMenu.value?.task
  if (!task) return
  if (id === 'schedule') onScheduleManage(task)
  else onWbsDetail(task)
}

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

function loadBundle() {
  myTasks.value = JSON.parse(JSON.stringify(bundle.value.myTasks))
}

function onCalendarSaved(payload) {
  if (!payload) return
  applyTaskScheduleUpdate(payload.wbsId, payload.planStart, payload.planEnd)
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
      if (found) {
        found.dueLabel = '홀딩'
        found.holdStart = found.holdStart || '2026-03-20'
      }
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
    execStart: task.execStart || null,
    execEnd: task.execEnd || null,
    planProgress: task.planProgress ?? task.progress ?? 0,
    execProgress: task.progress ?? 0,
    holdStart: task.holdStart || null,
    holdEnd: task.holdEnd || null,
    restartDate: task.expectedResume || null,
  }
  showScheduleModal.value = true
}
function onWbsDetail(task) {
  closeMore()
  openProject({ id: task.projectId, name: task.project, stage: '처리중' }, '/workspace/wbs')
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
  <div class="my-work hp-anim-enter">
    <div class="mw-toolbar">
      <div class="filter-chips">
        <button
          v-for="c in FILTER_CHIPS"
          :key="c.key"
          type="button"
          class="filter-chip"
          :class="[c.key, { 'is-active': taskFilter === c.key }]"
          @click="setTaskFilter(c.key)"
        >
          <span class="filter-chip__dot"></span>
          <span class="filter-chip__label">{{ c.label }}</span>
          <span class="filter-chip__count">{{ c.count }}</span>
        </button>
      </div>
      <div class="view-toggle">
        <button type="button" :class="{ 'is-active': viewMode === 'card' }" @click="viewMode = 'card'">카드형</button>
        <button type="button" :class="{ 'is-active': viewMode === 'calendar' }" @click="viewMode = 'calendar'">캘린더형</button>
      </div>
    </div>

    <template v-if="viewMode === 'card'">
      <div class="notice has-icon guide">
        <span class="notice__icon">!</span>
        <span>{{ INBOX_GUIDE }}</span>
      </div>
      <section class="block">
        <div class="block__head">
          <h3>진행중 <span class="cnt">({{ progressProjects.length }})</span></h3>
          <div class="roll">
            <button type="button" class="roll__btn" :disabled="projectPage === 0" @click="prevProjects">◀</button>
            <button type="button" class="roll__btn" :disabled="projectPage >= maxProjectPage" @click="nextProjects">▶</button>
          </div>
        </div>
        <div v-if="progressProjects.length" class="pcards">
          <button v-for="p in pagedProjects" :key="p.id" type="button"
                  class="pcard" :class="toStageType(p.stage)" @click="openProject(p)">
            <div class="pcard__top">
              <span class="pcard__status">
                <span class="pcard__status-dot"></span>
                {{ p.stage }}
              </span>
              <span v-if="p.dday" class="pcard__dday-tag">{{ p.dday }}</span>
            </div>
            <div class="pcard__body">
              <p class="pcard__caption">{{ p.openDate }} 마감</p>
              <div class="pcard__name">{{ p.name }}</div>
              <div class="pcard__prog-head">
                <span class="pcard__prog-label">완료 {{ p.done }} / 업무 {{ p.tasks }}</span>
                <span class="pct">{{ p.progress }}%</span>
              </div>
              <div class="bar hp-anim-progress" :class="{ 'is-filled': barsFilled }">
                <i :style="{ width: barsFilled ? p.progress + '%' : '0%' }"></i>
              </div>
              <div class="pcard__foot">
                <div class="assignee-icon">
                  <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
                    <circle cx="8" cy="5.2" r="2.7" fill="currentColor" />
                    <path d="M2.9 13.6c0-2.7 2.3-4.3 5.1-4.3s5.1 1.6 5.1 4.3" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" />
                  </svg>
                  <span class="assignee-num">{{ p.members }}</span>
                </div>
                <span class="pcard__detail">상세 →</span>
              </div>
            </div>
          </button>
        </div>
        <div v-else class="empty">배정된 프로젝트가 없습니다.</div>
      </section>

      <section class="block">
        <div class="block__head block__head--tasks" :class="{ 'has-pager': showTaskPager }">
          <h3>내 할 일 <span class="cnt">({{ filteredCardTasks.length }})</span></h3>
          <div v-if="showTaskPager" class="roll roll--hover">
            <button type="button" class="roll__btn" :disabled="taskPage === 0" @click="prevTasks">◀</button>
            <button type="button" class="roll__btn" :disabled="taskPage >= maxTaskPage" @click="nextTasks">▶</button>
          </div>
        </div>
        <div v-if="filteredCardTasks.length" class="mw-table-card">
        <div class="mw-table-wrap">
          <table class="data-table mw-tasktable">
            <thead>
              <tr>
                <th>업무명</th>
                <th>마감일 (D-day)</th>
                <th>프로젝트명</th>
                <th>공정률</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              <tr
                v-for="t in pagedTasks"
                :key="t.id"
                class="click"
                :class="{ 'row--alert': t.delayed || t.weekDue }"
                @click="onTaskRowClick(t)"
              >
                <td>{{ t.name }}</td>
                <td class="due-cell">
                  <span :class="{ delay: t.delayed }">{{ t.dueLabel }}</span>
                  <span v-if="t.dday" class="dday" :class="{ delay: t.delayed }"> ({{ t.dday }})</span>
                  <span v-if="t.delayed" class="badge badge--err ml">지연</span>
                </td>
                <td class="ell">{{ t.project }}</td>
                <td class="cell--right" :class="{ 'is-unset': t.progress === null }">{{ t.progress === null ? '-%' : t.progress + '%' }}</td>
                <td class="more-cell" @click.stop>
                  <button type="button" class="more-btn" @click="toggleMore($event, t)">⋯</button>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
        </div>
        <div v-else class="empty">진행중인 업무가 없습니다.</div>
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
          <button v-for="w in pagedWaiting" :key="w.id" type="button" class="wcard" @click="openProject(w, '/workspace/info')">
            <div class="wcard__meta">{{ w.owner }} | {{ w.openDate }}</div>
            <div class="wcard__name">{{ w.name }}</div>
            <span class="stbadge" :class="toStageType(w.stage)">{{ w.stage }}</span>
          </button>
        </div>
        <div v-else class="empty">접수된 프로젝트가 없습니다.</div>
      </section>
    </template>

    <InboxCalendar v-else :tasks="myTasks" @saved="onCalendarSaved" />

    <HpDropdownMenu
      :open="!!moreMenu"
      :anchor="moreMenu?.anchor ?? null"
      :items="MORE_MENU_ITEMS"
      aria-label="업무 작업"
      @select="onMoreSelect"
      @close="closeMore"
    />

    <WbsScheduleModal
      :tasks="scheduleTarget ? [scheduleTarget] : []"
      @close="scheduleTarget = null"
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
/* font-size는 --font-size-* 토큰 또는 calc(Npx + var(--font-size-offset))을 쓴다.
   rem은 --font-size-offset에 반응하지 않아 내설정>글자 크기가 먹지 않는다(layout.css:3-11 선례). */

.my-work { padding: 28px 32px 48px; }

/* 필터 칩 라인 + 뷰 전환 */
.mw-toolbar { display: flex; align-items: center; gap: 12px; margin-bottom: 22px; flex-wrap: wrap; }
.filter-chips { display: flex; align-items: center; gap: 8px; flex-wrap: wrap; }

.filter-chip {
  display: inline-flex; align-items: center; gap: 8px;
  padding: 9px 17px; border-radius: 999px; border: 1px solid var(--lnb-line);
  background: var(--lnb-side); font-family: inherit; cursor: pointer;
  font-size: calc(13.5px + var(--font-size-offset)); font-weight: 600; color: var(--lnb-txt);
  transition: border-color var(--transition-fast), background var(--transition-fast);
}
.filter-chip__dot { width: 7px; height: 7px; border-radius: 50%; background: var(--lnb-muted); flex-shrink: 0; }
.filter-chip__count { font-weight: 800; }
.filter-chip:hover { border-color: var(--lnb-logo); }

.filter-chip.weekDue { background: var(--orange-bg); border-color: var(--orange); color: var(--orange); }
.filter-chip.weekDue .filter-chip__dot { background: var(--orange); }
.filter-chip.weekDue:hover { border-color: var(--orange); }
.filter-chip.delayed { background: var(--red-bg); border-color: var(--red); color: var(--red); }
.filter-chip.delayed .filter-chip__dot { background: var(--red); }
.filter-chip.delayed:hover { border-color: var(--red); }

.filter-chip.is-active {
  background: var(--lnb-logo); border-color: var(--lnb-logo); color: #fff;
}
.filter-chip.is-active .filter-chip__dot { background: #fff; }

/* 뷰 전환 토글 — pill 형태, 흰 배경 활성 탭 */
.view-toggle {
  margin-left: auto; display: inline-flex; padding: 3px; gap: 2px;
  background: var(--lnb-hover); border: 1px solid var(--lnb-line); border-radius: 999px;
}
.view-toggle button {
  padding: 7px 17px; border: none; border-radius: 999px; background: transparent;
  font-size: calc(13.5px + var(--font-size-offset)); font-family: inherit; font-weight: 600;
  color: var(--lnb-muted); cursor: pointer; transition: background var(--transition-fast), box-shadow var(--transition-fast);
}
.view-toggle button.is-active {
  background: var(--lnb-side); box-shadow: var(--shadow-sm); font-weight: 700; color: var(--lnb-logo);
}

.guide { font-size: calc(11.5px + var(--font-size-offset)); }

/* 블록 공통 */
.block { margin-bottom: 22px; }
.block__head { display: flex; align-items: center; margin-bottom: 14px; }
.block__head h3 { font-size: calc(15.5px + var(--font-size-offset)); font-weight: 700; margin: 0; }
.block__head .cnt { color: var(--lnb-logo); }
.block__head--tasks { gap: 8px; }
.block__head--tasks .roll--hover { margin-left: auto; opacity: 0; pointer-events: none; transition: opacity 0.15s; }
.block__head--tasks.has-pager:hover .roll--hover { opacity: 1; pointer-events: auto; }
.roll { margin-left: auto; display: flex; gap: 4px; }
.roll__btn {
  width: 26px; height: 26px; border: 1px solid var(--lnb-line); border-radius: var(--radius-sm);
  background: var(--lnb-side); color: var(--lnb-txt);
  font-size: calc(10px + var(--font-size-offset)); cursor: pointer;
}
.roll__btn:disabled { opacity: 0.4; cursor: not-allowed; }

/* 진행중 프로젝트 카드 — 4열 그리드, 상태 헤더형 */
.pcards { display: grid; grid-template-columns: repeat(4, 1fr); gap: 16px; }
.wcards { display: grid; grid-template-columns: repeat(3, 1fr); gap: 14px; }
.pcard {
  width: 100%; padding: 0; text-align: left; font: inherit; color: inherit; cursor: pointer;
  display: flex; flex-direction: column; overflow: hidden;
  background: var(--lnb-side); border: 1px solid var(--lnb-line);
  border-radius: var(--radius-card); box-shadow: var(--shadow-sm);
  transition: transform 0.15s, box-shadow 0.15s, border-color 0.15s;
}
.pcard:hover { transform: translateY(-3px); box-shadow: var(--shadow-md); border-color: var(--lnb-logo); }

/* 카드 상단 상태 헤더 — 배경색은 처리단계에 매핑한다 */
.pcard__top {
  display: flex; align-items: center; justify-content: space-between;
  padding: 12px 16px; background: var(--gray-bg); border-bottom: 1px solid var(--lnb-line);
}
.pcard.recv .pcard__top { background: var(--gray-bg); }
.pcard.prog .pcard__top { background: var(--blue-bg); border-bottom-color: var(--blue-bg); }
.pcard.test .pcard__top { background: var(--orange-bg); border-bottom-color: var(--orange-bg); }
.pcard.done .pcard__top { background: var(--green-bg); border-bottom-color: var(--green-bg); }
.pcard.rej .pcard__top { background: var(--red-bg); border-bottom-color: var(--red-bg); }
.pcard.nego .pcard__top { background: var(--purple-bg); border-bottom-color: var(--purple-bg); }

.pcard__status { display: flex; align-items: center; gap: 6px; font-size: 12px; font-weight: 700; color: var(--gray); }
.pcard__status-dot { width: 7px; height: 7px; border-radius: 50%; background: currentColor; flex-shrink: 0; }
.pcard.recv .pcard__status { color: var(--gray); }
.pcard.prog .pcard__status { color: var(--blue); }
.pcard.test .pcard__status { color: var(--orange); }
.pcard.done .pcard__status { color: var(--green); }
.pcard.rej .pcard__status { color: var(--red); }
.pcard.nego .pcard__status { color: var(--purple); }

.pcard__dday-tag { font-size: 12.5px; font-weight: 800; color: var(--gray); }
.pcard.recv .pcard__dday-tag { color: var(--gray); }
.pcard.prog .pcard__dday-tag { color: var(--blue); }
.pcard.test .pcard__dday-tag { color: var(--orange); }
.pcard.done .pcard__dday-tag { color: var(--green); }
.pcard.rej .pcard__dday-tag { color: var(--red); }
.pcard.nego .pcard__dday-tag { color: var(--purple); }

.pcard__body { padding: 18px; display: flex; flex-direction: column; gap: 15px; }
.pcard__caption { margin: 0; font-size: 12px; font-weight: 400; color: var(--lnb-muted); }
.pcard__name {
  font-size: calc(16.5px + var(--font-size-offset)); font-weight: 700; line-height: 1.35;
  min-height: 2.7em; overflow: hidden; color: var(--lnb-txt);
  display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical;
}
.pcard__prog-head { display: flex; align-items: baseline; justify-content: space-between; }
.pcard__prog-label { font-size: calc(12.5px + var(--font-size-offset)); color: var(--lnb-muted); font-weight: 600; }
.bar { height: 8px; background: var(--line-2); border-radius: 999px; overflow: hidden; margin-top: 6px; }
.bar i { display: block; height: 100%; border-radius: inherit; background: linear-gradient(90deg, var(--teal), var(--lnb-logo)); }
.pct { text-align: right; font-size: calc(15px + var(--font-size-offset)); font-weight: 800; color: var(--lnb-logo); }
.pcard.prog .bar i { background: var(--blue); }
.pcard.prog .pct { color: var(--blue); }
.pcard.nego .bar i { background: var(--purple); }
.pcard.nego .pct { color: var(--purple); }

.pcard__foot { display: flex; align-items: center; justify-content: space-between; }
.pcard__detail { font-size: calc(12px + var(--font-size-offset)); color: var(--lnb-muted); font-weight: 600; }
.pcard:hover .pcard__detail { color: var(--lnb-logo); }

.assignee-icon { display: flex; align-items: center; gap: 5px; color: var(--lnb-muted); }
.assignee-num { font-size: calc(15px + var(--font-size-offset)); font-weight: 800; color: var(--lnb-txt); }

/* 상태 뱃지 — 5분류 */
.stbadge {
  display: inline-block; white-space: nowrap;
  font-size: var(--font-size-xs); font-weight: 700; padding: 3px 9px; border-radius: 999px;
  color: var(--gray); background: var(--gray-bg);
}
.stbadge.recv { color: var(--gray); background: var(--gray-bg); }
.stbadge.prog { color: var(--blue); background: var(--blue-bg); }
.stbadge.test { color: var(--orange); background: var(--orange-bg); }
.stbadge.done { color: var(--green); background: var(--green-bg); }
.stbadge.rej { color: var(--red); background: var(--red-bg); }
.stbadge.ml { margin-left: 6px; }

/* 내 할 일 테이블 — 카드 겉모습은 바깥 .mw-table-card가 갖는다 */
.mw-table-card {
  background: var(--lnb-side); border: 1px solid var(--lnb-line);
  border-radius: var(--radius-lg); box-shadow: var(--shadow-sm); overflow: hidden;
}
.mw-table-wrap { overflow-x: auto; }
.mw-tasktable { border: none; border-radius: 0; box-shadow: none; }
.mw-tasktable .due-cell { white-space: nowrap; }
.mw-tasktable .dday { color: var(--lnb-muted); }
.mw-tasktable .delay { color: var(--red); font-weight: 700; }
.mw-tasktable .ell { max-width: 0; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.mw-tasktable tbody tr.click { cursor: pointer; }
.mw-tasktable .is-unset { color: var(--lnb-muted); }

/* 대기 카드 */
.wcard {
  width: 100%; text-align: left; font: inherit; color: inherit; cursor: pointer;
  background: var(--lnb-side); border: 1px solid var(--lnb-line);
  border-radius: var(--radius-lg); box-shadow: var(--shadow-sm); padding: 14px 16px;
}
.wcard:hover { border-color: var(--lnb-logo); }
.wcard__meta { font-size: calc(11.5px + var(--font-size-offset)); color: var(--lnb-muted); margin-bottom: 8px; }
.wcard__name { font-size: calc(13.5px + var(--font-size-offset)); font-weight: 700; margin-bottom: 10px; }

.empty {
  background: var(--lnb-side); border: 1px dashed var(--lnb-line); border-radius: var(--radius-lg);
  padding: 22px; color: var(--lnb-muted); font-size: calc(12.5px + var(--font-size-offset));
}
.empty::before { content: '• '; }

.more-cell { text-align: center; }
.more-btn {
  border: none; background: transparent; line-height: 1; cursor: pointer;
  font-size: calc(18px + var(--font-size-offset)); color: var(--lnb-muted);
  padding: 2px 6px; border-radius: var(--radius-sm);
}
.more-btn:hover { background: var(--lnb-hover); color: var(--lnb-logo); }

@media (max-width: 1280px) {
  .pcards { grid-template-columns: repeat(2, 1fr); }
}
</style>
