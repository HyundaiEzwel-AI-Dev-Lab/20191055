// PAG-S-DAS-01 프로젝트 대시보드 목업 — SB p.160~161
import { EMPTY_DATA_USER_ID } from './mockUsers'

export const projectDashboardMeta = {
  refreshInterval: '1시간',
  scheduleNote: '계획 대비 실행일 기준 +1일 이상: 지연 | -1일 이하: 단축',
  legend: [
    { key: 'wait', label: '대기' },
    { key: 'prog-delay', label: '진행(경과)' },
    { key: 'prog-normal', label: '진행(정상)' },
    { key: 'prog-shorten', label: '진행(단축)' },
    { key: 'done-normal', label: '완료(정상)' },
    { key: 'done-shorten', label: '완료(단축)' },
  ],
}

export function getProjectDashboard(projectId, projectName, userId) {
  void projectId
  if (userId === EMPTY_DATA_USER_ID) {
    return {
      updatedAt: '2026-04-17 08:00:00',
      projectName: projectName || '',
      totalProgress: {
        execRate: 0,
        planRate: 0,
        diff: 0,
        diffLabel: '계획 대비 0%',
        planPeriod: { start: '', end: '' },
        execPeriod: { start: '', end: '' },
      },
      scheduleCards: [],
      delaySummary: { expectedDelay: 0, normal: 0, expectedShorten: 0 },
      typeSummary: [],
      details: [],
    }
  }
  return {
    updatedAt: '2026-04-17 08:00:00',
    projectName: projectName || '프로모션 운영 프로세스 및 기능 개선',
    totalProgress: {
      execRate: 65.5,
      planRate: 63.5,
      diff: 2,
      diffLabel: '계획 대비 +2%',
      planPeriod: { start: '2026-01-01', end: '2026-02-20' },
      execPeriod: { start: '2026-01-01', end: '2026-02-19' },
    },
    scheduleCards: [
      {
        id: 'shorten',
        label: '단축',
        tone: 'shorten',
        planPeriod: { start: '2026-01-01', end: '2026-02-20' },
        execPeriod: { start: '2026-01-01', end: '2026-02-19' },
        diffLabel: '1일 단축',
      },
      {
        id: 'normal',
        label: '정상',
        tone: 'normal',
        planPeriod: { start: '2026-01-01', end: '2026-02-20' },
        execPeriod: { start: '2026-01-01', end: null, inProgress: true },
        diffLabel: '일정준수',
      },
      {
        id: 'delay',
        label: '경과',
        tone: 'delay',
        planPeriod: { start: '2026-01-01', end: '2026-02-20' },
        execPeriod: { start: '2026-01-01', end: null, inProgress: true },
        diffLabel: '2일 경과',
      },
    ],
    delaySummary: {
      expectedDelay: 1,
      normal: 5,
      expectedShorten: 2,
    },
    typeSummary: [
      { type: '기획', rate: 100, status: 'done-shorten', statusLabel: '단축 (-1일)' },
      { type: '디자인', rate: 100, status: 'done-normal', statusLabel: '정상 (±0일)' },
      { type: '퍼블리싱', rate: 80, status: 'prog-delay', statusLabel: '경과 (+1일)' },
      { type: '개발', rate: 5, status: 'prog-normal', statusLabel: '정상 (±0일)' },
      { type: 'DEV테스트', rate: null, status: 'wait', statusLabel: '대기' },
      { type: '운영테스트', rate: null, status: 'wait', statusLabel: '대기' },
    ],
    details: [
      {
        id: 'd1',
        taskType: '기획',
        assignee: '권현대',
        planStart: '2026-06-01',
        planEnd: '2026-06-10',
        execStart: '2026-06-01',
        execEnd: '2026-06-10',
        execRate: 100,
        planDiff: '- 1일',
        compliance: '단축',
        status: 'done-shorten',
      },
      {
        id: 'd2',
        taskType: '디자인',
        assignee: '홍현대',
        planStart: '2026-06-01',
        planEnd: '2026-06-10',
        execStart: '2026-06-01',
        execEnd: '2026-06-10',
        execRate: 100,
        planDiff: '± 0일',
        compliance: '정상',
        status: 'done-normal',
      },
      {
        id: 'd3',
        taskType: '퍼블리싱',
        assignee: '서현대',
        planStart: '2026-06-01',
        planEnd: '2026-06-10',
        execStart: '2026-06-02',
        execEnd: null,
        execRate: 80,
        planDiff: '+ 1일',
        compliance: '경과',
        status: 'prog-delay',
      },
      {
        id: 'd4',
        taskType: '개발',
        assignee: '이현대',
        planStart: '2026-06-01',
        planEnd: '2026-06-10',
        execStart: '2026-06-01',
        execEnd: null,
        execRate: 15,
        planDiff: '± 0일',
        compliance: '정상',
        status: 'prog-normal',
      },
      {
        id: 'd5',
        taskType: '개발',
        assignee: '박현대',
        planStart: '2026-06-01',
        planEnd: '2026-06-10',
        execStart: '2026-05-31',
        execEnd: null,
        execRate: 5,
        planDiff: '± 0일',
        compliance: '정상',
        status: 'prog-shorten',
      },
    ],
  }
}

export function formatPeriod(start, end, inProgress = false) {
  if (!start) return '-'
  const endLabel = end || (inProgress ? '진행중' : '-')
  return `${start} ~ ${endLabel}`
}

export function statusTone(status) {
  const map = {
    wait: 'wait',
    'prog-delay': 'delay',
    'prog-normal': 'normal',
    'prog-shorten': 'shorten',
    'done-normal': 'normal',
    'done-shorten': 'shorten',
  }
  return map[status] || 'muted'
}
