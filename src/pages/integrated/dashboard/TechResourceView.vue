<script setup>
import { computed, onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import {
  techResourceMeta,
  techResourceRecords,
  deptOptions as mockDeptOptions,
  stageOptions as mockStageOptions,
  scheduleOptions,
  getDelayTasks,
} from '@/entities/dashboard/mock/techResource'
import { pageSizeOptions } from '@/shared/lib/commonOptions'
import { mockExcelDownload } from '@/shared/file-excel/excelDownload'
import DelayTaskModal from '@/pages/integrated/dashboard/DelayTaskModal.vue'
import BaseTooltip from '@/shared/ui/BaseTooltip.vue'
import SearchFilterBar from '@/shared/ui/SearchFilterBar.vue'
import FilterSelectPill from '@/shared/ui/FilterSelectPill.vue'
import FilterTextPill from '@/shared/ui/FilterTextPill.vue'
import HpPagination from '@/shared/ui/HpPagination.vue'
import { useProjectStore } from '@/app/stores/project'

const router = useRouter()
const projectStore = useProjectStore()

const STATUS_BADGE_CLASS = {
  RECEIVED: 'recv',
  NEGOTIATING: 'recv',
  PROCESSING: 'prog',
  IN_PROGRESS: 'prog',
  TESTING: 'test',
  COMPLETED: 'done',
  REJECTED: 'rej',
  recv: 'recv',
  prog: 'prog',
  test: 'test',
}

const STAGE_CODE_MAP = {
  접수: 'RECEIVED',
  협의중: 'NEGOTIATING',
  처리중: 'PROCESSING',
  테스트: 'TESTING',
}

const notice = techResourceMeta.notice

function mapScheduleStatus(status) {
  if (status === 'delay') return 'DELAYED'
  return 'NORMAL'
}

function mapProject(p, personId) {
  return {
    projectId: p.id,
    projectNo: p.id,
    name: p.name,
    statusCode: STAGE_CODE_MAP[p.stage] || p.stageType?.toUpperCase() || 'PROCESSING',
    statusName: p.stage,
    progress: p.progress,
    openDate: p.scheduledOpenDate,
    dDay: p.dDay,
    planMd: p.planMd,
    taskCount: p.taskCount,
    execProgress: p.execProgress,
    lastActualEnd: p.completedDate,
    scheduleStatus: mapScheduleStatus(p.scheduleStatus),
    delayCount: p.delayCount,
  }
}

function mapPerson(row) {
  return {
    assigneeId: row.id,
    name: row.name,
    empNo: row.empId,
    dept: row.dept,
    position: row.position,
    projectCount: row.projectCount,
    totalPlanMd: row.totalPlanMd,
    projects: row.projects.map((p) => mapProject(p, row.id)),
  }
}

const sourcePersons = techResourceRecords.map(mapPerson)
const projectCatalog = []
sourcePersons.forEach((person) => {
  person.projects.forEach((p) => {
    if (!projectCatalog.some((x) => x.id === p.projectId)) {
      projectCatalog.push({ id: p.projectId, projectNo: p.projectId, name: p.name })
    }
  })
})

const asOf = ref(techResourceMeta.queryTime)
const summary = ref({ queryCount: 0, assignedCount: 0, assignmentRate: 0, projectCount: 0 })
const records = ref([])
const recordsTotal = ref(0)
const totalPages = ref(1)
const deptOptions = ref([...mockDeptOptions])
const stageOptions = ref([
  { code: 'ALL', name: '전체' },
  ...mockStageOptions.filter((s) => s !== '전체').map((s) => ({ code: STAGE_CODE_MAP[s] || s, name: s })),
])

const filterExpanded = ref(false)
const pageSize = ref(20)
const currentPage = ref(1)
const barsFilled = ref(false)
const projectHint = ref(false)
const projectCandidates = ref([])
const projectSuggestOpen = ref(false)
let projectSearchTimer = null

const defaultFilters = {
  dept: '전체',
  member: '',
  projectId: null,
  projectLabel: '',
  stage: 'ALL',
  schedule: '전체',
}
const filters = ref({ ...defaultFilters })
const appliedFilters = ref({ ...defaultFilters })

const showDelayModal = ref(false)
const delayModalData = ref(null)

const recordsEmptyMessage = computed(() => {
  if (appliedFilters.value.member && recordsTotal.value === 0) {
    return '담당자는 이름 또는 사번을 정확히 입력해야 조회됩니다'
  }
  return '조회 결과가 없습니다.'
})

const showHomonymHint = computed(() => Boolean(appliedFilters.value.member) && recordsTotal.value >= 2)

function startBarAnimation() {
  requestAnimationFrame(() => {
    setTimeout(() => {
      barsFilled.value = true
    }, 60)
  })
}

function computeSummary(list) {
  const assignedCount = list.filter((r) => r.projectCount > 0).length
  const projectCount = list.reduce((sum, r) => sum + r.projectCount, 0)
  return {
    queryCount: list.length,
    assignedCount,
    assignmentRate: list.length ? Math.round((assignedCount / list.length) * 100) : 0,
    projectCount,
  }
}

function filterPersons() {
  const f = appliedFilters.value
  return sourcePersons.filter((row) => {
    if (f.dept !== '전체' && row.dept !== f.dept) return false
    if (f.member) {
      const q = f.member.toLowerCase()
      if (!row.name.includes(q) && !String(row.empNo).includes(q)) return false
    }
    if (f.projectId != null) {
      const hasProject = row.projects.some((p) => p.projectId === f.projectId)
      if (!hasProject) return false
    }
    if (f.stage !== 'ALL') {
      const hasStage = row.projects.some((p) => p.statusCode === f.stage)
      if (!hasStage && row.projectCount > 0) return false
    }
    if (f.schedule === '경과') {
      const hasDelay = row.projects.some((p) => p.scheduleStatus === 'DELAYED')
      if (!hasDelay) return false
    }
    if (f.schedule === '정상') {
      const allNormal = row.projects.length > 0 && row.projects.every((p) => p.scheduleStatus !== 'DELAYED')
      if (!allNormal) return false
    }
    return true
  })
}

function loadBundle() {
  barsFilled.value = false
  const list = filterPersons()
  summary.value = computeSummary(list)
  recordsTotal.value = list.length
  totalPages.value = Math.max(1, Math.ceil(list.length / pageSize.value))
  if (currentPage.value > totalPages.value) currentPage.value = totalPages.value
  const start = (currentPage.value - 1) * pageSize.value
  records.value = list.slice(start, start + pageSize.value)
  startBarAnimation()
}

onMounted(loadBundle)

watch(currentPage, () => loadBundle())
watch(pageSize, () => {
  if (currentPage.value !== 1) currentPage.value = 1
  else loadBundle()
})

function formatAsOf(value) {
  if (!value) return ''
  return String(value).replace('T', ' ').replace('Z', '').slice(0, 16)
}

function onPageSizeChange() {
  currentPage.value = 1
  loadBundle()
}

function onProjectLabelChange(value) {
  filters.value.projectLabel = value
  onProjectLabelInput()
}

function onProjectLabelInput() {
  filters.value.projectId = null
  projectHint.value = false
  const keyword = filters.value.projectLabel.trim()
  if (projectSearchTimer) clearTimeout(projectSearchTimer)
  if (keyword.length < 2) {
    projectCandidates.value = []
    projectSuggestOpen.value = false
    return
  }
  projectSearchTimer = setTimeout(() => {
    const q = keyword.toLowerCase()
    projectCandidates.value = projectCatalog.filter(
      (c) => c.name.toLowerCase().includes(q) || String(c.projectNo).toLowerCase().includes(q),
    )
    projectSuggestOpen.value = projectCandidates.value.length > 0
  }, 250)
}

function selectProjectCandidate(candidate) {
  filters.value.projectId = candidate.id
  filters.value.projectLabel = `${candidate.projectNo} ${candidate.name}`
  projectCandidates.value = []
  projectSuggestOpen.value = false
  projectHint.value = false
}

function clearProjectFilter() {
  filters.value.projectId = null
  filters.value.projectLabel = ''
  projectCandidates.value = []
  projectSuggestOpen.value = false
  projectHint.value = false
}

function resetFilters() {
  filters.value = { ...defaultFilters }
  appliedFilters.value = { ...defaultFilters }
  projectHint.value = false
  projectCandidates.value = []
  projectSuggestOpen.value = false
  currentPage.value = 1
  loadBundle()
}

function search() {
  projectHint.value = Boolean(filters.value.projectLabel.trim()) && filters.value.projectId == null
  appliedFilters.value = {
    ...filters.value,
    projectId: filters.value.projectId,
    projectLabel: filters.value.projectId ? filters.value.projectLabel : '',
  }
  currentPage.value = 1
  loadBundle()
}

const filterTags = computed(() => {
  const f = filters.value
  const tags = []
  if (f.stage && f.stage !== 'ALL') {
    const stageName = stageOptions.value.find((s) => s.code === f.stage)?.name ?? f.stage
    tags.push({ key: 'stage', label: '프로젝트 상태', value: stageName })
  }
  if (f.schedule && f.schedule !== '전체') {
    tags.push({ key: 'schedule', label: '계획준수', value: f.schedule })
  }
  return tags
})

function removeFilterTag(key) {
  if (key === 'stage') filters.value.stage = 'ALL'
  else if (key === 'schedule') filters.value.schedule = '전체'
}

function onDelayClick(person, proj) {
  const data = getDelayTasks(person.assigneeId, proj.projectId)
  if (!data) return
  delayModalData.value = data
  showDelayModal.value = true
}

function formatPlanMd(md) {
  return md != null ? `${md} MD` : '-'
}

function formatExecProgress(progress) {
  return progress != null ? `${progress}%` : '-'
}

function onTaskCountClick(person, proj) {
  projectStore.setCurrentProject({ id: proj.projectNo, name: proj.name })
  router.push({ path: '/workspace/wbs', query: { assignee: person.name } })
}

function onExcelDownload() {
  const rows = filterPersons().flatMap((person) =>
    person.projects.length
      ? person.projects.map((proj) => ({ person, proj }))
      : [{ person, proj: null }],
  )
  mockExcelDownload('인력별 투입 현황', rows, [
    { key: 'dept', label: '부서', value: (r) => r.person.dept },
    { key: 'name', label: '담당자', value: (r) => r.person.name },
    { key: 'position', label: '직급', value: (r) => r.person.position || '-' },
    { key: 'project', label: '프로젝트명', value: (r) => r.proj?.name || '-' },
    { key: 'stage', label: '처리단계', value: (r) => r.proj?.statusName || '-' },
    { key: 'progress', label: '공정률', value: (r) => (r.proj ? `${r.proj.progress}%` : '-') },
    { key: 'openDate', label: '오픈예정일', value: (r) => r.proj?.openDate || '-' },
    { key: 'taskCount', label: '업무 수', value: (r) => r.proj?.taskCount ?? '-' },
    { key: 'execProgress', label: '실행률', value: (r) => formatExecProgress(r.proj?.execProgress) },
  ])
}
</script>

<template>
  <div class="tech-resource hp-anim-enter">
    <p class="hint">{{ notice }}</p>

    <SearchFilterBar
      v-model:expanded="filterExpanded"
      :show-search="false"
      :applied-tags="filterTags"
      @reset="resetFilters"
      @search="search"
      @remove-tag="removeFilterTag"
    >
      <template #primary>
        <FilterSelectPill
          v-model="filters.dept"
          class="sfb-w-md"
          label="부서"
          :options="deptOptions"
        />
        <FilterTextPill
          v-model="filters.member"
          class="sfb-w-md"
          label="담당자"
          placeholder="이름 또는 사번"
          @enter="search"
        />
        <!-- 프로젝트는 이름 부분일치가 아니라 목록에서 고른 1건(projectId)만 조건이 된다.
             입력칸은 후보 검색용이다. -->
        <div class="project-suggest sfb-w-lg">
          <div class="project-suggest__search">
            <svg class="sfb__search-icon" viewBox="0 0 24 24" fill="none" aria-hidden="true">
              <circle cx="11" cy="11" r="7" stroke="currentColor" stroke-width="1.8" />
              <path d="M16.5 16.5L21 21" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" />
            </svg>
            <input
              class="sfb__search-input"
              type="text"
              :value="filters.projectLabel"
              placeholder="프로젝트명 또는 ID (2글자+)"
              @input="onProjectLabelChange($event.target.value)"
              @keyup.enter="search"
              @focus="projectSuggestOpen = projectCandidates.length > 0"
            />
            <button
              v-if="filters.projectLabel"
              type="button"
              class="project-suggest__clear"
              aria-label="프로젝트 필터 지우기"
              @click="clearProjectFilter"
            >×</button>
          </div>
          <ul v-if="projectSuggestOpen" class="project-suggest__list">
            <li v-for="c in projectCandidates" :key="c.id">
              <button type="button" @mousedown.prevent="selectProjectCandidate(c)">
                {{ c.projectNo }} {{ c.name }}
              </button>
            </li>
          </ul>
          <span v-if="projectHint" class="project-suggest__hint">
            목록에서 프로젝트를 선택해야 조건이 적용됩니다
          </span>
        </div>
      </template>

      <template #expand>
        <FilterSelectPill
          v-model="filters.stage"
          label="프로젝트 상태"
          fill
          :options="stageOptions.map((s) => ({ value: s.code, label: s.name }))"
        />
        <FilterSelectPill
          v-model="filters.schedule"
          label="계획준수"
          fill
          :options="scheduleOptions"
        />
      </template>
    </SearchFilterBar>

    <p class="query-time">조회시점 {{ formatAsOf(asOf) }}</p>

    <section class="card card--panel pad kpi-row">
      <div class="kpi kpi--neutral">
        <span class="kpi__dot"></span>
        <span class="kpi__body"><span class="kpi__lab">조회 인원</span><span class="kpi__num">{{ summary.queryCount }}<small>명</small></span></span>
      </div>
      <div class="kpi kpi--blue">
        <span class="kpi__dot"></span>
        <span class="kpi__body"><span class="kpi__lab">투입 인원 <BaseTooltip text="완료·반려를 제외한 진행 프로젝트가 1건 이상인 인원" /></span><span class="kpi__num">{{ summary.assignedCount }}<small>명</small></span></span>
      </div>
      <div class="kpi kpi--teal">
        <span class="kpi__dot"></span>
        <span class="kpi__body">
          <span class="kpi__lab">투입율 <BaseTooltip text="투입률 : 투입인원 / 조회인원 x 100 (진행 프로젝트 기준)" /></span>
          <span class="kpi__num">{{ summary.assignmentRate }}<small>%</small></span>
        </span>
      </div>
      <div class="kpi kpi--purple">
        <span class="kpi__dot"></span>
        <span class="kpi__body"><span class="kpi__lab">진행 프로젝트 <BaseTooltip text="완료·반려 제외 distinct 건수" /></span><span class="kpi__num">{{ summary.projectCount }}<small>건</small></span></span>
      </div>
    </section>

    <div class="listcard__head listcard__head--outside">
      <h3 class="sec-title">인력별 투입 현황</h3>
      <span>총 <b>{{ recordsTotal }}</b>명</span>
      <select v-model="pageSize" @change="onPageSizeChange">
        <option v-for="n in pageSizeOptions" :key="n" :value="n">{{ n }}건씩 보기</option>
      </select>
      <button type="button" class="ghost" @click="onExcelDownload">엑셀 다운로드</button>
    </div>
    <p v-if="showHomonymHint" class="homonym-hint homonym-hint--outside">동명이인이 있습니다. 사번으로 검색해 주세요</p>
    <section class="card card--panel listcard">
      <div class="listcard__scroll">
        <table class="data-table">
          <thead>
            <tr>
              <th>담당자</th>
              <th class="cell--center">진행/계획</th>
              <th>프로젝트명</th><th class="cell--center">처리단계</th><th class="cell--center">공정률</th><th class="cell--center">오픈예정일</th>
              <th class="cell--center">업무 수</th><th class="cell--center">실행률</th><th class="cell--center">계획 준수</th>
            </tr>
          </thead>
          <tbody>
            <tr v-if="!records.length">
              <td colspan="9" class="tbl__empty">{{ recordsEmptyMessage }}</td>
            </tr>
            <template v-for="person in records" :key="person.assigneeId">
              <tr v-if="person.projects.length === 0" class="tbl__row">
                <td class="tbl__person">{{ person.name }}<span class="tbl__emp">{{ person.dept }} · {{ person.position || '-' }}</span></td>
                <td class="cell--center">0건 / -</td>
                <td colspan="7" class="tbl__empty">투입 프로젝트 없음</td>
              </tr>
              <tr v-for="(proj, pIdx) in person.projects" v-else :key="`${person.assigneeId}-${proj.projectId}`" class="tbl__row">
                <template v-if="pIdx === 0">
                  <td :rowspan="person.projects.length" class="tbl__person">
                    {{ person.name }}<span class="tbl__emp">{{ person.dept }} · {{ person.position || '-' }}</span>
                  </td>
                  <td :rowspan="person.projects.length" class="cell--center">{{ person.projectCount }}건 / {{ formatPlanMd(person.totalPlanMd) }}</td>
                </template>
                <td class="tbl__proj">{{ proj.name }}</td>
                <td class="cell--center"><span class="stbadge" :class="STATUS_BADGE_CLASS[proj.statusCode] || 'recv'">{{ proj.statusName }}</span></td>
                <td class="cell--center">
                  <div class="prog-wrap">
                    <div class="bar hp-anim-progress" :class="{ 'is-filled': barsFilled }">
                      <i :style="{ width: barsFilled ? `${proj.progress}%` : '0%' }"></i>
                    </div>
                    <span>{{ proj.progress }}%</span>
                  </div>
                </td>
                <td class="cell--center">{{ proj.openDate || '-' }}<br v-if="proj.dDay" /><small v-if="proj.dDay">{{ proj.dDay }}</small></td>
                <td class="cell--center">
                  <button v-if="proj.taskCount > 0" type="button" class="tbl__link" @click="onTaskCountClick(person, proj)">{{ proj.taskCount }}건</button>
                  <span v-else>-</span>
                </td>
                <td class="cell--center">
                  <BaseTooltip
                    v-if="proj.lastActualEnd"
                    :text="`최종 실행완료일 ${proj.lastActualEnd}`"
                  >
                    <span class="exec-progress--tipped">{{ formatExecProgress(proj.execProgress) }}</span>
                  </BaseTooltip>
                  <template v-else>{{ formatExecProgress(proj.execProgress) }}</template>
                </td>
                <td class="cell--center">
                  <button v-if="proj.scheduleStatus === 'DELAYED'" type="button" class="delay-badge" @click="onDelayClick(person, proj)">
                    경과 ({{ proj.delayCount }}개)
                  </button>
                </td>
              </tr>
            </template>
          </tbody>
        </table>
      </div>
      <HpPagination v-model:page="currentPage" :total-pages="totalPages" />
    </section>

    <DelayTaskModal v-model="showDelayModal" :data="delayModalData" />
  </div>
</template>

<style scoped>
/* font-size는 --font-size-* 토큰 또는 calc(Npx + var(--font-size-offset))을 쓴다.
   rem은 --font-size-offset에 반응하지 않아 내설정>글자 크기가 먹지 않는다(layout.css:3-11 선례). */
.tech-resource { padding: 1rem 1.5rem 1.5rem; }
.hint { margin: 0 0 0.9rem; font-size: var(--font-size-xs); color: var(--lnb-muted); background: var(--lnb-hover); border: 1px solid var(--lnb-line); display: inline-block; padding: 0.15rem 0.6rem; border-radius: 999px; }
.query-time { margin: -0.4rem 0 0.9rem; font-size: var(--font-size-xs); color: var(--lnb-muted); }
.pad { padding: 0.9rem 1rem; }
.sec-title { margin: 0; font-size: calc(15.5px + var(--font-size-offset)); font-weight: 700; padding: 0; border-bottom: none; }
.sec-title::before { content: none; }
.ghost { height: 32px; padding: 0 0.9rem; border-radius: 7px; font-size: calc(12.5px + var(--font-size-offset)); cursor: pointer; background: var(--lnb-side); border: 1px solid var(--lnb-line); color: var(--lnb-txt); }
.project-suggest { position: relative; }
.project-suggest__search { position: relative; width: 100%; }
.project-suggest__search .sfb__search-input { padding-right: 30px; }
.project-suggest__clear { position: absolute; right: 8px; top: 50%; transform: translateY(-50%); border: none; background: none; color: var(--lnb-muted); cursor: pointer; font-size: var(--font-size-lg); line-height: 1; padding: 0 0.2rem; z-index: 1; }
.project-suggest__list { position: absolute; z-index: 5; left: 0; right: 0; top: calc(100% + 2px); margin: 0; padding: 0.25rem 0; list-style: none; background: var(--lnb-side); border: 1px solid var(--lnb-line); border-radius: 6px; max-height: 180px; overflow-y: auto; box-shadow: 0 4px 12px rgba(0,0,0,0.08); }
.project-suggest__list button { display: block; width: 100%; text-align: left; border: none; background: none; padding: 0.4rem 0.6rem; font: inherit; font-size: var(--font-size-sm); color: var(--lnb-txt); cursor: pointer; }
.project-suggest__list button:hover { background: var(--lnb-hover); }
.project-suggest__hint { display: block; margin-top: 0.2rem; color: var(--red); font-size: calc(10px + var(--font-size-offset)); }
.kpi-row { display: flex; gap: 12px; margin-bottom: var(--space-lg); }
.kpi { flex: 1; display: flex; align-items: center; gap: 10px; border: none; border-radius: var(--radius-card); padding: 16px 16px 14px; transition: transform var(--transition-fast); }
.kpi:hover { transform: translateY(-2px); }
.kpi__dot { flex-shrink: 0; width: 10px; height: 10px; border-radius: 50%; background: currentColor; }
.kpi__body { display: flex; align-items: baseline; gap: 8px; flex-wrap: wrap; }
.kpi__lab { display: inline-flex; align-items: center; gap: 4px; font-size: calc(11.5px + var(--font-size-offset)); color: currentColor; opacity: 0.75; font-weight: 600; }
.kpi__num { display: inline-block; font-size: calc(22px + var(--font-size-offset)); font-weight: 800; color: currentColor; }
.kpi__num small { font-size: var(--font-size-md); font-weight: 600; margin-left: 2px; }
.kpi--neutral { background: var(--gray-bg); color: var(--lnb-logo); }
.kpi--blue { background: var(--blue-bg); color: var(--blue); }
.kpi--teal { background: var(--teal-50); color: var(--teal-600); }
.kpi--purple { background: var(--purple-bg); color: var(--purple); }
.listcard__head { display: flex; align-items: center; gap: 0.5rem; padding: 0.9rem 1rem 0.75rem; font-size: var(--font-size-sm); border-bottom: 1px solid var(--lnb-line); }
.listcard__head select { height: 28px; border: 1px solid var(--lnb-line); border-radius: 6px; padding: 0 0.4rem; font-size: var(--font-size-xs); color: var(--lnb-txt); background: var(--lnb-side); }
.listcard__head span { margin-left: auto; }
.listcard__head--outside { padding: 0 0 10px; border-bottom: none; }
.homonym-hint { margin: 0; padding: 0.45rem 1rem 0; font-size: var(--font-size-xs); color: var(--orange); }
.homonym-hint--outside { padding: 0 0 10px; }
.listcard__scroll { overflow-x: auto; }
.tbl__person { font-weight: 600; text-align: left; }
.tbl__emp { display: block; font-size: calc(10px + var(--font-size-offset)); color: var(--lnb-muted); font-weight: 400; }
.tbl__proj { text-align: left; max-width: 220px; line-height: 1.4; }
.tbl__link { border: none; background: none; padding: 0; font: inherit; color: var(--teal-600); text-decoration: underline; text-underline-offset: 2px; cursor: pointer; }
.tbl__empty { color: var(--lnb-muted); text-align: left; }
.exec-progress--tipped { border-bottom: 1px dotted currentColor; cursor: default; }
.prog-wrap { display: flex; align-items: center; gap: 0.4rem; min-width: 90px; }
.bar { flex: 1; height: 6px; background: var(--lnb-hover); border-radius: 6px; overflow: hidden; min-width: 50px; }
/* 채움도 트랙과 같은 라운드를 받는다 — 없으면 끝단이 트랙 라운드에 잘려 뭉툭해진다. */
.bar i { display: block; height: 100%; border-radius: inherit; background: var(--teal); }
.stbadge { font-size: var(--font-size-xs); font-weight: 700; padding: 0.15rem 0.55rem; border-radius: 20px; display: inline-block; white-space: nowrap; }
.stbadge.recv { color: var(--lnb-muted); background: var(--lnb-hover); }
.stbadge.prog { color: var(--blue); background: var(--blue-bg); }
.stbadge.test { color: var(--orange); background: var(--orange-bg); }
.stbadge.done { color: var(--green); background: var(--green-bg); }
.stbadge.rej { color: var(--red); background: var(--red-bg); }
.delay-badge { border: none; background: none; padding: 0; font: inherit; font-size: var(--font-size-xs); font-weight: 700; color: var(--red); text-decoration: underline; cursor: pointer; white-space: nowrap; }

@media (max-width: 1200px) {
  .kpi-row { flex-wrap: wrap; }
  .kpi { min-width: calc(50% - 0.35rem); }
}
</style>
