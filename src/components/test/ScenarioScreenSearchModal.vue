<script setup>
// POP-S-UAT-06 화면(메뉴) 검색 — 시나리오 테스트대상 신규등록/화면 지정용
import { computed, ref } from 'vue'
import BaseModal from '@/components/ui/BaseModal.vue'
import { screenSearchSystems, searchScreenMenus } from '@/data/screenMenuSearch'

const props = defineProps({
  modelValue: { type: Boolean, default: false },
})

const emit = defineEmits(['update:modelValue', 'select'])

const filters = ref({ system: screenSearchSystems[0], keyword: '' })
const searched = ref(false)
const rows = ref([])
const selectedId = ref('')
const currentPage = ref(1)
const pageSize = 10

const totalPages = computed(() => Math.max(1, Math.ceil(rows.value.length / pageSize)))
const pagedRows = computed(() => {
  const start = (currentPage.value - 1) * pageSize
  return rows.value.slice(start, start + pageSize)
})

function close() {
  emit('update:modelValue', false)
}

function search() {
  rows.value = searchScreenMenus(filters.value)
  searched.value = true
  selectedId.value = ''
  currentPage.value = 1
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
  emit('select', { system: row.system, category: row.category, path: row.path, name: row.name })
  close()
}
</script>

<template>
  <BaseModal title="화면(메뉴) 검색" :visible="modelValue" wide @close="close">
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
      <button type="button" class="btn btn--primary btn--sm filter__btn" @click="search">조회</button>
    </div>

    <div class="result">
      <div v-if="!searched" class="empty">조회 버튼을 눌러 화면을 검색하세요.</div>
      <div v-else-if="!rows.length" class="empty">검색 결과가 없습니다.</div>
      <div v-else class="table-wrap">
        <table class="tbl">
          <thead>
            <tr>
              <th class="col-radio" />
              <th>관리번호</th>
              <th>시스템</th>
              <th>관리구분</th>
              <th>화면경로</th>
              <th>화면명</th>
            </tr>
          </thead>
          <tbody>
            <tr
              v-for="row in pagedRows"
              :key="row.id"
              :class="{ 'is-on': selectedId === row.id }"
              @click="selectRow(row)"
            >
              <td class="col-radio">
                <input type="radio" name="scenario-screen-pick" :checked="selectedId === row.id" @change="selectRow(row)" />
              </td>
              <td>{{ row.id }}</td>
              <td>{{ row.system }}</td>
              <td>{{ row.category }}</td>
              <td>{{ row.path }}</td>
              <td class="name">{{ row.name }}</td>
            </tr>
          </tbody>
        </table>
      </div>
      <div v-if="rows.length" class="pager">
        <button type="button" class="pager__btn" :disabled="currentPage <= 1" @click="currentPage -= 1">이전</button>
        <span class="pager__info">{{ currentPage }} / {{ totalPages }}</span>
        <button type="button" class="pager__btn" :disabled="currentPage >= totalPages" @click="currentPage += 1">다음</button>
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
