# HPMS 디자인 가이드 (항시 참조)

> 폰트·색상·크기·간격 기준 문서. 새 화면·컴포넌트 작성 시 **이 문서와 `tokens.css`를 벗어나지 않는다.**
> 소스: `src/assets/styles/tokens.css`, `layout.css`, `components.css`, `LoginView.vue`, `InboxView.vue`

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

### 라운드·그림자

| 토큰 | 값 |
|---|---|
| `--radius-sm` | 6px |
| `--radius-md` | 8px |
| `--radius-lg` | 10px |
| `--r-pill` | 999px |
| `--shadow-sm` | 0 2px 5px rgba(20,30,45,0.06) |
| `--shadow-md` | 0 12px 30px rgba(20,30,45,0.16) |
| `--shadow-sidebar` | 0 4px 20px rgba(20,30,45,0.05) |

---

## 2. 색상 팔레트

### LNB·앱 셸 (메인 UI)

| 토큰 | HEX | 용도 |
|---|---|---|
| `--lnb-bg` | `#f4f6f8` | 본문 배경, 셸 배경 |
| `--lnb-side` | `#ffffff` | LNB·헤더·카드·패널 표면 |
| `--lnb-logo` | `#1c1d21` | **주요 강조·활성·제목** (다크) |
| `--lnb-txt` | `#2b2f36` | 본문 텍스트 |
| `--lnb-muted` | `#9aa0a8` | 보조·비활성 텍스트 |
| `--lnb-icon` | `#7c828b` | 아이콘 기본 |
| `--lnb-line` | `#ededf1` | 구분선·테두리 |
| `--lnb-branch` | `#d6dade` | LNB 2depth 가지선 |
| `--lnb-hover` | `#f5f6f8` | hover·선택 배경 |
| `--lnb-active-border` | `#e6e8ec` | LNB 활성 테두리 |
| `--color-primary-hover` | `#2a3040` | 다크 버튼 hover |

### 포인트 색 — Teal (액션·활성·선택)

| 토큰 | HEX | 용도 |
|---|---|---|
| `--teal` | `#119a8a` | **메인 포인트** — CTA, 2단 탭 활성, 알림 dot, LNB 등록 버튼 |
| `--teal-600` | `#0e8275` | hover, 링크 강조 |
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
| `--red` (로그인) | `#e0524a` | 오류 |
| `--green` (모달) | `#1f9d57` | 인증 성공 |

### 오버레이

| 용도 | 값 |
|---|---|
| 헤더 팝업·비밀번호 모달 | `rgba(18, 30, 34, 0.34)` |
| 공통 모달 (components.css) | `rgba(0, 0, 0, 0.45)` |

---

## 3. 영역별 스타일

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
| 아바타 | **11px** / 600, 28×28px | 배경 `--lnb-logo`, 글자 `#fff` |

### 페이지 타이틀 (`app-subbar`)

| 요소 | 값 |
|---|---|
| 폰트 | **20px** / 700 |
| 색 | `--lnb-txt` |
| 패딩 | `20px 24px 14px` |

### 2단 탭 (`app-subtab-wrap`)

| 요소 | 값 |
|---|---|
| 컨테이너 | 높이 **44px**, margin `0 24px 16px`, border-radius **10px** |
| 탭 항목 | **13px**, 비활성 `--lnb-muted`, **활성 `--teal` / 700** |

### 헤더 팝업 (POP-M-COM-04~07)

| 요소 | 폰트 | 색 |
|---|---|---|
| 팝업 타이틀 | **14px** / 800 | `--lnb-logo` |
| 섹션 제목 | **12px** / 700 | `--lnb-logo` |
| 본문·항목명 | **13px** / 600 | `--lnb-txt` 또는 `--lnb-logo` |
| 메타·시간 | **11px** | `--lnb-muted` |
| 입력·버튼 | **13px**, 높이 36px | 포커스 border `--lnb-logo` |
| 검색 버튼 | 13px / 600 | 배경 `--lnb-logo`, hover `#2a3040` |
| 강조 링크·카운트 | 12px / 600~700 | `--teal` |
| 단계 뱃지 | **10~11px** / 700 | 상태 색 팔레트 (§2) |
| 내정보 이름 | **17px** / 800 | `--lnb-logo` |
| 내정보 아바타 | **20px** / 700, 52×52px | `--lnb-logo` |

### 로그인 (`LoginView.vue`)

| 요소 | 폰트·크기 | 색 |
|---|---|---|
| 좌측 타이틀 | **30px** / 800 | `#fff` |
| 좌측 부제 | 14px | `#fff` opacity 0.9 |
| 좌측 설명 | 13px | opacity 0.85 |
| KPI 라벨 | 11px | opacity 0.85 |
| KPI 값 | **24px** / 800 | `#fff` |
| 폼 타이틀 | **20px** | `--ink` |
| 입력 라벨 | **12px** / 600 | `--muted` |
| 입력값 | **13px** | `--ink`, 배경 `--field` |
| 로그인 버튼 | **14px** / 700, 높이 44px | `--teal` → hover `--teal-600` |
| 링크 | 12px / 600 | `--teal-600` |
| 오류 | 12px | `--red` |

### 비밀번호 재설정 (`PasswordResetModal.vue`)

| 요소 | 폰트 | 색 |
|---|---|---|
| 모달 타이틀 | **14px** / 800 | `--ink` |
| 라벨 | **11px** | `--muted` |
| 입력 | **12px** | `--ink-2` |
| CTA 버튼 | 12~12.5px | `--teal` / `#fff` |
| 성공 메시지 | 11px | `--green` |

### 내업무 — 카드형 (`InboxView.vue`)

| 요소 | 폰트 | 색 |
|---|---|---|
| 요약 바 | **13px** | `--lnb-txt` |
| 요약 숫자 | **16px** / 800 | `--lnb-logo` (위험 `--red`) |
| 요약 단위 | 12px | `--lnb-muted` |
| 뷰 토글 | 12px (활성 700) | 활성 `--lnb-logo` |
| 블록 제목 h3 | **14px** / 700 | `.cnt` → `--lnb-logo` |
| 프로젝트 카드명 | **13.5px** / 700 | `--lnb-txt` |
| D-day | 11.5px | `--lnb-muted` |
| 진행률 % | 12px / 700 | `--lnb-logo` |
| 상태 뱃지 | **11px** / 700 | 상태 색 팔레트 |
| 테이블 | **12.5px** | 헤더 `--lnb-muted`, 본문 `--lnb-txt` |
| 빈 상태 | 12.5px | `--lnb-muted` |
| 카드 border-radius | **10px** | border `--lnb-line` |

### 내업무 — 캘린더 (`InboxCalendar.vue`)

| 요소 | 폰트 | 색 |
|---|---|---|
| 월 라벨 | **14px** / 600 | `--color-text` |
| 요일 | **11px** | 일 `--red`, 토 `--blue` |
| 날짜 | 12px | `--color-text-2`, 오늘 `--teal` |
| 일정 블록 | 10.5px | 카테고리별 색 + 18% 투명 배경 |
| 더보기 | 10px | `--teal` |
| 우측 패널 제목 | 13px / 600 | `--teal` |

### 공통 컴포넌트 (`components.css`)

| 요소 | 폰트 | 색 |
|---|---|---|
| `.btn` | **12px** / 500 | primary → `--color-primary` (`--lnb-logo`) |
| `.btn--sm` | **11px** | — |
| `.badge` | **11px** / 500 | 상태별 배경 (§2) |
| `.data-table` th/td | **12px** | th `--color-text-muted` |
| `.filter-bar__label` | **11px** | `--color-text-muted` |
| `.kpi-card__value` | **20px** / 700 | `--color-text` |
| `.page-title` | **16px** / 600 | — |

---

## 4. 사용 규칙 (필수)

1. **하드코딩 색상 금지** — `tokens.css` 변수 또는 영역 내 로컬 변수(`--ink`, `--teal` 등)만 사용.
2. **기본 본문 13px** — 더 작게는 11~12px(보조), 더 크게는 역할에 맞는 토큰만.
3. **포인트 색은 Teal** — CTA·활성 탭(2단)·선택·링크. 다크 `#1c1d21`은 제목·1단 탭 활성·강조 텍스트.
4. **카드·패널** — 배경 `--lnb-side`, 테두리 `--lnb-line`, radius **10px** (작은 요소 8px).
5. **상태 뱃지** — 글자/배경 쌍(`--blue` + `--blue-bg` 등)을 항상 세트로 사용.
6. **폰트 굵기** — 일반 500, 강조 600~700, 타이틀 800.
7. **새 화면 패딩** — 본문 좌우 **24px** (`InboxView` 기준).

---

## 5. 파일 참조

| 파일 | 역할 |
|---|---|
| `src/assets/styles/tokens.css` | 전역 변수 (수정 시 전체 반영) |
| `src/assets/styles/layout.css` | LNB·헤더·탭·팝업 |
| `src/assets/styles/components.css` | 버튼·테이블·모달 등 |
| `src/assets/styles/base.css` | reset·page 공통 |
| `LoginView.vue` / `PasswordResetModal.vue` | 인증 화면 로컬 토큰 |
| `InboxView.vue` / `InboxCalendar.vue` | 내업무 화면 |
