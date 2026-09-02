<script setup>
// POP-S-UAT-08 요구사항 검색 — 시나리오 케이스에 연결할 요구사항 조회
// 2026-09-02 h-pms 이식 — 검색 필드를 FilterSelectPill + 돋보기 검색창으로 통일하고,
// 시스템 필터는 h-pms처럼 재조회 없이 즉시 반영되게 한다(조회는 키워드만 다시 불러온다).
import { computed, ref, watch } from 'vue'
import BaseModal from '@/shared/ui/BaseModal.vue'
import FilterSelectPill from '@/shared/ui/FilterSelectPill.vue'
import { systemOptions, getRequirementList } from '@/entities/requirement/mock/requirement'

const props = defineProps({
  modelValue: { type: Boolean, default: false },
})

const emit = defineEmits(['update:modelValue', 'select'])

const filters = ref({ system: '', keyword: '' })
const searched = ref(false)
const rows = ref([])
const selectedId = ref('')

// h-pms는 키워드만 서버에 보내고, 시스템은 이미 받아온 목록을 즉시 client-side로 거른다.
const displayRows = computed(() => {
  if (!filters.value.system) return rows.value
  return rows.value.filter((r) => (r.scopes || []).some((scope) => scope.system === filters.value.system))
})

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

function systemBizOf(row) {
  const scopes = row.scopes || []
  if (scopes.length) {
    return (
      scopes
        .map((scope) => [scope.system, scope.bizCategory].filter(Boolean).join('>'))
        .filter(Boolean)
        .join(', ') || '-'
    )
  }
  return row.systemPath || '-'
}

function search() {
  const q = filters.value.keyword.trim().toLowerCase()
  rows.value = getRequirementList().filter((r) => {
    if (!q) return true
    const scopes = r.scopes || []
    const hay = [
      r.reqId,
      r.name,
      ...scopes.map((scope) => `${scope.system} ${scope.screenName} ${scope.screenPath}`),
    ]
      .join(' ')
      .toLowerCase()
    return hay.includes(q)
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
      <!-- 2026-09-02 h-pms 이식 — 모달 안 검색 셀렉트도 화면 검색영역과 같은 라벨|값 결합
           알약(FilterSelectPill)으로 통일한다. -->
      <FilterSelectPill v-model="filters.system" label="시스템" :options="systemOptions" />
      <div class="sfb__search filter__search">
        <svg class="sfb__search-icon" viewBox="0 0 24 24" fill="none" aria-hidden="true">
          <circle cx="11" cy="11" r="7" stroke="currentColor" stroke-width="1.8" />
          <path d="M16.5 16.5L21 21" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" />
        </svg>
        <input
          v-model="filters.keyword"
          class="sfb__search-input"
          type="text"
          placeholder="요구사항 ID 또는 명 검색"
          @keyup.enter="search"
        />
      </div>
      <button type="button" class="btn btn--primary btn--sm filter__btn" @click="search">조회</button>
    </div>

    <div class="result">
      <div v-if="!searched" class="empty">조회 버튼을 눌러 요구사항을 검색하세요.</div>
      <div v-else-if="!displayRows.length" class="empty">검색 결과가 없습니다.</div>
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
              v-for="row in displayRows"
              :key="row.id"
              :class="{ 'is-on': selectedId === row.id }"
              @click="selectRow(row)"
            >
              <td class="col-radio">
                <input type="radio" name="scenario-req-pick" :checked="selectedId === row.id" @change="selectRow(row)" />
              </td>
              <td>{{ row.reqId }}</td>
              <td>{{ systemBizOf(row) }}</td>
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
</style>
