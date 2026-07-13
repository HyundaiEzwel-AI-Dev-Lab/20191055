# PMS (Project Management System)

Vue 3 + Vite + Pinia + Vue Router 기반 PMS 프론트엔드

## 실행 방법

```bash
# 의존성 설치
npm install

# 개발 서버 실행 (http://localhost:5173)
npm run dev

# 프로덕션 빌드
npm run build

# 빌드 결과 미리보기
npm run preview
```

## 로고 교체

로고 파일은 아래 경로에 고정되어 있습니다. **파일명을 변경하지 말고** 이미지만 교체하세요.

```
public/logo.png
```

- 헤더(`AppHeader.vue`)와 브라우저 파비콘(`index.html`)에서 이 파일을 참조합니다.
- 권장: PNG, 투명 배경, 가로형 로고

## 프로젝트 구조

기준 문서:
- `PROJECT_STRUCTURE.md` — 폴더 구조, views 24개, 라우팅
- `HPMS_공통레이아웃_정의.md` — 레이아웃, Tab, LNB, 스타일, 공통 컴포넌트

```
HPMS/
├─ public/logo.png          ← 로고 (교체만)
├─ index.html               ← Vite 진입 HTML
├─ src/
│  ├─ assets/styles/        ← 전역 CSS
│  ├─ components/layout/    ← AppShell, Header, Sidebar, TabBar
│  ├─ components/ui/        ← 공통 UI 컴포넌트
│  ├─ views/                ← 화면별 뷰 (1파일 = 1화면)
│  ├─ stores/               ← Pinia 전역 상태
│  ├─ router/               ← 라우팅
│  ├─ composables/          ← 재사용 로직
│  └─ data/                 ← 목업 데이터
```
