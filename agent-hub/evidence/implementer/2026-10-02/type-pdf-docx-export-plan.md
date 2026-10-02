# 2026-10-02 — type-pdf-docx-export (implementer note)

- Worker: implementer (main session)
- Node: `type-pdf-docx-export`
- GitHub issue: #185 — "type-safety: type PDF/DOCX export services + utils/helper.ts", part of tracking issue #177
- Branch: `185-type-pdf-docx-export` (from `staging`, fresh)

## Design: one shared `AggregatedCandidateData` type

Both `createPDF.ts`'s `createCV`/`pageRender`/`getDataCandidate` and
`createDocx.ts`'s `buildDocxContent`/`createCVDocx` consume the exact same
aggregated record shape (confirmed by reading both files' own doc
comments, which already said as much) — the record `candidate_me/index.ts`'s
`handlerGetAboutMe` assembles. Added `AggregatedCandidateData` plus 3 new
supporting interfaces (`EducationData`, `ExperienceData`, `ProjectData`,
`GeneralInformationData`) to `src/types/candidate.type.ts`, extending the
existing file (per the node's own scope note) rather than creating a
parallel one — reused the ALREADY-EXPORTED `Reference`/`Certificate`/
`Award`/`Skill`/`Language` interfaces directly, since their fields already
matched exactly what both export services destructure (confirmed by
reading every call site before reusing, not assumed).

`handlerGetAboutMe`'s own return type is still untyped (`type-candidate-modules`/
#183's evidence note already flagged this — `dataResult = JSON.parse(JSON.stringify(document))`
is inferred `any`, a separate, larger follow-up not in this node's
scope) — declaring the shape in `candidate.type.ts` and using it as the
PARAMETER type on both export services' entry points still gets real
internal type checking inside those 2 files, even though the call-site
boundary coming FROM `candidate_me/index.ts` stays loose until that
follow-up happens. Same honest caveat pattern as #183.

## What changed, per file

### `src/services/createPDF.ts`
- `createCV(data: Record<string, any>, ...)` → `data: AggregatedCandidateData`.
- `pageRender(RECORD: Record<string, any>)` → `RECORD: AggregatedCandidateData`.
- `getDataCandidate(RECORD: Record<string, any>)` → `RECORD: AggregatedCandidateData`.
- Typing the entry points surfaced 2 real gaps the `any` had been hiding:
  - `renderEducation(list = [])`/`renderExperience(list = [])`/`renderProject(list = [])`
    had NO type annotation at all — confirmed via `tsc` that these actually
    inferred as `never[]` parameters (not `any[]` as might be assumed),
    which only ever compiled because nothing upstream was typed strictly
    enough to catch the mismatch. Added explicit `EducationData[]`/
    `ExperienceData[]`/`ProjectData[]` parameter types.
  - `renderInfo(props: informationPersonal)` requires non-optional fields
    (`firstName: string`, not `string | undefined`), but `AggregatedCandidateData`'s
    fields are all optional (the real record can be missing any of them).
    Fixed at the one call site (`getDataCandidate`'s `candidate` object
    construction) by giving every destructured field a `= ''` default —
    `informationPersonal` itself wasn't touched (confirmed via grep it has
    exactly one consumer, this same function, so no other caller is
    affected).
  - `renderSkills`'s inline anonymous param type (`{personalSkills: Skill[]; ...}`,
    also non-optional) → replaced with the real `GeneralInformationData`
    interface directly (structurally compatible, and the function already
    defaults every field internally).
- Zero `any` remains (the one leftover match, line 75, is inside an
  already-commented-out code block — inert, not live code).

### `src/services/createDocx.ts`
- `buildDocxContent(RECORD: Record<string, any> = {})` → `RECORD: AggregatedCandidateData = {}`.
- `createCVDocx(data: Record<string, any>, ...)` → `data: AggregatedCandidateData`.
- `generalInformation` (normalized array-or-object) → explicitly typed `GeneralInformationData`.
- All 9 `.map((x: any) => ...)` callbacks → the real per-section interface
  (`Skill`, `ExperienceData`, `ProjectData`, `EducationData`, `Award`,
  `Certificate`, `Language`, `Reference`) — same types `createPDF.ts` now
  uses, confirming both files genuinely share one shape instead of two
  independently-guessed ones.
- Zero `any` remains.

### `src/utils/helper.ts`
Typing `handleError(err: any, ...)` properly (`err: unknown`) required
real type guards instead of free-form property access:
- `err instanceof AppError` (already real).
- `err instanceof mongoose.Error.CastError` (replaces the old `err?.name === 'CastError'` duck-type check with Mongoose's real exported class).
- A new `isDuplicateKeyError()` type guard for MongoDB's `E11000` — duck-typed (`typeof err === 'object' && 'code' in err && err.code === 11000`) rather than importing `MongoServerError` from `mongodb`, since that package is only a transitive dependency of `mongoose`, not declared directly in `package.json`.
- `err instanceof mongoose.Error.ValidationError` (replaces `err?.name === 'ValidationError'`) — its real `.errors` property is already properly typed by Mongoose (`{[path: string]: Error.ValidatorError | Error.CastError}`), so the inner `Object.entries(...).map(([field, e]) => ...)` callback's `e` parameter no longer needs its own `any` annotation at all.
- `getSelectFields(fields: Record<string, any>)` → `Record<string, unknown>`.

**9 confirmed-dead functions removed**, same reasoning as `type-joi-validation-layer`/#184's two deletions earlier this tracking issue: `asyncHandler`, `throwValidationError`, `throwNotFoundError`, `throwConflictError`, `throwBadRequestError`, `resBadRequest`, `resFormatResponse`, `successResponse`, `errorResponse`. Checked EVERY exported function in this file for real callers before touching anything (`grep -rn "\bFN(" src --include="*.ts" | grep -v __tests__ | grep -v helper.ts`, for each of the 13 exports) — 4 are genuinely used (`getSelectFields`: 2, `handleError`: 30, `formatResponse`: 1, `formatReturn`: 83); the other 9 have **zero** callers anywhere in `src/`, zero test coverage (`src/__tests__/utils/helper.test.ts` only ever tested `handleError`), and several were already self-documented `@deprecated`/"legacy, kept for backward compatibility" in their own doc comments. Typing their `any` parameters properly (`resBadRequest`'s `{message: string; [key: string]: any}`, `successResponse`'s `data: any`) would have been speculative design work for code nothing exercises — same judgment call as #184's 2 deletions, not scope creep.

One of these deletions (`throwBadRequestError`) turned up a genuinely dead IMPORT while removing it: `src/auth/auth.controller.ts` imported it but never called it anywhere in that file — fixed the import line (1-line change, directly necessitated, not a new finding needing its own investigation). Also fixed one now-stale doc comment in `src/middlewares/errors.middleware.ts` ("Note: asyncHandler is now available in @/utils/helper.ts") that referenced the just-removed function — the file's own `errors?: any`/`data?: Record<string, any>...` interface fields are a SEPARATE, untouched concern (not in this node's named scope; left alone).

## Explicitly not touched

- `(req as any)` throughout `auth.controller.ts` — `remove-req-as-any-casts`/#179's scope, unmerged on this branch (confirmed still present, 29 occurrences, unrelated to the 1-line import fix made here).
- `errors.middleware.ts`'s own `errors?: any`/`data?: Record<string, any>...` fields — a different file/interface, not named in this node's scope; only touched here for one stale comment directly caused by this node's deletion.
- `candidate_me/index.ts`'s `handlerGetAboutMe` return type — flagged by both #183 and this node as a separate, larger follow-up (not filed as its own issue yet).

## Verification run

```
npx tsc --noEmit
```
Clean, 0 errors — reached in several steps (each independently confirmed before moving on): typing the 3 `createPDF.ts` entry points surfaced the `never[]` inference gap and the `informationPersonal`/`GeneralInformationData` optional-field mismatches, both fixed properly (defaults / interface reuse, not loosened types); removing `throwBadRequestError` surfaced the dead import in `auth.controller.ts`.

```
npm test
```
```
Test Suites: 31 passed, 31 total
Tests:       181 passed, 181 total
Snapshots:   0 total
Time:        6.796 s
```
Same baseline as every prior sealed node this session. `src/__tests__/utils/helper.test.ts` (which only ever tested `handleError`) passes unchanged — the 9 deletions removed zero tested behavior.

```
npm run build
```
Clean.

```
grep -n "\bany\b" src/services/createPDF.ts src/services/createDocx.ts src/utils/helper.ts
```
Zero real hits (comments/Joi string-literal keys only, same false-positive classes already confirmed on prior sibling nodes this session).

## Diff scope

```
git diff staging --stat -- src/
```
```
 src/auth/auth.controller.ts          |   2 +-
 src/middlewares/errors.middleware.ts |   2 -
 src/services/createDocx.ts           |  27 +++---
 src/services/createPDF.ts            |  39 +++++----
 src/types/candidate.type.ts          |  67 +++++++++++++++
 src/utils/helper.ts                  | 154 +++++------------------------------
 6 files changed, 129 insertions(+), 162 deletions(-)
```
3 named files + `types/candidate.type.ts` (the shared type, per the node's own scope note to "extend" it) + 2 small, directly-necessitated fixes (`auth.controller.ts`'s dead import, `errors.middleware.ts`'s stale comment).

## Status
`sealed_pending_verifier`
