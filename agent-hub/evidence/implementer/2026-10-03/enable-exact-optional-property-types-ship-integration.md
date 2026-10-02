# 2026-10-03 — enable-exact-optional-property-types (ship-time integration)

- Context: final phase of the ship-in-order run for #177. This branch
  forked before phases 3/4/6/7/8/10/11 merged.

## The predicted ripple finally materialized — at ship time, not seal time

This node's own sealed evidence note (2026-10-02) observed that the
flag's "tends to ripple" risk did NOT materialize when checked in
isolation on its own branch (0 extra errors beyond the original 6).
That observation was correct for THAT branch's isolated diff, but was
only ever checking `exactOptionalPropertyTypes` against the OTHER 11
phases' code as it existed BEFORE any of them merged. Rebasing onto the
real, fully-merged `staging` (11 sibling phases already in) surfaced
21 additional real errors across 7 files — i.e. the ripple the issue
itself warned about was real, just invisible until full integration.

## Git conflicts resolved

- `tsconfig.json`: appended the final flag after the 6 already merged —
  pure addition.
- `src/services/index.ts`: `baseUpdateDocument`'s props — combined
  #181's already-merged generic signature (`<T extends CrudDocument>`,
  `Model<T>`, `Record<string, unknown> & { _id?: string }`) with this
  phase's `userID?: string | undefined` widening + comment.

## 21 new errors, same category as this node's original 6 — fixed the same way

All `TS2379`/`TS2375` ("not assignable... Consider adding 'undefined'"),
every one a genuine `cond ? value : undefined` pattern from a sibling
phase that didn't exist when this node was last measured:

1. **`utils/valid.ts`'s `validateSchema`**: `lang?: string` →
   `lang?: string | undefined` — every controller calls it with
   `req.lang` (itself `string | undefined`). Fixed the root cause once
   here rather than at each of the ~11 call sites across
   `auth.controller.ts`/`candidate.controller.ts`/`BaseController.ts`/
   `generalInformation.controller.ts` that the error list named.
2. **`services/index.ts`'s `baseDeleteDocument`/`baseRestoreDocument`**:
   `lang?: string` → `lang?: string | undefined` — same root cause,
   `BaseController.ts` passes `req.lang` into both.
3. **`services/index.ts`'s `baseProp.fields`**: `candidateId?: string`
   → `candidateId?: string | undefined` — `BaseService.ts`/
   `generalInformation.service.ts` narrow `document?.candidateId` with
   a `typeof x === 'string' ? x : undefined` guard (the exact pattern
   #180 introduced) before passing it into `fields`.
4. **`types/candidate.type.ts`'s `Item.skills`**: `string[]` →
   `string[] | undefined` — `createPDF.ts`'s `renderExperience`/
   `renderProject` destructure `ExperienceData.skills`/
   `ProjectData.technology` (both legitimately optional, from #185's
   shared type) straight through to `_layoutItem`.

Each fix follows the exact same discipline as this node's original 6:
widen the type to say what callers already do, never force the caller
side with `!` or `as`.

## Verification

`npx tsc --noEmit`: clean (0 errors) after all 23 total fixes (2 from
conflict resolution + 21 new).
`npm test`: 31/31 suites, 181/181 tests passing.
`npm run build`: clean.

No `any`, `!`, `@ts-ignore`, or unjustified `as` introduced anywhere in
this integration pass — every fix is a type widening that reflects real,
already-existing caller behavior.

Not sent through a separate implementer/verifier round — same category
as every other ship-time integration note this run: the fixes are
exactly the kind of `x?: T` → `x?: T | undefined` widening this node's
own sealed scope already called for, just at call sites that didn't
exist until later-merging sibling phases introduced them.

## Status
Committed directly as part of shipping phase 12/12 (final phase) of #177.
