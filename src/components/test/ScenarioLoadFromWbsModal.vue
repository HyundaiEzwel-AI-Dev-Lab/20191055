<script setup>
// 시나리오 편집 · WBS에서 불러오기
import { ref, watch } from 'vue'
import BaseModal from '@/components/ui/BaseModal.vue'
import { getWbsTasks, formatDateRange } from '@/data/wbs'

const props = defineProps({
  modelValue: { type: Boolean, default: false },
})

const emit = defineEmits(['update:modelValue', 'confirm'])

const keyword = ref('')
const rows = ref([])
const selected = ref(new Set())

watch(
  () => props.modelValue,
  (open) => {
    if (!open) return
    keyword.value = ''
    selected.value = new Set()
    rows.value = getWbsTasks().filter(
      (t) => !t.excluded && t.status !== '취소' && (t.taskType === '개발' || t.taskType === '테스트'),
    )
  },
)

function filtered() {
  const q = keyword.value.trim().toLowerCase()
  if (!q) return rows.value
  return rows.value.filter((t) =>
    `${t.wbsId}${t.requirementName}${t.screenName}${t.taskType}`.toLowerCase().includes(q),
  )
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

function confirm() {
  const picked = rows.value.filter((t) => selected.value.has(t.id))
  if (!picked.length) {
    window.alert('불러올 WBS 업무를 선택해 주세요.')
    return
  }
  if (!window.confirm(`${picked.length}건을 시나리오에 추가하시겠습니까?`)) return
  emit('confirm', picked)
  close()
}
</script>

<template>
  <BaseModal title="WBS에서 불러오기" :visible="modelValue" wide @close="close">
    <div class="filter">
      <input
        v-model="keyword"
        class="inp"
        type="text"
        placeholder="WBS ID, 요구사항, 화면명 검색"
      />
    </div>
    <div class="table-wrap">
      <table class="tbl">
        <thead>
          <tr>
            <th class="col-check" />
            <th>WBS ID</th>
            <th>업무유형</th>
            <th>요구사항</th>
            <th>화면명</th>
            <th>계획일정</th>
          </tr>
        </thead>
        <tbody>
          <tr
            v-for="row in filtered()"
            :key="row.id"
            :class="{ 'is-on': selected.has(row.id) }"
            @click="toggle(row.id)"
          >
            <td class="col-check">
              <input type="checkbox" :checked="selected.has(row.id)" @click.stop="toggle(row.id)" />
            </td>
            <td>{{ row.wbsId }}</td>
            <td>{{ row.taskType }}</td>
            <td class="name">{{ row.requirementName }}</td>
            <td>{{ row.screenName || '-' }}</td>
            <td>{{ formatDateRange(row.planStart, row.planEnd) }}</td>
          </tr>
          <tr v-if="!filtered().length">
            <td colspan="6" class="empty">대상 WBS가 없습니다.</td>
          </tr>
        </tbody>
      </table>
    </div>
    <template #footer>
      <button type="button" class="btn btn--ghost" @click="close">취소</button>
      <button type="button" class="btn btn--primary" @click="confirm">추가</button>
    </template>
  </BaseModal>
</template>

<style scoped>
.filter {
  margin-bottom: 12px;
}

.inp {
  width: 100%;
  height: 32px;
  padding: 0 10px;
  border: 1px solid var(--lnb-line);
  border-radius: 7px;
  font-family: inherit;
  font-size: 12px;
  box-sizing: border-box;
  background: var(--lnb-side);
}

.table-wrap {
  max-height: 360px;
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

.tbl tr {
  cursor: pointer;
}

.tbl tr.is-on {
  background: var(--teal-50);
}

.tbl .name {
  max-width: 180px;
  overflow: hidden;
  text-overflow: ellipsis;
}

.col-check {
  width: 36px;
}

.empty {
  text-align: center;
  color: var(--lnb-muted);
  padding: 24px !important;
}
</style>
