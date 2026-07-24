// 프로젝트 변경이력 공용 목업
// PAG-M-PST-03 (통합·전체) / PAG-S-INF-05 (개별·현재 프로젝트)
// SB 49~54 Case 템플릿: 1-1 설정값 · 1-2 이슈 · 2 WBS · 3-1 우선순위/상태 · 3-2 이슈 · 3-3 상세변경
import { EMPTY_DATA_USER_ID } from './mockUsers'

export const projectHistoryMeta = {
  hint: '변경구분별 상세 양식',
  integratedHint: '전체 프로젝트 변경이력을 조회합니다.',
  projectHint: '현재 프로젝트의 변경이력을 조회합니다.',
}

/** SB 48: 전체 / 요구사항 / 프로젝트 / WBS */
export const changeCategoryOptions = ['전체', '요구사항', '프로젝트', 'WBS']
export const changePeriodOptions = [
  { label: '오늘', value: 'today', days: 0 },
  { label: '최근 3일', value: '3d', days: 3 },
  { label: '최근 1주일', value: '7d', days: 7 },
  { label: '최근 1개월', value: '1m', days: 30 },
  { label: '3개월', value: '3m', months: 3 },
  { label: '전체', value: 'all', months: null },
]
export { pageSizeOptions } from './commonOptions'

/** 목업 기준일 (조회 ‘오늘’) */
export const historyBaseDate = '2026-06-23'

function toYmd(d) {
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

/** 기간 프리셋 → 시작일/종료일 (종료일 = 기준일) */
export function getPeriodDateRange(periodValue, base = historyBaseDate) {
  const end = new Date(`${base}T00:00:00`)
  const start = new Date(end)
  const opt = changePeriodOptions.find((o) => o.value === periodValue)
  if (!opt || opt.value === 'all') {
    return { from: '', to: '' }
  }
  if (opt.days === 0) {
    return { from: toYmd(end), to: toYmd(end) }
  }
  if (opt.days != null) {
    start.setDate(start.getDate() - opt.days)
    return { from: toYmd(start), to: toYmd(end) }
  }
  if (opt.months != null) {
    start.setMonth(start.getMonth() - opt.months)
    return { from: toYmd(start), to: toYmd(end) }
  }
  return { from: '', to: '' }
}

/** 기본 필터 (최근 1개월 + 달력 범위) */
export function createHistoryDefaultFilters() {
  const range = getPeriodDateRange('1m')
  return {
    category: '전체',
    period: '1m',
    dateFrom: range.from,
    dateTo: range.to,
    keyword: '',
    projectQuery: '',
    devDept: '전체',
  }
}

export const historyDevDeptOptions = [
  '전체',
  'e커머스팀',
  '플랫폼팀',
  '고객사운영팀',
  'IT개발팀',
  '백오피스팀',
  '테크기획팀',
]

/** 상세 바로가기 대상 화면 */
export const HISTORY_DETAIL_ROUTE = {
  projectSetting: '/project/info',
  projectIssue: '/project/info',
  wbs: '/project/wbs',
  reqPriority: '/project/requirement',
  reqIssue: '/project/requirement',
  reqDetail: '/project/requirement',
  generic: '/project/info',
}

/** 펼침 템플릿 키 (뷰 분기용) */
export const HISTORY_TEMPLATE = {
  projectSetting: 'projectSetting',
  projectIssue: 'projectIssue',
  wbs: 'wbs',
  reqPriority: 'reqPriority',
  reqIssue: 'reqIssue',
  reqDetail: 'reqDetail',
  generic: 'generic',
}

const REQ_DETAIL_BEFORE = `1. 코너기간 설정 시 프로모션 기간 내에서만 설정 가능
2. 코너기간 중복 등록 시 우선순위가 높은 코너로 자동 노출
3. 코너 시작일이 프로모션 시작일보다 빠를 경우 등록 불가 (에러 alert 노출)
4. 코너 종료일이 프로모션 종료일보다 늦을 경우 등록 불가 (에러 alert 노출)
5. 코너기간 수정 시, 기존 노출 중인 상품 리스트는 초기화되지 않고 유지
6. 코너기간 삭제 시, 연결된 상품의 노출 여부도 함께 비노출 처리
 ※ 단, 타 코너에 중복 등록된 상품은 예외
7. 관리자 화면에서 코너기간 필터 조회 시 프로모션 기간 기준으로만 조회 가능
8. 코너별 최대 등록 가능 기간: 90일
9. 90일 초과 설정 시 등록 불가 alert 노출
10. 코너기간 변경 이력은 별도 관리하지 않음`

const REQ_DETAIL_AFTER = `1. 코너기간 설정 시 프로모션 기간 이외 기간으로도 설정 가능 (사전 예약 노출 대응)
2. 코너기간 중복 등록 시 우선순위가 높은 코너로 자동 노출 (기존 동일)
3. 코너 시작일이 프로모션 시작일보다 빠른 경우도 등록 허용 (사전 노출 목적)
 ※ 단, 실제 노출은 프로모션 오픈 이후부터 적용
4. 코너 종료일이 프로모션 종료일보다 늦은 경우도 등록 허용 (사후 유지 목적)
 ※ 단, 프로모션 종료 후에는 '종료 예정' 뱃지 노출
5. 코너기간 수정 시, 기존 노출 중인 상품 리스트는 초기화되지 않고 유지 (기존 동일)
6. 코너기간 삭제 시, 연결된 상품의 노출 여부도 함께 비노출 처리 (기존 동일)
 ※ 단, 타 코너에 중복 등록된 상품은 예외 (기존 동일)
7. 관리자 화면에서 코너기간 필터 조회 시 전체 기간 기준으로 조회 가능하도록 확장
8. 코너별 최대 등록 가능 기간: 180일로 확장
9. 180일 초과 설정 시 등록 불가 alert 노출
10. 코너기간 변경 시 변경 이력을 프로젝트 변경이력에 자동 적재 (신규)
11. 변경 사유 입력 필수화 (신규)`

const baseDate = new Date('2026-06-23')

const projectMeta = {
  p3: {
    code: 'PJ1201',
    name: '프로모션 운영 프로세스 및 기능 개선',
    devDept: 'e커머스팀',
  },
  p1: {
    code: 'PJ1220',
    name: '주문취소 시 쿠폰 할인취소 정보 표기',
    devDept: '플랫폼팀',
  },
  p2: {
    code: 'PJ1215',
    name: 'DL이앤씨 바우처 정책 변경 개발',
    devDept: '플랫폼팀',
  },
  p6: {
    code: 'PJ1010',
    name: '전사 프로젝트 관리 시스템 구축',
    devDept: '플랫폼팀',
  },
  default: {
    code: 'PJ1201',
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
  return rows.map((row) => ({
    ...row,
    ...meta,
    template: row.template || resolveHistoryTemplate(row),
  }))
}

/** category·item 기준 상세 템플릿 키 (SB 49~54 Case) */
export function resolveHistoryTemplate(row) {
  if (row?.template) return row.template
  const cat = row.category || ''
  const item = row.item || ''
  if (cat === 'WBS') return 'wbs'
  if (cat === '프로젝트') {
    if (item.includes('이슈')) return 'projectIssue'
    return 'projectSetting'
  }
  if (cat === '요구사항') {
    if (item.includes('이슈')) return 'reqIssue'
    if (item.includes('상세')) return 'reqDetail'
    return 'reqPriority'
  }
  return 'generic'
}

/** 요구사항 표기: 명 (ID) */
export function formatReqLabel(rowOrChg) {
  const name = rowOrChg?.reqName || rowOrChg?.requirementName || ''
  const id = rowOrChg?.reqId || rowOrChg?.requirementId || rowOrChg?.requirement || ''
  if (name && id) return `${name} (${id})`
  if (name) return name
  if (id) return String(id)
  return '-'
}

/** 상세보기 이동 경로 */
export function detailRouteForHistory(row) {
  const kind = resolveHistoryTemplate(row)
  return HISTORY_DETAIL_ROUTE[kind] || HISTORY_DETAIL_ROUTE.generic
}

/** WBS는 승인완료만 목록 노출 */
function isVisibleHistoryRow(row) {
  if (resolveHistoryTemplate(row) !== 'wbs') return true
  return row.approvalStatus === '승인완료'
}

/**
 * SB Case 1-1 ~ 3-3 전체 목업 생성
 * @param {string} prefix id prefix (예: ph-p3)
 * @param {{ includeHiddenWbs?: boolean }} [opts]
 */
export function buildHistoryCases(prefix, opts = {}) {
  const { includeHiddenWbs = true } = opts
  const rows = [
    // Case 1-1) 프로젝트 설정값 — 오픈예정일
    {
      id: `${prefix}-setting-open`,
      category: '프로젝트',
      item: '오픈예정일',
      template: 'projectSetting',
      changedAt: daysAgo(7).full,
      changedBy: '김현대',
      changedByDept: '웹기획팀',
      changeLines: [{ label: '오픈예정일', before: '2026/06/01', after: '2026/07/01' }],
      setting: { field: '오픈예정일', before: '2026/06/01', after: '2026/07/01' },
    },
    // Case 1-1) 프로젝트 설정값 — 테스트사용여부
    {
      id: `${prefix}-setting-test`,
      category: '프로젝트',
      item: '테스트사용여부',
      template: 'projectSetting',
      changedAt: daysAgo(12).full,
      changedBy: '권선희',
      changedByDept: '테크기획팀',
      changeLines: [{ label: '테스트사용여부', before: '단위테스트', after: '단위테스트, DEV테스트' }],
      setting: {
        field: '테스트사용여부',
        before: '단위테스트',
        after: '단위테스트, DEV테스트',
      },
    },
    // Case 1-2) 프로젝트 이슈등록
    {
      id: `${prefix}-project-issue`,
      category: '프로젝트',
      item: '이슈등록',
      template: 'projectIssue',
      changedAt: daysAgo(5).full,
      changedBy: '김현대',
      changedByDept: '웹기획팀',
      changeLines: [{ label: '이슈', before: '-', after: 'Spec Out' }],
      issueBody: '특별포인트 온라인 정산 프로세스와 동일하므로 Spec Out',
    },
    // Case 2) WBS — 승인완료 (다건 리스트)
    {
      id: `${prefix}-wbs-plan`,
      category: 'WBS',
      item: '계획일정',
      template: 'wbs',
      approvalStatus: '승인완료',
      changedAt: daysAgo(9).full,
      changedBy: '이현대',
      changedByDept: '플랫폼팀',
      changeLines: [
        { label: '계획일정', before: '2026/06/01-2026/06/30', after: '2026/06/10-2026/07/10' },
      ],
      wbsChanges: [
        {
          changeItem: '계획일정',
          taskName: 'HIMS / 주문 / 주문내역상세',
          system: 'HIMS',
          biz: '주문',
          screen: '주문내역상세',
          reqName: '주문상세 내역 수정',
          reqId: '4684',
          before: '2026/06/01-2026/06/30',
          after: '2026/06/10-2026/07/10',
          reason: '업무 우선순위 변경 (4월 첫주 프로젝트 A 우선 개발 진행)',
        },
        {
          changeItem: '계획일정',
          taskName: 'HIMS / 주문 / 주문취소',
          system: 'HIMS',
          biz: '주문',
          screen: '주문취소',
          reqName: '주문취소 쿠폰 반영',
          reqId: '4685',
          before: '2026/06/15-2026/07/05',
          after: '2026/06/20-2026/07/15',
          reason: '선행 화면 일정 연동',
        },
      ],
    },
    // Case 3-1) 요구사항 설정값 — 우선순위
    {
      id: `${prefix}-req-priority`,
      category: '요구사항',
      item: '우선순위',
      template: 'reqPriority',
      changedAt: daysAgo(4).full,
      changedBy: '권선희',
      changedByDept: '테크기획팀',
      changeLines: [{ label: '우선순위', before: '중', after: '상' }],
      reqName: '주문상세 내역 수정',
      reqId: '4684',
      fieldLabel: '우선순위',
      before: '중',
      after: '상',
      priority: { before: '중', after: '상' },
    },
    // Case 3-1) 요구사항 설정값 — 상태
    {
      id: `${prefix}-req-status`,
      category: '요구사항',
      item: '상태',
      template: 'reqPriority',
      changedAt: daysAgo(6).full,
      changedBy: '김현대',
      changedByDept: '웹기획팀',
      changeLines: [{ label: '상태', before: '검토', after: '수용' }],
      reqName: '로그인 SSO 연동',
      reqId: '4601',
      fieldLabel: '상태',
      before: '검토',
      after: '수용',
      priority: { before: '검토', after: '수용' },
    },
    // Case 3-2) 요구사항 이슈등록
    {
      id: `${prefix}-req-issue`,
      category: '요구사항',
      item: '이슈등록',
      template: 'reqIssue',
      changedAt: daysAgo(3).full,
      changedBy: '김현대',
      changedByDept: '웹기획팀',
      changeLines: [{ label: '이슈', before: '-', after: 'Spec Out' }],
      reqName: '주문상세 내역 수정',
      reqId: '4684',
      issueBody: '특별포인트 온라인 정산 프로세스와 동일하므로 Spec Out',
    },
    // Case 3-3) 요구사항 상세변경
    {
      id: `${prefix}-req-detail`,
      category: '요구사항',
      item: '상세변경',
      template: 'reqDetail',
      changedAt: daysAgo(8).full,
      changedBy: '김현대',
      changedByDept: '웹기획팀',
      changeLines: [{ label: '상세내용', before: '기간 내 설정', after: '기간 외 설정 가능' }],
      reqName: '프로모션 코너기간 설정',
      reqId: '4684',
      reason: '개발 검토 반영',
      beforeBody: REQ_DETAIL_BEFORE,
      afterBody: REQ_DETAIL_AFTER,
      reqDetail: {
        reason: '개발 검토 반영',
        before: REQ_DETAIL_BEFORE,
        after: REQ_DETAIL_AFTER,
      },
    },
  ]

  if (includeHiddenWbs) {
    // 승인요청 — 목록 미노출 (필터 검증용)
    rows.push({
      id: `${prefix}-wbs-pending`,
      category: 'WBS',
      item: '계획일정',
      template: 'wbs',
      approvalStatus: '승인요청',
      changedAt: daysAgo(2).full,
      changedBy: '이현대',
      changedByDept: '플랫폼팀',
      changeLines: [
        { label: '계획일정', before: '2026/06/01-2026/06/10', after: '2026/06/05-2026/06/15' },
      ],
      wbsChanges: [
        {
          changeItem: '계획일정',
          taskName: 'HIMS / 배치 / 스케줄',
          reqName: '배치 점검',
          reqId: '4690',
          before: '2026/06/01-2026/06/10',
          after: '2026/06/05-2026/06/15',
          reason: '인프라 점검 일정 반영',
        },
      ],
    })
  }

  return rows
}

/** 프로젝트별 이력 (미등록 id는 buildHistoryCases 기본셋) */
const historyByProject = {
  p3: buildHistoryCases('ph-p3'),
  p1: [
    ...buildHistoryCases('ph-p1', { includeHiddenWbs: false }).filter((r) =>
      ['projectSetting', 'wbs', 'reqPriority'].includes(r.template),
    ),
  ],
  p2: buildHistoryCases('ph-p2', { includeHiddenWbs: false }),
  p6: buildHistoryCases('ph-p6'),
}

function defaultHistory(projectId) {
  return buildHistoryCases(`ph-${projectId}`)
}

export function getProjectHistory(projectId, projectName = '', userId) {
  if (userId === EMPTY_DATA_USER_ID) return []
  const raw = historyByProject[projectId] || defaultHistory(projectId)
  return enrichRows(projectId, JSON.parse(JSON.stringify(raw)), projectName).filter(
    isVisibleHistoryRow,
  )
}

/** 통합관리: 전체 프로젝트 변경이력 */
export function getAllProjectHistory() {
  const ids = ['p3', 'p1', 'p2', 'p6', 'p4', 'p5']
  const rows = ids.flatMap((id) => getProjectHistory(id))
  return rows.sort((a, b) => String(b.changedAt).localeCompare(String(a.changedAt)))
}

function parseChangedAt(value) {
  return new Date(value.replace(' ', 'T'))
}

function withinDateRange(changedAt, dateFrom, dateTo) {
  if (!dateFrom && !dateTo) return true
  const changed = parseChangedAt(changedAt)
  const day = new Date(changed.getFullYear(), changed.getMonth(), changed.getDate())
  if (dateFrom) {
    const from = new Date(`${dateFrom}T00:00:00`)
    if (day < from) return false
  }
  if (dateTo) {
    const to = new Date(`${dateTo}T00:00:00`)
    if (day > to) return false
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
  if (filters.dateFrom || filters.dateTo) {
    if (!withinDateRange(row.changedAt, filters.dateFrom, filters.dateTo)) return false
  } else if (filters.period && filters.period !== 'all') {
    const range = getPeriodDateRange(filters.period)
    if (!withinDateRange(row.changedAt, range.from, range.to)) return false
  }
  return true
}

export function splitDateTime(value) {
  if (!value) return { date: '-', time: '' }
  const [date, time = ''] = String(value).split(' ')
  return { date, time }
}
