// PAG-S-INF-01 프로젝트 정보 목업
// SB p.55~60, figma: 11_프로젝트정보.html
import { EMPTY_DATA_USER_ID } from './mockUsers'

export { projectStageOptions as stageOptions } from './commonOptions'

export const initiatorOptions = ['고객사', '이지웰', '테크', '그룹사']
export const devTypeOptions = ['신규', '개선']
export const summaryOptions = ['매출향상', 'UI/UX 개선', '업무효율', '서비스도입', '성능개선', '정보보안']

export const assigneeRoles = ['기획', '디자인', '퍼블리싱', '개발', '테스트']

export const workCategoryPresets = [
  'HIMS > 프로모션',
  'FO > 프로모션',
  'FO > 회원/로그인/SSO',
  '공통/API',
  '상품',
]

export const testUsageOptions = ['단위테스트', 'DEV테스트', 'STG테스트', '운영테스트']

/** DEV·운영 각각 차수 선택 (1~5차, 기본 1차) */
export const testRoundOptions = ['1차', '2차', '3차', '4차', '5차']

export const testLibraryScenarios = [
  { id: 'tl1', label: 'DEV테스트 1차 – 20 case', type: 'DEV테스트', round: '1차' },
  { id: 'tl2', label: 'DEV테스트 2차 – 20 case', type: 'DEV테스트', round: '2차' },
  { id: 'tl3', label: 'DEV테스트 3차 – 25 case', type: 'DEV테스트', round: '3차' },
  { id: 'tl4', label: 'STG테스트 1차 – 25 case', type: 'STG테스트', round: '1차' },
  { id: 'tl5', label: '운영테스트 1차 – 30 case', type: '운영테스트', round: '1차' },
  { id: 'tl6', label: '운영테스트 2차 – 30 case', type: '운영테스트', round: '2차' },
]

/** 테스터 변경 — 담당자 검색용 */
export const staffDirectory = [
  { id: 'u1', name: '김현대', dept: '상품기획팀', empId: '2211152' },
  { id: 'u2', name: '이현대', dept: '상품기획팀', empId: '2211153' },
  { id: 'u3', name: '박현대', dept: '상품기획팀', empId: '1824640' },
  { id: 'u4', name: '권현대', dept: '웹기획팀', empId: '2154545' },
  { id: 'u5', name: '유현대', dept: '웹디자인팀', empId: '2154546' },
  { id: 'u6', name: '강현대', dept: '개발팀', empId: '2154547' },
]

/** 이슈 태그 자동완성 */
export const mentionUsers = [
  { name: '권현대', dept: '웹기획팀' },
  { name: '권현민', dept: '플랫폼팀' },
  { name: '이현대', dept: '플랫폼팀' },
  { name: '김현대', dept: '웹기획팀' },
]

const defaultDetail = {
  jira: 'HDEZW-93132',
  itVoc: '533,378',
  name: '프로모션 운영 프로세스 및 기능 개선',
  stage: '처리중',
  workCategories: ['HIMS > 프로모션', 'FO > 프로모션'],
  scheduledOpenDate: '2026-10-31',
  actualOpenDate: '',
  initiator: '이지웰',
  devType: '개선',
  summary: '업무효율',
  requestDept: '상품기획팀',
  requester: '김현대',
  assignees: {
    기획: [
      { id: 'a1', name: '권현대', dept: '웹기획팀', hasWbs: false },
      { id: 'a2', name: '이현대', dept: '웹기획팀', hasWbs: true },
    ],
    디자인: [{ id: 'a3', name: '유현대', dept: '웹디자인팀', hasWbs: false }],
    퍼블리싱: [],
    개발: [
      { id: 'a4', name: '김현대', dept: '개발팀', hasWbs: true },
      { id: 'a5', name: '강현대', dept: '개발팀', hasWbs: false },
      { id: 'a6', name: '이현대', dept: '개발팀', hasWbs: false },
    ],
    테스트: [
      { id: 'a7', name: '김현대', dept: '상품기획팀', hasWbs: false },
      { id: 'a8', name: '권현대', dept: '웹기획팀', hasWbs: false },
      { id: 'a9', name: '이현대', dept: '웹기획팀', hasWbs: false },
    ],
  },
  testUsage: ['단위테스트', 'DEV테스트'],
  testRoundDev: '3차',
  testRoundStg: '1차',
  testRoundUat: '1차',
  testLibrary: '등록',
  testLibraryScenarios: ['tl1', 'tl3', 'tl5'],
  hasRegisteredTestCases: false,
  memo: '차세대 잔여결함 처리 및 HIMS 프로모션 세팅 시 필요한 세부 기능 수정 및 개선과 FO 프로모션 페이지 개선 진행 비고',
  testerChangePending: {
    from: { name: '김현대', dept: '상품기획팀', empId: '2211152' },
    to: { name: '이현대', dept: '상품기획팀', empId: '2211153' },
    applyDate: '2026-06-01',
  },
  issues: [
    {
      id: 'iss1',
      author: '김현대',
      dept: '웹기획팀',
      createdAt: '2026-01-10 11:45',
      updatedAt: null,
      body: '임원, : 직원과 사용횟수 2회 제한 동일 정책 최종 협의\n - 협의자 : 권현대\n -협의내용\n 1. 전체취소/부분취소 : 요청 타입으로 분류\n 2. 취소수수료 강제 생성 규칙\n   - 단건 주문만 가능 (장바구니 주문, 수량 2개 이상은 로직상 강제생성 막힘)',
      replies: [],
    },
    {
      id: 'iss2',
      author: '김현대',
      dept: '웹기획팀',
      createdAt: '2026-01-06 15:30',
      updatedAt: '2026-01-06 15:34',
      body: '@이현대 / 플랫폼팀\n임원, : 직원과 사용횟수 2회 제한 동일 정책 변경 개발\n - 협의자 : 권현대\n -협의내용\n 1. 전체취소/부분취소 : 요청 타입으로 분류\n 2. 취소수수료 강제 생성 규칙',
      replies: [
        {
          id: 'rep1',
          author: '이현대',
          dept: '플랫폼팀',
          createdAt: '2026-01-01 11:45',
          body: '취소수수료 추가 결제 API 신규 개발로 처리 예정\n - 포인트유형 000인 경우, 취소수수료 추가결제',
        },
        {
          id: 'rep2',
          author: '김현대',
          dept: '상품기획팀',
          createdAt: '2026-01-01 11:45',
          body: '확인했습니다.',
        },
      ],
    },
  ],
}

const projectOverrides = {
  p1: {
    name: '주문취소 시 쿠폰 할인취소 정보 노출 개선',
    stage: '테스트',
    jira: 'HDEZW-94120',
    itVoc: '528,901',
    scheduledOpenDate: '2026-04-27',
    initiator: '고객사',
    devType: '개선',
    summary: 'UI/UX 개선',
  },
  p6: {
    name: '전사 프로젝트 관리 시스템 구축',
    stage: '처리중',
    jira: 'HDEZW-95292',
    itVoc: '541,037',
    scheduledOpenDate: '2026-09-30',
    workCategories: ['FO > 회원/로그인/SSO', '공통/API'],
    initiator: '테크',
    devType: '신규',
    summary: '업무효율',
    assignees: {
      기획: [{ id: 'a1', name: '권선희', dept: '테크기획팀', hasWbs: false }],
      디자인: [{ id: 'a3', name: '이디자', dept: '디자인팀', hasWbs: false }],
      퍼블리싱: [{ id: 'a10', name: '박퍼블', dept: '개발팀', hasWbs: false }],
      개발: [
        { id: 'a4', name: '최개발', dept: '플랫폼팀', hasWbs: false },
        { id: 'a11', name: '정개발', dept: '플랫폼팀', hasWbs: false },
      ],
      테스트: [{ id: 'a7', name: '권선희', dept: '테크기획팀', hasWbs: false }],
    },
    memo: '',
    issues: [],
  },
}

function cloneDetail(data) {
  return JSON.parse(JSON.stringify(data))
}

export function getProjectDetail(projectId, projectName, userId) {
  if (userId === EMPTY_DATA_USER_ID) {
    return {
      jira: '',
      itVoc: '',
      name: projectName || '',
      stage: '접수',
      workCategories: [],
      scheduledOpenDate: '',
      actualOpenDate: '',
      initiator: '',
      devType: '',
      summary: '',
      requestDept: '',
      requester: '',
      assignees: Object.fromEntries(assigneeRoles.map((role) => [role, []])),
      testUsage: [],
      testRoundDev: '1차',
      testRoundStg: '1차',
      testRoundUat: '1차',
      testLibrary: '미등록',
      testLibraryScenarios: [],
      hasRegisteredTestCases: false,
      memo: '',
      testerChangePending: null,
      issues: [],
    }
  }
  const base = cloneDetail(defaultDetail)
  const override = projectOverrides[projectId]
  if (override) {
    Object.assign(base, override)
    if (override.assignees) base.assignees = override.assignees
    if (override.issues) base.issues = override.issues
  }
  if (projectName) base.name = projectName
  return base
}

export function searchStaff(keyword) {
  const q = keyword.trim().toLowerCase()
  if (!q) return []
  return staffDirectory.filter(
    (s) =>
      s.name.toLowerCase().includes(q) ||
      s.dept.toLowerCase().includes(q) ||
      s.empId.includes(q),
  )
}

export function searchMentions(keyword) {
  const q = keyword.trim()
  if (q.length < 2) return []
  return mentionUsers.filter((u) => u.name.includes(q))
}
