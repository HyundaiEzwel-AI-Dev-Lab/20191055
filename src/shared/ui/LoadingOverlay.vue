<script setup>
/**
 * 공통 로딩 오버레이
 * - fullscreen: 화면 전체 스크림 + 카드 (기본)
 * - inline: 부모 영역 기준 (position:relative 부모 필요)
 */
const WAVE_BAR_COUNT = 8

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
          <!-- 막대 웨이브 — 좌에서 우로 파동이 흐른다.
               장식이라 aria-hidden. 진행 안내는 loading__msg가 aria-live로 읽는다.
               지연은 --i(막대 순번)로 준다 — 개수를 바꿔도 CSS는 그대로다. -->
          <div class="loading__wave" aria-hidden="true">
            <i v-for="n in WAVE_BAR_COUNT" :key="n" :style="{ '--i': n - 1 }" />
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
  /* 검은 반투명 고정 — 컨셉 토큰을 타지 않는다. 어느 컨셉에서도 같은 박스로 보인다. */
  background: rgba(0, 0, 0, 0.45);
  border: 1px solid rgba(255, 255, 255, 0.14);
  border-radius: 10px;
  box-shadow: var(--shadow-md);
}

.loading__wave {
  display: flex;
  align-items: center;
  gap: 5px;
  height: 44px;
}

.loading__wave i {
  display: block;
  width: 8px;
  height: 100%;
  border-radius: 999px;
  background: var(--teal);
  animation: loading-wave 1.1s ease-in-out infinite;
  animation-delay: calc(var(--i) * 0.09s);
}

.loading__msg {
  margin: 0;
  font-size: calc(var(--font-size-md) + var(--font-size-offset, 0px));
  font-weight: 600;
  /* 카드가 검은 반투명 고정이라 문구도 흰색 고정 — --lnb-txt는 기본 컨셉에서 어두워 안 보인다. */
  color: #fff;
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

@keyframes loading-wave {
  0%,
  100% {
    transform: scaleY(0.35);
    opacity: 0.35;
  }
  50% {
    transform: scaleY(1);
    opacity: 1;
  }
}

@media (prefers-reduced-motion: reduce) {
  .loading__wave i {
    transform: scaleY(0.7);
    opacity: 0.7;
    animation: none;
  }
}
</style>
