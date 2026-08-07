<script setup>
defineProps({
  title: { type: String, default: '' },
  visible: { type: Boolean, default: false },
  wide: { type: Boolean, default: false },
  /** wide보다 더 넓은 팝업 — 오류등록처럼 좌측 목록+우측 상세를 나란히 넓게 써야 하는 화면용 */
  xwide: { type: Boolean, default: false },
  side: { type: Boolean, default: false },
})

defineEmits(['close', 'confirm'])
</script>

<template>
  <Teleport to="body">
    <div v-if="visible" class="modal-overlay" :class="{ 'modal-overlay--side': side }">
      <div class="modal" :class="{ 'modal--wide': wide, 'modal--xwide': xwide, 'modal--side': side }">
        <div class="modal__header">
          <span>{{ title }}<slot name="title-extra" /></span>
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
