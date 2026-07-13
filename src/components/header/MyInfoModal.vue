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

function close() {
  emit('update:modelValue', false)
}

function openPasswordReset() {
  close()
  emit('password-reset')
}

function logout() {
  authStore.logout()
  projectStore.clearProject()
  close()
  router.push('/login')
}
</script>

<template>
  <HeaderLayerModal
    :model-value="modelValue"
    title="내 정보"
    width="420px"
    @update:model-value="emit('update:modelValue', $event)"
  >
    <div class="hdr-info">
      <div class="hdr-info__profile">
        <div class="hdr-info__avatar">{{ initials }}</div>
        <div class="hdr-info__who">
          <div class="hdr-info__name">{{ profile.name }}</div>
          <div class="hdr-info__role">{{ profile.dept }} · {{ profile.role }}</div>
          <div v-if="profile.position" class="hdr-info__pos">{{ profile.position }}</div>
        </div>
      </div>

      <dl class="hdr-info__dl">
        <div class="hdr-info__row">
          <dt>사번 / ID</dt>
          <dd>{{ profile.id }}</dd>
        </div>
        <div class="hdr-info__row">
          <dt>소속</dt>
          <dd>{{ profile.dept }}</dd>
        </div>
        <div class="hdr-info__row">
          <dt>이메일</dt>
          <dd>{{ profile.email }}</dd>
        </div>
        <div v-if="profile.lastLogin" class="hdr-info__row">
          <dt>최근 로그인</dt>
          <dd>{{ profile.lastLogin }}</dd>
        </div>
      </dl>

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
        <button class="hdr-info__btn" type="button" @click="openPasswordReset">비밀번호 변경</button>
        <button class="hdr-info__btn hdr-info__btn--danger" type="button" @click="logout">로그아웃</button>
      </div>
    </div>
  </HeaderLayerModal>
</template>
