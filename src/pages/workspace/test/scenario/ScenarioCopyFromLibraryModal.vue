<script setup>
// POP-S-UAT-07 테스트 라이브러리 복사 — 개별 검색 + 케이스 담기(중복 안내) + 선택된 케이스 영역 + 케이스 저장
import { computed, ref, watch } from 'vue'
import BaseModal from '@/shared/ui/BaseModal.vue'
import { libraryList, systemOptions, bizOptions } from '@/entities/test-library/mock/testLibrary'

const props = defineProps({
  modelValue: { type: Boolean, default: false },
})

const emit = defineEmits(['update:modelValue', 'confirm'])

function emptyFilters() {
  return { system: '전체', bizCategory: '전체', screenName: '', sourceProject: '', caseName: '' }
}

const filters = ref(emptyFilters())
const appliedFilters = ref(emptyFilters())
const searched = ref(false)
const staged = ref([])
const detailTarget = ref(null)
const detailCollapsed = ref(false)
const selectedKeys = ref(new Set())
const stagedSelectedKeys = ref(new Set())
const pageSize = ref(20)
const currentPage = ref(1)

const flatCases = computed(() =>
  libraryList.flatMap((lib) =>
    (lib.cases || []).map((c) => ({
      key: `${lib.id}:${c.id}`,
      libId: lib.id,
      libTitle: lib.title,
      system: lib.system,
      bizCategory: lib.bizCategory,
      systemPath: lib.systemPath,
      screenName: lib.screenName,
      sourceProject: lib.sourceProject,
      caseId: c.id,
      caseName: c.title,
      steps: c.steps.map((s) => ({ ...s })),
    })),
  ),
)

const filtered = computed(() => {
  if (!searched.value) return []
  const f = appliedFilters.value
  return flatCases.value.filter((r) => {
    if (f.system !== '전체' && r.system !== f.system) return false
    if (f.bizCategory !== '전체' && r.bizCategory !== f.bizCategory) return false
    if (f.screenName && !r.screenName.toLowerCase().includes(f.screenName.trim().toLowerCase())) {
      return false
    }
    if (f.sourceProject && !r.sourceProject.toLowerCase().includes(f.sourceProject.trim().toLowerCase())) {
      return false
    }
    if (f.caseName && !r.caseName.toLowerCase().includes(f.caseName.trim().toLowerCase())) {
      return false
    }
    return true
  })
})

const totalPages = computed(() => Math.max(1, Math.ceil(filtered.value.length / pageSize.value)))
const pagedFiltered = computed(() => {
  const start = (currentPage.value - 1) * pageSize.value
  return filtered.value.slice(start, start + pageSize.value)
})

watch(
  () => props.modelValue,
  (open) => {
    if (!open) return
    filters.value = emptyFilters()
    appliedFilters.value = emptyFilters()
    searched.value = false
    staged.value = []
    detailTarget.value = null
    selectedKeys.value = new Set()
    stagedSelectedKeys.value = new Set()
    currentPage.value = 1
  },
)

watch(filtered, (rows) => {
  if (!rows.some((r) => r.key === detailTarget.value?.key)) {
    detailTarget.value = rows[0] || null
  }
})

function search() {
  appliedFilters.value = { ...filters.value }
  searched.value = true
  currentPage.value = 1
  selectedKeys.value = new Set()
}

function resetFilters() {
  filters.value = emptyFilters()
}

function showDetail(row) {
  detailTarget.value = row
}

function toggleRowSelect(row) {
  const next = new Set(selectedKeys.value)
  if (next.has(row.key)) next.delete(row.key)
  else next.add(row.key)
  selectedKeys.value = next
}

function addSelectedToStaged() {
  if (!selectedKeys.value.size) {
    window.alert('담을 케이스를 선택해 주세요.')
    return
  }
  const rows = flatCases.value.filter((r) => selectedKeys.value.has(r.key))
  const alreadyStaged = new Set(staged.value.map((s) => s.key))
  const toAdd = rows.filter((r) => !alreadyStaged.has(r.key))
  staged.value = [...staged.value, ...toAdd]
  selectedKeys.value = new Set()
}

function toggleStagedSelect(row) {
  const next = new Set(stagedSelectedKeys.value)
  if (next.has(row.key)) next.delete(row.key)
  else next.add(row.key)
  stagedSelectedKeys.value = next
}

function removeSelectedStaged() {
  if (!stagedSelectedKeys.value.size) return
  staged.value = staged.value.filter((s) => !stagedSelectedKeys.value.has(s.key))
  stagedSelectedKeys.value = new Set()
}

function close() {
  emit('update:modelValue', false)
}

function confirm() {
  if (!staged.value.length) {
    window.alert('담은 케이스가 없습니다. 케이스를 먼저 담아주세요.')
    return
  }
  if (!window.confirm(`선택한 케이스 ${staged.value.length}개를 불러오시겠습니까?`)) return
  emit('confirm', staged.value)
  window.alert(`${staged.value.length}건을 불러왔습니다.`)
  close()
}
</script>

<template>
  <BaseModal title="라이브러리에서 복사" :visible="modelValue" wide @close="close">
    <div class="filter">
      <div class="fld">
        <label>시스템</label>
        <select v-model="filters.system" class="inp">
          <option v-for="s in systemOptions" :key="s" :value="s">{{ s }}</option>
        </select>
      </div>
      <div class="fld">
        <label>업무구분</label>
        <select v-model="filters.bizCategory" class="inp">
          <option v-for="b in bizOptions" :key="b" :value="b">{{ b }}</option>
        </select>
      </div>
      <div class="fld">
        <label>화면(메뉴)</label>
        <input v-model="filters.screenName" class="inp" type="text" placeholder="화면명 검색" @keyup.enter="search" />
      </div>
      <div class="fld">
        <label>프로젝트 출처</label>
        <input v-model="filters.sourceProject" class="inp" type="text" placeholder="프로젝트명 검색" @keyup.enter="search" />
      </div>
      <div class="fld">
        <label>케이스명</label>
        <input v-model="filters.caseName" class="inp" type="text" placeholder="케이스명 검색" @keyup.enter="search" />
      </div>
      <button type="button" class="btn btn--ghost btn--sm filter__btn" @click="resetFilters">초기화</button>
      <button type="button" class="btn btn--primary btn--sm filter__btn" @click="search">조회</button>
    </div>

    <div class="case-box">
      <div class="case-box__head">
        <h4>테스트케이스 ({{ filtered.length }}개)</h4>
        <button type="button" class="btn btn--primary btn--sm" @click="addSelectedToStaged">케이스 담기</button>
      </div>
      <div class="table-wrap">
        <table class="tbl">
          <thead>
            <tr>
              <th class="col-check"></th>
              <th>시스템</th>
              <th>업무구분</th>
              <th>화면명</th>
              <th>프로젝트 출처</th>
              <th>케이스명</th>
              <th>절차수</th>
            </tr>
          </thead>
          <tbody>
            <tr
              v-for="row in pagedFiltered"
              :key="row.key"
              :class="{ 'is-on': detailTarget?.key === row.key }"
              @click="showDetail(row)"
            >
              <td class="col-check" @click.stop>
                <input type="checkbox" :checked="selectedKeys.has(row.key)" @change="toggleRowSelect(row)" />
              </td>
              <td>{{ row.system }}</td>
              <td>{{ row.bizCategory }}</td>
              <td>{{ row.screenName }}</td>
              <td class="name">{{ row.sourceProject }}</td>
              <td class="name">{{ row.caseName }}</td>
              <td>{{ row.steps.length }}</td>
            </tr>
            <tr v-if="searched && !filtered.length">
              <td colspan="7" class="empty">조회된 케이스가 없습니다.</td>
            </tr>
            <tr v-if="!searched">
              <td colspan="7" class="empty">조회 버튼을 눌러 라이브러리 케이스를 검색하세요.</td>
            </tr>
          </tbody>
        </table>
      </div>
      <div v-if="filtered.length" class="pager">
        <button type="button" class="pager__btn" :disabled="currentPage <= 1" @click="currentPage -= 1">‹</button>
        <span class="pager__info">{{ currentPage }} / {{ totalPages }}</span>
        <button type="button" class="pager__btn" :disabled="currentPage >= totalPages" @click="currentPage += 1">›</button>
      </div>

      <div class="detail-panel">
        <button type="button" class="detail-panel__head" @click="detailCollapsed = !detailCollapsed">
          <span>케이스 상세{{ detailTarget ? ` — ${detailTarget.caseName}` : '' }}</span>
          <span class="detail-panel__toggle">{{ detailCollapsed ? '▼' : '▲' }}</span>
        </button>
        <template v-if="!detailCollapsed">
          <div v-if="detailTarget" class="detail-panel__scroll">
            <table class="tbl">
              <thead>
                <tr>
                  <th>No</th>
                  <th>절차</th>
                  <th>예상결과</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="(s, i) in detailTarget.steps" :key="i">
                  <td>{{ i + 1 }}</td>
                  <td>{{ s.procedure }}</td>
                  <td>{{ s.expected }}</td>
                </tr>
              </tbody>
            </table>
          </div>
          <p v-else class="empty detail-panel__empty">선택된 케이스가 없습니다.</p>
        </template>
      </div>
    </div>

    <div class="staged">
      <div class="staged__head">
        <h4 class="staged__title">선택된 케이스 ({{ staged.length }}건)</h4>
        <button type="button" class="btn btn--ghost btn--sm" @click="removeSelectedStaged">제외</button>
      </div>
      <div v-if="!staged.length" class="empty staged__empty">담은 케이스가 없습니다.</div>
      <table v-else class="tbl staged__table">
        <thead>
          <tr>
            <th class="col-check"></th>
            <th>시스템</th>
            <th>업무</th>
            <th>화면명</th>
            <th>프로젝트출처</th>
            <th>케이스명</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="row in staged" :key="row.key">
            <td class="col-check">
              <input type="checkbox" :checked="stagedSelectedKeys.has(row.key)" @change="toggleStagedSelect(row)" />
            </td>
            <td>{{ row.system }}</td>
            <td>{{ row.bizCategory }}</td>
            <td>{{ row.screenName }}</td>
            <td class="name">{{ row.sourceProject }}</td>
            <td class="name">{{ row.caseName }}</td>
          </tr>
        </tbody>
      </table>
    </div>

    <template #footer>
      <button type="button" class="btn btn--ghost" @click="close">취소</button>
      <button type="button" class="btn btn--primary" @click="confirm">케이스 저장</button>
    </template>
  </BaseModal>
</template>

<style scoped>
.filter {
  display: flex;
  align-items: flex-end;
  gap: 8px;
  margin-bottom: 12px;
  flex-wrap: wrap;
}

.fld {
  display: flex;
  flex-direction: column;
  gap: 4px;
  min-width: 120px;
}

.fld label {
  font-size: calc(11px + var(--font-size-offset, 0px));
  font-weight: 600;
  color: var(--lnb-muted);
}

.inp {
  height: 32px;
  padding: 0 10px;
  border: 1px solid var(--lnb-line);
  border-radius: 7px;
  font-family: inherit;
  font-size: calc(12px + var(--font-size-offset, 0px));
  box-sizing: border-box;
  background: var(--lnb-side);
  color: var(--lnb-txt);
}

.filter__btn {
  height: 32px;
  flex-shrink: 0;
}

.table-wrap {
  max-height: 260px;
  overflow: auto;
}

.tbl {
  width: 100%;
  border-collapse: collapse;
  font-size: calc(12px + var(--font-size-offset, 0px));
}

.tbl th,
.tbl td {
  padding: 8px 10px;
  border-bottom: 1px solid var(--lnb-line);
  text-align: left;
  white-space: nowrap;
}

.tbl th {
  position: sticky;
  top: 0;
  background: var(--lnb-hover);
  color: var(--lnb-txt);
  font-weight: 600;
  text-align: center;
}

.tbl .name {
  max-width: 180px;
  overflow: hidden;
  text-overflow: ellipsis;
}

.empty {
  text-align: center;
  color: var(--lnb-muted);
  padding: 24px !important;
}

.staged {
  padding: 12px 14px;
  border: 1px solid var(--teal-100);
  background: var(--teal-50);
  border-radius: 8px;
}

.staged__title {
  margin: 0 0 8px;
  font-size: calc(12.5px + var(--font-size-offset, 0px));
  font-weight: 700;
  color: var(--teal-600);
}

.staged__empty {
  padding: 12px !important;
}

.staged__table {
  display: block;
  max-height: 160px;
  overflow: auto;
  background: var(--lnb-side);
  border-radius: 6px;
}

.staged__table thead,
.staged__table tbody,
.staged__table tr {
  display: table;
  width: 100%;
  table-layout: fixed;
}

.link-btn {
  border: none;
  background: none;
  color: var(--red);
  cursor: pointer;
  font-size: calc(12px + var(--font-size-offset, 0px));
}

.case-box {
  margin-bottom: 14px;
  border: 1px solid var(--lnb-line);
  border-radius: 8px;
  overflow: hidden;
}

.case-box__head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 10px 12px;
  border-bottom: 1px solid var(--lnb-line);
  background: var(--lnb-hover);
}

.case-box__head h4 {
  margin: 0;
  font-size: calc(12.5px + var(--font-size-offset, 0px));
  font-weight: 700;
  color: var(--lnb-txt);
}

.col-check {
  width: 32px;
  text-align: center !important;
}

.pager {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 12px;
  padding: 8px;
  border-top: 1px solid var(--lnb-line);
}

.pager__btn {
  min-width: 26px;
  height: 26px;
  border-radius: 6px;
  border: 1px solid var(--lnb-line);
  background: var(--lnb-side);
  color: var(--lnb-txt);
  cursor: pointer;
  font-family: inherit;
}

.pager__btn:disabled {
  opacity: 0.4;
  cursor: not-allowed;
}

.pager__info {
  font-size: calc(12px + var(--font-size-offset, 0px));
  color: var(--lnb-muted);
}

.tbl tbody tr {
  cursor: pointer;
}

.tbl tbody tr:hover,
.tbl tbody tr.is-on {
  background: var(--teal-50);
}

.detail-panel {
  border-top: 1px solid var(--lnb-line);
}

.detail-panel__head {
  width: 100%;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 10px 12px;
  border: none;
  background: var(--lnb-hover);
  font-size: calc(12.5px + var(--font-size-offset, 0px));
  font-weight: 700;
  color: var(--lnb-txt);
  cursor: pointer;
  font-family: inherit;
}

.detail-panel__toggle {
  color: var(--lnb-muted);
  font-weight: 400;
}

.detail-panel__empty {
  padding: 20px !important;
}

.detail-panel__scroll {
  max-height: 140px;
  overflow: auto;
}

.staged__head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 8px;
}
</style>
