// PAG-M-DAS-01 메인 대시보드 / 전체 프로젝트 현황 목업
// figma: 06_전체프로젝트현황_대시보드.html

export const dashboardMeta = {
  yearScope: '당해연도 오픈 프로젝트',
  queryTime: '2026-06-23 09:00',
}

export const stageKpi = {
  total: 27,
  received: 6,
  inProgress: 14,
  completed: 6,
  rejected: 1,
}

export const completionRate = 22.22

export const initiators = [
  { label: '고객사', count: 12, color: 'var(--teal)' },
  { label: '이지웰', count: 8, color: '#15b3a0' },
  { label: '테크', count: 5, color: '#8fd3c9' },
  { label: '그룹사', count: 2, color: 'var(--teal-100)' },
]

export const devTypes = [
  { label: '신규', count: 70, color: 'var(--teal)' },
  { label: '개선', count: 30, color: 'var(--teal-100)' },
]

export const summaries = [
  { label: '매출향상', count: 30 },
  { label: 'UI/UX 개선', count: 20 },
  { label: '업무효율', count: 20 },
  { label: '서비스도입', count: 10 },
  { label: '성능개선', count: 10 },
  { label: '정보보안', count: 10 },
]

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

export const stageOptions = ['전체', '접수', '협의중', '처리중', '테스트', '완료', '반려']

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
]
