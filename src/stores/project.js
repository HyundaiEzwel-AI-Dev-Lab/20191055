import { defineStore } from 'pinia'
import { ref } from 'vue'
import { getNewProjectDetail } from '@/data/projectRegister'
import { getProjectDetail } from '@/data/projectInfo'
import { useAuthStore } from '@/stores/auth'

function cloneDetail(data) {
  return JSON.parse(JSON.stringify(data))
}

export const useProjectStore = defineStore('project', () => {
  const currentProject = ref(null)
  const projectList = ref([])
  const draftProjectIds = ref(new Set())
  const projectDetails = ref({})

  function setCurrentProject(project) {
    currentProject.value = project
  }

  function setProjectList(list) {
    projectList.value = list
  }

  function clearProject() {
    currentProject.value = null
  }

  function isRegistering(projectId) {
    if (!projectId) return false
    return draftProjectIds.value.has(projectId)
  }

  function startRegistration(project) {
    const detail = getNewProjectDetail(
      project.name,
      project.requester || '',
      project.requestDept || '',
    )
    projectDetails.value[project.id] = cloneDetail(detail)
    draftProjectIds.value = new Set([...draftProjectIds.value, project.id])
    currentProject.value = { ...project, isDraft: true }
  }

  function completeRegistration(projectId, detail) {
    const next = new Set(draftProjectIds.value)
    next.delete(projectId)
    draftProjectIds.value = next
    projectDetails.value[projectId] = cloneDetail(detail)
    if (currentProject.value?.id === projectId) {
      currentProject.value = { ...currentProject.value, isDraft: false, stage: detail.stage }
    }
  }

  function getStoredDetail(projectId, projectName) {
    if (projectDetails.value[projectId]) {
      return cloneDetail(projectDetails.value[projectId])
    }
    const authStore = useAuthStore()
    return getProjectDetail(projectId, projectName, authStore.user?.id)
  }

  function requireProject(
    message = '프로젝트가 선택되지 않았습니다. 프로젝트를 먼저 선택하세요.',
  ) {
    if (!currentProject.value) {
      alert(message)
      return false
    }
    return true
  }

  return {
    currentProject,
    projectList,
    draftProjectIds,
    setCurrentProject,
    setProjectList,
    clearProject,
    isRegistering,
    startRegistration,
    completeRegistration,
    getStoredDetail,
    requireProject,
  }
})
