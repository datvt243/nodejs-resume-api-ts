# 2026-10-02 — enable-exact-optional-property-types (implementer note)

- Worker: implementer (main session)
- Node: `enable-exact-optional-property-types`
- GitHub issue: #189 — "type-safety: enable exactOptionalPropertyTypes", part of tracking issue #177 (this was the LAST phase of the whole tracking issue, by design — highest ripple risk, saved for last)
- Branch: `189-exact-optional-property-types` (from `staging`, fresh)

## Pre-flight

Re-measured on this branch: `npx tsc --noEmit --exactOptionalPropertyTypes`
→ 6 errors across 5 files, matching the tracking issue's original audit
exactly (no drift from sibling phases, since none are merged yet).

## Result: the ripple risk did NOT materialize

The issue's own text flagged this flag as "tends to surface more as fixes
ripple through optional-property-heavy Mongoose/DTO/Joi shapes" and asked
to "budget real follow-up time beyond the initial 6". After fixing all 6,
re-running `npx tsc --noEmit` (the full, unrestricted compile, flag now
live in `tsconfig.json`) came back clean on the first try — zero
additional errors surfaced. No follow-up round was needed.

## What changed, per site — every `x?: T` → `x?: T | undefined` called out explicitly, per the issue's own requirement

1. **`__tests__/config/cors.config.test.ts`**'s `loadWith(env: {
   CORS_ORIGIN?: string; NODE_ENV?: string })` → `CORS_ORIGIN?: string |
   undefined`. Two tests deliberately call `loadWith({ CORS_ORIGIN:
   undefined, ... })` to simulate the env var being unset — a real,
   intentional test input, not an accidental omission. Widened the type
   to say what the tests already do.

2. **`__tests__/middlewares/rateLimit.test.ts`**'s `makeReq()` — the mock
   object's inferred shape carries an explicit `user: {id:string} |
   undefined` once `user` is always present as a key (whether or not the
   caller passed a value), which no longer "sufficiently overlaps"
   `Request` for a direct `as Request` cast. Fixed via `as unknown as
   Request` — TypeScript's OWN suggested fix for this exact error
   message, and consistent with this test file's existing style for
   other fake-request mocks.

3. **`services/index.ts`**'s `baseProp` interface (consumed by
   `BaseController.ts`'s `baseGetAll`) — `lang?: string`, `page?: number`,
   `limit?: number`, `sort?: string` → each widened to `| undefined`.
   `BaseController.ts`'s call site passes every one of these as `cond ?
   realValue : undefined` (e.g. `page: page !== undefined ?
   parseInt(page, 10) : undefined`) — a real, intentional "no value
   given" state for optional pagination/sort query params, not
   accidental. `tsc` only reported `page` specifically (TS stops at the
   first incompatible property in some cases), so all 4 siblings
   following the identical pattern were widened together rather than
   waiting for 3 more individual error reports.

4. **`services/index.ts`**'s `baseUpdateDocument`'s `userID?: string` →
   `userID?: string | undefined`. `BaseService.ts`'s `handlerUpdate(item,
   userID?, lang)` forwards its own optional `userID` param straight
   through to `baseUpdateDocument({..., userID, ...})` — when a caller
   omits `userID`, that local variable really is `undefined`, carried
   through as a shorthand property.

5. **`services/createDocx.ts`**'s `new Paragraph({ text: line, bullet:
   section.heading ? {level:0} : undefined })` — `IParagraphOptions` is
   a **third-party type from the `docx` package**, not something this
   codebase can widen. Fixed differently from the others: instead of
   passing `bullet: undefined` explicitly, the key is now OMITTED
   entirely via conditional spread (`{ text: line, ...(section.heading ?
   { bullet: { level: 0 } } : {}) }`) — matches the construct's own
   semantics ("no bullet" should mean "no `bullet` key", not "`bullet`
   key present with value `undefined`") and requires no changes to any
   type this codebase owns.

## Explicitly not touched

- Nothing scoped out — all 6 sites were fixed, and the predicted
  follow-up ripple never materialized (confirmed by a clean full
  `tsc --noEmit`, not just the flag in isolation).

## Verification run

```
npx tsc --noEmit --exactOptionalPropertyTypes
```
0 errors (confirmed before adding the flag to `tsconfig.json`).

```
npx tsc --noEmit
```
Clean, 0 errors — full compile, flag now enabled, zero additional
fallout beyond the original 6.

```
npm test
```
```
Test Suites: 31 passed, 31 total
Tests:       181 passed, 181 total
Snapshots:   0 total
Time:        12.618 s
```
Matches this session's consistent baseline. Checked `jest.setup.ts`
again deliberately (per the `doctrine/MEMORY.md` lesson from
`enable-no-property-access-index-signature`/#187) — no optional-property
shapes in that file at all, nothing to fix.

```
npm run build
```
Clean.

## Diff scope

```
git diff staging --stat -- src/ tsconfig.json
```
```
 src/__tests__/config/cors.config.test.ts    |  6 +++++-
 src/__tests__/middlewares/rateLimit.test.ts |  7 ++++++-
 src/services/createDocx.ts                  |  6 +++++-
 src/services/index.ts                       | 20 +++++++++++++++-----
 tsconfig.json                               |  1 +
 5 files changed, 32 insertions(+), 8 deletions(-)
```
Exactly the 5 files the 6 original errors pointed at, plus the 1-line
`tsconfig.json` addition. Smallest possible diff for the requirement.

## This was the last phase of tracking issue #177

All 12 phases (#178–#189) are now individually implemented and
independently verifier-SEALED (each on its own branch, none merged yet).
`tsconfig.json`'s `compilerOptions` across all 12 branches, once merged
in sequence, will read:
```
"strict": true,
"noFallthroughCasesInSwitch": true,
"noImplicitOverride": true,
"noUncheckedIndexedAccess": true,
"noPropertyAccessFromIndexSignature": true,
"noUnusedLocals": true,
"noUnusedParameters": true,
"exactOptionalPropertyTypes": true,
```
(ESLint's own type-aware config from #178 sits alongside, not inside,
`tsconfig.json`.) Shipping (merging each branch to `staging`, then
`staging` to `main` via `/release`) was explicitly out of scope for every
phase in this tracking issue — each evidence note has said so — and
remains the operator's own call once they review the full set.

## Status
`sealed_pending_verifier`
