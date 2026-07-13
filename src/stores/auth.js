import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { defaultUserProfile } from '@/data/headerPopups'
import { getSurname } from '@/utils/text'

const STORAGE_KEY = 'hpms.user'

export const useAuthStore = defineStore('auth', () => {
  const user = ref(null)

  function loadFromStorage() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY)
      if (raw) user.value = JSON.parse(raw)
    } catch {
      user.value = null
    }
  }

  loadFromStorage()

  function login(account) {
    user.value = {
      id: account.id,
      name: account.name,
      phone: account.phone,
      dept: account.dept || 'IT기획팀',
      email: account.email || `${account.id}@ezwel.com`,
      role: account.role || '개발자',
      position: account.position || '책임',
      lastLogin: account.lastLogin || '2026/03/20 09:12',
    }
    localStorage.setItem(STORAGE_KEY, JSON.stringify(user.value))
  }

  function logout() {
    user.value = null
    localStorage.removeItem(STORAGE_KEY)
  }

  const displayName = computed(
    () => user.value?.name || defaultUserProfile.name,
  )

  const initials = computed(() => getSurname(displayName.value))

  return { user, login, logout, displayName, initials }
})
