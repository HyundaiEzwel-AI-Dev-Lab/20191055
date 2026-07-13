<script setup>
// PAG-M-COM-02 로그인 화면
// figma: 01_로그인.html / 기획서: 로그인.pdf
import { reactive, ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import PasswordResetModal from '@/components/auth/PasswordResetModal.vue'
import { findUserById } from '@/data/mockUsers'
import { useAuthStore } from '@/stores/auth'

const router = useRouter()
const authStore = useAuthStore()

const ID_STORAGE_KEY = 'hpms.savedLoginId'
const MAX_FAIL = 5

const form = reactive({
  id: '',
  password: '',
  saveId: false,
})
const showPassword = ref(false)
const showReset = ref(false)
const errorMessage = ref('')
const showTooltip = ref(false)

const summary = [
  { key: 'total', label: '전체', value: 27 },
  { key: 'recv', label: '접수', value: 6 },
  { key: 'prog', label: '진행', value: 14, tooltip: true },
  { key: 'done', label: '완료', value: 6 },
]

onMounted(() => {
  const saved = localStorage.getItem(ID_STORAGE_KEY)
  if (saved) {
    form.id = saved
    form.saveId = true
  }
})

function login() {
  errorMessage.value = ''

  // 1. ID/PW 입력 여부
  if (!form.id.trim() || !form.password.trim()) {
    errorMessage.value = 'ID 또는 PW를 입력해주세요'
    return
  }

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
      errorMessage.value = '로그인 가능 횟수를 초과했습니다. 비밀번호 재설정 후 이용하세요'
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
    router.push('/inbox')
  } catch (e) {
    // 6. 시스템 오류
    errorMessage.value = '로그인 처리 중 오류가 발생했습니다. 잠시 후 다시 시도해주세요.'
  }
}
</script>

<template>
  <div class="login">
    <div class="left">
      <div>
        <div class="sub">전사 프로젝트 관리 시스템</div>
        <h1>프로젝트의 시작부터 완료까지<br />한 눈에 관리하세요.</h1>
        <p class="desc">
          요구사항, 설계, 테스트까지 효율적으로 관리하고<br />
          전체 IT 프로젝트 진행 현황을 언제든 확인하세요
        </p>
      </div>
      <div class="kpis">
        <div v-for="item in summary" :key="item.key" class="lk">
          <div class="l">
            {{ item.label }}
            <span
              v-if="item.tooltip"
              class="info"
              @mouseenter="showTooltip = true"
              @mouseleave="showTooltip = false"
            >
              ⓘ
              <span v-if="showTooltip" class="tip">
                진행중 상태<br />: 프로젝트 처리상태<br />'처리중, 협의중, 테스트' 상태
              </span>
            </span>
          </div>
          <div class="v">{{ item.value }}</div>
        </div>
      </div>
    </div>

    <div class="right">
      <form class="form" @submit.prevent="login">
        <h2>프로젝트 관리 시스템</h2>

        <div>
          <div class="lab">아이디</div>
          <div class="tin">
            <input v-model="form.id" placeholder="USER ID (사번/ ID)" autocomplete="username" />
          </div>
        </div>

        <div>
          <div class="lab">비밀번호</div>
          <div class="tin">
            <input
              v-model="form.password"
              :type="showPassword ? 'text' : 'password'"
              placeholder="PASSWORD"
              autocomplete="current-password"
            />
            <span class="eye" @click="showPassword = !showPassword">
              <svg v-if="showPassword" viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round">
                <path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12Z" />
                <circle cx="12" cy="12" r="3" />
              </svg>
              <svg v-else viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round">
                <path d="M3 3l18 18" />
                <path d="M10.6 6.1A10.8 10.8 0 0 1 12 6c6.5 0 10 6 10 6a17.6 17.6 0 0 1-3.2 3.8M6.4 8.1A17.3 17.3 0 0 0 2 12s3.5 6 10 6a10.4 10.4 0 0 0 2.4-.3" />
                <path d="M9.9 9.9a3 3 0 0 0 4.2 4.2" />
              </svg>
            </span>
          </div>
        </div>

        <div class="rowx">
          <label class="save"><input v-model="form.saveId" type="checkbox" /> ID 저장</label>
          <a @click="showReset = true">비밀번호 재설정</a>
        </div>

        <button class="big" type="submit">로그인</button>

        <p v-if="errorMessage" class="err">{{ errorMessage }}</p>

        <div class="foot">임직원 사번 계정 · 외주 전용 ID만 로그인 가능</div>
      </form>
    </div>

    <PasswordResetModal v-model="showReset" />
  </div>
</template>

<style scoped>
.login {
  --teal: #119a8a;
  --teal-600: #0e8275;
  --ink: #1f2a30;
  --ink-2: #48565e;
  --muted: #7c8a92;
  --line: #e3e8eb;
  --field: #f1f4f5;
  --red: #e0524a;
  position: fixed;
  inset: 0;
  display: flex;
  font-family: 'Pretendard', -apple-system, 'Apple SD Gothic Neo', 'Malgun Gothic', sans-serif;
  color: var(--ink);
}

.left {
  flex: 1.2;
  background: linear-gradient(135deg, #0e8275, #119a8a 60%, #15b3a0);
  color: #fff;
  display: flex;
  flex-direction: column;
  justify-content: center;
  padding: 0 8%;
  gap: 26px;
}
.left h1 {
  font-size: 30px;
  font-weight: 800;
  line-height: 1.35;
  margin: 0;
}
.left .sub {
  font-size: 14px;
  opacity: 0.9;
  margin-bottom: 10px;
}
.left .desc {
  font-size: 13px;
  opacity: 0.85;
  line-height: 1.7;
  margin: 14px 0 0;
}
.left .kpis {
  display: flex;
  gap: 12px;
}
.left .lk {
  background: rgba(255, 255, 255, 0.12);
  border: 1px solid rgba(255, 255, 255, 0.18);
  border-radius: 12px;
  padding: 14px 18px;
  min-width: 84px;
}
.left .lk .l {
  font-size: 11px;
  opacity: 0.85;
  display: flex;
  align-items: center;
  gap: 4px;
}
.left .lk .v {
  font-size: 24px;
  font-weight: 800;
  margin-top: 2px;
}
.info {
  position: relative;
  cursor: pointer;
  opacity: 0.9;
}
.tip {
  position: absolute;
  top: calc(100% + 6px);
  left: 50%;
  transform: translateX(-50%);
  background: #fff;
  color: var(--ink-2);
  border-radius: 8px;
  padding: 8px 10px;
  font-size: 11px;
  line-height: 1.5;
  white-space: nowrap;
  box-shadow: 0 6px 24px rgba(20, 40, 50, 0.18);
  z-index: 5;
}

.right {
  flex: 1;
  background: #fff;
  display: flex;
  align-items: center;
  justify-content: center;
}
.form {
  width: 320px;
  display: flex;
  flex-direction: column;
  gap: 14px;
}
.form h2 {
  font-size: 20px;
  margin: 0 0 4px;
  text-align: center;
}
.form .lab {
  font-size: 12px;
  color: var(--muted);
  font-weight: 600;
  margin-bottom: 6px;
}
.form .tin {
  height: 42px;
  border: 1px solid var(--line);
  border-radius: 9px;
  display: flex;
  align-items: center;
  padding: 0 12px;
  gap: 8px;
  background: var(--field);
}
.form .tin input {
  flex: 1;
  border: none;
  background: none;
  outline: none;
  font-size: 13px;
  font-family: inherit;
  color: var(--ink);
}
.form .eye {
  color: var(--muted);
  cursor: pointer;
  display: flex;
  align-items: center;
}
.form .eye:hover {
  color: var(--ink-2);
}
.form .rowx {
  display: flex;
  align-items: center;
  justify-content: space-between;
  font-size: 12px;
  color: var(--ink-2);
}
.form .rowx .save {
  display: flex;
  gap: 6px;
  align-items: center;
  color: var(--ink-2);
  cursor: pointer;
}
.form .rowx a {
  color: var(--teal-600);
  font-weight: 600;
  cursor: pointer;
  text-decoration: none;
}
.form .big {
  height: 44px;
  background: var(--teal);
  color: #fff;
  border: none;
  border-radius: 9px;
  font-weight: 700;
  font-size: 14px;
  cursor: pointer;
  font-family: inherit;
}
.form .big:hover {
  background: var(--teal-600);
}
.form .err {
  color: var(--red);
  font-size: 12px;
  text-align: center;
  margin: 0;
  min-height: 16px;
}
.form .foot {
  font-size: 11px;
  color: var(--muted);
  text-align: center;
}

@media (max-width: 860px) {
  .login {
    flex-direction: column;
  }
  .left {
    padding: 40px 24px;
  }
}
</style>
