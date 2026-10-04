# 2026-10-04 — apply-object-parameter-rule (implementer note)

- Worker: implementer
- Node: `apply-object-parameter-rule`
- GitHub issue: #222
- Branch: `222-apply-object-parameter` (forked fresh from `staging`)

## Task
Operator-requested: any function/method/arrow/constructor with more than
2 parameters should take a single destructured object instead. ≤2-param
functions untouched. Functionality must not change — only the calling
convention.

## Measurement before touching anything (per `initiative-scoping.md`)
Wrote a one-off AST script (TypeScript compiler API, scratchpad-only,
never committed) that walks every `.ts` file under `src/` and flags every
`FunctionDeclaration`/`MethodDeclaration`/`ArrowFunction`/
`FunctionExpression`/`ConstructorDeclaration` with more than 2 real
parameters (excluding an explicit `this` param). Result: **101 total
hits**. Classified every single one before writing any code — presented
the full breakdown to the operator via `AskUserQuestion` and got explicit
confirmation before touching a file:

| Category | Count | Decision | Why |
|---|---|---|---|
| Express route/middleware handlers `(req, res, next)` | 66 | Excluded | Express always calls these positionally with real `Request`/`Response`/`NextFunction` instances — collapsing to one object param means the handler receives `req` as its whole argument and silently loses `res`/`next`. Verified this is the actual Express calling contract, not assumed. |
| Express error-handling middleware `(err, req, res, next)` in `errors.middleware.ts` | 1 | Excluded, critical | Express detects error middleware by checking `fn.length === 4` at registration time. Changing arity breaks global error handling app-wide, silently (no compile error, no runtime error — it just stops being invoked as an error handler). |
| Multer `fileFilter(req, file, cb)` callbacks (`uploadCV`/`uploadImages`/`uploadLinkedInExport` middlewares) | 7 | Excluded | multer calls these positionally too — same breakage class. |
| Local helper functions defined inside `src/__tests__/**` (3 mock-builder helpers) | 3 | Excluded | Out of scope per the task's own instruction — test files are call-site updates only, not refactor targets themselves. |
| `AppError`/`AuthenticationError`/`AuthorizationError` constructors (3 classes × overload+impl signature = 6 AST hits) | 6 | Excluded | Read `src/errors/AppError.ts` in full — each already has a `constructor(options: IErrorOptions)` object-form overload alongside the legacy positional one (deliberate dual-mode design, branches on `typeof messageOrOptions === 'object'`). Fully converting means deleting the positional overload and rewriting every `throw new XError(...)` call site codebase-wide for zero behavioral benefit. |
| **Real candidates** | **18** | **In scope** | Plain internal functions/methods, no framework contract, no pre-existing object form. |

## The 18 refactored, with call-site counts (all found via `grep -rn "<fn>(" src --include="*.ts"`, not guessed)
1. `src/candidate/candidate.service.ts` — `handlerUploadCV(candidateId, originalName, lang)` → object. 1 call site (`candidate.controller.ts`).
2. `src/candidate_me/index.ts` — `handlerGetAboutMe(identifier, lang, profileId)` → object. 9 call sites (2 other production files + 7 in `__tests__/candidate_me/index.test.ts`), all updated.
3. `src/candidate_profile/BaseService.ts` — `handlerUpdate(item, userID?, lang)` → object. 1 real call site (`BaseController.ts`) + 2 more found live via `tsc` that weren't caught by the initial grep (`generalInformation.controller.ts` calls it directly, not through the factory's destructured export) — all 3 fixed; type checker caught the gap, not missed silently.
4. `src/candidate_profile/BaseService.ts` — `handlerDelete(id, userID, lang)` → object. **0 call sites** — confirmed dead code (every section's `/delete/:id` route goes through `BaseController.ts`'s `baseDelete`, which calls `baseDeleteDocument` directly, not this factory method). Refactored anyway per the literal task scope; flagging the dead-code finding here rather than silently deleting it (out of scope for this task).
5. `src/logger/index.ts` — `logRequest(req, message, extra)` → object. **0 call sites** — also dead code (exported, never called). Refactored for signature consistency; not removed (out of scope).
6. `src/services/createDocx.ts` — `formatRange(startDate, endDate, isCurrent)` → object. 4 call sites, all internal to the file.
7. `src/services/createPDF.ts` — `getTime` (IIFE, startDate/endDate/isCurrent) → object. 1 call site (itself, immediately invoked).
8. `src/services/createPDF.ts` — `getInfo(phone, email, address)` → object. 1 call site.
9. `src/services/createPDF.ts` — `getWebsite(github, linkedin, website)` → object. 1 call site.
10. `src/services/createPDF.ats.ts` — `formatDateRange(startDate, endDate, isCurrent, lang)` → object. 4 call sites, all internal.
11. `src/services/createPDF.ats.ts` — `buildSkillsSection(generalInformation, lang, includePersonalSkills)` → object. 1 call site.
12. `src/services/createPDF.ats.ts` — `buildAtsContent(RECORD, lang, options)` → object. 9 call sites (1 internal + `candidate_me/ats-check.ts` + 7 in `__tests__/services/createPDF.ats.test.ts`), all updated.
13. `src/services/createPDF.ats.ts` — `pageRenderAts(RECORD, lang, options)` → object. 9 call sites (1 internal in `renderAtsPdfBuffer` + 8 in the same test file), all updated.
14. `src/services/createPDF.ats.ts` — `createCVAts(data, res, options)` → object. 1 call site (`candidate_me/index.ts`).
15. `src/services/index.ts` — internal `baseCheckDocumentById(MODEL, _id, lang, opts)` (inside the `_baseHelper()` closure, not exported) → object. 4 call sites, all internal to the file (`baseDeleteDocument`, `baseRestoreDocument`, `baseUpdateDocument`, `basePatchDocument`).
16. `src/utils/jwt.ts` — `jwtSign(data, secretKey, props)` → object. 4 real call sites (`auth.controller.ts` ×2, `auth.service.ts` ×2) + 3 in `__tests__/auth/tokenExpiry.test.ts` + 2 prose comment lines in that same test file documenting the call shape (updated for accuracy, not executable) + 1 stale mock assertion in `__tests__/auth/auth.service.test.ts` asserting the OLD positional call shape — caught by the real test run (not the type checker, since the mock is typed `jest.fn()`), fixed to assert the new object shape.
17. `src/utils/timeout.ts` — `withTimeout(promise, ms, signal)` → object. 3 call sites, all internal (`withDBTimeout`/`withRedisTimeout`/`withConnectTimeout`).
18. `src/utils/helper.ts` — `handleError(err, next, lang)` → object. **31 call sites** (29 production `handleError(err, next, req.lang)`/`handleError(err, next, lang)` across 7 files + 2 in `__tests__/utils/helper.test.ts` using the 2-arg default-lang form) — the widest blast radius of the batch, all updated; nearly all were the identical literal pattern, confirmed via `replace_all` per file then re-verified with `tsc --noEmit` catching every missed site (zero slipped through).

## A real gap the type checker caught, not a silent miss
`BaseService.ts`'s `handlerUpdate` had a 3rd call site I didn't find on
the first grep pass (`BaseController.ts` only) — `tsc --noEmit` surfaced
2 more call sites in `generalInformation.controller.ts` (it has its own
`fnUpdate`/`fnUpdateFields` that call the service's `handlerUpdate`
directly, bypassing the generic `createCrudController` factory). This is
exactly why `exactOptionalPropertyTypes` + a full `tsc --noEmit` after
every signature change was run continuously through this session, not
just once at the end — each wrong/missed call site surfaced as a real
compile error immediately.

## `exactOptionalPropertyTypes` fallout (expected, same pattern as `enable-exact-optional-property-types`/#189)
Several new object param types needed `field?: T | undefined` instead of
`field?: T`, because callers pass `req.lang`/`req.user?._id` (already
typed `string | undefined`) directly as a property value — under
`exactOptionalPropertyTypes: true`, an optional property's type must
include `undefined` explicitly if a caller ever assigns `undefined` to
it. Applied consistently to every new type in this diff that takes such
a value (`handlerUploadCV`'s `lang`, `handlerGetAboutMe`'s `lang`/
`profileId`, `BaseService.handlerUpdate`'s `userID`/`lang`,
`BaseController`'s matching type declaration, `pageRenderAts`'s
`options`, `withTimeout`'s `signal`, `handleError`'s `lang`).

## Verification
- Re-ran the same AST measurement script after all edits: **83 remaining
  hits** (101 − 18 = 83), exactly matching the untouched excluded set —
  confirms no over-scope and no under-scope.
- `npx tsc --noEmit` → clean throughout (run after every function's
  refactor, not just once at the end — caught every missed/extra call
  site live).
- `npm run build` → clean (`tsc && npm run copy`).
- `npm test` — first run surfaced exactly 1 failure (`auth.service.test.ts`'s
  `handlerLogin` test asserting `jwt.jwtSign`'s OLD positional call shape
  via a mock) — fixed the assertion to the new object shape, re-ran:

```
Test Suites: 35 passed, 35 total
Tests:       235 passed, 235 total
Snapshots:   0 total
Time:        8.209 s, estimated 12 s
Ran all test suites.
```

Matches the pre-existing baseline exactly (35/35 suites, 235/235 tests —
same count as `swagger-cv-token-docs`/`review-refactor-comments`'s last
sealed runs). Pure calling-convention change, zero behavior change,
confirmed by both the full green test run and by every refactored
function's internal logic being untouched (only the parameter
destructuring line changed in each).
- `git status --short` → exactly 24 files changed: 1 diagram row + 16
  production `src/` files + 7 test files (`tokenExpiry.test.ts`,
  `index.test.ts`, `createPDF.ats.test.ts`, `helper.test.ts`,
  `auth.service.test.ts`). No stray files, no scope creep.

## Forbidden-state self-check
- Not `ADHOC_WORK` — diagram row added on this branch before any file
  edit, issue #222 exists, operator confirmed scope via `AskUserQuestion`
  before implementation.
- Not `NO_EVIDENCE` — this note.
- Not `EDIT_UNVERIFIED` — `npm test`/`npm run build`/`tsc --noEmit`
  actually run repeatedly, output pasted above verbatim, not inferred.
- Not `CODE_IN_HAVEN` — the one-off AST measurement script lived in the
  session scratchpad, never under `agent-hub/`.
- Not `DIAGRAM_DRIFT` — row added PENDING before implementation; verifier
  owns flipping it to SEALED.

No commit/push has happened yet (`/todo` invoked without `--ship`).
