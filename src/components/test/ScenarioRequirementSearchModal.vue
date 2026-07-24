<script setup>
// POP-S-UAT-08 요구사항 검색 — 시나리오 케이스에 연결할 요구사항 조회
import { ref, watch } from 'vue'
import BaseModal from '@/components/ui/BaseModal.vue'
import { systemOptions, getRequirementList } from '@/data/requirement'

const props = defineProps({
  modelValue: { type: Boolean, default: false },
})

const emit = defineEmits(['update:modelValue', 'select'])

const filters = ref({ system: '', keyword: '' })
const searched = ref(false)
const rows = ref([])
const selectedId = ref('')

watch(
  () => props.modelValue,
  (open) => {
    if (!open) return
    filters.value = { system: '', keyword: '' }
    searched.value = false
    rows.value = []
    selectedId.value = ''
  },
)

function close() {
  emit('update:modelValue', false)
}

function search() {
  const q = filters.value.keyword.trim().toLowerCase()
  rows.value = getRequirementList().filter((r) => {
    if (filters.value.system && r.system !== filters.value.system) return false
    if (q && !`${r.reqId}${r.name}`.toLowerCase().includes(q)) return false
    return true
  })
  searched.value = true
  selectedId.value = ''
}

function selectRow(row) {
  selectedId.value = row.id
}

function confirm() {
  const row = rows.value.find((r) => r.id === selectedId.value)
  if (!row) {
    window.alert('요구사항을 선택해 주세요.')
    return
  }
  emit('select', { reqId: row.reqId, name: row.name })
  close()
}
</script>

<template>
  <BaseModal title="요구사항 검색" :visible="modelValue" wide @close="close">
    <div class="filter">
      <div class="fld">
        <label>시스템</label>
        <select v-model="filters.system" class="inp">
          <option value="">전체</option>
          <option v-for="s in systemOptions" :key="s" :value="s">{{ s }}</option>
        </select>
      </div>
      <div class="fld fld--grow">
        <label>요구사항 ID/명</label>
        <input
          v-model="filters.keyword"
          class="inp"
          type="text"
          placeholder="요구사항 ID 또는 명 검색"
          @keyup.enter="search"
        />
      </div>
      <button type="button" class="btn btn--primary btn--sm filter__btn" @click="search">조회</button>
    </div>

    <div class="result">
      <div v-if="!searched" class="empty">조회 버튼을 눌러 요구사항을 검색하세요.</div>
      <div v-else-if="!rows.length" class="empty">검색 결과가 없습니다.</div>
      <div v-else class="table-wrap">
        <table class="tbl">
          <thead>
            <tr>
              <th class="col-radio" />
              <th>요구사항 ID</th>
              <th>시스템/업무</th>
              <th>요구사항명</th>
            </tr>
          </thead>
          <tbody>
            <tr
              v-for="row in rows"
              :key="row.id"
              :class="{ 'is-on': selectedId === row.id }"
              @click="selectRow(row)"
            >
              <td class="col-radio">
                <input type="radio" name="scenario-req-pick" :checked="selectedId === row.id" @change="selectRow(row)" />
              </td>
              <td>{{ row.reqId }}</td>
              <td>{{ row.systemPath }}</td>
              <td class="name">{{ row.name }}</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <template #footer>
      <button type="button" class="btn btn--primary" @click="confirm">확인</button>
    </template>
  </BaseModal>
</template>

<style scoped>
.filter {
  display: flex;
  align-items: flex-end;
  gap: 10px;
  margin-bottom: 14px;
  flex-wrap: wrap;
}

.fld {
  display: flex;
  flex-direction: column;
  gap: 4px;
  min-width: 140px;
}

.fld--grow {
  flex: 1;
  min-width: 180px;
}

.fld label {
  font-size: calc(11px + var(--font-size-offset, 0px));
  font-weight: 600;
  color: var(--lnb-muted);
}

.inp {
  height: 32px;
  padding: 0 10px;
  border: 1px solid var(--lnb-line);
  border-radius: 7px;
  font-size: calc(12px + var(--font-size-offset, 0px));
  font-family: inherit;
  background: var(--lnb-side);
  color: var(--lnb-txt);
}

.filter__btn {
  height: 32px;
  flex-shrink: 0;
}

.result {
  min-height: 200px;
  border: 1px solid var(--lnb-line);
  border-radius: 10px;
  overflow: hidden;
}

.empty {
  padding: 48px 16px;
  text-align: center;
  font-size: calc(12px + var(--font-size-offset, 0px));
  color: var(--lnb-muted);
}

.table-wrap {
  max-height: 360px;
  overflow: auto;
}

.tbl {
  width: 100%;
  border-collapse: collapse;
  font-size: calc(12px + var(--font-size-offset, 0px));
}

.tbl th,
.tbl td {
  padding: 8px 10px;
  border-bottom: 1px solid var(--lnb-line);
  text-align: left;
  vertical-align: top;
}

.tbl th {
  background: var(--lnb-side);
  color: var(--lnb-muted);
  font-weight: 600;
  position: sticky;
  top: 0;
  white-space: nowrap;
}

.tbl tbody tr {
  cursor: pointer;
}

.tbl tbody tr:hover,
.tbl tbody tr.is-on {
  background: var(--teal-50);
}

.col-radio {
  width: 36px;
}

.name {
  font-weight: 600;
}
</style>
