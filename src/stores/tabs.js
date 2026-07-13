import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { truncateIntegratedTitle } from '@/utils/tabs'
import { truncateProjectName } from '@/utils/text'

export const useTabsStore = defineStore('tabs', () => {
  const tabs = ref([
    {
      id: 'inbox',
      title: '내업무',
      route: '/inbox',
      badge: 'tong',
      projectId: null,
      projectName: null,
      closable: false,
    },
  ])
  const activeTabId = ref('inbox')

  const activeTab = computed(() => tabs.value.find((t) => t.id === activeTabId.value))

  const activeProjectTab = computed(() =>
    activeTab.value?.badge === 'gae' ? activeTab.value : null,
  )

  function openIntegratedTab({ id, title, route }) {
    const exists = tabs.value.find((t) => t.id === id)
    const tabTitle = truncateIntegratedTitle(title)
    if (!exists) {
      tabs.value.push({
        id,
        title: tabTitle,
        route,
        badge: 'tong',
        projectId: null,
        projectName: null,
        closable: true,
      })
    } else {
      exists.route = route
      exists.title = tabTitle
    }
    activeTabId.value = id
  }

  function openProjectTab({ projectId, title, projectName, route }) {
    const id = `project-${projectId}`
    const exists = tabs.value.find((t) => t.id === id)
    const tabTitle = truncateProjectName(projectName || title)
    if (!exists) {
      tabs.value.push({
        id,
        title: tabTitle,
        route,
        badge: 'gae',
        projectId,
        projectName: projectName || title,
        closable: true,
      })
    } else {
      exists.route = route
      exists.projectName = projectName || title
      exists.title = tabTitle
    }
    activeTabId.value = id
  }

  function updateProjectTabRoute(projectId, route) {
    const tab = tabs.value.find((t) => t.projectId === projectId)
    if (tab) tab.route = route
  }

  function setActiveTab(id) {
    if (tabs.value.find((t) => t.id === id)) {
      activeTabId.value = id
    }
  }

  function closeTab(id) {
    const index = tabs.value.findIndex((t) => t.id === id)
    if (index === -1 || !tabs.value[index].closable) return null

    const closed = tabs.value[index]
    tabs.value.splice(index, 1)

    if (activeTabId.value === id) {
      const next = tabs.value[Math.min(index, tabs.value.length - 1)]
      activeTabId.value = next?.id ?? 'inbox'
    }
    return closed
  }

  return {
    tabs,
    activeTabId,
    activeTab,
    activeProjectTab,
    openIntegratedTab,
    openProjectTab,
    updateProjectTabRoute,
    setActiveTab,
    closeTab,
  }
})
