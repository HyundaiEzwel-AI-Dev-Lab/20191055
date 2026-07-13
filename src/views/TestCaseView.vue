<script setup>
// PAG-M-TLB-01 테스트 라이브러리
import { computed, ref } from 'vue'
import {
  testLibraryMeta,
  systemOptions,
  typeOptions,
  pageSizeOptions,
  libraryList,
  matchLibraryFilters,
} from '@/data/testLibrary'
import ExcelDownloadButton from '@/components/ui/ExcelDownloadButton.vue'
import { mockExcelDownload } from '@/utils/excelDownload'

const filters = ref({ keyword: '', system: '전체', type: '전체' })
const applied = ref({ ...filters.value })
const pageSize = ref(20)
const currentPage = ref(1)
const expandedIds = ref([])
const allOpen = ref(false)

const filtered = computed(() => libraryList.filter((r) => matchLibraryFilters(r, applied.value)))
const paged = computed(() => {
  const start = (currentPage.value - 1) * pageSize.value
  return filtered.value.slice(start, start + pageSize.value)
})
const totalPages = computed(() => Math.max(1, Math.ceil(filtered.value.length / pageSize.value)))

function search() {
  applied.value = { ...filters.value }
  currentPage.value = 1
}

function resetFilters() {
  filters.value = { keyword: '', system: '전체', type: '전체' }
  search()
}

function toggleExpand(id) {
  const idx = expandedIds.value.indexOf(id)
  if (idx >= 0) expandedIds.value.splice(idx, 1)
  else expandedIds.value.push(id)
}

function toggleAll() {
  allOpen.value = !allOpen.value
  expandedIds.value = allOpen.value ? paged.value.map((r) => r.id) : []
}

function onExcelDownload() {
  mockExcelDownload('테스트 라이브러리', filtered.value, [
    { key: 'id', label: '라이브러리ID' },
    { key: 'type', label: '유형' },
    { key: 'round', label: '차수' },
    { key: 'title', label: '시나리오명' },
    { key: 'systemPath', label: '시스템경로' },
    { key: 'screenName', label: '화면명' },
    { key: 'sourceProject', label: '출처프로젝트' },
    { key: 'caseCount', label: '케이스수' },
    { key: 'stepCount', label: '절차수' },
    { key: 'registeredAt', label: '등록일' },
    { key: 'registeredBy', label: '등록자' },
  ])
}
</script>

<template>
  <div class="admin-page">
    <h1 class="admin-page__title">
      테스트 라이브러리
      <span class="admin-page__hint">{{ testLibraryMeta.hint }}</span>
    </h1>

    <div class="notice notice--warn">⚠ {{ testLibraryMeta.notice }}</div>

    <section class="filter card">
      <div class="filter__row filter__row--3">
        <div class="filter__field">
          <label>통합검색</label>
          <input
            v-model="filters.keyword"
            class="filter__input"
            type="text"
            placeholder="시나리오명, 화면, 프로젝트"
            @keyup.enter="search"
          />
        </div>
        <div class="filter__field">
          <label>시스템</label>
          <select v-model="filters.system" class="filter__select">
            <option v-for="o in systemOptions" :key="o" :value="o">{{ o }}</option>
          </select>
        </div>
        <div class="filter__field">
          <label>유형</label>
          <select v-model="filters.type" class="filter__select">
            <option v-for="o in typeOptions" :key="o" :value="o">{{ o }}</option>
          </select>
        </div>
      </div>
      <div class="filter__actions">
        <button type="button" class="btn btn--ghost" @click="resetFilters">초기화</button>
        <button type="button" class="btn btn--primary" @click="search">조회</button>
      </div>
    </section>

    <div class="toolbar">
      <span class="toolbar__count">라이브러리 · 총 <b>{{ filtered.length }}</b>건</span>
      <select v-model="pageSize" class="toolbar__mini" @change="currentPage = 1">
        <option v-for="n in pageSizeOptions" :key="n" :value="n">{{ n }}건씩 보기</option>
      </select>
      <div class="toolbar__actions">
        <button type="button" class="btn btn--ghost btn--sm" @click="toggleAll">
          {{ allOpen ? '전체닫기' : '전체열기' }}
        </button>
        <ExcelDownloadButton @click="onExcelDownload" />
      </div>
    </div>

    <div class="listcard">
      <article v-for="row in paged" :key="row.id" class="lib-item">
        <button type="button" class="lib-item__head" @click="toggleExpand(row.id)">
          <span class="lib-item__toggle">{{ expandedIds.includes(row.id) ? '▾' : '▸' }}</span>
          <span class="badge" :class="row.type === '운영' ? 'badge--ok' : 'badge--prog'">{{ row.type }}</span>
          <span class="lib-item__id">{{ row.id }}</span>
          <span class="lib-item__title">{{ row.title }}</span>
          <span class="lib-item__meta">{{ row.caseCount }}케이스 · {{ row.stepCount }}절차</span>
        </button>

        <div class="lib-item__summary">
          <span>{{ row.systemPath }} › {{ row.screenName }}</span>
          <span>출처: {{ row.sourceProject }}</span>
          <span>{{ row.registeredAt }} · {{ row.registeredBy }}</span>
        </div>

        <div v-if="expandedIds.includes(row.id)" class="lib-item__body">
          <div v-for="c in row.cases" :key="c.id" class="case-block">
            <div class="case-block__head">
              <b>{{ c.id }}</b>
              <span>{{ c.title }}</span>
            </div>
            <div class="listcard__scroll">
              <table class="data-table">
                <thead>
                  <tr>
                    <th style="width: 48px">NO</th>
                    <th>테스트 절차</th>
                    <th>예상결과</th>
                  </tr>
                </thead>
                <tbody>
                  <tr v-for="step in c.steps" :key="step.no">
                    <td>{{ step.no }}</td>
                    <td>{{ step.procedure }}</td>
                    <td>{{ step.expected }}</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </article>

      <div v-if="!paged.length" class="lib-empty">조회 결과가 없습니다.</div>
    </div>

    <div v-if="totalPages > 1" class="pager">
      <button type="button" class="pager__btn" :disabled="currentPage <= 1" @click="currentPage -= 1">이전</button>
      <span class="pager__info">{{ currentPage }} / {{ totalPages }}</span>
      <button type="button" class="pager__btn" :disabled="currentPage >= totalPages" @click="currentPage += 1">다음</button>
    </div>
  </div>
</template>

<style scoped>
.lib-item {
  padding: 12px 14px;
  border-bottom: 1px solid var(--lnb-line);
}

.lib-item:last-child {
  border-bottom: none;
}

.lib-item__head {
  width: 100%;
  display: flex;
  align-items: center;
  gap: 8px;
  border: none;
  background: none;
  padding: 0;
  cursor: pointer;
  text-align: left;
  font-family: inherit;
}

.lib-item__toggle {
  width: 16px;
  color: var(--lnb-muted);
  font-size: 12px;
  flex-shrink: 0;
}

.lib-item__id {
  font-size: 12px;
  font-weight: 700;
  color: var(--lnb-logo);
  flex-shrink: 0;
}

.lib-item__title {
  flex: 1;
  min-width: 0;
  font-size: 13px;
  font-weight: 600;
  color: var(--lnb-txt);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.lib-item__meta {
  font-size: 11px;
  color: var(--lnb-muted);
  flex-shrink: 0;
}

.lib-item__summary {
  margin-top: 6px;
  margin-left: 24px;
  display: flex;
  flex-wrap: wrap;
  gap: 14px;
  font-size: 12px;
  color: var(--lnb-muted);
}

.lib-item__body {
  margin-top: 10px;
  margin-left: 24px;
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.case-block {
  border: 1px solid var(--lnb-line);
  border-radius: 8px;
  overflow: hidden;
}

.case-block__head {
  display: flex;
  gap: 8px;
  align-items: center;
  padding: 8px 12px;
  background: var(--lnb-bg);
  font-size: 12.5px;
}

.lib-empty {
  text-align: center;
  color: var(--lnb-muted);
  padding: 40px 12px;
}
</style>
