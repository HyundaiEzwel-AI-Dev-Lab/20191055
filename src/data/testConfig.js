// 테스트 화면 공통 설정 — unit / dev / uat 분기 단일 출처

export const DEV_ROUNDS = ['전체', '1차', '2차', '3차', '4차', '5차']
export const UAT_ROUNDS = ['전체', 'STG', '운영1차', '운영2차', '운영3차', '운영4차', '운영5차']

export const bizCategoryOptions = ['전체', '상품', '주문클레임', '회원/로그인', '법인숙박', '복지혜택', '정산', '결제']
export const systemOptions = ['전체', 'FO', 'HIMS', 'HPAS', 'HCAS']

export const unitTaskTypeOptions = ['전체', '퍼블리싱', '개발']

export const testResultOptions = ['전체', '대기', '정상', '오류', '기타', '수정완료', '재처리요청']

/** SB 조치상태 — 결함·단위테스트 공통 */
export const actionStatusOptions = ['전체', '접수', '처리예정', '처리완료', '오류아님', '수정제외']
export const actionStatusValues = ['접수', '처리예정', '처리완료', '오류아님', '수정제외']
export const defectStatusOptions = actionStatusOptions
export const defectGradeOptions = ['전체', 'Critical', 'Major', 'Minor']
export const deployStatusOptions = ['전체', 'DEV배포', 'STG배포', '운영배포']

export { pageSizeOptions } from './commonOptions'

/** DEV / 운영 route param → 화면 옵션 */
export function getModeConfig(mode = 'dev') {
  const isUat = mode === 'uat'
  return {
    mode,
    label: isUat ? '운영' : 'DEV',
    fullLabel: isUat ? '운영테스트' : 'DEV테스트',
    roundOptions: isUat ? UAT_ROUNDS : DEV_ROUNDS,
    executionTypeOptions: isUat
      ? ['전체', '오픈 전', '오픈 후']
      : ['전체', '오픈 전', '오픈 후', 'dev테스트 제외'],
    editExecutionTypeOptions: isUat
      ? ['오픈 전', '오픈 후']
      : ['오픈 전', '오픈 후', 'dev테스트 제외'],
    showDevTestExclude: !isUat,
    showDeployStatus: isUat,
    showOccurrencePhase: isUat,
    defectDoneLabel: '처리완료',
    showUnitCompare: !isUat,
    testPeriod: isUat
      ? { start: '2026-05-01', end: '2026-05-31', label: '운영 1차 테스트 기간' }
      : { start: '2026-04-01', end: '2026-04-30', label: 'DEV 3차 테스트 기간' },
    systemOptions,
    bizCategoryOptions,
  }
}

export function testResultClass(result) {
  if (result === '정상' || result === '처리완료') return 'ok'
  if (result === '오류' || result === '재처리요청') return 'err'
  if (result === '대기' || result === '접수') return 'wait'
  if (result === '테스트불가' || result === '개선필요' || result === '기타') return 'warn'
  return 'muted'
}

export function defectStatusClass(status) {
  if (status === '처리완료') return 'ok'
  if (status === '접수') return 'wait'
  if (status === '처리예정') return 'prog'
  if (status === '오류아님' || status === '수정제외') return 'muted'
  return 'muted'
}
