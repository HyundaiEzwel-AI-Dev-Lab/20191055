<script setup>
// POP-M-COM-03 비밀번호 재설정 (레이어 팝업)
// figma: 19_팝업_비밀번호재설정.html / 기획서: 로그인.pdf (2/2)
import { reactive, ref, computed, onBeforeUnmount } from 'vue'
import BaseModal from '@/components/ui/BaseModal.vue'
import { findUserForReset } from '@/data/mockUsers'

defineProps({
  modelValue: { type: Boolean, default: false },
})
const emit = defineEmits(['update:modelValue'])

const CODE_TTL = 180
const MOCK_CODE = '123456'

const form = reactive({
  name: '',
  empId: '',
  phone: '',
  code: '',
  next: '',
  confirm: '',
})
const codeSent = ref(false)
const verified = ref(false)
const remaining = ref(0)
const showNext = ref(false)
const showConfirm = ref(false)
const matchedUser = ref(null)
let timer = null

// 알럿 / 컨펌 상태
const infoAlert = reactive({ show: false, message: '', onOk: null })
const confirmDialog = reactive({ show: false, message: '', onOk: null })

const timerLabel = computed(() => {
  const m = String(Math.floor(remaining.value / 60)).padStart(2, '0')
  const s = String(remaining.value % 60).padStart(2, '0')
  return `${m}:${s}`
})

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

function startTimer() {
  clearTimer()
  remaining.value = CODE_TTL
  timer = setInterval(() => {
    if (remaining.value > 0) remaining.value -= 1
    else clearTimer()
  }, 1000)
}
function clearTimer() {
  if (timer) {
    clearInterval(timer)
    timer = null
  }
}

// 1. 인증번호 발송 (본인확인)
function sendCode() {
  if (!form.name.trim() || !form.empId.trim() || !form.phone.trim()) {
    openInfo('등록된 임직원 정보와 입력하신 정보가 일치하지 않습니다')
    return
  }
  const user = findUserForReset({
    name: form.name.trim(),
    empId: form.empId.trim(),
    phone: form.phone.trim(),
  })
  if (!user) {
    openInfo('등록된 임직원 정보와 입력하신 정보가 일치하지 않습니다')
    return
  }
  matchedUser.value = user
  codeSent.value = true
  verified.value = false
  form.code = ''
  startTimer()
  openInfo('발송에 성공하였습니다.')
}

// 2. 재발송
function resend() {
  form.code = ''
  verified.value = false
  startTimer()
  openInfo('발송에 성공하였습니다.')
}

// 3. 인증
function verify() {
  if (remaining.value <= 0) {
    openInfo('인증시간이 만료되었습니다.')
    return
  }
  if (form.code.trim() !== MOCK_CODE) {
    openInfo('인증번호가 일치하지 않습니다. 확인 후 다시 시도하세요.')
    return
  }
  verified.value = true
  clearTimer()
}

// 비밀번호 정책: 8자+ / 2종+ / 동일문자 3연속 금지 / 공백 금지
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

// 4b. 저장
function save() {
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
  openConfirm('등록한 정보를 저장합니다.\n진행하시겠습니까?', doSave)
}

function doSave() {
  if (matchedUser.value && matchedUser.value.password === form.next) {
    openInfo('기존 비밀번호와 동일한 비밀번호는 사용할 수 없습니다.')
    return
  }
  if (matchedUser.value) {
    matchedUser.value.password = form.next
    matchedUser.value.failCount = 0
  }
  openInfo('비밀번호가 정상적으로 변경되었습니다.', close)
}

function close() {
  clearTimer()
  form.name = ''
  form.empId = ''
  form.phone = ''
  form.code = ''
  form.next = ''
  form.confirm = ''
  codeSent.value = false
  verified.value = false
  remaining.value = 0
  showNext.value = false
  showConfirm.value = false
  matchedUser.value = null
  emit('update:modelValue', false)
}

onBeforeUnmount(clearTimer)
</script>

<template>
  <BaseModal title="비밀번호 재설정" :visible="modelValue" @close="close">
    <div class="frow">
      <div class="fld">
        <label>이름</label>
        <input v-model="form.name" class="inp" type="text" :disabled="codeSent" />
      </div>
      <div class="fld">
        <label>사번 / ID</label>
        <input v-model="form.empId" class="inp" type="text" :disabled="codeSent" />
      </div>
    </div>

    <div class="divider" />

    <div class="fld fld--gap">
      <label>휴대전화 (- 제외)</label>
      <div class="row">
        <input v-model="form.phone" class="inp" type="text" :disabled="codeSent" />
        <button v-if="!codeSent" type="button" class="btn btn--ghost btn--sm" @click="sendCode">
          인증번호
        </button>
        <button v-else type="button" class="btn btn--ghost btn--sm" @click="resend">재발송</button>
      </div>
    </div>

    <div v-if="codeSent" class="fld fld--gap-sm">
      <label>인증번호</label>
      <div class="row">
        <input
          v-model="form.code"
          class="inp"
          type="text"
          maxlength="6"
          :disabled="verified"
        />
        <span v-if="!verified" class="timer">{{ timerLabel }}</span>
        <button
          type="button"
          class="btn btn--ghost btn--sm"
          :disabled="verified"
          @click="verify"
        >
          인증
        </button>
      </div>
    </div>
    <div v-if="verified" class="okmsg">✓ 인증에 성공하셨습니다.</div>

    <template v-if="verified">
      <div class="divider" />

      <div class="fld fld--gap">
        <label>신규 비밀번호</label>
        <div class="inp inp--flex">
          <input
            v-model="form.next"
            :type="showNext ? 'text' : 'password'"
            placeholder="PASSWORD"
            class="bare"
          />
          <span class="eye" @click="showNext = !showNext">
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
          </span>
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
          />
          <span class="eye" @click="showConfirm = !showConfirm">
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
          </span>
        </div>
      </div>

      <div class="rule">
        <b>비밀번호 생성 규칙</b><br />
        · 영문/숫자/특수문자 포함 8자리 이상<br />
        · 영문 대/소문자·숫자·특수문자 중 2종 이상 조합 필수<br />
        · 동일 문자 연속 3회 이상 사용 불가<br />
        · 공백 문자 사용 불가
      </div>
    </template>

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
  gap: 10px 14px;
}

.fld {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.fld--gap {
  margin-bottom: 10px;
}

.fld--gap-sm {
  margin-bottom: 6px;
}

.fld--gap-lg {
  margin-bottom: 14px;
}

.fld label {
  font-size: 11px;
  color: var(--muted);
  font-weight: 600;
}

.row {
  display: flex;
  gap: 8px;
  align-items: center;
}

.inp {
  height: 32px;
  width: 100%;
  background: var(--lnb-side);
  border: 1px solid var(--lnb-line);
  border-radius: 7px;
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
  background: var(--field);
  color: var(--muted);
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
  color: var(--muted);
}

.eye {
  cursor: pointer;
  color: var(--muted);
  display: flex;
  align-items: center;
}

.eye:hover {
  color: var(--lnb-txt);
}

.divider {
  border-top: 1px solid var(--lnb-line);
  margin: 14px 0;
}

.timer {
  color: var(--red);
  font-size: 12px;
  font-weight: 700;
  white-space: nowrap;
}

.okmsg {
  font-size: 11px;
  color: var(--green);
  margin-bottom: 14px;
}

.rule {
  background: var(--field);
  border: 1px solid var(--lnb-line);
  border-radius: 10px;
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
  border-radius: 14px;
  box-shadow: 0 6px 24px rgba(20, 40, 50, 0.12);
  text-align: center;
  padding: 24px 22px 18px;
}

.alert-box__msg {
  font-size: 13.5px;
  line-height: 1.6;
  margin: 0;
  white-space: pre-line;
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
