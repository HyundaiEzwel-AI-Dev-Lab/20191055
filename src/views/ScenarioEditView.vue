<script setup>
// PAG-S-UAT-04 시나리오 편집 (전용 페이지)
import { computed, onMounted, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useTestContext } from '@/composables/useTestContext'
import { getScenarioEditGroups, saveScenarioCase } from '@/data/scenario'

const route = useRoute()
const router = useRouter()
const { mode, config } = useTestContext()

const groups = ref([])
const selectedRound = ref('3차')
const highlightCaseId = ref('')

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
  window.alert('WBS에서 테스트 대상을 불러옵니다. (목업)')
}

function copyFromLibrary() {
  window.alert('라이브러리에서 케이스를 복사합니다. (목업)')
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
</template>

<style scoped>
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
