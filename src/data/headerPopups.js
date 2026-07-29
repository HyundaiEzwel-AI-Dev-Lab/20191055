// 헤더 팝업 목업 — POP-M-COM-04~07 (기획서 예시 기반)
import { EMPTY_DATA_USER_ID } from './mockUsers'

/** 최근 조회 프로젝트 (최대 10건) — POP-M-COM-04: 프로젝트ID, 오픈연-월, 프로젝트명, 요청자명 */
export const recentProjects = [
  { id: 'rp1', projectId: 'PJ1017', openMonth: '2026-04', requester: '김보성', name: '주문취소 시 쿠폰 할인취소 정보 노출 개선', stage: '테스트', stageType: 'test', route: '/workspace/info' },
  { id: 'rp2', projectId: 'PJ1016', openMonth: '2026-04', requester: '장현수', name: 'DL이앤씨 바우처 정책 변경_숙박바우처', stage: '처리중', stageType: 'prog', route: '/workspace/info' },
  { id: 'rp3', projectId: 'PJ1020', openMonth: '2026-06', requester: '차인일', name: '프로모션 운영 프로세스 및 기능 개선', stage: '협의중', stageType: 'prog', route: '/workspace/info' },
  { id: 'rp4', projectId: 'PJ1015', openMonth: '2026-05', requester: '전찬양', name: '모바일 앱 푸시 알림 고도화', stage: '개발', stageType: 'prog', route: '/workspace/info' },
  { id: 'rp5', projectId: 'PJ1014', openMonth: '2026-06', requester: '윤지현', name: '정산 시스템 리뉴얼', stage: '설계', stageType: 'prog', route: '/workspace/info' },
  { id: 'rp6', projectId: 'PJ1013', openMonth: '2026-01', requester: '권현대', name: '전사 프로젝트 관리 시스템 구축', stage: '접수', stageType: 'recv', route: '/workspace/info' },
  { id: 'rp7', projectId: 'PJ1012', openMonth: '2026-07', requester: '김보성', name: '농협카드 인앱 쇼핑몰', stage: '접수', stageType: 'recv', route: '/workspace/info' },
  { id: 'rp8', projectId: 'PJ1011', openMonth: '2026-07', requester: '장현수', name: '멤버십 등급 체계 개편', stage: '접수', stageType: 'recv', route: '/workspace/info' },
  { id: 'rp9', projectId: 'PJ1010', openMonth: '2026-08', requester: '차인일', name: '실시간 재고 연동 API 구축', stage: '접수', stageType: 'recv', route: '/workspace/info' },
  { id: 'rp10', projectId: 'PJ1007', openMonth: '2026-06', requester: '윤지현', name: 'CS 상담 이력 통합 조회', stage: '접수', stageType: 'recv', route: '/workspace/info' },
]

/** 통합 검색(프로젝트 전용) 대상 전체 프로젝트 — 최근조회 10건 + 그 외 프로젝트 */
export const searchableProjects = [
  ...recentProjects,
  { id: 'sp1', projectId: 'PJ1009', openMonth: '2026-03', requester: '이현대', name: '카드사 제휴 포인트 정산 연동', stage: '처리중', stageType: 'prog', route: '/workspace/info' },
  { id: 'sp2', projectId: 'PJ1008', openMonth: '2026-05', requester: '박현대', name: '이지웰 프렌즈 H.point 더블적립', stage: '테스트', stageType: 'test', route: '/workspace/info' },
  { id: 'sp3', projectId: 'PJ0026', openMonth: '2026-02', requester: '윤지현', name: '대전사랑몰 지역화폐 B2C몰 구축', stage: '완료', stageType: 'done', route: '/workspace/info' },
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

export function getMyProjects(userId) {
  if (userId === EMPTY_DATA_USER_ID) return []
  return myProjects
}

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
    route: '/workspace/wbs',
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
    route: '/workspace/wbs',
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
    route: '/workspace/wbs',
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
    route: '/workspace/history',
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
    route: '/workspace/history',
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
    route: '/workspace/history',
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
    route: '/system/approval',
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
    route: '/workspace/wbs',
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
    route: '/workspace/wbs',
    read: true,
  },
]

export function getNotifications(userId) {
  if (userId === EMPTY_DATA_USER_ID) return []
  return notifications
}

/**
 * 이슈 본문에서 @멘션 대상을 찾아 헤더 알림(프로젝트 알림 - 멘션)을 즉시 생성한다 (SB p.19).
 * @param {string} body 이슈/답글 본문
 * @param {{projectName: string, projectId?: string, route: string, scope: 'requirement' | 'project'}} ctx
 */
export function notifyMentionsInBody(body, ctx) {
  const match = /@([^\s@]+)/.exec(body || '')
  if (!match) return
  const mentionedName = match[1]
  const now = new Date()
  const pad = (n) => String(n).padStart(2, '0')
  const datetime = `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}, ${pad(now.getHours())}:${pad(now.getMinutes())}${now.getHours() < 12 ? 'AM' : 'PM'}`
  const dateGroup = `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`
  notifications.unshift({
    id: `n-mention-${Date.now()}`,
    tab: 'project',
    tag: ctx.scope === 'requirement' ? '요구사항 멘션' : '프로젝트 멘션',
    projectName: ctx.projectName,
    projectId: ctx.projectId || '',
    message: `${mentionedName}님을 언급한 이슈가 등록되었습니다. 「${ctx.projectName}」의 이슈에 멘션되었습니다. 내용을 확인하세요.`,
    datetime,
    dateGroup,
    route: ctx.route,
    read: false,
  })
}

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
  dept: '테크부문 웹기획팀',
  email: 'ezwe1234@ehyundai.com',
  role: '사용자',
  position: '선임',
  lastLogin: '2026-07-07 08:52',
}
