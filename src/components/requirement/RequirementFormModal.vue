<script setup>
// PAG-S-REQ-04/06 요구사항 등록·상세
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
const title = computed(() => {
  if (isCopy.value) return '요구사항 등록 (복사)'
  return isEdit.value ? '요구사항 상세' : '요구사항 등록'
})
const bizOptions = computed(() => bizCategoryMap[form.system] || [])
const canEdit = computed(() => !isEdit.value || !props.data || props.data.status !== '반려')
const isConfirmed = computed(
  () =>
    isEdit.value &&
    props.data?.confirmRequester === '확정' &&
    props.data?.confirmTech === '확정',
)
const originalLocked = computed(() => isEdit.value || isCopy.value)
const memoCount = computed(() => form.memo.length)
const showScreenSearch = ref(false)
const screenDisplay = computed(() => {
  if (form.screenName && form.screenPath) return `${form.screenName} (${form.screenPath})`
  if (form.screenName) return form.screenName
  return form.screenMenu || ''
})

watch(
  () => props.modelValue,
  (open) => {
    if (!open) return
    if (isCopy.value && props.data) {
      Object.assign(form, {
        reqId: '자동 채번',
        name: props.data.name,
        original: props.data.original,
        analysis: '',
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
    } else if (props.data) {
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
        taskTypes: [...props.data.taskTypes],
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
  if (!canEdit.value || isConfirmed.value) return
  showScreenSearch.value = true
}

function onScreenSelect(screen) {
  form.screenName = screen.name
  form.screenPath = screen.path
  form.screenMenu = screen.name
}

function toggleTaskType(type) {
  if (isEdit.value && isConfirmed.value) return
  const idx = form.taskTypes.indexOf(type)
  if (idx >= 0) form.taskTypes.splice(idx, 1)
  else form.taskTypes.push(type)
}

function onSystemChange() {
  const opts = bizCategoryMap[form.system] || []
  form.bizCategory = opts[0] || ''
}

function save() {
  if (
    !form.name.trim() ||
    !form.original.trim() ||
    !form.system ||
    !form.bizCategory ||
    !form.taskTypes.length
  ) {
    window.alert('미입력 항목을 입력하세요.')
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
            :disabled="!canEdit || isConfirmed"
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
          :disabled="!canEdit || isConfirmed"
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
            :disabled="isEdit"
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
            :disabled="!canEdit || isConfirmed"
            @change="onSystemChange"
          >
            <option v-for="s in systemOptions" :key="s" :value="s">{{ s }}</option>
          </select>
        </div>
        <div class="fld fld--req">
          <label>업무구분</label>
          <select
            v-model="form.bizCategory"
            class="inp"
            :disabled="!canEdit || isConfirmed"
          >
            <option v-for="b in bizOptions" :key="b" :value="b">{{ b }}</option>
          </select>
        </div>
        <div class="fld">
          <label>화면(메뉴)</label>
          <div class="screen-search">
            <button
              type="button"
              class="screen-search__field"
              :disabled="!canEdit || isConfirmed"
              @click="openScreenSearch"
            >
              <span v-if="screenDisplay" class="screen-search__value">{{ screenDisplay }}</span>
              <span v-else class="screen-search__ph">화면(메뉴) 검색</span>
            </button>
            <button
              type="button"
              class="btn btn--ghost btn--sm screen-search__btn"
              :disabled="!canEdit || isConfirmed"
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
            :disabled="!canEdit || isConfirmed"
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
              :disabled="!canEdit || isConfirmed"
              @click="form.status = s"
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
              :disabled="!canEdit || isConfirmed"
              @click="form.priority = p"
            >
              {{ p }}
            </button>
          </div>
        </div>
      </div>

      <div class="confirm-row">
        <label class="confirm-item">
          <input
            v-model="form.confirmRequester"
            type="checkbox"
            :disabled="!canEdit || form.status === '접수' || isConfirmed"
          />
          요건확정 (요청자)
        </label>
        <label class="confirm-item">
          <input
            v-model="form.confirmTech"
            type="checkbox"
            :disabled="!canEdit || form.status === '접수' || isConfirmed"
          />
          요건확정 (테크)
        </label>
      </div>

      <div class="fld">
        <label>비고</label>
        <textarea
          v-model="form.memo"
          class="textarea"
          rows="2"
          maxlength="500"
          :disabled="!canEdit || isConfirmed"
        />
        <span class="count">{{ memoCount }} / 500자</span>
      </div>
    </section>

    <template #footer>
      <button type="button" class="btn btn--ghost" @click="close">취소</button>
      <button
        v-if="canEdit && !isConfirmed"
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

.fld--req label::after {
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
  border-radius: 7px;
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
}

.textarea {
  width: 100%;
  padding: 10px 12px;
  border: 1px solid var(--lnb-line);
  border-radius: 8px;
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
  border-radius: 8px;
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
  opacity: 0.6;
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
  opacity: 0.6;
  cursor: not-allowed;
}

.confirm-row {
  display: flex;
  gap: 20px;
  margin-bottom: 12px;
}

.confirm-item {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 12.5px;
  cursor: pointer;
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
  border-radius: 7px;
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
