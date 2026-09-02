<script setup>
// 테스트 수행 · 테스터/계획일 변경 팝업 (h-pms 이식) — POP-S-UAT-11
// h-pms는 실 API(assignTesters/fetchDefaultTesters 등)로 배선돼 있다. 이 목업은 서버 호출 없이
// props.cases(케이스 목록)에서 뽑은 "테스터 전체 목록"을 프로젝트 기본 테스터 풀로 대신하고,
// 계획일은 각 케이스에 이미 있는 planStart/planEnd를 'WBS 일정'으로 대신한다.
import { computed, reactive, ref, watch } from 'vue'
import BaseModal from '@/shared/ui/BaseModal.vue'
import { bizCategoryOptions, systemOptions } from '@/shared/lib/testConfig'

const props = defineProps({
  modelValue: { type: Boolean, default: false },
  cases: { type: Array, default: () => [] },
})

const emit = defineEmits(['update:modelValue', 'save'])

const activeTab = ref('tester')
const search = reactive({ system: '전체', bizCategory: '전체', keyword: '' })
const selected = ref(new Set())

const testerApplyMode = ref('default')
/** 선택된 케이스 전체에 한 벌만 적용한다(케이스별로 따로 두지 않는다 — SB 우측 팝업 목업). */
const individualTesters = ref([])
const addTesterPick = ref('')

const scheduleApplyMode = ref('wbs')
const individualSchedule = reactive({ planStart: '', planEnd: '' })

const filteredCases = computed(() =>
  props.cases.filter((c) => {
    if (search.system !== '전체' && !(c.systemPath || '').startsWith(search.system)) return false
    if (search.bizCategory !== '전체' && c.bizCategory !== search.bizCategory) return false
    const kw = search.keyword.trim().toLowerCase()
    if (kw && !(c.screenName || '').toLowerCase().includes(kw)) return false
    return true
  }),
)

const selectedCases = computed(() => props.cases.filter((c) => selected.value.has(c.id)))
const allSelected = computed(
  () => filteredCases.value.length > 0 && filteredCases.value.every((c) => selected.value.has(c.id)),
)

/** 프로젝트 기본 테스터 풀 — 실 API의 "프로젝트 정보에 설정된 테스터" 대신, 모든 케이스에 등장하는
 * 테스터 전체를 하나의 풀로 삼는다. */
const defaultTesterPool = computed(() => [...new Set(props.cases.flatMap((c) => c.testers))])

const testerInfoList = computed(() =>
  testerApplyMode.value === 'default' ? defaultTesterPool.value : individualTesters.value,
)
const availableTestersToAdd = computed(() =>
  defaultTesterPool.value.filter((name) => !individualTesters.value.includes(name)),
)

function addTesterFromPick() {
  const name = addTesterPick.value
  if (!name) return
  if (!individualTesters.value.includes(name)) individualTesters.value = [...individualTesters.value, name]
  addTesterPick.value = ''
}

function removeTesterTag(name) {
  individualTesters.value = individualTesters.value.filter((n) => n !== name)
}

/** 개별적용은 빈 상태에서 시작하지 않는다 — 기본 테스터 풀을 시작값으로 채운 뒤 거기서 빼거나 더한다. */
watch(testerApplyMode, (mode) => {
  if (mode === 'individual' && !individualTesters.value.length) {
    individualTesters.value = [...defaultTesterPool.value]
  }
})

/** 선택한 케이스가 여러 건이면 계획일이 다를 수 있어, 처음 선택된 케이스의 계획일을 시작값으로 채운다. */
watch(scheduleApplyMode, (mode) => {
  if (mode === 'individual' && !individualSchedule.planStart && !individualSchedule.planEnd) {
    const first = selectedCases.value[0]
    individualSchedule.planStart = first?.planStart || ''
    individualSchedule.planEnd = first?.planEnd || ''
  }
})

const schedulePreviewRows = computed(() =>
  selectedCases.value.map((c) => ({
    id: c.id,
    caseId: c.caseId,
    caseName: c.caseName || c.caseId,
    before: `${c.planStart || '-'} ~ ${c.planEnd || '-'}`,
    after: `${individualSchedule.planStart || '-'} ~ ${individualSchedule.planEnd || '-'}`,
  })),
)

watch(
  () => props.modelValue,
  (open) => {
    if (!open) return
    activeTab.value = 'tester'
    search.system = '전체'
    search.bizCategory = '전체'
    search.keyword = ''
    selected.value = new Set()
    testerApplyMode.value = 'default'
    individualTesters.value = []
    addTesterPick.value = ''
    scheduleApplyMode.value = 'wbs'
    individualSchedule.planStart = ''
    individualSchedule.planEnd = ''
  },
)

function toggleAll() {
  selected.value = allSelected.value ? new Set() : new Set(filteredCases.value.map((c) => c.id))
}

function toggle(id) {
  const next = new Set(selected.value)
  if (next.has(id)) next.delete(id)
  else next.add(id)
  selected.value = next
}

function close() {
  emit('update:modelValue', false)
}

function testerConfirmMessage() {
  if (testerApplyMode.value === 'default') {
    return `선택한 테스트 케이스 ${selected.value.size}건에\n프로젝트 기본 테스터를 적용하시겠습니까?`
  }
  const names = individualTesters.value
  return `선택한 테스트 케이스 ${selected.value.size}건에\n선택한 테스터를 적용하시겠습니까?\n적용 테스터 : ${names.length}명(${names.join(', ')})`
}

function saveTesters() {
  if (!selected.value.size) {
    window.alert('변경할 케이스를 선택해 주세요.')
    return
  }
  if (testerApplyMode.value === 'default' && !defaultTesterPool.value.length) {
    window.alert('프로젝트에 등록된 기본 테스터가 없습니다.')
    return
  }
  if (testerApplyMode.value === 'individual' && !individualTesters.value.length) {
    window.alert('적용할 테스터를 선택해 주세요.')
    return
  }
  if (!window.confirm(testerConfirmMessage())) return
  const names = testerApplyMode.value === 'default' ? defaultTesterPool.value : individualTesters.value
  const payload = selectedCases.value.map((c) => ({ caseId: c.id, tester: names.join(', ') }))
  emit('save', payload)
  close()
}

function saveSchedule() {
  if (!selected.value.size) {
    window.alert('변경할 케이스를 선택해 주세요.')
    return
  }
  if (scheduleApplyMode.value === 'wbs') {
    const missing = selectedCases.value.find((c) => !c.planStart || !c.planEnd)
    if (missing) {
      window.alert('일정이 등록되지 않았습니다. 일정을 등록하세요.')
      return
    }
    window.alert('WBS 일정에는 변경사항이 없습니다.')
    close()
    return
  }
  if (!individualSchedule.planStart || !individualSchedule.planEnd) {
    window.alert('테스트일정을 입력해 주세요.')
    return
  }
  if (individualSchedule.planStart > individualSchedule.planEnd) {
    window.alert('계획 시작일이 종료일보다 늦습니다.')
    return
  }
  const lines = schedulePreviewRows.value.map((r) => `${r.caseId} | ${r.caseName} ${r.before} → ${r.after}`)
  const msg = [`선택한 테스트 케이스 ${selected.value.size}건에\n계획일을 적용하시겠습니까?`, '', ...lines].join('\n')
  if (!window.confirm(msg)) return
  const payload = selectedCases.value.map((c) => ({
    caseId: c.id,
    planStart: individualSchedule.planStart,
    planEnd: individualSchedule.planEnd,
  }))
  emit('save', payload)
  close()
}

function save() {
  if (activeTab.value === 'tester') saveTesters()
  else saveSchedule()
}
</script>

<template>
  <BaseModal title="테스터/계획일 관리" :visible="modelValue" wide @close="close">
    <div class="btn-group tab-switch">
      <button type="button" :class="{ 'is-on': activeTab === 'tester' }" @click="activeTab = 'tester'">테스터 관리</button>
      <button type="button" :class="{ 'is-on': activeTab === 'schedule' }" @click="activeTab = 'schedule'">계획일 관리</button>
    </div>

    <div class="section">
      <h4 class="section__title">1. 케이스 선택 (선택 : 총 {{ selected.size }}개)</h4>
      <div class="search-row">
        <div class="fld">
          <label>시스템구분</label>
          <select v-model="search.system" class="inp inp--select">
            <option v-for="s in systemOptions" :key="s" :value="s">{{ s }}</option>
          </select>
        </div>
        <div class="fld">
          <label>업무구분</label>
          <select v-model="search.bizCategory" class="inp inp--select">
            <option v-for="b in bizCategoryOptions" :key="b" :value="b">{{ b }}</option>
          </select>
        </div>
        <div class="fld fld--grow">
          <label>화면(메뉴)</label>
          <input v-model="search.keyword" class="inp" type="text" placeholder="화면명 검색" />
        </div>
      </div>

      <div class="table-wrap">
        <table class="tbl">
          <thead>
            <tr>
              <th class="col-check">
                <input type="checkbox" :checked="allSelected" :disabled="!filteredCases.length" @click.stop="toggleAll" />
              </th>
              <th>시스템/업무/화면경로</th>
              <th>화면명</th>
              <th>케이스ID</th>
              <th>케이스명</th>
              <th>계획일</th>
              <th>테스터</th>
            </tr>
          </thead>
          <tbody>
            <tr
              v-for="c in filteredCases"
              :key="c.id"
              :class="{ 'is-on': selected.has(c.id) }"
              @click="toggle(c.id)"
            >
              <td class="col-check">
                <input type="checkbox" :checked="selected.has(c.id)" @click.stop="toggle(c.id)" />
              </td>
              <td>{{ c.systemPath || '-' }}</td>
              <td>{{ c.screenName || '-' }}</td>
              <td>{{ c.caseId }}</td>
              <td class="name">{{ c.caseName }}</td>
              <td>{{ c.planStart }} ~ {{ c.planEnd }}</td>
              <td class="testers">{{ c.testers.join(', ') || '-' }}</td>
            </tr>
            <tr v-if="!filteredCases.length">
              <td colspan="7" class="empty">대상 케이스가 없습니다.</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <div v-if="activeTab === 'tester'" class="section">
      <h4 class="section__title">2. 관리 항목</h4>
      <p class="guide">테스트 진행 전 혹은 진행 중 각 케이스에 배정된 테스터를 추가/변경합니다.</p>
      <label class="radio-item">
        <input v-model="testerApplyMode" type="radio" value="default" />
        프로젝트 기본 테스터 <span class="muted">(프로젝트 정보에 설정된 테스터, 편집 불가)</span>
      </label>
      <label class="radio-item">
        <input v-model="testerApplyMode" type="radio" value="individual" />
        개별적용 <span class="muted">(프로젝트 기본 테스터에서 편집 가능)</span>
      </label>

      <p class="tag-section__label">테스터 정보 (총 {{ testerInfoList.length }}명)</p>
      <div class="tag-input">
        <span v-for="name in testerInfoList" :key="name" class="tag">
          {{ name }}
          <button v-if="testerApplyMode === 'individual'" type="button" @click.stop="removeTesterTag(name)">✕</button>
        </span>
        <select
          v-if="testerApplyMode === 'individual' && availableTestersToAdd.length"
          v-model="addTesterPick"
          class="tag-select"
          @change="addTesterFromPick"
        >
          <option value="" disabled>테스터 추가…</option>
          <option v-for="name in availableTestersToAdd" :key="name" :value="name">{{ name }}</option>
        </select>
        <span v-else-if="!testerInfoList.length" class="tag-hint">테스터 정보가 없습니다.</span>
      </div>
    </div>

    <div v-else class="section">
      <h4 class="section__title">2. 관리 항목</h4>
      <p class="guide">테스트 진행 전에 각 케이스별 테스트 계획일을 변경합니다.</p>
      <label class="radio-item">
        <input v-model="scheduleApplyMode" type="radio" value="wbs" />
        WBS 일정 <span class="muted">(변경 없음)</span>
      </label>
      <label class="radio-item">
        <input v-model="scheduleApplyMode" type="radio" value="individual" />
        개별적용 <span class="muted">(시작일·종료일 편집 가능)</span>
      </label>

      <div v-if="scheduleApplyMode === 'individual'" class="schedule-apply">
        <span class="schedule-apply__label">테스트일정 <span class="req">*</span></span>
        <input v-model="individualSchedule.planStart" class="inp inp--date" type="date" @click="$event.target.showPicker?.()" />
        <span>~</span>
        <input v-model="individualSchedule.planEnd" class="inp inp--date" type="date" @click="$event.target.showPicker?.()" />
      </div>

      <div v-if="scheduleApplyMode === 'individual' && selectedCases.length" class="schedule-preview">
        <p class="tag-section__label">일정 변경 정보 (총 {{ selectedCases.length }}건)</p>
        <p v-for="r in schedulePreviewRows" :key="r.id" class="schedule-preview__row">
          {{ r.caseId }} | {{ r.caseName }} <span class="before">{{ r.before }}</span> →
          <span class="after">{{ r.after }}</span>
        </p>
      </div>
    </div>

    <template #footer>
      <button type="button" class="btn btn--ghost" @click="close">취소</button>
      <button type="button" class="btn btn--primary" @click="save">저장</button>
    </template>
  </BaseModal>
</template>

<style scoped>
.tab-switch {
  display: flex;
  margin-bottom: 16px;
}

.tab-switch > * {
  flex: 1;
  text-align: center;
  height: 34px;
  border: 1px solid var(--line);
  background: var(--field);
  color: var(--muted);
  font-family: inherit;
  font-size: calc(12.5px + var(--font-size-offset, 0px));
  font-weight: 600;
  cursor: pointer;
}

.tab-switch > *:first-child {
  border-radius: 8px 0 0 8px;
}

.tab-switch > *:last-child {
  border-radius: 0 8px 8px 0;
  border-left: none;
}

.tab-switch > .is-on {
  background: var(--teal-50);
  border-color: var(--teal-600);
  color: var(--teal-600);
}

.section {
  margin-bottom: 16px;
}

.section__title {
  margin: 0 0 8px;
  font-size: calc(13px + var(--font-size-offset, 0px));
  font-weight: 700;
}

.guide {
  margin: 0 0 10px;
  font-size: calc(11.5px + var(--font-size-offset, 0px));
  color: var(--muted);
}

.search-row {
  display: flex;
  gap: 10px;
  margin-bottom: 10px;
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
  color: var(--muted);
}

.table-wrap {
  max-height: 220px;
  overflow: auto;
  border: 1px solid var(--line);
  border-radius: 8px;
}

.tbl {
  width: 100%;
  border-collapse: collapse;
  font-size: calc(12px + var(--font-size-offset, 0px));
}

.tbl th,
.tbl td {
  padding: 7px 9px;
  border-bottom: 1px solid var(--line);
  text-align: left;
  white-space: nowrap;
}

.tbl th {
  position: sticky;
  top: 0;
  background: var(--field);
  color: var(--ink);
  font-weight: 600;
  text-align: center;
}

.tbl tbody tr {
  cursor: pointer;
}

.tbl tbody tr:hover,
.tbl tbody tr.is-on {
  background: var(--teal-50);
}

.tbl .name {
  max-width: 200px;
  overflow: hidden;
  text-overflow: ellipsis;
}

/* 테스터 컬럼은 콤마로 이어붙인 이름 목록이라 케이스마다 길이가 들쭉날쭉하다 — 줄바꿈으로 흡수한다. */
.tbl .testers {
  white-space: normal;
  word-break: break-word;
  max-width: 260px;
}

.col-check {
  width: 32px;
}

.empty {
  text-align: center;
  color: var(--muted);
  padding: 20px !important;
}

.radio-item {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: calc(12.5px + var(--font-size-offset, 0px));
  margin-bottom: 6px;
  cursor: pointer;
}

.muted {
  color: var(--muted);
  font-size: calc(11px + var(--font-size-offset, 0px));
}

.req {
  color: var(--red);
}

.tag-section__label {
  margin: 10px 0 6px;
  font-size: calc(12px + var(--font-size-offset, 0px));
  font-weight: 600;
  color: var(--ink);
}

.tag-input {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 6px;
  min-height: 34px;
  padding: 6px 8px;
  border: 1px solid var(--line);
  border-radius: 8px;
  background: var(--field);
}

.tag {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  height: 24px;
  padding: 0 4px 0 10px;
  border-radius: 12px;
  background: var(--teal-50);
  color: var(--teal-600);
  font-size: calc(11.5px + var(--font-size-offset, 0px));
}

.tag button {
  border: none;
  background: none;
  cursor: pointer;
  color: var(--teal-600);
  font-size: calc(10px + var(--font-size-offset, 0px));
}

.tag-select {
  flex: 1;
  min-width: 140px;
  height: 26px;
  border: none;
  background: none;
  font-family: inherit;
  font-size: calc(12px + var(--font-size-offset, 0px));
  color: var(--ink);
}

.tag-hint {
  font-size: calc(11px + var(--font-size-offset, 0px));
  color: var(--muted);
}

.schedule-apply {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-top: 10px;
}

.schedule-apply__label {
  font-size: calc(12.5px + var(--font-size-offset, 0px));
  font-weight: 600;
  color: var(--ink);
  white-space: nowrap;
}

.schedule-preview {
  margin-top: 10px;
  padding: 10px 12px;
  background: var(--field);
  border-radius: 8px;
}

.schedule-preview__row {
  margin: 0 0 4px;
  font-size: calc(12px + var(--font-size-offset, 0px));
  color: var(--ink-2);
}

.schedule-preview__row:last-child {
  margin-bottom: 0;
}

.before {
  color: var(--muted);
}

.after {
  color: var(--teal-600);
  font-weight: 600;
}

.inp {
  height: 30px;
  padding: 0 8px;
  border: 1px solid var(--line);
  border-radius: 6px;
  font-family: inherit;
  font-size: calc(12px + var(--font-size-offset, 0px));
  background: var(--color-surface);
  box-sizing: border-box;
}

.inp--select {
  min-width: 120px;
}

.fld--grow .inp,
.fld .inp {
  width: 100%;
}

.inp--date {
  width: 130px;
}
</style>
