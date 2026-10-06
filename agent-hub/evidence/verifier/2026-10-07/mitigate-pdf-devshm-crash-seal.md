# 2026-10-07 — mitigate-pdf-devshm-crash — SEAL

Worker: verifier
Version: 0.1.0
Node: `mitigate-pdf-devshm-crash` (`haven/diagrams/dev-loop.prime-mermaid.md`)
Verdict: **SEAL**

## Isolation proof
Dispatched fresh via the Agent tool with the full verifier worker bundle
(manifest + SOUL + verify_seal recipe) embedded in the prompt, and no
prior implementation conversation history — this session never wrote any
part of the diff under review. `NeverVerifyOwnWork` holds by
construction.

## Re-run
`partial` — per the recipe's own escalation for this node (touches
`createPDF.ts`/`createPDF.ats.ts`, gated by `pdf-export-standard.md`'s
Enforcement section), independently re-ran:
- `npx jest src/__tests__/services/createPDF.test.ts src/__tests__/services/createPDF.ats.test.ts` (2 suites / 33 tests, all pass)
- full `npm test` from scratch (35/35 suites, 254/254 tests)
- `npm run build` (clean)
- `npx eslint 'src/**/*.ts' --format json` on the current tree (276 total, parsed rule-by-rule) AND on a `git stash`-reverted tree limited to the 4 touched `src/` files (273 total) — diffed every rule myself
- `npm run lint` (doctrine-exact command) to confirm it matches the note's `npx eslint 'src/**/*.ts'` result (both 276)
- direct `git diff --stat` / `git diff` read of both production files (not just the note's prose)
- direct read of both files' `finally`/`logger.error` blocks
- grep + direct read of `render.yaml`/`Dockerfile`/`.github/workflows/deploy.yml` to independently check the cause-(1) "unconfirmable from repo" claim

Did not re-run the real-Puppeteer `atsPdfIntegration.test.ts` in isolation
beyond what the full `npm test` run already covers (it's in the 254/254,
confirmed passing).

## Reasoning (per acceptance criterion)

**Fix the runtime so Chromium launches (cause #2).**
`git diff --stat -- src/services/createPDF.ts src/services/createPDF.ats.ts`
= exactly 2 files (6(+)/3(-) and 2(+)/2(-)). Read both diffs in full:
`--disable-dev-shm-usage` appended to the `args` array at all 3 real
`puppeteer.launch()` call sites (`createCV`, `renderPdfBuffer` in
`createPDF.ts`; `renderAtsPdfBuffer` in `createPDF.ats.ts`, which
`createCVAts` calls internally — confirmed by reading `createCVAts`'s
body, it has no `puppeteer.launch` of its own). One added WHY comment in
`createCV`. Nothing else changed in either file. 3 new tests
(`createPDF.test.ts`: "createCV passes --disable-dev-shm-usage...",
"renderPdfBuffer passes --disable-dev-shm-usage..."; `createPDF.ats.test.ts`:
"renderAtsPdfBuffer passes --disable-dev-shm-usage...") all pass, and all
3 assert the exact flag via `expect.arrayContaining([...])`.

**pdf-export-standard.md "not applicable" claim.** Read the full diff
directly: it is launch-args (process-level Puppeteer flags) plus one
comment — zero lines touch HTML/CSS generation, `description`
sanitization, `formatDate`, skill-list rendering, forbidden-field
exclusion, single-column layout, or `applyPdfMetadata`. None of rules
1-10 are implicated; the note's characterization holds.

**"Secondary problems" (hidden error, browser leak) already fixed.**
Read `src/services/createPDF.ts` and `src/services/createPDF.ats.ts` in
full. `createCV` (lines ~86-96) and `renderPdfBuffer` (lines ~114-124)
both have `finally { await browser?.close().catch(() => undefined); }`
(or non-optional `browser.close()` where `browser` can't be undefined at
that point) and `logger.error('[createCV] PDF generation failed', {
error: (error as Error).message, stack: (error as Error).stack })` — the
real `Error.message`/`stack`, never the raw object. `renderAtsPdfBuffer`
(lines 403-428) has the same `finally`-close; `createCVAts` (lines
437-479) has the same `logger.error(... (error as Error).message ...)`
pattern in its own catch. Matches the note's claim exactly, and the 254
passing tests include the named `describe` blocks
(`createCV failure handling (issue #225)`,
`renderPdfBuffer failure handling (issue #225)`,
`ATS PDF failure handling (issue #225)`).

**No behavior change for working environments.** `npm run build` clean.
Full `npm test`: 35/35 suites, 254/254 tests (251 pre-existing baseline +
3 new, independently reproduced from a clean run, not just trusted from
the note). The real-Puppeteer `atsPdfIntegration.test.ts` is part of that
254 and passed, meaning a real local Chromium launch still succeeds with
the new flag live.

**Lint delta (independently re-measured, not just trusted).** Current
tree: 276 total (`unbound-method` 55). `git stash push -u -m
"verifier-temp-baseline-check" -- src/services/createPDF.ts
src/services/createPDF.ats.ts src/__tests__/services/createPDF.test.ts
src/__tests__/services/createPDF.ats.test.ts` (tree then clean except the
diagram file + the untracked evidence note, both outside `src/`): 273
total (`unbound-method` 52). Parsed both JSON outputs rule-by-rule in a
scratch Node script — every rule except `unbound-method` is byte-for-byte
identical between the two runs; `unbound-method` is the only rule that
moved, +3. `git stash pop` restored the working tree exactly (verified via
`git status --short` before/after). Pinpointed the 3 new hits by file:line
(`createPDF.test.ts:214`, `createPDF.test.ats.test.ts:239`, and one more
at `createPDF.test.ts:224` — read all 3 directly: each is
`expect(puppeteer.launch).toHaveBeenCalledWith(...)` inside the 3 new
tests, the identical `unbound-method` pattern as the 2 pre-existing,
untouched hits at `createPDF.test.ts:193` and `:202` (same lines in both
before/after runs, confirming they're pre-existing, not shifted). Also
ran `npm run lint` (the literal doctrine-exact command from
`doctrine/MEMORY.md`, vs. the note's `npx eslint 'src/**/*.ts'
--format json`) and got the identical 276 total — the note's command
choice is a benign, functionally-equivalent deviation (the flat config's
only `files`-matching block is `src/**/*.ts` anyway, confirmed by reading
`eslint.config.mjs`), not a doctrine violation.

**Cause #1 (Render runtime) genuinely unconfirmable from this repo.**
Grepped and read: no `render.yaml`/Blueprint spec anywhere in the repo;
`.github/workflows/deploy.yml` only `curl`s a Render deploy-hook URL
(`https://api.render.com/deploy/srv-...`) after a plain `npm install &&
npm run build` on the GitHub Actions runner — it never tells Render
which runtime (Docker vs. native Node) to use at deploy time, so it
settles nothing about the production runtime. A `Dockerfile` exists in
the repo, but whether Render's *service configuration* actually uses it
is a Render-dashboard fact, not a repo fact. No file found that resolves
this — the note's "asked the operator, can't check right now" framing is
accurate, not a dodge.

**Proportionality.** Diff is launch-args + 1 comment + 3 tests — nothing
beyond the scoped cause (2) and the already-fixed-elsewhere confirmation.
`--single-process` was not added, matching the note's own stated
reasoning for leaving it out.

## Forbidden-state scan
- `ADHOC_WORK` — node exists on `dev-loop.prime-mermaid.md` (was PENDING
  prior to this SEAL). Not triggered.
- `NO_EVIDENCE` — implementer note exists, covers every acceptance row
  with checkable evidence. Not triggered.
- `EDIT_UNVERIFIED` — every claim independently re-run (tests, build,
  lint before/after, direct diff reads) rather than taken on the note's
  word alone. Not triggered.
- `CODE_IN_HAVEN` — no code/script written under `haven/` by this
  verifier pass. Not triggered.
- `DIAGRAM_DRIFT` — PM status updated in place on this SEAL, matching the
  real verified state of the code. Not triggered.

## Aside (not blocking this SEAL)
`doctrine/MEMORY.md`'s lint section still states "Current baseline on
staging: 360 ESLint problems" (dated 2026-10-06) — this is now stale:
the prior node `fix-no-misused-promises-false-positives`/#205 (SEALED
2026-10-07, same diagram) already dropped the real baseline to 273,
which this verifier pass independently reproduced. Worth a follow-up
doctrine correction, but it's a documentation staleness in a different
node's wake, not a defect in this node's own diff or evidence.

## Seal gate
Not outward-facing (no commit/push on this branch) — correctly left as
"not applicable" by the implementer note; this verifier pass made no
commit/push either.
