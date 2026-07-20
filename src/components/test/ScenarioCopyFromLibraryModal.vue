<script setup>
// 시나리오 편집 · 라이브러리에서 복사
import { computed, ref, watch } from 'vue'
import BaseModal from '@/components/ui/BaseModal.vue'
import { libraryList } from '@/data/testLibrary'

const props = defineProps({
  modelValue: { type: Boolean, default: false },
})

const emit = defineEmits(['update:modelValue', 'confirm'])

const keyword = ref('')
const selected = ref(new Set())

const flatCases = computed(() =>
  libraryList.flatMap((lib) =>
    (lib.cases || []).map((c) => ({
      key: `${lib.id}:${c.id}`,
      libId: lib.id,
      libTitle: lib.title,
      systemPath: lib.systemPath,
      screenName: lib.screenName,
      type: lib.type,
      caseId: c.id,
      caseName: c.title,
      steps: c.steps.map((s) => ({ ...s })),
    })),
  ),
)

const filtered = computed(() => {
  const q = keyword.value.trim().toLowerCase()
  if (!q) return flatCases.value
  return flatCases.value.filter((r) =>
    `${r.libTitle}${r.caseName}${r.screenName}${r.systemPath}`.toLowerCase().includes(q),
  )
})

watch(
  () => props.modelValue,
  (open) => {
    if (!open) return
    keyword.value = ''
    selected.value = new Set()
  },
)

function toggle(key) {
  const next = new Set(selected.value)
  if (next.has(key)) next.delete(key)
  else next.add(key)
  selected.value = next
}

function close() {
  emit('update:modelValue', false)
}

function confirm() {
  const picked = flatCases.value.filter((r) => selected.value.has(r.key))
  if (!picked.length) {
    window.alert('복사할 라이브러리 케이스를 선택해 주세요.')
    return
  }
  if (!window.confirm(`${picked.length}건을 복사해 추가하시겠습니까?`)) return
  emit('confirm', picked)
  close()
}
</script>

<template>
  <BaseModal title="라이브러리에서 복사" :visible="modelValue" wide @close="close">
    <div class="filter">
      <input
        v-model="keyword"
        class="inp"
        type="text"
        placeholder="라이브러리 · 케이스 · 화면명 검색"
      />
    </div>
    <div class="table-wrap">
      <table class="tbl">
        <thead>
          <tr>
            <th class="col-check" />
            <th>유형</th>
            <th>라이브러리</th>
            <th>화면명</th>
            <th>케이스</th>
            <th>절차수</th>
          </tr>
        </thead>
        <tbody>
          <tr
            v-for="row in filtered"
            :key="row.key"
            :class="{ 'is-on': selected.has(row.key) }"
            @click="toggle(row.key)"
          >
            <td class="col-check">
              <input
                type="checkbox"
                :checked="selected.has(row.key)"
                @click.stop="toggle(row.key)"
              />
            </td>
            <td>{{ row.type }}</td>
            <td class="name">{{ row.libTitle }}</td>
            <td>{{ row.screenName }}</td>
            <td class="name">{{ row.caseName }}</td>
            <td>{{ row.steps.length }}</td>
          </tr>
          <tr v-if="!filtered.length">
            <td colspan="6" class="empty">검색 결과가 없습니다.</td>
          </tr>
        </tbody>
      </table>
    </div>
    <template #footer>
      <button type="button" class="btn btn--ghost" @click="close">취소</button>
      <button type="button" class="btn btn--primary" @click="confirm">복사</button>
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
