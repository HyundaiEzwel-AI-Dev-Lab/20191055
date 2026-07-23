<script setup>
// PAG-M-TLB-01 테스트 라이브러리 (SB 56~58)
import { computed, reactive, ref, watch } from 'vue'
import {
  testLibraryMeta,
  systemOptions,
  bizOptions,
  sortOptions,
  pageSizeOptions,
  libraryList,
  flattenLibraryCases,
  matchLibraryFilters,
  emptyCaseForm,
  nextCaseId,
  saveLibraryCase,
  deleteLibraryCase,
} from '@/data/testLibrary'
import BaseModal from '@/components/ui/BaseModal.vue'
import ExcelDownloadButton from '@/components/ui/ExcelDownloadButton.vue'
import { mockExcelDownload } from '@/utils/excelDownload'

const filters = ref(createFilters())
const applied = ref({ ...filters.value })
const sortOrder = ref('newest')
const pageSize = ref(20)
const currentPage = ref(1)
const selectedId = ref(null)
const isNew = ref(false)
const form = reactive(emptyCaseForm())
const showScreenModal = ref(false)
const screenModalMode = ref('filter') // filter | form
const screenSystem = ref('전체')
const screenKeyword = ref('')
const screenResults = ref([])
const showSourceTip = ref(false)

const SOURCE_TIP = '해당 테스트 케이스가 등록되고 사용된 프로젝트입니다.'

const mockScreens = [
  {
    id: 'HIMS-101',
    system: 'HIMS',
    bizCategory: '법인숙박',
    screenName: '복지혜택 신청',
    screenPath: 'HIMS > 법인숙박 > 여행레저 > 복지혜택',
  },
  {
    id: 'FO-101',
    system: 'FO',
    bizCategory: '법인숙박',
    screenName: '복지혜택 신청',
    screenPath: 'FO > 법인숙박 > 여행레저 > 복지혜택',
  },
  {
    id: 'FO-203',
    system: 'FO',
    bizCategory: '주문클레임',
    screenName: '주문취소',
    screenPath: 'FO > 주문클레임 > 주문/결제',
  },
  {
    id: 'FO-301',
    system: 'FO',
    bizCategory: 'SSO',
    screenName: 'SSO 로그인',
    screenPath: 'FO > 회원/로그인 > SSO',
  },
  {
    id: 'HIMS-401',
    system: 'HIMS',
    bizCategory: '정산',
    screenName: '정산대사',
    screenPath: 'HIMS > 정산 > 정산 > 대사',
  },
  {
    id: 'HPAS-012',
    system: 'HPAS',
    bizCategory: '정산',
    screenName: '결제내역 조회',
    screenPath: 'HPAS > 결제 > 정산',
  },
  {
    id: 'HCAS-034',
    system: 'HCAS',
    bizCategory: '복지혜택',
    screenName: '복지포인트 조회',
    screenPath: 'HCAS > 복지 > 포인트',
  },
]

function createFilters() {
  return {
    system: '전체',
    bizCategory: '전체',
    screenName: '',
    caseName: '',
    sourceProject: '',
    openMonth: '',
    registeredBy: '',
  }
}

const allCases = computed(() => flattenLibraryCases(libraryList))

const filtered = computed(() => {
  const list = allCases.value.filter((r) =>
    matchLibraryFilters(r, {
      ...applied.value,
      openMonth: applied.value.openMonth || '전체',
    }),
  )
  return [...list].sort((a, b) => {
    const cmp = a.registeredAt.localeCompare(b.registeredAt)
    return sortOrder.value === 'newest' ? -cmp : cmp
  })
})

const paged = computed(() => {
  const start = (currentPage.value - 1) * pageSize.value
  return filtered.value.slice(start, start + pageSize.value)
})
const totalPages = computed(() => Math.max(1, Math.ceil(filtered.value.length / pageSize.value)))

const hasDetail = computed(() => Boolean(selectedId.value || isNew.value))
const canDelete = computed(() => Boolean(selectedId.value && !isNew.value))
/** 기존 케이스: 시스템/업무는 화면 연동 read-only */

watch(
  () => [filtered.value, selectedId.value, isNew.value],
  () => {
    if (isNew.value) return
    if (!selectedId.value && paged.value.length) {
      selectCase(paged.value[0])
      return
    }
    if (selectedId.value && !filtered.value.some((r) => r.id === selectedId.value)) {
      if (paged.value.length) selectCase(paged.value[0])
      else clearSelection()
    }
  },
  { immediate: true },
)

function search() {
  if (filters.value.caseName.trim().length === 1) {
    window.alert('케이스명은 2자 이상 입력해 주세요.')
    return
  }
  applied.value = { ...filters.value }
  currentPage.value = 1
}

function resetFilters() {
  filters.value = createFilters()
  search()
}

function loadForm(row) {
  Object.assign(form, {
    id: row.id,
    libId: row.libId,
    system: row.system,
    bizCategory: row.bizCategory,
    screenPath: row.systemPath,
    screenName: row.screenName,
    caseName: row.caseName,
    sourceProject: row.sourceProject,
    openMonth: row.openMonth,
    registeredBy: row.registeredBy,
    registeredAt: row.registeredAt,
    steps: (row.steps || []).map((s) => ({ ...s })),
  })
}

function clearSelection() {
  selectedId.value = null
  isNew.value = false
  Object.assign(form, emptyCaseForm())
}

function selectCase(row) {
  isNew.value = false
  selectedId.value = row.id
  showSourceTip.value = false
  loadForm(row)
}

/** SB: 케이스 추가 → 우측 케이스 정보 영역 활성화 */
function addCase() {
  isNew.value = true
  selectedId.value = null
  showSourceTip.value = false
  Object.assign(form, emptyCaseForm())
  form.id = nextCaseId()
  form.system = ''
  form.bizCategory = ''
  form.screenPath = ''
  form.screenName = ''
  form.caseName = ''
  form.sourceProject = ''
  form.openMonth = ''
  form.registeredBy = '김현대'
  form.steps = [{ no: 1, procedure: '', expected: '' }]
}

function addStep() {
  form.steps.push({
    no: form.steps.length + 1,
    procedure: '',
    expected: '',
  })
}

function removeStep(idx) {
  if (form.steps.length <= 1) {
    window.alert('테스트 케이스 1개당 절차 1개·결과 1개는 필수입니다.')
    return
  }
  form.steps.splice(idx, 1)
  form.steps.forEach((s, i) => {
    s.no = i + 1
  })
}

function openScreenSearch(mode) {
  screenModalMode.value = mode
  const seed =
    mode === 'filter' ? filters.value.screenName : form.screenName || form.screenPath || ''
  screenKeyword.value = seed
  const systemHint = mode === 'form' ? form.system : filters.value.system
  screenSystem.value = systemHint || '전체'
  screenResults.value = mockScreens.filter(
    (s) => !systemHint || systemHint === '전체' || s.system === systemHint,
  )
  showScreenModal.value = true
}

function searchScreens() {
  const q = screenKeyword.value.trim().toLowerCase()
  const systemHint = screenSystem.value
  screenResults.value = mockScreens.filter((s) => {
    if (systemHint && systemHint !== '전체' && s.system !== systemHint) return false
    if (!q) return true
    return `${s.screenName}${s.screenPath}${s.bizCategory}`.toLowerCase().includes(q)
  })
}

function pickScreen(row) {
  if (screenModalMode.value === 'filter') {
    filters.value.screenName = row.screenName
    filters.value.system = row.system
    filters.value.bizCategory = row.bizCategory
  } else {
    if (!isNew.value && form.screenName && form.screenName !== row.screenName) {
      window.alert('화면(메뉴) 변경사항은 기존 테스트에는 반영되지 않으며, 신규로 등록되는 테스트부터 적용됩니다.')
    }
    form.system = row.system
    form.bizCategory = row.bizCategory
    form.screenName = row.screenName
    form.screenPath = row.screenPath
  }
  showScreenModal.value = false
}

function validateForm() {
  if (!form.system) {
    window.alert('시스템구분을 선택해 주세요. (화면 검색으로 지정)')
    return false
  }
  if (!form.bizCategory) {
    window.alert('업무구분을 선택해 주세요. (화면 검색으로 지정)')
    return false
  }
  if (!form.screenPath || !form.screenName) {
    window.alert('화면(메뉴)을 검색하여 선택해 주세요.')
    return false
  }
  if (!form.caseName.trim()) {
    window.alert('테스트 케이스명을 입력해 주세요.')
    return false
  }
  if (form.caseName.trim().length > 45) {
    window.alert('테스트 케이스명은 90Byte(한글 약 45자) 이내로 입력해 주세요.')
    return false
  }
  const filledSteps = form.steps.filter((s) => s.procedure.trim() && s.expected.trim())
  if (!filledSteps.length) {
    window.alert('테스트 절차와 예상결과를 1건 이상 입력해 주세요.')
    return false
  }
  return true
}

function saveCase() {
  if (!hasDetail.value) {
    window.alert('저장할 케이스가 없습니다. 케이스를 선택하거나 추가해 주세요.')
    return
  }
  if (!validateForm()) return
  if (!window.confirm('케이스 정보를 저장하시겠습니까?')) return

  // 빈 절차 행 제거 후 저장
  form.steps = form.steps
    .filter((s) => s.procedure.trim() || s.expected.trim())
    .map((s, i) => ({
      no: i + 1,
      procedure: s.procedure.trim(),
      expected: s.expected.trim(),
    }))
  if (!form.openMonth) {
    form.openMonth = new Date().toISOString().slice(0, 7)
  }

  const saved = saveLibraryCase(form, isNew.value)
  if (!saved) {
    window.alert('저장에 실패했습니다.')
    return
  }
  isNew.value = false
  selectedId.value = saved.id
  loadForm(saved)
  search()
  window.alert('저장되었습니다.')
}

function deleteCase() {
  if (!canDelete.value) {
    window.alert('삭제할 테스트케이스를 선택해 주세요.')
    return
  }
  if (!window.confirm(`케이스 {${form.caseName}}을 삭제하시겠습니까?`)) return
  deleteLibraryCase(selectedId.value)
  clearSelection()
  if (paged.value.length) selectCase(paged.value[0])
  else search()
  window.alert('삭제되었습니다.')
}

function onExcelDownload() {
  mockExcelDownload(
    '테스트 라이브러리',
    filtered.value.map((r) => ({
      ...r,
      stepCount: r.steps?.length || 0,
    })),
    [
      { key: 'id', label: '케이스ID' },
      { key: 'system', label: '시스템' },
      { key: 'bizCategory', label: '업무구분' },
      { key: 'systemPath', label: '화면경로' },
      { key: 'screenName', label: '화면명' },
      { key: 'caseName', label: '케이스명' },
      { key: 'sourceProject', label: '프로젝트출처' },
      { key: 'openMonth', label: '오픈월' },
      { key: 'stepCount', label: '절차수' },
      { key: 'registeredBy', label: '등록자' },
      { key: 'registeredAt', label: '등록일' },
    ],
  )
}
</script>

<template>
  <div class="admin-page tlb-page">
    <div class="notice notice--warn">
      <span class="notice__icon">!</span>
      <span>{{ testLibraryMeta.notice }}</span>
    </div>

    <!-- 검색조건 -->
    <section class="filter card">
      <div class="filter__row filter__row--4">
        <div class="filter__field">
          <label>시스템구분</label>
          <select v-model="filters.system" class="filter__select">
            <option v-for="o in systemOptions" :key="o" :value="o">
              {{ o === '전체' ? '선택' : o }}
            </option>
          </select>
        </div>
        <div class="filter__field">
          <label>업무구분</label>
          <select v-model="filters.bizCategory" class="filter__select">
            <option v-for="o in bizOptions" :key="o" :value="o">
              {{ o === '전체' ? '선택' : o }}
            </option>
          </select>
        </div>
        <div class="filter__field">
          <label>화면 (메뉴)</label>
          <div class="tlb-search-field">
            <input
              v-model="filters.screenName"
              class="filter__input"
              type="text"
              readonly
              placeholder="화면명"
              @click="openScreenSearch('filter')"
            />
            <button
              type="button"
              class="tlb-icon-btn"
              title="화면 검색"
              @click="openScreenSearch('filter')"
            >
              <svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" stroke-width="2">
                <circle cx="11" cy="11" r="7" />
                <path d="m21 21-4.3-4.3" />
              </svg>
            </button>
          </div>
        </div>
        <div class="filter__field">
          <label>케이스명</label>
          <input
            v-model="filters.caseName"
            class="filter__input"
            type="text"
            placeholder="2자 이상"
            @keyup.enter="search"
          />
        </div>
        <div class="filter__field">
          <label>프로젝트 출처</label>
          <input
            v-model="filters.sourceProject"
            class="filter__input"
            type="text"
            placeholder="프로젝트명 또는 프로젝트ID"
            @keyup.enter="search"
          />
        </div>
        <div class="filter__field">
          <label>프로젝트 오픈월</label>
          <input v-model="filters.openMonth" class="filter__input" type="month" />
        </div>
        <div class="filter__field">
          <label>등록자</label>
          <input
            v-model="filters.registeredBy"
            class="filter__input"
            type="text"
            placeholder="등록자"
            @keyup.enter="search"
          />
        </div>
      </div>
      <div class="filter__actions">
        <button type="button" class="btn btn--ghost" @click="resetFilters">초기화</button>
        <button type="button" class="btn btn--primary" @click="search">조회</button>
      </div>
    </section>

    <div class="tlb-split">
      <!-- 좌: 테스트케이스 카드 목록 -->
      <aside class="card tlb-list">
        <div class="tlb-list__head">
          <span class="tlb-list__title">
            테스트케이스 <b>({{ filtered.length }}개)</b>
          </span>
          <select v-model="sortOrder" class="tlb-list__sort">
            <option v-for="o in sortOptions" :key="o.value" :value="o.value">{{ o.label }}</option>
          </select>
        </div>

        <div class="tlb-list__body">
          <button
            v-for="row in paged"
            :key="row.id"
            type="button"
            class="tlb-card"
            :class="{ 'is-on': !isNew && selectedId === row.id }"
            @click="selectCase(row)"
          >
            <div class="tlb-card__name">{{ row.caseName }}</div>
            <div class="tlb-card__line">
              <span class="tlb-card__lab">시스템/화면</span>
              <span>{{ row.systemPath }}</span>
            </div>
            <div class="tlb-card__line">
              <span class="tlb-card__lab">화면(메뉴)명</span>
              <span>{{ row.screenName }}</span>
            </div>
            <div class="tlb-card__line">
              <span class="tlb-card__lab">프로젝트</span>
              <span>{{ row.sourceProject }}</span>
            </div>
            <div class="tlb-card__foot">
              <span>오픈월 {{ row.openMonth }}</span>
              <span>{{ row.registeredBy }}</span>
              <span>절차 {{ row.steps?.length || 0 }}</span>
            </div>
          </button>

          <div v-if="!paged.length" class="tlb-empty">
            <svg class="tlb-empty__img" viewBox="0 0 64 64" width="48" height="48" fill="none" stroke="currentColor" stroke-width="1.5">
              <rect x="10" y="20" width="44" height="34" rx="3" />
              <path d="M10 30h44" />
              <path d="M22 40h20" />
              <path d="M22 46h12" />
            </svg>
            <p>등록 된 테스트 케이스가 없습니다.</p>
          </div>
        </div>

        <div v-if="totalPages > 1" class="tlb-list__pager">
          <button type="button" class="pager__btn" :disabled="currentPage <= 1" @click="currentPage -= 1">
            ‹
          </button>
          <button
            v-for="p in totalPages"
            :key="p"
            type="button"
            class="pager__btn"
            :class="{ 'is-active': currentPage === p }"
            @click="currentPage = p"
          >
            {{ p }}
          </button>
          <button
            type="button"
            class="pager__btn"
            :disabled="currentPage >= totalPages"
            @click="currentPage += 1"
          >
            ›
          </button>
          <select v-model="pageSize" class="tlb-list__pagesize" @change="currentPage = 1">
            <option v-for="n in pageSizeOptions" :key="n" :value="n">{{ n }}건</option>
          </select>
        </div>
      </aside>

      <!-- 우: 케이스 정보 -->
      <section class="card tlb-detail">
        <div class="tlb-detail__head">
          <h3 class="tlb-detail__title">케이스 정보</h3>
          <div class="tlb-detail__actions">
            <button
              type="button"
              class="btn btn--ghost btn--sm"
              :disabled="!canDelete"
              @click="deleteCase"
            >
              삭제
            </button>
            <button type="button" class="btn btn--ghost btn--sm" @click="addCase">케이스 추가</button>
            <button type="button" class="btn btn--primary btn--sm" @click="saveCase">저장</button>
            <ExcelDownloadButton @click="onExcelDownload" />
          </div>
        </div>

        <template v-if="hasDetail">
          <p v-if="isNew" class="tlb-detail__hint">신규 케이스 등록 — 필수 항목(*)을 입력 후 저장하세요.</p>

          <div class="tlb-form">
            <div class="tlb-field">
              <label>시스템구분</label>
              <input
                class="filter__input"
                type="text"
                :value="form.system"
                readonly
                placeholder="화면 선택 시 자동"
              />
            </div>
            <div class="tlb-field">
              <label>업무구분</label>
              <input
                class="filter__input"
                type="text"
                :value="form.bizCategory"
                readonly
                placeholder="화면 선택 시 자동"
              />
            </div>

            <div class="tlb-field tlb-field--wide">
              <label>화면 (메뉴) <i>*</i></label>
              <div class="tlb-search-field">
                <input
                  class="filter__input"
                  type="text"
                  :value="form.screenName || form.screenPath"
                  readonly
                  placeholder="화면 검색으로 선택"
                />
                <button
                  type="button"
                  class="tlb-icon-btn"
                  title="화면 검색"
                  @click="openScreenSearch('form')"
                >
                  <svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" stroke-width="2">
                    <circle cx="11" cy="11" r="7" />
                    <path d="m21 21-4.3-4.3" />
                  </svg>
                </button>
              </div>
              <p v-if="form.screenPath" class="tlb-field__sub">{{ form.screenPath }}</p>
            </div>

            <div class="tlb-field tlb-field--wide">
              <label>테스트 케이스명 <i>*</i></label>
              <input
                v-model="form.caseName"
                class="filter__input"
                type="text"
                maxlength="45"
                placeholder="케이스명 입력"
              />
            </div>

            <div class="tlb-field tlb-field--wide">
              <label class="tlb-field__lab">
                프로젝트 출처
                <button
                  type="button"
                  class="tlb-tip"
                  :class="{ 'is-on': showSourceTip }"
                  aria-label="프로젝트 출처 안내"
                  @click.stop="showSourceTip = !showSourceTip"
                  @blur="showSourceTip = false"
                >
                  !
                </button>
                <span v-if="showSourceTip" class="tlb-tip__bubble" role="tooltip">
                  {{ SOURCE_TIP }}
                </span>
              </label>
              <input
                v-model="form.sourceProject"
                class="filter__input"
                type="text"
                maxlength="75"
                placeholder="출처 프로젝트명"
              />
            </div>

            <div class="tlb-field">
              <label>프로젝트 오픈월</label>
              <input v-model="form.openMonth" class="filter__input" type="month" />
            </div>
            <div class="tlb-field">
              <label>등록자</label>
              <input v-model="form.registeredBy" class="filter__input" type="text" />
            </div>
          </div>

          <div class="tlb-steps-head">
            <h4>테스트 절차 / 예상결과</h4>
            <button type="button" class="btn btn--ghost btn--sm" @click="addStep">+ 절차 추가</button>
          </div>
          <div class="listcard__scroll">
            <table class="data-table tlb-steps">
              <thead>
                <tr>
                  <th style="width: 40px" />
                  <th style="width: 48px">NO</th>
                  <th>테스트 절차</th>
                  <th>예상결과</th>
                  <th style="width: 48px" />
                </tr>
              </thead>
              <tbody>
                <tr v-for="(step, idx) in form.steps" :key="idx">
                  <td class="tlb-steps__grip">⋮⋮</td>
                  <td>{{ step.no }}</td>
                  <td>
                    <input v-model="step.procedure" class="cell-input" type="text" placeholder="절차 입력" />
                  </td>
                  <td>
                    <input v-model="step.expected" class="cell-input" type="text" placeholder="예상결과 입력" />
                  </td>
                  <td>
                    <button type="button" class="tlb-steps__del" title="삭제" @click="removeStep(idx)">
                      ×
                    </button>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </template>

        <div v-else class="tlb-empty tlb-empty--detail">
          좌측에서 케이스를 선택하거나 <b>케이스 추가</b>를 눌러 등록하세요.
        </div>
      </section>
    </div>

    <BaseModal :visible="showScreenModal" title="화면 (메뉴) 검색" @close="showScreenModal = false">
      <div class="tlb-screen-modal">
        <div class="tlb-screen-modal__row">
          <select v-model="screenSystem" class="filter__select">
            <option v-for="s in systemOptions" :key="s" :value="s">{{ s }}</option>
          </select>
          <input
            v-model="screenKeyword"
            class="filter__input"
            type="text"
            placeholder="화면명 검색"
            @keyup.enter="searchScreens"
          />
          <button type="button" class="btn btn--primary btn--sm" @click="searchScreens">조회</button>
        </div>
        <div class="listcard__scroll">
          <table class="data-table">
            <thead>
              <tr>
                <th>관리번호</th>
                <th>시스템</th>
                <th>업무구분</th>
                <th>화면경로</th>
                <th>화면명</th>
              </tr>
            </thead>
            <tbody>
              <tr
                v-for="(row, i) in screenResults"
                :key="i"
                class="tlb-screen-row"
                @click="pickScreen(row)"
              >
                <td>{{ row.id }}</td>
                <td>{{ row.system }}</td>
                <td>{{ row.bizCategory }}</td>
                <td>{{ row.screenPath }}</td>
                <td>{{ row.screenName }}</td>
              </tr>
              <tr v-if="!screenResults.length">
                <td colspan="5" class="empty">검색 결과가 없습니다.</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
      <template #footer>
        <button type="button" class="btn btn--ghost" @click="showScreenModal = false">닫기</button>
      </template>
    </BaseModal>
  </div>
</template>

<style scoped>
.tlb-page .notice {
  display: flex;
  gap: 8px;
  align-items: flex-start;
}

.notice__icon {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 16px;
  height: 16px;
  border-radius: 50%;
  background: var(--orange);
  color: var(--color-text-inverse);
  font-size: 11px;
  font-weight: 800;
  flex-shrink: 0;
  margin-top: 1px;
}

.tlb-search-field {
  display: flex;
  gap: 6px;
  align-items: center;
}

.tlb-search-field .filter__input {
  flex: 1;
  min-width: 0;
}

.tlb-icon-btn {
  width: 32px;
  height: 32px;
  flex-shrink: 0;
  border: 1px solid var(--lnb-line);
  border-radius: var(--radius-sm, 6px);
  background: var(--lnb-side);
  color: var(--lnb-muted);
  display: inline-flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  padding: 0;
}

.tlb-icon-btn:hover {
  color: var(--teal);
  border-color: var(--teal);
}

.tlb-split {
  display: flex;
  gap: 14px;
  align-items: stretch;
  min-height: 520px;
}

.tlb-list {
  width: 360px;
  flex-shrink: 0;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  padding: 0;
}

.tlb-list__head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  padding: 12px 14px;
  border-bottom: 1px solid var(--lnb-line);
}

.tlb-list__title {
  font-size: 13px;
  font-weight: 700;
  color: var(--lnb-logo);
}

.tlb-list__title b {
  color: var(--teal);
  font-weight: 800;
}

.tlb-list__sort {
  height: 28px;
  border: 1px solid var(--lnb-line);
  border-radius: var(--radius-sm, 6px);
  padding: 0 8px;
  font-size: 11.5px;
  font-family: inherit;
  background: var(--lnb-side);
  color: var(--lnb-txt);
}

.tlb-list__body {
  flex: 1;
  overflow-y: auto;
  max-height: 560px;
}

.tlb-list__pager {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 4px;
  padding: 10px;
  border-top: 1px solid var(--lnb-line);
}

.tlb-list__pagesize {
  margin-left: 6px;
  height: 26px;
  font-size: 11px;
  border: 1px solid var(--lnb-line);
  border-radius: var(--radius-sm, 6px);
  background: var(--lnb-side);
  font-family: inherit;
}

.tlb-card {
  display: block;
  width: 100%;
  text-align: left;
  border: none;
  border-bottom: 1px solid var(--lnb-line);
  background: transparent;
  padding: 12px 14px;
  cursor: pointer;
  font-family: inherit;
  transition: background var(--transition-fast, 0.15s ease);
}

.tlb-card:hover {
  background: var(--lnb-hover);
}

.tlb-card.is-on {
  background: var(--teal-50);
  box-shadow: inset 3px 0 0 var(--teal);
}

.tlb-card__name {
  font-size: 13px;
  font-weight: 700;
  color: var(--lnb-logo);
  margin-bottom: 8px;
  line-height: 1.35;
}

.tlb-card__line {
  display: flex;
  gap: 8px;
  font-size: 11.5px;
  color: var(--lnb-txt);
  margin-bottom: 3px;
  line-height: 1.4;
}

.tlb-card__lab {
  flex-shrink: 0;
  width: 78px;
  color: var(--lnb-muted);
  font-weight: 600;
}

.tlb-card__foot {
  display: flex;
  flex-wrap: wrap;
  gap: 8px 12px;
  margin-top: 8px;
  font-size: 11px;
  color: var(--lnb-muted);
}

.tlb-detail {
  flex: 1;
  min-width: 0;
  padding: 14px 16px 18px;
  display: flex;
  flex-direction: column;
}

.tlb-detail__head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  margin-bottom: 12px;
}

.tlb-detail__title {
  margin: 0;
  font-size: 14px;
  font-weight: 800;
  color: var(--lnb-logo);
}

.tlb-detail__actions {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  align-items: center;
}

.tlb-detail__hint {
  margin: 0 0 12px;
  font-size: 12px;
  color: var(--teal-600);
  font-weight: 600;
}

.tlb-form {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 10px 14px;
  margin-bottom: 16px;
}

.tlb-field {
  display: flex;
  flex-direction: column;
  gap: 4px;
  min-width: 0;
}

.tlb-field--wide {
  grid-column: 1 / -1;
}

.tlb-field label,
.tlb-field__lab {
  font-size: 11px;
  font-weight: 600;
  color: var(--lnb-muted);
}

.tlb-field__lab {
  position: relative;
  display: inline-flex;
  align-items: center;
  gap: 4px;
  width: fit-content;
}

.tlb-field label i {
  color: var(--red);
  font-style: normal;
  margin-left: 2px;
}

.tlb-field__sub {
  margin: 2px 0 0;
  font-size: 11px;
  color: var(--lnb-muted);
}

.tlb-tip {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 15px;
  height: 15px;
  border: none;
  border-radius: 50%;
  background: var(--lnb-muted);
  color: var(--color-text-inverse);
  font-size: 10px;
  font-weight: 800;
  font-family: inherit;
  line-height: 1;
  cursor: pointer;
  padding: 0;
  flex-shrink: 0;
}

.tlb-tip:hover,
.tlb-tip.is-on {
  background: var(--teal);
}

.tlb-tip__bubble {
  position: absolute;
  left: 0;
  top: calc(100% + 6px);
  z-index: 20;
  min-width: 220px;
  max-width: 280px;
  padding: 8px 10px;
  border-radius: var(--radius-sm, 8px);
  background: var(--lnb-logo);
  color: var(--color-text-inverse);
  font-size: 11px;
  font-weight: 500;
  line-height: 1.5;
  box-shadow: var(--shadow-sm, 0 4px 12px rgba(0, 0, 0, 0.12));
  white-space: normal;
  pointer-events: none;
}

.tlb-tip__bubble::before {
  content: '';
  position: absolute;
  left: 72px;
  top: -5px;
  width: 8px;
  height: 8px;
  background: var(--lnb-logo);
  transform: rotate(45deg);
}

.tlb-steps-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 8px;
}

.tlb-steps-head h4 {
  margin: 0;
  font-size: 13px;
  font-weight: 700;
  color: var(--lnb-logo);
}

.tlb-steps__grip {
  color: var(--lnb-muted);
  font-size: 11px;
  letter-spacing: -2px;
  text-align: center;
  user-select: none;
}

.tlb-steps__del {
  border: none;
  background: none;
  color: var(--lnb-muted);
  font-size: 18px;
  line-height: 1;
  cursor: pointer;
  padding: 0 4px;
}

.tlb-steps__del:hover {
  color: var(--red);
}

.tlb-empty {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 10px;
  text-align: center;
  color: var(--lnb-muted);
  padding: 48px 16px;
  font-size: 13px;
}

.tlb-empty__img {
  color: var(--lnb-line);
}

.tlb-empty p {
  margin: 0;
}

.tlb-empty--detail {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
}

.tlb-empty b {
  color: var(--teal);
}

.tlb-screen-modal__row {
  display: flex;
  gap: 8px;
  margin-bottom: 12px;
}

.tlb-screen-row {
  cursor: pointer;
}

.tlb-screen-row:hover td {
  background: var(--teal-50);
}

.cell-input {
  width: 100%;
  height: 28px;
  box-sizing: border-box;
  border: 1px solid var(--lnb-line);
  border-radius: var(--radius-sm, 6px);
  padding: 0 8px;
  font-size: 12px;
  font-family: inherit;
  color: var(--lnb-txt);
  background: var(--lnb-side);
}

@media (max-width: 1100px) {
  .tlb-split {
    flex-direction: column;
  }

  .tlb-list {
    width: 100%;
  }

  .tlb-list__body {
    max-height: 320px;
  }
}
</style>
