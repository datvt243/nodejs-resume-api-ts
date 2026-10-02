# 2026-10-03 — enable-no-unused-locals-params (ship-time integration)

- Context: same ship-in-order run as the phase 9/10 integration notes.
  This branch forked before phases 4/7/8/10 merged, so popping its
  sealed stash onto the real, much-further-along `staging` produced
  the heaviest conflict set of the whole ship run: 1 tsconfig.json flag
  merge, 1 modify/delete (`plugins/joi/index.ts`, already confirmed
  dead and deleted by #184), 8 route files (2-3 conflict blocks each,
  all the same shape), and 4 more substantive files.

## Git conflicts resolved

- `tsconfig.json`: appended this phase's 2 flags after the 4 already
  merged from phases 9/10 — pure addition.
- `src/plugins/joi/index.ts`: kept the deletion (same reasoning as the
  phase 10 integration note — confirmed dead file, phase 11's own touch
  to it was only ever going to fix an unused-var inside code nothing
  calls).
- 8 route files (`application`/`award`/`certificate`/`education`/
  `experience`/`profile`/`project`/`reference`.route.ts, 2-3 identical
  conflict blocks each): combined phase 10's already-merged
  `req.params['collection']` bracket notation with this phase's
  `_res: Response` unused-param prefix. Resolved programmatically (one
  regex pass matching the exact uniform 3-way conflict shape across all
  8 files, each resolution hand-verified afterward with a `grep` for
  leftover markers and a spot-check of the result).
- `src/candidate/candidate.service.ts`: combined phase 10's
  `value['_id']` bracket notation with this phase's removal of an
  unused `const res =` assignment on the same `MODEL.updateOne(...)`
  call.
- `src/services/index.ts`: 2 conflicts — (1) the top-of-file `mongoose`
  import: phase 11's branch (forked before #181) thought `Model`/`Types`
  were unused and wanted to drop them; #181's generic CRUD rewrite
  (merged) genuinely needs both, so kept the already-merged import
  entirely, phase 11's edit here doesn't apply post-#181. (2)
  `getDocumentUpdated`'s `select` param: combined #181's already-merged
  generic signature (`<T extends CrudDocument>`, `Model<T>`) with this
  phase's removal of the same unused `select` default-destructure that
  only appeared in a commented-out line.
- `src/utils/helper.ts`: #185 (merged) already deleted all 9 dead
  functions this phase's own branch still had present (with its own
  `_res` unused-param fix buried inside functions that no longer exist)
  — took #185's already-merged, already-dead-code-free version
  entirely; this phase's edits to those 9 functions are moot once the
  functions themselves are gone.
- `src/utils/valid.ts`: #184 (merged) already added the
  `ValidationError`/`ValidationErrorItem` joi imports and already
  removed the same unused `Model` import from mongoose this phase's
  branch also wanted gone — took #184's version entirely (strict
  superset of this phase's import-only change here).

## A real auto-merge mistake caught and fixed (not a conflict — no markers, needed manual catch)

`src/utils/helper-auth.ts` merged with NO conflict markers, but the
3-way auto-merge incorrectly dropped the `import { Request } from
'express';` line entirely — plausibly because phase 3/#180 (merged)
added that import on a line adjacent to lines this phase's own stash
also touched, and git's hunk-boundary heuristic picked the wrong side.
This was NOT caught by a conflict marker; it was caught by `npx tsc
--noEmit` reporting `Request` resolving to the global `lib.dom.d.ts`
fetch `Request` type instead of Express's (surfacing as 5 unrelated-
looking errors across `helper-auth.ts`, `auth.controller.ts`,
`csrf.middleware.ts`, and `verifyToken.middleware.ts` — all 5 traced
back to this one missing import once investigated, and all 5 resolved
by restoring the single import line). This is the first ship-time
integration issue this run that wasn't flagged by an explicit conflict
marker — re-confirms the standing lesson that only `tsc`/test/build
output, never a clean-looking auto-merge, is trustworthy evidence of
correctness.

## Verification

`npx tsc --noEmit`: clean (0 errors) after all fixes, including the
helper-auth.ts restoration.
`npm test`: 31/31 suites, 181/181 tests passing.
`npm run build`: clean.

Not sent through a separate implementer/verifier round — same category
as the phase 9/10 integration fixes: merge-ordering artifacts and one
caught auto-merge mistake, zero new judgment calls or scope expansion
beyond what was needed to make the already-sealed, independently-
verified diffs of 5 different phases coexist correctly.

## Status
Committed directly as part of shipping phase 11/12 of #177.
