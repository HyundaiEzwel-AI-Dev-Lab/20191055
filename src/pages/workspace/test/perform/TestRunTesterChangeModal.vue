<script setup>
// 테스트 수행 · 테스터/계획일 변경 팝업
import { computed, reactive, ref, watch } from 'vue'
import BaseModal from '@/shared/ui/BaseModal.vue'

const props = defineProps({
  modelValue: { type: Boolean, default: false },
  cases: { type: Array, default: () => [] },
})

const emit = defineEmits(['update:modelValue', 'save'])

const activeTab = ref('tester')
const selected = ref(new Set())
const testerMode = ref('default')
const scheduleMode = ref('individual')
const individualTester = reactive({})
const individualSchedule = reactive({})

const searchFilters = ref({ system: '', bizCategory: '', screen: '' })

const filteredCases = computed(() =>
  props.cases.filter((c) => {
    const f = searchFilters.value
    if (f.system && !(c.systemPath || '').includes(f.system)) return false
    if (f.bizCategory && !(c.systemPath || '').includes(f.bizCategory)) return false
    if (f.screen && !(c.screenName || '').toLowerCase().includes(f.screen.trim().toLowerCase())) return false
    return true
  }),
)

const selectedCases = computed(() => props.cases.filter((c) => selected.value.has(c.id)))
const defaultTesterText = computed(() =>
  [...new Set(selectedCases.value.flatMap((c) => c.testers))].join(', ') || '-',
)

function addTesterTag(caseId, name) {
  const trimmed = (name || '').trim()
  if (!trimmed) return
  const cur = individualTester[caseId] ? individualTester[caseId].split(',').map((s) => s.trim()).filter(Boolean) : []
  if (!cur.includes(trimmed)) cur.push(trimmed)
  individualTester[caseId] = cur.join(', ')
}

function removeTesterTag(caseId, name) {
  const cur = (individualTester[caseId] || '').split(',').map((s) => s.trim()).filter(Boolean)
  individualTester[caseId] = cur.filter((n) => n !== name).join(', ')
}

function onTesterTagInput(e, caseId) {
  const val = e.target.value
  if (val.endsWith(',')) {
    addTesterTag(caseId, val.slice(0, -1))
    e.target.value = ''
  }
}

watch(
  () => props.modelValue,
  (open) => {
    if (!open) return
    activeTab.value = 'tester'
    selected.value = new Set()
    testerMode.value = 'default'
    scheduleMode.value = 'individual'
    searchFilters.value = { system: '', bizCategory: '', screen: '' }
    Object.keys(individualTester).forEach((k) => delete individualTester[k])
    Object.keys(individualSchedule).forEach((k) => delete individualSchedule[k])
    props.cases.forEach((c) => {
      individualTester[c.id] = c.testers.join(', ')
      individualSchedule[c.id] = { planStart: c.planStart, planEnd: c.planEnd }
    })
  },
)

function toggle(id) {
  const next = new Set(selected.value)
  if (next.has(id)) next.delete(id)
  else next.add(id)
  selected.value = next
}

function close() {
  emit('update:modelValue', false)
}

function saveTester() {
  if (!selected.value.size) {
    window.alert('변경할 케이스를 선택해 주세요.')
    return
  }
  const n = selected.value.size
  let msg
  if (testerMode.value === 'default') {
    msg = `선택한 테스트 케이스 ${n}건에 프로젝트 기본 테스터를 적용하시겠습니까?`
  } else {
    const names = [...new Set(selectedCases.value.flatMap((c) => (individualTester[c.id] || '').split(',').map((s) => s.trim()).filter(Boolean)))]
    msg = `선택한 테스트 케이스 ${n}건에 선택한 테스터를 적용하시겠습니까?\n적용테스터 : ${names.length}명(${names.join(', ')})`
  }
  if (!window.confirm(msg)) return
  const payload = selectedCases.value.map((c) => ({
    caseId: c.id,
    tester: testerMode.value === 'individual' ? individualTester[c.id] : null,
  }))
  emit('save', payload)
  close()
}

function saveSchedule() {
  if (!selected.value.size) {
    window.alert('변경할 케이스를 선택해 주세요.')
    return
  }
  const n = selected.value.size
  const first = selectedCases.value[0]
  const before = `${first.planStart} ~ ${first.planEnd}`
  const after = `${individualSchedule[first.id].planStart} ~ ${individualSchedule[first.id].planEnd}`
  const suffix = n > 1 ? ` (외 ${n - 1}건)` : ''
  const msg =
    `선택한 테스트 케이스 ${n}건에 계획일을 적용하시겠습니까?\n` +
    `기존일정 : ${before}${suffix}\n변경일정 : ${after}${suffix}`
  if (!window.confirm(msg)) return
  const payload = selectedCases.value.map((c) => ({
    caseId: c.id,
    planStart: individualSchedule[c.id].planStart,
    planEnd: individualSchedule[c.id].planEnd,
  }))
  emit('save', payload)
  close()
}
</script>

<template>
  <BaseModal title="테스터/계획일 관리" :visible="modelValue" wide @close="close">
    <div class="section card">
      <h4 class="section__title">대상 케이스 선택 (선택 {{ selected.size }}건)</h4>
      <div class="search-row">
        <div class="fld">
          <label>시스템구분</label>
          <input v-model="searchFilters.system" class="inp" type="text" placeholder="시스템" />
        </div>
        <div class="fld">
          <label>업무구분</label>
          <input v-model="searchFilters.bizCategory" class="inp" type="text" placeholder="업무구분" />
        </div>
        <div class="fld fld--grow">
          <label>화면(메뉴)</label>
          <input v-model="searchFilters.screen" class="inp" type="text" placeholder="화면명 검색" />
        </div>
      </div>
      <div class="table-wrap">
        <table class="tbl">
          <thead>
            <tr>
              <th class="col-check" />
              <th>시스템/업무/화면경로</th>
              <th>화면명</th>
              <th>케이스ID</th>
              <th>케이스명</th>
              <th>테스터</th>
              <th>계획일정</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="c in filteredCases" :key="c.id" @click="toggle(c.id)">
              <td class="col-check">
                <input type="checkbox" :checked="selected.has(c.id)" @click.stop="toggle(c.id)" />
              </td>
              <td>{{ c.systemPath || '-' }}</td>
              <td>{{ c.screenName }}</td>
              <td>{{ c.caseId }}</td>
              <td class="name">{{ c.caseName }}</td>
              <td>{{ c.testers.join(', ') }}</td>
              <td>{{ c.planStart }} ~ {{ c.planEnd }}</td>
            </tr>
            <tr v-if="!filteredCases.length">
              <td colspan="7" class="empty">대상 케이스가 없습니다.</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <div class="section card">
      <h4 class="section__title">관리 항목</h4>
      <div class="tabs">
        <button type="button" class="tab" :class="{ 'is-on': activeTab === 'tester' }" @click="activeTab = 'tester'">
          테스터관리
        </button>
        <button type="button" class="tab" :class="{ 'is-on': activeTab === 'schedule' }" @click="activeTab = 'schedule'">
          계획일 관리
        </button>
      </div>

      <div v-if="activeTab === 'tester'" class="tab-panel">
        <p class="guide">
          테스트 진행 전 혹은 진행 중 각 케이스에 배정된 테스터를 추가/변경하는 기능입니다.<br />
          · '프로젝트 기본 테스터' : 프로젝트 관리 &gt; 프로젝트 정보에 설정된 테스터가 그대로 적용됩니다. (편집 불가)<br />
          · 개별 적용 : 프로젝트 기본 테스터에서 편집할 수 있습니다.
        </p>
        <label class="radio-item">
          <input v-model="testerMode" type="radio" value="default" />
          프로젝트 기본 테스터 (변경 없음) — {{ defaultTesterText }}
        </label>
        <label class="radio-item">
          <input v-model="testerMode" type="radio" value="individual" />
          개별 적용
        </label>
        <div v-if="testerMode === 'individual'" class="individual-list">
          <div v-for="c in selectedCases" :key="c.id" class="individual-row">
            <span class="individual-row__label">{{ c.caseName }}</span>
            <div class="tag-input">
              <span
                v-for="name in (individualTester[c.id] || '').split(',').map((s) => s.trim()).filter(Boolean)"
                :key="name"
                class="tag"
              >
                {{ name }}
                <button type="button" @click="removeTesterTag(c.id, name)">✕</button>
              </span>
              <input type="text" placeholder="테스터명 입력 후 , (쉼표)" @keyup="onTesterTagInput($event, c.id)" />
            </div>
          </div>
        </div>
      </div>

      <div v-else class="tab-panel">
        <p class="guide">테스트 진행 전에 각 케이스별 테스트 계획일을 변경하는 화면입니다.<br />· 개별 적용 : 시작일과 종료일을 편집할 수 있습니다.</p>
        <label class="radio-item">
          <input v-model="scheduleMode" type="radio" value="individual" checked />
          개별적용
        </label>
        <p class="schedule-count">일정 변경 정보 (총 <b>{{ selected.size }}</b>건)</p>
        <div class="individual-list">
          <div v-for="c in selectedCases" :key="c.id" class="individual-row">
            <span class="individual-row__label">{{ c.caseName }}</span>
            <input v-model="individualSchedule[c.id].planStart" class="inp inp--date" type="date" @click="$event.target.showPicker?.()" />
            <span>~</span>
            <input v-model="individualSchedule[c.id].planEnd" class="inp inp--date" type="date" @click="$event.target.showPicker?.()" />
          </div>
        </div>
      </div>
    </div>

    <template #footer>
      <button type="button" class="btn btn--ghost" @click="close">취소</button>
      <button
        type="button"
        class="btn btn--primary"
        @click="activeTab === 'tester' ? saveTester() : saveSchedule()"
      >
        저장
      </button>
    </template>
  </BaseModal>
</template>

<style scoped>
.card {
  border: 1px solid var(--lnb-line);
  border-radius: 10px;
  padding: 14px 16px;
}

.section {
  margin-bottom: 16px;
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
  color: var(--lnb-muted);
}

.tabs {
  display: flex;
  gap: 8px;
  margin-bottom: 12px;
  border-bottom: 1px solid var(--lnb-line);
}

.tab {
  height: 34px;
  padding: 0 14px;
  border: none;
  background: none;
  color: var(--lnb-muted);
  font-family: inherit;
  font-size: calc(12.5px + var(--font-size-offset, 0px));
  font-weight: 600;
  cursor: pointer;
  border-bottom: 2px solid transparent;
}

.tab.is-on {
  color: var(--teal-600);
  border-bottom-color: var(--teal-600);
}

.tab-panel {
  padding-top: 4px;
}

.guide {
  margin: 0 0 10px;
  padding: 10px 12px;
  background: var(--teal-50);
  border-radius: 8px;
  font-size: calc(11.5px + var(--font-size-offset, 0px));
  color: var(--teal-700);
  line-height: 1.6;
}

.schedule-count {
  margin: 8px 0;
  font-size: calc(12px + var(--font-size-offset, 0px));
}

.schedule-count b {
  color: var(--teal-600);
  font-weight: 700;
}

.tag-input {
  flex: 1;
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 6px;
  min-height: 30px;
  padding: 4px 6px;
  border: 1px solid var(--lnb-line);
  border-radius: 6px;
  background: var(--lnb-side);
}

.tag {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  height: 22px;
  padding: 0 4px 0 8px;
  border-radius: 12px;
  background: var(--teal-50);
  color: var(--teal-700);
  font-size: calc(11.5px + var(--font-size-offset, 0px));
}

.tag button {
  border: none;
  background: none;
  cursor: pointer;
  color: var(--teal-700);
  font-size: calc(10px + var(--font-size-offset, 0px));
}

.tag-input input {
  flex: 1;
  min-width: 100px;
  border: none;
  background: none;
  font-family: inherit;
  font-size: calc(12px + var(--font-size-offset, 0px));
  color: var(--lnb-txt);
}

.tag-input input:focus {
  outline: none;
}

.section__title {
  margin: 0 0 8px;
  padding-bottom: 8px;
  border-bottom: 1px solid var(--lnb-line);
  font-size: calc(13px + var(--font-size-offset, 0px));
  font-weight: 700;
}

.table-wrap {
  max-height: 200px;
  overflow: auto;
  border: 1px solid var(--lnb-line);
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
  border-bottom: 1px solid var(--lnb-line);
  text-align: left;
  white-space: nowrap;
}

.tbl th {
  position: sticky;
  top: 0;
  background: var(--lnb-hover);
  color: var(--lnb-txt);
  font-weight: 600;
  text-align: center;
}

.tbl tr {
  cursor: pointer;
}

.tbl .name {
  max-width: 200px;
  overflow: hidden;
  text-overflow: ellipsis;
}

.col-check {
  width: 32px;
}

.empty {
  text-align: center;
  color: var(--lnb-muted);
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

.individual-list {
  margin-top: 8px;
  padding: 10px;
  background: var(--lnb-hover);
  border-radius: 8px;
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.individual-row {
  display: flex;
  align-items: center;
  gap: 8px;
}

.individual-row__label {
  min-width: 140px;
  font-size: calc(11.5px + var(--font-size-offset, 0px));
  color: var(--lnb-muted);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.inp {
  flex: 1;
  height: 30px;
  padding: 0 8px;
  border: 1px solid var(--lnb-line);
  border-radius: 6px;
  font-family: inherit;
  font-size: calc(12px + var(--font-size-offset, 0px));
  background: var(--lnb-side);
}

.inp--date {
  flex: none;
  width: 130px;
}
</style>
