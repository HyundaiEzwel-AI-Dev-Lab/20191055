// 프로젝트 변경이력 공용 목업
// PAG-M-PST-03 (통합·전체) / PAG-S-INF-05 (개별·현재 프로젝트)

export const projectHistoryMeta = {
  hint: '변경구분별 상세 양식',
  integratedHint: '전체 프로젝트 변경이력을 조회합니다.',
  projectHint: '현재 프로젝트의 변경이력을 조회합니다.',
}

export const changeCategoryOptions = ['전체', '요구사항', '프로젝트', 'WBS', '담당자', '테스트']
export const changePeriodOptions = [
  { label: '오늘', value: 'today', days: 0 },
  { label: '최근 3일', value: '3d', days: 3 },
  { label: '최근 1주일', value: '7d', days: 7 },
  { label: '최근 1개월', value: '1m', days: 30 },
  { label: '3개월', value: '3m', months: 3 },
  { label: '전체', value: 'all', months: null },
]
export { pageSizeOptions } from './commonOptions'

export const historyDevDeptOptions = [
  '전체',
  'e커머스팀',
  '플랫폼팀',
  '고객사운영팀',
  'IT개발팀',
  '백오피스팀',
  '테크기획팀',
]

const baseDate = new Date('2026-06-23')

const projectMeta = {
  p6: {
    code: 'PJ1010',
    name: '전사 프로젝트 관리 시스템 구축',
    devDept: '플랫폼팀',
  },
  p1: {
    code: 'PJ1018',
    name: '주문취소 시 쿠폰 할인취소 정보 노출 개선',
    devDept: '플랫폼팀',
  },
  default: {
    code: 'PJ1020',
    name: '프로모션 운영 프로세스 및 기능 개선',
    devDept: 'e커머스팀',
  },
}

function daysAgo(n) {
  const d = new Date(baseDate)
  d.setDate(d.getDate() - n)
  const date = d.toISOString().slice(0, 10)
  const time = `${String(9 + (n % 8)).padStart(2, '0')}:${String((n * 7) % 60).padStart(2, '0')}:30`
  return { date, time, full: `${date} ${time}` }
}

function resolveMeta(projectId, projectName) {
  const meta = projectMeta[projectId] || {
    ...projectMeta.default,
    code: `PJ-${String(projectId || 'X').toUpperCase()}`,
  }
  return {
    projectKey: projectId,
    projectCode: meta.code,
    projectName: projectName || meta.name,
    devDept: meta.devDept,
  }
}

function enrichRows(projectId, rows, projectName) {
  const meta = resolveMeta(projectId, projectName)
  return rows.map((row) => ({ ...row, ...meta }))
}

const historyByProject = {
  p6: [
    {
      id: 'ph-p6-1',
      category: '프로젝트',
      item: '오픈예정일',
      changedAt: daysAgo(7).full,
      changedBy: '김현대',
      changedByDept: '웹기획팀',
      changeLines: [{ label: '오픈예정일', before: '2026-09-01', after: '2026-09-30' }],
      detail: {
        title: '오픈예정일 변경',
        body: '일정 협의에 따라 오픈예정일이 조정되었습니다.',
        fields: [
          { label: '변경 전', value: '2026-09-01' },
          { label: '변경 후', value: '2026-09-30' },
          { label: '사유', value: 'UAT 일정 반영' },
        ],
      },
    },
    {
      id: 'ph-p6-2',
      category: '프로젝트',
      item: '프로젝트명',
      changedAt: daysAgo(12).full,
      changedBy: '권선희',
      changedByDept: '테크기획팀',
      changeLines: [
        {
          label: '프로젝트명',
          before: '전사 PMS 구축',
          after: '전사 프로젝트 관리 시스템 구축',
        },
      ],
      detail: {
        title: '프로젝트명 변경',
        body: '공식 명칭 확정에 따른 프로젝트명 변경',
        fields: [
          { label: '변경 전', value: '전사 PMS 구축' },
          { label: '변경 후', value: '전사 프로젝트 관리 시스템 구축' },
        ],
      },
    },
    {
      id: 'ph-p6-3',
      category: '요구사항',
      item: '이슈등록',
      changedAt: daysAgo(18).full,
      changedBy: '김현대',
      changedByDept: '웹기획팀',
      changeLines: [{ label: '이슈', before: '-', after: '테스트 라이브러리 연동 범위 협의' }],
      detail: {
        title: '요구사항 이슈 등록',
        body: 'REQ-012 · 테스트 라이브러리 시나리오 매핑 이슈 등록',
        fields: [
          { label: '요구사항 ID', value: 'REQ-012' },
          { label: '이슈 내용', value: '테스트 라이브러리 연동 범위 협의 필요' },
        ],
      },
    },
    {
      id: 'ph-p6-4',
      category: 'WBS',
      item: '일정변경',
      changedAt: daysAgo(25).full,
      changedBy: '이현대',
      changedByDept: '플랫폼팀',
      changeLines: [
        { label: 'WBS-003', before: '2026-05-01 ~ 2026-05-20', after: '2026-05-10 ~ 2026-05-28' },
      ],
      detail: {
        title: 'WBS 일정변경',
        body: 'WBS-003 API 개발 일정 변경',
        fields: [
          { label: '업무', value: 'WBS-003 로그인 API 개발' },
          { label: '변경 전', value: '2026-05-01 ~ 2026-05-20' },
          { label: '변경 후', value: '2026-05-10 ~ 2026-05-28' },
          { label: '사유', value: '선행 설계 지연' },
        ],
      },
    },
    {
      id: 'ph-p6-5',
      category: '담당자',
      item: '테스터 변경',
      changedAt: daysAgo(32).full,
      changedBy: '권선희',
      changedByDept: '테크기획팀',
      changeLines: [{ label: '테스트', before: '김현대(상품기획팀)', after: '이현대(상품기획팀)' }],
      detail: {
        title: '테스터 변경',
        body: '테스트 담당자 교체',
        fields: [
          { label: '변경 전', value: '김현대 / 상품기획팀' },
          { label: '변경 후', value: '이현대 / 상품기획팀' },
          { label: '적용일', value: '2026-06-01' },
        ],
      },
    },
    {
      id: 'ph-p6-6',
      category: '테스트',
      item: '시나리오 등록',
      changedAt: daysAgo(40).full,
      changedBy: '박테스트',
      changedByDept: 'QA팀',
      changeLines: [{ label: '케이스', before: '-', after: 'TC-001 복지혜택 신청 정상 플로우' }],
      detail: {
        title: '시나리오 등록',
        body: 'DEV 테스트 시나리오 1건 등록',
        fields: [
          { label: '케이스 ID', value: 'TC-001' },
          { label: '케이스명', value: '복지혜택 신청 정상 플로우' },
        ],
      },
    },
  ],
  p1: [
    {
      id: 'ph-p1-1',
      category: '프로젝트',
      item: '처리단계',
      changedAt: daysAgo(5).full,
      changedBy: '김현대',
      changedByDept: '웹기획팀',
      changeLines: [{ label: '처리단계', before: '처리중', after: '테스트' }],
      detail: {
        title: '처리단계 변경',
        fields: [
          { label: '변경 전', value: '처리중' },
          { label: '변경 후', value: '테스트' },
        ],
      },
    },
    {
      id: 'ph-p1-2',
      category: 'WBS',
      item: '일정변경',
      changedAt: daysAgo(14).full,
      changedBy: '이현대',
      changedByDept: '플랫폼팀',
      changeLines: [
        { label: 'WBS-012', before: '2026-04-01 ~ 2026-04-15', after: '2026-04-05 ~ 2026-04-18' },
      ],
      detail: {
        title: 'WBS 일정변경',
        body: '쿠폰 화면 퍼블 일정 조정',
        fields: [
          { label: '업무', value: 'WBS-012 쿠폰 UI 퍼블' },
          { label: '변경 전', value: '2026-04-01 ~ 2026-04-15' },
          { label: '변경 후', value: '2026-04-05 ~ 2026-04-18' },
        ],
      },
    },
  ],
}

function defaultHistory(projectId) {
  const d1 = daysAgo(10)
  const d2 = daysAgo(22)
  return [
    {
      id: `ph-${projectId}-1`,
      category: '프로젝트',
      item: '등록',
      changedAt: d2.full,
      changedBy: '김현대',
      changedByDept: 'IT기획팀',
      changeLines: [{ label: '상태', before: '-', after: '접수' }],
      detail: {
        title: '프로젝트 등록',
        body: '프로젝트 최초 등록',
        fields: [{ label: '처리단계', value: '접수' }],
      },
    },
    {
      id: `ph-${projectId}-2`,
      category: '프로젝트',
      item: '오픈예정일',
      changedAt: d1.full,
      changedBy: '김현대',
      changedByDept: 'IT기획팀',
      changeLines: [{ label: '오픈예정일', before: '-', after: '2026-10-31' }],
      detail: {
        title: '오픈예정일 등록',
        fields: [{ label: '오픈예정일', value: '2026-10-31' }],
      },
    },
  ]
}

export function getProjectHistory(projectId, projectName = '') {
  const raw = historyByProject[projectId] || defaultHistory(projectId)
  return enrichRows(projectId, JSON.parse(JSON.stringify(raw)), projectName)
}

/** 통합관리: 전체 프로젝트 변경이력 */
export function getAllProjectHistory() {
  const keys = Object.keys(historyByProject)
  const rows = keys.flatMap((id) => getProjectHistory(id))
  rows.push(...getProjectHistory('p-demo', '프로모션 운영 프로세스 및 기능 개선'))
  return rows.sort((a, b) => String(b.changedAt).localeCompare(String(a.changedAt)))
}

function parseChangedAt(value) {
  return new Date(value.replace(' ', 'T'))
}

function withinPeriod(changedAt, periodValue) {
  const opt = changePeriodOptions.find((o) => o.value === periodValue)
  if (!opt) return true
  if (opt.value === 'all') return true
  const changed = parseChangedAt(changedAt)
  const from = new Date(baseDate)
  from.setHours(0, 0, 0, 0)
  if (opt.days === 0) {
    return changed.toDateString() === baseDate.toDateString()
  }
  if (opt.days != null) {
    from.setDate(from.getDate() - opt.days)
    return changed >= from && changed <= baseDate
  }
  if (opt.months != null) {
    from.setMonth(from.getMonth() - opt.months)
    return changed >= from && changed <= baseDate
  }
  return true
}

export function matchHistoryFilters(row, filters) {
  if (filters.category !== '전체' && row.category !== filters.category) return false
  if (filters.devDept && filters.devDept !== '전체' && row.devDept !== filters.devDept) return false
  if (filters.projectQuery) {
    const q = filters.projectQuery.trim().toLowerCase()
    const hay = `${row.projectCode || ''} ${row.projectName || ''}`.toLowerCase()
    if (!hay.includes(q)) return false
  }
  if (filters.keyword) {
    const q = filters.keyword.trim().toLowerCase()
    const hay = [row.item, row.changedBy, row.category, ...(row.changeLines || []).map((l) => l.label)]
      .join(' ')
      .toLowerCase()
    if (!hay.includes(q)) return false
  }
  if (!withinPeriod(row.changedAt, filters.period)) return false
  return true
}

export function splitDateTime(changedAt) {
  const [date, time] = changedAt.split(' ')
  return { date, time }
}
