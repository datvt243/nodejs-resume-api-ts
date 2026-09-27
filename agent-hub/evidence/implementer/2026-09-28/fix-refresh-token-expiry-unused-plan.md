# 2026-09-28 — fix-refresh-token-expiry-unused (plan + diff)

- Worker: implementer
- Version: 0.1.0
- Node: `fix-refresh-token-expiry-unused` (`haven/diagrams/dev-loop.prime-mermaid.md`)
- Issue: [#155](https://github.com/datvt243/resume-nodejs-api/issues/155) — TOKEN_EXP_IN env var never applied to jwtSign() — refresh token has no real purpose
- Branch: `155-token-exp-in` (base `staging`)
- Task (verbatim): "fix bug #152 tới #156" — this note covers #155 only, part of the same 5-issue batch as #152/#153/#154/#156, each processed as its own implementer→verifier round.

## Hub bytes before: 88066

## Node lookup

Matched the existing PENDING node `fix-refresh-token-expiry-unused`
directly (task resolves to GitHub issue #155, filed against this exact
node).

## Bookkeeping-gap finding (read before writing anything)

Same pattern as the other nodes sealed this session. Reading the real
call sites today shows `TOKEN_EXP_IN` IS already passed at every
`jwtSign()` call site, contradicting the node's PENDING description
(which cites `api/v1/auth/services/login.ts` — a file that no longer
exists; it was removed/merged by `consolidate-v1-v2-auth`, SEALED
2026-08-29):

`src/auth/auth.service.ts:126-127` (`handlerLogin`):
```ts
const token = jwtSign({ _id }, TOKEN_SECRET, { expiresIn: TOKEN_EXP_IN || '1h' });
const tokenRefresh = jwtSign({ _id }, TOKEN_REFRESH, { expiresIn: TOKEN_REFRESH_EXP_IN });
```

`src/auth/auth.controller.ts:153-154` (`authRefreshToken`):
```ts
const newAccess = jwtSign({ _id }, TOKEN_SECRET, { expiresIn: TOKEN_EXP_IN || '1h' });
const newRefresh = jwtSign({ _id }, TOKEN_REFRESH, { expiresIn: TOKEN_REFRESH_EXP_IN });
```

`TOKEN_REFRESH_EXP_IN` (`src/config/process.config.ts:38`) already
defaults to `'7d'` when unset, explicitly commented "meaningfully outlive
the access token (TOKEN_EXP_IN)". This wiring was part of the same
bundled commit `f355e2f` (2026-08-21) as the other 2 bookkeeping-gap
nodes sealed earlier this session (`fix-candidate-password-leak`,
`fix-create-response-null-id`) — same root commit, same never-backfilled
diagram gap.

The real remaining gap: **no test anywhere decoded a real issued JWT to
prove `exp - iat` actually reflects the configured duration** — the
existing `auth.service.test.ts` assertion (line 126) only checks
`expiresIn: expect.any(String)` was passed to a *mocked* `jwtSign`, which
would pass even if the wrong config variable were used, or if access and
refresh silently shared the same value. Exactly the gap issue #155's own
acceptance criteria calls out ("verified by decoding the issued JWT's
exp/iat").

## Diff (smallest diff — no `src/` production code, 1 new test file)

- `src/__tests__/auth/tokenExpiry.test.ts` (new) — uses the REAL
  `jwtSign`/`jwtVerify` (`@/utils/jwt`, unmocked) and REAL config
  (`@/config/process.config`, unmocked), re-required per test via
  `jest.resetModules()` after setting `process.env.TOKEN_EXP_IN`/
  `TOKEN_REFRESH_EXP_IN` (both are read at module-load time). 3 tests:
  1. Signs an access token with `TOKEN_EXP_IN='2h'` and a refresh token
     with `TOKEN_REFRESH_EXP_IN='14d'` (exact same call shape as both
     real call sites above), decodes both, and asserts `exp - iat`
     equals `7200` and `1209600` seconds respectively — 2 distinct,
     config-driven lifetimes, not a shared hardcoded default.
  2. Regression check: `TOKEN_EXP_IN` unset falls back to `1h` (the
     `|| '1h'` in both real call sites).
  3. Regression check: `TOKEN_REFRESH_EXP_IN` itself still defaults to
     `'7d'` when unset (existing behavior, don't break it).

## Command

```
npm test
```
Output (verbatim tail):
```
Test Suites: 27 passed, 27 total
Tests:       143 passed, 143 total
Snapshots:   0 total
Time:        7.289 s
Ran all test suites.
```
(143 = 140 (post-#157-merge baseline on `staging`) + 3 new tests, in a
new suite file, so +1 suite. Same pre-existing, unrelated harness exit
warning as prior notes — not a failure.)

```
npm run build
```
Output: `tsc` clean, `copy` step ran with no errors.

## Acceptance

| Criterion | Evidence |
|---|---|
| Trace to exactly one diagram node | `fix-refresh-token-expiry-unused` |
| Smallest diff | 1 new test file only, 0 production `src/` changes (fix already live since `f355e2f`, 2026-08-21) |
| Access tokens expire per `TOKEN_EXP_IN`, verified by decoding `exp`/`iat` | `tokenExpiry.test.ts`, test 1 (`accessDecoded.exp - accessDecoded.iat === 7200` for `TOKEN_EXP_IN='2h'`) |
| Refresh tokens continue to expire per `TOKEN_REFRESH_EXP_IN` | `tokenExpiry.test.ts`, test 1 (`refreshDecoded.exp - refreshDecoded.iat === 1209600` for `TOKEN_REFRESH_EXP_IN='14d'`) + test 3 (default `'7d'` regression check) |
| Existing auth/refresh tests still pass | `npm test` → `Tests: 143 passed, 143 total`, includes `auth/auth.service.test.ts`, `auth/auth.controller.test.ts`, `auth/refreshToken.test.ts` all green |
| Exact test command run + output read back | `npm test` output above; `npm run build` clean |
| Evidence note written | This file |

## Noticed, not done

- The diagram node's own PENDING description cites a call site
  (`api/v1/auth/services/login.ts`) that no longer exists — stale,
  same class of drift as `fix-v2-register-missing-await`'s node (also
  in this batch). Not edited elsewhere; the SEAL on this node itself
  corrects the record.

## Seal gate

No outward-facing action taken (no commit/push). Only a local file
write: 1 new test file under `src/__tests__/`. Pending verifier.

## Status

`sealed_pending_verifier`
