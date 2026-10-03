# 2026-10-03 — fix-remaining-any-unsafe-missed-files (implementer note)

- Worker: implementer (main session)
- Node: `fix-remaining-any-unsafe-missed-files`
- GitHub issue: #204 — follow-up to tracking issue #177, found while the
  operator reviewed the merged 12-phase result and noticed real `any`
  still present.
- Branch: `204-fix-remaining-any-unsafe` (from `staging`, fresh, after
  all 12 #177 phases + the README/CLAUDE.md sync merged)

## Why this was missed by #177's own 12 phases (operator asked directly)

Checked every phase's own evidence note: **only Phase 1 (`setup-eslint-typescript`/#178) ever ran a full `npm run lint`** (the 1424-problem
baseline). Phases 2–12 verified exclusively with `npx tsc --noEmit`/
`npm test`/`npm run build` — none of which catch `@typescript-eslint/no-explicit-any`
(the TypeScript compiler itself allows `any` by design; only ESLint's
rule flags it). The file-by-file scoping for the `any`-removal phases
(#179/#180/#181/#182/#183/#184/#185) was done by hand-picking the
highest-concentration files via targeted grep, not by enumerating every
file with real `any` first. The 4 compiler-flag phases (#186–#189) are
blind to `any` entirely — `any` opts a value out of every strict check,
so `noUncheckedIndexedAccess`/`exactOptionalPropertyTypes`/etc. have zero
effect on `any`-typed code. No phase ever re-ran the full `npm run lint`
after the `any`-removal phases to confirm the count had actually reached
the policy's own stated goal before moving on to compiler flags.

## Scope correction during this node (operator-approved)

The initial count ("9 files, 72 problems") was ALSO wrong — it came from
a manual grep for literal `any`/`Record<string, any>`/`any[]` patterns,
which misses `@typescript-eslint/no-unsafe-*` violations that cascade
from an `any`-typed value even on lines with no literal "any" keyword.
A full `npm run lint` on unmodified `staging` (captured before touching
anything) found **346 non-test-file problems across 53 files**. Breaking
that down by rule revealed `no-misused-promises` (85 hits) is a
**separate, unrelated** ESLint config gap — a well-known false-positive
pattern where `@typescript-eslint/no-misused-promises` flags every
`async (req, res) => {...}` Express route handler ("Promise returned in
function argument where a void return was expected"), nothing to do
with `any`. Split out to its own issue, #205 (not fixed here).

Presented the operator with 3 scope options; **chose to keep this node's
scope exactly as originally promised**: the real `@typescript-eslint/
no-explicit-any` violations (24, confirmed via `npx eslint` not grep)
and their directly-cascading `no-unsafe-*` siblings in the same 9 files.
The remaining Joi-`.validate()`-cascade unsafe-* in other files (not
these 9) and `no-misused-promises` are explicitly NOT this node's scope.

## What changed, per file

1. **`candidate/candidate.service.ts`**: `CV_SECTION_MODELS`/
   `IMAGE_SECTION_MODELS: any[]` → `Model<CrudDocument>[]` with a narrow
   per-entry `as unknown as Model<CrudDocument>` cast — the exact
   Mongoose `Model<T>` invariance pattern `type-crud-core`/#181 already
   established (no concrete model is assignable to a fixed, differently-
   parameterized `Model<CrudDocument>` slot without one). `handlerUpdate(item:
   Record<string, any>)` → `Record<string, unknown>`, with `item['_id']`
   narrowed via `typeof item['_id'] === 'string' ? item['_id'] :
   undefined` before use (same not-found fallback behavior preserved:
   an invalid/missing `_id` still routes to the existing not-found
   branch). `.flatMap((doc: any) => doc.images || [])` → no annotation
   needed at all once `IMAGE_SECTION_MODELS` is properly typed (`doc.images`
   is already `string[] | undefined` via `CrudDocument`).

2. **`types/base.type.ts`** (shared `BaseReturn` interface):
   `errors?: any` → `errors?: AppErrorDetails` (reusing
   `type-joi-validation-layer`/#184's own union type instead of a
   second, parallel one). `data?: Record<string, any>[] | Record<string, any>
   | null` → `data?: unknown` — NOT `Record<string, unknown>[] | ... |
   null`: tried that first, `tsc` correctly rejected it everywhere a raw
   hydrated Mongoose document is assigned (`candidate.controller.ts`,
   `generalInformation.controller.ts`, `services/index.ts` itself) since
   a concrete Mongoose document type has no string index signature and
   isn't structurally assignable to `Record<string, unknown>` — same
   class of invariance issue as `Model<T>`. `data` is genuinely
   heterogeneous across every `BaseReturn` producer (CRUD results, PDF
   file metadata, visit lists, aggregated candidate records); `unknown`
   is the honest type, same discipline `type-candidate-modules`/#183
   already used for an analogous irreducibly-loose boundary.

3. **`middlewares/errors.middleware.ts`**: deleted a dead, drifted
   duplicate of `BaseReturn`/`Collections` (confirmed zero importers via
   grep — every real caller imports both from `@/types/base.type`; this
   copy's `Collections` enum was even missing 2 members, `APPLICATION`/
   `PROFILE`, confirming it was stale and unmaintained, not a parallel
   definition anything relied on).

4. **`services/index.ts`** (not one of the 9 named files, touched only
   as a direct consequence of #2 above): `baseDeleteDocument`/
   `baseRestoreDocument`'s `error = null; ...catch(err){error = err}`
   assigned a raw caught `unknown` value straight into `errors`, which
   no longer type-checks against `AppErrorDetails`. Fixed by stringifying
   at the catch site (`err instanceof Error ? err.message : String(err)`)
   — matches the established `handleError`/#185 pattern, no behavior
   change (same message ends up in the response either way, just via an
   explicit, typed conversion instead of an implicit one).

5. **`candidate_profile/profile/profile.service.ts`**: `idsOf = async
   (model: any) => (...).map((doc: any) => doc._id)` → `Model<CrudDocument>`
   parameter, same cast pattern as #1, applied at each of the 6 call
   sites (`idsOf(MODELS.Education as unknown as Model<CrudDocument>)`,
   etc.) — fixed all 23 ESLint problems in this file (confirming most
   were unsafe-* cascading from these 2 `any` sites, not independent
   issues).

6. **`utils/jwt.ts`**: `jwtSign(data: Record<string, any>, ...)` →
   `Record<string, unknown>`. `props: { expiresIn: string; [key: string]:
   any }` → `{ expiresIn: string }` — the index signature was dead
   generality; grepped every real caller (4, across `auth.controller.ts`/
   `auth.service.ts`) and confirmed none ever pass anything beyond
   `expiresIn`.

7. **`middlewares/verifyToken.middleware.ts`**: `catch (err: any)` with
   duck-typed `err?.name === 'TokenExpiredError'` → `catch (err)` with
   real `instanceof jwt.TokenExpiredError || instanceof
   jwt.JsonWebTokenError` checks (jsonwebtoken's own exported classes,
   imported directly — same upgrade pattern `type-pdf-docx-export`/#185
   applied to Mongoose's own error classes in `utils/helper.ts`).
   Separately, `req.body.candidateId = _id` triggered `no-unsafe-member-access`
   (Express's `Request.body` is `any` by design) — fixed with one
   narrow, commented cast (`(req.body as Record<string, unknown>)['candidateId']
   = _id`), justified since this is the one call site establishing that
   key's presence for every downstream handler.

8. **`scripts/migrate-localize-text-fields.ts`** (one-off migration
   script, confirmed via its own doc comment and `npm run
   migrate:localize-text`'s dedicated script entry — not part of the
   live request path): `TARGETS`'s `model: any` and
   `migrateField(model: any, ...)` → `Model<CrudDocument>`, same cast
   pattern as #1/#5 — `CrudDocument`'s own fields are irrelevant here
   (this script only calls `.updateMany()` with raw field-name strings),
   it's just the minimal real `Model<T>` already available to reuse
   instead of inventing a one-off local interface for a migration
   script.

9. **`utils/i18n.ts`**: `locales: Record<SupportedLang, Record<string, any>>`
   → `Record<string, unknown>`; `getNested`'s `.reduce<any>(...)`
   rewritten to `.reduce<unknown>(...)` with one narrow, commented cast
   per recursion step (`typeof acc === 'object'` narrows to `object`,
   which itself has no index signature, so reading the next nested level
   needs a cast — same pattern `candidate_me/index.ts` already uses for
   its own arbitrary-depth dynamic field lookup) plus a final `typeof
   result === 'string'` narrow before returning. `tErrorType` rewritten
   the same way (extracted a small `lookup()` helper to avoid
   duplicating the narrow-and-check logic twice). Verified via
   `npx jest src/__tests__/utils/i18n.test.ts` standalone — 8/8 passing,
   confirming no behavior change despite the real rewrite.

10. **`utils/querySafe.ts`**: 4 `Record<string, any>` → `Record<string,
    unknown>` across `safeQuery`'s params/locals/return type. Surfaced 2
    now-genuinely-unnecessary `key as string` assertions (removed —
    `Object.entries()`'s key is already `string`, these were leftover
    from before whatever earlier change made them redundant).

## Explicitly not touched (and why)

- `no-misused-promises` (85 hits, Express async-handler false positive)
  — separate issue, #205, an ESLint config fix not an `any` fix.
- The Joi-`.validate()`-cascade `no-unsafe-*` problems in OTHER files
  (routers, validate.ts files, auth.controller.ts, BaseController.ts,
  candidate_me/index.ts, createPDF.ts, etc. — the bulk of the remaining
  262 non-test problems) — not part of this node's named 9-file scope,
  per the operator's explicit scope decision this session.
- `services/index.ts`'s 2 leftover problems (`no-redundant-type-constituents`
  on `hookAfterSave`'s `Promise<unknown> | unknown` return type,
  `no-floating-promises` at line 359) — pre-existing, unrelated to `any`,
  not part of this node's scope; the file was only touched here for the
  2 directly-necessitated `error = err` fixes.
- `jwtVerify`'s existing `as { _id: string }` assertion in `utils/jwt.ts`
  — not `any`, a different (narrow, pre-existing, already-justified)
  assertion category, out of this node's scope.

## Verification run

```
npx tsc --noEmit
```
Clean, 0 errors.

```
npm test
```
```
Test Suites: 31 passed, 31 total
Tests:       181 passed, 181 total
```
Same baseline as every #177 phase — no test needed updating, confirming
no behavior change anywhere.

```
npm run build
```
Clean.

```
npm run lint
```
Before (unmodified `staging`, captured first): **438 total problems**
(346 excluding test files). After this node's fixes: **354 total**
(262 excluding test files) — **84 fixed**, more than the 72 originally
estimated (grep missed several unsafe-* cascades the fix also cleared
as a side effect, e.g. `services/index.ts`'s 4 destructuring-unsafe
problems that disappeared once `BaseReturn.data` became real).

```
npx eslint 'src/**/*.ts' --format json  # filtered to no-explicit-any, excluding __tests__
```
**Zero** `no-explicit-any` hits remain outside test files — the
headline goal (no real `any` in production `src/`) is now actually
true, not just claimed.

Each of the 9 target files individually confirmed 0 ESLint problems via
`npx eslint <file>`.

Diff scanned for any newly-introduced `any`, `!`, `@ts-ignore`/
`@ts-nocheck` — none found (`git diff staging -- src/ | grep '^+' | grep
-E '@ts-ignore|@ts-nocheck|: any\b'` empty; same check for non-null
assertions, empty).

## Diff scope

```
git diff staging --stat -- src/
```
```
 src/candidate/candidate.service.ts                | 47 +++++++++++++++---------
 src/candidate_profile/profile/profile.service.ts | 20 ++++++----
 src/middlewares/errors.middleware.ts             | 18 ---------
 src/middlewares/verifyToken.middleware.ts        | 15 ++++++--
 src/scripts/migrate-localize-text-fields.ts      | 28 +++++++++-----
 src/services/index.ts                            |  8 ++--
 src/types/base.type.ts                           | 13 ++++++-
 src/utils/i18n.ts                                | 20 ++++++++--
 src/utils/jwt.ts                                 |  6 ++-
 src/utils/querySafe.ts                           |  8 ++--
 10 files changed, 111 insertions(+), 72 deletions(-)
```
9 named target files + `services/index.ts` (directly necessitated by
the `types/base.type.ts` fix, documented above, not scope creep).

## Status
`sealed_pending_verifier`
