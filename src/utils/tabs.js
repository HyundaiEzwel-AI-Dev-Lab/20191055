/** 통합 1단 탭 메뉴명: 8글자 초과 시 ... */
export function truncateIntegratedTitle(name, maxLen = 8) {
  if (!name) return ''
  const compact = name.replace(/\s/g, '')
  if (compact.length <= maxLen) return name.trim()
  return `${name.trim().slice(0, maxLen)}...`
}

/** 라우트 → 2단 탭 ID */
export function subTabIdFromRoute(route) {
  const mode = route.params.mode
  if (mode) return `${String(route.name)}-${mode}`
  return String(route.name)
}

/** 라우트 → 2단 탭 제목 */
export function subTabTitleFromRoute(route) {
  const base = route.meta?.title || String(route.name)
  const mode = route.params.mode
  if (!mode) return base
  if (route.name === 'scenario') return `시나리오관리 (${mode === 'dev' ? 'DEV' : '운영'})`
  if (route.name === 'scenario-edit') return `시나리오편집 (${mode === 'dev' ? 'DEV' : '운영'})`
  if (route.name === 'test-run') return `테스트수행 (${mode === 'dev' ? 'DEV' : '운영'})`
  if (route.name === 'defect') return `결함관리 (${mode === 'dev' ? 'DEV' : '운영'})`
  if (route.name === 'progress') return `진척관리 (${mode === 'dev' ? 'DEV' : '운영'})`
  return `${base} (${mode === 'dev' ? 'DEV' : '운영'})`
}

/** 라우트 → 통합 1단 탭 ID */
export function integratedTabIdFromRoute(route) {
  const mode = route.params.mode
  if (mode) return `${String(route.name)}-${mode}`
  return String(route.name)
}

export function isProjectPath(path) {
  return path.startsWith('/project')
}
