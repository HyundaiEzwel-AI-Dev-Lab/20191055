# H-PMS 프로젝트 구조 (항시 참조용)

> 이 파일은 프로젝트 루트(`HPMS/`)에 두고, 이후 모든 화면 구현 작업 시 기준 문서로 참조합니다.
> 공통 레이아웃·Tab·LNB·스타일 규칙은 `HPMS_공통레이아웃_정의.md` 참고.
> 화면 스펙 원본 요약은 같은 프로젝트의 `HPMS_기획서_분석_레퍼런스.md` 참고 (레이아웃 구조/화면 65개 인벤토리/핵심 정책).

---

## 1. 폴더 구조 (확정)

```
HPMS/
├─ public/
│  └─ logo.png                    ← 로고 자리 (이 이름 고정, 교체만)
│
├─ index.html                     ← Vite 진입 HTML (단 하나)
├─ package.json
├─ vite.config.js                 ← @ → src 별칭 + dev 서버
├─ .gitignore
├─ README.md                      ← 실행법 · 로고 위치 안내
├─ PROJECT_STRUCTURE.md           ← 폴더 구조 · views 24개 (항시 참조용)
├─ DESIGN_GUIDE.md                ← 폰트·색상·크기·간격 기준 (항시 참조용)
├─ HPMS_공통레이아웃_정의.md       ← 레이아웃 · Tab · LNB · 스타일 · 컴포넌트 (항시 참조용)
│
└─ src/
   ├─ main.js                     ← 앱 부트스트랩 (Pinia·Router 연결)
   ├─ App.vue                     ← 최상위: 셸 마운트 + <router-view>
   │
   ├─ assets/
   │  └─ styles/                  ★ CSS는 전부 여기 (채팅으로 전달)
   │     ├─ tokens.css            ← :root 변수(색·간격·폰트, 상태값 색상 포함)
   │     ├─ base.css              ← reset + 반응형 컨테이너(min1280·가로스크롤)
   │     ├─ components.css        ← 버튼·뱃지·테이블·필터·페이저 등
   │     └─ layout.css            ← 헤더·LNB(접이식)·탭
   │
   ├─ router/
   │  └─ index.js                 ← 화면별 URL 라우팅
   │
   ├─ stores/                     ← Pinia 전역상태
   │  ├─ tabs.js                  ← 1단 Tab (통합 메뉴 + 프로젝트)
   │  ├─ subTabs.js               ← 2단 Tab (프로젝트 하위 메뉴, projectId별)
   │  ├─ project.js               ← 현재 선택 프로젝트 + 미선택 시 alert 가드
   │  └─ auth.js                  ← 로그인 사용자 세션
   │
   ├─ composables/
   │  └─ useSidebar.js            ← LNB 펼침/접힘 상태
   │
   ├─ data/                       ← 목업 데이터 (화면별 분리, 이관 시마다 추가)
   │
   ├─ components/
   │  ├─ layout/
   │  │  ├─ AppShell.vue          ← 헤더+LNB+본문 골격
   │  │  ├─ AppHeader.vue         ← 1단 Tab · 우측 아이콘 (POP-M-COM-04~07)
   │  │  ├─ AppSidebar.vue        ← 접이식 LNB (Zippy 패턴)
   │  │  ├─ TabBar.vue            ← 1단 Tab (헤더: 통합 메뉴 + 프로젝트)
   │  │  └─ SubTabBar.vue         ← 2단 Tab (본문 상단: 프로젝트 하위 메뉴)
   │  │
   │  └─ ui/                      ← 공통 UI
   │     ├─ BaseButton.vue
   │     ├─ StatusBadge.vue       ← 처리단계/승인상태/우선순위 등 상태값 뱃지 공용
   │     ├─ KpiCard.vue
   │     ├─ FilterBar.vue
   │     ├─ DataTable.vue
   │     ├─ Pager.vue
   │     ├─ BaseModal.vue         ← 팝업 공용 셸(사이드패널형/레이어형 variant 지원)
   │     │                           ※ 실제 팝업(POP-*)은 30개 이상이며, 각 View 내부에서
   │     │                             BaseModal을 재사용해 콘텐츠만 교체하는 방식으로 구현
   │     ├─ ChipInput.vue
   │     └─ SegmentedControl.vue
   │
   └─ views/                      ← 화면 1개 = 파일 1개 (총 24)
      ├─ LoginView.vue                    - PAG-M-COM-02
      ├─ InboxView.vue                    - PAG-M-MY-01/02/03 (내업무: 카드형/캘린더형)
      ├─ ProjectRegisterView.vue          - PAG-M-PRJ-01 (통합관리>프로젝트 등록)
      ├─ ProjectStatusView.vue            - PAG-M-PST-01 (통합관리>프로젝트 현황)
      ├─ ProjectHistoryView.vue           - PAG-M-PST-03 (통합관리>프로젝트 변경이력, 전체 대상)
      ├─ MainDashboardView.vue            - PAG-M-DAS-01 (대시보드>메인대시보드/전체현황)
      ├─ PerformanceView.vue              - PAG-M-DAS-06 (대시보드>실적관리)
      ├─ TechResourceView.vue             - PAG-M-DAS-04 (대시보드>테크 리소스관리)
      ├─ UserMgmtView.vue                 - PAG-M-SYS-01 (시스템관리>사용자 관리)
      ├─ ApprovalView.vue                 - PAG-M-SYS-04 (시스템관리>신청승인 관리)
      ├─ MenuMgmtView.vue                 - PAG-M-SYS-05 (시스템관리>화면(메뉴) 관리)
      ├─ CommonCodeView.vue               - PAG-M-SYS-06 (시스템관리>공통코드 관리)
      ├─ HolidayMgmtView.vue              - PAG-M-SYS-07 (시스템관리>휴무일 관리)
      ├─ TestCaseView.vue                 - PAG-M-TLB-01 (통합관리>테스트 라이브러리)
      ├─ ProjectInfoView.vue              - PAG-S-INF-01 (프로젝트 관리>프로젝트 정보)
      ├─ ProjectHistoryDetailView.vue     - PAG-S-INF-05 (프로젝트 관리>프로젝트 변경이력, 개별 프로젝트 대상)
      ├─ RequirementView.vue              - PAG-S-REQ-01/04/06/07 (요구사항 관리)
      ├─ WbsView.vue                       - PAG-S-WBS-01/08/09 (WBS 관리: 목록형/캘린더형)
      ├─ UnitTestView.vue                  - PAG-S-TST-01 (단위테스트)
      ├─ ScenarioView.vue                  - PAG-S-UAT-01/04 (DEV/운영테스트>테스트시나리오, 공용·route param으로 구분)
      ├─ TestRunView.vue                   - PAG-S-UAT-09 (DEV/운영테스트>테스트 수행, 공용)
      ├─ DefectView.vue                    - PAG-S-UAT-14 (DEV/운영테스트>결함관리, 공용·운영은 배포상태 컬럼 추가)
      ├─ ProgressView.vue                  - PAG-S-UAT-16 (DEV/운영테스트>진척관리, 공용)
      └─ ProjectDashboardView.vue          - PAG-S-DAS-01 (프로젝트 관리>대시보드, 개별 프로젝트)
```

---

## 2. 확정 사항 (검토 후 결정)

| 이슈 | 결정 |
|---|---|
| 대시보드 관련 화면(통합 3종 + 개별 1종) 구성 | **4개 파일로 분리** (MainDashboardView / PerformanceView / TechResourceView / ProjectDashboardView). "화면 1개 = 파일 1개" 원칙과 일관성 유지 |
| 개별 프로젝트 변경이력(PAG-S-INF-05) 위치 | **별도 파일로 분리** (ProjectHistoryDetailView.vue). 통합관리 레벨의 ProjectHistoryView(PAG-M-PST-03, 전체 프로젝트 대상)와는 별개 화면 |
| 단위테스트(PAG-S-TST-01) | 누락 확인 → UnitTestView.vue 추가 |
| 휴무일관리(PAG-M-SYS-07) | 누락 확인 → HolidayMgmtView.vue 추가 |
| 팝업 컴포넌트 규모 | "3종"이 아니라 POP-* 화면ID 30개 이상. BaseModal 하나를 각 View에서 재사용하는 구조로 처리 (컴포넌트 파일을 팝업 수만큼 늘리지 않음) |
| 헤더 팝업(검색/알림/내프로젝트/내정보) 위치 | AppHeader.vue 내부에서 처리 (POP-M-COM-04~07) |
| 시나리오관리/테스트수행/결함관리/진척관리 | DEV테스트·운영테스트가 화면ID를 공유하는 구조이므로 View 파일도 공용 1개 + route param(dev/uat)으로 분기 |

---

## 3. views ↔ 화면ID ↔ LNB 매핑 요약

- LNB 리프 메뉴: 대시보드 3 + 내업무 1 + 통합관리 9 + 프로젝트관리(개별) 12 = 25개, + 로그인 1개
- DEV테스트/운영테스트 하위의 테스트시나리오·결함관리·진척관리(각 2개씩, 총 6개 메뉴)는 화면ID·UI가 사실상 동일해 View 파일 3개(ScenarioView/DefectView/ProgressView)를 route param(dev/uat)으로 공유
- 그 결과 views 파일 수는 24개 (§1 트리 참고). 정확한 화면ID 대응은 트리의 우측 주석 참고

---

## 4. 다음 단계
- `src/assets/styles/*.css` 4종 전달 (채팅으로 전달 예정)
- `components/ui/*` 공통 컴포넌트 구현 (B단계)
- `views/*` 24개 화면 순차 구현 (C단계, 화면ID 기준으로 스펙 잘라서 전달)
