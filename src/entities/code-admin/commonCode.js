// PAG-M-SYS-06 공통코드 관리

export const commonCodeMeta = {
  hint: '공통코드 변경 시 기존 데이터의 코드값은 변경되지 않으며, 변경 이후 데이터부터 변경된 코드명이 적용됩니다.',
}

export const codeCategoryGroups = [
  {
    group: '시스템관리',
    items: ['사용자 상태'],
  },
  {
    group: '프로젝트정보',
    items: ['프로젝트 처리단계', '발의주체', '개발구분', '적요'],
  },
  {
    group: '요구사항',
    items: ['요건 우선순위', '업무유형'],
  },
  {
    group: 'WBS',
    items: ['업무 우선순위', '업무 난이도'],
  },
  {
    group: '테스트',
    items: ['조치상태', '배포상태', '결함등급'],
  },
]

export const codeCategories = codeCategoryGroups.flatMap((g) => g.items)

export const codeDetails = {
  '사용자 상태': [
    { code: 'ACTIVE', name: '정상', sort: 1, useYn: 'Y' },
    { code: 'LOCKED', name: '잠금', sort: 2, useYn: 'Y' },
    { code: 'LEAVE', name: '휴직', sort: 3, useYn: 'Y' },
    { code: 'RETIRED', name: '퇴직', sort: 4, useYn: 'Y' },
  ],
  '프로젝트 처리단계': [
    { code: 'RECV', name: '접수', sort: 1, useYn: 'Y' },
    { code: 'DISC', name: '협의중', sort: 2, useYn: 'Y' },
    { code: 'WORK', name: '처리중', sort: 3, useYn: 'Y' },
    { code: 'TEST', name: '테스트', sort: 4, useYn: 'Y' },
    { code: 'DONE', name: '완료', sort: 5, useYn: 'Y' },
    { code: 'REJ', name: '반려', sort: 6, useYn: 'Y' },
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
  '요건 우선순위': [
    { code: 'HIGH', name: '높음', sort: 1, useYn: 'Y' },
    { code: 'MID', name: '보통', sort: 2, useYn: 'Y' },
    { code: 'LOW', name: '낮음', sort: 3, useYn: 'Y' },
  ],
  '업무유형': [
    { code: 'PLAN', name: '기획', sort: 1, useYn: 'Y' },
    { code: 'DSGN', name: '디자인', sort: 2, useYn: 'Y' },
    { code: 'PUB', name: '퍼블리싱', sort: 3, useYn: 'Y' },
    { code: 'DEV', name: '개발', sort: 4, useYn: 'Y' },
    { code: 'TEST', name: '테스트', sort: 5, useYn: 'Y' },
  ],
  '업무 우선순위': [
    { code: 'HIGH', name: '높음', sort: 1, useYn: 'Y' },
    { code: 'MID', name: '보통', sort: 2, useYn: 'Y' },
    { code: 'LOW', name: '낮음', sort: 3, useYn: 'Y' },
  ],
  '업무 난이도': [
    { code: 'HIGH', name: '상', sort: 1, useYn: 'Y' },
    { code: 'MID', name: '중', sort: 2, useYn: 'Y' },
    { code: 'LOW', name: '하', sort: 3, useYn: 'Y' },
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
  '결함등급': [
    { code: 'CRIT', name: 'Critical', sort: 1, useYn: 'Y' },
    { code: 'MAJ', name: 'Major', sort: 2, useYn: 'Y' },
    { code: 'MIN', name: 'Minor', sort: 3, useYn: 'Y' },
  ],
}

export function getCodeDetails(category) {
  return (codeDetails[category] || []).map((r) => ({
    registeredBy: 'system',
    registeredAt: '2026-01-01 00:00:00',
    updatedBy: '-',
    updatedAt: null,
    ...r,
  }))
}
