<script setup>
import { computed, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import AppShell from '@/app/layouts/AppShell.vue'
import LoadingOverlay from '@/shared/ui/LoadingOverlay.vue'
import { useLoading } from '@/app/composables/useLoading'
import { useThemeStore } from '@/app/stores/theme'

const themeStore = useThemeStore()

const route = useRoute()
const router = useRouter()
const isLoginPage = computed(() => route.name === 'login')
const { visible: loadingVisible, message: loadingMessage, withLoading } = useLoading()

watch(
  [isLoginPage, () => themeStore.concept],
  ([loginPage, concept]) => {
    document.documentElement.setAttribute(
      'data-concept',
      loginPage && concept === 'dark' ? 'default' : concept,
    )
  },
  { immediate: true },
)

/** 미리보기: /?demoLoading=1 또는 아무 경로에 ?demoLoading=1 */
watch(
  () => route.query.demoLoading,
  async (flag) => {
    if (flag === undefined) return
    await withLoading(
      () => new Promise((resolve) => setTimeout(resolve, 2500)),
      '데이터를 조회하고 있습니다.',
    )
    const nextQuery = { ...route.query }
    delete nextQuery.demoLoading
    router.replace({ query: nextQuery })
  },
  { immediate: true },
)
</script>

<template>
  <AppShell v-if="!isLoginPage" />
  <router-view v-else />
  <LoadingOverlay :visible="loadingVisible" :message="loadingMessage" />
</template>

