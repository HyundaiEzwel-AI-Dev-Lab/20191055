// 내업무 (PAG-M-MY-01/02/03) 목업 데이터
// figma/기획서 예시값 기반

// 상단 요약
export const summary = {
  progressProjects: 5, // 진행 프로젝트 (진행 상태 카운트)
  myTasks: 4, // 내 할 일
  weekDue: 2, // 금주 마감
  waiting: 5, // 대기 (접수)
  delayed: 1, // 지연
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
    tasks: 4,
    done: 0,
  },
]

// 내 할 일 (WBS 기준, 마감일 빠른 순)
export const myTasks = [
  {
    id: 't1',
    name: '단위 테스트',
    dueLabel: '3/20 마감',
    dday: 'D+2',
    delayed: true,
    progress: 73,
    project: '프로모션 운영 프로세스 및 기능 개선',
    type: 'unit-test',
  },
  {
    id: 't2',
    name: '바우처 특복 배정 개발',
    dueLabel: '3/22 마감',
    dday: 'D-5',
    delayed: false,
    progress: 45,
    project: 'DL이앤씨 바우처 정책 변경 개발',
    type: 'dev',
  },
  {
    id: 't3',
    name: '바우처 특복 회수 개발',
    dueLabel: '3/30 마감',
    dday: 'D-13',
    delayed: false,
    progress: 50,
    project: 'DL이앤씨 바우처 정책 변경 개발',
    type: 'dev',
  },
  {
    id: 't4',
    name: '쿠폰사용 정보 노출 개발',
    dueLabel: '일정 미등록',
    dday: '',
    delayed: false,
    progress: null,
    project: '주문취소 시 쿠폰 할인취소 정보 노출 개선',
    type: 'dev',
  },
]

// 대기 (접수 상태 프로젝트)
export const waitingProjects = [
  {
    id: 'w1',
    owner: '테크담당',
    openDate: '2026/00/00 ( D-00 )',
    stage: '접수',
    name: '전사 프로젝트 관리 시스템 구축',
  },
  {
    id: 'w2',
    owner: '상품사업부',
    openDate: '오픈일 미정',
    stage: '접수',
    name: '농협카드 인앱 쇼핑몰',
  },
  {
    id: 'w3',
    owner: '마케팅팀',
    openDate: '2026/07/00 ( D-90 )',
    stage: '접수',
    name: '멤버십 등급 체계 개편',
  },
  {
    id: 'w4',
    owner: '플랫폼팀',
    openDate: '2026/08/00 ( D-120 )',
    stage: '접수',
    name: '실시간 재고 연동 API 구축',
  },
  {
    id: 'w5',
    owner: '고객센터',
    openDate: '오픈일 미정',
    stage: '접수',
    name: 'CS 상담 이력 통합 조회',
  },
]
