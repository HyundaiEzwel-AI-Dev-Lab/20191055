<script setup>
// PAG-M-DAS-04 테크 리소스 관리
import { computed, ref } from 'vue'
import { useRouter } from 'vue-router'
import {
  techResourceMeta,
  techResourceSummary,
  techResourceRecords,
  deptOptions,
  stageOptions,
  scheduleOptions,
  getDelayTasks,
} from '@/data/techResource'
import DelayTaskModal from '@/components/dashboard/DelayTaskModal.vue'
import ExcelDownloadButton from '@/components/ui/ExcelDownloadButton.vue'
import { mockExcelDownload } from '@/utils/excelDownload'

const router = useRouter()

const filterExpanded = ref(false)
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

function resetFilters() {
  filters.value = {
    dept: '전체',
    member: '',
    project: '',
    stage: '전체',
    schedule: '전체',
  }
  appliedFilters.value = { ...filters.value }
}

function search() {
  appliedFilters.value = { ...filters.value }
}

function onExcelDownload() {
  mockExcelDownload('테크 리소스 관리', filteredRecords.value.length)
}

function onDelayClick(personId, project) {
  const data = getDelayTasks(personId, project.id)
  if (!data) return
  delayModalData.value = data
  showDelayModal.value = true
}

function onTaskCountClick() {
  router.push('/project/wbs')
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
    <p class="tech-resource__hint">
      {{ techResourceMeta.notice }}
      <span class="tech-resource__hint-sub">{{ techResourceMeta.chartNotice }}</span>
      · 조회시점 {{ techResourceMeta.queryTime }}
    </p>

    <!-- 검색조건 -->
    <section class="filter card">
      <div class="filter__row">
        <div class="filter__field">
          <label>부서</label>
          <select v-model="filters.dept" class="filter__select">
            <option v-for="d in deptOptions" :key="d" :value="d">{{ d }}</option>
          </select>
        </div>
        <div class="filter__field">
          <label>담당자</label>
          <input
            v-model="filters.member"
            class="filter__input"
            type="text"
            placeholder="이름 또는 사번"
          />
        </div>
        <div class="filter__field">
          <label>프로젝트</label>
          <input
            v-model="filters.project"
            class="filter__input"
            type="text"
            placeholder="프로젝트명 또는 ID"
          />
        </div>
      </div>

      <div v-if="filterExpanded" class="filter__row filter__row--expand">
        <div class="filter__field">
          <label>프로젝트 상태</label>
          <select v-model="filters.stage" class="filter__select">
            <option v-for="s in stageOptions" :key="s" :value="s">{{ s }}</option>
          </select>
        </div>
        <div class="filter__field">
          <label>계획준수</label>
          <select v-model="filters.schedule" class="filter__select">
            <option v-for="s in scheduleOptions" :key="s" :value="s">{{ s }}</option>
          </select>
        </div>
      </div>

      <button type="button" class="filter__expand" @click="filterExpanded = !filterExpanded">
        {{ filterExpanded ? '－ 검색조건 접기' : '＋ 검색조건 확장' }}
      </button>

      <div class="filter__actions">
        <button type="button" class="btn btn--ghost" @click="resetFilters">초기화</button>
        <button type="button" class="btn btn--primary" @click="search">조회</button>
      </div>
    </section>

    <!-- 현황 분석 KPI -->
    <section class="kpi-row card pad">
      <div class="kpi">
        <span class="kpi__lab">조회 인원</span>
        <span class="kpi__num">{{ techResourceSummary.queryCount }}<small>명</small></span>
      </div>
      <div class="kpi">
        <span class="kpi__lab">투입 인원</span>
        <span class="kpi__num kpi__num--blue">{{ techResourceSummary.assignedCount }}<small>명</small></span>
      </div>
      <div class="kpi">
        <span class="kpi__lab">투입율</span>
        <span class="kpi__num kpi__num--teal">{{ techResourceSummary.assignmentRate }}<small>%</small></span>
      </div>
      <div class="kpi">
        <span class="kpi__lab">진행 프로젝트</span>
        <span class="kpi__num kpi__num--orange">{{ techResourceSummary.projectCount }}<small>건</small></span>
      </div>
    </section>

    <!-- 인력별 투입 현황 -->
    <section class="card listcard">
      <div class="listcard__head">
        <h3 class="sec-title">인력별 투입 현황</h3>
        <span class="listcard__cnt">총 <b>{{ filteredRecords.length }}</b>명</span>
        <ExcelDownloadButton push-end @click="onExcelDownload" />
      </div>
      <div class="listcard__scroll">
        <table class="tbl tbl--grouped">
          <thead>
            <tr>
              <th rowspan="2">No.</th>
              <th colspan="3">인력 정보</th>
              <th colspan="2">투입 프로젝트</th>
              <th colspan="4">프로젝트</th>
              <th colspan="3">투입 현황</th>
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
            <template v-for="person in filteredRecords" :key="person.id">
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
                    @click="onTaskCountClick"
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
          </tbody>
        </table>
      </div>
      <div class="pager">
        <button type="button" class="pager__pg">«</button>
        <button type="button" class="pager__pg pager__pg--on">1</button>
        <button type="button" class="pager__pg">2</button>
        <button type="button" class="pager__pg">3</button>
        <button type="button" class="pager__pg">»</button>
        <span class="pager__info">100건씩 보기</span>
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
  margin: 0 0 14px;
  font-size: 11px;
  font-weight: 500;
  color: var(--lnb-muted);
  background: var(--lnb-side);
  border: 1px solid var(--lnb-line);
  display: inline-block;
  padding: 4px 12px;
  border-radius: var(--r-pill);
  line-height: 1.5;
}

.tech-resource__hint-sub {
  display: block;
  margin-top: 2px;
  font-size: 10.5px;
}

.card {
  background: var(--lnb-side);
  border: 1px solid var(--lnb-line);
  border-radius: 10px;
}

.pad {
  padding: 14px 16px;
}

.sec-title {
  margin: 0 0 12px;
  font-size: 13px;
  font-weight: 700;
  color: var(--lnb-txt);
}

.filter {
  padding: 14px 16px;
  margin-bottom: 14px;
}

.filter__row {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 10px 14px;
}

.filter__row--expand {
  margin-top: 10px;
  grid-template-columns: repeat(2, 1fr);
}

.filter__field {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.filter__field label {
  font-size: 11px;
  color: var(--lnb-muted);
  font-weight: 600;
}

.filter__input,
.filter__select {
  height: 32px;
  background: var(--lnb-hover);
  border: 1px solid var(--lnb-line);
  border-radius: 7px;
  padding: 0 10px;
  font-size: 12px;
  font-family: inherit;
  color: var(--lnb-txt);
}

.filter__input {
  background: #fff;
}

.filter__expand {
  margin-top: 8px;
  border: none;
  background: none;
  font-size: 11.5px;
  color: var(--teal-600);
  cursor: pointer;
  font-family: inherit;
  padding: 0;
}

.filter__actions {
  display: flex;
  justify-content: flex-end;
  gap: 8px;
  margin-top: 12px;
}

.btn {
  height: 32px;
  padding: 0 14px;
  border-radius: 7px;
  font-size: 12.5px;
  font-weight: 600;
  font-family: inherit;
  cursor: pointer;
  border: 1px solid transparent;
}

.btn--primary {
  background: var(--teal);
  color: #fff;
}

.btn--primary:hover {
  background: var(--teal-600);
}

.btn--ghost {
  background: var(--lnb-side);
  border-color: var(--lnb-line);
  color: var(--lnb-txt);
}

.btn--ghost:hover {
  border-color: var(--teal-100);
  color: var(--teal-600);
}

.kpi-row {
  display: flex;
  gap: 10px;
  margin-bottom: 14px;
}

.kpi {
  flex: 1;
  background: var(--lnb-side);
  border: 1px solid var(--lnb-line);
  border-radius: 10px;
  padding: 12px 14px;
}

.kpi__lab {
  font-size: 11.5px;
  color: var(--lnb-muted);
}

.kpi__num {
  display: block;
  font-size: 22px;
  font-weight: 800;
  margin-top: 2px;
  color: var(--lnb-logo);
}

.kpi__num small {
  font-size: 13px;
  font-weight: 600;
  margin-left: 2px;
}

.kpi__num--blue { color: var(--blue); }
.kpi__num--teal { color: var(--teal-600); }
.kpi__num--orange { color: var(--orange); }

.listcard {
  overflow: hidden;
}

.listcard__head {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 14px 16px 0;
}

.listcard__head .sec-title {
  margin: 0;
}

.listcard__cnt {
  margin-left: auto;
  font-size: 12px;
}

.listcard__cnt b {
  color: var(--teal-600);
}

.listcard__scroll {
  overflow-x: auto;
}

.tbl {
  width: 100%;
  border-collapse: collapse;
  font-size: 12px;
}

.tbl thead th {
  background: #fafbfc;
  color: var(--lnb-muted);
  font-weight: 600;
  text-align: center;
  padding: 9px 10px;
  border-bottom: 1px solid var(--lnb-line);
  white-space: nowrap;
}

.tbl__subhead th {
  font-size: 11px;
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

.tbl__row--highlight {
  background: var(--teal-50);
}

.tbl__row--highlight td {
  border-left: 3px solid var(--teal);
}

.tbl__person {
  font-weight: 600;
  text-align: left;
}

.tbl__emp {
  display: block;
  font-size: 10.5px;
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
  bottom: calc(100% + 6px);
  transform: translateX(-50%);
  background: var(--lnb-logo);
  color: #fff;
  font-size: 10.5px;
  padding: 4px 8px;
  border-radius: 6px;
  white-space: nowrap;
  z-index: 2;
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
  background: #eef1f3;
  border-radius: 6px;
  overflow: hidden;
  min-width: 50px;
}

.bar i {
  display: block;
  height: 100%;
  background: var(--teal);
}

.stbadge {
  font-size: 11px;
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
  font-size: 11px;
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
  font-size: 12px;
  cursor: pointer;
  font-family: inherit;
}

.pager__pg--on {
  background: var(--teal);
  border-color: var(--teal);
  color: #fff;
  font-weight: 700;
}

.pager__info {
  font-size: 11px;
  color: var(--lnb-muted);
  margin-left: 8px;
}

@media (max-width: 1200px) {
  .filter__row,
  .filter__row--expand {
    grid-template-columns: repeat(2, 1fr);
  }
  .kpi-row {
    flex-wrap: wrap;
  }
  .kpi {
    min-width: calc(50% - 5px);
  }
}
</style>
