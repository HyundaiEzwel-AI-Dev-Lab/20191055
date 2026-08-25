<script setup>
// PAG-M-COM-02 로그인 화면 (h-pms 화면 기준 UI 이관, API는 목업 유지)
// figma: 01_로그인.html / 기획서: 로그인.pdf
import { reactive, ref, onMounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { findUserById } from '@/entities/auth/mockUsers'
import { useAuthStore } from '@/app/stores/auth'
import HpPasswordToggle from '@/shared/ui/HpPasswordToggle.vue'

const router = useRouter()
const route = useRoute()
const authStore = useAuthStore()

const ID_STORAGE_KEY = 'hpms.savedLoginId'
const MAX_FAIL = 5

const form = reactive({
  id: '',
  password: '',
  saveId: false,
})
const showPassword = ref(false)
const errorMessage = ref('')
const errorCode = ref('')
const submitting = ref(false)

onMounted(() => {
  const saved = localStorage.getItem(ID_STORAGE_KEY)
  if (saved) {
    form.id = saved
    form.saveId = true
  }
})

async function login() {
  errorMessage.value = ''
  errorCode.value = ''

  // 1. ID/PW 입력 여부
  if (!form.id.trim() || !form.password.trim()) {
    errorMessage.value = 'ID 또는 PW를 입력해주세요'
    return
  }

  submitting.value = true
  try {
    // 2. 계정 존재 여부
    const user = findUserById(form.id.trim())
    if (!user) {
      errorMessage.value = '등록되지 않은 계정입니다.'
      return
    }

    // 3. 계정 사용 상태
    if (user.status === 'locked') {
      errorMessage.value = '잠금처리된 계정입니다. 담당자에게 문의하세요.'
      return
    }
    if (user.status === 'leave') {
      errorMessage.value = '휴직처리된 계정입니다. 담당자에게 문의하세요.'
      return
    }
    if (user.status === 'retired') {
      errorMessage.value = '퇴직 처리된 계정으로 로그인할 수 없습니다.'
      return
    }

    // 4. 비밀번호 오류 횟수 (5회 초과)
    if (user.failCount >= MAX_FAIL) {
      errorCode.value = 'ACCOUNT_LOCKED'
      errorMessage.value = '로그인 가능 횟수를 초과했습니다. 담당자에게 문의하세요.'
      return
    }

    // 5. 비밀번호 일치 여부
    if (user.password !== form.password) {
      user.failCount += 1
      errorMessage.value = 'ID 또는 PW가 일치하지 않습니다.'
      return
    }

    // 로그인 성공
    if (form.saveId) {
      localStorage.setItem(ID_STORAGE_KEY, form.id.trim())
    } else {
      localStorage.removeItem(ID_STORAGE_KEY)
    }
    user.failCount = 0
    authStore.login(user)
    const redirect = typeof route.query.redirect === 'string' ? route.query.redirect : '/'
    router.push(redirect)
  } catch (e) {
    // 6. 시스템 오류
    errorMessage.value = '로그인 처리 중 오류가 발생했습니다. 잠시 후 다시 시도해주세요.'
  } finally {
    submitting.value = false
  }
}
</script>

<template>
  <div class="hp-login">
    <div class="hp-login__left">
      <div class="hp-login__sub">HPMS</div>
      <h1 class="hp-login__title">프로젝트의 시작부터 완료까지<br />한 눈에 관리하세요.</h1>
      <p class="hp-login__desc">
        요구사항, 설계, 테스트까지 효율적으로 관리하고<br />
        전체 IT 프로젝트 진행 현황을 언제든 확인하세요
      </p>
    </div>

    <div class="hp-login__right">
      <form class="hp-login__form" @submit.prevent="login">
        <h2>프로젝트 관리 시스템</h2>

        <div>
          <div class="hp-login__label">아이디</div>
          <div class="hp-login__field">
            <input v-model="form.id" placeholder="USER ID (사번/ ID)" autocomplete="username" />
          </div>
        </div>

        <div>
          <div class="hp-login__label">비밀번호</div>
          <div class="hp-login__field">
            <input
              v-model="form.password"
              :type="showPassword ? 'text' : 'password'"
              placeholder="PASSWORD"
              autocomplete="current-password"
            />
            <HpPasswordToggle v-model="showPassword" />
          </div>
        </div>

        <div class="hp-login__row">
          <label class="hp-login__save"><input v-model="form.saveId" type="checkbox" /> ID 저장</label>
        </div>

        <button class="hp-login__submit" type="submit" :disabled="submitting">
          {{ submitting ? '로그인 중...' : '로그인' }}
        </button>

        <p v-if="errorMessage" class="hp-login__error">
          <template v-if="errorCode === 'ACCOUNT_LOCKED'">
            로그인 가능 횟수를 초과했습니다.<br />웹기획팀에 문의 바랍니다
          </template>
          <template v-else>{{ errorMessage }}</template>
        </p>

        <div class="hp-login__foot">임직원 사번 계정 · 외주 전용 ID만 로그인 가능</div>
        <div class="hp-login__notice">※ 비밀번호 분실 시 웹기획팀에 문의 바랍니다.</div>
      </form>
    </div>
  </div>
</template>

<style scoped>
.hp-login {
  position: fixed;
  inset: 0;
  display: flex;
  font-family: var(--font-family);
  color: var(--ink);
}
.hp-login__left {
  flex: 1.2;
  background: linear-gradient(135deg, var(--teal-600), var(--teal) 60%, var(--teal-400));
  color: #fff;
  display: flex;
  flex-direction: column;
  justify-content: center;
  padding: 0 8%;
  gap: var(--space-lg);
}
.hp-login__title {
  font-size: 30px;
  font-weight: 800;
  line-height: 1.35;
  margin: 0;
}
.hp-login__sub {
  font-size: var(--font-size-sm);
  opacity: 0.9;
}
.hp-login__desc {
  font-size: var(--font-size-md);
  opacity: 0.85;
  line-height: 1.7;
  margin: var(--space-sm) 0 0;
}
.hp-login__right {
  flex: 1;
  background: var(--lnb-side);
  display: flex;
  align-items: center;
  justify-content: center;
}
.hp-login__form {
  width: 320px;
  display: flex;
  flex-direction: column;
  gap: var(--space-md);
}
.hp-login__form h2 {
  font-size: 20px;
  margin: 0 0 var(--space-xs);
  text-align: center;
}
.hp-login__label {
  font-size: var(--font-size-sm);
  color: var(--muted);
  font-weight: 600;
  margin-bottom: var(--space-xs);
}
.hp-login__field {
  height: 42px;
  border: 1px solid var(--line);
  border-radius: var(--radius-sm);
  display: flex;
  align-items: center;
  padding: 0 var(--space-sm);
  gap: var(--space-xs);
  background: var(--field);
}
.hp-login__field input {
  flex: 1;
  border: none;
  background: none;
  outline: none;
  font-size: var(--font-size-md);
  font-family: inherit;
  color: var(--ink);
}
.hp-login__row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  font-size: var(--font-size-sm);
  color: var(--ink-2);
}
.hp-login__save {
  display: flex;
  gap: var(--space-xs);
  align-items: center;
  cursor: pointer;
}
.hp-login__submit {
  height: 44px;
  background: var(--teal);
  color: #fff;
  border: none;
  border-radius: var(--radius-sm);
  font-weight: 700;
  font-size: var(--font-size-md);
  cursor: pointer;
  font-family: inherit;
}
.hp-login__submit:hover:not(:disabled) {
  background: var(--teal-600);
}
.hp-login__submit:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}
.hp-login__error {
  color: var(--red);
  font-size: var(--font-size-sm);
  text-align: center;
  margin: 0;
  min-height: 16px;
}
.hp-login__foot {
  font-size: var(--font-size-xs);
  color: var(--muted);
  text-align: center;
}
.hp-login__notice {
  font-size: var(--font-size-xs);
  color: var(--ink-2);
  text-align: center;
  border: 1px solid var(--line);
  border-radius: var(--radius-sm);
  padding: var(--space-sm);
}

@media (max-width: 860px) {
  .hp-login {
    flex-direction: column;
  }
  .hp-login__left {
    padding: 40px 24px;
  }
}
</style>
