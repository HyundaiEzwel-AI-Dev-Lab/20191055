<script setup>
// POP-M-COM-03 비밀번호 재설정 (레이어 팝업, 헤더 > 내정보 > 비밀번호 변경에서 진입)
// SB v0.9: 휴대폰 인증 프로세스 SPEC OUT.
//
// 2026-09-02: 이름·사번으로 "다른 사용자"를 찾아 바꾸는 mock 구조를 걷어낸다. 실 서버는
// 그런 조회 API를 제공하지 않는다 — 비밀번호 변경은 로그인 사용자 본인만 현재 비밀번호
// 확인 후 가능하다(h-pms PR #290, BR-51: 자가 재설정 자체가 SPEC OUT). 그래서 이름/사번
// 입력을 로그인 사용자 표시(읽기전용)로 바꾸고, 현재 비밀번호 필드를 추가해 mockUsers에
// 저장된 값과 대조한다.
import { reactive } from 'vue'
import BaseModal from '@/shared/ui/BaseModal.vue'
import HpPasswordToggle from '@/shared/ui/HpPasswordToggle.vue'
import { useAuthStore } from '@/app/stores/auth'
import { findUserById } from '@/entities/auth/mockUsers'

defineProps({
  modelValue: { type: Boolean, default: false },
  // 과거 이름·사번 조회 UI의 흔적. 신원이 항상 로그인 사용자로 고정되어 더는 쓰이지
  // 않지만, AppHeader.vue 배선을 건드리지 않기 위해 받아만 두고 무시한다.
  prefill: { type: Object, default: null },
  lockIdentity: { type: Boolean, default: false },
})
const emit = defineEmits(['update:modelValue'])

const auth = useAuthStore()

const form = reactive({ current: '', next: '', confirm: '' })
const show = reactive({ current: false, next: false, confirm: false })

/** 비밀번호 생성 규칙(BR-34): 화면에 그대로 노출하는 문구 */
const PASSWORD_RULES = [
  '영문/숫자/특수문자 포함 8자리 이상',
  '영문 대/소문자·숫자·특수문자 중 2종 이상 조합 필수',
  '동일 문자 연속 3회 이상 사용 불가',
  '공백 문자 사용 불가',
]

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

function violation() {
  if (!form.current) return '현재 비밀번호를 입력하세요.'
  if (!form.next) return '신규 비밀번호를 입력해주세요.'
  if (!checkPolicy(form.next)) return '영문/숫자/특수문자를 포함 8자리 이상 입력해 주세요.'
  if (form.next !== form.confirm) return '신규 비밀번호와 비밀번호 확인이 일치하지 않습니다.'
  if (form.next === form.current) return '현재 비밀번호와 다른 값을 입력하세요.'
  return null
}

function save() {
  const problem = violation()
  if (problem) {
    window.alert(problem)
    return
  }

  const me = findUserById(auth.user?.id)
  if (!me || me.password !== form.current) {
    window.alert('현재 비밀번호가 올바르지 않습니다.')
    return
  }

  if (!window.confirm('비밀번호를 변경하시겠습니까?')) return

  me.password = form.next
  me.failCount = 0
  window.alert('비밀번호가 정상적으로 변경되었습니다.')
  close()
}

function close() {
  form.current = ''
  form.next = ''
  form.confirm = ''
  show.current = false
  show.next = false
  show.confirm = false
  emit('update:modelValue', false)
}
</script>

<template>
  <BaseModal title="비밀번호 재설정" :visible="modelValue" @close="close">
    <div class="identity-line">{{ auth.user?.name }} · {{ auth.user?.id }}</div>

    <div class="divider" />

    <div class="fld">
      <label for="pwreset-current">현재 비밀번호</label>
      <div class="inp inp--flex">
        <input
          id="pwreset-current"
          v-model="form.current"
          :type="show.current ? 'text' : 'password'"
          placeholder="PASSWORD"
          class="bare"
          autocomplete="current-password"
        />
        <HpPasswordToggle v-model="show.current" label="현재 비밀번호" />
      </div>
    </div>

    <div class="fld fld--gap">
      <label for="pwreset-next">신규 비밀번호</label>
      <div class="inp inp--flex">
        <input
          id="pwreset-next"
          v-model="form.next"
          :type="show.next ? 'text' : 'password'"
          placeholder="PASSWORD"
          class="bare"
          autocomplete="new-password"
        />
        <HpPasswordToggle v-model="show.next" label="신규 비밀번호" />
      </div>
    </div>

    <div class="fld fld--gap-lg">
      <label for="pwreset-confirm">신규 비밀번호 확인</label>
      <div class="inp inp--flex">
        <input
          id="pwreset-confirm"
          v-model="form.confirm"
          :type="show.confirm ? 'text' : 'password'"
          placeholder="PASSWORD"
          class="bare"
          autocomplete="new-password"
          @keyup.enter="save"
        />
        <HpPasswordToggle v-model="show.confirm" label="신규 비밀번호 확인" />
      </div>
    </div>

    <div class="rule">
      <b>비밀번호 생성 규칙</b>
      <ul>
        <li v-for="rule in PASSWORD_RULES" :key="rule">{{ rule }}</li>
        <li>현재·직전에 쓴 비밀번호와 다른 값</li>
      </ul>
    </div>

    <template #footer>
      <button type="button" class="btn btn--ghost" @click="close">취소</button>
      <button type="button" class="btn btn--primary" @click="save">저장</button>
    </template>
  </BaseModal>
</template>

<style scoped>
.identity-line {
  font-size: calc(12px + var(--font-size-offset));
  font-weight: 600;
  color: var(--ink);
}
.fld {
  display: flex;
  flex-direction: column;
  gap: 4px;
  margin-bottom: 10px;
}
.fld--gap-lg {
  margin-bottom: 14px;
}
.fld label {
  font-size: calc(11px + var(--font-size-offset));
  color: var(--muted);
  font-weight: 600;
}
.inp {
  height: 32px;
  width: 100%;
  background: var(--field);
  border: 1px solid var(--line);
  border-radius: var(--radius-sm);
  padding: 0 10px;
  display: flex;
  align-items: center;
  font-size: calc(12px + var(--font-size-offset));
  font-family: inherit;
  color: var(--ink);
}
.inp--flex {
  justify-content: space-between;
}
.bare {
  flex: 1;
  border: none;
  background: none;
  outline: none;
  font-size: calc(12px + var(--font-size-offset));
  font-family: inherit;
  color: var(--ink);
}
.divider {
  border-top: 1px solid var(--line);
  margin: 10px 0 14px;
}
.rule {
  background: var(--field);
  border: 1px solid var(--line);
  border-radius: var(--radius-md);
  padding: 14px 16px;
  font-size: calc(11.5px + var(--font-size-offset));
  line-height: 1.9;
  color: var(--ink-2);
}
.rule ul {
  margin: 0;
  padding-left: 14px;
  list-style: '· ';
}
</style>
