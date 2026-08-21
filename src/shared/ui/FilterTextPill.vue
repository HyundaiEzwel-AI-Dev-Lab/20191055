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

const emit = defineEmits(['update:modelValue', 'enter', 'focus', 'click'])
</script>

<template>
  <div class="sfb-pill" :class="{ 'sfb-pill--fill': fill }" @click="emit('click', $event)">
    <div
      class="sfb-pill__face sfb-pill__face--text"
      :class="{ 'sfb-pill__face--fill': fill }"
    >
      <span class="sfb-pill__label">{{ label }}</span>
      <span class="sfb-pill__sep">|</span>
      <input
        class="sfb-pill__text"
        :type="type"
        :value="modelValue"
        :placeholder="placeholder"
        :readonly="readonly"
        :list="list || undefined"
        :aria-label="label"
        @input="emit('update:modelValue', $event.target.value)"
        @keyup.enter="emit('enter')"
        @focus="emit('focus')"
      />
      <slot name="trailing" />
    </div>
  </div>
</template>
