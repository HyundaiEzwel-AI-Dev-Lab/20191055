# H-PMS Frontend Source Tree

> Vue 3 + Vite + Pinia + Vue Router 기반 프론트엔드 (목업 데이터)  
> 원칙: **화면 1개 = View 1파일**, CSS는 `src/assets/styles/`에 집중  
> `node_modules/`, `dist/` 는 빌드·의존성 산출물이므로 제외  
> Git Wiki 등에 그대로 붙여넣기 가능한 **파일 카탈로그** 문서입니다.

---

## 문서 역할 (합칠지 / 나눌지)

현재 루트에 구조·레이아웃 관련 문서가 3종 있습니다. 역할이 달라 **공통 레이아웃은 유지**, **트리 문서는 역할 분리**를 권장합니다.

| 문서 | 역할 | 판단 |
|------|------|------|
| **`SOURCE_TREE.md`** (본 문서) | 폴더·파일별 한 줄 설명 카탈로그. Wiki/온보딩용 | **유지** — 상세 파일 목록의 단일 출처 |
| **`PROJECT_STRUCTURE.md`** | 구조 원칙·확정 결정·views↔화면ID 정책 | **유지하되 상세 트리는 본 문서로 위임** — 결정/정책만 짧게 유지 |
| **`HPMS_공통레이아웃_정의.md`** | Header/LNB/1·2단 Tab/공통 UX (레이아웃 SB) | **별도 유지** — 폴더 트리와 성격이 다름. 합치면 너무 길어지고 검색이 어려움 |

**합치지 않는 이유**
- 공통 레이아웃 = **동작·UX 스펙**, 소스 트리 = **파일 지도** → 한 파일에 섞으면 둘 다 읽기 어려움
- PROJECT_STRUCTURE의 긴 트리는 SOURCE_TREE와 중복 → 트리는 SOURCE_TREE 한곳으로

**더 나누지 않는 이유**
- DESIGN_GUIDE / TEST_ACCOUNTS / CLAUDE 등은 이미 목적별 분리되어 있음
- “기획서 대비 구현 차이”는 본 문서 하단에 모아 두는 것이 온보딩에 유리

관련: `DESIGN_GUIDE.md`(토큰·시각), `TEST_ACCOUNTS.md`(계정), `MOCK_DATA.md`(실연동 시 목업 삭제), `README.md`(실행)

---

## 기획서 대비 구현 차이 (중요)

기획 SB와 **의도적으로 다르게** 합친 화면입니다. 팀/Wiki 공유 시 이 섹션을 먼저 보세요.

### 1) 프로젝트 등록 + 프로젝트 정보 합침

| 구분 | 기획서 | 현재 구현 |
|------|--------|-----------|
| 화면 | `PAG-M-PRJ-01` 등록 전용 페이지 + `PAG-S-INF-01` 정보(수정) | **등록·수정 모두** `ProjectInfoView.vue` (`/project/info`) |
| 등록 진입 | 통합관리 > 프로젝트 등록 풀페이지 | LNB/메뉴 → **프로젝트명 모달** (`ProjectNameRegisterModal`) → 정보 화면(등록 모드) |
| 삭제된 껍데기 | — | `ProjectRegisterView.vue` 제거 (미사용 플레이스홀더) |
| 라우트 | `/integrated/project/register` | 모달 오픈 후 `/inbox` 등으로 redirect (본문은 info) |

**이유:** 필드·검증·레이아웃이 등록/수정과 거의 동일해 이중 유지보수 비용이 큼.  
`isRegistering`(draft)로 등록 전용 규칙(완료·반려 비활성, 필수값, 버튼「등록」 등)만 분기.

### 2) 프로젝트 변경이력 합침

| 구분 | 기획서 | 현재 구현 |
|------|--------|-----------|
| 통합 | `PAG-M-PST-03` 전체 프로젝트 변경이력 | `ProjectHistoryView.vue` + `/integrated/project/history` |
| 개별 | `PAG-S-INF-05` 현재 프로젝트 변경이력 | **같은** `ProjectHistoryView.vue` + `/project/history` |
| 상세 템플릿 | 기획서도 “동일 템플릿” 명시 | 공용 UI, row 펼침·상세보기 공유 |
| 분기 | 화면 2개 | `route.name === 'project-history'` → 전체(+프로젝트/부서 필터·컬럼), 아니면 현재 프로젝트만 |

**이유:** SB상 상세 양식이 동일하고, 차이는 조회 범위·필터·컬럼뿐이라 한 View + 모드 분기가 맞음.  
삭제: `ProjectHistoryDetailView.vue` (개별 전용 분리본)

### 3) WBS 일정변경 UI 통일 (단일 → 다중 UI)

| 구분 | 기획서 | 현재 구현 |
|------|--------|-----------|
| 단일 일정변경 | 별도 단일 변경 UI | **다중 UI 단건(1행) 재사용** |
| 다중/일괄 | POP-S-WBS-04/05 등 | `WbsBulkScheduleModal.vue` (`POP-S-WBS-05`) |
| 일정 관리 | POP-S-WBS-02 착수·완료 | `WbsScheduleModal` 유지. 「일정변경 요청」만 다중 UI로 위임 |

**진입:** 목록 툴바「일정변경」(N건) · 일정관리 모달「일정변경 요청」(1건) → 모두 `WbsBulkScheduleModal`  
원칙·체크 상세: `PROJECT_STRUCTURE.md` §2.1

### 그 외 (참고, 기획과 동일 취지)
- DEV/운영 테스트 하위 메뉴: View 공용 + `route.params.mode` (`dev` \| `uat`)
- 시스템관리·대시보드 등은 화면 1파일 원칙 유지

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
├── SOURCE_TREE.md                      # 본 문서 (소스 트리·파일별 설명·기획 차이)
├── PROJECT_STRUCTURE.md                # 구조 원칙·확정 결정 (상세 트리는 본 문서)
├── DESIGN_GUIDE.md                     # 색상·폰트·간격 디자인 토큰 가이드
├── HPMS_공통레이아웃_정의.md            # Header/LNB/Tab/공통 UX 정의
├── TEST_ACCOUNTS.md                    # 테스트 계정·로그인 화면 안내
├── CLAUDE.md / CURSOR.md               # AI 코딩 에이전트 작업 가이드
├── .cursor/rules/design-system.mdc     # Cursor용 디자인 토큰 규칙 (alwaysApply)
├── public/
│   └── logo.png                        # 앱 로고 (파일명 고정, 이미지만 교체)
└── src/                                # 애플리케이션 소스
```

---

## `src/` 진입·라우팅·상태

```
src/
├── main.js                             # 앱 부트스트랩 (Pinia·Router·전역 CSS 연결)
├── App.vue                             # 최상위: AppShell + <router-view> + 전역 LoadingOverlay
│
├── router/
│   └── index.js                        # 전체 화면 URL 라우팅·가드(로그인/프로젝트)
│
├── stores/                             # Pinia 전역 상태
│   ├── auth.js                         # 로그인 세션·사용자 정보
│   ├── tabs.js                         # 1단 Tab (통합 메뉴 + 프로젝트 탭)
│   ├── subTabs.js                      # 2단 Tab (프로젝트 하위 메뉴, projectId별)
│   ├── project.js                      # 현재 프로젝트·등록중(draft)·프로젝트 가드
│   └── theme.js                        # 화면 컨셉(기본/프리미엄/다크)·localStorage
│
├── composables/                        # 화면 공통 로직
│   ├── useSidebar.js                   # LNB 펼침/접힘
│   ├── useLayoutTabs.js                # 라우트 변경 시 1·2단 탭 동기화
│   ├── useProjectRegister.js           # 프로젝트 등록 모달·탭 생성 플로우
│   ├── useTestContext.js               # DEV/운영(uat) 테스트 화면 공통 컨텍스트
│   └── useLoading.js                   # 공통 로딩 show/hide/withLoading (전역)
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
    ├── tokens.css                      # :root 디자인 토큰 (+ data-concept 오버라이드)
    ├── base.css                        # reset, 기본 타이포, page 컨테이너
    ├── components.css                  # 버튼·뱃지·테이블·모달 등 공통 컴포넌트
    ├── layout.css                      # 헤더·LNB·탭·헤더 팝업
    └── admin.css                       # 시스템관리 화면 공통 레이아웃/필터/테이블
```

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
│   ├── BaseModal.vue                   # 공통 모달 셸
│   ├── ExcelDownloadButton.vue         # 엑셀 다운로드 아이콘 버튼
│   └── LoadingOverlay.vue              # 공통 로딩 (틸 스피너 + 카드, fullscreen/inline)
│
├── header/                             # 헤더 레이어 팝업 (POP-M-COM-04~07)
│   ├── HeaderLayerModal.vue            # 헤더 팝업 공용 셸
│   ├── GlobalSearchModal.vue           # 통합 검색
│   ├── NotificationModal.vue           # 알림 3탭
│   ├── MyProjectsModal.vue             # 내 프로젝트
│   └── MyInfoModal.vue                 # 내 정보 (+ 화면 컨셉 전환)
│
├── auth/
│   └── PasswordResetModal.vue          # 비밀번호 재설정
│
├── inbox/
│   └── InboxCalendar.vue               # 내업무 캘린더형 뷰
│
├── dashboard/
│   ├── DelayTaskModal.vue              # 지연 업무 팝업
│   └── ScheduleChangeModal.vue         # 일정 변경 이력 팝업
│
├── project/
│   ├── ProjectNameRegisterModal.vue    # 프로젝트명 등록 모달 (등록 플로우 진입점)
│   ├── ProjectHistoryDetailModal.vue   # 변경이력 상세 팝업
│   ├── ScheduleReasonInputModal.vue    # 일정 변경 사유 입력
│   └── TesterChangeModal.vue           # 테스터 변경
│
├── requirement/
│   ├── RequirementFormModal.vue        # 요구사항 등록/수정
│   └── RequirementIssueModal.vue       # 요구사항 이슈
│
├── wbs/
│   ├── WbsCalendar.vue                 # WBS 캘린더형
│   ├── WbsScheduleModal.vue            # POP-S-WBS-02 일정 관리 (착수·완료)
│   ├── WbsScheduleReasonModal.vue      # POP-S-WBS-03 변동 사유
│   └── WbsBulkScheduleModal.vue        # POP-S-WBS-05 다중 일정 변경 (단건·다건 공통)
│
└── test/
    ├── UnitTestDetailModal.vue         # 단위테스트 상세
    ├── ScenarioBulkRegisterModal.vue   # 시나리오 일괄등록
    ├── TestErrorRegisterModal.vue      # 오류 등록
    └── DefectDetailModal.vue           # 결함 상세
```

---

## `src/data/` 목업 데이터 (화면별)

```
src/data/
├── commonOptions.js                    # pageSize·진행단계 공통 옵션
├── mockUsers.js                        # 로그인/비밀번호 재설정 사용자
├── sidebarMenu.js                      # LNB 메뉴 트리 정의
├── headerPopups.js                     # 검색·알림·내프로젝트·내정보 목업
├── inbox.js / inboxCalendar.js         # 내업무 카드/캘린더
├── dashboard.js                        # 메인 대시보드
├── performance.js                      # 실적 관리
├── techResource.js                     # 테크 리소스
├── projectStatus.js                    # 프로젝트 현황
├── projectRegister.js                  # 프로젝트 등록 초기값·JIRA 중복 검사
├── projectInfo.js                      # 프로젝트 정보
├── projectHistory.js                   # 변경이력 (전체/개별 공용 데이터)
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

## `src/views/` 화면

> 원칙은 “화면 1개 = 파일 1개”이나, **등록/정보·변경이력·DEV/운영**처럼 기획상 UI가 동일하면 **공용 View + 라우트/모드 분기**를 허용합니다.

### 공통·내업무·대시보드·통합

| 파일 | 화면ID | 설명 |
|------|--------|------|
| `LoginView.vue` | PAG-M-COM-02 | 로그인 |
| `InboxView.vue` | PAG-M-MY-01/02/03 | 내업무 (카드형/캘린더형) |
| `MainDashboardView.vue` | PAG-M-DAS-01 | 메인 대시보드 |
| `PerformanceView.vue` | PAG-M-DAS-06 | 실적 관리 |
| `TechResourceView.vue` | PAG-M-DAS-04 | 테크 리소스 관리 |
| `ProjectStatusView.vue` | PAG-M-PST-01 | 프로젝트 현황 |
| `ProjectHistoryView.vue` | PAG-M-PST-03 / PAG-S-INF-05 | **변경이력 공용** (통합=전체 · 개별=현재 프로젝트) |
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
| `ProjectInfoView.vue` | PAG-S-INF-01 (+등록) | **정보 등록·수정 공용** (기획 PAG-M-PRJ-01 등록 페이지 대체) |
| `RequirementView.vue` | PAG-S-REQ-* | 요구사항 관리 |
| `WbsView.vue` | PAG-S-WBS-* | WBS 관리 (목록/캘린더) |
| `UnitTestView.vue` | PAG-S-TST-01 | 단위테스트 |
| `ScenarioView.vue` | PAG-S-UAT-01/04 | 시나리오 (DEV/운영 공용, route param) |
| `ScenarioEditView.vue` | PAG-S-UAT-04 | 시나리오 편집 |
| `TestRunView.vue` | PAG-S-UAT-09 | 테스트 수행 (DEV/운영 공용) |
| `DefectView.vue` | PAG-S-UAT-14 | 결함 관리 (운영은 배포상태 컬럼 추가) |
| `ProgressView.vue` | PAG-S-UAT-16 | 진척 관리 (DEV/운영 공용) |

---

## 공통 로딩 가이드

데이터 조회가 느릴 때 쓰는 **전역 공통 로딩**. 디자인: `--teal` 링 스피너 + `--lnb-side` 카드 + 반투명 스크림.

| 파일 | 역할 |
|------|------|
| `src/components/ui/LoadingOverlay.vue` | UI (문구·mode) |
| `src/composables/useLoading.js` | 전역 상태 (`show` / `hide` / `withLoading`) |
| `src/App.vue` | 전역 `<LoadingOverlay>` 마운트 |

### Props (`LoadingOverlay`)

| Prop | 기본 | 설명 |
|------|------|------|
| `visible` | `false` | 표시 여부 |
| `message` | `데이터를 조회하고 있습니다.` | 안내 문구 |
| `mode` | `fullscreen` | `fullscreen` = 화면 전체 / `inline` = 부모 영역 (부모에 `position: relative` 필요) |

### 전역 사용 (권장)

```js
import { useLoading } from '@/composables/useLoading'

const { show, hide, withLoading } = useLoading()

show('데이터를 조회하고 있습니다.')
// ...조회
hide()

await withLoading(async () => {
  // fetch...
}, '목록을 불러오는 중...')
```

- `show` / `hide`는 **중첩 카운트**를 사용합니다. 여러 요청이 겹쳐도 마지막 `hide`까지 로딩이 유지됩니다.
- `reset()`으로 카운트·표시를 강제 초기화할 수 있습니다.

### 영역(inline) 로딩

```vue
<div style="position: relative">
  <LoadingOverlay mode="inline" :visible="loading" message="조회 중..." />
  <!-- 목록 등 -->
</div>
```

`inline`일 때는 Teleport를 쓰지 않고 부모 박스 안에 그립니다.

---

## 실행 요약

```bash
npm install
npm run dev      # http://localhost:5173
npm run build
```

테스트 계정: `TEST_ACCOUNTS.md` 참고 (`2024001` / `Ezwel123!`)
