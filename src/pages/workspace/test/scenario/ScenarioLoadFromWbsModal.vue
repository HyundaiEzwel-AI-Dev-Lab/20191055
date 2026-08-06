<script setup>
// POP-S-UAT-05 시나리오 불러오기 — DEV모드는 단위테스트만, 운영(UAT)모드는 DEV+운영 차수만 단일선택 → 덮어쓰기
import { computed, ref, watch } from 'vue'
import BaseModal from '@/shared/ui/BaseModal.vue'
import { roundCaseCounts } from '@/entities/scenario/mock/scenario'

const props = defineProps({
  modelValue: { type: Boolean, default: false },
  mode: { type: String, default: 'dev' },
})

const emit = defineEmits(['update:modelValue', 'confirm'])

const ALL_ROUNDS = ['단위테스트', 'DEV1차', 'DEV2차', 'DEV3차', '운영1차', '운영2차']
const availableRounds = computed(() =>
  props.mode === 'uat'
    ? ALL_ROUNDS.filter((r) => r !== '단위테스트')
    : ALL_ROUNDS.filter((r) => r === '단위테스트'),
)
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
      `선택한 ${selected.value} 시나리오를 불러오시겠습니까? 기존에 입력한 내용은 사라집니다.`,
    )
  ) {
    return
  }
  emit('confirm', selected.value)
  window.alert('선택한 시나리오를 불러왔습니다.')
  close()
}
</script>

<template>
  <BaseModal title="시나리오 불러오기" :visible="modelValue" @close="close">
    <p class="notice">
      불러올 시나리오를 선택한 후 [불러오기] 버튼을 클릭하세요. 현재 편집 중인 시나리오는 선택한 시나리오로 덮어쓰기됩니다.
    </p>
    <div v-if="!availableRounds.length" class="empty">불러올 시나리오가 없습니다.</div>
    <ul v-else class="round-list">
      <li v-for="r in availableRounds" :key="r">
        <label class="round-item">
          <input v-model="selected" type="radio" name="load-round" :value="r" />
          {{ r }}
          <span class="round-item__count">{{ roundCaseCounts[r] ?? 0 }}case</span>
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

.round-item__count {
  margin-left: auto;
  font-size: calc(11.5px + var(--font-size-offset, 0px));
  color: var(--lnb-muted);
}

.round-list li:last-child .round-item {
  border-bottom: none;
}

.round-item:hover {
  background: var(--teal-50);
}
</style>
