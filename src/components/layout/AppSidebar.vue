<script setup>
import { computed, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useSidebar } from '@/composables/useSidebar'
import { useProjectRegister } from '@/composables/useProjectRegister'
import { useProjectStore } from '@/stores/project'
import { useTabsStore } from '@/stores/tabs'
import SidebarIcon from './SidebarIcon.vue'
import {
  pinnedItem,
  integratedMenus,
  projectMenus,
} from '@/data/sidebarMenu'

const route = useRoute()
const router = useRouter()
const { collapsed, toggle } = useSidebar()
const { openRegisterModal } = useProjectRegister()
const projectStore = useProjectStore()
const tabsStore = useTabsStore()

const openIds = ref(new Set())
const hoveringId = ref(null)
let hideTimer = null

const sidebarClass = computed(() => ({ 'is-collapsed': collapsed.value }))

const showProjectMenus = computed(() => Boolean(tabsStore.activeProjectTab))

const isRegisteringMode = computed(() => {
  const id = projectStore.currentProject?.id
  return Boolean(id && projectStore.isRegistering(id))
})

function isProjectMenuDisabled(item) {
  if (!isRegisteringMode.value || !item?.name) return false
  return item.name !== 'project-info'
}

function isProjectRowDisabled(menu) {
  if (!isRegisteringMode.value) return false
  if (menu.children) {
    return menu.children.every((child) => isProjectMenuDisabled(child))
  }
  return isProjectMenuDisabled(menu)
}

function isActiveItem(item) {
  if (!item?.name) return false
  if (item.name === 'scenario-dev' || item.name === 'scenario-uat') {
    return route.name === 'scenario' && route.params.mode === (item.name === 'scenario-dev' ? 'dev' : 'uat')
  }
  if (item.name === 'defect-dev' || item.name === 'defect-uat') {
    return route.name === 'defect' && route.params.mode === (item.name === 'defect-dev' ? 'dev' : 'uat')
  }
  if (item.name === 'progress-dev' || item.name === 'progress-uat') {
    return route.name === 'progress' && route.params.mode === (item.name === 'progress-dev' ? 'dev' : 'uat')
  }
  if (item.name === 'test-run-dev' || item.name === 'test-run-uat') {
    return route.name === 'test-run' && route.params.mode === (item.name === 'test-run-dev' ? 'dev' : 'uat')
  }
  return route.name === item.name
}

function isRowActive(menu) {
  if (menu.route) return isActiveItem(menu)
  if (menu.children) return menu.children.some((c) => isActiveItem(c))
  return false
}

function syncOpenFromRoute() {
  const next = new Set(openIds.value)
  for (const m of [...integratedMenus, ...projectMenus]) {
    if (m.children?.some((c) => isActiveItem(c))) next.add(m.id)
  }
  openIds.value = next
}

watch(() => route.fullPath, syncOpenFromRoute, { immediate: true })

function toggleOpen(id) {
  const next = new Set(openIds.value)
  if (next.has(id)) next.delete(id)
  else next.add(id)
  openIds.value = next
}

function navigate(item) {
  if (item?.route) router.push(item.route)
}

function onProjectMenuClick(item) {
  if (isProjectMenuDisabled(item)) return
  navigate(item)
}

function onProjectRowClick(menu) {
  if (isProjectRowDisabled(menu)) return
  if (menu.children) {
    if (!collapsed.value) toggleOpen(menu.id)
    else {
      const allowed = menu.children.find((child) => !isProjectMenuDisabled(child))
      if (allowed) navigate(allowed)
    }
  } else {
    navigate(menu)
  }
}

function onRowClick(menu) {
  if (menu.children) {
    if (!collapsed.value) toggleOpen(menu.id)
    else if (menu.children.length === 1) navigate(menu.children[0])
  } else {
    navigate(menu)
  }
}

function onHoverEnter(id) {
  if (!collapsed.value) return
  clearTimeout(hideTimer)
  hoveringId.value = id
}

function onHoverLeave() {
  clearTimeout(hideTimer)
  hideTimer = setTimeout(() => {
    hoveringId.value = null
  }, 400)
}

function isOpen(id) {
  return openIds.value.has(id)
}

function isHovering(id) {
  return hoveringId.value === id
}
</script>

<template>
  <aside class="app-sidebar" :class="sidebarClass">
    <!-- 상단: 로고 + 브랜드 + 토글 -->
    <div class="app-sidebar__top">
      <div class="app-sidebar__mark">H</div>
      <span class="app-sidebar__brand">PMS</span>
      <button class="app-sidebar__toggle" :title="collapsed ? '펼치기' : '접기'" @click="toggle">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
          <rect x="3" y="4" width="18" height="16" rx="3.5" />
          <path d="M9 4.5v15" />
          <path d="M15.5 9 13 12l2.5 3" />
        </svg>
      </button>
    </div>

    <nav class="app-sidebar__scroll">
      <!-- 내업무 (고정) -->
      <div class="lnb-pin">
        <div
          class="lnb-item"
          @mouseenter="onHoverEnter(pinnedItem.id)"
          @mouseleave="onHoverLeave"
        >
          <a
            class="lnb-row"
            :class="{ on: isActiveItem(pinnedItem) }"
            @click.prevent="navigate(pinnedItem)"
          >
            <span class="lnb-row__ic"><SidebarIcon :name="pinnedItem.icon" /></span>
            <span class="lnb-row__lb">{{ pinnedItem.label }}</span>
          </a>
          <div v-if="collapsed" class="lnb-flyout" :class="{ show: isHovering(pinnedItem.id) }">
            <a class="lnb-flyout__item" :class="{ on: isActiveItem(pinnedItem) }" @click.prevent="navigate(pinnedItem)">
              {{ pinnedItem.label }}
            </a>
          </div>
        </div>
      </div>

      <!-- 통합관리 -->
      <div class="lnb-grouplabel">통합관리</div>
      <div
        v-for="menu in integratedMenus"
        :key="menu.id"
        class="lnb-item"
        :class="{ open: isOpen(menu.id) }"
        @mouseenter="onHoverEnter(menu.id)"
        @mouseleave="onHoverLeave"
      >
        <a
          class="lnb-row"
          :class="{ on: isRowActive(menu) && !menu.children }"
          @click.prevent="onRowClick(menu)"
        >
          <span class="lnb-row__ic"><SidebarIcon :name="menu.icon" /></span>
          <span class="lnb-row__lb">{{ menu.label }}</span>
          <svg v-if="menu.children" class="lnb-row__chev" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M6 9l6 6 6-6" />
          </svg>
        </a>
        <div v-if="menu.children && !collapsed" class="lnb-sub">
          <a
            v-for="child in menu.children"
            :key="child.name"
            class="lnb-subrow"
            :class="{ on: isActiveItem(child) }"
            @click.prevent="navigate(child)"
          >{{ child.label }}</a>
        </div>
        <div v-if="menu.children && collapsed" class="lnb-flyout" :class="{ show: isHovering(menu.id) }">
          <div class="lnb-flyout__head">{{ menu.label }}</div>
          <a
            v-for="child in menu.children"
            :key="child.name"
            class="lnb-flyout__item"
            :class="{ on: isActiveItem(child) }"
            @click.prevent="navigate(child)"
          >{{ child.label }}</a>
        </div>
      </div>

      <div v-if="showProjectMenus" class="lnb-hr"></div>

      <!-- 프로젝트 (개별 탭 진입 시에만 노출) -->
      <template v-if="showProjectMenus">
        <div class="lnb-grouplabel">프로젝트</div>
        <div
          v-for="menu in projectMenus"
          :key="menu.id"
          class="lnb-item"
          :class="{ open: isOpen(menu.id) }"
          @mouseenter="onHoverEnter(menu.id)"
          @mouseleave="onHoverLeave"
        >
          <a
            class="lnb-row"
            :class="{
              on: isRowActive(menu) && !menu.children,
              'is-disabled': isProjectRowDisabled(menu),
            }"
            @click.prevent="onProjectRowClick(menu)"
          >
            <span class="lnb-row__ic"><SidebarIcon :name="menu.icon" /></span>
            <span class="lnb-row__lb">{{ menu.label }}</span>
            <svg v-if="menu.children" class="lnb-row__chev" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M6 9l6 6 6-6" />
            </svg>
          </a>
          <div v-if="menu.children && !collapsed" class="lnb-sub">
            <a
              v-for="child in menu.children"
              :key="child.name"
              class="lnb-subrow"
              :class="{ on: isActiveItem(child), 'is-disabled': isProjectMenuDisabled(child) }"
              @click.prevent="onProjectMenuClick(child)"
            >{{ child.label }}</a>
          </div>
          <div v-if="menu.children && collapsed" class="lnb-flyout" :class="{ show: isHovering(menu.id) }">
            <div class="lnb-flyout__head">{{ menu.label }}</div>
            <a
              v-for="child in menu.children"
              :key="child.name"
              class="lnb-flyout__item"
              :class="{ on: isActiveItem(child), 'is-disabled': isProjectMenuDisabled(child) }"
              @click.prevent="onProjectMenuClick(child)"
            >{{ child.label }}</a>
          </div>
          <!-- 단일 메뉴 flyout (접힘) -->
          <div v-if="!menu.children && collapsed" class="lnb-flyout" :class="{ show: isHovering(menu.id) }">
            <a
              class="lnb-flyout__item"
              :class="{ on: isActiveItem(menu), 'is-disabled': isProjectMenuDisabled(menu) }"
              @click.prevent="onProjectMenuClick(menu)"
            >
              {{ menu.label }}
            </a>
          </div>
        </div>
      </template>
    </nav>

    <!-- 하단: 프로젝트 등록 -->
    <div class="app-sidebar__foot">
      <button class="lnb-register" @click="openRegisterModal">
        <span class="lnb-register__plus">＋</span>
        <span class="lnb-register__lb">프로젝트 등록</span>
      </button>
    </div>
  </aside>
</template>
