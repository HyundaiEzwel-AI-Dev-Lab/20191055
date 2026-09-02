<script setup>
// 요구사항 등록 · 화면(메뉴) 검색
import { ref, watch } from 'vue'
import BaseModal from '@/shared/ui/BaseModal.vue'
import FilterSelectPill from '@/shared/ui/FilterSelectPill.vue'
import {
  resolveScreenSearchSystem,
  screenSearchSystems,
  searchScreenMenus,
} from '@/shared/lib/screenMenuSearch'

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
    selectedId.value = ''
    search()
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
    screenCode: row.screenCode || '',
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
      <!-- 2026-09-02 h-pms 이식 — 모달 안 시스템 셀렉트도 화면 검색영역과 같은 라벨|값 결합
           알약(FilterSelectPill)으로 통일한다. -->
      <FilterSelectPill v-model="filters.system" label="시스템" :options="screenSearchSystems" />
      <div class="sfb__search filter__search">
        <svg class="sfb__search-icon" viewBox="0 0 24 24" fill="none" aria-hidden="true">
          <circle cx="11" cy="11" r="7" stroke="currentColor" stroke-width="1.8" />
          <path d="M16.5 16.5L21 21" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" />
        </svg>
        <input
          v-model="filters.keyword"
          class="sfb__search-input"
          type="text"
          placeholder="화면명·화면경로·화면코드 검색"
          @keyup.enter="search"
        />
      </div>
      <button type="button" class="btn btn--primary btn--sm filter__btn" @click="search">
        조회
      </button>
    </div>

    <div class="result">
      <div v-if="!searched" class="empty">화면 목록을 불러오는 중입니다.</div>
      <div v-else-if="!rows.length" class="empty">검색 결과가 없습니다.</div>
      <div v-else class="table-wrap">
        <table class="tbl">
          <thead>
            <tr>
              <th class="col-radio">선택</th>
              <th>시스템</th>
              <th>화면경로</th>
              <th>화면명</th>
              <th>화면코드</th>
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
              <td>{{ row.path }}</td>
              <td class="name">{{ row.name }}</td>
              <td>{{ row.screenCode || '-' }}</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <template #footer>
      <button type="button" class="btn btn--ghost" @click="close">취소</button>
      <button type="button" class="btn btn--primary" @click="confirm">선택</button>
    </template>
  </BaseModal>
</template>

<style scoped>
.filter {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 14px;
  flex-wrap: wrap;
}

.filter__search {
  flex: 1;
  max-width: none;
  min-width: 200px;
}

.filter__btn {
  flex-shrink: 0;
}

.result {
  border: 1px solid var(--lnb-line);
  border-radius: 10px;
  overflow: hidden;
}

.empty {
  padding: 34px 12px;
  text-align: center;
  font-size: calc(12px + var(--font-size-offset, 0px));
  color: var(--lnb-muted);
}

.table-wrap {
  max-height: 420px;
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
  color: var(--lnb-txt);
  font-weight: 600;
  position: sticky;
  top: 0;
  white-space: nowrap;
  text-align: center;
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
