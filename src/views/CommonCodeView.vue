<script setup>
// PAG-M-SYS-06 공통코드 관리
import { computed, reactive, ref, watch } from 'vue'
import { commonCodeMeta, codeCategoryGroups, getCodeDetails } from '@/data/commonCode'
import BaseModal from '@/components/ui/BaseModal.vue'

const selectedCategory = ref(codeCategoryGroups[0].items[0])
const rows = ref(getCodeDetails(selectedCategory.value))
const showEdit = ref(false)
const editForm = reactive({ code: '', name: '', sort: 1, useYn: 'Y', isNew: false })

watch(selectedCategory, (cat) => {
  rows.value = getCodeDetails(cat)
})

const detailTitle = computed(() => `코드 상세 · ${selectedCategory.value}`)

function selectCategory(cat) {
  selectedCategory.value = cat
}

function openAdd() {
  Object.assign(editForm, {
    code: '',
    name: '',
    sort: rows.value.length + 1,
    useYn: 'Y',
    isNew: true,
  })
  showEdit.value = true
}

function openEdit(row) {
  Object.assign(editForm, { ...row, isNew: false })
  showEdit.value = true
}

function saveEdit() {
  if (!editForm.code.trim() || !editForm.name.trim()) {
    window.alert('코드와 코드명은 필수입니다.')
    return
  }
  const now = new Date().toISOString().slice(0, 19).replace('T', ' ')
  if (editForm.isNew) {
    if (rows.value.some((r) => r.code === editForm.code.trim())) {
      window.alert('이미 존재하는 코드입니다.')
      return
    }
    rows.value.push({
      code: editForm.code.trim(),
      name: editForm.name.trim(),
      sort: Number(editForm.sort) || rows.value.length + 1,
      useYn: editForm.useYn,
      registeredBy: '김현대',
      registeredAt: now,
      updatedBy: '-',
      updatedAt: null,
    })
  } else {
    const target = rows.value.find((r) => r.code === editForm.code)
    if (target) {
      target.name = editForm.name.trim()
      target.sort = Number(editForm.sort) || target.sort
      target.useYn = editForm.useYn
      target.updatedBy = '김현대'
      target.updatedAt = now
    }
  }
  rows.value.sort((a, b) => a.sort - b.sort)
  showEdit.value = false
}

function deleteRow(row) {
  if (!window.confirm(`코드 [${row.code}] ${row.name}을(를) 삭제하시겠습니까?`)) return
  rows.value = rows.value.filter((r) => r.code !== row.code)
}

function saveAll() {
  const empty = rows.value.find((r) => !String(r.code || '').trim() || !String(r.name || '').trim())
  if (empty) {
    window.alert('코드와 코드명이 비어 있는 행이 있습니다.')
    return
  }
  const codes = rows.value.map((r) => r.code)
  if (new Set(codes).size !== codes.length) {
    window.alert('중복된 코드가 있습니다.')
    return
  }
  if (!window.confirm(`[${selectedCategory.value}] ${rows.value.length}건을 저장하시겠습니까?`)) return
  window.alert(`[${selectedCategory.value}] ${rows.value.length}건을 저장했습니다.`)
}
</script>

<template>
  <div class="admin-page">
    <div class="notice">ⓘ {{ commonCodeMeta.hint }}</div>

    <div class="admin-split">
      <aside class="card admin-side">
        <div class="admin-side__head">
          <h3 class="admin-side__title">코드 분류</h3>
        </div>
        <div v-for="grp in codeCategoryGroups" :key="grp.group" class="admin-side__group">
          <div class="admin-side__group-lab">{{ grp.group }}</div>
          <button
            v-for="cat in grp.items"
            :key="cat"
            type="button"
            class="admin-side__item admin-side__item--sub"
            :class="{ 'is-on': selectedCategory === cat }"
            @click="selectCategory(cat)"
          >
            {{ cat }}
          </button>
        </div>
      </aside>

      <div class="admin-main">
        <div class="toolbar">
          <span class="toolbar__count">{{ detailTitle }}</span>
          <div class="toolbar__actions">
            <button type="button" class="btn btn--ghost btn--sm" @click="openAdd">＋ 추가</button>
            <button type="button" class="btn btn--primary btn--sm" @click="saveAll">저장</button>
          </div>
        </div>

        <div class="listcard">
          <div class="listcard__scroll">
            <table class="data-table">
              <thead>
                <tr>
                  <th>코드</th>
                  <th>코드명</th>
                  <th>정렬순서</th>
                  <th>사용여부</th>
                  <th>등록자</th>
                  <th>등록일시</th>
                  <th>수정자</th>
                  <th>수정일시</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="row in rows" :key="row.code">
                  <td><span class="tbl__name">{{ row.code }}</span></td>
                  <td>{{ row.name }}</td>
                  <td>{{ row.sort }}</td>
                  <td>
                    <span class="badge" :class="row.useYn === 'Y' ? 'badge--ok' : 'badge--muted'">
                      {{ row.useYn === 'Y' ? '사용' : '미사용' }}
                    </span>
                  </td>
                  <td>{{ row.registeredBy }}</td>
                  <td class="tbl__muted">{{ row.registeredAt }}</td>
                  <td>
                    <span :class="{ 'tbl__muted': row.updatedBy === '-' }">{{ row.updatedBy }}</span>
                  </td>
                  <td class="tbl__muted">{{ row.updatedAt || '-' }}</td>
                  <td>
                    <button type="button" class="link-btn" @click="openEdit(row)">수정</button>
                    <button type="button" class="link-btn link-btn--danger" @click="deleteRow(row)">삭제</button>
                  </td>
                </tr>
                <tr v-if="!rows.length">
                  <td colspan="9" class="empty">등록된 코드가 없습니다.</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>

    <BaseModal
      :visible="showEdit"
      :title="editForm.isNew ? '코드 추가' : '코드 수정'"
      @close="showEdit = false"
    >
      <div class="modal-grid">
        <div class="modal-field">
          <label>코드</label>
          <input
            v-model="editForm.code"
            class="filter__input"
            type="text"
            :disabled="!editForm.isNew"
          />
        </div>
        <div class="modal-field">
          <label>코드명</label>
          <input v-model="editForm.name" class="filter__input" type="text" />
        </div>
        <div class="modal-field">
          <label>정렬순서</label>
          <input v-model.number="editForm.sort" class="filter__input" type="number" min="1" />
        </div>
        <div class="modal-field">
          <label>사용여부</label>
          <select v-model="editForm.useYn" class="filter__select">
            <option value="Y">사용</option>
            <option value="N">미사용</option>
          </select>
        </div>
      </div>
      <template #footer>
        <button type="button" class="btn btn--ghost" @click="showEdit = false">취소</button>
        <button type="button" class="btn btn--primary" @click="saveEdit">저장</button>
      </template>
    </BaseModal>
  </div>
</template>

<style scoped>
.admin-side__group {
  margin-bottom: 8px;
}

.admin-side__group-lab {
  padding: 8px 14px 4px;
  font-size: 11px;
  font-weight: 700;
  color: var(--lnb-muted);
}

.admin-side__item--sub {
  padding-left: 26px;
}
</style>
