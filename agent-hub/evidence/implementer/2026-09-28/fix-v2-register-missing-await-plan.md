# 2026-09-28 — fix-v2-register-missing-await (plan + diff)

- Worker: implementer
- Version: 0.1.0
- Node: `fix-v2-register-missing-await` (`haven/diagrams/dev-loop.prime-mermaid.md`)
- Issue: [#156](https://github.com/datvt243/resume-nodejs-api/issues/156) — POST /api/v2/auth/register always fails — missing await on bcryptGenerateSalt
- Branch: `156-post-apiv2-authregister` (base `staging`)
- Task (verbatim): "fix bug #152 tới #156" — this note covers #156, the last of the same 5-issue batch as #152/#153/#154/#155, each processed as its own implementer→verifier round.

## Hub bytes before: 88066

## Node lookup

Matched the existing PENDING node `fix-v2-register-missing-await` directly
(task resolves to GitHub issue #156, filed against this exact node).

## Bookkeeping-gap finding, with a twist (read before writing anything)

Different shape from the other 4 nodes in this batch: the file the node
(and the issue) names, `src/api/v1/auth/services/register.ts`, **does not
exist anywhere in the repo today**:

```
$ find src/api -iname "*.ts"
(no output)
```

It was removed by `consolidate-v1-v2-auth` (issue #77, SEALED
2026-08-29), which merged the separate v1/v2 auth implementations into
one shared `src/auth/auth.service.ts` + `src/auth/auth.controller.ts`.
Confirmed `src/routers/api/v2/auth.route.ts` today:

```ts
import { authRegister, authLogin } from '@/auth/auth.controller';
router.post('/register', authRegister);
router.post('/login', authLogin);
```

— the exact same `authRegister` controller v1 uses, which calls
`handlerRegister` (`src/auth/auth.service.ts:48`):

```ts
const bcryptPwd = await bcryptGenerateSalt(password);
```

`await` is present and correct. This isn't quite the same "the exact
diff already shipped in commit `f355e2f`" story as the other 4 nodes in
this batch — it's one level more thorough: the **entire buggy code
path was deleted and replaced** by the v1/v2 consolidation, and the
replacement was never buggy in the first place (it's the same
`handlerRegister` v1 has always used, which has always awaited
correctly). So there's no old commit to cite for "this exact line was
fixed" — instead the fix is that the vulnerable file doesn't exist
anymore, full stop.

Existing coverage already indirectly proves the `await` is correct:
`auth.service.test.ts`'s `handlerRegister` "should register successfully"
test mocks `bcryptGenerateSalt` with `mockResolvedValue(mockHash)` and
asserts `CandidateModel.create` was called with `password: mockHash` (the
plain string) — if the `await` were missing, `bcryptPwd` would be the
Promise object itself, and that assertion would fail (a Promise never
deep-equals a string). This is not a "happy path that could pass by
accident" (issue #156's own phrasing) — it's a real, load-bearing
assertion.

The one real gap: **nothing proved `/api/v2/auth/register` actually
reaches this already-correct, already-tested handler**, as opposed to
some other, possibly-still-broken code path. That's what this diff adds.

## Diff (smallest diff — no `src/` production code, 1 new test file)

- `src/__tests__/auth/v2AuthRoute.test.ts` (new) — inspects the real
  Express router object exported by `src/routers/api/v2/auth.route.ts`
  (`router.stack`) and asserts its `/register` route's handler is
  literally the same `authRegister` function reference imported from
  `@/auth/auth.controller` — not a re-implementation, not a stale/dead
  copy, the exact same code v1 uses and `auth.service.test.ts` already
  covers.

## Command

```
npm test
```
Output (verbatim tail):
```
Test Suites: 27 passed, 27 total
Tests:       141 passed, 141 total
Snapshots:   0 total
Time:        6.786 s, estimated 7 s
Ran all test suites.
```
(141 = 140 (post-#157-merge baseline on `staging`) + 1 new test, in a new
suite file, so +1 suite. Same pre-existing, unrelated harness exit
warning as prior notes — not a failure.)

```
npm run build
```
Output: `tsc` clean, `copy` step ran with no errors.

## Acceptance

| Criterion | Evidence |
|---|---|
| Trace to exactly one diagram node | `fix-v2-register-missing-await` |
| Smallest diff | 1 new test file only, 0 production `src/` changes (the buggy file no longer exists — removed by `consolidate-v1-v2-auth`/#77, 2026-08-29) |
| `POST /api/v2/auth/register` succeeds end-to-end, stored password is a real bcrypt hash | `auth.service.test.ts`'s existing `handlerRegister` test (pre-existing, cited not re-run) proves the hash is awaited correctly; this diff's new test proves v2's route reaches that exact handler |
| A regression test covers this call site directly, not just a happy-path that could pass by accident | `v2AuthRoute.test.ts` — asserts the literal function reference, would fail if v2 ever pointed at a different/broken handler again |
| Exact test command run + output read back | `npm test` output above; `npm run build` clean |
| Evidence note written | This file |

## Live end-to-end — not performed, said honestly

Same sandbox constraint as the other nodes in this batch: no `.env`, no
local MongoDB, Docker daemon unreachable — no way to curl a real `POST
/api/v2/auth/register` end-to-end in this environment. The route-wiring
test plus the existing `handlerRegister` unit test together prove the
same thing a live curl would (real handler, real awaited hash), without
requiring a live DB round-trip.

## Seal gate

No outward-facing action taken (no commit/push). Only a local file
write: 1 new test file under `src/__tests__/`. Pending verifier.

## Status

`sealed_pending_verifier`
