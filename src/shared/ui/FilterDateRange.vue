<script setup>
defineProps({
  label: { type: String, default: '' },
  from: { type: String, default: '' },
  to: { type: String, default: '' },
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
  <div class="sfb-date">
    <template v-if="label">
      <span class="sfb-date__label">{{ label }}</span>
      <span class="sfb-date__sep-pipe">|</span>
    </template>
    <input
      class="sfb-date__input"
      type="date"
      :value="from"
      @input="emit('update:from', $event.target.value)"
      @click="openPicker"
    />
    <span class="sfb-date__tilde">~</span>
    <input
      class="sfb-date__input"
      type="date"
      :value="to"
      @input="emit('update:to', $event.target.value)"
      @click="openPicker"
    />
  </div>
</template>
