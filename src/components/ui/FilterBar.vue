<script setup>
defineEmits(['search', 'reset'])
</script>

<template>
  <div class="filter-bar">
    <slot />
    <div class="filter-bar__actions" style="display:flex;gap:8px;margin-left:auto;">
      <button class="btn btn--secondary btn--sm" @click="$emit('reset')">초기화</button>
      <button class="btn btn--primary btn--sm" @click="$emit('search')">조회</button>
    </div>
  </div>
</template>
