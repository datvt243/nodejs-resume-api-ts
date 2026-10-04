# 2026-10-04 — apply-object-parameter-rule (verifier note)

## Isolation proof
Spawned fresh via the Agent tool with only the task description — no
memory of the implementer session. All numbers below are independently
re-derived (own AST script, own greps, own diff reads), not copied from
the implementer's note.

## Re-run scope
Full. Read the complete diff for all 23 changed `src/` files (18
production + 5 test), wrote and ran my own TypeScript-compiler-API AST
script against both the current working tree and the pre-refactor tree
(via `git stash`/`pop`, same branch, no checkout), and re-ran
`npx tsc --noEmit` / `npm run build` / `npm test` from scratch.

## Verdict: SEAL

## What I independently confirmed

1. **Diagram row**: `apply-object-parameter-rule` found exactly once in
   `agent-hub/haven/diagrams/dev-loop.prime-mermaid.md` (line 125),
   status PENDING before this pass.

2. **Highest-severity exclusion check — Express error middleware**:
   `git diff -- src/middlewares/errors.middleware.ts` is **empty** —
   file completely untouched. Read it directly: `errorsMiddleware = (err:
   ErrorMid | AppError, req: Request, res: Response, _next: NextFunction)
   => {...}` — still exactly 4 positional params. Confirmed `fn.length`
   semantics are preserved (arrow function, no object wrapping).

3. **Multer `fileFilter`/`destination`/`filename` callbacks**:
   `git diff --stat -- src/middlewares/` is **empty** — the entire
   `middlewares/` directory has zero changes. Read `uploadCV.middleware.ts`
   directly: `fileFilter`, `destination`, `filename` (all 3-param,
   positional-contract multer callbacks) and `uploadCVMiddleware`
   (3-param Express handler) are byte-identical to the pre-refactor tree.
   Same confirmed for `uploadImages.middleware.ts` and
   `uploadLinkedInExport.middleware.ts` via the same empty directory diff.

4. **`AppError.ts` constructors**: `git diff --stat -- src/errors/` is
   **empty**. Read the file directly — every one of the error classes
   still has both the positional-args overload and the
   `constructor(options: IErrorOptionsWithStatus)` object-form overload,
   branching on `typeof messageOrOptions === 'object'`, completely
   unmodified.

5. **Spot-checked Express route handlers untouched in shape**: read full
   diffs of `src/auth/auth.controller.ts` and
   `src/candidate_profile/BaseController.ts` — every handler's own
   signature (`req: Request, res: Response, next: NextFunction`) is
   unchanged; the only diff lines are internal body calls
   (`handleError(err, next, req.lang)` → `handleError({ err, next, lang:
   req.lang })`, `jwtSign(...)` positional → object, `handlerUpdate(...)`
   positional → object). No handler lost a parameter.

6. **Independent AST re-derivation of the 101/18/83 claim.** Wrote my own
   compiler-API script (TypeScript 5.6.3 from this repo's own
   `node_modules`, never committed, lived only in my scratchpad) that
   walks every non-test `.ts` file under `src/` and flags
   `FunctionDeclaration`/`MethodDeclaration`/`ArrowFunction`/
   `FunctionExpression`/`ConstructorDeclaration` nodes with >2 real
   parameters (excluding explicit `this`).
   - Current working tree: **77 hits**.
   - Pre-refactor tree (`git stash push -u` → measure → `git stash pop`,
     same branch, never checked out elsewhere): **95 hits** (98 if
     constructor *overload signatures*, which have no body and so need a
     separate AST branch, are also counted — my first pass excluded
     them; `AppError.ts`'s 3 arity->2 constructor pairs account for
     exactly that 3-hit gap).
   - **Diff of the two hit lists**: exactly 18 lines disappeared between
     pre- and post-refactor, and every single one of the 18 names
     matches the implementer's named list byte-for-byte: `handlerGetAboutMe`,
     `BaseService.ts`'s `handlerUpdate`/`handlerDelete`, `handlerUploadCV`,
     `logRequest`, `formatRange`, `formatDateRange`, `buildSkillsSection`,
     `buildAtsContent`, `pageRenderAts`, `createCVAts`, the `createPDF.ts`
     IIFE (`getTime`), `getInfo`, `getWebsite`, `baseCheckDocumentById`,
     `handleError`, `jwtSign`, `withTimeout`. Zero extra functions changed
     arity, zero named functions were missed.
   - My script's absolute totals (95/98 pre, 77 post) sit a constant 3
     below the implementer's claimed 101/83. I could not fully reconcile
     this gap (tried also counting `FunctionTypeNode`/`MethodSignature`
     type-level declarations — found only 1 extra, not 3) and could not
     rerun the implementer's own script since it was never committed
     (scratchpad-only, as required). This is flagged as an unresolved,
     low-materiality discrepancy in the note's *absolute baseline number*
     — but since the pre/post **delta** (the number that actually proves
     scope correctness) matches exactly 18 under two independently-run
     methodologies, and the diff-level spot checks (items 2-5, 7-9 below)
     independently confirm nothing outside the 18 was touched, this does
     not block sealing. Recorded here so a future session doesn't have to
     re-derive it from scratch.

7. **Read every one of the 18 functions' full diffs** (not sampled):
   `candidate.service.ts`, `candidate.controller.ts`, `candidate_me/index.ts`,
   `candidate_me/ats-check.ts`, `BaseService.ts`, `BaseController.ts`,
   `generalInformation.controller.ts`, `logger/index.ts`, `createDocx.ts`,
   `createPDF.ts`, `createPDF.ats.ts`, `services/index.ts`, `utils/jwt.ts`,
   `utils/timeout.ts`, `utils/helper.ts`, `auth.controller.ts`,
   `auth.service.ts`, `profile.route.ts`. In every case: only the
   parameter list became a destructured object (plus the matching type
   annotation); internal logic byte-identical; every call site in the
   same diff updated to the new object-argument shape. One deliberately
   cosmetic mismatch confirmed harmless: `createDocx.ts`'s
   `formatRange({..., isCurrent: c.isNoExpiration})` — the field name
   `isCurrent` doesn't match the caller's `c.isNoExpiration`, but this is
   identical to the pre-refactor positional call (3rd positional arg was
   always bound to the parameter named `isCurrent`); not a behavior
   change.

8. **`handleError` — widest blast radius (31 call sites) — re-grepped
   from scratch.** `grep -rn "handleError(" src --include="*.ts"` →
   32 lines (31 calls + the 1 definition's destructuring doesn't match
   this pattern, all 31 real call sites use the new `handleError({ err,
   next, lang })` object form). Separately ran `grep -rn "handleError(err"
   src --include="*.ts"` (the old positional signature's first-arg
   shape) → **zero matches**. Confirmed the 7 production files calling it
   are exactly: `auth.controller.ts`, `candidate.controller.ts`,
   `candidate_me/index.ts`, `candidate_me/ats-check.ts`,
   `candidate_profile/BaseController.ts`,
   `candidate_profile/general_information/generalInformation.controller.ts`,
   `routers/api/v1/profile.route.ts` — plus `__tests__/utils/helper.test.ts`.
   Matches the note's claim exactly.

9. **`BaseService.ts`'s `handlerUpdate` — re-grepped from scratch, not
   trusted from the note.** Read the full diff of
   `generalInformation.controller.ts`: both `fnUpdate` and
   `fnUpdateFields` call `handlerUpdate({ item: value, userID:
   req.user?._id, lang: req.lang })` — the new object form, confirming
   the 2 extra call sites the note says the type checker caught. Combined
   with `BaseController.ts`'s 1 call site (`createCrudController`'s
   internal `fnUpdate`), that is 3 total — `npx tsc --noEmit` ran clean
   (see item 11), which would have failed loudly on any 4th missed site
   since the parameter type is a required object, not optional
   positional args. No 4th site found.

10. **Dead-code claims re-verified from scratch, not used as cover.**
    - `grep -rn "handlerDelete(" src --include="*.ts"` → only
      `candidate.controller.ts:163` (`handlerDelete(req.user._id,
      req.lang)`) and 5 hits in
      `__tests__/candidate/candidate.service.test.ts`. All of these call
      `candidate.service.ts`'s own separate 2-param `handlerDelete`
      (confirmed by reading its declaration: `export const handlerDelete
      = async (_id: string, lang: string = DEFAULT_LANG) =>`), not
      `BaseService.ts`'s factory-internal `handlerDelete`. Zero call
      sites for the latter anywhere in `src/` — dead-code claim holds.
    - `grep -rn "logRequest(" src --include="*.ts"` → zero matches
      anywhere. Dead-code claim holds.

11. **Re-ran the real commands myself**, not trusted from the note:
    - `npx tsc --noEmit` → exit 0, clean.
    - `npm run build` (`tsc && npm run copy`) → clean, exit 0.
    - `npm test` →
      ```
      Test Suites: 35 passed, 35 total
      Tests:       235 passed, 235 total
      Snapshots:   0 total
      ```
      Exact match to the note's claim and to the pre-existing baseline
      (same count as `add-src-author-see-header`/`review-refactor-comments`'s
      last-sealed runs). The "worker process failed to exit gracefully"
      warning after the ATS Puppeteer integration test is the same
      known pre-existing teardown flake noted in prior sealed runs —
      unrelated to this diff, all tests still reported passed.

12. **Test-assertion fix is legitimate, not weakened.**
    `src/__tests__/auth/auth.service.test.ts`'s
    `expect(jwt.jwtSign).toHaveBeenNthCalledWith(1, ...)` changed from
    3 positional args (`{ _id }, expect.any(String),
    expect.objectContaining(...)`) to 1 object arg (`{ data: { _id },
    secretKey: expect.any(String), props: expect.objectContaining(...)
    }`). This asserts the exact same values in the exact same roles
    (data/secretKey/props), just restructured to match the real new call
    shape in `auth.service.ts`'s `handlerLogin` — read that file's diff
    directly (item 7) to confirm `jwtSign({ data: { _id }, secretKey:
    TOKEN_SECRET, props: {...} })` is indeed the real new call. Not a
    relaxed assertion.

13. **Scope check** (`git status --short` / `git diff --stat`): exactly
    1 diagram row + 18 production `src/` files + 5 test files + 1
    untracked implementer evidence note. The implementer's note describes
    this split as "16 production + 7 test files" — that breakdown is
    **inaccurate** (actual: 18 production, 5 test; e.g.
    `routers/api/v1/profile.route.ts` is a production file calling
    `handleError`, not a test file, and isn't named in the note's
    file-by-file list at all, though it is covered by the note's own
    "31 call sites across 7 files" claim for `handleError`, which I
    independently confirmed in item 8). Flagging as a documentation
    imprecision in the implementer's note, not a scope violation — the
    total file count (24 changed/untracked paths) is correct, no file
    outside the reviewed set changed, and every file's content was read
    and confirmed correct in items 2-10 regardless of how the implementer
    categorized it.

14. **Forbidden states**: none triggered.
    - `ADHOC_WORK`: no — row pre-existed PENDING, issue #222 backs it,
      branch `222-apply-object-parameter` matches, operator confirmed
      scope via `AskUserQuestion` before implementation per the note.
    - `NO_EVIDENCE`: no — implementer note present and complete.
    - `EDIT_UNVERIFIED`: no — every claim re-derived directly above.
    - `CODE_IN_HAVEN`: no — both my AST script and the implementer's
      stayed in scratchpad, never under `agent-hub/`.
    - `DIAGRAM_DRIFT`: no — row flipped PENDING → SEALED in this same
      pass, matching the actual (18-function, 23-file) diff.

## Residual note for anyone reading this later
The implementer's claimed absolute AST totals (101 before / 83 after)
are 3 higher than what my independently-written script measures (98/80,
once constructor-overload signatures are counted the same way) on the
exact same working tree. I was not able to fully close this specific
3-hit gap and could not rerun the implementer's own script (never
committed, scratchpad-only — correctly so, per `CODE_IN_HAVEN`). This
does **not** change the verdict: the number that actually matters for
scope correctness — the pre/post delta — is exactly 18 under both of my
own measurement passes, and matches the implementer's named list
function-for-function with zero extra and zero missing. If a future
session touches this area again, re ‑deriving the baseline with a fresh
script and reconciling this exact 3-hit gap would be a good trailing
cleanup, not a blocker.

No commit/push performed.
