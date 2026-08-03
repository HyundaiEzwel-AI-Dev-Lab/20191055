// POP-M-DAS-03 일정변동 사유 팝업 목업

export const scheduleChangeByProjectId = {
  ps23: {
    projectName: '주문취소 시 쿠폰 할인취소 정보 표기',
    scheduledOpenDate: '2026-04-10',
    actualOpenDate: '2026-04-11',
    delayDays: 1,
    reason: '담당부서 요청으로 오픈일 변경',
    registeredBy: '김현대',
    registeredAt: '2026-04-11 16:20:08',
    history: [
      {
        no: 1,
        scheduledOpenDate: '2026-04-10',
        changedOpenDate: '2026-04-11',
        reason: '담당부서 요청으로 오픈일 변경',
        registeredBy: '김현대',
        registeredAt: '2026-04-11 16:20:08',
      },
    ],
  },
  d6: {
    projectName: '모바일 앱 푸시 알림 고도화',
    scheduledOpenDate: '2026-04-20',
    actualOpenDate: '2026-04-25',
    delayDays: 5,
    reason:
      '외부 푸시 연동 업체 API 검증 지연 및 앱스토어 심사 일정으로 인해 오픈일이 5일 연기되었습니다.',
    registeredBy: '김현대',
    registeredAt: '2026-04-18 14:32',
    history: [
      {
        no: 1,
        scheduledOpenDate: '2026-04-01',
        changedOpenDate: '2026-04-20',
        reason: '요구사항 범위 확대에 따른 일정 조정',
        registeredBy: '이기획',
        registeredAt: '2026-03-15 10:20',
      },
      {
        no: 2,
        scheduledOpenDate: '2026-04-20',
        changedOpenDate: '2026-04-25',
        reason: '외부 푸시 연동 업체 API 검증 지연 및 앱스토어 심사 일정',
        registeredBy: '김현대',
        registeredAt: '2026-04-18 14:32',
      },
    ],
  },
}

export function getScheduleChange(projectId) {
  return scheduleChangeByProjectId[projectId] ?? null
}
