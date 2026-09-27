# 2026-09-28 — fix-candidate-password-leak (verifier verdict)

- Worker: verifier (subagent, dispatched via Agent tool)
- Node: `fix-candidate-password-leak` (`haven/diagrams/dev-loop.prime-mermaid.md`)
- Evidence reviewed: `evidence/implementer/2026-09-28/fix-candidate-password-leak-plan.md`
  (the 2026-09-28 note supersedes the stale `2026-08-21/fix-candidate-password-leak-diff.md`
  note per its own text — that older note was NOT used as verdict input,
  only its existence was cross-checked as context)
- New PM status: SEALED (was PENDING)

## Isolation proof

Dispatched as an independent Agent-tool spawn with task description
"Independent verifier pass for fix-candidate-password-leak" — fresh
context, no memory of the implementer session that wrote the 2026-09-28
note. Self-grading is moot here by construction.

## Reasoning

Walking GitHub issue #152's acceptance criteria one at a time
(`gh issue view 152`):

1. **`GET /api/v1/candidate/:email` response has no `password` field.**
   Confirmed by independently reading current
   `src/candidate/candidate.service.ts` (lines 37-53):
   `handlerGetInformationByEmail` calls
   `MODEL.findOne(safeEmailQuery).select('-password').exec()` — matches
   the note's cited snippet verbatim.

2. **`PUT`/`PATCH /candidate/update` response has no `password` field.**
   Confirmed in the same file: `handlerGetInformationById` runs
   `MODEL.findById(id).select(select || '-password')` — defaults to
   excluding password when no explicit select is given, and no longer
   double-wraps an explicit select string in `whitelistSelect([select])`
   (the prior no-op bug). Matches the note's cited snippet verbatim.

3. **Existing tests still pass; a regression test asserts password is
   absent from the response.** Confirmed by reading
   `src/__tests__/candidate/candidate.service.test.ts` directly — the
   file exists and contains exactly the 3 tests the note claims:
   `handlerGetInformationByEmail` asserts `select` was called with
   `'-password'`; `handlerGetInformationById` asserts the same default;
   a third test asserts an explicit whitelisted select string
   (`'firstName lastName phone'`) passes through unchanged, which is a
   direct regression test for the root-cause double-wrap bug. `npm test`
   output in the note reads `Test Suites: 27 passed, 27 total / Tests:
   143 passed, 143 total` — a standard, non-truncated Jest summary; 143 =
   140 (the last SEALED node, `fix-create-response-null-id`, per
   `worker-runs.log`) + 3 new tests here, internally consistent.

**Test command**: `npm test`, matches `doctrine/MEMORY.md` exactly.

**Bookkeeping-gap claim independently confirmed**: the production fix
(commit `f355e2f`, 2026-08-21) is genuinely already live and unchanged —
the code read today matches both the note's citation and the stale
2026-08-21 note's original diff. The real gap this note closes is the
missing regression test, which now exists.

**Proportion (SmallestDiff)**: 1 new test file, 0 production `src/`
changes — proportionate; the production fix already exists and is
stable, so a regression-test-only diff is the smallest diff that closes
the actual remaining gap.

**Seal gate**: `git status --short` on branch `152-password-hash-leaked`
shows only 2 untracked paths — the implementer's evidence note and the
1 new test file. Nothing staged, committed, or pushed. Matches the
note's "no outward-facing action taken" claim.

## Forbidden states scan

- `ADHOC_WORK` — no: node `fix-candidate-password-leak` pre-existed on
  the diagram (row read before edit, was PENDING).
- `NO_EVIDENCE` — no: implementer note exists at the cited path, dated
  and complete.
- `EDIT_UNVERIFIED` — no: `npm test` output is real, verbatim, not
  truncated, and consistent with the described diff (143 = 140 + 3).
- `CODE_IN_HAVEN` — no: the only new file is
  `src/__tests__/candidate/candidate.service.test.ts`, outside `haven/`;
  no runnable code touched `agent-hub/`.
- `DIAGRAM_DRIFT` — resolved by this verdict: node row updated PENDING →
  SEALED in place, no reorder.

## Re-run

`none` — audit-only, per recipe default for a non-outward-facing, non-
release-gate bug/test-coverage fix. The note's command matched doctrine,
output was verbatim and covered every acceptance criterion, and
independent reads of the cited source file and new test file confirmed
the claims. No partial or full re-run was warranted.
