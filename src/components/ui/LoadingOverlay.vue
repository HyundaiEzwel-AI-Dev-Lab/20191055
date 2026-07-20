<script setup>
/**
 * 공통 로딩 오버레이
 * - fullscreen: 화면 전체 스크림 + 카드 (기본)
 * - inline: 부모 영역 기준 (position:relative 부모 필요)
 */
defineProps({
  visible: { type: Boolean, default: false },
  /** 안내 문구 */
  message: { type: String, default: '데이터를 조회하고 있습니다.' },
  /** fullscreen | inline */
  mode: { type: String, default: 'fullscreen' },
})
</script>

<template>
  <Teleport to="body" :disabled="mode === 'inline'">
    <Transition name="loading-fade">
      <div
        v-if="visible"
        class="loading"
        :class="mode === 'inline' ? 'loading--inline' : 'loading--full'"
        role="status"
        aria-live="polite"
        aria-busy="true"
      >
        <div class="loading__card">
          <div class="loading__spinner" aria-hidden="true">
            <span class="loading__ring" />
          </div>
          <p class="loading__msg">{{ message }}</p>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<style scoped>
.loading {
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 9999;
}

.loading--full {
  position: fixed;
  inset: 0;
  background: rgba(28, 29, 33, 0.28);
  backdrop-filter: blur(1px);
}

.loading--inline {
  position: absolute;
  inset: 0;
  background: rgba(244, 246, 248, 0.72);
  border-radius: inherit;
}

.loading__card {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 14px;
  min-width: 200px;
  padding: 28px 32px;
  background: var(--lnb-side);
  border: 1px solid var(--lnb-line);
  border-radius: 10px;
  box-shadow: var(--shadow-md);
}

.loading__spinner {
  width: 40px;
  height: 40px;
}

.loading__ring {
  display: block;
  width: 40px;
  height: 40px;
  border-radius: 50%;
  border: 3px solid var(--teal-100);
  border-top-color: var(--teal);
  animation: loading-spin 0.75s linear infinite;
}

.loading__msg {
  margin: 0;
  font-size: var(--font-size-md);
  font-weight: 600;
  color: var(--lnb-txt);
  text-align: center;
  line-height: 1.4;
}

.loading-fade-enter-active,
.loading-fade-leave-active {
  transition: opacity 0.18s ease;
}

.loading-fade-enter-from,
.loading-fade-leave-to {
  opacity: 0;
}

@keyframes loading-spin {
  to {
    transform: rotate(360deg);
  }
}
</style>
