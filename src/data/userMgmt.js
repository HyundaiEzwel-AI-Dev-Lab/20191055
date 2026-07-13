// PAG-M-SYS-01 사용자 관리

export const userMgmtMeta = {
  hint: '인사 DB 일배치 연동 · 사번 = 사용자 ID',
}

export const deptOptions = ['전체', '테크기획팀', '플랫폼팀', '개발팀', '디자인팀', '개발(외주)', '웹기획팀']
export const roleOptions = ['전체', '마스터', '관리자', '사용자', '미설정']
export const statusOptions = ['전체', '재직', '휴직', '퇴직', '잠금']
export const pageSizeOptions = [20, 50, 100]

export const userList = [
  {
    id: '20210315',
    name: '권선희',
    dept: '테크기획팀',
    role: '마스터',
    status: '재직',
    position: '책임',
    email: '20210315@ezwel.com',
    phone: '01012345678',
    failCount: 0,
    type: '임직원',
  },
  {
    id: '20180922',
    name: '이현주',
    dept: '테크기획팀',
    role: '관리자',
    status: '재직',
    position: '선임',
    email: '20180922@ezwel.com',
    phone: '01023456789',
    failCount: 0,
    type: '임직원',
  },
  {
    id: 'EXT-0451',
    name: '김외주',
    dept: '개발(외주)',
    role: '사용자',
    status: '재직',
    position: '연구원',
    email: 'partner.kim@ezwel.com',
    phone: '01034567890',
    failCount: 0,
    type: '외주',
  },
  {
    id: '20150133',
    name: '박퇴직',
    dept: '플랫폼팀',
    role: '미설정',
    status: '퇴직',
    position: '책임',
    email: '20150133@ezwel.com',
    phone: '01045678901',
    failCount: 0,
    type: '임직원',
  },
  {
    id: '2024001',
    name: '김현대',
    dept: 'IT기획팀',
    role: '사용자',
    status: '재직',
    position: '책임',
    email: '2024001@ezwel.com',
    phone: '01012345678',
    failCount: 0,
    type: '임직원',
  },
  {
    id: '2024002',
    name: '최잠금',
    dept: '플랫폼팀',
    role: '사용자',
    status: '잠금',
    position: '사원',
    email: '2024002@ezwel.com',
    phone: '01034567890',
    failCount: 5,
    type: '임직원',
  },
  {
    id: '2024003',
    name: '이휴직',
    dept: '웹기획팀',
    role: '사용자',
    status: '휴직',
    position: '선임',
    email: '2024003@ezwel.com',
    phone: '01045678901',
    failCount: 0,
    type: '임직원',
  },
  {
    id: '2024005',
    name: '오차단',
    dept: '개발팀',
    role: '사용자',
    status: '재직',
    position: '사원',
    email: '2024005@ezwel.com',
    phone: '01067890123',
    failCount: 5,
    type: '임직원',
  },
]

export function matchUserFilters(row, filters) {
  if (filters.keyword) {
    const q = filters.keyword.toLowerCase()
    if (!row.name.toLowerCase().includes(q) && !row.id.toLowerCase().includes(q)) return false
  }
  if (filters.dept !== '전체' && row.dept !== filters.dept) return false
  if (filters.role !== '전체' && row.role !== filters.role) return false
  if (filters.status !== '전체' && row.status !== filters.status) return false
  return true
}

export function userStatusClass(status) {
  if (status === '재직') return 'ok'
  if (status === '잠금') return 'err'
  if (status === '휴직') return 'warn'
  return 'muted'
}
