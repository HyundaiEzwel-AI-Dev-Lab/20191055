<script setup>
import { computed } from 'vue'

const props = defineProps({
  label: { type: String, required: true },
  modelValue: { type: [String, Number], default: '' },
  options: { type: Array, default: () => [] },
  /** option이 문자열이면 그대로 value/label, 객체면 { value, label } */
  emptyLabel: { type: String, default: '전체' },
  fill: { type: Boolean, default: false },
  disabled: { type: Boolean, default: false },
})

const emit = defineEmits(['update:modelValue'])

const normalized = computed(() =>
  props.options.map((o) =>
    typeof o === 'object' && o !== null
      ? { value: o.value, label: o.label ?? String(o.value) }
      : { value: o, label: String(o) },
  ),
)

const displayValue = computed(() => {
  const found = normalized.value.find((o) => String(o.value) === String(props.modelValue))
  if (found) return found.label
  if (props.modelValue === '' || props.modelValue == null) return props.emptyLabel
  return String(props.modelValue)
})

const isEmpty = computed(
  () => props.modelValue === '' || props.modelValue == null || displayValue.value === props.emptyLabel,
)

function onChange(e) {
  emit('update:modelValue', e.target.value)
}
</script>

<template>
  <div class="sfb-pill" :class="{ 'sfb-pill--fill': fill }">
    <div class="sfb-pill__face sfb-pill__face--select" :class="{ 'sfb-pill__face--fill': fill }">
      <span class="sfb-pill__label">{{ label }}</span>
      <span class="sfb-pill__sep">|</span>
      <span class="sfb-pill__value" :class="{ 'sfb-pill__value--muted': isEmpty }">{{ displayValue }}</span>
    </div>
    <select
      class="sfb-pill__native"
      :value="modelValue"
      :disabled="disabled"
      @change="onChange"
    >
      <slot>
        <option
          v-for="o in normalized"
          :key="String(o.value)"
          :value="o.value"
        >
          {{ o.label }}
        </option>
      </slot>
    </select>
  </div>
</template>
