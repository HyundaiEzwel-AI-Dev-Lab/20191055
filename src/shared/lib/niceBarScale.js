/**
 * 가로 바 그래프의 상한을 10 단위로 딱 맞춘다 — 값이 10을 넘으면 20, 20을 넘으면 30…
 * 현재 최댓값을 그대로 100%로 두면 눈금이 매번 달라져 "몇 건인지" 감이 안 잡힌다.
 *
 * @param {number} max 데이터의 실제 최댓값(0 이하도 허용 — 데이터 없음)
 * @param {number} step 눈금 단위(기본 10)
 */
export function niceBarScaleMax(max, step = 10) {
  if (max <= 0) return step
  return Math.ceil(max / step) * step
}
