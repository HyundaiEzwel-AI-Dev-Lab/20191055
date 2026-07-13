<script setup>
defineProps({
  name: { type: String, required: true },
})
</script>

<template>
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round">
    <!-- 내업무 -->
    <template v-if="name === 'inbox'">
      <path d="M4 13h4l1.5 3h5L16 13h4" />
      <path d="M5 13 7 5h10l2 8v5a1 1 0 0 1-1 1H6a1 1 0 0 1-1-1z" />
    </template>
    <!-- 대시보드 -->
    <template v-else-if="name === 'grid'">
      <rect x="3.5" y="3.5" width="7" height="7" rx="1.5" />
      <rect x="13.5" y="3.5" width="7" height="7" rx="1.5" />
      <rect x="3.5" y="13.5" width="7" height="7" rx="1.5" />
      <rect x="13.5" y="13.5" width="7" height="7" rx="1.5" />
    </template>
    <!-- 프로젝트 현황 -->
    <template v-else-if="name === 'clipboard'">
      <rect x="5" y="4.5" width="14" height="16" rx="2" />
      <path d="M9 4.5h6v2.5H9z" />
      <path d="M8.5 11h7M8.5 15h4.5" />
    </template>
    <!-- 시스템관리 -->
    <template v-else-if="name === 'settings'">
      <circle cx="12" cy="12" r="3" />
      <path d="M12 2.5v2.2M12 19.3v2.2M4.2 7l1.9 1.1M17.9 15.9l1.9 1.1M4.2 17l1.9-1.1M17.9 8.1l1.9-1.1" />
    </template>
    <!-- 프로젝트 대시보드 -->
    <template v-else-if="name === 'chart'">
      <path d="M4 19.5h16" />
      <path d="M7 16v-5M12 16V7M17 16v-8" />
    </template>
    <!-- 프로젝트 정보 -->
    <template v-else-if="name === 'folder'">
      <path d="M3.5 7a2 2 0 0 1 2-2h4l2 2h7a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2h-13a2 2 0 0 1-2-2z" />
    </template>
    <!-- 요구사항 -->
    <template v-else-if="name === 'diamond'">
      <path d="M12 3.2 20.8 12 12 20.8 3.2 12z" />
    </template>
    <!-- WBS -->
    <template v-else-if="name === 'wbs'">
      <rect x="3.5" y="4.5" width="17" height="15" rx="2" />
      <path d="M3.5 9.5h17M9.5 9.5v10" />
    </template>
    <!-- 단위테스트 -->
    <template v-else-if="name === 'check'">
      <rect x="4" y="4" width="16" height="16" rx="3" />
      <path d="m8.5 12 2.5 2.5 4.5-5" />
    </template>
    <!-- DEV 테스트 -->
    <template v-else-if="name === 'flask'">
      <path d="M9.5 3h5M10.5 3v6L5.6 17.4A2 2 0 0 0 7.3 20.5h9.4a2 2 0 0 0 1.7-3.1L13.5 9V3" />
      <path d="M8 14h8" />
    </template>
    <!-- 운영 테스트 -->
    <template v-else-if="name === 'monitor'">
      <rect x="3.5" y="4.5" width="17" height="12" rx="2" />
      <path d="M9 20h6M12 16.5V20" />
    </template>
  </svg>
</template>
