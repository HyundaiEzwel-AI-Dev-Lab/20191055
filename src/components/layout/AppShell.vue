<script setup>
import { computed, ref } from 'vue'
import { useRoute } from 'vue-router'
import { useTabsStore } from '@/stores/tabs'
import { useLayoutTabs } from '@/composables/useLayoutTabs'
import { useProjectRegister } from '@/composables/useProjectRegister'
import AppHeader from './AppHeader.vue'
import AppSidebar from './AppSidebar.vue'
import SubTabBar from './SubTabBar.vue'
import ProjectNameRegisterModal from '@/components/project/ProjectNameRegisterModal.vue'

const route = useRoute()
const tabsStore = useTabsStore()
const subTabBarRef = ref(null)
const { showProjectRegisterModal, closeRegisterModal, confirmRegister } = useProjectRegister()

useLayoutTabs()

const pageTitle = computed(() => route.meta?.title || '')

const showSubTabs = computed(() => {
  const tab = tabsStore.activeTab
  return tab?.badge === 'gae' && tab.projectId
})

const activeProjectId = computed(() => tabsStore.activeProjectTab?.projectId ?? null)

const subbarTitle = computed(() => {
  if (showSubTabs.value) return tabsStore.activeProjectTab?.projectName || pageTitle.value
  return pageTitle.value
})

function scrollSubTabs(dir) {
  subTabBarRef.value?.scrollBy(dir)
}
</script>

<template>
  <div class="app-shell">
    <AppSidebar />
    <div class="app-shell__main">
      <AppHeader />
      <div class="app-subbar">
        <h1 class="app-subbar__title">{{ subbarTitle }}</h1>
      </div>
      <div v-if="showSubTabs && activeProjectId" class="app-subtab-wrap">
        <button class="app-subtab-wrap__scroll" title="이전 탭" @click="scrollSubTabs(-160)">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M15 18l-6-6 6-6" />
          </svg>
        </button>
        <SubTabBar ref="subTabBarRef" :project-id="activeProjectId" />
        <button class="app-subtab-wrap__scroll" title="다음 탭" @click="scrollSubTabs(160)">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M9 18l6-6-6-6" />
          </svg>
        </button>
      </div>
      <div class="app-shell__content">
        <router-view />
      </div>
    </div>

    <ProjectNameRegisterModal
      :visible="showProjectRegisterModal"
      @close="closeRegisterModal"
      @confirm="confirmRegister"
    />
  </div>
</template>
