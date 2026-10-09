# 2026-10-09 — add-cv-pdf-parse-endpoint (seal)

Worker: verifier (subagent, dispatched via Agent tool)
Node: `add-cv-pdf-parse-endpoint` (`haven/diagrams/dev-loop.prime-mermaid.md`)
New PM status: SEALED

## Isolation proof
Fresh Agent spawn with description "Verify add-cv-pdf-parse-endpoint seal" and a dispatch prompt containing the verifier bundle verbatim; no memory of the implementation session. Did not write any line of this diff; no `src/` file modified by this pass (`git status --short` identical before/after).

## Reasoning
Read both implementer notes, the node row, `agent-hub/CLAUDE.md`, `doctrine/MEMORY.md`, `standards/code-comments.md`, and the real `git diff -- src/` + the 4 untracked `src/` files. Note's diff table matches reality (9 tracked files modified + 4 new `src/` files + new evidence dir).

| Criterion | Evidence |
|---|---|
| `POST /api/v1/candidate/parse-cv-pdf`, verifyToken, multipart `file` | `candidate.route.ts`: `router.post('/parse-cv-pdf', uploadCvPdfParseMiddleware, fnParseCvPdf)`; middleware `.single('file')`; `/candidate` router mounted behind verifyToken (note cites `routers/api/v1/index.ts:26`) |
| PDF only, <= 5MB, memory storage, nothing persisted | middleware: `multer.memoryStorage()`, `limits.fileSize: CV_MAX_FILE_SIZE`, mime AND `.pdf` ext filter; service/controller have no DB/fs calls (read directly). Tests: `uploadCvPdfParse.test.ts` 3 real-multipart tests (note) — all within verifier's `Test Suites: 37 passed` |
| Reuses `extractPdfText`, no new dependency | service imports `@/services/atsExtract`; `package.json` not in `git status` |
| vi + en heading/date heuristics | `SECTION_HEADINGS` vi+en lists, `PRESENT` incl. `hiện tại`/`đến nay`; `parseCvPdf.service.test.ts` 9 tests (note) |
| Same shape + `extractedText` | types imported from `parseLinkedInExport.service.ts`; round-trip asserts exact objects |
| 400 missing / non-PDF / >5MB / unreadable; 200 + empty arrays | controller tests (4) + middleware tests (3) + `INVALID_PDF` on garbage buffer + empty-arrays test |
| Round-trip ATS render -> parse (vi + en) | verifier run: `✓ round-trips the en ATS PDF ... (3312 ms)`, `✓ round-trips the vi ATS PDF ... (3459 ms)` |
| `npm test` | Implementer: 4 of 5 final-tree runs `Tests: 272 passed, 272 total`, 1 run failed (existing ATS test 30010 ms timeout, load ~19), disclosed verbatim. Verifier re-run (load 6.77): `Test Suites: 37 passed, 37 total` / `Tests: 272 passed, 272 total` / `Time: 20.604 s`; first ATS test `3529 ms`. Judged load-induced: the new renders run serially AFTER that test in the same file, so they cannot extend its own clock; baseline-vs-final at normal load both well under timeout |
| Typecheck (`npm run build`) | implementer `BUILD_EXIT=0`; verifier re-run `BUILD_EXIT=0`, ends with `cp -R ./src/views ./src/public ./dist/` |
| Lint (no new problems) | implementer per-rule json diff `lint before 276 after 276`, no DELTA; verifier `npx eslint` on `parseCvPdf.service.ts`, `uploadCvPdfParse.middleware.ts`, `candidate.route.ts` → no output (clean) |
| comments per code-comments.md | Read every added comment: WHY-only (`SECTION_HEADINGS` whole-line rationale, `DATE` lookaround rationale, `parseDate` local-clock rationale, `toExperience` default-order note) or JSDoc on exported/public pieces + `@swagger`. No `(#N)` refs in new production files (`grep "#[0-9]"` over the 4 new files → no match). Controller JSDoc-inside-body matches sibling `fnGetVisits` style. `@author/@see` header matches siblings (opt-in OFF, not a violation). Pre-existing `(issue #141)` describe name untouched |
| pdf-export-standard.md | N/A — no `createPDF*`/`createDocx` change; only a test consumes `renderAtsPdfBuffer` |

Forbidden states: ADHOC_WORK — no (node on diagram, implementer identity). NO_EVIDENCE — no (plan + diff notes). EDIT_UNVERIFIED — no (test/build/lint cited verbatim, re-confirmed). CODE_IN_HAVEN — no (only the diagram `.md` changed in `haven/`). DIAGRAM_DRIFT — no (row updated in place here).
Seal gate: no commit/push/external call by implementer or verifier.
Proportion: diff is the endpoint + middleware + service + i18n keys + tests + docs rows; nothing beyond the node.

## Re-run
partial — ran `npm test` once and `npm run build` once (plus eslint on the 3 new/changed production files) because the note disclosed a failed `npm test` run on the final tree and the node adds a new API surface; wanted an independent clean run before sealing. Full lint json baseline diff not re-run (implementer's per-rule comparison trusted).
