import { computed } from 'vue'
import { useThemeStore } from '@/app/stores/theme'

/**
 * 현황분석류 다크카드(통계/개발구분/발의주체/적요)의 배색 — 메인 대시보드에서 확정한
 * 규칙을 실적 관리 등 같은 모양 차트를 쓰는 화면끼리 공유한다.
 *
 * - 프리미엄 컨셉: 다크 톤(oklch 리터럴)을 그대로 쓴다 — 카드가 컨셉과 무관하게 항상
 *   이 색이라 리터럴이 맞다.
 * - 기본(그 외) 컨셉: 다른 카드처럼 컨셉 토큰을 쓴다. 카테고리가 여럿인 도넛/바는 teal 한
 *   가지 색의 명도 단계로만 구분해 카드 배경(`--lnb-side`)과 섞어 다크 컨셉에서도 톤이
 *   같이 따라가게 한다.
 */
export function useDashConceptPalette() {
  const themeStore = useThemeStore()
  const isPremium = computed(() => themeStore.concept === 'premium')

  const ringTrack = computed(() => (isPremium.value ? 'oklch(0.35 0.03 195)' : 'var(--lnb-line)'))
  const teal = computed(() => (isPremium.value ? 'oklch(0.75 0.14 165)' : 'var(--teal)'))

  const devRingPalette = computed(() =>
    isPremium.value ? ['oklch(0.75 0.14 165)', 'oklch(0.6 0.11 195)'] : null,
  )
  const sponsorPalette = computed(() =>
    isPremium.value
      ? ['oklch(0.75 0.14 165)', 'oklch(0.65 0.12 165)', 'oklch(0.55 0.1 165)', 'oklch(0.45 0.08 165)']
      : null,
  )
  const stageColors = computed(() =>
    isPremium.value
      ? {
          received: 'oklch(0.72 0.01 258)',
          inProgress: 'oklch(0.6 0.14 255)',
          completed: 'oklch(0.65 0.13 165)',
          rejected: 'oklch(0.62 0.19 25)',
        }
      : { received: 'var(--gray)', inProgress: 'var(--blue)', completed: 'var(--green)', rejected: 'var(--red)' },
  )
  const memoTop = computed(() => (isPremium.value ? 'oklch(0.75 0.14 165)' : 'var(--teal)'))
  const memoRest = computed(() =>
    isPremium.value ? 'oklch(0.5 0.06 195)' : 'color-mix(in srgb, var(--teal) 35%, var(--lnb-line))',
  )

  /** 기본 컨셉의 다색 대체 — teal 한 색의 명도 단계. 카드 배경과 섞어 컨셉이 바뀌어도 따라온다. */
  const monoPalette = [
    'var(--teal)',
    'color-mix(in srgb, var(--teal) 72%, var(--lnb-side))',
    'color-mix(in srgb, var(--teal) 48%, var(--lnb-side))',
    'color-mix(in srgb, var(--teal) 28%, var(--lnb-side))',
  ]

  /** 값/잔여 두 조각짜리 진척 링(개발구분·완료율 공용). gap 0 + rounded로 그린다. */
  function progressSegments(value, total, color) {
    return [
      { value, color },
      { value: Math.max(0, total - value), color: ringTrack.value },
    ]
  }

  function devRingColor(i) {
    const palette = devRingPalette.value ?? monoPalette
    return palette[i % palette.length]
  }
  function sponsorColor(i) {
    const palette = sponsorPalette.value ?? monoPalette
    return palette[i % palette.length]
  }

  return {
    isPremium,
    ringTrack,
    teal,
    stageColors,
    memoTop,
    memoRest,
    progressSegments,
    devRingColor,
    sponsorColor,
  }
}
