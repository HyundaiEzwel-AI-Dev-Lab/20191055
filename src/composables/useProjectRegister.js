import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { useProjectStore } from '@/stores/project'
import { useTabsStore } from '@/stores/tabs'
import { useSubTabsStore } from '@/stores/subTabs'
import { createDraftProjectId } from '@/data/projectRegister'

export const showProjectRegisterModal = ref(false)

export function useProjectRegister() {
  const router = useRouter()
  const authStore = useAuthStore()
  const projectStore = useProjectStore()
  const tabsStore = useTabsStore()
  const subTabsStore = useSubTabsStore()

  function openRegisterModal() {
    showProjectRegisterModal.value = true
  }

  function closeRegisterModal() {
    showProjectRegisterModal.value = false
  }

  function confirmRegister(projectName) {
    const name = projectName.trim()
    if (!name) return false

    const id = createDraftProjectId()
    const requester = authStore.user?.name || ''

    projectStore.startRegistration({
      id,
      name,
      stage: '접수',
      isDraft: true,
      requester,
      requestDept: authStore.user?.dept || '',
    })

    subTabsStore.openSubTab(id, {
      id: 'project-info',
      title: '프로젝트 정보',
      route: '/project/info',
    })

    tabsStore.openProjectTab({
      projectId: id,
      title: name,
      projectName: name,
      route: '/project/info',
    })

    closeRegisterModal()
    router.push('/project/info')
    return true
  }

  return {
    showProjectRegisterModal,
    openRegisterModal,
    closeRegisterModal,
    confirmRegister,
  }
}
