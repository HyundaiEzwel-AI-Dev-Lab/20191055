// PAG-M-SYS-06 공통코드 관리

export const commonCodeMeta = {
  hint: 'H-PMS 공통코드 · 분류 → 코드상세',
}

export const codeCategories = [
  '프로젝트 처리단계',
  '요건 우선순위',
  '업무유형',
  '발의주체',
  '개발구분',
  '적요',
  '조치상태',
  '배포상태',
]

export const codeDetails = {
  '프로젝트 처리단계': [
    { code: 'RECV', name: '접수', sort: 1, useYn: 'Y' },
    { code: 'DISC', name: '협의중', sort: 2, useYn: 'Y' },
    { code: 'WORK', name: '처리중', sort: 3, useYn: 'Y' },
    { code: 'TEST', name: '테스트', sort: 4, useYn: 'Y' },
    { code: 'DONE', name: '완료', sort: 5, useYn: 'Y' },
    { code: 'REJ', name: '반려', sort: 6, useYn: 'Y' },
  ],
  '요건 우선순위': [
    { code: 'HIGH', name: '상', sort: 1, useYn: 'Y' },
    { code: 'MID', name: '중', sort: 2, useYn: 'Y' },
    { code: 'LOW', name: '하', sort: 3, useYn: 'Y' },
  ],
  '업무유형': [
    { code: 'NEW', name: '신규', sort: 1, useYn: 'Y' },
    { code: 'IMP', name: '개선', sort: 2, useYn: 'Y' },
    { code: 'BUG', name: '결함', sort: 3, useYn: 'Y' },
  ],
  '발의주체': [
    { code: 'CUST', name: '고객사', sort: 1, useYn: 'Y' },
    { code: 'TECH', name: '테크', sort: 2, useYn: 'Y' },
    { code: 'BIZ', name: '사업', sort: 3, useYn: 'Y' },
  ],
  '개발구분': [
    { code: 'NEW', name: '신규', sort: 1, useYn: 'Y' },
    { code: 'IMP', name: '개선', sort: 2, useYn: 'Y' },
    { code: 'CHG', name: '변경', sort: 3, useYn: 'Y' },
  ],
  '적요': [
    { code: 'UX', name: 'UI/UX 개선', sort: 1, useYn: 'Y' },
    { code: 'EFF', name: '업무효율', sort: 2, useYn: 'Y' },
    { code: 'REG', name: '규제대응', sort: 3, useYn: 'Y' },
  ],
  '조치상태': [
    { code: 'WAIT', name: '대기', sort: 1, useYn: 'Y' },
    { code: 'PROG', name: '조치중', sort: 2, useYn: 'Y' },
    { code: 'DONE', name: '조치완료', sort: 3, useYn: 'Y' },
    { code: 'REJ', name: '조치불가', sort: 4, useYn: 'Y' },
  ],
  '배포상태': [
    { code: 'NONE', name: '미배포', sort: 1, useYn: 'Y' },
    { code: 'READY', name: '배포대기', sort: 2, useYn: 'Y' },
    { code: 'DONE', name: '배포완료', sort: 3, useYn: 'Y' },
  ],
}

export function getCodeDetails(category) {
  return (codeDetails[category] || []).map((r) => ({ ...r }))
}
