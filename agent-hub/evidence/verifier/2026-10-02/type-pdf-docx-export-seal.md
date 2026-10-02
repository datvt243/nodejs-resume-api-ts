# 2026-10-02 — type-pdf-docx-export (verifier note)

- Worker: verifier (independent subagent)
- Node: `type-pdf-docx-export`
- New PM status: PENDING → SEALED
- Isolation proof (actual spawn task string, verbatim preamble from the coordinator):
  "You are an independent verifier subagent for a one-person dev hub project ...
  Run `verify_seal` for evidence note: agent-hub/evidence/implementer/2026-10-02/type-pdf-docx-export-plan.md ...
  This node is UNUSUAL and needs real scrutiny: it deletes NINE exported functions from
  `utils/helper.ts` ... on the claim every one has zero callers anywhere in `src/`.
  Deleting 9 functions during a 'type safety' task is a big claim — independently re-derive
  it, don't trust the note's grep commands." Full 13-step checklist given, no shared state
  with the implementer session.

## Reasoning

1. Row check: `grep -n "type-pdf-docx-export" agent-hub/haven/diagrams/dev-loop.prime-mermaid.md`
   → exactly one row, PENDING, before any edit. Branch confirmed `185-type-pdf-docx-export`.
2. Read implementer note in full + `gh issue view 185 --json body -q '.body'` (part of #177,
   scope: zero `any` in createDocx.ts/createPDF.ts/helper.ts, tests/build unchanged).
3. Independently re-derived all 9 "dead" claims from scratch (not the note's own commands):
   for each of `asyncHandler`, `throwValidationError`, `throwNotFoundError`,
   `throwConflictError`, `throwBadRequestError`, `resBadRequest`, `resFormatResponse`,
   `successResponse`, `errorResponse` ran (a) call-site grep `\bFN(` excluding
   `__tests__`/`helper.ts`, (b) bare-word grep `\bFN\b` (catches dead imports, same class as
   the note's own `throwBadRequestError` finding), (c) `grep -rln` over
   `src/__tests__` — all three empty for all 9, on the CURRENT post-deletion tree, consistent
   with `tsc --noEmit` being clean (a lingering real caller would have broken compilation).
   Read `src/__tests__/utils/helper.test.ts` in full — confirmed it only exercises
   `handleError` (2 duplicate-key tests), nothing else, matching the note.
4. Confirmed the 4 kept functions have real external callers:
   `getSelectFields` → `src/services/index.ts`; `handleError` → 6 files (routers/controllers);
   `formatResponse` → `BaseController.ts`; `formatReturn` → 8 files. All real, non-trivial.
5. Read `src/utils/helper.ts` in full: `handleError(err: unknown, ...)`,
   `err instanceof mongoose.Error.CastError`/`.ValidationError` confirmed real exported classes
   via `node_modules/mongoose/types/error.d.ts:24,88`. `isDuplicateKeyError` duck-type guard
   confirmed reasonable — `grep -n '"mongo' package.json` shows only `mongoose` as a direct
   dependency, `mongodb` absent (transitive only). `getSelectFields(Record<string, unknown>)`
   confirmed. Read `createPDF.ts` in full: `renderEducation/renderExperience/renderProject`
   now `EducationData[]/ExperienceData[]/ProjectData[]` (git diff confirms these were
   previously unannotated); `renderInfo(informationPersonal)` — confirmed via
   `types/candidate.type.ts:7-14` all 6 fields non-optional, `getDataCandidate`'s
   `candidate` object (line 145) gives every field a `= ''` default, and
   `grep -rn "informationPersonal" src` shows exactly one consumer (`renderInfo`). Read
   `createDocx.ts` in full: `git diff staging -- src/services/createDocx.ts | grep ": any"`
   shows exactly 9 original `(x: any) =>` callbacks, now typed `Skill`(×2)/`ExperienceData`/
   `ProjectData`/`EducationData`/`Award`/`Certificate`/`Language`/`Reference` — same
   interfaces `createPDF.ts` uses, not independently re-guessed. Read
   `types/candidate.type.ts` in full: `AggregatedCandidateData` + 3 new interfaces, all
   fields optional, reused identically (not duplicated) by both services' imports.
6. `git diff staging -- src/auth/auth.controller.ts`: exactly one line changed (the dead
   `throwBadRequestError` import removed from the `@/utils` import list), nothing else.
   `git diff staging -- src/middlewares/errors.middleware.ts`: exactly 2 lines removed
   (stale comment), the file's own `ErrorMid`/`any`-typed fields untouched.
7. Re-run: `npx tsc --noEmit` → clean, 0 errors. `npm test` → 31 suites / 181 tests passed
   (matches note exactly). `npm run build` → clean (tsc + copy views/public).
8. `git diff staging --stat -- src/` → `auth.controller.ts 2+/1-` (net 1 line),
   `errors.middleware.ts 0+/2-`, `createDocx.ts 27~`, `createPDF.ts 39~`,
   `candidate.type.ts 67+`, `helper.ts 154~` — exactly 6 files, 129 insertions(+)/162
   deletions(-), matching the note verbatim. `grep -c "(req as any)" auth.controller.ts`
   → 29, untouched (#179 scope).
9. Forbidden-states scan: no ADHOC_WORK (node exists, worker identity used), no NO_EVIDENCE
   (implementer note present), no EDIT_UNVERIFIED (every claim independently re-run above,
   not inferred), no CODE_IN_HAVEN, no DIAGRAM_DRIFT (row flipped in this same action). Bar
   for the 9 deletions (zero calls AND zero dead imports AND zero test coverage,
   independently verified, not asserted) met for all 9 — see step 3.
10. Verdict: **SEAL**. All 9 deletions independently confirmed genuinely dead; every type
    fix (helper.ts guards, createPDF.ts annotations, createDocx.ts callbacks,
    candidate.type.ts interfaces) independently confirmed real and coherent; both
    necessitated side-fixes correctly scoped; full re-run clean.

## Proportion
6 files touched, matches note's stat exactly (129 insertions / 162 deletions): 3 named
files (`createPDF.ts`, `createDocx.ts`, `helper.ts`) + `candidate.type.ts` (shared type,
in-scope per node's own text) + 2 one/two-line necessitated fixes. No scope creep.

## Forbidden states scan
None triggered — see reasoning step 9.

## Re-run (full — 9-deletion node, highest scrutiny so far this tracking issue)
- `npx tsc --noEmit` — clean, 0 errors.
- `npm test` — Test Suites: 31 passed, 31 total; Tests: 181 passed, 181 total.
- `npm run build` — clean (tsc + copy).
- `grep -n "\bany\b" src/services/createPDF.ts src/services/createDocx.ts src/utils/helper.ts`
  — zero real hits (one English word in a comment, one Joi-style `'any.required'` string
  literal, one `any` inside already-commented-out dead code).
- All 9 deleted-function dead-code claims re-derived from scratch (call-site + bare-word +
  test-coverage greps), not trusted from the note.
