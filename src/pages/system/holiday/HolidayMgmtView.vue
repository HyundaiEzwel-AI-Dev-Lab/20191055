<script setup>
// PAG-M-SYS-07 휴무일 관리
import { computed, ref } from 'vue'
import {
  holidayMeta,
  holidayTypeOptions,
  holidayFormTypeOptions,
  yearOptions,
  holidayList,
  holidayMockToday,
  matchHolidayFilters,
} from '@/entities/holiday/holiday'
import ExcelDownloadButton from '@/shared/ui/ExcelDownloadButton.vue'
import SearchFilterBar from '@/shared/ui/SearchFilterBar.vue'
import FilterSelectPill from '@/shared/ui/FilterSelectPill.vue'
import { mockExcelDownload } from '@/shared/file-excel/excelDownload'

const allRows = ref(holidayList.map((r) => ({ ...r })))
const filters = ref({ year: 2026, type: '전체', keyword: '' })
const applied = ref({ ...filters.value })
const selectedIds = ref([])
const markedForDelete = ref([])

const yearSelectOptions = yearOptions.map((y) => ({ value: y, label: `${y}년` }))

const filtered = computed(() =>
  allRows.value
    .filter((r) => matchHolidayFilters(r, applied.value))
    .sort((a, b) => a.date.localeCompare(b.date)),
)

const filterTags = computed(() => {
  const a = applied.value
  const tags = []
  if (a.year && Number(a.year) !== 2026) tags.push({ key: 'year', label: '연도', value: `${a.year}년` })
  if (a.type && a.type !== '전체') tags.push({ key: 'type', label: '구분', value: a.type })
  if (a.keyword) tags.push({ key: 'keyword', label: '휴무일명', value: a.keyword })
  return tags
})

function isPast(date) {
  return date < holidayMockToday
}

function search() {
  applied.value = { ...filters.value }
  selectedIds.value = []
}

function resetFilters() {
  filters.value = { year: 2026, type: '전체', keyword: '' }
  search()
}

function removeFilterTag(key) {
  if (key === 'year') filters.value.year = 2026
  else if (key === 'type') filters.value.type = '전체'
  else if (key === 'keyword') filters.value.keyword = ''
  search()
}

function toggleSelect(id) {
  const idx = selectedIds.value.indexOf(id)
  if (idx >= 0) selectedIds.value.splice(idx, 1)
  else selectedIds.value.push(id)
}

function toggleSelectAll(e) {
  selectedIds.value = e.target.checked
    ? filtered.value.filter((r) => !isPast(r.date)).map((r) => r.id)
    : []
}

function addRow() {
  allRows.value.unshift({
    id: `h-${Date.now()}`,
    date: `${applied.value.year}-01-01`,
    name: '',
    type: '회사휴무',
    note: '',
    registeredBy: '김현대',
    registeredAt: new Date().toISOString().slice(0, 19).replace('T', ' '),
    updatedBy: '-',
    updatedAt: null,
    isNew: true,
  })
}

function removeRows() {
  if (!selectedIds.value.length) {
    window.alert('삭제할 휴무일을 선택해 주세요.')
    return
  }
  const next = new Set(markedForDelete.value)
  selectedIds.value.forEach((id) => next.add(id))
  markedForDelete.value = [...next]
  selectedIds.value = []
}

function saveAll() {
  const remaining = allRows.value.filter((r) => !markedForDelete.value.includes(r.id))
  const empty = remaining.find((r) => !r.date || !r.name.trim())
  if (empty) {
    window.alert('일자와 휴무일명이 비어 있는 행이 있습니다.')
    return
  }
  const dates = remaining.map((r) => r.date)
  if (new Set(dates).size !== dates.length) {
    window.alert('중복된 일자가 있습니다.')
    return
  }
  if (!window.confirm(`선택 삭제 ${markedForDelete.value.length}건을 포함하여 저장하시겠습니까?`)) return
  const now = new Date().toISOString().slice(0, 19).replace('T', ' ')
  remaining.forEach((r) => {
    if (r.isNew) {
      delete r.isNew
    } else {
      r.updatedBy = '김현대'
      r.updatedAt = now
    }
  })
  allRows.value = remaining
  markedForDelete.value = []
  selectedIds.value = []
  window.alert(`${remaining.length}건이 저장되었습니다.`)
}

function onExcelDownload() {
  mockExcelDownload('휴무일 관리', filtered.value, [
    { key: 'date', label: '일자' },
    { key: 'name', label: '휴무일명' },
    { key: 'type', label: '구분' },
    { key: 'note', label: '비고' },
    { key: 'registeredBy', label: '등록자' },
    { key: 'registeredAt', label: '등록일시' },
    { key: 'updatedBy', label: '수정자' },
    { key: 'updatedAt', label: '수정일시' },
  ])
}
</script>

<template>
  <div class="admin-page">
    <div class="notice">ⓘ {{ holidayMeta.hint }}</div>

    <SearchFilterBar
      v-model:search="filters.keyword"
      search-placeholder="휴무일명 검색"
      :applied-tags="filterTags"
      @reset="resetFilters"
      @search="search"
      @remove-tag="removeFilterTag"
    >
      <template #primary>
        <FilterSelectPill v-model="filters.year" label="연도" :options="yearSelectOptions" empty-label="" />
        <FilterSelectPill v-model="filters.type" label="구분" :options="holidayTypeOptions" />
      </template>
    </SearchFilterBar>

    <div class="toolbar">
      <span class="toolbar__count">
        {{ applied.year }}년 휴무일 · 총 <b>{{ filtered.length }}</b>일
      </span>
      <div class="toolbar__actions">
        <button type="button" class="btn btn--ghost btn--sm" @click="addRow">＋</button>
        <button type="button" class="btn btn--ghost btn--sm" @click="removeRows">－</button>
        <button type="button" class="btn btn--primary btn--sm" @click="saveAll">저장</button>
        <ExcelDownloadButton @click="onExcelDownload" />
      </div>
    </div>

    <div class="listcard">
      <div class="listcard__scroll">
        <table class="data-table">
          <thead>
            <tr>
              <th style="width: 36px"><input type="checkbox" @change="toggleSelectAll" /></th>
              <th>일자</th>
              <th>휴무일명</th>
              <th>구분</th>
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
              :key="row.id"
              :class="{ 'is-marked-delete': markedForDelete.includes(row.id) }"
            >
              <td>
                <input
                  type="checkbox"
                  :disabled="isPast(row.date)"
                  :checked="selectedIds.includes(row.id)"
                  @change="toggleSelect(row.id)"
                />
              </td>
              <td>
                <input v-model="row.date" class="cell-input" type="date" @click="$event.target.showPicker?.()" />
              </td>
              <td>
                <input v-model="row.name" class="cell-input" type="text" placeholder="휴무일명 입력" />
              </td>
              <td>
                <select v-model="row.type" class="cell-select">
                  <option v-for="o in holidayFormTypeOptions" :key="o" :value="o">{{ o }}</option>
                </select>
              </td>
              <td>
                <input v-model="row.note" class="cell-input" type="text" placeholder="비고 입력" />
              </td>
              <td>{{ row.registeredBy }}</td>
              <td class="tbl__muted">{{ row.registeredAt }}</td>
              <td>
                <span :class="{ 'tbl__muted': row.updatedBy === '-' }">{{ row.updatedBy }}</span>
              </td>
              <td class="tbl__muted">{{ row.updatedAt || '-' }}</td>
            </tr>
            <tr v-if="!filtered.length">
              <td colspan="9" class="empty">조회 결과가 없습니다.</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  </div>
</template>

<style scoped>
.is-marked-delete {
  opacity: 0.45;
  text-decoration: line-through;
}
</style>
