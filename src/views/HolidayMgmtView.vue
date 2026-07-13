<script setup>
// PAG-M-SYS-07 휴무일 관리
import { computed, reactive, ref } from 'vue'
import {
  holidayMeta,
  holidayTypeOptions,
  yearOptions,
  holidayList,
  matchHolidayFilters,
  holidayTypeClass,
} from '@/data/holiday'
import BaseModal from '@/components/ui/BaseModal.vue'
import ExcelDownloadButton from '@/components/ui/ExcelDownloadButton.vue'
import { mockExcelDownload } from '@/utils/excelDownload'

const rows = ref(holidayList.map((r) => ({ ...r })))
const filters = ref({ year: 2026, type: '전체', keyword: '' })
const applied = ref({ ...filters.value })
const showForm = ref(false)
const form = reactive({ id: '', date: '', name: '', type: '회사휴무', note: '', isNew: true })

const filtered = computed(() =>
  rows.value
    .filter((r) => matchHolidayFilters(r, applied.value))
    .sort((a, b) => a.date.localeCompare(b.date)),
)

function search() {
  applied.value = { ...filters.value }
}

function resetFilters() {
  filters.value = { year: 2026, type: '전체', keyword: '' }
  search()
}

function openAdd() {
  Object.assign(form, {
    id: '',
    date: `${applied.value.year}-01-01`,
    name: '',
    type: '회사휴무',
    note: '',
    isNew: true,
  })
  showForm.value = true
}

function openEdit(row) {
  Object.assign(form, { ...row, isNew: false })
  showForm.value = true
}

function saveForm() {
  if (!form.date || !form.name.trim()) {
    window.alert('일자와 휴무일명은 필수입니다.')
    return
  }
  if (form.isNew) {
    rows.value.push({
      id: `h-${Date.now()}`,
      date: form.date,
      name: form.name.trim(),
      type: form.type,
      note: form.note.trim(),
    })
  } else {
    const target = rows.value.find((r) => r.id === form.id)
    if (target) {
      target.date = form.date
      target.name = form.name.trim()
      target.type = form.type
      target.note = form.note.trim()
    }
  }
  showForm.value = false
  search()
}

function removeRow(row) {
  if (!window.confirm(`"${row.name}" 휴무일을 삭제할까요?`)) return
  rows.value = rows.value.filter((r) => r.id !== row.id)
}

function onExcelDownload() {
  mockExcelDownload('휴무일 관리', filtered.value.length)
}
</script>

<template>
  <div class="admin-page">
    <h1 class="admin-page__title">
      휴무일 관리
      <span class="admin-page__hint">{{ holidayMeta.hint }}</span>
    </h1>

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
        <button type="button" class="btn btn--primary btn--sm" @click="openAdd">＋ 휴무일 등록</button>
        <ExcelDownloadButton @click="onExcelDownload" />
      </div>
    </div>

    <div class="listcard">
      <div class="listcard__scroll">
        <table class="data-table">
          <thead>
            <tr>
              <th>일자</th>
              <th>휴무일명</th>
              <th>구분</th>
              <th>비고</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="row in filtered" :key="row.id">
              <td><span class="tbl__name">{{ row.date }}</span></td>
              <td>{{ row.name }}</td>
              <td>
                <span class="badge" :class="`badge--${holidayTypeClass(row.type)}`">{{ row.type }}</span>
              </td>
              <td class="tbl__muted">{{ row.note || '-' }}</td>
              <td>
                <button type="button" class="link-btn" @click="openEdit(row)">수정</button>
                <button type="button" class="link-btn link-btn--danger" style="margin-left: 10px" @click="removeRow(row)">삭제</button>
              </td>
            </tr>
            <tr v-if="!filtered.length">
              <td colspan="5" class="empty">조회 결과가 없습니다.</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <BaseModal
      :visible="showForm"
      :title="form.isNew ? '휴무일 등록' : '휴무일 수정'"
      @close="showForm = false"
    >
      <div class="modal-grid">
        <div class="modal-field">
          <label>일자</label>
          <input v-model="form.date" class="filter__input" type="date" />
        </div>
        <div class="modal-field">
          <label>구분</label>
          <select v-model="form.type" class="filter__select">
            <option value="법정공휴일">법정공휴일</option>
            <option value="회사휴무">회사휴무</option>
          </select>
        </div>
        <div class="modal-field modal-field--wide">
          <label>휴무일명</label>
          <input v-model="form.name" class="filter__input" type="text" />
        </div>
        <div class="modal-field modal-field--wide">
          <label>비고</label>
          <input v-model="form.note" class="filter__input" type="text" />
        </div>
      </div>
      <template #footer>
        <button type="button" class="btn btn--ghost" @click="showForm = false">취소</button>
        <button type="button" class="btn btn--primary" @click="saveForm">저장</button>
      </template>
    </BaseModal>
  </div>
</template>
