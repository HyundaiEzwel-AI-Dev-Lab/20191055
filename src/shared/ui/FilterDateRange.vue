<script setup>
defineProps({
  label: { type: String, default: '' },
  from: { type: String, default: '' },
  to: { type: String, default: '' },
  fill: { type: Boolean, default: false },
  elevated: { type: Boolean, default: false },
  disabled: { type: Boolean, default: false },
  single: { type: Boolean, default: false },
  month: { type: Boolean, default: false },
})

const emit = defineEmits(['update:from', 'update:to'])

function openPicker(e) {
  try {
    e.currentTarget.showPicker?.()
  } catch {
    /* ignore */
  }
}
</script>

<template>
  <div class="sfb-date" :class="{ 'sfb-date--fill': fill, 'sfb-date--month': month }">
    <template v-if="label">
      <span class="sfb-date__label">{{ label }}</span>
      <span class="sfb-date__sep-pipe">|</span>
    </template>
    <input
      class="sfb-date__input"
      :type="month ? 'month' : 'date'"
      :value="from"
      :disabled="disabled"
      @input="emit('update:from', $event.target.value)"
      @click="openPicker"
    />
    <template v-if="!single">
      <span class="sfb-date__tilde">~</span>
      <input
        class="sfb-date__input"
        :type="month ? 'month' : 'date'"
        :value="to"
        :disabled="disabled"
        @input="emit('update:to', $event.target.value)"
        @click="openPicker"
      />
    </template>
  </div>
</template>
