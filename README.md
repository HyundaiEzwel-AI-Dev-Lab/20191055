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

## GitHub Pages (브라우저에서 바로 보기)

로컬 설치 없이 화면을 확인할 수 있습니다.

- **URL:** https://hyundaiezwel-ai-dev-lab.github.io/20191055/
- **저장소:** https://github.com/HyundaiEzwel-AI-Dev-Lab/20191055

접속·로그인 방법(테스트 계정)은 **`TEST_ACCOUNTS.md`** 를 참고하세요.

### Pages 설정 (최초 1회)

소스 루트(`main` / `(root)`)로 배포하면 Vite 앱이 동작하지 않습니다. 아래처럼 바꿔 주세요.

1. Repo → **Settings → Pages**
2. **Source:** Deploy from a branch
3. **Branch:** `main` / **`/docs`** (root가 아님)
4. Save 후 1~2분 뒤 https://hyundaiezwel-ai-dev-lab.github.io/20191055/ 접속

Pages용 빌드 산출물은 `docs/` 폴더입니다. 화면 수정 후 배포할 때:

```bash
npm run build:pages
git add docs
git commit -m "Update GitHub Pages build"
git push
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
- `SOURCE_TREE.md` — 소스 트리·파일별 설명·기획서 대비 합침 내역 (Wiki용)
- `PROJECT_STRUCTURE.md` — 구조 원칙·확정 결정
- `HPMS_공통레이아웃_정의.md` — 레이아웃, Tab, LNB, 공통 UX
- `DESIGN_GUIDE.md` — 색상·폰트·간격

```
HPMS/
├─ public/logo.png          ← 로고 (교체만)
├─ index.html
├─ src/                     ← 애플리케이션
└─ …                        ← 상세는 SOURCE_TREE.md
```
