/** POP-M-DAS-02 요구사항 목록 목업 (대시보드·현황 공용) */

const samplePool = [
  {
    reqId: 'REQ-001',
    name: '고객사 맞춤페이지 신설',
    status: '수용',
    priority: '높음',
    registeredAt: '2026-01-05',
  },
  {
    reqId: 'REQ-002',
    name: '바우처 특복 배정 API',
    status: '접수',
    priority: '보통',
    registeredAt: '2026-01-12',
  },
  {
    reqId: 'REQ-003',
    name: '패널티 정책 안내 문구',
    status: '수용',
    priority: '낮음',
    registeredAt: '2026-02-03',
  },
  {
    reqId: 'REQ-004',
    name: '프로모션 정산 배치 개선',
    status: '수용',
    priority: '높음',
    registeredAt: '2026-02-18',
  },
  {
    reqId: 'REQ-005',
    name: '주문취소 쿠폰 복원',
    status: '반려',
    priority: '보통',
    registeredAt: '2026-03-01',
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
