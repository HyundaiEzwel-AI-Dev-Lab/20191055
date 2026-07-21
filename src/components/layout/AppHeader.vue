<script setup>
import { ref } from 'vue'
import { storeToRefs } from 'pinia'
import TabBar from './TabBar.vue'
import GlobalSearchModal from '@/components/header/GlobalSearchModal.vue'
import NotificationModal from '@/components/header/NotificationModal.vue'
import MyProjectsModal from '@/components/header/MyProjectsModal.vue'
import MyInfoModal from '@/components/header/MyInfoModal.vue'
import PasswordResetModal from '@/components/auth/PasswordResetModal.vue'
import { useAuthStore } from '@/stores/auth'
import { useThemeStore } from '@/stores/theme'
import { notifications } from '@/data/headerPopups'

const authStore = useAuthStore()
const themeStore = useThemeStore()
const { initials } = storeToRefs(authStore)
const { avatarColor, avatarFg } = storeToRefs(themeStore)
const tabBarRef = ref(null)

const showSearch = ref(false)
const showNoti = ref(false)
const showProjects = ref(false)
const showInfo = ref(false)
const showPasswordReset = ref(false)
const passwordPrefill = ref(null)
const unreadCount = ref(notifications.filter((n) => !n.read).length)

function scrollTabs(dir) {
  tabBarRef.value?.scrollBy(dir)
}

function openPopup(target) {
  showSearch.value = target === 'search'
  showNoti.value = target === 'noti'
  showProjects.value = target === 'projects'
  showInfo.value = target === 'info'
}

function openPasswordReset() {
  const u = authStore.user
  passwordPrefill.value = u
    ? { name: u.name, empId: u.id }
    : null
  showPasswordReset.value = true
}

function onUnreadChange(count) {
  unreadCount.value = count
}
</script>

<template>
  <header class="app-header">
    <div class="app-header__tabs-wrap">
      <button class="app-header__scroll" title="이전 탭" @click="scrollTabs(-160)">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M15 18l-6-6 6-6" />
        </svg>
      </button>
      <TabBar ref="tabBarRef" />
      <button class="app-header__scroll" title="다음 탭" @click="scrollTabs(160)">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M9 18l6-6-6-6" />
        </svg>
      </button>
    </div>

    <div class="app-header__actions">
      <button class="app-header__icon-btn" title="검색" @click="openPopup('search')">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75">
          <circle cx="11" cy="11" r="7" />
          <path d="m21 21-4.3-4.3" />
        </svg>
      </button>
      <button class="app-header__icon-btn" title="알림" @click="openPopup('noti')">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75">
          <path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9" />
          <path d="M10 21a2 2 0 0 0 4 0" />
        </svg>
        <span v-if="unreadCount" class="app-header__dot"></span>
      </button>
      <button class="app-header__icon-btn" title="내 프로젝트" @click="openPopup('projects')">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75">
          <path d="M3 7a2 2 0 0 1 2-2h4l2 2h8a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
        </svg>
      </button>
      <button
        class="app-header__avatar"
        title="내 정보"
        type="button"
        :style="{ background: avatarColor, color: avatarFg }"
        @click="openPopup('info')"
      >{{ initials }}</button>
    </div>

    <GlobalSearchModal v-model="showSearch" />
    <NotificationModal v-model="showNoti" @unread-change="onUnreadChange" />
    <MyProjectsModal v-model="showProjects" />
    <MyInfoModal
      v-model="showInfo"
      @password-reset="openPasswordReset"
    />
    <PasswordResetModal
      v-model="showPasswordReset"
      :prefill="passwordPrefill"
      lock-identity
    />
  </header>
</template>
