import { computed, ref } from 'vue'

const visible = ref(false)
const message = ref('데이터를 조회하고 있습니다.')
let lockCount = 0

/**
 * 공통 로딩 (전역)
 * show/hide는 중첩 호출을 카운트로 처리합니다.
 */
export function useLoading() {
  function show(msg) {
    if (msg) message.value = msg
    else if (!lockCount) message.value = '데이터를 조회하고 있습니다.'
    lockCount += 1
    visible.value = true
  }

  function hide() {
    lockCount = Math.max(0, lockCount - 1)
    if (lockCount === 0) visible.value = false
  }

  function reset() {
    lockCount = 0
    visible.value = false
    message.value = '데이터를 조회하고 있습니다.'
  }

  /** async 작업 동안 로딩 표시 */
  async function withLoading(task, msg) {
    show(msg)
    try {
      return await task()
    } finally {
      hide()
    }
  }

  return {
    visible: computed(() => visible.value),
    message: computed(() => message.value),
    show,
    hide,
    reset,
    withLoading,
  }
}
