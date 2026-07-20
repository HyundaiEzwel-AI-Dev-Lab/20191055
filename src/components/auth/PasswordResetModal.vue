<script setup>
// POP-M-COM-03 비밀번호 재설정 (레이어 팝업)
// SB v0.9: 휴대폰 인증 프로세스 SPEC OUT → 이름·사번/ID·신규비번 영역으로 구성
import { reactive, ref, watch } from 'vue'
import BaseModal from '@/components/ui/BaseModal.vue'
import { findUserForReset } from '@/data/mockUsers'

const props = defineProps({
  modelValue: { type: Boolean, default: false },
  /** 내정보 등에서 진입 시 이름·사번 미리채움 */
  prefill: {
    type: Object,
    default: null,
  },
  /** true면 이름·사번 수정 불가 (로그인 사용자) */
  lockIdentity: { type: Boolean, default: false },
})
const emit = defineEmits(['update:modelValue'])

const form = reactive({
  name: '',
  empId: '',
  next: '',
  confirm: '',
})
const showNext = ref(false)
const showConfirm = ref(false)
const matchedUser = ref(null)

const infoAlert = reactive({ show: false, message: '', onOk: null })
const confirmDialog = reactive({ show: false, message: '', onOk: null })

watch(
  () => props.modelValue,
  (open) => {
    if (!open) return
    applyPrefill()
  },
)

function applyPrefill() {
  if (props.prefill?.name || props.prefill?.empId) {
    form.name = props.prefill.name || ''
    form.empId = props.prefill.empId || props.prefill.id || ''
  }
}

function openInfo(message, onOk = null) {
  infoAlert.message = message
  infoAlert.onOk = onOk
  infoAlert.show = true
}
function confirmInfo() {
  infoAlert.show = false
  const cb = infoAlert.onOk
  infoAlert.onOk = null
  if (cb) cb()
}
function openConfirm(message, onOk) {
  confirmDialog.message = message
  confirmDialog.onOk = onOk
  confirmDialog.show = true
}
function acceptConfirm() {
  confirmDialog.show = false
  const cb = confirmDialog.onOk
  confirmDialog.onOk = null
  if (cb) cb()
}

/** 비밀번호 정책: 8자+ / 2종+ / 동일문자 3연속 금지 / 공백 금지 */
function checkPolicy(v) {
  if (v.length < 8) return false
  if (/\s/.test(v)) return false
  if (/(.)\1\1/.test(v)) return false
  let kinds = 0
  if (/[a-z]/.test(v)) kinds++
  if (/[A-Z]/.test(v)) kinds++
  if (/[0-9]/.test(v)) kinds++
  if (/[^a-zA-Z0-9]/.test(v)) kinds++
  return kinds >= 2
}

function save() {
  if (!form.name.trim()) {
    openInfo('이름을 입력해주세요.')
    return
  }
  if (!form.empId.trim()) {
    openInfo('사번/ID을 입력해주세요.')
    return
  }

  const user = findUserForReset({
    name: form.name.trim(),
    empId: form.empId.trim(),
  })
  if (!user) {
    openInfo('등록된 사용자 정보를 찾을 수 없습니다.')
    return
  }
  if (user.status === 'locked') {
    openInfo('잠금처리된 계정입니다. 담당자에게 문의하세요.')
    return
  }
  if (user.status === 'leave') {
    openInfo('휴직처리된 계정입니다. 담당자에게 문의하세요.')
    return
  }
  if (user.status === 'retired') {
    openInfo('퇴직 처리된 계정으로 로그인할 수 없습니다.')
    return
  }
  matchedUser.value = user

  if (!form.next) {
    openInfo('신규 비밀번호를 입력해주세요.')
    return
  }
  if (!form.confirm) {
    openInfo('비밀번호 확인을 입력해주세요.')
    return
  }
  if (!checkPolicy(form.next)) {
    openInfo('영문/숫자/특수문자를 포함 8자리 이상 입력해 주세요.')
    return
  }
  if (form.next !== form.confirm) {
    openInfo('신규 비밀번호와 비밀번호 확인이 일치하지 않습니다.')
    return
  }
  if (user.password === form.next) {
    openInfo('기존 비밀번호와 동일한 비밀번호는 사용할 수 없습니다.')
    return
  }

  openConfirm('등록한 정보를 저장합니다.\n진행하시겠습니까?', doSave)
}

function doSave() {
  if (!matchedUser.value) return
  matchedUser.value.password = form.next
  matchedUser.value.failCount = 0
  openInfo('비밀번호가 정상적으로 변경되었습니다.', close)
}

function close() {
  form.name = ''
  form.empId = ''
  form.next = ''
  form.confirm = ''
  showNext.value = false
  showConfirm.value = false
  matchedUser.value = null
  emit('update:modelValue', false)
}
</script>

<template>
  <BaseModal title="비밀번호 재설정" :visible="modelValue" @close="close">
    <div class="frow">
      <div class="fld">
        <label>이름</label>
        <input
          v-model="form.name"
          class="inp"
          type="text"
          :disabled="lockIdentity"
          autocomplete="off"
        />
      </div>
      <div class="fld">
        <label>사번 / ID</label>
        <input
          v-model="form.empId"
          class="inp"
          type="text"
          :disabled="lockIdentity"
          autocomplete="off"
        />
      </div>
    </div>

    <div class="divider" />

    <div class="fld fld--gap">
      <label>신규 비밀번호</label>
      <div class="inp inp--flex">
        <input
          v-model="form.next"
          :type="showNext ? 'text' : 'password'"
          placeholder="PASSWORD"
          class="bare"
          autocomplete="new-password"
        />
        <button type="button" class="eye" aria-label="비밀번호 보기" @click="showNext = !showNext">
          <svg
            v-if="showNext"
            viewBox="0 0 24 24"
            width="16"
            height="16"
            fill="none"
            stroke="currentColor"
            stroke-width="1.7"
            stroke-linecap="round"
            stroke-linejoin="round"
          >
            <path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12Z" />
            <circle cx="12" cy="12" r="3" />
          </svg>
          <svg
            v-else
            viewBox="0 0 24 24"
            width="16"
            height="16"
            fill="none"
            stroke="currentColor"
            stroke-width="1.7"
            stroke-linecap="round"
            stroke-linejoin="round"
          >
            <path d="M3 3l18 18" />
            <path
              d="M10.6 6.1A10.8 10.8 0 0 1 12 6c6.5 0 10 6 10 6a17.6 17.6 0 0 1-3.2 3.8M6.4 8.1A17.3 17.3 0 0 0 2 12s3.5 6 10 6a10.4 10.4 0 0 0 2.4-.3"
            />
            <path d="M9.9 9.9a3 3 0 0 0 4.2 4.2" />
          </svg>
        </button>
      </div>
    </div>

    <div class="fld fld--gap-lg">
      <label>신규 비밀번호 확인</label>
      <div class="inp inp--flex">
        <input
          v-model="form.confirm"
          :type="showConfirm ? 'text' : 'password'"
          placeholder="PASSWORD"
          class="bare"
          autocomplete="new-password"
        />
        <button
          type="button"
          class="eye"
          aria-label="비밀번호 확인 보기"
          @click="showConfirm = !showConfirm"
        >
          <svg
            v-if="showConfirm"
            viewBox="0 0 24 24"
            width="16"
            height="16"
            fill="none"
            stroke="currentColor"
            stroke-width="1.7"
            stroke-linecap="round"
            stroke-linejoin="round"
          >
            <path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12Z" />
            <circle cx="12" cy="12" r="3" />
          </svg>
          <svg
            v-else
            viewBox="0 0 24 24"
            width="16"
            height="16"
            fill="none"
            stroke="currentColor"
            stroke-width="1.7"
            stroke-linecap="round"
            stroke-linejoin="round"
          >
            <path d="M3 3l18 18" />
            <path
              d="M10.6 6.1A10.8 10.8 0 0 1 12 6c6.5 0 10 6 10 6a17.6 17.6 0 0 1-3.2 3.8M6.4 8.1A17.3 17.3 0 0 0 2 12s3.5 6 10 6a10.4 10.4 0 0 0 2.4-.3"
            />
            <path d="M9.9 9.9a3 3 0 0 0 4.2 4.2" />
          </svg>
        </button>
      </div>
    </div>

    <div class="rule">
      <b>비밀번호 생성 규칙</b><br />
      · 영문/숫자/특수문자 포함 8자리 이상<br />
      · 영문 대/소문자·숫자·특수문자 중 2종 이상 조합 필수<br />
      · 동일 문자 연속 3회 이상 사용 불가<br />
      · 공백 문자 사용 불가
    </div>

    <template #footer>
      <button type="button" class="btn btn--ghost" @click="close">취소</button>
      <button type="button" class="btn btn--primary" @click="save">저장</button>
    </template>
  </BaseModal>

  <Teleport to="body">
    <div v-if="infoAlert.show" class="alert-scrim">
      <div class="alert-box">
        <p class="alert-box__msg">{{ infoAlert.message }}</p>
        <div class="alert-box__actions">
          <button type="button" class="btn btn--primary" @click="confirmInfo">확인</button>
        </div>
      </div>
    </div>

    <div v-if="confirmDialog.show" class="alert-scrim">
      <div class="alert-box">
        <p class="alert-box__msg">{{ confirmDialog.message }}</p>
        <div class="alert-box__actions">
          <button type="button" class="btn btn--ghost" @click="confirmDialog.show = false">
            취소
          </button>
          <button type="button" class="btn btn--primary" @click="acceptConfirm">확인</button>
        </div>
      </div>
    </div>
  </Teleport>
</template>

<style scoped>
.frow {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 10px 14px;
  margin-bottom: 4px;
}

.fld {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.fld--gap {
  margin-bottom: 10px;
}

.fld--gap-lg {
  margin-bottom: 14px;
}

.fld label {
  font-size: 11px;
  color: var(--lnb-muted);
  font-weight: 600;
}

.inp {
  height: 32px;
  width: 100%;
  background: var(--lnb-side);
  border: 1px solid var(--lnb-line);
  border-radius: var(--radius-sm, 7px);
  padding: 0 10px;
  display: flex;
  align-items: center;
  color: var(--lnb-txt);
  font-size: 12px;
  font-family: inherit;
}

.inp--flex {
  justify-content: space-between;
}

input.inp:focus {
  outline: none;
  border-color: var(--teal);
}

input.inp:disabled {
  background: var(--lnb-bg);
  color: var(--lnb-muted);
}

.bare {
  flex: 1;
  border: none;
  background: none;
  outline: none;
  font-size: 12px;
  font-family: inherit;
  color: var(--lnb-txt);
}

.bare::placeholder {
  color: var(--lnb-muted);
}

.eye {
  cursor: pointer;
  color: var(--lnb-muted);
  display: flex;
  align-items: center;
  border: none;
  background: none;
  padding: 0;
}

.eye:hover {
  color: var(--lnb-txt);
}

.divider {
  border-top: 1px solid var(--lnb-line);
  margin: 14px 0;
}

.rule {
  background: var(--lnb-bg);
  border: 1px solid var(--lnb-line);
  border-radius: var(--radius-md, 10px);
  padding: 14px 16px;
  font-size: 11.5px;
  color: var(--lnb-txt);
  line-height: 1.9;
}

.alert-scrim {
  position: fixed;
  inset: 0;
  background: rgba(18, 30, 34, 0.34);
  z-index: 1300;
  display: flex;
  align-items: center;
  justify-content: center;
}

.alert-box {
  width: 330px;
  max-width: 90vw;
  background: var(--lnb-side);
  border-radius: var(--radius-lg, 14px);
  box-shadow: var(--shadow-md, 0 6px 24px rgba(20, 40, 50, 0.12));
  text-align: center;
  padding: 24px 22px 18px;
}

.alert-box__msg {
  font-size: 13.5px;
  line-height: 1.6;
  margin: 0;
  white-space: pre-line;
  color: var(--lnb-txt);
}

.alert-box__actions {
  display: flex;
  gap: 8px;
  margin-top: 18px;
}

.alert-box__actions .btn {
  flex: 1;
}
</style>
