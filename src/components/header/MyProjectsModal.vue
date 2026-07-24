<script setup>
// POP-M-COM-06 내 프로젝트
import { ref, computed } from 'vue'
import { useRouter } from 'vue-router'
import HeaderLayerModal from './HeaderLayerModal.vue'
import { useProjectStore } from '@/stores/project'
import { useTabsStore } from '@/stores/tabs'
import { useAuthStore } from '@/stores/auth'
import { useProjectRegister } from '@/composables/useProjectRegister'
import { getMyProjects } from '@/data/headerPopups'

defineProps({
  modelValue: { type: Boolean, default: false },
})
const emit = defineEmits(['update:modelValue'])

const router = useRouter()
const projectStore = useProjectStore()
const tabsStore = useTabsStore()
const authStore = useAuthStore()
const { openRegisterModal } = useProjectRegister()
const keyword = ref('')

const myProjects = computed(() => getMyProjects(authStore.user?.id))

const filtered = computed(() => {
  const q = keyword.value.trim().toLowerCase()
  if (!q) return myProjects.value
  return myProjects.value.filter((p) =>
    [p.name, p.stage, p.role].join(' ').toLowerCase().includes(q),
  )
})

function close() {
  emit('update:modelValue', false)
}

function selectProject(project) {
  projectStore.setCurrentProject({
    id: project.id,
    name: project.name,
    stage: project.stage,
  })
  projectStore.setProjectList(myProjects.value)
  tabsStore.openProjectTab({
    projectId: project.id,
    title: project.name,
    projectName: project.name,
    route: '/project/info',
  })
  close()
  router.push('/project/info')
}

function isSelected(project) {
  return projectStore.currentProject?.id === project.id
}

function goRegister() {
  close()
  openRegisterModal()
}

function goAllProjects() {
  close()
  router.push('/integrated/project/status')
}
</script>

<template>
  <HeaderLayerModal
    :model-value="modelValue"
    title="내 프로젝트"
    width="520px"
    @update:model-value="emit('update:modelValue', $event)"
  >
    <div class="hdr-proj">
      <div class="hdr-proj__search">
        <input
          v-model="keyword"
          class="hdr-proj__input"
          type="text"
          placeholder="프로젝트명, 단계, 역할 검색"
        />
      </div>

      <button class="hdr-proj__add" type="button" @click="goRegister">
        <span class="hdr-proj__add-icon">＋</span> 프로젝트 등록
      </button>

      <div class="hdr-section-head">
        <div class="hdr-section-title">
          배정 프로젝트 <span class="hdr-section-title__cnt">({{ filtered.length }}건)</span>
        </div>
        <button class="hdr-section-clear" type="button" @click="goAllProjects">
          모든 프로젝트 보기 &gt;
        </button>
      </div>

      <div v-if="!filtered.length" class="hdr-empty">
        {{ keyword.trim() ? '검색 결과가 없습니다.' : '배정된 프로젝트가 없습니다.' }}
      </div>
      <ul v-else class="hdr-scroll hdr-scroll--proj">
        <li v-for="project in filtered" :key="project.id">
          <button
            class="hdr-proj__item"
            :class="{ 'is-selected': isSelected(project) }"
            type="button"
            @click="selectProject(project)"
          >
            <div class="hdr-proj__main">
              <div class="hdr-proj__name">{{ project.name }}</div>
              <div class="hdr-proj__meta">
                {{ project.openDate }} ( {{ project.dday }} ) · {{ project.role }}
              </div>
            </div>
            <span class="hdr-proj__stage" :class="project.stageType">{{ project.stage }}</span>
          </button>
        </li>
      </ul>
    </div>
  </HeaderLayerModal>
</template>
