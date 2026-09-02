<script setup>
// 테스트 수행 · 수행정보 등록/상세 팝업 — 테스터별 계획일/수행일/메모 (h-pms 이식)
import { computed, reactive, watch } from 'vue'
import BaseModal from '@/shared/ui/BaseModal.vue'

const props = defineProps({
  modelValue: { type: Boolean, default: false },
  caseRow: { type: Object, default: null },
})

const emit = defineEmits(['update:modelValue', 'save'])

const form = reactive({})

const modalTitle = computed(() => `수행정보 (${props.caseRow?.testers.length || 0})`)
const testerCountLabel = computed(() => {
  const count = props.caseRow?.testers.length || 0
  return count ? `${count}명` : '-'
})
const stepCountLabel = computed(() => {
  const count = props.caseRow?.stepTotal ?? props.caseRow?.steps?.length
  return count == null ? '-' : String(count)
})

function findExecDate(caseRow, name) {
  const dates = (caseRow.steps || [])
    .map((s) => s.byTester?.[name]?.executedAt)
    .filter(Boolean)
    .sort()
  return dates[0] || ''
}

watch(
  () => props.modelValue,
  (open) => {
    if (!open || !props.caseRow) return
    Object.keys(form).forEach((k) => delete form[k])
    for (const name of props.caseRow.testers) {
      const existing = props.caseRow.testerInfo?.[name]
      form[name] = {
        planStart: existing?.planStart || props.caseRow.planStart || '',
        planEnd: existing?.planEnd || props.caseRow.planEnd || '',
        execDate: findExecDate(props.caseRow, name),
        memo: existing?.memo || '',
      }
    }
  },
)

/** 메모 칸을 입력창 스크롤 없이 내용만큼 늘어나게 한다(마운트·값 변경 양쪽에서 재측정). */
function resizeTextarea(el) {
  el.style.height = 'auto'
  el.style.height = `${el.scrollHeight}px`
}
const vAutoGrow = {
  mounted: (el) => resizeTextarea(el),
  updated: (el) => resizeTextarea(el),
}

function close() {
  emit('update:modelValue', false)
}

function save() {
  const invalidName = Object.keys(form).find(
    (name) => form[name].planStart && form[name].planEnd && form[name].planStart > form[name].planEnd,
  )
  if (invalidName) {
    window.alert(`${invalidName}: 계획 시작일이 종료일보다 늦습니다.`)
    return
  }
  if (!window.confirm('수행정보를 저장하시겠습니까?')) return
  emit('save', { ...form })
  close()
}
</script>

<template>
  <BaseModal :title="modalTitle" :visible="modelValue" wide @close="close">
    <template v-if="caseRow">
      <p class="guide">{{ caseRow.caseName || caseRow.caseId }} — 테스터별 계획일/수행일/메모를 입력하세요.</p>

      <table class="summary-tbl">
        <tbody>
          <tr>
            <th>시나리오정보</th>
            <td>{{ caseRow.round ? `${caseRow.round} 시나리오` : '-' }}</td>
            <th>시스템/업무/화면경로</th>
            <td>{{ caseRow.systemPath || '-' }}</td>
            <th>화면명</th>
            <td>{{ caseRow.screenName || '-' }}</td>
          </tr>
          <tr>
            <th>케이스ID</th>
            <td>{{ caseRow.caseId || '-' }}</td>
            <th>케이스명</th>
            <td>{{ caseRow.caseName || '-' }}</td>
            <th>계획일</th>
            <td>{{ caseRow.planStart || '-' }} ~ {{ caseRow.planEnd || '-' }}</td>
          </tr>
          <tr>
            <th>테스터</th>
            <td>{{ testerCountLabel }}</td>
            <th>절차수</th>
            <td>{{ stepCountLabel }}</td>
            <th>요구사항ID</th>
            <td>{{ caseRow.reqId || '-' }}</td>
          </tr>
        </tbody>
      </table>

      <table v-if="caseRow.testers.length" class="tbl">
        <colgroup>
          <col class="col-tester" />
          <col class="col-plan" />
          <col class="col-exec" />
          <col class="col-memo" />
        </colgroup>
        <thead>
          <tr>
            <th>테스터</th>
            <th>계획일</th>
            <th>수행일</th>
            <th>메모</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="name in caseRow.testers" :key="name">
            <td>{{ name }}</td>
            <td class="plan-range">
              <input v-model="form[name].planStart" class="inp inp--date" type="date" @click="$event.target.showPicker?.()" />
              <span>~</span>
              <input v-model="form[name].planEnd" class="inp inp--date" type="date" @click="$event.target.showPicker?.()" />
            </td>
            <td class="exec-date">{{ form[name].execDate || '-' }}</td>
            <td>
              <textarea
                v-model="form[name].memo"
                v-auto-grow="form[name].memo"
                class="inp inp--memo"
                rows="1"
                maxlength="200"
                placeholder="메모 입력"
              />
            </td>
          </tr>
        </tbody>
      </table>
      <p v-else class="empty">이 케이스에 배정된 테스터가 없습니다.</p>
    </template>

    <template #footer>
      <button type="button" class="btn btn--ghost" @click="close">취소</button>
      <button type="button" class="btn btn--primary" :disabled="!caseRow?.testers.length" @click="save">저장</button>
    </template>
  </BaseModal>
</template>

<style scoped>
.guide {
  margin: 0 0 12px;
  font-size: calc(12px + var(--font-size-offset, 0px));
  color: var(--muted);
}

/* h-pms 이식 — 테두리 없는 라벨/값 나열이 아니라 실제 표로. 아래 테스터별 표(.tbl)와 같은
   테두리·헤더 배경으로 맞춰 한 톤으로 보이게 한다. */
.summary-tbl {
  width: 100%;
  margin-bottom: 14px;
  border-collapse: collapse;
  table-layout: fixed;
  font-size: calc(12px + var(--font-size-offset, 0px));
}

.summary-tbl th,
.summary-tbl td {
  padding: 8px 10px;
  border: 1px solid var(--line);
  text-align: left;
}

.summary-tbl th {
  width: 13%;
  background: var(--field);
  font-weight: 600;
  color: var(--muted);
  white-space: nowrap;
}

.summary-tbl td {
  width: 20.33%;
  color: var(--ink);
}

.plan-range {
  display: flex;
  align-items: center;
  gap: 6px;
}

.empty {
  padding: 32px 16px;
  text-align: center;
  font-size: calc(12px + var(--font-size-offset, 0px));
  color: var(--muted);
}

/* h-pms 이식 — 계획일/수행일 컬럼은 값이 딱 들어갈 만큼만 좁히고, 줄어든 폭을 메모 컬럼에
   넘긴다(table-layout:fixed + colgroup). */
.tbl {
  width: 100%;
  table-layout: fixed;
  border-collapse: collapse;
  font-size: calc(12px + var(--font-size-offset, 0px));
}

.col-tester {
  width: 118px;
}

.col-plan {
  width: 262px;
}

.col-exec {
  width: 100px;
}

.tbl th,
.tbl td {
  padding: 8px 10px;
  border: 1px solid var(--line);
  text-align: left;
}

.tbl th {
  background: var(--field);
  font-weight: 600;
  text-align: center;
}

.inp {
  width: 100%;
  height: 30px;
  padding: 0 8px;
  border: 1px solid var(--line);
  border-radius: 6px;
  font-family: inherit;
  font-size: calc(12px + var(--font-size-offset, 0px));
  box-sizing: border-box;
  background: var(--color-surface);
}

.inp--date {
  min-width: 0;
}

.inp--memo {
  resize: none;
  overflow: hidden;
  min-height: 30px;
  height: auto;
  padding: 6px 8px;
  line-height: 1.5;
  white-space: pre-wrap;
  word-break: break-word;
  font-family: inherit;
}

.exec-date {
  color: var(--muted);
}
</style>
