# 2026-09-28 — add-bulk-import-cv-sections (implementer plan)

- Worker: implementer
- Version: 0.1.0
- Node: `add-bulk-import-cv-sections` (`haven/diagrams/dev-loop.prime-mermaid.md`)
- Task (verbatim): Bulk import endpoint for CV sections (issue #161): Add a
  bulk-create endpoint per CV section (e.g. POST /api/v1/education/bulk,
  POST /api/v1/experience/bulk, ...), accepting an array of entries and
  creating them in one request under the authenticated candidate's
  candidateId (never client-supplied, same IDOR-safe pattern as every other
  write path). Natural pairing with the LinkedIn-export-parse flow: parse ->
  review client-side -> bulk-save. Open questions to resolve during
  implementation: which sections need it first (likely education/experience
  only, matching what LinkedIn export currently parses), partial-failure
  behavior (all-or-nothing vs best-effort per-item report), and whether to
  reuse createCrudService() (BaseService.ts) with a new handlerBulkCreate or
  a dedicated bulk-only path. Acceptance criteria: bulk endpoint(s) create
  multiple entries under the authenticated candidate only; validation
  applies per-entry (same Joi schemas as existing single-create routes);
  response reports what succeeded/failed per item (if best-effort) or a
  single success (if transactional).

## Hub bytes before: 97923

## Open questions resolved
- Scope: education + experience only (issue's own recommendation — matches
  what `parseLinkedInExport.service.ts`/#141 currently parses). Not applied
  to the other 5 CV-section-like collections (award/certificate/project/
  reference/generalInformation) or application/profile — own follow-up node
  if a section beyond LinkedIn's scope needs it.
- Partial-failure behavior: best-effort, per-item report — matches the
  acceptance criteria's "if best-effort" branch and how `baseGetAll`
  already reports partial states (pagination) rather than an all-or-nothing
  transaction, which Mongoose (no multi-document ACID transaction already
  wired anywhere in this codebase) would add real new complexity for.
- Reuse vs dedicated path: reused `createCrudController()`
  (`BaseController.ts`) with a new `fnBulkCreate`, calling the SAME
  `service.handlerCreate` each existing single-create route already calls
  and validating each item against the SAME Joi `schema` each section
  already passes in. No changes needed to `BaseService.ts` or
  `services/index.ts` — `baseCreateDocument` already validates+creates one
  document at a time correctly, looping over it per item was sufficient.

## Diff
| File | Why |
|---|---|
| `src/candidate_profile/BaseController.ts` | New `MAX_BULK_ITEMS = 100` cap + new `fnBulkCreate` returned from `createCrudController()`. Forces `candidateId` from `(req as any).user?._id` onto every array item before validation (verifyToken only forces `req.body.candidateId` at the top level, never touching entries nested inside `req.body.items` — same IDOR-safe pattern as every other write path, applied at the per-item level here). Validates each item with the section's own Joi `schema`, calls the section's own `service.handlerCreate` per valid item, collects `{index, ...result}` per item, returns `{results, summary: {total, succeeded, failed}}`. |
| `src/candidate_profile/education/education.controller.ts` | Destructure+export the new `fnBulkCreate` alongside the existing `fnCreate`/`fnUpdate`. |
| `src/candidate_profile/experience/experience.controller.ts` | Same. |
| `src/routers/api/v1/education.route.ts` | New `POST /bulk` route + swagger doc, mounted before `/update` (no path collision with existing routes). |
| `src/routers/api/v1/experience.route.ts` | Same. |
| `src/locales/en.ts`, `src/locales/vi.ts` | 2 new `common.*` i18n keys: `bulkNoItems`, `bulkTooManyItems` (for the 2 new 400 rejection paths — no items sent / more than 100 items in one request). |
| `src/__tests__/candidate_profile/BaseController.test.ts` | 5 new tests for `fnBulkCreate` (new `describe` block, existing `baseGetAll` tests untouched). |
| `agent-hub/haven/diagrams/dev-loop.prime-mermaid.md` | New PENDING row for this node, appended at the end of the PM status table (AppendOnly). |

## Bug found during implementation
`src/utils/helper.ts`'s `formatResponse()` (lines ~178-186) nulls out
`data` whenever the response envelope's `success` is `false`:
```ts
const getData = (() => {
  if (!success) return null;
  ...
  return data;
})();
```
A naive `fnBulkCreate` that set the envelope `success: summary.failed === 0`
would have silently dropped `results`/`summary` from the response body on
every partial failure — exactly the one case the acceptance criteria
("response reports what succeeded/failed per item") needs it most. Fixed
in this diff by keeping the envelope `success: true` always (the bulk
request itself was processed successfully; per-item pass/fail lives in
`results[].success` and `summary`, not the envelope) — commented in both
the implementation and the regression test that asserts it
(`BaseController.test.ts`, "is best-effort: one invalid item does not
block the others, and results/summary are still returned on partial
failure"). Not added to `doctrine/domains/PROJECT.md`'s Traps table — this
is pre-existing infra behavior every OTHER caller already works around by
never setting `success: false` with a real `data` payload; flagging it
here as a footgun for any future non-bulk caller that tries to do the same
is a documentation call for the operator, not fixed in this diff (would be
a behavior change to `formatResponse()` itself, out of scope for #161).

## Command
`npm test` (from `/Users/_david/Workspace/Project/resume/resume-nodejs-api`)

## Output (verbatim, tail)
```
PASS src/__tests__/candidate_profile/BaseController.test.ts
  baseGetAll
    ✓ passes page/limit/sort through as numbers/string when present (1 ms)
    ✓ omits page/limit/sort when the query string has none (backward compatible)
    ✓ silently drops a sort value that could smuggle a Mongo operator (1 ms)
    ✓ accepts a leading "-" in sort for descending order
  createCrudController -> fnBulkCreate (issue #161)
    ✓ rejects with 400 when items is missing or not an array
    ✓ rejects with 400 when items exceeds the 100-item cap
    ✓ forces candidateId from the authenticated user onto every item, ignoring a client-supplied value (IDOR-safe) (1 ms)
    ✓ is best-effort: one invalid item does not block the others, and results/summary are still returned on partial failure (2 ms)
    ✓ reports summary.failed: 0 when every item succeeds

A worker process has failed to exit gracefully and has been force exited. This is likely caused by tests leaking due to improper teardown. Try running with --detectOpenHandles to find leaks. Active timers can also cause this, ensure that .unref() was called on them.
Test Suites: 29 passed, 29 total
Tests:       155 passed, 155 total
Snapshots:   0 total
Time:        9.312 s
Ran all test suites.
```
(The "worker process failed to exit gracefully" warning is a pre-existing
Jest/open-handle notice unrelated to this diff — every suite still passed,
0 failures.)

Also ran `npm run build` (tsc && copy) — clean, no output beyond the copy
step, no typecheck errors.

## Acceptance
| Criterion | Evidence |
|---|---|
| Bulk endpoint(s) create multiple entries under the authenticated candidate only | `fnBulkCreate` forces `candidateId` from `(req as any).user?._id` onto every item before validation, never trusting a client-supplied value — `BaseController.ts` lines in the `fnBulkCreate` block; regression test "forces candidateId from the authenticated user onto every item, ignoring a client-supplied value (IDOR-safe)" — `Tests: 155 passed, 155 total` includes this test |
| Validation applies per-entry (same Joi schemas as existing single-create routes) | `fnBulkCreate` calls `validateSchema({ schema, item: {...items[index], candidateId}, lang })` per item using the SAME `schema` param already passed to `createCrudController()` for `/create` — no new schema. Regression test "is best-effort: one invalid item does not block the others..." proves an invalid item (`{name: 'x'}`, fails `min(2)`) is rejected per-item while the valid sibling item still reaches `service.handlerCreate` |
| Response reports what succeeded/failed per item (best-effort) | `data: { results, summary }` where `results[i]` carries `{index, success, message, data/errors}` per item and `summary = {total, succeeded, failed}`. Regression tests "is best-effort..." (`summary: {total:2, succeeded:1, failed:1}`) and "reports summary.failed: 0 when every item succeeds" (`summary: {total:2, succeeded:2, failed:0}`) both pass |

## Noticed, not done
- Scope limited to education/experience — the other CV-section-like
  collections (award/certificate/project/reference/generalInformation,
  application, profile) don't have a bulk-create route. Matches the
  issue's own open question guidance ("likely education/experience only");
  own follow-up node if a wider section needs it.
- No transactional (all-or-nothing) mode — best-effort only. The issue's
  acceptance criteria explicitly allows either; best-effort was chosen
  since no Mongo multi-document transaction wiring exists anywhere else in
  this codebase (would be new infrastructure, not proportionate to this
  task).
- `formatResponse()`'s success-nulls-data behavior (see "Bug found during
  implementation" above) is pre-existing, not touched — flagged for the
  operator as a possible footgun for a future caller, not a regression
  introduced here.

## Seal gate
Not applicable to this recipe step — no outward-facing action (commit,
push, delete, external API call) has happened yet. All changes are in the
local working tree on branch `161-bulk-import-endpoint`, unstaged/staged
but not committed. The `src/` diff itself was shown in full in the session
transcript, matching the seal-gate spirit even though nothing outward-
facing has been requested yet — commit/push waits for `/ship` (not invoked
this round; `/todo` was run without `--ship`).
