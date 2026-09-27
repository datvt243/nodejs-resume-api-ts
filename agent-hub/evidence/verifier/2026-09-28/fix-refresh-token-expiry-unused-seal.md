# 2026-09-28 — fix-refresh-token-expiry-unused (verifier verdict)

- Worker: verifier (subagent, dispatched via Agent tool)
- Node: `fix-refresh-token-expiry-unused` (`haven/diagrams/dev-loop.prime-mermaid.md`)
- New PM status: SEALED (was PENDING)

## Isolation proof

Dispatched as an independent Agent-tool subagent whose own task description
reads "Independent verifier pass for fix-refresh-token-expiry-unused" — no
memory of the implementer session that wrote
`evidence/implementer/2026-09-28/fix-refresh-token-expiry-unused-plan.md`.
Per SOUL.md invariant (1), self-grading is moot here: this is a fresh
context with no prior state.

## Reasoning

Read only the implementer's plan note per EvidenceOnly, then independently
confirmed the specific factual claims it makes (not re-derived the diff):

- **Cited call sites match verbatim**: read `src/auth/auth.service.ts:115-134`
  and `src/auth/auth.controller.ts:145-159` directly — both contain exactly
  the lines quoted in the note (`jwtSign({ _id }, TOKEN_SECRET, { expiresIn:
  TOKEN_EXP_IN || '1h' })` for access, `jwtSign({ _id }, TOKEN_REFRESH,
  { expiresIn: TOKEN_REFRESH_EXP_IN })` for refresh), confirming `TOKEN_EXP_IN`
  is genuinely already wired at both sites — the PENDING description's cited
  `api/v1/auth/services/login.ts` no longer exists, consistent with the
  bookkeeping-gap explanation.
- **Test file read in full and independently re-run**:
  `src/__tests__/auth/tokenExpiry.test.ts` uses real unmocked
  `@/utils/jwt` and `@/config/process.config`, calls `jest.resetModules()`
  before each `require()` so env var changes (`TOKEN_EXP_IN`,
  `TOKEN_REFRESH_EXP_IN`) actually take effect before the config module is
  re-read — no stale-cache bug. Ran it myself:
  `npx jest src/__tests__/auth/tokenExpiry.test.ts` → `Tests: 3 passed, 3
  total`, matching the note's claims exactly (`exp-iat===7200` for `2h`,
  `exp-iat===1209600` for `14d`, plus the two regression checks).
- **Issue #155 acceptance criteria, one at a time** (`gh issue view 155`):
  (a) access tokens expire per `TOKEN_EXP_IN`, verified by decoding
  `exp`/`iat` — covered, test 1. (b) refresh tokens continue to expire per
  `TOKEN_REFRESH_EXP_IN` — covered, test 1 + test 3 (7d default
  regression). (c) existing auth/refresh tests still pass — note's `npm
  test` output: `Test Suites: 27 passed, 27 total / Tests: 143 passed, 143
  total`, not truncated, includes `auth.service.test.ts`,
  `auth.controller.test.ts`, `refreshToken.test.ts`.
- Test command (`npm test`) matches `doctrine/MEMORY.md`'s documented
  command from repo root.
- Proportion: 1 new test file, 0 production `src/` changes — proportionate
  given the fix has been live since `f355e2f` (2026-08-21); the real gap
  closed is regression coverage, exactly as the note states.
- 5 forbidden states scanned: no ADHOC_WORK (worker identity + node
  matched), no NO_EVIDENCE (note exists), no EDIT_UNVERIFIED (claims
  independently re-run and matched), no CODE_IN_HAVEN (only a test file
  under `src/__tests__/`, nothing in `haven/`), DIAGRAM_DRIFT resolved by
  this SEAL (row was PENDING, now updated).
- Seal gate: `git status --short` on `155-token-exp-in` shows only 2
  untracked files (the plan note + the test file) — no commit, no push,
  matching the note's "no outward-facing action taken" claim.

## Re-run

`partial` — re-ran only the new test file
(`npx jest src/__tests__/auth/tokenExpiry.test.ts`, 3/3 passed) to confirm
the note's specific claims; did not re-run the full `npm test` suite
(accepted the note's verbatim 143/143 output for that).
