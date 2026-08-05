<script setup>
// POP-M-DAS-02 요구사항 목록 (조회 전용)
import { computed, ref, watch } from 'vue'
import { useRouter } from 'vue-router'
import BaseModal from '@/shared/ui/BaseModal.vue'
import { useProjectStore } from '@/app/stores/project'
import { useTabsStore } from '@/app/stores/tabs'
import { useSubTabsStore } from '@/app/stores/subTabs'
import { getDashboardRequirements } from '@/entities/dashboard/mock/dashboardRequirementPopup'

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

const expandedIds = ref(new Set())
const allExpanded = computed(() => rows.value.length > 0 && expandedIds.value.size === rows.value.length)

watch(
  () => props.context,
  () => {
    expandedIds.value = new Set()
  },
)

function toggleRow(reqId) {
  const next = new Set(expandedIds.value)
  if (next.has(reqId)) next.delete(reqId)
  else next.add(reqId)
  expandedIds.value = next
}

function toggleAll() {
  expandedIds.value = allExpanded.value ? new Set() : new Set(rows.value.map((r) => r.reqId))
}

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
    route: '/workspace/requirement',
  })
  subTabsStore.openSubTab(id, {
    id: 'requirement',
    title: '요구사항',
    route: '/workspace/requirement',
  })
  close()
  router.push('/workspace/requirement')
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
        <div class="toolbar__actions">
          <button
            v-if="rows.length"
            type="button"
            class="btn btn--ghost btn--sm"
            @click="toggleAll"
          >
            {{ allExpanded ? '전체 닫기' : '전체 열기' }}
          </button>
          <button type="button" class="btn btn--primary btn--sm" @click="goRequirement">
            요구사항 관리
          </button>
        </div>
      </div>

      <div class="table-wrap">
        <table class="tbl">
          <thead>
            <tr>
              <th class="col-toggle"></th>
              <th>No.</th>
              <th>요구사항ID</th>
              <th>시스템/업무구분</th>
              <th>화면경로</th>
              <th>화면명</th>
              <th>구분</th>
              <th>요구사항명</th>
              <th>업무유형</th>
              <th>상태</th>
              <th>우선순위</th>
              <th>등록일시/등록자</th>
            </tr>
          </thead>
          <tbody>
            <template v-for="row in rows" :key="row.reqId">
              <tr class="tbl__row" @click="toggleRow(row.reqId)">
                <td class="col-toggle">
                  <span class="toggle-ico" :class="{ 'is-open': expandedIds.has(row.reqId) }">▸</span>
                </td>
                <td>{{ row.no }}</td>
                <td>{{ row.reqId }}</td>
                <td>{{ row.systemPath }}</td>
                <td>{{ row.screenPath }}</td>
                <td>{{ row.screenName }}</td>
                <td>{{ row.reqType }}</td>
                <td class="tbl__name">{{ row.name }}</td>
                <td>{{ row.taskTypes?.join(', ') }}</td>
                <td>{{ row.status }}</td>
                <td>{{ row.priority }}</td>
                <td>{{ row.registeredAt }}<br /><span class="muted">{{ row.registeredBy }}</span></td>
              </tr>
              <tr v-if="expandedIds.has(row.reqId)" class="detail-row">
                <td colspan="11">
                  <div class="detail-block">
                    <div class="detail-block__item">
                      <span class="detail-block__lab">요구사항원안</span>
                      <p>{{ row.original || '-' }}</p>
                    </div>
                    <div class="detail-block__item">
                      <span class="detail-block__lab">요구사항분석</span>
                      <p>{{ row.analysis || '-' }}</p>
                    </div>
                  </div>
                </td>
              </tr>
            </template>
            <tr v-if="!rows.length">
              <td colspan="11" class="empty">등록된 요구사항이 없습니다.</td>
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
  overflow-x: auto;
}

.tbl {
  width: 100%;
  border-collapse: collapse;
  font-size: calc(12px + var(--font-size-offset, 0px));
}

.tbl thead th {
  background: var(--lnb-side);
  color: var(--lnb-txt);
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
  max-width: 200px;
}

.muted {
  color: var(--lnb-muted);
  font-size: calc(11px + var(--font-size-offset, 0px));
}

.empty {
  text-align: center;
  color: var(--lnb-muted);
  padding: 28px 12px !important;
}

.toolbar__actions {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-shrink: 0;
}

.tbl__row {
  cursor: pointer;
}

.tbl__row:hover {
  background: var(--teal-50);
}

.col-toggle {
  width: 24px;
}

.toggle-ico {
  display: inline-block;
  color: var(--lnb-muted);
  transition: transform 0.15s ease;
}

.toggle-ico.is-open {
  transform: rotate(90deg);
  color: var(--teal-600);
}

.detail-row td {
  background: var(--teal-50);
  padding: 0 !important;
}

.detail-block {
  display: flex;
  flex-direction: column;
  gap: 8px;
  padding: 12px 16px;
}

.detail-block__item p {
  margin: 4px 0 0;
  color: var(--lnb-txt);
  line-height: 1.5;
}

.detail-block__lab {
  font-size: calc(11px + var(--font-size-offset, 0px));
  font-weight: 700;
  color: var(--teal-600);
}
</style>
