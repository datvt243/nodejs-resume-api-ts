# 2026-10-01 — remove-req-as-any-casts (implementer note)

- Worker: implementer (main session)
- Node: `remove-req-as-any-casts`
- GitHub issue: #179 — "type-safety: remove unnecessary (req as any) casts + dead @ts-ignore + 1 non-null assertion", part of tracking issue #177
- Branch: `179-remove-req-as-any` (from `staging`)

## Problem confirmed before writing anything

Same audit already done for tracking issue #177: `grep -rl "(req as any)" src --include="*.ts" | grep -v "/__tests__/"` listed 13 files. `src/types/express.d.ts` already declares `user`/`lang`/`t` on `Express.Request`; `@types/multer`/`@types/cookie-parser` (already installed) already augment `.file`/`.files`/`.cookies`; `req.get()` is native Express — confirmed earlier (tracking issue #177's audit) via an isolated typecheck that all 7 properties resolve with zero casts needed.

## What changed

1. **Mechanical replacement** of every `(req as any).<prop>` with `req.<prop>` for `lang`/`user`/`t`/`file`/`cookies`/`get` across the 12 files that needed it (BSD `sed`'s lack of `\b` support required one manual follow-up fix in `language.middleware.ts:21`'s `.t =` assignment — caught by re-grepping after each file, not assumed clean).
2. **`award.validate.ts`** — removed the dead `// @ts-ignore` above `import Joi from 'joi'` (every other file in the codebase imports Joi identically with no ignore needed — confirmed by grep before removing).
3. **`rateLimit.middleware.ts`** — the retry-loop non-null assertion: `let lastError: any` → `let lastError: unknown = new Error('withRetry: exhausted retries without a successful attempt')` (a real initial value instead of relying on `!` to silence the "used before assigned" concern), `catch (err: any)` → `catch (err: unknown)`, `throw lastError!` → `throw lastError`.
4. **`candidate.controller.ts`** — removing the casts turned `req.user?._id` (now correctly typed `string | undefined`, previously silently `any`) into 4 real type errors at call sites requiring `candidateId: string` (`fnUploadCV`, `fnDownloadCV`, `fnGetVisits`, `fnDelete`). These 4 routes are self-only, always behind `verifyToken` (which unconditionally sets `req.user`), so `undefined` here can't happen in real traffic — but per the "no `!` to silence the compiler" rule, added an explicit guard clause instead: `if (!req.user?._id) throw new AuthenticationError();` before using `req.user._id` (narrowed, no cast). This throws into the existing `catch` block, which already routes through `handleError` → the global error middleware → a real 401 — defense-in-depth if the `verifyToken` invariant were ever violated by a future bug, rather than silently passing `undefined` downstream. Two other sites (`fnUpdate`/`fnUpdateFields`, `_id: req.user?._id` inside an object spread) did **not** error — `handlerUpdate`'s parameter accepts an optional `_id`, so no change was forced there; left untouched (no gratuitous rewrite beyond what the compiler required).
5. **`candidate.controller.ts`** — the trailing `req.file as Express.Multer.File | undefined` casts (2 sites, left over after step 1 only stripped the `(req as any)` prefix) were themselves also fully redundant — `req.file`'s real type already IS `Express.Multer.File | undefined` (same class of unnecessary cast, confirmed by the same express.d.ts+@types/multer reasoning). Removed both.
6. **`BaseController.ts:144`** — same leftover-trailing-cast situation, but this one is **not** redundant: `req.files`'s real type is `Express.Multer.File[] | { [field]: Express.Multer.File[] } | undefined` (multer supports both `.array()` and `.fields()` configs), narrower than what this specific call site needs. Verified `uploadImagesMiddleware` (`uploadImages.middleware.ts:65`) always uses `.array('images', ...)`, so the cast is genuine and justified here — kept `as Express.Multer.File[]`, added a comment explaining why (per the "if you must use `as`, justify it and keep it narrow" rule) rather than blanket-removing it.
7. **Bug found and fixed, flagged explicitly to the operator before proceeding** (not silently rolled in — asked via an explicit question, operator chose "fix now"): `rateLimit.middleware.ts:59` read `(req as any).user?.id`, but `Express.Request.user` is declared `{ _id: string }` everywhere else in the codebase — `.id` never existed. This silently defeated per-user rate-limit keying: `userId` always fell back to `'anon'` for every authenticated request, so the `${prefix}:${userId}:${ip}` bucket key was effectively IP-only, not per-user-per-IP as intended. Fixed to `req.user?._id`, with a comment explaining the discovered bug. The existing test (`rateLimit.test.ts`'s `makeReq` helper + the "separates limits by IP and userId" test) mocked `user: { id: 'user1' }` — i.e. the test itself encoded the same typo and would have silently passed either way (both mock user objects resolved to the same `'anon'` bucket, but at `max: 1` with the SAME ip, the test's own assertion (`next` called twice) was failing before this fix — running it confirmed the bug live, not just via reading code). Fixed `makeReq`'s type + both call sites to use `_id`, re-ran: now genuinely proves per-user separation.

## Explicitly not touched

- `src/candidate_profile/BaseController.ts`'s remaining `any` usage unrelated to `req` (the generic CRUD `any`s) — out of scope, tracked as `type-crud-core`/#181.
- The ~10 other real `any`/`as any` sites named in tracking issue #177 (logger dynamic dispatch, timer `.unref()` casts, `jwt.decode`, etc.) — tracked as `fix-utils-real-any-casts`/#180.
- `fnUpdate`/`fnUpdateFields`'s `_id: req.user?._id` (no compiler error forced a change there — left as-is).

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
Snapshots:   0 total
Time:        4.181 s
```
(same suite count as baseline; `rateLimit.test.ts`'s 5 tests all still pass, now genuinely exercising the fixed per-user-separation behavior instead of accidentally passing around the bug)

```
npm run build
```
```
tsc && npm run copy
```
Clean.

```
grep -rn "(req as any)" src --include="*.ts" | grep -v "/__tests__/"
```
Empty — zero remaining.

```
grep -rn "@ts-ignore\|@ts-nocheck" src --include="*.ts"
```
Empty — zero remaining anywhere in `src/` (tests included).

Non-null assertions: re-ran the same filtered regex from the #177 audit (`grep -rnoE "[A-Za-z0-9_\)\]]\![^=]" src --include="*.ts" | grep -v "/__tests__/"`) — the complete, exact hit list (13 lines, all manually re-checked in context, not curated/summarized):
- `src/routers/index.ts:113` — `"Hello World!"` (a raw HTML string).
- `src/database/mongo.db.ts:60`, `:76` — `'[MongoDB] Connected!'` / `'[MongoDB] Disconnected!'` log strings.
- `src/locales/en.ts:31,32,34,38`, `src/locales/vi.ts:31,32,34,38` — Vietnamese/English exclamation-mark message strings (`common.notFoundData` etc.).
- `src/config/regex.config.ts:8` — `!@` inside a password-character-class regex literal.
- `src/utils/helper.ts:54` — `!!` boolean double-negation, not a non-null assertion.

Zero real non-null assertions left in production `src/`.

## Diff scope

```
git diff staging --stat
```
```
 src/__tests__/middlewares/rateLimit.test.ts        |  6 +-
 src/auth/auth.controller.ts                        | 58 +++++++++----------
 src/candidate/candidate.controller.ts              | 57 ++++++++++---------
 src/candidate_me/index.ts                          |  8 +--
 src/candidate_profile/BaseController.ts            | 66 ++++++++++++----------
 src/candidate_profile/awards/award.validate.ts     |  1 -
 .../generalInformation.controller.ts               | 24 ++++----
 src/logger/index.ts                                |  2 +-
 src/middlewares/language.middleware.ts             |  4 +-
 src/middlewares/rateLimit.middleware.ts            | 14 +++--
 src/middlewares/uploadCV.middleware.ts             |  8 +--
 src/middlewares/uploadLinkedInExport.middleware.ts |  6 +-
 src/middlewares/verifyToken.middleware.ts          |  2 +-
 src/routers/api/v1/profile.route.ts                |  2 +-
 src/utils/csrf.ts                                  |  2 +-
 15 files changed, 137 insertions(+), 123 deletions(-)
```
14 production files + 1 test file. Every file was already in the #179 scope list except `rateLimit.test.ts` (needed to fix the test's own encoded bug alongside the production fix) and the 2 `req.file as ...`/1 `req.files as ...` trailing-cast sites (same root cause, same issue's spirit — left as dead-cast otherwise).

## REOPEN round 1 — addressed

Verifier REOPEN (`evidence/verifier/2026-10-01/remove-req-as-any-casts-reopen.md`) cited two issues:

1. **`ADHOC_WORK`** — the `remove-req-as-any-casts` node had no row on `dev-loop.prime-mermaid.md` at all. Root cause: the PENDING row was added while on `staging` before branching, then got `git stash`ed together with Phase 1's (#178) other changes when isolating this branch from that one — the stash never got reapplied here. Fixed: added the `remove-req-as-any-casts` PENDING row directly to this branch (not re-adding the other 11 unrelated backlog rows from the original batch, to avoid duplicate-row risk if both phase branches merge independently — each remaining phase's node will be added on its own branch when that phase starts, matching `NodeBeforeCode`).
2. **Minor accuracy gap** — the note's non-null-assertion false-positive list was a curated subset, missing 2 real hits the verifier found (`routers/index.ts:113`, `mongo.db.ts:60,76`). Fixed: replaced with the complete, exact 13-line hit list above, each re-checked in context.

No code changes were needed for this REOPEN — the verifier's own re-run confirmed every technical claim (tsc/test/build, the bug fix, the guard clauses, the justified cast) already held.

## Status
`sealed_pending_verifier`
