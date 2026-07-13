// PAG-M-TLB-01 테스트 라이브러리

export const testLibraryMeta = {
  hint: '완료 프로젝트 시나리오·케이스 적재 라이브러리',
  notice: '프로젝트 완료 시 등록된 시나리오가 라이브러리에 적재됩니다.',
}

export const systemOptions = ['전체', 'FO', 'HIMS', 'HPAS', 'HCAS']
export const typeOptions = ['전체', 'DEV', '운영']
export const pageSizeOptions = [20, 50, 100]

export const libraryList = [
  {
    id: 'LIB-001',
    type: '운영',
    round: '운영테스트 3차',
    title: '복지혜택 신청변경 (직원/임원)',
    systemPath: 'FO > 법인숙박 > 여행레저 > 복지혜택',
    screenName: '복지혜택 신청',
    sourceProject: '주문취소 시 쿠폰 할인취소 정보 표기',
    caseCount: 2,
    stepCount: 4,
    registeredAt: '2026-05-10',
    registeredBy: '권선희',
    cases: [
      {
        id: 'CASE-001',
        title: '복지혜택 신청변경 (직원/임원)',
        steps: [
          { no: 1, procedure: '숙박바우처 선택 시', expected: '바우처 특복 배정 확인' },
          { no: 2, procedure: '페이지 하단 신청정보 확인', expected: '숙박바우처/최종선택일 업데이트' },
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
    systemPath: 'FO > 주문클레임 > 주문/결제',
    screenName: '주문취소',
    sourceProject: '주문취소 시 쿠폰 할인취소 정보 표기',
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
    systemPath: 'HIMS > 정산 > 정산 > 대사',
    screenName: '정산대사',
    sourceProject: '정산 대사 자동화',
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
    systemPath: 'FO > 회원/로그인 > SSO',
    screenName: 'SSO 로그인',
    sourceProject: 'SSO 연동 개선',
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
]

export function matchLibraryFilters(row, filters) {
  if (filters.system !== '전체' && !row.systemPath.startsWith(filters.system)) return false
  if (filters.type !== '전체' && row.type !== filters.type) return false
  if (filters.keyword) {
    const q = filters.keyword.toLowerCase()
    const hay = `${row.id}${row.title}${row.systemPath}${row.screenName}${row.sourceProject}`.toLowerCase()
    if (!hay.includes(q)) return false
  }
  return true
}
