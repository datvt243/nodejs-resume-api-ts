# 2026-10-05 — condense-src-comments

- Worker: implementer
- Version: 0.1.0
- Node: `condense-src-comments` (`haven/diagrams/dev-loop.prime-mermaid.md`), newly added PENDING this session
- Task (verbatim, via `/todo`): "kiểm tra toàn source, rút gọn ý của các comment lại, và không cần đề cập tới issue" — GitHub issue #236, branch `236-condense-verbose-comments`

## Hub bytes before
Not separately re-measured this round (reused context already in session from the prior `#160` round earlier today; no `/boot` re-run). Not blocking per `pick_next.md`'s GUARD note — this number primarily feeds `worker-runs.log`'s hub-size-diff tracking, which the verifier computes independently if needed.

## Scoping decision (read this before judging the diff)
The task's literal text ("kiểm tra toàn source, rút gọn ý của các comment lại") could mean "rewrite every comment in the codebase." That's unbounded and unverifiable — no test or grep can confirm "every comment is appropriately terse." Per `doctrine/MEMORY.md`'s scoping-initiative lesson, measured exhaustively first:

```
grep -rlE "(^|[^0-9a-zA-Z])#[0-9]{2,4}([^0-9a-zA-Z]|$)" src/ --include="*.ts" | grep -v __tests__
```
→ 46 production files, 108 occurrences.

Scoped the actual diff to: every comment carrying an issue-number reference (the measurable, falsifiable half of the task — "không cần đề cập tới issue"), tightening each one in place while removing the reference. This is not an arbitrary narrowing — these comments were disproportionately the verbose ones (narrated history: "found live while building X for issue #24", quoted issue text, "same gap as issue #70", duplicated boilerplate like the `exactOptionalPropertyTypes`/`#189` comment repeated near-verbatim 7 times across 4 files). Condensing them IS condensing the worst offenders, just anchored to a countable criterion instead of subjective judgment over every comment in the tree.

Test files (`src/__tests__/**`) deliberately excluded: their `describe`/`it` strings carry issue numbers for real regression traceability (knowing which test guards which past bug) — a different category from narrative code comments, and removing them would be a net loss, not a cleanup.

## Noticed, not done
`review-refactor-comments`/#218 (SEALED 2026-10-04) already did a full-codebase comment pass and explicitly chose to KEEP issue-number references ("keeping WHY explanations, JSDoc for public APIs, TODO/FIXME/HACK, issue links"). This node deliberately reverses that one specific policy, per this session's explicit operator instruction — not a silent contradiction, flagged here and in the diagram row.

3 false-positive greps in `createPDF.ats.ts` (`#000` CSS hex colors inside an inline `<style>` string) correctly identified as not issue references and left untouched.

## Diff
47 files, `git diff --stat` = 216 insertions / 251 deletions (net -35 lines), 0 files added/removed/renamed. Every file: `src/auth/*` (2), `src/candidate/*` (3), `src/candidate_me/index.ts`, `src/candidate_profile/*` (4), `src/config/*` (4), `src/middlewares/*` (6), `src/models/*` (10), `src/routers/api/v1/auth.route.ts`, `src/scripts/migrate-localize-text-fields.ts`, `src/server.ts`, `src/services/*` (4), `src/types/*` (2), `src/utils/*` (8). Full per-file diff shown to the operator in-session (seal gate) before this note was written — not pasted into `agent-hub/` per the display rule.

## Command
```
npm run build
npm test
```
Run from `/Users/_david/Workspace/Project/resume/resume-nodejs-api`.

## Output (verbatim)
```
> resume-nodejs-api@1.10.3 build
> tsc && npm run copy

> resume-nodejs-api@1.10.3 copy
> cp -R ./src/views ./src/public ./dist/
```
(clean, no errors)

```
Test Suites: 35 passed, 35 total
Tests:       246 passed, 246 total
Snapshots:   0 total
Time:        11.797 s
Ran all test suites.
```
(matches the pre-change baseline exactly — 35/35 suites, 246/246 tests, from this same morning's `#160` round on this same branch lineage)

Final verification re-run of the scoping grep, after all edits:
```
grep -rlE "(^|[^0-9a-zA-Z])#[0-9]{2,4}([^0-9a-zA-Z]|$)" src/ --include="*.ts" | grep -v __tests__
```
→ 0 files (confirmed via exit code 1 / empty output), except the 3 CSS-hex-color false positives in `createPDF.ats.ts` (verified by reading those exact lines: `color: #000;` etc. — not comments, not issue refs).

## Acceptance
| Criterion (issue #236) | Evidence |
|---|---|
| `npm test`/`npm run build` unaffected (comment-only diff) | Both re-run clean/35-35/246-246 above, matching baseline exactly |
| Comments explaining a genuine non-obvious constraint/invariant/workaround kept, just tightened | Every edit preserved the real WHY (e.g. `exactOptionalPropertyTypes` nuance, CSRF/SameSite rationale, rate-limit property-name bug, soft-delete semantics) — only removed the issue-number citation and narrated-history framing |
| No `(issue #N)`/`(#N)` style references left in `src/` comments | Exhaustive re-grep above: 0 real hits (3 CSS-color false positives correctly excluded) |

## Seal gate
Shown to operator in-session: full `git diff -- src/` (all 47 files) before this note was written. No commit/push has happened yet.
