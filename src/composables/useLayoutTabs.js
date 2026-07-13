import { watch } from 'vue'
import { useRoute } from 'vue-router'
import { useTabsStore } from '@/stores/tabs'
import { useSubTabsStore } from '@/stores/subTabs'
import { useProjectStore } from '@/stores/project'
import {
  integratedTabIdFromRoute,
  isProjectPath,
  subTabIdFromRoute,
  subTabTitleFromRoute,
} from '@/utils/tabs'

/** 라우트 변경 ↔ 1단·2단 탭 동기화 */
export function useLayoutTabs() {
  const route = useRoute()
  const tabsStore = useTabsStore()
  const subTabsStore = useSubTabsStore()
  const projectStore = useProjectStore()

  watch(
    () => route.fullPath,
    () => {
      if (!route.name || route.name === 'login') return

      if (isProjectPath(route.path)) {
        const project = projectStore.currentProject
        if (!project?.id) return

        subTabsStore.openSubTab(project.id, {
          id: subTabIdFromRoute(route),
          title: subTabTitleFromRoute(route),
          route: route.fullPath,
        })

        tabsStore.openProjectTab({
          projectId: project.id,
          title: project.name,
          projectName: project.name,
          route: subTabsStore.getActiveRoute(project.id),
        })
      } else {
        tabsStore.openIntegratedTab({
          id: integratedTabIdFromRoute(route),
          title: route.meta?.title || String(route.name),
          route: route.fullPath,
        })
      }
    },
    { immediate: true },
  )
}
