<script setup>
// POP-M-COM-05 알림
import { ref, computed } from 'vue'
import { useRouter } from 'vue-router'
import HeaderLayerModal from './HeaderLayerModal.vue'
import { useProjectStore } from '@/stores/project'
import { useTabsStore } from '@/stores/tabs'
import {
  notifications as seed,
  notificationTabs,
  notificationTagClass,
  myProjects,
} from '@/data/headerPopups'

defineProps({
  modelValue: { type: Boolean, default: false },
})
const emit = defineEmits(['update:modelValue', 'unread-change'])

const router = useRouter()
const projectStore = useProjectStore()
const tabsStore = useTabsStore()

const items = ref(seed.map((n) => ({ ...n })))
const activeTab = ref('project')

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

const groupedItems = computed(() => {
  const groups = []
  const map = new Map()
  filteredItems.value.forEach((item) => {
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
}

function removeItem(id) {
  items.value = items.value.filter((n) => n.id !== id)
  emitUnread()
}

function openProjectContext(item) {
  const project = myProjects.find((p) => p.id === item.projectId)
  if (project) {
    projectStore.setCurrentProject({
      id: project.id,
      name: project.name,
      stage: project.stage,
    })
    projectStore.setProjectList(myProjects)
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

  if (item.route?.startsWith('/project/')) {
    openProjectContext(item)
  }

  const id = item.id
  removeItem(id)
  emit('update:modelValue', false)
  router.push(item.route || '/inbox')
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
    </div>
  </HeaderLayerModal>
</template>
