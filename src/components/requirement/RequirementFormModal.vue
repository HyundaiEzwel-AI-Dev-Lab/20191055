<script setup>
// PAG-S-REQ-04/06 요구사항 등록·상세
// 상세 수정 가능: 접수·수용 & 미확정 / 불가: 반려·양측 확정 (화면없음 예외)
import { computed, reactive, ref, watch } from 'vue'
import BaseModal from '@/components/ui/BaseModal.vue'
import RequirementScreenSearchModal from '@/components/requirement/RequirementScreenSearchModal.vue'
import {
  requirementTypes,
  registerTaskTypes,
  systemOptions,
  bizCategoryMap,
} from '@/data/requirement'

const props = defineProps({
  modelValue: { type: Boolean, default: false },
  mode: { type: String, default: 'register' },
  data: { type: Object, default: null },
})

const emit = defineEmits(['update:modelValue', 'save'])

const form = reactive({
  reqId: '자동 채번',
  name: '',
  original: '',
  analysis: '',
  reqType: '최초 요건',
  system: 'FO',
  bizCategory: '',
  screenMenu: '',
  screenPath: '',
  screenName: '',
  taskTypes: [],
  status: '접수',
  priority: '보통',
  confirmRequester: false,
  confirmTech: false,
  memo: '',
})

const isEdit = computed(() => props.mode === 'edit')
const isCopy = computed(() => props.mode === 'copy')
const isRegister = computed(() => props.mode === 'register')

const title = computed(() => {
  if (isCopy.value) return '요구사항 등록 (복사)'
  return isEdit.value ? '요구사항 상세' : '요구사항 등록'
})

const bizOptions = computed(() => bizCategoryMap[form.system] || [])

/** 요청자·테크 모두 확정 (저장 기준) */
const bothConfirmed = computed(() => {
  if (!isEdit.value || !props.data) return false
  return props.data.confirmRequester === '확정' && props.data.confirmTech === '확정'
})

/** 반려 또는 양측 확정 → 본문 수정 불가 (SB 98·100) */
const isReadOnly = computed(() => {
  if (!isEdit.value) return false
  if (props.data?.status === '반려') return true
  if (props.data?.confirmLocked) return true
  return bothConfirmed.value
})

/** 기본 정보·업무범주·추가정보 편집 가능 */
const canEditFields = computed(() => {
  if (isRegister.value || isCopy.value) return true
  return isEdit.value && !isReadOnly.value
})

/** 원안: 등록만 입력, 상세/복사는 잠금 (SB 96·98) */
const originalLocked = computed(() => isEdit.value || isCopy.value)

/** 구분: 등록·복사만 변경, 상세는 잠금 */
const reqTypeLocked = computed(() => isEdit.value)

/**
 * 요건확정 토글
 * - 접수: 불가 (SB 94·98)
 * - 수용 & 미확정: 가능
 * - 이미 확정된 쪽: 변경 불가
 * - 반려/양측확정(본문잠금): 불가
 */
const canEditConfirmRequester = computed(() => {
  if (!canEditFields.value) return false
  if (form.status !== '수용') return false
  if (props.data?.confirmRequester === '확정') return false
  return true
})

const canEditConfirmTech = computed(() => {
  if (!canEditFields.value) return false
  if (form.status !== '수용') return false
  if (props.data?.confirmTech === '확정') return false
  return true
})

/** 확정 + 화면없음 → 화면만 1회 수정 가능 (SB 101) */
const isNoScreen = computed(() => {
  const name = form.screenName || form.screenMenu || ''
  return !name || name === '화면없음' || name === '-'
})

const canEditScreenOnly = computed(
  () => isEdit.value && isReadOnly.value && bothConfirmed.value && isNoScreen.value,
)

const canEditScreen = computed(() => canEditFields.value || canEditScreenOnly.value)

const showSaveButton = computed(() => canEditFields.value || canEditScreenOnly.value)

const memoCount = computed(() => form.memo.length)
const showScreenSearch = ref(false)
const confirmTipOpen = ref(false)

const confirmTooltip =
  '요청자와 테크담당 모두 확정 시 WBS 업무가 생성됩니다.\n- 확정 : 최종 개발 요구사항 확인 완료 (확정 후 요건 수정 불가)\n- 미확정 : 최종 개발 요구사항 확정 전 (요건 수정 가능)'

const screenDisplay = computed(() => {
  if (form.screenName && form.screenPath) return `${form.screenName} (${form.screenPath})`
  if (form.screenName) return form.screenName
  return form.screenMenu || ''
})

const metaLine = computed(() => {
  if (!isEdit.value || !props.data) return ''
  const reg = `등록 ${props.data.registeredAt || '-'} (${props.data.registeredBy || '-'})`
  const upd = props.data.updatedAt
    ? `최종수정 ${props.data.updatedAt} (${props.data.updatedBy || '-'})`
    : '최종수정 -'
  return `${reg}  |  ${upd}`
})

watch(
  () => props.modelValue,
  (open) => {
    if (!open) return
    confirmTipOpen.value = false
    if (isCopy.value && props.data) {
      Object.assign(form, {
        reqId: '자동 채번',
        name: props.data.name,
        original: props.data.original,
        analysis: props.data.analysis || '',
        reqType: '최초 요건',
        system: props.data.system,
        bizCategory: props.data.bizCategory,
        screenMenu: '',
        screenPath: '',
        screenName: '',
        taskTypes: [],
        status: '접수',
        priority: '보통',
        confirmRequester: false,
        confirmTech: false,
        memo: '',
      })
    } else if (props.data && isEdit.value) {
      Object.assign(form, {
        reqId: props.data.reqId,
        name: props.data.name,
        original: props.data.original,
        analysis: props.data.analysis || '',
        reqType: props.data.reqType === '추가' ? '추가 요구사항' : '최초 요건',
        system: props.data.system,
        bizCategory: props.data.bizCategory,
        screenMenu: props.data.screenMenu || props.data.screenName || '',
        screenPath: props.data.screenPath || '',
        screenName: props.data.screenName || props.data.screenMenu || '',
        taskTypes: [...(props.data.taskTypes || [])],
        status: props.data.status,
        priority: props.data.priority,
        confirmRequester: props.data.confirmRequester === '확정',
        confirmTech: props.data.confirmTech === '확정',
        memo: props.data.memo || '',
      })
    } else {
      Object.assign(form, {
        reqId: '자동 채번',
        name: '',
        original: '',
        analysis: '',
        reqType: '최초 요건',
        system: 'FO',
        bizCategory: '법인숙박',
        screenMenu: '',
        screenPath: '',
        screenName: '',
        taskTypes: [],
        status: '접수',
        priority: '보통',
        confirmRequester: false,
        confirmTech: false,
        memo: '',
      })
    }
  },
)

function close() {
  emit('update:modelValue', false)
}

function openScreenSearch() {
  if (!canEditScreen.value) return
  showScreenSearch.value = true
}

function onScreenSelect(screen) {
  form.screenName = screen.name
  form.screenPath = screen.path
  form.screenMenu = screen.name
}

function toggleTaskType(type) {
  if (!canEditFields.value) return
  const idx = form.taskTypes.indexOf(type)
  if (idx >= 0) form.taskTypes.splice(idx, 1)
  else form.taskTypes.push(type)
}

function onSystemChange() {
  if (!canEditFields.value) return
  const opts = bizCategoryMap[form.system] || []
  form.bizCategory = opts[0] || ''
  form.screenMenu = ''
  form.screenPath = ''
  form.screenName = ''
}

function onStatusChange(next) {
  if (!canEditFields.value) return
  form.status = next
  if (next === '접수') {
    form.confirmRequester = false
    form.confirmTech = false
  }
}

function onConfirmToggle(field, event) {
  const checked = event.target.checked
  if (field === 'confirmRequester' && !canEditConfirmRequester.value) {
    event.target.checked = form.confirmRequester
    return
  }
  if (field === 'confirmTech' && !canEditConfirmTech.value) {
    event.target.checked = form.confirmTech
    return
  }
  if (checked) {
    const ok = window.confirm('확정 후 변경할 수 없습니다. 변경하시겠습니까?')
    if (!ok) {
      event.target.checked = false
      form[field] = false
      return
    }
  }
  form[field] = checked
}

function save() {
  if (canEditScreenOnly.value) {
    if (!form.screenName || form.screenName === '화면없음') {
      window.alert('화면(메뉴)을 선택해 주세요.')
      return
    }
    if (!window.confirm('저장하시겠습니까?')) return
    emit('save', { ...form, screenOnly: true })
    return
  }

  if (!form.name.trim() || !form.original.trim() || !form.system || !form.bizCategory) {
    window.alert('미입력 항목을 입력하세요.')
    return
  }
  if (form.status === '수용' && !form.taskTypes.length) {
    window.alert('수용 상태에서는 업무유형을 1개 이상 선택해 주세요.')
    return
  }
  if (form.status === '수용' && !form.screenName && !form.screenMenu) {
    window.alert('수용 상태에서는 화면(메뉴)을 선택해 주세요.')
    return
  }
  if (!form.taskTypes.length && isRegister.value) {
    window.alert('업무유형을 1개 이상 선택해 주세요.')
    return
  }
  if (!window.confirm('저장하시겠습니까?')) return
  emit('save', { ...form })
}
</script>

<template>
  <BaseModal :title="title" :visible="modelValue" wide @close="close">
    <section class="section">
      <h3 class="section__title">요구사항 기본 정보</h3>
      <div class="frow">
        <div class="fld">
          <label>요구사항 ID</label>
          <div class="inp inp--ro">{{ form.reqId }}</div>
        </div>
        <div class="fld fld--wide">
          <label class="fld--req">요구사항명</label>
          <input
            v-model="form.name"
            class="inp"
            type="text"
            maxlength="100"
            :disabled="!canEditFields"
          />
        </div>
      </div>

      <div class="fld">
        <label class="fld--req">요구사항 원안</label>
        <textarea
          v-model="form.original"
          class="textarea"
          rows="4"
          maxlength="2000"
          placeholder="현업에서 발의한 개발 요청사항 입력"
          :disabled="originalLocked"
        />
      </div>

      <div class="fld">
        <label>요구사항 분석</label>
        <textarea
          v-model="form.analysis"
          class="textarea"
          rows="4"
          maxlength="2000"
          placeholder="테크(기획/개발)에서 상세 분석/정의한 내용 입력"
          :disabled="!canEditFields"
        />
      </div>

      <div class="fld">
        <label class="fld--req">구분</label>
        <div class="seg">
          <button
            v-for="t in requirementTypes"
            :key="t"
            type="button"
            class="seg__btn"
            :class="{ 'seg__btn--on': form.reqType === t }"
            :disabled="reqTypeLocked || !canEditFields"
            @click="form.reqType = t"
          >
            {{ t }}
          </button>
        </div>
      </div>
    </section>

    <section class="section">
      <h3 class="section__title">업무범주</h3>
      <div class="frow frow--3">
        <div class="fld fld--req">
          <label>시스템구분</label>
          <select
            v-model="form.system"
            class="inp"
            :disabled="!canEditFields"
            @change="onSystemChange"
          >
            <option v-for="s in systemOptions" :key="s" :value="s">{{ s }}</option>
          </select>
        </div>
        <div class="fld fld--req">
          <label>업무구분</label>
          <select v-model="form.bizCategory" class="inp" :disabled="!canEditFields">
            <option v-for="b in bizOptions" :key="b" :value="b">{{ b }}</option>
          </select>
        </div>
        <div class="fld">
          <label>화면(메뉴)</label>
          <div class="screen-search">
            <button
              type="button"
              class="screen-search__field"
              :disabled="!canEditScreen"
              @click="openScreenSearch"
            >
              <span v-if="screenDisplay" class="screen-search__value">{{ screenDisplay }}</span>
              <span v-else class="screen-search__ph">화면(메뉴) 검색</span>
            </button>
            <button
              type="button"
              class="btn btn--ghost btn--sm screen-search__btn"
              :disabled="!canEditScreen"
              @click="openScreenSearch"
            >
              검색
            </button>
          </div>
        </div>
      </div>
      <div class="fld fld--req">
        <label>업무유형</label>
        <div class="chips">
          <button
            v-for="t in registerTaskTypes"
            :key="t"
            type="button"
            class="chip-btn"
            :class="{ 'chip-btn--on': form.taskTypes.includes(t) }"
            :disabled="!canEditFields"
            @click="toggleTaskType(t)"
          >
            {{ t }}
          </button>
        </div>
      </div>
    </section>

    <section class="section">
      <h3 class="section__title">추가 정보</h3>
      <div class="frow frow--2">
        <div class="fld">
          <label>상태</label>
          <div class="seg">
            <button
              v-for="s in ['접수', '수용', '반려']"
              :key="s"
              type="button"
              class="seg__btn"
              :class="{ 'seg__btn--on': form.status === s }"
              :disabled="!canEditFields"
              @click="onStatusChange(s)"
            >
              {{ s }}
            </button>
          </div>
        </div>
        <div class="fld">
          <label>우선순위</label>
          <div class="seg">
            <button
              v-for="p in ['낮음', '보통', '높음']"
              :key="p"
              type="button"
              class="seg__btn"
              :class="{ 'seg__btn--on': form.priority === p }"
              :disabled="!canEditFields"
              @click="form.priority = p"
            >
              {{ p }}
            </button>
          </div>
        </div>
      </div>

      <div class="confirm-row">
        <span class="confirm-label">
          요건확정
          <button
            type="button"
            class="confirm-tip"
            @click.stop="confirmTipOpen = !confirmTipOpen"
            @blur="confirmTipOpen = false"
          >
            !
          </button>
          <span v-if="confirmTipOpen" class="confirm-tip__bubble">{{ confirmTooltip }}</span>
        </span>
        <label class="confirm-item">
          <input
            type="checkbox"
            :checked="form.confirmRequester"
            :disabled="!canEditConfirmRequester"
            @change="onConfirmToggle('confirmRequester', $event)"
          />
          요청자
        </label>
        <label class="confirm-item">
          <input
            type="checkbox"
            :checked="form.confirmTech"
            :disabled="!canEditConfirmTech"
            @change="onConfirmToggle('confirmTech', $event)"
          />
          테크
        </label>
      </div>

      <div class="fld">
        <label>비고</label>
        <textarea
          v-model="form.memo"
          class="textarea"
          rows="2"
          maxlength="500"
          :disabled="!canEditFields"
        />
        <span class="count">{{ memoCount }} / 500자</span>
      </div>

      <p v-if="metaLine" class="meta-line">{{ metaLine }}</p>
    </section>

    <template #footer>
      <button type="button" class="btn btn--ghost" @click="close">
        {{ showSaveButton ? '취소' : '닫기' }}
      </button>
      <button
        v-if="showSaveButton"
        type="button"
        class="btn btn--primary"
        @click="save"
      >
        {{ isEdit ? '수정' : '등록' }}
      </button>
    </template>
  </BaseModal>

  <RequirementScreenSearchModal
    v-model="showScreenSearch"
    :system="form.system"
    @select="onScreenSelect"
  />
</template>

<style scoped>
.section {
  margin-bottom: 18px;
}

.section__title {
  margin: 0 0 12px;
  font-size: 13px;
  font-weight: 700;
}

.frow {
  display: grid;
  gap: 10px 14px;
  margin-bottom: 12px;
}

.frow--2 {
  grid-template-columns: 1fr 1fr;
}

.frow--3 {
  grid-template-columns: repeat(3, 1fr);
}

.fld {
  display: flex;
  flex-direction: column;
  gap: 4px;
  margin-bottom: 10px;
}

.fld--wide {
  grid-column: span 2;
}

.fld--req label::after,
label.fld--req::after {
  content: ' *';
  color: var(--red);
}

.fld label {
  font-size: 11px;
  color: var(--lnb-muted);
  font-weight: 600;
}

.inp {
  height: 32px;
  padding: 0 10px;
  border: 1px solid var(--lnb-line);
  border-radius: var(--radius-sm, 7px);
  font-family: inherit;
  font-size: 12px;
  background: var(--lnb-side);
}

.inp--ro {
  background: var(--field);
  color: var(--lnb-muted);
  display: flex;
  align-items: center;
}

.inp:disabled,
.textarea:disabled {
  background: var(--field);
  cursor: not-allowed;
  opacity: 0.85;
}

.textarea {
  width: 100%;
  padding: 10px 12px;
  border: 1px solid var(--lnb-line);
  border-radius: var(--radius-md, 8px);
  font-family: inherit;
  font-size: 13px;
  line-height: 1.5;
  resize: vertical;
}

.count {
  font-size: 11px;
  color: var(--lnb-muted);
  text-align: right;
}

.seg {
  display: inline-flex;
  border: 1px solid var(--lnb-line);
  border-radius: var(--radius-md, 8px);
  overflow: hidden;
}

.seg__btn {
  padding: 6px 12px;
  font-size: 12px;
  border: none;
  border-right: 1px solid var(--lnb-line);
  background: var(--lnb-side);
  cursor: pointer;
  font-family: inherit;
  color: var(--lnb-txt);
}

.seg__btn:last-child {
  border-right: none;
}

.seg__btn--on {
  background: var(--teal);
  color: #fff;
  font-weight: 700;
}

.seg__btn:disabled {
  opacity: 0.55;
  cursor: not-allowed;
}

.chips {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
}

.chip-btn {
  height: 28px;
  padding: 0 12px;
  border: 1px solid var(--lnb-line);
  border-radius: 20px;
  background: var(--lnb-side);
  font-size: 12px;
  cursor: pointer;
  font-family: inherit;
}

.chip-btn--on {
  background: var(--teal-50);
  border-color: var(--teal-100);
  color: var(--teal-600);
  font-weight: 700;
}

.chip-btn:disabled {
  opacity: 0.55;
  cursor: not-allowed;
}

.confirm-row {
  display: flex;
  align-items: center;
  gap: 16px;
  margin-bottom: 12px;
  flex-wrap: wrap;
}

.confirm-label {
  position: relative;
  display: inline-flex;
  align-items: center;
  gap: 4px;
  font-size: 12px;
  font-weight: 700;
  color: var(--lnb-txt);
}

.confirm-tip {
  width: 16px;
  height: 16px;
  border-radius: 50%;
  border: 1px solid var(--lnb-line);
  background: #fff;
  color: var(--teal-600);
  font-size: 10px;
  font-weight: 800;
  line-height: 1;
  cursor: pointer;
  font-family: inherit;
  padding: 0;
}

.confirm-tip__bubble {
  position: absolute;
  top: calc(100% + 6px);
  left: 0;
  z-index: 20;
  width: 280px;
  padding: 10px 12px;
  border: 1px solid var(--lnb-line);
  border-radius: var(--radius-md, 8px);
  background: #fff;
  box-shadow: var(--shadow-sm, 0 4px 12px rgba(0, 0, 0, 0.08));
  color: var(--lnb-txt);
  font-size: 11px;
  font-weight: 500;
  line-height: 1.55;
  white-space: pre-line;
}

.confirm-item {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 12.5px;
  cursor: pointer;
}

.confirm-item:has(input:disabled) {
  cursor: not-allowed;
  opacity: 0.7;
}

.meta-line {
  margin: 8px 0 0;
  font-size: 11px;
  color: var(--lnb-muted);
}

.screen-search {
  display: flex;
  gap: 6px;
  align-items: center;
}

.screen-search__field {
  flex: 1;
  min-height: 32px;
  padding: 6px 10px;
  border: 1px solid var(--lnb-line);
  border-radius: var(--radius-sm, 7px);
  background: var(--lnb-side);
  text-align: left;
  font-family: inherit;
  font-size: 12px;
  cursor: pointer;
  color: var(--lnb-txt);
}

.screen-search__field:disabled {
  background: var(--field);
  cursor: not-allowed;
  opacity: 0.7;
}

.screen-search__ph {
  color: var(--lnb-muted);
}

.screen-search__value {
  display: block;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.screen-search__btn {
  flex-shrink: 0;
}
</style>
