<script setup>
defineProps({
  title: { type: String, default: '' },
  visible: { type: Boolean, default: false },
  wide: { type: Boolean, default: false },
})

defineEmits(['close', 'confirm'])
</script>

<template>
  <Teleport to="body">
    <div v-if="visible" class="modal-overlay" @click.self="$emit('close')">
      <div class="modal" :class="{ 'modal--wide': wide }">
        <div class="modal__header">
          <span>{{ title }}</span>
          <button class="app-header__icon-btn" @click="$emit('close')">×</button>
        </div>
        <div class="modal__body">
          <slot />
        </div>
        <div v-if="$slots.footer" class="modal__footer">
          <slot name="footer" />
        </div>
      </div>
    </div>
  </Teleport>
</template>
