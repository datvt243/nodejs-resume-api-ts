# 2026-10-10 — add-visit-stats-endpoint (verifier verdict)

Worker: verifier (independent subagent, dispatched via Agent tool) · Version 0.1.0
Node: `add-visit-stats-endpoint` (`haven/diagrams/dev-loop.prime-mermaid.md`)
New PM status: **SEALED**

## Isolation proof
This was a fresh Agent spawn, briefed as "Verify add-visit-stats-endpoint seal". It received the verbatim verifier bundle (manifest, SOUL, verify_seal recipe) and the `hub_bytes_before=228015` hand-off, neither of which was part of the implementer pass. It has no memory of that pass. I wrote no code under `src/`. My temporary probe `src/__probe__/` was deleted afterwards (`find src -name '*probe*'` returned 0), and `git status --short` matches the starting snapshot.

## Reasoning
I read both implementer notes (`evidence/implementer/2026-10-10/add-visit-stats-endpoint-{plan,diff}.md`). I then checked them against the real working tree: `git diff` for the controller, route, locales, `CLAUDE.md`, `README.md` and the diagram, plus the full new files `src/candidate/visitStats.service.ts` and `src/__tests__/candidate/visitStats.service.test.ts`. The note matches what is on disk. The commands match `doctrine/MEMORY.md`: `npm test`, `npm run build` (the Typecheck row) and `npm run lint`. None of the output is truncated.

| Criterion | Evidence |
|---|---|
| Own visits only: `req.user._id` cast to ObjectId, never client-supplied | Code: `fnGetVisitStats` passes only `req.user._id`, and `/candidate` is mounted behind `verifyToken` (`src/routers/api/v1/index.ts:26`). `$match.candidateId` is `new Types.ObjectId(candidateId)`, and `Visit.candidateId` has schema type ObjectId. Unit tests `matches only this candidate (cast to ObjectId)…` and `always uses the authenticated id, never a client-supplied candidateId` PASS in my re-run. **Independent mongod probe:** the other candidate's visits fell inside every probe window and were never counted. A `$match` with the uncast hex string matched **0** docs, so the cast is required and it is present. |
| Bucketing on seeded multi-day visits, incl. local-midnight boundary | Implementer live run: VN midnight edges at 16:59:59Z / 17:00Z, a DAY vs DAY-UTC contrast, and WEEK/MONTH output, with a hand-check. **My probe used different zones and dates:** NY DST-start 2026-03-08 counted exactly `[05:00Z, 03:59:59Z+1d]` = 2. NY DST-end 2026-11-01 counted exactly `[04:00Z, 04:59:59Z+1d]` = 2. Asia/Kolkata 18:29:59Z / 18:30Z split across 05-31 and 06-01. ISO weeks: 2020-12-31 and 2021-01-03 went to `2020-W53` and 2021-01-04 to `2021-W01`; 2024-12-29 went to `2024-W52` and 2024-12-30 to `2025-W01`. The JS zero-fill `bucketLabel` week labels equal Mongo `$dateToString %G-W%V` for every day 2015–2035 (1097 labels, `EQUAL`). |
| Country breakdown from `location` | The last comma part is trimmed, and an empty value maps to null (matching how `candidate_me/index.ts:264` writes `city, region, country`). Probe: `' Mumbai, MH, IN '` and `'IN'` both grouped as `IN`. Implementer live run: VN 2 / null 1 / JP 1 / SG 1. |
| 400 on invalid interval / dates / tz / range | `resolveVisitStatsQuery` returns null for unknown interval, non-string/array values, non-round-tripping dates, from > to, an invalid IANA tz (`Intl` throws), or > 400 buckets. The controller returns 400 before any DB call. The 7 `rejects …` tests and `returns 400 without querying…` PASS. Probe: a 2015–2035 weekly range was rejected as designed. |
| No regression to `GET /visits` | `git diff` does not touch `fnGetVisits` or `handlerGetVisits`. `/visits/stats` is a separate route with two path segments, so it cannot collide with `/:email`. Implementer live run: `RAW /visits … keys count,visits`. `candidate.controller.test.ts` PASS. |
| `npm test` | Verifier re-run: `Test Suites: 39 passed, 39 total`, `Tests: 306 passed, 306 total`, TEST_EXIT=0. |
| Typecheck (`npm run build`) | Verifier re-run: `BUILD_EXIT=0`, ending in `cp -R ./src/views ./src/public ./dist/`. |
| `npm run lint`: no new problems | Verifier re-run: `npx eslint . --format json` on the diff tree, then on a `git stash push -u` baseline (`git status --short` identical before and after the pop). Result: `lint before 276 after 276`, no rule deltas. The new service, its test, the locales and the route file have 0 problems. The controller has 7 problems before and 7 after, all at lines outside the inserted block (they shifted down). |
| comments per code-comments.md | Every comment is a WHY or JSDoc on an exported API or non-obvious helper: the file overview (zero-fill + tz contract), the `VISIT_STATS_MAX_BUCKETS` single `//`, `BUCKET_FORMATS` (ISO week mirrored by `bucketLabel`), `parseLocalDate` (why round-trip), `tzOffsetMs` / `localMidnightUtc` (DST two-pass), `COUNTRY_EXPRESSION` (location format), and `handlerGetVisitStats` (why the explicit cast). The controller has a one-line `//`. The `@swagger` block is a functional doc block. There are no `(#N)` refs and no stacked `//`. `@author`/`@see` are present although the opt-in is OFF; that mirrors every sibling in `src/candidate/`. The test header's mention of the live-mongod run explains why mocks suffice. It is a WHY, so I did not count it as a violation. |

Forbidden states: none apply.
- ADHOC_WORK: the node is on the diagram and the worker identity is recorded.
- NO_EVIDENCE: the plan and diff notes exist.
- EDIT_UNVERIFIED: I re-ran test, build and lint, and the results match the note.
- CODE_IN_HAVEN: the only `haven/` change is the diagram row.
- DIAGRAM_DRIFT: the row is now SEALED.

Seal gate: there was no commit or push. The one outward action was `gh issue create` → #248 (deferred referrer tracking). The plan note records it as the operator's explicit pick of the AskUserQuestion option "Defer to new issue … I'll open a follow-up issue". That pick is an approval of that exact action, and it is consistent with `/todo` itself opening issues on operator invocation. The note does not quote the issue's title or body, and I did not check #248 on GitHub (out of bounds for this spawn). The action is recorded and approved, so it does not block the seal. Both temp `mongod` instances bound to 127.0.0.1 only. Mine (port 27991) was shut down and its directory deleted.

Proportion: the diff is limited to the endpoint, its test, two locale keys, the swagger block and the doc rows. There is no schema change and no new dependency.

Noted, out of scope (not blocking):
- In a zone whose DST jump happens exactly at local midnight (e.g. America/Santiago), `localMidnightUtc` resolves the non-existent 00:00 to 23:00 of the previous day. That window then starts one hour early: those visits count in `countries` but fall outside the zero-filled `series` labels, so `total` is unaffected. The default zone and every common zone are unaffected.
- The production Mongo version is still unrecorded (already flagged by the implementer).
- An invalid-hex `req.user._id` would make `new Types.ObjectId` throw, which `handleError` turns into a 500. That is unreachable with a verified JWT.

## Re-run
partial. I re-ran `npm test`, `npm run build` and an eslint before/after comparison via `git stash`. The pass included an outward action, and the node's core claims cannot be proven by mocked tests: ObjectId ownership under `aggregate`, and Mongo tz/ISO-week bucketing versus the JS zero-fill labels. So I also ran an independent real-`mongod` probe of the actual service on zones, DST days and week-year edges that the implementer's live run did not cover.
