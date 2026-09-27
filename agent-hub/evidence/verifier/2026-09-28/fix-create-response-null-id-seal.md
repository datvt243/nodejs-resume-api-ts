# 2026-09-28 — fix-create-response-null-id — verifier verdict

- Worker: verifier (subagent, dispatched via Agent tool)
- Node: `fix-create-response-null-id` (`haven/diagrams/dev-loop.prime-mermaid.md`)
- New PM status: SEALED

## Isolation proof

Dispatched as a fresh Agent-tool subagent with task description
"Independent verifier pass for fix-create-response-null-id" — no
conversation history from the implementer's session, no memory of writing
the diff under review. Only source read directly (per recipe step 2's
citation-confirmation exception): `src/services/index.ts` (current +
`git show f355e2f`), the two new test files, `git status`/`git log` on
branch `157-post-create-responses`. Never opened the implementer's
session/diff itself — only its evidence note, plus these independent
citation checks.

## Reasoning

- **Command matches doctrine**: `npm test` — matches
  `doctrine/MEMORY.md`'s Test row exactly.
- **Output not truncated**: note's `npm test` tail
  (`Test Suites: 26 passed, 26 total` / `Tests: 140 passed, 140 total`)
  and `npm run build` output are verbatim, no `...`/truncation markers.
- **Criterion (a)** — regression test asserts real persisted `_id`, not
  null: confirmed by reading
  `src/__tests__/services/baseCreateDocument.test.ts` directly — 3 tests
  cover hookAfterSave replacement propagation, undefined fallback, and
  no-hook passthrough; the first asserts
  `expect((result.data as any)._id).toBe('real-id-123')`.
- **Criterion (b)** — spot-check a real CV section create endpoint
  end-to-end: note explicitly discloses the literal live-HTTP
  interpretation was NOT performed (no local Mongo/Redis/Docker in that
  sandbox — a real, stated constraint, not hidden) and substitutes
  `src/__tests__/candidate_profile/BaseService.test.ts`, confirmed by
  direct read: calls the real, unmocked `createCrudService(...).
  handlerCreate` → real `BaseService.ts` → real `services/index.ts`
  `baseCreateDocument` → real `hookAfterSave` refetch path, only the
  Mongoose model itself faked. This exercises the exact production code
  path every `POST .../create` endpoint uses, asserts
  `data._id).toBe('real-id-1')` (not null). Judged: an honest, reasonable
  substitution given the disclosed sandbox limit and the fact the
  underlying fix has been live and unchanged on `staging` for 5+ weeks
  (see next point) — not a REOPEN-worthy gap.
- **Bookkeeping-gap claim independently confirmed**: `git show f355e2f --
  src/services/index.ts` really contains the cited hunk
  (`const replacement = await props.hookAfterSave(...); if (replacement
  !== undefined) _data = replacement;`), and current
  `src/services/index.ts` lines 300-302 match it verbatim — the
  production fix is genuinely already live, unchanged since 2026-08-21.
  `BaseService.ts` confirmed unchanged (diff is test-only).
- **Proportion**: 2 new test files, 0 production `src/` changes —
  proportionate; the production fix already exists, so a regression-test
  diff is the smallest diff that closes the real gap (no prior test
  coverage).
- **Seal gate**: `git status --short` on branch `157-post-create-responses`
  shows only 3 untracked paths — the evidence note dir and the 2 new test
  files — nothing staged/committed/pushed. `git log` on that branch shows
  no new commit beyond the shared history with `staging`. Matches the
  note's "no outward-facing action taken" claim.

## Forbidden states scan

- `ADHOC_WORK` — no: task traces to the pre-existing PENDING node
  `fix-create-response-null-id` on the diagram (row confirmed before
  edit).
- `NO_EVIDENCE` — no: implementer note exists at the cited path.
- `EDIT_UNVERIFIED` — no: `npm test` output is a real, non-truncated,
  doctrine-matching command result, consistent with the described diff
  (140 = prior 136 + 3 new `baseCreateDocument.test.ts` tests + 1 new
  `BaseService.test.ts` test).
- `CODE_IN_HAVEN` — no: `find agent-hub/evidence/implementer/2026-09-28`
  shows only the one `.md` note, no runnable code.
- `DIAGRAM_DRIFT` — resolved by this verdict: node row updated PENDING →
  SEALED in place.

## Re-run

`none` — audit-only, per recipe default for a non-outward-facing, non-
release-gate bug/test-coverage fix. The note's command matched doctrine,
output was verbatim and covered every acceptance criterion, so no partial
or full re-run was warranted; independent checks were limited to
confirming the note's own citations (git history, current source, test
file contents) rather than regenerating its evidence.
