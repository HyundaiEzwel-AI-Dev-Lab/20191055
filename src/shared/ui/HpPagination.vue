<script setup>
import { computed } from 'vue'

const props = defineProps({
  page: { type: Number, required: true },
  totalPages: { type: Number, required: true },
  mode: { type: String, default: 'numbers' },
})

const emit = defineEmits(['update:page'])

const visible = computed(() => props.totalPages > 1)
const WINDOW_SIZE = 10

const pages = computed(() => {
  const count = Math.min(WINDOW_SIZE, props.totalPages)
  const start = Math.max(1, Math.min(props.page - Math.floor(count / 2), props.totalPages - count + 1))
  return Array.from({ length: count }, (_, i) => start + i)
})

function go(page) {
  const next = Math.min(Math.max(page, 1), props.totalPages)
  if (next !== props.page) emit('update:page', next)
}
</script>

<template>
  <div v-if="visible" class="pager">
    <template v-if="mode === 'prev-next'">
      <button type="button" class="pager__btn" :disabled="page <= 1" @click="go(page - 1)">이전</button>
      <span class="pager__info">{{ page }} / {{ totalPages }}</span>
      <button type="button" class="pager__btn" :disabled="page >= totalPages" @click="go(page + 1)">다음</button>
    </template>
    <template v-else>
      <button type="button" class="pager__pg" :disabled="page <= 1" @click="go(page - 1)">«</button>
      <button
        v-for="p in pages"
        :key="p"
        type="button"
        class="pager__pg"
        :class="{ 'pager__pg--on': p === page }"
        :aria-current="p === page ? 'page' : undefined"
        @click="go(p)"
      >
        {{ p }}
      </button>
      <button type="button" class="pager__pg" :disabled="page >= totalPages" @click="go(page + 1)">»</button>
    </template>
  </div>
</template>
