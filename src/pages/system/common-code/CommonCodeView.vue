<script setup>
// PAG-M-SYS-06 공통코드 관리
import { computed, reactive, ref, watch } from 'vue'
import { commonCodeMeta, codeCategoryGroups, getCodeDetails } from '@/entities/code-admin/commonCode'
import BaseModal from '@/shared/ui/BaseModal.vue'

const selectedCategory = ref(codeCategoryGroups[0].items[0])
const rows = ref(getCodeDetails(selectedCategory.value).map(normalizeRow))
const showEdit = ref(false)
const editForm = reactive({
  code: '',
  name: '',
  sortOrder: 1,
  isActive: true,
  isNew: false,
})

function normalizeRow(row) {
  return {
    id: row.code,
    code: row.code,
    name: row.name,
    sortOrder: row.sort ?? row.sortOrder ?? 1,
    active: row.useYn !== 'N',
    createdByName: row.registeredBy ?? '김현대',
    createdAt: row.registeredAt ?? null,
    updatedByName: row.updatedBy ?? '-',
    updatedAt: row.updatedAt ?? null,
  }
}

watch(selectedCategory, (cat) => {
  rows.value = getCodeDetails(cat).map(normalizeRow)
})

const categorizedGroups = computed(() =>
  codeCategoryGroups.map((bucket) => ({
    category: bucket.group,
    groups: bucket.items.map((item) => ({ groupCode: item, label: item, codes: item === selectedCategory.value ? rows.value : [] })),
  })),
)

const selectedGroup = computed(() => ({
  groupCode: selectedCategory.value,
  label: selectedCategory.value,
  codes: rows.value,
}))

function selectGroup(groupCode) {
  selectedCategory.value = groupCode
}

function openCreate() {
  Object.assign(editForm, {
    code: '',
    name: '',
    sortOrder: rows.value.length + 1,
    isActive: true,
    isNew: true,
  })
  showEdit.value = true
}

function openEdit(item) {
  Object.assign(editForm, {
    code: item.code,
    name: item.name,
    sortOrder: item.sortOrder,
    isActive: item.active,
    isNew: false,
  })
  showEdit.value = true
}

function closeEdit() {
  showEdit.value = false
}

function save() {
  if (!editForm.code.trim() || !editForm.name.trim()) {
    window.alert('코드와 값을 입력하세요.')
    return
  }
  const now = new Date().toISOString().slice(0, 19).replace('T', ' ')
  if (editForm.isNew) {
    if (rows.value.some((r) => r.code === editForm.code.trim())) {
      window.alert('이미 존재하는 코드입니다.')
      return
    }
    rows.value.push({
      id: editForm.code.trim(),
      code: editForm.code.trim(),
      name: editForm.name.trim(),
      sortOrder: Number(editForm.sortOrder) || rows.value.length + 1,
      active: editForm.isActive,
      createdByName: '김현대',
      createdAt: now,
      updatedByName: '-',
      updatedAt: null,
    })
  } else {
    const target = rows.value.find((r) => r.code === editForm.code)
    if (target) {
      target.name = editForm.name.trim()
      target.sortOrder = Number(editForm.sortOrder) || target.sortOrder
      target.active = editForm.isActive
      target.updatedByName = '김현대'
      target.updatedAt = now
    }
  }
  rows.value.sort((a, b) => a.sortOrder - b.sortOrder)
  closeEdit()
  window.alert('저장했습니다.')
}
</script>

<template>
  <main class="common-code-page admin-page hp-anim-enter">
    <div class="notice">
      ⓘ {{ commonCodeMeta.hint }}
      다른 사용자가 변경한 공통코드는 브라우저를 새로고침해야 목록에 반영됩니다.
    </div>

    <div class="admin-split">
      <aside class="card card--panel admin-side">
        <div class="admin-side__head">
          <h3 class="admin-side__title">코드 분류</h3>
        </div>
        <div class="admin-side__scroll">
          <div v-for="bucket in categorizedGroups" :key="bucket.category" class="admin-side__group">
            <div class="admin-side__group-lab">{{ bucket.category }}</div>
            <button
              v-for="group in bucket.groups"
              :key="group.groupCode"
              type="button"
              class="admin-side__item admin-side__item--sub"
              :class="{ 'is-on': group.groupCode === selectedCategory }"
              @click="selectGroup(group.groupCode)"
            >
              {{ group.label }}
            </button>
          </div>
        </div>
      </aside>

      <div class="admin-main">
        <div class="toolbar">
          <span class="toolbar__count">
            코드 상세 · <b>{{ selectedGroup.label }}</b> · 총 <b>{{ selectedGroup.codes.length }}</b>개
          </span>
          <div class="toolbar__actions">
            <button type="button" class="btn btn--primary btn--sm" @click="openCreate">추가</button>
          </div>
        </div>

        <div class="listcard card--panel">
          <div class="listcard__scroll">
            <table class="data-table">
              <colgroup>
                <col style="width: 120px" />
                <col style="width: 160px" />
                <col style="width: 80px" />
                <col style="width: 80px" />
                <col style="width: 90px" />
                <col style="width: 140px" />
                <col style="width: 90px" />
                <col style="width: 140px" />
                <col style="width: 70px" />
              </colgroup>
              <thead>
                <tr>
                  <th>코드</th>
                  <th>값</th>
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
                <tr v-for="item in selectedGroup.codes" :key="item.id" @click="openEdit(item)">
                  <td class="cell--center">{{ item.code }}</td>
                  <td>{{ item.name }}</td>
                  <td class="cell--center">{{ item.sortOrder }}</td>
                  <td class="cell--center">
                    <span class="badge" :class="item.active ? 'badge--ok' : 'badge--muted'">
                      {{ item.active ? 'Y' : 'N' }}
                    </span>
                  </td>
                  <td class="cell--center">{{ item.createdByName ?? '-' }}</td>
                  <td class="tbl__muted cell--center">{{ item.createdAt ?? '-' }}</td>
                  <td class="cell--center">{{ item.updatedByName ?? '-' }}</td>
                  <td class="tbl__muted cell--center">{{ item.updatedAt ?? '-' }}</td>
                  <td class="cell--center">
                    <button type="button" class="btn btn--ghost btn--sm" @click.stop="openEdit(item)">수정</button>
                  </td>
                </tr>
                <tr v-if="!selectedGroup.codes.length">
                  <td colspan="9" class="empty">등록된 코드가 없습니다.</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>

    <BaseModal :visible="showEdit" :title="editForm.isNew ? '코드 등록' : '코드 수정'" @close="closeEdit">
      <div class="modal-grid">
        <div class="modal-field">
          <label>코드</label>
          <input v-model="editForm.code" class="filter__input" type="text" :disabled="!editForm.isNew" />
        </div>
        <div class="modal-field">
          <label>값</label>
          <input v-model="editForm.name" class="filter__input" type="text" />
        </div>
        <div class="modal-field">
          <label>정렬순서</label>
          <input v-model.number="editForm.sortOrder" class="filter__input" type="number" />
        </div>
        <div v-if="!editForm.isNew" class="modal-field">
          <label>사용여부</label>
          <select v-model="editForm.isActive" class="filter__select">
            <option :value="true">Y</option>
            <option :value="false">N</option>
          </select>
        </div>
      </div>
      <template #footer>
        <button type="button" class="btn btn--ghost" @click="closeEdit">취소</button>
        <button type="button" class="btn btn--primary" @click="save">저장</button>
      </template>
    </BaseModal>
  </main>
</template>

<style scoped>
.admin-side {
  overflow: hidden;
  display: flex;
  flex-direction: column;
}
.admin-side__scroll {
  max-height: calc(100vh - 260px);
  overflow-y: auto;
  padding: 4px 4px 8px;
}
.admin-side__group { margin-bottom: 8px; }
.admin-side__group-lab {
  padding: 8px 14px 4px;
  font-size: calc(11px + var(--font-size-offset, 0px));
  font-weight: 700;
  color: var(--lnb-muted);
}
.admin-side__item--sub { padding-left: 26px; }
.admin-side__item:focus-visible {
  outline: none;
  box-shadow: inset 0 0 0 2px var(--teal);
  border-radius: var(--radius-sm, 4px);
}
.cell--center { text-align: center; }
.tbl__muted { color: var(--lnb-muted); }
.empty { text-align: center !important; color: var(--lnb-muted); padding: 24px !important; }
.modal-grid { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 12px; }
.modal-field { display: flex; flex-direction: column; gap: 4px; }
.modal-field label { font-size: 0.78rem; color: var(--lnb-muted); }

@media (max-width: 1100px) {
  .admin-side__scroll { max-height: 280px; }
}
</style>
