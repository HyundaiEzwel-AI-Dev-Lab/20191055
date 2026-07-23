<script setup>
import { ref, computed } from 'vue'
import { useRouter } from 'vue-router'
import { useTabsStore } from '@/stores/tabs'
import { useSubTabsStore } from '@/stores/subTabs'
import { useProjectStore } from '@/stores/project'

const props = defineProps({
  projectId: { type: String, required: true },
})

const router = useRouter()
const tabsStore = useTabsStore()
const subTabsStore = useSubTabsStore()
const projectStore = useProjectStore()

const tabs = computed(() => subTabsStore.getTabs(props.projectId))
const activeId = computed(() => subTabsStore.getActiveSubTabId(props.projectId))

const scrollEl = ref(null)

defineExpose({
  scrollBy(delta) {
    scrollEl.value?.scrollBy({ left: delta, behavior: 'smooth' })
  },
  scrollByCount(count) {
    const el = scrollEl.value
    if (!el || !el.children.length) return
    const avgWidth = el.scrollWidth / el.children.length
    el.scrollBy({ left: avgWidth * count, behavior: 'smooth' })
  },
})

function isSubTabDisabled(tab) {
  if (!projectStore.isRegistering(props.projectId)) return false
  return tab.id !== 'project-info'
}

function selectTab(tab) {
  if (isSubTabDisabled(tab)) return
  subTabsStore.setActiveSubTab(props.projectId, tab.id)
  tabsStore.updateProjectTabRoute(props.projectId, tab.route)
  router.push(tab.route)
}

function closeTab(event, tab) {
  event.stopPropagation()
  const wasActive = activeId.value === tab.id
  subTabsStore.closeSubTab(props.projectId, tab.id)

  if (wasActive) {
    const nextRoute = subTabsStore.getActiveRoute(props.projectId)
    tabsStore.updateProjectTabRoute(props.projectId, nextRoute)
    router.push(nextRoute)
  }
}
</script>

<template>
  <div ref="scrollEl" class="sub-tab-bar">
    <div
      v-for="tab in tabs"
      :key="tab.id"
      class="sub-tab-bar__item"
      :class="{
        'is-active': activeId === tab.id,
        'is-disabled': isSubTabDisabled(tab),
      }"
      @click="selectTab(tab)"
    >
      <span class="sub-tab-bar__title">{{ tab.title }}</span>
      <button
        v-if="tab.closable"
        class="sub-tab-bar__close"
        @click="closeTab($event, tab)"
      >
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M18 6 6 18M6 6l12 12" />
        </svg>
      </button>
    </div>
  </div>
</template>
