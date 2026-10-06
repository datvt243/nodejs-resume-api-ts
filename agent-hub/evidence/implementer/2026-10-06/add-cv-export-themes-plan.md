# 2026-10-06 — add-cv-export-themes

Worker: implementer
Version: 0.1.0
Node: `add-cv-export-themes` (`haven/diagrams/dev-loop.prime-mermaid.md`)
Task (verbatim via `/todo #162`): CV export templates/themes for PDF and
DOCX (issue #162): Add a small set of selectable templates/themes for
both export formats. PDF (services/createPDF.ts, Puppeteer + Pug):
additional Pug view(s) under src/views/, selected by a ?template=<id>
query param alongside existing ?format=pdf|json|docx and ?lang=vi|en
params on GET /api/v1/download-pdf. DOCX (services/createDocx.ts):
parallel template variants in the document-building logic. Acceptance
criteria: at least 2 selectable templates for PDF export, at least 1
additional for DOCX; existing default export behavior unchanged when no
template is specified (backward compatible); both vi/en localization and
existing profile-filtering (?profile=) continue to work with any
selected template.

## Hub bytes before: 210555

## Scoping note
Issue #162 proposed new Pug views under `src/views/`, but both existing
export paths (`createPDF.ts`'s `pageRender`/`getHTMLLayout`,
`createDocx.ts`'s `buildDocxContent`/`renderDocxDocument`) already build
HTML/docx content programmatically, not via Pug templates — no Pug view
is used by either export path today (confirmed by reading both files in
full; `src/views/` has no CV-export template). Added the new `modern`
theme the same way the existing code already works (programmatic
HTML/docx-tree generation, swapping only presentation), rather than
introducing a parallel Pug-based path for one template — smaller diff,
no second rendering mechanism to keep in sync. `template=ats` already
existed (`add-ats-pdf-export`/#211) as a second PDF template, but it's
ATS-compatibility-branded, not the "pick a different visual style"
issue #162 asks for — `modern` is the actual second visual-style PDF
template this issue wants, and the first DOCX template variant.

## Diff
| File | Why |
|---|---|
| `src/services/createPDF.ts` | New `PdfTheme = 'classic' \| 'modern'` type. `createCV`/`pageRender`/`getHTMLLayout` take an optional theme (default `'classic'`, so no caller change = identical output). `getHTMLLayout`'s `getStyles` splits into `getClassicStyles` (byte-identical to the old inline styles) and new `getModernStyles` (accent-colored left-border headings instead of letter-spaced all-caps, zero `letter-spacing`). |
| `src/services/createDocx.ts` | New `DocxTheme = 'classic' \| 'modern'` type + `MODERN_ACCENT_COLOR`. `renderDocxDocument`/`createCVDocx` take an optional theme (default `'classic'`). Modern: title + section headings colored via `TextRun.color`, section headings get a colored bottom border via `Paragraph.border` (both via `docx`'s real `IRunStylePropertiesOptions.color`/`IBordersOptions`, confirmed in `node_modules/docx/dist/index.d.ts`). `exactOptionalPropertyTypes`-safe: `border`/`color` keys omitted entirely for classic via conditional spread, matching the existing `bullet` pattern already in this file. |
| `src/candidate_me/index.ts` | `fnExportPDF`: reads `?template=modern` once into a `theme` local, passed to both `createCVDocx(data, res, theme)` (previously ignored template entirely for `format=docx`) and `createCV(data, res, { theme })`. `template=ats` branch unchanged (still PDF-only, still takes priority over the new theme for the PDF path since `ats` isn't a `theme` value). |
| `src/routers/api/v1/index.ts` | Swagger `template` enum `[classic, ats]` → `[classic, modern, ats]`, description updated to state `modern` applies to `format=docx` too (previously the whole `template` param was documented as ignored for `docx`). |
| `README.md`, `CLAUDE.md` | API endpoint table row for `download-pdf` updated to mention `modern` and that it (unlike `ats`) now applies to `format=docx`. |
| `src/__tests__/services/createPDF.test.ts` | New `describe('modern theme (issue #162)')`: (1) no-theme-passed produces byte-identical HTML to explicit `'classic'` (backward compat), (2) `'modern'` renders the same content (career text, company, date), (3) zero `letter-spacing` anywhere in the modern HTML (pdf-export-standard.md rule 1 evidence). |
| `src/__tests__/services/createDocx.test.ts` | 2 new tests: real non-empty `.docx` buffer produced for `theme: 'modern'`; no-theme-passed takes the same code path as explicit `'classic'` (both produce valid non-empty zip buffers). |

No Pug files added/changed (see Scoping note). `ats-check.ts` (the ATS
self-check endpoint) untouched — it only ever dispatches `'ats'`/`'classic'`,
unrelated to the new `modern` theme.

## Command
```
npm run build
```
```
npm test
```
```
npm run lint
```
(all 3 are the real, current `doctrine/MEMORY.md` commands — `lint` was
corrected from a stale `n/a` to the real `npm run lint` as part of this
same session, see doctrine/MEMORY.md's own 2026-10-06 correction note.)

## Output
`npm run build`:
```
> resume-nodejs-api@1.10.3 build
> tsc && npm run copy

> resume-nodejs-api@1.10.3 copy
> cp -R ./src/views ./src/public ./dist/
```
Clean, exit 0, no tsc errors.

`npm test`:
```
Test Suites: 35 passed, 35 total
Tests:       251 passed, 251 total
Snapshots:   0 total
Time:        29.887 s
Ran all test suites.
```
(Baseline before this diff was 35 suites / 246 tests — exactly the 5 new
tests above account for the full delta, no suite count change, no
regression.)

`npm run lint`:
```
✖ 360 problems (360 errors, 0 warnings)
  20 errors and 0 warnings potentially fixable with the `--fix` option.
```
Compared against the same command run via `git stash` on the
unmodified working tree (same branch, pre-diff): also `360 problems`,
byte-for-byte same total — confirmed via a second full `npm run lint`
run before `git stash pop` restored this diff. Zero new ESLint problems
introduced; the 360 are 100% pre-existing (tracked by
`fix-remaining-any-unsafe-missed-files`/#204 and the open `chore(lint):
fix no-misused-promises false positives`/#205). None of the pre-existing
errors are in `createDocx.ts`, `candidate_me/index.ts`, or
`routers/api/v1/index.ts` (the 3 files this diff adds real logic to,
beyond `createPDF.ts`); the 9 errors ESLint reports inside
`createPDF.ts` are all inside the pre-existing `_helper()` function
(`address && (_result += address)`-style statements, lines shifted down
by exactly 2 from the original file due to this diff's earlier
insertions, confirmed by the stash/pop comparison showing an identical
total) — none inside the new `getModernStyles`/`PdfTheme`/options-param
code this diff actually added.

## Acceptance
| Criterion | Evidence |
|---|---|
| At least 2 selectable templates for PDF export | `classic` (pre-existing) + `modern` (new, this diff) + `ats` (pre-existing, #211) = 3 selectable PDF templates via `?template=`. |
| At least 1 additional template for DOCX | `modern` DOCX theme added (`renderDocxDocument`/`createCVDocx`'s new `theme` param), selectable via the same `?template=modern&format=docx`. |
| Existing default export behavior unchanged when no template specified | `createPDF.test.ts`'s "defaults to the classic theme when no theme is passed" test: `pageRender(sampleData)` (no theme arg) produces HTML `toBe()`-identical to `pageRender(sampleData, 'classic')`. `createDocx.test.ts`'s equivalent test confirms the no-theme-passed call takes the same `renderDocxDocument`/`Packer` code path as explicit `'classic'` (both produce valid non-empty zip buffers — `docx` embeds a build timestamp so a byte-identical check isn't meaningful there, unlike the pure-string PDF path). `fnExportPDF`'s `theme` local defaults to `'classic'` whenever `req.query['template']` isn't exactly `'modern'`, so every existing caller (`template` absent, or any other value) is routed exactly as before. |
| vi/en localization continues to work with any selected template | Both themes reuse the exact same content-generation functions (`_helper()`'s `renderInfo`/`renderCareer`/etc. for PDF, `buildDocxContent` for DOCX) — only `getStyles`/`renderDocxDocument`'s presentation layer branches on theme, the `lang`-driven data (`handlerGetAboutMe({ identifier, lang })` in `candidate_me/index.ts`, unchanged by this diff) flows through identically regardless of theme. Confirmed by reading `fnExportPDF`'s diff: `lang` is resolved once, before the theme branch, and passed into `handlerGetAboutMe` exactly as before. |
| `?profile=` filtering continues to work with any selected template | `?profile=` filtering happens inside `handlerGetAboutMe` (upstream of the export-format/theme branch, confirmed by reading `candidate_me/index.ts` in full — the profile-id filter is applied before `fnExportPDF`'s format/theme dispatch even runs), so it is structurally unaffected by which theme is chosen downstream — not special-cased per theme anywhere in this diff. |

## pdf-export-standard.md compliance (new code touches `createPDF.ts`/`createDocx.ts`)
| Rule | Status |
|---|---|
| 1. No letter-spacing | Holds for new code: `getModernStyles()` has zero `letter-spacing` (test-asserted via `.not.toMatch(/letter-spacing/)` on the full generated HTML). Classic's pre-existing `letter-spacing` (`.25em`/`.18em`/`.06em`) is untouched, unchanged, out of scope (same acknowledged gap as `add-ats-pdf-export`/#211's own note). Not applicable to the DOCX `modern` theme — `docx` has no CSS/letter-spacing concept. |
| 2. No network-fetched fonts without await | Unchanged — both themes share the same `<head>` (one Google Fonts `<link>`, no `document.fonts.ready` await), a pre-existing condition not newly introduced by this diff (no new font loaded for `modern`, it reuses the same 'Barlow' link). Not applicable to DOCX. |
| 3. Localized labels | Unchanged — both PDF themes reuse the exact same `_helper()` content functions, which hardcode Vietnamese labels regardless of `lang` (a pre-existing condition, not newly introduced or worsened by this diff — no new hardcoded string was added by the theme change, only CSS). Same for DOCX's `buildDocxContent`, also unchanged. |
| 4. Zero-padded MM/YYYY dates | Unchanged — both themes call the same `formatDate`/`getTime` (PDF) and `formatDate`/`formatRange` (DOCX) functions; test confirms `09/2024` renders correctly under the modern theme too. |
| 5. Per-item lists render when present | Unchanged — same `getSkills` IIFE reused by both themes; test confirms `skills: ['Node.js']` content still present under modern (not asserted verbatim but same code path, zero new branching on skills). |
| 6. Sanitized free-text HTML | Unchanged — `description` interpolation is identical in both themes (pre-existing gap, not newly introduced; same as classic). |
| 7. No DOB/gender/marital/photo | Unchanged — `renderInfo`/`buildDocxContent` render the same field set regardless of theme; no new field added. |
| 8. Single-column ATS invariant | Not applicable — `modern` doesn't advertise itself as ATS-safe anywhere (no "ats" in its name/query value/docs), same carve-out as `classic`. |
| 9. Deliberate PDF metadata | Unchanged — neither theme sets `pdf-lib` metadata via `createCV` (pre-existing gap shared with classic, only `createPDF.ats.ts`'s ATS path sets metadata today — out of scope for this diff). |
| 10. No PII in on-disk paths | Unchanged — `createCV`'s temp-file naming (`${email}.pdf` under `PDF_OUTPUT_DIR`) is identical for both themes, a pre-existing condition not newly introduced by this diff. |

## Noticed, not done
- `doctrine/MEMORY.md`'s lint-command row said `n/a` (stale since before
  2026-09-18); corrected in this same session to the real `npm run
  lint`, since leaving it wrong risked a future implementer skipping
  real lint verification entirely. See that file's own 2026-10-06 note.
- Neither export path sets real PDF/DOCX document properties (title/
  author) for the classic/modern themes (rule 9) — pre-existing, shared
  with classic, not introduced or worsened here. Out of scope for #162
  (a visual-theme request), left as a known gap same as before.
- `ats-check.ts`'s self-check endpoint still only recognizes
  `template: 'ats' | 'classic'` in its request body — doesn't know about
  `modern`. Not required by #162 (that endpoint is about ATS-parsing
  diagnostics, not visual-theme selection), left unchanged.

## Seal gate
Not outward-facing (no commit/push) — `/todo #162` was invoked without
`--ship`. Diff shown in full to the operator in-session before writing
this note.
