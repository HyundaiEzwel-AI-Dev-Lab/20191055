<script setup>
// POP-S-UAT-07 테스트 라이브러리 복사 — 개별 검색 + 케이스 담기(중복/최대 담기 안내) + 선택된 케이스 영역 + 케이스 저장
// h-pms는 실 API(searchLibraryCases)로 페이지 단위 조회하지만, 목업은 라이브러리 mock 전체를 불러와
// 화면단에서 필터링·페이징한다. 조회 버튼 없이도 열자마자 목록이 채워지는 것과 담기 시 최대개수/중복
// 안내는 h-pms 동작을 그대로 포팅한다.
import { computed, ref, watch } from 'vue'
import BaseModal from '@/shared/ui/BaseModal.vue'
import FilterSelectPill from '@/shared/ui/FilterSelectPill.vue'
import HpPagination from '@/shared/ui/HpPagination.vue'
import { libraryList, systemOptions, bizOptions } from '@/entities/test-library/mock/testLibrary'

const props = defineProps({
  modelValue: { type: Boolean, default: false },
})

const emit = defineEmits(['update:modelValue', 'confirm'])

const STAGED_MAX = 20
const PAGE_SIZE = 20

const systemPillOptions = systemOptions.filter((s) => s !== '전체').map((s) => ({ value: s, label: s }))
const bizPillOptions = bizOptions.filter((b) => b !== '전체').map((b) => ({ value: b, label: b }))

function emptyFilters() {
  return { system: '', bizCategory: '', screenName: '', sourceProject: '', caseName: '' }
}

const filters = ref(emptyFilters())
const appliedFilters = ref(emptyFilters())
const searched = ref(false)
const staged = ref([])
const detailTarget = ref(null)
const detailCollapsed = ref(false)
const selectedKeys = ref(new Set())
const stagedSelectedKeys = ref(new Set())
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
    if (f.system && r.system !== f.system) return false
    if (f.bizCategory && r.bizCategory !== f.bizCategory) return false
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

const totalPages = computed(() => Math.max(1, Math.ceil(filtered.value.length / PAGE_SIZE)))
const pagedFiltered = computed(() => {
  const start = (currentPage.value - 1) * PAGE_SIZE
  return filtered.value.slice(start, start + PAGE_SIZE)
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
    detailCollapsed.value = false
    selectedKeys.value = new Set()
    stagedSelectedKeys.value = new Set()
    currentPage.value = 1
    // 열자마자 목록을 채운다 — 조회를 누르기 전에는 비어 있어서 케이스명 검색이 안 되는 것처럼 보였다.
    search()
  },
)

watch(filtered, (rows) => {
  if (!rows.some((r) => r.key === detailTarget.value?.key)) {
    detailTarget.value = rows[0] || null
    detailCollapsed.value = false
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
  search()
}

function showDetail(row) {
  detailTarget.value = row
  detailCollapsed.value = false
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
  if (!toAdd.length) {
    window.alert('이미 담긴 케이스입니다.')
    return
  }
  if (staged.value.length + toAdd.length > STAGED_MAX) {
    window.alert(`케이스는 최대 ${STAGED_MAX}개까지 담을 수 있습니다.`)
    return
  }
  // 부분 중복도 알린다 — 전건 중복만 안내하면 3건 골라 2건만 담긴 경우가 무음이라, 사용자는
  // 나머지가 왜 없는지 모른 채 담기를 다시 누른다.
  const excluded = rows.length - toAdd.length
  if (excluded > 0) {
    window.alert(`이미 추가된 테스트케이스 ${excluded}건은 제외하고 추가되었습니다.`)
  }
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
      <!-- 모달 안 검색 셀렉트도 화면 검색영역과 같은 라벨|값 결합 알약(FilterSelectPill)으로 통일한다. -->
      <FilterSelectPill v-model="filters.system" label="시스템" :options="systemPillOptions" />
      <FilterSelectPill v-model="filters.bizCategory" label="업무구분" :options="bizPillOptions" />
      <div class="fld fld--search">
        <div class="sfb__search">
          <svg class="sfb__search-icon" viewBox="0 0 24 24" fill="none" aria-hidden="true">
            <circle cx="11" cy="11" r="7" stroke="currentColor" stroke-width="1.8" />
            <path d="M16.5 16.5L21 21" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" />
          </svg>
          <input
            v-model="filters.screenName"
            class="sfb__search-input"
            type="text"
            placeholder="화면명 검색"
            @keyup.enter="search"
          />
        </div>
      </div>
      <div class="fld fld--search">
        <div class="sfb__search">
          <svg class="sfb__search-icon" viewBox="0 0 24 24" fill="none" aria-hidden="true">
            <circle cx="11" cy="11" r="7" stroke="currentColor" stroke-width="1.8" />
            <path d="M16.5 16.5L21 21" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" />
          </svg>
          <input
            v-model="filters.sourceProject"
            class="sfb__search-input"
            type="text"
            placeholder="프로젝트명 검색"
            @keyup.enter="search"
          />
        </div>
      </div>
      <div class="fld fld--search">
        <div class="sfb__search">
          <svg class="sfb__search-icon" viewBox="0 0 24 24" fill="none" aria-hidden="true">
            <circle cx="11" cy="11" r="7" stroke="currentColor" stroke-width="1.8" />
            <path d="M16.5 16.5L21 21" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" />
          </svg>
          <input
            v-model="filters.caseName"
            class="sfb__search-input"
            type="text"
            placeholder="케이스명 검색"
            @keyup.enter="search"
          />
        </div>
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
      <HpPagination :page="currentPage" :total-pages="totalPages" @update:page="currentPage = $event" />

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
                  <td>{{ s.no || i + 1 }}</td>
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
      <div v-else class="table-wrap table-wrap--staged">
        <table class="tbl">
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
            <tr v-for="row in staged" :key="`st-${row.key}`">
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
  align-items: center;
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

.fld--search {
  justify-content: flex-end;
}
.fld--search .sfb__search {
  /* .fld는 flex-direction:column이라 .sfb__search의 전역 flex: 1 1 160px(가로 컨테이너
     기준 flex-basis)가 세로축(높이) 기준으로 해석돼 필이 부풀어 보인다 — column 컨테이너
     안에서는 flex를 끄고 너비만 채운다. */
  flex: none;
  max-width: none;
  min-width: 0;
  width: 100%;
}

.filter__btn {
  height: 32px;
  flex-shrink: 0;
}

.table-wrap {
  max-height: 260px;
  overflow: auto;
}

.table-wrap--staged {
  max-height: 160px;
  background: var(--color-bg);
  border-radius: 6px;
}

.tbl {
  width: 100%;
  border-collapse: collapse;
  font-size: calc(12px + var(--font-size-offset, 0px));
}

.tbl th,
.tbl td {
  padding: 8px 10px;
  border-bottom: 1px solid var(--line);
  text-align: left;
  white-space: nowrap;
}

.tbl th {
  position: sticky;
  top: 0;
  background: var(--field);
  color: var(--ink);
  font-weight: 600;
  text-align: center;
}

.tbl .name {
  max-width: 180px;
  overflow: hidden;
  text-overflow: ellipsis;
}

.tbl tbody tr {
  cursor: pointer;
}

.tbl tbody tr:hover,
.tbl tbody tr.is-on {
  background: var(--teal-50);
}

.empty {
  text-align: center;
  color: var(--muted);
  padding: 24px !important;
}

.case-box {
  margin-bottom: 14px;
  border: 1px solid var(--line);
  border-radius: 8px;
  overflow: hidden;
}

.case-box__head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 10px 12px;
  border-bottom: 1px solid var(--line);
  background: var(--field);
}

.case-box__head h4 {
  margin: 0;
  font-size: calc(12.5px + var(--font-size-offset, 0px));
  font-weight: 700;
  color: var(--ink);
}

.col-check {
  width: 32px;
  text-align: center !important;
}

.detail-panel {
  border-top: 1px solid var(--line);
}

.detail-panel__head {
  width: 100%;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 10px 12px;
  border: none;
  background: var(--field);
  font-size: calc(12.5px + var(--font-size-offset, 0px));
  font-weight: 700;
  color: var(--ink);
  cursor: pointer;
  font-family: inherit;
}

.detail-panel__toggle {
  color: var(--muted);
  font-weight: 400;
}

.detail-panel__empty {
  padding: 20px !important;
}

.detail-panel__scroll {
  max-height: 140px;
  overflow: auto;
}

.staged {
  padding: 12px 14px;
  border: 1px solid var(--teal-100);
  background: var(--teal-50);
  border-radius: 8px;
}

.staged__head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 8px;
}

.staged__title {
  margin: 0;
  font-size: calc(12.5px + var(--font-size-offset, 0px));
  font-weight: 700;
  color: var(--teal-600);
}

.staged__empty {
  padding: 12px !important;
}
</style>
