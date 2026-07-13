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
const rows = ref(getScreenCodes(selectedSystem.value, selectedBiz.value))
const selectedIds = ref([])

const bizList = computed(() => bizCategoriesBySystem[selectedSystem.value] || [])

watch(selectedSystem, (sys) => {
  const list = bizCategoriesBySystem[sys] || []
  selectedBiz.value = list.includes('고객사/제도') ? '고객사/제도' : list[0] || ''
})

watch([selectedSystem, selectedBiz], ([sys, biz]) => {
  if (!biz) return
  rows.value = getScreenCodes(sys, biz)
  selectedIds.value = []
})

function selectBiz(biz) {
  selectedBiz.value = biz
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
  rows.value.unshift({
    id: String(20000 + rows.value.length),
    name: '신규 화면',
    path: `${selectedBiz.value} > 신규`,
    useYn: 'Y',
    createdBy: '김현대',
    createdAt: '2026-05-21 00:00:00',
    updatedBy: '-',
  })
}

function removeRows() {
  if (!selectedIds.value.length) {
    window.alert('삭제할 화면을 선택해 주세요.')
    return
  }
  rows.value = rows.value.filter((r) => !selectedIds.value.includes(r.id))
  selectedIds.value = []
}

function saveRows() {
  window.alert(`${rows.value.length}건의 화면코드를 저장했습니다.`)
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
    <h1 class="admin-page__title">
      화면(메뉴) 관리
      <span class="admin-page__hint">{{ menuMgmtMeta.hint }}</span>
    </h1>

    <div class="notice">ⓘ {{ menuMgmtMeta.notice }}</div>

    <div class="admin-split">
      <aside class="card admin-side admin-side--wide">
        <div class="admin-side__head">
          <h3 class="admin-side__title">시스템 / 업무구분 코드</h3>
          <select v-model="selectedSystem" class="filter__select">
            <option v-for="s in systemOptions" :key="s" :value="s">{{ s }}</option>
          </select>
        </div>
        <button
          v-for="biz in bizList"
          :key="biz"
          type="button"
          class="admin-side__item"
          :class="{ 'is-on': selectedBiz === biz }"
          @click="selectBiz(biz)"
        >
          {{ biz }}
        </button>
      </aside>

      <div class="admin-main">
        <div class="toolbar">
          <span class="toolbar__count">화면코드 · 총 <b>{{ rows.length }}</b>건</span>
          <div class="toolbar__actions">
            <button type="button" class="btn btn--ghost btn--sm" @click="addRow">＋</button>
            <button type="button" class="btn btn--ghost btn--sm" @click="removeRows">－</button>
            <ExcelDownloadButton @click="onExcelDownload" />
            <button type="button" class="btn btn--primary btn--sm" @click="saveRows">저장</button>
          </div>
        </div>

        <div class="listcard">
          <div class="listcard__scroll">
            <table class="data-table" style="min-width: 880px">
              <thead>
                <tr>
                  <th style="width: 36px"><input type="checkbox" @change="toggleSelectAll" /></th>
                  <th>관리번호</th>
                  <th>화면명</th>
                  <th>화면경로</th>
                  <th>사용여부</th>
                  <th>등록자</th>
                  <th>등록일시</th>
                  <th>수정자</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="row in rows" :key="row.id">
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
                  <td class="tbl__muted">{{ row.path }}</td>
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
                </tr>
                <tr v-if="!rows.length">
                  <td colspan="8" class="empty">화면코드가 없습니다.</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
