/**
 * 바이트 기준 문자열 자르기. 한글/한자 등 반각이 아닌 문자는 2바이트, 그 외(영문·숫자·기호)는
 * 1바이트로 센다 — 국내 사내 시스템에서 흔히 쓰는 "화면 타이틀 N바이트 제한" 관례를 그대로
 * 옮긴 것이다(1탭 타이틀 10바이트 제한, 2026-08-25).
 */
export function byteLength(text) {
  let bytes = 0
  for (const ch of text) {
    bytes += ch.charCodeAt(0) > 127 ? 2 : 1
  }
  return bytes
}

/**
 * `maxBytes`를 넘으면 그 안에서 잘라 말줄임표(`...`)를 붙인다. 안 넘으면 원본 그대로.
 * 말줄임표 3바이트도 `maxBytes` 예산 안에 포함된다 — 그래서 실제 글자는 `maxBytes - 3`바이트까지
 * 채우고 그 나머지에 "..."을 붙인다(2026-08-25: "20바이트에서 ...을 뺀 나머지 글자는 다
 * 노출해야지" — 잘린 글자 수를 필요 이상으로 줄이지 않기 위함).
 */
export function truncateByBytes(text, maxBytes) {
  if (byteLength(text) <= maxBytes) return text
  const ellipsis = '...'
  const budget = Math.max(0, maxBytes - byteLength(ellipsis))
  let bytes = 0
  let result = ''
  for (const ch of text) {
    const width = ch.charCodeAt(0) > 127 ? 2 : 1
    if (bytes + width > budget) break
    bytes += width
    result += ch
  }
  return `${result}${ellipsis}`
}
