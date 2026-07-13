// PAG-M-SYS-04 신청 승인 관리

export const approvalMeta = {
  hint: '시스템 관리 · WBS 일정변경 요청 승인',
}

export const approvalStatusOptions = ['전체', '승인요청', '승인완료', '승인반려']
export const requestTypeOptions = ['전체', '일정', '일시중단']
export const dateTypeOptions = ['요청일', '승인일']
export const pageSizeOptions = [20, 50, 100]

export const approvalList = [
  {
    id: 28,
    status: '승인요청',
    type: '일시중단',
    projectName: '주문취소 시 쿠폰 할인취소 정보 표기',
    projectId: 'p1',
    openDate: '2026-05-20',
    before: '-',
    after: '2026/06/01~06/30',
    requester: '이현대',
    requestDate: '2026-05-18',
    approveDate: '-',
    reason: '고객사 일정 조율로 일시 중단 요청',
  },
  {
    id: 27,
    status: '승인요청',
    type: '일정',
    projectName: '전사 프로젝트 관리 시스템 구축 외 N건',
    projectId: 'p6',
    openDate: '2026-05-20',
    before: '2026/06/01~06/30',
    after: '2026/06/01~06/30',
    requester: '박현대',
    requestDate: '2026-05-10',
    approveDate: '-',
    reason: 'WBS 일정 일괄 조정',
  },
  {
    id: 26,
    status: '승인완료',
    type: '일정',
    projectName: '전사 프로젝트 관리 시스템 구축',
    projectId: 'p6',
    openDate: '2026-05-20',
    before: '2026/06/01~06/30',
    after: '2026/06/01~06/30',
    requester: '박현대',
    requestDate: '2026-05-05',
    approveDate: '2026-05-05',
    reason: '개발 일정 연장',
  },
  {
    id: 25,
    status: '승인완료',
    type: '일정',
    projectName: '전사 프로젝트 관리 시스템 구축',
    projectId: 'p6',
    openDate: '2026-05-20',
    before: '2026/06/01~06/30',
    after: '2026/06/01~06/30',
    requester: '박현대',
    requestDate: '2026-04-18',
    approveDate: '2026-04-18',
    reason: '테스트 일정 조정',
  },
  {
    id: 24,
    status: '승인반려',
    type: '일정',
    projectName: '주문취소 시 쿠폰 할인취소 정보 표기',
    projectId: 'p1',
    openDate: '2026-05-20',
    before: '2026/06/01~06/30',
    after: '2026/06/01~06/30',
    requester: '이현대',
    requestDate: '2026-04-15',
    approveDate: '2026-04-16',
    reason: '일정 근거 부족으로 반려',
  },
  {
    id: 23,
    status: '승인요청',
    type: '일정',
    projectName: '복지혜택 신청 UX 개선',
    projectId: 'p2',
    openDate: '2026-06-15',
    before: '2026/05/01~05/31',
    after: '2026/05/15~06/15',
    requester: '김현대',
    requestDate: '2026-05-20',
    approveDate: '-',
    reason: '디자인 일정 지연 반영',
  },
]

export function matchApprovalFilters(row, filters) {
  if (filters.status !== '전체' && row.status !== filters.status) return false
  if (filters.type !== '전체' && row.type !== filters.type) return false
  if (filters.project && !row.projectName.includes(filters.project)) return false
  if (filters.requester && !row.requester.includes(filters.requester)) return false
  return true
}

export function approvalStatusClass(status) {
  if (status === '승인요청') return 'wait'
  if (status === '승인완료') return 'ok'
  if (status === '승인반려') return 'err'
  return 'muted'
}
