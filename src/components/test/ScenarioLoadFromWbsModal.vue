<script setup>
// POP-S-UAT-05 시나리오 불러오기 — 단위/DEV/STG/운영 차수별 시나리오를 단일선택 → 덮어쓰기
import { ref, watch } from 'vue'
import BaseModal from '@/components/ui/BaseModal.vue'

const props = defineProps({
  modelValue: { type: Boolean, default: false },
})

const emit = defineEmits(['update:modelValue', 'confirm'])

const availableRounds = ['단위테스트', 'DEV1차', 'DEV2차', 'DEV3차', 'STG1차', '운영1차', '운영2차']
const selected = ref('')

watch(
  () => props.modelValue,
  (open) => {
    if (open) selected.value = ''
  },
)

function close() {
  emit('update:modelValue', false)
}

function confirm() {
  if (!selected.value) {
    window.alert('불러올 차수를 선택해 주세요.')
    return
  }
  if (
    !window.confirm(
      `선택한 차수(${selected.value})의 시나리오로 현재 내용을 덮어쓰시겠습니까?\n기존에 입력한 내용은 사라집니다.`,
    )
  ) {
    return
  }
  emit('confirm', selected.value)
  close()
}
</script>

<template>
  <BaseModal title="시나리오 불러오기" :visible="modelValue" @close="close">
    <p class="notice">
      불러올 차수를 선택하세요. 확인 시 현재 화면의 시나리오가 선택한 차수 기준으로 덮어쓰기 됩니다.
    </p>
    <div v-if="!availableRounds.length" class="empty">불러올 시나리오가 없습니다.</div>
    <ul v-else class="round-list">
      <li v-for="r in availableRounds" :key="r">
        <label class="round-item">
          <input v-model="selected" type="radio" name="load-round" :value="r" />
          {{ r }}
        </label>
      </li>
    </ul>
    <template #footer>
      <button type="button" class="btn btn--ghost" @click="close">취소</button>
      <button type="button" class="btn btn--primary" @click="confirm">불러오기</button>
    </template>
  </BaseModal>
</template>

<style scoped>
.notice {
  margin: 0 0 14px;
  font-size: calc(12px + var(--font-size-offset, 0px));
  line-height: 1.55;
  color: var(--lnb-muted);
}

.empty {
  padding: 32px;
  text-align: center;
  font-size: calc(12px + var(--font-size-offset, 0px));
  color: var(--lnb-muted);
}

.round-list {
  margin: 0;
  padding: 0;
  list-style: none;
  border: 1px solid var(--lnb-line);
  border-radius: 8px;
  overflow: hidden;
}

.round-item {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 11px 14px;
  font-size: calc(13px + var(--font-size-offset, 0px));
  cursor: pointer;
  border-bottom: 1px solid var(--lnb-line);
}

.round-list li:last-child .round-item {
  border-bottom: none;
}

.round-item:hover {
  background: var(--teal-50);
}
</style>
