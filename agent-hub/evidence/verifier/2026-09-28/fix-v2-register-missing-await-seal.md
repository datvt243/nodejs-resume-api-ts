# 2026-09-28 — fix-v2-register-missing-await (verifier verdict)

- Worker: verifier
- Node: `fix-v2-register-missing-await` (`haven/diagrams/dev-loop.prime-mermaid.md`)
- New PM status: SEALED (was PENDING)

## Isolation proof

Dispatched as a fresh subagent via the Agent tool with the task
description "Independent verifier pass for
fix-v2-register-missing-await" — no memory of the implementer session
that produced the diff under review; everything below was re-derived
from the evidence note and the repo itself, not recalled.

## Reasoning

**Criterion (a) — POST /api/v2/auth/register succeeds end-to-end, stored
password is a real bcrypt hash, not `[object Promise]`.**
Independently confirmed the note's central claim by reading source
directly (not just trusting the note's citations):
- `find src/api -iname "*.ts"` → no output. The file the diagram node and
  issue #156 name (`src/api/v1/auth/services/register.ts`) does not
  exist anywhere in the repo.
- `src/routers/api/v2/auth.route.ts` imports `authRegister` from
  `@/auth/auth.controller` and wires it to `router.post('/register', ...)`
  — the identical controller v1 uses.
- `src/auth/auth.service.ts` `handlerRegister`: `const bcryptPwd = await
  bcryptGenerateSalt(password);` — `await` present and correct.
- `src/__tests__/auth/auth.service.test.ts` "should register
  successfully with new email" mocks `bcryptGenerateSalt` with
  `mockResolvedValue(mockHash)` and asserts
  `CandidateModel.create` was called with `password: mockHash` (the
  plain string). A missing `await` would leave `bcryptPwd` as a pending
  Promise object, which never deep-equals `mockHash` under
  `toHaveBeenCalledWith` — so this pre-existing test is genuinely
  load-bearing for criterion (a), not incidental. Confirmed by reading
  the test file directly, not the note's paraphrase alone.

**Criterion (b) — a regression test covers this call site directly, not
just a happy-path integration test that could pass by accident.**
Read `src/__tests__/auth/v2AuthRoute.test.ts` in full. It imports the
real `v2AuthRouter` and the real `authRegister`, finds the `/register`
layer in `router.stack`, and asserts
`registerLayer.route.stack[0].handle` is the literal `authRegister`
function reference via `.toBe()` (identity, not deep-equal) — this
would fail if v2's route were ever repointed at a different or
reintroduced-buggy handler. Combined with the pre-existing
`handlerRegister` unit test above, the two together directly cover both
"the right handler runs" and "that handler awaits the hash correctly" —
not a single broad happy-path test that could pass by accident.

**Test command / output.** Note's command is `npm test`, matching
`doctrine/MEMORY.md`'s documented `npm test` = `jest
--passWithNoTests`. Output in the note (141/141, 27 suites) is not
truncated or redacted. Additionally re-ran the two directly relevant
suites myself for extra confidence:
`npx jest src/__tests__/auth/v2AuthRoute.test.ts
src/__tests__/auth/auth.service.test.ts` → 2 suites, 14 tests, all
passed, including both cited assertions.

**Forbidden states scan.**
- `ADHOC_WORK` — node exists on the diagram, worker identity declared. N/A.
- `NO_EVIDENCE` — note written at the cited path. N/A.
- `EDIT_UNVERIFIED` — test output was read back in the note and
  independently reproduced here. N/A.
- `CODE_IN_HAVEN` — `find agent-hub/haven -iname "*.ts" -o -iname "*.py"
  -o -iname "*.sh"` → no output. N/A.
- `DIAGRAM_DRIFT` — row was PENDING pre-seal (expected, updated in this
  same pass); not drift.

**Seal gate.** Note claims no outward-facing action (no commit/push).
Confirmed via `git status --short` on branch `156-post-apiv2-authregister`:
2 untracked files only (the evidence note, the new test file) — nothing
staged, committed, or pushed.

**Proportion (SmallestDiff).** 1 new test file, 0 production `src/`
changes. Proportionate: the file the bug report names no longer exists,
and the replacement path was independently confirmed (not just
asserted) to already be correct and already partially tested; the only
real gap — route-to-handler wiring — is exactly what the new test
closes.

## Missing

None.

## Re-run

Partial — re-ran the two directly relevant suites
(`v2AuthRoute.test.ts`, `auth.service.test.ts`) myself for extra
confidence beyond reading the note's `npm test` output back; did not
re-run the full `npm test` suite (audit-only default for a non-outward-
facing, non-release-gate change; note's full-suite output was already
verbatim and unredacted).
