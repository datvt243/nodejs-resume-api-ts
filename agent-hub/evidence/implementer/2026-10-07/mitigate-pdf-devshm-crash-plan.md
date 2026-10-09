# 2026-10-07 — mitigate-pdf-devshm-crash

Worker: implementer
Version: 0.1.0
Node: `mitigate-pdf-devshm-crash` (`haven/diagrams/dev-loop.prime-mermaid.md`)
Task (verbatim via `/todo #225`): download-pdf returns 500 on production
for both classic and ATS templates (Puppeteer fails; real error
swallowed). On production, both `GET /api/v1/download-pdf` (classic) and
`?template=ats` return 500 after ~1.8s; `?format=docx` works fine with
the same token. Likely cause (unverified, need Render logs): (1) Render
service runs the native Node runtime, not this repo's Dockerfile, so
`/usr/bin/chromium` doesn't exist; (2) Chromium crashes on launch in the
free tier's 512MB memory limit — `--disable-dev-shm-usage`/
`--single-process` could help. Secondary problems in `createPDF.ts`: the
real error is hidden (`error: error` serializes to `{}`); `browser` leaks
on failure (`close()` only on the success path, should be `finally`). To
do: check Render logs/runtime, fix the runtime so Chromium launches, log
the real error + close the browser in `finally`.

## Hub bytes before: 217870

## Scoping (ambiguous-root-cause case — asked the operator before coding)
Cause (1) requires Render's dashboard/service-settings or logs to
confirm which runtime is actually configured — no repo file states this
(`README.md`'s only Render mention is the deploy-trigger note in the
"Build Notes"-equivalent section; no `render.yaml`/Blueprint spec in the
repo to infer it from). I have no Render credentials/dashboard access.
Asked the operator directly (`AskUserQuestion`) whether they know the
Render runtime; answer: "Not sure / can't check right now." Per
`pick_next`'s "task is ambiguous → stop and ask, don't guess" — asked
first, then scoped this node to only the part answerable without that
confirmation: cause (2), which the issue itself names as a concrete,
implementable, zero-risk mitigation. Cause (1) is NOT fixed here and
stays explicitly open on the diagram row (not silently dropped) —
closing the GitHub issue itself is left to the operator/a follow-up node
once the runtime is confirmed, not done by this node.

## Investigation — secondary problems already fixed
Before touching anything, read `src/services/createPDF.ts` and
`src/services/createPDF.ats.ts` in full to confirm the issue's
"secondary problems" checklist item:
```
grep -n "finally\|logger.error\|browser?.close\|browser.close" src/services/createPDF.ts
grep -n "finally\|logger.error\|browser?.close\|browser.close\|catch" src/services/createPDF.ats.ts
```
Both already have `logger.error('[createCV] PDF generation failed', {
error: (error as Error).message, stack: ... })` (not the raw `Error`
object) and `finally { await browser?.close().catch(() => undefined); }`
in every Puppeteer-launching function (`createCV`, `renderPdfBuffer` in
`createPDF.ts`; `renderAtsPdfBuffer` in `createPDF.ats.ts`, whose
`finally`-close covers `createCVAts` too since it calls
`renderAtsPdfBuffer` internally). `src/__tests__/services/createPDF.test.ts`
already has passing `describe('createCV failure handling (issue #225)')`
/ `describe('renderPdfBuffer failure handling (issue #225)')` blocks, and
`createPDF.ats.test.ts` has `describe('ATS PDF failure handling (issue
#225)')` — all passing already, confirmed by running the full suite (see
Output). This part of #225 was already done in an earlier, untracked
session (before this diagram's own history) — not re-implemented here,
only confirmed via direct code read, not assumed from the issue text.

## Diff
| File | Why |
|---|---|
| `src/services/createPDF.ts` | `createCV` and `renderPdfBuffer`'s `puppeteer.launch({...args})` — added `'--disable-dev-shm-usage'` to the existing `['--no-sandbox', '--disable-setuid-sandbox']` array (both call sites), with a short comment explaining why. |
| `src/services/createPDF.ats.ts` | `renderAtsPdfBuffer`'s `puppeteer.launch({...args})` — same flag added (covers `createCVAts` too, which calls this function). |
| `src/__tests__/services/createPDF.test.ts` | New `describe('Puppeteer launch args (issue #225 — Render free-tier /dev/shm crash)')`: 2 tests confirming `createCV`/`renderPdfBuffer` both pass `--disable-dev-shm-usage` alongside the existing 2 flags. |
| `src/__tests__/services/createPDF.ats.test.ts` | 1 new test in the existing `describe('ATS PDF failure handling (issue #225)')` block confirming `renderAtsPdfBuffer` passes the same flag (only the launch-args contract is asserted; the downstream `applyPdfMetadata` step is swallowed via `.catch()` since it needs a real pdf-lib-parseable buffer, out of scope for this assertion — the real end-to-end render is already covered by `atsPdfIntegration.test.ts`'s real-Puppeteer test). |

`--single-process` (the issue's other suggestion) deliberately NOT
added: it's a known source of instability on some Linux kernels/Chromium
versions (can crash multi-tab/multi-context usage) and is less
universally recommended than `--disable-dev-shm-usage` — a judgment
call, named here rather than silently adding both flags from the issue
text without evaluating each.

Not applicable to `pdf-export-standard.md`'s 10 invariants: this diff
only changes Puppeteer launch arguments (process-level flags), not any
of the content-generation, styling, sanitization, date-formatting, or
metadata code paths those rules govern — none of rules 1-10 implicated.

## Command
```
npm run build
```
```
npm test
```
```
npx eslint 'src/**/*.ts' --format json
```

## Output
`npm run build`:
```
> resume-nodejs-api@1.11.0 build
> tsc && npm run copy

> resume-nodejs-api@1.11.0 copy
> cp -R ./src/views ./src/public ./dist/
```
Clean, exit 0.

`npm test`:
```
Test Suites: 35 passed, 35 total
Tests:       254 passed, 254 total
Snapshots:   0 total
Time:        6.396 s, estimated 7 s
Ran all test suites.
```
Exit 0 (confirmed separately). 254 = the 251-test baseline (post-#205
merge) + 3 new tests. The real-Puppeteer `atsPdfIntegration.test.ts`
integration test (renders an actual PDF, not mocked) passed with the new
`--disable-dev-shm-usage` flag live in its launch call — confirms the
flag doesn't break a real local Chromium launch.

`npx eslint 'src/**/*.ts' --format json` (parsed): 276 total problems, up
from the 273 baseline captured right before this node (immediately after
#205's merge into `staging`). Rule-by-rule diff against that baseline
shows exactly one rule moved: `@typescript-eslint/unbound-method` 52→55
(+3) — all 3 are `expect(puppeteer.launch).toHaveBeenCalledWith(...)` in
my 3 new tests, the exact same pattern as 2 pre-existing, already-unfixed
occurrences in `createPDF.test.ts` itself (lines 193/202, present before
this diff) — a known, accepted TS-ESLint false-positive-ish pattern for
asserting on a `jest.fn()`-typed mock property, not a new category of
problem and not something #225 should take on (that's the same kind of
project-wide type-safety debt #204/#205 already named as separately
tracked, out of scope here). Every other rule's count is byte-for-byte
identical to the 273 baseline.

## Acceptance
| Criterion | Evidence |
|---|---|
| Fix the runtime so Chromium launches (cause #2: free-tier memory crash) | `--disable-dev-shm-usage` added to all 3 real `puppeteer.launch()` call sites (`git diff --stat -- src/services` = exactly 2 files, 2 lines each); 3 new tests assert the flag is present; the real-Puppeteer integration test passed with it live. |
| Confirm/fix cause #1 (Render runtime) | NOT fixable from this session — explicitly asked the operator (`AskUserQuestion`), answer was "can't check right now." Documented as an open item on the diagram row, not silently resolved or guessed at. |
| Log the real error; close the browser in `finally` | Already done in a prior session — confirmed via direct `grep`/read of both `createPDF.ts` and `createPDF.ats.ts`, not re-implemented; existing passing tests (`createCV failure handling (issue #225)`, `renderPdfBuffer failure handling (issue #225)`, `ATS PDF failure handling (issue #225)`) independently confirm this via the full `npm test` run above. |
| No behavior change for working environments | `npm run build` clean; `npm test` 254/254 (251 baseline + 3 new, 0 regressions); the real-Puppeteer integration test (not mocked) passed with the new flag, confirming local/CI Chromium still launches correctly with it added. |

## Noticed, not done
- Cause #1 (Render runtime confirmation) remains open — needs the
  operator to check Render's dashboard/service settings or logs. This
  node deliberately does NOT close GitHub issue #225; it stays open
  pending that confirmation (or a follow-up node once confirmed).
- 3 new `unbound-method` lint hits — not fixed, matches 2 pre-existing
  unfixed occurrences of the identical pattern in the same file; tracked
  as the same class of pre-existing type-safety debt as #204/#205,
  deliberately out of scope for a production-bug-fix node.

## Seal gate
Not outward-facing yet (no commit/push) — `/todo #225` invoked without
`--ship`. Diff shown in full to the operator in-session before writing
this note.
