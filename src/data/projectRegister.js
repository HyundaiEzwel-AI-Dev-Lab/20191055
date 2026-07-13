import { assigneeRoles } from '@/data/projectInfo'
import { projectStatusList } from '@/data/projectStatus'

let draftSeq = 0

export function createDraftProjectId() {
  draftSeq += 1
  return `PJ-NEW-${Date.now()}-${draftSeq}`
}

/** 이미 사용 중인 JIRA 번호 목록 (목업) */
export function getRegisteredJiraKeys() {
  const keys = new Set()
  projectStatusList.forEach((row) => {
    if (row.jira) keys.add(String(row.jira).trim().toUpperCase())
  })
  ;['HDEZW-93132', 'HDEZW-94120', 'HDEZW-95292'].forEach((j) => keys.add(j))
  return keys
}

export function isJiraAlreadyRegistered(jira) {
  const key = String(jira || '').trim().toUpperCase()
  if (!key) return false
  return getRegisteredJiraKeys().has(key)
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
    testRoundDev: '1차',
    testRoundUat: '1차',
    testLibrary: '미등록',
    testLibraryScenarios: [],
    hasRegisteredTestCases: false,
    memo: '',
    testerChangePending: null,
    issues: [],
  }
}
