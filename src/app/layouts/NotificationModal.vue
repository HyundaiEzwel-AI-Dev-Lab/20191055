<script setup>
// POP-M-COM-05 알림
import { ref, computed, watch } from 'vue'
import { useRouter } from 'vue-router'
import HeaderLayerModal from './HeaderLayerModal.vue'
import { useProjectStore } from '@/app/stores/project'
import { useTabsStore } from '@/app/stores/tabs'
import { useAuthStore } from '@/app/stores/auth'
import {
  getNotifications,
  notificationTabs,
  notificationTagClass,
  getMyProjects,
} from '@/app/layouts/headerPopups'

const props = defineProps({
  modelValue: { type: Boolean, default: false },
})
const emit = defineEmits(['update:modelValue', 'unread-change'])

const router = useRouter()
const projectStore = useProjectStore()
const tabsStore = useTabsStore()
const authStore = useAuthStore()

const myProjects = computed(() => getMyProjects(authStore.user?.id))
const items = ref(getNotifications(authStore.user?.id).map((n) => ({ ...n })))
const activeTab = ref('project')
const PAGE_SIZE = 5
const currentPage = ref(1)

// 팝업을 다시 열 때, 그 사이 새로 생성된 알림(예: 이슈 @멘션)만 기존 읽음상태를 보존한 채 병합한다.
watch(
  () => props.modelValue,
  (open) => {
    if (!open) return
    const latest = getNotifications(authStore.user?.id)
    const existingIds = new Set(items.value.map((n) => n.id))
    const fresh = latest.filter((n) => !existingIds.has(n.id)).map((n) => ({ ...n }))
    if (fresh.length) {
      items.value = [...fresh, ...items.value]
      emitUnread()
    }
  },
)

const unreadCount = computed(() => items.value.filter((n) => !n.read).length)

const tabCounts = computed(() => {
  const map = { project: 0, change: 0, approval: 0 }
  items.value.forEach((n) => {
    if (!n.read && map[n.tab] != null) map[n.tab] += 1
  })
  return map
})

const filteredItems = computed(() =>
  items.value.filter((n) => n.tab === activeTab.value),
)

const totalPages = computed(() => Math.max(1, Math.ceil(filteredItems.value.length / PAGE_SIZE)))

const pagedItems = computed(() => {
  const start = (currentPage.value - 1) * PAGE_SIZE
  return filteredItems.value.slice(start, start + PAGE_SIZE)
})

const pageNumbers = computed(() =>
  Array.from({ length: totalPages.value }, (_, i) => i + 1),
)

const groupedItems = computed(() => {
  const groups = []
  const map = new Map()
  pagedItems.value.forEach((item) => {
    const key = item.dateGroup || item.datetime
    if (!map.has(key)) {
      const group = { key, items: [] }
      map.set(key, group)
      groups.push(group)
    }
    map.get(key).items.push(item)
  })
  return groups
})

function emitUnread() {
  emit('unread-change', unreadCount.value)
}

function setTab(tabId) {
  activeTab.value = tabId
  currentPage.value = 1
}

function goToPage(page) {
  if (page < 1 || page > totalPages.value) return
  currentPage.value = page
}

function removeItem(id) {
  items.value = items.value.filter((n) => n.id !== id)
  emitUnread()
  if (currentPage.value > totalPages.value) currentPage.value = totalPages.value
}

function openProjectContext(item) {
  const project = myProjects.value.find((p) => p.id === item.projectId)
  if (project) {
    projectStore.setCurrentProject({
      id: project.id,
      name: project.name,
      stage: project.stage,
    })
    projectStore.setProjectList(myProjects.value)
    tabsStore.openProjectTab({
      projectId: project.id,
      title: project.name,
      projectName: project.name,
      route: item.route,
    })
  }
}

function goTo(item) {
  item.read = true
  emitUnread()

  if (item.route?.startsWith('/workspace/')) {
    openProjectContext(item)
  }

  const id = item.id
  removeItem(id)
  emit('update:modelValue', false)
  router.push(item.route || '/integrated/my-work')
}

function dismiss(item) {
  removeItem(item.id)
}

function markAllRead() {
  items.value.forEach((n) => {
    if (n.tab === activeTab.value) n.read = true
  })
  emitUnread()
}

function tagClass(tag) {
  return notificationTagClass[tag] || 'default'
}
</script>

<template>
  <HeaderLayerModal
    :model-value="modelValue"
    title="알림"
    width="480px"
    @update:model-value="emit('update:modelValue', $event)"
  >
    <div class="hdr-noti">
      <div class="hdr-noti__tabs" role="tablist">
        <button
          v-for="tab in notificationTabs"
          :key="tab.id"
          type="button"
          role="tab"
          class="hdr-noti__tab"
          :class="{ 'is-on': activeTab === tab.id }"
          :aria-selected="activeTab === tab.id"
          @click="setTab(tab.id)"
        >
          {{ tab.label }}
          <span v-if="tabCounts[tab.id]" class="hdr-noti__tab-cnt">{{ tabCounts[tab.id] }}</span>
        </button>
      </div>

      <div class="hdr-noti__top">
        <span class="hdr-noti__cnt">
          {{ notificationTabs.find((t) => t.id === activeTab)?.label }}
          · 미읽음 <b>{{ tabCounts[activeTab] }}</b>건
        </span>
        <button
          v-if="tabCounts[activeTab]"
          class="hdr-noti__all"
          type="button"
          @click="markAllRead"
        >
          모두 읽음
        </button>
      </div>

      <div v-if="!filteredItems.length" class="hdr-empty">알림이 없습니다.</div>

      <div v-else class="hdr-scroll hdr-scroll--noti">
        <section v-for="group in groupedItems" :key="group.key" class="hdr-noti__group">
          <div class="hdr-noti__date">{{ group.key }}</div>
          <ul class="hdr-noti__list">
            <li v-for="item in group.items" :key="item.id">
              <div
                class="hdr-noti__item"
                :class="{ 'is-unread': !item.read }"
              >
                <div class="hdr-noti__body">
                  <div class="hdr-noti__row">
                    <span class="hdr-noti__project">{{ item.projectName }}</span>
                    <button
                      type="button"
                      class="hdr-noti__dismiss"
                      aria-label="알림 삭제"
                      @click="dismiss(item)"
                    >
                      ✕
                    </button>
                  </div>
                  <div class="hdr-noti__content">
                    <span class="hdr-noti__tag" :class="`hdr-noti__tag--${tagClass(item.tag)}`">
                      [{{ item.tag }}]
                    </span>
                    <span class="hdr-noti__msg">{{ item.message }}</span>
                  </div>
                  <div class="hdr-noti__foot">
                    <span class="hdr-noti__time">{{ item.datetime }}</span>
                    <button type="button" class="hdr-noti__go" @click="goTo(item)">
                      바로가기
                    </button>
                  </div>
                </div>
              </div>
            </li>
          </ul>
        </section>
      </div>

      <div v-if="totalPages > 1" class="hdr-pagination">
        <button
          type="button"
          class="hdr-pagination__nav"
          :disabled="currentPage === 1"
          @click="goToPage(currentPage - 1)"
        >
          ◀
        </button>
        <button
          v-for="page in pageNumbers"
          :key="page"
          type="button"
          class="hdr-pagination__num"
          :class="{ 'is-on': currentPage === page }"
          @click="goToPage(page)"
        >
          {{ page }}
        </button>
        <button
          type="button"
          class="hdr-pagination__nav"
          :disabled="currentPage === totalPages"
          @click="goToPage(currentPage + 1)"
        >
          ▶
        </button>
      </div>
    </div>
  </HeaderLayerModal>
</template>
