# 2026-09-27 - fix-claude-md-candidate-model-fields — SEAL

- Worker: verifier
- Node: `fix-claude-md-candidate-model-fields` (`haven/diagrams/dev-loop.prime-mermaid.md`)
- New PM status: SEALED

## Isolation proof

This verdict was produced by a fresh Agent-tool subagent dispatch (worker_id
`verifier`, no prior turns), invoked via the `Agent` tool with a task prompt
naming the evidence note path, node id, and diagram path directly — no
conversation history from the implementer session was present. The
implementer's evidence note was read fresh from disk in this session's
first tool calls, satisfying `NeverVerifyOwnWork` by construction (this
session did not write `CLAUDE.md`'s edit).

## Reasoning

- Read the evidence note at
  `evidence/implementer/2026-09-27/fix-claude-md-candidate-model-fields-plan.md`
  in full.
- Read the node's row in `dev-loop.prime-mermaid.md` (was PENDING) and
  `agent-hub/CLAUDE.md`'s 5 forbidden states.
- Commands match `doctrine/MEMORY.md` exactly (`npm test`, `npm run build`,
  run from the repo root). Output in the note is untruncated (full
  `npm run build` output shown, `npm test` tail shown with matching counts
  to the immediately preceding sibling node `update-project-docs`).
- Independently fact-checked the main acceptance criterion against the real
  files (not just the note's account):
  - `git -C <repo> diff CLAUDE.md` — confirmed the actual one-line diff:
    Candidate row gained `cvFile ({ originalName, uploadedAt } ...)`,
    `isPublic (default true — gates ... GET /api/me/:slug-or-email ...)`,
    `emailVerified (default false, informational only, doesn't gate login)`.
  - `src/models/candidate.model.ts` — confirmed verbatim:
    `cvFile: { originalName, uploadedAt }` (both `String`/`Number`,
    `required: false`), `isPublic: { type: Boolean, default: true }`,
    `emailVerified: { type: Boolean, default: false }`.
  - `src/candidate_me/index.ts:48` — confirmed `isPublic === false` short-
    circuits the public-profile response to "Email không tồn tại" (fail
    closed), and `handlerGetAboutMe` (line 70) does slug-then-email lookup,
    confirming the `:slug-or-email` wording is accurate.
  - `src/auth/auth.service.ts`'s `handlerLogin` (line 99) — read the full
    function body; it only checks email-exists and password hash, never
    reads `emailVerified`. `emailVerified` is only set by
    `handlerVerifyEmail` (a separate flow) and only ever read/exposed as
    `email_verified` in the login response payload for the frontend to
    display — never used as a gate. Confirms "doesn't gate login".
- Forbidden states: none triggered.
  - `ADHOC_WORK` — node existed on the diagram before the edit (added by
    the implementer per the default loop, evidence note present) — not
    ad-hoc.
  - `NO_EVIDENCE` — evidence note present at the expected path.
  - `EDIT_UNVERIFIED` — test/build claims independently fact-checked above
    for the doc content itself; command output audited and not truncated.
  - `CODE_IN_HAVEN` — no runnable code touched; `git status --short`
    showed only `CLAUDE.md`, the diagram row, and the new evidence `.md`
    file.
  - `DIAGRAM_DRIFT` — corrected by this verdict (PENDING → SEALED, in
    place, same row, no reordering).
- Proportion check — `git -C <repo> status --short` before this verdict's
  own diagram edit showed exactly: `M CLAUDE.md`,
  `M agent-hub/haven/diagrams/dev-loop.prime-mermaid.md` (new PENDING row
  added by implementer), and the untracked implementer evidence note.
  Nothing else modified — matches the claimed single-row scope.
- Seal gate — note states the one-line diff was shown to the operator via
  the `Edit` tool output in the turn immediately preceding this `/todo`
  run, in direct response to the operator's explicit "yes fix CLAUDE.md
  too", and no commit/push has happened. Acceptable for this trivial,
  non-outward-facing, docs-only change.

All 4 acceptance-table criteria in the note have real, independently
verified evidence. Verdict: SEAL.

## Re-run

Audit-only (no independent re-run of `npm test`/`npm run build`). This is
a one-line docs row, not outward-facing (no commit/push yet) and not a
release gate. The note's pasted output for both commands is untruncated,
uses the exact doctrine commands, and its counts (24/24 suites, 136/136
tests; clean `tsc && copy`) match the immediately preceding sibling node
(`update-project-docs`, SEALED the same day after an independent re-run
that reproduced those exact numbers), so there is no signal here of
drift or a mismatched command. Given the change surface is a single
markdown table row with no `src/` behavior change, auditing the note plus
directly reading the two real source files (`CLAUDE.md`'s Candidate row,
`src/models/candidate.model.ts`, and the two call sites backing the
behavioral claims) is sufficient per the recipe's stated default.
