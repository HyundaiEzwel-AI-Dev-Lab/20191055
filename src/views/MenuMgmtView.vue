<script setup>
// PAG-M-SYS-05 화면(메뉴) 관리
import { computed, ref, watch } from 'vue'
import {
  menuMgmtMeta,
  systemOptions,
  bizCategoriesBySystem,
  getScreenCodes,
} from '@/data/menuMgmt'
import ExcelDownloadButton from '@/components/ui/ExcelDownloadButton.vue'
import { mockExcelDownload } from '@/utils/excelDownload'

const selectedSystem = ref('HIMS')
const selectedBiz = ref('고객사/제도')
const allRows = ref(getScreenCodes(selectedSystem.value, selectedBiz.value))
const selectedIds = ref([])
const markedForDelete = ref([])
const hasSearched = ref(true)

const filters = ref({ id: '', name: '', path: '' })

const bizList = computed(() => bizCategoriesBySystem[selectedSystem.value] || [])

const rows = computed(() => {
  const f = filters.value
  return allRows.value.filter((r) => {
    if (f.id && !r.id.toLowerCase().includes(f.id.trim().toLowerCase())) return false
    if (f.name && !r.name.toLowerCase().includes(f.name.trim().toLowerCase())) return false
    if (f.path && !r.path.toLowerCase().includes(f.path.trim().toLowerCase())) return false
    return true
  })
})

const canAdd = computed(() => hasSearched.value && !!selectedSystem.value && !!selectedBiz.value)

watch(selectedSystem, (sys) => {
  const list = bizCategoriesBySystem[sys] || []
  selectedBiz.value = list.includes('고객사/제도') ? '고객사/제도' : list[0] || ''
})

watch([selectedSystem, selectedBiz], ([sys, biz]) => {
  if (!biz) return
  hasSearched.value = false
  allRows.value = getScreenCodes(sys, biz)
  selectedIds.value = []
  markedForDelete.value = []
})

function search() {
  hasSearched.value = true
}

function resetFilters() {
  filters.value = { id: '', name: '', path: '' }
  search()
}

function toggleSelect(id) {
  const idx = selectedIds.value.indexOf(id)
  if (idx >= 0) selectedIds.value.splice(idx, 1)
  else selectedIds.value.push(id)
}

function toggleSelectAll(e) {
  selectedIds.value = e.target.checked ? rows.value.map((r) => r.id) : []
}

function addRow() {
  if (!canAdd.value) return
  allRows.value.unshift({
    id: String(20000 + allRows.value.length),
    name: '신규 화면',
    path: '',
    bizCategory: selectedBiz.value,
    useYn: 'Y',
    createdBy: '김현대',
    createdAt: '2026-05-21 00:00:00',
    updatedBy: '-',
    updatedAt: null,
    isNew: true,
  })
}

function removeRows() {
  if (!selectedIds.value.length) {
    window.alert('삭제할 화면을 선택해 주세요.')
    return
  }
  const next = new Set(markedForDelete.value)
  selectedIds.value.forEach((id) => next.add(id))
  markedForDelete.value = [...next]
  selectedIds.value = []
}

function saveRows() {
  const remaining = allRows.value.filter((r) => !markedForDelete.value.includes(r.id))
  const empty = remaining.find((r) => !String(r.name || '').trim())
  if (empty) {
    window.alert('화면명이 비어 있는 행이 있습니다.')
    return
  }
  if (remaining.some((r) => r.isNew && !r.path.trim())) {
    window.alert('신규 행의 화면경로를 입력해 주세요.')
    return
  }
  if (!window.confirm(`선택 삭제 ${markedForDelete.value.length}건을 포함하여 저장하시겠습니까?`)) return
  const now = new Date().toISOString().slice(0, 19).replace('T', ' ')
  remaining.forEach((r) => {
    if (r.name) {
      r.updatedBy = '김현대'
      r.updatedAt = now
    }
    delete r.isNew
  })
  allRows.value = remaining
  markedForDelete.value = []
  window.alert(`${remaining.length}건의 화면코드를 저장했습니다.`)
}

function onExcelDownload() {
  mockExcelDownload(`화면코드_${selectedSystem.value}_${selectedBiz.value}`, rows.value, [
    { key: 'id', label: '관리번호' },
    { key: 'name', label: '화면명' },
    { key: 'path', label: '화면경로' },
    { key: 'useYn', label: '사용여부' },
    { key: 'createdBy', label: '등록자' },
    { key: 'createdAt', label: '등록일시' },
    { key: 'updatedBy', label: '수정자' },
  ])
}
</script>

<template>
  <div class="admin-page">
    <div class="notice">ⓘ {{ menuMgmtMeta.notice }}</div>

    <section class="filter card">
      <div class="filter__row filter__row--4">
        <div class="filter__field">
          <label>시스템</label>
          <select v-model="selectedSystem" class="filter__select">
            <option v-for="s in systemOptions" :key="s" :value="s">{{ s }}</option>
          </select>
        </div>
        <div class="filter__field">
          <label>업무구분</label>
          <select v-model="selectedBiz" class="filter__select">
            <option v-for="b in bizList" :key="b" :value="b">{{ b }}</option>
          </select>
        </div>
        <div class="filter__field">
          <label>관리번호</label>
          <input v-model="filters.id" class="filter__input" type="text" placeholder="관리번호 검색" @keyup.enter="search" />
        </div>
        <div class="filter__field">
          <label>화면명</label>
          <input v-model="filters.name" class="filter__input" type="text" placeholder="화면명 검색" @keyup.enter="search" />
        </div>
      </div>
      <div class="filter__row filter__row--2">
        <div class="filter__field">
          <label>화면경로</label>
          <input v-model="filters.path" class="filter__input" type="text" placeholder="화면경로 검색" @keyup.enter="search" />
        </div>
      </div>
      <div class="filter__actions">
        <button type="button" class="btn btn--ghost" @click="resetFilters">초기화</button>
        <button type="button" class="btn btn--primary" @click="search">조회</button>
      </div>
    </section>

    <div class="toolbar">
      <span class="toolbar__count">화면코드 · 총 <b>{{ rows.length }}</b>건</span>
      <div class="toolbar__actions">
        <button type="button" class="btn btn--ghost btn--sm" :disabled="!canAdd" @click="addRow">＋</button>
        <button type="button" class="btn btn--ghost btn--sm" @click="removeRows">－</button>
        <button type="button" class="btn btn--primary btn--sm" @click="saveRows">저장</button>
        <ExcelDownloadButton @click="onExcelDownload" />
      </div>
    </div>

    <div class="listcard">
      <div class="listcard__scroll">
        <table class="data-table" style="min-width: 980px">
          <thead>
            <tr>
              <th style="width: 36px"><input type="checkbox" @change="toggleSelectAll" /></th>
              <th>관리번호</th>
              <th>화면명</th>
              <th>업무구분</th>
              <th>화면경로</th>
              <th>사용여부</th>
              <th>등록자</th>
              <th>등록일시</th>
              <th>수정자</th>
              <th>수정일시</th>
            </tr>
          </thead>
          <tbody>
            <tr
              v-for="row in rows"
              :key="row.id"
              :class="{ 'is-marked-delete': markedForDelete.includes(row.id) }"
            >
              <td>
                <input
                  type="checkbox"
                  :checked="selectedIds.includes(row.id)"
                  @change="toggleSelect(row.id)"
                />
              </td>
              <td><span class="tbl__name">{{ row.id }}</span></td>
              <td>
                <input v-model="row.name" class="cell-input" type="text" />
              </td>
              <td>
                <select v-if="row.isNew" v-model="row.bizCategory" class="cell-select">
                  <option v-for="b in bizList" :key="b" :value="b">{{ b }}</option>
                </select>
                <span v-else class="tbl__muted">{{ row.bizCategory }}</span>
              </td>
              <td>
                <input v-if="row.isNew" v-model="row.path" class="cell-input" type="text" placeholder="화면경로 입력" />
                <span v-else class="tbl__muted">{{ row.path }}</span>
              </td>
              <td>
                <select
                  v-model="row.useYn"
                  class="cell-select"
                  :class="{ 'is-off': row.useYn === 'N' }"
                >
                  <option value="Y">Y</option>
                  <option value="N">N</option>
                </select>
              </td>
              <td>{{ row.createdBy }}</td>
              <td class="tbl__muted">{{ row.createdAt }}</td>
              <td>
                <span :class="{ 'tbl__muted': row.updatedBy === '-' }">{{ row.updatedBy }}</span>
              </td>
              <td class="tbl__muted">{{ row.updatedAt || '-' }}</td>
            </tr>
            <tr v-if="!rows.length">
              <td colspan="10" class="empty">화면코드가 없습니다.</td>
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
