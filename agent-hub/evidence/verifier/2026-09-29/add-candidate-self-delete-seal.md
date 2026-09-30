# 2026-09-29 — add-candidate-self-delete (verifier verdict)

- Worker: verifier (subagent, dispatched via Agent tool)
- Node: `add-candidate-self-delete`
- New PM status: SEALED

## Isolation proof
Dispatched fresh via the Agent tool with the task string "Run verify_seal
for node `add-candidate-self-delete`, judging the evidence note at
`agent-hub/evidence/implementer/2026-09-29/add-candidate-self-delete-plan.md`"
— no memory of any implementer session, everything below was re-derived
independently from the repo (reading real files, running `git log`/`git
diff`/`git status`, re-running `npm test`/`npm run build` myself) rather
than trusted from the note's prose.

## Reasoning

1. **Diff matches the note's claim, genuinely minimal.** `git status
   --short` on `158-candidate-self-delete-allow`: only `M
   src/__tests__/candidate/candidate.service.test.ts` and the new
   untracked evidence-note directory. `git diff staging --stat -- src/`:
   1 file, `+122/-11`. No change to `candidate.service.ts`,
   `candidate.controller.ts`, or any route file — confirmed by their
   absence from the diff stat, not inferred.

2. **`candidate.service.ts` read in full.** `CV_SECTION_MODELS`
   (lines 20-30) lists all 9: generalInformation, Experience, Education,
   Reference, Project, Certificate, Award, Application, Profile.
   `handlerDelete` (118-148): `if (!(await MODEL.findById(_id))) return
   { success: false, ... }` before any delete call — confirmed no
   `deleteMany`/`deleteOne` is reachable on that branch. Then
   `Promise.all(CV_SECTION_MODELS.map(model => model.deleteMany({
   candidateId: _id })))` followed by `MODEL.deleteOne({ _id })`. Image
   filenames are collected via `IMAGE_SECTION_MODELS` (`[Project,
   Certificate, Award]`) `.find({candidateId}, {images:1})` BEFORE the
   cascade delete runs (lines 127-131, ordered strictly before line 133),
   then each image and the CV PDF (`CV_UPLOAD_DIR/{_id}-cv.pdf`) is
   `fs.unlinkSync`'d gated by `fs.existsSync` (136-145).

3. **`candidate.controller.ts`'s `fnDelete` read in full** (157-168): the
   only identifier used is `(req as any).user?._id`; the function body
   contains no reference to `req.body`, `req.params`, or `req.query`
   anywhere. Structural, not conventional.

4. **Routing read in full.** `routers/api/v1/index.ts:27` — `router.use(
   '/candidate', verifyToken, routeCandidate)` mounts the entire
   candidate router (including `DELETE /`) behind `verifyToken`.
   `candidate.route.ts:261` — `router.delete('/', fnDelete)`, no
   alternate/unauthenticated route to the same handler found anywhere in
   the file.

5. **Git history independently confirmed.** `git log --oneline -- src/
   candidate/candidate.service.ts | tail -20` shows `32953ed feat: add
   DELETE /api/v1/candidate for self-service account deletion`,
   chronologically before `f355e2f fix: close broken access control,
   password leak, and 3 other API bugs` in the same log — matches the
   note's claim exactly.

6. **Test diff read in full via `git diff staging`.** New `describe`
   block `candidate.service.ts handlerDelete (issue #158)` has exactly 5
   `it(...)` tests: not-found short-circuit (asserts `deleteOne` and
   every section's `deleteMany` NOT called), full 9-model cascade
   (asserts `deleteMany({candidateId:'cand1'})` on all 9 keys +
   `Candidate.deleteOne({_id:'cand1'})`), CV-file-exists-so-unlink,
   CV-file-missing-so-no-unlink, and project/certificate/award image
   cleanup collected before deletion. `grep -n "jest.mock('fs')"` in the
   file matches ONLY the explanatory code comment (line 92 context),
   never an actual `jest.mock('fs')` call; the file does use
   `jest.spyOn(fs, 'existsSync'/'unlinkSync')` in `beforeEach` and
   `jest.restoreAllMocks()` in `afterEach` — the self-reported bug/fix
   narrative is real, not just narrated. The shared `jest.mock('@/models',
   ...)` factory was extended in place (placeholders `{}` → real
   `{deleteMany: jest.fn()}` etc., `Project`/`Certificate`/`Award` also
   gained `find: jest.fn()`) — confirmed the pre-existing `describe(
   'candidate.service.ts password exclusion (issue #152)')` block (lines
   1-64) is byte-for-byte unmodified in the diff context and its 3 tests
   (`handlerGetInformationByEmail`, `handlerGetInformationById` x2) still
   read from the file untouched.

7. **`npm test` independently re-run** (not audit-only — self-selected
   given the unusual "0 production diff" claim, an explicit re-run
   scenario worth the cost here). Verbatim tail of my own run:
   ```
   Test Suites: 29 passed, 29 total
   Tests:       160 passed, 160 total
   Snapshots:   0 total
   Time:        8.24 s
   Ran all test suites.
   ```
   Matches the note's claimed `29 passed, 29 total` / `160 passed, 160
   total` exactly. Same pre-existing "worker process failed to exit
   gracefully" notice, unrelated to this diff (present on prior SEALED
   nodes too).

8. **`npm run build` independently re-run.** Output: `tsc && npm run
   copy` → `cp -R ./src/views ./src/public ./dist/`, no typecheck errors,
   clean. `git status --short` after build shows no new/stray changes
   (dist/ is gitignored, as expected).

9. **`doctrine/domains/PROJECT.md` Traps table checked** — none of the 7
   listed traps (Chrome path, CORS wildcard, body-size limit, auth
   validation skip, lint script, public/ static exposure, prod port)
   relate to this diff; nothing here reintroduces any of them.

10. **Controller-not-unit-tested reasoning checked directly.**
    `candidate.controller.test.ts`'s file header reads: "The rest of
    candidate.controller.ts is thin wiring already covered indirectly
    elsewhere, same precedent as every other controller in this
    codebase (not unit-tested per-function)." `fnDelete` itself is 12
    lines (157-168), a single try/catch, zero conditionals — a
    reasonable call given the codebase's own stated precedent, and the
    IDOR-safety claim (criterion 3) is structural (verified directly
    above), not something a controller-level mock test would add
    confidence to.

**Proportion**: diff is exactly 1 test file, 0 production code — smaller
than the node's own scope could have required (a naive implementer could
have "fixed" already-correct code); appropriately minimal, matches
`SmallestDiff`.

**Forbidden states scan**: `ADHOC_WORK` — no, real diagram node exists and
this ran through the verify_seal recipe. `NO_EVIDENCE` — no, implementer
note + this verdict note both exist. `EDIT_UNVERIFIED` — no, `npm test`/
`npm run build` were independently re-run and read back verbatim above,
not inferred. `CODE_IN_HAVEN` — no `.ts`/`.js` files were added to
`haven/`. `DIAGRAM_DRIFT` — being corrected by this SEAL (PM status now
matches the confirmed-live code state).

## Re-run
`full` — re-ran `npm test` (29/29 suites, 160/160 tests, matched exactly)
and `npm run build` (clean) myself from the repo root, plus independently
read every file the note cited (`candidate.service.ts`,
`candidate.controller.ts`, `routers/api/v1/index.ts`,
`candidate.route.ts`, the full test diff, `candidate.controller.test.ts`'s
header) rather than auditing the note's prose alone, and ran `git log`/
`git diff`/`git status` myself to confirm the minimal-diff and git-history
claims. Justification: this node's central claim ("0 production code
changed, feature already fully live") is unusual enough, and the
coordinating task explicitly requested this depth of independent
confirmation, to warrant paying the re-run cost rather than defaulting to
audit-only.

## Hub bytes before
100436 (per implementer's note)

## Hub bytes after
103617 (measured after updating diagram PM status, same 5-category
`/hub-tokens` per-session-total formula: root .md files + doctrine/ + the
active non-archive haven/diagrams/ file + implementer worker bundle +
verifier worker bundle, raw byte counts summed)
