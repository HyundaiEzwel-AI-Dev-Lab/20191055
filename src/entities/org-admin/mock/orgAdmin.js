// 조직 관리 — 트리·조직장·대체 승인 목업 (h-pms org_units seed 기준, 인메모리)

export const orgAdminMeta = {
  hint: '승인자는 신청자 소속 팀의 팀장입니다. 팀장이 부재면 대체 승인 조직 팀장이 승인합니다.',
}

const KIND_LABELS = {
  COMPANY: '회사',
  DIVISION: '사업부·담당',
  TEAM: '팀',
  PART: '파트',
}

const ALLOWED_PARENT_KINDS = {
  DIVISION: ['COMPANY'],
  TEAM: ['COMPANY', 'DIVISION'],
  PART: ['DIVISION', 'TEAM'],
}

/** 테크 리소스·실적 조회가 이름으로 찾는 팀 — 이름 변경 불가 */
export const lockedOrgNames = [
  '플랫폼팀',
  'e커머스팀',
  '백오피스팀',
  '고객사운영팀',
  '인프라팀',
  '웹기획팀',
  '디자인팀',
  '전략보안팀',
]

export function orgUnitKindLabel(unitKind) {
  return KIND_LABELS[unitKind] ?? unitKind
}

export function canHaveLeader(unitKind) {
  return unitKind === 'TEAM'
}

export function isApprovalScope(unit) {
  return unit.unitKind === 'TEAM' && unit.techMemberCount > 0
}

export function creatableKindsUnder(parentKind) {
  return Object.keys(ALLOWED_PARENT_KINDS).filter((kind) => ALLOWED_PARENT_KINDS[kind].includes(parentKind))
}

export function canBeChildOf(unitKind, parentKind) {
  return (ALLOWED_PARENT_KINDS[unitKind] ?? []).includes(parentKind)
}

/** 조직장·지정 후보 (재직만 select에 노출) */
export const orgLeaders = [
  { userKey: 101, name: '박대표', position: '대표이사', status: '재직' },
  { userKey: 102, name: '김상품', position: '사업부장', status: '재직' },
  { userKey: 103, name: '이복지', position: '사업부장', status: '재직' },
  { userKey: 104, name: '최지원', position: '사업부장', status: '재직' },
  { userKey: 105, name: '정재경', position: '담당장', status: '재직' },
  { userKey: 106, name: '한테크', position: '담당장', status: '재직' },
  { userKey: 107, name: '오벤디스', position: '사업부장', status: '재직' },
  { userKey: 111, name: '한지민', position: '팀장', status: '재직' },
  { userKey: 112, name: '조현우', position: '팀장', status: '재직' },
  { userKey: 113, name: '송민재', position: '팀장', status: '재직' },
  { userKey: 114, name: '정하늘', position: '팀장', status: '재직' },
  { userKey: 115, name: '오세훈', position: '팀장', status: '재직' },
  { userKey: 116, name: '임지아', position: '팀장', status: '재직' },
  { userKey: 117, name: '강태영', position: '팀장', status: '재직' },
  { userKey: 118, name: '배수진', position: '팀장', status: '재직' },
  { userKey: 119, name: '노지훈', position: '팀장', status: '재직' },
  { userKey: 120, name: '서윤아', position: '팀장', status: '재직' },
  { userKey: 121, name: '문성호', position: '팀장', status: '재직' },
  { userKey: 122, name: '허은비', position: '팀장', status: '재직' },
  { userKey: 123, name: '남기욱', position: '팀장', status: '재직' },
  { userKey: 124, name: '유지혜', position: '팀장', status: '재직' },
  { userKey: 125, name: '신동욱', position: '팀장', status: '재직' },
  { userKey: 126, name: '차민서', position: '팀장', status: '재직' },
  { userKey: 127, name: '백승현', position: '팀장', status: '재직' },
  { userKey: 128, name: '고은별', position: '팀장', status: '재직' },
  { userKey: 129, name: '양지훈', position: '팀장', status: '재직' },
  { userKey: 130, name: '하준영', position: '팀장', status: '재직' },
  { userKey: 131, name: '류서연', position: '팀장', status: '재직' },
  { userKey: 132, name: '전지훈', position: '팀장', status: '재직' },
  { userKey: 133, name: '권선희', position: '책임', status: '재직' },
  { userKey: 134, name: '마도윤', position: '팀장', status: '재직' },
  { userKey: 135, name: '설하늘', position: '팀장', status: '재직' },
  { userKey: 136, name: '도민기', position: '팀장', status: '재직' },
  { userKey: 137, name: '배서현', position: '팀장', status: '재직' },
  { userKey: 138, name: '이현주', position: '선임', status: '재직' },
  { userKey: 139, name: '안지후', position: '팀장', status: '재직' },
  { userKey: 140, name: '윤다은', position: '팀장', status: '재직' },
  { userKey: 142, name: '홍서윤', position: '팀장', status: '재직' },
  { userKey: 201, name: '김현대', position: '책임', status: '재직' },
  { userKey: 202, name: '김외주', position: '연구원', status: '재직' },
]

const leaderByKey = Object.fromEntries(orgLeaders.map((u) => [u.userKey, u]))

function unit(id, name, parentId, unitKind, leaderUserKey = null, extra = {}) {
  const leader = leaderUserKey ? leaderByKey[leaderUserKey] : null
  return {
    id,
    name,
    parentId,
    unitKind,
    leaderUserKey,
    leaderName: leader?.name ?? null,
    active: extra.active ?? true,
    approvalFallback: extra.approvalFallback ?? false,
  }
}

const seedUnits = [
  unit(1, '현대이지웰', null, 'COMPANY', 101),
  unit(2, '상품사업부', 1, 'DIVISION', 102),
  unit(3, '복지컨설팅사업부', 1, 'DIVISION', 103),
  unit(4, '지원사업부', 1, 'DIVISION', 104),
  unit(5, '재경담당', 1, 'DIVISION', 105),
  unit(6, '테크담당', 1, 'DIVISION', 106),
  unit(7, '벤디스사업부', 1, 'DIVISION', 107),

  unit(10, '패션스포츠팀', 2, 'TEAM'),
  unit(11, '영화티켓팀', 2, 'TEAM', 111),
  unit(12, '디지털렌탈팀', 2, 'TEAM', 112),
  unit(13, '식품팀', 2, 'TEAM', 113),
  unit(14, '여행숙박팀', 2, 'TEAM', 114),
  unit(15, '제휴영업팀', 2, 'TEAM', 115),
  unit(16, '법인영업팀', 2, 'TEAM', 116),
  unit(17, '전략영업팀', 2, 'TEAM', 117),
  unit(18, '공공복지팀', 2, 'TEAM', 118),
  unit(19, '상품기획팀', 2, 'TEAM', 119),

  unit(20, '컨설팅1팀', 3, 'TEAM', 120),
  unit(21, '컨설팅2팀', 3, 'TEAM', 121),
  unit(22, '컨설팅3팀', 3, 'TEAM', 122),
  unit(23, '레저팀', 3, 'TEAM', 123),
  unit(24, '복지서비스기획팀', 3, 'TEAM', 124),
  unit(25, '복지디자인팀', 3, 'TEAM', 125),
  unit(26, '복지서비스지원팀', 3, 'TEAM', 126),
  unit(27, 'H Lab팀', 3, 'TEAM', 127),

  unit(28, '경영기획팀', 4, 'TEAM', 128),
  unit(29, '지원팀', 4, 'TEAM', 129),
  unit(30, '미래전략팀', 4, 'TEAM', 130),
  unit(31, 'Hcon팀', 4, 'TEAM', 131),
  unit(32, '고객서비스팀', 4, 'TEAM', 132),

  unit(33, '재경팀', 5, 'TEAM', 133),

  unit(34, '플랫폼팀', 6, 'TEAM', 134),
  unit(35, 'e커머스팀', 6, 'TEAM', 135),
  unit(36, '백오피스팀', 6, 'TEAM', 136),
  unit(37, '고객사운영팀', 6, 'TEAM', 137),
  unit(38, '인프라팀', 6, 'TEAM', 138),
  unit(39, '웹기획팀', 6, 'TEAM', 139, { approvalFallback: true }),
  unit(40, '디자인팀', 6, 'TEAM', 140),
  unit(41, '전략보안팀', 6, 'TEAM'),
  unit(43, '구)모바일기획팀', 6, 'TEAM', null, { active: false }),

  unit(42, '마케팅팀', 1, 'TEAM', 142),

  unit(50, '여행파트', 14, 'PART'),
  unit(51, '숙박파트', 14, 'PART'),
  unit(52, '헬스케어파트', 26, 'PART'),
  unit(53, '법인숙박파트', 26, 'PART'),
  unit(54, 'AX파트', 28, 'PART'),
  unit(55, 'CS운영파트', 32, 'PART'),
  unit(56, 'CS기획파트', 32, 'PART'),
  unit(57, '재무파트', 33, 'PART'),
  unit(58, '회계파트', 33, 'PART'),
  unit(59, '경영관리파트', 33, 'PART'),
  unit(60, '내부회계파트', 5, 'PART'),
  unit(61, '영업기획파트', 42, 'PART'),
  unit(62, '판매촉진파트', 42, 'PART'),
]

/** 소속 인원 (겸직 포함). orgUnitId null = 미소속 */
export const orgMembers = [
  { userKey: 101, name: '박대표', orgUnitId: 1, primary: true, tech: false },
  { userKey: 102, name: '김상품', orgUnitId: 2, primary: true, tech: false },
  { userKey: 103, name: '이복지', orgUnitId: 3, primary: true, tech: false },
  { userKey: 104, name: '최지원', orgUnitId: 4, primary: true, tech: false },
  { userKey: 105, name: '정재경', orgUnitId: 5, primary: true, tech: false },
  { userKey: 106, name: '한테크', orgUnitId: 6, primary: true, tech: true },
  { userKey: 107, name: '오벤디스', orgUnitId: 7, primary: true, tech: false },
  { userKey: 114, name: '정하늘', orgUnitId: 14, primary: true, tech: false },
  { userKey: 128, name: '고은별', orgUnitId: 28, primary: true, tech: false },
  { userKey: 132, name: '전지훈', orgUnitId: 32, primary: true, tech: false },
  { userKey: 133, name: '권선희', orgUnitId: 33, primary: true, tech: false },
  { userKey: 134, name: '마도윤', orgUnitId: 34, primary: true, tech: true },
  { userKey: 138, name: '이현주', orgUnitId: 38, primary: true, tech: true },
  { userKey: 139, name: '안지후', orgUnitId: 39, primary: true, tech: true },
  { userKey: 142, name: '홍서윤', orgUnitId: 42, primary: true, tech: false },
  { userKey: 301, name: '여행파트원', orgUnitId: 50, primary: true, tech: false },
  { userKey: 302, name: '최패션', orgUnitId: 10, primary: true, tech: false },
  { userKey: 303, name: '내부회계파트원', orgUnitId: 60, primary: true, tech: false },
  { userKey: 304, name: '벤디스사업부원', orgUnitId: 7, primary: true, tech: false },
  { userKey: 305, name: 'AX파트원', orgUnitId: 54, primary: true, tech: false },
  { userKey: 306, name: 'CS운영파트원', orgUnitId: 55, primary: true, tech: false },
  { userKey: 307, name: '재무파트원', orgUnitId: 57, primary: true, tech: false },
  { userKey: 310, name: '플랫폼팀원1', orgUnitId: 34, primary: true, tech: true },
  { userKey: 311, name: '플랫폼팀원2', orgUnitId: 34, primary: true, tech: true },
  { userKey: 312, name: '플랫폼팀원3', orgUnitId: 34, primary: true, tech: true },
  { userKey: 313, name: '플랫폼팀원4', orgUnitId: 34, primary: true, tech: true },
  { userKey: 320, name: 'e커머스팀원1', orgUnitId: 35, primary: true, tech: true },
  { userKey: 321, name: 'e커머스팀원2', orgUnitId: 35, primary: true, tech: true },
  { userKey: 322, name: 'e커머스팀원3', orgUnitId: 35, primary: true, tech: true },
  { userKey: 330, name: '백오피스팀원1', orgUnitId: 36, primary: true, tech: true },
  { userKey: 331, name: '백오피스팀원2', orgUnitId: 36, primary: true, tech: true },
  { userKey: 332, name: '백오피스팀원3', orgUnitId: 36, primary: true, tech: true },
  { userKey: 340, name: '고객사운영팀원1', orgUnitId: 37, primary: true, tech: true },
  { userKey: 341, name: '고객사운영팀원2', orgUnitId: 37, primary: true, tech: true },
  { userKey: 342, name: '고객사운영팀원3', orgUnitId: 37, primary: true, tech: true },
  { userKey: 350, name: '인프라팀원1', orgUnitId: 38, primary: true, tech: true },
  { userKey: 351, name: '인프라팀원2', orgUnitId: 38, primary: true, tech: true },
  { userKey: 352, name: '인프라팀원3', orgUnitId: 38, primary: true, tech: true },
  { userKey: 360, name: '웹기획팀원1', orgUnitId: 39, primary: true, tech: true },
  { userKey: 361, name: '웹기획팀원2', orgUnitId: 39, primary: true, tech: true },
  { userKey: 362, name: '웹기획팀원3', orgUnitId: 39, primary: true, tech: true },
  { userKey: 363, name: '웹기획팀원4', orgUnitId: 39, primary: true, tech: true },
  { userKey: 370, name: '디자인팀원1', orgUnitId: 40, primary: true, tech: true },
  { userKey: 371, name: '디자인팀원2', orgUnitId: 40, primary: true, tech: true },
  { userKey: 372, name: '디자인팀원3', orgUnitId: 40, primary: true, tech: true },
  { userKey: 380, name: '전략보안팀원1', orgUnitId: 41, primary: true, tech: true },
  { userKey: 381, name: '전략보안팀원2', orgUnitId: 41, primary: true, tech: true },
  { userKey: 390, name: '겸직 팀원', orgUnitId: 39, primary: true, tech: true },
  { userKey: 390, name: '겸직 팀원', orgUnitId: 34, primary: false, tech: true },
  { userKey: 201, name: '김현대', orgUnitId: 34, primary: true, tech: true },
]

function memberCountOf(id) {
  return orgMembers.filter((m) => m.orgUnitId === id).length
}

function techMemberCountOf(id) {
  return orgMembers.filter((m) => m.orgUnitId === id && m.tech).length
}

function withCounts(row) {
  return {
    ...row,
    memberCount: memberCountOf(row.id),
    techMemberCount: techMemberCountOf(row.id),
  }
}

/** 세션 동안 유지되는 인메모리 트리 */
export const orgUnits = seedUnits.map((row) => ({ ...row }))

let nextId = 200

export function listOrgUnits(includeInactive = false) {
  return orgUnits.filter((row) => includeInactive || row.active).map(withCounts)
}

export function listLeaderCandidates() {
  const seen = new Set()
  const list = []
  for (const user of orgLeaders) {
    if (user.status !== '재직' || seen.has(user.userKey)) continue
    seen.add(user.userKey)
    list.push({ userKey: user.userKey, name: user.name, position: user.position })
  }
  for (const member of orgMembers) {
    if (seen.has(member.userKey) || member.orgUnitId == null) continue
    seen.add(member.userKey)
    list.push({ userKey: member.userKey, name: member.name, position: member.tech ? '연구원' : '사원' })
  }
  return list
}

export function descendantIds(id, source = orgUnits) {
  const children = source.filter((row) => row.parentId === id)
  return children.flatMap((child) => [child.id, ...descendantIds(child.id, source)])
}

export function deactivationScope(id) {
  const ids = [id, ...descendantIds(id)]
  const units = orgUnits.filter((row) => ids.includes(row.id) && row.active)
  return {
    units: units.length,
    members: units.reduce((sum, row) => sum + memberCountOf(row.id), 0),
  }
}

function requireUnit(id) {
  const row = orgUnits.find((u) => u.id === id)
  if (!row) throw new Error('조직을 찾을 수 없습니다.')
  return row
}

export function assignOrgUnitLeader(id, leaderUserKey) {
  const row = requireUnit(id)
  if (!canHaveLeader(row.unitKind)) {
    throw new Error('조직장은 팀에만 지정할 수 있습니다.')
  }
  if (leaderUserKey == null) {
    row.leaderUserKey = null
    row.leaderName = null
    return withCounts(row)
  }
  const leader = listLeaderCandidates().find((u) => u.userKey === leaderUserKey)
  if (!leader) throw new Error('지정할 수 없는 사용자입니다.')
  row.leaderUserKey = leader.userKey
  row.leaderName = leader.name
  return withCounts(row)
}

export function createOrgUnit(parentId, name, unitKind) {
  const parent = requireUnit(parentId)
  if (!parent.active) throw new Error('비활성 조직 아래에는 신설할 수 없습니다.')
  if (!canBeChildOf(unitKind, parent.unitKind)) {
    throw new Error('선택한 상위 아래에 둘 수 없는 구분입니다.')
  }
  const created = unit(++nextId, name, parentId, unitKind)
  orgUnits.push(created)
  return withCounts(created)
}

export function renameOrgUnit(id, name) {
  const row = requireUnit(id)
  if (lockedOrgNames.includes(row.name)) {
    throw new Error('개발부서 코드와 이름이 연결된 조직은 이름을 바꿀 수 없습니다.')
  }
  row.name = name
  return withCounts(row)
}

export function moveOrgUnit(id, parentId) {
  const row = requireUnit(id)
  if (row.unitKind === 'COMPANY') throw new Error('회사는 옮길 수 없습니다.')
  if (id === parentId || descendantIds(id).includes(parentId)) {
    throw new Error('자기 자신이나 하위 조직 아래로는 옮길 수 없습니다.')
  }
  const parent = requireUnit(parentId)
  if (!parent.active) throw new Error('비활성 조직 아래로는 옮길 수 없습니다.')
  if (!canBeChildOf(row.unitKind, parent.unitKind)) {
    throw new Error('선택한 상위 아래로 옮길 수 없는 구분입니다.')
  }
  row.parentId = parentId
  return withCounts(row)
}

export function setOrgUnitActive(id, active) {
  const row = requireUnit(id)
  if (row.unitKind === 'COMPANY') throw new Error('회사는 비활성할 수 없습니다.')
  if (active) {
    row.active = true
    return withCounts(row)
  }
  const ids = [id, ...descendantIds(id)]
  orgUnits.forEach((unitRow) => {
    if (!ids.includes(unitRow.id) || !unitRow.active) return
    unitRow.active = false
    unitRow.approvalFallback = false
  })
  orgMembers.forEach((member) => {
    if (ids.includes(member.orgUnitId)) member.orgUnitId = null
  })
  return withCounts(row)
}

export function setOrgUnitApprovalFallback(id) {
  const row = requireUnit(id)
  if (!row.active) throw new Error('비활성 조직은 대체 승인 조직으로 지정할 수 없습니다.')
  if (row.unitKind !== 'TEAM') throw new Error('대체 승인 조직은 팀만 지정할 수 있습니다.')
  orgUnits.forEach((unitRow) => {
    unitRow.approvalFallback = unitRow.id === id
  })
  return withCounts(row)
}
