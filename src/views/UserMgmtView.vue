<script setup>
// PAG-M-SYS-01 사용자 관리
import { computed, reactive, ref } from 'vue'
import {
  deptOptions,
  roleOptions,
  statusOptions,
  pageSizeOptions,
  userList,
  matchUserFilters,
  userStatusClass,
} from '@/data/userMgmt'
import BaseModal from '@/components/ui/BaseModal.vue'

const rows = ref(userList.map((r) => ({ ...r })))
const filters = ref({ keyword: '', dept: '전체', role: '전체', status: '전체' })
const applied = ref({ ...filters.value })
const pageSize = ref(20)
const currentPage = ref(1)
const selectedIds = ref([])

const showDetail = ref(false)
const showRegister = ref(false)
const detailTarget = ref(null)
const detailRole = ref('사용자')
const registerForm = reactive({
  id: '',
  name: '',
  dept: '테크기획팀',
  role: '사용자',
  position: '',
  email: '',
  phone: '',
  type: '임직원',
})

const filtered = computed(() => rows.value.filter((r) => matchUserFilters(r, applied.value)))
const paged = computed(() => {
  const start = (currentPage.value - 1) * pageSize.value
  return filtered.value.slice(start, start + pageSize.value)
})
const totalPages = computed(() => Math.max(1, Math.ceil(filtered.value.length / pageSize.value)))

function search() {
  applied.value = { ...filters.value }
  currentPage.value = 1
  selectedIds.value = []
}

function resetFilters() {
  filters.value = { keyword: '', dept: '전체', role: '전체', status: '전체' }
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

function openDetail(row) {
  detailTarget.value = row
  detailRole.value = row.role
  showDetail.value = true
}

function saveDetail() {
  if (!detailTarget.value) return
  if (!detailRole.value || detailRole.value === '전체') {
    window.alert('권한을 선택해 주세요.')
    return
  }
  if (!window.confirm('사용자 정보를 저장하시겠습니까?')) return
  detailTarget.value.role = detailRole.value
  showDetail.value = false
  window.alert('저장되었습니다.')
}

function resetDetailPassword() {
  if (!detailTarget.value) return
  const temp = tempPassword()
  if (!window.confirm(`${detailTarget.value.name}님의 비밀번호를 임시 비밀번호(${temp})로 초기화하시겠습니까?`)) return
  window.alert(`비밀번호가 임시 비밀번호(${temp})로 초기화되었습니다.`)
}

function unlockDetailFails() {
  if (!detailTarget.value) return
  if (!window.confirm(`${detailTarget.value.name}님의 오류 횟수를 해제하시겠습니까?`)) return
  detailTarget.value.failCount = 0
  if (detailTarget.value.status === '잠금') detailTarget.value.status = '재직'
  window.alert('오류 횟수를 해제했습니다.')
}

function unlockFails() {
  if (!selectedIds.value.length) {
    window.alert('대상 사용자를 선택해 주세요.')
    return
  }
  if (!window.confirm(`${selectedIds.value.length}명의 오류 횟수를 해제하시겠습니까?`)) return
  rows.value.forEach((r) => {
    if (selectedIds.value.includes(r.id)) {
      r.failCount = 0
      if (r.status === '잠금') r.status = '재직'
    }
  })
  window.alert(`${selectedIds.value.length}명의 오류 횟수를 해제했습니다.`)
  selectedIds.value = []
}

function tempPassword() {
  const today = new Date()
  const y = today.getFullYear()
  const m = String(today.getMonth() + 1).padStart(2, '0')
  const d = String(today.getDate()).padStart(2, '0')
  return `ez!${y}${m}${d}`
}

function resetPassword() {
  if (!selectedIds.value.length) {
    window.alert('대상 사용자를 선택해 주세요.')
    return
  }
  const temp = tempPassword()
  if (!window.confirm(`선택한 ${selectedIds.value.length}명의 비밀번호를 임시 비밀번호(${temp})로 초기화하시겠습니까?`)) return
  window.alert(`${selectedIds.value.length}명의 비밀번호가 임시 비밀번호(${temp})로 초기화되었습니다.`)
}

function openRegister() {
  Object.assign(registerForm, {
    id: '',
    name: '',
    dept: '테크기획팀',
    role: '사용자',
    position: '',
    email: '',
    phone: '',
    type: '임직원',
  })
  showRegister.value = true
}

function saveRegister() {
  if (!registerForm.id.trim() || !registerForm.name.trim()) {
    window.alert('사번(ID)과 이름은 필수입니다.')
    return
  }
  if (rows.value.some((r) => r.id === registerForm.id.trim())) {
    window.alert('이미 존재하는 사번(ID)입니다.')
    return
  }
  rows.value.unshift({
    ...registerForm,
    id: registerForm.id.trim(),
    name: registerForm.name.trim(),
    status: '재직',
    failCount: 0,
  })
  showRegister.value = false
  search()
}
</script>

<template>
  <div class="admin-page">
    <section class="filter card">
      <div class="filter__row filter__row--4">
        <div class="filter__field">
          <label>사용자</label>
          <input
            v-model="filters.keyword"
            class="filter__input"
            type="text"
            placeholder="이름 또는 사번"
            @keyup.enter="search"
          />
        </div>
        <div class="filter__field">
          <label>소속팀</label>
          <select v-model="filters.dept" class="filter__select">
            <option v-for="o in deptOptions" :key="o" :value="o">{{ o === '전체' ? '선택' : o }}</option>
          </select>
        </div>
        <div class="filter__field">
          <label>권한</label>
          <select v-model="filters.role" class="filter__select">
            <option v-for="o in roleOptions" :key="o" :value="o">{{ o }}</option>
          </select>
        </div>
        <div class="filter__field">
          <label>상태</label>
          <select v-model="filters.status" class="filter__select">
            <option v-for="o in statusOptions" :key="o" :value="o">{{ o }}</option>
          </select>
        </div>
      </div>
      <div class="filter__actions">
        <button type="button" class="btn btn--ghost" @click="resetFilters">초기화</button>
        <button type="button" class="btn btn--primary" @click="search">조회</button>
      </div>
    </section>

    <div class="toolbar">
      <span class="toolbar__count">총 <b>{{ filtered.length }}</b>명</span>
      <select v-model="pageSize" class="toolbar__mini" @change="currentPage = 1">
        <option v-for="n in pageSizeOptions" :key="n" :value="n">{{ n }}건씩 보기</option>
      </select>
      <div class="toolbar__actions">
        <button type="button" class="btn btn--ghost btn--sm" @click="unlockFails">5회 오류 해제</button>
        <button type="button" class="btn btn--ghost btn--sm" @click="resetPassword">패스워드 초기화</button>
        <button type="button" class="btn btn--primary btn--sm" @click="openRegister">＋ 사용자 등록</button>
      </div>
    </div>

    <div class="listcard">
      <div class="listcard__scroll">
        <table class="data-table">
          <thead>
            <tr>
              <th style="width: 36px"><input type="checkbox" @change="toggleSelectAll" /></th>
              <th>사번(ID)</th>
              <th>이름</th>
              <th>소속팀</th>
              <th>권한</th>
              <th>상태</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="row in paged" :key="row.id" @click="openDetail(row)">
              <td @click.stop>
                <input
                  type="checkbox"
                  :checked="selectedIds.includes(row.id)"
                  @change="toggleSelect(row.id)"
                />
              </td>
              <td>{{ row.id }}</td>
              <td><span class="tbl__name">{{ row.name }}</span></td>
              <td>{{ row.dept }}</td>
              <td>
                <span :class="{ 'tbl__muted': row.role === '미설정' }">{{ row.role }}</span>
              </td>
              <td>
                <span class="badge" :class="`badge--${userStatusClass(row.status)}`">{{ row.status }}</span>
              </td>
              <td>
                <button type="button" class="link-btn" @click.stop="openDetail(row)">정보</button>
              </td>
            </tr>
            <tr v-if="!paged.length">
              <td colspan="7" class="empty">조회 결과가 없습니다.</td>
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

    <BaseModal :visible="showDetail" title="사용자 정보" @close="showDetail = false">
      <div v-if="detailTarget" class="modal-grid">
        <div class="modal-field"><label>사번(ID)</label><span>{{ detailTarget.id }}</span></div>
        <div class="modal-field"><label>이름</label><span>{{ detailTarget.name }}</span></div>
        <div class="modal-field"><label>소속팀</label><span>{{ detailTarget.dept }}</span></div>
        <div class="modal-field"><label>직급</label><span>{{ detailTarget.position }}</span></div>
        <div class="modal-field"><label>구분</label><span>{{ detailTarget.type }}</span></div>
        <div class="modal-field">
          <label>권한</label>
          <select v-model="detailRole" class="filter__select">
            <option v-for="o in roleOptions.filter((r) => r !== '전체')" :key="o" :value="o">{{ o }}</option>
          </select>
        </div>
        <div class="modal-field"><label>상태</label><span>{{ detailTarget.status }}</span></div>
        <div class="modal-field">
          <label>오류횟수</label>
          <span>
            {{ detailTarget.failCount }}회
            <button
              v-if="detailTarget.failCount >= 5"
              type="button"
              class="link-btn"
              @click="unlockDetailFails"
            >5회 오류 해제</button>
          </span>
        </div>
        <div class="modal-field"><label>이메일</label><span>{{ detailTarget.email }}</span></div>
        <div class="modal-field"><label>휴대전화</label><span>{{ detailTarget.phone }}</span></div>
        <div class="modal-field">
          <label>비밀번호</label>
          <span><button type="button" class="link-btn" @click="resetDetailPassword">비밀번호 초기화</button></span>
        </div>
      </div>
      <template #footer>
        <button type="button" class="btn btn--ghost" @click="showDetail = false">닫기</button>
        <button type="button" class="btn btn--primary" @click="saveDetail">저장</button>
      </template>
    </BaseModal>

    <BaseModal :visible="showRegister" title="사용자 등록" @close="showRegister = false">
      <div class="modal-grid">
        <div class="modal-field">
          <label>사번(ID)</label>
          <input v-model="registerForm.id" class="filter__input" type="text" />
        </div>
        <div class="modal-field">
          <label>이름</label>
          <input v-model="registerForm.name" class="filter__input" type="text" />
        </div>
        <div class="modal-field">
          <label>소속팀</label>
          <select v-model="registerForm.dept" class="filter__select">
            <option v-for="o in deptOptions.filter((d) => d !== '전체')" :key="o" :value="o">{{ o }}</option>
          </select>
        </div>
        <div class="modal-field">
          <label>권한</label>
          <select v-model="registerForm.role" class="filter__select">
            <option v-for="o in roleOptions.filter((r) => r !== '전체' && r !== '미설정')" :key="o" :value="o">{{ o }}</option>
          </select>
        </div>
        <div class="modal-field">
          <label>직급</label>
          <input v-model="registerForm.position" class="filter__input" type="text" />
        </div>
        <div class="modal-field">
          <label>구분</label>
          <select v-model="registerForm.type" class="filter__select">
            <option value="임직원">임직원</option>
            <option value="외주">외주</option>
          </select>
        </div>
        <div class="modal-field">
          <label>이메일</label>
          <input v-model="registerForm.email" class="filter__input" type="text" />
        </div>
        <div class="modal-field">
          <label>휴대전화</label>
          <input v-model="registerForm.phone" class="filter__input" type="text" />
        </div>
      </div>
      <template #footer>
        <button type="button" class="btn btn--ghost" @click="showRegister = false">취소</button>
        <button type="button" class="btn btn--primary" @click="saveRegister">등록</button>
      </template>
    </BaseModal>
  </div>
</template>
