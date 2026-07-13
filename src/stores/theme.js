import { defineStore } from 'pinia'
import { ref } from 'vue'

const STORAGE_KEY = 'hpms.themeConcept'

export const conceptOptions = [
  { value: 'default', label: '기본', desc: '현재 적용중인 화면' },
  { value: 'premium', label: '프리미엄', desc: '카드 깊이감·모션을 다듬은 버전' },
  { value: 'dark', label: '다크', desc: '배경·표면을 어둡게 뒤집은 버전' },
]

function applyConcept(value) {
  document.documentElement.setAttribute('data-concept', value)
}

export const useThemeStore = defineStore('theme', () => {
  const stored = localStorage.getItem(STORAGE_KEY)
  const concept = ref(conceptOptions.some((c) => c.value === stored) ? stored : 'default')

  applyConcept(concept.value)

  function setConcept(value) {
    if (!conceptOptions.some((c) => c.value === value) || value === concept.value) return
    concept.value = value
    localStorage.setItem(STORAGE_KEY, value)
    applyConcept(value)
  }

  return { concept, setConcept }
})
