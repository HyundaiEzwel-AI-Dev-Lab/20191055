import { computed } from 'vue'
import { useRoute } from 'vue-router'
import { getModeConfig } from '@/data/testConfig'

/** DEV/운영 공용 테스트 화면 — route.params.mode 기반 컨텍스트 */
export function useTestContext() {
  const route = useRoute()

  const mode = computed(() => {
    const m = route.params.mode
    return m === 'uat' ? 'uat' : 'dev'
  })

  const config = computed(() => getModeConfig(mode.value))

  const pageTitle = computed(() => {
    const name = route.name
    const { label } = config.value
    if (name === 'scenario') return `시나리오 관리 (${label})`
    if (name === 'scenario-edit') return `시나리오 편집 (${label})`
    if (name === 'test-run') return `테스트 수행 (${label})`
    if (name === 'defect') return `결함 관리 (${label})`
    if (name === 'progress') return `진척 관리 (${label})`
    return `${label} 테스트`
  })

  return { mode, config, pageTitle }
}
