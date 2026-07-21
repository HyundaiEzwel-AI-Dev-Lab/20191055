// PAG-S-WBS-01/08 WBS 관리 목업
// SB p.93~99, figma: 13_WBS관리.html

export const wbsMeta = {
  hint: '요구사항 확정 시 자동 생성된 작업단위 · 담당자/일정/공정률',
  totalProgress: 60.0,
  progressBaseDate: '2026-04-30',
}

export const taskTypeOptions = ['전체', '기획', '디자인', '퍼블리싱', '개발', '테스트']
export const progressStatusOptions = ['전체', '대기', '진행중', '완료', '홀딩', '취소']
export const scheduleComplianceOptions = ['전체', '정상', '경과', '단축']
export const difficultyOptions = ['상', '중', '하']
export const priorityOptions = ['낮음', '보통', '높음']

/** POP-S-WBS-04 단건 계획일 변경 사유 */
export const planChangeReasons = [
  '장애 대응',
  '우선순위 변경',
  '외부 일정',
  '요건 변경',
  '담당자 변경',
  '선행 업무 일정 변경',
  '기타(직접입력)',
]

/** POP-S-WBS-05 다건 계획일 변경 사유 */
export const bulkPlanChangeReasons = ['선행 업무 일정 변경', '기타(직접입력)']

/** POP-S-WBS-06 실행 홀딩 사유 */
export const holdChangeReasons = [
  '장애 대응',
  '우선순위 변경',
  '외부 일정',
  '요건 변경',
  '담당자 변경',
  '선행 업무 일정 변경',
  '기타(직접입력)',
]

export const approverOptions = ['담당 개발팀장', '웹기획팀장']

/** 목업 기준일 (계획일 도래 판정) */
export const wbsMockToday = '2026-04-30'

export { systemOptions, bizCategoryMap } from './requirement'

export const assigneeOptions = {
  기획: ['권현대', '이현대'],
  디자인: ['유현대'],
  퍼블리싱: ['김현대'],
  개발: ['박현대', '강현대', '이현대'],
  테스트: ['권현대', '김현대', '박현대'],
}

const baseTasks = [
  {
    id: 'w1',
    wbsId: 'WBS-001',
    systemPath: '기획',
    screenPath: '-',
    screenName: '-',
    requirementName: '요건분석',
    requirementId: null,
    requirementPreview: null,
    taskType: '기획',
    assignee: '권현대',
    assigneeDisplay: '권현대',
    difficulty: '중',
    planStart: '2026-04-01',
    planEnd: '2026-04-05',
    execStart: '2026-04-01',
    execEnd: '2026-04-05',
    planProgress: 100,
    execProgress: 100,
    status: '완료',
    scheduleStatus: 'normal',
    confirmed: '-',
    excluded: false,
    changedAt: '2026-04-30 10:10:20',
    changedBy: '권현대',
    scheduleReason: null,
  },
  {
    id: 'w2',
    wbsId: 'WBS-002',
    systemPath: '기획',
    screenPath: '-',
    screenName: '-',
    requirementName: '화면설계',
    requirementId: null,
    requirementPreview: null,
    taskType: '기획',
    assignee: '권현대',
    assigneeDisplay: '권현대',
    difficulty: '중',
    planStart: '2026-04-06',
    planEnd: '2026-04-10',
    execStart: '2026-04-06',
    execEnd: null,
    planProgress: 100,
    execProgress: 80,
    status: '진행중',
    scheduleStatus: 'delay',
    confirmed: '-',
    excluded: false,
    changedAt: '2026-04-30 10:10:20',
    changedBy: '권현대',
    scheduleReason: null,
  },
  {
    id: 'w3',
    wbsId: 'WBS-003',
    systemPath: '기획',
    screenPath: '-',
    screenName: '-',
    requirementName: '화면설계',
    requirementId: null,
    requirementPreview: null,
    taskType: '기획',
    assignee: '이현대',
    assigneeDisplay: '이현대',
    difficulty: '중',
    planStart: '2026-04-06',
    planEnd: '2026-04-10',
    execStart: '2026-04-06',
    execEnd: '2026-04-10',
    planProgress: 100,
    execProgress: 100,
    status: '완료',
    scheduleStatus: 'delay',
    confirmed: '확정',
    excluded: false,
    changedAt: '2026-04-11 16:20:08',
    changedBy: '김현대',
    changedByEmpId: '2155555',
    scheduleReason: '담당부서 요청으로 오픈일 변경',
  },
  {
    id: 'w4',
    wbsId: 'WBS-004',
    systemPath: 'FO>법인숙박',
    screenPath: '여행레저>복지혜택',
    screenName: '숙박바우처',
    requirementName: '고객사 맞춤페이지 신설',
    requirementId: 'REQ-001',
    requirementPreview:
      '1.법숙 입실/패널티 없을 경우 : 법인숙박 박수 회수 & 바우처 특복 배정\n2. 법숙 입실/패널티 있을 경우 : 변경 불가',
    requirementAnalysisPreview:
      '1. 법숙 입실/패널티 없을 경우 - 법인숙박 박수 회수 & 바우처 특복 배정\n2. 법숙 입실/패널티 있을 경우 - 변경 불가',
    taskType: '퍼블리싱',
    assignee: '김현대',
    assigneeDisplay: '김현대',
    difficulty: '상',
    planStart: '2026-04-10',
    planEnd: '2026-04-15',
    execStart: '2026-04-10',
    execEnd: null,
    planProgress: 80,
    execProgress: 90,
    status: '진행중',
    scheduleStatus: 'short',
    confirmed: '-',
    excluded: false,
    changedAt: '2026-04-30 10:10:20',
    changedBy: '김현대',
    scheduleReason: null,
  },
  {
    id: 'w5',
    wbsId: 'WBS-005',
    systemPath: 'FO>법인숙박',
    screenPath: '여행레저>복지혜택',
    screenName: '숙박바우처',
    requirementName: '바우처 특복 배정',
    requirementId: 'REQ-002',
    requirementPreview: '바우처 특복 선택 시, 바우처 특별포인트 배정',
    requirementAnalysisPreview: '바우처 특복 선택 시, 바우처 특별포인트 배정 상세 로직 정의',
    taskType: '개발',
    assignee: '박현대',
    assigneeDisplay: '박현대',
    difficulty: '상',
    planStart: '2026-04-10',
    planEnd: '2026-04-20',
    execStart: '2026-04-10',
    execEnd: '2026-04-18',
    planProgress: 100,
    execProgress: 100,
    status: '완료',
    scheduleStatus: 'short',
    confirmed: '확정',
    excluded: false,
    changedAt: '2026-04-30 10:10:20',
    changedBy: '박현대',
    scheduleReason: null,
  },
  {
    id: 'w6',
    wbsId: 'WBS-006',
    systemPath: 'FO>주문클레임',
    screenPath: '주문/결제',
    screenName: '주문결제페이지',
    requirementName: '바우처 특복 사용 제한',
    requirementId: 'REQ-003',
    requirementPreview: '바우처 특복 사용 시 제한 조건 적용',
    requirementAnalysisPreview: '',
    taskType: '개발',
    assignee: '박현대',
    assigneeDisplay: '박현대',
    difficulty: '상',
    planStart: '2026-04-10',
    planEnd: '2026-04-30',
    execStart: '2026-04-10',
    execEnd: null,
    planProgress: 30,
    execProgress: 30,
    status: '진행중',
    scheduleStatus: 'normal',
    confirmed: '-',
    excluded: false,
    changedAt: '2026-04-30 10:10:20',
    changedBy: '박현대',
    scheduleReason: null,
  },
  {
    id: 'w7',
    wbsId: 'WBS-007',
    systemPath: 'FO>주문클레임',
    screenPath: '주문/결제',
    screenName: '주문결제페이지',
    requirementName: '바우처 특복 사용 제한',
    requirementId: 'REQ-003',
    requirementPreview: '바우처 특복 사용 시 제한 조건 적용',
    requirementAnalysisPreview: '',
    taskType: '개발',
    assignee: '박현대',
    assigneeDisplay: '박현대',
    difficulty: '중',
    planStart: '2026-04-20',
    planEnd: '2026-05-30',
    execStart: null,
    execEnd: null,
    planProgress: 0,
    execProgress: 0,
    status: '대기',
    scheduleStatus: null,
    confirmed: '-',
    excluded: false,
    changedAt: null,
    changedBy: null,
    scheduleReason: null,
  },
  {
    id: 'w8',
    wbsId: 'WBS-008',
    systemPath: 'FO>법인숙박',
    screenPath: '여행레저>복지혜택',
    screenName: '숙박바우처',
    requirementName: '바우처 특복 배정',
    requirementId: 'REQ-002',
    requirementPreview: '바우처 특복 선택 시, 바우처 특별포인트 배정',
    requirementAnalysisPreview: '바우처 특복 선택 시, 바우처 특별포인트 배정 상세 로직 정의',
    taskType: '개발',
    assignee: '박현대',
    assigneeDisplay: '박현대',
    difficulty: '상',
    planStart: '2026-04-10',
    planEnd: '2026-04-20',
    execStart: '2026-04-10',
    execEnd: null,
    planProgress: 50,
    execProgress: 50,
    status: '취소',
    scheduleStatus: null,
    confirmed: '-',
    excluded: true,
    changedAt: '2026-04-30 10:10:20',
    changedBy: '권현대',
    scheduleReason: null,
  },
  {
    id: 'w9',
    wbsId: 'WBS-009',
    systemPath: '테스트',
    screenPath: '-',
    screenName: '-',
    requirementName: '단위테스트',
    requirementId: null,
    requirementPreview: null,
    taskType: '테스트',
    assignee: '박현대',
    assigneeDisplay: '박현대 외 N명',
    difficulty: '중',
    planStart: null,
    planEnd: null,
    execStart: null,
    execEnd: null,
    planProgress: 0,
    execProgress: 0,
    status: '대기',
    scheduleStatus: null,
    confirmed: '-',
    excluded: false,
    changedAt: null,
    changedBy: null,
    scheduleReason: null,
  },
  {
    id: 'w10',
    wbsId: 'WBS-010',
    systemPath: '테스트',
    screenPath: '-',
    screenName: '-',
    requirementName: 'DEV테스트',
    requirementId: null,
    requirementPreview: null,
    taskType: '테스트',
    assignee: '권현대',
    assigneeDisplay: '권현대 외 N명',
    difficulty: '중',
    planStart: null,
    planEnd: null,
    execStart: null,
    execEnd: null,
    planProgress: 0,
    execProgress: 0,
    status: '대기',
    scheduleStatus: null,
    confirmed: '-',
    excluded: false,
    changedAt: null,
    changedBy: null,
    scheduleReason: null,
  },
  {
    id: 'w11',
    wbsId: 'WBS-011',
    systemPath: '테스트',
    screenPath: '-',
    screenName: '-',
    requirementName: '운영테스트-1차',
    requirementId: null,
    requirementPreview: null,
    taskType: '테스트',
    assignee: '권현대',
    assigneeDisplay: '권현대 외 N명',
    difficulty: '중',
    planStart: null,
    planEnd: null,
    execStart: null,
    execEnd: null,
    planProgress: 0,
    execProgress: 0,
    status: '대기',
    scheduleStatus: null,
    confirmed: '-',
    excluded: false,
    changedAt: null,
    changedBy: null,
    scheduleReason: null,
  },
  {
    id: 'w12',
    wbsId: 'WBS-012',
    systemPath: '테스트',
    screenPath: '-',
    screenName: '-',
    requirementName: '운영테스트-2차',
    requirementId: null,
    requirementPreview: null,
    taskType: '테스트',
    assignee: '권현대',
    assigneeDisplay: '권현대 외 N명',
    difficulty: '중',
    planStart: null,
    planEnd: null,
    execStart: null,
    execEnd: null,
    planProgress: 0,
    execProgress: 0,
    status: '대기',
    scheduleStatus: null,
    confirmed: '-',
    excluded: false,
    changedAt: null,
    changedBy: null,
    scheduleReason: null,
  },
]

const taskTypeColors = {
  기획: 'var(--teal)',
  디자인: 'var(--blue)',
  퍼블리싱: 'var(--orange)',
  개발: 'var(--green)',
  테스트: 'var(--gray)',
}

export function getWbsTasks() {
  return JSON.parse(JSON.stringify(baseTasks))
}

export function getTaskTypeColor(taskType) {
  return taskTypeColors[taskType] || 'var(--teal)'
}

export function formatDateRange(start, end) {
  if (!start && !end) return '미등록'
  const fmt = (d) => (d ? d.slice(5).replace('-', '-') : '-')
  if (!start) return fmt(end)
  if (!end) return fmt(start)
  return `${fmt(start)}~${fmt(end)}`
}

export function formatShortRange(start, end) {
  if (!start && !end) return '미등록'
  const fmt = (d) => (d ? d.slice(5).replace('-', '/') : '-')
  if (!start || !end) return fmt(start || end)
  return `${fmt(start)}~${fmt(end)}`
}

export function statusLabel(row) {
  if (row.status === '취소') return '취소'
  if (!row.scheduleStatus) return row.status
  const map = { normal: '정상', delay: '경과', short: '단축' }
  return `${row.status}(${map[row.scheduleStatus]})`
}

export function statusClass(row) {
  if (row.excluded || row.status === '취소') return 'cancel'
  if (row.status === '홀딩') return 'hold'
  if (row.status === '완료') return 'done'
  if (row.status === '진행중') {
    if (row.scheduleStatus === 'delay') return 'delay'
    return 'prog'
  }
  return 'recv'
}

export function matchWbsFilters(row, filters, myTasksOnly, currentUser = '권현대') {
  if (myTasksOnly && row.assignee !== currentUser && !row.assigneeDisplay.includes(currentUser)) {
    return false
  }
  if (!filters.showExcluded && row.excluded) return false
  if (filters.keyword) {
    const q = filters.keyword.toLowerCase()
    const hay = [row.screenName, row.requirementName, row.wbsId, row.systemPath].join(' ').toLowerCase()
    if (!hay.includes(q)) return false
  }
  if (filters.taskType !== '전체' && row.taskType !== filters.taskType) return false
  if (filters.system && !row.systemPath.startsWith(filters.system)) return false
  if (filters.bizCategory) {
    const [, cat] = row.systemPath.split('>')
    if (cat !== filters.bizCategory) return false
  }
  if (Array.isArray(filters.progressStatus)) {
    const selected = filters.progressStatus
    if (selected.length && !selected.includes('전체') && !selected.includes(row.status)) {
      return false
    }
  } else if (filters.progressStatus && filters.progressStatus !== '전체') {
    if (row.status !== filters.progressStatus) return false
  }
  if (filters.scheduleCompliance !== '전체') {
    const map = { 정상: 'normal', 경과: 'delay', 단축: 'short' }
    if (row.scheduleStatus !== map[filters.scheduleCompliance]) return false
  }
  return true
}

/** 캘린더용 — 해당 월에 걸치는 업무 */
export function getCalendarTasks(tasks, year, month) {
  const monthStart = new Date(year, month - 1, 1)
  const monthEnd = new Date(year, month, 0)
  return tasks.filter((t) => {
    const start = t.execStart || t.planStart
    const end = t.execEnd || t.planEnd || t.planStart
    if (!start) return false
    const s = new Date(start)
    const e = end ? new Date(end) : s
    return s <= monthEnd && e >= monthStart
  })
}

export function getCalendarRange(task) {
  if (task.status === '완료' && task.execStart && task.execEnd) {
    return { start: task.execStart, end: task.execEnd }
  }
  if (task.status === '진행중' && task.execStart) {
    return { start: task.execStart, end: task.planEnd }
  }
  if (task.planStart) {
    return { start: task.planStart, end: task.planEnd }
  }
  return null
}

export function calendarBlockLabel(task, index) {
  const suffix = index > 0 ? index + 1 : ''
  const type = task.taskType === '개발' ? `개발${suffix}` : task.taskType
  const name = task.requirementName || task.screenName
  return `[${type}] ${name} – ${task.assigneeDisplay}`
}

/** 계획종료일 기준 D-day (기준일: wbsMockToday) */
export function calcDday(ymd) {
  const target = parseYmd(ymd)
  const base = parseYmd(wbsMockToday)
  if (!target || !base) return ''
  const diff = Math.round((target - base) / (1000 * 60 * 60 * 24))
  if (diff === 0) return 'D-DAY'
  return diff > 0 ? `D-${diff}` : `D+${Math.abs(diff)}`
}

function parseYmd(ymd) {
  if (!ymd) return null
  const [y, m, d] = ymd.split('-').map(Number)
  return new Date(y, m - 1, d)
}

function formatYmd(date) {
  const p = (n) => String(n).padStart(2, '0')
  return `${date.getFullYear()}-${p(date.getMonth() + 1)}-${p(date.getDate())}`
}

/** 영업일 기준 n일 가산 (주말 제외) */
export function addBusinessDays(ymd, days) {
  const date = parseYmd(ymd)
  if (!date || days <= 0) return ymd
  let left = days
  while (left > 0) {
    date.setDate(date.getDate() + 1)
    const dow = date.getDay()
    if (dow !== 0 && dow !== 6) left -= 1
  }
  return formatYmd(date)
}

/** 계획 공수(영업일) — 시작·종료 포함 */
export function countBusinessDays(start, end) {
  const s = parseYmd(start)
  const e = parseYmd(end)
  if (!s || !e || e < s) return 0
  let n = 0
  const cur = new Date(s)
  while (cur <= e) {
    const dow = cur.getDay()
    if (dow !== 0 && dow !== 6) n += 1
    cur.setDate(cur.getDate() + 1)
  }
  return n
}

/** 홀딩 후 재착수 예정일 산정 (SB 124) */
export function calcRestartRange(task, holdStart, holdEnd) {
  if (!holdEnd || !task?.planStart || !task?.planEnd) {
    return { start: '', end: '' }
  }
  const planMd = countBusinessDays(task.planStart, task.planEnd)
  const execMd =
    task.execStart && holdStart
      ? Math.max(0, countBusinessDays(task.execStart, holdStart) - 1)
      : task.execStart
        ? 1
        : 0
  const remain = Math.max(1, planMd - execMd)
  const restartStart = addBusinessDays(holdEnd, 1)
  const restartEnd = addBusinessDays(restartStart, remain - 1)
  return { start: restartStart, end: restartEnd }
}
