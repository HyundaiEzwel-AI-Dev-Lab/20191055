import { onScopeDispose, watch } from 'vue'

/**
 * 모달을 Esc로 닫는다. 배경 클릭 닫기는 없다 — Esc가 키보드 사용자의 유일한 탈출로다.
 *
 * 모달이 겹쳐 열릴 수 있어서 각 컴포넌트가 따로 document 리스너를 달면 Esc 한 번에 전부
 * 닫힌다. 열린 순서를 스택으로 쌓고 가장 위 하나만 반응하게 한다. 리스너는 스택이 빌 때
 * 떼므로 모달이 없을 때는 아무것도 듣지 않는다.
 */
const stack = []

function onKeydown(event) {
  if (event.key === 'Escape') stack.at(-1)?.()
}

export function useEscapeToClose(isOpen, close) {
  function push() {
    if (stack.includes(close)) return
    if (stack.length === 0) document.addEventListener('keydown', onKeydown)
    stack.push(close)
  }

  function pop() {
    const index = stack.lastIndexOf(close)
    if (index < 0) return
    stack.splice(index, 1)
    if (stack.length === 0) document.removeEventListener('keydown', onKeydown)
  }

  watch(isOpen, (open) => (open ? push() : pop()), { immediate: true })
  onScopeDispose(pop)
}
