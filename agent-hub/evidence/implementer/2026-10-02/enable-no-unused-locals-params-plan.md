# 2026-10-02 — enable-no-unused-locals-params (implementer note)

- Worker: implementer (main session)
- Node: `enable-no-unused-locals-params`
- GitHub issue: #188 — "type-safety: enable noUnusedLocals + noUnusedParameters", part of tracking issue #177
- Branch: `188-no-unused-locals-params` (from `staging`, fresh)

## Pre-flight

Re-measured on this branch: `npx tsc --noEmit --noUnusedLocals
--noUnusedParameters` → 70 errors across 32 files, matching the tracking
issue's original audit.

## Approach

Grouped by category, not file:

1. **Unused imports** (named or whole-declaration) — deleted outright:
   `ErrorCode`/`IErrorOptionsWithStatus` (`utils/helper.ts`),
   `throwBadRequestError` (`auth/auth.controller.ts` — a dead import, not
   a dead function; confirmed it's never called in that file),
   `handleError` namespace import (`__tests__/auth/auth.controller.test.ts`),
   `passwordRegex`/`PASSWORD_MIN_LENGTH`/`formatValidateError`
   (`__tests__/utils/valid.test.ts` — confirmed `formatValidateError`'s
   only other appearance is as an unrelated object-literal key inside a
   `jest.mock()` factory, not a reference to the import binding),
   `StatusCodes` (`middlewares/verifyToken.middleware.ts`), `StringSchema`/
   `NumberSchema`/`phoneRegex` (`plugins/joi/index.ts`), the whole
   `path`/`dirname` import (`routers/api/v1/index.ts` — confirmed neither
   name used anywhere else in that file), `Schema`/`Document`
   (`services/index.ts` — `mongoose.Error.ValidationError` still uses the
   default `mongoose` import, confirmed kept), `Request`
   (`utils/helper-auth.ts`), `Model` (`utils/valid.ts`), `dirname`
   (`server.ts` — `path` default import confirmed still used for
   `express.static(path.join(...))`).

2. **Unused function parameters** — `_`-prefixed per the issue's own
   stated convention (TypeScript's `noUnusedParameters` skips
   `_`-prefixed simple identifiers by default): every Express handler
   with an unused `req`/`res`/`next` across `auth.controller.ts`
   (`authCreateRefreshToken`'s placeholder), `csrf.middleware.ts`,
   `errors.middleware.ts` (×2 handlers), `language.middleware.ts`,
   `verifyToken.middleware.ts`, `routers/api/v1/index.ts`,
   `routers/api/v2/index.ts`, `routers/index.ts` (×2), `server.ts` (×2),
   and — the single biggest repeated pattern — **20 identical
   `(req: Request, res: Response, next: NextFunction) => { req.params[...] =
   Collections.X; next(); }` blocks across all 8 CV-section route files**
   (confirmed before touching: `grep -c` of the exact signature matched
   the error count exactly, per-file, for all 8 files — every occurrence
   of that signature in each file had a confirmed-unused `res`, not just
   some of them, so the blanket `sed` replacement was safe).
   Destructured-parameter callbacks (`hookHasErrors: ({ err }) => {}` in
   `BaseService.ts` and `generalInformation.service.ts`, both no-op
   bodies) were simplified to `() => {}` instead of renamed — renaming a
   destructured binding to `_err` would have tried to destructure a
   property literally named `_err`, a real behavior difference, not just
   a name change.

3. **Unused locals** (no `_`-prefix exemption for these — removed or
   restructured since `noUnusedLocals` doesn't have TS's parameter
   exemption): `baseProp` interface (`BaseController.ts` — already dead,
   confirmed zero references anywhere in the file, same finding as a
   sibling phase's own audit of this exact interface), a dead `const
   ObjectId = Schema.ObjectId;` (`models/part/index.ts` — declared,
   never read anywhere in the file), an unused `const res =` capturing a
   discarded Mongoose update result (`candidate.service.ts` — the actual
   `.exec()` call still runs for its side effect, just without
   needlessly binding the return value), `statusCodeSuccess`/
   `statusCodeFailed` (`utils/helper.ts` — destructured with defaults but
   never read in the function body; removed from both the destructuring
   AND the `formatReturn` interface itself, confirmed via `grep` that no
   caller anywhere passes either field), an unused `select` destructure
   (`services/index.ts`'s `getDocumentUpdated` — the one place that would
   have used it, `find.select(select)`, is itself commented-out dead
   code; left the commented block as-is, just stopped destructuring the
   now-pointless local), and 3 instances of `for (const [k, v] of
   Object.entries(...))` where `v` was never used, switched to `for
   (const k of Object.keys(...))` (`services/index.ts`, `utils/valid.ts`
   — the same pattern already fixed once on a sibling, unmerged branch).

## Real bugs found and fixed (not silently papered over)

1. **`alias.ts`'s development-mode branch** computed `const _path =
   getPath(path.join(__dirname, 'src'), 'src');` and then never used it —
   `moduleAlias.addAlias('@', path.join(__dirname, ''))` was called with
   a completely different, hardcoded value instead. `getPath()` is pure/
   side-effect-free, so the dead computation was safe to delete outright
   rather than guess at wiring it in — the production-mode branch
   (confirmed still intact, unaffected) is the only one that actually
   needs `getPath()`'s `src/src`→`src` collapse logic, since in dev mode
   via `ts-node` `__dirname` already resolves directly into `src/` with
   no such collision.

2. **`services/createPDF.ts`'s `getSkills` helper** (inside
   `_layoutItem`) was a second, independent bug, found while fixing the
   `noUnusedLocals` flag on the destructured `skills` from `props`:
   `getSkills` was an IIFE called with **zero arguments**
   (`})();`), so its own `(skills = [])` parameter always shadowed the
   real `skills`, which is why the destructured one from `props` was
   "unused" in the first place. Its condition was ALSO inverted
   (`!skills.length ? renderDiv : ''` — rendered the skills `<div>`
   exactly when there were NO skills, and rendered nothing when there
   WERE). Combined, the PDF export's per-item skills list has never
   actually displayed real skill names in any experience/project entry,
   regardless of data — confirmed by reading the full call chain down to
   where `${getSkills}` is interpolated into the returned HTML template.
   Fixed both: the IIFE now takes the real `skills` array as an explicit
   argument, and the condition is corrected to render only when non-empty.
   Documented inline with a `BUG FIX` comment citing this issue number.

## Explicitly not touched

- No other known-dead-but-unrelated code was touched beyond what each
  specific unused-variable error pointed at.

## Verification run

```
npx tsc --noEmit --noUnusedLocals --noUnusedParameters
```
0 errors (confirmed before adding the flags to `tsconfig.json`).

```
npx tsc --noEmit
```
Clean, 0 errors (full compile, both flags now enabled).

```
npm test
```
```
Test Suites: 31 passed, 31 total
Tests:       181 passed, 181 total
Snapshots:   0 total
Time:        9.672 s
```
Matches this session's consistent baseline. Checked `jest.setup.ts`
specifically this time (lesson from `enable-no-property-access-index-signature`/
#187's evidence note, now in `doctrine/MEMORY.md`) — it has no unused
locals/params of its own, so no fix was needed there, but the check was
made deliberately rather than skipped.

```
npm run build
```
Clean.

## Diff scope

```
git diff staging --stat -- src/ tsconfig.json
```
32 files changed, 66 insertions(+), 76 deletions(-) — every file maps to
a real flagged error (or, for `alias.ts` and `createPDF.ts`, a real bug
directly uncovered while fixing one).

## Status
`sealed_pending_verifier`
