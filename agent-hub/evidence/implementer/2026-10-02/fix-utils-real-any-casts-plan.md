# 2026-10-02 — fix-utils-real-any-casts (implementer note)

- Worker: implementer (main session)
- Node: `fix-utils-real-any-casts`
- GitHub issue: #180 — "type-safety: fix remaining real any/as-any in utils", part of tracking issue #177
- Branch: `180-fix-utils-any` (from `staging`, fresh — does NOT include `remove-req-as-any-casts`/#179's unmerged fix, so the unrelated `(req as any).lang` casts still present in `generalInformation.controller.ts` on this branch are #179's scope, not touched here)

## Lesson applied from the #179 REOPEN (see `doctrine/MEMORY.md`'s new "Multi-phase / multi-branch sessions" section)

Added this node's own PENDING row to the diagram FRESH on this branch,
immediately before implementing — not batched on `staging` beforehand —
to avoid the exact `ADHOC_WORK` mistake that REOPENED `remove-req-as-any-casts`.

## What changed, per named site

1. **`src/logger/index.ts`** — the file had MORE untyped surface than the
   original tracking-issue audit counted (it only flagged the one
   `(logger as any)[level](text)` dynamic-dispatch cast): `_log(props:
   any)` and `logRequest`'s `extra: Record<string, any>` were also `any`.
   Fixed all three together since they're the same small file: added
   `LogLevel`/`LogEntry`/`LogPayload` types, a `resolveLevel()` helper
   that narrows to the 3 real Winston methods ever called
   (`info`/`warn`/`error` — confirmed via `grep -rn "_log("` that no real
   call site ever passes `type: 'table'` or `'warn'`, only a bare string
   or `{text, type: 'error'}`; the array branch is also never exercised
   by any real caller, confirmed the same way, so `JSON.stringify`-ing
   non-string array items there is a safe, inert fallback for an
   unreached path, not a behavior change for any live code), replacing
   the dynamic `(logger as any)[level](text)` with a direct
   `logger[level](message)` call now that `level` is a real `LogLevel`.
   `Record<string, any>` → `Record<string, unknown>`. `(req as any).get`
   → `req.get` (same already-typed-via-`express.d.ts`/native-Express
   class as #179, left in scope here since it's in a file #180 already
   needed to touch for the `(logger as any)` fix).

2. **`src/utils/{tokenBlacklist,sessionRevocation,emailVerification,passwordReset}.ts`**
   — all 4 identical `if (typeof (_cleanup as any).unref === 'function')
   (_cleanup as any).unref();` sites. Confirmed (same reasoning the
   tracking issue's audit already flagged as likely) that `_cleanup =
   setInterval(...)` is Node's real `NodeJS.Timeout` (not DOM's `number`
   — this tsconfig's `types: ["jest", "node"]` has no `"dom"`, and
   `@types/node`'s `setInterval` overload is the one in effect), which
   always has a real `.unref()` method — no runtime guard was ever
   needed. Verified by just writing `_cleanup.unref();` and re-running
   `tsc --noEmit` clean before applying it to all 4 files identically.

3. **`src/utils/tokenBlacklist.ts`** (second site) — `jwt.decode(token)
   as any` → removed the cast; `jwt.decode()`'s real return type is
   `JwtPayload | string | null`, narrowed with `typeof decoded ===
   'object'` before reading `.exp` (a `string`-shaped decode result, or
   `null`, has no `.exp` — exactly what the narrowing now makes explicit
   instead of hiding behind `any`).

4. **`src/utils/helper-auth.ts`** — bigger than the tracking issue's
   single named line (`(req.query as any)[fieldName]`): BOTH exported
   functions took `req: any` as their PARAMETER type, not just that one
   cast. Retyped both to `req: Request` (matches the `Request` import
   already present), which also made the named `(req.query as
   any)[fieldName]` cast redundant on its own (`req.query` is `ParsedQs`,
   a real string-index-signature type) — removed it along with its
   duplicate on the following `String(...)` call.

5. **`src/candidate_me/index.ts`** — `(_me.data as any)?.isPublic` → the
   cast was fully redundant: `handlerGetAboutMe`'s success-branch return
   (`{success: true, data: dataResult, message}`) already has `data`
   typed `any` (inferred, since `dataResult = JSON.parse(JSON.stringify(document))`
   and `JSON.parse`'s return type is itself `any`) — confirmed by
   removing the cast and re-running `tsc --noEmit` clean. The underlying
   `any`-ness of `handlerGetAboutMe`'s return type is a real, separate gap
   (that function's return type isn't explicitly declared at all) — out
   of this issue's scope, belongs to `type-candidate-modules`/#183.

6. **`src/candidate_profile/general_information/generalInformation.controller.ts`**
   — `(_resultRaw as any).data` → attempting the same "just remove it,
   it's already `any`" fix as #5 revealed a REAL type error instead:
   `handlerGet`'s two possible return shapes (from `BaseService.ts`'s
   `createCrudService()`) are `{success, message, errors, data}` on the
   success path vs `{success, message, error}` (no `data` field, and
   `error` not `errors`) on its own internal catch path — and since
   neither shape's `success` field is a literal `true`/`false` type, the
   controller's own `if (!_resultRaw.success) return ...;` guard doesn't
   actually narrow the union for TS, even though it's clearly correct at
   runtime. Fixed in-file without touching `BaseService.ts` (that
   inconsistency is `type-crud-core`/#181's job, a bigger generic-typing
   change): `const rawData = 'data' in _resultRaw ? _resultRaw.data :
   undefined;` — a real `in`-operator type guard instead of a cast,
   commented explaining why and pointing at #181 for the real fix.

## Explicitly not touched

- The `(req as any).lang`/`.user` casts remaining in
  `generalInformation.controller.ts` and everywhere else — #179's scope,
  on its own branch, unmerged as of this branch's fork point.
- `BaseService.ts`'s inconsistent `handlerGet` return shape (found while
  fixing #6 above) — flagged for `type-crud-core`/#181, not fixed here
  (would expand this node beyond "fix named utils casts" into the CRUD
  core's own generic redesign).
- `handlerGetAboutMe`'s untyped return (found while fixing #5) — flagged
  for `type-candidate-modules`/#183, not fixed here.

## Verification run

```
npx tsc --noEmit
```
Clean, 0 errors (checked after every individual site fix, not just once
at the end — each of the 6 numbered changes above was independently
confirmed not to break the build before moving to the next).

```
npm test
```
```
Test Suites: 31 passed, 31 total
Tests:       181 passed, 181 total
Snapshots:   0 total
Time:        7.104 s
```
(same suite/test count as every prior sealed node this session — no
regression, and no test needed updating since none of these 6 fixes
changed observable behavior, unlike #179's rate-limit bug fix)

```
npm run build
```
```
tsc && npm run copy
```
Clean.

## Diff scope

```
git diff staging --stat -- src/
```
```
 src/candidate_me/index.ts                            |  2 +-
 .../generalInformation.controller.ts                 |  8 +++++++-
 src/logger/index.ts                                  | 21 ++++++++++++++-------
 src/utils/emailVerification.ts                       |  2 +-
 src/utils/helper-auth.ts                             |  8 ++++----
 src/utils/passwordReset.ts                           |  2 +-
 src/utils/sessionRevocation.ts                        |  2 +-
 src/utils/tokenBlacklist.ts                          |  6 +++---
 8 files changed, 32 insertions(+), 19 deletions(-)
```
Plus the diagram row (`agent-hub/`). 8 files — matches the tracking
issue's named scope exactly (6 utils files + the 2 call-site files whose
casts turned out to be redundant/need-a-guard once touched).

## Status
`sealed_pending_verifier`
