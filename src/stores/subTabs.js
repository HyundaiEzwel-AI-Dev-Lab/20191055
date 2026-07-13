import { defineStore } from 'pinia'
import { ref } from 'vue'

export const useSubTabsStore = defineStore('subTabs', () => {
  const tabsByProject = ref({})
  const activeByProject = ref({})

  function ensureProject(projectId) {
    if (!tabsByProject.value[projectId]) {
      tabsByProject.value[projectId] = []
    }
  }

  function getTabs(projectId) {
    return tabsByProject.value[projectId] || []
  }

  function getActiveSubTabId(projectId) {
    return activeByProject.value[projectId] || null
  }

  function getActiveRoute(projectId) {
    const id = activeByProject.value[projectId]
    const tab = getTabs(projectId).find((t) => t.id === id)
    return tab?.route || '/project/info'
  }

  function openSubTab(projectId, { id, title, route }) {
    ensureProject(projectId)
    const list = tabsByProject.value[projectId]
    const exists = list.find((t) => t.id === id)
    if (!exists) {
      list.push({ id, title, route, closable: true })
    } else {
      exists.route = route
      exists.title = title
    }
    activeByProject.value[projectId] = id
  }

  function setActiveSubTab(projectId, id) {
    if (getTabs(projectId).find((t) => t.id === id)) {
      activeByProject.value[projectId] = id
    }
  }

  function closeSubTab(projectId, id) {
    const list = tabsByProject.value[projectId]
    if (!list) return null

    const index = list.findIndex((t) => t.id === id)
    if (index === -1 || !list[index].closable) return null

    const closed = list[index]
    list.splice(index, 1)

    if (activeByProject.value[projectId] === id) {
      const next = list[Math.min(index, list.length - 1)]
      activeByProject.value[projectId] = next?.id ?? null
    }
    return closed
  }

  function removeProjectTabs(projectId) {
    delete tabsByProject.value[projectId]
    delete activeByProject.value[projectId]
  }

  return {
    tabsByProject,
    activeByProject,
    getTabs,
    getActiveSubTabId,
    getActiveRoute,
    openSubTab,
    setActiveSubTab,
    closeSubTab,
    removeProjectTabs,
  }
})
