# HPMS 목업 데이터 — 실연동 시 삭제·교체 가이드

> **목적:** 실제 API 연동 시 **무엇을 지우고**, **어느 화면이 어떤 `@/data`에 묶여 있는지** 한 장으로 고정.  
> **기준일:** 2026-07-24 (소스 `import … from '@/data/…'` 전수)  
> **삭제하지 말 것:** `src/components/test/` — 테스트 **기능 UI(모달)** 이며 목업 폴더가 아님.

---

## 1. 실연동 시 삭제 목록 (체크리스트)

### 1.1 통삭제 후보 — 도메인 목업 (`src/data/`)

아래 파일은 **더미 배열·조회/저장 목업**이 본문이다. API로 교체한 뒤 **미사용이면 파일 삭제**.

| 파일 | 용도 (요약) |
|------|-------------|
| `mockUsers.js` | 로그인·비번재설정 계정 |
| `approval.js` | 신청승인 목록·필터·일정변경 요청 추가 |
| `commonCode.js` | 공통코드 트리·상세 |
| `dashboard.js` | 메인 대시보드 KPI·차트·목록 |
| `dashboardRequirementPopup.js` | 대시보드 요청부서→요구사항 팝업 |
| `headerPopups.js` | 알림·검색·내프로젝트·내정보 프로필 목업 |
| `holiday.js` | 휴무일 목록 |
| `inbox.js` | 내업무 번들·가이드·라우팅 |
| `inboxCalendar.js` | 내업무 캘린더 블록 |
| `menuMgmt.js` | 화면(메뉴)관리 |
| `performance.js` | 실적관리 |
| `projectDashboard.js` | 개별 프로젝트 대시보드 |
| `projectHistory.js` | 변경이력 |
| `projectInfo.js` | 프로젝트 정보·스태프검색 |
| `projectRegister.js` | 등록 draft·JIRA 목업 |
| `projectStatus.js` | 통합 프로젝트 현황 |
| `requirement.js` | 요구사항 목록·일괄·옵션맵 |
| `scenario.js` | 시나리오 목록·편집·일괄 |
| `scheduleChange.js` | 일정변동 사유 조회 팝업 데이터 |
| `screenMenuSearch.js` | 화면(메뉴) 검색 목업 |
| `techResource.js` | 테크 리소스 |
| `testDefect.js` | 결함 목록·KPI·갱신 |
| `testLibrary.js` | 테스트 라이브러리 |
| `testProgress.js` | 진척관리 |
| `testRun.js` | 테스트 수행 |
| `unitTest.js` | 단위테스트 |
| `userMgmt.js` | 사용자 관리 |
| `wbs.js` | WBS 목록·캘린더·일정 옵션·오늘(목업일) |

### 1.2 유지 후보 — 설정·옵션 (당장 삭제 비권장)

실서버 공통코드/메뉴 API가 오기 전까지 **남겨도 됨**. 내용이 서버로 이전되면 그때 삭제·축소.

| 파일 | 이유 |
|------|------|
| `sidebarMenu.js` | LNB 라우트 트리 (구조 설정) |
| `commonOptions.js` | `pageSizeOptions` 등 공통 UI 옵션 |
| `testConfig.js` | DEV/운영 모드 라벨·상태 옵션·뱃지 클래스 |

> 옵션 문자열이 서버 코드와 중복되면 `testConfig` / `commonOptions`도 API 코드테이블로 이전 후 삭제.

### 1.3 문서·계정

| 항목 | 조치 |
|------|------|
| `TEST_ACCOUNTS.md` | 목업 계정 문서 → 실인증 후 삭제 또는 내부 위키로 이전 |
| 본 문서 `MOCK_DATA.md` | 실연동 완료 후 보관(이력) 또는 삭제 |

### 1.4 절대 삭제 금지 (오해 주의)

| 경로 | 이유 |
|------|------|
| `src/components/test/*` | 시나리오·결함·단위테스트 **UI** |
| `src/views/*Test*` / `*Scenario*` / `*Defect*` / `*Progress*` | 화면 자체 |
| `src/components/wbs/*` | WBS UI |
| `src/stores/*` · `src/composables/*` | 상태·훅 (목업 import만 API로 교체) |

### 1.5 권장 삭제 순서

1. 화면별 §2 표를 보고 `@/data` → `@/api`(또는 store)로 import 교체  
2. `rg "from '@/data/" src` 결과가 **유지 후보만** 남는지 확인  
3. §1.1 파일 중 unused 파일 삭제  
4. `TEST_ACCOUNTS.md` 정리  
5. `npm run build` / `build:pages` 확인  

한 번에 폴더를 날리려면 사전에 View가 `@/data`를 직접 보지 않도록 **`api` 어댑터**로 감싼 뒤 `mocks/`로 이사하는 편이 안전하다. (현재는 View → `data` 직결)

---

## 2. 화면별 import — 지워야 할 `@/data` 의존

범례: **삭제/교체** = 목업·조회 API화 대상 · **유지검토** = 옵션/설정성

### 2.1 인증 · 셸 · 헤더

| 화면/모듈 | 파일 | `@/data` 모듈 | import 심볼 (교체·삭제 대상) |
|-----------|------|---------------|------------------------------|
| 로그인 | `LoginView.vue` | `mockUsers` | `findUserById` |
| 비번 재설정 | `PasswordResetModal.vue` | `mockUsers` | `findUserForReset` |
| 앱 셸 | `AppShell.vue` | `sidebarMenu` | `pinnedItem`, `integratedMenus`, `projectMenus` (**유지검토**) |
| LNB | `AppSidebar.vue` | `sidebarMenu` | 동상 (**유지검토**) |
| 헤더 | `AppHeader.vue` | `headerPopups` | `notifications` |
| 통합검색 | `GlobalSearchModal.vue` | `headerPopups` | `searchItems`, `searchTypeLabel`, `recentProjects`, `searchResultExamples` |
| 알림 | `NotificationModal.vue` | `headerPopups` | `notifications`, `notificationTabs`, `notificationTagClass`, `myProjects` |
| 내 프로젝트 | `MyProjectsModal.vue` | `headerPopups` | `myProjects` |
| 내 정보 | `MyInfoModal.vue` | `headerPopups` | `defaultUserProfile` |
| 설정 | `MySettingsModal.vue` | `headerPopups` | `defaultUserProfile` |
| auth store | `stores/auth.js` | `headerPopups` | `defaultUserProfile` |

### 2.2 통합 — 대시보드 · 내업무 · 현황

| 화면 | 파일 | `@/data` | import 심볼 |
|------|------|----------|-------------|
| 메인 대시보드 | `MainDashboardView.vue` | `dashboard` | `dashboardMeta`, `stageKpi`, `completionRate`, `initiators`, `devTypes`, `summaries`, `dashboardProjects`, `requestDepts`, `devDepts`, `stageOptions` |
| | | `commonOptions` | `pageSizeOptions` (**유지검토**) |
| | | `scheduleChange` | `getScheduleChange` |
| 요청부서 요구사항 팝업 | `RequirementListModal.vue` | `dashboardRequirementPopup` | `getDashboardRequirements` |
| 실적 관리 | `PerformanceView.vue` | `performance` | `performanceMeta`, `performanceSummary`, `performanceRecords`, `deptOptions`, `statusOptions`, `monthPresets`, `initiators`, `devTypes`, `summaries`, `scheduleStatusLabel`, `scheduleStatusClass` |
| | | `commonOptions` | `pageSizeOptions` (**유지검토**) |
| 테크 리소스 | `TechResourceView.vue` | `techResource` | `techResourceMeta`, `techResourceSummary`, `techResourceRecords`, `deptOptions`, `stageOptions`, `scheduleOptions`, `getDelayTasks` |
| | | `commonOptions` | `pageSizeOptions` (**유지검토**) |
| 내업무 | `InboxView.vue` | `inbox` | `INBOX_GUIDE`, `getInboxBundle`, `routeForTaskType` |
| | | `wbs` | `calcDday` (유틸이면 api/utils로 이전 가능) |
| 내업무 캘린더 | `InboxCalendar.vue` | `inboxCalendar` | `calendarTasks`, `unscheduledTasks`, `projectColors` |
| | | `headerPopups` | `myProjects` |
| | | `inbox` | `INBOX_GUIDE` |
| 프로젝트 현황 | `ProjectStatusView.vue` | `projectStatus` | `projectStatusMeta`, `statusKpi`, `projectStatusList`, `requestDepts`, `devDepts`, `stageOptions`, `pageSizeOptions`, `matchKpiFilter`, `systemOptions`, `bizCategoryMap`, `initiatorOptions`, `devTypeOptions`, `summaryOptions` |
| | | `scheduleChange` | `getScheduleChange` |
| 변경이력(통합/개별) | `ProjectHistoryView.vue` | `projectHistory` | `changeCategoryOptions`, `changePeriodOptions`, `pageSizeOptions`, `historyDevDeptOptions`, `getProjectHistory`, `getAllProjectHistory`, `matchHistoryFilters`, `splitDateTime`, `resolveHistoryTemplate`, `detailRouteForHistory`, `HISTORY_TEMPLATE`, `formatReqLabel`, `createHistoryDefaultFilters`, `getPeriodDateRange` |

### 2.3 시스템 관리

| 화면 | 파일 | `@/data` | import 심볼 |
|------|------|----------|-------------|
| 신청 승인 | `ApprovalView.vue` | `approval` | `approvalStatusOptions`, `requestTypeOptions`, `dateTypeOptions`, `pageSizeOptions`, `approvalList`, `matchApprovalFilters`, `approvalStatusClass` |
| 화면(메뉴) | `MenuMgmtView.vue` | `menuMgmt` | `menuMgmtMeta`, `systemOptions`, `bizCategoriesBySystem`, `getScreenCodes` |
| 공통코드 | `CommonCodeView.vue` | `commonCode` | `commonCodeMeta`, `codeCategoryGroups`, `getCodeDetails` |
| 사용자 | `UserMgmtView.vue` | `userMgmt` | `userMgmtMeta`, `deptOptions`, `roleOptions`, `positionOptions`, `statusOptions`, `employmentStatusOptions`, `searchTypeOptions`, `pageSizeOptions`, `userList`, `matchUserFilters`, `userStatusClass` |
| 휴무일 | `HolidayMgmtView.vue` | `holiday` | `holidayMeta`, `holidayTypeOptions`, `holidayFormTypeOptions`, `yearOptions`, `holidayList`, `holidayMockToday`, `matchHolidayFilters` |
| 테스트 라이브러리 | `TestCaseView.vue` | `testLibrary` | `testLibraryMeta`, `systemOptions`, `bizOptions`, `sortOptions`, `pageSizeOptions`, `libraryList`, `flattenLibraryCases`, `matchLibraryFilters`, `emptyCaseForm`, `nextCaseId`, `saveLibraryCase`, `deleteLibraryCase` |

### 2.4 프로젝트 — 정보 · 대시보드 · 요구사항 · WBS

| 화면 | 파일 | `@/data` | import 심볼 |
|------|------|----------|-------------|
| 프로젝트 정보/등록 | `ProjectInfoView.vue` | `projectInfo` | `stageOptions`, `initiatorOptions`, `devTypeOptions`, `summaryOptions`, `assigneeRoles`, `testUsageOptions`, `testRoundOptions`, `testLibraryScenarios`, `searchStaff`, `searchMentions` |
| | | `requirement` | `systemOptions`, `bizCategoryMap` |
| | | `wbs` | `getWbsTasks` |
| | | `projectRegister` | `isJiraAlreadyRegistered`, `lookupJira` |
| 등록 composable | `useProjectRegister.js` | `projectRegister` | `createDraftProjectId` |
| project store | `stores/project.js` | `projectRegister` | `getNewProjectDetail` |
| | | `projectInfo` | `getProjectDetail` |
| 테스터 변경 | `TesterChangeModal.vue` | `projectInfo` | `searchStaff` |
| 개별 대시보드 | `ProjectDashboardView.vue` | `projectDashboard` | `projectDashboardMeta`, `getProjectDashboard`, `formatPeriod`, `statusTone` |
| 요구사항 | `RequirementView.vue` | `requirement` | `requirementMeta`, `taskTypeOptions`, `statusOptions`, `priorityOptions`, `confirmOptions`, `periodOptions`, `pageSizeOptions`, `systemOptions`, `bizCategoryMap`, `getRequirementList`, `statusClass`, `priorityClass`, `confirmClass`, `matchFilters` |
| 요구사항 폼 | `RequirementFormModal.vue` | `requirement` | `requirementTypes`, `registerTaskTypes`, `systemOptions`, `bizCategoryMap` |
| 요구사항 일괄 | `RequirementBulkRegisterModal.vue` | `requirement` | `getRequirementBulkPreview`, `normalizeRequirementBulkRow`, `requirementBulkTemplateColumns`, `requirementBulkTemplateSample`, `validateRequirementBulkRow` |
| 화면검색(요구) | `RequirementScreenSearchModal.vue` | `screenMenuSearch` | `resolveScreenSearchSystem`, `screenSearchSystems`, `searchScreenMenus` |
| WBS | `WbsView.vue` | `wbs` | `wbsMeta`, `taskTypeOptions`, `progressStatusOptions`, `scheduleComplianceOptions`, `systemOptions`, `assigneeOptions`, `getWbsTasks`, `formatDateRange`, `statusLabel`, `statusClass`, `matchWbsFilters`, `wbsMockToday` |
| | | `requirement` | `bizCategoryMap` |
| | | `approval` | `addScheduleChangeRequest` |
| WBS 캘린더 | `WbsCalendar.vue` | `wbs` | `getCalendarRange`, `getTaskTypeColor`, `calendarBlockLabel`, `calcDday` |
| WBS 일정관리 | `WbsScheduleModal.vue` | `wbs` | `priorityOptions`, `difficultyOptions`, `wbsMockToday` |
| WBS 다중일정 | `WbsBulkScheduleModal.vue` | `wbs` | `formatDateRange`, `bulkPlanChangeReasons`, `planChangeReasons`, `holdChangeReasons`, `approverOptions`, `assigneeOptions`, `calcRestartRange` |
| WBS 재착수 | `WbsRestartModal.vue` | `wbs` | `formatDateRange` |

### 2.5 테스트 (DEV/운영) — View + `components/test` 모달

| 화면 | 파일 | `@/data` | import 심볼 |
|------|------|----------|-------------|
| 모드 컨텍스트 | `useTestContext.js` | `testConfig` | `getModeConfig` (**유지검토**) |
| 단위테스트 | `UnitTestView.vue` | `testConfig` | `systemOptions`, `bizCategoryOptions` (**유지검토**) |
| | | `unitTest` | `unitTestMeta`, `unitResultOptions`, `pageSizeOptions`, `getUnitTestList`, `matchUnitFilters`, `unitResultClass`, `defectStatusClass` |
| 단위테스트 상세 | `UnitTestDetailModal.vue` | `testConfig` | `actionStatusValues`, `defectStatusClass`, `testResultClass` (**유지검토**) |
| | | `unitTest` | `unitTestResultSegments` |
| 시나리오 | `ScenarioView.vue` | `testConfig` | `bizCategoryOptions`, `pageSizeOptions`, `systemOptions` (**유지검토**) |
| | | `scenario` | `scenarioMeta`, `getScenarioList`, `matchScenarioFilters`, `saveScenarioCase`, `addScenarioCases` |
| 시나리오 편집 | `ScenarioEditView.vue` | `scenario` | `getScenarioEditGroups`, `saveScenarioCase` |
| 시나리오 일괄 | `ScenarioBulkRegisterModal.vue` | `scenario` | `getBulkRegisterPreview`, `validateScenarioBulkRow` |
| 라이브러리 복사 | `ScenarioCopyFromLibraryModal.vue` | `testLibrary` | `libraryList`, `systemOptions`, `bizOptions` |
| 요구사항 검색 | `ScenarioRequirementSearchModal.vue` | `requirement` | `systemOptions`, `getRequirementList` |
| 화면 검색 | `ScenarioScreenSearchModal.vue` | `screenMenuSearch` | `screenSearchSystems`, `searchScreenMenus` |
| 테스트 수행 | `TestRunView.vue` | `testRun` | `getTestRunList`, `computeTestRunKpi`, `matchTestRunFilters`, `isCaseDimmed` |
| | | `testDefect` | `getDefectList`, `updateDefect` |
| 오류 등록 | `TestErrorRegisterModal.vue` | `testDefect` | `getDefectList` |
| 결함 | `DefectView.vue` | `testConfig` | `defectStatusOptions`, `defectGradeOptions`, `deployStatusOptions`, `bizCategoryOptions`, `pageSizeOptions`, `defectStatusClass` (**유지검토**) |
| | | `testDefect` | `getDefectList`, `matchDefectFilters`, `computeDefectKpi`, `updateDefect` |
| 결함 상세 | `DefectDetailModal.vue` | `testConfig` | `actionStatusValues` (**유지검토**) |
| 진척 | `ProgressView.vue` | `testProgress` | `getProgressData`, `donutStyle`, `gaugeStyle` |

---

## 3. `src/data` 파일 → 소비처 역인덱스

실연동 후 **파일 단위로 지울 때** “누가 아직 쓰는지” 확인용.

| data 파일 | 주요 소비처 |
|-----------|-------------|
| `mockUsers.js` | LoginView, PasswordResetModal |
| `headerPopups.js` | AppHeader, GlobalSearch/Notification/MyProjects/MyInfo/MySettings, InboxCalendar, auth store |
| `sidebarMenu.js` | AppShell, AppSidebar |
| `commonOptions.js` | MainDashboard, Performance, TechResource |
| `testConfig.js` | Defect/Unit/Scenario View·모달, useTestContext, unitTest.js(내부) |
| `dashboard.js` | MainDashboardView |
| `dashboardRequirementPopup.js` | RequirementListModal |
| `scheduleChange.js` | MainDashboardView, ProjectStatusView |
| `performance.js` | PerformanceView |
| `techResource.js` | TechResourceView |
| `inbox.js` | InboxView, InboxCalendar |
| `inboxCalendar.js` | InboxCalendar |
| `projectStatus.js` | ProjectStatusView, projectRegister(내부) |
| `projectHistory.js` | ProjectHistoryView |
| `projectDashboard.js` | ProjectDashboardView |
| `projectInfo.js` | ProjectInfoView, TesterChangeModal, project store, projectRegister(내부) |
| `projectRegister.js` | ProjectInfoView, useProjectRegister, project store |
| `approval.js` | ApprovalView, WbsView |
| `menuMgmt.js` | MenuMgmtView |
| `commonCode.js` | CommonCodeView |
| `userMgmt.js` | UserMgmtView |
| `holiday.js` | HolidayMgmtView |
| `requirement.js` | Requirement*, ScenarioRequirementSearch, ProjectInfo, WbsView |
| `screenMenuSearch.js` | Requirement/Scenario ScreenSearch 모달 |
| `wbs.js` | Wbs*, InboxView, ProjectInfoView |
| `scenario.js` | ScenarioView/Edit, ScenarioBulkRegister |
| `testLibrary.js` | TestCaseView, ScenarioCopyFromLibrary |
| `unitTest.js` | UnitTestView, UnitTestDetailModal |
| `testRun.js` | TestRunView |
| `testDefect.js` | DefectView, TestRunView, TestErrorRegisterModal |
| `testProgress.js` | ProgressView |

검증 명령:

```bash
rg "from '@/data/" src --glob '*.{vue,js}'
```

---

## 4. 관련 문서

| 문서 | 역할 |
|------|------|
| `SOURCE_TREE.md` | 파일 트리 · data 카탈로그 |
| `PROJECT_STRUCTURE.md` | 구조 원칙 |
| `TEST_ACCOUNTS.md` | 목업 로그인 계정 (실연동 후 폐기) |
| `DESIGN_GUIDE.md` | UI 토큰 (목업과 무관) |
