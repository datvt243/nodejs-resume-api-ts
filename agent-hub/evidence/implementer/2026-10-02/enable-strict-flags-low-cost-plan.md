# 2026-10-02 — enable-strict-flags-low-cost (implementer note)

- Worker: implementer (main session)
- Node: `enable-strict-flags-low-cost`
- GitHub issue: #186 — "type-safety: enable near-zero-cost strict flags (noFallthroughCasesInSwitch, noImplicitOverride, noUncheckedIndexedAccess)", part of tracking issue #177
- Branch: `186-strict-flags-low-cost` (from `staging`, fresh)

## Pre-flight: re-measured error counts on this branch

Re-ran each flag individually before touching `tsconfig.json`, since prior
sibling phases' fixes aren't merged here yet and counts could have
shifted:
```
noFallthroughCasesInSwitch: 0 errors
noImplicitOverride:         1 error  (AppError.ts:51)
noUncheckedIndexedAccess:   5 errors across 4 real locations
```
Matches the tracking issue's original audit closely enough to proceed as
scoped.

## What changed

`tsconfig.json` — added all 3 flags together (`noFallthroughCasesInSwitch`,
`noImplicitOverride`, `noUncheckedIndexedAccess`), per the issue's own
bundling rationale (combined 6 fixes, same character of work).

Fixed each resulting error with a REAL fix — no suppression, no widened
types just to silence the compiler:

1. **`errors/AppError.ts:51`** — `public readonly message: string;`
   genuinely overrides `Error.message` → added the `override` modifier.
2. **`middlewares/language.middleware.ts:14`** — `acceptLanguage.split(',')[0].trim().split('-')[0]`
   chains two array-index accesses; `noUncheckedIndexedAccess` correctly
   can't know `String.split()` always returns ≥1 element, so both became
   `string | undefined`. Split into 2 statements with `?? ''` fallbacks
   (never actually triggered at runtime — `split()` on any string, empty
   or not, always yields a non-empty array — this only satisfies the
   type checker's conservative assumption, doesn't change behavior).
3. **`auth/auth.service.ts:52`** — same pattern, `email.split('@')[0]` →
   `email.split('@')[0] ?? email` (falls back to the full email if
   somehow empty, same non-triggering-in-practice reasoning as #2).
4. **`candidate_me/index.ts:35`** (reported at line 41, the `handlerGetAboutMe`
   call site reading the narrowed `email`) — THIS ONE IS A REAL BUG, not
   just a type-checker nitpick. `req.params`'s index signature means
   `email: string | undefined` under this flag. The existing guard
   (`if (!email) res.status(400).json(...);`) was MISSING its `return` —
   confirmed by comparing against the other 2 identical guards in this
   exact same file (`fnRecordVisit` line 189-192, `fnExportPDF` line
   248-251), both of which correctly have `return;` after the same
   pattern. Without it, a request with a falsy/empty `:email` param would
   send the 400 response and then KEEP EXECUTING — calling
   `handlerGetAboutMe(undefined, ...)` and eventually `formatReturn(res, ...)`
   again, a second write to an already-sent response (`ERR_HTTP_HEADERS_SENT`
   at runtime). Fixed by adding the missing `return;`, matching the
   sibling guards' own established pattern in this file.
5. **`__tests__/middlewares/requestLogger.test.ts:18`** — a test helper's
   `handlers: Record<string, () => void>` lookup (`handlers.finish()`)
   became possibly-undefined under the same index-signature rule. Fixed
   with `handlers.finish?.()` — a real, minimal null-safe call, not a
   suppression (tests get a relaxed ESLint any/unsafe-* policy per
   tracking issue #177's locked decision, but this is a real strict-null
   fix from a NEW compiler flag, not an any/unsafe-type issue, so it's
   fixed properly like any other file).

## Explicitly not touched

- Nothing else — this phase's error set was small and fully resolved;
  no site was left unfixed or scoped out.

## Verification run

```
npx tsc --noEmit
```
Clean, 0 errors — reached incrementally, one fix verified at a time (the
real-bug fix in `candidate_me/index.ts` was isolated and confirmed
necessary before moving to the next file, not batch-applied blind).

```
npm test
```
```
Test Suites: 31 passed, 31 total
Tests:       181 passed, 181 total
Snapshots:   0 total
Time:        6.975 s
```
Same baseline as every prior sealed node this session. Specifically
re-ran `candidate_me/index.test.ts` in isolation (8/8 passed, unchanged)
to confirm the real behavior fix (#4 above) didn't regress anything —
no existing test exercised the missing-`return` gap, but none broke
from closing it either.

```
npm run build
```
Clean.

## Diff scope

```
git diff staging --stat -- src/ tsconfig.json
```
```
 src/__tests__/middlewares/requestLogger.test.ts | 2 +-
 src/auth/auth.service.ts                        | 2 +-
 src/candidate_me/index.ts                       | 5 ++++-
 src/errors/AppError.ts                          | 2 +-
 src/middlewares/language.middleware.ts          | 7 +++++--
 tsconfig.json                                   | 3 +++
 6 files changed, 15 insertions(+), 6 deletions(-)
```
Smallest-diff for the requirement — every touched file corresponds to a
real error the 3 new flags surfaced, nothing extra.

## Status
`sealed_pending_verifier`
