<script setup>
// 검색 가능한 셀렉트박스 — SB PAG-M-PST-01 §2b: 한 글자 이상 입력 시 선택 가능한 옵션 노출
import { ref, computed, watch } from 'vue'

const props = defineProps({
  modelValue: { type: String, default: '' },
  options: { type: Array, default: () => [] },
  placeholder: { type: String, default: '선택' },
})
const emit = defineEmits(['update:modelValue'])

const query = ref(props.modelValue)
const open = ref(false)

watch(
  () => props.modelValue,
  (v) => {
    if (!open.value) query.value = v
  },
)

const filtered = computed(() => {
  const q = (query.value || '').trim().toLowerCase()
  if (!q) return []
  return props.options.filter((o) => o.toLowerCase().includes(q))
})

function onFocus() {
  open.value = true
  query.value = ''
}

function select(opt) {
  emit('update:modelValue', opt)
  query.value = opt
  open.value = false
}

function onBlur() {
  open.value = false
  if (!query.value.trim()) {
    emit('update:modelValue', '')
    query.value = ''
  } else {
    query.value = props.modelValue
  }
}
</script>

<template>
  <div class="ssel">
    <input
      v-model="query"
      class="ssel__input filter__select"
      type="text"
      :placeholder="modelValue || placeholder"
      @focus="onFocus"
      @blur="onBlur"
    />
    <ul v-if="open && query.trim()" class="ssel__list">
      <li v-if="!filtered.length" class="ssel__empty">검색 결과 없습니다.</li>
      <li v-for="opt in filtered" :key="opt">
        <button type="button" class="ssel__item" @mousedown.prevent="select(opt)">
          {{ opt }}
        </button>
      </li>
    </ul>
  </div>
</template>

<style scoped>
.ssel {
  position: relative;
}
.ssel__input {
  cursor: text;
}
.ssel__list {
  position: absolute;
  z-index: 20;
  top: calc(100% + 4px);
  left: 0;
  right: 0;
  margin: 0;
  padding: 4px 0;
  list-style: none;
  background: var(--lnb-side);
  border: 1px solid var(--line);
  border-radius: 6px;
  box-shadow: var(--shadow-md, 0 4px 12px rgba(0, 0, 0, 0.08));
  max-height: 180px;
  overflow-y: auto;
}
.ssel__item {
  width: 100%;
  padding: 6px 10px;
  border: none;
  background: transparent;
  text-align: left;
  font-size: inherit;
  cursor: pointer;
  font-family: inherit;
  color: var(--color-text);
}
.ssel__item:hover {
  background: var(--teal-50);
  color: var(--teal-600);
}
.ssel__empty {
  padding: 8px 10px;
  font-size: calc(11px + var(--font-size-offset, 0px));
  color: var(--muted);
}
</style>
