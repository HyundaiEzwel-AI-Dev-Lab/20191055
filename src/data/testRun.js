// PAG-S-UAT-09 테스트 수행 목업

function makeStepRows(procedures, testers, resultsMatrix) {
  return procedures.map((p, idx) => ({
    no: idx + 1,
    procedure: p.procedure,
    expected: p.expected,
    byTester: testers.reduce((acc, name, ti) => {
      acc[name] = resultsMatrix[idx]?.[ti] || {
        result: '대기',
        executedAt: null,
        fixStatus: null,
      }
      return acc
    }, {}),
  }))
}

const baseRuns = [
  {
    id: 'tr1',
    reqId: 'REQ-001',
    executionType: '오픈 전',
    caseId: 'CASE-001',
    caseName: '복지혜택 신청변경 (직원/임원)',
    screenName: '복지혜택 신청',
    systemPath: 'FO>법인숙박>여행레저>복지혜택',
    bizCategory: '법인숙박',
    round: '3차',
    planStart: '2026-04-01',
    planEnd: '2026-04-30',
    testers: ['김현대', '박테스트'],
    testerPlanDates: { 김현대: '2026-04-01', 박테스트: '2026-04-05' },
    stepTotal: 3,
    stepDone: 3,
    progress: 100,
    result: '정상',
    errorCount: 0,
    fixDone: 0,
    fixPending: 0,
    lastExecutedAt: '2026-04-15 16:30',
    note: '임직원/직원 구분 계정 필요',
    procedures: [
      { procedure: '숙박바우처 선택 시', expected: '바우처 특복 배정 확인' },
      { procedure: '페이지 하단 신청 정보 확인', expected: '복지혜택 : 숙박바우처 / 최종선택일 업데이트' },
      { procedure: 'ez체크인 > 체크인 상품 결제', expected: '바우처 특복 결제단 노출 및 사용 확인' },
    ],
    resultsMatrix: [
      [
        { result: '정상', executedAt: '2026-04-15', fixStatus: null },
        { result: '정상', executedAt: '2026-04-15', fixStatus: null },
      ],
      [
        { result: '정상', executedAt: '2026-04-15', fixStatus: null },
        { result: '정상', executedAt: '2026-04-16', fixStatus: null },
      ],
      [
        { result: '정상', executedAt: '2026-04-15', fixStatus: null },
        { result: '대기', executedAt: null, fixStatus: null },
      ],
    ],
  },
  {
    id: 'tr2',
    reqId: 'REQ-001',
    executionType: '오픈 전',
    caseId: 'CASE-002',
    caseName: "'최근신청내역'의 이용여부 확인",
    screenName: '복지혜택 신청',
    systemPath: 'FO>법인숙박>여행레저>복지혜택',
    bizCategory: '법인숙박',
    round: '3차',
    planStart: '2026-04-01',
    planEnd: '2026-04-30',
    testers: ['김현대'],
    testerPlanDates: { 김현대: '2026-04-16' },
    stepTotal: 2,
    stepDone: 1,
    progress: 50,
    result: '오류',
    errorCount: 1,
    fixDone: 0,
    fixPending: 1,
    lastExecutedAt: '2026-04-16 11:20',
    note: '',
    procedures: [
      { procedure: '최근 신청내역 조회', expected: '목록 표시' },
      { procedure: '배정 API 호출', expected: '포인트 배정 성공' },
    ],
    resultsMatrix: [
      [{ result: '정상', executedAt: '2026-04-16', fixStatus: null }],
      [{ result: '오류', executedAt: '2026-04-16', fixStatus: '처리예정' }],
    ],
  },
  {
    id: 'tr3',
    reqId: 'REQ-003',
    executionType: '오픈 후',
    caseId: 'CASE-003',
    caseName: '결제 취소 처리',
    screenName: '주문결제',
    systemPath: 'FO>주문클레임>주문/결제',
    bizCategory: '주문클레임',
    round: '3차',
    planStart: '2026-04-01',
    planEnd: '2026-04-30',
    testers: ['이테스트'],
    testerPlanDates: { 이테스트: '2026-04-20' },
    stepTotal: 2,
    stepDone: 0,
    progress: 0,
    result: '대기',
    errorCount: 0,
    fixDone: 0,
    fixPending: 0,
    lastExecutedAt: null,
    note: '운영 오픈 후 수행',
    procedures: [
      { procedure: '주문 상세 진입', expected: '취소 버튼 표시' },
      { procedure: '취소 실행', expected: '취소 완료 상태' },
    ],
    resultsMatrix: [
      [{ result: '대기', executedAt: null, fixStatus: null }],
      [{ result: '대기', executedAt: null, fixStatus: null }],
    ],
  },
  {
    id: 'tr4',
    reqId: 'REQ-004',
    executionType: '오픈 전',
    caseId: 'CASE-004',
    caseName: '대사 결과 다운로드',
    screenName: '정산 대사',
    systemPath: 'HIMS>정산>정산>대사',
    bizCategory: '정산',
    round: '2차',
    planStart: '2026-04-01',
    planEnd: '2026-04-15',
    testers: ['김현대', '최테스트'],
    testerPlanDates: { 김현대: '2026-04-10', 최테스트: '2026-04-11' },
    stepTotal: 3,
    stepDone: 3,
    progress: 100,
    result: '수정완료',
    errorCount: 1,
    fixDone: 1,
    fixPending: 0,
    lastExecutedAt: '2026-04-12 09:00',
    note: '',
    procedures: [
      { procedure: '대사 목록 조회', expected: '목록 표시' },
      { procedure: '엑셀 다운로드', expected: '파일 생성' },
      { procedure: '파일 내용 확인', expected: '데이터 일치' },
    ],
    resultsMatrix: [
      [
        { result: '정상', executedAt: '2026-04-11', fixStatus: null },
        { result: '정상', executedAt: '2026-04-11', fixStatus: null },
      ],
      [
        { result: '정상', executedAt: '2026-04-11', fixStatus: null },
        { result: '정상', executedAt: '2026-04-12', fixStatus: null },
      ],
      [
        { result: '수정완료', executedAt: '2026-04-12', fixStatus: '처리완료' },
        { result: '정상', executedAt: '2026-04-12', fixStatus: null },
      ],
    ],
  },
]

const uatRoundMap = { '2차': 'STG', '3차': '운영1차', '4차': '운영2차', '5차': '운영3차' }

function hydrateRow(row, mode) {
  const testers = [...row.testers]
  const steps = makeStepRows(row.procedures, testers, row.resultsMatrix)
  return {
    ...row,
    round: mode === 'uat' ? (uatRoundMap[row.round] || row.round) : row.round,
    testers,
    steps,
    testerCount: testers.length,
    planDate: row.planStart,
  }
}

export function getTestRunList(mode = 'dev') {
  return baseRuns.map((row) => hydrateRow(row, mode))
}

export function computeTestRunKpi(rows) {
  const kpi = {
    total: 0,
    wait: 0,
    progress: 0,
    delay: 0,
    ok: 0,
    error: 0,
    retry: 0,
    fixed: 0,
    pending: 0,
    etc: 0,
  }
  const today = '2026-04-17'
  for (const r of rows) {
    kpi.total += r.stepTotal
    for (const step of r.steps) {
      for (const name of r.testers) {
        const t = step.byTester[name]
        if (!t || t.result === '대기') kpi.wait += 1
        else if (['정상', '수정완료'].includes(t.result)) kpi.ok += 1
        else if (t.result === '오류') kpi.error += 1
        else if (t.result === '재처리요청') kpi.retry += 1
        else if (t.result === '기타') kpi.etc += 1
        if (t?.result === '오류' && t.fixStatus !== '처리완료') kpi.pending += 1
      }
    }
    if (r.planEnd < today && r.result === '대기') kpi.delay += 1
    if (r.result === '수정완료') kpi.fixed += 1
    kpi.progress += r.stepDone
  }
  return kpi
}

export function matchTestRunFilters(row, filters, myTestsOnly, currentUser = '김현대') {
  if (myTestsOnly && !row.testers.includes(currentUser)) return false
  if (filters.system && filters.system !== '전체' && !row.systemPath.startsWith(filters.system)) return false
  if (filters.round !== '전체' && row.round !== filters.round) return false
  if (filters.bizCategory !== '전체' && row.bizCategory !== filters.bizCategory) return false
  if (filters.result !== '전체' && row.result !== filters.result) return false
  if (filters.executionType && filters.executionType !== '전체' && row.executionType !== filters.executionType) {
    return false
  }
  if (filters.tester && !row.testers.some((t) => t.includes(filters.tester))) return false
  if (filters.keyword) {
    const q = filters.keyword.toLowerCase()
    if (!`${row.caseId}${row.caseName}${row.screenName}${row.reqId}`.toLowerCase().includes(q)) return false
  }
  if (filters.screenKeyword) {
    const q = filters.screenKeyword.toLowerCase()
    if (!`${row.reqId}${row.screenName}`.toLowerCase().includes(q)) return false
  }
  if (filters.dateFrom && row.planEnd < filters.dateFrom) return false
  if (filters.dateTo && row.planStart > filters.dateTo) return false
  return true
}

export function isOutsideTestPeriod(planDate, period) {
  if (!period?.start || !period?.end) return false
  return planDate < period.start || planDate > period.end
}

export function isCaseDimmed(row, period) {
  if (!period?.start || !period?.end) return false
  return row.planEnd < period.start || row.planStart > period.end
}
