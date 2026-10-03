# 2026-10-03 — initiative-scoping-standard (verifier note)

- Worker: verifier (independent subagent)
- Node: `initiative-scoping-standard`
- Verdict: **REOPEN**

## Isolation proof
Spawned via the Agent tool as a fresh subagent with the task description
"Verify initiative-scoping-standard node" — no implementer history, no
prior conversation turns. This is the first and only read of the diff in
this context.

## What was checked

1. **Diagram check** — `grep -n "initiative-scoping-standard"
   agent-hub/haven/diagrams/dev-loop.prime-mermaid.md` → exactly one row,
   state `PENDING`. OK.

2. **Diff scope** — `git status --short` / `git diff staging --stat`:
   ```
    M agent-hub/CLAUDE.md
    M agent-hub/INDEX.md
    M agent-hub/doctrine/INDEX.md
    M agent-hub/haven/diagrams/dev-loop.prime-mermaid.md
   ?? agent-hub/doctrine/standards/initiative-scoping.md
   ?? agent-hub/evidence/implementer/2026-10-03/initiative-scoping-standard-plan.md
   ```
   `git diff staging --stat` (tracked files only): 4 files, 14 insertions,
   0 deletions. Matches the expected scope exactly — nothing in `src/`,
   no existing standards file content touched.

3. **New file structure** — `doctrine/standards/initiative-scoping.md`
   read in full. Matches the shape of the 2 existing standards files:
   epigraph quote, "The rule", "Not evidence vs Evidence" table, "Why
   this matters", "No exceptions", "Failure mode this catches",
   "Enforcement". The stated rule itself (measure exhaustively by
   rule+file before phasing; re-run the same full measurement after the
   last phase) is actionable and unambiguous.

4. **Cross-references** —
   - `agent-hub/CLAUDE.md` diff: new paragraph under "The default loop"
     references `doctrine/standards/initiative-scoping.md` — real path,
     file exists there. OK.
   - `agent-hub/INDEX.md` diff: exactly one new row added, 2-column
     format matching the table's other rows. OK.
   - `agent-hub/doctrine/INDEX.md` diff: exactly one new row added,
     3-column format matching the table's other rows. OK.

5. **Factual consistency against `doctrine/MEMORY.md`'s "Scoping a
   lint/type-safety remediation initiative" section — FAILED.**

   `doctrine/standards/initiative-scoping.md` line 40 states:
   > "...so `@typescript-eslint/no-misused-promises` (**85 hits**, an
   > unrelated Express-async-handler ESLint config issue, nothing to do
   > with `any`) sat invisible in that total from day one."

   `doctrine/MEMORY.md`'s sealed "Scoping a lint/type-safety remediation
   initiative" section (the exact source material this file is supposed
   to distill) describes the same `no-misused-promises` fact **without
   any hit count**:
   > "...a big chunk of that 1424 was
   > `@typescript-eslint/no-misused-promises` (Express async-handler
   > false positives — nothing to do with `any` at all, unrelated ESLint
   > config issue) sitting untouched the whole time..."

   Confirmed by direct grep — `grep -n "85" agent-hub/doctrine/MEMORY.md`
   returns only an unrelated line number (`#179–#185`), never the figure
   "85"; `grep -n "no-misused-promises" agent-hub/doctrine/MEMORY.md`
   shows the fact with no number attached, both occurrences. So "85
   hits" is a numeric claim that does **not** appear in the MEMORY.md
   section this file is supposed to reformat.

   The number is not fabricated — it does exist elsewhere in the hub (the
   diagram's SEALED `fix-remaining-any-unsafe-missed-files`/#204 row says
   "`no-misused-promises` accounting for exactly 85 of those", a fact
   independently reproduced by that node's own verifier). But that is a
   **different** sealed source than the one this task was explicitly
   scoped against. The task brief for this node, and the task instructions
   for this verification, are explicit that the new file "should be a
   reformatting/distillation into a rule, not new research" and must not
   "introduce any NEW numeric claim or fact not already present and
   verified in that MEMORY.md section." Pulling in the "85" figure from
   the `fix-remaining-any-unsafe-missed-files` diagram row — even though
   it is itself true and previously verified — is exactly that: a new
   fact grafted onto the distillation from a source outside the one
   section this node was scoped to reformat.

6. **Forbidden-state scan**: `ADHOC_WORK` no (node exists on diagram,
   PENDING, proper loop followed). `NO_EVIDENCE` no (implementer note at
   `evidence/implementer/2026-10-03/initiative-scoping-standard-plan.md`).
   `EDIT_UNVERIFIED` no (docs-only, audit-only precedent applies, no test
   command claimed). `CODE_IN_HAVEN` no (no code files added).
   `DIAGRAM_DRIFT` not applicable — node correctly still PENDING, left
   untouched per this REOPEN.

## Missing / gap
- `doctrine/standards/initiative-scoping.md` line 40: the "(85 hits)"
  parenthetical must be removed or rephrased to match MEMORY.md's own
  un-quantified wording for the `no-misused-promises` fact (e.g. "a large
  chunk of that 1424", matching MEMORY's own phrasing), since the
  specific count is not part of the sealed MEMORY.md material this file
  distills.

## Re-run
`none` — audit-only (docs-only node, no test command applicable; matches
precedent of prior docs-only nodes this session).

## Verdict
**REOPEN.** Everything else checked out (diagram row, diff scope,
structural format match, both cross-reference tables, no `src/` touch, no
existing standards file content altered). The single, specific gap: the
new standard introduces a numeric fact ("85 hits") not present in the
`doctrine/MEMORY.md` section it is meant to be a pure
reformatting/distillation of. Fix: drop or re-source that one number so
the file strictly reflects only what's already sealed in MEMORY.md's
"Scoping a lint/type-safety remediation initiative" section, then
resubmit for verification. Diagram left untouched (`PENDING`, unchanged).
