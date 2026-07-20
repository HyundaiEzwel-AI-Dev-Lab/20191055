// PAG-M-TLB-01 테스트 라이브러리
import { reactive } from 'vue'

export const testLibraryMeta = {
  hint: '완료 프로젝트 시나리오·케이스 적재 라이브러리',
  notice:
    '테스트 라이브러리에는 재사용 가능성이 높은 공통 테스트케이스만 등록합니다. 등록된 테스트케이스는 임의 수정 및 삭제 제한합니다.',
}

export const systemOptions = ['전체', 'FO', 'HIMS', 'HPAS', 'HCAS']
export const bizOptions = [
  '전체',
  '법인숙박',
  '주문클레임',
  '회원/로그인',
  '복지혜택',
  '정산',
  'SSO',
]
export const sortOptions = [
  { value: 'newest', label: '최근등록순' },
  { value: 'oldest', label: '오래된순' },
]
export const openMonthOptions = ['전체', '2026-05', '2026-04', '2026-03', '2026-02', '2026-01']
export { pageSizeOptions } from './commonOptions'

/** @deprecated type filter — kept for older callers */
export const typeOptions = ['전체', 'DEV', '운영']

let caseSeq = 40
let libSeq = 5

export function nextCaseId() {
  caseSeq += 1
  return `CASE-${String(caseSeq).padStart(3, '0')}`
}

function nextLibId() {
  libSeq += 1
  return `LIB-${String(libSeq).padStart(3, '0')}`
}

export function parseSystemFromPath(systemPath) {
  if (!systemPath) return 'FO'
  return systemPath.split('>')[0].trim()
}

export function parseBizFromPath(systemPath) {
  if (!systemPath) return ''
  const parts = systemPath.split('>').map((s) => s.trim())
  return parts.length > 1 ? parts[1] : ''
}

export function emptyCaseForm() {
  return {
    id: '',
    libId: '',
    system: 'FO',
    bizCategory: '법인숙박',
    screenPath: '',
    screenName: '',
    caseName: '',
    sourceProject: '',
    openMonth: '2026-05',
    registeredBy: '김현대',
    registeredAt: new Date().toISOString().slice(0, 10),
    steps: [{ no: 1, procedure: '', expected: '' }],
  }
}

/** 시나리오 복사 모달 · 테스트 라이브러리 화면 공용 */
export const libraryList = reactive([
  {
    id: 'LIB-001',
    type: '운영',
    round: '운영테스트 3차',
    title: '복지혜택 신청변경 (직원/임원)',
    system: 'HIMS',
    bizCategory: '법인숙박',
    systemPath: 'HIMS > 법인숙박 > 여행레저 > 복지혜택',
    screenName: '복지혜택 신청',
    sourceProject: 'DL이앤씨 숙박바우처 변경 개발',
    openMonth: '2026-04',
    caseCount: 2,
    stepCount: 4,
    registeredAt: '2026-04-18',
    registeredBy: '권현대',
    cases: [
      {
        id: 'CASE-001',
        title: '복지혜택 신청변경 테스트 (직원/임원)',
        steps: [
          { no: 1, procedure: '복지혜택 신청', expected: '신청내역 접수 성공' },
          { no: 2, procedure: '신청 내역 조회', expected: '신청내역 조회성공' },
          { no: 3, procedure: '신청내역 정보 변경', expected: '신청내역 정보 변경 성공' },
        ],
      },
      {
        id: 'CASE-002',
        title: '모바일 복지혜택 신청',
        steps: [
          { no: 1, procedure: 'ez체크인', expected: '체크인 상품 결제' },
          { no: 2, procedure: '신청 완료 확인', expected: '신청내역 노출' },
        ],
      },
    ],
  },
  {
    id: 'LIB-002',
    type: 'DEV',
    round: 'DEV테스트 2차',
    title: '주문클레임 쿠폰 취소 검증',
    system: 'FO',
    bizCategory: '주문클레임',
    systemPath: 'FO > 주문클레임 > 주문/결제',
    screenName: '주문취소',
    sourceProject: '주문취소 시 쿠폰 할인취소 정보 표기',
    openMonth: '2026-04',
    caseCount: 1,
    stepCount: 3,
    registeredAt: '2026-04-22',
    registeredBy: '김현대',
    cases: [
      {
        id: 'CASE-010',
        title: '쿠폰 할인취소 정보 표기',
        steps: [
          { no: 1, procedure: '쿠폰 적용 주문 취소', expected: '할인취소 금액 노출' },
          { no: 2, procedure: '취소 완료 화면 확인', expected: '할인취소 안내 문구 표시' },
          { no: 3, procedure: '주문상세 재진입', expected: '취소 이력과 일치' },
        ],
      },
    ],
  },
  {
    id: 'LIB-003',
    type: '운영',
    round: '운영테스트 1차',
    title: 'HIMS 정산 대사 시나리오',
    system: 'HIMS',
    bizCategory: '정산',
    systemPath: 'HIMS > 정산 > 정산 > 대사',
    screenName: '정산대사',
    sourceProject: '정산 대사 자동화',
    openMonth: '2026-03',
    caseCount: 1,
    stepCount: 2,
    registeredAt: '2026-03-18',
    registeredBy: '이현주',
    cases: [
      {
        id: 'CASE-020',
        title: '일별 대사 검증',
        steps: [
          { no: 1, procedure: '대사 대상 일자 선택', expected: '대상 건수 조회' },
          { no: 2, procedure: '대사 실행', expected: '일치/불일치 결과 표기' },
        ],
      },
    ],
  },
  {
    id: 'LIB-004',
    type: 'DEV',
    round: 'DEV테스트 1차',
    title: '회원 SSO 로그인',
    system: 'FO',
    bizCategory: '회원/로그인',
    systemPath: 'FO > 회원/로그인 > SSO',
    screenName: 'SSO 로그인',
    sourceProject: 'SSO 연동 개선',
    openMonth: '2026-02',
    caseCount: 1,
    stepCount: 2,
    registeredAt: '2026-02-11',
    registeredBy: '최개발',
    cases: [
      {
        id: 'CASE-030',
        title: 'SSO 정상 로그인',
        steps: [
          { no: 1, procedure: 'SSO 진입', expected: '인증 페이지 이동' },
          { no: 2, procedure: '인증 완료', expected: '메인 화면 랜딩' },
        ],
      },
    ],
  },
  {
    id: 'LIB-005',
    type: '운영',
    round: '운영테스트 1차',
    title: '결제내역 기간 조회',
    system: 'HPAS',
    bizCategory: '정산',
    systemPath: 'HPAS > 결제 > 정산',
    screenName: '결제내역 조회',
    sourceProject: '결제 정산 고도화',
    openMonth: '2026-01',
    caseCount: 1,
    stepCount: 2,
    registeredAt: '2026-01-28',
    registeredBy: '박현대',
    cases: [
      {
        id: 'CASE-031',
        title: '결제내역 기간 조회',
        steps: [
          { no: 1, procedure: '조회 기간 입력', expected: '기간 내 결제건 목록' },
          { no: 2, procedure: '엑셀 다운로드', expected: '동일 건수 추출' },
        ],
      },
    ],
  },
])

export function recalcLibCounts(lib) {
  lib.caseCount = lib.cases?.length || 0
  lib.stepCount = (lib.cases || []).reduce((n, c) => n + (c.steps?.length || 0), 0)
}

/** libraryList.cases → 케이스 단위 행 (부모 메타 포함) */
export function flattenLibraryCases(list = libraryList) {
  return list.flatMap((lib) =>
    (lib.cases || []).map((c) => ({
      libId: lib.id,
      id: c.id,
      caseName: c.title || c.caseName || '',
      systemPath: lib.systemPath,
      screenName: lib.screenName,
      sourceProject: lib.sourceProject,
      registeredAt: lib.registeredAt,
      registeredBy: lib.registeredBy,
      system: lib.system || parseSystemFromPath(lib.systemPath),
      bizCategory: lib.bizCategory || parseBizFromPath(lib.systemPath),
      openMonth: lib.openMonth || (lib.registeredAt || '').slice(0, 7),
      steps: (c.steps || []).map((s) => ({ ...s })),
    })),
  )
}

export function findCaseInLibrary(caseId) {
  for (const lib of libraryList) {
    const caseIdx = (lib.cases || []).findIndex((c) => c.id === caseId)
    if (caseIdx >= 0) {
      return { lib, caseIdx, case: lib.cases[caseIdx] }
    }
  }
  return null
}

export function matchLibraryFilters(row, filters) {
  if (filters.system !== '전체' && row.system !== filters.system) return false
  if (filters.bizCategory !== '전체' && row.bizCategory !== filters.bizCategory) return false
  if (filters.screenName) {
    const q = filters.screenName.trim().toLowerCase()
    const hay = `${row.screenName || ''} ${row.systemPath || ''}`.toLowerCase()
    if (!hay.includes(q)) return false
  }
  if (filters.caseName) {
    const q = filters.caseName.trim()
    if (q.length >= 2 && !row.caseName.toLowerCase().includes(q.toLowerCase())) return false
    if (q.length === 1) return false // SB: 2자 이상
  }
  if (
    filters.sourceProject &&
    !row.sourceProject.toLowerCase().includes(filters.sourceProject.toLowerCase())
  ) {
    return false
  }
  if (filters.openMonth && filters.openMonth !== '전체' && row.openMonth !== filters.openMonth) {
    return false
  }
  if (
    filters.registeredBy &&
    !row.registeredBy.toLowerCase().includes(filters.registeredBy.toLowerCase())
  ) {
    return false
  }
  return true
}

/** @deprecated use matchLibraryFilters */
export function matchCaseFilters(row, filters) {
  return matchLibraryFilters(row, filters)
}

export function saveLibraryCase(form, isNew) {
  const steps = (form.steps || []).map((s, i) => ({
    no: i + 1,
    procedure: s.procedure,
    expected: s.expected,
  }))
  const caseId = form.id || nextCaseId()
  const libPayload = {
    system: form.system,
    bizCategory: form.bizCategory,
    systemPath: form.screenPath,
    screenName: form.screenName,
    sourceProject: form.sourceProject.trim(),
    openMonth: form.openMonth,
    registeredBy: form.registeredBy.trim() || '김현대',
    registeredAt: form.registeredAt || new Date().toISOString().slice(0, 10),
  }

  if (isNew) {
    const lib = {
      id: nextLibId(),
      type: 'DEV',
      round: '신규 등록',
      title: form.caseName.trim(),
      ...libPayload,
      caseCount: 1,
      stepCount: steps.length,
      cases: [{ id: caseId, title: form.caseName.trim(), steps }],
    }
    libraryList.unshift(lib)
    return { ...flattenLibraryCases([lib])[0], id: caseId, libId: lib.id }
  }

  const found = findCaseInLibrary(form.id)
  if (!found) return null

  Object.assign(found.lib, libPayload, { title: form.caseName.trim() })
  Object.assign(found.case, { title: form.caseName.trim(), steps })
  recalcLibCounts(found.lib)

  return flattenLibraryCases([found.lib]).find((r) => r.id === caseId) || null
}

export function deleteLibraryCase(caseId) {
  const found = findCaseInLibrary(caseId)
  if (!found) return false
  found.lib.cases.splice(found.caseIdx, 1)
  recalcLibCounts(found.lib)
  if (!found.lib.cases.length) {
    const libIdx = libraryList.findIndex((l) => l.id === found.lib.id)
    if (libIdx >= 0) libraryList.splice(libIdx, 1)
  }
  return true
}
