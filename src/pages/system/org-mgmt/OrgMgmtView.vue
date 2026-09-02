<script setup>
// 조직 관리 — 트리 구조 + 조직장 지정 (목업)
import { computed, ref } from 'vue'
import { RouterLink } from 'vue-router'
import {
  assignOrgUnitLeader,
  canBeChildOf,
  canHaveLeader,
  createOrgUnit,
  creatableKindsUnder,
  deactivationScope,
  descendantIds,
  isApprovalScope,
  listLeaderCandidates,
  listOrgUnits,
  moveOrgUnit,
  orgAdminMeta,
  orgUnitKindLabel,
  renameOrgUnit,
  setOrgUnitActive,
  setOrgUnitApprovalFallback,
} from '@/entities/org-admin/mock/orgAdmin'
import BaseModal from '@/shared/ui/BaseModal.vue'
import SearchFilterBar from '@/shared/ui/SearchFilterBar.vue'
import FilterSelectPill from '@/shared/ui/FilterSelectPill.vue'

const rows = ref([])
const leaderCandidates = ref([])
const keyword = ref('')
/** 기본값 '승인 대상만' — 전체 조직 중 실제 결재선은 테크 인력이 있는 팀뿐이라 관리 대상을 좁혀 준다. */
const scopeFilter = ref('APPROVAL')
const inactiveFilter = ref('EXCLUDE')
const includeInactive = computed(() => inactiveFilter.value === 'INCLUDE')
const approvalScopeOnly = computed(() => scopeFilter.value === 'APPROVAL')
/** 접은 노드 id */
const collapsed = ref(new Set())
const savingId = ref(null)
const form = ref(null)
/** 조직장 검색 상태 — 목록에서는 이름만 보여주고, 바꾸는 것은 수정 팝업 안에서 한다. */
const leaderSearch = ref({ keyword: '', open: false })

function flatten(units) {
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

/** 하위를 가진 팀만 기본으로 접는다 — 사업부·담당은 펼쳐 둬야 관리 대상인 팀이 첫 화면에 다 보인다. */
function defaultCollapsedIds(list) {
  return new Set(list.filter((row) => row.unitKind === 'TEAM' && row.hasChildren).map((row) => row.id))
}

function load() {
  const flattened = flatten(listOrgUnits(includeInactive.value))
  // 로드마다 접힘을 초기화하면 펼쳐 둔 상태가 저장 후 되돌아간다 — 첫 로드에만 기본값을 잡는다.
  if (!rows.value.length) {
    collapsed.value = defaultCollapsedIds(flattened)
  }
  rows.value = flattened
  leaderCandidates.value = listLeaderCandidates()
}

load()

function toggle(row) {
  const next = new Set(collapsed.value)
  if (next.has(row.id)) next.delete(row.id)
  else next.add(row.id)
  collapsed.value = next
}

function expandAll() {
  collapsed.value = new Set()
}

/** 상위 2뎁스(회사 + 사업부·담당)만 남기고 그 아래를 접는다. */
function collapseAll() {
  collapsed.value = new Set(rows.value.filter((row) => row.hasChildren && row.depth >= 1).map((row) => row.id))
}

/** 접기 토글을 잠그는 것은 검색 중일 때만이다 — 필터는 행을 줄이고, 검색은 접힘을 무시한다. */
const treeControlsEnabled = computed(() => keyword.value.trim() === '')

/** 검색·범위 필터에 걸린 행 + 그 조상. 조상을 남기지 않으면 트리에서 떠 있는 행이 된다. */
const matchedIds = computed(() => {
  const q = keyword.value.trim()
  if (!q && !approvalScopeOnly.value) return null
  const hit = (row) =>
    (!q || row.name.includes(q) || (row.leaderName ?? '').includes(q)) &&
    (!approvalScopeOnly.value || isApprovalScope(row))
  const byId = new Map(rows.value.map((row) => [row.id, row]))
  const keep = new Set()
  for (const row of rows.value.filter(hit)) {
    keep.add(row.id)
    let parentId = row.parentId
    while (parentId !== null && !keep.has(parentId)) {
      keep.add(parentId)
      parentId = byId.get(parentId)?.parentId ?? null
    }
  }
  return keep
})

const visibleRows = computed(() => {
  const keep = matchedIds.value
  const respectCollapse = treeControlsEnabled.value
  const hiddenParents = new Set()
  return rows.value.filter((row) => {
    if (keep && !keep.has(row.id)) return false
    // 접힌 조상이 하나라도 있으면 숨긴다. 검색 중에는 결과가 묻히지 않게 접힘을 무시한다.
    if (respectCollapse && row.parentId !== null && hiddenParents.has(row.parentId)) {
      hiddenParents.add(row.id)
      return false
    }
    if (respectCollapse && collapsed.value.has(row.id)) hiddenParents.add(row.id)
    return true
  })
})

const fallbackTeam = computed(() => rows.value.find((row) => row.approvalFallback) ?? null)
const fallbackWarning = computed(() => {
  const team = fallbackTeam.value
  if (!team) return '대체 승인 조직이 지정되지 않았습니다. 소속 팀장이 부재인 요청은 승인자를 찾을 수 없습니다.'
  if (team.leaderUserKey === null) {
    return `대체 승인 조직(${team.name})의 조직장이 공석입니다. 소속 팀장이 부재인 요청은 승인자를 찾을 수 없습니다.`
  }
  return null
})

const vacantApprovalTeamCount = computed(
  () => rows.value.filter((row) => row.active && isApprovalScope(row) && row.leaderUserKey === null).length,
)

function parentOptions(target) {
  const excluded = target ? new Set([target.id, ...descendantIds(target.id)]) : new Set()
  return rows.value.filter(
    (row) =>
      row.active &&
      !excluded.has(row.id) &&
      (target ? canBeChildOf(target.unitKind, row.unitKind) : creatableKindsUnder(row.unitKind).length > 0),
  )
}

const creatableKinds = computed(() => {
  if (!form.value || form.value.mode !== 'create') return []
  const parent = rows.value.find((row) => row.id === form.value.parentId)
  return parent ? creatableKindsUnder(parent.unitKind) : []
})

/** 조직장 후보 검색 — 로컬 필터라 서버를 두드리지 않는다. 이름·직급으로 찾는다. */
const leaderSearchResults = computed(() => {
  const q = leaderSearch.value.keyword.trim()
  if (!q) return []
  return leaderCandidates.value.filter((u) => u.name.includes(q) || (u.position ?? '').includes(q)).slice(0, 10)
})

function pickLeader(candidate) {
  if (!form.value) return
  form.value.leaderUserKey = candidate.userKey
  form.value.leaderName = candidate.name
  leaderSearch.value = { keyword: '', open: false }
}

function clearLeader() {
  if (!form.value) return
  form.value.leaderUserKey = null
  form.value.leaderName = null
  leaderSearch.value = { keyword: '', open: false }
}

function resetFilters() {
  keyword.value = ''
  scopeFilter.value = 'APPROVAL'
  if (inactiveFilter.value !== 'EXCLUDE') {
    inactiveFilter.value = 'EXCLUDE'
    load()
  }
}

function openCreate() {
  const firstParent = parentOptions(null)[0]
  leaderSearch.value = { keyword: '', open: false }
  form.value = {
    mode: 'create',
    id: 0,
    name: '',
    parentId: firstParent?.id ?? 0,
    unitKind: firstParent ? (creatableKindsUnder(firstParent.unitKind)[0] ?? '') : '',
    leaderUserKey: null,
    leaderName: null,
  }
}

function openEdit(row) {
  leaderSearch.value = { keyword: '', open: false }
  form.value = {
    mode: 'edit',
    id: row.id,
    name: row.name,
    parentId: row.parentId ?? 0,
    unitKind: row.unitKind,
    leaderUserKey: row.leaderUserKey,
    leaderName: row.leaderName,
  }
}

/** 수정 팝업이 대상으로 삼은 행. 비활성 조직은 이름·상위를 바꿀 수 없어 표시만 한다. */
const editingRow = computed(() =>
  form.value?.mode === 'edit' ? (rows.value.find((row) => row.id === form.value.id) ?? null) : null,
)

function onParentChange() {
  if (form.value?.mode === 'create' && !creatableKinds.value.includes(form.value.unitKind)) {
    form.value.unitKind = creatableKinds.value[0] ?? ''
  }
}

function submitForm() {
  const input = form.value
  if (!input) return
  if (!input.name.trim()) {
    window.alert('조직명을 입력하세요.')
    return
  }
  savingId.value = input.id
  try {
    if (input.mode === 'create') {
      const created = createOrgUnit(input.parentId, input.name.trim(), input.unitKind)
      window.alert(`${created.name}을(를) 신설했습니다.`)
    } else {
      const current = rows.value.find((row) => row.id === input.id)
      if (current && input.name.trim() !== current.name) {
        renameOrgUnit(input.id, input.name.trim())
      }
      if (current && input.parentId !== current.parentId) {
        moveOrgUnit(input.id, input.parentId)
      }
      if (current && input.leaderUserKey !== current.leaderUserKey) {
        assignOrgUnitLeader(input.id, input.leaderUserKey)
      }
      window.alert(
        current && input.parentId !== current.parentId
          ? '상위 조직을 옮겼습니다. 승인자가 바뀐 결재 대기 건은 취소되고 요청자에게 알림이 갑니다.'
          : '조직 정보를 저장했습니다.',
      )
    }
    form.value = null
    load()
  } catch (err) {
    window.alert(err.message || '저장에 실패했습니다.')
  } finally {
    savingId.value = null
  }
}

function markApprovalFallback(row) {
  if (
    !window.confirm(
      `${row.name}을(를) 대체 승인 조직으로 지정하시겠습니까? 소속 팀장이 부재인 요청의 승인자가 ${row.name} 조직장으로 바뀝니다.`,
    )
  ) {
    return
  }
  savingId.value = row.id
  try {
    setOrgUnitApprovalFallback(row.id)
    window.alert(`대체 승인 조직을 ${row.name}으로 지정했습니다.`)
    load()
  } catch (err) {
    window.alert(err.message || '지정에 실패했습니다.')
  } finally {
    savingId.value = null
  }
}

/** 수정 팝업 안에서 호출한다 — 목록 행에 두면 트리를 훑다가 잘못 누르기 쉬운 조작이다. */
function toggleActive(row) {
  if (row.active) {
    const scope = deactivationScope(row.id)
    const ok = window.confirm(
      scope.members > 0
        ? `${row.name} 및 하위 조직 ${scope.units}개를 비활성하고, 소속 인원 ${scope.members}명을 미소속으로 전환합니다. 진행하시겠습니까?`
        : `${row.name} 및 하위 조직 ${scope.units}개를 비활성합니다. 진행하시겠습니까?`,
    )
    if (!ok) return
  }
  savingId.value = row.id
  try {
    setOrgUnitActive(row.id, !row.active)
    window.alert(row.active ? `${row.name}을(를) 비활성했습니다.` : `${row.name}을(를) 다시 활성했습니다.`)
    form.value = null
    load()
  } catch (err) {
    window.alert(err.message || '상태 변경에 실패했습니다.')
  } finally {
    savingId.value = null
  }
}
</script>

<template>
  <main class="admin-page hp-anim-enter">
    <div class="notice">
      ⓘ 소속 팀의 팀장이 부재(공석·퇴직)면 대체 승인 조직 팀장이 승인자가 됩니다.<br />
      비활성은 하위 조직까지 함께 내리고 소속 인원을 미소속으로 전환합니다.
    </div>

    <SearchFilterBar
      v-model:search="keyword"
      search-placeholder="조직명 또는 조직장명"
      @reset="resetFilters"
      @search="load"
    >
      <template #primary>
        <FilterSelectPill
          v-model="scopeFilter"
          class="sfb-w-md"
          label="범위"
          :options="[
            { value: 'APPROVAL', label: '승인 대상만' },
            { value: 'ALL', label: '전체 조직' },
          ]"
        />
        <FilterSelectPill
          v-model="inactiveFilter"
          class="sfb-w-sm"
          label="비활성"
          :options="[
            { value: 'EXCLUDE', label: '제외' },
            { value: 'INCLUDE', label: '포함' },
          ]"
          @update:model-value="load"
        />
      </template>
      <template #actions-before>
        <!-- 트리 조작은 조건이 아니라 보기 방식이라 조회 버튼 앞에 둔다. -->
        <button type="button" class="sfb__btn sfb__btn--ghost" :disabled="!treeControlsEnabled" @click="expandAll">
          모두 펼치기
        </button>
        <button type="button" class="sfb__btn sfb__btn--ghost" :disabled="!treeControlsEnabled" @click="collapseAll">
          모두 접기
        </button>
      </template>
    </SearchFilterBar>

    <div class="toolbar">
      <span class="toolbar__count">
        조직 <b>{{ visibleRows.length }}</b>건 · 승인 대상 조직장 공석 <b>{{ vacantApprovalTeamCount }}</b>건
      </span>
      <div class="toolbar__actions">
        <!-- 비활성으로 미소속이 된 인원을 재배정하는 자리는 사용자 관리다. 그 경로를 화면에 둔다. -->
        <RouterLink
          class="btn btn--ghost btn--sm toolbar__link"
          :to="{ path: '/system/users', query: { unassigned: 'true' } }"
        >
          미소속 인원 관리
        </RouterLink>
        <button type="button" class="btn btn--primary btn--sm" @click="openCreate">조직 신설</button>
      </div>
    </div>

    <div v-if="fallbackWarning" class="warn">{{ fallbackWarning }}</div>

    <div class="listcard card--panel">
      <div class="listcard__scroll">
        <table class="data-table" style="min-width: 900px">
          <thead>
            <tr>
              <th>조직</th>
              <!-- 헤더는 비운다. 이름 옆에 붙이면 조직명 길이에 따라 위치가 들쭉날쭉해진다. -->
              <th class="cell--center" style="width: 92px"></th>
              <th class="cell--center" style="width: 110px">구분</th>
              <th class="cell--center" style="width: 90px">소속 인원</th>
              <th class="cell--center" style="width: 220px">조직장</th>
              <th class="cell--center" style="width: 110px">대체 승인</th>
              <th class="cell--center" style="width: 90px">관리</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="row in visibleRows" :key="row.id" :class="{ 'row--inactive': !row.active }">
              <td :style="{ paddingLeft: `${12 + row.depth * 28}px` }">
                <button
                  v-if="row.hasChildren && treeControlsEnabled"
                  type="button"
                  class="tree-toggle"
                  :aria-label="collapsed.has(row.id) ? '펼치기' : '접기'"
                  @click="toggle(row)"
                >
                  {{ collapsed.has(row.id) ? '▸' : '▾' }}
                </button>
                <span v-else class="tree-toggle tree-toggle--leaf" aria-hidden="true">·</span>
                <span class="tree-name" :class="{ 'tree-name--branch': row.hasChildren }">{{ row.name }}</span>
                <span v-if="row.hasChildren && collapsed.has(row.id)" class="tbl__muted">
                  (하위 {{ rows.filter((r) => r.parentId === row.id).length }})
                </span>
                <span v-if="!row.active" class="tbl__muted">(비활성)</span>
              </td>
              <td class="cell--center">
                <span v-if="isApprovalScope(row)" class="badge badge--scope">승인 대상</span>
              </td>
              <td class="cell--center">{{ orgUnitKindLabel(row.unitKind) }}</td>
              <td class="cell--center">
                <!-- 개편 흐름이 화면 사이에서 끊기지 않게 인원 수를 사용자 관리로 잇는다. -->
                <RouterLink
                  v-if="row.memberCount > 0"
                  class="tbl__link"
                  :to="{ path: '/system/users', query: { orgUnitId: String(row.id) } }"
                >
                  {{ row.memberCount }}
                </RouterLink>
                <span v-else>0</span>
              </td>
              <td class="cell--center">
                <!-- 목록에서는 글자로만 보여준다. 바꾸는 것은 수정 팝업에서 한다. -->
                <span v-if="row.leaderName" :class="{ 'tbl__muted': !canHaveLeader(row.unitKind) }">
                  {{ row.leaderName }}
                </span>
                <span v-else class="tbl__muted">—</span>
              </td>
              <td class="cell--center">
                <span v-if="row.approvalFallback" class="badge badge--fallback">대체 승인</span>
                <button
                  v-else-if="row.active && isApprovalScope(row)"
                  type="button"
                  class="btn btn--ghost btn--sm"
                  :disabled="savingId === row.id"
                  @click="markApprovalFallback(row)"
                >
                  지정
                </button>
                <span v-else class="tbl__muted">—</span>
              </td>
              <td class="cell--center">
                <!-- 회사는 이름·상위·활성을 바꾸지 않는다. 비활성/활성은 수정 팝업 안에 둔다. -->
                <button
                  v-if="row.unitKind !== 'COMPANY'"
                  type="button"
                  class="btn btn--ghost btn--sm"
                  :disabled="savingId === row.id"
                  @click="openEdit(row)"
                >
                  수정
                </button>
              </td>
            </tr>
            <tr v-if="!visibleRows.length">
              <td colspan="7" class="empty">조회 결과가 없습니다.</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <BaseModal
      :visible="!!form"
      :title="form?.mode === 'create' ? '조직 신설' : '조직 수정'"
      @close="form = null"
    >
      <div v-if="form" class="modal-grid">
        <div class="modal-field">
          <label>상위 조직</label>
          <select
            v-model="form.parentId"
            class="filter__select"
            :disabled="editingRow ? !editingRow.active : false"
            @change="onParentChange"
          >
            <option
              v-for="option in parentOptions(form.mode === 'edit' ? form : null)"
              :key="option.id"
              :value="option.id"
            >
              {{ option.name }} ({{ orgUnitKindLabel(option.unitKind) }})
            </option>
          </select>
        </div>
        <div class="modal-field">
          <label>구분</label>
          <select v-if="form.mode === 'create'" v-model="form.unitKind" class="filter__select">
            <option v-for="kind in creatableKinds" :key="kind" :value="kind">{{ orgUnitKindLabel(kind) }}</option>
          </select>
          <!-- 구분 변경은 열지 않는다. 팀을 사업부로 올리려면 신설 + 인원 이동이다. -->
          <input v-else class="filter__input" :value="orgUnitKindLabel(form.unitKind)" disabled />
        </div>
        <div class="modal-field modal-field--wide">
          <label>조직명</label>
          <input
            v-model="form.name"
            class="filter__input"
            type="text"
            maxlength="100"
            :disabled="editingRow ? !editingRow.active : false"
          />
        </div>

        <div
          v-if="form.mode === 'edit' && canHaveLeader(form.unitKind) && editingRow?.active"
          class="modal-field modal-field--wide"
        >
          <label>조직장</label>
          <!-- 지정된 사람은 글자로 보여주고, 바꿀 때만 검색칸을 연다. -->
          <div v-if="form.leaderName && !leaderSearch.open" class="leader-field">
            <span>{{ form.leaderName }}</span>
            <button type="button" class="btn btn--ghost btn--sm" @click="leaderSearch.open = true">변경</button>
            <button type="button" class="btn btn--ghost btn--sm" @click="clearLeader">해제</button>
          </div>
          <div v-else class="leader-field__search">
            <div class="leader-field__anchor">
              <input
                v-model="leaderSearch.keyword"
                class="filter__input"
                type="text"
                placeholder="이름 또는 직급 검색"
              />
              <ul v-if="leaderSearch.keyword.trim()" class="leader-search__list">
                <li v-if="!leaderSearchResults.length" class="leader-search__empty">검색 결과 없습니다.</li>
                <li v-for="candidate in leaderSearchResults" :key="candidate.userKey">
                  <button type="button" class="leader-search__item" @mousedown.prevent="pickLeader(candidate)">
                    {{ candidate.name }} / {{ candidate.position || '직급 미지정' }}
                  </button>
                </li>
              </ul>
            </div>
            <p class="hint hint--tight">공석으로 두면 승인은 대체 승인 조직 팀장에게 갑니다.</p>
          </div>
        </div>
      </div>

      <p v-if="editingRow && !editingRow.active" class="hint">
        비활성 조직입니다. 이름·상위는 다시 활성한 뒤 바꿀 수 있습니다.
      </p>
      <p v-else-if="editingRow" class="hint">
        비활성하면 하위 조직까지 함께 내려가고 소속 인원은 미소속이 됩니다.
      </p>
      <p v-else class="hint">
        개발부서 코드(DEV_DEPARTMENT)와 이름이 연결된 조직은 이름을 바꿀 수 없습니다 — 테크 리소스·실적
        조회가 조직을 이름으로 찾기 때문입니다.
      </p>

      <template #footer>
        <!-- 파급이 큰 조작이라 목록이 아니라 이 팝업 안에 둔다. -->
        <button
          v-if="editingRow"
          type="button"
          class="btn btn--ghost modal-footer__left"
          :disabled="savingId === editingRow.id"
          @click="toggleActive(editingRow)"
        >
          {{ editingRow.active ? '비활성' : '활성' }}
        </button>
        <button type="button" class="btn btn--ghost" @click="form = null">
          {{ editingRow && !editingRow.active ? '닫기' : '취소' }}
        </button>
        <button v-if="!editingRow || editingRow.active" type="button" class="btn btn--primary" @click="submitForm">
          {{ form?.mode === 'create' ? '신설' : '저장' }}
        </button>
      </template>
    </BaseModal>
  </main>
</template>

<style scoped>
.tbl__muted { color: var(--lnb-muted); }
.empty { text-align: center !important; color: var(--lnb-muted); padding: 24px !important; }
.cell--center { text-align: center; }
.row--inactive { opacity: 0.55; }
.warn {
  margin: 0 0 10px;
  padding: 8px 12px;
  border-radius: 6px;
  font-size: calc(12.8px + var(--font-size-offset));
  color: var(--orange);
  background: var(--orange-bg);
  border: 1px solid var(--orange);
}
.badge--scope {
  display: inline-block;
  margin-left: 4px;
  padding: 0 6px;
  border-radius: 10px;
  font-size: calc(10.88px + var(--font-size-offset));
  border: 1px solid var(--lnb-line);
  color: var(--lnb-muted);
}
.badge--fallback {
  display: inline-flex;
  align-items: center;
  padding: 4px 10px;
  border-radius: var(--radius-md);
  font-size: calc(11px + var(--font-size-offset));
  border: 1px solid var(--green);
  background: var(--green-bg);
  color: var(--green);
  white-space: nowrap;
}
.modal-grid { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 12px; }
.modal-field { display: flex; flex-direction: column; gap: 4px; }
.modal-field--wide { grid-column: 1 / -1; }
.modal-field label { font-size: calc(12.48px + var(--font-size-offset)); color: var(--lnb-muted); }
.modal-footer__left { margin-right: auto; }
.hint { margin: 12px 0 0; font-size: calc(12.16px + var(--font-size-offset)); color: var(--lnb-muted); }
.hint--tight { margin: 4px 0 0; }

.tree-toggle {
  width: 18px;
  margin-right: 2px;
  padding: 0;
  border: 0;
  background: none;
  color: var(--lnb-muted);
  cursor: pointer;
  font-size: calc(11.52px + var(--font-size-offset));
  line-height: 1;
}
.tree-toggle--leaf { cursor: default; opacity: 0.45; }
.tree-name--branch { font-weight: 600; }
/* 조직장 select가 없어진 만큼 행 높이가 균일해야 트리를 훑을 때 줄 간격이 흔들리지 않는다. */
.data-table tbody td { height: 52px; }

.tbl__link { color: var(--teal-600); text-decoration: underline; }
/* 링크지만 버튼 모양이다 — 앵커 기본 밑줄이 붙으면 옆 버튼과 어긋난다. */
.toolbar__link { text-decoration: none; }

.leader-field { display: flex; align-items: center; gap: 6px; font-size: calc(12.8px + var(--font-size-offset)); }
.leader-field__anchor { position: relative; }
.leader-search__list {
  position: absolute;
  top: calc(100% + 4px);
  left: 0;
  right: 0;
  z-index: 30;
  margin: 0;
  padding: 4px 0;
  list-style: none;
  background: var(--color-surface);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
  box-shadow: var(--shadow-md);
  max-height: 180px;
  overflow-y: auto;
}
.leader-search__item {
  width: 100%;
  padding: 6px 10px;
  border: 0;
  background: transparent;
  text-align: left;
  font-size: calc(11px + var(--font-size-offset));
  font-family: inherit;
  cursor: pointer;
}
.leader-search__item:hover { background: var(--teal-50); }
.leader-search__empty { padding: 6px 10px; font-size: calc(11px + var(--font-size-offset)); color: var(--lnb-muted); }
</style>
