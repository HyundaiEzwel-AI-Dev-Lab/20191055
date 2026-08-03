/** 프로젝트명: 띄어쓰기 제외 5글자까지, 이후 ... */
export function truncateProjectName(name, maxLen = 5) {
  if (!name) return ''
  const compact = name.replace(/\s/g, '')
  if (compact.length <= maxLen) return compact
  return `${compact.slice(0, maxLen)}...`
}

/** 이름에서 성(첫 글자) 추출 — 아바타 표시용 */
export function getSurname(name) {
  const trimmed = name?.trim()
  if (!trimmed) return '?'
  return trimmed.charAt(0)
}
