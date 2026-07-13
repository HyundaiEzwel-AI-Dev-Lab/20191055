// PAG-M-SYS-07 휴무일 관리

export const holidayMeta = {
  hint: '법정공휴일 · 회사휴무일 관리 (WBS 일정 산정 반영)',
}

export const holidayTypeOptions = ['전체', '법정공휴일', '회사휴무']
export const yearOptions = [2025, 2026, 2027]

export const holidayList = [
  { id: 'h1', date: '2026-01-01', name: '신정', type: '법정공휴일', note: '' },
  { id: 'h2', date: '2026-02-16', name: '설날 연휴', type: '법정공휴일', note: '연휴 시작' },
  { id: 'h3', date: '2026-02-17', name: '설날', type: '법정공휴일', note: '' },
  { id: 'h4', date: '2026-02-18', name: '설날 연휴', type: '법정공휴일', note: '연휴 종료' },
  { id: 'h5', date: '2026-03-01', name: '삼일절', type: '법정공휴일', note: '' },
  { id: 'h6', date: '2026-05-05', name: '어린이날', type: '법정공휴일', note: '' },
  { id: 'h7', date: '2026-05-24', name: '부처님오신날', type: '법정공휴일', note: '' },
  { id: 'h8', date: '2026-06-06', name: '현충일', type: '법정공휴일', note: '' },
  { id: 'h9', date: '2026-08-15', name: '광복절', type: '법정공휴일', note: '' },
  { id: 'h10', date: '2026-09-24', name: '추석 연휴', type: '법정공휴일', note: '' },
  { id: 'h11', date: '2026-09-25', name: '추석', type: '법정공휴일', note: '' },
  { id: 'h12', date: '2026-09-26', name: '추석 연휴', type: '법정공휴일', note: '' },
  { id: 'h13', date: '2026-10-03', name: '개천절', type: '법정공휴일', note: '' },
  { id: 'h14', date: '2026-10-09', name: '한글날', type: '법정공휴일', note: '' },
  { id: 'h15', date: '2026-12-25', name: '성탄절', type: '법정공휴일', note: '' },
  { id: 'h16', date: '2026-07-17', name: '창립기념일', type: '회사휴무', note: '전일 휴무' },
  { id: 'h17', date: '2026-12-31', name: '연말 특별휴무', type: '회사휴무', note: '' },
]

export function matchHolidayFilters(row, filters) {
  if (filters.year && !row.date.startsWith(String(filters.year))) return false
  if (filters.type !== '전체' && row.type !== filters.type) return false
  if (filters.keyword) {
    const q = filters.keyword.toLowerCase()
    if (!row.name.toLowerCase().includes(q) && !row.note.toLowerCase().includes(q)) return false
  }
  return true
}

export function holidayTypeClass(type) {
  return type === '법정공휴일' ? 'ok' : 'prog'
}
