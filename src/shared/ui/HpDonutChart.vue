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
        v-for="(arc, i) in arcs"
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
