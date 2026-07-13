# H-PMS 공통 레이아웃 정의 (항시 참조용)

> 이 파일은 프로젝트 루트(`HPMS/`)에 두고, **모든 화면·컴포넌트 구현 시 기준 문서**로 참조합니다.
> 원본: `[SB]HPMS(프로젝트 관리 시스템)SB_공통 레이아웃 정의(0707).pdf` (18p)
> 화면ID: `PAG-M-COM-01` | 관련: `SOURCE_TREE.md`, `PROJECT_STRUCTURE.md`

---

## 1. 전체 컨셉

| # | 컨셉 | 내용 |
|---|---|---|
| 0 | Multi-Document UI | **1차 Tab + 2차 Tab** 이중 탭. 메뉴 간·프로젝트 간 이동 편의 |
| 1 | 메뉴 구성 | 프로젝트 → 요구사항 → 테스트 → 결함관리 **업무 흐름 중심** |
| 2 | FO 스타일 UX | 테이블 최소화, **카드형·뱃지·시각화** 중심 (관리자 UI 탈피) |
| 3 | 일관된 디자인 | 전 화면 동일 UX 패턴 |
| 4 | Workspace | 개별 업무 관리 공간 — **카드형 UI / 캘린더** |

---

## 2. 화면 골격 (위→아래)

```
┌──────────────────────────────────────────────────────────────┐
│  Header: [1단 Tab]                    검색/알림/내프로젝트/내정보 │
├──────┬───────────────────────────────────────────────────────┤
│ LNB  │  페이지 타이틀 (예: 내업무, WBS 관리)                      │
│      │  [2단 Tab]  ← 프로젝트 1단 탭 활성 시에만 표시             │
│      │  검색조건 (기본 2줄 + 확장) — 해당 화면만                  │
│      │  ─────────────────────────────────────────────────    │
│      │  contents                                             │
└──────┴───────────────────────────────────────────────────────┘
```

### 역할 분리

| 영역 | 역할 |
|---|---|
| **LNB** | 메뉴 탐색 (어디로 갈지 선택) |
| **1단 Tab** | 열린 **통합 화면** 또는 **프로젝트** 문서 (헤더) |
| **2단 Tab** | 선택된 프로젝트 안의 **하위 화면** 문서 (본문 상단) |
| **페이지 타이틀** | 현재 화면명 1줄 표기 (`route.meta.title`) |

### Vue 컴포넌트 매핑

| 영역 | 컴포넌트 | 파일 |
|---|---|---|
| 전체 골격 | AppShell | `src/components/layout/AppShell.vue` |
| 헤더 + **1단 Tab** | AppHeader + TabBar | `AppHeader.vue`, `TabBar.vue` |
| LNB | AppSidebar | `AppSidebar.vue` + `useSidebar.js` |
| **2단 Tab** | SubTabBar | `SubTabBar.vue` — **신규 구현** |
| 페이지 타이틀 | AppShell subbar | `AppShell.vue` |
| 본문 | router-view | `src/views/*.vue` |
| **1단 Tab 상태** | Pinia | `src/stores/tabs.js` |
| **2단 Tab 상태** | Pinia | `src/stores/subTabs.js` — **신규** |
| 프로젝트 선택 | Pinia | `src/stores/project.js` |

### 1단 vs 2단 요약

| 구분 | 1단 Tab (헤더) | 2단 Tab (본문 상단) |
|---|---|---|
| **위치** | 최상단 헤더 | LNB 오른쪽 본문 최상단 |
| **표시 조건** | 항상 (로그인 후) | **프로젝트 1단 탭 활성** 시만 |
| **탭 단위** | 통합 메뉴 1개 **또는** 프로젝트 1개 | 프로젝트 LNB 하위 화면 1개 |
| **뱃지** | `통합`(teal) / `개별`(dark) | 없음 (메뉴명만) |
| **닫기** | 내업무 제외 대부분 가능 | 프로젝트 탭별 독립 관리 |

---

## 3. 1단 Tab (헤더 상단)

> **통합관리·대시보드·내업무 메뉴**와 **선택한 프로젝트**가 1단 탭으로 헤더에 노출된다.  
> 프로젝트 하위 화면(WBS, 요구사항 등)은 1단이 아니라 **2단 Tab**에 쌓인다.

### UI 예시

```
◀ ◀◀  [통합 내업무] [통합 프로젝트현황] [개별 DL이앤씨바우처…]  ▶ ▶▶
         ↑ teal              ↑ teal              ↑ dark
```

### CASE 1 — 통합 영역 (프로젝트 미선택 / 통합 메뉴 사용)

| 항목 | 규칙 |
|---|---|
| 생성 시점 | LNB > **대시보드 / 내업무 / 통합관리** 하위 메뉴 클릭 시 |
| Tab명 | **`통합` 뱃지** + 마지막 depth **메뉴명** (프로젝트명 붙이지 않음) |
| 말줄임 | 메뉴명 8글자 초과 시 `...` |
| 로그인 후 기본 | **내업무** Tab 1개 고정 생성 (닫기 불가) |
| 탭 이동 | `◀ ▶` 좌우 1개씩, `◀◀ ▶▶` 10개 단위 |
| LNB 상태 | 통합·대시보드 메뉴 펼침 / **프로젝트 관리 메뉴 닫힘** |
| 2단 Tab | **표시 안 함** |

**1단에 올라가는 통합 메뉴 (LNB 기준)**

| LNB 그룹 | 1단 탭으로 열리는 화면 예시 |
|---|---|
| 내업무 | 내업무 |
| 대시보드 | 메인 대시보드, 실적 관리, 테크 리소스 관리 |
| 통합관리 | 프로젝트 등록, 프로젝트 현황, 프로젝트 변경이력, 테스트 라이브러리 |
| 시스템관리 | 신청 승인 관리, 화면(메뉴)관리, 공통코드 관리, 사용자 관리, 휴무일 관리 |

### CASE 2 — 프로젝트 선택 후 (1단 = 프로젝트)

| 항목 | 규칙 |
|---|---|
| 생성 시점 | **프로젝트 선택** 시 1단 탭 1개 추가 (프로젝트당 1탭) |
| Tab명 | **`개별` 뱃지** + **프로젝트명** (`truncateProjectName`, 5글자+`...`) |
| 동일 프로젝트 재선택 | 기존 1단 탭 활성화 (중복 생성 X) |
| 프로젝트 선택 경로 | ① 내업무 ② 통합관리>프로젝트현황 ③ 헤더 **내프로젝트** 팝업 (`POP-M-COM-06`) |
| LNB 상태 | 통합관리 **닫힘** / **프로젝트 관리 메뉴 펼침** |
| 1단 탭 전환 | 통합 탭 클릭 → 통합 화면, **2단 숨김** / 개별 탭 클릭 → 해당 프로젝트, **2단 표시** |
| 미선택 시 LNB 프로젝트 메뉴 클릭 | alert → 확인 시 **내프로젝트 팝업** |

### 1단 Tab 데이터 구조 (`tabs.js`)

```js
{
  id: 'inbox' | 'project-{projectId}',
  title: '내업무' | 'DL이앤씨 바우처…',
  route: '/inbox' | '/project/info',  // 통합: 화면 route / 개별: 프로젝트 진입 route
  badge: 'tong' | 'gae',              // 통합 | 개별
  projectId: null | 'p2',             // 개별 탭만
  closable: false | true,
}
```

### 뱃지 색상

| 뱃지 | 의미 | CSS 클래스 |
|---|---|---|
| `통합` | 대시보드/내업무/통합관리 메뉴 | `.tab-bar__dot.tong` (teal) |
| `개별` | 개별 프로젝트 | `.tab-bar__dot.gae` (dark) |

---

## 4. 2단 Tab (본문 상단)

> **프로젝트 1단 탭이 활성**일 때만 표시. LNB 프로젝트 관리 하위 메뉴 클릭 시 2단 탭에 쌓인다.

### 표시 조건

| 상황 | 2단 Tab |
|---|---|
| 통합 1단 탭 활성 (`/inbox`, `/dashboard`, `/integrated`, `/admin` 등) | **숨김** |
| 개별 1단 탭 활성 + LNB 프로젝트 하위 메뉴 이동 | **표시** |

### 생성 규칙

| 항목 | 규칙 |
|---|---|
| 생성 시점 | LNB **프로젝트 관리** 하위 메뉴 클릭 시 |
| Tab명 | **메뉴명만** (프로젝트명 붙이지 않음 — 1단에 이미 표시) |
| DEV/운영 공용 화면 | `시나리오관리 (DEV)` / `시나리오관리 (운영)` 등 mode 구분 |
| 탭 이동 | 1단과 동일 `◀ ▶` / `◀◀ ▶▶` |
| 스코프 | **프로젝트 1단 탭(`projectId`)별** 2단 탭 목록 독립 유지 |
| 1단 전환 | 다른 프로젝트 1단 탭 선택 시 해당 프로젝트의 2단 탭 세트 복원 |

### 2단 Tab 메뉴 매핑 (LNB → 2단 탭명)

| LNB 메뉴 | 2단 Tab 제목 | route 예시 |
|---|---|---|
| 프로젝트 정보 | 프로젝트정보 | `/project/info` |
| 프로젝트 변경이력 | 프로젝트변경이력 | `/project/history` |
| 요구사항 관리 | 요구사항관리 | `/project/requirement` |
| WBS 관리 | WBS관리 | `/project/wbs` |
| 단위테스트 | 단위테스트 | `/project/unit-test` |
| DEV테스트 > 시나리오 관리 | 시나리오관리 (DEV) | `/project/scenario/dev` |
| DEV테스트 > 테스트 수행 | 테스트수행 | `/project/test-run` |
| DEV테스트 > 결함 관리 | 결함관리 (DEV) | `/project/defect/dev` |
| DEV테스트 > 진척 관리 | 진척관리 (DEV) | `/project/progress/dev` |
| 운영테스트 > 시나리오 관리 | 시나리오관리 (운영) | `/project/scenario/uat` |
| 운영테스트 > 결함 관리 | 결함관리 (운영) | `/project/defect/uat` |
| 운영테스트 > 진척 관리 | 진척관리 (운영) | `/project/progress/uat` |
| 대시보드 | 대시보드 | `/project/dashboard` |

### 2단 Tab 데이터 구조 (`subTabs.js`)

```js
// projectId → tabs[]
{
  'p2': [
    { id: 'wbs', title: 'WBS관리', route: '/project/wbs', closable: true },
    { id: 'requirement', title: '요구사항관리', route: '/project/requirement', closable: true },
  ],
}
```

### UI 예시 (개별 1단 탭 활성 시)

```
WBS 관리                    ← 페이지 타이틀 (app-subbar)
[프로젝트정보] [요구사항관리] [WBS관리] [단위테스트]  ◀ ▶
─────────────────────────────────────────────────────
```

### 사용자 시나리오

**시나리오 A — 통합만 사용**
1. 로그인 → 1단: `[통합 내업무]`
2. LNB 프로젝트 현황 → 1단: `[통합 내업무]` `[통합 프로젝트현황]`
3. 2단 없음, 타이틀: `프로젝트 현황`

**시나리오 B — 프로젝트 진입**
1. 내프로젝트 팝업에서 바우처 프로젝트 선택
2. 1단: `[통합 내업무]` `[개별 DL이앤씨바우처…]` ← 개별 활성
3. LNB WBS 관리 → 2단: `[WBS관리]`
4. LNB 요구사항 관리 → 2단: `[WBS관리]` `[요구사항관리]`
5. 1단 `[통합 내업무]` 클릭 → 내업무 이동, **2단 숨김**

---

## 5. LNB (좌측 네비게이션)

```
• 대시보드
  ㄴ 메인 대시보드 / 실적관리 / 테크 리소스관리
• 내업무
• 통합관리
  ㄴ 프로젝트 등록 / 프로젝트 현황 / 프로젝트 변경이력 / 테스트 라이브러리
  ㄴ 시스템 관리
     ㄴ 사용자관리 / 신청승인관리 / 화면(메뉴)관리 / 공통코드관리 / 휴무일관리
• 프로젝트 관리  ← 프로젝트 선택 후 열림
  ㄴ 프로젝트정보 / 프로젝트변경이력
  ㄴ 요구사항 관리 / WBS 관리 / 단위테스트
  ㄴ DEV테스트 (시나리오관리 / 테스트수행 / 결함관리 / 진척관리)
  ㄴ 운영테스트 (시나리오관리 / 결함관리 / 진척관리)
  ㄴ 대시보드
```

| 항목 | 규칙 |
|---|---|
| 펼침/접기 | Zippy 패턴 — 접기 시 컨텐츠 영역 확장 |
| 기본 상태 | 펼침 default, 접기 아이콘 클릭 시 닫힘 |
| 활성 표시 | 좌측 border + teal 배경 (`sidebar-item--active`) |
| 하위 메뉴 | `ㄴ` prefix, 들여쓰기 |

---

## 6. 헤더 우측 아이콘

| 아이콘 | 동작 | 팝업 화면ID |
|---|---|---|
| 🔍 검색 | 검색 레이어 팝업 | `POP-M-COM-04` |
| 🔔 알림 | 알림 레이어 팝업 | `POP-M-COM-05` |
| 📁 내프로젝트 | 내 프로젝트 레이어 팝업 | `POP-M-COM-06` |
| 👤 내정보 | 내 정보 레이어 팝업 | `POP-M-COM-07` |

> 헤더 팝업은 `AppHeader.vue` 내부에서 `BaseModal` 재사용

---

## 7. 스타일 규칙

### 7-1. 버튼

| 유형 | 용도 | 비고 |
|---|---|---|
| **Primary** | 주요 액션 (브랜드 컬러 teal) | 검색 시에만 **블랙** |
| **Secondary** | 보조 액션 (Outlined) | |
| **Tertiary** | 낮은 우선순위 | Primary와 함께 사용 |
| **Disabled** | 회색 + 클릭 불가 | |

주요 버튼 라벨: 저장, 조회, 등록, 추가, 삭제, 취소, 닫기, 승인요청, 승인완료, 승인반려, 확인, 수정, 완료, 착수, 복사, 파일업로드, 중복확인, 패스워드 초기화, 5회 오류 해제, 바로가기, 일정변경, 계획/테스터변경, 오류등록

### 7-2. 입력폼

| 항목 | 규칙 |
|---|---|
| 필수값 | 항목명 우측 `*` 빨간색 |
| Placeholder | 화면설계서 내 표시 문구 |
| 오류 | 필드 하단 빨간 메시지 |
| Read Only | 회색 배경, 수정 불가 |
| Tooltip | 도움말 아이콘 hover 시 레이어 |

### 7-3. 팝업

| 유형 | 규칙 |
|---|---|
| **사이드패널** | 우측 Slide-In, S/M/L (`--panel-width-s/m/l`), Dim, ESC 닫기 **불가**, 메인 조회조건 유지 |
| **레이어팝업** | 중앙, 콘텐츠 크기 가변(S/M/L), Dim, 사이드패널 위에도 노출 가능 |
| **알럿** | 작은 확인/알림용 (제목 없이 메시지+버튼) |

> `BaseModal.vue` — `variant="panel" | "layer" | "alert"`, `size="S" | "M" | "L"`
> POP-* 화면 30개 이상은 각 View에서 BaseModal 재사용 (파일 분리 안 함)

### 7-4. 검색영역 (FilterBar)

| 항목 | 규칙 |
|---|---|
| 기본 노출 | 1~2줄 주요 검색조건만 |
| 상세검색 | `∨` 클릭 시 expand, `▲` 클릭 시 collapse |
| 배치 | 4열 grid 기본 |
| 초기화 | `↻` 버튼 → 기본값 복원 |
| 검색 실행 | 검색 버튼 또는 **F2** |
| 상태 유지 | 접어도 기존 검색조건 유지 |

### 7-5. 상태 뱃지 (StatusBadge)

| 분류 | 값 |
|---|---|
| 프로젝트 처리단계 | 접수 / 처리중 / 협의중 / 테스트 / 완료 / 반려 |
| 프로젝트 진행 상태 | 접수 / 진행중 / 완료 |
| 승인 상태 | 승인요청 / 승인완료 / 승인반려 |
| 요건 수용여부 | 수용 / 반려 |
| 요건 우선순위 | 높음 / 보통 / 낮음 |
| 오류 상태 | 정상 / 오류 |
| 조치여부 | 미조치 / 수정완료 |

색상: 성공·정상=녹색, 실패·오류·경과=빨간색, 포커스=외곽선/배경 강조

---

## 8. 공통 컴포넌트 인벤토리

| SB 컴포넌트 | Vue 컴포넌트 | 파일 | 상태 |
|---|---|---|---|
| Primary/Secondary/Tertiary Button | BaseButton | `ui/BaseButton.vue` | ✅ 기본 |
| Status Badge | StatusBadge | `ui/StatusBadge.vue` | ✅ 기본 |
| KPI Card | KpiCard | `ui/KpiCard.vue` | ✅ 기본 |
| Search Filter | FilterBar | `ui/FilterBar.vue` | ✅ 기본 |
| TABLE | DataTable | `ui/DataTable.vue` | ✅ 기본 |
| INDICATOR (Pager) | Pager | `ui/Pager.vue` | ✅ 기본 |
| Modal (panel/layer/alert) | BaseModal | `ui/BaseModal.vue` | ✅ 기본 |
| Chip Input | ChipInput | `ui/ChipInput.vue` | ✅ 기본 |
| Segmented Control / Toggle | SegmentedControl | `ui/SegmentedControl.vue` | ✅ 기본 |
| **1단 Tab Bar** | TabBar | `layout/TabBar.vue` | ✅ 구현 |
| **2단 Tab Bar** | SubTabBar | `layout/SubTabBar.vue` | ✅ 구현 |
| DATE PICKER | — | — | ⬜ 미구현 |
| DROPDOWN | — | — | ⬜ 미구현 |
| INPUT (Date/Textarea/Upload) | — | — | ⬜ 미구현 |
| CHECK / RADIO / TOGGLE | — | — | ⬜ 미구현 |
| TOOLTIP | — | — | ⬜ 미구현 |

### Pager 규칙

```
◀◀ ◀  1  2  3  4  5  6  7  8  9  10  ▶  ▶▶
Prev2  Prev1  select/unselect  Next1  Next2
```

- Prev2/Next2: 10페이지 단위 이동
- Prev1/Next1: 1페이지 단위 이동

---

## 9. CSS 토큰 (디자인 시스템)

> `src/assets/styles/tokens.css` — figma/SB 기준 teal 계열

| 토큰 | 값 | 용도 |
|---|---|---|
| `--color-primary` | `#119a8a` (teal) | 브랜드, Primary 버튼, 활성 탭 |
| `--color-badge-integrated` | teal | 통합 Tab 뱃지 |
| `--color-badge-individual` | dark | 개별 Tab 뱃지 |
| `--header-height` | 56px | 헤더 |
| `--tab1-height` | 40px | 1차 Tab |
| `--tab2-height` | 36px | 2차 Tab |
| `--lnb-width` | 220px | LNB 펼침 |
| `--lnb-width-collapsed` | 56px | LNB 접힘 |
| `--app-min-width` | 1280px | 최소 너비, 가로 스크롤 |
| `--panel-width-s/m/l` | 400/560/800px | 사이드패널 |

---

## 10. 구현 체크리스트 (화면별)

새 화면 구현 시 아래를 확인:

- [ ] `PROJECT_STRUCTURE.md`의 view 파일명·화면ID 일치
- [ ] AppShell 내부 router-view로 마운트 (로그인만 `layout: blank`)
- [ ] **1단 Tab**: 통합 메뉴·프로젝트 분리, `통합`/`개별` 뱃지
- [ ] **2단 Tab**: 프로젝트 1단 활성 시만, `subTabs.js` 프로젝트별 스코프
- [ ] 프로젝트 메뉴는 `requiresProject` + `project.js` 가드
- [ ] DEV/운영 공용 화면은 route param `dev|uat` 분기
- [ ] 검색영역: 기본 2줄 + 상세조회 expand
- [ ] 등록/수정 → 사이드패널, 확인/알럿 → 레이어팝업
- [ ] ESC로 팝업 닫기 불가 (데이터 미저장 방지)
- [ ] 상태값은 StatusBadge 공용 컴포넌트
- [ ] 테이블보다 카드형 UI 우선 (FO 스타일)
- [ ] 목업 데이터는 `src/data/` 화면별 분리

---

## 11. 현재 구현 현황 vs SB 갭

| SB 요구 | 현재 상태 | 우선순위 |
|---|---|---|
| **1단 Tab** (통합 메뉴 + 프로젝트) | ✅ 구현 (`tabs.js`, `TabBar.vue`) | — |
| **2단 Tab** (프로젝트 하위 메뉴) | ✅ 구현 (`subTabs.js`, `SubTabBar.vue`) | — |
| 1단/2단 스토어 분리 | ✅ 분리 완료 | — |
| 통합/개별 뱃지 라벨 | ✅ `통합`/`개별` 텍스트 뱃지 | — |
| 페이지 타이틀 (subbar) | ✅ 타이틀만 표시 | — |
| 헤더 팝업 4종 (POP-M-COM-04~07) | ✅ 구현 완료 | — |
| LNB 열림/닫힘 그룹 연동 | 기본 toggle만 | 🟡 중간 |
| 검색영역 expand | FilterBar 기본만 | 🟡 중간 |
| DATE PICKER / DROPDOWN | 미구현 | 🟢 B단계 |
| 로그인 (PAG-M-COM-02) | ✅ 구현 완료 | — |
| 비밀번호 재설정 (POP-M-COM-03) | ✅ 구현 완료 | — |

---

## 12. 관련 문서

| 문서 | 용도 |
|---|---|
| `SOURCE_TREE.md` | 소스 트리·파일 설명·기획 대비 합침 |
| `PROJECT_STRUCTURE.md` | 구조 원칙·확정 결정 |
| `HPMS_공통레이아웃_정의.md` | **이 파일** — 레이아웃·Tab·LNB·스타일·컴포넌트 |
| `HPMS_기획서_분석_레퍼런스.md` | 화면 65개 인벤토리, 핵심 정책 |
| `README.md` | 실행법, 로고 위치 |
