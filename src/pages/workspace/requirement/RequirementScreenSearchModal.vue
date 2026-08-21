<script setup>
// 요구사항 등록 · 화면(메뉴) 검색
import { computed, ref, watch } from 'vue'
import BaseModal from '@/shared/ui/BaseModal.vue'
import {
  resolveScreenSearchSystem,
  screenSearchSystems,
  searchScreenMenus,
} from '@/shared/lib/screenMenuSearch'
import { pageSizeOptions } from '@/shared/lib/commonOptions'

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
const currentPage = ref(1)
const pageSize = ref(20)

const totalPages = computed(() => Math.max(1, Math.ceil(rows.value.length / pageSize.value)))
const pagedRows = computed(() => {
  const start = (currentPage.value - 1) * pageSize.value
  return rows.value.slice(start, start + pageSize.value)
})

function onPageSizeChange() {
  currentPage.value = 1
}

watch(
  () => props.modelValue,
  (open) => {
    if (!open) return
    filters.value = {
      system: resolveScreenSearchSystem(props.system),
      keyword: '',
    }
    selectedId.value = ''
    currentPage.value = 1
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
      <template v-else>
        <div class="result__count">총 <b>{{ rows.length }}</b>건</div>
        <div class="table-wrap">
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
                v-for="row in pagedRows"
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
        <div class="pager">
          <select v-model="pageSize" class="pager__size" @change="onPageSizeChange">
            <option v-for="n in pageSizeOptions" :key="n" :value="n">{{ n }}건씩 보기</option>
          </select>
          <div class="pager__nums">
            <button type="button" class="pager__btn" :disabled="currentPage <= 1" @click="currentPage -= 1">‹</button>
            <button
              v-for="p in totalPages"
              :key="p"
              type="button"
              class="pager__btn"
              :class="{ 'pager__btn--on': p === currentPage }"
              @click="currentPage = p"
            >
              {{ p }}
            </button>
            <button type="button" class="pager__btn" :disabled="currentPage >= totalPages" @click="currentPage += 1">›</button>
          </div>
        </div>
      </template>
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
}

.filter__btn {
  height: 32px;
  flex-shrink: 0;
}

.result {
  height: 420px;
  display: flex;
  flex-direction: column;
  border: 1px solid var(--lnb-line);
  border-radius: 10px;
  overflow: hidden;
}

.empty {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  text-align: center;
  font-size: calc(12px + var(--font-size-offset, 0px));
  color: var(--lnb-muted);
}

.result__count {
  flex-shrink: 0;
  padding: 8px 10px;
  font-size: calc(12px + var(--font-size-offset, 0px));
  color: var(--lnb-txt);
  border-bottom: 1px solid var(--lnb-line);
  background: var(--lnb-side);
}

.table-wrap {
  flex: 1;
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

.pager {
  flex-shrink: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 12px;
  padding: 10px;
  border-top: 1px solid var(--lnb-line);
}

.pager__size {
  height: 28px;
  border: 1px solid var(--lnb-line);
  border-radius: 6px;
  padding: 0 8px;
  font-size: calc(11.5px + var(--font-size-offset, 0px));
  font-family: inherit;
  background: var(--lnb-side);
  color: var(--lnb-txt);
}

.pager__nums {
  display: flex;
  align-items: center;
  gap: 4px;
}

.pager__btn {
  min-width: 28px;
  height: 28px;
  padding: 0 6px;
  border-radius: 6px;
  border: 1px solid var(--lnb-line);
  background: var(--lnb-side);
  color: var(--lnb-txt);
  font-size: calc(12px + var(--font-size-offset, 0px));
  cursor: pointer;
  font-family: inherit;
}

.pager__btn--on {
  background: var(--teal);
  border-color: var(--teal);
  color: var(--color-text-inverse);
  font-weight: 700;
}

.pager__btn:disabled {
  opacity: 0.4;
  cursor: not-allowed;
}
</style>
