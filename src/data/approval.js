// PAG-M-SYS-04 신청 승인 관리
import { reactive } from 'vue'

export const approvalMeta = {
  hint: '시스템 관리 · WBS 일정변경·요구사항 변경 요청 승인',
}

export const approvalStatusOptions = ['전체', '승인요청', '승인완료', '승인반려']
export const requestTypeOptions = ['전체', '요구사항', '일정', '일시중단']
export const dateTypeOptions = ['요청일', '승인일']
export { pageSizeOptions } from './commonOptions'

function formatApprovalRange(start, end) {
  if (!start || !end) return '-'
  const [ys, ms, ds] = start.split('-')
  const [, me, de] = end.split('-')
  return `${ys}/${ms}/${ds}~${me}/${de}`
}

/** WBS 일괄 일정변경(POP-S-WBS-04) → 승인요청 추가 */
export function addScheduleChangeRequest({
  projectName,
  projectId,
  openDate,
  tasks,
  planStart,
  planEnd,
  reason,
  requester = '김현대',
}) {
  const nextId = Math.max(0, ...approvalList.map((r) => r.id)) + 1
  const uniqueBefore = [
    ...new Set(
      tasks.map((t) => formatApprovalRange(t.planStart, t.planEnd)).filter((v) => v !== '-'),
    ),
  ]
  const before =
    uniqueBefore.length === 1
      ? uniqueBefore[0]
      : uniqueBefore.length
        ? `개별일정 (${tasks.length}건)`
        : '-'
  const name =
    tasks.length > 1 ? `${projectName || '프로젝트'} 외 ${tasks.length - 1}건` : projectName || '-'

  const requestedAt = new Date().toISOString().slice(0, 16).replace('T', ' ')
  const scheduleRows = tasks.map((t) => ({
    taskType: t.workType || t.taskType || t.name || '-',
    assignee: t.assignee || t.owner || t.assigneeDisplay || '-',
    before: formatApprovalRange(t.planStart, t.planEnd),
    after: formatApprovalRange(
      t.newPlanStart || planStart,
      t.newPlanEnd || planEnd,
    ),
    reason: reason || '-',
    requestedAt,
  }))

  const row = {
    id: nextId,
    status: '승인요청',
    type: '일정',
    projectName: name,
    projectId: projectId || '',
    openDate: openDate || '-',
    before,
    after: formatApprovalRange(planStart, planEnd),
    requester,
    requestDate: new Date().toISOString().slice(0, 10),
    approveDate: '-',
    reason,
    wbsIds: tasks.map((t) => t.wbsId),
    detail: { scheduleRows },
  }
  approvalList.unshift(row)
  return row
}

export const approvalList = reactive([
  {
    id: 30,
    status: '승인요청',
    type: '요구사항',
    projectName: '복지혜택 신청 UX 개선',
    projectId: 'p2',
    openDate: '2026-06-15',
    before: '원안 유지',
    after: '분석 반영',
    requester: '김현대',
    requestDate: '2026-05-21',
    approveDate: '-',
    reason: '고객사 피드백 반영으로 요구사항 원안 변경',
    detail: {
      requirement: {
        changeItem: '요구사항 원안',
        reqId: 'REQ-012',
        reason: '고객사 피드백 반영으로 요구사항 원안 변경',
        beforeContent:
          '복지혜택 신청 화면에서 숙박바우처 선택 시 기존 신청정보를 유지한다.',
        afterContent:
          '복지혜택 신청 화면에서 숙박바우처 변경 시 신청정보를 초기화하고 재입력을 안내한다.',
      },
    },
  },
  {
    id: 29,
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
    detail: {
      scheduleRows: [
        {
          taskType: '디자인',
          assignee: '최디자인',
          before: '2026/05/01~05/31',
          after: '2026/05/15~06/15',
          reason: '디자인 일정 지연 반영',
          requestedAt: '2026-05-20 14:22',
        },
      ],
    },
  },
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
    detail: {
      suspendReason: '고객사 일정 조율로 일시 중단 요청',
      suspendPeriod: '2026/06/01~06/30',
      requestedAt: '2026-05-18 11:30',
    },
  },
  {
    id: 27,
    status: '승인요청',
    type: '일정',
    projectName: '전사 프로젝트 관리 시스템 구축 외 2건',
    projectId: 'p6',
    openDate: '2026-05-20',
    before: '개별일정 (3건)',
    after: '2026/06/01~06/30',
    requester: '박현대',
    requestDate: '2026-05-10',
    approveDate: '-',
    reason: 'WBS 일정 일괄 조정',
    detail: {
      scheduleRows: [
        {
          taskType: '개발',
          assignee: '김개발',
          before: '2026/05/01~05/20',
          after: '2026/06/01~06/30',
          reason: 'WBS 일정 일괄 조정',
          requestedAt: '2026-05-10 09:10',
        },
        {
          taskType: '테스트',
          assignee: '이테스터',
          before: '2026/05/21~05/31',
          after: '2026/06/01~06/30',
          reason: 'WBS 일정 일괄 조정',
          requestedAt: '2026-05-10 09:10',
        },
        {
          taskType: '배포',
          assignee: '박현대',
          before: '2026/06/01~06/05',
          after: '2026/06/01~06/30',
          reason: 'WBS 일정 일괄 조정',
          requestedAt: '2026-05-10 09:10',
        },
      ],
    },
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
    detail: {
      scheduleRows: [
        {
          taskType: '개발',
          assignee: '김개발',
          before: '2026/06/01~06/30',
          after: '2026/06/01~06/30',
          reason: '개발 일정 연장',
          requestedAt: '2026-05-05 11:00',
        },
      ],
    },
  },
  {
    id: 25,
    status: '승인완료',
    type: '요구사항',
    projectName: '전사 프로젝트 관리 시스템 구축',
    projectId: 'p6',
    openDate: '2026-05-20',
    before: '미확정',
    after: '확정',
    requester: '박현대',
    requestDate: '2026-04-18',
    approveDate: '2026-04-18',
    reason: '요구사항 확정 변경',
    detail: {
      requirement: {
        changeItem: '요건확정 상태',
        reqId: 'REQ-003',
        reason: '요구사항 확정 변경',
        beforeContent: '분석 진행 중 — 요건미확정',
        afterContent: '분석 완료 — 요건확정',
      },
    },
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
    detail: {
      scheduleRows: [
        {
          taskType: '개발',
          assignee: '이현대',
          before: '2026/06/01~06/30',
          after: '2026/06/01~06/30',
          reason: '일정 근거 부족으로 반려',
          requestedAt: '2026-04-15 16:40',
        },
      ],
    },
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
    requestDate: '2026-05-19',
    approveDate: '-',
    reason: '추가 일정 단건 요청',
    detail: {
      scheduleRows: [
        {
          taskType: '기획',
          assignee: '권선희',
          before: '2026/05/01~05/31',
          after: '2026/05/15~06/15',
          reason: '추가 일정 단건 요청',
          requestedAt: '2026-05-19 10:05',
        },
      ],
    },
  },
])

export function matchApprovalFilters(row, filters) {
  if (filters.status !== '전체' && row.status !== filters.status) return false
  if (filters.type !== '전체' && row.type !== filters.type) return false
  if (filters.project && !row.projectName.includes(filters.project)) return false
  if (filters.requester && !row.requester.includes(filters.requester)) return false

  const dateFrom = filters.dateFrom
  const dateTo = filters.dateTo
  if (dateFrom || dateTo) {
    const field = filters.dateType === '승인일' ? row.approveDate : row.requestDate
    if (!field || field === '-') return false
    if (dateFrom && field < dateFrom) return false
    if (dateTo && field > dateTo) return false
  }
  return true
}

export function approvalStatusClass(status) {
  if (status === '승인요청') return 'wait'
  if (status === '승인완료') return 'ok'
  if (status === '승인반려') return 'err'
  return 'muted'
}
