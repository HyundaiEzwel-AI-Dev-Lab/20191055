// PAG-M-DAS-01 메인 대시보드 / 전체 프로젝트 현황 목업
// figma: 06_전체프로젝트현황_대시보드.html

export const UNSPECIFIED_LABEL = '미지정'
const UNSPECIFIED_COLOR = 'var(--lnb-line)'

/** 오픈예정일 미정 행의 표시값. 오픈기간 필터·당해년도 집계에서 제외한다. */
export const NO_OPEN_DATE = '-'

export const dashboardMeta = {
  yearScope: '목록은 오픈예정일 2026년 이후(미정 포함), 현황분석은 2026년 오픈 프로젝트 기준입니다.',
  queryTime: '2026-06-23 09:00',
}

/** 차트 축(라벨·색·정렬). 건수는 buildDashboardStats가 조회 결과로 채운다. */
export const dashboardAxes = {
  initiators: [
    { label: '고객사', count: 0, color: 'var(--teal)' },
    { label: '이지웰', count: 0, color: 'var(--purple)' },
    { label: '테크', count: 0, color: 'var(--orange)' },
    { label: '그룹사', count: 0, color: 'var(--red)' },
  ],
  devTypes: [
    { label: '신규', count: 0, color: 'var(--teal)' },
    { label: '개선', count: 0, color: 'var(--purple)' },
  ],
  summaries: [
    { label: '매출향상', count: 0 },
    { label: 'UI/UX 개선', count: 0 },
    { label: '업무효율', count: 0 },
    { label: '서비스도입', count: 0 },
    { label: '성능개선', count: 0 },
    { label: '정보보안', count: 0 },
  ],
}

export const requestDepts = [
  '복지서비스기획팀',
  'CS운영팀',
  '결제기획팀',
  'IT기획팀',
  '마케팅팀',
]

export const devDepts = [
  '고객사운영팀',
  '플랫폼팀',
  'IT개발팀',
  '인프라팀',
]

export { stageFilterOptions as stageOptions } from '@/shared/lib/commonOptions'

function countByAxis(rows, key, axis, unspecified) {
  const base = axis.filter((item) => item.label !== UNSPECIFIED_LABEL)
  const known = new Set(base.map((item) => item.label))
  const items = base.map((item) => ({ ...item, count: rows.filter((row) => row[key] === item.label).length }))
  const unspecifiedCount = rows.filter((row) => !known.has(row[key])).length
  if (unspecifiedCount > 0) items.push(unspecified(unspecifiedCount))
  return items
}

/** 조회 결과 기준 현황분석 재집계 — KPI·완료율·차트가 필터와 함께 따라간다. */
export function buildDashboardStats(rows, axes = dashboardAxes) {
  const completed = rows.filter((row) => row.stage === '완료').length
  return {
    stageKpi: {
      total: rows.length,
      received: rows.filter((row) => row.stage === '접수').length,
      inProgress: rows.filter((row) => ['협의중', '처리중', '테스트'].includes(row.stage)).length,
      completed,
      rejected: rows.filter((row) => row.stage === '반려').length,
    },
    completionRate: rows.length ? Math.round((completed / rows.length) * 10000) / 100 : 0,
    initiators: countByAxis(rows, 'initiator', axes.initiators,
      (count) => ({ label: UNSPECIFIED_LABEL, count, color: UNSPECIFIED_COLOR })),
    devTypes: countByAxis(rows, 'devType', axes.devTypes,
      (count) => ({ label: UNSPECIFIED_LABEL, count, color: UNSPECIFIED_COLOR })),
    summaries: countByAxis(rows, 'summary', axes.summaries,
      (count) => ({ label: UNSPECIFIED_LABEL, count })),
  }
}

/** 현황분석 모집단 — 당해년도 오픈만. 오픈예정일 미정은 제외. */
export function filterCurrentYearOpen(rows, year) {
  return rows.filter((row) => row.scheduledOpenDate !== NO_OPEN_DATE
    && Number(row.scheduledOpenDate.slice(0, 4)) === year)
}

/** 프로젝트 목록 행 */
export const dashboardProjects = [
  {
    id: 'd1',
    no: 1,
    stage: '처리중',
    stageType: 'prog',
    name: 'DL이앤씨 숙박바우처 변경 개발',
    progress: 80,
    scheduledOpenDate: '2026-07-20',
    dDay: 'D-50',
    isCompleted: false,
    isOverdue: false,
    requestDept: '복지서비스기획팀',
    devDept: '고객사운영팀',
    initiator: '고객사',
    devType: '신규',
    summary: '매출향상',
  },
  {
    id: 'd2',
    no: 2,
    stage: '테스트',
    stageType: 'test',
    name: '맞춤서비스 리워드 프로그램 개발',
    progress: 50,
    scheduledOpenDate: '2026-07-20',
    dDay: 'D-50',
    isCompleted: false,
    isOverdue: false,
    requestDept: 'CS운영팀',
    devDept: '고객사운영팀',
    initiator: '이지웰',
    devType: '신규',
    summary: 'UI/UX 개선',
  },
  {
    id: 'd3',
    no: 3,
    stage: '접수',
    stageType: 'recv',
    name: '이지웰페이 간편결제 SSO 연동',
    progress: 0,
    scheduledOpenDate: '2026-08-10',
    dDay: 'D-71',
    isCompleted: false,
    isOverdue: false,
    requestDept: '결제기획팀',
    devDept: '플랫폼팀',
    initiator: '테크',
    devType: '개선',
    summary: '서비스도입',
  },
  {
    id: 'd4',
    no: 4,
    stage: '협의중',
    stageType: 'prog',
    name: '프로모션 운영 프로세스 및 기능 개선',
    progress: 55,
    scheduledOpenDate: '2026-08-15',
    dDay: 'D-76',
    isCompleted: false,
    isOverdue: false,
    requestDept: '마케팅팀',
    devDept: 'IT개발팀',
    initiator: '이지웰',
    devType: '개선',
    summary: '업무효율',
  },
  {
    id: 'd5',
    no: 5,
    stage: '완료',
    stageType: 'done',
    name: '주문취소 시 쿠폰 할인취소 정보 노출 개선',
    progress: 100,
    scheduledOpenDate: '2026-05-12',
    actualOpenDate: '2026-05-10',
    dDay: null,
    isCompleted: true,
    isOverdue: false,
    requestDept: 'IT기획팀',
    devDept: 'IT개발팀',
    initiator: '고객사',
    devType: '개선',
    summary: 'UI/UX 개선',
  },
  {
    id: 'd6',
    no: 6,
    stage: '완료',
    stageType: 'done',
    name: '모바일 앱 푸시 알림 고도화',
    progress: 100,
    scheduledOpenDate: '2026-04-20',
    actualOpenDate: '2026-04-25',
    dDay: null,
    isCompleted: true,
    isOverdue: true,
    requestDept: 'CS운영팀',
    devDept: '플랫폼팀',
    initiator: '그룹사',
    devType: '신규',
    summary: '성능개선',
  },
  {
    id: 'd7',
    no: 7,
    stage: '처리중',
    stageType: 'prog',
    name: '정산 시스템 리뉴얼',
    progress: 42,
    scheduledOpenDate: '2026-09-01',
    dDay: 'D-7',
    isCompleted: false,
    isOverdue: false,
    isUrgent: true,
    requestDept: 'IT기획팀',
    devDept: '인프라팀',
    initiator: '테크',
    devType: '신규',
    summary: '업무효율',
  },
  {
    id: 'd8',
    no: 8,
    stage: '반려',
    stageType: 'rej',
    name: '레거시 DB 마이그레이션',
    progress: 0,
    scheduledOpenDate: '2026-06-01',
    dDay: null,
    isCompleted: false,
    isOverdue: false,
    requestDept: 'IT기획팀',
    devDept: '인프라팀',
    initiator: '이지웰',
    devType: '개선',
    summary: '정보보안',
  },
  {
    id: 'd9',
    no: 9,
    stage: '협의중',
    stageType: 'prog',
    name: '신규 복지몰 입점 검토',
    progress: 15,
    scheduledOpenDate: NO_OPEN_DATE,
    dDay: null,
    isCompleted: false,
    isOverdue: false,
    requestDept: '복지서비스기획팀',
    devDept: '고객사운영팀',
    initiator: '고객사',
    devType: '신규',
    summary: '매출향상',
  },
]

const defaultStats = buildDashboardStats(
  filterCurrentYearOpen(dashboardProjects, 2026),
  dashboardAxes,
)

export const stageKpi = defaultStats.stageKpi
export const completionRate = defaultStats.completionRate
export const initiators = defaultStats.initiators
export const devTypes = defaultStats.devTypes
export const summaries = defaultStats.summaries
