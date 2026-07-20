<script setup>
// 요구사항 등록 · 화면(메뉴) 검색
import { ref, watch } from 'vue'
import BaseModal from '@/components/ui/BaseModal.vue'
import {
  resolveScreenSearchSystem,
  screenSearchSystems,
  searchScreenMenus,
} from '@/data/screenMenuSearch'

const props = defineProps({
  modelValue: { type: Boolean, default: false },
  /** 요구사항에서 선택된 시스템 */
  system: { type: String, default: '' },
})

const emit = defineEmits(['update:modelValue', 'select'])

const filters = ref({
  system: 'HIMS',
  keyword: '',
})
const searched = ref(false)
const rows = ref([])
const selectedId = ref('')

watch(
  () => props.modelValue,
  (open) => {
    if (!open) return
    filters.value = {
      system: resolveScreenSearchSystem(props.system),
      keyword: '',
    }
    searched.value = false
    rows.value = []
    selectedId.value = ''
  },
)

function close() {
  emit('update:modelValue', false)
}

function search() {
  rows.value = searchScreenMenus(filters.value)
  searched.value = true
  selectedId.value = ''
}

function selectRow(row) {
  selectedId.value = row.id
}

function confirm() {
  const row = rows.value.find((r) => r.id === selectedId.value)
  if (!row) {
    window.alert('화면을 선택해 주세요.')
    return
  }
  emit('select', {
    system: row.system,
    category: row.category,
    path: row.path,
    name: row.name,
    id: row.id,
  })
  close()
}
</script>

<template>
  <BaseModal
    title="화면(메뉴) 검색"
    :visible="modelValue"
    wide
    @close="close"
  >
    <div class="filter">
      <div class="fld">
        <label>시스템구분</label>
        <select v-model="filters.system" class="inp">
          <option v-for="s in screenSearchSystems" :key="s" :value="s">{{ s }}</option>
        </select>
      </div>
      <div class="fld fld--grow">
        <label>화면명</label>
        <input
          v-model="filters.keyword"
          class="inp"
          type="text"
          placeholder="화면명 검색"
          @keyup.enter="search"
        />
      </div>
      <button type="button" class="btn btn--primary btn--sm filter__btn" @click="search">
        조회
      </button>
    </div>

    <div class="result">
      <div v-if="!searched" class="empty">조회 버튼을 눌러 화면을 검색하세요.</div>
      <div v-else-if="!rows.length" class="empty">검색 결과가 없습니다.</div>
      <div v-else class="table-wrap">
        <table class="tbl">
          <thead>
            <tr>
              <th class="col-radio" />
              <th>시스템</th>
              <th>관리구분</th>
              <th>화면경로</th>
              <th>화면명</th>
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
                <input
                  type="radio"
                  name="screen-pick"
                  :checked="selectedId === row.id"
                  @change="selectRow(row)"
                />
              </td>
              <td>{{ row.system }}</td>
              <td>{{ row.category }}</td>
              <td>{{ row.path }}</td>
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
  font-size: 11px;
  font-weight: 600;
  color: var(--lnb-muted);
}

.inp {
  height: 32px;
  padding: 0 10px;
  border: 1px solid var(--lnb-line);
  border-radius: 7px;
  font-size: 12px;
  font-family: inherit;
  background: var(--lnb-side);
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
  font-size: 12px;
  color: var(--lnb-muted);
}

.table-wrap {
  max-height: 360px;
  overflow: auto;
}

.tbl {
  width: 100%;
  border-collapse: collapse;
  font-size: 12px;
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
