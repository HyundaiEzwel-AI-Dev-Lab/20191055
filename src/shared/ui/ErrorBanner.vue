<script setup>
defineProps({
  message: { type: String, default: '' },
})
</script>
<template>
  <p v-if="message" class="error-banner">{{ message }}</p>
</template>
<style scoped>
.error-banner {
  margin: 0 0 12px;
  padding: 8px 12px;
  border-radius: var(--radius-md);
  background: var(--red-bg);
  color: var(--red);
  font-size: calc(12px + var(--font-size-offset, 0px));
}
</style>
