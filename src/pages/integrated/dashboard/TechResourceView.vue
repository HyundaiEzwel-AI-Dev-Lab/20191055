<script setup>
// PAG-M-DAS-04 테크 리소스 관리
import { computed, ref } from 'vue'
import { useRouter } from 'vue-router'
import {
  techResourceMeta,
  techResourceRecords,
  deptOptions,
  stageOptions,
  scheduleOptions,
  getDelayTasks,
} from '@/entities/dashboard/mock/techResource'
import { pageSizeOptions } from '@/shared/lib/commonOptions'
import DelayTaskModal from '@/pages/integrated/dashboard/DelayTaskModal.vue'
import BaseTooltip from '@/shared/ui/BaseTooltip.vue'
import SearchFilterBar from '@/shared/ui/SearchFilterBar.vue'
import FilterSelectPill from '@/shared/ui/FilterSelectPill.vue'
import FilterTextPill from '@/shared/ui/FilterTextPill.vue'
import { useProjectStore } from '@/app/stores/project'

const router = useRouter()
const projectStore = useProjectStore()

const filterExpanded = ref(false)
const pageSize = ref(20)
const currentPage = ref(1)
const filters = ref({
  dept: '전체',
  member: '',
  project: '',
  stage: '전체',
  schedule: '전체',
})

const appliedFilters = ref({ ...filters.value })

const showDelayModal = ref(false)
const delayModalData = ref(null)
const hoverCompleted = ref(null)

const filteredRecords = computed(() => {
  const f = appliedFilters.value
  const selectedProject = f.project.trim()

  return techResourceRecords
    .filter((row) => {
      if (f.dept !== '전체' && row.dept !== f.dept) return false
      if (f.member) {
        const q = f.member.toLowerCase()
        if (!row.name.includes(q) && !row.empId.includes(q)) return false
      }
      if (selectedProject) {
        const hasProject = row.projects.some((p) => p.name.includes(selectedProject))
        if (!hasProject) return false
      }
      if (f.stage !== '전체') {
        const hasStage = row.projects.some((p) => p.stage === f.stage)
        if (!hasStage && row.projectCount > 0) return false
      }
      if (f.schedule === '경과') {
        const hasDelay = row.projects.some((p) => p.scheduleStatus === 'delay')
        if (!hasDelay) return false
      }
      if (f.schedule === '정상') {
        const allNormal = row.projects.length > 0 && row.projects.every(
          (p) => p.scheduleStatus === 'normal' || p.scheduleStatus === 'short' || p.scheduleStatus === 'none',
        )
        if (!allNormal) return false
      }
      return true
    })
    .map((row) => {
      if (!selectedProject) return row
      const sortedProjects = [...row.projects].sort((a, b) => {
        const aMatch = a.name.includes(selectedProject) ? 0 : 1
        const bMatch = b.name.includes(selectedProject) ? 0 : 1
        if (aMatch !== bMatch) return aMatch - bMatch
        return a.scheduledOpenDate.localeCompare(b.scheduledOpenDate)
      })
      return {
        ...row,
        projects: sortedProjects.map((p) => ({
          ...p,
          highlighted: p.name.includes(selectedProject),
        })),
      }
    })
})

const pagedRecords = computed(() => {
  const start = (currentPage.value - 1) * pageSize.value
  return filteredRecords.value.slice(start, start + pageSize.value)
})

const summary = computed(() => {
  const list = filteredRecords.value
  const assignedCount = list.filter((r) => r.projectCount > 0).length
  const projectCount = list.reduce((sum, r) => sum + r.projectCount, 0)
  return {
    queryCount: list.length,
    assignedCount,
    assignmentRate: list.length ? Math.round((assignedCount / list.length) * 100) : 0,
    projectCount,
  }
})

const totalPages = computed(() =>
  Math.max(1, Math.ceil(filteredRecords.value.length / pageSize.value)),
)

function onPageSizeChange() {
  currentPage.value = 1
}

function resetFilters() {
  filters.value = {
    dept: '전체',
    member: '',
    project: '',
    stage: '전체',
    schedule: '전체',
  }
}

function search() {
  appliedFilters.value = { ...filters.value }
  currentPage.value = 1
}

const FILTER_TAG_META = [
  { key: 'dept', label: '부서', skip: (v) => !v || v === '전체' },
  { key: 'member', label: '담당자' },
  { key: 'project', label: '프로젝트' },
  { key: 'stage', label: '프로젝트 상태', skip: (v) => !v || v === '전체' },
  { key: 'schedule', label: '계획준수', skip: (v) => !v || v === '전체' },
]

const filterTags = computed(() => {
  const f = appliedFilters.value
  return FILTER_TAG_META
    .filter((m) => {
      const v = f[m.key]
      if (m.skip) return !m.skip(v)
      return v !== '' && v != null
    })
    .map((m) => ({ key: m.key, label: m.label, value: String(f[m.key]) }))
})

const FILTER_CLEAR_DEFAULTS = {
  dept: '전체',
  member: '',
  project: '',
  stage: '전체',
  schedule: '전체',
}

function removeFilterTag(key) {
  const cleared = FILTER_CLEAR_DEFAULTS[key] ?? ''
  filters.value[key] = cleared
  appliedFilters.value[key] = cleared
  search()
}

function onDelayClick(personId, project) {
  const data = getDelayTasks(personId, project.id)
  if (!data) return
  delayModalData.value = data
  showDelayModal.value = true
}

function onTaskCountClick(person, proj) {
  projectStore.setCurrentProject({ id: proj.id, name: proj.name, stage: proj.stage })
  router.push({ path: '/workspace/wbs', query: { assignee: person.name } })
}

function formatPlanMd(md) {
  return md != null ? `${md} MD` : '-'
}

function formatExecProgress(progress) {
  return progress != null ? `${progress}%` : '-'
}
</script>

<template>
  <div class="tech-resource">
    <div class="tech-resource__hint">
      <span class="tech-resource__hint-icon">ⓘ</span>
      <div class="tech-resource__hint-body">
        <p>{{ techResourceMeta.notice }}</p>
      </div>
    </div>

    <!-- 검색조건 -->
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
          label="부서"
          v-model="filters.dept"
          :options="deptOptions"
          empty-label="전체"
        />
        <FilterTextPill
          label="담당자"
          v-model="filters.member"
          placeholder="이름 또는 사번"
          @enter="search"
        />
        <FilterTextPill
          label="프로젝트"
          v-model="filters.project"
          placeholder="프로젝트명 또는 ID"
          @enter="search"
        />
      </template>
      <template #expand>
        <FilterSelectPill
          label="프로젝트 상태"
          v-model="filters.stage"
          :options="stageOptions"
          empty-label="전체"
        />
        <FilterSelectPill
          label="계획준수"
          v-model="filters.schedule"
          :options="scheduleOptions"
          empty-label="전체"
        />
      </template>
    </SearchFilterBar>

    <p class="tech-resource__query-time">조회시점 {{ techResourceMeta.queryTime }}</p>

    <!-- 현황 분석 KPI -->
    <section class="kpi-row card pad">
      <div class="kpi kpi--neutral">
        <span class="kpi__dot"></span>
        <span class="kpi__body">
          <span class="kpi__lab">조회 인원</span>
          <span class="kpi__num">{{ summary.queryCount }}<small>명</small></span>
        </span>
      </div>
      <div class="kpi kpi--blue">
        <span class="kpi__dot"></span>
        <span class="kpi__body">
          <span class="kpi__lab">투입 인원</span>
          <span class="kpi__num">{{ summary.assignedCount }}<small>명</small></span>
        </span>
      </div>
      <div class="kpi kpi--teal">
        <span class="kpi__dot"></span>
        <span class="kpi__body">
          <span class="kpi__lab">
            투입율
            <BaseTooltip text="투입률 : 투입인원 / 조회인원 x 100" />
          </span>
          <span class="kpi__num">{{ summary.assignmentRate }}<small>%</small></span>
        </span>
      </div>
      <div class="kpi kpi--purple">
        <span class="kpi__dot"></span>
        <span class="kpi__body">
          <span class="kpi__lab">진행 프로젝트</span>
          <span class="kpi__num">{{ summary.projectCount }}<small>건</small></span>
        </span>
      </div>
    </section>

    <!-- 인력별 투입 현황 -->
    <section class="card listcard">
      <div class="listcard__head">
        <h3 class="sec-title">인력별 투입 현황</h3>
        <span class="listcard__cnt">총 <b>{{ filteredRecords.length }}</b>명</span>
        <select v-model="pageSize" class="listcard__pagesize" @change="onPageSizeChange">
          <option v-for="n in pageSizeOptions" :key="n" :value="n">{{ n }}건씩 보기</option>
        </select>
      </div>
      <div class="listcard__scroll">
        <table class="tbl tbl--grouped">
          <thead>
            <tr>
              <th rowspan="2">No.</th>
              <th colspan="3">인력 정보</th>
              <th colspan="2">투입 프로젝트</th>
              <th colspan="4">프로젝트</th>
              <th colspan="4">투입 현황</th>
            </tr>
            <tr class="tbl__subhead">
              <th>부서</th>
              <th>담당자</th>
              <th>직급</th>
              <th>진행 프로젝트</th>
              <th>계획 공수 합</th>
              <th>프로젝트명</th>
              <th>처리단계</th>
              <th>공정률</th>
              <th>오픈예정일</th>
              <th>계획 공수</th>
              <th>담당 업무 수</th>
              <th>실행 공정률</th>
              <th>계획 준수</th>
            </tr>
          </thead>
          <tbody>
            <template v-for="person in pagedRecords" :key="person.id">
              <template v-if="person.projects.length === 0">
                <tr class="tbl__row">
                  <td>{{ person.no }}</td>
                  <td>{{ person.dept }}</td>
                  <td class="tbl__person">
                    {{ person.name }}
                    <span class="tbl__emp">({{ person.empId }})</span>
                  </td>
                  <td>{{ person.position }}</td>
                  <td>0건</td>
                  <td>-</td>
                  <td colspan="8" class="tbl__empty">투입 프로젝트 없음</td>
                </tr>
              </template>
              <tr
                v-for="(proj, pIdx) in person.projects"
                v-else
                :key="`${person.id}-${pIdx}`"
                class="tbl__row"
                :class="{ 'tbl__row--highlight': proj.highlighted }"
              >
                <template v-if="pIdx === 0">
                  <td :rowspan="person.projects.length">{{ person.no }}</td>
                  <td :rowspan="person.projects.length">{{ person.dept }}</td>
                  <td :rowspan="person.projects.length" class="tbl__person">
                    {{ person.name }}
                    <span class="tbl__emp">({{ person.empId }})</span>
                  </td>
                  <td :rowspan="person.projects.length">{{ person.position }}</td>
                  <td :rowspan="person.projects.length">{{ person.projectCount }}건</td>
                  <td :rowspan="person.projects.length">{{ formatPlanMd(person.totalPlanMd) }}</td>
                </template>
                <td class="tbl__proj">{{ proj.name }}</td>
                <td>
                  <span class="stbadge" :class="proj.stageType">{{ proj.stage }}</span>
                </td>
                <td>
                  <div class="prog-wrap">
                    <div class="bar">
                      <i :style="{ width: `${proj.progress}%` }"></i>
                    </div>
                    <span>{{ proj.progress }}%</span>
                  </div>
                </td>
                <td>
                  <span v-if="proj.dDay" :class="{ 'tbl__date--urgent': proj.dDay === 'D-7' }">
                    {{ proj.scheduledOpenDate }}<br />
                    <small>{{ proj.dDay }}</small>
                  </span>
                  <span v-else>{{ proj.scheduledOpenDate }}</span>
                </td>
                <td>{{ formatPlanMd(proj.planMd) }}</td>
                <td>
                  <button
                    v-if="proj.taskCount > 0"
                    type="button"
                    class="tbl__link"
                    @click="onTaskCountClick(person, proj)"
                  >
                    {{ proj.taskCount }}건
                  </button>
                  <span v-else>-</span>
                </td>
                <td
                  class="tbl__exec"
                  @mouseenter="proj.execProgress === 100 && proj.completedDate ? hoverCompleted = `${person.id}-${pIdx}` : null"
                  @mouseleave="hoverCompleted = null"
                >
                  {{ formatExecProgress(proj.execProgress) }}
                  <span
                    v-if="hoverCompleted === `${person.id}-${pIdx}`"
                    class="tbl__tooltip"
                  >
                    실행 완료일 {{ proj.completedDate }}
                  </span>
                </td>
                <td>
                  <button
                    v-if="proj.scheduleStatus === 'delay'"
                    type="button"
                    class="delay-badge"
                    @click="onDelayClick(person.id, proj)"
                  >
                    경과 ({{ proj.delayCount }}개)
                  </button>
                </td>
              </tr>
            </template>
            <tr v-if="!pagedRecords.length">
              <td colspan="14" class="tbl__empty-all">조회된 데이터가 없습니다.</td>
            </tr>
          </tbody>
        </table>
      </div>
      <div class="pager">
        <button
          type="button"
          class="pager__pg"
          :disabled="currentPage <= 1"
          @click="currentPage = Math.max(1, currentPage - 1)"
        >
          «
        </button>
        <button
          v-for="p in totalPages"
          :key="p"
          type="button"
          class="pager__pg"
          :class="{ 'pager__pg--on': p === currentPage }"
          @click="currentPage = p"
        >
          {{ p }}
        </button>
        <button
          type="button"
          class="pager__pg"
          :disabled="currentPage >= totalPages"
          @click="currentPage = Math.min(totalPages, currentPage + 1)"
        >
          »
        </button>
      </div>
    </section>

    <DelayTaskModal v-model="showDelayModal" :data="delayModalData" />
  </div>
</template>

<style scoped>
.tech-resource {
  font-family: var(--font-family);
  color: var(--lnb-txt);
  padding: 0 24px 28px;
}

.tech-resource__hint {
  display: flex;
  align-items: flex-start;
  gap: 10px;
  margin: 0 0 16px;
  padding: 12px 16px;
  background: var(--teal-50);
  border: 1px solid var(--teal-100);
  border-radius: 10px;
}

.tech-resource__hint-icon {
  flex-shrink: 0;
  width: 18px;
  line-height: 1.5;
  font-size: calc(13px + var(--font-size-offset, 0px));
  color: var(--teal-600);
}

.tech-resource__hint-body {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.tech-resource__hint-body p {
  margin: 0;
  font-size: calc(12px + var(--font-size-offset, 0px));
  font-weight: 500;
  line-height: 1.5;
  color: var(--lnb-txt);
}

.tech-resource__query-time {
  margin: -4px 0 16px;
  font-size: calc(11px + var(--font-size-offset, 0px));
  font-weight: 500;
  color: var(--lnb-muted);
}

.card {
  background: var(--lnb-side);
  border: 1px solid var(--lnb-line);
  border-radius: 14px;
  box-shadow: var(--shadow-sm);
}

.pad {
  padding: 14px 16px;
}

.sec-title {
  position: relative;
  margin: 0 0 12px;
  padding-left: 10px;
  font-size: calc(13px + var(--font-size-offset, 0px));
  font-weight: 700;
  color: var(--lnb-txt);
  padding-bottom: 10px;
  border-bottom: 1px solid var(--lnb-line);
}

.sec-title::before {
  content: '';
  position: absolute;
  left: 0;
  top: 1px;
  bottom: 1px;
  width: 3px;
  border-radius: 2px;
  background: var(--teal);
}

.kpi-row {
  display: flex;
  gap: 12px;
  margin-bottom: 16px;
}

.kpi {
  flex: 1;
  display: flex;
  align-items: center;
  gap: 10px;
  border: none;
  border-radius: 14px;
  padding: 16px 16px 14px;
  transition: transform var(--transition-fast);
}

.kpi:hover {
  transform: translateY(-2px);
}

.kpi__dot {
  flex-shrink: 0;
  width: 10px;
  height: 10px;
  border-radius: 50%;
  background: currentColor;
}

.kpi__body {
  display: flex;
  align-items: baseline;
  gap: 8px;
  flex-wrap: wrap;
}

.kpi__lab {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  font-size: calc(11.5px + var(--font-size-offset, 0px));
  color: currentColor;
  opacity: 0.75;
  font-weight: 600;
}

.kpi__num {
  display: inline-block;
  font-size: calc(22px + var(--font-size-offset, 0px));
  font-weight: 800;
  color: currentColor;
}

.kpi__num small {
  font-size: calc(13px + var(--font-size-offset, 0px));
  font-weight: 600;
  margin-left: 2px;
}

.kpi--neutral { background: var(--gray-bg); color: var(--lnb-logo); }
.kpi--blue { background: var(--blue-bg); color: var(--blue); }
.kpi--teal { background: var(--teal-50); color: var(--teal-600); }
.kpi--purple { background: var(--purple-bg); color: var(--purple); }

.listcard {
  overflow: hidden;
}

.listcard__head {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 14px 16px 0;
  padding-bottom: 12px;
  border-bottom: 1px solid var(--lnb-line);
}

.listcard__head .sec-title {
  margin: 0;
}

.listcard__cnt {
  font-size: calc(12px + var(--font-size-offset, 0px));
}

.listcard__cnt b {
  color: var(--teal-600);
}

.listcard__pagesize {
  margin-left: auto;
  height: 28px;
  border: 1px solid var(--lnb-line);
  border-radius: var(--radius-sm, 6px);
  padding: 0 8px;
  font-size: calc(11.5px + var(--font-size-offset, 0px));
  font-family: inherit;
  background: var(--lnb-side);
  color: var(--lnb-txt);
}

.listcard__scroll {
  overflow-x: auto;
}

.tbl {
  width: 100%;
  border-collapse: collapse;
  font-size: calc(12px + var(--font-size-offset, 0px));
}

.tbl thead th {
  background: var(--lnb-hover);
  color: var(--lnb-txt);
  font-weight: 600;
  text-align: center;
  padding: 9px 10px;
  border-bottom: 1px solid var(--lnb-line);
  white-space: nowrap;
}

.tbl__subhead th {
  font-size: calc(11px + var(--font-size-offset, 0px));
  font-weight: 500;
  padding: 7px 8px;
}

.tbl tbody td {
  padding: 10px 10px;
  border-bottom: 1px solid var(--color-border-2);
  color: var(--lnb-txt);
  vertical-align: middle;
  text-align: center;
}

.tbl tbody tr:last-child td {
  border-bottom: none;
}

.tbl__row:hover {
  background: var(--teal-50);
}

.tbl__person {
  font-weight: 600;
  text-align: left;
}

.tbl__emp {
  display: block;
  font-size: calc(10.5px + var(--font-size-offset, 0px));
  color: var(--lnb-muted);
  font-weight: 400;
}

.tbl__proj {
  text-align: left;
  max-width: 220px;
  line-height: 1.4;
}

.tbl__empty {
  color: var(--lnb-muted);
  text-align: left;
}

.tbl__empty-all {
  padding: 32px 10px;
  text-align: center;
  color: var(--lnb-muted);
}

.tbl__link {
  border: none;
  background: none;
  padding: 0;
  font: inherit;
  color: var(--teal-600);
  text-decoration: underline;
  text-underline-offset: 2px;
  cursor: pointer;
}

.tbl__date--urgent {
  color: var(--red);
  font-weight: 700;
}

.tbl__date--urgent small {
  font-weight: 600;
}

.tbl__exec {
  position: relative;
}

.tbl__tooltip {
  position: absolute;
  left: 50%;
  top: calc(100% + 6px);
  transform: translateX(-50%);
  background: var(--lnb-side);
  border: 1px solid var(--lnb-line);
  color: var(--lnb-txt);
  font-size: calc(11px + var(--font-size-offset, 0px));
  font-weight: 500;
  padding: 8px 12px;
  border-radius: var(--radius-md);
  box-shadow: var(--shadow-md);
  white-space: nowrap;
  z-index: 20;
  pointer-events: none;
}

.prog-wrap {
  display: flex;
  align-items: center;
  gap: 6px;
  min-width: 90px;
}

.bar {
  flex: 1;
  height: 6px;
  background: var(--line-2);
  border-radius: 6px;
  overflow: hidden;
  min-width: 50px;
}

.bar i {
  display: block;
  height: 100%;
  background: linear-gradient(90deg, var(--teal), var(--teal-600));
}

.stbadge {
  font-size: calc(11px + var(--font-size-offset, 0px));
  font-weight: 700;
  padding: 3px 9px;
  border-radius: 20px;
  display: inline-block;
  white-space: nowrap;
}

.stbadge.recv { color: var(--gray); background: var(--gray-bg); }
.stbadge.prog { color: var(--blue); background: var(--blue-bg); }
.stbadge.test { color: var(--orange); background: var(--orange-bg); }

.delay-badge {
  border: none;
  background: none;
  padding: 0;
  font: inherit;
  font-size: calc(11px + var(--font-size-offset, 0px));
  font-weight: 700;
  color: var(--red);
  text-decoration: underline;
  cursor: pointer;
  white-space: nowrap;
}

.pager {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 4px;
  padding: 16px;
}

.pager__pg {
  min-width: 28px;
  height: 28px;
  border-radius: 7px;
  border: 1px solid var(--lnb-line);
  background: var(--lnb-side);
  color: var(--lnb-txt);
  font-size: calc(12px + var(--font-size-offset, 0px));
  cursor: pointer;
  font-family: inherit;
}

.pager__pg--on {
  background: var(--teal);
  border-color: var(--teal);
  color: var(--color-text-inverse);
  font-weight: 700;
}

.pager__pg:disabled {
  opacity: 0.4;
  cursor: not-allowed;
}

.pager__info {
  font-size: calc(11px + var(--font-size-offset, 0px));
  color: var(--lnb-muted);
  margin-left: 8px;
}

@media (max-width: 1200px) {
  .kpi-row {
    flex-wrap: wrap;
  }
  .kpi {
    min-width: calc(50% - 6px);
  }
}
</style>
