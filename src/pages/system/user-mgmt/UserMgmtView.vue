<script setup>
// PAG-M-SYS-01 사용자 관리
import { computed, onMounted, reactive, ref } from 'vue'
import {
  roleOptions,
  positionOptions,
  employmentStatusOptions,
  pageSizeOptions,
  userList,
  userStatusClass,
} from '@/entities/user-admin/userMgmt'
import { listOrgUnits, orgUnitKindLabel } from '@/entities/org-admin/mock/orgAdmin'
import BaseModal from '@/shared/ui/BaseModal.vue'
import SearchFilterBar from '@/shared/ui/SearchFilterBar.vue'
import FilterSelectPill from '@/shared/ui/FilterSelectPill.vue'
import HpPagination from '@/shared/ui/HpPagination.vue'
import HpPasswordToggle from '@/shared/ui/HpPasswordToggle.vue'

const pageSizeOptionsLocal = pageSizeOptions

function buildOrgUnitOptions(units) {
  const byParent = new Map()
  for (const unit of units) {
    const list = byParent.get(unit.parentId) ?? []
    list.push(unit)
    byParent.set(unit.parentId, list)
  }
  const result = []
  function walk(parentId, depth) {
    for (const unit of byParent.get(parentId) ?? []) {
      result.push({ id: unit.id, label: '　'.repeat(depth) + unit.name, name: unit.name })
      walk(unit.id, depth + 1)
    }
  }
  walk(null, 0)
  return result
}

const orgUnitOptions = ref([])
const orgUnits = ref([])

/**
 * 좌측 조직 트리 — 목록을 조직으로 묶지 않고 "필터"로만 쓴다(h-pms 이식). 선택한 조직명과
 * 정확히 같은 소속팀(dept)을 가진 사용자만 남긴다 — 하위 조직까지 끌어오면 트리에서 고른
 * 노드와 목록이 어긋난다. userMgmt.js의 dept는 자유 문자열이라 org-admin 목업 트리에 없는
 * 이름(테크기획팀·IT기획팀 등)도 있다 — 그런 소속은 트리로는 못 좁히고 검색/필터로만 찾는다.
 */
function flattenOrgTree(units) {
  const byParent = new Map()
  for (const unit of units) {
    const list = byParent.get(unit.parentId) ?? []
    list.push(unit)
    byParent.set(unit.parentId, list)
  }
  const result = []
  function walk(parentId, depth) {
    for (const unit of byParent.get(parentId) ?? []) {
      result.push({ ...unit, depth, hasChildren: (byParent.get(unit.id) ?? []).length > 0 })
      walk(unit.id, depth + 1)
    }
  }
  walk(null, 0)
  return result
}

function defaultCollapsedIds(rows) {
  return new Set(rows.filter((row) => row.unitKind === 'TEAM' && row.hasChildren).map((row) => row.id))
}

const orgTree = ref([])
const orgCollapsed = ref(new Set())
const selectedOrgUnitId = ref(null)
const visibleOrgTree = computed(() => {
  const hidden = new Set()
  return orgTree.value.filter((row) => {
    if (row.parentId !== null && hidden.has(row.parentId)) {
      hidden.add(row.id)
      return false
    }
    if (orgCollapsed.value.has(row.id)) hidden.add(row.id)
    return true
  })
})

function toggleOrgNode(row) {
  const next = new Set(orgCollapsed.value)
  if (next.has(row.id)) next.delete(row.id)
  else next.add(row.id)
  orgCollapsed.value = next
}

/** 같은 조직을 다시 누르면 선택을 푼다 — 전체로 돌아가는 별도 버튼을 두지 않기 위해서다. */
function selectOrgUnit(row) {
  selectedOrgUnitId.value = selectedOrgUnitId.value === row.id ? null : row.id
  if (selectedOrgUnitId.value !== null) filters.unassigned = '' // 조직 선택과 미소속 필터는 동시에 걸 수 없다.
  search()
}

const rows = ref(userList.map((r) => ({
  ...r,
  userKey: r.id,
  loginId: r.id,
  department: r.dept || '',
  active: !['잠금', '퇴직', '정직'].includes(r.status),
  loginLocked: r.status === '잠금' || r.failCount >= 5,
  loginFailCount: r.failCount,
  statusCode: r.status,
  empType: r.type === '외주' ? 'CONTRACTOR' : 'EMPLOYEE',
  roleCode: r.role,
  createdAt: r.registeredAt,
  updatedAt: r.updatedAt,
})))

const filters = reactive({
  keyword: '',
  roleCode: '',
  active: '',
  statusCode: '',
  unassigned: '',
})
const applied = ref({ ...filters })
const pageSize = ref(20)
const currentPage = ref(1)
const selectedKeys = ref([])

const roleFilterOptions = computed(() => [
  { value: '', label: '전체' },
  ...roleOptions.filter((r) => r !== '전체' && r !== '미설정').map((r) => ({ value: r, label: r })),
])

const statusFilterOptions = computed(() => [
  { value: '', label: '전체' },
  ...employmentStatusOptions.map((s) => ({ value: s, label: s })),
  { value: '잠금', label: '잠금' },
])

const filtered = computed(() =>
  rows.value.filter((user) => {
    const f = applied.value
    if (f.keyword) {
      const q = f.keyword.toLowerCase()
      if (!user.name.toLowerCase().includes(q) && !user.loginId.toLowerCase().includes(q)) return false
    }
    if (f.roleCode && user.roleCode !== f.roleCode) return false
    if (f.active === 'true' && !user.active) return false
    if (f.active === 'false' && user.active) return false
    if (f.statusCode && user.status !== f.statusCode) return false
    if (f.unassigned === 'true' && user.department) return false
    if (selectedOrgUnitId.value !== null) {
      const node = orgTree.value.find((n) => n.id === selectedOrgUnitId.value)
      if (!node || user.department !== node.name) return false
    }
    return true
  }),
)

/**
 * 미소속 인원 수 — 현재 필터·조직 선택과 무관하게 화면 전역에서 안내한다(h-pms 이식).
 * 조직 비활성이 소속 인원을 미소속으로 바꾸는 시나리오는 이 목업엔 없지만, 등록·수정으로
 * 소속팀이 비워질 수 있어 배너 자체는 그대로 둔다.
 */
const unassignedCount = computed(() => rows.value.filter((r) => !r.department).length)

/** 배너를 누르면 이 필터로 바로 좁혀 본다 — 조직 선택과는 동시에 걸 수 없다. */
function filterUnassigned() {
  selectedOrgUnitId.value = null
  filters.unassigned = 'true'
  search()
}

const totalPages = computed(() => Math.max(1, Math.ceil(filtered.value.length / pageSize.value)))
const paged = computed(() => {
  const start = (currentPage.value - 1) * pageSize.value
  return filtered.value.slice(start, start + pageSize.value)
})

function displayStatusLabel(user) {
  if (user.loginLocked || user.status === '잠금') return '잠금'
  return user.status
}

function displayStatusClass(user) {
  return userStatusClass(displayStatusLabel(user))
}

function search() {
  applied.value = { ...filters }
  currentPage.value = 1
  selectedKeys.value = []
}

function resetFilters() {
  Object.assign(filters, { keyword: '', roleCode: '', active: '', statusCode: '', unassigned: '' })
  selectedOrgUnitId.value = null
  search()
}

function toggleSelect(userKey) {
  const idx = selectedKeys.value.indexOf(userKey)
  if (idx >= 0) selectedKeys.value.splice(idx, 1)
  else selectedKeys.value.push(userKey)
}

function toggleSelectAll(e) {
  selectedKeys.value = e.target.checked ? paged.value.map((r) => r.userKey) : []
}

function tempPassword() {
  const today = new Date()
  const y = today.getFullYear()
  const m = String(today.getMonth() + 1).padStart(2, '0')
  const d = String(today.getDate()).padStart(2, '0')
  return `ez!${y}${m}${d}`
}

const issuedPasswords = ref(null)
/** 발급 직후엔 가려 두고 필요할 때만 눈 아이콘으로 확인한다(HpPasswordToggle 이식). */
const revealedPasswords = ref(new Set())

function togglePasswordVisible(loginId) {
  const next = new Set(revealedPasswords.value)
  if (next.has(loginId)) next.delete(loginId)
  else next.add(loginId)
  revealedPasswords.value = next
}

async function copyIssuedPassword(temporaryPassword) {
  try {
    await navigator.clipboard.writeText(temporaryPassword)
    window.alert('비밀번호를 복사했습니다.')
  } catch {
    window.alert('복사에 실패했습니다. 직접 선택해 복사해 주세요.')
  }
}

function bulkUnlockLogin() {
  if (!selectedKeys.value.length) {
    window.alert('대상 사용자를 선택해 주세요.')
    return
  }
  if (!window.confirm(`선택한 ${selectedKeys.value.length}명의 오류 횟수를 해제하시겠습니까?`)) return
  rows.value.forEach((r) => {
    if (selectedKeys.value.includes(r.userKey)) {
      r.loginFailCount = 0
      r.failCount = 0
      r.loginLocked = false
      if (r.status === '잠금') r.status = '재직'
    }
  })
  window.alert('오류 횟수를 해제했습니다.')
  selectedKeys.value = []
  search()
}

function bulkResetPassword() {
  if (!selectedKeys.value.length) {
    window.alert('대상 사용자를 선택해 주세요.')
    return
  }
  if (!window.confirm(`선택한 ${selectedKeys.value.length}명의 비밀번호를 초기화하시겠습니까?`)) return
  const temp = tempPassword()
  revealedPasswords.value = new Set()
  issuedPasswords.value = selectedKeys.value.map((key) => {
    const user = rows.value.find((r) => r.userKey === key)
    return { loginId: user?.loginId ?? key, name: user?.name ?? '', temporaryPassword: temp }
  })
  selectedKeys.value = []
}

/*
 * 입력 검증 패턴(h-pms 이식) — 등록·수정 두 폼이 같이 쓴다. 통과하면 null, 아니면 한국어 문구.
 */
const LOGIN_ID_PATTERN = /^[A-Za-z0-9]+$/
const NAME_PATTERN = /^[가-힣A-Za-z0-9 ]+$/
const EMAIL_PATTERN = /^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$/

function emailError(email) {
  if (!email.trim()) return '이메일을 입력해 주세요.'
  return EMAIL_PATTERN.test(email.trim()) ? null : '이메일 형식이 올바르지 않습니다.'
}

const creating = ref(false)
const newUser = ref({
  loginId: '',
  name: '',
  email: '',
  orgUnitId: null,
  position: positionOptions[0],
  empType: 'EMPLOYEE',
  roleCode: '사용자',
})
const idAvailable = ref(null)

/** 아이디에 한글·특수문자가 입력되지 않게 막는다(h-pms 이식) — 점·밑줄·붙임표도 제외. */
function onNewUserIdInput(event) {
  const input = event.target
  const filtered = input.value.replace(/[^A-Za-z0-9]/g, '')
  if (filtered !== input.value) {
    input.value = filtered
    newUser.value.loginId = filtered
  }
  idAvailable.value = null
}

function checkDuplicateId() {
  const id = newUser.value.loginId.trim()
  if (!id) {
    window.alert('사번(ID)을 입력해 주세요.')
    return
  }
  if (rows.value.some((r) => r.loginId.toLowerCase() === id.toLowerCase())) {
    idAvailable.value = false
    window.alert('이미 사용 중인 사번(ID)입니다.')
    return
  }
  idAvailable.value = true
  window.alert('사용 가능한 사번(ID)입니다.')
}

function openCreate() {
  newUser.value = {
    loginId: '',
    name: '',
    email: '',
    orgUnitId: orgUnitOptions.value[0]?.id ?? null,
    position: positionOptions[0],
    empType: 'EMPLOYEE',
    roleCode: '사용자',
  }
  idAvailable.value = null
  creating.value = true
}

function saveNewUser() {
  const form = newUser.value
  if (!form.loginId.trim() || !form.name.trim() || !form.email.trim() || !form.orgUnitId || !form.roleCode) {
    window.alert('사번(ID)·이름·이메일·소속팀·역할은 필수입니다.')
    return
  }
  if (!LOGIN_ID_PATTERN.test(form.loginId.trim())) {
    window.alert('사번(ID)은 영문·숫자만 쓸 수 있습니다.')
    return
  }
  if (!NAME_PATTERN.test(form.name.trim())) {
    window.alert('이름에는 특수문자를 쓸 수 없습니다.')
    return
  }
  const emailMessage = emailError(form.email)
  if (emailMessage) {
    window.alert(emailMessage)
    return
  }
  if (idAvailable.value !== true) {
    window.alert('사번(ID) 중복확인을 해주세요.')
    return
  }
  const dept = orgUnitOptions.value.find((o) => o.id === form.orgUnitId)?.name ?? ''
  const now = new Date().toISOString().slice(0, 10)
  const temp = tempPassword()
  rows.value.unshift({
    id: form.loginId.trim(),
    userKey: form.loginId.trim(),
    loginId: form.loginId.trim(),
    name: form.name.trim(),
    dept,
    department: dept,
    role: form.roleCode,
    roleCode: form.roleCode,
    position: form.position,
    email: form.email.trim(),
    phone: '',
    type: form.empType === 'CONTRACTOR' ? '외주' : '임직원',
    empType: form.empType,
    status: '재직',
    statusCode: '재직',
    active: true,
    loginLocked: false,
    loginFailCount: 0,
    failCount: 0,
    memo: '',
    registeredAt: now,
    updatedAt: now,
    createdAt: now,
  })
  creating.value = false
  revealedPasswords.value = new Set()
  issuedPasswords.value = [{ loginId: form.loginId.trim(), name: form.name.trim(), temporaryPassword: temp }]
  search()
}

const editing = ref(null)
const editForm = ref({ orgUnitId: 0, position: '', empType: '', roleCode: '', statusCode: '', email: '' })

function openDetail(user) {
  editing.value = user
  const currentOrgUnit = orgUnitOptions.value.find((u) => u.name === user.department)
  editForm.value = {
    orgUnitId: currentOrgUnit?.id ?? orgUnitOptions.value[0]?.id ?? 0,
    position: user.position,
    empType: user.empType,
    roleCode: user.roleCode,
    statusCode: user.statusCode,
    email: user.email,
  }
}

function closeDetail() {
  editing.value = null
}

function saveDetail() {
  const user = editing.value
  if (!user) return
  const form = editForm.value

  // 이메일은 저장 전에 막는다 — 다른 필드가 먼저 반영되고 나서 실패하면 절반만 반영된다.
  if (form.email.trim() !== user.email) {
    const emailMessage = emailError(form.email)
    if (emailMessage) {
      window.alert(emailMessage)
      return
    }
  }

  if (form.statusCode !== user.statusCode) {
    const blocksLogin = ['잠금', '퇴직', '정직'].includes(form.statusCode)
    const msg = blocksLogin
      ? `${user.name} 사용자를 '${form.statusCode}'(으)로 변경하고 로그인을 차단하시겠습니까? 복귀 시에는 상태 변경 후 '로그인 차단 해제'를 다시 눌러야 합니다.`
      : `${user.name} 사용자를 '${form.statusCode}'(으)로 변경하시겠습니까? 로그인 허용은 그대로 유지됩니다.`
    if (!window.confirm(msg)) return
  }

  const dept = orgUnitOptions.value.find((o) => o.id === form.orgUnitId)?.name ?? user.department
  user.department = dept
  user.dept = dept
  user.position = form.position
  user.empType = form.empType
  user.type = form.empType === 'CONTRACTOR' ? '외주' : '임직원'
  user.roleCode = form.roleCode
  user.role = form.roleCode
  user.email = form.email.trim()
  user.statusCode = form.statusCode
  user.status = form.statusCode
  user.active = !['잠금', '퇴직', '정직'].includes(form.statusCode)
  user.updatedAt = new Date().toISOString().slice(0, 10)
  window.alert('저장되었습니다.')
  closeDetail()
  search()
}

function resetDetailPassword() {
  const user = editing.value
  if (!user) return
  if (!window.confirm(`${user.name}님의 비밀번호를 임시 비밀번호로 초기화하시겠습니까?`)) return
  revealedPasswords.value = new Set()
  issuedPasswords.value = [{ loginId: user.loginId, name: user.name, temporaryPassword: tempPassword() }]
}

function unlockDetailFails() {
  const user = editing.value
  if (!user) return
  if (!window.confirm(`${user.name}님의 오류 횟수를 해제하시겠습니까?`)) return
  user.loginFailCount = 0
  user.failCount = 0
  user.loginLocked = false
  if (user.status === '잠금') user.status = '재직'
  window.alert('오류 횟수를 해제했습니다.')
  closeDetail()
  search()
}

function toggleDetailActive() {
  const user = editing.value
  if (!user) return
  const nextActive = !user.active
  const msg = nextActive
    ? `${user.name} 사용자의 로그인을 허용하시겠습니까?`
    : `${user.name} 사용자의 로그인을 차단하시겠습니까? 재직상태는 그대로 유지됩니다.`
  if (!window.confirm(msg)) return
  user.active = nextActive
  window.alert('로그인 허용을 변경했습니다.')
  closeDetail()
}

onMounted(() => {
  orgUnits.value = listOrgUnits()
  orgUnitOptions.value = buildOrgUnitOptions(orgUnits.value)
  orgTree.value = flattenOrgTree(orgUnits.value)
  orgCollapsed.value = defaultCollapsedIds(orgTree.value)
})
</script>

<template>
  <main class="user-mgmt-page admin-page hp-anim-enter">
    <button
      v-if="unassignedCount > 0"
      type="button"
      class="notice notice--danger notice--clickable"
      @click="filterUnassigned"
    >
      ⓘ 미소속 사용자가 {{ unassignedCount }}명 있습니다 — 눌러서 확인하세요.
    </button>

    <SearchFilterBar
      v-model:search="filters.keyword"
      search-placeholder="이름/사번(ID) 검색"
      @reset="resetFilters"
      @search="search"
    >
      <template #primary>
        <FilterSelectPill v-model="filters.roleCode" class="sfb-w-md" label="권한" :options="roleFilterOptions" />
        <FilterSelectPill
          v-model="filters.active"
          class="sfb-w-xs"
          label="로그인"
          :options="[
            { value: '', label: '전체' },
            { value: 'true', label: '허용' },
            { value: 'false', label: '차단' },
          ]"
        />
        <FilterSelectPill v-model="filters.statusCode" class="sfb-w-sm" label="상태" :options="statusFilterOptions" />
        <FilterSelectPill
          v-model="filters.unassigned"
          class="sfb-w-sm"
          label="소속"
          :options="[
            { value: '', label: '전체' },
            { value: 'true', label: '미소속만' },
          ]"
        />
      </template>
    </SearchFilterBar>

    <!-- 트리는 필터다(목록을 조직으로 묶지 않는다) — 위 selectOrgUnit 주석 참고.
         골격·스크롤은 공통코드 관리(코드 분류 패널)와 같은 공용 클래스를 쓴다. -->
    <div class="admin-split">
      <aside class="card card--panel admin-side">
        <div class="admin-side__head">
          <h3 class="admin-side__title">조직</h3>
          <button
            v-if="selectedOrgUnitId !== null"
            type="button"
            class="btn btn--ghost btn--sm"
            @click="selectedOrgUnitId = null; search()"
          >
            전체 보기
          </button>
        </div>
        <div class="admin-side__scroll">
          <div
            v-for="node in visibleOrgTree"
            :key="node.id"
            class="org-node"
            :style="{ paddingLeft: `${node.depth * 12}px` }"
          >
            <button
              v-if="node.hasChildren"
              type="button"
              class="org-node__toggle"
              :aria-label="orgCollapsed.has(node.id) ? '펼치기' : '접기'"
              @click="toggleOrgNode(node)"
            >
              {{ orgCollapsed.has(node.id) ? '▸' : '▾' }}
            </button>
            <span v-else class="org-node__toggle org-node__toggle--leaf" aria-hidden="true">·</span>
            <button
              type="button"
              class="admin-side__item"
              :class="{ 'is-on': selectedOrgUnitId === node.id }"
              :title="orgUnitKindLabel(node.unitKind)"
              @click="selectOrgUnit(node)"
            >
              {{ node.name }}
            </button>
          </div>
        </div>
      </aside>

      <div class="admin-main">
        <div class="toolbar">
          <span class="toolbar__count">총 <b>{{ filtered.length }}</b>명</span>
          <select v-model="pageSize" class="hp-pagesize-select" @change="currentPage = 1">
            <option v-for="n in pageSizeOptionsLocal" :key="n" :value="n">{{ n }}건씩 보기</option>
          </select>
          <div class="toolbar__actions">
            <button type="button" class="btn btn--ghost btn--sm" @click="bulkUnlockLogin">잠김 해제</button>
            <button type="button" class="btn btn--ghost btn--sm" @click="bulkResetPassword">비밀번호 초기화</button>
            <button type="button" class="btn btn--primary btn--sm" @click="openCreate">＋ 사용자 등록</button>
          </div>
        </div>

        <div class="listcard card--panel">
          <div class="listcard__scroll">
            <table class="data-table">
              <thead>
                <tr>
                  <th style="width: 36px"><input type="checkbox" @change="toggleSelectAll" /></th>
                  <th class="cell--center">사번(ID)</th>
                  <th class="cell--center">이름</th>
                  <th class="cell--center">소속팀</th>
                  <th class="cell--center">직급</th>
                  <th class="cell--center">권한</th>
                  <th class="cell--center">상태</th>
                  <th class="cell--center">등록일</th>
                  <th class="cell--center">수정일</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="row in paged" :key="row.userKey" @click="openDetail(row)">
                  <td class="cell--center" @click.stop>
                    <input type="checkbox" :checked="selectedKeys.includes(row.userKey)" @change="toggleSelect(row.userKey)" />
                  </td>
                  <td class="cell--center">{{ row.loginId }}</td>
                  <td class="cell--center"><span class="tbl__name">{{ row.name }}</span></td>
                  <td class="cell--center">
                    <span v-if="row.department">{{ row.department }}</span>
                    <span v-else class="badge badge--unassigned">미소속</span>
                  </td>
                  <td class="cell--center">{{ row.position }}</td>
                  <td class="cell--center">{{ row.roleCode }}</td>
                  <td class="cell--center">
                    <span class="badge" :class="`badge--${displayStatusClass(row)}`">{{ displayStatusLabel(row) }}</span>
                  </td>
                  <td class="tbl__muted cell--center">{{ row.createdAt || '-' }}</td>
                  <td class="tbl__muted cell--center">{{ row.updatedAt || '-' }}</td>
                  <td class="cell--center">
                    <button type="button" class="btn btn--ghost btn--sm" @click.stop="openDetail(row)">수정</button>
                  </td>
                </tr>
                <tr v-if="!paged.length">
                  <td colspan="10" class="empty">조회 결과가 없습니다.</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        <HpPagination v-model:page="currentPage" :total-pages="totalPages" />
      </div>
    </div>

    <BaseModal :visible="creating" title="사용자 등록" wide @close="creating = false">
      <div class="create-grid">
        <label class="create-grid__wide">
          사번(ID)
          <div class="id-check-row">
            <input v-model="newUser.loginId" class="filter__input" type="text" placeholder="영문·숫자" @input="onNewUserIdInput" />
            <button type="button" class="btn btn--ghost btn--sm" @click="checkDuplicateId">중복확인</button>
          </div>
          <p v-if="idAvailable === true" class="id-check-hint id-check-hint--ok">사용 가능한 사번(ID)입니다.</p>
          <p v-else-if="idAvailable === false" class="id-check-hint id-check-hint--err">이미 사용 중인 사번(ID)입니다.</p>
        </label>
        <label>이름<input v-model="newUser.name" class="filter__input" type="text" /></label>
        <label>이메일<input v-model="newUser.email" class="filter__input" type="email" placeholder="example@ezwel.com" /></label>
        <label>
          소속팀
          <select v-model="newUser.orgUnitId" class="filter__select">
            <option v-for="o in orgUnitOptions" :key="o.id" :value="o.id">{{ o.label }}</option>
          </select>
        </label>
        <label>
          직급
          <select v-model="newUser.position" class="filter__select">
            <option v-for="p in positionOptions" :key="p" :value="p">{{ p }}</option>
          </select>
        </label>
        <label>
          구분
          <select v-model="newUser.empType" class="filter__select">
            <option value="EMPLOYEE">임직원</option>
            <option value="CONTRACTOR">외주</option>
          </select>
        </label>
        <label>
          권한
          <select v-model="newUser.roleCode" class="filter__select">
            <option v-for="role in roleOptions.filter((r) => r !== '전체' && r !== '미설정')" :key="role" :value="role">{{ role }}</option>
          </select>
        </label>
      </div>
      <p class="hint">비밀번호는 규칙(BR-86)에 따라 자동 생성됩니다. 등록 후 화면에 한 번 표시됩니다.</p>
      <template #footer>
        <button type="button" class="btn btn--ghost" @click="creating = false">취소</button>
        <button type="button" class="btn btn--primary" @click="saveNewUser">등록</button>
      </template>
    </BaseModal>

    <BaseModal :visible="!!editing" title="사용자 정보" wide @close="closeDetail">
      <div v-if="editing" class="detail-body">
        <div class="identity-line">
          <span class="identity-line__name">{{ editing.name }}</span>
          <span class="identity-line__sep">·</span>
          <span class="identity-line__id">{{ editing.loginId }}</span>
          <span class="identity-line__sep">·</span>
          <span class="identity-line__email">{{ editing.email }}</span>
        </div>

        <div class="modal-grid">
          <div class="modal-field">
            <label>소속팀</label>
            <select v-model="editForm.orgUnitId" class="filter__select">
              <option v-for="o in orgUnitOptions" :key="o.id" :value="o.id">{{ o.label }}</option>
            </select>
          </div>
          <div class="modal-field">
            <label>직급</label>
            <select v-model="editForm.position" class="filter__select">
              <option v-for="p in positionOptions" :key="p" :value="p">{{ p }}</option>
            </select>
          </div>
          <div class="modal-field">
            <label>구분</label>
            <select v-model="editForm.empType" class="filter__select">
              <option value="EMPLOYEE">임직원</option>
              <option value="CONTRACTOR">외주</option>
            </select>
          </div>
          <div class="modal-field">
            <label>권한</label>
            <select v-model="editForm.roleCode" class="filter__select">
              <option v-for="role in roleOptions.filter((r) => r !== '전체' && r !== '미설정')" :key="role" :value="role">{{ role }}</option>
            </select>
          </div>
          <!-- 종전에는 헤더에 표시만 되고 입력란이 없었다(h-pms r1 FND-POP-M-SYS-03-19-6318 이식). -->
          <div class="modal-field">
            <label>이메일</label>
            <input v-model="editForm.email" class="filter__input" type="email" maxlength="100" />
          </div>
          <div class="modal-field">
            <label>재직상태</label>
            <select v-model="editForm.statusCode" class="filter__select">
              <option v-for="s in employmentStatusOptions" :key="s" :value="s">{{ s }}</option>
              <option value="잠금">잠금</option>
            </select>
          </div>
        </div>

        <p class="sec-title">계정 관리</p>
        <div class="account-status-line">
          <span class="account-status-line__item">
            로그인 가능 상태
            <span class="badge" :class="editing.active ? 'badge--ok' : 'badge--muted'">
              {{ editing.active ? '허용' : '차단' }}
            </span>
          </span>
          <span class="account-status-line__item">
            로그인 오류 횟수
            <b :class="{ 'account-status-line__count--danger': editing.loginLocked }">{{ editing.loginFailCount }}</b>회
          </span>
          <div class="account-actions">
            <button type="button" class="btn btn--ghost btn--sm" @click="toggleDetailActive">
              {{ editing.active ? '로그인 차단' : '로그인 차단 해제' }}
            </button>
            <button v-if="editing.loginLocked" type="button" class="btn btn--ghost btn--sm" @click="unlockDetailFails">잠김 해제</button>
            <button type="button" class="btn btn--ghost btn--sm" @click="resetDetailPassword">비밀번호 초기화</button>
          </div>
        </div>
      </div>
      <template #footer>
        <button type="button" class="btn btn--ghost" @click="closeDetail">닫기</button>
        <button type="button" class="btn btn--primary" @click="saveDetail">저장</button>
      </template>
    </BaseModal>

    <BaseModal :visible="!!issuedPasswords" title="임시 비밀번호 발급" @close="issuedPasswords = null">
      <p class="issued-notice">이 화면을 벗어나면 다시 확인할 수 없습니다. 당사자에게 전달한 뒤 닫으세요.</p>
      <table class="issued-table">
        <thead>
          <tr>
            <th>사번(ID)</th>
            <th>이름</th>
            <th>신규 패스워드</th>
            <th></th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="item in issuedPasswords" :key="item.loginId">
            <td>{{ item.loginId }}</td>
            <td>{{ item.name }}</td>
            <td>
              <span class="issued-pw">
                <code>{{ revealedPasswords.has(item.loginId) ? item.temporaryPassword : '••••••••' }}</code>
                <HpPasswordToggle
                  :model-value="revealedPasswords.has(item.loginId)"
                  @update:model-value="togglePasswordVisible(item.loginId)"
                />
              </span>
            </td>
            <td>
              <button type="button" class="btn btn--ghost btn--sm" @click="copyIssuedPassword(item.temporaryPassword)">복사</button>
            </td>
          </tr>
        </tbody>
      </table>
      <template #footer>
        <button type="button" class="btn btn--primary" @click="issuedPasswords = null">확인</button>
      </template>
    </BaseModal>
  </main>
</template>

<style scoped>
/*
 * 좌측 조직 트리 패널(h-pms 이식). 골격(.admin-split/.admin-side/.admin-side__scroll)은
 * 공통코드 관리와 같은 공용 클래스(admin.css)를 쓰고, 여기선 그 위에 얹는 페이지 전용
 * 배치만 손본다 — 카드에 overflow:hidden을 두고 내부에 스크롤 컨테이너를 따로 둬 스크롤바가
 * 카드의 둥근 모서리를 넘어 그려지지 않게 한다.
 */
.admin-side { overflow: hidden; display: flex; flex-direction: column; }

/* 공용 .admin-side__head는 세로 배치다(공통코드 관리는 제목만 둔다). 여기선 '전체 보기'를
   제목과 같은 줄 오른쪽에 붙인다 — 제목 아래 한 줄을 더 쓰면 트리 목록이 그만큼 짧아진다. */
.admin-side__head {
  flex-direction: row;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
}
.admin-side__head .btn {
  flex: 0 0 auto;
  padding: 3px 8px;
  white-space: nowrap;
}

/* 공통코드 관리(코드 분류 패널)와 같은 방식으로 목록 부분에만 스크롤을 건다. */
.admin-side__scroll {
  max-height: calc(100vh - 260px);
  overflow-y: auto;
  padding: 4px 4px 8px;
}

/* 트리 한 줄 = 접기 토글 + 항목 버튼. 들여쓰기는 줄 전체에 준다. */
.org-node { display: flex; align-items: center; }
.org-node__toggle {
  width: 16px;
  flex: 0 0 16px;
  border: 0;
  background: none;
  padding: 0;
  font-size: calc(11.2px + var(--font-size-offset));
  color: var(--lnb-muted);
  cursor: pointer;
}
.org-node__toggle--leaf { cursor: default; opacity: 0.45; }

/* .notice가 <div>를 전제한 스타일이라, 클릭 가능하게 <button>으로 쓸 때 기본 버튼 모양만 지운다. */
.notice--clickable {
  display: block;
  width: 100%;
  text-align: left;
  font-family: inherit;
  cursor: pointer;
}

/* 임시 비밀번호 한 줄 = 가려진 값 + 눈 아이콘(HpPasswordToggle). */
.issued-pw { display: inline-flex; align-items: center; gap: 0.4rem; }

.badge--unassigned {
  display: inline-block;
  padding: 1px 8px;
  border-radius: 10px;
  font-size: calc(11.52px + var(--font-size-offset));
  color: var(--red);
  border: 1px solid currentColor;
}
.cell--center { text-align: center; }
.tbl__muted { color: var(--lnb-muted); }
.empty { text-align: center !important; color: var(--lnb-muted); padding: 24px !important; }

.create-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 0.6rem;
}
.create-grid label {
  display: flex;
  flex-direction: column;
  gap: 0.2rem;
  font-size: var(--font-size-sm);
}
.create-grid__wide { grid-column: 1 / -1; }
.id-check-row { display: flex; gap: 0.4rem; }
.id-check-row input { flex: 1; min-width: 0; }
.id-check-hint { margin: 0.15rem 0 0; font-size: var(--font-size-sm); }
.id-check-hint--ok { color: var(--teal-600); }
.id-check-hint--err { color: var(--red); }

.identity-line {
  display: flex;
  justify-content: center;
  align-items: baseline;
  flex-wrap: wrap;
  gap: 0.4rem;
  margin-top: 0.6rem;
  margin-bottom: 1.6rem;
}
.identity-line__name { font-size: calc(16px + var(--font-size-offset)); font-weight: 700; color: var(--lnb-txt); }
.identity-line__id, .identity-line__email { font-size: calc(13px + var(--font-size-offset)); color: var(--lnb-muted); }
.identity-line__sep { color: var(--lnb-line); }
.detail-body .sec-title { margin-top: 1.6rem; font-weight: 700; color: var(--lnb-logo); }

.account-status-line {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 1.6rem;
  margin-top: 0.6rem;
}
.account-status-line__item {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: calc(12px + var(--font-size-offset));
  font-weight: 600;
  color: var(--lnb-muted);
}
.account-status-line__item b { font-size: calc(13px + var(--font-size-offset)); font-weight: 700; color: var(--lnb-txt); }
.account-status-line__count--danger { color: var(--red); }
.account-actions { display: flex; gap: 0.5rem; margin-left: auto; }
.hint { margin: 0.5rem 0 0; font-size: var(--font-size-sm); color: var(--lnb-muted); }

.issued-notice { margin: 0 0 0.75rem; font-size: var(--font-size-sm); color: var(--lnb-muted); }
.issued-table { width: 100%; border-collapse: collapse; }
.issued-table th, .issued-table td {
  padding: 0.5rem 0.75rem;
  text-align: left;
  border-bottom: 1px solid var(--lnb-line);
  font-size: var(--font-size-sm);
}
.issued-table th { color: var(--lnb-muted); font-weight: 600; }
.issued-table td:nth-child(3) code { font-weight: 700; }

@media (max-width: 1100px) {
  .admin-side__scroll { max-height: 280px; }
}
</style>
