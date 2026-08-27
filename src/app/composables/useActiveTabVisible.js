import { nextTick, onMounted, watch } from 'vue'

/**
 * 활성 탭이 스크롤 영역 밖에 있으면 보이는 곳까지 끌어온다.
 *
 * 탭이 많아 탭바가 넘친 상태에서 **LNB 메뉴로 화면을 열면** 그 탭이 활성이 되지만 스크롤 위치는
 * 그대로여서 화면은 바뀌었는데 어느 탭인지 안 보였다(1단·2단 둘 다). 탭 클릭으로 옮길 때는
 * 이미 보이는 탭이라 티가 안 났고, 메뉴·바로가기로 들어올 때만 나타났다.
 *
 * 좌표는 `getBoundingClientRect` 차이로 계산한다 — `offsetLeft`는 `offsetParent` 기준이라
 * 스크롤 컨테이너가 `position: static`이면 엉뚱한 기준이 잡힌다.
 */
const EDGE_GAP = 12

export function useActiveTabVisible(container, activeId) {
  async function reveal() {
    await nextTick()
    const el = container.value
    const active = el?.querySelector('.is-active')
    if (!el || !active) return

    const box = el.getBoundingClientRect()
    const target = active.getBoundingClientRect()

    // 왼쪽으로 벗어났으면 왼쪽 끝에, 오른쪽이면 오른쪽 끝에 맞춘다. 화살표 버튼에 딱 붙지 않도록
    // EDGE_GAP만큼 더 민다.
    let delta = 0
    if (target.left < box.left) delta = target.left - box.left - EDGE_GAP
    else if (target.right > box.right) delta = target.right - box.right + EDGE_GAP
    if (!delta) return

    // jsdom에는 scrollBy가 없다 — 없으면 scrollLeft를 직접 옮긴다.
    if (typeof el.scrollBy === 'function') el.scrollBy({ left: delta, behavior: 'smooth' })
    else el.scrollLeft += delta
  }

  watch(activeId, reveal)
  onMounted(reveal)
}
