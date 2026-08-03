/** 요구사항 등록 · 화면(메뉴) 검색 목업 (POP 공통) */

export const screenSearchSystems = ['HIMS', 'HPAS', 'HCAS', 'HCON']

const catalogs = {
  HIMS: [
    ['상품관리', '상품 목록'],
    ['상품관리', '상품 상세'],
    ['상품관리', '카테고리 관리'],
    ['주문클레임', '주문 목록'],
    ['주문클레임', '클레임 접수'],
    ['회원/SSO', '회원 조회'],
    ['회원/SSO', 'SSO 연동 설정'],
    ['고객사/제도', '고객사 그룹관리'],
    ['고객사/제도', '영업원장 관리'],
    ['프로모션', '프로모션 등록'],
    ['프로모션', '쿠폰 발급'],
    ['정산', '정산 대사'],
    ['정산', '정산 리포트'],
  ],
  HPAS: [
    ['결제', '카드결제'],
    ['결제', '간편결제'],
    ['결제', '결제수단 관리'],
    ['정산', '결제 정산'],
    ['정산', '수수료 정산'],
    ['대사', '일대사'],
    ['대사', '월대사'],
    ['공통', '결제 공통코드'],
    ['공통', '승인 로그'],
    ['결제', '취소 승인'],
    ['결제', '부분취소'],
    ['정산', '정산 배치'],
  ],
  HCAS: [
    ['복지', '복지혜택 신청'],
    ['복지', '복지포인트 조회'],
    ['법인숙박', '숙박바우처'],
    ['법인숙박', '예약 내역'],
    ['휴양소', '휴양소 신청'],
    ['복지', '복지몰 메인'],
    ['복지', '혜택 안내'],
    ['법인숙박', '체크인 관리'],
    ['휴양소', '휴양소 캘린더'],
    ['복지', '포인트 충전'],
    ['법인숙박', '패널티 안내'],
    ['복지', '복지 정산'],
  ],
  HCON: [
    ['계약', '계약 목록'],
    ['계약', '계약 상세'],
    ['전자서명', '서명 요청'],
    ['전자서명', '서명 현황'],
    ['문서함', '계약서 보관'],
    ['문서함', '첨부 관리'],
    ['승인', '계약 승인'],
    ['승인', '변경 승인'],
    ['공통', '계약 공통코드'],
    ['리포트', '계약 현황 리포트'],
    ['계약', '갱신 관리'],
    ['전자서명', '인증서 관리'],
    ['문서함', '열람 이력'],
  ],
}

function buildScreens() {
  const rows = []
  let seq = 1
  for (const system of screenSearchSystems) {
    const items = catalogs[system]
    items.forEach(([category, name], idx) => {
      const path = `${system} > ${category} > ${name}`
      rows.push({
        id: `${system}-${String(seq).padStart(3, '0')}`,
        system,
        category,
        path,
        name,
        useYn: idx % 7 === 0 ? 'N' : 'Y',
      })
      seq += 1
    })
  }
  // pad to ~50 with variants
  while (rows.length < 50) {
    const system = screenSearchSystems[rows.length % 4]
    const n = rows.length + 1
    const category = '기타'
    const name = `${system} 추가화면 ${n}`
    rows.push({
      id: `${system}-${String(n).padStart(3, '0')}`,
      system,
      category,
      path: `${system} > ${category} > ${name}`,
      name,
      useYn: 'Y',
    })
  }
  return rows.slice(0, 50)
}

export const screenMenuCatalog = buildScreens()

/** 폼 시스템값 → 검색 모달 시스템 */
export function resolveScreenSearchSystem(system) {
  if (screenSearchSystems.includes(system)) return system
  if (system === 'FO' || system === 'HIMS(정산)') return 'HIMS'
  return 'HIMS'
}

/**
 * @param {{ system: string, keyword: string }} filters
 * 화면명 검색 (시스템 필터 포함). useYn=Y만.
 */
export function searchScreenMenus({ system, keyword }) {
  const q = String(keyword || '')
    .trim()
    .toLowerCase()
  return screenMenuCatalog.filter((row) => {
    if (system && row.system !== system) return false
    if (row.useYn !== 'Y') return false
    if (!q) return true
    return row.name.toLowerCase().includes(q)
  })
}
