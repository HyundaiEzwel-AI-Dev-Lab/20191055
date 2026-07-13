// PAG-S-UAT-01 시나리오 관리 목업

export const scenarioMeta = {
  notice:
    'WBS 개발 업무 확정 시 테스트 대상 화면 자동 등록 · 케이스/절차는 시나리오 편집(PAG-S-UAT-04)에서 관리',
}

const baseCases = [
  {
    id: 'sc1',
    reqId: 'REQ-001',
    executionType: '오픈 전',
    systemPath: 'FO>법인숙박',
    screenPath: '여행레저>복지혜택',
    screenName: '복지혜택 신청',
    caseId: 'TC-001',
    caseName: '복지혜택 신청 정상 플로우',
    round: '3차',
    planDate: '2026-04-15',
    stepCount: 4,
    steps: [
      { no: 1, procedure: '복지혜택 메뉴 진입', expected: '목록 화면 표시' },
      { no: 2, procedure: '신청 버튼 클릭', expected: '신청 폼 표시' },
      { no: 3, procedure: '필수값 입력 후 저장', expected: '신청 완료 메시지' },
      { no: 4, procedure: '신청 내역 조회', expected: '등록 건 표시' },
    ],
    note: '테스트 참고: 임직원/직원 구분 계정 필요',
  },
  {
    id: 'sc2',
    reqId: 'REQ-002',
    executionType: '오픈 후',
    systemPath: 'FO>법인숙박',
    screenPath: '여행레저>복지혜택',
    screenName: '복지혜택 신청',
    caseId: 'TC-002',
    caseName: '바우처 특복 배정 검증',
    round: '3차',
    planDate: '2026-04-16',
    stepCount: 3,
    steps: [
      { no: 1, procedure: '특복 선택', expected: '특복 옵션 활성' },
      { no: 2, procedure: '배정 API 호출', expected: '포인트 배정 성공' },
      { no: 3, procedure: '잔액 확인', expected: '배정 금액 반영' },
    ],
    note: '',
  },
  {
    id: 'sc3',
    reqId: 'REQ-003',
    executionType: 'dev테스트 제외',
    systemPath: 'FO>주문클레임',
    screenPath: '주문/결제',
    screenName: '주문결제',
    caseId: 'TC-003',
    caseName: '결제 취소 처리',
    round: '3차',
    planDate: '2026-04-18',
    stepCount: 2,
    steps: [
      { no: 1, procedure: '주문 상세 진입', expected: '취소 버튼 표시' },
      { no: 2, procedure: '취소 실행', expected: '취소 완료 상태' },
    ],
    note: '운영 오픈 후 수행',
  },
  {
    id: 'sc4',
    reqId: 'REQ-004',
    executionType: '오픈 전',
    systemPath: 'HIMS>정산',
    screenPath: '정산>대사',
    screenName: '정산 대사',
    caseId: 'TC-004',
    caseName: '대사 결과 다운로드',
    round: '2차',
    planDate: '2026-04-10',
    stepCount: 3,
    steps: [
      { no: 1, procedure: '대사 목록 조회', expected: '목록 표시' },
      { no: 2, procedure: '엑셀 다운로드', expected: '파일 생성' },
      { no: 3, procedure: '파일 내용 확인', expected: '데이터 일치' },
    ],
    note: '',
  },
]

const uatRoundMap = {
  '1차': 'STG',
  '2차': 'STG',
  '3차': '운영1차',
  '4차': '운영2차',
  '5차': '운영3차',
}

export function getScenarioList(mode = 'dev') {
  return baseCases.map((row) => ({
    ...row,
    round: mode === 'uat' ? (uatRoundMap[row.round] || row.round) : row.round,
    steps: row.steps.map((s) => ({ ...s })),
  }))
}

export function matchScenarioFilters(row, filters, config) {
  if (filters.round !== '전체' && row.round !== filters.round) return false
  if (filters.bizCategory !== '전체' && !row.systemPath.includes(filters.bizCategory)) return false
  if (filters.executionType !== '전체' && row.executionType !== filters.executionType) return false
  if (filters.keyword) {
    const q = filters.keyword.toLowerCase()
    const hay = `${row.caseId}${row.caseName}${row.screenName}${row.reqId}`.toLowerCase()
    if (!hay.includes(q)) return false
  }
  if (filters.dateFrom && row.planDate < filters.dateFrom) return false
  if (filters.dateTo && row.planDate > filters.dateTo) return false
  if (filters.screenKeyword) {
    const q = filters.screenKeyword.toLowerCase()
    if (!`${row.screenName}${row.screenPath}`.toLowerCase().includes(q)) return false
  }
  return true
}

/** POP-UAT-03 일괄등록 미리보기 (엑셀 파싱 목업) */
export function getBulkRegisterPreview(mode = 'dev') {
  const round = mode === 'uat' ? '운영1차' : '3차'
  return [
    {
      reqId: 'REQ-010',
      caseId: 'TC-010',
      caseName: '복지혜택 취소 플로우',
      screenName: '복지혜택 신청',
      executionType: '오픈 전',
      round,
      planDate: '2026-04-20',
      steps: [
        { no: 1, procedure: '신청 내역 선택', expected: '상세 표시' },
        { no: 2, procedure: '취소 실행', expected: '취소 완료' },
      ],
    },
    {
      reqId: 'REQ-011',
      caseId: 'TC-011',
      caseName: '주문결제 PG 연동',
      screenName: '주문결제',
      executionType: '오픈 후',
      round,
      planDate: '2026-04-21',
      steps: [
        { no: 1, procedure: 'PG 선택', expected: 'PG 목록 표시' },
        { no: 2, procedure: '결제 완료', expected: '주문 완료' },
      ],
    },
  ]
}

let caseSeq = baseCases.length

export function addScenarioCases(items, mode = 'dev') {
  const added = items.map((item) => {
    caseSeq += 1
    const round =
      mode === 'uat' ? item.round : item.round?.replace('운영1차', '3차') || '3차'
    return {
      id: `sc-new-${Date.now()}-${caseSeq}`,
      systemPath: item.systemPath || 'FO>법인숙박',
      screenPath: item.screenPath || '여행레저>복지혜택',
      screenName: item.screenName,
      reqId: item.reqId,
      caseId: item.caseId || `TC-${String(caseSeq).padStart(3, '0')}`,
      caseName: item.caseName,
      executionType: item.executionType || '오픈 전',
      round,
      planDate: item.planDate || '2026-04-20',
      stepCount: item.steps?.length || 0,
      steps: item.steps || [],
      note: item.note || '',
    }
  })
  baseCases.unshift(...added)
  return added
}

/** PAG-S-UAT-04 편집 저장 */
export function saveScenarioCase(caseId, patch) {
  const row = baseCases.find((c) => c.caseId === caseId)
  if (!row) return false
  Object.assign(row, patch, {
    stepCount: patch.steps?.length ?? row.stepCount,
  })
  return true
}

export function getScenarioEditGroups(mode = 'dev') {
  const list = getScenarioList(mode)
  const map = new Map()
  for (const row of list) {
    const key = `${row.reqId}|${row.screenName}`
    if (!map.has(key)) {
      map.set(key, {
        reqId: row.reqId,
        screenName: row.screenName,
        systemPath: row.systemPath,
        screenPath: row.screenPath,
        cases: [],
      })
    }
    map.get(key).cases.push(row)
  }
  return [...map.values()]
}
