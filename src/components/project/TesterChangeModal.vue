<script setup>
// POP-S-INF-02 테스터 변경
import { computed, ref, watch } from 'vue'
import BaseModal from '@/components/ui/BaseModal.vue'
import { searchStaff } from '@/data/projectInfo'

const props = defineProps({
  modelValue: { type: Boolean, default: false },
  testers: { type: Array, default: () => [] },
  pendingChange: { type: Object, default: null },
})

const emit = defineEmits(['update:modelValue', 'save'])

const targetId = ref('')
const searchKeyword = ref('')
const selectedStaff = ref(null)
const applyDate = ref('')
const showResults = ref(false)
const showSavedAlert = ref(false)

const today = new Date().toISOString().slice(0, 10)

const searchResults = computed(() => searchStaff(searchKeyword.value))

const canSubmit = computed(
  () =>
    targetId.value &&
    selectedStaff.value &&
    applyDate.value &&
    applyDate.value >= today &&
    selectedStaff.value.id !== targetId.value,
)

watch(
  () => props.modelValue,
  (open) => {
    if (!open) return
    targetId.value = props.testers[0]?.id || ''
    searchKeyword.value = ''
    selectedStaff.value = null
    applyDate.value = today
    showResults.value = false
    showSavedAlert.value = false
  },
)

function close() {
  emit('update:modelValue', false)
}

function selectStaff(staff) {
  selectedStaff.value = staff
  searchKeyword.value = `${staff.name} / ${staff.dept} / ${staff.empId}`
  showResults.value = false
}

function clearStaff() {
  selectedStaff.value = null
  searchKeyword.value = ''
}

function onSearchInput() {
  selectedStaff.value = null
  showResults.value = searchKeyword.value.trim().length > 0
}

function submit() {
  if (!canSubmit.value) return
  emit('save', {
    targetId: targetId.value,
    newStaff: selectedStaff.value,
    applyDate: applyDate.value,
  })
  showSavedAlert.value = true
}

function onAlertConfirm() {
  showSavedAlert.value = false
  close()
}
</script>

<template>
  <BaseModal title="테스터 변경" :visible="modelValue" @close="close">
    <div v-if="pendingChange" class="pending-box">
      <p class="pending-box__title">현재 변경 예정 건이 존재합니다.</p>
      <p class="pending-box__line">
        {{ pendingChange.from.name }} / {{ pendingChange.from.dept }} / {{ pendingChange.from.empId }}
        → {{ pendingChange.to.name }} / {{ pendingChange.to.dept }} / {{ pendingChange.to.empId }}
      </p>
      <p class="pending-box__meta">변경 적용일 : {{ pendingChange.applyDate }}</p>
      <p class="pending-box__hint">새로운 변경을 저장하면 기존 예약은 변경됩니다.</p>
    </div>

    <div class="field">
      <label class="field__label field__label--req">변경 대상</label>
      <select v-model="targetId" class="field__select">
        <option v-for="t in testers" :key="t.id" :value="t.id">
          {{ t.name }} / {{ t.dept }} / {{ t.empId || '—' }}
        </option>
      </select>
    </div>

    <div class="field">
      <label class="field__label field__label--req">변경 후 담당자</label>
      <div class="search-wrap">
        <input
          v-model="searchKeyword"
          class="field__input"
          type="text"
          placeholder="담당자 검색"
          @input="onSearchInput"
          @focus="showResults = searchKeyword.trim().length > 0"
        />
        <button
          v-if="selectedStaff"
          type="button"
          class="search-wrap__clear"
          @click="clearStaff"
        >
          ✕
        </button>
        <ul v-if="showResults" class="search-results">
          <li v-if="!searchResults.length" class="search-results__empty">
            해당사항 없음
          </li>
          <li
            v-for="staff in searchResults"
            :key="staff.id"
            class="search-results__item"
            @mousedown.prevent="selectStaff(staff)"
          >
            {{ staff.name }} / {{ staff.dept }} / {{ staff.empId }}
          </li>
        </ul>
      </div>
    </div>

    <div class="field">
      <label class="field__label field__label--req">변경 적용일</label>
      <input v-model="applyDate" class="field__input" type="date" :min="today" />
    </div>

    <ul class="info-list">
      <li>변경 적용일 이전까지는 기존 테스트 담당자가 유지되고, 변경 적용일 이후에는 변경 후 담당자가 적용됩니다.</li>
      <li>이미 완료 된 테스트 케이스 및 등록 된 결함의 담당자는 변경되지 않습니다.</li>
    </ul>

    <template #footer>
      <button type="button" class="btn btn--primary" :disabled="!canSubmit" @click="submit">
        변경하기
      </button>
    </template>
  </BaseModal>

  <Teleport to="body">
    <div v-if="showSavedAlert" class="alert-scrim">
      <div class="alert-box">
        <p>테스터 변경이 저장되었습니다.</p>
        <button type="button" class="btn btn--primary" @click="onAlertConfirm">확인</button>
      </div>
    </div>
  </Teleport>
</template>

<style scoped>
.pending-box {
  background: var(--orange-bg);
  border: 1px solid var(--orange);
  border-radius: 10px;
  padding: 12px 14px;
  margin-bottom: 16px;
  font-size: calc(12px + var(--font-size-offset, 0px));
  line-height: 1.5;
}

.pending-box__title {
  margin: 0 0 6px;
  font-weight: 700;
  color: var(--orange);
}

.pending-box__line,
.pending-box__meta,
.pending-box__hint {
  margin: 0 0 4px;
  color: var(--lnb-txt);
}

.pending-box__hint {
  margin-top: 8px;
  color: var(--lnb-muted);
  font-size: calc(11px + var(--font-size-offset, 0px));
}

.field {
  margin-bottom: 14px;
}

.field__label {
  display: block;
  margin-bottom: 5px;
  font-size: calc(11px + var(--font-size-offset, 0px));
  font-weight: 600;
  color: var(--lnb-muted);
}

.field__label--req::after {
  content: ' *';
  color: var(--red);
}

.field__select,
.field__input {
  width: 100%;
  height: 34px;
  padding: 0 10px;
  border: 1px solid var(--lnb-line);
  border-radius: 7px;
  font-family: inherit;
  font-size: calc(12.5px + var(--font-size-offset, 0px));
  background: var(--lnb-side);
}

.search-wrap {
  position: relative;
}

.search-wrap__clear {
  position: absolute;
  right: 8px;
  top: 50%;
  transform: translateY(-50%);
  width: 22px;
  height: 22px;
  border: none;
  background: var(--lnb-hover);
  border-radius: 50%;
  color: var(--lnb-muted);
  cursor: pointer;
  font-size: calc(11px + var(--font-size-offset, 0px));
}

.search-results {
  position: absolute;
  left: 0;
  right: 0;
  top: calc(100% + 4px);
  background: var(--lnb-side);
  border: 1px solid var(--lnb-line);
  border-radius: 8px;
  box-shadow: 0 6px 24px rgba(20, 40, 50, 0.12);
  max-height: 160px;
  overflow-y: auto;
  z-index: 10;
  margin: 0;
  padding: 0;
  list-style: none;
}

.search-results__item {
  padding: 9px 12px;
  font-size: calc(12px + var(--font-size-offset, 0px));
  cursor: pointer;
}

.search-results__item:hover {
  background: var(--teal-50);
}

.search-results__empty {
  padding: 12px;
  font-size: calc(12px + var(--font-size-offset, 0px));
  color: var(--lnb-muted);
  text-align: center;
}

.info-list {
  margin: 0;
  padding-left: 16px;
  font-size: calc(11.5px + var(--font-size-offset, 0px));
  color: var(--lnb-muted);
  line-height: 1.6;
}

.alert-scrim {
  position: fixed;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(18, 30, 34, 0.2);
  z-index: 1300;
}

.alert-box {
  width: 300px;
  background: var(--lnb-side);
  border-radius: 12px;
  padding: 24px 20px 18px;
  text-align: center;
  box-shadow: 0 6px 24px rgba(20, 40, 50, 0.12);
}

.alert-box p {
  margin: 0 0 18px;
  font-size: calc(13.5px + var(--font-size-offset, 0px));
  line-height: 1.6;
}

.alert-box .btn {
  min-width: 80px;
}
</style>
