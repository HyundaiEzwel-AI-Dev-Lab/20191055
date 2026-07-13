// PAG-M-PST-01 프로젝트 현황 목업
// SB p.20~21, figma: 04_프로젝트현황.html

export const projectStatusMeta = {
  hint: '연간 전체 현황',
  inProgressTooltip: '진행중인 프로젝트는 처리단계가 협의중, 처리중, 테스트인 프로젝트입니다.',
}

export const statusKpi = {
  total: 27,
  received: 6,
  inProgress: 14,
  completed: 6,
  rejected: 1,
}

export const requestDepts = [
  '마케팅팀',
  '복지서비스기획팀',
  'CS운영팀',
  '결제기획팀',
  'IT기획팀',
]

export const devDepts = [
  'e커머스팀',
  '플랫폼팀',
  '고객사운영팀',
  'IT개발팀',
  '백오피스팀',
]

export const stageOptions = ['전체', '접수', '협의중', '처리중', '테스트', '완료', '반려']
export const pageSizeOptions = [20, 50, 100]

const IN_PROGRESS_STAGES = ['협의중', '처리중', '테스트']

export const projectStatusList = [
  {
    id: 'ps27',
    no: 27,
    projectId: 'PJ1020',
    name: '프로모션 운영 프로세스 및 기능 개선',
    stage: '접수',
    stageType: 'recv',
    progress: 0,
    scheduledOpenDate: '2026-06-30',
    actualOpenDate: null,
    isOverdue: false,
    requestDept: '마케팅팀',
    devDept: 'e커머스팀',
    itVoc: '533,378',
    jira: 'HDEZW-93132',
  },
  {
    id: 'ps26',
    no: 26,
    projectId: 'PJ1019',
    name: '프로모션 운영 프로세스 및 기능 개선',
    stage: '협의중',
    stageType: 'prog',
    progress: 30,
    scheduledOpenDate: '2026-05-20',
    actualOpenDate: null,
    isOverdue: false,
    requestDept: '마케팅팀',
    devDept: 'e커머스팀',
    itVoc: '533,378',
    jira: 'HDEZW-93132',
  },
  {
    id: 'ps25',
    no: 25,
    projectId: 'PJ1018',
    name: '주문취소 시 쿠폰 할인취소 정보 표기',
    stage: '처리중',
    stageType: 'prog',
    progress: 50,
    scheduledOpenDate: '2026-04-27',
    actualOpenDate: null,
    isOverdue: false,
    requestDept: '마케팅팀',
    devDept: '플랫폼팀',
    itVoc: '532,044',
    jira: 'HDEZW-92834',
  },
  {
    id: 'ps24',
    no: 24,
    projectId: 'PJ1017',
    name: '주문취소 시 쿠폰 할인취소 정보 표기',
    stage: '테스트',
    stageType: 'test',
    progress: 80,
    scheduledOpenDate: '2026-04-10',
    actualOpenDate: '2026-04-10',
    isOverdue: false,
    requestDept: '마케팅팀',
    devDept: '고객사운영팀',
    itVoc: '532,044',
    jira: 'HDEZW-92834',
  },
  {
    id: 'ps23',
    no: 23,
    projectId: 'PJ1016',
    name: '주문취소 시 쿠폰 할인취소 정보 표기',
    stage: '완료',
    stageType: 'done',
    progress: 100,
    scheduledOpenDate: '2026-04-10',
    actualOpenDate: '2026-04-11',
    isOverdue: true,
    requestDept: '마케팅팀',
    devDept: '고객사운영팀',
    itVoc: '532,044',
    jira: 'HDEZW-92834',
  },
  {
    id: 'ps22',
    no: 22,
    projectId: 'PJ1015',
    name: '주문취소 시 쿠폰 할인취소 정보 표기',
    stage: '처리중',
    stageType: 'prog',
    progress: 10,
    scheduledOpenDate: '2026-04-10',
    actualOpenDate: null,
    isOverdue: false,
    requestDept: '마케팅팀',
    devDept: '고객사운영팀',
    itVoc: '532,044',
    jira: 'HDEZW-92834',
  },
  {
    id: 'ps21',
    no: 21,
    projectId: 'PJ1031',
    name: 'DL이앤씨 숙박바우처 변경 개발',
    stage: '처리중',
    stageType: 'prog',
    progress: 80,
    scheduledOpenDate: '2026-07-20',
    actualOpenDate: null,
    isOverdue: false,
    requestDept: '복지서비스기획팀',
    devDept: '고객사운영팀',
    itVoc: '541,037',
    jira: 'HDEZW-95292',
  },
  {
    id: 'ps20',
    no: 20,
    projectId: 'PJ1030',
    name: '맞춤서비스 리워드 프로그램 개발',
    stage: '테스트',
    stageType: 'test',
    progress: 50,
    scheduledOpenDate: '2026-07-20',
    actualOpenDate: null,
    isOverdue: false,
    requestDept: 'CS운영팀',
    devDept: '고객사운영팀',
    itVoc: '540,120',
    jira: 'HDEZW-95100',
  },
  {
    id: 'ps19',
    no: 19,
    projectId: 'PJ1028',
    name: '이지웰페이 간편결제 SSO 연동',
    stage: '접수',
    stageType: 'recv',
    progress: 0,
    scheduledOpenDate: '2026-08-10',
    actualOpenDate: null,
    isOverdue: false,
    requestDept: '결제기획팀',
    devDept: '플랫폼팀',
    itVoc: '538,900',
    jira: 'HDEZW-94800',
  },
  {
    id: 'ps18',
    no: 18,
    projectId: 'PJ1012',
    name: '레거시 DB 마이그레이션',
    stage: '반려',
    stageType: 'rej',
    progress: 0,
    scheduledOpenDate: '2026-06-01',
    actualOpenDate: null,
    isOverdue: false,
    requestDept: 'IT기획팀',
    devDept: '-',
    itVoc: '530,100',
    jira: 'HDEZW-92000',
  },
]

export function isInProgressStage(stage) {
  return IN_PROGRESS_STAGES.includes(stage)
}

export function matchKpiFilter(row, kpiKey) {
  if (kpiKey === 'total') return true
  if (kpiKey === 'received') return row.stage === '접수'
  if (kpiKey === 'inProgress') return isInProgressStage(row.stage)
  if (kpiKey === 'completed') return row.stage === '완료'
  if (kpiKey === 'rejected') return row.stage === '반려'
  return true
}
