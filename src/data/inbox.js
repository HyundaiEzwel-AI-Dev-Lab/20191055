// 내업무 (PAG-M-MY-01/02/03) 목업 데이터
// figma/기획서 예시값 기반

export const INBOX_GUIDE =
  "프로젝트 관리 > 요구사항 관리에서 요구사항이 '확정'되면 WBS 관리 메뉴에 작업범위가 자동 생성됩니다. WBS 관리 메뉴에서 일정이 등록된 업무만 내 할 일 업무에 일정이 표시됩니다. (단, 캘린더: 일정 등록된 업무만 표시)"

export const emptySummary = {
  progressProjects: 0,
  myTasks: 0,
  weekDue: 0,
  waiting: 0,
  delayed: 0,
}

// 상단 요약
export const summary = {
  progressProjects: 5,
  myTasks: 45,
  weekDue: 2,
  waiting: 5,
  delayed: 1,
}

// 진행중 프로젝트 카드
export const progressProjects = [
  {
    id: 'p1',
    openDate: '2026/04/00',
    dday: 'D-14',
    stage: '테스트',
    stageType: 'test',
    name: '주문취소 시 쿠폰 할인취소 정보 노출 개선',
    progress: 80,
    members: 6,
    assignees: ['김현대', '이현대', '박현대', '권현대', '강현대', '유현대'],
    tasks: 9,
    done: 8,
  },
  {
    id: 'p2',
    openDate: '2026/04/00',
    dday: 'D-24',
    stage: '처리중',
    stageType: 'prog',
    name: 'DL이앤씨 바우처 정책 변경_숙박바우처',
    progress: 30,
    members: 4,
    assignees: ['김현대', '이현대', '박현대', '권현대'],
    tasks: 5,
    done: 3,
  },
  {
    id: 'p3',
    openDate: '2026/04/00',
    dday: 'D-37',
    stage: '협의중',
    stageType: 'prog',
    name: '프로모션 운영 프로세스 및 기능 개선',
    progress: 55,
    members: 2,
    assignees: ['김현대', '이현대'],
    tasks: 3,
    done: 0,
  },
  {
    id: 'p4',
    openDate: '2026/05/00',
    dday: 'D-52',
    stage: '개발',
    stageType: 'prog',
    name: '모바일 앱 푸시 알림 고도화',
    progress: 42,
    members: 5,
    assignees: ['김현대', '이현대', '박현대', '권현대', '강현대'],
    tasks: 7,
    done: 2,
  },
  {
    id: 'p5',
    openDate: '2026/06/00',
    dday: 'D-68',
    stage: '설계',
    stageType: 'prog',
    name: '정산 시스템 리뉴얼',
    progress: 15,
    members: 3,
    assignees: ['김현대', '이현대', '박현대'],
    tasks: 4,
    done: 0,
  },
]

const baseMyTasks = [
  {
    id: 't1',
    name: '단위 테스트',
    dueLabel: '3/20 마감',
    dday: 'D+2',
    delayed: true,
    progress: 73,
    project: '프로모션 운영 프로세스 및 기능 개선',
    projectId: 'p3',
    taskType: '단위테스트',
    wbsId: 'WBS-010',
    planStart: '2026-03-10',
    planEnd: '2026-03-20',
  },
  {
    id: 't2',
    name: '바우처 특복 배정 개발',
    dueLabel: '3/22 마감',
    dday: 'D-5',
    delayed: false,
    progress: 45,
    project: 'DL이앤씨 바우처 정책 변경 개발',
    projectId: 'p2',
    taskType: '개발',
    wbsId: 'WBS-011',
    planStart: '2026-03-12',
    planEnd: '2026-03-22',
  },
  {
    id: 't3',
    name: '바우처 특복 회수 개발',
    dueLabel: '3/30 마감',
    dday: 'D-13',
    delayed: false,
    progress: 50,
    project: 'DL이앤씨 바우처 정책 변경 개발',
    projectId: 'p2',
    taskType: '개발',
    wbsId: 'WBS-012',
    planStart: '2026-03-20',
    planEnd: '2026-03-30',
  },
  {
    id: 't4',
    name: '쿠폰사용 정보 노출 개발',
    dueLabel: '일정 미등록',
    dday: '',
    delayed: false,
    progress: null,
    project: '주문취소 시 쿠폰 할인취소 정보 노출 개선',
    projectId: 'p1',
    taskType: '개발',
    wbsId: 'WBS-013',
    planStart: null,
    planEnd: null,
  },
  {
    id: 't5',
    name: '요건분석',
    dueLabel: '4/02 마감',
    dday: 'D-10',
    delayed: false,
    progress: 20,
    project: '프로모션 운영 프로세스 및 기능 개선',
    projectId: 'p3',
    taskType: '기획',
    wbsId: 'WBS-001',
    planStart: '2026-03-23',
    planEnd: '2026-04-02',
  },
  {
    id: 't6',
    name: '화면설계',
    dueLabel: '4/05 마감',
    dday: 'D-13',
    delayed: false,
    progress: 40,
    project: '모바일 앱 푸시 알림 고도화',
    projectId: 'p4',
    taskType: '디자인',
    wbsId: 'WBS-002',
    planStart: '2026-03-26',
    planEnd: '2026-04-05',
  },
  {
    id: 't7',
    name: 'DEV 테스트',
    dueLabel: '4/08 마감',
    dday: 'D-16',
    delayed: false,
    progress: 10,
    project: '주문취소 시 쿠폰 할인취소 정보 노출 개선',
    projectId: 'p1',
    taskType: 'DEV테스트',
    wbsId: 'WBS-020',
    planStart: '2026-03-29',
    planEnd: '2026-04-08',
  },
]

/** dueLabel의 M/D 기준 -10일을 계획시작일로 산정 */
function planStartFor(month, day) {
  const d = new Date(2026, month - 1, day)
  d.setDate(d.getDate() - 10)
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

/** 페이징 확인용 — 총 45건 */
export const myTasks = [
  ...baseMyTasks,
  ...Array.from({ length: 38 }, (_, i) => {
    const day = (i % 28) + 1
    return {
      id: `t-extra-${i + 1}`,
      name: `추가 업무 ${String(i + 1).padStart(2, '0')}`,
      dueLabel: `4/${String(day).padStart(2, '0')} 마감`,
      dday: `D-${i + 1}`,
      delayed: false,
      progress: (i * 7) % 100,
      project: progressProjects[i % progressProjects.length].name,
      projectId: progressProjects[i % progressProjects.length].id,
      taskType: ['개발', '퍼블리싱', '기획', '디자인', '단위테스트'][i % 5],
      wbsId: `WBS-E${String(i + 1).padStart(3, '0')}`,
      planStart: planStartFor(4, day),
      planEnd: `2026-04-${String(day).padStart(2, '0')}`,
    }
  }),
]

export const waitingProjects = [
  {
    id: 'p6',
    owner: '테크담당',
    openDate: '2026/00/00 ( D-00 )',
    stage: '접수',
    name: '전사 프로젝트 관리 시스템 구축',
  },
  {
    id: 'p7',
    owner: '상품사업부',
    openDate: '오픈일 미정',
    stage: '접수',
    name: '농협카드 인앱 쇼핑몰',
  },
  {
    id: 'p8',
    owner: '마케팅팀',
    openDate: '2026/07/00 ( D-90 )',
    stage: '접수',
    name: '멤버십 등급 체계 개편',
  },
  {
    id: 'p9',
    owner: '플랫폼팀',
    openDate: '2026/08/00 ( D-120 )',
    stage: '접수',
    name: '실시간 재고 연동 API 구축',
  },
  {
    id: 'p10',
    owner: '고객센터',
    openDate: '오픈일 미정',
    stage: '접수',
    name: 'CS 상담 이력 통합 조회',
  },
]

/** 배정 없음 계정(2024099)용 */
export function getInboxBundle(userId) {
  if (userId === '2024099') {
    return {
      summary: { ...emptySummary },
      progressProjects: [],
      myTasks: [],
      waitingProjects: [],
    }
  }
  return {
    summary: { ...summary },
    progressProjects: [...progressProjects],
    myTasks: [...myTasks],
    waitingProjects: [...waitingProjects],
  }
}

/** 업무유형 → 랜딩 경로 */
export function routeForTaskType(taskType) {
  if (taskType === '기획') return '/project/requirement'
  if (taskType === '단위테스트') return '/project/unit-test'
  if (taskType === 'DEV테스트' || taskType === 'dev테스트') return '/project/test-run/dev'
  if (taskType === '운영테스트') return '/project/test-run/uat'
  // 디자인, 퍼블리싱, 개발
  return '/project/wbs'
}
