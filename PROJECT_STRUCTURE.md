# H-PMS 프로젝트 구조 (항시 참조용)

> 구조 **원칙·확정 결정** 문서입니다.  
> **파일별 상세 트리·기획서 대비 차이**는 `SOURCE_TREE.md`를 보세요.  
> 공통 레이아웃·Tab·LNB·UX는 `HPMS_공통레이아웃_정의.md` 참고.

---

## 1. 폴더 구조 (요약)

상세 주석은 `SOURCE_TREE.md`가 정본입니다. 아래는 작업 시 빠른 참조용 요약입니다.

```
HPMS/
├─ public/logo.png
├─ index.html · package.json · vite.config.js
├─ SOURCE_TREE.md              ← 파일 카탈로그 · 기획 차이 (Wiki용)
├─ PROJECT_STRUCTURE.md        ← 본 문서 (원칙·결정)
├─ DESIGN_GUIDE.md
├─ HPMS_공통레이아웃_정의.md
└─ src/
   ├─ main.js · App.vue
   ├─ assets/styles/           ← tokens · base · components · layout · admin
   ├─ router/ · stores/ · composables/ · utils/ · data/
   ├─ components/layout|ui|header|…
   └─ views/                   ← 화면 (등록·변경이력·DEV/운영은 공용 View 허용)
```

---

## 2. 확정 사항 (검토 후 결정)

| 이슈 | 결정 |
|---|---|
| 대시보드 관련 화면(통합 3종 + 개별 1종) 구성 | **4개 파일로 분리** (MainDashboardView / PerformanceView / TechResourceView / ProjectDashboardView) |
| **프로젝트 등록 vs 정보** | 기획은 등록 전용 페이지(`PAG-M-PRJ-01`) + 정보(`PAG-S-INF-01`). **구현은 합침**: 이름 모달 → `ProjectInfoView` 등록/수정 공용. `ProjectRegisterView` 삭제 |
| **프로젝트 변경이력** | 기획은 통합(`PAG-M-PST-03`)·개별(`PAG-S-INF-05`) 화면 ID 분리. **구현은 합침**: `ProjectHistoryView` 1개, 라우트로 전체/현재 프로젝트 분기. 상세 템플릿은 기획도 동일 명시 |
| 단위테스트(PAG-S-TST-01) | UnitTestView.vue |
| 휴무일관리(PAG-M-SYS-07) | HolidayMgmtView.vue |
| 팝업 컴포넌트 규모 | BaseModal 재사용. 팝업마다 View 파일 폭증 방지 |
| 헤더 팝업(검색/알림/내프로젝트/내정보) | AppHeader 내부 (POP-M-COM-04~07) |
| 시나리오/수행/결함/진척 | DEV·운영 공용 View + `route.params.mode` (`dev`/`uat`) |
| **WBS 일정변경 UI 통일** | 기획은 단일 일정변경과 다중(일괄) 일정변경 UI를 분리. **구현은 다중 일정 변경 UI로 통일** — 단건·다건 모두 `WbsBulkScheduleModal` (POP-S-WBS-05). 상세는 아래 §2.1 |

---

## 2.1 WBS 일정변경 — 기획 대비 구현 (체크 결과)

| 구분 | 기획서 | 현재 구현 |
|---|---|---|
| 단일 일정변경 | 별도 단일 변경 UI | **없음** — 다중 UI를 단건(1행)으로 재사용 |
| 다중/일괄 일정변경 | POP-S-WBS-04/05 등 | `WbsBulkScheduleModal.vue` (`POP-S-WBS-05`, 제목「다중 일정 변경」) |
| 일정 관리(착수·완료) | POP-S-WBS-02 | `WbsScheduleModal.vue` 유지. **「일정변경 요청」만** 다중 UI로 위임 |

**진입 경로 (소스 확인)**

1. WBS 목록 툴바 **「일정변경」** → 선택 행 N건 → `WbsBulkScheduleModal` (`WbsView.onScheduleChange`)
2. `WbsScheduleModal` **「일정변경 요청」** → `open-multi-change` → 해당 태스크 1건을 `bulkTargets`에 넣어 동일 모달 (`onOpenMultiChangeFromSchedule`)
3. 모달 내부는 행별 계획일/홀딩 수정 · 단건/다건 동일 레이아웃 (`WbsBulkScheduleModal` 주석: *단건/다건 공통 UI*)

**관련 파일:** `src/views/WbsView.vue` · `src/components/wbs/WbsBulkScheduleModal.vue` · `src/components/wbs/WbsScheduleModal.vue`

---

## 3. views ↔ 화면ID 요약

- LNB 리프는 다수이나, DEV/운영·등록/정보·변경이력처럼 UI 동일 구간은 **공용 View**로 파일 수 축소
- 정확한 파일↔화면ID·트리 주석: `SOURCE_TREE.md`
- 레이아웃 동작: `HPMS_공통레이아웃_정의.md`

---

## 4. 문서 역할 정리

| 문서 | 쓸 때 |
|------|--------|
| `SOURCE_TREE.md` | “이 파일이 뭐지?” / Wiki 붙여넣기 / 기획과 다른 합침 내역 |
| `PROJECT_STRUCTURE.md` | “왜 이렇게 나눴지?” / 확정 결정 테이블 |
| `HPMS_공통레이아웃_정의.md` | Tab·LNB·헤더 UX 구현 시 |
| `DESIGN_GUIDE.md` | 색·폰트·간격 토큰 |

→ **공통 레이아웃은 합치지 않음.** SOURCE_TREE ↔ PROJECT_STRUCTURE는 역할 분리로 중복 트리만 줄임.
