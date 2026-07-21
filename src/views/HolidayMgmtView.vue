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
} from '@/data/holiday'
import ExcelDownloadButton from '@/components/ui/ExcelDownloadButton.vue'
import { mockExcelDownload } from '@/utils/excelDownload'

const allRows = ref(holidayList.map((r) => ({ ...r })))
const filters = ref({ year: 2026, type: '전체', keyword: '' })
const applied = ref({ ...filters.value })
const selectedIds = ref([])
const markedForDelete = ref([])

const filtered = computed(() =>
  allRows.value
    .filter((r) => matchHolidayFilters(r, applied.value))
    .sort((a, b) => a.date.localeCompare(b.date)),
)

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

    <section class="filter card">
      <div class="filter__row filter__row--3">
        <div class="filter__field">
          <label>연도</label>
          <select v-model="filters.year" class="filter__select">
            <option v-for="y in yearOptions" :key="y" :value="y">{{ y }}년</option>
          </select>
        </div>
        <div class="filter__field">
          <label>구분</label>
          <select v-model="filters.type" class="filter__select">
            <option v-for="o in holidayTypeOptions" :key="o" :value="o">{{ o }}</option>
          </select>
        </div>
        <div class="filter__field">
          <label>휴무일명</label>
          <input
            v-model="filters.keyword"
            class="filter__input"
            type="text"
            placeholder="휴무일명 검색"
            @keyup.enter="search"
          />
        </div>
      </div>
      <div class="filter__actions">
        <button type="button" class="btn btn--ghost" @click="resetFilters">초기화</button>
        <button type="button" class="btn btn--primary" @click="search">조회</button>
      </div>
    </section>

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
                <input v-model="row.date" class="cell-input" type="date" />
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
