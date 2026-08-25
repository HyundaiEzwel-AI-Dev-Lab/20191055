<script setup>
// PAG-M-SYS-07 휴무일 관리
import { computed, ref } from 'vue'
import {
  holidayMeta,
  holidayFormTypeOptions,
  yearOptions,
  holidayList,
  holidayMockToday,
  matchHolidayFilters,
} from '@/entities/holiday/holiday'
import ExcelDownloadButton from '@/shared/ui/ExcelDownloadButton.vue'
import SearchFilterBar from '@/shared/ui/SearchFilterBar.vue'
import FilterSelectPill from '@/shared/ui/FilterSelectPill.vue'
import FilterTextPill from '@/shared/ui/FilterTextPill.vue'
import { mockExcelDownload } from '@/shared/file-excel/excelDownload'

const currentYear = 2026
const yearFilterOptions = yearOptions.map((y) => ({ value: String(y), label: `${y}년` }))
const typeFilterOptions = [
  { value: '', label: '전체' },
  ...holidayFormTypeOptions.map((t) => ({ value: t, label: t })),
]

function toDraft(row) {
  return {
    key: row.id,
    id: row.id,
    sortKey: row.date,
    holidayDate: row.date,
    name: row.name,
    typeCode: row.type,
    note: row.note ?? '',
    recurring: false,
    sourceCode: row.registeredBy === 'system' ? 'SYNC' : 'MANUAL',
    createdByName: row.registeredBy,
    createdAt: row.registeredAt,
    updatedByName: row.updatedBy,
    updatedAt: row.updatedAt,
    isNew: !!row.isNew,
  }
}

const draft = ref(holidayList.map((r) => toDraft({ ...r })))
const filters = ref({ year: currentYear, typeCode: '', keyword: '' })
const applied = ref({ ...filters.value })
const selectedKeys = ref([])
const markedForDelete = ref([])
const originals = ref(new Map())
const saving = ref(false)
let newRowSeq = 0

function resetOriginals() {
  originals.value = new Map(draft.value.map((row) => [row.key, JSON.stringify([row.holidayDate, row.name, row.typeCode, row.note, row.recurring])]))
}

resetOriginals()

const filtered = computed(() => {
  const mockFilters = {
    year: applied.value.year,
    type: applied.value.typeCode || '전체',
    keyword: applied.value.keyword,
  }
  return draft.value
    .filter((r) => !markedForDelete.value.includes(r.key))
    .filter((r) => matchHolidayFilters(
      { date: r.holidayDate, type: r.typeCode, name: r.name, note: r.note },
      mockFilters,
    ))
    .sort((a, b) => (a.sortKey || a.holidayDate).localeCompare(b.sortKey || b.holidayDate))
})

const allSelected = computed(() => {
  const selectable = filtered.value.filter(isDeletable)
  return selectable.length > 0 && selectable.every((r) => selectedKeys.value.includes(r.key))
})

function isPast(date) {
  return date < holidayMockToday
}

function isLocked(row) {
  return row.sourceCode === 'SYNC'
}

function isDeletable(row) {
  return !isLocked(row) && !isPast(row.holidayDate)
}

function defaultHolidayDate() {
  const year = applied.value.year ?? currentYear
  return year === currentYear ? holidayMockToday : `${year}-01-01`
}

function search() {
  applied.value = { ...filters.value }
  selectedKeys.value = []
}

function resetFilters() {
  filters.value = { year: currentYear, typeCode: '', keyword: '' }
  search()
}

function toggleSelect(key) {
  const idx = selectedKeys.value.indexOf(key)
  if (idx >= 0) selectedKeys.value.splice(idx, 1)
  else selectedKeys.value.push(key)
}

function toggleSelectAll(e) {
  selectedKeys.value = e.target.checked ? filtered.value.filter(isDeletable).map((r) => r.key) : []
}

function addRow() {
  newRowSeq += 1
  draft.value.unshift({
    key: `new-${newRowSeq}`,
    id: null,
    sortKey: '',
    holidayDate: defaultHolidayDate(),
    name: '',
    typeCode: holidayFormTypeOptions[0] ?? '',
    note: '',
    recurring: false,
    sourceCode: 'MANUAL',
    createdByName: null,
    createdAt: null,
    updatedByName: null,
    updatedAt: null,
    isNew: true,
  })
}

function markRemove() {
  if (!selectedKeys.value.length) {
    window.alert('삭제할 휴무일을 선택해 주세요.')
    return
  }
  const next = new Set(markedForDelete.value)
  selectedKeys.value.forEach((key) => next.add(key))
  markedForDelete.value = [...next]
  selectedKeys.value = []
}

function saveAll() {
  const remaining = draft.value.filter((r) => !markedForDelete.value.includes(r.key))
  if (remaining.some((r) => !r.holidayDate || !r.name.trim())) {
    window.alert('일자와 휴무일명이 비어 있는 행이 있습니다.')
    return
  }
  const dates = remaining.map((r) => r.holidayDate)
  if (new Set(dates).size !== dates.length) {
    window.alert('중복된 일자가 있습니다.')
    return
  }
  const creates = remaining.filter((r) => r.isNew)
  const updates = remaining.filter((r) => !r.isNew)
  if (!window.confirm(`등록 ${creates.length}건, 수정 ${updates.length}건, 삭제 ${markedForDelete.value.length}건을 저장하시겠습니까?`)) return

  saving.value = true
  try {
    const now = new Date().toISOString().slice(0, 19).replace('T', ' ')
    draft.value = remaining.map((r) => {
      if (r.isNew) {
        return {
          ...r,
          isNew: false,
          id: r.key,
          sortKey: r.holidayDate,
          createdByName: '김현대',
          createdAt: now,
        }
      }
      return { ...r, sortKey: r.holidayDate, updatedByName: '김현대', updatedAt: now }
    })
    markedForDelete.value = []
    selectedKeys.value = []
    resetOriginals()
    window.alert('저장했습니다.')
  } finally {
    saving.value = false
  }
}

function onExcelDownload() {
  mockExcelDownload('휴무일 관리', filtered.value, [
    { key: 'holidayDate', label: '일자' },
    { key: 'name', label: '휴무일명' },
    { key: 'typeCode', label: '구분' },
    { key: 'note', label: '비고' },
    { key: 'createdByName', label: '등록자' },
    { key: 'createdAt', label: '등록일시' },
    { key: 'updatedByName', label: '수정자' },
    { key: 'updatedAt', label: '수정일시' },
  ])
}
</script>

<template>
  <main class="holiday-page admin-page hp-anim-enter">
    <div class="notice">ⓘ {{ holidayMeta.hint }}</div>

    <SearchFilterBar :show-search="false" @reset="resetFilters" @search="search">
      <template #primary>
        <FilterSelectPill
          :model-value="filters.year == null ? '' : String(filters.year)"
          class="sfb-w-sm"
          label="연도"
          empty-label=""
          :options="yearFilterOptions"
          @update:model-value="filters.year = $event === '' ? null : Number($event)"
        />
        <FilterSelectPill v-model="filters.typeCode" class="sfb-w-sm" label="구분" :options="typeFilterOptions" />
        <FilterTextPill
          v-model="filters.keyword"
          class="sfb-w-lg"
          label="휴무일명"
          placeholder="휴무일명 검색"
          @enter="search"
        />
      </template>
    </SearchFilterBar>

    <div class="toolbar">
      <span class="toolbar__count">{{ applied.year }}년 휴무일 · 총 <b>{{ filtered.length }}</b>일</span>
      <div class="toolbar__actions">
        <button type="button" class="btn btn--ghost btn--sm" title="행 추가" @click="addRow">＋</button>
        <button type="button" class="btn btn--ghost btn--sm" title="선택 행 삭제" @click="markRemove">－</button>
        <button type="button" class="btn btn--primary btn--sm" :disabled="saving" @click="saveAll">저장</button>
        <ExcelDownloadButton @click="onExcelDownload" />
      </div>
    </div>

    <div class="listcard card--panel">
      <div class="listcard__scroll">
        <table class="data-table">
          <thead>
            <tr>
              <th style="width: 36px">
                <input type="checkbox" :checked="allSelected" @change="toggleSelectAll" />
              </th>
              <th>일자</th>
              <th>휴무일명</th>
              <th>구분</th>
              <th>반복</th>
              <th>비고</th>
              <th>등록자</th>
              <th>등록일시</th>
              <th>수정자</th>
              <th>수정일시</th>
            </tr>
          </thead>
          <tbody>
            <tr
              v-for="row in filtered"
              :key="row.key"
              :class="{ 'is-marked-delete': markedForDelete.includes(row.key) }"
            >
              <td class="cell--center">
                <input
                  type="checkbox"
                  :disabled="!isDeletable(row)"
                  :checked="selectedKeys.includes(row.key)"
                  @change="toggleSelect(row.key)"
                />
              </td>
              <td class="cell--center">
                <input
                  v-model="row.holidayDate"
                  class="cell-input"
                  type="date"
                  :disabled="isLocked(row)"
                  @click="$event.target.showPicker?.()"
                />
              </td>
              <td>
                <input v-model="row.name" class="cell-input" type="text" placeholder="휴무일명 입력" :disabled="isLocked(row)" />
              </td>
              <td class="cell--center">
                <select v-model="row.typeCode" class="cell-select" :disabled="isLocked(row)">
                  <option v-for="t in holidayFormTypeOptions" :key="t" :value="t">{{ t }}</option>
                </select>
              </td>
              <td class="cell--center">
                <label class="cell-toggle" :class="{ 'is-on': row.recurring, 'is-disabled': isLocked(row) }">
                  <input v-model="row.recurring" type="checkbox" :disabled="isLocked(row)" />
                  <span class="cell-toggle__track"><span class="cell-toggle__thumb"></span></span>
                </label>
              </td>
              <td>
                <input v-model="row.note" class="cell-input" type="text" placeholder="비고 입력" :disabled="isLocked(row)" />
              </td>
              <td class="cell--center">{{ row.createdByName ?? '-' }}</td>
              <td class="tbl__muted cell--center">{{ row.createdAt ?? '-' }}</td>
              <td class="cell--center">
                <span :class="{ 'tbl__muted': !row.updatedByName || row.updatedByName === '-' }">{{ row.updatedByName ?? '-' }}</span>
              </td>
              <td class="tbl__muted cell--center">{{ row.updatedAt ?? '-' }}</td>
            </tr>
            <tr v-if="!filtered.length">
              <td colspan="10" class="empty">조회 결과가 없습니다.</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  </main>
</template>

<style scoped>
.holiday-page { font-size: 13px; }
.tbl__muted { color: var(--lnb-muted); }
.cell--center { text-align: center; }
.empty { text-align: center !important; color: var(--lnb-muted); padding: 24px !important; }
.is-marked-delete { opacity: 0.45; text-decoration: line-through; }
.cell-checkbox {
  display: flex;
  align-items: center;
  gap: 0.3rem;
  font-size: 12px;
  white-space: nowrap;
}
.cell-toggle {
  display: inline-flex;
  cursor: pointer;
}
.cell-toggle input {
  position: absolute;
  width: 1px;
  height: 1px;
  opacity: 0;
  pointer-events: none;
}
.cell-toggle__track {
  display: inline-block;
  width: 34px;
  height: 20px;
  border-radius: 999px;
  background: var(--lnb-line);
  position: relative;
  transition: background var(--transition-fast);
}
.cell-toggle__thumb {
  position: absolute;
  top: 2px;
  left: 2px;
  width: 16px;
  height: 16px;
  border-radius: 50%;
  background: #fff;
  box-shadow: var(--shadow-sm);
  transition: transform var(--transition-fast);
}
.cell-toggle.is-on .cell-toggle__track { background: var(--teal); }
.cell-toggle.is-on .cell-toggle__thumb { transform: translateX(14px); }
.cell-toggle.is-disabled { cursor: not-allowed; opacity: 0.5; }
</style>
