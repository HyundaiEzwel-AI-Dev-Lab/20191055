<script setup>
// PAG-M-MY-01/02/03 내업무 (진입화면)
import { ref, computed, watch, onMounted, onBeforeUnmount } from 'vue'
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
    협의중: 'recv',
    처리중: 'prog',
    개발: 'prog',
    설계: 'prog',
    테스트: 'test',
    완료: 'done',
    반려: 'rej',
  }
  return map[stage] || 'prog'
}

const avatarPalette = ['#119a8a', '#7c5cf0', '#f59e0b', '#ec4899', '#3b82f6', '#22c55e']
function avatarColor(i) {
  return avatarPalette[i % avatarPalette.length]
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
// 카드형만 미완료(execEnd 없음). 캘린더에는 완료 포함 전체를 넘긴다.
const cardTasks = computed(() => myTasks.value.filter((t) => !t.execEnd))
const pagedTasks = computed(() => {
  const start = taskPage.value * TASKS_PER_PAGE
  return cardTasks.value.slice(start, start + TASKS_PER_PAGE)
})
const maxTaskPage = computed(() =>
  Math.max(0, Math.ceil(cardTasks.value.length / TASKS_PER_PAGE) - 1),
)
const showTaskPager = computed(() => cardTasks.value.length > TASKS_PER_PAGE)
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
    <div class="summary card card--panel">
      <div class="summary__stats">
        <div class="stat-chip stat-chip--brand">
          <span class="stat-chip__icon">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M3 7a2 2 0 0 1 2-2h4l2 2h8a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V7Z" />
            </svg>
          </span>
          <div class="stat-chip__body"><b>{{ summary.progressProjects }}</b><span>진행 프로젝트</span></div>
        </div>
        <div class="stat-chip stat-chip--blue">
          <span class="stat-chip__icon">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <rect x="3.5" y="5" width="4" height="4" rx="1" /><path d="M10.5 7h10" />
              <rect x="3.5" y="15" width="4" height="4" rx="1" /><path d="M10.5 17h10" />
            </svg>
          </span>
          <div class="stat-chip__body"><b>{{ summary.myTasks }}</b><span>내 할 일</span></div>
        </div>
        <div class="stat-chip stat-chip--orange">
          <span class="stat-chip__icon">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <circle cx="12" cy="12" r="8.5" /><path d="M12 7.5V12l3 2" />
            </svg>
          </span>
          <div class="stat-chip__body"><b>{{ summary.weekDue }}</b><span>금주 마감</span></div>
        </div>
        <div class="stat-chip stat-chip--gray">
          <span class="stat-chip__icon">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <circle cx="12" cy="12" r="8.5" /><path d="M10 9v6M14 9v6" />
            </svg>
          </span>
          <div class="stat-chip__body"><b>{{ summary.waiting }}</b><span>대기</span></div>
        </div>
        <!-- SB-PAG-M-MY-01-R01은 요약 칩 4종(진행·내할일·금주마감·대기). 지연 칩은 SB 초과분이라 숨긴다.
             행 강조(delayed)와 summary.delayed는 유지 — 칩을 되살릴 때 백엔드를 다시 안 건드리게.
        <div class="stat-chip stat-chip--red">
          <span class="stat-chip__icon">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M12 3 2 20h20L12 3Z" stroke-linejoin="round" />
              <path d="M12 9.5v4" stroke-linecap="round" />
              <circle cx="12" cy="16.5" r="0.9" fill="currentColor" stroke="none" />
            </svg>
          </span>
          <div class="stat-chip__body"><b>{{ summary.delayed }}</b><span>지연</span></div>
        </div>
        -->
      </div>
      <div class="viewtoggle">
        <button type="button" :class="{ on: viewMode === 'card' }" @click="viewMode = 'card'">카드형</button>
        <button type="button" :class="{ on: viewMode === 'calendar' }" @click="viewMode = 'calendar'">캘린더형</button>
      </div>
    </div>

    <template v-if="viewMode === 'card'">
      <p class="guide">{{ INBOX_GUIDE }}</p>
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
              <span class="pcard__dday">
                {{ p.openDate }}
                <template v-if="p.dday"> ( <b class="pcard__dday-tag">{{ p.dday }}</b> )</template>
              </span>
              <span class="stbadge" :class="toStageType(p.stage)">{{ p.stage }}</span>
            </div>
            <div class="pcard__name">{{ p.name }}</div>
            <div class="pcard__prog">
              <div class="bar hp-anim-progress" :class="{ 'is-filled': barsFilled }">
                <i :style="{ width: barsFilled ? p.progress + '%' : '0%' }"></i>
              </div>
              <span class="pct">{{ p.progress }}%</span>
            </div>
            <div class="pcard__stats">
              <div class="mini-stat mini-stat--assign">
                <div class="avatar-stack">
                  <span v-for="(person, i) in p.assignees.slice(0, 3)" :key="i"
                        class="avatar-stack__item" :style="{ background: avatarColor(i) }">{{ person.charAt(0) }}</span>
                  <span v-if="p.members > 3" class="avatar-stack__item avatar-stack__more">+{{ p.members - 3 }}</span>
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
        <div v-else class="empty">배정된 프로젝트가 없습니다.</div>
      </section>

      <section class="block">
        <div class="block__head block__head--tasks" :class="{ 'has-pager': showTaskPager }">
          <h3>내 할 일 <span class="cnt">({{ cardTasks.length }})</span></h3>
          <div v-if="showTaskPager" class="roll roll--hover">
            <button type="button" class="roll__btn" :disabled="taskPage === 0" @click="prevTasks">◀</button>
            <button type="button" class="roll__btn" :disabled="taskPage >= maxTaskPage" @click="nextTasks">▶</button>
          </div>
        </div>
        <div v-if="cardTasks.length" class="listcard">
          <table class="tbl">
            <thead>
              <tr>
                <!-- 열 순서는 SB-PAG-M-MY-01-T01~T04 그대로다(업무명 → 마감일 → 프로젝트명 → 공정률).
                     FO 목업은 프로젝트명을 앞에 뒀지만 SB를 따른다(2026-08-20 사용자 결정). -->
                <th>업무명</th>
                <th>마감일 (D-day)</th>
                <th>프로젝트명</th>
                <!-- 아래 3열은 FO 목업 이관분 초과라 숨긴다.
                     formatDateRange/planProgress 표시를 되살릴 때 주석만 해제하면 된다. -->
                <!-- <th>계획일정</th> -->
                <!-- <th>실행일정</th> -->
                <!-- <th>계획공정률</th> -->
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
                  <span v-if="t.delayed" class="stbadge rej ml">지연</span>
                </td>
                <td class="ell">{{ t.project }}</td>
                <!-- <td>{{ formatDateRange(t.planStart, t.planEnd) }}</td> -->
                <!-- <td>{{ t.execStart ? formatDateRange(t.execStart, t.execEnd) : '-' }}</td> -->
                <!-- <td>{{ t.planProgress === null ? '-%' : t.planProgress + '%' }}</td> -->
                <td>{{ t.progress === null ? '-%' : t.progress + '%' }}</td>
                <td class="more-cell" @click.stop>
                  <button type="button" class="more-btn" @click="toggleMore($event, t)">⋯</button>
                </td>
              </tr>
            </tbody>
          </table>
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

    <InboxCalendar v-else :tasks="myTasks" @saved="loadBundle" />

    <WbsScheduleModal
      :tasks="scheduleTarget ? [scheduleTarget] : []"
      @close="scheduleTarget = null"
      @save="onScheduleSave"
      @open-multi-change="onOpenMultiChangeFromSchedule"
    />
    <WbsBulkScheduleModal
      v-if="showBulkModal"
      :tasks="bulkTargets"
      :members="bulkMembers"
      @close="closeBulkModal"
      @request-plan-change="onRequestPlanChange"
      @request-hold="onRequestHold"
    />
  </div>
</template>

<style scoped>
/* font-size는 --font-size-* 토큰 또는 calc(Npx + var(--font-size-offset))을 쓴다.
   rem은 --font-size-offset에 반응하지 않아 내설정>글자 크기가 먹지 않는다(layout.css:3-11 선례). */

.my-work { padding: 4px 24px 28px; }

/* 요약 바 — 배경·테두리·라운드·그림자는 card card--panel이 준다 */
.summary { display: flex; align-items: center; gap: 18px; padding: 12px 16px; margin-bottom: 12px; font-size: var(--font-size-md); }
.summary__stats { display: flex; align-items: center; gap: 10px; flex-wrap: wrap; }

/* 요약 스탯 칩 */
.stat-chip {
  display: flex; align-items: center; gap: 10px;
  width: 160px; box-sizing: border-box; padding: 7px 14px 7px 10px;
  border-radius: var(--radius-md); transition: transform var(--transition-fast);
}
.stat-chip:hover { transform: translateY(-2px); }
.stat-chip__icon {
  width: 30px; height: 30px; border-radius: var(--radius-md);
  display: flex; align-items: center; justify-content: center; flex-shrink: 0;
  /* 칩 배경(--*-bg) 위에 얹는 반투명 흰 타일. 토큰으로 뺄 수 없어 리터럴로 둔다 */
  background: rgba(255, 255, 255, 0.85);
}
.stat-chip__icon svg { width: 16px; height: 16px; }
.stat-chip__body { display: flex; flex-direction: column; line-height: 1.2; white-space: nowrap; }
.stat-chip__body b { font-size: calc(17px + var(--font-size-offset)); font-weight: 800; }
.stat-chip__body span { font-size: var(--font-size-xs); opacity: 0.8; font-weight: 600; }

.stat-chip--brand { background: var(--gray-bg); color: var(--lnb-logo); }
.stat-chip--blue { background: var(--blue-bg); color: var(--blue); }
.stat-chip--orange { background: var(--orange-bg); color: var(--orange); }
.stat-chip--gray { background: var(--gray-bg); color: var(--gray); }
.stat-chip--red { background: var(--red-bg); color: var(--red); }

/* 다크 계열 컨셉에서는 칩 배경이 어두워 흰 타일 위 아이콘이 안 보인다 — 타일을 반투명으로 낮추고
   아이콘을 흰색으로 고정한다. --color-text-inverse는 다크에서 어두운 색이라 쓸 수 없다.
   목업은 칩 5종 × 컨셉 2종 = 10셀렉터로 적었는데, 셀렉터 특이도가 이미 이기므로 2개로 줄인다. */
:root[data-concept='dark'] .stat-chip__icon,
:root[data-concept='premium'] .stat-chip__icon { color: #fff; background: rgba(255, 255, 255, 0.16); }

/* 뷰 토글 — 마크업은 button 유지(목업은 span), 색만 목업에 맞춘다 */
.viewtoggle {
  margin-left: auto; display: inline-flex; overflow: hidden;
  border: 1px solid var(--lnb-line); border-radius: var(--radius-md); background: var(--lnb-side);
}
.viewtoggle button {
  padding: 6px 14px; border: none; background: transparent;
  font-size: var(--font-size-sm); font-family: inherit; color: var(--lnb-muted); cursor: pointer;
}
.viewtoggle button.on { background: var(--lnb-hover); color: var(--lnb-logo); font-weight: 700; }

/* 안내문구 — SB 결정 ⑧로 카드형 최상단(목업은 대기 블록 하단) */
.guide { margin: 0 0 12px; font-size: calc(11.5px + var(--font-size-offset)); color: var(--lnb-muted); line-height: 1.55; }

/* 블록 공통 — 목업 .block은 여백만 갖는다. 카드 질감은 내용물이 각자 갖는다 */
.block { margin-bottom: 18px; }
.block__head { display: flex; align-items: center; margin-bottom: 10px; }
.block__head h3 { font-size: var(--font-size-lg); font-weight: 700; margin: 0; }
.block__head .cnt { color: var(--lnb-logo); }
.block__head--tasks { gap: 8px; }
.block__head--tasks .roll--hover { margin-left: auto; opacity: 0; pointer-events: none; transition: opacity 0.15s; }
/* 호버 전용 페이저 — 목업 그대로다(§9-3 확정). hover가 없는 기기에서는 페이저에 도달할 수 없다는
   점을 알고 택했다. 되살릴 방법은 §9-4에 남겼다 */
.block__head--tasks.has-pager:hover .roll--hover { opacity: 1; pointer-events: auto; }
.roll { margin-left: auto; display: flex; gap: 4px; }
.roll__btn {
  width: 26px; height: 26px; border: 1px solid var(--lnb-line); border-radius: var(--radius-sm);
  background: var(--lnb-side); color: var(--lnb-txt);
  font-size: calc(10px + var(--font-size-offset)); cursor: pointer;
}
.roll__btn:disabled { opacity: 0.4; cursor: not-allowed; }

/* 진행중 프로젝트 카드 */
.pcards, .wcards { display: grid; grid-template-columns: repeat(3, 1fr); gap: 14px; }
.pcard {
  width: 100%; text-align: left; font: inherit; color: inherit; cursor: pointer;
  background: var(--lnb-side); border: 1px solid var(--lnb-line);
  border-left: 4px solid var(--lnb-line); border-radius: var(--radius-card);
  padding: 16px 18px; box-shadow: var(--shadow-sm);
  transition: transform 0.15s, box-shadow 0.15s, border-color 0.15s;
}
/* SB-PAG-M-MY-01-R05 "마우스오버 시 테두리 강조" — 목업은 부상+그림자만 줬다. 둘을 함께 둔다.
   좌측 띠는 처리단계 색이라 건드리지 않고 위·우·아래 세 변만 강조한다(border-color 일괄 지정은
   .pcard.prog 등과 같은 특이도라 순서에 따라 띠 색을 덮는다). */
.pcard:hover {
  transform: translateY(-3px);
  box-shadow: var(--shadow-md);
  border-top-color: var(--lnb-logo);
  border-right-color: var(--lnb-logo);
  border-bottom-color: var(--lnb-logo);
}
/* 좌측 띠 색 = 처리단계. 분류는 toStageType(공통코드 STATUS → recv/prog/test/done/rej) */
.pcard.recv { border-left-color: var(--gray); }
.pcard.prog { border-left-color: var(--blue); }
.pcard.test { border-left-color: var(--orange); }
.pcard.done { border-left-color: var(--green); }
.pcard.rej { border-left-color: var(--red); }
.pcard__top { display: flex; align-items: center; justify-content: space-between; margin-bottom: 8px; }
.pcard__dday { font-size: calc(11.5px + var(--font-size-offset)); color: var(--lnb-muted); }
/* D-day는 카드에서 가장 먼저 읽혀야 하는 값이다 */
.pcard__dday-tag { color: var(--red); font-weight: 700; }
/* 2줄 클램프 + min-height — 이름 길이가 달라도 카드 아래쪽 요소 높이가 어긋나지 않는다 */
.pcard__name {
  font-size: calc(13.5px + var(--font-size-offset)); font-weight: 700; line-height: 1.4;
  margin-bottom: 12px; min-height: 2.8em; overflow: hidden;
  display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical;
}
.pcard__prog { display: flex; align-items: center; gap: 8px; margin-bottom: 14px; }
.bar { flex: 1; height: 8px; background: var(--line-2); border-radius: 999px; overflow: hidden; }
/* 채움도 트랙과 같은 라운드를 받는다 — 없으면 끝단이 트랙 라운드에 잘려 뭉툭해진다 */
.bar i { display: block; height: 100%; border-radius: inherit; background: linear-gradient(90deg, var(--teal), var(--lnb-logo)); }
.pct { width: 38px; text-align: right; font-size: calc(12.5px + var(--font-size-offset)); font-weight: 800; color: var(--lnb-logo); }

.pcard__stats { display: grid; grid-template-columns: repeat(3, 1fr); gap: 8px; }
.mini-stat {
  display: flex; flex-direction: column; align-items: center; justify-content: center;
  gap: 4px; padding: 8px 4px; border-radius: var(--radius-md);
  background: var(--lnb-hover); min-height: 52px;
}
.mini-stat__row { display: flex; align-items: center; gap: 5px; }
.mini-stat__icon { width: 15px; height: 15px; flex-shrink: 0; }
.mini-stat__num { font-size: calc(15px + var(--font-size-offset)); font-weight: 800; color: var(--lnb-logo); }
.mini-stat__lab { font-size: calc(10.5px + var(--font-size-offset)); color: var(--lnb-muted); font-weight: 600; }
.mini-stat--assign { background: var(--gray-bg); }
.mini-stat--task { background: var(--blue-bg); }
.mini-stat--task .mini-stat__num, .mini-stat--task .mini-stat__icon { color: var(--blue); }
.mini-stat--done { background: var(--green-bg); }
.mini-stat--done .mini-stat__num, .mini-stat--done .mini-stat__icon { color: var(--green); }

/* 배정 아바타 스택 */
.avatar-stack { display: flex; align-items: center; }
.avatar-stack__item {
  width: 20px; height: 20px; border-radius: 50%;
  /* 겹친 아바타 사이를 갈라주는 링. 칩 배경과 같은 색이어야 파인 것처럼 보인다 */
  border: 2px solid var(--gray-bg);
  display: flex; align-items: center; justify-content: center;
  font-size: calc(9.5px + var(--font-size-offset)); font-weight: 700;
  /* 목업 그대로 --color-text-inverse를 쓴다(§9 확정). 배경은 테마 무관 고정 팔레트(avatarPalette)인데
     이 토큰은 다크 컨셉에서 어두운 색(#141413)이 된다 — 팔레트 색마다 대비가 갈리므로
     §11-11 육안 확인 대상이다. 안 읽히면 그때 #fff 고정으로 바꾼다 */
  color: var(--color-text-inverse); margin-left: -6px;
}
.avatar-stack__item:first-child { margin-left: 0; }
/* +N은 인원수 표기라 팔레트 색을 쓰지 않는다. 목업은 인라인 style을 이기려고 !important를
   썼지만 우리 +N 배지에는 :style 바인딩이 없어 필요 없다 */
.avatar-stack__more { background: var(--lnb-logo); }

/* 상태 뱃지 — 5분류. 라벨은 useCode('STATUS'), 색 분류는 toStageType */
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

/* 내 할 일 테이블 — .listcard는 전역(components.css:73)이 카드 질감을 준다 */
.tbl { width: 100%; border-collapse: collapse; font-size: calc(12.5px + var(--font-size-offset)); }
.tbl thead th {
  background: var(--lnb-hover); color: var(--lnb-txt); font-weight: 600; text-align: center;
  padding: 9px 12px; border-bottom: 1px solid var(--lnb-line); white-space: nowrap;
}
.tbl tbody td { padding: 11px 12px; border-bottom: 1px solid var(--lnb-line); color: var(--lnb-txt); }
/* 마지막 행 밑줄을 지운다 — .listcard 테두리와 겹쳐 이중선이 된다 */
.tbl tbody tr:last-child td { border-bottom: none; }
.tbl tbody tr.click { cursor: pointer; }
.tbl tbody tr.click:hover { background: var(--teal-50); }
/* SB-PAG-M-MY-01-R08 — 금주 마감·지연 행 빨간 테두리 강조(목업에 없는 우리 규칙) */
.tbl tbody tr.row--alert td { box-shadow: inset 0 0 0 1px var(--red); }
.tbl tbody tr.row--alert td:first-child { box-shadow: inset 2px 0 0 var(--red), inset 0 1px 0 var(--red), inset 0 -1px 0 var(--red); }
.tbl tbody tr.row--alert td:last-child { box-shadow: inset -2px 0 0 var(--red), inset 0 1px 0 var(--red), inset 0 -1px 0 var(--red); }
.ell { max-width: 0; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.due-cell { white-space: nowrap; }
.dday { color: var(--lnb-muted); }
/* .dday 뒤에 온다 — 지연이면 D-day도 빨강으로 덮는다 */
.delay { color: var(--red); font-weight: 700; }

/* 대기 카드 */
.wcard {
  width: 100%; text-align: left; font: inherit; color: inherit; cursor: pointer;
  background: var(--lnb-side); border: 1px solid var(--lnb-line);
  border-radius: var(--radius-lg); padding: 14px 16px;
}
.wcard:hover { border-color: var(--lnb-logo); }
.wcard__meta { font-size: calc(11.5px + var(--font-size-offset)); color: var(--lnb-muted); margin-bottom: 8px; }
.wcard__name { font-size: calc(13.5px + var(--font-size-offset)); font-weight: 700; margin-bottom: 10px; }

.empty {
  background: var(--lnb-side); border: 1px dashed var(--lnb-line); border-radius: var(--radius-lg);
  padding: 22px; color: var(--lnb-muted); font-size: calc(12.5px + var(--font-size-offset));
}
/* 목업은 문구 앞에 "• "를 박아놨다. 문구 자체를 바꾸면 기획 소관이 되므로 CSS로 붙인다 —
   보이는 결과는 목업과 같고 textContent는 그대로라 spec도 안 깨진다 */
.empty::before { content: '• '; }

.more-cell { text-align: center; }
.more-btn {
  border: none; background: transparent; line-height: 1; cursor: pointer;
  font-size: calc(18px + var(--font-size-offset)); color: var(--lnb-muted);
  padding: 2px 6px; border-radius: var(--radius-sm);
}
.more-btn:hover { background: var(--lnb-hover); color: var(--lnb-logo); }
</style>
