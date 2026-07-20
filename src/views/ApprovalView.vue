<script setup>
// PAG-M-SYS-04 신청 승인 관리
import { computed, ref } from 'vue'
import { useRouter } from 'vue-router'
import {
  approvalStatusOptions,
  requestTypeOptions,
  dateTypeOptions,
  pageSizeOptions,
  approvalList,
  matchApprovalFilters,
  approvalStatusClass,
} from '@/data/approval'
import ExcelDownloadButton from '@/components/ui/ExcelDownloadButton.vue'
import { mockExcelDownload } from '@/utils/excelDownload'

const router = useRouter()
const rows = approvalList
const filters = ref({
  status: '전체',
  type: '전체',
  project: '',
  requester: '',
  dateType: '요청일',
})
const applied = ref({ ...filters.value })
const pageSize = ref(20)
const currentPage = ref(1)
const selectedIds = ref([])
const selectedRow = ref(rows[0] || null)

const filtered = computed(() => rows.filter((r) => matchApprovalFilters(r, applied.value)))
const paged = computed(() => {
  const start = (currentPage.value - 1) * pageSize.value
  return filtered.value.slice(start, start + pageSize.value)
})
const totalPages = computed(() => Math.max(1, Math.ceil(filtered.value.length / pageSize.value)))

function search() {
  applied.value = { ...filters.value }
  currentPage.value = 1
  selectedIds.value = []
  selectedRow.value = filtered.value[0] || null
}

function resetFilters() {
  filters.value = {
    status: '전체',
    type: '전체',
    project: '',
    requester: '',
    dateType: '요청일',
  }
  search()
}

function toggleSelect(id) {
  const idx = selectedIds.value.indexOf(id)
  if (idx >= 0) selectedIds.value.splice(idx, 1)
  else selectedIds.value.push(id)
}

function toggleSelectAll(e) {
  selectedIds.value = e.target.checked ? paged.value.map((r) => r.id) : []
}

function selectRow(row) {
  selectedRow.value = row
}

function applyStatus(status) {
  const targets = selectedIds.value.length
    ? rows.filter((r) => selectedIds.value.includes(r.id))
    : selectedRow.value
      ? [selectedRow.value]
      : []

  if (!targets.length) {
    window.alert('승인 대상을 선택해 주세요.')
    return
  }

  const pending = targets.filter((r) => r.status === '승인요청')
  if (!pending.length) {
    window.alert('승인요청 상태의 건만 처리할 수 있습니다.')
    return
  }

  if (!window.confirm(`${pending.length}건을 ${status} 처리하시겠습니까?`)) return

  pending.forEach((r) => {
    r.status = status
    r.approveDate = '2026-05-21'
  })
  selectedIds.value = []
  window.alert(`${pending.length}건을 ${status} 처리했습니다.`)
}

function goProject() {
  if (!selectedRow.value) return
  router.push('/project/info')
}

function onExcelDownload() {
  mockExcelDownload('신청 승인 관리', filtered.value, [
    { key: 'id', label: 'NO' },
    { key: 'status', label: '승인상태' },
    { key: 'type', label: '요청유형' },
    { key: 'projectName', label: '프로젝트명' },
    { key: 'openDate', label: '오픈예정일' },
    { key: 'before', label: '변경전' },
    { key: 'after', label: '변경후' },
    { key: 'requester', label: '요청자' },
    { key: 'requestDate', label: '요청일자' },
    { key: 'approveDate', label: '승인일자' },
    { key: 'reason', label: '요청사유' },
  ])
}
</script>

<template>
  <div class="admin-page">
    <section class="filter card">
      <div class="filter__row filter__row--5">
        <div class="filter__field">
          <label>승인상태</label>
          <select v-model="filters.status" class="filter__select">
            <option v-for="o in approvalStatusOptions" :key="o" :value="o">{{ o === '전체' ? '선택' : o }}</option>
          </select>
        </div>
        <div class="filter__field">
          <label>요청유형</label>
          <select v-model="filters.type" class="filter__select">
            <option v-for="o in requestTypeOptions" :key="o" :value="o">{{ o === '전체' ? '선택' : o }}</option>
          </select>
        </div>
        <div class="filter__field">
          <label>프로젝트명</label>
          <input v-model="filters.project" class="filter__input" type="text" placeholder="프로젝트명" @keyup.enter="search" />
        </div>
        <div class="filter__field">
          <label>요청자</label>
          <input v-model="filters.requester" class="filter__input" type="text" placeholder="요청자" @keyup.enter="search" />
        </div>
        <div class="filter__field">
          <label>날짜</label>
          <select v-model="filters.dateType" class="filter__select">
            <option v-for="o in dateTypeOptions" :key="o" :value="o">{{ o }}</option>
          </select>
        </div>
      </div>
      <div class="filter__actions">
        <button type="button" class="btn btn--ghost" @click="resetFilters">초기화</button>
        <button type="button" class="btn btn--primary" @click="search">조회</button>
      </div>
    </section>

    <div class="toolbar">
      <span class="toolbar__count">승인요청 내역 · 총 <b>{{ filtered.length }}</b>건</span>
      <select v-model="pageSize" class="toolbar__mini" @change="currentPage = 1">
        <option v-for="n in pageSizeOptions" :key="n" :value="n">{{ n }}건씩 보기</option>
      </select>
      <div class="toolbar__actions">
        <button type="button" class="btn btn--ghost btn--sm" @click="applyStatus('승인반려')">승인반려</button>
        <button type="button" class="btn btn--primary btn--sm" @click="applyStatus('승인완료')">승인완료</button>
        <ExcelDownloadButton @click="onExcelDownload" />
      </div>
    </div>

    <div class="listcard">
      <div class="listcard__scroll">
        <table class="data-table" style="min-width: 1080px">
          <thead>
            <tr>
              <th style="width: 36px"><input type="checkbox" @change="toggleSelectAll" /></th>
              <th style="width: 48px">NO</th>
              <th>승인상태</th>
              <th>요청유형</th>
              <th>프로젝트명</th>
              <th>오픈예정일</th>
              <th>변경전</th>
              <th>변경후</th>
              <th>요청자</th>
              <th>요청일자</th>
              <th>승인일자</th>
            </tr>
          </thead>
          <tbody>
            <tr
              v-for="row in paged"
              :key="row.id"
              :class="{ 'is-selected': selectedRow?.id === row.id }"
              @click="selectRow(row)"
            >
              <td @click.stop>
                <input
                  type="checkbox"
                  :checked="selectedIds.includes(row.id)"
                  @change="toggleSelect(row.id)"
                />
              </td>
              <td>{{ row.id }}</td>
              <td>
                <span class="badge" :class="`badge--${approvalStatusClass(row.status)}`">{{ row.status }}</span>
              </td>
              <td>{{ row.type }}</td>
              <td>
                <button type="button" class="link-btn" @click.stop="selectRow(row)">{{ row.projectName }}</button>
              </td>
              <td>{{ row.openDate }}</td>
              <td class="tbl__muted">{{ row.before }}</td>
              <td>{{ row.after }}</td>
              <td>{{ row.requester }}</td>
              <td>{{ row.requestDate }}</td>
              <td>{{ row.approveDate }}</td>
            </tr>
            <tr v-if="!paged.length">
              <td colspan="11" class="empty">조회 결과가 없습니다.</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <div v-if="totalPages > 1" class="pager">
      <button type="button" class="pager__btn" :disabled="currentPage <= 1" @click="currentPage -= 1">이전</button>
      <span class="pager__info">{{ currentPage }} / {{ totalPages }}</span>
      <button type="button" class="pager__btn" :disabled="currentPage >= totalPages" @click="currentPage += 1">다음</button>
    </div>

    <section v-if="selectedRow" class="card detail-card">
      <h3 class="detail-card__title">승인요청 상세</h3>
      <div class="detail-grid detail-grid--3">
        <div class="detail-field">
          <label>프로젝트 명</label>
          <div class="detail-value">{{ selectedRow.projectName }}</div>
        </div>
        <div class="detail-field">
          <label>오픈예정일</label>
          <div class="detail-value">{{ selectedRow.openDate }}</div>
        </div>
        <div class="detail-field detail-field--end">
          <button type="button" class="btn btn--ghost btn--sm" @click="goProject">프로젝트 바로가기 ↗</button>
        </div>
        <div class="detail-field">
          <label>변경 요청자</label>
          <div class="detail-value">{{ selectedRow.requester }}</div>
        </div>
        <div class="detail-field detail-field--wide">
          <label>요청 사유</label>
          <div class="detail-value">{{ selectedRow.reason }}</div>
        </div>
      </div>
    </section>
  </div>
</template>
