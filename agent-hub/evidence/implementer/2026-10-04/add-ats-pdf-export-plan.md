# 2026-10-04 — add-ats-pdf-export (implementer note)

- Worker: implementer (main session)
- Node: `add-ats-pdf-export`
- GitHub issue: #211
- Branch: `211-add-ats-friendly-cv` (forked from `staging` at `03d8806`,
  the post-v1.9.0-release `staging` HEAD)

## What this node does
1. `GET /api/v1/download-pdf` gains `?template=classic|ats` (default
   `classic`, unchanged for every existing client).
2. New ATS-optimized template (`src/services/createPDF.ats.ts`):
   single column, no `letter-spacing`, system sans-serif font stack
   (`Arial, Helvetica, "Liberation Sans", sans-serif`), real PDF metadata
   via `pdf-lib`, sanitized free-text, localized standard section
   headings (`src/locales/en.ts`/`vi.ts`'s new `cv` namespace), no
   DOB/gender/marital/photo.
3. New `POST /api/v1/cv/ats-check` (`src/candidate_me/ats-check.ts`,
   `src/routers/api/v1/cv.route.ts`): renders either template in memory
   (`template` body field, default `ats`), extracts real text via
   `pdf-parse`, runs 10 pure check functions
   (`src/services/atsChecks.ts`), and — when `jobDescription` is given —
   scores keyword coverage against a curated dictionary
   (`src/constant/atsKeywords.ts`, `src/services/keywordMatcher.ts`).
4. Classic-template bug fix: `formatDate`'s `m < 9` → `String(m).padStart(2,
   '0')` (September rendered as `9/2024` instead of `09/2024`). The
   `getSkills` bug (#188) was **already fixed** before this node (confirmed
   by reading the code and its own inline comment citing #188) — only a
   regression test was added, no further production fix needed there.
5. New doctrine standard: `agent-hub/doctrine/standards/pdf-export-standard.md`
   (10 binding invariants for any future PDF/DOCX export fix or feature),
   referenced from `agent-hub/CLAUDE.md`'s default loop and both
   `INDEX.md` files — operator-requested ("ghi nhận thêm file md để sau
   này có bất kì fix hay feature nào liên quan tới export file pdf đều
   phải theo đề xuất này").

## Real deviations from the original prompt, with reasoning
1. **`pdf-parse` pinned to `1.1.4`, not latest (`2.4.5`).** The latest
   major is a full rewrite (class-based `PDFParse` API, pulls in
   `pdfjs-dist` types) that doesn't match `@types/pdf-parse` (written for
   the stable v1 `function(buffer) -> {text, numpages}` API). Operator
   picked "pdf-parse" over "pdfjs-dist" in this session specifically for
   simplicity; pinning to the stable v1 API line preserves that intent
   instead of taking on v2's much larger surface area for a feature that
   only needs plain text + page count.
2. **`sanitize-html` swapped for `xss`.** `sanitize-html@2.18.0`'s
   dependency `htmlparser2@12` is `"type": "module"` with no `require`
   export condition — Jest's module system (not Node's own `require`,
   which has newer ESM-interop on this machine's Node 24) threw
   `SyntaxError: Cannot use import statement outside a module` the moment
   any test imported `createPDF.ats.ts`. `xss@1.0.15` gives the same
   allow-list sanitization (`whiteList`/`stripIgnoreTag`/
   `stripIgnoreTagBody`) with a plain-CJS dependency tree (`commander@2`,
   `cssfilter`) — verified it strips `<script>`/`<img onerror>`/`onclick`
   and neutralizes `javascript:` hrefs the same way, via a real
   `node -e` check (see "Manual verification" below). Reflected in
   `package.json` (`sanitize-html`/`@types/sanitize-html` never landed in
   a commit — removed again in the same session before committing) and
   in a code comment in `createPDF.ats.ts`.
3. **Dictionary correction mid-session, caught by the matcher's own
   unit test:** `javascript`'s `aliases` originally included bare `'js'`,
   which word-boundary-matched inside `.js`-suffixed framework names
   (`vue.js`, `node.js`, ...) that are already their own dictionary
   entries — a JD mentioning "Vue.js" was silently also counted as a
   separate "javascript" keyword never actually stated on its own. Fixed
   by dropping the bare `'js'` alias; `keywordMatcher.test.ts`'s own
   coverage-math assertion (expected `3/4`, got `0.6`) is what caught it
   before this was ever manually run against a real fixture — not found
   by inspection.
4. **Missing dictionary entry found via live run, not a test:** the
   demo run below showed "Node.js" in a sample JD not being recognized
   at all — `node.js`/`nodejs` had no entry in `atsKeywords.ts`'s
   `frameworks` list (a real content gap, arguably the single most common
   backend keyword to omit). Added `{ canonical: 'node.js', aliases:
   ['node.js', 'nodejs'] }`, deliberately excluding bare `'node'` as an
   alias (too generic — "node" meaning a graph/LB node, not the runtime).
5. **`checkReadingOrder`'s heading search made case-insensitive.** The
   ATS template's `.heading` CSS applies `text-transform: uppercase`
   (explicitly allowed on headings by the prompt's own spec: "avoid
   `text-transform: uppercase` on body text (allowed on section headings
   only)"). Chromium's print-to-PDF renders the actual uppercase glyphs,
   so real extracted text has `SKILLS` while `t('cv.skills', lang)`
   returns `Skills` — an exact-case substring search would have falsely
   failed `reading-order` on every real PDF, not just a broken one. Found
   via the real-Puppeteer integration test's own extracted-text printout
   (`SUMMARY`/`SKILLS`/`EXPERIENCE` all-caps), not inferred — see Manual
   verification. `checkStandardHeadings` did NOT need the same fix: it
   compares the structured `content.sections[].heading` array (always
   exact-case from `t()`), never the raw extracted text.
6. **`POST /cv/ats-check`'s `template` body param, for `classic`,
   reuses a new `renderPdfBuffer` export added to `createPDF.ts`** (same
   render as `createCV`, minus the disk write and HTTP response) rather
   than duplicating Puppeteer boilerplate a third time. This is additive
   only — `createCV`'s own behavior/output is byte-identical to before;
   confirmed via `git diff staging -- src/services/createPDF.ts` showing
   only the 1-line `formatDate` fix plus the new function appended after
   `createCV`, nothing inside `createCV` itself changed beyond that one
   line.
7. **No disk persistence by default** for the ATS export path
   (`PERSIST_EXPORTED_PDF` env flag gates it, matching
   pdf-export-standard.md rule 10 and the pre-existing
   `unauthenticated-static-serve` trap in `doctrine/domains/PROJECT.md`)
   — the classic template's existing disk-write behavior (`createCV`)
   was left completely untouched, per the original prompt's explicit
   non-goal ("Do not change the classic template's look").

## Files changed (`git diff staging --stat`)
```
 CLAUDE.md                                          |   3 +-
 TODO.md                                            |   2 +
 package-lock.json                                  | 120 ++++++++++++++++++++-
 package.json                                       |   6 +-
 src/__tests__/services/createPDF.test.ts           |  88 +++++++++++++++
 src/candidate_me/index.ts                          |   9 ++
 src/locales/en.ts                                  |  13 +++
 src/locales/vi.ts                                  |  13 +++
 src/routers/api/v1/index.ts                        |  10 ++
 src/services/createPDF.ts                          |  28 ++++-
 14 files changed, 303 insertions(+), 5 deletions(-)
```
(stat above excludes `agent-hub/*` doctrine files, tracked separately per
the hub's own "don't diff agent-hub in the session" convention, and the
brand-new untracked files below, which `--stat` on a diff doesn't show
until staged — confirmed separately via `git status --short`.)

New files (untracked, confirmed via `git status --short`):
`agent-hub/doctrine/standards/pdf-export-standard.md`,
`src/__tests__/services/atsChecks.test.ts`,
`src/__tests__/services/atsPdfIntegration.test.ts`,
`src/__tests__/services/createPDF.ats.test.ts`,
`src/__tests__/services/keywordMatcher.test.ts`,
`src/candidate_me/ats-check.ts`,
`src/constant/atsKeywords.ts`,
`src/routers/api/v1/cv.route.ts`,
`src/services/atsChecks.ts`,
`src/services/atsExtract.ts`,
`src/services/createPDF.ats.ts`,
`src/services/keywordMatcher.ts`,
`src/services/pdfMetadata.ts`.

## pdf-export-standard.md compliance (self-check, per the standard's own "Enforcement" section)
1. No `letter-spacing` on real text — confirmed via
   `createPDF.ats.test.ts`'s `not.toMatch(/letter-spacing:\s*\.?\d/)`
   assertion on the real rendered HTML for both `en`/`vi`; `createPDF.ts`
   itself untouched (still has `letter-spacing` — that's the pre-existing
   classic template, explicitly out of scope per the non-goal above).
2. No un-awaited network font — ATS template uses a local system stack
   only (no `<link>` to any font CDN, confirmed via
   `not.toContain('fonts.googleapis.com')` in the same test), and still
   awaits `document.fonts.ready` defensively in `createCVAts`/
   `renderAtsPdfBuffer` before `page.pdf()`.
3. i18n-driven labels — confirmed by the `lang=vi`/`lang=en` parameterized
   test asserting `<html lang="${lang}">` and the correct localized
   headings for each.
4. Zero-padded `MM/YYYY` — `formatMonthYear` in `createPDF.ats.ts` uses
   `.padStart(2,'0')`; classic template's own bug fixed the same way;
   both covered by regression tests including September specifically.
5. Per-item skills/stack lines render when present — `buildSkillsSection`/
   `buildExperienceSection`'s "Stack: ..." line, test-covered.
6. Sanitized free-text — `xss`-based `sanitizeDescription`, test-covered
   (`<script>` stripped in both the unit and integration fixtures).
7. No DOB/gender/marital/photo — not in `AggregatedCandidateData` at all,
   and `checkNoForbiddenFields` would catch a regression if one were ever
   added; test-covered.
8. Single-column, real structure — `createPDF.ats.test.ts` asserts no
   `display: flex|grid`, no `float`, no `position: absolute`, no
   `<table`, no `<img`. Does NOT apply to the classic template (rule 8's
   own carve-out — classic never claims ATS-safety), confirmed classic's
   CSS (`.d-flex`, `background-color`) was left untouched.
9. Real PDF metadata via `pdf-lib` — `applyPdfMetadata`, exercised by the
   real-Puppeteer integration test's `checkMetadata` pass.
10. No PII in on-disk paths by default — `PERSIST_EXPORTED_PDF` gate,
    `res.send(buffer)` is the default path with no disk write.

## Manual verification (ad-hoc scripts, not committed — scratchpad only)
- `xss` sanitization verified via `node -e` against `<script>`,
  `<img onerror>`, `onclick` on `<a>`, and a `javascript:` href — all
  neutralized, disallowed-tag text content preserved (e.g. a stray
  `<div>` is unwrapped, not deleted, matching allow-list "discard tag,
  keep text" semantics).
- Fixture candidate rendered end-to-end (real Puppeteer + real
  `pdf-parse`) for both `lang=en` and `lang=vi`:
  - `en`: 767 characters extracted, 1 page, all 10 checks pass, score
    100/100. Sample JD keyword match: `matched: [docker, node.js,
    typescript]`, `missing: [aws, vitest, vue]`, coverage 50%.
  - `vi`: 392 characters extracted, 1 page, all 10 checks pass, score
    100/100. Vietnamese diacritics round-tripped correctly through
    Puppeteer → `pdf-parse` (`Kỹ sư Backend cấp cao`, `Thành phố Hồ Chí
    Minh`, `Dẫn dắt đội ngũ API`, `Đại học Bách Khoa` all intact in the
    extracted text).
  - Extracted text's own headings print in Chromium-rendered uppercase
    (`SUMMARY`, `SKILLS`, `EXPERIENCE`, ...) — this is what surfaced
    deviation #5 above.

## Test run (verbatim)
```
npm test
...
Test Suites: 35 passed, 35 total
Tests:       235 passed, 235 total
Snapshots:   0 total
Time:        17.691 s, estimated 18 s
Ran all test suites.
```
(31 suites / 181 tests pre-existing baseline on `staging` + 4 new suites
— `createPDF.ats.test.ts`, `atsChecks.test.ts`, `keywordMatcher.test.ts`,
`atsPdfIntegration.test.ts` — covering 54 new tests, plus 4 new regression
tests added to the existing `createPDF.test.ts`, netting 235 total.)

```
npm run build
> tsc && npm run copy
> cp -R ./src/views ./src/public ./dist/
```
Clean, no errors.

## Lint (not a real CI gate per `doctrine/MEMORY.md`, run anyway)
`npx eslint` on every new/changed `src/` file: 57 problems total, broken
down by rule — all in two already-known, already-tracked pre-existing
categories, confirmed by file+rule breakdown (not just a bare count):
- `@typescript-eslint/no-unsafe-*` (29 in `candidate_me/index.ts`
  pre-existing from `JSON.parse(JSON.stringify(document))`'s inferred
  `any`, explicitly flagged as a separate follow-up in
  `type-candidate-modules`/#183's own evidence note; 5 in the new
  `ats-check.ts` from `req.body` access, the exact same pattern as every
  other controller in the codebase — spot-checked `auth.controller.ts`,
  which alone has 19 of these on `staging`, unmodified by this node).
- `@typescript-eslint/no-misused-promises` (13 pre-existing in
  `routers/api/v1/index.ts`, 1 new in `cv.route.ts` — the known Express
  async-route-handler false positive already split out to issue #205 by
  `fix-remaining-any-unsafe-missed-files`/#204's evidence note; not this
  node's scope).
- `@typescript-eslint/no-unused-expressions` (9 pre-existing in
  `createPDF.ts`, the classic template's `x && (_result += x)` style,
  untouched by the 1-line `formatDate` fix).

One real lint issue WAS found and fixed during implementation: an
`@typescript-eslint/no-unnecessary-type-assertion` on `lang as
SupportedLang` in `candidate_me/index.ts` (the ternary already infers
`'en' | 'vi'`, identical to `SupportedLang`) — removed the cast, which
then left the `SupportedLang` type import unused, also removed.

## Scope confirmed
`git status --short` shows no changes outside the files listed above;
no commit/push has happened yet (`/todo` invoked without `--ship`).
`pdf-parse@1.1.4`/`pdf-lib`/`xss` are the new runtime deps,
`@types/pdf-parse`/`@types/sanitize-html` the new dev deps — except
`sanitize-html`/`@types/sanitize-html`, which were installed and then
uninstalled again in the same session when swapped for `xss` (never
committed; `@types/sanitize-html` was removed alongside it, so only
`@types/pdf-parse` remains as a new dev dep, matching `pdf-parse@1.1.4`'s
v1 API).
