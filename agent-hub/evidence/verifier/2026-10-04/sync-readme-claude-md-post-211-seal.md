# 2026-10-04 — sync-readme-claude-md-post-211 (verifier verdict: SEAL)

## Isolation proof
Spawned fresh via the Agent tool with only this task description, no prior
conversation, no memory of the implementer session that produced this work.

## What was checked
Read `agent-hub/evidence/implementer/2026-10-04/sync-readme-claude-md-post-211-plan.md`
in full (primary source), the node's row on
`agent-hub/haven/diagrams/dev-loop.prime-mermaid.md` (was PENDING), and
`gh issue view 212` for the issue's own scope — both match the note's
characterization of the work.

## Re-run
Docs-only node — no `npm test`/`npm run build` re-run is meaningful here
and none was done. My "re-run" is independently re-deriving every factual
claim in the note via fresh `grep`/`find`/`Read` calls against the real
repo state, not trusting the note's own table:

- `git diff --stat -- src/ package.json package-lock.json` → only the
  8-file pre-existing `add-ats-pdf-export` diff, nothing newly touched by
  this pass.
- `git diff --stat -- README.md CLAUDE.md` → exactly 2 files,
  31 insertions/15 deletions (CLAUDE.md), 15/6 (README.md) — matches
  `SmallestDiff`.
- `grep -n '"version"' package.json` → `1.9.0`, matches both docs.
- `grep -nE '"(pdf-lib|pdf-parse|xss|sanitize-html|pdfkit)"' package.json`
  → `pdf-lib: ^1.17.1`, `pdf-parse: ^1.1.4`, `xss: ^1.0.15`, `pdfkit: ^0.15.0`
  present; `sanitize-html` absent — matches both docs' table rows.
- `find src/__tests__ -name "*.test.ts" | wc -l` → 34, plus the
  non-`.test.ts` `database/mongo.db.ts` row already in both docs' tables
  → 35 total, matches both docs' "35 files"/"test count 31→35" claims.
- The 4 named new test files (`atsChecks.test.ts`, `atsPdfIntegration.test.ts`,
  `createPDF.ats.test.ts`, `keywordMatcher.test.ts`) all exist under
  `src/__tests__/services/`.
- All 8 claimed new source files exist at the claimed paths
  (`src/services/createPDF.ats.ts`, `pdfMetadata.ts`, `atsExtract.ts`,
  `atsChecks.ts`, `keywordMatcher.ts`, `src/candidate_me/ats-check.ts`,
  `src/routers/api/v1/cv.route.ts`, `src/constant/atsKeywords.ts`).
- Read `src/candidate_me/index.ts` directly: `req.query['template'] === 'ats'`
  branch calls `createCVAts`, falls through to classic `createCV` otherwise
  — confirms the doc's "`?template=classic|ats`, default classic" claim.
- Read `src/routers/api/v1/index.ts` + `cv.route.ts` directly:
  `router.use('/cv', verifyToken, routeCv)` + `router.post('/ats-check', fnAtsCheck)`
  → full path `/api/v1/cv/ats-check`, behind `verifyToken` (Bearer/cookie) —
  confirms the doc's claim exactly.
- Read `src/services/createPDF.ats.ts` directly: single-column HTML,
  `letter-spacing: normal` (no numeric letter-spacing anywhere),
  `filterXSS`-based `sanitizeDescription()` — confirms the README/CLAUDE.md
  prose describing the ATS template, not just the note's table.
- Read `src/services/atsChecks.ts`: exactly 10 exported `checkXxx`
  functions plus `scoreChecks` — matches "10 ATS-safety checks" in both
  docs.
- Read `src/services/keywordMatcher.ts`: vue/vuejs/vue.js alias handling
  present, confirms README/CLAUDE.md's keyword-matcher description.
- `grep -rln "pdfkit" src --include="*.ts"` → no matches — confirms the
  note's disclosed pre-existing inaccuracy (PDFKit listed as a dep but
  unused), correctly named and correctly left out of scope rather than
  silently expanded or silently left stale.
- Read the full `git diff -- README.md CLAUDE.md` line by line — every
  added line checked against the real code above; nothing speculative,
  nothing unverifiable, nothing wrong.

## Proportion (SmallestDiff)
Exactly 2 files touched by this pass (`README.md`, `CLAUDE.md`). No `src/`
file modified in this pass. No unrelated fixes smuggled in — the one
pre-existing inaccuracy found (PDFKit unused) was disclosed, not silently
fixed or silently ignored, consistent with `initiative-scoping.md`.

## Forbidden states
- `ADHOC_WORK`: no — node pre-existed on the diagram (PENDING), proper
  worker identity.
- `NO_EVIDENCE`: no — implementer note cites every check with commands run.
- `EDIT_UNVERIFIED`: no — no test/build claim is made (docs-only, correctly
  scoped); every doc claim re-derived by me from real code/config.
- `CODE_IN_HAVEN`: no — no runnable code touched under `haven/`.
- `DIAGRAM_DRIFT`: no — diagram row now flipped PENDING → SEALED in place,
  matching the completed work.

## Verdict
**SEAL.** Every line added to `README.md` and `CLAUDE.md` in this pass is
factually accurate and independently confirmed against the real code and
`package.json`, not just plausible-sounding. Diagram row updated in place.
