<script setup>
import { computed, useSlots } from 'vue'

const props = defineProps({
  expanded: { type: Boolean, default: false },
  search: { type: String, default: '' },
  searchPlaceholder: { type: String, default: '검색어 입력' },
  showSearch: { type: Boolean, default: true },
  showExpand: { type: Boolean, default: true },
  /** [{ key, label, value }] */
  appliedTags: { type: Array, default: () => [] },
  panelClass: { type: String, default: '' },
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
const hasTags = computed(() => props.appliedTags.length > 0)
const showPanel = computed(() => props.expanded && hasExpandSlot.value)
/** expand 슬롯 없는 화면(어드민 등)에서만 툴바 아래 태그 노출 */
const showStandaloneTags = computed(() => hasTags.value && !hasExpandSlot.value)

function toggleMore() {
  emit('update:expanded', !props.expanded)
}

function onSearchEnter() {
  emit('search')
}
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
          @keyup.enter="onSearchEnter"
        />
      </div>

      <div class="sfb__fields">
        <slot name="primary" />
      </div>

      <div class="sfb__actions">
        <button type="button" class="sfb__btn sfb__btn--ghost" @click="emit('reset')">초기화</button>
        <button type="button" class="sfb__btn sfb__btn--primary" @click="emit('search')">조회</button>
      </div>
    </div>

    <div v-if="showPanel" class="sfb__panel">
      <div class="sfb__panel-inner">
        <div class="sfb__panel-grid" :class="panelClass">
          <slot name="expand" />
        </div>
        <div v-if="hasTags" class="sfb__tags">
          <span class="sfb__tags-label">적용된 필터</span>
          <span v-for="tag in appliedTags" :key="tag.key" class="sfb__tag">
            {{ tag.label }}: {{ tag.value }}
            <button
              type="button"
              class="sfb__tag-remove"
              :aria-label="`${tag.label} 필터 삭제`"
              @click="emit('remove-tag', tag.key)"
            >
              ✕
            </button>
          </span>
        </div>
      </div>
    </div>

    <div v-else-if="showStandaloneTags" class="sfb__tags">
      <span class="sfb__tags-label">적용된 필터</span>
      <span v-for="tag in appliedTags" :key="tag.key" class="sfb__tag">
        {{ tag.label }}: {{ tag.value }}
        <button
          type="button"
          class="sfb__tag-remove"
          :aria-label="`${tag.label} 필터 삭제`"
          @click="emit('remove-tag', tag.key)"
        >
          ✕
        </button>
      </span>
    </div>

    <button
      v-if="showMore"
      type="button"
      class="sfb__more"
      :aria-expanded="expanded"
      :aria-label="expanded ? '검색조건 접기' : '검색조건 더보기'"
      @click="toggleMore"
    >
      <span class="sfb__more-icon" :class="{ 'sfb__more-icon--open': expanded }"></span>
    </button>
  </section>
</template>
