# H-PMS 화면·기능 구현 체크리스트

> 목업 UI 기준입니다. **API/실서버 연동은 범위 밖**이며, 화면이 동작하고 목업 데이터가 반영되면 `O`로 봅니다.  
> `alert`만 뜨거나 버튼이 비어 있으면 `X`.  
> 최종 확인일: 2026-07-14 (소스 기준)

## 범례

| 표기 | 의미 |
|------|------|
| **O** | 구현됨 (UI·로컬 동작, 목업 데이터) |
| **X** | 미구현 / alert 스텁 / 핸들러 없음 |
| **△** | 일부만 구현 (표시만, 부분 동작, 메시지 통합 등) |
| 공용 View | DEV/운영 또는 통합/개별이 **같은 파일** |

기능 항목과 별도로, 화면마다 **예외 처리** 소절을 둡니다.  
(필수값·선택필수·비즈니스 규칙·confirm·상태 가드)

## 의도적 합침 (누락이 아님)

- O 프로젝트 **등록** + **정보** → `ProjectInfoView` (+ 이름 모달)
- O 변경이력 **통합** + **개별** → `ProjectHistoryView` (라우트 분기)
- O DEV / 운영 테스트 하위 → 공용 View + `mode=dev|uat`

---

## 0. 공통 셸 · 인증 · 헤더

### 로그인 `LoginView` · `/login`
**기능**
- O ID/PW 로그인 · 세션
- O ID 저장
- O 비밀번호 표시 토글
- O 실패 횟수 / 잠금 안내 (목업)
- O 비밀번호 재설정 모달 진입
- △ 로그인 좌측 KPI 칩 (하드코딩 표시)

**예외 처리**
- O ID/PW 빈값
- O 미등록 계정
- O 잠금·휴직·퇴직 상태 차단
- O 비밀번호 불일치 → failCount 증가
- O failCount ≥ 5 → 재설정 안내
- O 시스템 오류 try/catch
- X 로그인 전 confirm (해당 없음으로 볼 수 있음)

### 비밀번호 재설정 `PasswordResetModal` (POP-M-COM-03)
**기능**
- O 본인확인(이름·사번·전화) → 인증번호 발송/재발송
- O 인증 → 신규 비밀번호 · 확인 입력 · 저장
- O 타이머(180초) · 정책 안내 카드

**예외 처리**
- O 이름/사번/전화 **필수(빈값) 차단** — 전용 필수 메시지
- O 임직원 정보 불일치
- O 인증시간 만료
- O 인증번호 빈값 / 불일치
- O 신규 비밀번호 빈값
- O 비밀번호 확인 빈값
- O 비밀번호 정책(8자+ / 2종+ / 동일문자 3연속 금지 / 공백 금지)
- O 신규 ≠ 확인
- O 기존 비밀번호와 동일 불가
- O 저장 전 confirm
- O **미인증 상태에서 저장 클릭 차단**

### 앱 셸 · 탭 · LNB
- O AppShell / Header / Sidebar
- O 1단 탭 · 2단 탭 동기화
- O 프로젝트 탭 생성·전환
- O 테마(화면 컨셉) 전환 (내 정보)

### 헤더 팝업
- O 통합검색 `GlobalSearchModal` (POP-M-COM-04)
- O 알림 `NotificationModal` (POP-M-COM-05)
- O 내 프로젝트 `MyProjectsModal` (POP-M-COM-06)
- O 내 정보 `MyInfoModal` (POP-M-COM-07)

### 프로젝트 등록 진입 `ProjectNameRegisterModal`
**기능**
- O LNB/라우트 → 프로젝트명 모달
- O 드래프트 생성 후 `/project/info` 등록 모드
- O `/integrated/project/register` 리다이렉트 처리

**예외 처리**
- O 프로젝트명 빈값 (인라인 에러)
- X 등록 confirm

---

## 1. 통합 관리

### 메인 대시보드 `MainDashboardView` · `/dashboard/main`
**기능**
- O 필터 · 조회 · 초기화 · 확장
- O 차트(처리단계·완료율·발의주체·개발구분·적요)
- O 프로젝트 목록 · 엑셀
- O 행 클릭 → 프로젝트 정보
- O 지연 → 일정변동 모달 (POP-M-DAS-03)
- O 요청부서 클릭 → 요구사항 팝업 (POP-M-DAS-02)

**예외 처리**
- X 조회/필터 전용 — 저장 검증 해당 없음
- O POP-M-DAS-02 조회 팝업

### 실적 관리 `PerformanceView` · `/dashboard/performance`
**기능**
- O 필터 · 월 프리셋
- O KPI · 차트 · 인력별 실적 테이블
- O 엑셀

**예외 처리**
- X 조회 전용 — 저장/필수 검증 해당 없음

### 테크 리소스 `TechResourceView` · `/dashboard/tech-resource`
**기능**
- O 필터 · 확장
- O 인력–프로젝트 nested 테이블 · 엑셀
- O 경과 → DelayTask 모달 (POP-M-DAS-05)
- O 업무수 → WBS 이동

**예외 처리**
- X 조회 전용

### 내업무 `InboxView` · `/inbox`
**기능**
- O 요약 칩 · 진행/대기 롤링
- O 카드형 목록
- O 캘린더형 (`InboxCalendar`)
- O 캘린더 태스크 → WBS 일정관리 / 일정 등록 연결

**예외 처리**
- O 캘린더 → 프로젝트 WBS 이동 (일정 모달 진입)

### 프로젝트 현황 `ProjectStatusView` · `/integrated/project/status`
**기능**
- O 필터 · KPI 클릭 필터 · 테이블 · 페이징 · 엑셀
- O 프로젝트 등록 모달 진입
- O 지연 → 일정변동 모달
- O JIRA 링크 · 프로젝트명 → 정보
- O 요청부서 → POP-M-DAS-02
- △ 확장 필터 일부 “연동 예정” 표시

**예외 처리**
- X 조회 전용

### 프로젝트 변경이력 (통합) `ProjectHistoryView` · `/integrated/project/history`
**기능**
- O 필터(분류/기간/프로젝트/부서)
- O 목록 · 행 확장 · 상세 모달 · 엑셀 · 페이징

**예외 처리**
- X 조회 전용

### 테스트 라이브러리 `TestCaseView` · `/integrated/test-library`
**기능**
- O 필터 · 아코디언 목록 · 전체 펼침
- O 엑셀 · 페이징

**예외 처리**
- X 조회 전용

---

## 2. 시스템 관리

### 신청 승인 `ApprovalView` · `/admin/approval`
**기능**
- O 필터 · 목록 · 상세 패널 · 엑셀 · 페이징
- O 승인완료 / 승인반려 (선택·상태 검증, 로컬)
- O 프로젝트 바로가기

**예외 처리**
- O 대상 미선택
- O 승인요청 상태만 처리 가능
- O 승인/반려 전 confirm

### 화면(메뉴) 관리 `MenuMgmtView` · `/admin/menus`
**기능**
- O 시스템/업무구분 사이드 · 행 추가/삭제
- O 저장(로컬+alert) · 엑셀

**예외 처리**
- O 삭제 대상 미선택
- O 삭제 confirm
- O 저장 시 화면명 필수 · confirm

### 공통코드 `CommonCodeView` · `/admin/common-code`
**기능**
- O 카테고리 · 코드 추가/수정 모달
- O 일괄 저장(로컬+alert)

**예외 처리**
- O 코드·코드명 필수 (모달)
- O 신규 코드 중복
- O 일괄저장: 코드·코드명 필수 · 중복 · confirm

### 사용자 관리 `UserMgmtView` · `/admin/users`
**기능**
- O 필터 · 체크 · 페이징
- O 사용자 등록 모달 · 목록 반영
- O 오류횟수 해제 / 패스워드 초기화 (로컬+alert · confirm)
- O 상세 **저장** (권한 반영)

**예외 처리**
- O 오류해제·PW초기화 미선택
- O 등록: 사번·이름 필수
- O 사번 중복
- O 해제/초기화/등록·상세저장 전 confirm
- O 상세 권한 선택 필수

### 휴무일 `HolidayMgmtView` · `/admin/holiday`
**기능**
- O 필터 · 등록/수정 모달 · 삭제 · 엑셀

**예외 처리**
- O 일자·휴무일명 필수
- O 삭제 confirm
- O 일자 중복 체크

---

## 3. 개별 프로젝트

### 프로젝트 정보 `ProjectInfoView` · `/project/info`
**기능**
- O 등록 / 수정 / 조회 모드
- O 처리단계 · 시스템·업무구분 · 담당자
- O 테스트 사용여부 · 라이브러리/시나리오
- O DEV/운영 차수 · STG 등
- O 저장 검증 (필수·JIRA 중복·담당자 등)
- O 일정변동 사유 입력 모달 (POP-S-INF-04)
- O 테스터 변경 모달 (POP-S-INF-02)
- O 이슈 등록
- O 이슈 **수정** / **답글**

**예외 처리**
- O 등록 시 JIRA / IT-VOC 필수
- O JIRA 중복
- O 프로젝트명·오픈예정일·업무범주·발의/개발/적요·요청부서·요청자
- O 담당자 최소 1명 · 역할당 최대 · 역할 간 중복
- O 테스트 유형·라이브러리 등 (설정 시)
- O 완료 시 오픈일 필수
- O 오픈일 > 예정일 → 변동 사유 모달 강제
- O Dirty 취소 confirm
- O WBS 있는 담당자 삭제 차단
- O 이슈 본문 빈값 등록 차단
- O 저장 전 confirm

### 테스터 변경 `TesterChangeModal`
**예외 처리**
- O 대상·변경후 담당자·적용일 필수 (`canSubmit` → 버튼 disabled)
- O 적용일 ≥ 오늘
- O 본인(동일 담당자) 변경 불가
- X alert 문구형은 없음 (disabled만)
- X 변경 전 confirm

### 일정 변동 사유 입력 `ScheduleReasonInputModal`
**예외 처리**
- O 사유 빈값 → 저장 disabled + early return
- X confirm

### 프로젝트 변경이력 (개별) · `/project/history`
**기능**
- O 공용 View · 현재 프로젝트 범위
- O 필터 축소 · 상세/엑셀

**예외 처리**
- X 조회 전용

### 프로젝트 대시보드 `ProjectDashboardView` · `/project/dashboard`
**기능**
- O 일정현황 · 공정률 · 지연/단축 · 업무 요약
- O 엑셀 · WBS 이동
- △ “자동 갱신 (목업)” 표시만

**예외 처리**
- X 조회 전용

### 요구사항 `RequirementView` · `/project/requirement`
**기능**
- O 필터 · 테이블 · 선택 · 펼침 · 페이징 · 엑셀
- O 개별 등록/상세 (`RequirementFormModal`)
- O 이슈/협의 (`RequirementIssueModal`)
- O 복사 · 저장 확인
- O **일괄등록** (양식·업로드·검증·confirm)
- O **화면(메뉴) 검색** — 등록/상세 폼 진입 (시스템 자동·조회 후 선택·확인만)
- X 툴바 **화면설정**(선택 행 일괄) — 스텁 유지

**예외 처리**
- O 요건확정 미선택
- O 미확정 건 확정 차단
- O 복사 미선택 · 복사 confirm
- X 일괄등록/화면설정 검증 (기능 스텁)

### 요구사항 등록/상세 `RequirementFormModal`
**예외 처리**
- O 요구사항명·원안 필수
- O 시스템·업무구분·업무유형 필수
- O 저장 confirm
- O 확정/반려 시 필드 잠금

### WBS `WbsView` · `/project/wbs`
**기능**
- O 목록 / 캘린더
- O 필터 · 내업무만 · 작업제외 표시
- O 담당자 변경 · 작업제외 · 복사 · 저장
- O 일정 모달 (POP-S-WBS-02) · 변동 사유 (POP-S-WBS-03)
- O 엑셀 · 요구사항 링크
- O **일정변경 일괄** (POP-S-WBS-04) — 선택·계획일정·사유·승인요청

**예외 처리**
- O 작업제외 미선택
- △ 작업제외 조건 불충족 시 안내 없이 스킵
- O 복사 미선택 · 복사 confirm
- O 저장 confirm
- O 일괄 일정변경: 미선택 · 계획일정 · 사유 · confirm
- O `WbsScheduleModal` 날짜 유효성 (계획 필수·시작≤종료)

### 단위테스트 `UnitTestView` · `/project/unit-test`
**기능**
- O 필터 · 테이블 · 페이징 · 엑셀
- O 상세 모달 (결과/절차/결함/저장)
- △ 첨부 추가 (가짜 파일, 실업로드 없음)

**예외 처리**
- O 상세 저장 전 결과 선택 · 오류 시 결함 제목 · confirm
- O 오류인데 결함 제목 없으면 저장 차단

---

## 4. DEV / 운영 테스트 (공용 View × mode)

### 시나리오 관리 `ScenarioView` · `/project/scenario/:mode`
**기능**
- O 필터 · 아코디언 · 전체 펼침 · 페이징 · 엑셀
- O 시나리오 편집 화면 이동
- O 일괄등록 모달 (POP-UAT-03)
- O `dev` / `uat` 라우트 모두 연결

**예외 처리**
- X 목록 자체는 조회·등록 진입 위주 (편집 화면에서 검증)

### 시나리오 편집 `ScenarioEditView` · `.../edit`
**기능**
- O 절차 추가/이동/삭제 · 저장(로컬)
- O **WBS에서 불러오기**
- O **라이브러리에서 복사**

**예외 처리**
- O 절차/기대결과·케이스명 필수 검증
- O 저장 confirm

### 테스트 수행 `TestRunView` · `/project/test-run/:mode`
**기능**
- O 필터 · KPI · 내테스트만
- O 케이스 펼침 · 절차별 결과
- O 오류등록 모달 · 엑셀
- O `dev` / `uat`

**예외 처리**
- O 결과=오류 시 오류등록 모달 필수 (그 외 즉시 반영)
- O `TestErrorRegisterModal` 제목·내용·담당자 필수

### 결함 관리 `DefectView` · `/project/defect/:mode`
**기능**
- O 필터 · KPI · 상세 모달(저장/처리완료/오류아님)
- O 엑셀 · 페이징 · mode 분기

**예외 처리**
- O 상세 저장·처리완료/오류아님: 담당자 필수 · confirm

### 진척 관리 `ProgressView` · `/project/progress/:mode`
**기능**
- O KPI · 도넛 · 상세 · 테스터/유형별 (조회 전용)
- O mode별 unitCompare 등 분기
- △ “1시간마다 갱신 (목업)” 표시만
- O 필터(시스템·테스터) · 엑셀

**예외 처리**
- X 조회 전용

---

## 5. 팝업 · 모달 구현 여부

| ID / 명칭 | 파일 | 기능 | 예외 |
|-----------|------|------|------|
| POP-M-COM-03 비밀번호 재설정 | `PasswordResetModal` | O | O |
| POP-M-COM-04 통합검색 | `GlobalSearchModal` | O | — |
| POP-M-COM-05 알림 | `NotificationModal` | O | — |
| POP-M-COM-06 내 프로젝트 | `MyProjectsModal` | O | — |
| POP-M-COM-07 내 정보 | `MyInfoModal` | O | — |
| POP-M-DAS-02 요구사항(부서) | `RequirementListModal` | O | — 조회 |
| POP-M-DAS-03 일정변동 사유 | `ScheduleChangeModal` | O | — (조회) |
| POP-M-DAS-05 경과 업무 | `DelayTaskModal` | O | — (조회) |
| 프로젝트명 등록 | `ProjectNameRegisterModal` | O | O 빈값 |
| POP-S-INF-02 테스터 변경 | `TesterChangeModal` | O | O disabled 가드 |
| POP-S-INF-04 일정변동 사유 입력 | `ScheduleReasonInputModal` | O | O 빈값 |
| 변경이력 상세 | `ProjectHistoryDetailModal` | O | — |
| 요구사항 등록/상세 | `RequirementFormModal` | O | O |
| 요구사항 이슈 | `RequirementIssueModal` | O 조회 | — |
| POP-S-WBS-02 일정관리 | `WbsScheduleModal` | O | O 날짜검증 |
| POP-S-WBS-03 변동 사유 | `WbsScheduleReasonModal` | O | — |
| POP-S-WBS-04 일괄 일정변경 | `WbsBulkScheduleModal` | O | O |
| 단위테스트 상세 | `UnitTestDetailModal` | O | O |
| 시나리오 일괄등록 | `ScenarioBulkRegisterModal` | O | △ 목업 |
| 오류 등록 | `TestErrorRegisterModal` | O | O |
| 결함 상세 | `DefectDetailModal` | O | O |

---

## 6. 합의 대기 (모호·스코프 큰 기능 — 하나씩 결정 후 구현)

1. O **POP-M-DAS-02** — 요청부서 → 요구사항 목록 팝업 (조회 · X닫기 · 요구사항 관리 이동)
2. O **요구사항 일괄등록** · O **화면(메뉴) 검색**(등록 폼) · X 툴바 화면설정(일괄)
3. O **WBS** 일괄 일정변경 (POP-S-WBS-04)
4. O **시나리오 편집** WBS 불러오기 · 라이브러리 복사
5. O **내업무 캘린더** → WBS 일정 / 일정 등록 연결
6. O **진척관리** 필터·엑셀
7. O **프로젝트 정보** 저장 전 confirm
8. O **메뉴/공통코드** 일괄저장 행 검증 (+삭제/저장 confirm)
9. O **테스트 수행** 결과=오류 시 오류등록 모달 필수 (그 외 즉시 반영)

### 이번에 막은 것 (X→O)
- O 비밀번호 재설정: 필수 메시지 · 인증번호 빈값 · 미인증 저장 가드
- O 사용자 상세 저장 · 해제/초기화 confirm
- O 신청승인 confirm · 휴무일 일자 중복
- O 프로젝트 정보 이슈 수정/답글
- O 요구사항 폼 * 필드 저장 검증
- O WBS 일정 날짜 검증
- O 시나리오 편집 저장 검증+confirm
- O 오류등록·결함·단위테스트 저장 검증(+confirm)

### 목업 한계 (인지용 · O)
- O 데이터: `src/data/*` 인메모리
- O 엑셀: 클라이언트 `mockExcelDownload`
- O alert / confirm 기반 피드백 (공통 알럿 UI 미도입)

---

## 7. 예외 처리 요약 (재검증용)

| 화면/모달 | 상태 | 비고 |
|-----------|------|------|
| PasswordReset | O | |
| ProjectInfo | O | |
| Login | O | |
| Approval | O | |
| UserMgmt | O | |
| Holiday | O | |
| RequirementForm | O | |
| WbsScheduleModal | O | |
| ScenarioEdit 저장 | O | |
| TestErrorRegister | O | |
| Defect 상세 | O | |
| UnitTest 상세 | O | |
| Menu / CommonCode 일괄저장 | O | |
| TestRun 절차 결과 | O | 오류→모달 |

---

## 8. 화면 골격 일괄 체크 (라우트 ↔ View)

| 영역 | 화면 | 라우트 | View | 골격 |
|------|------|--------|------|------|
| 인증 | 로그인 | `/login` | LoginView | O |
| 통합 | 메인 대시보드 | `/dashboard/main` | MainDashboardView | O |
| 통합 | 실적 관리 | `/dashboard/performance` | PerformanceView | O |
| 통합 | 테크 리소스 | `/dashboard/tech-resource` | TechResourceView | O |
| 통합 | 내업무 | `/inbox` | InboxView | O |
| 통합 | 프로젝트 현황 | `/integrated/project/status` | ProjectStatusView | O |
| 통합 | 변경이력(전체) | `/integrated/project/history` | ProjectHistoryView | O |
| 통합 | 테스트 라이브러리 | `/integrated/test-library` | TestCaseView | O |
| 시스템 | 신청 승인 | `/admin/approval` | ApprovalView | O |
| 시스템 | 화면(메뉴) | `/admin/menus` | MenuMgmtView | O |
| 시스템 | 공통코드 | `/admin/common-code` | CommonCodeView | O |
| 시스템 | 사용자 | `/admin/users` | UserMgmtView | O |
| 시스템 | 휴무일 | `/admin/holiday` | HolidayMgmtView | O |
| 프로젝트 | 정보(등록·수정) | `/project/info` | ProjectInfoView | O |
| 프로젝트 | 변경이력 | `/project/history` | ProjectHistoryView | O |
| 프로젝트 | 대시보드 | `/project/dashboard` | ProjectDashboardView | O |
| 프로젝트 | 요구사항 | `/project/requirement` | RequirementView | O |
| 프로젝트 | WBS | `/project/wbs` | WbsView | O |
| 프로젝트 | 단위테스트 | `/project/unit-test` | UnitTestView | O |
| 테스트 | 시나리오 DEV/운영 | `/project/scenario/:mode` | ScenarioView | O |
| 테스트 | 시나리오 편집 | `.../edit` | ScenarioEditView | O |
| 테스트 | 수행 DEV/운영 | `/project/test-run/:mode` | TestRunView | O |
| 테스트 | 결함 DEV/운영 | `/project/defect/:mode` | DefectView | O |
| 테스트 | 진척 DEV/운영 | `/project/progress/:mode` | ProgressView | O |

---

## 사용 방법

1. **§6·§7**에서 기능 누락 / 예외 약점 후보를 먼저 본다.
2. 화면별 **기능**과 **예외 처리**를 각각 O / X / △로 재검증한다.
3. 기획 SB에만 있고 없는 항목은 행을 추가한다.

관련: `SOURCE_TREE.md`, `PROJECT_STRUCTURE.md`, `sidebarMenu.js`
