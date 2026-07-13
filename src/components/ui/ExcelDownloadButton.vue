<script setup>
import excelIcon from '@/assets/icons/excel-icon.png'

defineProps({
  title: { type: String, default: '엑셀 다운로드' },
  disabled: { type: Boolean, default: false },
  pushEnd: { type: Boolean, default: false },
})

defineEmits(['click'])
</script>

<template>
  <button
    type="button"
    class="excel-download-btn"
    :class="{ 'excel-download-btn--end': pushEnd }"
    :title="title"
    :aria-label="title"
    :disabled="disabled"
    @click="$emit('click', $event)"
  >
    <img class="excel-download-btn__icon" :src="excelIcon" alt="" />
  </button>
</template>

<style scoped>
.excel-download-btn {
  flex-shrink: 0;
  width: 32px;
  height: 32px;
  padding: 4px;
  border: none;
  border-radius: var(--radius-sm);
  background: transparent;
  cursor: pointer;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  transition: background var(--transition-fast);
}

.excel-download-btn:hover:not(:disabled) {
  background: var(--lnb-hover);
}

.excel-download-btn:disabled {
  opacity: 0.4;
  cursor: not-allowed;
}

.excel-download-btn--end {
  margin-left: auto;
}

.excel-download-btn__icon {
  width: 24px;
  height: 24px;
  display: block;
  object-fit: contain;
}
</style>
