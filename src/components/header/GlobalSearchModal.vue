<script setup>
// POP-M-COM-04 프로젝트 검색 (프로젝트명/프로젝트ID/요청자명 전용 검색)
import { ref, computed, watch, onMounted, onBeforeUnmount } from 'vue'
import { useRouter } from 'vue-router'
import HeaderLayerModal from './HeaderLayerModal.vue'
import { useProjectStore } from '@/stores/project'
import { useTabsStore } from '@/stores/tabs'
import { recentProjects as recentProjectsSeed, searchableProjects } from '@/data/headerPopups'

const props = defineProps({
  modelValue: { type: Boolean, default: false },
})
const emit = defineEmits(['update:modelValue'])

const router = useRouter()
const projectStore = useProjectStore()
const tabsStore = useTabsStore()
const keyword = ref('')
const searched = ref(false)
const recentProjects = ref(recentProjectsSeed.map((p) => ({ ...p })))

const results = computed(() => {
  if (!searched.value) return []
  const q = keyword.value.trim().toLowerCase()
  if (!q) return []
  return searchableProjects.filter((item) => {
    const hay = [item.name, item.projectId, item.requester].filter(Boolean).join(' ').toLowerCase()
    return hay.includes(q)
  })
})

let autoSearchTimer = null

function runSearch() {
  searched.value = true
}

function resetSearch() {
  clearTimeout(autoSearchTimer)
  keyword.value = ''
  searched.value = false
}

watch(keyword, (val) => {
  clearTimeout(autoSearchTimer)
  if (!val.trim()) {
    searched.value = false
    return
  }
  autoSearchTimer = setTimeout(() => {
    searched.value = true
  }, 300)
})

function close() {
  emit('update:modelValue', false)
}

function openProjectFrom(id, name, stage) {
  projectStore.setCurrentProject({ id, name, stage })
  tabsStore.openProjectTab({
    projectId: id,
    title: name,
    projectName: name,
    route: '/workspace/info',
  })
}

function selectProject(project) {
  openProjectFrom(project.id, project.name, project.stage)
  close()
  router.push(project.route)
}

function removeRecentProject(id) {
  recentProjects.value = recentProjects.value.filter((p) => p.id !== id)
}

function clearRecentProjects() {
  recentProjects.value = []
}

function onKeydown(e) {
  if (!props.modelValue) return
  if (e.key === 'F2') {
    e.preventDefault()
    runSearch()
  }
}

watch(
  () => props.modelValue,
  (open) => {
    if (!open) resetSearch()
  },
)

onMounted(() => window.addEventListener('keydown', onKeydown))
onBeforeUnmount(() => {
  window.removeEventListener('keydown', onKeydown)
  clearTimeout(autoSearchTimer)
})
</script>

<template>
  <HeaderLayerModal
    :model-value="modelValue"
    title="프로젝트 검색"
    width="560px"
    @update:model-value="emit('update:modelValue', $event)"
  >
    <div class="hdr-search">
      <div class="hdr-search__bar">
        <input
          v-model="keyword"
          class="hdr-search__input"
          type="text"
          placeholder="프로젝트명 (프로젝트ID), 요청자명을 입력하세요."
          @keydown.enter="runSearch"
        />
        <button class="hdr-search__btn" type="button" @click="runSearch">검색</button>
      </div>
      <p class="hdr-search__hint">입력하면 자동으로 검색되며, 검색 버튼 또는 F2 키로도 검색할 수 있습니다.</p>

      <template v-if="!searched">
        <div class="hdr-section-head">
          <div class="hdr-section-title">최근 조회 프로젝트</div>
          <button
            v-if="recentProjects.length"
            class="hdr-section-clear"
            type="button"
            @click="clearRecentProjects"
          >전체 삭제</button>
        </div>
        <div v-if="!recentProjects.length" class="hdr-empty hdr-empty--sm">최근 조회한 프로젝트가 없습니다.</div>
        <ul v-else class="hdr-scroll hdr-scroll--search">
          <li v-for="project in recentProjects" :key="project.id" class="hdr-recent-row">
            <button class="hdr-recent__item" type="button" @click="selectProject(project)">
              <div class="hdr-result__text">
                <div class="hdr-result__label">{{ project.projectId }} ({{ project.openMonth }}) {{ project.name }}</div>
                <div class="hdr-result__meta">{{ project.requester }}</div>
              </div>
            </button>
            <button
              class="hdr-recent__del"
              type="button"
              title="삭제"
              @click.stop="removeRecentProject(project.id)"
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M18 6 6 18M6 6l12 12" />
              </svg>
            </button>
          </li>
        </ul>
      </template>

      <template v-else>
        <div class="hdr-section-title">
          검색 결과 <span class="hdr-section-title__cnt">({{ results.length }}건)</span>
        </div>

        <div v-if="!keyword.trim()" class="hdr-empty">프로젝트명을 한 글자 이상 입력하세요.</div>
        <div v-else-if="!results.length" class="hdr-empty">검색 결과가 없습니다.</div>
        <ul v-else class="hdr-scroll hdr-scroll--search">
          <li v-for="item in results" :key="item.id">
            <button class="hdr-result__item" type="button" @click="selectProject(item)">
              <div class="hdr-result__text">
                <div class="hdr-result__label">{{ item.projectId }} ({{ item.openMonth }}) {{ item.name }}</div>
                <div class="hdr-result__meta">{{ item.requester }}</div>
              </div>
            </button>
          </li>
        </ul>
      </template>
    </div>
  </HeaderLayerModal>
</template>
