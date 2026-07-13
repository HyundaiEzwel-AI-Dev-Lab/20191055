<script setup>
import { computed } from 'vue'
import { useRoute } from 'vue-router'
import AppShell from '@/components/layout/AppShell.vue'
import { useThemeStore } from '@/stores/theme'

useThemeStore()

const route = useRoute()
const isLoginPage = computed(() => route.name === 'login')
</script>

<template>
  <AppShell v-if="!isLoginPage" />
  <router-view v-else />
</template>
