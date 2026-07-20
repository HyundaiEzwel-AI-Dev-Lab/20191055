<script setup>
// PAG-S-UAT-04 시나리오 편집 (전용 페이지)
import { computed, onMounted, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useTestContext } from '@/composables/useTestContext'
import { getScenarioEditGroups, saveScenarioCase } from '@/data/scenario'
import ScenarioLoadFromWbsModal from '@/components/test/ScenarioLoadFromWbsModal.vue'
import ScenarioCopyFromLibraryModal from '@/components/test/ScenarioCopyFromLibraryModal.vue'

const route = useRoute()
const router = useRouter()
const { mode, config } = useTestContext()

const groups = ref([])
const selectedRound = ref('3차')
const highlightCaseId = ref('')
const showWbsLoad = ref(false)
const showLibCopy = ref(false)
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

function onWbsConfirm(tasks) {
  const execType = config.value.editExecutionTypeOptions?.[0] || '오픈 전'
  for (const t of tasks) {
    const group = findOrCreateGroup({
      reqId: t.requirementId || `REQ-${t.wbsId}`,
      screenName: t.screenName && t.screenName !== '-' ? t.screenName : t.requirementName,
      systemPath: t.systemPath || '-',
      screenPath: t.screenPath || '-',
    })
    group.cases.push({
      id: `sc-wbs-${Date.now()}-${caseSeq}`,
      caseId: nextCaseId('TC-W'),
      caseName: `${t.requirementName} (${t.taskType})`,
      executionType: execType,
      note: `WBS ${t.wbsId}에서 불러옴`,
      steps: [{ no: 1, procedure: '', expected: '' }],
      stepCount: 1,
      round: selectedRound.value,
    })
  }
  window.alert(`${tasks.length}건을 추가했습니다.`)
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
        <button type="button" class="btn btn--ghost" @click="loadFromWbs">불러오기</button>
        <button type="button" class="btn btn--ghost" @click="copyFromLibrary">라이브러리 복사</button>
        <button type="button" class="btn btn--primary" @click="saveAll">저장</button>
      </div>
    </div>

    <div v-for="group in groups" :key="`${group.reqId}-${group.screenName}`" class="target card">
      <div class="target__head">
        <span class="target__req">{{ group.reqId }}</span>
        <span class="target__path">{{ group.systemPath }} › {{ group.screenPath }}</span>
        <b class="target__screen">{{ group.screenName }}</b>
      </div>

      <div
        v-for="caseRow in group.cases"
        :key="caseRow.id"
        class="case-block"
        :class="{ highlight: caseRow.caseId === highlightCaseId }"
      >
        <div class="case-block__meta">
          <span class="case-id">{{ caseRow.caseId }}</span>
          <input v-model="caseRow.caseName" class="inp case-name" type="text" placeholder="케이스명" />
          <select v-model="caseRow.executionType" class="inp">
            <option v-for="o in config.editExecutionTypeOptions" :key="o" :value="o">{{ o }}</option>
          </select>
        </div>

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
            <tr v-for="(step, idx) in caseRow.steps" :key="step.no">
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
      </div>
    </div>
  </div>

  <ScenarioLoadFromWbsModal v-model="showWbsLoad" @confirm="onWbsConfirm" />
  <ScenarioCopyFromLibraryModal v-model="showLibCopy" @confirm="onLibraryConfirm" />
</template>

<style scoped>
.scenario-edit {
  --teal: #119a8a;
  --teal-600: #0e8275;
  --teal-700: #0a6b5f;
  --teal-400: #4fb8ab;
  --teal-50: #e6f4f2;
  --teal-100: #cfe9e5;
  --ink: #1f2a30;
  --ink-2: #48565e;
  --muted: #7c8a92;
  --line: #e3e8eb;
  --line-2: #eef1f3;
  --field: #f1f4f5;
  --blue: #2f6fed;
  --blue-bg: #e8f0ff;
  --green: #1f9d57;
  --green-bg: #e6f6ec;
  --red: #e0524a;
  --red-bg: #fdecea;
  --orange: #e08a2b;
  --orange-bg: #fcf0e1;
  --gray: #8a97a0;
  --gray-bg: #eef1f3;

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
  background: #fff;
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
