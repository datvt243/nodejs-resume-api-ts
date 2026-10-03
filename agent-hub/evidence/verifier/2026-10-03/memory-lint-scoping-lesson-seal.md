# 2026-10-03 — memory-lint-scoping-lesson (verifier note, round 2)

- Worker: verifier (independent subagent, spawned via Agent tool)
- Node: `memory-lint-scoping-lesson`
- No GitHub issue (operator-requested doctrine update)
- Verdict: **SEAL**
- Round: 2 (round 1 REOPENed this same node — see
  `evidence/verifier/2026-10-03/memory-lint-scoping-lesson-reopen.md`,
  kept as-is, not overwritten)

## Isolation proof
Spawned fresh via the Agent tool with a self-contained prompt
("independent VERIFIER subagent... You have NOT seen any prior
conversation — verify everything from scratch") naming this exact round-2
re-verification task, including an explicit instruction not to trust the
implementer's "Round 1 REOPEN and fix" narrative but to re-derive the 3
disputed facts independently. No conversation history with either the
original implementer pass or the round-1 verifier pass. First actions
were reading `NORTHSTAR.md`, the full current `doctrine/MEMORY.md`, the
diagram, `.claude/skills/worker/SKILL.md`, and the round-1 REOPEN note
itself, fresh.

## What was checked

1. **Diagram**: `memory-lint-scoping-lesson` exists exactly once, state
   `PENDING` (round 1 did not flip it), in
   `haven/diagrams/dev-loop.prime-mermaid.md` line 114, before this pass.
2. **Diff scope**: `git status --short` / `git diff staging --stat` show
   only `agent-hub/doctrine/MEMORY.md` (+69 lines) and the diagram row
   modified, plus two untracked evidence notes
   (`evidence/implementer/2026-10-03/memory-lint-scoping-lesson-plan.md`
   and `evidence/verifier/2026-10-03/memory-lint-scoping-lesson-reopen.md`
   — no new verifier note existed before this pass). Nothing under
   `src/`. Scope unchanged from round 1 and still clean.
3. **Independently re-verified each of round 1's 3 REOPEN issues against
   the CURRENT text** (`git diff staging -- agent-hub/doctrine/MEMORY.md`),
   not the implementer's narrative:

   - **Issue 1 (24 vs ~72 vs 84).** Current text: "9 files with real
     `any`... (24 real `@typescript-eslint/no-explicit-any` hits; fixing
     them cleared 84 ESLint problems total once properly measured — the
     initiative's own first estimate for this same set, 72, was itself a
     grep-based guess that undercounted...)". This no longer implies
     24+72 are additive/separately-confirmed — 72 is now explicitly
     labeled the original (wrong) estimate, and 84 is presented as the
     one real measured total. Independently re-derived:
     - Ran `npx eslint 'src/**/*.ts' --format json` on the current
       working tree (this branch carries no `src/` diff vs `staging`
       tip, confirmed by `git diff staging --stat` above). Parsed:
       354 total / 262 non-test problems, `no-explicit-any` = 0 hits
       outside `__tests__`, `no-misused-promises` = exactly 85 — matches
       round 1's own independently-reproduced numbers exactly.
     - Read `fix-remaining-any-unsafe-missed-files-plan.md` (#204) in
       full: "Before (unmodified `staging`, captured first): 438 total
       problems (346 excluding test files). After this node's fixes: 354
       total (262 excluding test files) — 84 fixed, more than the 72
       originally estimated" (lines 198-203), and "the real
       `@typescript-eslint/no-explicit-any` violations (24, confirmed via
       `npx eslint` not grep)" (line 44-45). Cross-checked against
       #204's own verifier seal note
       (`evidence/verifier/2026-10-03/fix-remaining-any-unsafe-missed-files-seal.md`):
       independently reproduced "438/346 baseline" via `git stash` to
       unmodified `staging` tip, and the post-fix "354 total / 262
       non-test... matches the note exactly, down from the
       independently-reproduced 438/346 baseline (84 fixed)," plus "0
       hits" for `no-explicit-any` outside tests. 84 is a real,
       twice-independently-reproduced delta (438-354), not fabricated.
       Issue 1 is fixed.

   - **Issue 2 (7 vs 9 any-removal phases).** Current text, item 2: "The
     7 any-removal phases (#179–#185)"; item 4: "After the any-removal
     phases (2-8)". Ran `gh issue list --state all` and confirmed:
     #178 = "set up ESLint + typescript-eslint" (Phase 1), #179-#185 =
     the 7 `any`-removal issues (remove-req-as-any-casts,
     fix-utils-real-any-casts, type-crud-core, type-auth-module,
     type-candidate-modules, type-joi-validation-layer,
     type-pdf-docx-export — Phases 2 through 8 inclusive, 2,3,4,5,6,7,8 =
     7 phases), #186-#189 = the 4 compiler-flag phases (9-12). "7
     any-removal phases (#179–#185)" and "(2-8)" are now internally
     consistent with each other and with the real issue numbering. No
     remaining "9" miscount anywhere in the section (grepped the full
     section text for a stray "9" near "phase" — the only "9" in the
     section now correctly refers to "9 files," never phase count).
     Issue 2 is fixed.

   - **Issue 3 (BaseController.ts 37 / services/index.ts 15 /
     BaseService.ts 7).** Current text cites both commit hashes: "real
     numbers, originally recorded in this diagram's `type-crud-core`
     PENDING row, commit `eef5dbd`; that row was later deleted as a
     stale duplicate in commit `4c2847f`." Independently ran
     `git log --all --oneline -S'BaseController.ts\` (37)' --
     agent-hub/haven/diagrams/dev-loop.prime-mermaid.md` (note: the
     implementer's suggested command with an escaped backtick inside
     single quotes does not work in bash — had to drop the backslash
     for the search string to actually match) — returned exactly 2
     commits: `4c2847f` and `eef5dbd`, matching the claim. Ran
     `git show eef5dbd:agent-hub/haven/diagrams/dev-loop.prime-mermaid.md
     | grep -n -B2 -A4 "BaseController.ts\` (37)"` — confirmed the row
     really reads "...the shared CRUD framework backing all 9 CV
     sections carries the largest `any` concentration —
     `BaseController.ts` (37), `services/index.ts` (15), `BaseService.ts`
     (7)." Ran `git show 4c2847f -- <file>` and confirmed the same row
     is removed (`-` prefix) in that commit's diff, consistent with "a
     stale duplicate" deletion. All 3 numbers are real, historically
     genuine (not fabricated even in the historical commit), and the
     current MEMORY.md text now cites both commit hashes, letting a
     reader verify via `git log`/`git show` rather than presenting the
     numbers as if checkable from the live file tree alone (they are
     not — the row is gone from the live diagram, confirmed by grepping
     the current diagram for "BaseController.ts\` (37)": no match, only
     in MEMORY.md's own citation of the historical commits). Issue 3 is
     fixed.

4. **Re-checked everything round 1 already confirmed was fine** (not
   just the 3 fixes) — all still present, unchanged, verbatim in the
   current section text:
   - "Only Phase 1 (the ESLint setup itself) ever ran a full `npm run
     lint`. Every phase from 2 onward verified with `npx tsc
     --noEmit`/`npm test`/`npm run build` only" — unchanged from round 1,
     still consistent with round 1's own grep across all 12 phase plan
     notes (not independently re-run again here since the underlying
     evidence notes haven't changed and round 1 already did a full
     per-note grep; re-litigating an unchanged, already-independently-
     confirmed claim would be redundant verification, not more rigor).
   - "The headline baseline number (1424 problems at Phase 1) was never
     broken down by rule before planning phases" — unchanged, still
     matches `setup-eslint-typescript-plan.md`'s "1424 real problems"
     with no per-rule table (round 1 read this note in full; text is
     unchanged in round 2's diff).
   - `no-misused-promises` = 85, Express-handler false positive,
     unrelated to `any` — unchanged text. Independently re-confirmed via
     my own `npx eslint --format json` run above: 85 hits, exactly
     matching round 1's and #204's own count. Not re-sampled individual
     hits again since round 1 already spot-checked 3 real examples
     (`rateLimit.middleware.ts:52`, `application.route.ts:47/74`) and
     confirmed them genuine false positives, and the claim text is
     byte-for-byte unchanged from round 1's TRUE verdict.
   - The fix prescription (measure exhaustively via `--format json`
     grouped by rule+file before planning, keep per-phase narrow
     verification, re-run the same full measurement after the last
     phase, split unrelated categories into their own issue) — unchanged
     text, already judged coherent and correctly derived from the TRUE
     claims in round 1; nothing in round 2's diff touches this part.

## Forbidden-state scan
- `ADHOC_WORK`: no — node existed PENDING before this change; docs-only,
  `agent-hub/doctrine/MEMORY.md` + diagram row only.
- `NO_EVIDENCE`: no — implementer plan note exists, substantive, and now
  includes a "Round 1 REOPEN and fix" section naming exactly what
  changed and why.
- `EDIT_UNVERIFIED`: no — all 3 disputed numeric/count claims were
  independently re-derived from primary sources in this pass (a fresh
  `npx eslint` run, `gh issue list`, and `git log`/`git show` on the two
  cited commits), not taken on the implementer's word.
- `CODE_IN_HAVEN`: no — no runnable code touched or added.
- `DIAGRAM_DRIFT`: no — diagram row was left PENDING through round 1 and
  this round's independent checks confirm the doc content now matches
  what the row promises; flipping to SEALED in this pass is this
  verifier's own privilege (`RatchetOnly`), not a pre-existing drift.

## Re-run
`partial` — re-ran `npx eslint 'src/**/*.ts' --format json` (same
justification as round 1: this node's core content is historical
numeric measurement claims, worth independently reproducing rather than
only auditing prose) and `gh issue list --state all` plus `git log
--all -S` / `git show` on the two cited commits (new in round 2,
specifically to re-derive Issues 2 and 3 from primary sources rather
than trust the implementer's "Round 1 REOPEN and fix" narrative, per
this round's explicit brief). Did not re-run `npm test`/`npm run build`
— no `src/` diff exists on this branch, nothing to test.

## Verdict
**SEAL.** All 3 round-1 REOPEN issues are genuinely fixed and
independently re-confirmed from primary sources (fresh ESLint run, `gh
issue list`, `git log`/`git show` on the two cited commits — not the
implementer's narrative). Everything round 1 already confirmed TRUE
remains unchanged and still TRUE. No new inaccuracy found. Diagram row
`memory-lint-scoping-lesson` flipped PENDING → SEALED in place on
`haven/diagrams/dev-loop.prime-mermaid.md` (row text otherwise
untouched, `AppendOnly`/no reordering).
