# 2026-09-28 — fix-chrome-executable-path (verifier verdict)

- Worker: verifier (subagent, dispatched via Agent tool)
- Node: `fix-chrome-executable-path` (`haven/diagrams/dev-loop.prime-mermaid.md`)
- New PM status: PENDING → **SEALED**

## Isolation proof

Dispatched as an independent Agent-tool subagent whose task description
reads "Independent verifier pass for fix-chrome-executable-path" — a
fresh context with no memory of the implementer session that produced
`evidence/implementer/2026-09-28/fix-chrome-executable-path-plan.md`.
Nothing in this session's history references having written that diff.

## Reasoning

Read only the evidence note first (EvidenceOnly), then independently
confirmed the note's specific factual citations against the real source
tree — verifying citations, not re-deriving the diff.

**Trace to exactly one diagram node** — `fix-chrome-executable-path`,
confirmed at `haven/diagrams/dev-loop.prime-mermaid.md` line 58, PENDING
before this pass (task correctly resolves to GitHub issue #154, filed
directly against this node per the issue's own footer).

**Test command matches convention** — `npm test` matches
`doctrine/MEMORY.md`'s documented `npm test` = `jest --passWithNoTests`.

**Output not truncated** — the note's `npm test` tail shows complete
summary lines (`Test Suites: 26 passed, 26 total` / `Tests: 142 passed,
142 total`), no ellipsis or redaction markers.

Issue #154 acceptance criteria, read via `gh issue view 154`, walked one
at a time:

1. **PDF export works with no hardcoded path assumption** — independently
   read `src/services/createPDF.ts` (full `executablePath` block, lines
   26-31). Confirmed: no hardcoded path literal anywhere in the file;
   `const executablePath = process.env.PUPPETEER_EXECUTABLE_PATH;` spread
   conditionally into `puppeteer.launch()`'s options. Matches the note's
   quoted excerpt verbatim.
2. **Works both with bundled Chromium and an externally-installed one via
   `PUPPETEER_EXECUTABLE_PATH`** — independently ran
   `git diff src/__tests__/services/createPDF.test.ts` and read the full
   diff. Confirmed: new `createCV executablePath resolution (issue #154)`
   describe block, `jest.mock('puppeteer', () => ({ launch: jest.fn() }))`
   (no real browser spawned), two tests — one asserts
   `puppeteer.launch` called with no `executablePath` key when the env
   var is unset, one asserts it's called with the exact override value
   when set. Both invoke the real `createCV` end-to-end against a fake
   browser/page. Matches the note's description exactly, no
   overstatement. Also independently confirmed the note's claim that this
   fix was already Docker-live-verified: `add-docker-support`'s own
   SEALED row (line 81 of the diagram) states Chromium is installed via
   `apt` with `PUPPETEER_EXECUTABLE_PATH` set and explicitly calls out
   this as "exactly the CI/Docker case the existing
   `fix-chrome-executable-path` trap... warns about; live-verified
   working" — corroborates independent of the implementer's own note.
3. **`createPDF.test.ts` still passes; executable-path coverage added** —
   confirmed via the same `git diff` read above (coverage added) and the
   note's `npm test` output (142/142 passed, up from a 140 baseline plus
   the 2 new tests, no new suite since it's an existing file).

**Hub bytes accounting** — recomputed the 5-category byte sum (root +
doctrine excl. archive + active diagram excl. archive +
`haven/workers/implementer/` + `haven/workers/verifier/`) before touching
anything: got exactly 88066, matching the note's declared
`hub_bytes_before`. Confirms the note used the real formula, not a guess.

## Forbidden states scan

- `ADHOC_WORK` — no; node exists on the diagram, worker identity declared.
- `NO_EVIDENCE` — no; evidence note present at the cited path.
- `EDIT_UNVERIFIED` — no; every claim in the note checked out against the
  real diff/source above.
- `CODE_IN_HAVEN` — no; no runnable code in `haven/`, only this markdown
  diagram edit.
- `DIAGRAM_DRIFT` — no; that's the condition this SEAL resolves (row was
  stale PENDING, now updated to match the live code + new test coverage).

## Seal gate

Confirmed via `git status --short` on branch `154-puppeteer-chrome-executable`:
only a locally modified `src/__tests__/services/createPDF.test.ts` and an
untracked evidence note — nothing committed, nothing pushed. Matches the
note's own "no outward-facing action taken" claim.

## Proportion (SmallestDiff)

1 existing test file extended, 0 production changes. Proportionate: the
underlying fix has been live and Docker-verified for 3+ weeks (since
`add-docker-support`/#24); the only real gap was missing regression
coverage, which this diff closes directly.

## Re-run

`none` — audit-only. Not an outward-facing action, not a release gate;
independently re-read the actual diff/source files cited rather than
re-running the suite. All figures (test counts, hub bytes) were
cross-checked against independently-verifiable facts (the diff itself,
the diagram's own `add-docker-support` row, the byte-count formula) rather
than taken purely on the note's word.
