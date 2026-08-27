<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { useTabsStore } from '@/app/stores/tabs'
import { useSubTabsStore } from '@/app/stores/subTabs'
import { useProjectStore } from '@/app/stores/project'
import { useActiveTabVisible } from '@/app/composables/useActiveTabVisible'
import { truncateByBytes } from '@/shared/lib/byteText'

const router = useRouter()
const tabsStore = useTabsStore()
const subTabsStore = useSubTabsStore()
const projectStore = useProjectStore()

const scrollEl = ref(null)

// LNB 메뉴로 들어와 활성이 된 탭이 스크롤 밖에 있으면 끌어온다.
useActiveTabVisible(scrollEl, () => tabsStore.activeTabId)

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

// 닫을 수 없는 탭(내업무)은 x 대신 새로고침 버튼을 hover에 보여준다.
function refreshTab(event) {
  event.stopPropagation()
  window.location.reload()
}

// 1탭 타이틀은 최대 20바이트(한글 2바이트/영문 1바이트)까지만 보여주고 넘으면 "..."으로
// 줄인다. 2단(서브)탭은 이 규칙 대상이 아니다.
const TITLE_MAX_BYTES = 20
function displayTitle(tab) {
  return truncateByBytes(tab.title, TITLE_MAX_BYTES)
}
</script>

<template>
  <div ref="scrollEl" class="tab-bar">
    <div
      v-for="tab in tabsStore.tabs"
      :key="tab.id"
      class="tab-bar__item"
      :class="{ 'is-active': tabsStore.activeTabId === tab.id, 'is-project': tab.badge === 'gae' }"
      @click="selectTab(tab)"
    >
      <!-- 배지(P/사람 아이콘)와 제목을 한 묶음으로 붙여서, 그 묶음 전체를 탭 안에서 중앙
           정렬한다. 배지와 제목을 각자 따로 두면 제목이 짧을 때 배지와 글자 사이가 멀어져
           보였다. -->
      <span class="tab-bar__label">
        <span v-if="tab.badge === 'gae'" class="tab-bar__badge" :class="tab.badge">P</span>
        <span v-else-if="tab.id === 'my-work'" class="tab-bar__badge tab-bar__badge--icon my" aria-hidden="true">
          <svg viewBox="0 0 24 24" fill="currentColor">
            <circle cx="12" cy="8" r="4" />
            <path d="M4 20c0-4.4 3.6-7 8-7s8 2.6 8 7" />
          </svg>
        </span>
        <span class="tab-bar__title" :title="tab.title">{{ displayTitle(tab) }}</span>
      </span>
      <span class="tab-bar__close-slot">
        <span class="tab-bar__dot-indicator" aria-hidden="true"></span>
        <button v-if="tab.closable" type="button" class="tab-bar__close" @click="closeTab($event, tab)">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M18 6 6 18M6 6l12 12" />
          </svg>
        </button>
        <button v-else type="button" class="tab-bar__close" title="새로고침" aria-label="새로고침" @click="refreshTab($event)">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M3 12a9 9 0 0 1 15.4-6.4L21 8M21 3v5h-5" />
            <path d="M21 12a9 9 0 0 1-15.4 6.4L3 16M3 21v-5h5" />
          </svg>
        </button>
      </span>
    </div>
  </div>
</template>
