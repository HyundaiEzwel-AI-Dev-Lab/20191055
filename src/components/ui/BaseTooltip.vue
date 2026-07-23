<script setup>
defineProps({
  text: { type: String, default: '' },
})
</script>

<template>
  <span class="tooltip" tabindex="0">
    <slot>
      <span class="tooltip__icon">i</span>
    </slot>
    <span class="tooltip__bubble">{{ text }}</span>
  </span>
</template>

<style scoped>
.tooltip {
  position: relative;
  display: inline-flex;
  align-items: center;
  outline: none;
}

.tooltip__icon {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 16px;
  height: 16px;
  border-radius: 50%;
  background: var(--lnb-hover);
  color: var(--lnb-muted);
  font-size: 11px;
  font-style: italic;
  font-weight: 700;
  cursor: default;
}

.tooltip__bubble {
  position: absolute;
  left: 0;
  top: calc(100% + 6px);
  z-index: 20;
  min-width: 200px;
  max-width: 320px;
  padding: 8px 12px;
  border-radius: var(--radius-md);
  box-shadow: var(--shadow-md);
  background: var(--lnb-side);
  border: 1px solid var(--lnb-line);
  color: var(--lnb-txt);
  font-size: 11px;
  font-weight: 500;
  line-height: 1.5;
  white-space: normal;
  visibility: hidden;
  opacity: 0;
  transition: opacity var(--transition-normal);
  pointer-events: none;
}

.tooltip:hover .tooltip__bubble,
.tooltip:focus-within .tooltip__bubble {
  visibility: visible;
  opacity: 1;
}
</style>
