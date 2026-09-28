# 2026-09-28 — add-bulk-import-cv-sections (verifier verdict)

- Worker: verifier (subagent, dispatched via Agent tool)
- Node: `add-bulk-import-cv-sections` (`haven/diagrams/dev-loop.prime-mermaid.md`)
- New PM status: SEALED

## Isolation proof
Dispatched as a fresh Agent-tool subagent with the task description "You
are the `verifier` worker in this repo's agent-hub... Run `verify_seal`
for node `add-bulk-import-cv-sections`" — a spawn string the implementer
session never saw. No conversation history with the implementer pass;
every fact below was re-derived by reading the working tree, the note,
and re-running `npm test`/`npm run build` in this session, not carried
over from any prior context.

## Reasoning
1. **Diff scope** — `git status --short` on branch `161-bulk-import-endpoint`
   showed exactly the 9 files the note claims (`agent-hub/haven/diagrams/
   dev-loop.prime-mermaid.md`, `src/__tests__/candidate_profile/
   BaseController.test.ts`, `src/candidate_profile/BaseController.ts`,
   `src/candidate_profile/education/education.controller.ts`,
   `src/candidate_profile/experience/experience.controller.ts`,
   `src/locales/en.ts`, `src/locales/vi.ts`, `src/routers/api/v1/
   education.route.ts`, `src/routers/api/v1/experience.route.ts`) plus
   the untracked evidence note. Nothing else touched; no commit/push.

2. **`BaseController.ts` — `fnBulkCreate` (read in full)**:
   - `const candidateId = (req as any).user?._id;` then every item is
     validated as `{ ...items[index], candidateId }` — client-supplied
     `candidateId` inside an array item is overwritten before
     `validateSchema` ever sees it. Confirmed this is genuinely necessary
     (not redundant with `verifyToken`) by reading `verifyToken.
     middleware.ts` — it only assigns `req.body.candidateId = req.user._id`
     at the top level, never touches nested array entries.
   - Uses the SAME `schema` param already passed into
     `createCrudController()` for `fnCreate`/`fnUpdate` — no second/looser
     schema introduced.
   - Calls `service.handlerCreate` per item — the identical service call
     `fnCreate` uses. No bypass of `BaseService.ts`/`services/index.ts`.
     Read `baseCreateDocument` in `services/index.ts`: it already returns
     `{ success, message, data, errors }`, which is exactly the shape
     `fnBulkCreate` spreads into `results[]` and filters on
     `r.success` — consistent, not assumed.
   - `MAX_BULK_ITEMS = 100` hard cap; `!items || !items.length` and
     `items.length > MAX_BULK_ITEMS` both return 400 via `t('common.
     bulkNoItems'|'bulkTooManyItems', lang)`.
   - **Bug-avoidance claim independently verified, not trusted from the
     note**: read `utils/helper.ts`'s `formatResponse()` end-to-end —
     `const getData = (() => { if (!success) return null; ... })()`
     really does null `data` whenever the envelope's `success` is falsy.
     Read `fnBulkCreate`'s final `formatReturn` call — `success: true`
     is hardcoded, never `summary.failed === 0`, with the comment
     explaining why. Traced `formatReturn` → `formatResponse` to confirm
     the real call chain, not just the test mock. Had `fnBulkCreate` used
     `summary.failed === 0` instead, a partial-failure response would
     have `data: null`, breaking the "response reports what succeeded/
     failed per item" acceptance criterion — this was genuinely avoided.

3. **Controllers** — `education.controller.ts` and `experience.
   controller.ts` both now `export const { fnCreate, fnUpdate,
   fnBulkCreate } = createCrudController({...})` — the `createCrudController`
   call itself is otherwise unchanged (same `schema`/`service`/
   `booleanDefaultField` args), only the destructured export set grew.

4. **Routes** — both `education.route.ts` and `experience.route.ts` add
   `router.post('/bulk', fnBulkCreate)` (plus a swagger block), positioned
   between `/create` and `/update` — no collision with `/`, `/create`,
   `/update`, `/delete/:id`, `/restore/:id`. Confirmed in `routers/api/v1/
   index.ts` that both routers are mounted `router.use('/education',
   verifyToken, routeEducation)` / `router.use('/experience', verifyToken,
   routeExperience)` — `req.user._id` is genuinely populated by the time
   `fnBulkCreate` runs.

5. **i18n** — `common.bulkNoItems`/`common.bulkTooManyItems` exist in both
   `src/locales/en.ts` and `src/locales/vi.ts` (grep-confirmed at line
   47-48 in both files) and are the exact keys referenced by
   `fnBulkCreate`'s two 400 branches.

6. **Tests** — read `src/__tests__/candidate_profile/BaseController.test.ts`
   in full (143 lines). The 4 pre-existing `baseGetAll` tests are present
   and unchanged. The new `describe('createCrudController -> fnBulkCreate
   (issue #161)')` block has exactly 5 tests, each doing real assertion
   work, not just "was called":
   - missing/non-array `items` -> 400, `handlerCreate` never called.
   - 101 items -> 400, `handlerCreate` never called.
   - a client-supplied `candidateId: 'someone-elses-id'` on the one item
     is overwritten — `expect(handlerCreate).toHaveBeenCalledWith(
     expect.objectContaining({ candidateId: 'real-user' }), 'en')` is a
     concrete, non-vacuous IDOR assertion.
   - one invalid item (`name: 'x'`, fails `min(2)`) + one valid item ->
     `handlerCreate` called exactly once, `res.status(201)`,
     `payload.data.summary` equals `{ total: 2, succeeded: 1, failed: 1 }`,
     `results[0]`/`results[1]` assert `success: true`/`false` respectively.
     Note this test does NOT mock `@/utils` — only `@/services` is
     `jest.mock`ed — so `payload.success === true` on this partial-failure
     path is exercising the REAL `formatReturn`/`formatResponse` chain,
     genuinely proving the bug-avoidance claim in criterion 2 above, not
     just a mocked assertion.
   - all-success case: `summary` equals `{ total: 2, succeeded: 2,
     failed: 0 }`.

7. **`npm test` — independently re-run** (not audit-only; see Re-run
   below) from `/Users/_david/Workspace/Project/resume/resume-nodejs-api`:
   ```
   Test Suites: 29 passed, 29 total
   Tests:       155 passed, 155 total
   Snapshots:   0 total
   Time:        6.273 s, estimated 9 s
   Ran all test suites.
   ```
   Matches the note's claimed `29 passed, 29 total` / `155 passed, 155
   total` exactly. (Same pre-existing "worker process failed to exit
   gracefully" Jest open-handle notice as the note describes, unrelated
   to this diff.)

8. **`npm run build` — independently re-run**: `tsc && npm run copy`
   completed with no output beyond the `cp -R ./src/views ./src/public
   ./dist/` copy step — clean, no typecheck errors.

9. **Traps/invariants** (`doctrine/domains/PROJECT.md`) — this diff does
   not touch `QuerySafe`, bcrypt, the Chrome path, CORS, or body-size
   limit traps. It still goes through Joi validation (`schema` param,
   unchanged), still forces `candidateId` server-side (now per-item, on
   top of the existing top-level force), and never trusts raw
   `req.body.items[i].candidateId`. No new trap introduced; none of the
   existing 7 Traps table rows are reintroduced.

10. **Diagram AppendOnly** — before this verdict, the `add-bulk-import-
    cv-sections` row was the LAST row of the PM status table, immediately
    before the "Any regression must be a new node" closing note —
    confirmed by reading the file directly (not inferred), so the
    implementer appended correctly, not mid-table.

## Re-run
`full` — re-ran both `npm test` and `npm run build` independently from
scratch (not audit-only), because the task explicitly directed
independent verification of the real source (not just the note's prose)
for a change that alters the codebase's IDOR-safety surface (per-item
`candidateId` forcing on a new write path) — the same class of
security-sensitive diff this hub has previously chosen full re-run for
(e.g. `add-csrf-protection-auth-cookies`, `add-cv-profile-selection`).
Also independently read every file in the diff plus the files the note's
claims depend on (`verifyToken.middleware.ts`, `routers/api/v1/index.ts`,
`utils/helper.ts`, `services/index.ts`) rather than only auditing the
note's prose.

## Hub bytes
`hub_bytes_before: 97923` (from the implementer note)
`hub_bytes_after: 100436` (measured after updating PM status to SEALED,
same 5-category `/hub-tokens` per-session-total formula: root .md files +
doctrine/ + active `haven/diagrams/` file + implementer worker bundle +
verifier worker bundle, raw byte counts summed)
