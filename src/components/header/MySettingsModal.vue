<script setup>
// 내정보 > 설정 — 프로필 색상 · 화면 컨셉
import { storeToRefs } from 'pinia'
import BaseModal from '@/components/ui/BaseModal.vue'
import {
  useThemeStore,
  conceptOptions,
  avatarColorOptions,
  avatarTextColor,
} from '@/stores/theme'
import { useAuthStore } from '@/stores/auth'
import { getSurname } from '@/utils/text'
import { defaultUserProfile } from '@/data/headerPopups'
import { computed } from 'vue'

defineProps({
  modelValue: { type: Boolean, default: false },
})
const emit = defineEmits(['update:modelValue'])

const themeStore = useThemeStore()
const authStore = useAuthStore()
const { concept, avatarColor } = storeToRefs(themeStore)
const { user } = storeToRefs(authStore)

const initials = computed(() =>
  getSurname(user.value?.name || defaultUserProfile.name),
)

function close() {
  emit('update:modelValue', false)
}
</script>

<template>
  <BaseModal title="설정" :visible="modelValue" @close="close">
    <div class="settings">
      <section class="settings__sec">
        <div class="settings__head">
          <h3 class="settings__title">프로필 이미지 색상</h3>
          <p class="settings__hint">아이콘 배경색을 선택하세요</p>
        </div>

        <div class="settings__preview">
          <div
            class="settings__avatar"
            :style="{ background: avatarColor, color: avatarTextColor(avatarColor) }"
          >
            {{ initials }}
          </div>
          <span class="settings__preview-lab">미리보기</span>
        </div>

        <div class="settings__swatches" role="listbox" aria-label="프로필 색상">
          <button
            v-for="color in avatarColorOptions"
            :key="color"
            type="button"
            class="settings__swatch"
            :class="{ on: avatarColor === color }"
            :style="{ background: color }"
            :aria-label="color"
            :aria-selected="avatarColor === color"
            @click="themeStore.setAvatarColor(color)"
          />
        </div>
      </section>

      <section class="settings__sec">
        <div class="settings__head">
          <h3 class="settings__title">색상 모드</h3>
          <p class="settings__hint">화면 전체 톤을 전환합니다</p>
        </div>
        <div class="concept-seg">
          <button
            v-for="c in conceptOptions"
            :key="c.value"
            type="button"
            class="concept-seg__item"
            :class="{ on: concept === c.value }"
            @click="themeStore.setConcept(c.value)"
          >
            {{ c.label }}
          </button>
        </div>
        <p class="settings__desc">
          {{ conceptOptions.find((c) => c.value === concept)?.desc }}
        </p>
      </section>
    </div>

    <template #footer>
      <button type="button" class="btn btn--primary" @click="close">확인</button>
    </template>
  </BaseModal>
</template>

<style scoped>
.settings {
  display: flex;
  flex-direction: column;
  gap: 22px;
}

.settings__sec {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.settings__head {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.settings__title {
  margin: 0;
  font-size: 13px;
  font-weight: 700;
  color: var(--lnb-txt);
}

.settings__hint {
  margin: 0;
  font-size: 11px;
  color: var(--lnb-muted);
}

.settings__preview {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px 14px;
  background: var(--lnb-hover);
  border-radius: var(--radius-md);
}

.settings__avatar {
  width: 48px;
  height: 48px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 18px;
  font-weight: 700;
  flex-shrink: 0;
}

.settings__preview-lab {
  font-size: 12px;
  font-weight: 600;
  color: var(--lnb-muted);
}

.settings__swatches {
  max-height: 146px;
  overflow-x: hidden;
  overflow-y: auto;
  display: grid;
  grid-template-columns: repeat(4, 50px);
  justify-content: space-between;
  row-gap: 6px;
  padding: 8px 6px;
  box-sizing: border-box;
}

.settings__swatch {
  width: 50px;
  height: 50px;
  border: none;
  border-radius: 50%;
  cursor: pointer;
  padding: 0;
  box-shadow: inset 0 0 0 1px rgba(0, 0, 0, 0.08);
  transition: transform var(--transition-fast), box-shadow var(--transition-fast);
}

.settings__swatch:hover {
  transform: scale(1.06);
}

.settings__swatch.on {
  box-shadow:
    0 0 0 2px var(--color-surface),
    0 0 0 3.5px var(--teal);
}

.settings__desc {
  margin: 0;
  font-size: 11.5px;
  color: var(--lnb-muted);
  line-height: 1.45;
}
</style>
