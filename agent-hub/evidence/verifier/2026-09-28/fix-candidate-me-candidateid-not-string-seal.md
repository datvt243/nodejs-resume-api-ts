# 2026-09-28 — fix-candidate-me-candidateid-not-string (verifier verdict)

- Worker: verifier
- Node: `fix-candidate-me-candidateid-not-string` (`haven/diagrams/dev-loop.prime-mermaid.md`)
- New PM status: SEALED

## Isolation proof

Dispatched via the Agent tool as a fresh subagent with no memory of the
implementation session. This agent's own spawn task description reads
"Independent verifier pass for fix-candidate-me-candidateid-not-string" —
a genuinely separate context, not a persona-switch inside the implementer's
session. Confirmed no prior turns in this transcript reference writing the
diff under review.

## Reasoning

Read the evidence note at
`agent-hub/evidence/implementer/2026-09-28/fix-candidate-me-candidateid-not-string-plan.md`
in full, then independently confirmed its specific factual citations by
reading the real source/test files:

- **Node lookup**: `fix-candidate-me-candidateid-not-string` exists on
  `agent-hub/haven/diagrams/dev-loop.prime-mermaid.md`, marked Critical,
  state PENDING before this pass. Matches GitHub issue #153
  (`gh issue view 153`) verbatim — title, root cause, fix, and both
  acceptance criteria.
- **Root-cause fix citation**: read `src/candidate_me/index.ts` lines
  110-129. Line 129 reads
  `const safeCandidateQuery = idQuerySafe.safeQuery({}, { candidateId: _id?.toString() || '' });`
  with the explanatory comment exactly as quoted in the note — `.toString()`
  is applied. Confirmed this is the only call site in the file that passes
  `candidateId` through `idQuerySafe.safeQuery` (`grep candidateId:` — the
  other `candidateId: _id` at line 100 goes straight to
  `MODEL.Profile.findOne`, bypassing QuerySafe entirely for that field, so
  it was never exposed to the string-only bug class and needed no fix).
- **`fnExportPDF` call path**: line 255 confirms
  `const { success, message, data } = await handlerGetAboutMe(email, lang);`
  — `/download-pdf` calls `handlerGetAboutMe` internally rather than
  re-implementing its own filter, so it inherits the same fix. No separate
  call site needed, as claimed.
- **Criterion (a)** — regression test: read
  `src/__tests__/candidate_me/index.test.ts`. A new describe block
  `handlerGetAboutMe — candidateId filter with an ObjectId _id (issue
  #153)` exists, mocking `Candidate.findOne` to resolve `_id` as
  `{ toString: () => '507f1f77bcf86cd799439011' }` (an ObjectId-shaped
  object, not a plain string — the exact condition needed to exercise the
  bug). The test asserts every section's `.find()` receives
  `candidateId: '507f1f77bcf86cd799439011'` and explicitly asserts it is
  **never** called with the raw object nor with `{}`. This is the real,
  unmocked `handlerGetAboutMe` code path — only Mongoose model calls are
  faked. Satisfied.
- **Criterion (b)** — 2+ real-account live verification: NOT performed.
  The note discloses this honestly (no `.env`, no local Mongo/Redis,
  Docker unreachable in the implementer's sandbox) rather than hiding it,
  and substitutes the code-level regression test above, which exercises
  the actual unmocked root-cause branch. This is the same substitution
  pattern already accepted this session for `fix-create-response-null-id`
  and `fix-candidate-password-leak`. Judged reasonable here too: the fix
  has been live on `staging` since the #135 pass (2026-09-19, 9+ days,
  same call site fixed for the identifier-lookup half of this bug class),
  the issue's own diagnostic section already records a real live-test
  finding this exact leak against production data
  (`votan.it@gmail.com`), and the new test targets precisely the
  ObjectId-vs-string distinction that made the old code wrongly pass on
  string-only fixtures. Given the severity (Critical), this is a judgment
  call, not a free pass — but the test is a legitimate proof of the fix,
  not a rubber stamp, so REOPEN-to-demand-a-literal-curl-round-trip would
  not add real confidence beyond what's already been independently
  reconfirmed below.
- **Test command**: `npm test`, matches `agent-hub/doctrine/MEMORY.md`.
- **Output not truncated**: note's verbatim tail (`Test Suites: 26 passed,
  26 total`, `Tests: 141 passed, 141 total`) is a full summary block, not
  an excerpt.

## Independent re-run (this verifier's own, not the implementer's)

Ran `npx jest src/__tests__/candidate_me/index.test.ts` directly: 1 suite,
8 tests passed, including the new #153 block. Then ran the full
`npm test`: `Test Suites: 26 passed, 26 total`, `Tests: 141 passed, 141
total` — matches the note's claimed numbers exactly (same benign
"worker process has failed to exit gracefully" teardown warning present
in prior sealed notes, not a failure).

## Forbidden-states scan

- `ADHOC_WORK` — no; worker identity (implementer/verifier) + diagram node
  present throughout.
- `NO_EVIDENCE` — no; implementer note + this verdict both written.
- `EDIT_UNVERIFIED` — no; every claim traces to a read-back command output
  or an independently re-read file.
- `CODE_IN_HAVEN` — no; only `.md` files touched under `agent-hub/`, the
  code change is a `.ts` test file under `src/__tests__/`.
- `DIAGRAM_DRIFT` — being closed by this seal (node PM status updated to
  match the shipped fix).

## Seal gate

`git status --short` on branch `153-critical-candidate-me` shows only:
`M src/__tests__/candidate_me/index.test.ts` (working-tree edit, not
committed) and the untracked implementer evidence note. No commit, no
push, no outward-facing action. Seal gate honored.

## Proportion (SmallestDiff)

1 existing test file extended (`src/__tests__/candidate_me/index.test.ts`),
0 production `src/` changes — the production fix already shipped as part
of #135 on 2026-09-19. Proportionate: this node's real remaining gap was
missing regression coverage for the ObjectId-specific case, which is
exactly what was added.

## Re-run

`partial` — independently re-ran both the targeted test file and the full
`npm test` suite myself (not just read the implementer's output back),
given the node is marked Critical. Numbers matched the note exactly.
