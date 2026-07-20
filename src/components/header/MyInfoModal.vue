<script setup>
// POP-M-COM-07 내 정보
import { computed } from 'vue'
import { storeToRefs } from 'pinia'
import { useRouter } from 'vue-router'
import HeaderLayerModal from './HeaderLayerModal.vue'
import { useAuthStore } from '@/stores/auth'
import { useProjectStore } from '@/stores/project'
import { useThemeStore, conceptOptions } from '@/stores/theme'
import { defaultUserProfile } from '@/data/headerPopups'
import { getSurname } from '@/utils/text'

defineProps({
  modelValue: { type: Boolean, default: false },
})
const emit = defineEmits(['update:modelValue', 'password-reset'])

const router = useRouter()
const authStore = useAuthStore()
const projectStore = useProjectStore()
const themeStore = useThemeStore()
const { user } = storeToRefs(authStore)
const { concept } = storeToRefs(themeStore)

const profile = computed(() => user.value || defaultUserProfile)

const initials = computed(() => getSurname(profile.value.name))

const affiliation = computed(() => {
  const dept = profile.value.dept || ''
  const position = profile.value.position || profile.value.role || ''
  if (dept && position) return `${dept} | ${position}`
  return dept || position || '-'
})

function close() {
  emit('update:modelValue', false)
}

function openPasswordReset() {
  close()
  emit('password-reset')
}

function logout() {
  if (!window.confirm('로그아웃 하시겠습니까?')) return
  authStore.logout()
  projectStore.clearProject()
  close()
  router.push('/login')
}
</script>

<template>
  <HeaderLayerModal
    :model-value="modelValue"
    title="내정보"
    width="360px"
    @update:model-value="emit('update:modelValue', $event)"
  >
    <div class="hdr-info">
      <div class="hdr-info__profile">
        <div class="hdr-info__avatar">{{ initials }}</div>
        <div class="hdr-info__who">
          <div class="hdr-info__name">
            {{ profile.name }}
            <span class="hdr-info__id">({{ profile.id }})</span>
          </div>
          <div class="hdr-info__role">{{ affiliation }}</div>
          <div v-if="profile.email" class="hdr-info__email">{{ profile.email }}</div>
        </div>
      </div>

      <!-- 1b. 비밀번호 변경 → POP-M-COM-03 -->
      <button type="button" class="hdr-info__pw" @click="openPasswordReset">
        <span>비밀번호 변경</span>
        <span class="hdr-info__pw-chev" aria-hidden="true">›</span>
      </button>

      <div v-if="profile.lastLogin" class="hdr-info__login">
        <span class="hdr-info__login-lab">최근 로그인</span>
        <span class="hdr-info__login-val">{{ profile.lastLogin }}</span>
      </div>

      <div class="hdr-info__concept">
        <div class="hdr-info__concept-lab">화면 컨셉</div>
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
        <p class="hdr-info__concept-desc">
          {{ conceptOptions.find((c) => c.value === concept)?.desc }}
        </p>
      </div>

      <div class="hdr-info__actions">
        <button class="hdr-info__btn hdr-info__btn--danger" type="button" @click="logout">
          로그아웃
        </button>
      </div>
    </div>
  </HeaderLayerModal>
</template>
