<script setup>
// PAG-S-INF-01 프로젝트 정보
import { computed, onMounted, reactive, ref, watch } from 'vue'
import { useProjectStore } from '@/stores/project'
import {
  stageOptions,
  initiatorOptions,
  devTypeOptions,
  summaryOptions,
  assigneeRoles,
  testUsageOptions,
  testRoundOptions,
  testLibraryScenarios,
  searchStaff,
  searchMentions,
} from '@/data/projectInfo'
import { systemOptions, bizCategoryMap } from '@/data/requirement'
import { getWbsTasks } from '@/data/wbs'
import ScheduleReasonInputModal from '@/components/project/ScheduleReasonInputModal.vue'
import TesterChangeModal from '@/components/project/TesterChangeModal.vue'
import { isJiraAlreadyRegistered, lookupJira } from '@/data/projectRegister'

const projectStore = useProjectStore()
const ASSIGNEE_MAX = 20
const CURRENT_USER_NAME = '김현대'

const form = reactive({
  jira: '',
  itVoc: '',
  name: '',
  stage: '',
  workCategories: [],
  scheduledOpenDate: '',
  actualOpenDate: '',
  initiator: '',
  devType: '',
  summary: '',
  requestDept: '',
  requester: '',
  assignees: {},
  testUsage: [],
  testRoundDev: '1차',
  testRoundStg: '1차',
  testRoundUat: '1차',
  testLibrary: '미등록',
  testLibraryScenarios: [],
  hasRegisteredTestCases: false,
  memo: '',
  testerChangePending: null,
  issues: [],
})

const snapshot = ref('')
const savedStage = ref('')
const categorySystem = ref('')
const categoryBiz = ref('')
const showScheduleModal = ref(false)
const showTesterModal = ref(false)
const showDeleteAlert = ref(false)
const pendingSave = ref(false)

const showIssueForm = ref(false)
const issueDraft = ref('')
const showIssueCancelAlert = ref(false)
const editingIssueId = ref(null)
const replyTargetId = ref(null)
const replyDraft = ref('')
const assigneeSearch = reactive({})
const assigneeSearchOpen = reactive({})

const mentionTarget = ref(null) // 'issue' | 'reply'
const mentionQuery = ref('')

const isReadOnly = computed(() => savedStage.value === '완료' || savedStage.value === '반려')
const showOpenDate = computed(() => form.stage === '완료')
const memoCount = computed(() => form.memo.length)
const issueDraftCount = computed(() => issueDraft.value.length)
const isDevRoundEnabled = computed(() => form.testUsage.includes('DEV테스트'))
const isStgRoundEnabled = computed(() => form.testUsage.includes('STG테스트'))
const isUatRoundEnabled = computed(() => form.testUsage.includes('운영테스트'))
const testUsageLocked = computed(() => isReadOnly.value || form.hasRegisteredTestCases)
const canEditJira = computed(() => !isReadOnly.value && (isRegistering.value || form.stage === '접수'))
const mentionResults = computed(() => (mentionTarget.value ? searchMentions(mentionQuery.value) : []))

const categoryBizOptions = computed(() => {
  if (!categorySystem.value) return []
  return bizCategoryMap[categorySystem.value] || []
})

const testersForModal = computed(() =>
  (form.assignees.테스트 || []).map((t) => ({
    id: t.id,
    name: t.name,
    dept: t.dept,
    empId: t.empId || '',
  })),
)

const groupedLibraryScenarios = computed(() => {
  const groups = []
  testLibraryScenarios.forEach((scenario) => {
    let group = groups.find((g) => g.type === scenario.type)
    if (!group) {
      group = { type: scenario.type, items: [] }
      groups.push(group)
    }
    group.items.push(scenario)
  })
  return groups
})

function loadForm() {
  const project = projectStore.currentProject
  if (!project?.id) return
  const detail = projectStore.getStoredDetail(project.id, project.name)
  Object.assign(form, detail)
  if (!form.testRoundDev) form.testRoundDev = detail.testRound || '1차'
  if (!form.testRoundUat) form.testRoundUat = '1차'
  delete form.testRound
  assigneeRoles.forEach((role) => {
    if (!form.assignees[role]) form.assignees[role] = []
    assigneeSearch[role] = ''
    assigneeSearchOpen[role] = false
  })
  snapshot.value = JSON.stringify(form)
  savedStage.value = form.stage
}

onMounted(loadForm)

watch(
  () => projectStore.currentProject?.id,
  () => loadForm(),
)

const isRegistering = computed(() => {
  const id = projectStore.currentProject?.id
  return Boolean(id && projectStore.isRegistering(id))
})

function isDirty() {
  return JSON.stringify(form) !== snapshot.value
}

function resetForm() {
  if (isDirty()) {
    const ok = window.confirm(
      isRegistering.value
        ? '입력 중인 내용이 있습니다. 취소 시 작성한 내용이 저장되지 않습니다. 계속하시겠습니까?'
        : '변경 내용이 저장되지 않습니다. 계속하시겠습니까?',
    )
    if (!ok) return
  }
  loadForm()
}

function toggleTestUsage(option) {
  if (isReadOnly.value || form.hasRegisteredTestCases) return
  const idx = form.testUsage.indexOf(option)
  if (idx >= 0) form.testUsage.splice(idx, 1)
  else form.testUsage.push(option)
}

function totalAssigneeCount() {
  return assigneeRoles.reduce((sum, role) => sum + (form.assignees[role]?.length || 0), 0)
}

function findAssigneeRole(staffId) {
  return assigneeRoles.find((role) => (form.assignees[role] || []).some((p) => p.id === staffId))
}

function searchJira() {
  const jira = String(form.jira || '').trim()
  if (!jira) {
    window.alert('JIRA 번호를 입력해 주세요.')
    return
  }
  if (isJiraAlreadyRegistered(jira)) {
    window.alert('이미 등록된 JIRA 번호입니다.')
    return
  }
  const result = lookupJira(jira)
  if (!result) {
    window.alert('조회된 정보가 없습니다.')
    return
  }
  form.itVoc = result.itVoc
  form.scheduledOpenDate = result.scheduledOpenDate
  window.alert('JIRA 정보를 조회하여 반영했습니다.')
}

/** 저장/등록 전 필수·예외 검증. 실패 시 메시지 반환 */
function validateBeforeSave() {
  const trim = (v) => String(v || '').trim()

  if (isRegistering.value) {
    if (!trim(form.jira)) return 'JIRA 번호를 입력해 주세요.'
    if (isJiraAlreadyRegistered(form.jira)) {
      return '이미 등록된 JIRA 번호입니다. 다른 JIRA를 입력해 주세요.'
    }
    if (!trim(form.itVoc)) return 'IT-VOC 번호를 입력해 주세요.'
  }

  if (!trim(form.name)) return '프로젝트명을 입력해 주세요.'
  if (!form.scheduledOpenDate) return '오픈예정일을 선택해 주세요.'
  if (!form.workCategories.length) return '업무범주를 1개 이상 추가해 주세요.'
  if (!form.initiator) return '발의주체를 선택해 주세요.'
  if (!form.devType) return '개발구분을 선택해 주세요.'
  if (!form.summary) return '적요를 선택해 주세요.'
  if (!trim(form.requestDept)) return '요청부서를 입력해 주세요.'
  if (!trim(form.requester)) return '요청자를 입력해 주세요.'
  if (totalAssigneeCount() < 1) return '업무별 담당자를 최소 1명 이상 등록해 주세요.'

  for (const role of assigneeRoles) {
    if ((form.assignees[role] || []).length > ASSIGNEE_MAX) {
      return `${role} 담당자는 최대 ${ASSIGNEE_MAX}명까지 등록할 수 있습니다.`
    }
  }

  if (!form.testUsage.length) return '테스트 유형을 1개 이상 선택해 주세요.'
  if (!form.testLibrary) return '테스트 라이브러리 사용 여부를 선택해 주세요.'

  if (form.stage === '완료' && !form.actualOpenDate) {
    return '처리단계가 완료인 경우 오픈일을 입력해 주세요.'
  }

  return null
}

function addCategory(cat) {
  if (!form.workCategories.includes(cat)) {
    form.workCategories.push(cat)
  }
}

function onCategorySystemChange() {
  categoryBiz.value = ''
}

function addCategoryFromPicker() {
  if (isReadOnly.value) return
  if (!categorySystem.value || !categoryBiz.value) {
    window.alert('시스템과 업무구분을 선택해 주세요.')
    return
  }
  addCategory(`${categorySystem.value} > ${categoryBiz.value}`)
  categoryBiz.value = ''
}

function removeCategory(cat) {
  if (isReadOnly.value) return
  form.workCategories = form.workCategories.filter((c) => c !== cat)
}

function removeAssignee(role, person) {
  if (isReadOnly.value) return
  if (!isRegistering.value && person.hasWbs) {
    showDeleteAlert.value = true
    return
  }
  form.assignees[role] = form.assignees[role].filter((p) => p.id !== person.id)
}

function assigneeCount(role) {
  return (form.assignees[role] || []).length
}

function getAssigneeSearchResults(role) {
  const taken = new Set()
  assigneeRoles.forEach((r) => {
    ;(form.assignees[r] || []).forEach((p) => taken.add(p.id))
  })
  return searchStaff(assigneeSearch[role] || '').filter((s) => !taken.has(s.id))
}

function onAssigneeSearchInput(role) {
  assigneeSearchOpen[role] = (assigneeSearch[role] || '').trim().length > 0
}

function addAssignee(role, staff) {
  if (isReadOnly.value) return
  if (!form.assignees[role]) form.assignees[role] = []
  if (form.assignees[role].length >= ASSIGNEE_MAX) {
    window.alert(`${role} 담당자는 최대 ${ASSIGNEE_MAX}명까지 등록할 수 있습니다.`)
    return
  }
  const existingRole = findAssigneeRole(staff.id)
  if (existingRole) {
    window.alert('이미 등록 된 담당자입니다.')
    return
  }
  form.assignees[role].push({
    id: staff.id,
    name: staff.name,
    dept: staff.dept,
    empId: staff.empId,
    hasWbs: false,
  })
  assigneeSearch[role] = ''
  assigneeSearchOpen[role] = false
}

function closeAssigneeSearch(role) {
  assigneeSearchOpen[role] = false
}

function autoAddWbsCategories() {
  const used = new Set()
  getWbsTasks().forEach((task) => {
    if (task.systemPath && task.systemPath !== '-' && task.systemPath.includes('>')) {
      used.add(task.systemPath.replace('>', ' > '))
    }
  })
  used.forEach((cat) => addCategory(cat))
}

function onStageClick(stage) {
  if (isReadOnly.value) return
  if (isRegistering.value && (stage === '완료' || stage === '반려')) return
  form.stage = stage
  if (stage !== '완료') form.actualOpenDate = ''
  else autoAddWbsCategories()
}

function needsScheduleReason() {
  if (form.stage !== '완료' || !form.actualOpenDate) return false
  return form.actualOpenDate > form.scheduledOpenDate
}

function finalizeSave() {
  const project = projectStore.currentProject
  const wasRegistering = project?.id && projectStore.isRegistering(project.id)

  snapshot.value = JSON.stringify(form)
  savedStage.value = form.stage
  pendingSave.value = false

  if (project?.id) {
    projectStore.completeRegistration(project.id, { ...form })
  }

  window.alert(
    wasRegistering
      ? '프로젝트가 정상 등록되었습니다.\n프로젝트 상세화면으로 이동합니다.'
      : '프로젝트 정보가 저장되었습니다.',
  )
}

function save() {
  if (isReadOnly.value) return
  const error = validateBeforeSave()
  if (error) {
    window.alert(error)
    return
  }
  const project = projectStore.currentProject
  const registering = project?.id && projectStore.isRegistering(project.id)
  if (!window.confirm(registering ? '프로젝트를 등록하시겠습니까?' : '저장하시겠습니까?')) return
  if (needsScheduleReason()) {
    pendingSave.value = true
    showScheduleModal.value = true
    return
  }
  finalizeSave()
}

function onScheduleReasonSave() {
  if (pendingSave.value) finalizeSave()
}

function onTesterChangeSave(payload) {
  form.testerChangePending = {
    from: {
      name: form.assignees.테스트.find((t) => t.id === payload.targetId)?.name || '',
      dept: form.assignees.테스트.find((t) => t.id === payload.targetId)?.dept || '',
      empId: payload.targetId,
    },
    to: payload.newStaff,
    applyDate: payload.applyDate,
  }
}

function setTestLibrary(value) {
  if (isReadOnly.value) return
  form.testLibrary = value
}

function toggleLibraryScenario(id) {
  if (isReadOnly.value || form.testLibrary !== '등록') return
  const idx = form.testLibraryScenarios.indexOf(id)
  if (idx >= 0) form.testLibraryScenarios.splice(idx, 1)
  else form.testLibraryScenarios.push(id)
}

function addIssue() {
  if (!issueDraft.value.trim()) return
  const now = new Date().toISOString().slice(0, 16).replace('T', ' ')
  if (editingIssueId.value) {
    const target = form.issues.find((i) => i.id === editingIssueId.value)
    if (target) {
      target.body = issueDraft.value.trim()
      target.updatedAt = now
    }
    editingIssueId.value = null
  } else {
    form.issues.unshift({
      id: `iss-${Date.now()}`,
      author: CURRENT_USER_NAME,
      dept: '웹기획팀',
      createdAt: now,
      updatedAt: null,
      body: issueDraft.value.trim(),
      replies: [],
    })
  }
  showIssueForm.value = false
  issueDraft.value = ''
}

function startEditIssue(issue) {
  if (isReadOnly.value || issue.author !== CURRENT_USER_NAME) return
  editingIssueId.value = issue.id
  replyTargetId.value = null
  replyDraft.value = ''
  showIssueForm.value = true
  issueDraft.value = issue.body
}

function startReplyIssue(issue) {
  if (isReadOnly.value) return
  editingIssueId.value = null
  showIssueForm.value = false
  issueDraft.value = ''
  replyTargetId.value = issue.id
  replyDraft.value = ''
}

function cancelReply() {
  replyTargetId.value = null
  replyDraft.value = ''
}

function extractMentionQuery(text, cursorPos) {
  const upToCursor = text.slice(0, cursorPos)
  const match = upToCursor.match(/@([^\s@]*)$/)
  return match ? match[1] : null
}

function onIssueDraftInput(e) {
  const query = extractMentionQuery(issueDraft.value, e.target.selectionStart)
  mentionTarget.value = query !== null ? 'issue' : null
  mentionQuery.value = query || ''
}

function onReplyDraftInput(e) {
  const query = extractMentionQuery(replyDraft.value, e.target.selectionStart)
  mentionTarget.value = query !== null ? 'reply' : null
  mentionQuery.value = query || ''
}

function closeMentionList() {
  mentionTarget.value = null
}

function selectMention(user) {
  const draftRef = mentionTarget.value === 'reply' ? replyDraft : issueDraft
  draftRef.value = draftRef.value.replace(/@([^\s@]*)$/, `@${user.name} `)
  mentionTarget.value = null
}

function addReply(issue) {
  if (!replyDraft.value.trim()) return
  if (!issue.replies) issue.replies = []
  issue.replies.push({
    id: `rep-${Date.now()}`,
    author: CURRENT_USER_NAME,
    dept: '웹기획팀',
    createdAt: new Date().toISOString().slice(0, 16).replace('T', ' '),
    body: replyDraft.value.trim(),
  })
  replyTargetId.value = null
  replyDraft.value = ''
}

function cancelIssueForm() {
  if (issueDraft.value.trim()) {
    showIssueCancelAlert.value = true
    return
  }
  showIssueForm.value = false
  editingIssueId.value = null
  issueDraft.value = ''
}

function confirmIssueCancel() {
  showIssueCancelAlert.value = false
  showIssueForm.value = false
  editingIssueId.value = null
  issueDraft.value = ''
}

function openIssueForm() {
  if (isReadOnly.value) return
  editingIssueId.value = null
  replyTargetId.value = null
  replyDraft.value = ''
  showIssueForm.value = true
  issueDraft.value = ''
}
</script>

<template>
  <div class="project-info">
    <h1 class="project-info__title">
      프로젝트 정보
      <span class="project-info__hint">{{ isReadOnly ? '조회 전용' : isRegistering ? '등록' : '수정 화면' }}</span>
    </h1>

    <p v-if="isRegistering" class="register-notice card">
      프로젝트 등록 중입니다. 필수 정보를 입력한 뒤 저장하면 다른 프로젝트 메뉴를 이용할 수 있습니다.
    </p>

    <div class="info-row">
    <!-- 1. 기본 정보 -->
    <section class="card">
      <h2 class="sec-h"><span class="sec-h__n">1</span>기본 정보</h2>

      <div class="frow frow--2">
        <div class="fld" :class="{ 'fld--req': isRegistering }">
          <label>{{ canEditJira ? 'JIRA' : 'JIRA (수정불가)' }}</label>
          <div v-if="canEditJira" class="fld__row">
            <input
              v-model="form.jira"
              class="inp inp--edit"
              type="text"
              placeholder="JIRA 번호 입력"
            />
            <button type="button" class="btn btn--ghost btn--sm" @click="searchJira">조회</button>
          </div>
          <div v-else class="inp inp--ro">{{ form.jira }}</div>
        </div>
        <div class="fld" :class="{ 'fld--req': isRegistering }">
          <label>{{ isRegistering ? 'IT-VOC 번호' : 'IT-VOC 번호 (수정불가)' }}</label>
          <input
            v-if="isRegistering && !isReadOnly"
            v-model="form.itVoc"
            class="inp inp--edit"
            type="text"
            placeholder="IT-VOC 번호 입력"
          />
          <div v-else class="inp inp--ro">{{ form.itVoc }}</div>
        </div>
      </div>

      <div class="fld fld--req">
        <label>
          {{ isRegistering ? '프로젝트명' : '프로젝트명 (수정 시 변경이력 저장)' }}
        </label>
        <input
          v-model="form.name"
          class="inp inp--edit"
          type="text"
          :disabled="isReadOnly"
        />
      </div>

      <div class="stage-block">
        <label>처리단계 (착수 시 자동 진행중)</label>
        <div class="pill-group">
          <button
            v-for="stage in stageOptions"
            :key="stage"
            type="button"
            class="pill"
            :class="{ 'pill--on': form.stage === stage }"
            :disabled="
              isReadOnly || (isRegistering && (stage === '완료' || stage === '반려'))
            "
            :title="
              isRegistering && (stage === '완료' || stage === '반려')
                ? '프로젝트 등록 중에는 선택할 수 없습니다.'
                : undefined
            "
            @click="onStageClick(stage)"
          >
            <span class="pill__mark">✓</span>{{ stage }}
          </button>
        </div>
      </div>

      <div class="category-block">
        <label>
          {{ isRegistering ? '업무범주' : '업무범주 (JIRA 개발범주 연동)' }}
        </label>
        <div class="chips">
          <span v-for="cat in form.workCategories" :key="cat" class="chip">
            {{ cat }}
            <button
              v-if="!isReadOnly"
              type="button"
              class="chip__x"
              @click="removeCategory(cat)"
            >
              ✕
            </button>
          </span>
        </div>
        <div v-if="!isReadOnly" class="category-add-row">
          <select
            v-model="categorySystem"
            class="inp inp--edit category-add-row__select"
            @change="onCategorySystemChange"
          >
            <option value="">시스템 선택</option>
            <option v-for="s in systemOptions" :key="s" :value="s">{{ s }}</option>
          </select>
          <span class="category-add-row__sep">&gt;</span>
          <select
            v-model="categoryBiz"
            class="inp inp--edit category-add-row__select"
            :disabled="!categorySystem"
          >
            <option value="">업무구분 선택</option>
            <option v-for="b in categoryBizOptions" :key="b" :value="b">{{ b }}</option>
          </select>
          <button type="button" class="btn btn--ghost btn--sm" @click="addCategoryFromPicker">
            ＋ 추가
          </button>
        </div>
      </div>

      <div class="frow frow--2">
        <div class="fld fld--req">
          <label>오픈예정일</label>
          <input
            v-model="form.scheduledOpenDate"
            class="inp inp--edit"
            type="date"
            :disabled="isReadOnly"
          />
        </div>
        <div v-if="showOpenDate" class="fld fld--req">
          <label>오픈일</label>
          <input
            v-model="form.actualOpenDate"
            class="inp inp--edit"
            type="date"
            :disabled="isReadOnly"
          />
        </div>
      </div>

      <div class="frow frow--3">
        <div class="fld fld--req">
          <label>발의주체</label>
          <select v-model="form.initiator" class="inp inp--edit" :disabled="isReadOnly">
            <option value="">선택</option>
            <option v-for="o in initiatorOptions" :key="o" :value="o">{{ o }}</option>
          </select>
        </div>
        <div class="fld fld--req">
          <label>개발구분</label>
          <select v-model="form.devType" class="inp inp--edit" :disabled="isReadOnly">
            <option value="">선택</option>
            <option v-for="o in devTypeOptions" :key="o" :value="o">{{ o }}</option>
          </select>
        </div>
        <div class="fld fld--req">
          <label>적요</label>
          <select v-model="form.summary" class="inp inp--edit" :disabled="isReadOnly">
            <option value="">선택</option>
            <option v-for="o in summaryOptions" :key="o" :value="o">{{ o }}</option>
          </select>
        </div>
      </div>
    </section>

    <!-- 2. 담당자 정보 -->
    <section class="card">
      <div class="card__toolbar">
        <h2 class="sec-h"><span class="sec-h__n">2</span>담당자 정보</h2>
        <button
          v-if="!isReadOnly && !isRegistering"
          type="button"
          class="btn btn--ghost btn--sm"
          @click="showTesterModal = true"
        >
          ⇄ 테스터 변경
        </button>
      </div>

      <div class="frow frow--2">
        <div class="fld">
          <label>요청부서 (수정불가)</label>
          <div class="inp inp--ro">{{ form.requestDept }}</div>
        </div>
        <div class="fld">
          <label>요청자 (수정불가)</label>
          <div class="inp inp--ro">{{ form.requester }}</div>
        </div>
      </div>

      <p class="assignee-label fld--req">
        {{ isRegistering ? '업무별 담당자 (최소 1인 필수)' : '업무별 담당자' }}
      </p>
      <div class="assignee-grid">
        <div v-for="role in assigneeRoles" :key="role" class="assignee-card">
          <div class="assignee-card__head">
            <span class="assignee-card__title">{{ role }}</span>
            <span class="assignee-card__count">{{ assigneeCount(role) }}</span>
          </div>
          <div class="chips">
            <span
              v-for="person in form.assignees[role] || []"
              :key="person.id"
              class="chip chip--person"
            >
              {{ person.name }}({{ person.dept }})
              <button
                v-if="!isReadOnly"
                type="button"
                class="chip__x"
                @click="removeAssignee(role, person)"
              >
                ✕
              </button>
            </span>
          </div>
          <div v-if="!isReadOnly" class="assignee-search">
            <input
              v-model="assigneeSearch[role]"
              class="assignee-search__input"
              type="text"
              placeholder="담당자 검색"
              @input="onAssigneeSearchInput(role)"
              @focus="onAssigneeSearchInput(role)"
              @blur="closeAssigneeSearch(role)"
            />
            <ul
              v-if="assigneeSearchOpen[role] && (assigneeSearch[role] || '').trim()"
              class="assignee-search__list"
            >
              <li v-if="!getAssigneeSearchResults(role).length" class="assignee-search__empty">
                검색 결과 없습니다.
              </li>
              <li v-for="staff in getAssigneeSearchResults(role)" :key="staff.id">
                <button
                  type="button"
                  class="assignee-search__item"
                  @mousedown.prevent="addAssignee(role, staff)"
                >
                  {{ staff.name }} / {{ staff.dept }} / {{ staff.empId }}
                </button>
              </li>
            </ul>
          </div>
        </div>
      </div>
    </section>
    </div>

    <!-- 3. 추가 정보 -->
    <section class="card">
      <h2 class="sec-h"><span class="sec-h__n">3</span>추가 정보</h2>

      <div class="fld fld--req">
        <label>테스트 사용여부</label>
        <div class="test-usage-row">
          <template v-for="opt in testUsageOptions" :key="opt">
            <button
              type="button"
              class="pill"
              :class="{ 'pill--on': form.testUsage.includes(opt) }"
              :disabled="testUsageLocked"
              @click="toggleTestUsage(opt)"
            >
              <span class="pill__mark">✓</span>{{ opt }}
            </button>
            <div v-if="opt === 'DEV테스트' && isDevRoundEnabled" class="test-round">
              <span class="test-round__label">DEV 차수</span>
              <select
                v-model="form.testRoundDev"
                class="inp inp--edit test-round__select"
                :disabled="testUsageLocked"
              >
                <option v-for="r in testRoundOptions" :key="`dev-${r}`" :value="r">
                  {{ r }}
                </option>
              </select>
            </div>
            <div v-if="opt === '운영테스트' && isUatRoundEnabled" class="test-round">
              <span class="test-round__label">운영 차수</span>
              <select
                v-model="form.testRoundUat"
                class="inp inp--edit test-round__select"
                :disabled="testUsageLocked"
              >
                <option v-for="r in testRoundOptions" :key="`uat-${r}`" :value="r">
                  {{ r }}
                </option>
              </select>
            </div>
            <div v-if="opt === 'STG테스트' && isStgRoundEnabled" class="test-round">
              <span class="test-round__label">STG 차수</span>
              <select
                v-model="form.testRoundStg"
                class="inp inp--edit test-round__select"
                :disabled="testUsageLocked"
              >
                <option v-for="r in testRoundOptions" :key="`stg-${r}`" :value="r">
                  {{ r }}
                </option>
              </select>
            </div>
          </template>
        </div>
        <p v-if="form.hasRegisteredTestCases" class="field-hint">
          테스트 케이스가 등록되어 테스트 사용여부를 변경할 수 없습니다.
        </p>
      </div>

      <div class="fld fld--req">
        <label>테스트 라이브러리</label>
        <div class="pill-group">
          <button
            type="button"
            class="pill"
            :class="{ 'pill--on': form.testLibrary === '미등록' }"
            :disabled="isReadOnly"
            @click="setTestLibrary('미등록')"
          >
            <span class="pill__mark">✓</span>미등록
          </button>
          <button
            type="button"
            class="pill"
            :class="{ 'pill--on': form.testLibrary === '등록' }"
            :disabled="isReadOnly"
            @click="setTestLibrary('등록')"
          >
            <span class="pill__mark">✓</span>등록
          </button>
        </div>
      </div>

      <div v-if="form.stage === '완료' && form.testLibrary === '등록'" class="library-list">
        <p class="library-list__hint">프로젝트 완료 시, 라이브러리 적재할 시나리오 선택</p>
        <template v-if="groupedLibraryScenarios.length">
          <div v-for="group in groupedLibraryScenarios" :key="group.type" class="lib-group">
            <span class="lib-group__title">{{ group.type }}</span>
            <ul class="lib-rows">
              <li v-for="scenario in group.items" :key="scenario.id">
                <button
                  type="button"
                  class="lib-row"
                  :class="{ 'lib-row--on': form.testLibraryScenarios.includes(scenario.id) }"
                  :disabled="isReadOnly"
                  @click="toggleLibraryScenario(scenario.id)"
                >
                  <span class="lib-row__radio"></span>
                  <span class="lib-row__round">{{ scenario.round }}</span>
                  <span class="lib-row__case">{{ scenario.label.split('–').pop().trim() }}</span>
                </button>
              </li>
            </ul>
          </div>
        </template>
        <p v-else class="library-list__empty">등록된 케이스가 없습니다.</p>
      </div>

      <div class="fld">
        <label>프로젝트 관련 단순 메모</label>
        <textarea
          v-model="form.memo"
          class="memo-input"
          rows="3"
          maxlength="500"
          placeholder="프로젝트 관련 메모를 입력하세요"
          :disabled="isReadOnly"
        />
        <span class="memo-count">{{ memoCount }} / 500자</span>
      </div>
    </section>

    <!-- 4. 이슈 관리 (등록 중 미노출) -->
    <section v-if="!isRegistering" class="card">
      <div class="card__toolbar">
        <h2 class="sec-h">
          <span class="sec-h__n">4</span>이슈 관리
          <span class="sec-h__sub">프로젝트 관련 주요 이슈/협의사항만 입력</span>
        </h2>
        <button
          v-if="!isReadOnly && !showIssueForm"
          type="button"
          class="btn btn--primary btn--sm"
          @click="openIssueForm"
        >
          이슈등록
        </button>
      </div>

      <div v-if="showIssueForm" class="issue-form">
        <div class="mention-wrap">
          <textarea
            v-model="issueDraft"
            class="issue-form__input"
            rows="4"
            maxlength="2000"
            :placeholder="
              editingIssueId
                ? '이슈 내용을 수정하세요'
                : '이슈 내용을 입력하세요. (처리 필요한 이슈일 경우 담당자 태그(@)하여 입력 ex) @권현대'
            "
            @input="onIssueDraftInput"
            @blur="closeMentionList"
          />
          <ul v-if="mentionTarget === 'issue'" class="mention-list">
            <li v-if="!mentionResults.length" class="mention-list__empty">검색 결과 없습니다.</li>
            <li v-for="user in mentionResults" :key="user.name">
              <button type="button" class="mention-list__item" @mousedown.prevent="selectMention(user)">
                {{ user.name }} / {{ user.dept }}
              </button>
            </li>
          </ul>
        </div>
        <div class="issue-form__foot">
          <span class="issue-form__count">{{ issueDraftCount }} / 2000자</span>
          <div class="issue-form__actions">
            <button type="button" class="btn btn--ghost btn--sm" @click="cancelIssueForm">
              취소
            </button>
            <button
              type="button"
              class="btn btn--primary btn--sm"
              :disabled="!issueDraft.trim()"
              @click="addIssue"
            >
              {{ editingIssueId ? '수정' : '추가' }}
            </button>
          </div>
        </div>
      </div>

      <div v-if="!form.issues.length && !showIssueForm" class="issue-empty">
        등록된 이슈가 없습니다.
      </div>

      <article v-for="issue in form.issues" :key="issue.id" class="issue-item">
        <header class="issue-item__head">
          <span class="issue-item__author">{{ issue.author }} / {{ issue.dept }}</span>
          <span class="issue-item__time">
            {{ issue.createdAt }}
            <template v-if="issue.updatedAt"> ({{ issue.updatedAt }})</template>
          </span>
        </header>
        <p class="issue-item__body">{{ issue.body }}</p>
        <div v-if="!isReadOnly" class="issue-item__actions">
          <template v-if="issue.author === CURRENT_USER_NAME">
            <button type="button" class="link-btn" @click="startEditIssue(issue)">수정</button>
            <span class="issue-item__sep">|</span>
          </template>
          <button type="button" class="link-btn" @click="startReplyIssue(issue)">답글</button>
        </div>

        <div v-if="replyTargetId === issue.id" class="issue-form issue-form--reply">
          <div class="mention-wrap">
            <textarea
              v-model="replyDraft"
              class="issue-form__input"
              rows="3"
              maxlength="2000"
              placeholder="답글 내용을 입력하세요 (담당자 태그(@) 입력 가능)"
              @input="onReplyDraftInput"
              @blur="closeMentionList"
            />
            <ul v-if="mentionTarget === 'reply'" class="mention-list">
              <li v-if="!mentionResults.length" class="mention-list__empty">검색 결과 없습니다.</li>
              <li v-for="user in mentionResults" :key="user.name">
                <button type="button" class="mention-list__item" @mousedown.prevent="selectMention(user)">
                  {{ user.name }} / {{ user.dept }}
                </button>
              </li>
            </ul>
          </div>
          <div class="issue-form__foot">
            <div class="issue-form__actions">
              <button type="button" class="btn btn--ghost btn--sm" @click="cancelReply">
                취소
              </button>
              <button
                type="button"
                class="btn btn--primary btn--sm"
                :disabled="!replyDraft.trim()"
                @click="addReply(issue)"
              >
                답글 등록
              </button>
            </div>
          </div>
        </div>

        <div v-for="reply in issue.replies" :key="reply.id" class="issue-reply">
          <header class="issue-item__head">
            <span class="issue-item__author">{{ reply.author }} / {{ reply.dept }}</span>
            <span class="issue-item__time">{{ reply.createdAt }}</span>
          </header>
          <p class="issue-item__body">{{ reply.body }}</p>
        </div>
      </article>
    </section>

    <!-- 저장 -->
    <div v-if="!isReadOnly" class="actions">
      <button type="button" class="btn btn--ghost" :disabled="!isDirty()" @click="resetForm">
        취소
      </button>
      <button type="button" class="btn btn--primary" @click="save">
        {{ isRegistering ? '등록' : '저장' }}
      </button>
    </div>

    <p v-else class="readonly-notice">
      처리단계가 「{{ form.stage }}」인 프로젝트는 정보를 수정할 수 없습니다.
    </p>

    <!-- POP-S-INF-04 -->
    <ScheduleReasonInputModal
      v-model="showScheduleModal"
      :scheduled-open-date="form.scheduledOpenDate"
      :actual-open-date="form.actualOpenDate"
      @save="onScheduleReasonSave"
    />

    <!-- POP-S-INF-02 -->
    <TesterChangeModal
      v-model="showTesterModal"
      :testers="testersForModal"
      :pending-change="form.testerChangePending"
      @save="onTesterChangeSave"
    />

    <!-- 담당자 삭제 불가 Alert -->
    <Teleport to="body">
      <div v-if="showDeleteAlert" class="alert-scrim" @mousedown.self="showDeleteAlert = false">
        <div class="alert-box">
          <div class="alert-box__icon">!</div>
          <p class="alert-box__msg">
            현재 담당 중인 업무가 존재하여 삭제할 수 없습니다.<br />
            업무 담당자를 변경 후 다시 시도해주세요.
          </p>
          <div class="alert-box__actions">
            <button type="button" class="btn btn--ghost" @click="showDeleteAlert = false">
              취소
            </button>
            <button type="button" class="btn btn--primary" @click="showDeleteAlert = false">
              확인
            </button>
          </div>
        </div>
      </div>

      <div
        v-if="showIssueCancelAlert"
        class="alert-scrim"
        @mousedown.self="showIssueCancelAlert = false"
      >
        <div class="alert-box">
          <p class="alert-box__msg">취소 시, 입력 내용이 사라집니다.<br />취소 하시겠습니까?</p>
          <div class="alert-box__actions">
            <button type="button" class="btn btn--ghost" @click="showIssueCancelAlert = false">
              취소
            </button>
            <button type="button" class="btn btn--primary" @click="confirmIssueCancel">
              확인
            </button>
          </div>
        </div>
      </div>
    </Teleport>
  </div>
</template>

<style scoped>
.project-info {
  padding: 8px 24px 28px;
  color: var(--ink);
  font-size: calc(13px + var(--font-size-offset, 0px));
}

.project-info__title {
  font-size: calc(16px + var(--font-size-offset, 0px));
  font-weight: 700;
  margin: 2px 2px 12px;
  display: flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
}

.register-notice {
  margin: 0 0 12px;
  padding: 10px 14px;
  font-size: calc(12px + var(--font-size-offset, 0px));
  color: var(--teal-600);
  background: var(--teal-50);
  border: 1px solid var(--teal-100);
}

.project-info__hint {
  font-size: calc(11px + var(--font-size-offset, 0px));
  font-weight: 500;
  color: var(--muted);
  background: var(--lnb-side);
  border: 1px solid var(--line);
  padding: 2px 8px;
  border-radius: 20px;
}

.card {
  background: var(--lnb-side);
  border: 1px solid var(--line);
  border-radius: 10px;
  padding: 22px 24px;
  margin-bottom: 18px;
}

.info-row {
  display: grid;
  grid-template-columns: 1fr 1fr;
  align-items: stretch;
  gap: 18px;
  margin-bottom: 18px;
}

.info-row > .card {
  margin-bottom: 0;
}

.card__toolbar {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 18px;
}

.card__toolbar .sec-h {
  margin-bottom: 0;
  flex: 1;
}

.sec-h {
  font-size: calc(13px + var(--font-size-offset, 0px));
  font-weight: 700;
  display: flex;
  align-items: center;
  gap: 8px;
  margin: 0 0 18px;
  flex-wrap: wrap;
}

.sec-h__n {
  width: 18px;
  height: 18px;
  border-radius: 5px;
  background: var(--teal);
  color: var(--color-text-inverse);
  font-size: calc(11px + var(--font-size-offset, 0px));
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.sec-h__sub {
  font-size: calc(11px + var(--font-size-offset, 0px));
  font-weight: 500;
  color: var(--muted);
}

.frow {
  display: grid;
  gap: 16px 20px;
  margin-bottom: 18px;
}

.frow:last-child {
  margin-bottom: 0;
}

.frow--2 {
  grid-template-columns: repeat(2, 1fr);
}

.frow--3 {
  grid-template-columns: repeat(3, 1fr);
}

.fld {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.fld--wide {
  grid-column: span 1;
}

.fld__row {
  display: flex;
  gap: 6px;
}

.fld__row .inp {
  flex: 1;
  min-width: 0;
}

.fld--req > label::after {
  content: ' *';
  color: var(--red);
}

.card > .fld,
.card > .library-list {
  margin-bottom: 20px;
}

.card > .fld:last-child,
.card > .library-list:last-child {
  margin-bottom: 0;
}

.fld label,
.stage-block > label,
.category-block > label,
.assignee-label {
  font-size: calc(11px + var(--font-size-offset, 0px));
  color: var(--muted);
  font-weight: 600;
}

.inp {
  height: 32px;
  background: var(--field);
  border: 1px solid var(--line);
  border-radius: 7px;
  padding: 0 10px;
  display: flex;
  align-items: center;
  color: var(--ink-2);
  font-size: calc(12px + var(--font-size-offset, 0px));
  font-family: inherit;
}

.inp--ro {
  cursor: default;
}

.inp--edit {
  background: var(--lnb-side);
}

.inp--edit:disabled {
  background: var(--field);
  cursor: not-allowed;
}

select.inp--edit {
  appearance: auto;
}

.stage-block,
.category-block {
  margin-bottom: 18px;
}

.stage-block > label,
.category-block > label {
  display: block;
  margin-bottom: 8px;
}

.test-usage-row {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 8px 10px;
}

.test-round {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  margin-right: 6px;
  padding: 4px 8px 4px 10px;
  border: 1px solid var(--teal-100);
  border-radius: 8px;
  background: var(--teal-50);
}

.test-round__label {
  font-size: calc(11px + var(--font-size-offset, 0px));
  font-weight: 700;
  color: var(--teal-600);
  white-space: nowrap;
}

.test-round__select {
  width: auto;
  min-width: 72px;
  padding: 5px 8px;
  border-radius: 6px;
  background: var(--lnb-side);
}

/* 처리단계 / 테스트 사용여부 / 테스트 라이브러리 공용 필 버튼 */
.pill-group {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.pill {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 7px 16px 7px 10px;
  border: 1px solid var(--line);
  border-radius: 20px;
  background: var(--lnb-side);
  color: var(--muted);
  font-size: calc(12.5px + var(--font-size-offset, 0px));
  font-weight: 600;
  cursor: pointer;
  font-family: inherit;
  transition: background 0.15s, border-color 0.15s, color 0.15s, box-shadow 0.15s;
}

.pill:hover:not(:disabled) {
  border-color: var(--teal-100);
  color: var(--teal-600);
}

.pill--on {
  background: var(--teal);
  border-color: var(--teal);
  color: var(--color-text-inverse);
  box-shadow: 0 2px 6px rgba(17, 154, 138, 0.28);
}

.pill:disabled {
  cursor: not-allowed;
  opacity: 0.6;
}

.pill__mark {
  width: 14px;
  height: 14px;
  border-radius: 50%;
  flex-shrink: 0;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  font-size: calc(9px + var(--font-size-offset, 0px));
  line-height: 1;
  border: 1.5px solid var(--line);
  color: transparent;
}

.pill--on .pill__mark {
  border-color: var(--color-text-inverse);
  background: var(--lnb-side);
  color: var(--teal);
}

.chips {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  align-items: center;
  margin-bottom: 8px;
}

.category-add-row {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
}

.category-add-row__select {
  flex: 1;
  min-width: 0;
}

.category-add-row__sep {
  color: var(--muted);
  font-size: calc(12px + var(--font-size-offset, 0px));
}

.chip {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  height: 26px;
  padding: 0 6px 0 10px;
  border: 1px solid var(--teal-100);
  background: var(--teal-50);
  border-radius: 20px;
  font-size: calc(12px + var(--font-size-offset, 0px));
  color: var(--teal-600);
}

.chip--person {
  font-size: calc(11px + var(--font-size-offset, 0px));
}

.chip__x {
  border: none;
  background: none;
  color: var(--teal-600);
  opacity: 0.6;
  cursor: pointer;
  font-size: calc(11px + var(--font-size-offset, 0px));
  padding: 0 2px;
}

.chip__x:hover {
  opacity: 1;
}

.assignee-label {
  margin: 4px 0 8px;
}

.assignee-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
  gap: 10px;
}

.assignee-card {
  border: 1px solid var(--line);
  border-radius: 8px;
  padding: 10px;
  background: var(--lnb-hover);
}

.assignee-card__title {
  font-size: calc(12px + var(--font-size-offset, 0px));
  font-weight: 700;
}

.assignee-card__head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 6px;
}

.assignee-card__count {
  font-size: calc(11px + var(--font-size-offset, 0px));
  color: var(--muted);
  font-weight: 600;
}

.assignee-search {
  position: relative;
  margin-top: 6px;
}

.assignee-search__input {
  width: 100%;
  padding: 6px 8px;
  font-size: calc(11px + var(--font-size-offset, 0px));
  border: 1px solid var(--line);
  border-radius: 6px;
  background: var(--lnb-side);
}

.assignee-search__input:focus {
  outline: none;
  border-color: var(--teal);
}

.assignee-search__list {
  position: absolute;
  z-index: 5;
  top: calc(100% + 4px);
  left: 0;
  right: 0;
  margin: 0;
  padding: 4px 0;
  list-style: none;
  background: var(--lnb-side);
  border: 1px solid var(--line);
  border-radius: 6px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
  max-height: 140px;
  overflow-y: auto;
}

.assignee-search__item {
  width: 100%;
  padding: 6px 10px;
  border: none;
  background: transparent;
  text-align: left;
  font-size: calc(11px + var(--font-size-offset, 0px));
  cursor: pointer;
  font-family: inherit;
}

.assignee-search__item:hover {
  background: var(--teal-50);
  color: var(--teal-600);
}

.assignee-search__empty {
  padding: 8px 10px;
  font-size: calc(11px + var(--font-size-offset, 0px));
  color: var(--muted);
}

.assignee-card__empty {
  font-size: calc(12px + var(--font-size-offset, 0px));
  color: var(--muted);
}

.field-hint {
  margin: 6px 0 0;
  font-size: calc(11px + var(--font-size-offset, 0px));
  color: var(--muted);
}

.library-list {
  margin: 4px 0 0;
  padding: 14px;
  background: var(--line-2);
  border-radius: 10px;
}

.library-list__hint {
  margin: 0 0 12px;
  font-size: calc(11px + var(--font-size-offset, 0px));
  color: var(--muted);
}

.library-list__empty {
  margin: 0;
  padding: 20px;
  text-align: center;
  font-size: calc(12px + var(--font-size-offset, 0px));
  color: var(--muted);
  background: var(--lnb-side);
  border: 1px dashed var(--line);
  border-radius: 8px;
}

.lib-group {
  margin-bottom: 14px;
}

.lib-group:last-child {
  margin-bottom: 0;
}

.lib-group__title {
  display: block;
  margin-bottom: 6px;
  font-size: calc(11px + var(--font-size-offset, 0px));
  font-weight: 700;
  color: var(--teal-600);
}

.lib-rows {
  list-style: none;
  margin: 0;
  padding: 0;
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.lib-row {
  display: flex;
  align-items: center;
  gap: 10px;
  width: 100%;
  padding: 9px 12px;
  border: 1px solid transparent;
  border-radius: 8px;
  background: var(--lnb-side);
  color: var(--ink-2);
  font-size: calc(12.5px + var(--font-size-offset, 0px));
  text-align: left;
  cursor: pointer;
  font-family: inherit;
  transition: border-color 0.15s, background 0.15s, color 0.15s;
}

.lib-row:hover:not(:disabled) {
  background: var(--line-2);
}

.lib-row--on {
  border-color: var(--teal-100);
  background: var(--teal-50);
}

.lib-row:disabled {
  cursor: not-allowed;
  opacity: 0.65;
}

.lib-row__radio {
  width: 16px;
  height: 16px;
  flex-shrink: 0;
  border-radius: 50%;
  border: 1.5px solid var(--line);
  position: relative;
}

.lib-row--on .lib-row__radio {
  border-color: var(--teal);
}

.lib-row--on .lib-row__radio::after {
  content: '';
  position: absolute;
  inset: 3px;
  border-radius: 50%;
  background: var(--teal);
}

.lib-row__round {
  width: 32px;
  flex-shrink: 0;
  font-weight: 700;
  color: var(--ink);
}

.lib-row--on .lib-row__round {
  color: var(--teal-600);
}

.lib-row__case {
  color: var(--muted);
}

.lib-row--on .lib-row__case {
  color: var(--teal-600);
}

.memo-input {
  width: 100%;
  padding: 10px 12px;
  border: 1px solid var(--line);
  border-radius: 8px;
  font-family: inherit;
  font-size: calc(13px + var(--font-size-offset, 0px));
  line-height: 1.5;
  resize: vertical;
}

.memo-input:focus {
  outline: none;
  border-color: var(--teal);
}

.memo-count {
  display: block;
  margin-top: 4px;
  text-align: right;
  font-size: calc(11px + var(--font-size-offset, 0px));
  color: var(--muted);
}

.issue-form--reply {
  margin-top: 10px;
}

.mention-wrap {
  position: relative;
}

.mention-list {
  position: absolute;
  z-index: 5;
  top: calc(100% + 2px);
  left: 0;
  right: 0;
  margin: 0;
  padding: 4px 0;
  list-style: none;
  background: var(--lnb-side);
  border: 1px solid var(--line);
  border-radius: 6px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
  max-height: 140px;
  overflow-y: auto;
}

.mention-list__item {
  width: 100%;
  padding: 6px 10px;
  border: none;
  background: transparent;
  text-align: left;
  font-size: calc(11px + var(--font-size-offset, 0px));
  cursor: pointer;
  font-family: inherit;
}

.mention-list__item:hover {
  background: var(--teal-50);
  color: var(--teal-600);
}

.mention-list__empty {
  padding: 8px 10px;
  font-size: calc(11px + var(--font-size-offset, 0px));
  color: var(--muted);
}

.issue-form {
  margin-bottom: 14px;
  padding: 12px;
  background: var(--line-2);
  border-radius: 8px;
}

.issue-form__input {
  width: 100%;
  padding: 10px 12px;
  border: 1px solid var(--line);
  border-radius: 8px;
  font-family: inherit;
  font-size: calc(13px + var(--font-size-offset, 0px));
  line-height: 1.5;
  resize: vertical;
}

.issue-form__foot {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-top: 8px;
}

.issue-form__count {
  font-size: calc(11px + var(--font-size-offset, 0px));
  color: var(--muted);
}

.issue-form__actions {
  display: flex;
  gap: 6px;
}

.issue-empty {
  text-align: center;
  padding: 24px;
  color: var(--muted);
  font-size: calc(12px + var(--font-size-offset, 0px));
}

.issue-item {
  padding: 14px 0;
  border-top: 1px solid var(--line-2);
}

.issue-item__head {
  display: flex;
  align-items: baseline;
  gap: 10px;
  margin-bottom: 8px;
  flex-wrap: wrap;
}

.issue-item__author {
  font-size: calc(12px + var(--font-size-offset, 0px));
  font-weight: 700;
  color: var(--ink);
}

.issue-item__time {
  font-size: calc(11px + var(--font-size-offset, 0px));
  color: var(--muted);
}

.issue-item__body {
  margin: 0 0 8px;
  font-size: calc(12.5px + var(--font-size-offset, 0px));
  line-height: 1.6;
  color: var(--ink-2);
  white-space: pre-wrap;
}

.issue-item__actions {
  display: flex;
  align-items: center;
  gap: 6px;
}

.issue-item__sep {
  color: var(--line);
  font-size: calc(11px + var(--font-size-offset, 0px));
}

.link-btn {
  border: none;
  background: none;
  color: var(--teal-600);
  font-size: calc(11.5px + var(--font-size-offset, 0px));
  font-weight: 600;
  cursor: pointer;
  font-family: inherit;
}

.issue-reply {
  margin: 10px 0 0 20px;
  padding: 10px 0 0 14px;
  border-left: 2px solid var(--line);
}

.actions {
  display: flex;
  justify-content: flex-end;
  gap: 8px;
  margin-top: 4px;
}

.readonly-notice {
  text-align: center;
  padding: 12px;
  font-size: calc(12px + var(--font-size-offset, 0px));
  color: var(--muted);
  background: var(--line-2);
  border-radius: 8px;
}

.btn {
  height: 32px;
  padding: 0 14px;
  border-radius: 7px;
  font-size: calc(12.5px + var(--font-size-offset, 0px));
  font-weight: 600;
  display: inline-flex;
  align-items: center;
  gap: 6px;
  justify-content: center;
  font-family: inherit;
  cursor: pointer;
  border: 1px solid transparent;
}

.btn--sm {
  height: 28px;
  padding: 0 10px;
  font-size: calc(12px + var(--font-size-offset, 0px));
}

.btn--primary {
  background: var(--teal);
  color: var(--color-text-inverse);
}

.btn--primary:hover:not(:disabled) {
  background: var(--teal-600);
}

.btn--primary:disabled {
  opacity: 0.45;
  cursor: not-allowed;
}

.btn--ghost {
  background: var(--lnb-side);
  border-color: var(--line);
  color: var(--ink-2);
}

.btn--ghost:hover:not(:disabled) {
  border-color: var(--teal-100);
  color: var(--teal-600);
}

.btn--ghost:disabled {
  opacity: 0.45;
  cursor: not-allowed;
}

.alert-scrim {
  position: fixed;
  inset: 0;
  background: rgba(18, 30, 34, 0.34);
  z-index: 1300;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 16px;
}

.alert-box {
  width: 330px;
  background: var(--lnb-side);
  border-radius: 14px;
  padding: 24px 22px 18px;
  text-align: center;
  box-shadow: 0 6px 24px rgba(20, 40, 50, 0.12);
}

.alert-box__icon {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  background: var(--orange-bg);
  color: var(--orange);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: calc(20px + var(--font-size-offset, 0px));
  font-weight: 700;
  margin: 0 auto 12px;
}

.alert-box__msg {
  margin: 0 0 18px;
  font-size: calc(13.5px + var(--font-size-offset, 0px));
  line-height: 1.6;
  color: var(--ink);
}

.alert-box__actions {
  display: flex;
  gap: 8px;
}

.alert-box__actions .btn {
  flex: 1;
}
</style>
