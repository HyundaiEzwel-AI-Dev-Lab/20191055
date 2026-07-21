import { defineStore } from 'pinia'
import { computed, ref } from 'vue'

const CONCEPT_KEY = 'hpms.themeConcept'
const AVATAR_KEY = 'hpms.avatarColor'

export const conceptOptions = [
  { value: 'default', label: '기본', desc: '현재 적용중인 화면' },
  { value: 'premium', label: '프리미엄', desc: '카드 깊이감·모션을 다듬은 버전' },
  { value: 'dark', label: '다크', desc: 'Claude Desktop 톤 · 따뜻한 near-black과 크림 텍스트' },
]

/** 프로필 아이콘용 20색 (비비드 + 파스텔 혼합) */
export const avatarColorOptions = [
  '#119a8a',
  '#5b8def',
  '#7c6cf0',
  '#c084fc',
  '#f472b6',
  '#fb7185',
  '#f97316',
  '#fbbf24',
  '#84cc16',
  '#34d399',
  '#2dd4bf',
  '#67e8f9',
  '#93c5fd',
  '#c4b5fd',
  '#f9a8d4',
  '#fdba74',
  '#fde68a',
  '#86efac',
  '#a8a29e',
  '#78716c',
]

const DEFAULT_AVATAR = avatarColorOptions[0]

function applyConcept(value) {
  document.documentElement.setAttribute('data-concept', value)
}

function luminance(hex) {
  const raw = hex.replace('#', '')
  if (raw.length !== 6) return 0
  const r = parseInt(raw.slice(0, 2), 16)
  const g = parseInt(raw.slice(2, 4), 16)
  const b = parseInt(raw.slice(4, 6), 16)
  return (r * 299 + g * 587 + b * 114) / 1000
}

export function avatarTextColor(bg) {
  return luminance(bg) > 165 ? '#1c1d21' : '#ffffff'
}

export const useThemeStore = defineStore('theme', () => {
  const storedConcept = localStorage.getItem(CONCEPT_KEY)
  const concept = ref(
    conceptOptions.some((c) => c.value === storedConcept) ? storedConcept : 'default',
  )

  const storedAvatar = localStorage.getItem(AVATAR_KEY)
  const avatarColor = ref(
    avatarColorOptions.includes(storedAvatar) ? storedAvatar : DEFAULT_AVATAR,
  )

  applyConcept(concept.value)

  const avatarFg = computed(() => avatarTextColor(avatarColor.value))

  function setConcept(value) {
    if (!conceptOptions.some((c) => c.value === value) || value === concept.value) return
    concept.value = value
    localStorage.setItem(CONCEPT_KEY, value)
    applyConcept(value)
  }

  function setAvatarColor(value) {
    if (!avatarColorOptions.includes(value) || value === avatarColor.value) return
    avatarColor.value = value
    localStorage.setItem(AVATAR_KEY, value)
  }

  return {
    concept,
    setConcept,
    avatarColor,
    avatarFg,
    setAvatarColor,
  }
})
