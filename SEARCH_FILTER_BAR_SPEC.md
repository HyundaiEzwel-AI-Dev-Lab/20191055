# 검색 필터 바 (SearchFilterBar) — h-pms 적용 가이드

> HPMS 목업에서 확정된 최종 스펙입니다.  
> **형태**는 최초 제공안과 동일하고, **색상**은 리터럴 금지 → 프로젝트 디자인 토큰(컨셉 모드)을 따릅니다.  
> 이 문서만 보고 h-pms에 동일하게 옮길 수 있게 구성했습니다.

---

## 프롬프트 (바이브 코딩 도구에 붙여넣기)

```
검색 필터 바를 아래 스펙대로 구현해줘.

레이아웃: 카드(border-radius var(--radius-lg), box-shadow var(--shadow-sm)) 안에 한 줄 툴바.
색상은 전부 CSS 변수(토큰)만 사용. #hex / oklch 리터럴 금지. 기본·프리미엄·다크 컨셉이 자동 반영되어야 함.

- 좌: 검색 아이콘 + placeholder 텍스트 인풋
  - 배경 var(--lnb-hover), radius var(--r-pill), height 40px, 테두리 없음
- "라벨|값" 결합형 드롭다운 필:
  - 배경 var(--lnb-side), 테두리 var(--lnb-line), radius var(--r-pill), height 40px
  - 안에 <라벨(var(--lnb-muted), semibold)> | <값(var(--lnb-logo), semibold)>
  - 우측 chevron은 SVG background-image가 아니라 mask + background-color: var(--lnb-muted)
    (컨셉별로 화살표 색이 바뀌어야 함). padding-right 30px 유지, inline으로 padding-right 재정의 금지
  - 실제 <select>는 opacity:0 으로 같은 영역에 겹쳐 클릭/선택
- 날짜 범위: 같은 필박스 안에 <input type=date> 2개 + "~"
  - 클릭 시 showPicker() 호출
- 우측: "초기화"(ghost, 테두리만) + "조회"(채워진 primary = var(--teal), radius var(--r-pill))
- 카드 하단 중앙에 지름 22px 원형 "더보기"
  - position:absolute; bottom:-11px; left:50%; transform:translateX(-50%)
  - 테두리 없음, box-shadow var(--shadow-sm)
  - +/− 는 텍스트 글리프 금지(폰트 메트릭 때문에 위로 치우침). CSS 가로/세로 막대 2개로 그림
  - 펼침 시 세로 막대만 opacity:0 → 가로선만 남아 "−"처럼 보임

펼침 상태(더보기 클릭 시):
- 카드 안, 툴바 아래 점선 구분선 + 패널(배경 var(--lnb-hover))
- 4열 그리드로 추가 필터(라벨|값 필 / 텍스트 필 / 날짜)
- 값이 있는 필터는 "적용된 필터" 태그로 표시, ✕로 개별 삭제
- expand 슬롯이 없는 화면(어드민 등)은 더보기 숨기고, 태그만 툴바 아래에 단독 노출

주의:
- 카드 overflow:visible, height:auto (고정 height 금지)
- 기존 .filter / .filter__row / .filter__field 마크업·scoped CSS는 제거하고 공통 컴포넌트로 교체
```

---

## 파일 구성 (HPMS 기준 → h-pms에 동일 배치 권장)

| 파일 | 역할 |
|------|------|
| `src/shared/styles/search-filter.css` | 필터 바·필·날짜 전역 스타일 |
| `src/shared/ui/SearchFilterBar.vue` | 카드 셸 (검색 / primary / expand / 더보기 / 태그) |
| `src/shared/ui/FilterSelectPill.vue` | 라벨\|값 결합 select |
| `src/shared/ui/FilterTextPill.vue` | 라벨\|텍스트 인풋 |
| `src/shared/ui/FilterDateRange.vue` | 날짜 범위 |

`main.js`(또는 전역 스타일 진입점)에 추가:

```js
import '@/shared/styles/search-filter.css'
```

---

## 색상 토큰 매핑 (컨셉 모드 대응)

리터럴 대신 아래처럼 파생 변수를 `:root`에 둡니다.  
`tokens.css`의 `data-concept`가 `--lnb-*` / `--teal*`를 바꾸면 필터 바가 자동으로 따라갑니다.

```css
:root {
  --sfb-line: var(--lnb-line);
  --sfb-label: var(--lnb-muted);
  --sfb-value: var(--lnb-logo);
  --sfb-field: var(--lnb-hover);
  --sfb-panel: var(--lnb-hover);
  --sfb-primary: var(--teal);
  --sfb-primary-hover: var(--teal-600);
  --sfb-tag-bg: var(--teal-50);
  --sfb-tag-fg: var(--teal-600);
  --sfb-primary-fg: #fff; /* 다크 컨셉에서 CTA 글자색이 다르면 토큰으로 교체 */
}
```

| UI 요소 | 토큰 |
|---------|------|
| 카드/필 배경 | `var(--lnb-side)` |
| 검색 필박스·펼침 패널 | `var(--lnb-hover)` |
| 테두리·구분 `|` | `var(--lnb-line)` |
| 라벨 텍스트 | `var(--lnb-muted)` |
| 값 텍스트 | `var(--lnb-logo)` |
| 조회 버튼·더보기 아이콘 | `var(--teal)` / `var(--teal-600)` |
| 적용 필터 태그 | `var(--teal-50)` + `var(--teal-600)` |
| radius | `var(--radius-lg)`, `var(--radius-md)`, `var(--r-pill)` |
| shadow | `var(--shadow-sm)` |

---

## 핵심 CSS (전체는 `search-filter.css`에 둠)

### 카드 · 툴바 · 버튼

```css
.sfb {
  position: relative;
  background: var(--lnb-side);
  border: 1px solid var(--sfb-line);
  border-radius: var(--radius-lg);
  box-shadow: var(--shadow-sm);
  padding: 12px 14px 18px;
  margin-bottom: 22px;
  overflow: visible;
  height: auto;
  box-sizing: border-box;
}

.sfb__toolbar {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 8px 10px;
}

.sfb__search-input {
  height: 40px;
  padding: 0 14px 0 34px;
  border: none;
  border-radius: var(--r-pill);
  background: var(--sfb-field);
  color: var(--sfb-value);
}

.sfb__btn {
  height: 40px;
  padding: 0 18px;
  border-radius: var(--r-pill);
  font-weight: 600;
  cursor: pointer;
}

.sfb__btn--ghost {
  background: var(--lnb-side);
  border: 1px solid var(--sfb-line);
  color: var(--lnb-txt);
}

.sfb__btn--primary {
  background: var(--sfb-primary);
  border: 1px solid var(--sfb-primary);
  color: var(--sfb-primary-fg);
}
```

### 원형 더보기 (+/− = CSS 막대, 글리프 금지)

```css
.sfb__more {
  position: absolute;
  left: 50%;
  bottom: -11px;
  transform: translateX(-50%);
  width: 22px;
  height: 22px;
  border-radius: 50%;
  border: none;
  background: var(--lnb-side);
  box-shadow: var(--shadow-sm);
  cursor: pointer;
  padding: 0;
  z-index: 2;
}

/* 8px 박스 + 2px 막대 → 정수 픽셀, 시각적 정중앙 */
.sfb__more-icon {
  position: absolute;
  top: 50%;
  left: 50%;
  width: 8px;
  height: 8px;
  transform: translate(-50%, -50%);
  pointer-events: none;
}

.sfb__more-icon::before,
.sfb__more-icon::after {
  content: '';
  position: absolute;
  background: var(--sfb-primary-hover);
  border-radius: 1px;
}

.sfb__more-icon::before { /* 가로 */
  left: 0; right: 0; top: 3px; height: 2px;
}

.sfb__more-icon::after { /* 세로 — 펼치면 숨김 → "−" */
  top: 0; bottom: 0; left: 3px; width: 2px;
  transition: opacity var(--transition-fast);
}

.sfb__more-icon--open::after {
  opacity: 0;
}
```

마크업:

```html
<button type="button" class="sfb__more" :aria-expanded="expanded" @click="toggle">
  <span class="sfb__more-icon" :class="{ 'sfb__more-icon--open': expanded }"></span>
</button>
```

### 라벨|값 결합 필 + 투명 select

```css
.sfb-pill { position: relative; display: inline-flex; align-items: center; }

.sfb-pill__face {
  position: relative;
  display: flex;
  align-items: center;
  gap: 6px;
  height: 40px;
  padding: 0 30px 0 14px; /* 우측 30px — 화살표 자리. padding-right 재정의 금지 */
  border: 1px solid var(--sfb-line);
  border-radius: var(--r-pill);
  background: var(--lnb-side);
  font-size: calc(13px + var(--font-size-offset, 0px));
  white-space: nowrap;
}

.sfb-pill__label { color: var(--sfb-label); font-weight: 600; }
.sfb-pill__sep   { color: var(--sfb-line); }
.sfb-pill__value { color: var(--sfb-value); font-weight: 600; }

/* chevron: mask로 그려 컨셉 색 추종 */
.sfb-pill__face--select::after {
  content: '';
  position: absolute;
  right: 12px;
  top: 50%;
  width: 9px;
  height: 6px;
  transform: translateY(-50%);
  background-color: var(--sfb-label);
  -webkit-mask: url('data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="10" height="6"><path d="M1 1l4 4 4-4" stroke="black" stroke-width="1.6" fill="none"/></svg>') no-repeat center / 9px 6px;
  mask: url('data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="10" height="6"><path d="M1 1l4 4 4-4" stroke="black" stroke-width="1.6" fill="none"/></svg>') no-repeat center / 9px 6px;
  pointer-events: none;
}

.sfb-pill__native {
  position: absolute;
  inset: 0;
  opacity: 0;
  cursor: pointer;
  width: 100%;
  height: 100%;
}
```

### 날짜 범위 + showPicker

```js
function openPicker(e) {
  try { e.currentTarget.showPicker?.() } catch { /* ignore */ }
}
```

```html
<div class="sfb-date">
  <span class="sfb-date__label">오픈기간</span>
  <span class="sfb-date__sep-pipe">|</span>
  <input class="sfb-date__input" type="date" @click="openPicker" />
  <span class="sfb-date__tilde">~</span>
  <input class="sfb-date__input" type="date" @click="openPicker" />
</div>
```

---

## Vue 컴포넌트 사용법

### SearchFilterBar

```vue
<script setup>
import { ref, computed } from 'vue'
import SearchFilterBar from '@/shared/ui/SearchFilterBar.vue'
import FilterSelectPill from '@/shared/ui/FilterSelectPill.vue'
import FilterTextPill from '@/shared/ui/FilterTextPill.vue'
import FilterDateRange from '@/shared/ui/FilterDateRange.vue'

const filterExpanded = ref(false)
const filters = ref({
  keyword: '',
  dept: '',
  status: '',
  owner: '',
  openFrom: '',
  openTo: '',
})

const filterTags = computed(() => {
  const f = filters.value
  const tags = []
  if (f.dept) tags.push({ key: 'dept', label: '부서', value: f.dept })
  if (f.status) tags.push({ key: 'status', label: '상태', value: f.status })
  if (f.owner) tags.push({ key: 'owner', label: '담당자', value: f.owner })
  if (f.openFrom || f.openTo) {
    tags.push({ key: 'openRange', label: '기간', value: `${f.openFrom || '…'} ~ ${f.openTo || '…'}` })
  }
  return tags
})

function removeFilterTag(key) {
  if (key === 'openRange') {
    filters.value.openFrom = ''
    filters.value.openTo = ''
  } else {
    filters.value[key] = ''
  }
  // 필요 시 search() 재호출
}

function resetFilters() { /* 초기값 복원 */ }
function search() { /* 조회 */ }
</script>

<template>
  <SearchFilterBar
    v-model:expanded="filterExpanded"
    v-model:search="filters.keyword"
    search-placeholder="프로젝트명 또는 ID"
    :applied-tags="filterTags"
    @reset="resetFilters"
    @search="search"
    @remove-tag="removeFilterTag"
  >
    <template #primary>
      <FilterSelectPill
        label="부서"
        v-model="filters.dept"
        :options="[{ value: '', label: '전체' }, 'IT기획팀', '개발1팀']"
        empty-label="전체"
      />
      <FilterSelectPill
        label="상태"
        v-model="filters.status"
        :options="['전체', '진행', '완료']"
      />
      <FilterDateRange
        label="오픈기간"
        :from="filters.openFrom"
        :to="filters.openTo"
        @update:from="filters.openFrom = $event"
        @update:to="filters.openTo = $event"
      />
    </template>

    <template #expand>
      <FilterTextPill label="담당자" v-model="filters.owner" placeholder="이름" />
      <!-- 발의주체 / 개발구분 / 적요 등 동일 패턴 -->
    </template>
  </SearchFilterBar>
</template>
```

### Props / Emits 요약

| 컴포넌트 | 주요 props | emits |
|----------|------------|-------|
| `SearchFilterBar` | `expanded`, `search`, `searchPlaceholder`, `showSearch`, `showExpand`, `appliedTags`, `panelClass` | `update:expanded`, `update:search`, `reset`, `search`, `remove-tag` |
| `FilterSelectPill` | `label`, `modelValue`, `options` (string \| `{value,label}`), `emptyLabel`, `fill`, `disabled` | `update:modelValue` |
| `FilterTextPill` | `label`, `modelValue`, `placeholder`, `type`, `readonly`, `list`, `fill` | `update:modelValue`, `enter`, `click` |
| `FilterDateRange` | `label`, `from`, `to` | `update:from`, `update:to` |

### 슬롯 규칙

| 슬롯 | 용도 |
|------|------|
| `#primary` | 1줄 툴바 중간 필드 (select/date/text pill) |
| `#expand` | 더보기 펼침 패널. **없으면 더보기 버튼 자동 숨김** |
| `FilterTextPill` `#trailing` | 우측 아이콘 버튼 등 (예: 화면검색) |

- 통합검색 텍스트는 `v-model:search`로 SearchFilterBar 내장 검색칸 사용 (primary에 중복 넣지 않음).
- 검색칸이 필요 없으면 `:show-search="false"`.
- expand가 없는 화면: `#expand` 생략 → 적용 태그는 툴바 아래 단독 표시.

---

## 페이지 마이그레이션 체크리스트

기존 `<section class="filter card">` / `.filter__row` / `.filter__field` / `.filter__expand` 를 아래처럼 교체.

1. import 4개 컴포넌트 + (필요 시) SearchableSelect pill variant  
2. `filterTags` computed + `removeFilterTag` 추가  
3. 마크업을 `SearchFilterBar` + pill로 교체  
4. **필터 전용** scoped CSS (`.filter`, `.filter__*`) 삭제. `.btn` / `.toolbar` 등 다른 곳에서 쓰면 유지  
5. 비즈니스 로직(조회/초기화/applied snapshot)은 그대로

### HPMS에서 적용 완료된 화면 (참고)

- 통합: 메인/실적/테크리소스 대시보드, 프로젝트 현황, 테스트 라이브러리  
- 워크스페이스: 요구사항, WBS, 변경이력, 시나리오, 테스트수행, 결함, 진척, 단위테스트  
- 시스템: 사용자, 휴무일, 승인, 메뉴관리  

모달 내부 compact 필터(`.fld` / `.inp`)는 이번 범위에서 제외해도 됨.

---

## 특수 케이스

### 1) 검색 가능 셀렉트 (요청부서 등)

`SearchableSelect`에 `variant="pill"` + `label` 추가:

```vue
<SearchableSelect
  variant="pill"
  label="요청부서"
  v-model="filters.requestDept"
  :options="requestDepts"
  placeholder="선택"
/>
```

pill일 때 face는 `.sfb-pill__face` 클래스를 재사용해 동일 룩을 맞춤.

### 2) 커스텀 멀티 체크 드롭다운 (WBS 진행상태)

`FilterSelectPill`로 못 넣는 컨트롤은 `#primary` 안에 두고, **외형만** `.sfb-pill`과 동일한 토큰·radius·chevron(mask)을 맞출 것. 리터럴 `#e7e9ee` 금지.

### 3) 체크박스 그룹 (프로젝트 현황 시스템/업무구분)

`#expand` 안에서 `style="grid-column: 1 / -1"` 래퍼로 전폭 배치.

### 4) 종속 select (시스템 → 업무구분)

```vue
<FilterSelectPill
  label="업무구분"
  v-model="filters.bizCategory"
  :options="bizOptions"
  :disabled="!filters.system"
/>
```

---

## 주의사항 (구현 시 자주 깨지는 것)

1. **카드 `overflow: visible` + `height: auto`** — 펼침이 높이를 밀어내야 하고, 원형 더보기가 테두리에 걸친다.  
2. **더보기 아이콘은 `+`/`−` 문자 쓰지 말 것** — 원 안에서 위로 떠 보임. CSS 막대 방식 유지.  
3. **chevron SVG stroke 색을 hex로 박지 말 것** — dark에서 묻힘. mask + `var(--sfb-label)`.  
4. **`.sfb-pill__face`의 `padding-right: 30px`를 inline으로 덮지 말 것** — 화살표가 밀림.  
5. **색상 리터럴 금지** — 기본/프리미엄/다크는 토큰만으로 검증.  
6. **적용 태그** — expand 있는 화면은 패널 안, 없는 화면은 툴바 아래 standalone.

---

## 검증

- [ ] 기본 / 프리미엄 / 다크에서 필터 바·필·조회 버튼·더보기 색이 컨셉에 맞음  
- [ ] `+`가 원 시각적 정중앙  
- [ ] 더보기 → 패널이 카드 높이를 밀어냄, 더보기 원은 테두리 중앙에 걸침  
- [ ] select / date / 초기화 / 조회 / 태그 ✕ 동작  
- [ ] `npm run build` 통과  

---

## 원본 파일 위치 (복사용)

HPMS 저장소:

- `src/shared/styles/search-filter.css` — **전체 CSS 원본** (위 발췌보다 이 파일을 통째로 복사 권장)
- `src/shared/ui/SearchFilterBar.vue`
- `src/shared/ui/FilterSelectPill.vue`
- `src/shared/ui/FilterTextPill.vue`
- `src/shared/ui/FilterDateRange.vue`

가장 빠른 적용: 위 5개 파일을 h-pms 동일 경로에 복사 → 전역 CSS import → 화면별 `.filter card`를 SearchFilterBar로 교체.
