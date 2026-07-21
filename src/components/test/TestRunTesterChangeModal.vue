<script setup>
// 테스트 수행 · 테스터/계획일 변경 팝업
import { computed, reactive, ref, watch } from 'vue'
import BaseModal from '@/components/ui/BaseModal.vue'

const props = defineProps({
  modelValue: { type: Boolean, default: false },
  cases: { type: Array, default: () => [] },
})

const emit = defineEmits(['update:modelValue', 'save'])

const selected = ref(new Set())
const testerMode = ref('default')
const scheduleMode = ref('wbs')
const individualTester = reactive({})
const individualSchedule = reactive({})

const selectedCases = computed(() => props.cases.filter((c) => selected.value.has(c.id)))
const defaultTesterText = computed(() =>
  [...new Set(selectedCases.value.flatMap((c) => c.testers))].join(', ') || '-',
)

watch(
  () => props.modelValue,
  (open) => {
    if (!open) return
    selected.value = new Set()
    testerMode.value = 'default'
    scheduleMode.value = 'wbs'
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

function save() {
  if (!selected.value.size) {
    window.alert('변경할 케이스를 선택해 주세요.')
    return
  }
  if (!window.confirm(`선택한 ${selected.value.size}건의 테스터/계획일을 변경하시겠습니까?`)) return
  const payload = selectedCases.value.map((c) => ({
    caseId: c.id,
    tester: testerMode.value === 'individual' ? individualTester[c.id] : null,
    planStart: scheduleMode.value === 'individual' ? individualSchedule[c.id].planStart : null,
    planEnd: scheduleMode.value === 'individual' ? individualSchedule[c.id].planEnd : null,
  }))
  emit('save', payload)
  close()
}
</script>

<template>
  <BaseModal title="테스터/계획일 변경" :visible="modelValue" wide @close="close">
    <div class="section">
      <h4 class="section__title">대상 케이스 (선택 {{ selected.size }}건)</h4>
      <div class="table-wrap">
        <table class="tbl">
          <thead>
            <tr>
              <th class="col-check" />
              <th>케이스</th>
              <th>화면명</th>
              <th>테스터</th>
              <th>계획일정</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="c in cases" :key="c.id" @click="toggle(c.id)">
              <td class="col-check">
                <input type="checkbox" :checked="selected.has(c.id)" @click.stop="toggle(c.id)" />
              </td>
              <td class="name">{{ c.caseName }}</td>
              <td>{{ c.screenName }}</td>
              <td>{{ c.testers.join(', ') }}</td>
              <td>{{ c.planStart }} ~ {{ c.planEnd }}</td>
            </tr>
            <tr v-if="!cases.length">
              <td colspan="5" class="empty">대상 케이스가 없습니다.</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <div class="section">
      <h4 class="section__title">테스터</h4>
      <label class="radio-item">
        <input v-model="testerMode" type="radio" value="default" />
        기본테스터 (변경 없음) — {{ defaultTesterText }}
      </label>
      <label class="radio-item">
        <input v-model="testerMode" type="radio" value="individual" />
        개별 적용
      </label>
      <div v-if="testerMode === 'individual'" class="individual-list">
        <div v-for="c in selectedCases" :key="c.id" class="individual-row">
          <span class="individual-row__label">{{ c.caseName }}</span>
          <input v-model="individualTester[c.id]" class="inp" type="text" placeholder="테스터명" />
        </div>
      </div>
    </div>

    <div class="section">
      <h4 class="section__title">계획일</h4>
      <label class="radio-item">
        <input v-model="scheduleMode" type="radio" value="wbs" />
        WBS 일정 (변경 없음)
      </label>
      <label class="radio-item">
        <input v-model="scheduleMode" type="radio" value="individual" />
        개별 적용
      </label>
      <div v-if="scheduleMode === 'individual'" class="individual-list">
        <div v-for="c in selectedCases" :key="c.id" class="individual-row">
          <span class="individual-row__label">{{ c.caseName }}</span>
          <input v-model="individualSchedule[c.id].planStart" class="inp inp--date" type="date" />
          <span>~</span>
          <input v-model="individualSchedule[c.id].planEnd" class="inp inp--date" type="date" />
        </div>
      </div>
    </div>

    <template #footer>
      <button type="button" class="btn btn--ghost" @click="close">취소</button>
      <button type="button" class="btn btn--primary" @click="save">저장</button>
    </template>
  </BaseModal>
</template>

<style scoped>
.section {
  margin-bottom: 16px;
}

.section__title {
  margin: 0 0 8px;
  font-size: 13px;
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
  font-size: 12px;
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
  color: var(--lnb-muted);
  font-weight: 600;
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
  font-size: 12.5px;
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
  font-size: 11.5px;
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
  font-size: 12px;
  background: var(--lnb-side);
}

.inp--date {
  flex: none;
  width: 130px;
}
</style>
