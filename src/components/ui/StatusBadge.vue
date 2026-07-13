<script setup>
defineProps({
  status: { type: String, default: 'default' },
  label: { type: String, required: true },
})
</script>

<template>
  <span class="badge" :class="`badge--${status}`">{{ label }}</span>
</template>
