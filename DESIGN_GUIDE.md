# HPMS 디자인 가이드 (항시 참조)

> 폰트·색상·크기·간격 기준 문서. 새 화면·컴포넌트 작성 시 **이 문서와 `tokens.css`를 벗어나지 않는다.**
> 소스: `src/assets/styles/tokens.css`, `layout.css`, `components.css`, `base.css`  
> 화면 컨셉·프로필 색: `src/stores/theme.js` · `MyInfoModal.vue` · `MySettingsModal.vue`

---

## 1. 전역 토큰 (`tokens.css`)

### 폰트

| 토큰 | 값 | 용도 |
|---|---|---|
| `--font-family` | Pretendard, -apple-system, Apple SD Gothic Neo, Malgun Gothic | 전역 |
| `--font-size-xs` | **11px** | 보조 라벨, 힌트, 뱃지 |
| `--font-size-sm` | **12px** | 테이블, 필터, 서브텍스트 |
| `--font-size-md` | **13px** | **기본 본문** (body) |
| `--font-size-lg` | **14px** | 섹션 제목, 팝업 타이틀 |
| `--font-size-xl` | **16px** | KPI 숫자(요약), page-title |
| `--font-size-2xl` | **20px** | 페이지 타이틀, KPI 대형 값 |

### 간격

| 토큰 | 값 |
|---|---|
| `--space-xs` | 4px |
| `--space-sm` | 8px |
| `--space-md` | 16px |
| `--space-lg` | 24px |
| `--space-xl` | 32px |
| `--space-2xl` | 48px |

### 레이아웃 치수

| 토큰 | 값 | 영역 |
|---|---|---|
| `--header-height` | **52px** | 헤더, 1단 탭 높이 |
| `--sidebar-width` | **220px** | LNB 펼침 |
| `--sidebar-collapsed-width` | **60px** | LNB 접힘 |
| `--subbar-height` | 40px | (예비) |
| `--container-min-width` | **1280px** | 최소 가로 폭 |

### 라운드·그림자·모션

> 아래는 **기본(default) 컨셉** 값. `내 정보 > 설정 > 색상 모드`에서 프리미엄·다크로 전환하면
> `tokens.css`의 `:root[data-concept="..."]`가 덮어쓴다. **px/rgba를 직접 쓰지 말고**
> `var(--radius-lg)`, `var(--shadow-sm)`, `var(--transition-normal)` 등 토큰만 사용한다.

| 토큰 | 기본값 |
|---|---|
| `--radius-sm` | 6px |
| `--radius-md` | 8px |
| `--radius-lg` | 10px |
| `--r-pill` | 999px |
| `--shadow-sm` | 0 2px 5px rgba(20,30,45,0.06) |
| `--shadow-md` | 0 12px 30px rgba(20,30,45,0.16) |
| `--shadow-sidebar` | 0 4px 20px rgba(20,30,45,0.05) |
| `--transition-fast` | 120ms ease |
| `--transition-normal` | 200ms ease |

---

## 2. 색상 팔레트 (기본 컨셉)

### LNB·앱 셸 (메인 UI)

| 토큰 | HEX | 용도 |
|---|---|---|
| `--lnb-bg` | `#f4f6f8` | 본문 배경, 셸 배경 |
| `--lnb-side` | `#ffffff` | LNB·헤더·카드·패널 표면 |
| `--lnb-logo` | `#1c1d21` | **주요 강조·활성·제목** |
| `--lnb-txt` | `#2b2f36` | 본문 텍스트 |
| `--lnb-muted` | `#9aa0a8` | 보조·비활성 텍스트 |
| `--lnb-icon` | `#7c828b` | 아이콘 기본 |
| `--lnb-line` | `#d7dbe0` | 구분선·테두리 |
| `--lnb-branch` | `#d6dade` | LNB 2depth 가지선 |
| `--lnb-hover` | `#f5f6f8` | hover·선택 배경 |
| `--lnb-active-border` | `#e6e8ec` | LNB 활성 테두리 |
| `--color-primary` | `var(--lnb-logo)` | primary 버튼 배경 |
| `--color-primary-hover` | `#2a3040` | primary 버튼 hover |
| `--color-text-inverse` | `#ffffff` | primary 위 글자 |

### 포인트 색 — Teal (액션·활성·선택)

| 토큰 | HEX | 용도 |
|---|---|---|
| `--teal` | `#119a8a` | **메인 포인트** — CTA, 2단 탭 활성, 알림 dot, LNB 등록 |
| `--teal-600` | `#0e8275` | hover, 링크 강조 |
| `--teal-700` | `#0a6b5f` | 더 진한 강조 |
| `--teal-50` | `#e6f4f2` | 선택·미읽음 배경 |
| `--teal-100` | `#cfe9e5` | ghost 버튼 border |

> 로그인 전용 그라데이션: `linear-gradient(135deg, #0e8275, #119a8a 60%, #15b3a0)`

### 상태 색 (뱃지·단계·알림)

| 상태 | 글자 `--*` | 배경 `--*-bg` |
|---|---|---|
| 접수/기본 | `--gray` `#9aa0a8` | `--gray-bg` `#f5f6f8` |
| 진행 | `--blue` `#3b82f6` | `--blue-bg` `#eff6ff` |
| 테스트/경고 | `--orange` `#f59e0b` | `--orange-bg` `#fffbeb` |
| 완료 | `--green` `#22c55e` | `--green-bg` `#f0fdf4` |
| 지연/위험 | `--red` `#ef4444` | `--red-bg` `#fef2f2` |

### 로그인·모달 전용 (ink 계열)

| 변수 | HEX | 용도 |
|---|---|---|
| `--ink` | `#1f2a30` | 로그인 본문 |
| `--ink-2` | `#48565e` | 보조 텍스트 |
| `--muted` | `#7c8a92` | 라벨·힌트 |
| `--line` | `#e3e8eb` | 입력 테두리 |
| `--field` | `#f1f4f5` | 입력 배경 |

### 오버레이·레이어 z-index

| 용도 | 값 |
|---|---|
| 공통 모달 오버레이 (`BaseModal` / `.modal-overlay`) | `rgba(0,0,0,0.45)` · **z-index 1300** |
| 헤더 레이어 팝업 (`.hdr-layer` — 내정보·검색 등) | **z-index 1200** |
| 헤더 팝업 구 스크림 | `rgba(18, 30, 34, 0.34)` |

> 내정보에서 열리는 **설정**은 `BaseModal`을 쓰므로 헤더 레이어보다 위에 떠야 한다.  
> 모달 z-index를 낮추면 설정 팝업이 내정보 뒤로 깔린다.

---

## 3. 화면 컨셉 (`data-concept`)

경로: **내 정보 → 설정 → 색상 모드**  
구현: `theme.js`의 `conceptOptions` + `tokens.css`의 `:root[data-concept="..."]`  
저장: `localStorage` 키 `hpms.themeConcept`

컨셉끼리는 **마크업·구조를 공유**하고, **디자인 토큰만** 덮어쓴다.

| value | 라벨 | 요지 |
|---|---|---|
| `default` | 기본 | §2 팔레트 그대로 |
| `premium` | 프리미엄 | 더 깊은 teal, radius↑, 다층 shadow, 느린 easing |
| `dark` | 다크 | Claude Desktop / Anthropic dark 톤 (아래) |

### 프리미엄 오버라이드 요약

| 항목 | 값 |
|---|---|
| `--teal` | `#0d7d6f` |
| `--radius-sm/md/lg` | 9 / 13 / 16px |
| `--transition-normal` | 340ms cubic-bezier(0.22, 0.75, 0.15, 1) |
| shadow | inset 하이라이트 + soft 다층 그림자 |

### 다크 오버라이드 (Claude Desktop)

출처: Anthropic MCP Apps design guidelines dark tokens.  
**순수 블랙·쿨 슬레이트 금지.** 따뜻한 near-black + 크림 텍스트 + terracotta 포인트.

| 역할 | 토큰 | HEX |
|---|---|---|
| 셸/페이지 | `--lnb-bg` | `#141413` |
| 카드·패널·LNB | `--lnb-side` | `#30302e` |
| hover·필드 | `--lnb-hover` / `--field` | `#262624` |
| 본문·로고 텍스트 | `--lnb-txt` / `--lnb-logo` | `#faf9f5` |
| 보조 | `--lnb-muted` | `#9c9a92` |
| 테두리 | `--lnb-line` | `#5c5b56` |
| CTA 배경 | `--color-primary` | `#faf9f5` (크림) |
| CTA 글자 | `--color-text-inverse` | `#141413` |
| 포인트(탭·선택) | `--teal` | `#cc785c` (terracotta) |
| 포인트 wash | `--teal-50` | `#3a2a24` |
| 정보/성공/위험/경고 | `--blue` / `--green` / `--red` / `--orange` | `#80aadd` / `#7ab948` / `#ee8884` / `#d1a041` |
| 상태 배경 | `--*-bg` | `#253e5f` / `#1b4614` / `#602a28` / `#483a0f` |

`html`에 `color-scheme: dark` 적용 (`base.css`).

### 컨셉 추가 방법

1. `tokens.css`에 `:root[data-concept="이름"] { ... }` 추가  
2. `theme.js`의 `conceptOptions`에 `{ value, label, desc }` 추가  
3. 화면이 토큰만 쓰면 **다른 파일은 수정 불필요**

검증: **기본 ⇄ 프리미엄 ⇄ 다크**를 전환해 새 UI가 세 상태 모두에서 깨지지 않는지 확인.

---

## 4. 프로필 이미지 색상

경로: **내 정보 → 설정 → 프로필 이미지 색상**  
구현: `theme.js` · `MySettingsModal.vue` · 헤더/내정보 아바타  
저장: `localStorage` 키 `hpms.avatarColor`

| 항목 | 기준 |
|---|---|
| 팔레트 | `avatarColorOptions` **20색** (비비드 + 파스텔) |
| 기본값 | `#119a8a` (첫 번째) |
| 스와치 UI | 원 **50×50px**, 그리드 **4열**, `row-gap: 6px`, 영역 `max-height: 146px` 스크롤 |
| 글자색 | `avatarTextColor(bg)` — 밝기 > 165면 `#1c1d21`, 아니면 `#ffffff` |
| 적용 위치 | 헤더 아바타(28px), 내정보 아바타(52px), 설정 미리보기(48px) |

배경·글자는 **인라인 스타일**로 지정한다. CSS에 `--lnb-logo`만 쓰면 사용자 선택 색이 무시된다.

---

## 5. 영역별 스타일

### LNB (`layout.css`)

| 요소 | 폰트 | 색·크기 |
|---|---|---|
| 브랜드명 | 15px / 800 | `--lnb-logo` |
| 로고 마크 | 14px / 800 | 배경 `--teal`, 글자 `#fff`, 28×28px |
| 그룹 라벨 | **10px** / 800, uppercase | `--lnb-muted` |
| 1depth 메뉴 | **13px** / 500 (활성 700) | 기본 `--lnb-txt`, 활성 `--lnb-logo` |
| 2depth 메뉴 | **12.5px** | 기본 `--lnb-muted`, 활성 `--lnb-logo` |
| Flyout 항목 | 12.5px | 헤드 800 `--lnb-logo` |
| 등록 버튼 | **13px** / 700 | 배경 `--teal`, hover `--teal-600` |
| 아이콘 | 19×19px | `--lnb-icon` (활성 `--lnb-logo`) |

### 헤더 (`layout.css`)

| 요소 | 폰트·크기 | 색 |
|---|---|---|
| 높이 | **52px** | 배경 `--lnb-side`, 하단 `--lnb-line` |
| 1단 탭 | **13px** (활성 600) | 비활성 `--lnb-muted`, 활성 `--lnb-logo` + 하단 2px border |
| 탭 뱃지 통합 | **9px** / 700 | 글자 `--teal`, 배경 `--teal-50` |
| 탭 뱃지 개별 | **9px** / 700 | 글자 `--lnb-txt`, 배경 `--lnb-hover` |
| 아이콘 버튼 | 32×32px, SVG 17px | `--lnb-icon` |
| 알림 dot | 6px | `--teal` |
| 아바타 | **11px** / 600, 28×28px | **사용자 선택 프로필 색** + 대비 글자색 |

### 페이지 타이틀 (`app-subbar`)

| 요소 | 값 |
|---|---|
| 폰트 | **20px** / 700 |
| 색 | `--lnb-txt` |
| 패딩 | `20px 24px 14px` |

### 2단 탭 (`app-subtab-wrap`)

| 요소 | 값 |
|---|---|
| 컨테이너 | 높이 **44px**, margin `0 24px 16px`, border-radius **10px** (`var(--radius-lg)`) |
| 탭 항목 | **13px**, 비활성 `--lnb-muted`, **활성 `--teal` / 700** |

### 헤더 팝업 · 내정보 · 설정

| 요소 | 폰트 | 색·비고 |
|---|---|---|
| 팝업 타이틀 (`.hdr-layer`) | **14px** / 800 | `--lnb-logo` |
| 내정보 이름 | **17px** / 800 | `--lnb-logo` |
| 내정보 아바타 | **20px** / 700, 52×52px | 프로필 선택 색 |
| 비밀번호 변경 / 설정 행 | **13px** / 600 | 하단 border `--lnb-line`, hover `--teal` |
| 설정 모달 | `BaseModal` 중앙 | z-index 1300 (내정보 위) |
| 설정 — 색상 모드 세그먼트 | 12px / 600 | 활성: 배경 `--lnb-logo`, 글자 `--lnb-bg` |
| 검색 CTA | 13px / 600 | 배경 `--lnb-logo`, 글자 `--color-text-inverse` |

### 로그인 (`LoginView.vue`)

| 요소 | 폰트·크기 | 색 |
|---|---|---|
| 좌측 타이틀 | **30px** / 800 | `#fff` |
| 폼 타이틀 | **20px** | `--ink` |
| 입력 라벨 | **12px** / 600 | `--muted` |
| 입력값 | **13px** | `--ink`, 배경 `--field` |
| 로그인 버튼 | **14px** / 700, 높이 44px | `--teal` → hover `--teal-600` |

### 공통 컴포넌트 (`components.css`)

| 요소 | 폰트 | 색 |
|---|---|---|
| `.btn` | **12px** / 500 | primary → `--color-primary` + `--color-text-inverse` |
| `.btn--sm` | **11px** | — |
| `.badge` | **11px** / 500 | 상태별 (`--*-bg`). 다크는 토큰 배경으로 덮어씀 |
| `.card` | — | 배경 `--color-surface`, border `--line`, radius `var(--radius-lg)` |
| `.data-table` th/td | **12px** | th `--color-text-muted`, hover 행 `--lnb-hover` |
| `.page-title` | **16px** / 600 | — |

---

## 6. 사용 규칙 (필수)

1. **하드코딩 색상 금지** — `tokens.css` 변수 또는 영역 내 로컬 변수(`--ink`, `--teal` 등)만 사용.  
   표면 `#fff` / `#fafbfc` 등도 `var(--lnb-side)` / `var(--lnb-hover)`로 둔다 (다크 전환용).
2. **기본 본문 13px** — 더 작게는 11~12px(보조), 더 크게는 역할에 맞는 토큰만.
3. **포인트는 `--teal`** — CTA·활성 탭(2단)·선택·링크. 제목·1단 탭 활성은 `--lnb-logo`.  
   (다크에서는 teal=terracotta, primary CTA=크림 버튼.)
4. **카드·패널** — 배경 `--lnb-side` / `--color-surface`, 테두리 `--lnb-line` / `--line`, radius `var(--radius-lg)`.
5. **상태 뱃지** — 글자/배경 쌍(`--blue` + `--blue-bg` 등)을 항상 세트로 사용.
6. **폰트 굵기** — 일반 500, 강조 600~700, 타이틀 800.
7. **새 화면 패딩** — 본문 좌우 **24px**.
8. **전역 클래스 재정의 금지** — scoped에서 `.card` 등을 같은 값으로 다시 쓰면 Vue 특이도로 컨셉 전환이 깨진다.
9. **UI 변경 후** — 내 정보 → 설정에서 **기본 ⇄ 프리미엄 ⇄ 다크** 및 프로필 색 변경을 확인한다.

---

## 7. 파일 참조

| 파일 | 역할 |
|---|---|
| `src/assets/styles/tokens.css` | 전역·컨셉 변수 |
| `src/assets/styles/layout.css` | LNB·헤더·탭·헤더 레이어 |
| `src/assets/styles/components.css` | 버튼·테이블·`BaseModal` 등 |
| `src/assets/styles/base.css` | reset · `color-scheme` |
| `src/stores/theme.js` | 컨셉·프로필 색 store |
| `MyInfoModal.vue` / `MySettingsModal.vue` | 내정보 · 설정 |
| `LoginView.vue` / `PasswordResetModal.vue` | 인증 |
| `InboxView.vue` / `InboxCalendar.vue` | 내업무 |
