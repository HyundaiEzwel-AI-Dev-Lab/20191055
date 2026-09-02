<script setup>
// PAG-S-UAT-04 시나리오 편집 (전용 페이지)
// 2026-09-02 h-pms 동기화 — 목록 화면(ScenarioView)과 같은 2단계(행 → 절차) 테이블로 전환했다.
// 요구사항ID는 화면(그룹)이 아니라 케이스 단위 필드로 바꿨다 — 같은 화면에 다른 요구사항의
// 케이스가 섞일 수 있어서다. 케이스/절차 드래그 재정렬, "테스트대상만 등록"(케이스 0인 화면),
// WBS 작업제외 케이스 잠금(조회전용), 최종수정 표기를 h-pms에서 이식했다. h-pms는 실 API로
// 배선하지만 이 목업은 실 API 없이 scenario.js의 로컬 mock 함수/상태만 사용한다.
import { computed, onMounted, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useTestContext } from '@/app/composables/useTestContext'
import { useAuthStore } from '@/app/stores/auth'
import { getScenarioList, saveScenarioCase, addScenarioCases } from '@/entities/scenario/mock/scenario'
import ScenarioLoadFromWbsModal from '@/pages/workspace/test/scenario/ScenarioLoadFromWbsModal.vue'
import ScenarioCopyFromLibraryModal from '@/pages/workspace/test/scenario/ScenarioCopyFromLibraryModal.vue'
import ScenarioScreenSearchModal from '@/pages/workspace/test/scenario/ScenarioScreenSearchModal.vue'
import ScenarioRequirementSearchModal from '@/pages/workspace/test/scenario/ScenarioRequirementSearchModal.vue'
import HpDropdownMenu from '@/shared/ui/HpDropdownMenu.vue'

const STEP_MAX = 20

const route = useRoute()
const router = useRouter()
const { mode, config } = useTestContext()
const authStore = useAuthStore()

const cases = ref([])
/**
 * 케이스가 아직 없는 테스트대상(화면검색으로 화면만 등록한 상태). 저장 전까지만 화면에 남고
 * 다시 불러오면 사라진다 — mock 저장소(scenario.js)에는 케이스 없는 화면을 담을 자리가 없다
 * (test_cases류 저장소가 유일해서 케이스 0인 화면은 저장할 수 없는 h-pms 사정과 동일).
 */
const emptyTargets = ref([])
const selectedRound = ref('3차')
const highlightCaseId = ref('')
const showWbsLoad = ref(false)
const showLibCopy = ref(false)
const showScreenSearch = ref(false)
const showReqSearch = ref(false)
const reqSearchCaseId = ref(null)
const collapsedCaseIds = ref(new Set())
const allCollapsed = ref(false)
const showLoadMenu = ref(false)
const loadMenuAnchor = ref(null)
const lastSaved = ref(null)
let caseSeq = 100

const LOAD_MENU_ITEMS = [
  { id: 'wbs', label: '시나리오 불러오기' },
  { id: 'library', label: '라이브러리복사' },
  { id: 'screen', label: '테스트대상 신규등록' },
]

function loadCases() {
  cases.value = getScenarioList(mode.value).map((c) => ({ ...c, steps: c.steps.map((s) => ({ ...s })) }))
  emptyTargets.value = []
  const roundOptions = config.value.roundOptions.filter((r) => r !== '전체')
  selectedRound.value = String(route.query.round || '') || roundOptions[0]
  highlightCaseId.value = String(route.query.caseId || '')
  collapsedCaseIds.value = new Set()
  allCollapsed.value = false
  lastSaved.value = null
}

onMounted(loadCases)
watch(mode, loadCases)

function onLoadMenuSelect(id) {
  if (id === 'wbs') loadFromWbs()
  else if (id === 'library') copyFromLibrary()
  else openScreenSearch()
}

const pageTitle = computed(() => `시나리오 편집 (${config.value.label} ${selectedRound.value})`)

function nextCaseId(prefix = 'TC') {
  caseSeq += 1
  return `${prefix}-${String(caseSeq).padStart(3, '0')}`
}

/** 테스트대상(화면) 묶음 키 — 화면명 기준. 요구사항ID는 케이스마다 다를 수 있어 그룹 키에서
 * 뺐다(같은 화면인데 요구사항이 갈려 그룹이 나뉘던 문제를 h-pms가 화면코드 기준으로 고친 것과
 * 같은 취지 — 이 mock에는 화면코드가 없어 화면명을 대신 쓴다). */
function groupKeyOf(target) {
  return target.screenName || '미지정 화면'
}

const groups = computed(() => {
  const map = new Map()
  const order = []
  for (const c of cases.value) {
    const key = groupKeyOf(c)
    if (!map.has(key)) {
      map.set(key, {
        screenName: c.screenName || '미지정 화면',
        systemPath: c.systemPath || '-',
        screenPath: c.screenPath || '-',
        reqId: c.reqId || '',
        cases: [],
      })
      order.push(key)
    }
    map.get(key).cases.push(c)
  }
  // 케이스가 아직 없는 테스트대상을 뒤에 붙인다. 같은 화면에 케이스가 하나라도 생기면 위 루프가
  // 이미 그룹을 만들었을 것이므로 건너뛴다 — 같은 화면이 두 줄로 보이면 안 된다.
  for (const target of emptyTargets.value) {
    const key = groupKeyOf(target)
    if (map.has(key)) continue
    map.set(key, { ...target, cases: [] })
    order.push(key)
  }
  return order.map((k) => map.get(k))
})

/**
 * 목록 화면과 같은 2단계(행 → 절차) 구조로 평탄화한다. 드래그 제약("다른 화면으로는 옮길 수
 * 없다")과 저장 검증("케이스 0인 화면은 저장 불가")은 그룹 단위로 걸어야 하므로 각 행이 자신이
 * 속한 group을 들고 있는다. caseRow가 null이면 케이스가 아직 없는 테스트대상이다.
 */
const flatRows = computed(() => {
  const rows = []
  for (const group of groups.value) {
    if (!group.cases.length) {
      rows.push({ group, caseRow: null, isLastOfGroup: true })
      continue
    }
    group.cases.forEach((caseRow, i) => {
      rows.push({ group, caseRow, isLastOfGroup: i === group.cases.length - 1 })
    })
  }
  return rows
})

function rowKey(row) {
  return row.caseRow ? `case-${row.caseRow.id}` : `empty-${groupKeyOf(row.group)}`
}

/** WBS 작업단위가 작업제외된 케이스는 조회 전용이다. h-pms는 홀딩/이번차수제외 사유도 함께
 * 판정하지만 이 mock 데이터엔 wbsExcluded 플래그만 있어 그 사유만 반영한다. */
function isLocked(caseRow) {
  return !!caseRow.wbsExcluded
}
function lockTitle(caseRow) {
  return isLocked(caseRow) ? '이 케이스는 WBS 작업단위가 작업제외되어 조회만 가능합니다.' : ''
}
function isGroupLocked(group) {
  return group.cases.some(isLocked)
}
function groupLockTitle(group) {
  return group.cases.map(lockTitle).find((t) => t !== '') || ''
}

function isNewCase(caseRow) {
  return !!caseRow.isNew
}

function newCase(group) {
  return {
    id: `sc-new-${Date.now()}-${++caseSeq}`,
    reqId: group.reqId || '',
    screenName: group.screenName,
    systemPath: group.systemPath,
    screenPath: group.screenPath,
    caseId: nextCaseId('TC-N'),
    caseName: '',
    executionType: config.value.editExecutionTypeOptions?.[0] || '오픈 전',
    note: '',
    steps: [{ no: 1, procedure: '', expected: '' }],
    stepCount: 1,
    round: selectedRound.value,
    isNew: true,
  }
}

function addCaseToGroup(group) {
  if (isGroupLocked(group)) return
  cases.value.push(newCase(group))
}

function removeCase(caseRow) {
  if (isLocked(caseRow)) return
  if (!window.confirm('이 케이스를 삭제하시겠습니까?')) return
  cases.value = cases.value.filter((c) => c.id !== caseRow.id)
}

function addStep(caseRow) {
  if (isLocked(caseRow)) return
  if (caseRow.steps.length >= STEP_MAX) {
    window.alert(`절차는 최대 ${STEP_MAX}개까지 등록할 수 있습니다.`)
    return
  }
  caseRow.steps.push({ no: caseRow.steps.length + 1, procedure: '', expected: '' })
  caseRow.stepCount = caseRow.steps.length
}

function removeStep(caseRow, idx) {
  if (isLocked(caseRow)) return
  caseRow.steps.splice(idx, 1)
  caseRow.steps.forEach((s, i) => (s.no = i + 1))
  caseRow.stepCount = caseRow.steps.length
}

/**
 * 절차 드래그 — 같은 케이스 안에서 순서만 바꾸는 것과 다른 케이스로 옮기는 것을 둘 다
 * 지원한다. dragCaseId(끌기 시작한 케이스)와 dropStep의 targetCase가 다를 수 있다.
 */
const dragCaseId = ref(null)
const dragStepIdx = ref(null)

function startDragStep(caseRow, idx) {
  if (isLocked(caseRow)) return
  dragCaseId.value = caseRow.id
  dragStepIdx.value = idx
}

function endDragStep() {
  dragCaseId.value = null
  dragStepIdx.value = null
}

function dropStep(targetCase, targetIdx) {
  const fromCaseId = dragCaseId.value
  const fromIdx = dragStepIdx.value
  endDragStep()
  if (fromCaseId === null || fromIdx === null) return
  const fromCase = cases.value.find((c) => c.id === fromCaseId)
  if (!fromCase || isLocked(fromCase) || isLocked(targetCase)) return

  if (fromCase.id === targetCase.id) {
    if (fromIdx === targetIdx) return
    const steps = fromCase.steps
    const [moved] = steps.splice(fromIdx, 1)
    steps.splice(targetIdx, 0, moved)
    steps.forEach((s, i) => (s.no = i + 1))
    return
  }

  if (targetCase.steps.length >= STEP_MAX) {
    window.alert(`절차는 최대 ${STEP_MAX}개까지 등록할 수 있습니다.`)
    return
  }
  const [moved] = fromCase.steps.splice(fromIdx, 1)
  fromCase.steps.forEach((s, i) => (s.no = i + 1))
  fromCase.stepCount = fromCase.steps.length
  targetCase.steps.splice(targetIdx, 0, moved)
  targetCase.steps.forEach((s, i) => (s.no = i + 1))
  targetCase.stepCount = targetCase.steps.length
}

/** 케이스 행 드래그 — 같은 화면(그룹) 안에서만 순서를 바꾼다. 그룹을 넘으면 요구사항·화면이
 * 다른 케이스가 섞여 엉뚱한 테스트대상 하위로 들어간다. */
const dragCaseKey = ref(null)

function startDragCase(caseRow) {
  if (isLocked(caseRow)) return
  dragCaseKey.value = caseRow.id
}

function endDragCase() {
  dragCaseKey.value = null
}

function onCaseDrop(row) {
  if (row.caseRow) dropCase(row.group, row.caseRow)
}

function dropCase(group, targetRow) {
  const movedId = dragCaseKey.value
  endDragCase()
  if (movedId === null || movedId === targetRow.id) return
  if (!group.cases.some((c) => c.id === movedId)) return
  const moved = cases.value.find((c) => c.id === movedId)
  if (!moved || isLocked(moved) || isLocked(targetRow)) return

  const list = [...cases.value]
  const from = list.findIndex((c) => c.id === movedId)
  list.splice(from, 1)
  const to = list.findIndex((c) => c.id === targetRow.id)
  list.splice(from < to ? to + 1 : to, 0, moved)
  cases.value = list
}

/** textarea 자동 확장 — mounted·updated 양쪽에서 재는 디렉티브라 최초 로드(여러 줄 데이터)와
 * 이후 입력을 같은 경로로 다룬다. */
function resizeTextarea(el) {
  el.style.height = 'auto'
  el.style.height = `${el.scrollHeight}px`
}
const vAutoGrow = {
  mounted: (el) => resizeTextarea(el),
  updated: (el) => resizeTextarea(el),
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
  if (allCollapsed.value) {
    collapsedCaseIds.value = new Set()
    allCollapsed.value = false
  } else {
    collapsedCaseIds.value = new Set(cases.value.map((c) => c.id))
    allCollapsed.value = true
  }
}

function openScreenSearch() {
  showLoadMenu.value = false
  showScreenSearch.value = true
}

function onScreenSearchSelect(screen) {
  const target = {
    screenName: screen.name || '미지정 화면',
    systemPath: screen.category ? `${screen.system}>${screen.category}` : screen.system || '-',
    screenPath: screen.path || '-',
    reqId: '',
  }
  const key = groupKeyOf(target)
  if (groups.value.some((g) => groupKeyOf(g) === key)) {
    window.alert('이미 등록된 테스트대상입니다.')
    return
  }
  // 케이스는 만들지 않는다 — '케이스 0'인 대상 행만 생긴다. 사용자가 아래에서 케이스를 추가한다.
  emptyTargets.value = [...emptyTargets.value, target]
  window.alert('테스트대상이 신규 등록되었습니다. 케이스를 추가해 주세요.')
}

function openReqSearch(caseRow) {
  if (isLocked(caseRow)) return
  reqSearchCaseId.value = caseRow.id
  showReqSearch.value = true
}

function onReqSearchSelect(req) {
  const target = cases.value.find((c) => c.id === reqSearchCaseId.value)
  if (target) target.reqId = req.reqId
  reqSearchCaseId.value = null
}

function loadFromWbs() {
  showLoadMenu.value = false
  showWbsLoad.value = true
}

function copyFromLibrary() {
  showLoadMenu.value = false
  showLibCopy.value = true
}

function onWbsConfirm(round) {
  for (const c of cases.value) c.round = round
  selectedRound.value = round
}

function onLibraryConfirm(libCases) {
  const execType = config.value.editExecutionTypeOptions?.[0] || '오픈 전'
  for (const c of libCases) {
    const pathParts = (c.systemPath || '').split('>').map((s) => s.trim())
    cases.value.push({
      id: `sc-lib-${Date.now()}-${++caseSeq}`,
      reqId: '',
      screenName: c.screenName,
      systemPath: pathParts.slice(0, 2).join('>') || c.systemPath || '-',
      screenPath: pathParts.slice(2).join('>') || '-',
      caseId: nextCaseId('TC-L'),
      caseName: c.caseName,
      executionType: execType,
      note: `라이브러리 ${c.libTitle}에서 복사`,
      steps: c.steps.length
        ? c.steps.map((s, i) => ({ no: i + 1, procedure: s.procedure, expected: s.expected }))
        : [{ no: 1, procedure: '', expected: '' }],
      stepCount: c.steps.length || 1,
      round: selectedRound.value,
      isNew: true,
    })
  }
}

/** '최종수정 YYYY-MM-DD HH:mm / 이름(사번)'. 저장 전에는 표시하지 않는다 — 실 서버 이력이 없는
 * 만큼 "이번 세션에서 저장했다"는 사실만 보여준다(새로고침하면 사라진다). */
const lastModified = computed(() => {
  if (!lastSaved.value) return ''
  const { at, name, empNo } = lastSaved.value
  if (!name) return `최종수정 ${at}`
  return `최종수정 ${at} / ${name}${empNo ? `(${empNo})` : ''}`
})

function saveAll() {
  if (!cases.value.length) {
    window.alert('등록된 테스트대상이 없습니다.')
    return
  }
  const emptyGroup = groups.value.find((g) => !g.cases.length)
  if (emptyGroup) {
    window.alert(`「${emptyGroup.screenName}」에 케이스를 1건 이상 등록해 주세요.`)
    return
  }
  for (const c of cases.value) {
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
  if (!window.confirm('시나리오를 저장하시겠습니까?')) return

  for (const c of cases.value) {
    if (c.isNew) {
      addScenarioCases(
        [
          {
            systemPath: c.systemPath,
            screenPath: c.screenPath,
            screenName: c.screenName,
            reqId: c.reqId,
            caseId: c.caseId,
            caseName: c.caseName,
            executionType: c.executionType,
            round: selectedRound.value,
            steps: c.steps,
            note: c.note,
          },
        ],
        mode.value,
      )
      c.isNew = false
    } else {
      saveScenarioCase(c.caseId, {
        caseName: c.caseName,
        executionType: c.executionType,
        note: c.note,
        steps: c.steps,
        round: selectedRound.value,
      })
    }
  }

  const user = authStore.user
  const now = new Date()
  const pad = (n) => String(n).padStart(2, '0')
  lastSaved.value = {
    at: `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())} ${pad(now.getHours())}:${pad(now.getMinutes())}`,
    name: user?.name || '',
    empNo: user?.id || '',
  }
  window.alert('시나리오가 저장되었습니다.')
}

function goBack() {
  router.push({ name: 'scenario', params: { mode: mode.value }, query: { round: selectedRound.value } })
}
</script>

<template>
  <div class="scenario-edit">
    <div class="page-head">
      <h1>{{ pageTitle }}</h1>
      <button type="button" class="btn btn--ghost btn--sm" @click="goBack">← 목록</button>
    </div>

    <p class="notice">※ 화면당 케이스 1개 이상, 케이스당 절차 1개 이상 등록이 필요합니다. (절차는 최대 {{ STEP_MAX }}개)</p>

    <div class="toolbar">
      <span class="toolbar__count">테스트대상 <b>{{ groups.length }}</b>개 · 케이스 <b>{{ cases.length }}</b>건</span>
      <button type="button" class="toolbar__mini" @click="toggleAllCollapse">
        {{ allCollapsed ? '전체열기' : '전체접기' }}
      </button>
      <div class="toolbar__spacer" />
      <div class="split-btn">
        <button type="button" class="split-btn__main" @click="loadFromWbs">불러오기</button>
        <button
          type="button"
          ref="loadMenuAnchor"
          class="split-btn__toggle"
          :class="{ 'split-btn__toggle--on': showLoadMenu }"
          aria-label="불러오기 메뉴"
          :aria-expanded="showLoadMenu"
          @click="showLoadMenu = !showLoadMenu"
        >
          ▾
        </button>
        <HpDropdownMenu
          :open="showLoadMenu"
          :anchor="loadMenuAnchor"
          :items="LOAD_MENU_ITEMS"
          align="left"
          aria-label="불러오기 메뉴"
          @select="onLoadMenuSelect"
          @close="showLoadMenu = false"
        />
      </div>
      <span v-if="lastModified" class="last-modified">{{ lastModified }}</span>
      <button type="button" class="btn btn--primary" @click="saveAll">시나리오 저장</button>
    </div>

    <div class="listcard">
      <div class="listcard__scroll">
        <table class="scenario-table">
          <thead>
            <tr>
              <th class="col-no">No</th>
              <th>요구사항 ID</th>
              <th>수행구분</th>
              <th>시스템/업무</th>
              <th>화면경로</th>
              <th>화면명</th>
              <th>케이스 ID</th>
              <th>케이스명</th>
              <th class="col-steps">절차</th>
              <th class="col-actions" />
              <th class="col-expand" />
            </tr>
          </thead>
          <tbody>
            <tr v-if="!flatRows.length">
              <td colspan="11" class="empty">등록된 테스트대상이 없습니다. "불러오기"로 추가하세요.</td>
            </tr>

            <template v-else>
              <template v-for="(row, idx) in flatRows" :key="rowKey(row)">
                <tr
                  class="main-row"
                  :class="{
                    'main-row--open': !!row.caseRow && !isCollapsed(row.caseRow.id),
                    'main-row--locked': !!row.caseRow && isLocked(row.caseRow),
                    'main-row--empty': !row.caseRow,
                    highlight: row.caseRow?.caseId === highlightCaseId,
                  }"
                  @dragover.prevent
                  @drop="onCaseDrop(row)"
                >
                  <td class="col-no">
                    <span
                      v-if="row.caseRow"
                      class="drag-handle"
                      :draggable="!isLocked(row.caseRow)"
                      :title="lockTitle(row.caseRow) || '끌어서 순서 변경'"
                      @dragstart="startDragCase(row.caseRow)"
                      @dragend="endDragCase"
                    ></span>
                    {{ idx + 1 }}
                  </td>
                  <td v-if="row.caseRow" class="col-req">
                    <span class="req-id">{{ row.caseRow.reqId || '-' }}</span>
                    <button
                      type="button"
                      class="icon-btn icon-btn--edit"
                      :disabled="isLocked(row.caseRow)"
                      :title="lockTitle(row.caseRow) || '요구사항 변경'"
                      @click="openReqSearch(row.caseRow)"
                    >✎</button>
                  </td>
                  <td v-else>-</td>
                  <td>
                    <select
                      v-if="row.caseRow"
                      v-model="row.caseRow.executionType"
                      class="inp inp--cell"
                      :disabled="isLocked(row.caseRow)"
                      :title="lockTitle(row.caseRow)"
                    >
                      <option v-for="o in config.editExecutionTypeOptions" :key="o" :value="o">{{ o }}</option>
                    </select>
                    <template v-else>-</template>
                  </td>
                  <td>{{ row.group.systemPath || '-' }}</td>
                  <td>{{ row.group.screenPath || '-' }}</td>
                  <td class="col-screen">{{ row.group.screenName }}</td>
                  <td>{{ row.caseRow ? (isNewCase(row.caseRow) ? '(신규)' : row.caseRow.caseId) : '-' }}</td>
                  <td>
                    <input
                      v-if="row.caseRow"
                      v-model="row.caseRow.caseName"
                      class="inp cell-input case-name"
                      type="text"
                      placeholder="케이스명"
                      :disabled="isLocked(row.caseRow)"
                      :title="lockTitle(row.caseRow)"
                    />
                    <span v-else class="empty-hint">등록된 케이스 없음 — 케이스 추가로 등록하세요</span>
                  </td>
                  <td class="col-steps">
                    <span v-if="row.caseRow" class="step-badge">{{ row.caseRow.steps.length }}</span>
                  </td>
                  <td class="col-actions">
                    <button
                      v-if="row.isLastOfGroup"
                      type="button"
                      class="icon-btn icon-btn--add"
                      :disabled="isGroupLocked(row.group)"
                      :title="groupLockTitle(row.group) || '케이스 추가'"
                      @click="addCaseToGroup(row.group)"
                    >＋</button>
                    <button
                      v-if="row.caseRow"
                      type="button"
                      class="icon-btn icon-btn--del"
                      :disabled="isLocked(row.caseRow)"
                      :title="lockTitle(row.caseRow) || '케이스 삭제'"
                      @click="removeCase(row.caseRow)"
                    >✕</button>
                  </td>
                  <td class="col-expand">
                    <button
                      v-if="row.caseRow"
                      type="button"
                      class="collapse-btn"
                      :title="isCollapsed(row.caseRow.id) ? '절차 펼치기' : '절차 접기'"
                      @click="toggleCollapse(row.caseRow.id)"
                    >
                      <span class="chevron" :class="{ 'chevron--open': !isCollapsed(row.caseRow.id) }">›</span>
                    </button>
                  </td>
                </tr>

                <tr v-if="row.caseRow && !isCollapsed(row.caseRow.id)" class="detail-row">
                  <td colspan="11">
                    <div class="step-detail">
                      <div class="step-subhead">
                        <div>No</div>
                        <div>절차</div>
                        <div></div>
                        <div>예상결과</div>
                        <div></div>
                      </div>
                      <div class="step-panel">
                        <div
                          v-for="(step, sIdx) in row.caseRow.steps"
                          :key="step.no"
                          class="step-row"
                          :class="{ 'is-dragging': dragCaseId === row.caseRow.id && dragStepIdx === sIdx }"
                          @dragover.prevent
                          @drop="dropStep(row.caseRow, sIdx)"
                        >
                          <span class="step-row__no">
                            <span
                              class="drag-handle"
                              :draggable="!isLocked(row.caseRow)"
                              :title="lockTitle(row.caseRow) || '끌어서 순서 변경(다른 케이스로도 이동 가능)'"
                              @dragstart="startDragStep(row.caseRow, sIdx)"
                              @dragend="endDragStep"
                            ></span>
                            {{ step.no }}
                          </span>
                          <textarea
                            v-model="step.procedure"
                            v-auto-grow="step.procedure"
                            class="inp inp--area step-row__proc"
                            rows="1"
                            :disabled="isLocked(row.caseRow)"
                          />
                          <span class="step-row__divider"></span>
                          <textarea
                            v-model="step.expected"
                            v-auto-grow="step.expected"
                            class="inp inp--area step-row__exp"
                            rows="1"
                            :disabled="isLocked(row.caseRow)"
                          />
                          <button
                            type="button"
                            class="icon-btn step-row__del"
                            :disabled="isLocked(row.caseRow)"
                            :title="lockTitle(row.caseRow) || '절차 삭제'"
                            @click="removeStep(row.caseRow, sIdx)"
                          >X</button>
                        </div>
                        <div
                          v-if="!row.caseRow.steps.length"
                          class="step-row step-row--empty"
                          @dragover.prevent
                          @drop="dropStep(row.caseRow, 0)"
                        >등록된 절차가 없습니다. 다른 케이스의 절차를 여기로 끌어오거나 아래 "+ 절차 추가"를 눌러 주세요.</div>
                      </div>

                      <div class="steps-foot">
                        <button
                          type="button"
                          class="btn btn--ghost"
                          :disabled="isLocked(row.caseRow)"
                          :title="lockTitle(row.caseRow)"
                          @click="addStep(row.caseRow)"
                        >+ 절차 추가</button>
                      </div>
                    </div>
                  </td>
                </tr>
              </template>
            </template>
          </tbody>
        </table>
      </div>
    </div>

    <ScenarioLoadFromWbsModal v-model="showWbsLoad" :mode="mode" @confirm="onWbsConfirm" />
    <ScenarioCopyFromLibraryModal v-model="showLibCopy" @confirm="onLibraryConfirm" />
    <ScenarioScreenSearchModal v-model="showScreenSearch" @select="onScreenSearchSelect" />
    <ScenarioRequirementSearchModal v-model="showReqSearch" @select="onReqSearchSelect" />
  </div>
</template>

<style scoped>
.scenario-edit { padding: 14px 18px 28px; color: var(--ink); font-size: calc(13px + var(--font-size-offset, 0px)); }

.page-head { display: flex; align-items: center; justify-content: space-between; margin: 0 0 14px; }
.page-head h1 { margin: 0; font-size: calc(18px + var(--font-size-offset, 0px)); font-weight: 700; }

.toolbar { display: flex; align-items: center; gap: 8px; margin-bottom: 10px; flex-wrap: wrap; }
.toolbar__count { font-size: calc(12px + var(--font-size-offset, 0px)); color: var(--ink-2); }
.toolbar__count b { color: var(--teal-600); }
.toolbar__spacer { flex: 1; }
.last-modified { font-size: calc(11.5px + var(--font-size-offset, 0px)); color: var(--muted); white-space: nowrap; }
.toolbar__mini {
  height: 24px; padding: 0 8px; border: 1px solid var(--line); border-radius: 6px;
  background: var(--lnb-side); color: var(--ink);
  font-size: calc(11.5px + var(--font-size-offset, 0px)); font-family: inherit; cursor: pointer;
}

.split-btn { position: relative; display: flex; height: 28px; border-radius: 7px; overflow: visible; }
.split-btn__main, .split-btn__toggle {
  border: none; background: var(--teal); color: var(--color-text-inverse);
  cursor: pointer; font-family: inherit; font-weight: 600;
}
.split-btn__main {
  padding: 0 12px; font-size: calc(12px + var(--font-size-offset, 0px));
  border-radius: 7px 0 0 7px; border-right: 1px solid rgba(255, 255, 255, 0.3);
}
.split-btn__main:hover, .split-btn__toggle:hover { background: var(--teal-600); }
.split-btn__toggle { width: 26px; border-radius: 0 7px 7px 0; font-size: calc(11px + var(--font-size-offset, 0px)); }
.split-btn__toggle--on { background: var(--teal-600); }

.btn {
  height: 32px; padding: 0 14px; border-radius: 7px;
  font-size: calc(12.5px + var(--font-size-offset, 0px)); font-weight: 600; font-family: inherit;
  cursor: pointer; border: 1px solid transparent;
}
.btn--sm { height: 28px; padding: 0 10px; font-size: calc(12px + var(--font-size-offset, 0px)); }
.btn--primary { background: var(--teal); color: var(--color-text-inverse); }
.btn--primary:hover { background: var(--teal-600); }
.btn--ghost { background: var(--lnb-side); border-color: var(--line); color: var(--ink); }
.btn--ghost:hover { border-color: var(--teal-100); color: var(--teal-600); }

.listcard__scroll { overflow-x: auto; }
.scenario-table { width: 100%; border-collapse: collapse; font-size: calc(12px + var(--font-size-offset, 0px)); }
.scenario-table th, .scenario-table td {
  border-bottom: 1px solid var(--line); padding: 12px 14px; text-align: left; white-space: nowrap;
}
.scenario-table th { background: var(--field); font-weight: 600; color: var(--ink); text-align: left; }
.col-no { width: 56px; text-align: center !important; white-space: nowrap; }
.col-steps { width: 56px; text-align: center !important; }
.col-actions { width: 56px; text-align: center; }
.col-expand { width: 40px; text-align: center; }
.col-screen { font-weight: 700; }
.empty { text-align: center !important; color: var(--muted); padding: 1.5rem !important; }

.col-req { white-space: nowrap; }
.req-id { font-weight: 600; }
.icon-btn--edit { color: var(--ink-2); margin-left: 4px; }
.icon-btn--edit:hover { color: var(--teal-600); border-color: var(--teal-100); }

.step-badge {
  display: inline-flex; min-width: 26px; height: 22px; padding: 0 6px; align-items: center; justify-content: center;
  font-size: calc(11.5px + var(--font-size-offset, 0px)); font-weight: 600; border-radius: 6px;
  background: var(--teal-50); color: var(--teal-600);
}

.main-row.highlight, .main-row--open { background: var(--teal-50); }
.main-row--locked td { text-decoration: line-through; color: var(--muted); }
.main-row--locked .case-name { text-decoration: line-through; color: var(--muted); }
.main-row--empty { color: var(--muted); }
.empty-hint { color: var(--muted); font-style: italic; font-size: calc(11.5px + var(--font-size-offset, 0px)); }

/* 드래그 핸들 — 6점 그립 아이콘(2열×3행). 점 하나는 콘텐츠 박스, 나머지 5개는 box-shadow로
   찍어 아이콘 폰트·SVG 없이 CSS만으로 그린다. */
.drag-handle {
  display: inline-block; width: 9px; height: 13px; margin-right: 4px; flex: none;
  cursor: grab; user-select: none; color: var(--muted); vertical-align: middle;
  position: relative;
}
.drag-handle::before {
  content: ''; position: absolute; top: 0; left: 0; width: 3px; height: 3px; border-radius: 50%;
  background: currentColor;
  box-shadow: 6px 0 0 currentColor, 0 5px 0 currentColor, 6px 5px 0 currentColor, 0 10px 0 currentColor, 6px 10px 0 currentColor;
}
.drag-handle:hover { color: var(--teal-600); }
.drag-handle:active { cursor: grabbing; }
.drag-handle[draggable='false'] { opacity: 0.5; cursor: not-allowed; }
.drag-handle[draggable='false']:hover { color: var(--muted); }

.inp { height: 30px; padding: 0 8px; border: 1px solid var(--line); border-radius: 6px; font-family: inherit; font-size: calc(12px + var(--font-size-offset, 0px)); background: var(--field); color: var(--ink); box-sizing: border-box; }
.inp:disabled { opacity: 0.5; cursor: not-allowed; }
.inp--cell { min-width: 130px; }
/* 케이스명은 평소엔 텍스트처럼 보이다가 hover·focus에만 입력칸 테두리가 드러난다. */
.cell-input { min-width: 200px; border-color: transparent; background: transparent; padding: 4px 6px; }
.cell-input:hover, .cell-input:focus { border-color: var(--line); background: var(--field); }

.icon-btn { border: 1px solid var(--line); background: var(--lnb-side); border-radius: 4px; width: 22px; height: 22px; cursor: pointer; font-size: calc(11px + var(--font-size-offset, 0px)); line-height: 1; }
.icon-btn + .icon-btn { margin-left: 4px; }
.icon-btn--add { color: var(--teal-600); font-weight: 700; }
.icon-btn--del { color: var(--red); }
.icon-btn:disabled { opacity: 0.4; cursor: not-allowed; }

.collapse-btn { border: none; background: none; cursor: pointer; padding: 2px; line-height: 0; }
.chevron {
  display: inline-block; font-size: calc(16px + var(--font-size-offset, 0px)); color: var(--ink-2);
  transition: transform 0.18s ease;
}
.chevron--open { transform: rotate(90deg); color: var(--teal-600); }

.detail-row td { padding: 0; background: var(--lnb-hover); border-top: 1px solid var(--line); }
.step-detail { padding: 18px 24px 24px 24px; }
.step-subhead {
  display: grid; grid-template-columns: 48px 1fr 1px 1fr 32px; column-gap: 22px;
  padding: 10px 18px; margin-bottom: 6px;
}
.step-subhead > div {
  font-size: calc(12px + var(--font-size-offset, 0px)); font-weight: 600; color: var(--ink-2);
  text-transform: uppercase; letter-spacing: 0.03em; text-align: center;
}
.step-panel {
  background: var(--bg-surface, #fff);
  border: 1.5px solid var(--teal-100, var(--teal));
  border-radius: 10px;
  overflow: hidden;
}
.step-row {
  display: grid; grid-template-columns: 48px 1fr 1px 1fr 32px; column-gap: 22px; align-items: start;
  padding: 16px 18px; border-bottom: 1px solid var(--line);
}
.step-row:last-child { border-bottom: none; }
.step-row.is-dragging { opacity: 0.45; }
.step-row--empty {
  display: block; text-align: center; padding: 20px 18px;
  color: var(--muted); font-size: calc(11.5px + var(--font-size-offset, 0px));
}
.step-row__no {
  display: flex; align-items: center; justify-content: center; gap: 4px;
  align-self: center; font-weight: 700; color: var(--teal-600);
}
.step-row__no .drag-handle { margin-right: 0; }
.step-row__divider { background: var(--teal-100); }
.step-row__del { align-self: center; justify-self: center; }
.inp--area { height: auto; min-height: 32px; width: 100%; padding: 7px 10px; line-height: 1.5; resize: none; overflow: hidden; }

.steps-foot { display: flex; margin-top: 8px; }
</style>
