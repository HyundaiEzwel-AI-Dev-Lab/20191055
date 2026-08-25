<script setup>
// 로그인/비밀번호 재설정 화면의 눈/눈-사선 아이콘을 토글 버튼 하나로 공용화.
defineProps({ modelValue: { type: Boolean, required: true }, label: { type: String, default: '' } })
defineEmits(['update:modelValue'])
</script>

<template>
  <button
    type="button"
    class="hp-password-toggle"
    :aria-label="`${label || '비밀번호'} ${modelValue ? '숨기기' : '보기'}`"
    :aria-pressed="modelValue"
    @click="$emit('update:modelValue', !modelValue)"
  >
    <svg
      v-if="modelValue"
      viewBox="0 0 24 24"
      width="16"
      height="16"
      fill="none"
      stroke="currentColor"
      stroke-width="1.7"
      stroke-linecap="round"
      stroke-linejoin="round"
      aria-hidden="true"
    >
      <path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12Z" />
      <circle cx="12" cy="12" r="3" />
    </svg>
    <svg
      v-else
      viewBox="0 0 24 24"
      width="16"
      height="16"
      fill="none"
      stroke="currentColor"
      stroke-width="1.7"
      stroke-linecap="round"
      stroke-linejoin="round"
      aria-hidden="true"
    >
      <path d="M3 3l18 18" />
      <path
        d="M10.6 6.1A10.8 10.8 0 0 1 12 6c6.5 0 10 6 10 6a17.6 17.6 0 0 1-3.2 3.8M6.4 8.1A17.3 17.3 0 0 0 2 12s3.5 6 10 6a10.4 10.4 0 0 0 2.4-.3"
      />
      <path d="M9.9 9.9a3 3 0 0 0 4.2 4.2" />
    </svg>
  </button>
</template>

<style scoped>
.hp-password-toggle {
  display: flex;
  align-items: center;
  border: none;
  background: none;
  padding: 0;
  cursor: pointer;
  color: var(--muted);
}
.hp-password-toggle:hover {
  color: var(--ink-2);
}
</style>
