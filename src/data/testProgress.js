// PAG-S-UAT-16 진척관리 목업

export function getProgressData(mode = 'dev') {
  const isUat = mode === 'uat'

  const base = {
    updatedAt: '2026-04-17 08:00',
    kpi: {
      progressRate: isUat ? 72 : 48,
      progressDone: isUat ? 86 : 110,
      progressTotal: isUat ? 120 : 240,
      defectFixRate: isUat ? 85 : 76,
      defectFixed: isUat ? 17 : 19,
      defectTotal: isUat ? 20 : 25,
      pendingDefectRate: isUat ? 8 : 12,
      pendingDefects: isUat ? 2 : 3,
      pendingTotal: isUat ? 20 : 25,
    },
    progressStatus: {
      total: 240,
      wait: 80,
      progress: 120,
      delay: 30,
      delayMinor: 10,
    },
    systemProgressDefect: [
      { system: 'FO 법인숙박', testRate: 65, defectRate: 12, testDone: 30, defect: 3 },
      { system: 'HIMS 정산', testRate: 42, defectRate: 8, testDone: 18, defect: 2 },
      { system: 'HPAS 결제', testRate: 55, defectRate: 15, testDone: 22, defect: 4 },
      { system: 'HCAS 복지혜택', testRate: 38, defectRate: 6, testDone: 12, defect: 1 },
      { system: 'FO 주문클레임', testRate: 71, defectRate: 9, testDone: 25, defect: 2 },
      { system: 'HIMS 상품', testRate: 48, defectRate: 11, testDone: 16, defect: 3 },
      { system: 'HCAS 법인숙박', testRate: 33, defectRate: 5, testDone: 10, defect: 1 },
    ],
    systemDetail: [
      { system: 'HCAS 법인숙박', total: 15, wait: 2, progress: 10, delay: 3, progressRate: 87, fixRate: 50, defects: 2, pending: 1, done: 1 },
      { system: 'FO 주문클레임', total: 20, wait: 5, progress: 12, delay: 3, progressRate: 75, fixRate: 75, defects: 4, pending: 1, done: 3 },
      { system: 'HIMS 정산', total: 12, wait: 3, progress: 7, delay: 2, progressRate: 75, fixRate: 60, defects: 2, pending: 1, done: 1 },
    ],
    byTester: [
      { name: '김현대', assigned: 12, wait: 1, delay: 1, done: 10, rate: 83 },
      { name: '박테스트', assigned: 10, wait: 2, delay: 1, done: 7, rate: 70 },
      { name: '이테스트', assigned: 8, wait: 2, delay: 1, done: 5, rate: 63 },
      { name: '최테스트', assigned: 6, wait: 1, delay: 0, done: 5, rate: 83 },
    ],
    defectConfirm: [
      { name: '김현대', registered: 5, confirmed: 4, rate: 80 },
      { name: '박테스트', registered: 3, confirmed: 2, rate: 67 },
      { name: '이테스트', registered: 4, confirmed: 3, rate: 75 },
    ],
    confirmLabel: '처리완료',
    requesterProgress: [
      { requester: '마케팅팀', total: 40, done: 30, rate: 75 },
      { requester: '복지서비스기획팀', total: 25, done: 16, rate: 64 },
      { requester: 'IT기획팀', total: 18, done: 15, rate: 83 },
    ],
  }

  if (isUat) {
    return {
      ...base,
      defectByPhase: [
        { phase: 'STG', count: 6, rate: 10 },
        { phase: '운영1차', count: 8, rate: 14 },
        { phase: '운영2차', count: 4, rate: 7 },
      ],
      systemCompare: [
        { system: 'FO 법인숙박', devTotal: 30, devDone: 24, uatTotal: 28, uatDone: 20, uatDefects: 3, defectRate: 11 },
        { system: 'HIMS 정산', devTotal: 18, devDone: 14, uatTotal: 15, uatDone: 11, uatDefects: 2, defectRate: 13 },
        { system: 'HPAS 결제', devTotal: 22, devDone: 16, uatTotal: 20, uatDone: 14, uatDefects: 4, defectRate: 20 },
      ],
      unitCompare: null,
      unitDevSystemCompare: null,
    }
  }

  return {
    ...base,
    unitCompare: [
      { label: '단위테스트', total: 42, done: 35, rate: 83 },
      { label: 'DEV테스트', total: 50, done: 34, rate: 68 },
    ],
    unitDevSystemCompare: [
      { system: 'FO 법인숙박', unitTotal: 18, unitDone: 16, devTotal: 15, devDone: 10, devDefects: 2 },
      { system: 'HIMS 정산', unitTotal: 12, unitDone: 9, devTotal: 12, devDone: 7, devDefects: 3 },
      { system: 'HPAS 결제', unitTotal: 12, unitDone: 10, devTotal: 15, devDone: 9, devDefects: 4 },
      { system: 'HCAS 복지', unitTotal: 8, unitDone: 8, devTotal: 8, devDone: 5, devDefects: 1 },
    ],
    defectByPhase: [
      { phase: '1차', count: 8, rate: 12 },
      { phase: '2차', count: 5, rate: 8 },
      { phase: '3차', count: 3, rate: 5 },
    ],
    systemCompare: null,
  }
}

export function donutStyle(rate, color = 'var(--teal-500)') {
  const p = Math.min(100, Math.max(0, rate))
  return {
    background: `conic-gradient(${color} 0 ${p}%, #eef1f3 ${p}% 100%)`,
  }
}

export function gaugeStyle(rate) {
  const p = Math.min(50, Math.max(0, rate / 2))
  return { '--p': `${p}%` }
}
