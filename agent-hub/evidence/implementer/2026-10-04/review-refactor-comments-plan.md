# 2026-10-04 — review-refactor-comments (implementer note)

- Worker: implementer (main session)
- Node: `review-refactor-comments`
- GitHub issue: #218
- Branch: `218-review-va-refactor` (forked from `origin/staging`, which
  includes everything through `swagger-cv-token-docs`/today's earlier
  work)

## Task (operator's own spec, via `/todo`)
Review and refactor comments across all JS/TS source:
1. **Remove**: comments duplicating code, "WHAT not WHY", too-obvious,
   trivial. **Keep**: WHY-explanations of non-obvious logic, JSDoc on
   public APIs/functions, TODO/FIXME/HACK, issue/doc links.
2. **Standardize style**: `//` for single-line notes/TODO/inline logic;
   `/** */` for JSDoc on functions/APIs and any explanation spanning
   more than one sentence.

## Measured before touching anything (initiative-scoping.md compliance)
Before carving into phases, ran an exhaustive AST-based scan (TypeScript
compiler API, `ts.getLeadingCommentRanges`) over every non-test `.ts`
file in `src/` — not a grep sample:

```
files with >=1 comment: 120 / 124
TOTAL jsdoc blocks: 358
TOTAL non-jsdoc block comments: 25
TOTAL line (//) comments: 572
TOTAL comment units: 955
```

Cross-checked a hypothesis before acting on it: `grep -c "@swagger" src/routers/api/v1/*.route.ts src/routers/api/v1/index.ts src/candidate_me/*.ts`
→ exactly 70 of the 358 JSDoc blocks are `@swagger` annotations
(functional OpenAPI docs `swagger-jsdoc` parses to generate `/api-docs`,
not narrative comments) — confirmed by reading several route files
directly, not just the grep count. These are explicitly OUT OF SCOPE:
removing/restyling them would break the generated API spec.

Found and verified a second exhaustive measurement: exactly 70 of the
124 files carry the identical empty boilerplate header:
```
/**
 * Author: Đạt Võ - https://github.com/datvt243
 * Date: `--/--`
 * Description:
 */
```
(verified via a loop checking both the `Author:` line and an empty
`Description:` line per file, not a guess) — zero information beyond
what `git blame`/`git log` already gives (unfilled `Date` placeholder,
blank `Description`). 27 more files have the same header shape but with
a real one-line description (left alone/reviewed individually, not
auto-stripped).

Presented this measurement to the operator (via AskUserQuestion) before
proceeding, per `doctrine/standards/initiative-scoping.md` ("plan phases
from the real measured table, not from grep sampling or guessing").
Operator chose "do it all in one pass" over the proposed phased-by-
directory rollout.

## What was done

### Phase 1 — mechanical (scripted, verified)
Stripped the exact 70-file empty-header pattern via a regex script
(`/tmp/empty-header-files.txt` list + a one-off Node script, never
committed — scratch only). Verified: script matched and changed
67/70 on the first pass; the remaining 3 (`auth/auth.controller.ts`,
`services/index.ts`, `utils/index.ts`) had no trailing blank line after
the header, so the regex was adjusted (`\n\n?` instead of `\n\n`) and
re-run — confirmed all 3 then matched. `git diff --stat` after this
phase: exactly 70 files, 417 deletions, 0 insertions (pure removal, no
reformatting).

### Phase 2 — per-file review (manual judgment, ~54 files with real content)
Went through every remaining file with comments, file by file (`Read`
each, decide per comment, `Edit`). Applied consistently:
- **Removed**: comments that purely restate the next line in different
  words ("validate data gửi lên" above a `validateSchema` call, "get
  values"/"save"/"update data"/"return" one-word action labels, Vietnamese
  field-name translations duplicating the field name itself e.g. `/* họ
  và tên */` above `firstName`/`lastName`), pseudo-`@return` JSDoc blocks
  that duplicate what TypeScript's own inferred return type already
  states exactly (and can drift out of sync, unlike a real type), fully
  dead commented-out code (`/* res.send(...) */` debug leftovers, a
  commented-out `exitHook` block, a commented-out alternate route
  handler, a commented-out Joi field), and empty comment placeholders
  (`//` with nothing after it, `/**\n *\n */` with nothing inside).
- **Kept, trimmed where mixed**: comments that mix an obvious
  restatement with a genuine WHY clause — kept only the WHY clause (e.g.
  `BaseController.ts`'s ownership-check comments: dropped "Check Document
  có tồn tại không -> findById", kept the `excludeDeleted`/issue-#136
  rationale).
- **Kept as-is**: every genuine WHY/bug-history/security-rationale
  comment, every `@swagger` block, every TODO (one real TODO preserved
  from inside a dead `exitHook` block in `server.ts`, rewritten as a
  live standalone `// TODO: close the MongoDB connection on process exit
  (coming soon)` since the code around it was non-functional — the
  marker itself is kept per the operator's explicit "keep TODO" rule,
  the dead wrapper code around it isn't).
- **Style-converted `//` → `/** */`**: every comment block found to span
  2+ sentences (verified via a second automated pass: a small Python
  script that walks every remaining `//` comment in every non-test file,
  joins consecutive `//` lines, and flags any block whose joined text
  has 2+ sentence-ending punctuation marks — not just comments I happened
  to notice by eye). Caught and fixed a few I'd missed on first pass this
  way (`models/visit.model.ts`, `candidate_me/index.ts`'s
  `?template=ats` note, `createPDF.ats.ts`'s sanitize-html rationale,
  `BaseController.ts`'s `SORT_FIELD_REGEX` note) — confirmed by rerunning
  the same scanner after fixing, zero genuine multi-sentence `//` blocks
  remained (the few it still flagged after the fix were "e.g."
  false-positives from the sentence-boundary heuristic, verified by
  reading each one directly).
- **Style-converted `/* ... */` (single-line) → `//`**: 6 instances —
  5 in `models/candidate.model.ts`, 1 in `models/generalInformation.model.ts`
  — single-line block-style comments that should be `//` per the
  standardization rule.

## Scope confirmed
`@swagger` JSDoc blocks: confirmed zero touched — `grep -c "@swagger"`
on every route file before/after gives identical counts.

## Test run (verbatim, run repeatedly throughout — not just once at the end)
Ran `npx tsc --noEmit` after every batch of file edits (7 checkpoints
across the session) — every single one came back clean, confirming
comment-only changes never broke a type. Final full verification:

```
npm run build
> tsc && npm run copy
> cp -R ./src/views ./src/public ./dist/
```
Clean, no errors.

```
npm test
Test Suites: 35 passed, 35 total
Tests:       235 passed, 235 total
Snapshots:   0 total
Time:        10.083 s, estimated 12 s
Ran all test suites.
```
Identical to the pre-existing baseline (same 35/235 as every prior node
this session) — confirms zero runtime behavior change from a
comment-only diff, as the task required.

## Final diff stat
```
97 files changed, 587 insertions(+), 1326 deletions(-)
```

### Totals (operator's requested report format)
Measured directly from `git diff` rather than estimated:
- **Files modified**: 97 (all under `src/`, non-test)
- **Comments converted `//` → `/** */`**: 72 — cross-validated two
  independent ways: (a) counting new `/**` opening-delimiter lines added
  in the diff (`git diff | grep -cE "^\+\s*/\*\*\s*$"` → 72), (b) an
  independent manual tally of every individual conversion edit made
  during Phase 2, summed per file → 72. Both numbers match exactly.
- **Comments converted `/* ... */` (single-line) → `//`**: 6 (all in
  `models/candidate.model.ts` ×5 and `models/generalInformation.model.ts` ×1).
- **Comments/dead code removed entirely**: 175 `/** */` blocks whose
  opening delimiter was removed with no corresponding new block created
  nearby (i.e. not one of the 72 conversions — a true deletion), plus
  the bulk of 459 removed `//` lines not consumed by a conversion (the
  70 Phase-1 header blocks are included in this 175, since each header
  is itself one `/**`-delimited block), plus 24 removed single-line
  `/* ... */` dead-code/comment lines. Exact per-category line
  attribution beyond this is an estimate, not a forensically exact
  count — the underlying `git diff` numbers above (175/459/24) are the
  directly-measured, independently-reproducible figures; "every single
  one of these N was category X vs Y" was not re-derived line-by-line
  for all 97 files given the scale, consistent with `edit-verification.md`
  (report what was actually measured, not a number that sounds
  more precise than what was checked).

## Representative examples (not exhaustive — see `git diff` for the full 97-file diff)

**Removed (duplicate/obvious/dead code):**
```diff
- /**
-  * Author: Đạt Võ - https://github.com/datvt243
-  * Date: `--/--`
-  * Description:
-  */
  import { Request, Response, NextFunction } from 'express';
```
```diff
- /**
-  * @return
-  *  success: boolean,
-  *  message: string,
-  *  data: Document,
-  *  error: Array
-  *
-  */
  const id = typeof item['_id'] === 'string' ? item['_id'] : undefined;
```
```diff
-   // Open the generated PDF file in the default PDF viewer
-
-   // try {
-   //     await (async () => {
-   //         const open: any = await import('open');
-   //         await open(`${URL}${email}.pdf`, { wait: true });
-   //     })();
-   //
-   // } catch (e) {
-   //     console.log({ e })
-   // }
-
    await browser.close();
```

**Converted `//` → `/** */` (2+ sentences):**
```diff
- // Soft-delete (issue #121): exclude documents that have been soft-deleted
- // by default. `fields` can never override this key (safeQuery only ever
- // merges keys from its own allow-list into the base query), so every
- // existing caller keeps working unchanged — they just stop seeing
- // soft-deleted rows.
+ /**
+  * Soft-delete (issue #121): exclude documents that have been soft-deleted
+  * by default. `fields` can never override this key (safeQuery only ever
+  * merges keys from its own allow-list into the base query), so every
+  * existing caller keeps working unchanged — they just stop seeing
+  * soft-deleted rows.
+  */
```

**Converted `/* ... */` (single-line) → `//`:**
```diff
-     /* vanity slug cho public profile (issue #120) — không phải PII như email, an toàn hơn để share */
+     // vanity slug cho public profile (issue #120) — không phải PII như email, an toàn hơn để share
      slug: {
```

**Kept unchanged (genuine WHY, JSDoc on public API, `@swagger`, TODO)** —
e.g. `services/createPDF.ats.ts`'s whole-file header, every `@swagger`
block in `routers/api/v1/*.route.ts`, `utils/sessionRevocation.ts`'s
design-rationale header (tokenVersion-field alternative rejected, cites
the real Redis/mem-fallback pattern reused) — left byte-for-byte
identical.

No commit/push has happened yet.
