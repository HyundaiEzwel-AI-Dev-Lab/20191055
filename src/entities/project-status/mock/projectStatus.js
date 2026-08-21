// PAG-M-PST-01 프로젝트 현황 목업
// SB p.20~21, figma: 04_프로젝트현황.html

export const projectStatusMeta = {
  hint: '연간 전체 현황',
  inProgressTooltip: '진행중인 프로젝트는 처리단계가 협의중, 처리중, 테스트인 프로젝트입니다.',
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

export { stageFilterOptions as stageOptions, pageSizeOptions } from '@/shared/lib/commonOptions'
export { systemOptions, bizCategoryMap } from '@/entities/requirement/mock/requirement'
export { initiatorOptions, devTypeOptions, summaryOptions } from '@/entities/project/mock/projectInfo'

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
    manager: '김현대',
    system: ['HIMS'],
    bizCategory: ['프로모션'],
    initiator: '고객사',
    devType: '개선',
    summary: '매출향상',
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
    manager: '김현대',
    system: ['HIMS'],
    bizCategory: ['프로모션'],
    initiator: '고객사',
    devType: '개선',
    summary: '매출향상',
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
    manager: '이현대',
    system: ['FO'],
    bizCategory: ['주문클레임'],
    initiator: '이지웰',
    devType: '신규',
    summary: 'UI/UX 개선',
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
    manager: '이현대',
    system: ['FO'],
    bizCategory: ['주문클레임'],
    initiator: '이지웰',
    devType: '신규',
    summary: 'UI/UX 개선',
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
    manager: '이현대',
    system: ['FO'],
    bizCategory: ['주문클레임'],
    initiator: '이지웰',
    devType: '신규',
    summary: 'UI/UX 개선',
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
    manager: '이현대',
    system: ['FO'],
    bizCategory: ['주문클레임'],
    initiator: '이지웰',
    devType: '신규',
    summary: 'UI/UX 개선',
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
    manager: '권현대',
    system: ['HCAS'],
    bizCategory: ['법인숙박'],
    initiator: '테크',
    devType: '개선',
    summary: '업무효율',
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
    manager: '박현대',
    system: ['HCAS'],
    bizCategory: ['복지혜택'],
    initiator: '테크',
    devType: '신규',
    summary: '서비스도입',
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
    manager: '강현대',
    system: ['HPAS'],
    bizCategory: ['결제'],
    initiator: '그룹사',
    devType: '신규',
    summary: '성능개선',
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
    manager: '안현대',
    system: ['HIMS(정산)'],
    bizCategory: ['정산'],
    initiator: '테크',
    devType: '개선',
    summary: '정보보안',
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

export function calculateStatusKpi(rows) {
  return {
    total: rows.length,
    received: rows.filter((row) => row.stage === '접수').length,
    inProgress: rows.filter((row) => IN_PROGRESS_STAGES.includes(row.stage)).length,
    completed: rows.filter((row) => row.stage === '완료').length,
    rejected: rows.filter((row) => row.stage === '반려').length,
  }
}

/** 검색조건만 적용한 목록 — KPI 집계용(처리단계 KPI 클릭은 빼서 카드 숫자가 서로 0이 되지 않게). */
export function filterProjectStatusBySearch(rows, f) {
  return rows.filter((row) => {
    if (f.keyword && !row.name.includes(f.keyword) && !row.projectId.includes(f.keyword)) return false
    if (f.requestDept && !row.requestDept.includes(f.requestDept)) return false
    if (f.devDept && row.devDept !== f.devDept) return false
    if (f.stage !== '전체' && row.stage !== f.stage) return false
    if (f.openDateFrom || f.openDateTo) {
      if (!row.scheduledOpenDate || row.scheduledOpenDate === '-') return false
      if (f.openDateFrom && row.scheduledOpenDate < f.openDateFrom) return false
      if (f.openDateTo && row.scheduledOpenDate > f.openDateTo) return false
    }
    if (f.manager && !row.manager.includes(f.manager)) return false
    if (f.systems.length && !f.systems.some((s) => row.system.includes(s))) return false
    if (f.bizCategories.length && !f.bizCategories.some((b) => row.bizCategory.includes(b))) return false
    if (f.itVoc && !row.itVoc.includes(f.itVoc)) return false
    if (f.jira && !row.jira.toLowerCase().includes(f.jira.toLowerCase())) return false
    if (f.initiator && row.initiator !== f.initiator) return false
    if (f.devType && row.devType !== f.devType) return false
    if (f.summary && row.summary !== f.summary) return false
    return true
  })
}

export function filterProjectStatusList(rows, activeKpi, f) {
  return filterProjectStatusBySearch(rows, f).filter((row) => matchKpiFilter(row, activeKpi))
}

export const statusKpi = calculateStatusKpi(projectStatusList)
