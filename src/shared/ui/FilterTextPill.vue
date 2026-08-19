<script setup>
defineProps({
  label: { type: String, required: true },
  modelValue: { type: String, default: '' },
  placeholder: { type: String, default: '' },
  fill: { type: Boolean, default: false },
  type: { type: String, default: 'text' },
  readonly: { type: Boolean, default: false },
  list: { type: String, default: '' },
})

const emit = defineEmits(['update:modelValue', 'enter', 'click'])

function onInput(e) {
  emit('update:modelValue', e.target.value)
}

function onKeyup(e) {
  if (e.key === 'Enter') emit('enter', e)
}
</script>

<template>
  <div class="sfb-pill" :class="{ 'sfb-pill--fill': fill }" @click="emit('click', $event)">
    <div class="sfb-pill__face" :class="{ 'sfb-pill__face--fill': fill }">
      <span class="sfb-pill__label">{{ label }}</span>
      <span class="sfb-pill__sep">|</span>
      <input
        class="sfb-pill__text"
        :type="type"
        :value="modelValue"
        :placeholder="placeholder"
        :readonly="readonly"
        :list="list || undefined"
        @input="onInput"
        @keyup="onKeyup"
      />
      <slot name="trailing" />
    </div>
  </div>
</template>
