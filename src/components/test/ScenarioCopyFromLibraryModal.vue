<script setup>
// POP-S-UAT-07 테스트 라이브러리 복사 — 개별 검색 + 케이스 담기(중복 안내) + 선택된 케이스 영역 + 케이스 저장
import { computed, ref, watch } from 'vue'
import BaseModal from '@/components/ui/BaseModal.vue'
import { libraryList, systemOptions, bizOptions } from '@/data/testLibrary'

const props = defineProps({
  modelValue: { type: Boolean, default: false },
})

const emit = defineEmits(['update:modelValue', 'confirm'])

const filters = ref({ system: '전체', bizCategory: '전체', screenName: '', sourceProject: '', caseName: '' })
const searched = ref(false)
const staged = ref([])
const detailTarget = ref(null)

const flatCases = computed(() =>
  libraryList.flatMap((lib) =>
    (lib.cases || []).map((c) => ({
      key: `${lib.id}:${c.id}`,
      libId: lib.id,
      libTitle: lib.title,
      system: lib.system,
      bizCategory: lib.bizCategory,
      systemPath: lib.systemPath,
      screenName: lib.screenName,
      sourceProject: lib.sourceProject,
      type: lib.type,
      caseId: c.id,
      caseName: c.title,
      steps: c.steps.map((s) => ({ ...s })),
    })),
  ),
)

const filtered = computed(() => {
  if (!searched.value) return []
  return flatCases.value.filter((r) => {
    if (filters.value.system !== '전체' && r.system !== filters.value.system) return false
    if (filters.value.bizCategory !== '전체' && r.bizCategory !== filters.value.bizCategory) return false
    if (
      filters.value.screenName &&
      !r.screenName.toLowerCase().includes(filters.value.screenName.trim().toLowerCase())
    ) {
      return false
    }
    if (
      filters.value.sourceProject &&
      !r.sourceProject.toLowerCase().includes(filters.value.sourceProject.trim().toLowerCase())
    ) {
      return false
    }
    if (
      filters.value.caseName &&
      !r.caseName.toLowerCase().includes(filters.value.caseName.trim().toLowerCase())
    ) {
      return false
    }
    return true
  })
})

watch(
  () => props.modelValue,
  (open) => {
    if (!open) return
    filters.value = { system: '전체', bizCategory: '전체', screenName: '', sourceProject: '', caseName: '' }
    searched.value = false
    staged.value = []
    detailTarget.value = null
  },
)

function search() {
  searched.value = true
}

function showDetail(row) {
  detailTarget.value = row
}

function addToStaged(row) {
  if (staged.value.some((s) => s.key === row.key)) {
    window.alert('이미 담긴 케이스입니다.')
    return
  }
  staged.value.push(row)
}

function removeStaged(key) {
  staged.value = staged.value.filter((s) => s.key !== key)
}

function close() {
  emit('update:modelValue', false)
}

function confirm() {
  if (!staged.value.length) {
    window.alert('담은 케이스가 없습니다. 케이스를 먼저 담아주세요.')
    return
  }
  if (!window.confirm(`선택된 ${staged.value.length}건을 케이스로 저장하시겠습니까?`)) return
  emit('confirm', staged.value)
  close()
}
</script>

<template>
  <BaseModal title="라이브러리에서 복사" :visible="modelValue" wide @close="close">
    <div class="filter">
      <div class="fld">
        <label>시스템</label>
        <select v-model="filters.system" class="inp">
          <option v-for="s in systemOptions" :key="s" :value="s">{{ s }}</option>
        </select>
      </div>
      <div class="fld">
        <label>업무구분</label>
        <select v-model="filters.bizCategory" class="inp">
          <option v-for="b in bizOptions" :key="b" :value="b">{{ b }}</option>
        </select>
      </div>
      <div class="fld">
        <label>화면(메뉴)</label>
        <input v-model="filters.screenName" class="inp" type="text" placeholder="화면명 검색" @keyup.enter="search" />
      </div>
      <div class="fld">
        <label>프로젝트 출처</label>
        <input v-model="filters.sourceProject" class="inp" type="text" placeholder="프로젝트명 검색" @keyup.enter="search" />
      </div>
      <div class="fld">
        <label>케이스명</label>
        <input v-model="filters.caseName" class="inp" type="text" placeholder="케이스명 검색" @keyup.enter="search" />
      </div>
      <button type="button" class="btn btn--primary btn--sm filter__btn" @click="search">조회</button>
    </div>

    <div class="table-wrap">
      <table class="tbl">
        <thead>
          <tr>
            <th>시스템</th>
            <th>업무구분</th>
            <th>유형</th>
            <th>라이브러리</th>
            <th>화면명</th>
            <th>프로젝트 출처</th>
            <th>케이스</th>
            <th>절차수</th>
            <th></th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="row in filtered" :key="row.key">
            <td>{{ row.system }}</td>
            <td>{{ row.bizCategory }}</td>
            <td>{{ row.type }}</td>
            <td class="name">{{ row.libTitle }}</td>
            <td>{{ row.screenName }}</td>
            <td class="name">{{ row.sourceProject }}</td>
            <td class="name">
              <button type="button" class="case-link" @click="showDetail(row)">{{ row.caseName }}</button>
            </td>
            <td>{{ row.steps.length }}</td>
            <td>
              <button type="button" class="btn btn--ghost btn--sm" @click="addToStaged(row)">담기</button>
            </td>
          </tr>
          <tr v-if="searched && !filtered.length">
            <td colspan="9" class="empty">검색 결과가 없습니다.</td>
          </tr>
          <tr v-if="!searched">
            <td colspan="9" class="empty">조회 버튼을 눌러 라이브러리 케이스를 검색하세요.</td>
          </tr>
        </tbody>
      </table>
    </div>

    <div v-if="detailTarget" class="detail-panel">
      <h4 class="detail-panel__title">케이스 상세 — {{ detailTarget.caseName }}</h4>
      <table class="tbl">
        <thead>
          <tr>
            <th>No</th>
            <th>절차</th>
            <th>예상결과</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="(s, i) in detailTarget.steps" :key="i">
            <td>{{ i + 1 }}</td>
            <td>{{ s.procedure }}</td>
            <td>{{ s.expected }}</td>
          </tr>
        </tbody>
      </table>
    </div>

    <div class="staged">
      <h4 class="staged__title">선택된 케이스 ({{ staged.length }}건)</h4>
      <div v-if="!staged.length" class="empty staged__empty">담은 케이스가 없습니다.</div>
      <table v-else class="tbl staged__table">
        <thead>
          <tr>
            <th>시스템</th>
            <th>업무구분</th>
            <th>케이스명</th>
            <th>화면명</th>
            <th>라이브러리</th>
            <th></th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="row in staged" :key="row.key">
            <td>{{ row.system }}</td>
            <td>{{ row.bizCategory }}</td>
            <td class="name">{{ row.caseName }}</td>
            <td>{{ row.screenName }}</td>
            <td class="name">{{ row.libTitle }}</td>
            <td>
              <button type="button" class="link-btn" @click="removeStaged(row.key)">✕</button>
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <template #footer>
      <button type="button" class="btn btn--ghost" @click="close">취소</button>
      <button type="button" class="btn btn--primary" @click="confirm">케이스 저장</button>
    </template>
  </BaseModal>
</template>

<style scoped>
.filter {
  display: flex;
  align-items: flex-end;
  gap: 8px;
  margin-bottom: 12px;
  flex-wrap: wrap;
}

.fld {
  display: flex;
  flex-direction: column;
  gap: 4px;
  min-width: 120px;
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
  font-family: inherit;
  font-size: 12px;
  box-sizing: border-box;
  background: var(--lnb-side);
  color: var(--lnb-txt);
}

.filter__btn {
  height: 32px;
  flex-shrink: 0;
}

.table-wrap {
  max-height: 260px;
  overflow: auto;
  border: 1px solid var(--lnb-line);
  border-radius: 8px;
  margin-bottom: 14px;
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
  white-space: nowrap;
}

.tbl th {
  position: sticky;
  top: 0;
  background: var(--lnb-hover);
  color: var(--lnb-muted);
  font-weight: 600;
}

.tbl .name {
  max-width: 180px;
  overflow: hidden;
  text-overflow: ellipsis;
}

.empty {
  text-align: center;
  color: var(--lnb-muted);
  padding: 24px !important;
}

.staged {
  padding: 12px 14px;
  border: 1px solid var(--teal-100);
  background: var(--teal-50);
  border-radius: 8px;
}

.staged__title {
  margin: 0 0 8px;
  font-size: 12.5px;
  font-weight: 700;
  color: var(--teal-600);
}

.staged__empty {
  padding: 12px !important;
}

.staged__table {
  background: var(--lnb-side);
  border-radius: 6px;
  overflow: hidden;
}

.link-btn {
  border: none;
  background: none;
  color: var(--red);
  cursor: pointer;
  font-size: 12px;
}

.case-link {
  border: none;
  background: none;
  padding: 0;
  color: var(--teal-600);
  font-weight: 600;
  font-size: 12px;
  cursor: pointer;
  text-decoration: underline;
}

.detail-panel {
  margin-bottom: 14px;
  padding: 12px 14px;
  border: 1px solid var(--lnb-line);
  border-radius: 8px;
}

.detail-panel__title {
  margin: 0 0 8px;
  font-size: 12.5px;
  font-weight: 700;
  color: var(--lnb-txt);
}
</style>
