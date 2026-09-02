<script setup>
// PAG-S-TST-01 단위테스트
import { computed, onMounted, ref } from 'vue'
import { useAuthStore } from '@/app/stores/auth'
import { systemOptions, bizCategoryOptions } from '@/shared/lib/testConfig'
import {
  unitResultOptions,
  pageSizeOptions,
  getUnitTestList,
  matchUnitFilters,
  unitResultClass,
  defectStatusClass,
} from '@/entities/unit-test/mock/unitTest'
import UnitTestDetailModal from '@/pages/workspace/unit-test/UnitTestDetailModal.vue'
import ExcelDownloadButton from '@/shared/ui/ExcelDownloadButton.vue'
import SearchFilterBar from '@/shared/ui/SearchFilterBar.vue'
import FilterSelectPill from '@/shared/ui/FilterSelectPill.vue'
import HpPagination from '@/shared/ui/HpPagination.vue'
import { mockExcelDownload } from '@/shared/file-excel/excelDownload'

const auth = useAuthStore()
const rows = ref([])
const myTasksOnly = ref(false)
const selectedIds = ref(new Set())
const filters = ref({ keyword: '', status: '전체', system: '전체', bizCategory: '전체' })
const appliedFilters = ref({ ...filters.value })
const pageSize = ref(20)
const currentPage = ref(1)
const detailTarget = ref(null)
const showDetail = ref(false)

const filteredList = computed(() =>
  rows.value.filter((row) =>
    matchUnitFilters(row, appliedFilters.value, myTasksOnly.value, auth.user?.name),
  ),
)

const pagedList = computed(() => {
  const start = (currentPage.value - 1) * pageSize.value
  return filteredList.value.slice(start, start + pageSize.value)
})

const totalPages = computed(() =>
  Math.max(1, Math.ceil(filteredList.value.length / pageSize.value)),
)

onMounted(() => {
  rows.value = getUnitTestList(auth.user?.id)
})

function resetFilters() {
  filters.value = { keyword: '', status: '전체', system: '전체', bizCategory: '전체' }
  appliedFilters.value = { ...filters.value }
  currentPage.value = 1
}

function search() {
  appliedFilters.value = { ...filters.value }
  currentPage.value = 1
}

const systemFilterOptions = computed(() =>
  systemOptions.map((o) => (o === '전체' ? { value: '전체', label: '시스템 선택' } : o)),
)

const filterTags = computed(() => {
  const f = appliedFilters.value
  const tags = []
  if (f.system && f.system !== '전체') tags.push({ key: 'system', label: '시스템', value: f.system })
  if (f.bizCategory && f.bizCategory !== '전체') {
    tags.push({ key: 'bizCategory', label: '업무구분', value: f.bizCategory })
  }
  if (f.keyword?.trim()) tags.push({ key: 'keyword', label: '화면명', value: f.keyword })
  if (f.status && f.status !== '전체') tags.push({ key: 'status', label: '테스트 상태', value: f.status })
  return tags
})

function removeFilterTag(key) {
  if (key === 'keyword') filters.value.keyword = ''
  else filters.value[key] = '전체'
  search()
}

function openDetail(row) {
  detailTarget.value = row
  showDetail.value = true
}

function toggleSelect(id) {
  const row = rows.value.find((r) => r.id === id)
  if (row?.excluded) return
  const next = new Set(selectedIds.value)
  if (next.has(id)) next.delete(id)
  else next.add(id)
  selectedIds.value = next
}

function toggleSelectAll(checked) {
  if (checked) {
    selectedIds.value = new Set(pagedList.value.filter((r) => !r.excluded).map((r) => r.id))
  } else {
    selectedIds.value = new Set()
  }
}

function isAllSelected() {
  const selectable = pagedList.value.filter((r) => !r.excluded)
  return selectable.length > 0 && selectable.every((r) => selectedIds.value.has(r.id))
}

function excludeSelected() {
  if (!selectedIds.value.size) return
  const ok = window.confirm(`선택한 ${selectedIds.value.size}건을 테스트 제외 처리하시겠습니까?`)
  if (!ok) return
  rows.value.forEach((row) => {
    if (selectedIds.value.has(row.id)) row.excluded = true
  })
  selectedIds.value = new Set()
  window.alert('선택한 케이스를 테스트 제외 처리했습니다.')
}

function restoreExcluded(row) {
  const ok = window.confirm(`${row.screenName} 케이스의 테스트 제외를 해제하시겠습니까?`)
  if (!ok) return
  row.excluded = false
  window.alert('테스트 제외를 해제했습니다.')
}

function onExcelDownload() {
  mockExcelDownload('단위테스트', filteredList.value, [
    { key: 'systemPath', label: '시스템/업무' },
    { key: 'screenPath', label: '화면경로' },
    { key: 'screenName', label: '화면명' },
    { key: 'taskType', label: '업무유형' },
    { key: 'assignee', label: '담당자' },
    { key: 'difficulty', label: '난이도' },
    { key: 'testResult', label: '테스트결과' },
    { key: 'testExecutedAt', label: '테스트수행일' },
    { key: 'defectStatus', label: '결함상태' },
    { key: 'memo', label: '메모' },
  ])
}

function onDetailSave(payload) {
  if (!detailTarget.value) return
  const row = detailTarget.value
  row.testResult = payload.testResult
  row.memo = payload.memo
  row.steps = payload.steps
  row.attachments = payload.attachments
  row.defects = payload.defects
  const today = new Date().toISOString().slice(0, 10)
  if (payload.testResult !== '대기') {
    row.testExecutedAt = today
    row.lastExecutedAt = today
  }
  if (payload.defect) {
    row.defectStatus = payload.defect.status
    row.defects.push({
      id: `d-${Date.now()}`,
      title: payload.defect.title,
      grade: payload.defect.grade,
      status: payload.defect.status,
      content: payload.defect.content,
      registeredAt: new Date().toISOString().slice(0, 16).replace('T', ' '),
    })
    if (payload.defect.status === '처리완료') {
      row.defectHandledAt = today
    }
  } else if (payload.testResult === '정상') {
    row.defectStatus = null
  } else if (row.defects.length) {
    row.defectStatus = row.defects[row.defects.length - 1].status
    if (row.defectStatus === '처리완료') {
      row.defectHandledAt = today
    }
  }
}
</script>

<template>
  <div class="unit-test">
    <h1 class="unit-test__title">단위테스트</h1>

    <SearchFilterBar
      v-model:search="filters.keyword"
      search-placeholder="화면명, 화면경로, 담당자 검색"
      :show-expand="false"
      :applied-tags="filterTags"
      @reset="resetFilters"
      @search="search"
      @remove-tag="removeFilterTag"
    >
      <template #primary>
        <FilterSelectPill
          v-model="filters.system"
          label="시스템"
          empty-label="시스템 선택"
          :options="systemFilterOptions"
        />
        <FilterSelectPill v-model="filters.bizCategory" label="업무구분" :options="bizCategoryOptions" />
        <FilterSelectPill v-model="filters.status" label="테스트 상태" :options="unitResultOptions" />
      </template>
    </SearchFilterBar>

    <div class="toolbar">
      <span class="toolbar__count">총 <b>{{ filteredList.length }}</b>건</span>
      <select v-model="pageSize" class="hp-pagesize-select" @change="currentPage = 1">
        <option v-for="n in pageSizeOptions" :key="n" :value="n">{{ n }}건씩 보기</option>
      </select>
      <button
        type="button"
        class="btn btn--ghost btn--sm"
        :disabled="!selectedIds.size"
        @click="excludeSelected"
      >
        테스트 제외
      </button>
      <label class="chk chk--toggle">
        <input v-model="myTasksOnly" type="checkbox" />
        <span class="chk__switch"></span>
        내 업무만
      </label>
      <ExcelDownloadButton @click="onExcelDownload" />
    </div>

    <div class="listcard">
      <div class="listcard__scroll">
        <table class="data-table">
          <thead>
            <tr>
              <th class="col-check">
                <input type="checkbox" :checked="isAllSelected()" @change="toggleSelectAll($event.target.checked)" />
              </th>
              <th class="col-no">NO</th>
              <th>시스템/업무</th>
              <th>화면경로</th>
              <th>화면명</th>
              <th>업무유형</th>
              <th>담당자</th>
              <th>난이도</th>
              <th>테스트수행 결과</th>
              <th>테스트수행일</th>
              <th>결함처리 결과</th>
              <th>결함처리일</th>
              <th>최종실행일</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="(row, idx) in pagedList" :key="row.id" :class="{ 'row--excluded': row.excluded }">
              <td class="col-check cell--center">
                <input
                  type="checkbox"
                  :checked="selectedIds.has(row.id)"
                  :disabled="row.excluded"
                  @change="toggleSelect(row.id)"
                />
              </td>
              <td class="col-no cell--center">{{ (currentPage - 1) * pageSize + idx + 1 }}</td>
              <td>{{ row.systemPath }}</td>
              <td>{{ row.screenPath }}</td>
              <td>
                <button type="button" class="link-btn" @click="openDetail(row)">
                  {{ row.screenName }}
                </button>
                <button v-if="row.excluded" type="button" class="restore-btn" @click="restoreExcluded(row)">
                  제외해제
                </button>
              </td>
              <td class="cell--center">{{ row.taskType }}</td>
              <td class="cell--center">{{ row.assignee }}</td>
              <td class="cell--center">{{ row.difficulty }}</td>
              <td class="cell--center">
                <span class="badge" :class="`badge--${unitResultClass(row.testResult)}`">
                  {{ row.testResult }}
                </span>
              </td>
              <td class="cell--center">{{ row.testExecutedAt || '-' }}</td>
              <td class="cell--center">
                <template v-if="row.defectStatus">
                  <span class="badge" :class="`badge--${defectStatusClass(row.defectStatus)}`">
                    {{ row.defectStatus }}
                  </span>
                </template>
                <span v-else class="muted">-</span>
              </td>
              <td class="cell--center">{{ row.defectHandledAt || '-' }}</td>
              <td class="cell--center">{{ row.lastExecutedAt || '-' }}</td>
            </tr>
            <tr v-if="!pagedList.length">
              <td colspan="13" class="empty">조회 결과가 없습니다.</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <HpPagination v-model:page="currentPage" :total-pages="totalPages" />

    <UnitTestDetailModal
      :visible="showDetail"
      :row="detailTarget"
      @close="showDetail = false"
      @save="onDetailSave"
    />
  </div>
</template>

<style scoped>
.unit-test {
  padding: 14px 18px 28px;
  color: var(--ink);
  font-size: calc(13px + var(--font-size-offset, 0px));
}

.unit-test__title {
  font-size: calc(18px + var(--font-size-offset, 0px));
  font-weight: 700;
  margin: 0 0 14px;
}

.toolbar {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 10px;
}

.btn {
  height: 32px;
  padding: 0 14px;
  border-radius: 7px;
  font-size: calc(12.5px + var(--font-size-offset, 0px));
  font-weight: 600;
  font-family: inherit;
  cursor: pointer;
  border: 1px solid transparent;
}

.btn--sm {
  height: 28px;
  padding: 0 10px;
  font-size: calc(12px + var(--font-size-offset, 0px));
}

.btn--ghost {
  background: var(--lnb-side);
  border-color: var(--line);
  color: var(--ink);
}

.btn--ghost:hover {
  border-color: var(--teal-100);
  color: var(--teal-600);
}

.btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.toolbar__count {
  font-size: calc(12px + var(--font-size-offset, 0px));
  color: var(--ink-2);
}

.toolbar__count b {
  color: var(--teal-600);
}

.chk {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: calc(12px + var(--font-size-offset, 0px));
}

.chk--toggle {
  margin-left: auto;
  cursor: pointer;
}

.chk--toggle input {
  display: none;
}

.chk__switch {
  position: relative;
  width: 32px;
  height: 18px;
  border-radius: 10px;
  background: var(--line);
  transition: background var(--transition-fast);
  flex: none;
}

.chk__switch::after {
  content: '';
  position: absolute;
  top: 2px;
  left: 2px;
  width: 14px;
  height: 14px;
  border-radius: 50%;
  background: #fff;
  transition: transform var(--transition-fast);
}

.chk--toggle input:checked + .chk__switch {
  background: var(--teal);
}

.chk--toggle input:checked + .chk__switch::after {
  transform: translateX(14px);
}

.listcard__scroll {
  overflow-x: auto;
}

.col-check {
  width: 36px;
  text-align: center !important;
}

.col-no {
  width: 48px;
  text-align: center !important;
}

.row--excluded {
  opacity: 0.5;
  background: var(--gray-bg);
}

.row--excluded:hover {
  background: var(--gray-bg);
}

.link-btn {
  border: none;
  background: none;
  color: var(--teal-600);
  font-weight: 600;
  cursor: pointer;
  font-family: inherit;
  font-size: inherit;
  padding: 0;
  text-decoration: underline;
}

.restore-btn {
  margin-left: 6px;
  border: 1px solid var(--line);
  background: var(--lnb-side);
  border-radius: 5px;
  padding: 1px 6px;
  font-family: inherit;
  font-size: calc(10.5px + var(--font-size-offset, 0px));
  color: var(--ink-2);
  cursor: pointer;
}

.badge {
  display: inline-block;
  padding: 2px 8px;
  border-radius: 999px;
  font-size: calc(11px + var(--font-size-offset, 0px));
  font-weight: 600;
}

.badge--ok { background: var(--green-bg); color: var(--green); }
.badge--err { background: var(--red-bg); color: var(--red); }
.badge--wait { background: var(--gray-bg); color: var(--gray); }
.badge--warn { background: var(--orange-bg); color: var(--orange); }
.badge--prog { background: var(--teal-50); color: var(--teal-700); }
.badge--muted { background: var(--gray-bg); color: var(--gray); }

.muted { color: var(--muted); }
.empty { text-align: center !important; color: var(--muted); padding: 24px !important; }
</style>
