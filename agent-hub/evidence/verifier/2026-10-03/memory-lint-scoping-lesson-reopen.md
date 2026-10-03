# 2026-10-03 — memory-lint-scoping-lesson (verifier note)

- Worker: verifier (independent subagent, spawned via Agent tool)
- Node: `memory-lint-scoping-lesson`
- No GitHub issue (operator-requested doctrine update)
- Verdict: **REOPEN**

## Isolation proof
Spawned fresh via the Agent tool with a self-contained prompt naming this
exact verification task ("independent VERIFIER subagent... verify
everything from scratch"); no conversation history with the implementer
pass that wrote `doctrine/MEMORY.md`'s new section. First actions in this
pass were reading `NORTHSTAR.md`, the full current `doctrine/MEMORY.md`,
the diagram, and `.claude/skills/worker/SKILL.md` +
`haven/workers/verifier/{manifest.yaml,SOUL.md,recipes/verify_seal.md}`
fresh — not reused from any implementer context.

## What was checked

1. **Diagram**: `memory-lint-scoping-lesson` exists exactly once, state
   `PENDING`, in `haven/diagrams/dev-loop.prime-mermaid.md` (line 114).
2. **Diff scope**: `git status --short` / `git diff staging --stat` show
   only `agent-hub/doctrine/MEMORY.md` (+59 lines) and the diagram row
   (+1 line) modified, plus the new evidence note under
   `agent-hub/evidence/implementer/2026-10-03/`. Nothing under `src/`.
   Scope is clean.
3. **Claim-by-claim fact check** of the new "Scoping a lint/type-safety
   remediation initiative" section against the real historical record
   (not the prose):
   - "Only Phase 1 ever ran a full `npm run lint`" — grepped all 12
     phase plan notes (`setup-eslint-typescript`,
     `remove-req-as-any-casts`, `fix-utils-real-any-casts`,
     `type-crud-core`, `type-auth-module`, `type-candidate-modules`,
     `type-joi-validation-layer`, `type-pdf-docx-export`,
     `enable-strict-flags-low-cost`,
     `enable-no-property-access-index-signature`,
     `enable-no-unused-locals-params`,
     `enable-exact-optional-property-types`) for `npm run lint` —
     present only in `setup-eslint-typescript-plan.md`, absent from all
     11 others. **TRUE.**
   - "The 1424-problem baseline was never broken down by `ruleId`" —
     read `setup-eslint-typescript-plan.md` in full: it reports "1424
     real problems" with 3 spot-checked examples, no per-rule table.
     **TRUE.**
   - `no-misused-promises` = 85, unrelated to `any` — independently
     re-ran `npx eslint 'src/**/*.ts' --format json` on the current
     `staging` tip (`50feee9`, this branch has no `src/` diff so it's
     the same tree). Parsed: 354 total / 262 non-test problems (matches
     #204's post-fix numbers exactly, since #204 is already merged into
     `staging`), `no-explicit-any` = 0 outside tests, `no-misused-promises`
     = exactly **85**. Sampled 3 hits: `rateLimit.middleware.ts:52`
     (`createRateLimiter` returns `async (req,res,next) => {...}` as an
     Express `RequestHandler`) and `application.route.ts:47/74` (async
     handlers `fnCreate`/`fnCreate` passed directly to
     `router.post`/`.get`). All genuine "Promise returned where void
     expected" — the well-known Express async-handler false positive,
     confirmed not real bugs. **TRUE.**
   - Cross-check against `fix-remaining-any-unsafe-missed-files-plan.md`
     (#204) and its verifier seal note
     (`evidence/verifier/2026-10-03/fix-remaining-any-unsafe-missed-files-seal.md`):
     438/346/85 numbers **are** real and independently reproduced by
     the #204 verifier (own re-run matches: 438→354, 346→262, 85
     unchanged). **TRUE**, and MEMORY.md doesn't actually restate
     438/346 anyway (only 85 appears in the new section).

## Problems found — three separate, independently-checkable inaccuracies

**(a) "24 `no-explicit-any` hits, ~72 cascading `no-unsafe-*` problems"
is not a real measured split and overstates the total.**
The "72" is not a cascading-only figure — it's the *original,
pre-lint-run* grep estimate from GitHub issue #204's own per-file table
(23+14+9+8+6+4+3+3+2 = 72, "ESLint any/unsafe-* problems" per file,
already a combined any+unsafe-* count). The #204 plan note explicitly
says this estimate "was ALSO wrong" (`fix-remaining-any-unsafe-missed-files-plan.md`
line 29) and that the real fix, once measured with `npx eslint`, totaled
**84** problems (across the 9 files + 2 necessitated fixes in
`services/index.ts`) — "more than the 72 originally estimated" (line
200). So MEMORY.md's phrasing implies ~96 problems (24 + 72, as if
additive and separately confirmed) when the actual total for the 9
files is at most ~82 (84 minus the 2 `services/index.ts` fixes), and the
"72" being cited was itself labeled a bad estimate in the very note this
section is supposed to be drawn from. This is exactly the kind of
imprecise-number-presented-as-fact the lesson itself warns against.

**(b) "The 9 any-removal phases'" is an internal inconsistency inside
the same new section.**
Item 4 of the same section correctly scopes "the any-removal phases
(2-8)" — 7 phases (`remove-req-as-any-casts`/#179,
`fix-utils-real-any-casts`/#180, `type-crud-core`/#181,
`type-auth-module`/#182, `type-candidate-modules`/#183,
`type-joi-validation-layer`/#184, `type-pdf-docx-export`/#185 — matches
issue #177's own phase list and #204's "#179/#180/#181/#182/#183/#184/#185"
framing exactly: **7**, not 9). Item 2 says "The 9 any-removal phases'"
— almost certainly a transposition from "9 files" (the #204 scope)
pasted into the wrong place. Two parts of the same new doctrine section
disagree with each other on this count.

**(c) "(`BaseController.ts` 37, `services/index.ts` 15, ...)" is not
traceable to any evidence note and appears to be fabricated.**
Grepped every 2026-10-0x implementer and verifier evidence note for
these two filenames paired with a number — no note anywhere records 37
`any` hits for `BaseController.ts` or 15 for `services/index.ts`. The
one real, comparable measurement that exists
(`evidence/verifier/2026-10-02/type-crud-core-seal.md` line 19) found
**31** `(req as any)` casts in `BaseController.ts` via direct grep — a
different number, for a different (but related) cast family. Issue
#177's own audit summary only says these files have "real `any` mass"
concentrated in them, with no per-file counts at all. Presenting
specific numbers as a factual example when no such measurement exists
in the record is the sort of claim this verification pass exists to
catch.

## Judgment on the lesson's core fix (separate from the numeric issues)

The prescribed fix — measure exhaustively via `--format json` grouped by
rule AND file BEFORE carving up phases, keep each phase's own narrower
verification tool, and re-run the SAME full measurement after the last
phase — is coherent, actionable, and follows correctly from the TRUE
claims (1), (the ruleId-breakdown claim), and the no-misused-promises
sampling. That part does not need rework.

## Forbidden-state scan
- `ADHOC_WORK`: no — node existed PENDING before this change; docs-only.
- `NO_EVIDENCE`: no — implementer plan note exists and is substantive.
- `EDIT_UNVERIFIED`: **yes, partial** — the implementer note's own
  "Verification" section claims the new content was "cross-checked
  against #204's own evidence notes," but the (a)/(b)/(c) numbers above
  do not actually appear in those notes — the cross-check as performed
  did not catch these three specific fabricated/inconsistent figures.
- `CODE_IN_HAVEN`: no.
- `DIAGRAM_DRIFT`: no — diagram row left untouched (still PENDING, this
  verdict is REOPEN).

## Re-run
`partial` — re-ran `npx eslint 'src/**/*.ts' --format json` on the
current `staging` tip (no other command needed: this branch carries no
`src/` diff, and the specific claims under dispute are lint-output
numbers). Justified: this node's central content is a set of specific
historical measurement claims — exactly the class of claim worth
independently reproducing rather than only auditing prose.

## Verdict
**REOPEN.** Fix needed before re-submitting: correct or remove items
(a), (b), (c) above in `doctrine/MEMORY.md`'s new "Scoping a
lint/type-safety remediation initiative" section —
- (a): either drop the invented 24/72 split and just say "9 files with
  real `any` (72 problems by the original, since-corrected grep
  estimate; 84 once actually measured and fixed, 24 of them
  `no-explicit-any` directly)," or otherwise state only numbers that
  trace to a real note.
- (b): "9 any-removal phases" → "7 any-removal phases" (phases 2-8,
  #179-#185), matching item 4's own framing.
- (c): either cite real, evidence-traceable numbers (e.g. the 31
  `(req as any)` casts in `BaseController.ts` found in
  `type-crud-core-seal.md`, correctly labeled as `req`-casts not generic
  `any`) or drop the parenthetical example entirely rather than present
  unverifiable figures as fact.

Everything else in the section (claims 1, 3, 4, the fix prescription,
diagram row text, diff scope) checks out and does not need to change.
