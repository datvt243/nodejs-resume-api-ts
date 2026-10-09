# 2026-10-09 — add-cv-pdf-parse-endpoint (diff)

Worker: implementer
Version: 0.1.0
Node: `add-cv-pdf-parse-endpoint` (`haven/diagrams/dev-loop.prime-mermaid.md`)
Task: `/todo #234` — GitHub issue #234 "PDF CV parsing endpoint for CV data import (PDF half of #141)". Plan: `evidence/implementer/2026-10-09/add-cv-pdf-parse-endpoint-plan.md`.
Branch: `234-pdf-cv-parsing` (base `staging` @ `eee9cb0`). Status: sealed_pending_verifier.

## Hub bytes before: 224469

## Diff
`git diff --stat` (with new files, `git add -N`): 12 files, 752(+)/7(-).

| File | Why |
|---|---|
| `src/candidate/parseCvPdf.service.ts` (new) | `parseCvText(text)` pure heuristic: NFC-normalize lines → split sections on whole-line vi/en headings (`education`/`experience`/`other` lists; `other` only ends a section) → per section, one entry per line containing a date range (`MM/YYYY`, `MM-YYYY`, `Mon YYYY`, `YYYY`; end may be `present/current/now/hiện tại/đến nay/nay`; separators `- – — ~ to đến`) or a bare single-date line → title = rest of that line, else previous line, else (dates-first layout, detected when the section opens with a bare date line) next line → title split on ` — `/` – `/` | `/` - `/` at `/` tại `/`, ` → experience defaults "Position — Company", education "Major — School", swapped when only the first half matches a company/school hint regex. Dates → local-time month start (`new Date(y, m-1, 1)`), same clock as the ATS template's `formatMonthYear`. Entries with empty company/school dropped (same filter as LinkedIn parser). `parseCvPdf(buffer)` wraps `extractPdfText`, maps any extraction failure to `Error('INVALID_PDF')`, returns `{ educations, experiences, extractedText }`. Reuses `ParsedEducation`/`ParsedExperience` types from `parseLinkedInExport.service.ts` (exact same shape). |
| `src/middlewares/uploadCvPdfParse.middleware.ts` (new) | Multer `memoryStorage`, `.single('file')`, `CV_MAX_FILE_SIZE` (5MB, imported from `uploadCV.middleware.ts`), PDF mimetype + `.pdf` extension filter; errors → 400 via `formatReturn` + `cvPdfImport.*` i18n. Mirrors `uploadLinkedInExport.middleware.ts`. |
| `src/candidate/candidate.controller.ts` | `fnParseCvPdf`: no file → 400 `noFileUploaded`; `INVALID_PDF` → 400 `invalidPdf`; other errors → `handleError` (500 via global handler); success → 200 `data`. Mirrors `fnParseLinkedInExport`. |
| `src/routers/api/v1/candidate.route.ts` | `router.post('/parse-cv-pdf', uploadCvPdfParseMiddleware, fnParseCvPdf)` + `@swagger` block. Router already behind `verifyToken` (`routers/api/v1/index.ts:26` `router.use('/candidate', verifyToken, routeCandidate)`). |
| `src/locales/{en,vi}.ts` | New `cvPdfImport` block (6 keys each, same keys in both). |
| `src/__tests__/candidate/parseCvPdf.service.test.ts` (new) | 9 tests: en ATS-layout text, vi headings + `Hiện tại`/`đến nay`, NFD-decomposed heading, same-line title+dates + month names + company-first swap, dates-first layout, heading-word-in-sentence not a heading, year inside phone number ignored, empty/no-sections → empty arrays, garbage buffer → rejects `INVALID_PDF`. |
| `src/__tests__/services/atsPdfIntegration.test.ts` | +2 tests (`it.each(['en','vi'])`): render the existing fixture via `renderAtsPdfBuffer`, `parseCvPdf` it, assert exact experiences (company/position/dates/isCurrent, reverse-chronological as rendered), description text, exact education. Placed here, not in a new file: first attempt had the round-trip in `parseCvPdf.service.test.ts`, which made a second jest worker launch Chromium in parallel; the full suite then went 24s → 42-62s and the existing first ATS test timed out once at 30s. This file's own header says it is the one suite that runs a real browser — moved there so renders run serially. |
| `src/__tests__/middlewares/uploadCvPdfParse.test.ts` (new) | 3 tests over a real multipart HTTP request (ephemeral Express app + Node fetch/FormData): accepted PDF kept in memory (`path: null`, buffer present), non-PDF → 400 `Only PDF files are accepted`, 5MB+1 byte → 400 `File exceeds the allowed size (5 MB)`. |
| `src/__tests__/candidate/candidate.controller.test.ts` | +4 `fnParseCvPdf` tests: no file 400, success passthrough, `INVALID_PDF` → 400 (vi message), unexpected error → `next` with 500. |
| `CLAUDE.md`, `README.md` | Endpoint row, project-structure entries, test-table rows, README feature bullet + test count 35 → 37. |

Investigation before coding: rendered the ATS fixture (en + vi) with a temporary jest probe under `src/__probe__/` (deleted right after, `ls src | grep probe` empty) to read real `pdf-parse` output: uppercase heading line, `Title — Org` line, `MM/YYYY – end` line, description lines.

## Command
From repo root, per `doctrine/MEMORY.md`:
- `npm test`
- `npm run build`
- `npm run lint` (as `npm run lint -- --format json -o …`, compared rule-by-rule with a pre-diff baseline taken the same way before any `src/` edit)

## Output
Final `npm test` (after moving the round-trip), run 2 of 2:
```
Test Suites: 37 passed, 37 total
Tests:       272 passed, 272 total
Time:        28.852 s, estimated 87 s
    ✓ renders a real PDF whose extracted text passes the full ATS check suite (4493 ms)
    ✓ reports keyword coverage against a sample job description (5371 ms)
    ✓ round-trips the en ATS PDF through the PDF CV import parser (6518 ms)
    ✓ round-trips the vi ATS PDF through the PDF CV import parser (6030 ms)
PASS src/__tests__/candidate/parseCvPdf.service.test.ts (5.822 s)
PASS src/__tests__/middlewares/uploadCvPdfParse.test.ts (6.151 s)
PASS src/__tests__/candidate/candidate.controller.test.ts
PASS src/__tests__/services/atsPdfIntegration.test.ts (28.52 s)
```
Three further `npm test` runs on the final tree:
```
✓ renders a real PDF ... (9231 ms)  Tests: 272 passed, 272 total  Time: 35.693 s
✓ renders a real PDF ... (5520 ms)  Tests: 272 passed, 272 total  Time: 51.156 s
✓ renders a real PDF ... (27296 ms) Tests: 272 passed, 272 total  Time: 81.026 s
```
Run 1 of 2 on the final tree FAILED (verbatim):
```
    ✕ renders a real PDF whose extracted text passes the full ATS check suite (30010 ms)
Test Suites: 1 failed, 36 passed, 37 total
Tests:       1 failed, 271 passed, 272 total
Time:        87.385 s
```
Baseline (`git stash push -u`, clean `staging` tree), 3 runs:
```
✓ renders a real PDF ... (5894 ms) Tests: 254 passed, 254 total Time: 17.572 s
✓ renders a real PDF ... (5303 ms) Tests: 254 passed, 254 total Time: 16.296 s
✓ renders a real PDF ... (8821 ms) Tests: 254 passed, 254 total Time: 24.098 s
```
Machine state during these runs (`uptime`): `load averages: 19.12 17.94 14.03`, unrelated desktop apps running, no leftover test Chromium processes.

`npm run build`: `BUILD_EXIT=0`, ends with
```
> resume-nodejs-api@1.11.1 copy
> cp -R ./src/views ./src/public ./dist/
```
Lint:
```
lint before 276 after 276
__tests__/candidate/parseCvPdf.service.test.ts 0
__tests__/middlewares/uploadCvPdfParse.test.ts 0
__tests__/services/atsPdfIntegration.test.ts 0
candidate/parseCvPdf.service.ts 0
middlewares/uploadCvPdfParse.middleware.ts 0
```
(no `DELTA` lines → every rule count identical before/after.)

## Acceptance
| Criterion | Evidence |
|---|---|
| `POST /api/v1/candidate/parse-cv-pdf`, verifyToken, multipart | route line in `candidate.route.ts`; `/candidate` mounted with `verifyToken` at `routers/api/v1/index.ts:26` |
| PDF only, ≤ 5MB, memory storage, nothing persisted | `uploadCvPdfParse.test.ts`: `keeps an accepted PDF in memory only (no disk path)`, `rejects a non-PDF file with 400`, `rejects a PDF over 5 MB with 400` all ✓; service/controller have no DB/fs calls |
| Reuses `extractPdfText`, no new dependency | `parseCvPdf.service.ts` imports `@/services/atsExtract`; `package.json` untouched |
| vi + en section/date heuristics | `parseCvPdf.service.test.ts` 9/9 ✓ (see Diff row) |
| Same `{educations, experiences}` shape + `extractedText` | types imported from `parseLinkedInExport.service.ts`; controller test `returns the parsed educations/experiences plus extractedText on success` ✓; round-trip asserts exact objects |
| 400 missing / non-PDF / > 5MB / unreadable | controller tests (`returns 400 when no file was uploaded`, `returns 400 invalidPdf ...`) + middleware tests ✓; real garbage buffer → `INVALID_PDF` ✓ |
| 200 + empty arrays when nothing recognized | `returns empty arrays (not an error) when no sections are recognized` ✓ |
| Round-trip ATS render → parse | `round-trips the en/vi ATS PDF through the PDF CV import parser` ✓ (6518 ms / 6030 ms) |
| Full suite / build / lint | `Tests: 272 passed, 272 total` (4 of 5 final-tree runs; see flake row in Noticed), `BUILD_EXIT=0`, `lint before 276 after 276` |
| comments per code-comments.md | New comments are WHY-only or JSDoc on exported/public pieces: service file-overview JSDoc (stateless contract + accuracy limits), `SECTION_HEADINGS` (why whole-line match), `DATE` lookarounds (why), `parseDate` (local clock for round-trip), `extractEntries` (title/description rule), `toExperience` default-order note, middleware overview + wrapper JSDoc, controller contract JSDoc, test-file headers. No issue/PR refs in `src/` production comments (`grep -rn '#234\|issue #' src --include='*.ts'` filtered to the new/changed production files → no match, exit 1), no restating comments. File-header opt-in is OFF; new files still carry the same `@author`/`@see` block as their siblings to match surrounding code. |

## Noticed, not done
- `atsPdfIntegration.test.ts`'s first test failed once at its 30s timeout (30010 ms) on the final tree, and took 27296 ms in another run, while the load average was ~19. Clean baseline ran 5-9s across 3 runs, though at a possibly lower load. The diff adds no parallel browser and only appends 2 serial renders after that test, so it shouldn't slow that test's own clock — but I can't fully rule out a link from this sample. GitHub CI (`build (20.x)`/`build (22.x)`) on the PR is the cleaner signal. If it flakes there, a separate node should raise that suite's timeout or share one browser across its tests.
- Total suite time grows by ~12s (2 extra real renders), which is inherent to the issue's requested round-trip test.
- `src/candidate/candidate.controller.ts` has pre-existing lint errors (lines 42, 57, 110, 204, 206, 219 after this diff), none on the added `fnParseCvPdf` lines; per-rule totals unchanged.

## Seal gate
No outward-facing action taken (no commit/push). `src/` diff shown to the operator in the session.
