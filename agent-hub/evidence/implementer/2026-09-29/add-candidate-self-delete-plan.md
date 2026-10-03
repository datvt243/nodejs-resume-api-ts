# 2026-09-29 — add-candidate-self-delete (implementer plan)

- Worker: implementer
- Version: 0.1.0
- Node: `add-candidate-self-delete` (`haven/diagrams/dev-loop.prime-mermaid.md`)
- Task (verbatim): Candidate self-delete (issue #158): DELETE
  /api/v1/candidate, authenticated, using only req.user._id (never a
  client-supplied id, same IDOR-safe pattern as fix-idor-broken-access-control).
  Must cascade-delete the candidate's data across all CV section models
  (education/experience/award/certificate/project/reference/generalInformation,
  plus application/profile since those now exist) by candidateId, and clean
  up any uploaded files (CV PDF, section images) tied to that candidate.
  Acceptance criteria: DELETE /api/v1/candidate removes the candidate
  document and every CV-section document owned by that candidate; uploaded
  files (resume PDF, section images) are removed from disk, not just
  orphaned; a candidate cannot delete another candidate's account under any
  input (id always comes from req.user._id); regression test covers the
  cascade across all section models. Diagram node: add-candidate-self-delete
  (currently PENDING).

## Hub bytes before: 100436

## Finding: already fully implemented, bookkeeping-gap backfill
Same pattern as `fix-idor-broken-access-control`/`fix-candidate-password-leak`/
`fix-create-response-null-id`: reading the real code shows the feature is
already 100% live and correct, just never backfilled with a diagram node
transition or evidence.

- `DELETE /api/v1/candidate` -> `fnDelete` (`src/candidate/candidate.controller.ts:157-168`)
  -> `handlerDelete` (`src/candidate/candidate.service.ts:118-148`). Introduced
  by commit `32953ed` ("feat: add DELETE /api/v1/candidate for self-service
  account deletion"), predating this hub's own history (before commit
  `f355e2f`'s bug-fix batch, 2026-08-21) — this node has simply sat PENDING
  on the diagram since the hub started tracking it.
- `fnDelete` reads NO client-supplied id anywhere — it calls
  `handlerDelete((req as any).user?._id, (req as any).lang)` directly, no
  body/params/query id read at all. Structurally IDOR-safe by construction,
  not just by convention (nothing to override even if a client tried).
- `routers/api/v1/index.ts:27` — `router.use('/candidate', verifyToken,
  routeCandidate)` — confirms the whole `/candidate` router (including this
  route) sits behind `verifyToken`, so `req.user._id` is genuinely populated
  by the time `fnDelete` runs.
- `handlerDelete` (`candidate.service.ts:20-30`) already has a
  `CV_SECTION_MODELS` array covering ALL 9 models: `generalInformation`,
  `Experience`, `Education`, `Reference`, `Project`, `Certificate`, `Award`,
  `Application`, `Profile` — the last 2 were added later, 1-line-each, by
  `add-application-tracker`/#132 and `add-cv-profile-selection`/#133
  specifically so this cascade wouldn't orphan those newer sections (both
  those nodes' own evidence/diagram rows call this out explicitly). Confirms
  the "plus application/profile since those now exist" part of the task is
  already satisfied.
- File cleanup on disk already implemented: `CV_UPLOAD_DIR`/`{_id}-cv.pdf`
  resume PDF (`candidate.service.ts:136-139`), plus every
  project/certificate/award image (`IMAGE_SECTION_MODELS`, images collected
  via `.find({candidateId}, {images:1})` BEFORE those documents are deleted,
  then `fs.unlinkSync` per file, `candidate.service.ts:123-131,141-145`).

The real remaining gap this node closes: **zero regression tests existed**
for `handlerDelete` (confirmed via `grep -rn "handlerDelete" src/__tests__`
before this diff — no hits) — exactly the issue's own 4th acceptance
criterion ("Regression test covers the cascade across all section models").

## Diff
| File | Why |
|---|---|
| `src/__tests__/candidate/candidate.service.test.ts` | New `handlerDelete` describe block (5 tests), appended to the existing file (already covers `candidate.service.ts`'s other handlers for issue #152). Extended the shared `jest.mock('@/models', ...)` factory to give `deleteMany`/`deleteOne`/`find` real `jest.fn()`s instead of `{}` placeholders — needed by `handlerDelete`, doesn't affect the pre-existing #152 tests (they only ever touch `Candidate.findOne`/`findById`). 0 production changes — the feature was already correct. |

## Bug found and fixed during implementation (self-caught, in the test file only)
First attempt used `jest.mock('fs')` at the top of `candidate.service.test.ts`
to control `existsSync`/`unlinkSync`. `jest.mock()` calls are hoisted by
ts-jest/babel to run BEFORE the file's own `import` statements — so the
auto-mocked `fs` was already in place when `candidate.service.ts`'s import
chain (`utils/index.ts` -> `utils/bcrypt.ts` -> `bcrypt`) transitively
loaded the real `bcrypt` package, whose `@mapbox/node-pre-gyp` native-binding
resolver calls a REAL `fs.existsSync()` to find its own `package.json` at
import time. With `fs` auto-mocked, that call returned `undefined`, and the
whole suite failed to load: `node_modules/bcrypt/package.jsondoes not exist`.
Confirmed real (not a fluke): reproduced consistently, confirmed `bcrypt`
loads fine standalone via plain `node -e "require('bcrypt')"`, and traced
the stack trace to `pre-binding.js` inside `candidate.service.ts`'s own
import chain. Fixed by switching to `jest.spyOn(fs, 'existsSync')`/
`jest.spyOn(fs, 'unlinkSync')` in `beforeEach` instead — `jest.spyOn` is a
normal runtime statement, not hoisted, so it only takes effect after every
import (including bcrypt's) has already resolved for real. `afterEach(() =>
jest.restoreAllMocks())` added to fully restore `fs` after this describe
block. Not added to `doctrine/domains/PROJECT.md`'s Traps table — this is a
test-authoring footgun specific to `jest.mock('fs')` + any module in the
same file's import graph that needs real `fs` at load time (bcrypt here),
not a `src/` runtime bug; noted here for whoever writes the next fs-mocking
test in this codebase.

## Command
`npm test` (from `/Users/_david/Workspace/Project/resume/resume-nodejs-api`)

## Output (verbatim, tail)
```
A worker process has failed to exit gracefully and has been force exited. This is likely caused by tests leaking due to improper teardown. Try running with --detectOpenHandles to find leaks. Active timers can also cause this, ensure that .unref() was called on them.
Test Suites: 29 passed, 29 total
Tests:       160 passed, 160 total
Snapshots:   0 total
Time:        7.634 s, estimated 12 s
Ran all test suites.
```
(The "worker process failed to exit gracefully" warning is the same
pre-existing Jest/open-handle notice seen on prior nodes this session,
unrelated to this diff — every suite still passed, 0 failures. 160 = 155
baseline, from the immediately preceding sealed node `add-bulk-import-cv-sections`
this session, + 5 new `handlerDelete` tests.)

Also ran `npm run build` (tsc && copy) — clean, no typecheck errors, no
output beyond the copy step.

## Acceptance
| Criterion | Evidence |
|---|---|
| `DELETE /api/v1/candidate` removes the candidate document and every CV-section document owned by that candidate | `handlerDelete` (`candidate.service.ts:133-134`) — `Promise.all(CV_SECTION_MODELS.map(...deleteMany({candidateId:_id})))` then `MODEL.deleteOne({_id})`. Regression test "cascades deleteMany({candidateId}) across every CV section model, then deletes the candidate document itself" asserts all 9 models' `deleteMany` called with `{candidateId: 'cand1'}` AND `Candidate.deleteOne` called with `{_id: 'cand1'}` — part of `Tests: 160 passed, 160 total` |
| Uploaded files (résumé PDF, section images) are removed from disk, not just orphaned | `candidate.service.ts:136-145` — `fs.unlinkSync` on the CV file path and every collected image path, gated by `fs.existsSync`. 3 regression tests: "removes the candidate's uploaded CV file from disk when one exists", "never calls unlinkSync for a CV file that does not exist on disk", "removes every project/certificate/award image file from disk, collected before those documents are deleted" — all pass |
| A candidate cannot delete another candidate's account under any input (id always comes from req.user._id) | `fnDelete` (`candidate.controller.ts:157-168`) never reads any id from `req.body`/`req.params`/`req.query` — only `(req as any).user?._id`, populated exclusively by `verifyToken` (confirmed via `routers/api/v1/index.ts:27` mounting `/candidate` behind `verifyToken`). Structural guarantee, not test-covered at the controller layer per this codebase's own established convention (see `candidate.controller.test.ts`'s file header: "the rest of candidate.controller.ts is thin wiring already covered indirectly elsewhere, same precedent as every other controller in this codebase") — `fnDelete` has zero branching/logic to unit-test beyond what's already visible by inspection |
| Regression test covers the cascade across all section models | 5 new tests in `src/__tests__/candidate/candidate.service.test.ts`'s new `handlerDelete (issue #158)` describe block, part of `Tests: 160 passed, 160 total` |

## Noticed, not done
- No controller-level test added for `fnDelete` itself — see the 3rd
  acceptance-criterion row above for why (zero logic to test beyond what
  the service-level tests + code inspection already prove; matches this
  codebase's own stated convention for thin controller wiring).
- The `jest.mock('fs')` -> `jest.spyOn(fs, ...)` footgun (see "Bug found and
  fixed" above) is worth a one-line addition to a future test-authoring
  note in `haven/workers/implementer/MEMORY.md`'s "Patterns that work here"
  (currently `<<FILL>>`) — not added in this diff, flagged for whoever
  next fills that section.

## Seal gate
Not applicable to this recipe step — no outward-facing action (commit,
push, delete, external API call) has happened yet. The single test-file
diff was shown in full in the session transcript. Commit/push waits for
`/ship` (not invoked this round; `/todo` was run without `--ship`).
