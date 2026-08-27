<script setup>
/**
 * 도넛/게이지 차트. SVG circle + stroke-dasharray.
 */
import { computed } from 'vue'

const props = defineProps({
  segments: { type: Array, default: () => [] },
  size: { type: Number, default: 120 },
  thickness: { type: Number, default: 32 },
  gap: { type: Number, default: 4 },
  trackColor: { type: String, default: 'var(--lnb-line)' },
  ariaLabel: { type: String, default: '' },
  rounded: { type: Boolean, default: false },
})

const radius = computed(() => (props.size - props.thickness) / 2)
const circumference = computed(() => 2 * Math.PI * radius.value)
const total = computed(() => props.segments.reduce((sum, s) => sum + Math.max(0, s.value), 0))

const arcs = computed(() => {
  if (!total.value) return []
  const c = circumference.value
  const multi = props.segments.filter((s) => s.value > 0).length > 1
  let offset = 0
  return props.segments
    .filter((s) => s.value > 0)
    .map((s) => {
      const length = (s.value / total.value) * c
      const drawn = multi && length > props.gap ? length - props.gap : length
      const arc = { dash: `${drawn} ${c - drawn}`, offset: -offset, color: s.color, label: s.label }
      offset += length
      return arc
    })
})

/*
 * 끝을 둥글게(rounded) 마감하면 세그먼트 경계에서 두 원이 겹친다 — 나중에 그린 원이
 * 먼저 그린 원의 둥근 끝을 덮어버린다. 순서대로(값 → 잔여) 그리면 잔여(트랙) 원이
 * 값 원의 둥근 끝 위에 그려져, "완료율 색이 끝나는 자리"가 트랙 색 둥근 혹으로 덮인다
 * (h-pms 실측 피드백, 2026-08-21 이식). 화면에 그리는 순서만 뒤집어 첫 세그먼트(보통 값)가
 * 맨 위에 오게 한다 — 각도 계산(arcs)은 그대로 두고 DOM/페인트 순서만 바꾼다.
 */
const paintArcs = computed(() => (props.rounded ? [...arcs.value].reverse() : arcs.value))
</script>

<template>
  <div class="hp-donut" :style="{ width: `${size}px`, height: `${size}px` }">
    <svg
      :width="size"
      :height="size"
      :viewBox="`0 0 ${size} ${size}`"
      shape-rendering="geometricPrecision"
      :aria-label="ariaLabel || undefined"
      :role="ariaLabel ? 'img' : undefined"
      :aria-hidden="ariaLabel ? undefined : true"
    >
      <circle
        v-if="!arcs.length"
        :cx="size / 2"
        :cy="size / 2"
        :r="radius"
        fill="none"
        :stroke="trackColor"
        :stroke-width="thickness"
      />
      <circle
        v-for="(arc, i) in paintArcs"
        :key="i"
        :cx="size / 2"
        :cy="size / 2"
        :r="radius"
        fill="none"
        :stroke="arc.color"
        :stroke-width="thickness"
        :stroke-dasharray="arc.dash"
        :stroke-dashoffset="arc.offset"
        :stroke-linecap="rounded ? 'round' : 'butt'"
        :transform="`rotate(-90 ${size / 2} ${size / 2})`"
      />
    </svg>
    <div class="hp-donut__center">
      <slot />
    </div>
  </div>
</template>

<style scoped>
.hp-donut {
  position: relative;
  flex-shrink: 0;
}

.hp-donut__center {
  position: absolute;
  inset: 0;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  pointer-events: none;
  text-align: center;
}
</style>
