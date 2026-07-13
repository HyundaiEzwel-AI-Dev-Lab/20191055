// PAG-S-REQ-01 요구사항 관리 목업
// SB p.68~71, figma: 12_요구사항관리.html

export const requirementMeta = {
  hint: '요구사항 ID = 1 시스템 + 1 업무유형',
  notice:
    '동일 요구사항을 여러 시스템·업무유형에 등록 시, 선택 수만큼 개별 요구사항 ID 생성 · 확정 시 WBS에 업무 자동 생성 (일정·진행은 WBS에서 관리)',
}

export const taskTypeOptions = ['전체', '기획', '디자인', '퍼블리싱', '개발', '테스트']
export const statusOptions = ['전체', '접수', '수용', '반려']
export const priorityOptions = ['전체', '낮음', '보통', '높음']
export const confirmOptions = ['전체', '미확정', '확정']
export const periodOptions = ['등록일', '수정일']
export { pageSizeOptions } from './commonOptions'

export const systemOptions = ['HIMS', 'HPAS', 'HCAS', 'HIMS(정산)', 'FO']
export const bizCategoryMap = {
  FO: ['상품', '주문클레임', '회원/로그인/SSO', '고객사/제도', '법인숙박'],
  HIMS: ['프로모션', '정산', '상품'],
  HPAS: ['결제', '정산'],
  HCAS: ['법인숙박', '복지혜택'],
  'HIMS(정산)': ['정산', '대사'],
}

export const requirementTypes = ['최초 요건', '추가 요구사항']
export const registerTaskTypes = ['기획', '디자인', '퍼블리싱', '개발', '테스트']

const baseRequirements = [
  {
    id: 'req1',
    reqId: 'REQ-001',
    systemPath: 'FO>법인숙박',
    screenPath: '여행레저>복지혜택',
    screenName: '복지혜택 신청',
    reqType: '최초',
    name: '고객사 맞춤페이지 신설',
    taskTypes: ['디자인', '퍼블리싱', '개발'],
    status: '수용',
    priority: '높음',
    confirmRequester: '미확정',
    confirmTech: '미확정',
    issueCount: 3,
    registeredBy: '권현대',
    registeredAt: '2026-01-05 13:12:50',
    updatedBy: null,
    updatedAt: null,
    requester: '김현대',
    original:
      '1.법숙 입실/패널티 없을 경우 : 법인숙박 박수 회수 & 바우처 특복 배정 (FO단에 배정 api 개발 필요)\n ※ 바우처 특복 코드 생성 필요 (복지디자인팀)\n2. 법숙 입실/패널티 있을 경우 (기존 동일) : 변경 불가 (※ 자연휴양림, 수련원 : (1년정지) 패널티 부과 포함',
    analysis: '',
    system: 'FO',
    bizCategory: '법인숙박',
    screenMenu: '복지혜택 신청',
    memo: '',
    issues: [
      { id: 'i1', author: '김현대', dept: '웹기획팀', createdAt: '2026-01-10 11:45', body: '임원, : 직원과 사용횟수 2회 제한 동일 정책 최종 협의' },
      { id: 'i2', author: '권현대', dept: '웹기획팀', createdAt: '2026-01-08 09:30', body: '바우처 특복 코드 생성 일정 확인 필요' },
      { id: 'i3', author: '이현대', dept: '플랫폼팀', createdAt: '2026-01-07 14:20', body: 'FO 배정 API 스펙 검토 완료' },
    ],
  },
  {
    id: 'req2',
    reqId: 'REQ-002',
    systemPath: 'FO>법인숙박',
    screenPath: '여행레저>복지혜택',
    screenName: '복지혜택 신청',
    reqType: '최초',
    name: '바우처 특복 배정',
    taskTypes: ['개발'],
    status: '수용',
    priority: '높음',
    confirmRequester: '확정',
    confirmTech: '확정',
    issueCount: 5,
    registeredBy: '권현대',
    registeredAt: '2026-01-06 13:12:50',
    updatedBy: '권현대',
    updatedAt: '2026-01-07 13:25:09',
    requester: '김현대',
    original: '바우처 특복 선택 시, 바우처 특별포인트 배정',
    analysis: '바우처 특복 선택 시, 바우처 특별포인트 배정 상세 로직 정의',
    system: 'FO',
    bizCategory: '법인숙박',
    screenMenu: '복지혜택 신청',
    memo: '',
    issues: [],
  },
  {
    id: 'req3',
    reqId: 'REQ-003',
    systemPath: 'FO>주문클레임',
    screenPath: '주문/결제',
    screenName: '주문결제',
    reqType: '최초',
    name: '바우처 특복 사용 제한',
    taskTypes: ['개발'],
    status: '반려',
    priority: '보통',
    confirmRequester: '확인',
    confirmTech: '확인',
    issueCount: 0,
    registeredBy: '권현대',
    registeredAt: '2026-01-06 13:12:50',
    updatedBy: null,
    updatedAt: null,
    requester: '김현대',
    original: '바우처 특복 사용 시 제한 조건 적용',
    analysis: '',
    system: 'FO',
    bizCategory: '주문클레임',
    screenMenu: '주문결제',
    memo: 'Spec Out 검토',
    issues: [],
  },
  {
    id: 'req4',
    reqId: 'REQ-004',
    systemPath: 'BO>주문클레임',
    screenPath: '클레임관리 > 취소수수료 강제생성',
    screenName: '취소수수료 강제생성',
    reqType: '최초',
    name: '취소수수료 결제',
    taskTypes: ['개발'],
    status: '수용',
    priority: '높음',
    confirmRequester: '확정',
    confirmTech: '미확정',
    issueCount: 2,
    registeredBy: '권현대',
    registeredAt: '2026-01-20 13:12:50',
    updatedBy: null,
    updatedAt: null,
    requester: '김현대',
    original: '취소수수료 추가 결제 API 신규 개발',
    analysis: '포인트유형 000인 경우, 취소수수료 추가결제 처리',
    system: 'FO',
    bizCategory: '주문클레임',
    screenMenu: '취소수수료 강제생성',
    memo: '',
    issues: [
      { id: 'i4', author: '이현대', dept: '플랫폼팀', createdAt: '2026-01-21 11:00', body: 'API 스펙 초안 공유' },
    ],
  },
  {
    id: 'req5',
    reqId: 'REQ-005',
    systemPath: 'FO>이지체크인',
    screenPath: '마이체크인 > 예약관리',
    screenName: '주문내역조회',
    reqType: '추가',
    name: '주문취소 API 개발',
    taskTypes: ['개발'],
    status: '접수',
    priority: '낮음',
    confirmRequester: '미확정',
    confirmTech: '미확정',
    issueCount: 0,
    registeredBy: '권현대',
    registeredAt: '2026-01-22 10:00:00',
    updatedBy: null,
    updatedAt: null,
    requester: '박현대',
    original: '주문내역에서 주문취소 API 연동',
    analysis: '',
    system: 'FO',
    bizCategory: '회원/로그인/SSO',
    screenMenu: '주문내역조회',
    memo: '',
    issues: [],
  },
  {
    id: 'req6',
    reqId: 'REQ-006',
    systemPath: 'HIMS>프로모션',
    screenPath: '프로모션관리',
    screenName: '프로모션 등록',
    reqType: '최초',
    name: '프로모션 코너기간 설정',
    taskTypes: ['기획', '개발'],
    status: '수용',
    priority: '보통',
    confirmRequester: '확정',
    confirmTech: '확정',
    issueCount: 1,
    registeredBy: '김현대',
    registeredAt: '2026-02-01 09:30:00',
    updatedBy: '이현대',
    updatedAt: '2026-02-03 15:10:00',
    requester: '김현대',
    original: '코너기간 설정 시 프로모션 기간 내 설정 가능',
    analysis: '코너기간 설정 시 프로모션 기간 이외 기간으로 설정 가능',
    system: 'HIMS',
    bizCategory: '프로모션',
    screenMenu: '프로모션 등록',
    memo: '',
    issues: [],
  },
]

function cloneList(list) {
  return JSON.parse(JSON.stringify(list))
}

export function getRequirementList() {
  return cloneList(baseRequirements)
}

export function statusClass(status) {
  if (status === '수용') return 'done'
  if (status === '반려') return 'rej'
  return 'recv'
}

export function priorityClass(priority) {
  if (priority === '높음') return 'h'
  if (priority === '보통') return 'm'
  return 'l'
}

export function confirmClass(value) {
  if (value === '확정') return 'confirmed'
  if (value === '확인') return 'checked'
  return 'pending'
}

export function matchFilters(row, filters) {
  if (filters.keyword) {
    const q = filters.keyword.toLowerCase()
    const hay = [row.reqId, row.name, row.original, row.analysis].join(' ').toLowerCase()
    if (!hay.includes(q)) return false
  }
  if (filters.taskType !== '전체' && !row.taskTypes.includes(filters.taskType)) return false
  if (filters.system && row.system !== filters.system) return false
  if (filters.bizCategory && row.bizCategory !== filters.bizCategory) return false
  if (filters.status !== '전체' && row.status !== filters.status) return false
  if (filters.priority !== '전체' && row.priority !== filters.priority) return false
  if (filters.confirm !== '전체') {
    const isConfirmed = row.confirmRequester === '확정' && row.confirmTech === '확정'
    if (filters.confirm === '확정' && !isConfirmed) return false
    if (filters.confirm === '미확정' && isConfirmed) return false
  }
  return true
}
