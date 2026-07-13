// PAG-M-SYS-05 화면(메뉴) 관리

export const menuMgmtMeta = {
  hint: '시스템 관리 · 화면코드 관리',
  notice: 'BO 코드는 DB 연동 값입니다. FO 코드는 H-PAS에서 관리되는 데이터입니다.',
}

export const systemOptions = ['HIMS', 'HPAS', 'HCAS', 'FO']

export const bizCategoriesBySystem = {
  HIMS: [
    '상품',
    '주문클레임',
    '회원/로그인/SSO',
    '고객사/제도',
    '포인트',
    '협력사관리',
    '할인쿠폰',
    '적립금',
    '프로모션',
    '검색',
    '법인숙박',
    '휴양소',
    'ASP',
    'APP',
    '공통/API',
    '메뉴카테고리',
    '기타',
  ],
  HPAS: ['결제', '정산', '대사', '공통'],
  HCAS: ['복지', '법인숙박', '휴양소'],
  FO: ['법인숙박', '주문클레임', '회원/로그인', '복지혜택'],
}

const himsCustomerScreens = [
  { id: '12002', name: '영업원장 관리', path: '고객사 > 고객사관리', useYn: 'Y', createdBy: 'system', createdAt: '2026-05-19 00:00:00', updatedBy: '-' },
  { id: '12001', name: '고객사 그룹관리 조회', path: '고객사 > 고객사관리', useYn: 'Y', createdBy: 'system', createdAt: '2026-05-19 00:00:00', updatedBy: '-' },
  { id: '12000', name: '복지몰 템플릿 관리', path: '고객사 > 고객사관리', useYn: 'Y', createdBy: 'system', createdAt: '2026-05-19 00:00:00', updatedBy: '-' },
  { id: '19999', name: '고객사 담당자 관리', path: '고객사 > 고객사관리', useYn: 'Y', createdBy: 'system', createdAt: '2026-05-19 00:00:00', updatedBy: '-' },
  { id: '19998', name: '대시보드', path: '고객사 > 고객사관리', useYn: 'Y', createdBy: 'system', createdAt: '2026-05-19 00:00:00', updatedBy: '-' },
  { id: '19997', name: '업무요청 관리', path: '고객사 > 고객사관리', useYn: 'N', createdBy: 'system', createdAt: '2026-05-19 00:00:00', updatedBy: '-' },
  { id: '19996', name: 'BPO 서비스문의 관리', path: '고객사 > 고객사관리', useYn: 'N', createdBy: 'system', createdAt: '2026-05-19 00:00:00', updatedBy: '김현대(2121212)' },
  { id: '19995', name: '복지서비스 도입문의 관리', path: '고객사 > 고객사관리', useYn: 'Y', createdBy: 'system', createdAt: '2026-05-19 00:00:00', updatedBy: '-' },
  { id: '19994', name: '실적금액 엑셀등록', path: '고객사 > 고객사관리', useYn: 'Y', createdBy: 'system', createdAt: '2026-05-19 00:00:00', updatedBy: '김현대(2121212)' },
]

export const screenCodesByKey = {
  'HIMS|고객사/제도': himsCustomerScreens,
  'HIMS|상품': [
    { id: '11001', name: '상품 목록', path: '상품 > 상품관리', useYn: 'Y', createdBy: 'system', createdAt: '2026-04-01 00:00:00', updatedBy: '-' },
    { id: '11002', name: '상품 상세', path: '상품 > 상품관리', useYn: 'Y', createdBy: 'system', createdAt: '2026-04-01 00:00:00', updatedBy: '-' },
  ],
  'FO|법인숙박': [
    { id: 'FO001', name: '복지혜택 신청', path: '법인숙박 > 여행레저 > 복지혜택', useYn: 'Y', createdBy: 'system', createdAt: '2026-03-10 00:00:00', updatedBy: '-' },
    { id: 'FO002', name: '모바일 복지혜택 신청', path: '법인숙박 > 여행레저 > 복지혜택', useYn: 'Y', createdBy: 'system', createdAt: '2026-03-10 00:00:00', updatedBy: '-' },
  ],
}

export function getScreenCodes(system, biz) {
  const key = `${system}|${biz}`
  const rows = screenCodesByKey[key]
  if (rows) return rows.map((r) => ({ ...r }))
  return [
    {
      id: `${system.slice(0, 2)}${Math.floor(Math.random() * 9000 + 1000)}`,
      name: `${biz} 기본 화면`,
      path: `${biz} > 기본`,
      useYn: 'Y',
      createdBy: 'system',
      createdAt: '2026-01-01 00:00:00',
      updatedBy: '-',
    },
  ]
}
