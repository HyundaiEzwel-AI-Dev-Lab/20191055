<script setup>
// PAG-S-UAT-04 시나리오 편집 (전용 페이지)
import { computed, onMounted, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useTestContext } from '@/composables/useTestContext'
import { getScenarioEditGroups, saveScenarioCase } from '@/data/scenario'
import ScenarioLoadFromWbsModal from '@/components/test/ScenarioLoadFromWbsModal.vue'
import ScenarioCopyFromLibraryModal from '@/components/test/ScenarioCopyFromLibraryModal.vue'
import ScenarioScreenSearchModal from '@/components/test/ScenarioScreenSearchModal.vue'
import ScenarioRequirementSearchModal from '@/components/test/ScenarioRequirementSearchModal.vue'

const STEP_MAX = 20

const route = useRoute()
const router = useRouter()
const { mode, config } = useTestContext()

const groups = ref([])
const selectedRound = ref('3차')
const highlightCaseId = ref('')
const showWbsLoad = ref(false)
const showLibCopy = ref(false)
const showScreenSearch = ref(false)
const showReqSearch = ref(false)
const reqSearchCase = ref(null)
const collapsedCaseIds = ref(new Set())
const allCollapsed = ref(false)
let caseSeq = 100

function loadGroups() {
  groups.value = getScenarioEditGroups(mode.value).map((g) => ({
    ...g,
    cases: g.cases.map((c) => ({
      ...c,
      steps: c.steps.map((s) => ({ ...s })),
    })),
  }))
  selectedRound.value = mode.value === 'uat' ? '운영1차' : '3차'
  highlightCaseId.value = String(route.query.caseId || '')
  collapsedCaseIds.value = new Set()
  allCollapsed.value = false
}

onMounted(loadGroups)
watch(mode, loadGroups)

const pageTitle = computed(() => `시나리오 편집 (${config.value.label})`)

function goBack() {
  router.push({ name: 'scenario', params: { mode: mode.value } })
}

function nextCaseId(prefix = 'TC') {
  caseSeq += 1
  return `${prefix}-${String(caseSeq).padStart(3, '0')}`
}

function findOrCreateGroup({ reqId, screenName, systemPath, screenPath }) {
  let group = groups.value.find(
    (g) => g.reqId === reqId && g.screenName === screenName,
  )
  if (!group) {
    group = {
      reqId: reqId || `REQ-${caseSeq}`,
      screenName: screenName || '미지정 화면',
      systemPath: systemPath || '-',
      screenPath: screenPath || '-',
      cases: [],
    }
    groups.value.push(group)
  }
  return group
}

function addStep(caseRow) {
  if (caseRow.steps.length >= STEP_MAX) {
    window.alert(`절차는 최대 ${STEP_MAX}개까지 등록할 수 있습니다.`)
    return
  }
  const no = caseRow.steps.length + 1
  caseRow.steps.push({ no, procedure: '', expected: '' })
  caseRow.stepCount = caseRow.steps.length
}

function removeStep(caseRow, idx) {
  caseRow.steps.splice(idx, 1)
  caseRow.steps.forEach((s, i) => {
    s.no = i + 1
  })
  caseRow.stepCount = caseRow.steps.length
}

function moveStep(caseRow, idx, dir) {
  const next = idx + dir
  if (next < 0 || next >= caseRow.steps.length) return
  const steps = caseRow.steps
  ;[steps[idx], steps[next]] = [steps[next], steps[idx]]
  steps.forEach((s, i) => {
    s.no = i + 1
  })
}

const dragState = ref({ caseId: null, fromIdx: null })

function onStepDragStart(caseRow, idx) {
  dragState.value = { caseId: caseRow.id, fromIdx: idx }
}

function onStepDrop(caseRow, idx) {
  if (dragState.value.caseId !== caseRow.id || dragState.value.fromIdx === null) return
  const from = dragState.value.fromIdx
  if (from === idx) return
  const steps = caseRow.steps
  const [moved] = steps.splice(from, 1)
  steps.splice(idx, 0, moved)
  steps.forEach((s, i) => {
    s.no = i + 1
  })
  dragState.value = { caseId: null, fromIdx: null }
}

function toggleCollapse(caseId) {
  const next = new Set(collapsedCaseIds.value)
  if (next.has(caseId)) next.delete(caseId)
  else next.add(caseId)
  collapsedCaseIds.value = next
}

function isCollapsed(caseId) {
  return collapsedCaseIds.value.has(caseId)
}

function toggleAllCollapse() {
  const allCaseIds = groups.value.flatMap((g) => g.cases.map((c) => c.id))
  if (allCollapsed.value) {
    collapsedCaseIds.value = new Set()
    allCollapsed.value = false
  } else {
    collapsedCaseIds.value = new Set(allCaseIds)
    allCollapsed.value = true
  }
}

function addCaseToGroup(group) {
  group.cases.push({
    id: `sc-new-${Date.now()}`,
    caseId: nextCaseId('TC-N'),
    caseName: '',
    executionType: config.value.editExecutionTypeOptions?.[0] || '오픈 전',
    note: '',
    steps: [{ no: 1, procedure: '', expected: '' }],
    stepCount: 1,
    round: selectedRound.value,
  })
}

function removeCase(group, caseRow) {
  if (!window.confirm('이 케이스를 삭제하시겠습니까?')) return
  group.cases = group.cases.filter((c) => c.id !== caseRow.id)
}

function openScreenSearch() {
  showScreenSearch.value = true
}

function onScreenSearchSelect(screen) {
  const group = findOrCreateGroup({
    reqId: screen.reqId || '',
    screenName: screen.name,
    systemPath: screen.system || '-',
    screenPath: screen.path || '-',
  })
  group.cases.push({
    id: `sc-scr-${Date.now()}`,
    caseId: nextCaseId('TC'),
    caseName: '',
    executionType: config.value.editExecutionTypeOptions?.[0] || '오픈 전',
    note: '',
    steps: [{ no: 1, procedure: '', expected: '' }],
    stepCount: 1,
    round: selectedRound.value,
  })
  window.alert('테스트대상이 신규 등록되었습니다.')
}

function openReqSearch(caseRow) {
  reqSearchCase.value = caseRow
  showReqSearch.value = true
}

function onReqSearchSelect(req) {
  const group = groups.value.find((g) => g.cases.some((c) => c.id === reqSearchCase.value?.id))
  if (group) group.reqId = req.reqId
  reqSearchCase.value = null
}

function saveAll() {
  for (const group of groups.value) {
    for (const c of group.cases) {
      if (!c.caseName?.trim()) {
        window.alert('케이스명을 입력해 주세요.')
        return
      }
      if (!c.steps?.length) {
        window.alert(`[${c.caseId}] 절차를 1건 이상 등록해 주세요.`)
        return
      }
      for (const step of c.steps) {
        if (!step.procedure?.trim() || !step.expected?.trim()) {
          window.alert(`[${c.caseId}] 절차와 기대결과를 모두 입력해 주세요.`)
          return
        }
      }
    }
  }
  if (!window.confirm('시나리오를 저장하시겠습니까?')) return
  for (const group of groups.value) {
    for (const c of group.cases) {
      saveScenarioCase(c.caseId, {
        caseName: c.caseName,
        executionType: c.executionType,
        note: c.note,
        steps: c.steps,
        round: selectedRound.value,
      })
    }
  }
  window.alert('시나리오가 저장되었습니다.')
}

function loadFromWbs() {
  showWbsLoad.value = true
}

function copyFromLibrary() {
  showLibCopy.value = true
}

function onWbsConfirm(round) {
  for (const group of groups.value) {
    for (const c of group.cases) {
      c.round = round
    }
  }
  selectedRound.value = round
  window.alert(`${round} 시나리오 기준으로 덮어쓰기 되었습니다.`)
}

function onLibraryConfirm(cases) {
  const execType = config.value.editExecutionTypeOptions?.[0] || '오픈 전'
  for (const c of cases) {
    const pathParts = (c.systemPath || '').split('>').map((s) => s.trim())
    const group = findOrCreateGroup({
      reqId: `REQ-LIB-${c.libId}`,
      screenName: c.screenName,
      systemPath: pathParts.slice(0, 2).join('>') || c.systemPath || '-',
      screenPath: pathParts.slice(2).join('>') || '-',
    })
    group.cases.push({
      id: `sc-lib-${Date.now()}-${caseSeq}`,
      caseId: nextCaseId('TC-L'),
      caseName: c.caseName,
      executionType: execType,
      note: `라이브러리 ${c.libTitle}에서 복사`,
      steps: c.steps.length
        ? c.steps.map((s, i) => ({ no: i + 1, procedure: s.procedure, expected: s.expected }))
        : [{ no: 1, procedure: '', expected: '' }],
      stepCount: c.steps.length || 1,
      round: selectedRound.value,
    })
  }
  window.alert(`${cases.length}건을 복사했습니다.`)
}
</script>

<template>
  <div class="scenario-edit">
    <div class="head">
      <button type="button" class="back-btn" @click="goBack">← 시나리오 목록</button>
      <h1 class="scenario-edit__title">{{ pageTitle }}</h1>
    </div>

    <div class="toolbar card">
      <div class="toolbar__left">
        <label class="round-sel">
          <span>차수</span>
          <select v-model="selectedRound">
            <option v-for="o in config.roundOptions.filter((r) => r !== '전체')" :key="o" :value="o">
              {{ o }}
            </option>
          </select>
        </label>
      </div>
      <div class="toolbar__right">
        <button type="button" class="btn btn--ghost" @click="toggleAllCollapse">
          {{ allCollapsed ? '전체열기' : '전체접기' }}
        </button>
        <button type="button" class="btn btn--ghost" @click="loadFromWbs">불러오기</button>
        <button type="button" class="btn btn--ghost" @click="copyFromLibrary">라이브러리 복사</button>
        <button type="button" class="btn btn--ghost" @click="openScreenSearch">테스트대상 신규등록</button>
        <button type="button" class="btn btn--primary" @click="saveAll">저장</button>
      </div>
    </div>

    <p class="notice">※ 화면당 케이스 1개 이상, 케이스당 절차 1개 이상 등록이 필요합니다. (절차는 최대 {{ STEP_MAX }}개)</p>

    <div v-if="!groups.length" class="empty-groups card">
      등록된 테스트대상이 없습니다. "불러오기", "라이브러리 복사" 또는 "테스트대상 신규등록"으로 추가하세요.
    </div>

    <div v-for="group in groups" :key="`${group.reqId}-${group.screenName}`" class="target card">
      <div class="target__head">
        <span class="target__req">{{ group.reqId || '-' }}</span>
        <span class="target__path">{{ group.systemPath }} › {{ group.screenPath }}</span>
        <b class="target__screen">{{ group.screenName }}</b>
        <button type="button" class="icon-btn icon-btn--add" title="케이스 추가" @click="addCaseToGroup(group)">
          ＋
        </button>
      </div>

      <div
        v-for="(caseRow, caseIdx) in group.cases"
        :key="caseRow.id"
        class="case-block"
        :class="{ highlight: caseRow.caseId === highlightCaseId }"
      >
        <div class="case-block__meta">
          <button type="button" class="collapse-btn" @click="toggleCollapse(caseRow.id)">
            {{ isCollapsed(caseRow.id) ? '▶' : '▼' }}
          </button>
          <span class="case-no">{{ caseIdx + 1 }}</span>
          <span class="case-id">{{ caseRow.caseId }}</span>
          <input v-model="caseRow.caseName" class="inp case-name" type="text" placeholder="케이스명" />
          <select v-model="caseRow.executionType" class="inp">
            <option v-for="o in config.editExecutionTypeOptions" :key="o" :value="o">{{ o }}</option>
          </select>
          <button type="button" class="icon-btn" title="요구사항 검색" @click="openReqSearch(caseRow)">🔍</button>
          <button type="button" class="link-btn case-remove" @click="removeCase(group, caseRow)">✕ 케이스 삭제</button>
        </div>

        <template v-if="!isCollapsed(caseRow.id)">
          <div class="form-block">
            <label>테스트 참고사항</label>
            <textarea v-model="caseRow.note" class="inp textarea" rows="2" placeholder="참고사항 입력" />
          </div>

          <div class="steps-head">
            <h4>절차 / 예상결과</h4>
            <button type="button" class="btn btn--ghost btn--sm" @click="addStep(caseRow)">+ 절차 추가</button>
          </div>

          <table class="step-table">
            <thead>
              <tr>
                <th style="width: 40px">No</th>
                <th>절차</th>
                <th>예상결과</th>
                <th style="width: 88px">순서</th>
                <th style="width: 48px"></th>
              </tr>
            </thead>
            <tbody>
              <tr
                v-for="(step, idx) in caseRow.steps"
                :key="step.no"
                draggable="true"
                class="step-row"
                @dragstart="onStepDragStart(caseRow, idx)"
                @dragover.prevent
                @drop="onStepDrop(caseRow, idx)"
              >
                <td class="center">{{ step.no }}</td>
                <td><input v-model="step.procedure" class="inp" type="text" /></td>
                <td><input v-model="step.expected" class="inp" type="text" /></td>
                <td class="center">
                  <button type="button" class="icon-btn" :disabled="idx === 0" @click="moveStep(caseRow, idx, -1)">▲</button>
                  <button
                    type="button"
                    class="icon-btn"
                    :disabled="idx === caseRow.steps.length - 1"
                    @click="moveStep(caseRow, idx, 1)"
                  >
                    ▼
                  </button>
                </td>
                <td class="center">
                  <button type="button" class="link-btn" @click="removeStep(caseRow, idx)">삭제</button>
                </td>
              </tr>
            </tbody>
          </table>
        </template>
      </div>
    </div>
  </div>

  <ScenarioLoadFromWbsModal v-model="showWbsLoad" @confirm="onWbsConfirm" />
  <ScenarioCopyFromLibraryModal v-model="showLibCopy" @confirm="onLibraryConfirm" />
  <ScenarioScreenSearchModal v-model="showScreenSearch" @select="onScreenSearchSelect" />
  <ScenarioRequirementSearchModal v-model="showReqSearch" @select="onReqSearchSelect" />
</template>

<style scoped>
.scenario-edit {
  padding: 14px 18px 28px;
  color: var(--ink);
  font-size: 13px;
}

.head {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 14px;
}

.back-btn {
  border: none;
  background: none;
  color: var(--teal-600);
  font-size: 12px;
  cursor: pointer;
  font-family: inherit;
}

.scenario-edit__title {
  font-size: 18px;
  font-weight: 700;
  margin: 0;
}

.toolbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px 16px;
  margin-bottom: 12px;
}

.toolbar__right {
  display: flex;
  gap: 8px;
}

.round-sel {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 12px;
}

.round-sel select {
  height: 32px;
  padding: 0 10px;
  border: 1px solid var(--line);
  border-radius: 7px;
  font-family: inherit;
  font-size: 12px;
}

.notice {
  margin: 0 0 12px;
  padding: 10px 14px;
  background: var(--teal-50);
  border: 1px solid var(--teal-100);
  border-radius: 8px;
  font-size: 12px;
  color: var(--teal-600);
}

.empty-groups {
  padding: 40px 16px;
  text-align: center;
  color: var(--muted);
  font-size: 13px;
}

.target {
  padding: 14px 16px;
  margin-bottom: 12px;
}

.target__head {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 8px;
  margin-bottom: 14px;
  padding-bottom: 10px;
  border-bottom: 1px solid var(--line);
  font-size: 12px;
}

.target__req {
  font-weight: 700;
  color: var(--teal-700);
}

.target__path {
  color: var(--muted);
}

.target__screen {
  font-size: 14px;
}

.case-block {
  padding: 12px 0;
  border-bottom: 1px dashed var(--line);
}

.case-block:last-child {
  border-bottom: none;
}

.case-block.highlight {
  background: var(--teal-50);
  margin: 0 -8px;
  padding: 12px 8px;
  border-radius: 8px;
}

.case-block__meta {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  align-items: center;
  margin-bottom: 10px;
}

.case-id {
  font-size: 11px;
  color: var(--muted);
  font-weight: 600;
}

.case-no {
  font-size: 11px;
  font-weight: 700;
  color: var(--teal-700);
  min-width: 18px;
}

.collapse-btn {
  border: none;
  background: none;
  cursor: pointer;
  font-size: 10px;
  color: var(--muted);
  padding: 0 2px;
}

.case-remove {
  margin-left: auto;
  color: var(--red);
}

.icon-btn--add {
  margin-left: auto;
  width: 22px;
  height: 22px;
  font-size: 13px;
  color: var(--teal-600);
  font-weight: 700;
}

.step-row {
  cursor: grab;
}

.case-name {
  flex: 1;
  min-width: 200px;
}

.form-block {
  display: flex;
  flex-direction: column;
  gap: 4px;
  margin-bottom: 10px;
}

.form-block label {
  font-size: 11px;
  color: var(--muted);
  font-weight: 600;
}

.steps-head {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 8px;
}

.steps-head h4 {
  margin: 0;
  font-size: 13px;
}

.inp {
  height: 32px;
  padding: 0 10px;
  border: 1px solid var(--line);
  border-radius: 7px;
  font-family: inherit;
  font-size: 12px;
}

.textarea {
  height: auto;
  padding: 8px 10px;
  resize: vertical;
}

.step-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 12px;
}

.step-table th,
.step-table td {
  padding: 6px 8px;
  border: 1px solid var(--line);
}

.step-table th {
  background: var(--field);
  font-weight: 600;
}

.center {
  text-align: center;
}

.icon-btn {
  border: 1px solid var(--line);
  background: var(--lnb-side);
  border-radius: 4px;
  width: 24px;
  height: 22px;
  cursor: pointer;
  font-size: 10px;
}

.icon-btn:disabled {
  opacity: 0.4;
  cursor: not-allowed;
}

.link-btn {
  border: none;
  background: none;
  color: var(--teal-600);
  cursor: pointer;
  font-size: 11px;
}
</style>
