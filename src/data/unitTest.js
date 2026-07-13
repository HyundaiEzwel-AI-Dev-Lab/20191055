// PAG-S-TST-01 단위테스트 목업 — SB p.112

import { testResultClass, defectStatusClass } from '@/data/testConfig'

export { testResultClass as unitResultClass, defectStatusClass }

export const unitTestMeta = {
  hint: 'WBS 작업 확정(퍼블/개발) 시 자동 생성',
  notice:
    '화면명 클릭 시 테스트 수행·결함 처리 팝업 · DEV/운영 시나리오와 별도 관리',
}

export const unitResultOptions = ['전체', '대기', '정상', '오류', '테스트불가', '개선필요']
export { pageSizeOptions } from './commonOptions'

const CURRENT_USER = '김현대'

const baseRows = [
  {
    id: 'ut1',
    system: 'FO',
    bizCategory: '법인숙박',
    systemPath: 'FO>법인숙박',
    screenPath: '여행레저>복지혜택',
    screenName: '복지혜택 신청',
    taskType: '개발',
    assignee: '김현대',
    difficulty: '중',
    testResult: '정상',
    testExecutedAt: '2026-03-18',
    defectStatus: null,
    defectHandledAt: null,
    lastExecutedAt: '2026-03-18',
    memo: '기본 플로우 정상 확인',
    defects: [],
    steps: [
      { no: 1, procedure: '복지혜택 메뉴 진입', expected: '목록 화면 표시', result: '정상' },
      { no: 2, procedure: '신청 버튼 클릭', expected: '신청 폼 표시', result: '정상' },
      { no: 3, procedure: '필수값 입력 후 저장', expected: '신청 완료 메시지', result: '정상' },
    ],
    attachments: [{ id: 'a1', name: '복지혜택_정상.png', size: '128KB', uploadedAt: '2026-03-18' }],
  },
  {
    id: 'ut2',
    system: 'FO',
    bizCategory: '법인숙박',
    systemPath: 'FO>법인숙박',
    screenPath: '여행레저>복지혜택',
    screenName: '복지혜택 신청',
    taskType: '퍼블리싱',
    assignee: '박퍼블',
    difficulty: '하',
    testResult: '오류',
    testExecutedAt: '2026-03-17',
    defectStatus: '처리예정',
    defectHandledAt: null,
    lastExecutedAt: '2026-03-17',
    memo: '모바일 레이아웃 깨짐',
    defects: [
      {
        id: 'd1',
        title: '모바일 320px 레이아웃 오류',
        grade: 'Minor',
        status: '처리예정',
        registeredAt: '2026-03-17 14:20',
      },
    ],
    steps: [
      { no: 1, procedure: '모바일 뷰포트 320px 설정', expected: '레이아웃 정상', result: '오류' },
      { no: 2, procedure: '스크롤 영역 확인', expected: '가로 스크롤 없음', result: '대기' },
    ],
    attachments: [],
  },
  {
    id: 'ut3',
    system: 'FO',
    bizCategory: '주문클레임',
    systemPath: 'FO>주문클레임',
    screenPath: '주문/결제',
    screenName: '주문결제',
    taskType: '개발',
    assignee: '이개발',
    difficulty: '상',
    testResult: '대기',
    testExecutedAt: null,
    defectStatus: null,
    defectHandledAt: null,
    lastExecutedAt: null,
    memo: '',
    defects: [],
    steps: [
      { no: 1, procedure: '주문 상세 진입', expected: '결제 버튼 표시', result: '대기' },
    ],
    attachments: [],
  },
  {
    id: 'ut4',
    system: 'HIMS',
    bizCategory: '정산',
    systemPath: 'HIMS>정산',
    screenPath: '정산>대사',
    screenName: '정산 대사',
    taskType: '개발',
    assignee: '김현대',
    difficulty: '중',
    testResult: '개선필요',
    testExecutedAt: '2026-03-15',
    defectStatus: '처리완료',
    defectHandledAt: '2026-03-16',
    lastExecutedAt: '2026-03-16',
    memo: 'UX 개선 요청 등록',
    defects: [
      {
        id: 'd2',
        title: '합계 금액 강조 표시 필요',
        grade: 'Minor',
        status: '처리완료',
        registeredAt: '2026-03-15 10:00',
      },
    ],
    steps: [
      { no: 1, procedure: '대사 목록 조회', expected: '합계 금액 표시', result: '개선필요' },
    ],
    attachments: [{ id: 'a2', name: '대사화면.png', size: '96KB', uploadedAt: '2026-03-15' }],
  },
  {
    id: 'ut5',
    system: 'FO',
    bizCategory: '회원/로그인',
    systemPath: 'FO>회원/로그인',
    screenPath: '회원>로그인',
    screenName: 'SSO 로그인',
    taskType: '퍼블리싱',
    assignee: '최퍼블',
    difficulty: '하',
    testResult: '테스트불가',
    testExecutedAt: '2026-03-14',
    defectStatus: null,
    defectHandledAt: null,
    lastExecutedAt: '2026-03-14',
    memo: 'SSO 연동 미완료로 테스트 불가',
    defects: [],
    steps: [
      { no: 1, procedure: 'SSO 로그인 시도', expected: '로그인 성공', result: '테스트불가' },
    ],
    attachments: [],
  },
  {
    id: 'ut6',
    system: 'HPAS',
    bizCategory: '결제',
    systemPath: 'HPAS>결제',
    screenPath: '결제>카드',
    screenName: '카드결제',
    taskType: '개발',
    assignee: '정개발',
    difficulty: '상',
    testResult: '정상',
    testExecutedAt: '2026-03-19',
    defectStatus: null,
    defectHandledAt: null,
    lastExecutedAt: '2026-03-19',
    memo: '',
    defects: [],
    steps: [
      { no: 1, procedure: '카드 결제 실행', expected: '결제 완료', result: '정상' },
    ],
    attachments: [],
  },
]

export function getUnitTestList() {
  return baseRows.map((r) => ({
    ...r,
    defects: r.defects.map((d) => ({ ...d })),
    steps: r.steps.map((s) => ({ ...s })),
    attachments: r.attachments.map((a) => ({ ...a })),
  }))
}

export function matchUnitFilters(row, filters, myTasksOnly, currentUser = CURRENT_USER) {
  if (myTasksOnly && row.assignee !== currentUser) return false
  if (filters.status !== '전체' && row.testResult !== filters.status) return false
  if (filters.system !== '전체' && row.system !== filters.system) return false
  if (filters.bizCategory !== '전체' && row.bizCategory !== filters.bizCategory) return false
  if (filters.keyword) {
    const q = filters.keyword.toLowerCase()
    const hay = `${row.screenName}${row.screenPath}${row.systemPath}${row.assignee}`.toLowerCase()
    if (!hay.includes(q)) return false
  }
  return true
}

export const unitTestResultSegments = ['대기', '정상', '오류', '테스트불가', '개선필요']
