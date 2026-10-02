# 2026-10-02 — enable-no-property-access-index-signature (implementer note)

- Worker: implementer (main session)
- Node: `enable-no-property-access-index-signature`
- GitHub issue: #187 — "type-safety: enable noPropertyAccessFromIndexSignature", part of tracking issue #177
- Branch: `187-no-property-access-index-sig` (from `staging`, fresh)

## Pre-flight

Re-measured on this branch before touching anything: `npx tsc --noEmit
--noPropertyAccessFromIndexSignature` → 66 errors across 26 files,
matching the tracking issue's original audit.

## What changed

Purely mechanical: every flagged `obj.prop` → `obj['prop']` (or
`obj?.prop` → `obj?.['prop']`), one site at a time, each individually
confirmed against the exact file/line/property the compiler named — no
blind find-and-replace across a file for a property name that might
appear in an unrelated, non-flagged context.

Grouped by pattern (not by file, since the same 2 patterns account for
most of the 66):

1. **`req.params.collection = Collections.X`** (20 sites across 8 route
   files: `application`/`award`/`certificate`/`education`/`experience`/
   `profile`/`project`/`reference`.route.ts) — identical 3-line
   middleware block repeated once per CRUD route file, writing a fixed
   collection name onto `req.params` (typed `ParamsDictionary =
   {[key: string]: string}`) before handing off to the shared
   `baseDelete`/`baseRestore`/etc. handlers.
2. **`process.env.X`** (18 sites across 7 files: `alias.ts`, `server.ts`,
   `config/process.config.ts`, `middlewares/rateLimit.middleware.ts`,
   `services/createPDF.ts`, plus 2 test files) — `process.env`'s index
   signature triggers this for every named env var access.
3. **Everything else** (28 sites, one-off per file): `req.query.X`
   (`auth.controller.ts`'s `token`, `candidate_me/index.ts`'s `lang`/
   `profile`/`format`), destructured `Record<string, any>`/
   `Record<string, unknown>` payload fields (`candidate.service.ts`'s
   `item._id`/`value._id`, `services/index.ts`'s `document._id`/
   `.candidateId`, `generalInformation.service.ts`'s `document.candidateId`,
   `candidate_me/index.ts`'s `item.description`, `createPDF.ts`'s
   `RECORD.generalInformation`), a few test-mock fakes (`BaseService.test.ts`,
   `requestLogger.test.ts`, `baseUpdatePatchSoftDelete.test.ts`), and
   `plugins/joi/index.ts`'s `opts.required` / `utils/i18n.ts`'s
   `locales[lang].joiErrors`.

**Lesson applied mid-fix, recorded in `doctrine/MEMORY.md`**: after
`tsc --noEmit` went clean, `npm test` immediately failed ALL 31 suites —
`jest.setup.ts` (project root, OUTSIDE `src/`, so never in `tsc`'s own
`include` scope) sets 7 env vars via dot notation, and `ts-jest` type-checks
it too via `jest.config.ts`'s `setupFiles`. Fixed all 7 lines in
`jest.setup.ts` the same way as everywhere else. Documented this gap in
`doctrine/MEMORY.md` (new note under "The exact commands") so the
remaining 2 compiler-flag phases (`#188`, `#189`) don't repeat it —
`tsc --noEmit` clean is necessary but not sufficient; `npm test` must
also be run before declaring a flag change verified.

Added `"noPropertyAccessFromIndexSignature": true` to `tsconfig.json`
only after every site was already fixed and `tsc --noEmit
--noPropertyAccessFromIndexSignature` (the flag in isolation) showed 0
errors — same order of operations as `enable-strict-flags-low-cost`/#186.

## Explicitly not touched

- Nothing scoped out — this flag's error set was fully resolved, no site
  left for a follow-up.
- `src/plugins/joi/index.ts` — touched for its 1 flagged site
  (`opts.required` → `opts['required']`) despite being slated for deletion
  in `type-joi-validation-layer`/#184 (unmerged on this branch, forked
  independently from `staging`) — from this branch's own perspective the
  file is live and must pass the new flag; the fix becomes moot once #184
  merges and removes the file, but doing it keeps THIS branch internally
  consistent in the meantime.

## Verification run

```
npx tsc --noEmit --noPropertyAccessFromIndexSignature
```
0 errors (confirmed before adding the flag to `tsconfig.json`).

```
npx tsc --noEmit
```
Clean, 0 errors (full compile, flag now enabled in `tsconfig.json`).

```
npm test
```
First run: **31/31 suites FAILED** — `jest.setup.ts` errors aborted
every suite (the gap described above). After fixing `jest.setup.ts`:
```
Test Suites: 31 passed, 31 total
Tests:       181 passed, 181 total
Snapshots:   0 total
Time:        12.668 s
```
Matches this session's consistent baseline — confirms the mechanical
bracket-notation conversion changed zero runtime behavior (every fix is
`obj.prop` → `obj['prop']` reading/writing the exact same property,
nothing else).

```
npm run build
```
Clean.

## Diff scope

```
git diff staging --stat -- src/ tsconfig.json jest.setup.ts
```
28 files changed, 70 insertions(+), 69 deletions(-) — every single
changed line is one of the two patterns above or the 1-line `tsconfig.json`
addition. No file touched for any reason other than this flag's own
fallout.

## Status
`sealed_pending_verifier`
