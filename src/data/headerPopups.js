// 헤더 팝업 목업 — POP-M-COM-04~07 (기획서 예시 기반)

export const searchTypeLabel = {
  menu: '메뉴',
  project: '프로젝트',
  task: '업무',
}

/** 최근 조회 프로젝트 10건 */
export const recentProjects = [
  { id: 'rp1', name: '주문취소 시 쿠폰 할인취소 정보 노출 개선', stage: '테스트', stageType: 'test', route: '/project/info' },
  { id: 'rp2', name: 'DL이앤씨 바우처 정책 변경_숙박바우처', stage: '처리중', stageType: 'prog', route: '/project/info' },
  { id: 'rp3', name: '프로모션 운영 프로세스 및 기능 개선', stage: '협의중', stageType: 'prog', route: '/project/info' },
  { id: 'rp4', name: '모바일 앱 푸시 알림 고도화', stage: '개발', stageType: 'prog', route: '/project/info' },
  { id: 'rp5', name: '정산 시스템 리뉴얼', stage: '설계', stageType: 'prog', route: '/project/info' },
  { id: 'rp6', name: '전사 프로젝트 관리 시스템 구축', stage: '접수', stageType: 'recv', route: '/project/info' },
  { id: 'rp7', name: '농협카드 인앱 쇼핑몰', stage: '접수', stageType: 'recv', route: '/project/info' },
  { id: 'rp8', name: '멤버십 등급 체계 개편', stage: '접수', stageType: 'recv', route: '/project/info' },
  { id: 'rp9', name: '실시간 재고 연동 API 구축', stage: '접수', stageType: 'recv', route: '/project/info' },
  { id: 'rp10', name: 'CS 상담 이력 통합 조회', stage: '접수', stageType: 'recv', route: '/project/info' },
]

/** 통합 검색 카탈로그 — 메뉴·프로젝트·업무 */
export const searchItems = [
  // 메뉴
  { id: 's1', type: 'menu', label: '내업무', route: '/inbox', group: '통합관리' },
  { id: 's2', type: 'menu', label: '메인 대시보드', route: '/dashboard/main', group: '대시보드' },
  { id: 's3', type: 'menu', label: '실적 관리', route: '/dashboard/performance', group: '대시보드' },
  { id: 's4', type: 'menu', label: '테크 리소스 관리', route: '/dashboard/tech-resource', group: '대시보드' },
  { id: 's5', type: 'menu', label: '프로젝트 등록', route: '/integrated/project/register', group: '통합관리' },
  { id: 's6', type: 'menu', label: '프로젝트 현황', route: '/integrated/project/status', group: '통합관리' },
  { id: 's7', type: 'menu', label: '프로젝트 변경이력', route: '/integrated/project/history', group: '통합관리' },
  { id: 's8', type: 'menu', label: '테스트 라이브러리', route: '/integrated/test-library', group: '통합관리' },
  { id: 's9', type: 'menu', label: '신청 승인 관리', route: '/admin/approval', group: '시스템관리' },
  { id: 's10', type: 'menu', label: '화면(메뉴)관리', route: '/admin/menus', group: '시스템관리' },
  { id: 's11', type: 'menu', label: '공통코드 관리', route: '/admin/common-code', group: '시스템관리' },
  { id: 's12', type: 'menu', label: '사용자 관리', route: '/admin/users', group: '시스템관리' },
  { id: 's13', type: 'menu', label: '휴무일 관리', route: '/admin/holiday', group: '시스템관리' },
  { id: 's14', type: 'menu', label: '프로젝트 정보', route: '/project/info', group: '프로젝트 관리' },
  { id: 's15', type: 'menu', label: '요구사항 관리', route: '/project/requirement', group: '프로젝트 관리' },
  { id: 's16', type: 'menu', label: 'WBS 관리', route: '/project/wbs', group: '프로젝트 관리' },
  { id: 's17', type: 'menu', label: '단위테스트', route: '/project/unit-test', group: '프로젝트 관리' },
  { id: 's18', type: 'menu', label: 'DEV테스트 시나리오 관리', route: '/project/scenario/dev', group: '프로젝트 관리' },
  { id: 's19', type: 'menu', label: 'DEV테스트 결함관리', route: '/project/defect/dev', group: '프로젝트 관리' },
  { id: 's20', type: 'menu', label: '운영테스트 결함관리', route: '/project/defect/uat', group: '프로젝트 관리' },
  // 프로젝트
  { id: 's21', type: 'project', label: '주문취소 시 쿠폰 할인취소 정보 노출 개선', route: '/project/info', group: '진행중', stage: '테스트' },
  { id: 's22', type: 'project', label: 'DL이앤씨 바우처 정책 변경_숙박바우처', route: '/project/info', group: '진행중', stage: '처리중' },
  { id: 's23', type: 'project', label: '프로모션 운영 프로세스 및 기능 개선', route: '/project/info', group: '진행중', stage: '협의중' },
  { id: 's24', type: 'project', label: '모바일 앱 푸시 알림 고도화', route: '/project/info', group: '진행중', stage: '개발' },
  { id: 's25', type: 'project', label: '정산 시스템 리뉴얼', route: '/project/info', group: '진행중', stage: '설계' },
  { id: 's26', type: 'project', label: '전사 프로젝트 관리 시스템 구축', route: '/project/info', group: '대기', stage: '접수' },
  { id: 's27', type: 'project', label: '농협카드 인앱 쇼핑몰', route: '/project/info', group: '대기', stage: '접수' },
  // 업무
  { id: 's28', type: 'task', label: '단위 테스트', route: '/inbox', group: '내 할 일', project: '프로모션 운영 프로세스 및 기능 개선' },
  { id: 's29', type: 'task', label: '바우처 특복 배정 개발', route: '/inbox', group: '내 할 일', project: 'DL이앤씨 바우처 정책 변경 개발' },
  { id: 's30', type: 'task', label: '바우처 특복 회수 개발', route: '/inbox', group: '내 할 일', project: 'DL이앤씨 바우처 정책 변경 개발' },
  { id: 's31', type: 'task', label: '쿠폰사용 정보 노출 개발', route: '/inbox', group: '내 할 일', project: '주문취소 시 쿠폰 할인취소 정보 노출 개선' },
  { id: 's32', type: 'task', label: 'DEV테스트', route: '/project/wbs', group: 'WBS', project: '프로모션 운영 프로세스 및 기능 개선' },
  { id: 's33', type: 'task', label: '바우처 특복 배정', route: '/inbox', group: '캘린더', project: 'DL이앤씨 바우처 정책 변경_숙박바우처' },
  { id: 's34', type: 'task', label: '프로모션 등록 개발', route: '/project/wbs', group: 'WBS', project: '프로모션 운영 프로세스 및 기능 개발' },
  { id: 's35', type: 'task', label: 'HIMS 개발', route: '/project/wbs', group: 'WBS', project: '프로모션 운영 프로세스 및 기능 개발' },
]

/** 검색 결과 데모 — 키워드 없이 검색 시 노출용 */
export const searchResultExamples = [
  { id: 'e1', type: 'menu', label: 'WBS 관리', route: '/project/wbs', group: '프로젝트 관리' },
  { id: 'e2', type: 'menu', label: '요구사항 관리', route: '/project/requirement', group: '프로젝트 관리' },
  { id: 'e3', type: 'project', label: 'DL이앤씨 바우처 정책 변경_숙박바우처', route: '/project/info', group: '진행중', stage: '처리중' },
  { id: 'e4', type: 'project', label: '프로모션 운영 프로세스 및 기능 개선', route: '/project/info', group: '진행중', stage: '협의중' },
  { id: 'e5', type: 'task', label: '바우처 특복 배정 개발', route: '/inbox', group: '내 할 일', project: 'DL이앤씨 바우처 정책 변경 개발' },
  { id: 'e6', type: 'task', label: '단위 테스트', route: '/inbox', group: '내 할 일', project: '프로모션 운영 프로세스 및 기능 개선' },
  { id: 'e7', type: 'task', label: 'DEV테스트', route: '/project/wbs', group: 'WBS', project: '프로모션 운영 프로세스 및 기능 개발' },
  { id: 'e8', type: 'menu', label: '내업무', route: '/inbox', group: '통합관리' },
  { id: 'e9', type: 'project', label: '주문취소 시 쿠폰 할인취소 정보 노출 개선', route: '/project/info', group: '진행중', stage: '테스트' },
  { id: 'e10', type: 'task', label: '쿠폰사용 정보 노출 개발', route: '/inbox', group: '내 할 일', project: '주문취소 시 쿠폰 할인취소 정보 노출 개선' },
  { id: 'e11', type: 'menu', label: '프로젝트 현황', route: '/integrated/project/status', group: '통합관리' },
  { id: 'e12', type: 'task', label: '바우처 특복 회수 개발', route: '/inbox', group: '내 할 일', project: 'DL이앤씨 바우처 정책 변경 개발' },
]

export const myProjects = [
  { id: 'p1', name: '주문취소 시 쿠폰 할인취소 정보 노출 개선', stage: '테스트', stageType: 'test', role: 'PL', openDate: '2026/04/00', dday: 'D-14' },
  { id: 'p2', name: 'DL이앤씨 바우처 정책 변경_숙박바우처', stage: '처리중', stageType: 'prog', role: '개발', openDate: '2026/04/00', dday: 'D-24' },
  { id: 'p3', name: '프로모션 운영 프로세스 및 기능 개선', stage: '협의중', stageType: 'prog', role: '개발', openDate: '2026/04/00', dday: 'D-37' },
  { id: 'p4', name: '모바일 앱 푸시 알림 고도화', stage: '개발', stageType: 'prog', role: '개발', openDate: '2026/05/00', dday: 'D-52' },
  { id: 'p5', name: '정산 시스템 리뉴얼', stage: '설계', stageType: 'prog', role: 'PL', openDate: '2026/06/00', dday: 'D-68' },
  { id: 'p6', name: '전사 프로젝트 관리 시스템 구축', stage: '접수', stageType: 'recv', role: 'PL', openDate: '2026/00/00', dday: 'D-00' },
  { id: 'p7', name: '농협카드 인앱 쇼핑몰', stage: '접수', stageType: 'recv', role: '개발', openDate: '오픈일 미정', dday: '-' },
  { id: 'p8', name: '멤버십 등급 체계 개편', stage: '접수', stageType: 'recv', role: '개발', openDate: '2026/07/00', dday: 'D-90' },
  { id: 'p9', name: '실시간 재고 연동 API 구축', stage: '접수', stageType: 'recv', role: '개발', openDate: '2026/08/00', dday: 'D-120' },
  { id: 'p10', name: 'CS 상담 이력 통합 조회', stage: '접수', stageType: 'recv', role: 'PL', openDate: '오픈일 미정', dday: '-' },
  { id: 'p11', name: '카드사 제휴 포인트 정산 연동', stage: '처리중', stageType: 'prog', role: '개발', openDate: '2026/05/00', dday: 'D-45' },
  { id: 'p12', name: '모바일 영수증 OCR 도입', stage: '테스트', stageType: 'test', role: 'QA', openDate: '2026/04/00', dday: 'D-10' },
]

export const notifications = [
  // 프로젝트 알림 — 배정 / 마감 / 지연
  {
    id: 'n1',
    tab: 'project',
    tag: '마감안내',
    projectName: '프로모션 운영 프로세스 및 기능 개선',
    projectId: 'p3',
    message: '「단위 테스트」의 마감일이 2일 남았습니다.',
    datetime: '2026-05-12, 11:45AM',
    dateGroup: '2026-05-12 화요일',
    route: '/project/wbs',
    read: false,
  },
  {
    id: 'n2',
    tab: 'project',
    tag: '배정안내',
    projectName: '프로모션 운영 프로세스 및 기능 개선',
    projectId: 'p3',
    message: '「프로모션 운영 프로세스 및 기능 개선」의 개발 담당자로 배정되었습니다.',
    datetime: '2026-05-12, 11:45AM',
    dateGroup: '2026-05-10 월요일',
    route: '/project/wbs',
    read: false,
  },
  {
    id: 'n3',
    tab: 'project',
    tag: '지연',
    projectName: 'DL이앤씨 바우처 정책 변경_숙박바우처',
    projectId: 'p2',
    message: '「바우처 특복 배정 개발」 업무가 지연 상태로 변경되었습니다.',
    datetime: '2026-05-11, 09:20AM',
    dateGroup: '2026-05-11 일요일',
    route: '/project/wbs',
    read: true,
  },
  // 변경 알림
  {
    id: 'n4',
    tab: 'change',
    tag: '변경안내',
    projectName: '프로모션 운영 프로세스 및 기능 개선',
    projectId: 'p3',
    message: '담당자 / 요구사항 / DEV테스트가 변경되었습니다.',
    datetime: '2026-05-12, 11:45AM',
    dateGroup: '2026-05-12 화요일',
    route: '/project/history',
    read: false,
  },
  {
    id: 'n5',
    tab: 'change',
    tag: '변경안내',
    projectName: '주문취소 시 쿠폰 할인취소 정보 노출 개선',
    projectId: 'p1',
    message: '요구사항이 추가되었습니다.',
    datetime: '2026-05-11, 04:10PM',
    dateGroup: '2026-05-11 일요일',
    route: '/project/history',
    read: true,
  },
  {
    id: 'n6',
    tab: 'change',
    tag: '변경안내',
    projectName: 'DL이앤씨 바우처 정책 변경_숙박바우처',
    projectId: 'p2',
    message: 'WBS 일정이 변경되었습니다.',
    datetime: '2026-05-10, 02:30PM',
    dateGroup: '2026-05-10 월요일',
    route: '/project/history',
    read: true,
  },
  // 승인 알림
  {
    id: 'n7',
    tab: 'approval',
    tag: '승인요청',
    projectName: '프로모션 운영 프로세스 및 기능 개선',
    projectId: 'p3',
    message: '「프로모션 운영 프로세스 및 기능 개선」의 일정변경 승인요청 건이 있습니다.',
    datetime: '2026-05-12, 11:45AM',
    dateGroup: '2026-05-12 화요일',
    route: '/admin/approval',
    read: false,
  },
  {
    id: 'n8',
    tab: 'approval',
    tag: '승인결과',
    projectName: '프로모션 운영 프로세스 및 기능 개선',
    projectId: 'p3',
    message: '「프로모션 등록 개발」 WBS 일정 등록이 승인되었습니다.',
    datetime: '2026-05-12, 11:45AM',
    dateGroup: '2026-05-12 화요일',
    route: '/project/wbs',
    read: true,
  },
  {
    id: 'n9',
    tab: 'approval',
    tag: '승인결과',
    projectName: '주문취소 시 쿠폰 할인취소 정보 노출 개선',
    projectId: 'p1',
    message: '「DEV테스트 시나리오」 변경 요청이 반려되었습니다.',
    datetime: '2026-05-10, 03:20PM',
    dateGroup: '2026-05-10 월요일',
    route: '/project/wbs',
    read: true,
  },
]

export const notificationTabs = [
  { id: 'project', label: '프로젝트 알림' },
  { id: 'change', label: '변경 알림' },
  { id: 'approval', label: '승인 알림' },
]

export const notificationTagClass = {
  마감안내: 'deadline',
  배정안내: 'assign',
  지연: 'delay',
  변경안내: 'change',
  승인요청: 'request',
  승인결과: 'result',
}


/** 내정보 기본 프로필 (POP-M-COM-07) */
export const defaultUserProfile = {
  id: '2024001',
  name: '김현대',
  phone: '010-1234-5678',
  dept: 'IT기획팀',
  email: '2024001@ezwel.com',
  role: '개발자',
  position: '책임',
  lastLogin: '2026/03/20 09:12',
}
