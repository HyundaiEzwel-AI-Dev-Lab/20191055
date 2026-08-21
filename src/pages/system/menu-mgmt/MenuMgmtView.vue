<script setup>
// PAG-M-SYS-05 화면(메뉴) 관리
import { computed, ref, watch } from 'vue'
import {
  menuMgmtMeta,
  systemOptions,
  bizCategoriesBySystem,
  getScreenCodes,
} from '@/entities/menu-mgmt/menuMgmt'
import ExcelDownloadButton from '@/shared/ui/ExcelDownloadButton.vue'
import SearchFilterBar from '@/shared/ui/SearchFilterBar.vue'
import FilterSelectPill from '@/shared/ui/FilterSelectPill.vue'
import FilterTextPill from '@/shared/ui/FilterTextPill.vue'
import HpPagination from '@/shared/ui/HpPagination.vue'
import { mockExcelDownload } from '@/shared/file-excel/excelDownload'

const PAGE_SIZE_OPTIONS = [50, 100, 200]

const systemFilterOptions = computed(() => [
  { value: '', label: '전체' },
  ...systemOptions.map((s) => ({ value: s, label: s })),
])

const filters = ref({
  keyword: '',
  systemCode: 'HIMS',
  workCategoryCode: '고객사/제도',
  screenCode: '',
  screenPath: '',
})

const selectedSystem = computed({
  get: () => filters.value.systemCode,
  set: (v) => { filters.value.systemCode = v },
})
const selectedBiz = computed({
  get: () => filters.value.workCategoryCode,
  set: (v) => { filters.value.workCategoryCode = v },
})

const bizList = computed(() => bizCategoriesBySystem[selectedSystem.value] || [])
const workCategoryFilterOptions = computed(() => [
  { value: '', label: '전체' },
  ...bizList.value.map((b) => ({ value: b, label: b })),
])

watch(selectedSystem, (sys) => {
  const list = bizCategoriesBySystem[sys] || []
  selectedBiz.value = list.includes('고객사/제도') ? '고객사/제도' : list[0] || ''
})

function toDraftRow(row, systemCode, biz) {
  return {
    id: row.id,
    screenCode: row.id,
    systemCode: systemCode || null,
    workCategoryCode: row.bizCategory || biz || null,
    screenPath: row.path || '',
    screenName: row.name || '',
    active: row.useYn === 'Y',
    createdByName: row.createdBy === 'system' ? 'system' : row.createdBy,
    createdAt: row.createdAt,
    updatedByName: row.updatedBy ?? '-',
    updatedAt: row.updatedAt,
    systemManaged: !!row.linked,
    isNew: !!row.isNew,
  }
}

const draftRows = ref([])
const selectedCodes = ref([])
const markedForDelete = ref([])
let newRowSeq = 0

function loadDraftRows() {
  const sys = filters.value.systemCode || 'HIMS'
  const biz = filters.value.workCategoryCode || bizList.value[0] || ''
  draftRows.value = getScreenCodes(sys, biz).map((r) => toDraftRow(r, sys, biz))
  selectedCodes.value = []
  markedForDelete.value = []
  currentPage.value = 1
}

watch([() => filters.value.systemCode, () => filters.value.workCategoryCode], loadDraftRows, { immediate: true })

const filteredDraft = computed(() => {
  const f = filters.value
  return draftRows.value.filter((r) => {
    if (f.keyword) {
      const q = f.keyword.toLowerCase()
      if (!r.screenCode.toLowerCase().includes(q) && !r.screenName.toLowerCase().includes(q)) return false
    }
    if (f.screenCode && !r.screenCode.toLowerCase().includes(f.screenCode.trim().toLowerCase())) return false
    if (f.screenPath && !String(r.screenPath || '').toLowerCase().includes(f.screenPath.trim().toLowerCase())) return false
    return true
  })
})

const pageSize = ref(50)
const currentPage = ref(1)
const totalPages = computed(() => Math.max(1, Math.ceil(filteredDraft.value.length / pageSize.value)))
const visibleRows = computed(() => {
  const start = (currentPage.value - 1) * pageSize.value
  return filteredDraft.value.slice(start, start + pageSize.value)
})

watch(totalPages, (max) => {
  if (currentPage.value > max) currentPage.value = max
})

function rowKey(row) {
  return row.isNew ? `new:${row.id}` : row.screenCode
}

function search() {
  loadDraftRows()
}

function resetFilters() {
  filters.value = {
    keyword: '',
    systemCode: 'HIMS',
    workCategoryCode: '고객사/제도',
    screenCode: '',
    screenPath: '',
  }
  search()
}

function toggleSelect(key) {
  const idx = selectedCodes.value.indexOf(key)
  if (idx >= 0) selectedCodes.value.splice(idx, 1)
  else selectedCodes.value.push(key)
}

function toggleSelectAll(e) {
  selectedCodes.value = e.target.checked
    ? visibleRows.value.filter((r) => !r.systemManaged).map(rowKey)
    : []
}

function addRow() {
  currentPage.value = 1
  newRowSeq += 1
  draftRows.value.unshift({
    id: -newRowSeq,
    screenCode: '',
    systemCode: filters.value.systemCode || null,
    workCategoryCode: filters.value.workCategoryCode || null,
    screenPath: '',
    screenName: '',
    active: true,
    createdByName: null,
    createdAt: null,
    updatedByName: null,
    updatedAt: null,
    systemManaged: false,
    isNew: true,
  })
}

function removeSelected() {
  if (!selectedCodes.value.length) {
    window.alert('삭제할 화면을 선택해 주세요.')
    return
  }
  const selected = draftRows.value.filter((r) => selectedCodes.value.includes(rowKey(r)))
  if (selected.some((r) => r.systemManaged)) {
    window.alert('연동 시스템 화면은 삭제할 수 없습니다.')
  }
  const deletable = selected.filter((r) => !r.systemManaged)
  const droppedKeys = new Set(deletable.filter((r) => r.isNew).map(rowKey))
  draftRows.value = draftRows.value.filter((r) => !droppedKeys.has(rowKey(r)))
  markedForDelete.value = [
    ...new Set([...markedForDelete.value, ...deletable.filter((r) => !r.isNew).map((r) => r.screenCode)]),
  ]
  selectedCodes.value = []
}

function saveAll() {
  const newRows = draftRows.value.filter((r) => r.isNew)
  const invalidNew = newRows.find((r) => !r.systemCode || !r.screenName.trim())
  if (invalidNew) {
    window.alert('신규 행의 시스템과 화면명을 입력하세요.')
    return
  }
  const emptyName = draftRows.value.find((r) => !r.isNew && !r.screenName.trim())
  if (emptyName) {
    window.alert('화면명이 비어 있는 행이 있습니다.')
    return
  }
  if (!window.confirm(
    markedForDelete.value.length
      ? `선택 삭제 ${markedForDelete.value.length}건을 포함하여 저장하시겠습니까?`
      : '변경 사항을 저장하시겠습니까?',
  )) return

  const now = new Date().toISOString().slice(0, 19).replace('T', ' ')
  draftRows.value = draftRows.value
    .filter((r) => !markedForDelete.value.includes(r.screenCode))
    .map((r) => {
      if (r.isNew) {
        const code = String(20000 + draftRows.value.length + Math.floor(Math.random() * 100))
        return {
          ...r,
          isNew: false,
          screenCode: code,
          id: code,
          createdByName: '김현대',
          createdAt: now,
        }
      }
      if (r.screenName) {
        return { ...r, updatedByName: '김현대', updatedAt: now }
      }
      return r
    })
  markedForDelete.value = []
  window.alert('저장했습니다.')
}

function onSystemChanged(row) {
  if (!row.workCategoryCode) return
  const allowed = bizCategoriesBySystem[row.systemCode] || []
  if (!allowed.includes(row.workCategoryCode)) row.workCategoryCode = allowed[0] || null
}

function workCategoriesForRow(row) {
  return (bizCategoriesBySystem[row.systemCode] || []).map((b) => ({ code: b, name: b }))
}

function onExcelDownload() {
  mockExcelDownload(`화면코드_${filters.value.systemCode}_${filters.value.workCategoryCode}`, filteredDraft.value, [
    { key: 'screenCode', label: '화면코드' },
    { key: 'screenName', label: '화면명' },
    { key: 'screenPath', label: '화면경로' },
    { key: 'active', label: '사용여부' },
    { key: 'createdByName', label: '등록자' },
    { key: 'createdAt', label: '등록일시' },
    { key: 'updatedByName', label: '수정자' },
  ])
}
</script>

<template>
  <main class="menu-mgmt-page admin-page hp-anim-enter">
    <div class="notice">ⓘ {{ menuMgmtMeta.notice }}</div>

    <SearchFilterBar :show-search="false" @reset="resetFilters" @search="search">
      <template #primary>
        <FilterSelectPill
          v-model="filters.systemCode"
          class="sfb-w-md"
          label="시스템코드"
          :options="systemFilterOptions"
        />
        <FilterSelectPill
          v-model="filters.workCategoryCode"
          class="sfb-w-md"
          label="업무구분"
          :options="workCategoryFilterOptions"
        />
        <FilterTextPill
          v-model="filters.keyword"
          class="sfb-w-lg"
          label="검색어"
          placeholder="화면코드/화면명 검색"
          @enter="search"
        />
        <FilterTextPill
          v-model="filters.screenCode"
          class="sfb-w-md"
          label="화면코드"
          placeholder="화면코드 검색"
          @enter="search"
        />
        <FilterTextPill
          v-model="filters.screenPath"
          class="sfb-w-xl"
          label="화면경로"
          placeholder="화면경로 검색"
          @enter="search"
        />
      </template>
    </SearchFilterBar>

    <div class="toolbar">
      <span class="toolbar__count">화면코드 · 총 <b>{{ filteredDraft.length }}</b>건</span>
      <select v-model="pageSize" class="toolbar__mini" @change="currentPage = 1">
        <option v-for="n in PAGE_SIZE_OPTIONS" :key="n" :value="n">{{ n }}건씩 보기</option>
      </select>
      <div class="toolbar__actions">
        <button type="button" class="btn btn--ghost btn--sm" @click="addRow">＋</button>
        <button type="button" class="btn btn--ghost btn--sm" @click="removeSelected">－</button>
        <button type="button" class="btn btn--primary btn--sm" @click="saveAll">저장</button>
        <ExcelDownloadButton @click="onExcelDownload" />
      </div>
    </div>

    <div class="listcard card--panel">
      <div class="listcard__scroll">
        <table class="data-table">
          <thead>
            <tr>
              <th style="width: 36px"><input type="checkbox" @change="toggleSelectAll" /></th>
              <th>화면코드</th>
              <th>시스템</th>
              <th>업무구분</th>
              <th>화면경로</th>
              <th>화면명</th>
              <th>사용여부</th>
              <th>등록자</th>
              <th>등록일시</th>
              <th>수정자</th>
              <th>수정일시</th>
            </tr>
          </thead>
          <tbody>
            <tr
              v-for="row in visibleRows"
              :key="rowKey(row)"
              :class="{ 'is-marked-delete': markedForDelete.includes(row.screenCode) }"
            >
              <td class="cell--center">
                <input
                  type="checkbox"
                  :disabled="row.systemManaged"
                  :checked="selectedCodes.includes(rowKey(row))"
                  @change="toggleSelect(rowKey(row))"
                />
              </td>
              <td class="cell--center">
                <span v-if="row.isNew" class="tbl__muted">저장 시 자동 채번</span>
                <template v-else>
                  <span class="tbl__name">{{ row.screenCode }}</span>
                  <span v-if="row.systemManaged" class="badge badge--ok" title="연동 화면 — 사용여부 변경/삭제 불가">연동</span>
                </template>
              </td>
              <td class="cell--center">
                <select v-model="row.systemCode" class="cell-select" @change="onSystemChanged(row)">
                  <option :value="null">미지정</option>
                  <option v-for="s in systemOptions" :key="s" :value="s">{{ s }}</option>
                </select>
              </td>
              <td class="cell--center">
                <select
                  v-model="row.workCategoryCode"
                  class="cell-select cell-select--category"
                  :disabled="row.isNew && !row.systemCode"
                >
                  <option v-if="row.isNew && !row.systemCode" :value="null">시스템 선택 후 지정</option>
                  <template v-else>
                    <option :value="null">미분류</option>
                    <option v-for="c in workCategoriesForRow(row)" :key="c.code" :value="c.code">{{ c.name }}</option>
                  </template>
                </select>
              </td>
              <td>
                <input v-model="row.screenPath" class="cell-input" type="text" placeholder="화면경로 입력" />
              </td>
              <td>
                <input v-model="row.screenName" class="cell-input" type="text" placeholder="화면명 입력" />
              </td>
              <td class="cell--center">
                <select
                  v-model="row.active"
                  class="cell-select cell-select--flag"
                  :class="{ 'is-off': !row.active }"
                  :disabled="row.systemManaged"
                >
                  <option :value="true">Y</option>
                  <option :value="false">N</option>
                </select>
              </td>
              <td class="cell--center">{{ row.createdByName ?? '-' }}</td>
              <td class="tbl__muted cell--center">{{ row.createdAt ?? '-' }}</td>
              <td class="cell--center">{{ row.updatedByName ?? '-' }}</td>
              <td class="tbl__muted cell--center">{{ row.updatedAt ?? '-' }}</td>
            </tr>
            <tr v-if="!visibleRows.length">
              <td colspan="11" class="empty">화면코드가 없습니다.</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <HpPagination v-model:page="currentPage" :total-pages="totalPages" />
  </main>
</template>

<style scoped>
.menu-mgmt-page { font-size: 13px; }
.tbl__name { font-weight: 600; }
.tbl__muted { color: var(--lnb-muted); }
.cell--center { text-align: center; }
.empty { text-align: center !important; color: var(--lnb-muted); padding: 24px !important; }
.cell-select.is-off { color: var(--lnb-muted); }
.cell-select--category { width: 170px; min-width: 170px; max-width: 170px; text-overflow: ellipsis; }
.cell-select--flag { width: 52px; min-width: 52px; max-width: 52px; padding: 0 2px 0 6px; }
.is-marked-delete { opacity: 0.45; text-decoration: line-through; }
</style>
