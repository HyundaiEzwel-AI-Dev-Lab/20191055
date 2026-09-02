<script setup>
// PAG-S-UAT-01 시나리오 관리
// h-pms ScenarioPage.vue 정합: 필터는 라이브 반영(별도 "적용" 상태 없이 filters 그대로 필터링에
// 쓴다) — SearchFilterBar의 [조회] 버튼은 페이지/펼침 초기화만 한다.
import { computed, onMounted, reactive, ref, watch } from 'vue'
import { useRouter } from 'vue-router'
import { useTestContext } from '@/app/composables/useTestContext'
import { bizCategoryOptions, pageSizeOptions, systemOptions } from '@/shared/lib/testConfig'
import {
  scenarioMeta,
  getScenarioList,
  matchScenarioFilters,
  addScenarioCases,
} from '@/entities/scenario/mock/scenario'
import ScenarioBulkRegisterModal from '@/pages/workspace/test/scenario/ScenarioBulkRegisterModal.vue'
import TestNoteModal from '@/pages/workspace/test/scenario/TestNoteModal.vue'
import ExcelDownloadButton from '@/shared/ui/ExcelDownloadButton.vue'
import HpDropdownMenu from '@/shared/ui/HpDropdownMenu.vue'
import HpPagination from '@/shared/ui/HpPagination.vue'
import SearchFilterBar from '@/shared/ui/SearchFilterBar.vue'
import FilterSelectPill from '@/shared/ui/FilterSelectPill.vue'
import FilterTextPill from '@/shared/ui/FilterTextPill.vue'
import { mockExcelDownload } from '@/shared/file-excel/excelDownload'
import { useAuthStore } from '@/app/stores/auth'

const router = useRouter()
const authStore = useAuthStore()
const { mode, config, pageTitle } = useTestContext()

const rawRows = ref([])
const filterExpanded = ref(false)
// h-pms 2026-08-27 요청: 계획일(2a) 확장조건은 삭제됐다 — dateFrom/dateTo 없음.
const filters = reactive({
  keyword: '',
  system: '전체',
  bizCategory: '전체',
  round: '전체',
  executionType: '전체',
  screenKeyword: '',
})
const pageSize = ref(20)
const currentPage = ref(1)
const expandedIds = ref(new Set())

const showBulkModal = ref(false)
const showCommonNoteModal = ref(false)
const showEditMenu = ref(false)
/** HpDropdownMenu가 이 버튼 rect를 기준으로 좌표를 잡는다. */
const editMenuAnchor = ref(null)
// SB-PAG-S-UAT-01-B02 2b — 참고사항 등록도 더보기 하위 항목이다. 헤더의 '📝 테스트 참고사항'
// 버튼은 같은 팝업을 여는 지름길로 남겨 둔다.
const EDIT_MENU_ITEMS = [
  { id: 'edit', label: '시나리오 편집' },
  { id: 'note', label: '참고사항 등록' },
]

const roundTabs = computed(() => config.value.roundOptions.filter((r) => r !== '전체'))

/** wbsExcluded인 케이스는 조회 전용이다 — 행을 펼쳐 절차를 보는 건 되지만 편집 진입은 막는다. */
function lockReason(row) {
  if (!row.wbsExcluded) return null
  return { label: '작업제외', message: '이 케이스는 WBS 작업단위가 작업제외되어 조회만 가능합니다.' }
}

const rows = computed(() => rawRows.value.filter((row) => matchScenarioFilters(row, filters, config.value)))

const pagedList = computed(() => {
  const start = (currentPage.value - 1) * pageSize.value
  return rows.value.slice(start, start + pageSize.value)
})

const totalPages = computed(() => Math.max(1, Math.ceil(rows.value.length / pageSize.value)))

const allExpandedOnPage = computed(
  () => pagedList.value.length > 0 && pagedList.value.every((row) => expandedIds.value.has(row.id)),
)

function loadData() {
  rawRows.value = getScenarioList(mode.value, authStore.user?.id)
  filters.round = roundTabs.value[0]
  currentPage.value = 1
  expandedIds.value = new Set()
}

onMounted(loadData)
watch(mode, loadData)

function resetFilters() {
  // 차수는 탭으로 고르는 값이라 초기화 대상이 아니다(h-pms 동일).
  Object.assign(filters, {
    keyword: '',
    system: '전체',
    bizCategory: '전체',
    executionType: '전체',
    screenKeyword: '',
  })
  currentPage.value = 1
}

function search() {
  currentPage.value = 1
  expandedIds.value = new Set()
}

/** 펼침 패널 조건만 태그로 남긴다 — 시스템·업무범주·케이스는 툴바에 그대로 보인다. */
const filterTags = computed(() => {
  const tags = []
  if (filters.executionType !== '전체') {
    tags.push({ key: 'executionType', label: '수행구분', value: filters.executionType })
  }
  if (filters.screenKeyword) {
    tags.push({ key: 'screenKeyword', label: '요구사항/화면명', value: filters.screenKeyword })
  }
  return tags
})

function removeFilterTag(key) {
  if (key === 'screenKeyword') filters.screenKeyword = ''
  else if (key === 'executionType') filters.executionType = '전체'
}

function selectRound(round) {
  filters.round = round
  showEditMenu.value = false
  currentPage.value = 1
  expandedIds.value = new Set()
}

function toggleExpand(id) {
  const next = new Set(expandedIds.value)
  if (next.has(id)) next.delete(id)
  else {
    next.clear()
    next.add(id)
  }
  expandedIds.value = next
}

function toggleExpandAll() {
  if (allExpandedOnPage.value) {
    expandedIds.value = new Set()
  } else {
    expandedIds.value = new Set(pagedList.value.map((r) => r.id))
  }
}

/** 더보기 항목 분기. 항목이 둘 이상이라 id를 봐야 한다. */
function onEditMenuSelect(id) {
  showEditMenu.value = false
  if (id === 'note') showCommonNoteModal.value = true
  else openEdit()
}

function openEdit(row) {
  const lock = row ? lockReason(row) : null
  if (lock) {
    window.alert(lock.message)
    return
  }
  router.push({
    name: 'scenario-edit',
    params: { mode: mode.value },
    query: { round: filters.round, ...(row ? { caseId: row.caseId } : {}) },
  })
}

function goRequirement(reqId) {
  router.push({ path: '/workspace/requirement', query: { reqId } })
}

function onCommonNoteSave(text) {
  scenarioMeta.commonNote[mode.value] = text
}

/** 차수가 확정돼야 올릴 수 있다 — 버튼에서 먼저 확인한다. */
function openBulkUpload() {
  if (filters.round === '전체') {
    window.alert('차수를 먼저 선택하세요.')
    return
  }
  showBulkModal.value = true
}

function onBulkConfirm(items) {
  addScenarioCases(items, mode.value)
  loadData()
}

/**
 * 엑셀 다운로드 대상은 현재 검색조건에 해당하는 전체 결과(rows)다 — 화면의 "총 N건"과
 * 파일 행 수가 항상 같아야 한다. 차수는 표의 열이 아니라 탭(검색조건)이므로 파일명에 담는다.
 */
function onExcelDownload() {
  if (!rows.value.length) {
    window.alert('다운로드할 데이터가 없습니다.')
    return
  }
  const data = rows.value.map((row, idx) => ({ ...row, no: idx + 1 }))
  mockExcelDownload(`시나리오-${config.value.label}-${filters.round}`, data, [
    { key: 'no', label: 'No' },
    { key: 'reqId', label: '요구사항 ID', value: (r) => r.reqId || '-' },
    { key: 'executionType', label: '수행구분' },
    { key: 'systemPath', label: '시스템/업무', value: (r) => r.systemPath || '-' },
    { key: 'screenPath', label: '화면경로', value: (r) => r.screenPath || '-' },
    { key: 'screenName', label: '화면명', value: (r) => r.screenName || '-' },
    { key: 'caseId', label: '케이스 ID', value: (r) => r.caseId || '-' },
    { key: 'caseName', label: '케이스명', value: (r) => r.caseName || '미등록' },
    { key: 'stepCount', label: '절차', value: (r) => String(r.stepCount || 0) },
  ])
}
</script>

<template>
  <div class="scenario">
    <div class="scenario__head">
      <div class="scenario__head-left">
        <h1 class="scenario__title">{{ pageTitle }}</h1>
        <div class="round-tabs">
          <button
            v-for="r in roundTabs"
            :key="r"
            type="button"
            class="round-tab"
            :class="{ 'round-tab--on': filters.round === r }"
            @click="selectRound(r)"
          >
            {{ r }}
          </button>
        </div>
      </div>
      <button type="button" class="memo-btn" title="테스트 참고사항" @click="showCommonNoteModal = true">
        📝 테스트 참고사항
      </button>
    </div>

    <!-- 케이스 검색은 세 번째 칸이라 내장 검색창 대신 TextPill로 둔다(h-pms 동일). -->
    <SearchFilterBar
      v-model:expanded="filterExpanded"
      :show-search="false"
      :applied-tags="filterTags"
      @reset="resetFilters"
      @search="search"
      @remove-tag="removeFilterTag"
    >
      <template #primary>
        <FilterSelectPill v-model="filters.system" class="sfb-w-md" label="시스템" :options="systemOptions" />
        <FilterSelectPill v-model="filters.bizCategory" class="sfb-w-md" label="업무범주" :options="bizCategoryOptions" />
        <FilterTextPill v-model="filters.keyword" class="sfb-w-lg" label="케이스 검색" placeholder="케이스 ID, 케이스명" />
        <!-- 차수는 위 round-tabs가 담당한다. -->
      </template>
      <template #expand>
        <FilterTextPill v-model="filters.screenKeyword" label="요구사항/화면명" placeholder="화면명, 요구사항 ID" fill />
        <FilterSelectPill v-model="filters.executionType" label="수행구분" fill :options="config.executionTypeOptions" />
      </template>
    </SearchFilterBar>

    <div class="toolbar">
      <span class="toolbar__count">총 <b>{{ rows.length }}</b>건</span>
      <select v-model="pageSize" class="hp-pagesize-select" @change="currentPage = 1">
        <option v-for="n in pageSizeOptions" :key="n" :value="n">{{ n }}건씩 보기</option>
      </select>
      <button type="button" class="toolbar__mini" @click="toggleExpandAll">
        {{ allExpandedOnPage ? '전체접기' : '전체열기' }}
      </button>
      <div class="toolbar__spacer" />
      <div class="split-btn">
        <button type="button" class="split-btn__main" @click="openBulkUpload">일괄등록</button>
        <button
          ref="editMenuAnchor"
          type="button"
          class="split-btn__toggle"
          :class="{ 'split-btn__toggle--on': showEditMenu }"
          aria-label="추가 작업"
          :aria-expanded="showEditMenu"
          @click="showEditMenu = !showEditMenu"
        >
          ▾
        </button>
        <HpDropdownMenu
          :open="showEditMenu"
          :anchor="editMenuAnchor"
          :items="EDIT_MENU_ITEMS"
          aria-label="추가 작업"
          @select="onEditMenuSelect"
          @close="showEditMenu = false"
        />
      </div>
      <ExcelDownloadButton @click="onExcelDownload" />
    </div>

    <div class="listcard">
      <div class="listcard__scroll">
        <table class="scenario-table">
          <thead>
            <tr>
              <!-- 행 전체 클릭으로 토글하므로 전용 펼침 버튼 컬럼은 두지 않고, 화살표는 맨 끝에 둔다. -->
              <th class="col-no">No</th>
              <th>요구사항 ID</th>
              <th>수행구분</th>
              <th>시스템/업무</th>
              <th>화면경로</th>
              <th>화면명</th>
              <th>케이스 ID</th>
              <th>케이스명</th>
              <th class="col-steps">절차</th>
              <th class="col-expand" />
            </tr>
          </thead>
          <tbody>
            <template v-for="(row, idx) in pagedList" :key="row.id">
              <!-- 요구사항 ID 링크는 별도 이동 기능이라 @click.stop으로 행 토글에서 제외한다. -->
              <tr
                class="main-row"
                :class="{ 'main-row--open': expandedIds.has(row.id), 'main-row--locked': !!lockReason(row) }"
                @click="toggleExpand(row.id)"
              >
                <td class="col-no">{{ (currentPage - 1) * pageSize + idx + 1 }}</td>
                <td>
                  <button v-if="row.reqId" type="button" class="name-link" @click.stop="goRequirement(row.reqId)">
                    {{ row.reqId }}
                  </button>
                  <template v-else>-</template>
                </td>
                <td>{{ row.executionType }}</td>
                <td>{{ row.systemPath || '-' }}</td>
                <td>{{ row.screenPath || '-' }}</td>
                <td class="col-screen">{{ row.screenName || '-' }}</td>
                <!-- 케이스 미등록이면 케이스 ID는 '-', 케이스명은 '미등록', 절차는 0. -->
                <td>{{ row.caseId || '-' }}</td>
                <td>
                  <span class="name-link">{{ row.caseName || '미등록' }}</span>
                  <span
                    v-if="lockReason(row)"
                    class="badge badge--danger lock-badge"
                    :title="lockReason(row)?.message"
                  >
                    {{ lockReason(row)?.label }}
                  </span>
                </td>
                <td class="col-steps">
                  <span class="step-badge">{{ row.stepCount || 0 }}</span>
                </td>
                <td class="col-expand">
                  <span class="chevron" :class="{ 'chevron--open': expandedIds.has(row.id) }">›</span>
                </td>
              </tr>
              <tr v-if="expandedIds.has(row.id)" class="detail-row">
                <td colspan="10">
                  <!-- No/절차/예상결과 라벨은 카드 밖(패널 배경 위)에 두고, 실제 절차 목록만 흰
                       배경 + teal 보더 카드로 감싼다. 라벨 행과 데이터 행이 같은
                       grid-template-columns를 써서 폭이 정확히 맞는다. -->
                  <div class="step-detail">
                    <div class="step-subhead">
                      <div>No</div>
                      <div>절차</div>
                      <div></div>
                      <div>예상결과</div>
                    </div>
                    <div class="step-panel">
                      <div class="step-scroll">
                        <div v-for="s in row.steps" :key="s.no" class="step-row">
                          <div class="step-row__no">{{ s.no }}</div>
                          <div class="step-row__proc">{{ s.procedure }}</div>
                          <div class="step-row__divider"></div>
                          <div class="step-row__exp">{{ s.expected }}</div>
                        </div>
                      </div>
                    </div>
                  </div>
                </td>
              </tr>
            </template>
            <tr v-if="!pagedList.length">
              <td colspan="10" class="empty">조회 결과가 없습니다.</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <HpPagination v-model:page="currentPage" :total-pages="totalPages" />

    <ScenarioBulkRegisterModal
      :visible="showBulkModal"
      :mode="mode"
      :round="filters.round"
      @close="showBulkModal = false"
      @register="onBulkConfirm"
    />
    <TestNoteModal
      v-model="showCommonNoteModal"
      anchor-top-right
      :note="scenarioMeta.commonNote[mode]"
      @save="onCommonNoteSave"
    />
  </div>
</template>

<style scoped>
.scenario {
  padding: 14px 18px 28px;
  color: var(--ink);
  font-size: calc(13px + var(--font-size-offset, 0px));
}

.scenario__head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin: 0 0 14px;
}

.scenario__head-left {
  display: flex;
  align-items: center;
  gap: 16px;
}

.scenario__title {
  font-size: calc(18px + var(--font-size-offset, 0px));
  font-weight: 700;
  margin: 0;
}

.round-tabs {
  display: flex;
  gap: 4px;
}

.round-tab {
  height: 30px;
  padding: 0 14px;
  border: 1px solid var(--line);
  border-radius: 999px;
  background: var(--lnb-side);
  color: var(--ink-2);
  font-size: calc(12px + var(--font-size-offset, 0px));
  font-weight: 600;
  cursor: pointer;
  font-family: inherit;
}

.round-tab--on {
  background: var(--teal);
  border-color: var(--teal);
  color: var(--color-text-inverse);
}

.memo-btn {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  height: 32px;
  padding: 0 12px;
  border: 1px solid var(--line);
  border-radius: 7px;
  background: var(--lnb-side);
  color: var(--ink);
  font-weight: 600;
  font-size: calc(12px + var(--font-size-offset, 0px));
  cursor: pointer;
  font-family: inherit;
}

.memo-btn:hover {
  border-color: var(--teal);
  color: var(--teal-600);
}

.toolbar {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 10px;
  flex-wrap: wrap;
}

.toolbar__count { font-size: calc(12px + var(--font-size-offset, 0px)); color: var(--ink-2); }
.toolbar__count b { color: var(--teal-600); }
.toolbar__mini {
  height: 24px;
  padding: 0 8px;
  border: 1px solid var(--line);
  border-radius: 6px;
  background: var(--lnb-side);
  color: var(--ink);
  font-size: calc(11.5px + var(--font-size-offset, 0px));
  font-family: inherit;
  cursor: pointer;
}
.toolbar__spacer { flex: 1; }

.split-btn {
  position: relative;
  display: flex;
  height: 28px;
  border-radius: 7px;
  overflow: visible;
}

.split-btn__main,
.split-btn__toggle {
  border: none;
  background: var(--teal);
  color: var(--color-text-inverse);
  cursor: pointer;
  font-family: inherit;
  font-weight: 600;
}

.split-btn__main {
  padding: 0 12px;
  font-size: calc(12px + var(--font-size-offset, 0px));
  border-radius: 7px 0 0 7px;
  border-right: 1px solid rgba(255, 255, 255, 0.3);
}

.split-btn__main:hover,
.split-btn__toggle:hover {
  background: var(--teal-600);
}

.split-btn__toggle {
  width: 26px;
  border-radius: 0 7px 7px 0;
  font-size: calc(11px + var(--font-size-offset, 0px));
}

.split-btn__toggle--on {
  background: var(--teal-600);
}

.listcard__scroll { overflow-x: auto; }

.scenario-table { width: 100%; border-collapse: collapse; font-size: calc(12px + var(--font-size-offset, 0px)); }
.scenario-table th, .scenario-table td {
  border-bottom: 1px solid var(--line); padding: 12px 14px; text-align: left; white-space: nowrap;
}
.scenario-table th { background: var(--field); font-weight: 600; color: var(--ink); text-align: left; }
.col-no { width: 40px; text-align: center !important; }
.col-steps { width: 66px; text-align: center !important; }
.col-expand { width: 40px; text-align: center; }
/* 2026-08-26 요청: 화면명은 다른 값 컬럼보다 굵게 강조한다. */
.col-screen { font-weight: 700; }

.name-link, .link-btn { border: none; background: none; font-family: inherit; }
.name-link { color: inherit; font-weight: 600; }
.link-btn { color: var(--teal); font-weight: 600; text-decoration: underline; font-size: inherit; cursor: pointer; }

/* 절차수 배지 */
.step-badge {
  display: inline-flex; min-width: 26px; height: 22px; padding: 0 6px; align-items: center; justify-content: center;
  font-size: calc(11.5px + var(--font-size-offset, 0px)); font-weight: 600; border-radius: 6px;
  background: var(--teal-50); color: var(--teal-600);
}

/* 행 전체가 펼침 토글이다(요구사항 ID 링크만 제외). */
.main-row { cursor: pointer; transition: background 0.15s ease; }
.chevron {
  display: inline-block; font-size: calc(16px + var(--font-size-offset, 0px)); color: var(--ink-2);
  transition: transform 0.18s ease;
}
.chevron--open { transform: rotate(90deg); color: var(--teal-600); }
/* 2026-08-26 요청: 열렸을 때 안쪽 배경색은 디자인 원본 oklch 값을 그대로 쓴다(다른 액센트는
   기존 teal 유지, 배경만 디자인과 동일하게 맞춘다). */
.main-row--open { background: oklch(96.5% 0.02 264); }

.main-row--locked td {
  text-decoration: line-through;
  color: var(--gray-500, #8a8a8a);
}
.main-row--locked .name-link {
  text-decoration: line-through;
  color: var(--gray-500, #8a8a8a);
}
.lock-badge { margin-left: 6px; }

/* 절차/예상결과 패널 — 라벨 행은 패널 배경 위에, 실제 절차 목록만 흰 배경 + teal 보더 카드로
   감싼다. 라벨 행과 데이터 행이 같은 grid-template-columns를 써서 폭이 정확히 맞는다.
   배경/상단 경계선은 디자인 원본 oklch 값을 그대로 쓴다. */
.detail-row td { padding: 0; background: oklch(98% 0.01 264); border-top: 1px solid oklch(91% 0.02 264); }
.step-detail { padding: 18px 24px 24px 24px; }
.step-subhead {
  display: grid; grid-template-columns: 48px 1fr 1px 1fr; column-gap: 22px;
  padding: 10px 18px; margin-bottom: 6px;
}
.step-subhead > div {
  font-size: calc(12px + var(--font-size-offset, 0px)); font-weight: 600; color: var(--ink-2);
  text-transform: uppercase; letter-spacing: 0.03em; text-align: center;
}
.step-panel {
  background: var(--bg-surface, #fff);
  border: 1.5px solid var(--teal-100, var(--teal));
  border-radius: 10px;
  overflow: hidden;
}
/* 절차 10건 기본 노출 후 스크롤. 한 행(.step-row)은 상하 패딩 32px + 구분선 1px + 본문
   1.6em(line-height)이라 10행 = 330px + 16em이다(패딩·선은 px 고정, 본문만 글꼴 배율을 따름). */
.step-scroll {
  font-size: calc(11.52px + var(--font-size-offset));
  max-height: calc(330px + 16em);
  overflow-y: auto;
}
.step-row {
  display: grid; grid-template-columns: 48px 1fr 1px 1fr; column-gap: 22px;
  padding: 16px 18px; border-bottom: 1px solid var(--line);
}
.step-row:last-child { border-bottom: none; }
.step-row__no { text-align: center; font-weight: 700; color: var(--teal-600); }
.step-row__proc, .step-row__exp { line-height: 1.6; word-break: break-word; }
.step-row__divider { background: var(--teal-100); }

.empty { text-align: center !important; color: var(--muted); padding: 1.5rem !important; }
</style>
