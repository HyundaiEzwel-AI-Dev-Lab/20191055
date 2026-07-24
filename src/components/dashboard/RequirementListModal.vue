<script setup>
// POP-M-DAS-02 요구사항 목록 (조회 전용)
import { computed } from 'vue'
import { useRouter } from 'vue-router'
import BaseModal from '@/components/ui/BaseModal.vue'
import { useProjectStore } from '@/stores/project'
import { useTabsStore } from '@/stores/tabs'
import { useSubTabsStore } from '@/stores/subTabs'
import { getDashboardRequirements } from '@/data/dashboardRequirementPopup'

const props = defineProps({
  modelValue: { type: Boolean, default: false },
  /** { id, name, projectId?, requestDept, stage? } */
  context: { type: Object, default: null },
})

const emit = defineEmits(['update:modelValue'])

const router = useRouter()
const projectStore = useProjectStore()
const tabsStore = useTabsStore()
const subTabsStore = useSubTabsStore()

const rows = computed(() => {
  if (!props.context) return []
  return getDashboardRequirements(props.context.id || props.context.projectId)
})

function close() {
  emit('update:modelValue', false)
}

function goRequirement() {
  if (!props.context) return
  const id = props.context.id || props.context.projectId
  const name = props.context.name || '프로젝트'
  const stage = props.context.stage || '처리중'

  projectStore.setCurrentProject({ id, name, stage })
  tabsStore.openProjectTab({
    projectId: id,
    title: name,
    projectName: name,
    route: '/project/requirement',
  })
  subTabsStore.openSubTab(id, {
    id: 'requirement',
    title: '요구사항',
    route: '/project/requirement',
  })
  close()
  router.push('/project/requirement')
}
</script>

<template>
  <BaseModal
    title="요구사항 목록"
    :visible="modelValue && !!context"
    wide
    @close="close"
  >
    <template v-if="context">
      <div class="toolbar">
        <div class="toolbar__meta">
          <p class="toolbar__name">{{ context.name }}</p>
          <p class="toolbar__sub">
            <span v-if="context.projectId">{{ context.projectId }} · </span>
            요청부서 {{ context.requestDept || '—' }}
          </p>
        </div>
        <button type="button" class="btn btn--primary btn--sm" @click="goRequirement">
          요구사항 관리
        </button>
      </div>

      <div class="table-wrap">
        <table class="tbl">
          <thead>
            <tr>
              <th>No.</th>
              <th>요구사항ID</th>
              <th>요구사항명</th>
              <th>상태</th>
              <th>우선순위</th>
              <th>등록일</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="row in rows" :key="row.reqId">
              <td>{{ row.no }}</td>
              <td>{{ row.reqId }}</td>
              <td class="tbl__name">{{ row.name }}</td>
              <td>{{ row.status }}</td>
              <td>{{ row.priority }}</td>
              <td>{{ row.registeredAt }}</td>
            </tr>
            <tr v-if="!rows.length">
              <td colspan="6" class="empty">등록된 요구사항이 없습니다.</td>
            </tr>
          </tbody>
        </table>
      </div>
    </template>
  </BaseModal>
</template>

<style scoped>
.toolbar {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 12px;
  margin-bottom: 14px;
}

.toolbar__name {
  margin: 0 0 4px;
  font-size: calc(13px + var(--font-size-offset, 0px));
  font-weight: 700;
  color: var(--lnb-txt);
}

.toolbar__sub {
  margin: 0;
  font-size: calc(12px + var(--font-size-offset, 0px));
  color: var(--lnb-muted);
}

.table-wrap {
  border: 1px solid var(--lnb-line);
  border-radius: 10px;
  overflow: hidden;
}

.tbl {
  width: 100%;
  border-collapse: collapse;
  font-size: calc(12px + var(--font-size-offset, 0px));
}

.tbl thead th {
  background: var(--lnb-side);
  color: var(--lnb-muted);
  font-weight: 600;
  text-align: left;
  padding: 9px 11px;
  border-bottom: 1px solid var(--lnb-line);
  white-space: nowrap;
}

.tbl tbody td {
  padding: 10px 11px;
  border-bottom: 1px solid var(--lnb-line);
  color: var(--lnb-txt);
  vertical-align: top;
}

.tbl tbody tr:last-child td {
  border-bottom: none;
}

.tbl__name {
  font-weight: 600;
  max-width: 240px;
}

.empty {
  text-align: center;
  color: var(--lnb-muted);
  padding: 28px 12px !important;
}
</style>
