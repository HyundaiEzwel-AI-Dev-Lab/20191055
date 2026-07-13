<script setup>
const props = defineProps({
  modelValue: { type: [String, Number], required: true },
  options: { type: Array, default: () => [] },
})

const emit = defineEmits(['update:modelValue'])

function select(value) {
  emit('update:modelValue', value)
}
</script>

<template>
  <div class="segmented-control">
    <button
      v-for="opt in options"
      :key="opt.value"
      class="segmented-control__item"
      :class="{ 'is-active': modelValue === opt.value }"
      @click="select(opt.value)"
    >{{ opt.label }}</button>
  </div>
</template>
