<script setup>
// POP-M-COM-04 통합 검색
import { ref, computed, watch, onMounted, onBeforeUnmount } from 'vue'
import { useRouter } from 'vue-router'
import HeaderLayerModal from './HeaderLayerModal.vue'
import {
  searchItems,
  searchTypeLabel,
  recentProjects as recentProjectsSeed,
  searchResultExamples,
} from '@/data/headerPopups'

const props = defineProps({
  modelValue: { type: Boolean, default: false },
})
const emit = defineEmits(['update:modelValue'])

const router = useRouter()
const keyword = ref('')
const activeTab = ref('all')
const searched = ref(false)
const recentProjects = ref(recentProjectsSeed.map((p) => ({ ...p })))

const tabs = [
  { id: 'all', label: '전체' },
  { id: 'menu', label: '메뉴' },
  { id: 'project', label: '프로젝트' },
  { id: 'task', label: '업무' },
]

function filterByTab(list) {
  if (activeTab.value === 'all') return list
  return list.filter((item) => item.type === activeTab.value)
}

const results = computed(() => {
  if (!searched.value) return []

  const q = keyword.value.trim().toLowerCase()
  const pool = q ? searchItems : searchResultExamples

  return filterByTab(pool).filter((item) => {
    if (!q) return true
    const hay = [item.label, item.group, item.project, item.stage]
      .filter(Boolean)
      .join(' ')
      .toLowerCase()
    return hay.includes(q)
  })
})

function runSearch() {
  searched.value = true
}

function resetSearch() {
  keyword.value = ''
  searched.value = false
  activeTab.value = 'all'
}

function close() {
  emit('update:modelValue', false)
}

function selectItem(item) {
  close()
  router.push(item.route)
}

function selectRecent(project) {
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
onBeforeUnmount(() => window.removeEventListener('keydown', onKeydown))
</script>

<template>
  <HeaderLayerModal
    :model-value="modelValue"
    title="통합 검색"
    width="560px"
    @update:model-value="emit('update:modelValue', $event)"
  >
    <div class="hdr-search">
      <div class="hdr-search__bar">
        <input
          v-model="keyword"
          class="hdr-search__input"
          type="text"
          placeholder="메뉴, 프로젝트, 업무를 검색하세요"
          @keydown.enter="runSearch"
        />
        <button class="hdr-search__btn" type="button" @click="runSearch">검색</button>
      </div>
      <p class="hdr-search__hint">검색 버튼 또는 F2 키로 검색합니다.</p>

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
        <div v-if="!recentProjects.length" class="hdr-empty hdr-empty--sm">최근 조회 프로젝트가 없습니다.</div>
        <ul v-else class="hdr-scroll hdr-scroll--search">
          <li v-for="project in recentProjects" :key="project.id" class="hdr-recent-row">
            <button class="hdr-recent__item" type="button" @click="selectRecent(project)">
              <span class="hdr-recent__stage" :class="project.stageType">{{ project.stage }}</span>
              <span class="hdr-recent__name">{{ project.name }}</span>
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
        <div class="hdr-tabs">
          <button
            v-for="tab in tabs"
            :key="tab.id"
            class="hdr-tabs__item"
            :class="{ 'is-active': activeTab === tab.id }"
            type="button"
            @click="activeTab = tab.id"
          >{{ tab.label }}</button>
        </div>

        <div class="hdr-section-title">
          검색 결과 <span class="hdr-section-title__cnt">({{ results.length }}건)</span>
        </div>

        <div v-if="keyword.trim() && !results.length" class="hdr-empty">검색 결과가 없습니다.</div>
        <ul v-else class="hdr-scroll hdr-scroll--search">
          <li v-for="item in results" :key="item.id">
            <button class="hdr-result__item" type="button" @click="selectItem(item)">
              <span class="hdr-result__type">{{ searchTypeLabel[item.type] }}</span>
              <div class="hdr-result__text">
                <div class="hdr-result__label">{{ item.label }}</div>
                <div class="hdr-result__meta">
                  {{ item.group }}
                  <template v-if="item.project"> · {{ item.project }}</template>
                  <template v-if="item.stage"> · {{ item.stage }}</template>
                </div>
              </div>
            </button>
          </li>
        </ul>
      </template>
    </div>
  </HeaderLayerModal>
</template>
