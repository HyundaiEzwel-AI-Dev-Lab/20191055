// 신규 프로젝트 등록 기본값 (SB PAG-S-INF-01 신규 등록 기준)

import { assigneeRoles } from '@/data/projectInfo'

let draftSeq = 0

export function createDraftProjectId() {
  draftSeq += 1
  return `PJ-NEW-${Date.now()}-${draftSeq}`
}

/** 등록 팝업 완료 후 프로젝트 정보 폼 초기값 */
export function getNewProjectDetail(projectName, requester = '', requestDept = '') {
  return {
    jira: '',
    itVoc: '',
    name: projectName,
    stage: '접수',
    workCategories: [],
    scheduledOpenDate: '',
    actualOpenDate: '',
    initiator: '',
    devType: '',
    summary: '',
    requestDept,
    requester,
    assignees: Object.fromEntries(assigneeRoles.map((role) => [role, []])),
    testUsage: [],
    testLibrary: '미등록',
    testLibraryScenarios: [],
    hasRegisteredTestCases: false,
    memo: '',
    testerChangePending: null,
    issues: [],
  }
}
