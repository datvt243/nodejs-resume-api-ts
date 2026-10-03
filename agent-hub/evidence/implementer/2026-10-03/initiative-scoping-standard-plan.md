# 2026-10-03 — initiative-scoping-standard (implementer note)

- Worker: implementer (main session)
- Node: `initiative-scoping-standard`
- No GitHub issue — operator-requested directly: "về các quy tắc vừa
  làm, hãy tạo 1 file md cho nó và thêm vào claude.md để đảm bảo các
  fix/feature sau này đều áp dụng" (turn the rule just made into a
  standalone md file and reference it from CLAUDE.md so future fixes/
  features all apply it).
- Branch: `chore-initiative-scoping-standard` (from `staging`, fresh,
  after `memory-lint-scoping-lesson`/the prior node merged)

## What changed, per file

1. **New `agent-hub/doctrine/standards/initiative-scoping.md`**: turns
   `doctrine/MEMORY.md`'s narrative "Scoping a lint/type-safety
   remediation initiative" section (the #177→#204 case study) into an
   enforceable standard, same required shape as the 2 existing
   `doctrine/standards/*.md` files (confirmed by reading
   `edit-verification.md` in full first, matched its section structure
   exactly: epigraph quote, "The rule", "Not evidence vs Evidence"
   table, "Why this matters", "No exceptions", "Failure mode this
   catches", "Enforcement"). The rule itself: measure exhaustively
   (`--format json` grouped by rule+file) BEFORE splitting a measured-
   by-count initiative into phases, and re-run the SAME full measurement
   after the LAST phase rather than trusting each phase's own narrower
   `tsc`/test/build check.

2. **`agent-hub/CLAUDE.md`**: added a new paragraph directly under "The
   default loop" (not just relying on the generic "Required reading ...
   4. doctrine/standards/" step, since the operator specifically wants
   this APPLIED, not just theoretically reachable) — names the rule in
   one paragraph and points to the new standards file. Placed here
   because this section is literally "how work happens step by step,"
   the most natural place to flag a special case of that loop.

3. **`agent-hub/INDEX.md`** and **`agent-hub/doctrine/INDEX.md`**: both
   already listed the 2 existing standards files in a table; added the
   new file as a 3rd row in both, matching each file's existing column
   format (confirmed by reading both files' current tables before
   editing, not guessing the format).

## Explicitly not touched

- Did not touch the "agent-hub-init" sibling project
  (`~/Workspace/Project/agent-hub-init`, confirmed to exist via `ls
  ~/Workspace/Project/` and to contain `kit/agent-hub-structure.md`/
  `agent-hub-templates.md`/`init-agent-hub-prompt.md` — the scaffold
  that generates `agent-hub/` directories in new projects) — the
  operator asked for this project's own rule to also propagate back to
  that template, but that's a SEPARATE repository outside this one's
  seal gate/diagram, out of scope for a node in THIS project's diagram.
  Handled separately, directly with the operator, not as part of this
  node.
- No `src/` change — doc-only, same as every node in this session's
  doc-update chain (`sync-readme-claude-md-post-177`,
  `memory-lint-scoping-lesson`).

## Verification

Docs-only — verification is confirming internal consistency and that
every cross-reference actually resolves:

```
grep -n "initiative-scoping" agent-hub/CLAUDE.md agent-hub/INDEX.md agent-hub/doctrine/INDEX.md agent-hub/doctrine/standards/initiative-scoping.md
```
Confirms the new file is referenced from all 3 places it's supposed to
be (CLAUDE.md's default-loop paragraph, both INDEX.md tables), and the
file itself exists with that exact name.

```
git status --short
```
Only the 4 files above + this evidence note + the diagram row — nothing
in `src/`.

## Diff scope

```
git diff staging --stat
```
1 new file (`doctrine/standards/initiative-scoping.md`) + 3 small edits
(`CLAUDE.md`, 2x `INDEX.md`) + the diagram row + this note.

## Round 1 REOPEN (`evidence/verifier/2026-10-03/initiative-scoping-standard-reopen.md`) and fix

The verifier correctly caught that `initiative-scoping.md` line 40 cited
`@typescript-eslint/no-misused-promises (85 hits, ...)` — a specific
count the sealed `doctrine/MEMORY.md` section this file is supposed to
distill does NOT itself state (that section just says "a big chunk of
that 1424" with no number). The 85 figure is real (traces to the
separately-sealed `fix-remaining-any-unsafe-missed-files`/#204 diagram
row), but grafting it in from outside the one section this node was
scoped to reformat made it a new claim, not a pure distillation. Fixed
by rewording to match MEMORY.md's own un-quantified phrasing exactly
("a big chunk of it — `@typescript-eslint/no-misused-promises` ...").
Re-checked every other number in the file (1424, 9 files, 24, 84, 72,
phase numbers) against MEMORY.md's exact sealed text — all already
present there verbatim, no further changes needed.

## Status
`sealed_pending_verifier` (round 2) — same audit-only precedent as the
prior docs-only nodes this session.
