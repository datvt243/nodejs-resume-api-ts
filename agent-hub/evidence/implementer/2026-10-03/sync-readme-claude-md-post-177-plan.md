# 2026-10-03 — sync-readme-claude-md-post-177 (implementer note)

- Worker: implementer (main session)
- Node: `sync-readme-claude-md-post-177`
- No GitHub issue — operator-requested directly ("update lại readme.md
  và claude.md"), docs-only, not outward-facing beyond the PR itself.
- Branch: `chore-sync-readme-claude-md` (from `staging`, fresh, after
  all 12 phases of #177 + the diagram cleanup were already merged)

## What was stale and how each was confirmed, not assumed

1. **Version**: `package.json` has `"version": "1.8.1"`; both docs said
   `1.7.0`. Confirmed via direct read of `package.json`.
2. **ESLint untouched in either doc**: `setup-eslint-typescript`/#178
   added `eslint.config.mjs` + `npm run lint`/`lint:fix` scripts over a
   month ago (relative to this doc sync); neither doc mentioned ESLint
   at all. Confirmed `package.json`'s `scripts.lint`/`scripts["lint:fix"]`
   and `devDependencies.eslint`/`typescript-eslint` versions
   (`eslint@^9.39.5`, `typescript-eslint@^8.71.0`) directly.
3. **`src/plugins/joi/` deleted**: `type-joi-validation-layer`/#184
   deleted this directory (confirmed dead, zero callers) during the
   #177 migration, but CLAUDE.md's Project Structure tree still listed
   `plugins/joi/`. Confirmed via `ls src/plugins` → "No such file or
   directory".
4. **`utils/helper.ts`'s dead-function comment**: CLAUDE.md's tree said
   `asyncHandler, throwError, formatReturn, response helpers` —
   `type-pdf-docx-export`/#185 deleted `asyncHandler`/`throwError` (plus
   7 other dead functions) during #177. Confirmed via `grep -n "^export
   const" src/utils/helper.ts` → only `getSelectFields`, `handleError`,
   `formatResponse`, `formatReturn` remain.
5. **`types/candidate.type.ts` description stale**: said "Types for PDF
   rendering", pre-dating `type-pdf-docx-export`/#185's shared
   `AggregatedCandidateData` type (now used by both `createPDF.ts` AND
   `createDocx.ts`). Confirmed by reading `types/candidate.type.ts`
   directly.
6. **`POST /bulk` undocumented in either file**: `add-bulk-import-cv-sections`/
   #161 (merged 2026-09-29, separate from and pre-dating #177) added
   `POST /api/v1/education/bulk` and `POST /api/v1/experience/bulk` —
   never added to either doc's API table. Confirmed the routes exist
   (`grep -n "bulk" src/routers/api/v1/*.route.ts`), the `MAX_BULK_ITEMS
   = 100` constant (`BaseController.ts:20`), and the exact response
   shape `data: { results, summary }` (`BaseController.ts:273`) by
   reading the real code, not the git log message alone.
7. **CLAUDE.md's Testing table missing 7 real files**: all pre-existing,
   unrelated to #177, just never backfilled. Confirmed via `find
   src/__tests__ -name "*.test.ts" -o -name "mongo.db.ts" | wc -l` → 31
   real files vs. 24 rows in the table before this fix; identified the
   7 missing ones by diffing the file list against the table, then read
   each file's `describe()` block to write an accurate one-line summary
   rather than guessing from the filename alone.
8. **README's "~20 files" test count**: same 31-file count from point 7.

## What changed, per file

**CLAUDE.md**:
- Version bump (1.7.0 → 1.8.1).
- New `Linting` row in the Tech Stack table + a short paragraph naming
  every active strict `tsconfig.json` flag and the ESLint rules
  enforcing no-`any`/no-`!`/no-unsafe-* (summarizing the real outcome
  of #177, not just restating the flag names).
- `npm run lint`/`npm run lint:fix` added to the Commands block.
- `utils/helper.ts`'s tree comment corrected to its real 4 remaining
  exports.
- `types/candidate.type.ts`'s tree comment corrected.
- `plugins/joi/` line removed from the Project Structure tree.
- `POST /bulk` documented under the CV Sections section.
- 7 missing rows added to the Testing table (in their correct
  alphabetical-by-directory position, matching the table's existing
  convention).

**README.md**:
- Version bump.
- Tech Stack table: `Language` row updated to name the strict flags
  (abbreviated, since README is the more user-facing of the two docs);
  new `Linting` row.
- `POST /bulk` documented under the CRUD Pattern section.
- `npm run lint` added to the Scripts list.
- Test file count corrected (~20 → 31) and the one-line file-group
  summary updated to reflect what's actually covered now.

## Explicitly not touched

- `errors/index.ts` vs. the real `errors/AppError.ts` + `errors/index.ts`
  split — `index.ts` re-exports `AppError.ts`'s contents, so CLAUDE.md's
  existing "errors/index.ts # AppError hierarchy" tree line is still
  accurate as the public entry point; not worth the extra tree noise of
  listing both files.
- No behavior, code, or test changes — this is a docs-only sync.
- Did not touch `CONTRIBUTING.md` or any other doc — out of the
  operator's explicit request (README.md + CLAUDE.md only).

## Verification

Since this is docs-only (no `src/` change), verification is cross-
checking every factual claim against the real codebase state directly,
not running `tsc`/`npm test`/`npm run build` (though confirmed via
`git status --short` that no `src/` file is touched, so the existing
#177 verification already stands unchanged):

- `grep -n "1.7.0\|plugins/joi\|asyncHandler, throwError" CLAUDE.md` → empty (all 3 stale strings gone).
- `grep -n "1.7.0\|~20 files\|plugins/joi" README.md` → empty.
- Re-read the full diff of both files end-to-end one more time before
  writing this note, confirming every line matches a fact checked above.

## Diff scope

```
git diff staging --stat
```
```
 CLAUDE.md  | 30 +++++++++++++++++++++++++-----
 README.md  | 11 +++++++----
 2 files changed, 32 insertions(+), 9 deletions(-)
```
Exactly the 2 files the operator asked for. No `src/`, `package.json`,
or `agent-hub/` content changed beyond this note + the diagram row.

## Status
`sealed_pending_verifier` — self-audited (docs-only, not outward-facing
beyond the PR/merge itself, same precedent as `update-project-docs`/#146
and `fix-claude-md-candidate-model-fields`/#148, both of which used an
audit-only verifier pass for the same reason).
