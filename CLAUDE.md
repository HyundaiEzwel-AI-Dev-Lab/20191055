# CLAUDE.md

Behavioral guidelines to reduce common LLM coding mistakes. Merge with project-specific instructions as needed.

**Tradeoff:** These guidelines bias toward caution over speed. For trivial tasks, use judgment.

## 1. Think Before Coding

**Don't assume. Don't hide confusion. Surface tradeoffs.**

Before implementing:
- State your assumptions explicitly. If uncertain, ask.
- If multiple interpretations exist, present them - don't pick silently.
- If a simpler approach exists, say so. Push back when warranted.
- If something is unclear, stop. Name what's confusing. Ask.

Once the user approves proceeding on a batch of items (a checklist, a set of open questions, a list of proposed fixes), that approval covers the whole batch — don't ask again item-by-item. Work through every item, and if verification surfaces an additional related bug/decision along the way, resolve it too without pausing to ask. Only raise confirmation-type questions again after the full batch is done, when reporting results or proposing further work.

When asking the user to confirm a change, don't just name the code/file - explain in plain, non-technical terms what will actually change and how it will behave differently, so someone without a coding background can follow along.

## 2. Simplicity First

**Minimum code that solves the problem. Nothing speculative.**

- No features beyond what was asked.
- No abstractions for single-use code.
- No "flexibility" or "configurability" that wasn't requested.
- No error handling for impossible scenarios.
- If you write 200 lines and it could be 50, rewrite it.

Ask yourself: "Would a senior engineer say this is overcomplicated?" If yes, simplify.

## 3. Surgical Changes

**Touch only what you must. Clean up only your own mess.**

When editing existing code:
- Don't "improve" adjacent code, comments, or formatting.
- Don't refactor things that aren't broken.
- Match existing style, even if you'd do it differently.
- If you notice unrelated dead code, mention it - don't delete it.

When your changes create orphans:
- Remove imports/variables/functions that YOUR changes made unused.
- Don't remove pre-existing dead code unless asked.

The test: Every changed line should trace directly to the user's request.

## 4. Goal-Driven Execution

**Define success criteria. Loop until verified.**

Transform tasks into verifiable goals:
- "Add validation" → "Write tests for invalid inputs, then make them pass"
- "Fix the bug" → "Write a test that reproduces it, then make it pass"
- "Refactor X" → "Ensure tests pass before and after"

For multi-step tasks, state a brief plan:
```
1. [Step] → verify: [check]
2. [Step] → verify: [check]
3. [Step] → verify: [check]
```

Strong success criteria let you loop independently. Weak criteria ("make it work") require constant clarification.

---

**These guidelines are working if:** fewer unnecessary changes in diffs, fewer rewrites due to overcomplication, and clarifying questions come before implementation rather than after mistakes.

---

## Project-Specific: HPMS

### H-PMS 연계 — 단방향 반영 (등록 절차 필수)

이 저장소의 변경은 H-PMS 운영 프로젝트(`HyundaiEzwel-AI-Dev-Lab/H-PMS`) frontend로
**단방향** 반영된다. 목업 → H-PMS. 반대 방향은 없다.

목업에 커밋한 뒤 **H-PMS 저장소에 변경 건을 등록한다.** 등록하지 않으면 그 변경은 아무
기록 없이 지나가고, H-PMS 반영 대상에서 누락된다(과거 18커밋 111파일이 이렇게 누적됐다).

절차: H-PMS `docs/mock-sync/README.md` §5-1

- 템플릿: H-PMS `docs/mock-sync/templates/change-template.md`
- **`[등록자]` 표시된 절만 작성한다.** H-PMS 경로 체계(`pages`/`features`/`entities`/`shared`)나
  담당자 지도는 알 필요 없다 — 목업 관점의 사실만 적는다. 반영 대상 경로·담당자·영향도는
  H-PMS 코디네이터가 채운다.
- 상태는 `PENDING`으로 두고, H-PMS `docs/mock-sync/index.md`에 행을 추가한다.

**파일을 삭제하거나 대량 리네임할 때는 의도를 반드시 남긴다** — 내부 리팩터링인지 기능
폐기인지, 대체 파일이 있는지. H-PMS는 "목업에서 삭제됐다"는 이유만으로 파일을 지우지
않고, 이 의도를 근거로 반영 여부를 판정한다. 의도가 없으면 판정이 막혀 작업이 멈춘다.
(예: `components/ui/*` 8개 삭제 시 내부 통합인지 기능 폐기인지 불명확해 H-PMS 측이
추정해야 했다.)

빌드 산출물(`dist/`, `docs/`)은 동기화 대상이 아니다 — H-PMS가 경로 필터로 제외한다.

### Theme concepts (색상/화면 컨셉)

This app has a live concept switcher (**내 정보 → 설정 → 색상 모드**) backed by `src/stores/theme.js` and `:root[data-concept="..."]` blocks in `src/assets/styles/tokens.css`. Concepts: `default` / `premium` / `dark` (Claude Desktop warm near-black). They share layout/markup and only override design tokens (`--radius-*`, `--shadow-*`, `--transition-*`, `--teal*` etc.) — never component structure. Profile avatar color (20 swatches) is also in Settings via `avatarColor` in the same store.

When creating new UI or modifying existing screens:
- **Use tokens, not literals.** Reach for `var(--radius-lg)`, `var(--shadow-sm)`, `var(--transition-normal)`, `var(--lnb-side)` etc. instead of hardcoding px/shadow/`#fff` in a view's own `<style>`. A hardcoded value silently opts that element out of every concept except the one it happens to match.
- **Don't shadow shared tokens locally.** Redefining a class like `.card` inside a component's scoped style (even with "the same" values) wins over the global rule via Vue's scoped-attribute specificity and breaks concept switching for that element. Extend or reuse the global rule (`components.css`, `layout.css`) instead.
- **Verify under every concept before calling a UI change done.** Open 내 정보 → 설정 and toggle 기본 ⇄ 프리미엄 ⇄ 다크 (and profile color) — don't just eyeball the default.
- **Adding a new color concept:** add a `:root[data-concept="name"] { ... }` block to `tokens.css` overriding the same token set, then add `{ value: 'name', label, desc }` to `conceptOptions` in `src/stores/theme.js`. No other file should need touching if the screen already consumes tokens correctly.