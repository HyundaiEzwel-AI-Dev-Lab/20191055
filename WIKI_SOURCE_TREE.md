# H-PMS Frontend Source Tree

> Vue 3 + Vite + Pinia + Vue Router 기반 프론트엔드 (목업 데이터)  
> 원칙: **화면 1개 = View 1파일**, CSS는 `src/assets/styles/`에 집중  
> `node_modules/`, `dist/` 는 빌드·의존성 산출물이므로 제외

---

## 루트

```
HPMS/
├── index.html                          # Vite 진입 HTML (단 하나)
├── package.json                        # 의존성·npm 스크립트 (dev/build/preview)
├── package-lock.json                   # 의존성 잠금 파일
├── vite.config.js                      # Vite 설정 (@ → src 별칭, 개발 서버)
├── .gitignore                          # Git 제외 규칙
├── README.md                           # 실행법·로고 교체 안내
├── PROJECT_STRUCTURE.md                # 폴더/화면 구조 기준 문서
├── DESIGN_GUIDE.md                     # 색상·폰트·간격 디자인 토큰 가이드
├── HPMS_공통레이아웃_정의.md            # Header/LNB/Tab/공통 UX 정의
├── TEST_ACCOUNTS.md                    # 테스트 계정·로그인 화면 안내
├── WIKI_SOURCE_TREE.md                 # 본 문서 (소스 트리·파일별 설명)
├── MAIN_DASHBOARD_REDESIGN.md          # 메인 대시보드 리디자인 초안(미적용) 목업·색상 토큰 기록
├── CLAUDE.md / CURSOR.md               # AI 코딩 에이전트 작업 가이드 (+ 화면 컨셉 작업 규칙)
├── .cursor/rules/design-system.mdc     # Cursor용 디자인 토큰·화면 컨셉 규칙 (alwaysApply)
├── .agents/skills/, .claude/skills/    # 설치된 서드파티 Agent Skill 팩 (디자인 취향 스킬 13종)
├── skills-lock.json                    # 위 스킬 설치 잠금 파일
├── public/
│   └── logo.png                        # 앱 로고 (파일명 고정, 이미지만 교체)
└── src/                                # 애플리케이션 소스
```

---

## `src/` 진입·라우팅·상태

```
src/
├── main.js                             # 앱 부트스트랩 (Pinia·Router·전역 CSS 연결)
├── App.vue                             # 최상위: AppShell + <router-view>
│
├── router/
│   └── index.js                        # 전체 화면 URL 라우팅·가드(로그인/프로젝트)
│
├── stores/                             # Pinia 전역 상태
│   ├── auth.js                         # 로그인 세션·사용자 정보
│   ├── tabs.js                         # 1단 Tab (통합 메뉴 + 프로젝트 탭)
│   ├── subTabs.js                      # 2단 Tab (프로젝트 하위 메뉴, projectId별)
│   ├── project.js                      # 현재 프로젝트·등록중(draft)·프로젝트 가드
│   └── theme.js                        # 화면 컨셉(기본/프리미엄/다크) 선택·localStorage 저장
│
├── composables/                        # 화면 공통 로직
│   ├── useSidebar.js                   # LNB 펼침/접힘
│   ├── useLayoutTabs.js                # 라우트 변경 시 1·2단 탭 동기화
│   ├── useProjectRegister.js           # 프로젝트 등록 모달·탭 생성 플로우
│   └── useTestContext.js               # DEV/운영(uat) 테스트 화면 공통 컨텍스트
│
└── utils/
    ├── excelDownload.js                # 엑셀(.xlsx) 실다운로드 (xlsx 라이브러리)
    ├── tabs.js                         # 탭 관련 헬퍼
    └── text.js                         # 텍스트 유틸 (프로젝트명 truncate 등)
```

---

## `src/assets/` 스타일·아이콘

```
src/assets/
├── icons/
│   └── excel-icon.png                  # 엑셀 다운로드 버튼 아이콘
└── styles/
    ├── tokens.css                      # :root 디자인 토큰 (색·간격·폰트)
    │                                    #   + :root[data-concept="premium"|"dark"] 오버라이드
    │                                    #   (화면 컨셉별 색·라운드·그림자·이징 재정의)
    ├── base.css                        # reset, 기본 타이포, page 컨테이너
    ├── components.css                  # 버튼·뱃지·테이블·모달 등 공통 컴포넌트 (.card 포함)
    ├── layout.css                      # 헤더·LNB·탭·헤더 팝업(검색/알림/내정보 컨셉 전환 등)
    └── admin.css                       # 시스템관리 화면 공통 레이아웃/필터/테이블
```

**화면 컨셉(테마) 시스템**: `내 정보` 팝업(`MyInfoModal.vue`) 상단에서 기본/프리미엄/다크 중 선택 →
`stores/theme.js`가 `<html data-concept="...">`에 반영 + `localStorage` 저장 → `tokens.css`의
`:root[data-concept="..."]` 블록이 공용 토큰(`--teal*`, `--radius-*`, `--shadow-*`, `--lnb-*` 등)을
덮어써서 전역 적용. 새 UI 작성 시 이 토큰들을 하드코딩하지 말 것 (`CLAUDE.md` / `.cursor/rules/design-system.mdc` 참고).

---

## `src/components/` 공통·도메인 컴포넌트

```
src/components/
├── layout/                             # 앱 셸
│   ├── AppShell.vue                    # 헤더+LNB+본문 골격
│   ├── AppHeader.vue                   # 1단 Tab + 검색/알림/내프로젝트/내정보
│   ├── AppSidebar.vue                  # 접이식 LNB (Zippy)
│   ├── SidebarIcon.vue                 # LNB 아이콘 SVG
│   ├── TabBar.vue                      # 1단 Tab UI
│   └── SubTabBar.vue                   # 2단 Tab UI
│
├── ui/                                 # 재사용 UI
│   ├── BaseButton.vue                  # 공통 버튼
│   ├── BaseModal.vue                   # 공통 모달 셸
│   ├── ExcelDownloadButton.vue         # 엑셀 다운로드 아이콘 버튼
│   ├── StatusBadge.vue                 # 상태 뱃지
│   ├── KpiCard.vue                     # KPI 카드
│   ├── FilterBar.vue                   # 검색조건 바
│   ├── DataTable.vue                   # 데이터 테이블
│   ├── Pager.vue                       # 페이지네이션
│   ├── ChipInput.vue                   # 칩 입력
│   └── SegmentedControl.vue            # 세그먼트 컨트롤
│
├── header/                             # 헤더 레이어 팝업 (POP-M-COM-04~07)
│   ├── HeaderLayerModal.vue            # 헤더 팝업 공용 셸
│   ├── GlobalSearchModal.vue           # 통합 검색 (POP-M-COM-04)
│   ├── NotificationModal.vue           # 알림 3탭 (POP-M-COM-05)
│   ├── MyProjectsModal.vue             # 내 프로젝트 (POP-M-COM-06)
│   └── MyInfoModal.vue                 # 내 정보 (POP-M-COM-07) + 화면 컨셉 전환 UI
│
├── auth/
│   └── PasswordResetModal.vue          # 비밀번호 재설정 (POP-M-COM-03)
│
├── inbox/
│   └── InboxCalendar.vue               # 내업무 캘린더형 뷰
│
├── dashboard/
│   ├── DelayTaskModal.vue              # 지연 업무 팝업
│   └── ScheduleChangeModal.vue         # 일정 변경 이력 팝업
│
├── project/
│   ├── ProjectNameRegisterModal.vue    # 프로젝트명 등록 모달
│   ├── ProjectHistoryDetailModal.vue   # 변경이력 상세 팝업
│   ├── ScheduleReasonInputModal.vue    # 일정 변경 사유 입력
│   └── TesterChangeModal.vue           # 테스터 변경
│
├── requirement/
│   ├── RequirementFormModal.vue        # 요구사항 등록/수정
│   └── RequirementIssueModal.vue       # 요구사항 이슈
│
├── wbs/
│   ├── WbsScheduleModal.vue            # WBS 일정 관리
│   └── WbsScheduleReasonModal.vue      # WBS 일정 변경 사유
│
└── test/
    ├── UnitTestDetailModal.vue         # 단위테스트 상세
    ├── ScenarioEditModal.vue           # 시나리오 편집
    ├── ScenarioBulkRegisterModal.vue   # 시나리오 일괄등록
    ├── TestRunDetailModal.vue          # 테스트 수행 상세
    ├── TestErrorRegisterModal.vue      # 오류 등록
    └── DefectDetailModal.vue           # 결함 상세
```

---

## `src/data/` 목업 데이터 (화면별)

```
src/data/
├── mockUsers.js                        # 로그인/비밀번호 재설정 사용자
├── mockProjects.js                     # 프로젝트 목록 목업
├── sidebarMenu.js                      # LNB 메뉴 트리 정의
├── headerPopups.js                     # 검색·알림·내프로젝트·내정보 목업
├── inbox.js / inboxCalendar.js         # 내업무 카드/캘린더
├── dashboard.js                        # 메인 대시보드
├── performance.js                      # 실적 관리
├── techResource.js                     # 테크 리소스
├── projectStatus.js                    # 프로젝트 현황
├── projectRegister.js                  # 프로젝트 등록
├── projectInfo.js                      # 프로젝트 정보
├── projectHistory.js                   # 프로젝트 변경이력
├── projectDashboard.js                 # 개별 프로젝트 대시보드
├── scheduleChange.js                   # 일정 변경 팝업 데이터
├── requirement.js                      # 요구사항
├── wbs.js                              # WBS
├── unitTest.js                         # 단위테스트
├── scenario.js                         # 시나리오
├── testRun.js                          # 테스트 수행
├── testDefect.js                       # 결함
├── testProgress.js                     # 진척
├── testConfig.js                       # DEV/운영 테스트 공통 옵션
├── testLibrary.js                      # 테스트 라이브러리
├── userMgmt.js                         # 사용자 관리
├── approval.js                         # 신청 승인
├── menuMgmt.js                         # 화면(메뉴) 관리
├── commonCode.js                       # 공통코드
└── holiday.js                          # 휴무일
```

---

## `src/views/` 화면 (1파일 = 1화면)

### 공통·내업무·대시보드·통합

| 파일 | 화면ID | 설명 |
|------|--------|------|
| `LoginView.vue` | PAG-M-COM-02 | 로그인 |
| `InboxView.vue` | PAG-M-MY-01/02/03 | 내업무 (카드형/캘린더형) |
| `MainDashboardView.vue` | PAG-M-DAS-01 | 메인 대시보드 |
| `PerformanceView.vue` | PAG-M-DAS-06 | 실적 관리 |
| `TechResourceView.vue` | PAG-M-DAS-04 | 테크 리소스 관리 |
| `ProjectRegisterView.vue` | PAG-M-PRJ-01 | 프로젝트 등록 (모달 플로우로 리다이렉트) |
| `ProjectStatusView.vue` | PAG-M-PST-01 | 프로젝트 현황 |
| `ProjectHistoryView.vue` | PAG-M-PST-03 | 통합 프로젝트 변경이력 (전체) |
| `TestCaseView.vue` | PAG-M-TLB-01 | 테스트 라이브러리 |

### 시스템관리

| 파일 | 화면ID | 설명 |
|------|--------|------|
| `UserMgmtView.vue` | PAG-M-SYS-01 | 사용자 관리 |
| `ApprovalView.vue` | PAG-M-SYS-04 | 신청 승인 관리 |
| `MenuMgmtView.vue` | PAG-M-SYS-05 | 화면(메뉴) 관리 |
| `CommonCodeView.vue` | PAG-M-SYS-06 | 공통코드 관리 |
| `HolidayMgmtView.vue` | PAG-M-SYS-07 | 휴무일 관리 |

### 프로젝트 관리 (개별)

| 파일 | 화면ID | 설명 |
|------|--------|------|
| `ProjectDashboardView.vue` | PAG-S-DAS-01 | 프로젝트 대시보드 |
| `ProjectInfoView.vue` | PAG-S-INF-01 | 프로젝트 정보 (등록/조회) |
| `ProjectHistoryDetailView.vue` | PAG-S-INF-05 | 개별 프로젝트 변경이력 |
| `RequirementView.vue` | PAG-S-REQ-* | 요구사항 관리 |
| `WbsView.vue` | PAG-S-WBS-* | WBS 관리 (목록/캘린더) |
| `UnitTestView.vue` | PAG-S-TST-01 | 단위테스트 |
| `ScenarioView.vue` | PAG-S-UAT-01/04 | 시나리오 (DEV/운영 공용, route param) |
| `ScenarioEditView.vue` | PAG-S-UAT-04 | 시나리오 편집 |
| `TestRunView.vue` | PAG-S-UAT-09 | 테스트 수행 (DEV/운영 공용) |
| `DefectView.vue` | PAG-S-UAT-14 | 결함 관리 (운영은 배포상태 컬럼 추가) |
| `ProgressView.vue` | PAG-S-UAT-16 | 진척 관리 (DEV/운영 공용) |

---

## 실행 요약

```bash
npm install
npm run dev      # http://localhost:5173
npm run build
```

테스트 계정: `TEST_ACCOUNTS.md` 참고 (`2024001` / `Ezwel123!`)
