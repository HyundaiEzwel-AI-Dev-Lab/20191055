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
import { pinnedItem, integratedMenus, projectMenus } from '@/data/sidebarMenu'

const route = useRoute()
const tabsStore = useTabsStore()
const subTabBarRef = ref(null)
const { showProjectRegisterModal, closeRegisterModal, confirmRegister } = useProjectRegister()

useLayoutTabs()

const pageTitle = computed(() => route.meta?.title || '')

/** LNB 메뉴 구조에서 라우트별 상위 경로(그룹명)를 추출해 브레드크럼에 사용한다. */
const breadcrumbAncestorMap = (() => {
  const map = { [pinnedItem.name]: [] }
  for (const group of integratedMenus) {
    if (group.children) {
      for (const child of group.children) map[child.name] = ['통합관리', group.label]
    } else if (group.name) {
      map[group.name] = ['통합관리']
    }
  }
  for (const menu of projectMenus) {
    if (menu.children) {
      for (const child of menu.children) map[child.name] = ['프로젝트', menu.label]
    } else if (menu.name) {
      map[menu.name] = ['프로젝트']
    }
  }
  map['scenario-edit-dev'] = [...map['scenario-dev'], '시나리오 관리']
  map['scenario-edit-uat'] = [...map['scenario-uat'], '시나리오 관리']
  return map
})()

const breadcrumbAncestors = computed(() => {
  const mode = route.params?.mode
  const key = mode ? `${route.name}-${mode}` : route.name
  return breadcrumbAncestorMap[key] ?? []
})

const breadcrumbItems = computed(() => {
  if (!pageTitle.value) return []
  return [...breadcrumbAncestors.value, pageTitle.value]
})

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
        <nav v-if="breadcrumbItems.length" class="app-breadcrumb" aria-label="현재 위치">
          <template v-for="(crumb, i) in breadcrumbItems" :key="i">
            <span
              class="app-breadcrumb__item"
              :class="{ 'is-current': i === breadcrumbItems.length - 1 }"
              :aria-current="i === breadcrumbItems.length - 1 ? 'page' : undefined"
            >{{ crumb }}</span>
            <span v-if="i < breadcrumbItems.length - 1" class="app-breadcrumb__sep">/</span>
          </template>
        </nav>
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
