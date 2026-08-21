<script setup>
// 조직 관리 — 트리 구조 + 조직장 지정 (목업)
import { computed, ref } from 'vue'
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

const rows = ref([])
const leaderCandidates = ref([])
const keyword = ref('')
const includeInactive = ref(false)
const savingId = ref(null)
const form = ref(null)

function flatten(units) {
  const byParent = new Map()
  for (const unit of units) {
    const key = unit.parentId
    const list = byParent.get(key) ?? []
    list.push(unit)
    byParent.set(key, list)
  }
  const result = []
  function walk(parentId, depth) {
    for (const unit of byParent.get(parentId) ?? []) {
      result.push({ ...unit, depth })
      walk(unit.id, depth + 1)
    }
  }
  walk(null, 0)
  return result
}

function load() {
  rows.value = flatten(listOrgUnits(includeInactive.value))
  leaderCandidates.value = listLeaderCandidates()
}

load()

const visibleRows = computed(() => {
  const q = keyword.value.trim()
  if (!q) return rows.value
  return rows.value.filter((row) => row.name.includes(q) || (row.leaderName ?? '').includes(q))
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

function onLeaderChange(row, event) {
  const raw = event.target.value
  const nextKey = raw === '' ? null : Number(raw)
  const previousKey = row.leaderUserKey
  const previousName = row.leaderName
  savingId.value = row.id
  try {
    const updated = assignOrgUnitLeader(row.id, nextKey)
    row.leaderUserKey = updated.leaderUserKey
    row.leaderName = updated.leaderName
    window.alert(
      updated.leaderUserKey === null
        ? `${row.name} 조직장을 해제했습니다. 승인은 상위 조직장으로 갑니다.`
        : `${row.name} 조직장을 ${updated.leaderName}(으)로 지정했습니다.`,
    )
  } catch (err) {
    row.leaderUserKey = previousKey
    row.leaderName = previousName
    window.alert(err.message || '조직장 지정에 실패했습니다.')
  } finally {
    savingId.value = null
  }
}

function openCreate() {
  const firstParent = parentOptions(null)[0]
  form.value = {
    mode: 'create',
    id: 0,
    name: '',
    parentId: firstParent?.id ?? 0,
    unitKind: firstParent ? (creatableKindsUnder(firstParent.unitKind)[0] ?? '') : '',
  }
}

function openEdit(row) {
  form.value = { mode: 'edit', id: row.id, name: row.name, parentId: row.parentId ?? 0, unitKind: row.unitKind }
}

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
        window.alert('상위 조직을 옮겼습니다. 승인자가 바뀐 결재 대기 건은 취소되고 요청자에게 알림이 갑니다.')
      } else {
        window.alert('조직 정보를 저장했습니다.')
      }
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
    load()
  } catch (err) {
    window.alert(err.message || '상태 변경에 실패했습니다.')
  } finally {
    savingId.value = null
  }
}

function resetSearch() {
  keyword.value = ''
}
</script>

<template>
  <div class="admin-page">
    <SearchFilterBar
      v-model:search="keyword"
      search-placeholder="조직명 또는 조직장명"
      @reset="resetSearch"
      @search="load"
    />

    <div class="toolbar">
      <span class="toolbar__count">
        조직 <b>{{ visibleRows.length }}</b>건 · 승인 대상 조직장 공석 <b>{{ vacantApprovalTeamCount }}</b>건
      </span>
      <label class="toolbar__toggle">
        <input v-model="includeInactive" type="checkbox" @change="load" />
        비활성 포함
      </label>
      <div class="toolbar__actions">
        <button type="button" class="btn btn--primary btn--sm" @click="openCreate">조직 신설</button>
      </div>
    </div>

    <div v-if="fallbackWarning" class="warn">{{ fallbackWarning }}</div>

    <p class="hint">
      {{ orgAdminMeta.hint }}
      그 위 임원급으로는 올라가지 않습니다. 그래서 <b>조직장은 팀에만 지정</b>합니다.
      담당·회사 조직장은 승인선에 쓰이지 않습니다.
      WBS 변경요청은 테크 인력만 내므로 <b>승인 대상</b> 표시가 붙은 팀의 조직장만 실제 결재선입니다.
      비활성은 하위 조직까지 함께 내리고 소속 인원을 미소속으로 전환합니다.
    </p>

    <div class="listcard">
      <div class="listcard__scroll">
        <table class="data-table org-table">
          <thead>
            <tr>
              <th>조직</th>
              <th class="col-kind">구분</th>
              <th class="col-count">소속 인원</th>
              <th class="col-leader">조직장</th>
              <th class="col-fallback">대체 승인</th>
              <th class="col-actions">관리</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="row in visibleRows" :key="row.id" :class="{ 'row--inactive': !row.active }">
              <td :style="{ paddingLeft: `${12 + row.depth * 18}px` }">
                {{ row.name }}
                <span v-if="!row.active" class="tbl__muted">(비활성)</span>
              </td>
              <td>
                {{ orgUnitKindLabel(row.unitKind) }}
                <span v-if="isApprovalScope(row)" class="badge-scope">승인 대상</span>
              </td>
              <td class="cell--center">{{ row.memberCount }}</td>
              <td>
                <select
                  v-if="row.active && canHaveLeader(row.unitKind)"
                  class="filter__select"
                  :value="row.leaderUserKey ?? ''"
                  :disabled="savingId === row.id"
                  @change="onLeaderChange(row, $event)"
                >
                  <option value="">(공석)</option>
                  <option v-for="user in leaderCandidates" :key="user.userKey" :value="user.userKey">
                    {{ user.name }}{{ user.position ? ` · ${user.position}` : '' }}
                  </option>
                </select>
                <span v-else-if="row.leaderName" class="tbl__muted">
                  {{ row.leaderName }} · 승인 미사용
                </span>
                <span v-else class="tbl__muted">지정 불가</span>
              </td>
              <td class="cell--center">
                <span v-if="row.approvalFallback" class="badge-fallback">대체 승인</span>
                <button
                  v-else-if="row.active && row.unitKind === 'TEAM'"
                  type="button"
                  class="btn btn--ghost btn--sm"
                  :disabled="savingId === row.id"
                  @click="markApprovalFallback(row)"
                >
                  지정
                </button>
                <span v-else class="tbl__muted">-</span>
              </td>
              <td>
                <button
                  v-if="row.unitKind !== 'COMPANY' && row.active"
                  type="button"
                  class="btn btn--ghost btn--sm"
                  :disabled="savingId === row.id"
                  @click="openEdit(row)"
                >
                  수정
                </button>
                <button
                  v-if="row.unitKind !== 'COMPANY'"
                  type="button"
                  class="btn btn--ghost btn--sm"
                  :disabled="savingId === row.id"
                  @click="toggleActive(row)"
                >
                  {{ row.active ? '비활성' : '활성' }}
                </button>
              </td>
            </tr>
            <tr v-if="!visibleRows.length">
              <td colspan="6" class="empty">조회 결과가 없습니다.</td>
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
          <select v-model="form.parentId" class="filter__select" @change="onParentChange">
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
          <input v-else class="filter__input" :value="orgUnitKindLabel(form.unitKind)" disabled />
        </div>
        <div class="modal-field modal-field--wide">
          <label>조직명</label>
          <input v-model="form.name" class="filter__input" type="text" maxlength="100" />
        </div>
      </div>
      <p class="modal-note">
        개발부서 코드(DEV_DEPARTMENT)와 이름이 연결된 조직은 이름을 바꿀 수 없습니다. 테크 리소스·실적
        조회가 조직을 이름으로 찾기 때문입니다.
      </p>
      <template #footer>
        <button type="button" class="btn btn--ghost" @click="form = null">취소</button>
        <button type="button" class="btn btn--primary" @click="submitForm">
          {{ form?.mode === 'create' ? '신설' : '저장' }}
        </button>
      </template>
    </BaseModal>
  </div>
</template>

<style scoped>
.toolbar__toggle {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  font-size: calc(12px + var(--font-size-offset, 0px));
  color: var(--lnb-txt);
}

.hint {
  margin: 0 0 10px;
  font-size: calc(12px + var(--font-size-offset, 0px));
  line-height: 1.55;
  color: var(--lnb-muted);
}

.warn {
  margin: 0 0 10px;
  padding: 8px 12px;
  border-radius: var(--radius-sm);
  font-size: calc(12px + var(--font-size-offset, 0px));
  color: var(--orange);
  background: var(--orange-bg);
  border: 1px solid var(--orange);
}

.org-table {
  min-width: 900px;
}

.col-kind { width: 140px; }
.col-count { width: 90px; }
.col-leader { width: 260px; }
.col-fallback { width: 110px; }
.col-actions { width: 180px; }

.cell--center { text-align: center; }

.row--inactive { opacity: 0.55; }

.badge-scope {
  display: inline-block;
  margin-left: 4px;
  padding: 0 6px;
  border-radius: var(--r-pill);
  font-size: calc(11px + var(--font-size-offset, 0px));
  border: 1px solid var(--lnb-line);
  color: var(--lnb-muted);
}

.badge-fallback {
  display: inline-block;
  padding: 1px 8px;
  border-radius: var(--r-pill);
  font-size: calc(11px + var(--font-size-offset, 0px));
  font-weight: 600;
  border: 1px solid var(--teal);
  color: var(--teal);
  background: var(--teal-50);
}

.modal-note {
  margin: 12px 0 0;
  font-size: calc(11px + var(--font-size-offset, 0px));
  color: var(--lnb-muted);
}
</style>
