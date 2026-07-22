# HPMS ERD(pms_erd_v2_3_test_module.sql) 대비 목업 비교 리스트

> 첨부된 PostgreSQL DDL(24+ 테이블, FK/인덱스/코멘트 포함)과 현재 목업 구현(`src/data/*.js`, `src/views/*.vue`, `src/components/**/*.vue`)을 테이블 단위로 대조한 결과입니다.
> - **전제**: ERD의 한글 코멘트는 기획서가 확정되기 전 초안 버전이라, 코멘트에 적힌 구체적인 값 목록·라벨(예: 발의주체 3종, 적요 3종, role 3종 등)은 최신이 아닙니다. 이런 **순수 값/라벨 차이는 조치 대상에서 제외**하고 ⚪로 표기했습니다(목업 값을 그대로 유지하면 됨). 대신 컬럼/테이블 존재 여부, FK·유니크 제약 같은 **구조적 사실**과, 코드를 직접 읽어 확인한 **실제 동작(버그성 발견)**만 조치가 필요한 항목으로 남겼습니다.
> - 목업은 SPA 프론트엔드 + 하드코딩 mock data 구조라 DB/백엔드가 실재하지 않습니다. 아래 항목은 "실제 DB로 전환 시 무엇을 보완해야 하는지"에 초점을 맞췄습니다.

**범례**
- 🔴 **누락**: ERD 구조(컬럼/테이블)에 대응하는 개념이 목업에 전혀 없음 — 실제 보완 후보
- 🟣 **불일치**: 목업 내부의 서로 다른 파일/화면이 같은 개념을 다르게 관리 (데이터 이원화) — ERD와 무관하게 그 자체로 버그성 문제
- 🟡 **동작 확인됨**: 코드를 직접 읽어 확인한 실제 동작 이슈 (승인 워크플로우 미작동 등)
- ⚪ **참고용**: ERD 코멘트상 값/라벨 차이 — 조치 불필요, 목업 값 유지
- 🔵 **확인 필요**: 저사양 확인만 못한 항목(추가 확인 권장, 급하지 않음)

---

## 1. `codes` (공통코드)

- 🟣 **불일치**: `src/data/commonCode.js`의 `codeCategoryGroups`는 8개 분류(프로젝트 처리단계/요건 우선순위/업무유형/발의주체/개발구분/적요/조치상태/배포상태)만 관리합니다. 반면 시스템구분(SYSTEM)/업무구분(WORK_CATEGORY)/결과값(TEST_RESULT)/결함등급(DEFECT_GRADE) 등 실제로 화면 곳곳에서 쓰이는 값 목록들은 공통코드 화면이 아니라 `requirement.js`, `wbs.js`, `testDefect.js` 등 각 기능 파일에 개별 배열로 흩어져 있습니다. 공통코드 관리 화면에서 값을 추가/수정해도 실사용처엔 반영되지 않는 구조입니다.
- 🟣 **불일치**: `조치상태` 공통코드(`대기/조치중/조치완료/조치불가`, 4종)와 실제 결함 목업(`testDefect.js`)이 쓰는 값(`접수/처리예정/처리완료`, 3종)이 서로 다릅니다 — 공통코드 화면에서 관리하는 값과 실제 결함관리 화면이 쓰는 값이 이미 어긋나 있습니다.
- 🔴 **누락(죽은 코드)**: `testDefect.js`의 `computeDefectKpi()`가 `notError('오류아님')`, `excluded('수정제외')` 상태를 집계하는데, 실제 `baseDefects` 어느 행도 이 상태를 갖지 않고 공통코드 목록에도 해당 라벨이 없습니다 — 존재하지 않는 상태를 집계하는 코드입니다.

## 2. `users`

- 🟣 **불일치(중요)**: 로그인 인증은 `src/data/mockUsers.js`(`findUserById`, 평문 `password`, `failCount`, 잠금/휴직/퇴직 체크)를 사용하고, 사용자관리 화면(`src/views/UserMgmtView.vue`)은 `src/data/userMgmt.js`의 `userList`를 사용합니다. **두 파일이 서로 다른 사용자 레코드 집합**이라 사용자관리 화면에서 계정을 수정해도 실제 로그인 동작엔 반영되지 않습니다.
- ⚪ role/status 라벨 개수 차이(마스터/관리자/사용자/미설정, 재직/휴직/정직/퇴직/잠금) — 목업 값 유지.

## 3. `projects`

- 🔴 **누락**: `projects.created_by/created_at/updated_by/updated_at` — 요구사항·WBS·결함은 등록자/등록일/수정자/수정일을 갖는데, 프로젝트 자체(`ProjectInfoView.vue`, `projectInfo.js`)에는 이 4개 메타 필드가 화면·데이터 어디에도 없습니다.
- 🔴 **누락**: `project_work_scopes`는 (시스템구분, 업무구분, **업무유형**) 3개 조합을 유니크로 관리하는 구조인데, 목업 `workCategories` 배열은 `'HIMS > 프로모션'`처럼 시스템+업무구분 문자열만 저장하고 업무유형 차원이 없으며, 중복 방지 로직도 없습니다.
- 🟣 **불일치**: 공통코드의 `발의주체`(3종)/`적요`(3종)/`개발구분`(3종)과, 실제 프로젝트 등록폼(`projectInfo.js`)의 `initiatorOptions`(4종)/`summaryOptions`(6종)/`devTypeOptions`(2종)가 서로 다릅니다 — 공통코드 관리 화면과 실사용 폼이 이미 어긋나 있는 사례(1번 항목과 같은 유형).
- ⚪ `open_date` 1개 vs 목업의 `scheduledOpenDate`/`actualOpenDate` 분리 관리 — 목업이 더 정교하므로 유지.
- 🔵 **확인 필요**: 역할별 담당자가 0명이어도 프로젝트 등록이 저장되는지(최소 1명 이상 검증 여부) — 급하지 않은 확인.
- ✅ `project_test_settings`(test_types 배열 + 차수별 rounds)는 `testUsage`/`testRoundDev`/`testRoundStg`/`testRoundUat`/`testLibrary` 구조로 잘 대응됩니다.

## 4. `requirements`

- 🔴 **누락**: `screen_code`(화면관리번호) — `requirement.js`의 요구사항 row 어디에도 화면 관리번호 필드가 없습니다.
- 🔴 **누락**: `requester_confirmed_by/at`, `tech_confirmed_by/at` — 목업은 `confirmRequester`/`confirmTech` 상태값(미확정/확정)만 있고, 누가 언제 확정했는지는 저장하지 않습니다.
- 🔴 **누락**: `attachment_url` — 요구사항 등록/수정 폼에 첨부파일 UI(`onAttachmentChange`)가 있으나, `requirement.js`의 실제 row 데이터 구조엔 첨부파일 필드가 없어 저장 후 조회 시 첨부파일이 사라질 가능성이 있습니다.
- ⚪ 요구사항별 `requester` 필드, 업무유형 선택지에 기획/테스트 포함 — 목업 값 유지.
- 🔵 **확인 필요**: 요구사항 확정 후 업무유형을 다중으로 계속 추가/변경할 수 있는 현재 동작이 의도한 정책인지(단순 확인, 급하지 않음).

## 5. `requirement_change_logs`

- 🔵 **확인 필요**: 변경사유 드롭다운 값, "최근 5건 + 더보기" 표시 규칙 — 급하지 않은 확인.

## 6. `issues` / `issue_mentions`

- 🔴 **누락**: `issues.parent_issue_id`는 자기참조 구조라 댓글의 댓글(대댓글)까지 구조적으로 지원 가능한데, 목업(`requirement.js`, `projectInfo.js`의 `issues[].replies[]`)은 이슈→답글 **1단계 고정 배열**입니다. 답글에 다시 답글을 다는 기능이 없습니다.
- 🔴 **누락**: `issue_mentions`는 이슈 1건에 여러 사용자를 멘션할 수 있는 N:M 테이블인데, 목업의 `mention: { name, dept }`는 이슈/답글당 단일 멘션 객체 1개만 저장합니다.
- 🟣 **불일치**: 같은 개념의 타임스탬프 필드명이 파일마다 다릅니다 — `requirement.js`는 `editedAt`, `projectInfo.js`는 `updatedAt`.

## 7. `change_logs` (프로젝트 변경이력 통합 화면)

- 🔵 **확인 필요**: "프로젝트 변경이력" 화면이 프로젝트 설정변경/요구사항변경/WBS변경 3개 로그 소스를 모두 병합해서 보여주는지 — 이번 대조에서 `ProjectHistoryView.vue`의 데이터 소스 파일까지는 확인하지 못했습니다.

## 8. `wbs_tasks`

- 🔴 **누락**: `test_type_code`, `test_round` — WBS의 테스트 업무 행(단위테스트/DEV테스트/운영테스트-1차/2차)이 이 값을 구조화된 컬럼이 아니라 `requirementName` 문자열("운영테스트-1차")에 텍스트로만 담고 있습니다.
- 🔴 **누락**: `requirement_work_type_id` — WBS 행은 `requirementId`만 참조하고, 어떤 업무유형에서 파생됐는지 추적하는 연결이 없습니다.
- 🔴 **누락**: `is_unit_test_required` — 대응 필드가 없습니다.
- 🟡 **동작 확인됨**: `confirmed_by`/`confirmed_at`을 별도 저장하지 않고 범용 `changedBy`/`changedAt`을 재사용해, 확정 이력만 따로 추적할 수 없습니다.

## 9. `wbs_change_logs` / `wbs_approvals` — 가장 중요한 발견

- 🟡 **동작 확인됨(핵심)**: `WbsView.vue`의 `onScheduleChangeRequest()`는 승인요청 레코드(상태 `승인요청`)를 만드는 것과 **동시에 `tasks.value`를 즉시 직접 수정**합니다(코드 주석: "행별 변경 일정 반영 (승인요청 목업 — 목록에 즉시 반영)"). **승인/반려 결과와 무관하게 일정 변경이 이미 적용**되는 상태입니다.
- 🟡 **동작 확인됨**: `ApprovalView.vue`에서 "승인반려"를 눌러도 `approvalList`의 상태만 바뀔 뿐 WBS의 실제 일정은 롤백되지 않습니다. `wbsIds` 필드는 저장만 되고 어디서도 읽히지 않는 write-only 필드입니다.
- 🔴 **누락**: 승인 데이터 모델에 `approver_id`가 없습니다. 정적 `approverOptions` 드롭다운만 UI에 있고 실제 승인 레코드와 연결되지 않습니다.
- 🔴 **누락**: `share_user_id`(공유대상자), `rejection_reason`(별도 반려 사유) 대응 필드가 없습니다(반려 사유는 요청 사유 필드를 재사용).
- 🟡 **동작 확인됨**: `processed_at`이 실제 처리 시각이 아니라 `applyStatus()` 내 하드코딩된 날짜(`'2026-05-21'`)로 고정되어 있습니다.

## 10. `test_scenarios` / `test_cases`

- 🔴 **누락**: `test_cases.source_type` — `scenario.js`의 케이스 row에 생성 출처(자동생성/불러오기/신규등록/라이브러리복사/엑셀일괄)를 저장하는 필드가 전혀 없어, 저장된 케이스가 어느 경로로 만들어졌는지 데이터상 구분이 불가능합니다.
- 🔴 **누락**: `library_origin_project` — 라이브러리에서 복사된 케이스가 시나리오로 들어온 뒤엔 출처 프로젝트명이 유지되지 않습니다(`testLibrary.js` 쪽엔 `sourceProject`가 있지만 복사 시 시나리오 케이스로 넘어오지 않음).
- 🔵 **확인 필요**: `wbs_item_id`/`requirement_id`가 둘 다 없는 케이스(신규등록/라이브러리복사 시 화면만 지정) 실데이터 예시가 없어 검증되지 않음.

## 11. `test_case_procedures` / `test_case_testers` / `test_procedure_results` / `test_performance_memos`

- ✅ 기본테스터/개별테스터 구분, 절차별 결과, 테스터별 메모는 각각 `TestRunTesterChangeModal.vue`/`TestRunView.vue`/`TestRunInfoModal.vue`에 잘 대응됩니다.
- 🔵 **확인 필요**: 결함의 조치확인 상태 변경 시 원본 테스트 절차 결과값이 자동으로 갱신되어야 하는데, `testDefect.js`의 `updateDefect()`는 `test_defects.status`만 바꾸고 절차(procedure/step) 쪽 결과를 갱신하는 코드가 보이지 않습니다 — 두 데이터 간 자동 연동 여부 확인 필요.

## 12. `test_defects`

- 🔴 **누락(중요)**: `DefectDetailModal.vue`/`TestErrorRegisterModal.vue`에 첨부파일 업로드 UI가 있지만, **`testDefect.js`의 실제 row 데이터 구조엔 `attachments` 필드 자체가 없습니다.** 첨부파일을 올려도 결함 데이터에 저장되지 않는 것으로 보입니다.
- ✅ 조치확인 결과(재처리요청→접수 회귀, 수정완료→처리완료) 자동 회귀 로직은 `updateDefect()`에 정확히 구현되어 있습니다.
- ⚪ action_status 라벨 개수/명칭 차이 — 목업 값 유지.

## 13. `test_library_sets` / `test_library_cases` / `test_library_procedures`

- 🟣 **불일치(중요)**: 프로젝트 정보 화면(`projectInfo.js`)의 `testLibraryScenarios`(선택된 시나리오 라벨 목록)와, 실제 테스트 라이브러리 데이터(`testLibrary.js`의 `libraryList`)가 서로 다른, 연결되지 않은 데이터입니다. 프로젝트 쪽엔 등록 여부 플래그(`hasRegisteredTestCases`, `testLibrary: '등록'`)만 있고, 이걸 눌렀을 때 `libraryList`에 실제로 새 세트가 추가되는 연결 코드가 없습니다.
- 🔴 **누락**: 동일 `sourceProjectId`로 라이브러리를 중복 등록하는 것을 막는 검증이 없습니다.
- ✅ 원본 프로젝트/케이스에 FK 없이 스냅샷으로 저장하는 설계는 `libraryList`/`flattenLibraryCases()` 구조와 정확히 일치합니다.

## 14. 기타 구조적 관찰

- 🟣 **불일치**: 사용자 식별자 형식이 파일마다 다릅니다 — `userMgmt.js`는 사번 형식(`'20210315'`)을 쓰는 반면, 요구사항/WBS/시나리오 등 대부분의 mock 데이터는 이름 문자열(`'김현대'`, `'권현대'`)을 담당자 식별자로 그대로 사용합니다. 실제 전환 시 이름 문자열 전부를 사번 기반 ID로 치환하는 작업이 필요합니다.
- 🔵 **확인 필요**: 폴리모픽 FK(`target_type`+`target_id`) 개념을 도입할지, 아니면 지금처럼 요구사항/프로젝트 이슈를 분리된 배열로 유지할지 — 설계 방향 결정 필요(급하지 않음).

---

## 우선순위 제안 (Top 5)

ERD 코멘트 버전과 무관하게, 코드를 직접 읽어 확인했거나 목업 내부에서 서로 다른 데이터가 충돌하는 **실제 문제** 위주로 선정했습니다.

1. **사용자 데이터 이원화** (`mockUsers.js` ↔ `userMgmt.js`) — 로그인 계정과 사용자관리 화면이 다른 데이터를 봄
2. **WBS 승인 워크플로우 미작동** — 승인/반려와 무관하게 일정 변경이 즉시 반영됨 (결재 기능이 사실상 장식)
3. **테스트 라이브러리 등록 플로우 미연결** — 프로젝트 정보 화면의 "등록" 플래그가 실제 라이브러리 데이터에 반영 안 됨
4. **결함 첨부파일 미저장** — UI는 있으나 데이터 모델에 필드가 없어 저장이 안 되는 것으로 보임
5. **공통코드 관리 범위와 실사용처 불일치** — 공통코드 화면에서 관리하는 값과 실제 등록폼/필터가 쓰는 값이 이미 여러 군데서 어긋나 있음
