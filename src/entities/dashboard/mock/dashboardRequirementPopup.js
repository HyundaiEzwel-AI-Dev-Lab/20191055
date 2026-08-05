/** POP-M-DAS-02 요구사항 목록 목업 (대시보드·현황 공용) */

const samplePool = [
  {
    reqId: 'REQ-001',
    name: '고객사 맞춤페이지 신설',
    systemPath: 'FO > 고객사/제도',
    screenPath: '개인정보 > 고객사관리',
    screenName: '고객사 맞춤페이지',
    reqType: '최초 요건',
    taskTypes: ['기획', '디자인', '퍼블리싱', '개발'],
    status: '수용',
    priority: '높음',
    registeredBy: '홍길동',
    registeredAt: '2026-01-05',
    original: '고객사별로 다른 맞춤페이지를 노출하고 싶습니다.',
    analysis: '고객사별 맞춤페이지 노출 조건 분석 · 고객사 코드 기준 템플릿 매핑 테이블 신설 필요',
  },
  {
    reqId: 'REQ-002',
    name: '바우처 특복 배정 API',
    systemPath: 'FO > 법인숙박',
    screenPath: '복지혜택 > 바우처',
    screenName: '바우처 배정',
    reqType: '최초 요건',
    taskTypes: ['개발'],
    status: '접수',
    priority: '보통',
    registeredBy: '김현대',
    registeredAt: '2026-01-12',
    original: '바우처 특별포인트를 선택 시 자동으로 배정해 주세요.',
    analysis: '바우처 특복 선택 시, 바우처 특별포인트 배정 상세 로직 정의 필요',
  },
  {
    reqId: 'REQ-003',
    name: '패널티 정책 안내 문구',
    systemPath: 'FO > 회원/로그인/SSO',
    screenPath: '정책안내 > 패널티',
    screenName: '패널티 안내',
    reqType: '추가 요구사항',
    taskTypes: ['퍼블리싱'],
    status: '수용',
    priority: '낮음',
    registeredBy: '이지윤',
    registeredAt: '2026-02-03',
    original: '패널티 정책 안내 문구가 이해하기 어렵다는 문의가 많습니다.',
    analysis: '안내 문구 오탈자 및 표현 개선',
  },
  {
    reqId: 'REQ-004',
    name: '프로모션 정산 배치 개선',
    systemPath: 'HIMS > 정산',
    screenPath: '정산 > 배치관리',
    screenName: '정산 배치 관리',
    reqType: '추가 요구사항',
    taskTypes: ['개발'],
    status: '수용',
    priority: '높음',
    registeredBy: '강병헌',
    registeredAt: '2026-02-18',
    original: '프로모션 정산 결과 반영이 하루 늦게 되는 문제가 있습니다.',
    analysis: '정산 배치 주기를 일 1회에서 시간 단위로 변경',
  },
  {
    reqId: 'REQ-005',
    name: '주문취소 쿠폰 복원',
    systemPath: 'FO > 주문클레임',
    screenPath: '주문 > 취소관리',
    screenName: '주문취소 관리',
    reqType: '최초 요건',
    taskTypes: ['기획', '개발'],
    status: '반려',
    priority: '보통',
    registeredBy: '홍길동',
    registeredAt: '2026-03-01',
    original: '주문취소 시 사용한 쿠폰이 자동으로 복원되지 않습니다.',
    analysis: '쿠폰 정책상 사용 완료 쿠폰은 복원 대상이 아니므로 반려',
  },
]

/** 프로젝트별 요구사항 (없으면 이름 해시로 샘플 조합) */
const byProjectId = {
  d1: [0, 1, 2],
  d2: [1, 3],
  d3: [0, 2, 4],
  ps27: [0, 3],
  ps26: [0, 3, 1],
  ps25: [4, 1],
  ps24: [2],
  ps23: [],
}

function pickIndexes(projectId) {
  if (Object.prototype.hasOwnProperty.call(byProjectId, projectId)) {
    return byProjectId[projectId]
  }
  if (!projectId) return [0, 1]
  let hash = 0
  for (let i = 0; i < projectId.length; i += 1) {
    hash = (hash + projectId.charCodeAt(i) * (i + 1)) % 7
  }
  if (hash === 0) return []
  const count = (hash % 3) + 1
  const start = hash % samplePool.length
  return Array.from({ length: count }, (_, i) => (start + i) % samplePool.length)
}

export function getDashboardRequirements(projectId) {
  return pickIndexes(projectId).map((idx, no) => ({
    no: no + 1,
    ...samplePool[idx],
  }))
}
