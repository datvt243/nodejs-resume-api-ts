# 2026-10-03 — memory-lint-scoping-lesson (implementer note)

- Worker: implementer (main session)
- Node: `memory-lint-scoping-lesson`
- No GitHub issue — operator-requested directly ("update vấn đề này cho
  agent-hub-init được không"), interpreted as: record this session's
  process lesson into the hub's core doctrine (`doctrine/MEMORY.md`,
  the file `agent-hub/INDEX.md` itself marks ★ "highest authority" for
  verified truth) — no file literally named "agent-hub-init" exists in
  this repo (confirmed via `find`), so this is the correct target.
- Branch: `chore-memory-lint-scoping-lesson` (from `staging`, fresh,
  after `fix-remaining-any-unsafe-missed-files`/#204 merged)

## What changed

Added one new section to `doctrine/MEMORY.md`, "Scoping a lint/type-
safety remediation initiative", same style/verbosity as the file's 2
existing "lessons learned" sections (branch isolation, sandbox gotchas).

Content, in summary (full text is in the file itself, not duplicated
here per the hub's own "don't restate agent-hub content in reports"
convention): documents the real root-cause chain behind #204's
discovery (the operator reviewing #177's merged diff by eye and
noticing real `any` still present) —

1. Verification-tool mismatch: only Phase 1 of #177 ran a full `npm run
   lint`; every later phase verified with `tsc`/test/build only, which
   can't catch `any` (TypeScript allows it by design).
2. Scoping by manual grep-sampling instead of an exhaustive rule+file
   breakdown — this is literally how the 9 missed files were missed.
3. The original 1424-problem baseline (Phase 1) was never broken down
   by `ruleId` before planning phases, so `no-misused-promises` (85
   hits, unrelated to `any`, present from day one) stayed invisible
   until #204 itself re-measured.
4. No phase-level or initiative-level re-run of the SAME full
   measurement used to define "not done" at the start, before declaring
   the any-cleanup phases complete and moving to compiler flags.

Records the concrete fix for future similar initiatives: measure
exhaustively via `--format json` grouped by rule AND file BEFORE
carving up phases (not grep/memory-based sampling), keep each phase's
own narrower verification tool (that part of #177's discipline was
correct), and re-run the SAME full measurement used to define the
starting baseline after the LAST phase, diffing per-rule counts rather
than trusting an overall "looks clean" impression.

## Explicitly not touched

- No code change — `agent-hub/doctrine/MEMORY.md` only.
- Did not touch issue #205 (the `no-misused-promises` follow-up) or
  attempt the `req.body`-typing cluster (143 problems) found while
  investigating this — those are separate, future work items the
  operator has not yet asked to start; this node is only the doctrine
  record of the lesson.

## Verification

Docs-only (`agent-hub/` is AI-only documentation per `agent-hub/CLAUDE.md`,
not a release-gate artifact) — verification here is re-reading the
added section for accuracy against the real events of this session
(cross-checked against #204's own evidence notes and the verifier's
independently-reproduced 438/346/85 counts, not re-derived from memory).

```
git status --short
```
Only `agent-hub/doctrine/MEMORY.md` modified (+ this diagram row + this
evidence note) — no `src/` touched.

## Diff scope

```
git diff staging --stat
```
1 content file (`doctrine/MEMORY.md`) + the diagram row + this note.

## Round 1 REOPEN (`evidence/verifier/2026-10-03/memory-lint-scoping-lesson-reopen.md`) and fix

The independent verifier caught 3 real inaccuracies in the first draft
of the new MEMORY.md section — ironic given the section's own subject is
"don't trust ungrounded numbers," but correctly caught nonetheless:

1. **"24 `no-explicit-any` hits, ~72 cascading `no-unsafe-*` problems"**
   presented as if additive/separately confirmed (implying ~96) when the
   real measured total was 84 — the 72 figure was itself #204's OWN
   initial grep-based undercount, not a second, independent measurement.
   Fixed: now states 24 real `no-explicit-any` hits + 84 total ESLint
   problems cleared once properly measured, explicitly naming that the
   72 estimate was itself wrong (citing #204's own evidence note).
2. **"The 9 any-removal phases"** (point 2) contradicted point 4's own
   "(2-8)" phase range in the same section — 2 through 8 is 7 phases
   (#179–#185), not 9 (9 is the file-miss count, a different number that
   got conflated with the phase count). Fixed: corrected to "7 any-
   removal phases (#179–#185)".
3. **"(`BaseController.ts` 37, `services/index.ts` 15, ...)"** — real,
   traceable numbers (confirmed via `git log --all -S "BaseController.ts\` (37)"`
   — introduced in commit `eef5dbd`, the batch-added `type-crud-core`
   PENDING scoping row), but the row containing them was later deleted
   as a stale duplicate in commit `4c2847f` during this session's own
   diagram cleanup, so they're no longer visible in the live diagram —
   the verifier correctly couldn't find them in any current evidence
   note and flagged them as unverifiable/apparently fabricated. Fixed:
   kept the real numbers but added the explicit commit citations
   (`eef5dbd` / `4c2847f`) so a future reader can verify them via `git
   log`/`git show` instead of only the live file tree.

All 3 fixes are corrections to THIS node's own prose, not new claims
needing fresh verification beyond re-checking the corrected text against
the same sources the round-1 verifier already used.

## Status
`sealed_pending_verifier` (round 2) — same audit-only precedent as
`update-project-docs`/#146, `fix-claude-md-candidate-model-fields`/#148,
and `sync-readme-claude-md-post-177` (all docs-only, non-outward-facing
beyond the PR/merge itself).
