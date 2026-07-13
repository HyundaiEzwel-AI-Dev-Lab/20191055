<script setup>
defineProps({
  modelValue: { type: Boolean, default: false },
  title: { type: String, default: '' },
  width: { type: String, default: '480px' },
})

const emit = defineEmits(['update:modelValue'])

function close() {
  emit('update:modelValue', false)
}
</script>

<template>
  <Teleport to="body">
    <div v-if="modelValue" class="hdr-layer" @mousedown.self="close">
      <div class="hdr-layer__box" :style="{ width }">
        <div class="hdr-layer__head">
          <span class="hdr-layer__title">{{ title }}</span>
          <button class="hdr-layer__close" type="button" aria-label="닫기" @click="close">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M18 6 6 18M6 6l12 12" />
            </svg>
          </button>
        </div>
        <div class="hdr-layer__body">
          <slot />
        </div>
        <div v-if="$slots.footer" class="hdr-layer__foot">
          <slot name="footer" />
        </div>
      </div>
    </div>
  </Teleport>
</template>
