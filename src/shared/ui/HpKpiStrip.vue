<script setup>
/**
 * 요약 지표 한 줄(카드 1개 + 구분선으로 나눈 칸들). 각 칸 배경을 따로 칠하는 기존
 * `.kpi`/`.kpi-row`(대시보드류 화면이 각자 손으로 그린 변형) 대신 지표 패널 형태(라벨은
 * 위에 옅게, 숫자는 크고 진하게, 칸 사이는 세로 구분선)로 그린다.
 *
 * 클릭 가능 여부는 `clickable` prop으로 화면마다 켜고 끈다 — 켜면 각 칸이 버튼이 되어
 * 클릭한 칸에 `is-selected`가 붙고 `update:modelValue`/`select`를 emit한다. 꺼두면(기본값)
 * 그냥 값 표시 전용이다.
 */
defineProps({
  items: { type: Array, required: true },
  clickable: { type: Boolean, default: false },
  modelValue: { type: String, default: null },
})

const emit = defineEmits(['update:modelValue', 'select'])

function onClick(item, clickable) {
  if (!clickable) return
  emit('update:modelValue', item.key)
  emit('select', item)
}
</script>

<template>
  <section class="hp-kpi-strip card card--panel">
    <component
      :is="clickable ? 'button' : 'div'"
      v-for="item in items"
      :key="item.key"
      :type="clickable ? 'button' : undefined"
      class="hp-kpi-strip__item"
      :class="{ 'hp-kpi-strip__item--clickable': clickable, 'is-selected': clickable && modelValue === item.key }"
      @click="onClick(item, clickable)"
    >
      <span class="hp-kpi-strip__label">
        {{ item.label }}
        <slot name="label-extra" :item="item" />
      </span>
      <span class="hp-kpi-strip__value" :class="`hp-kpi-strip__value--${item.tone || 'default'}`">
        {{ item.value }}<small v-if="item.unit">{{ item.unit }}</small>
      </span>
    </component>
  </section>
</template>

<style scoped>
.hp-kpi-strip {
  display: flex;
  align-items: stretch;
  /* 기존 .kpi-row가 갖던 하단 여백과 같은 값 — 이 스트립은 항상 다음 섹션(차트 등) 위에
     쌓이므로 여백을 컴포넌트 기본값으로 둔다. */
  margin-bottom: var(--space-lg);
}

.hp-kpi-strip__item {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 8px;
  padding: 18px 24px;
  border: none;
  background: transparent;
  text-align: left;
  font: inherit;
  cursor: default;
}

.hp-kpi-strip__item + .hp-kpi-strip__item {
  border-left: 1px solid var(--lnb-line);
}

.hp-kpi-strip__item--clickable {
  cursor: pointer;
  transition: background var(--transition-fast, 0.15s ease);
}
.hp-kpi-strip__item--clickable:hover {
  background: var(--lnb-hover);
}
.hp-kpi-strip__item--clickable.is-selected {
  background: var(--teal-50);
  box-shadow: inset 0 -3px 0 var(--teal);
}

.hp-kpi-strip__label {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  font-size: calc(12px + var(--font-size-offset));
  color: var(--lnb-muted);
  font-weight: 600;
}

.hp-kpi-strip__value {
  font-size: calc(28px + var(--font-size-offset));
  font-weight: 800;
  line-height: 1;
  color: var(--lnb-logo);
}
.hp-kpi-strip__value small {
  font-size: calc(14px + var(--font-size-offset));
  font-weight: 600;
  margin-left: 2px;
  color: var(--lnb-muted);
}
.hp-kpi-strip__value--accent {
  color: var(--red);
}

@media (max-width: 900px) {
  .hp-kpi-strip { flex-wrap: wrap; }
  .hp-kpi-strip__item { flex: 1 1 50%; }
  .hp-kpi-strip__item + .hp-kpi-strip__item { border-left: none; }
}
</style>
