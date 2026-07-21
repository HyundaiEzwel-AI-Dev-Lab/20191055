// PAG-M-DAS-06 실적관리 목업
// SB p.172~174 — 완료/반려 프로젝트 기준 인력별 실적

export const performanceMeta = {
  notice: '실적관리는 완료/반려 프로젝트를 조회 대상으로 합니다.',
  chartNotice: '현황분석 차트는 전체 및 부서 단위 조회 결과에 대해서만 제공합니다.',
  queryTime: '2026-06-23 09:00',
}

export const performanceSummary = {
  projectCount: 120,
  longTermProjects: 20,
  avgDevWorkload: 2.2,
  projectsPerPerson: 3.5,
}

export const deptOptions = ['전체', '플랫폼팀', 'E커머스팀', '상품기획팀', '마케팅팀', 'IT기획팀']
export const statusOptions = ['전체', '완료', '반려']
export const monthPresets = ['당월', '전월', '직접입력']

export const initiators = [
  { label: '고객사', count: 48, color: 'var(--teal)' },
  { label: '이지웰', count: 42, color: 'var(--purple)' },
  { label: '테크', count: 22, color: 'var(--orange)' },
  { label: '그룹사', count: 8, color: 'var(--red)' },
]

export const devTypes = [
  { label: '신규', count: 72, color: 'var(--teal)' },
  { label: '개선', count: 48, color: 'var(--purple)' },
]

export const summaries = [
  { label: '매출향상', count: 32 },
  { label: 'UI/UX 개선', count: 24 },
  { label: '업무효율', count: 18 },
  { label: '서비스도입', count: 14 },
  { label: '성능개선', count: 12 },
  { label: '정보보안', count: 10 },
]

export const performanceRecords = [
  {
    id: 'r1',
    no: 1,
    dept: '플랫폼팀',
    name: '홍길동',
    empId: '2199999',
    position: '책임',
    projectCount: 20,
    totalMd: 180,
    projects: [
      {
        name: '전사 프로젝트 관리 시스템 구축',
        md: 120,
        openDate: '2026-06-30',
        taskCount: 5,
        delayedCount: 2,
        planMd: 70,
        execMd: 75,
        scheduleStatus: 'delay',
      },
      {
        name: '주문/결제페이지 內 특복 개별사용 개선',
        md: 120,
        openDate: '2026-06-30',
        taskCount: 2,
        delayedCount: 0,
        planMd: 15,
        execMd: 10,
        scheduleStatus: 'short',
      },
      {
        name: '이지웰프렌즈 H.Point 더블적립 개발',
        md: 120,
        openDate: '2026-06-30',
        taskCount: 8,
        delayedCount: 0,
        planMd: 18,
        execMd: 18,
        scheduleStatus: 'normal',
      },
    ],
  },
  {
    id: 'r2',
    no: 2,
    dept: '플랫폼팀',
    name: '김현대',
    empId: '1999999',
    position: '선임',
    projectCount: 10,
    totalMd: 120,
    projects: [
      {
        name: '교환반품 클레임 개선',
        md: 120,
        openDate: '2026-06-30',
        taskCount: 3,
        delayedCount: 0,
        planMd: 14,
        execMd: 14,
        scheduleStatus: 'normal',
      },
      {
        name: 'HPAS 개인정보 마스킹 개발',
        md: 120,
        openDate: '2026-06-30',
        taskCount: 1,
        delayedCount: 0,
        planMd: 10,
        execMd: 10,
        scheduleStatus: 'normal',
      },
    ],
  },
  {
    id: 'r3',
    no: 3,
    dept: 'E커머스팀',
    name: '김개발',
    empId: '2099999',
    position: '책임',
    projectCount: 15,
    totalMd: 100,
    projects: [
      {
        name: '프로모션 운영 프로세스 및 기능 개선',
        md: 120,
        openDate: '2026-06-30',
        taskCount: 1,
        delayedCount: 1,
        planMd: 20,
        execMd: 25,
        scheduleStatus: 'delay',
      },
    ],
  },
  {
    id: 'r4',
    no: 4,
    dept: '상품기획팀',
    name: '이현업',
    empId: '1288888',
    position: '책임',
    projectCount: 2,
    totalMd: 28,
    projects: [
      {
        name: 'HPAS 개인정보 마스킹 개발',
        md: 120,
        openDate: '2026-06-30',
        taskCount: 2,
        delayedCount: 0,
        planMd: 10,
        execMd: 10,
        scheduleStatus: 'normal',
      },
      {
        name: '상생복지몰 구축',
        md: 80,
        openDate: '2026-06-30',
        taskCount: 2,
        delayedCount: 0,
        planMd: 10,
        execMd: 8,
        scheduleStatus: 'short',
      },
    ],
  },
  {
    id: 'r5',
    no: 5,
    dept: '마케팅팀',
    name: '임현업',
    empId: '1855555',
    position: '책임',
    projectCount: 2,
    totalMd: 22,
    projects: [
      {
        name: 'Ez SALE FESTA 개발',
        md: 40,
        openDate: '2026-06-30',
        taskCount: 2,
        delayedCount: 0,
        planMd: 8,
        execMd: 10,
        scheduleStatus: 'delay',
      },
      {
        name: '프로모션 운영 프로세스 및 기능 개선',
        md: 50,
        openDate: '2026-06-30',
        taskCount: 2,
        delayedCount: 0,
        planMd: 20,
        execMd: 18,
        scheduleStatus: 'short',
      },
    ],
  },
]

export const scheduleStatusLabel = {
  delay: '경과',
  normal: '정상',
  short: '단축',
}

export const scheduleStatusClass = {
  delay: 'delay',
  normal: 'normal',
  short: 'short',
}
