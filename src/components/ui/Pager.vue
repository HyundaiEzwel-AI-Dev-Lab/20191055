<script setup>
import { computed } from 'vue'

const props = defineProps({
  currentPage: { type: Number, default: 1 },
  totalPages: { type: Number, default: 1 },
})

const emit = defineEmits(['update:currentPage'])

const pages = computed(() => {
  const result = []
  for (let i = 1; i <= props.totalPages; i++) result.push(i)
  return result
})

function goTo(page) {
  if (page >= 1 && page <= props.totalPages) {
    emit('update:currentPage', page)
  }
}
</script>

<template>
  <div class="pager">
    <button class="pager__btn" :disabled="currentPage <= 1" @click="goTo(currentPage - 1)">‹</button>
    <button
      v-for="page in pages"
      :key="page"
      class="pager__btn"
      :class="{ 'is-active': page === currentPage }"
      @click="goTo(page)"
    >{{ page }}</button>
    <button class="pager__btn" :disabled="currentPage >= totalPages" @click="goTo(currentPage + 1)">›</button>
  </div>
</template>
