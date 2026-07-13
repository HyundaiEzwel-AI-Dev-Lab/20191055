<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { useTabsStore } from '@/stores/tabs'
import { useSubTabsStore } from '@/stores/subTabs'
import { useProjectStore } from '@/stores/project'

const router = useRouter()
const tabsStore = useTabsStore()
const subTabsStore = useSubTabsStore()
const projectStore = useProjectStore()

const scrollEl = ref(null)

defineExpose({
  scrollBy(delta) {
    scrollEl.value?.scrollBy({ left: delta, behavior: 'smooth' })
  },
})

function selectTab(tab) {
  tabsStore.setActiveTab(tab.id)

  if (tab.badge === 'gae' && tab.projectId) {
    projectStore.setCurrentProject({
      id: tab.projectId,
      name: tab.projectName,
      isDraft: projectStore.isRegistering(tab.projectId),
    })
    const route = subTabsStore.getActiveRoute(tab.projectId)
    tabsStore.updateProjectTabRoute(tab.projectId, route)
    router.push(route)
  } else {
    router.push(tab.route)
  }
}

function closeTab(event, tab) {
  event.stopPropagation()
  const wasActive = tabsStore.activeTabId === tab.id
  const closed = tabsStore.closeTab(tab.id)

  if (closed?.projectId) {
    subTabsStore.removeProjectTabs(closed.projectId)
    if (projectStore.currentProject?.id === closed.projectId) {
      projectStore.clearProject()
    }
  }

  if (wasActive && tabsStore.activeTab) {
    selectTab(tabsStore.activeTab)
  }
}

function badgeLabel(tab) {
  return tab.badge === 'gae' ? '개별' : '통합'
}
</script>

<template>
  <div ref="scrollEl" class="tab-bar">
    <div
      v-for="tab in tabsStore.tabs"
      :key="tab.id"
      class="tab-bar__item"
      :class="{ 'is-active': tabsStore.activeTabId === tab.id }"
      @click="selectTab(tab)"
    >
      <span class="tab-bar__badge" :class="tab.badge">{{ badgeLabel(tab) }}</span>
      <span class="tab-bar__title">{{ tab.title }}</span>
      <button
        v-if="tab.closable"
        class="tab-bar__close"
        @click="closeTab($event, tab)"
      >
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M18 6 6 18M6 6l12 12" />
        </svg>
      </button>
    </div>
  </div>
</template>
