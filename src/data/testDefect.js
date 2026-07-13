// PAG-S-UAT-14 결함관리 목업

const baseDefects = [
  {
    id: 'df1',
    defectId: 'DF-2026-001',
    caseId: 'TC-002',
    caseName: '바우처 특복 배정 검증',
    screenName: '복지혜택 신청',
    round: '3차',
    stepNo: 2,
    title: '배정 API 500 오류',
    grade: 'Critical',
    status: '처리예정',
    tester: '김현대',
    assignee: '이개발',
    registeredAt: '2026-04-16 11:25',
    occurrencePhase: '오픈 전',
    deployStatus: 'DEV배포',
    description: '특복 선택 후 배정 API 호출 시 500 Internal Server Error 발생. FO 연동 구간 확인 필요.',
    stepProcedure: '배정 API 호출',
    history: [
      { id: 'h1', author: '김현대', role: '테스터', at: '2026-04-16 11:25', action: '등록', body: '오류 최초 등록' },
      { id: 'h2', author: '이개발', role: '담당자', at: '2026-04-16 14:00', action: '처리예정', body: 'API 로그 확인 중' },
    ],
  },
  {
    id: 'df2',
    defectId: 'DF-2026-002',
    caseId: 'TC-004',
    caseName: '대사 결과 다운로드',
    screenName: '정산 대사',
    round: '2차',
    stepNo: 3,
    title: '엑셀 컬럼 순서 불일치',
    grade: 'Minor',
    status: '처리완료',
    tester: '최테스트',
    assignee: '정개발',
    registeredAt: '2026-04-11 09:30',
    occurrencePhase: '오픈 전',
    deployStatus: 'STG배포',
    description: '다운로드 엑셀의 컬럼 순서가 화면 그리드와 불일치.',
    stepProcedure: '파일 내용 확인',
    history: [
      { id: 'h3', author: '최테스트', role: '테스터', at: '2026-04-11 09:30', action: '등록', body: '컬럼 순서 불일치' },
      { id: 'h4', author: '정개발', role: '담당자', at: '2026-04-12 10:00', action: '처리완료', body: '컬럼 매핑 수정 배포' },
    ],
  },
  {
    id: 'df3',
    defectId: 'DF-2026-003',
    caseId: 'TC-005',
    caseName: '카드결제 한도 초과',
    screenName: '카드결제',
    round: '3차',
    stepNo: 2,
    title: '재처리 요청 후 상태 미갱신',
    grade: 'Major',
    status: '접수',
    tester: '김현대',
    assignee: '박개발',
    registeredAt: '2026-04-19 15:45',
    occurrencePhase: '오픈 후',
    deployStatus: '운영배포',
    description: '재배포 후 결함 상태가 접수로 되돌아감.',
    stepProcedure: '결제 시도',
    history: [
      { id: 'h5', author: '김현대', role: '테스터', at: '2026-04-19 15:45', action: '등록', body: '상태 미갱신 확인' },
      { id: 'h6', author: '박개발', role: '담당자', at: '2026-04-20 09:00', action: '접수', body: 'STG 재배포 후 재확인 요청' },
    ],
  },
  {
    id: 'df4',
    defectId: 'DF-2026-004',
    caseId: 'TC-001',
    caseName: '복지혜택 신청 정상 플로우',
    screenName: '복지혜택 신청',
    round: '3차',
    stepNo: 3,
    title: '완료 메시지 문구 오타',
    grade: 'Minor',
    status: '접수',
    tester: '박테스트',
    assignee: '김현대',
    registeredAt: '2026-04-15 17:00',
    occurrencePhase: '오픈 전',
    deployStatus: 'DEV배포',
    description: '신청 완료 메시지에 오타(완료→완료됨) 수정 필요.',
    stepProcedure: '필수값 입력 후 저장',
    history: [
      { id: 'h7', author: '박테스트', role: '테스터', at: '2026-04-15 17:00', action: '등록', body: '문구 오타 등록' },
    ],
  },
]

const uatRoundMap = { '2차': 'STG', '3차': '운영1차' }

export function getDefectList(mode = 'dev') {
  return baseDefects.map((row) => ({
    ...row,
    round: mode === 'uat' ? (uatRoundMap[row.round] || row.round) : row.round,
  }))
}

export function matchDefectFilters(row, filters, config) {
  if (filters.round !== '전체' && row.round !== filters.round) return false
  if (filters.status !== '전체' && row.status !== filters.status) return false
  if (filters.grade !== '전체' && row.grade !== filters.grade) return false
  if (config.showDeployStatus && filters.deployStatus !== '전체' && row.deployStatus !== filters.deployStatus) return false
  if (filters.keyword) {
    const q = filters.keyword.toLowerCase()
    if (!`${row.defectId}${row.title}${row.caseName}`.toLowerCase().includes(q)) return false
  }
  return true
}

export function computeDefectKpi(rows) {
  return {
    total: rows.length,
    received: rows.filter((r) => r.status === '접수').length,
    scheduled: rows.filter((r) => r.status === '처리예정').length,
    done: rows.filter((r) => r.status === '처리완료').length,
    notError: rows.filter((r) => r.status === '오류아님').length,
    excluded: rows.filter((r) => r.status === '수정제외').length,
  }
}

let defectSeq = baseDefects.length

export function addDefect(payload, mode = 'dev') {
  defectSeq += 1
  const round =
    mode === 'uat' && payload.round
      ? uatRoundMap[payload.round] || payload.round
      : payload.round || '3차'
  const row = {
    id: `df-new-${Date.now()}`,
    defectId: `DF-2026-${String(defectSeq).padStart(3, '0')}`,
    status: '접수',
    registeredAt: new Date().toISOString().slice(0, 16).replace('T', ' '),
    occurrencePhase: payload.occurrencePhase || '오픈 전',
    deployStatus: payload.deployStatus || 'DEV배포',
    history: [
      {
        id: `h-${Date.now()}`,
        author: payload.tester || '김현대',
        role: '테스터',
        at: new Date().toISOString().slice(0, 16).replace('T', ' '),
        action: '등록',
        body: payload.description || payload.title,
      },
    ],
    ...payload,
    round,
  }
  baseDefects.unshift(row)
  return row
}

export function updateDefect(id, updates) {
  const row = baseDefects.find((d) => d.id === id)
  if (!row) return null
  Object.assign(row, updates)
  return row
}
