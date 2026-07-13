<script setup>
// POP-M-COM-05 알림
import { ref, computed } from 'vue'
import HeaderLayerModal from './HeaderLayerModal.vue'
import { notifications as seed } from '@/data/headerPopups'

defineProps({
  modelValue: { type: Boolean, default: false },
})
const emit = defineEmits(['update:modelValue', 'unread-change'])

const items = ref(seed.map((n) => ({ ...n })))

const unreadCount = computed(() => items.value.filter((n) => !n.read).length)

function markAllRead() {
  items.value.forEach((n) => { n.read = true })
  emit('unread-change', 0)
}

function openItem(item) {
  item.read = true
  emit('unread-change', unreadCount.value)
}

const typeIcon = {
  approval: '승인',
  task: '업무',
  project: '프로젝트',
  system: '공지',
}
</script>

<template>
  <HeaderLayerModal
    :model-value="modelValue"
    title="알림"
    width="460px"
    @update:model-value="emit('update:modelValue', $event)"
  >
    <div class="hdr-noti">
      <div class="hdr-noti__top">
        <span class="hdr-noti__cnt">미읽음 <b>{{ unreadCount }}</b>건</span>
        <button
          v-if="unreadCount"
          class="hdr-noti__all"
          type="button"
          @click="markAllRead"
        >모두 읽음</button>
      </div>

      <ul class="hdr-scroll hdr-scroll--noti">
        <li v-for="item in items" :key="item.id">
          <button
            class="hdr-noti__item"
            :class="{ 'is-unread': !item.read }"
            type="button"
            @click="openItem(item)"
          >
            <span class="hdr-noti__badge">{{ typeIcon[item.type] }}</span>
            <div class="hdr-noti__text">
              <div class="hdr-noti__title">{{ item.title }}</div>
              <div class="hdr-noti__msg">{{ item.message }}</div>
              <div class="hdr-noti__time">{{ item.time }}</div>
            </div>
          </button>
        </li>
      </ul>
    </div>
  </HeaderLayerModal>
</template>
