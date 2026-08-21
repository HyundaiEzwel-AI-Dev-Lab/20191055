<script setup>
import { computed, useSlots } from 'vue'

const props = defineProps({
  expanded: { type: Boolean, default: false },
  search: { type: String, default: '' },
  searchPlaceholder: { type: String, default: '검색어 입력' },
  showSearch: { type: Boolean, default: true },
  showExpand: { type: Boolean, default: true },
  appliedTags: { type: Array, default: () => [] },
  panelClass: { type: String, default: '' },
  searchDisabled: { type: Boolean, default: false },
})

const emit = defineEmits([
  'update:expanded',
  'update:search',
  'reset',
  'search',
  'remove-tag',
])

const slots = useSlots()
const hasExpandSlot = computed(() => !!slots.expand)
const showMore = computed(() => props.showExpand && hasExpandSlot.value)
const showPanel = computed(() => props.expanded && hasExpandSlot.value)
</script>

<template>
  <section class="sfb">
    <div class="sfb__toolbar">
      <div v-if="showSearch" class="sfb__search">
        <svg class="sfb__search-icon" viewBox="0 0 24 24" fill="none" aria-hidden="true">
          <circle cx="11" cy="11" r="7" stroke="currentColor" stroke-width="1.8" />
          <path d="M16.5 16.5L21 21" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" />
        </svg>
        <input
          class="sfb__search-input"
          type="text"
          :value="search"
          :placeholder="searchPlaceholder"
          @input="emit('update:search', $event.target.value)"
          @keyup.enter="emit('search')"
        />
      </div>

      <div class="sfb__fields">
        <slot name="primary" />
      </div>

      <div class="sfb__actions">
        <slot name="actions-before" />
        <button type="button" class="sfb__btn sfb__btn--ghost" @click="emit('reset')">초기화</button>
        <button
          type="button"
          class="sfb__btn sfb__btn--primary"
          :disabled="searchDisabled"
          @click="emit('search')"
        >
          조회
        </button>
        <slot name="actions-after" />
      </div>
    </div>

    <div v-if="showPanel" class="sfb__panel">
      <div class="sfb__panel-inner">
        <div class="sfb__panel-grid" :class="panelClass">
          <slot name="expand" />
        </div>
      </div>
    </div>

    <button
      v-if="showMore"
      type="button"
      class="sfb__more"
      :aria-expanded="expanded"
      :aria-label="expanded ? '검색조건 접기' : '검색조건 더보기'"
      @click="emit('update:expanded', !expanded)"
    >
      <span class="sfb__more-icon" :class="{ 'sfb__more-icon--open': expanded }"></span>
    </button>
  </section>
</template>
