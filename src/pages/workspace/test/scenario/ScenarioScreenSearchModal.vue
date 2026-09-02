<script setup>
// POP-S-UAT-06 화면(메뉴) 검색 — 시나리오 테스트대상 신규등록/화면 지정용
// 2026-09-02 h-pms 이식 — 검색 필드를 FilterSelectPill + 돋보기 검색창으로 통일하고,
// 열릴 때마다 이전 검색 상태를 리셋한다(h-pms 원본 동작). 페이지 크기 선택은 없애고
// h-pms처럼 페이지당 10건 고정 번호형 페이지네이션만 남긴다.
import { computed, ref, watch } from 'vue'
import BaseModal from '@/shared/ui/BaseModal.vue'
import FilterSelectPill from '@/shared/ui/FilterSelectPill.vue'
import { screenSearchSystems as baseSystems, searchScreenMenus } from '@/shared/lib/screenMenuSearch'

const props = defineProps({
  modelValue: { type: Boolean, default: false },
})

const emit = defineEmits(['update:modelValue', 'select'])

// h-pms 원본 시스템 옵션엔 '전체'가 포함된다 — 로컬 mock(screenMenuSearch.js)엔 없어 화면에서만 앞에 붙인다.
const ALL_SYSTEMS = '전체'
const screenSearchSystems = [ALL_SYSTEMS, ...baseSystems]
const PAGE_SIZE = 10

const filters = ref({ system: ALL_SYSTEMS, keyword: '' })
const searched = ref(false)
const rows = ref([])
const selectedId = ref('')
const currentPage = ref(1)

const totalPages = computed(() => Math.max(1, Math.ceil(rows.value.length / PAGE_SIZE)))
const pagedRows = computed(() => {
  const start = (currentPage.value - 1) * PAGE_SIZE
  return rows.value.slice(start, start + PAGE_SIZE)
})

watch(
  () => props.modelValue,
  (open) => {
    if (!open) return
    filters.value = { system: ALL_SYSTEMS, keyword: '' }
    searched.value = false
    rows.value = []
    selectedId.value = ''
    currentPage.value = 1
  },
)

function close() {
  emit('update:modelValue', false)
}

function search() {
  const system = filters.value.system === ALL_SYSTEMS ? '' : filters.value.system
  rows.value = searchScreenMenus({ system, keyword: filters.value.keyword })
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
      <!-- 2026-09-02 h-pms 이식 — 모달 안 시스템 셀렉트도 화면 검색영역과 같은 라벨|값 결합
           알약(FilterSelectPill)으로 통일한다. -->
      <FilterSelectPill v-model="filters.system" label="시스템구분" :options="screenSearchSystems" />
      <div class="sfb__search filter__search">
        <svg class="sfb__search-icon" viewBox="0 0 24 24" fill="none" aria-hidden="true">
          <circle cx="11" cy="11" r="7" stroke="currentColor" stroke-width="1.8" />
          <path d="M16.5 16.5L21 21" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" />
        </svg>
        <input
          v-model="filters.keyword"
          class="sfb__search-input"
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
      <template v-else>
        <div class="table-wrap">
          <table class="tbl">
            <thead>
              <tr>
                <th class="col-radio" />
                <th>관리번호</th>
                <th>시스템</th>
                <th>업무구분</th>
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
        <div class="pager">
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
      </template>
    </div>

    <template #footer>
      <button type="button" class="btn btn--primary" @click="confirm">확인</button>
    </template>
  </BaseModal>
</template>

<style scoped>
.filter {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 14px;
  flex-wrap: wrap;
}

.filter__search {
  flex: 1;
  max-width: none;
  min-width: 200px;
}

.filter__btn {
  height: 32px;
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

.pager {
  flex-shrink: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 4px;
  padding: 10px;
  border-top: 1px solid var(--lnb-line);
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
