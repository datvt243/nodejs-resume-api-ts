# 2026-10-10 — add-visit-stats-endpoint (diff)

Worker: implementer
Version: 0.1.0
Node: `add-visit-stats-endpoint` (`haven/diagrams/dev-loop.prime-mermaid.md`)
Task: `/todo #164` — GitHub issue #164 "Extend public-profile visit analytics (time-series, sources)". Plan + operator decisions: `evidence/implementer/2026-10-10/add-visit-stats-endpoint-plan.md`.
Branch: `164-extend-public-profile` (base `staging` @ `b8bcb39`). Status: sealed_pending_verifier.

## Hub bytes before: 228015

## Diff
`git diff --stat` (new files via `git add -N`): 8 files, 507(+)/1(-).

| File | Why |
|---|---|
| `src/candidate/visitStats.service.ts` (new) | `resolveVisitStatsQuery(raw, nowMs)`: interval ∈ day/week/month (default day); `tz` validated with `Intl.DateTimeFormat` (default `Asia/Ho_Chi_Minh`); strict round-tripping `YYYY-MM-DD` dates; default `to` = today in tz, `from` = to − 29 days; rejects from > to, non-string values, and > 400 buckets (cheap day-span pre-check, then exact label count) → null. `handlerGetVisitStats(candidateId, query)`: one `Visit.aggregate` — `$match` on `candidateId: new Types.ObjectId(candidateId)` (aggregate does not auto-cast) and `createdAt ∈ [local midnight of from, local midnight of to+1)` computed via `Intl` offsets (two-pass for DST); `$facet` with series `$group` on `$dateToString` (`%Y-%m-%d` / `%G-W%V` / `%Y-%m`, `timezone: tz`) and countries `$group` on the trimmed last comma part of `location` (empty → null), sorted count desc. JS `bucketLabel` mirrors the formats (ISO week via Thursday rule) to zero-fill the series; `total` = sum. Only Mongo ≥ 4.0 operators used (prod Mongo version not recorded in repo). No date library added. |
| `src/candidate/candidate.controller.ts` | `fnGetVisitStats`: `AuthenticationError` without `req.user._id`; invalid query → 400 `candidate.visitStatsInvalidQuery` before any DB call; id always `req.user._id`. `fnGetVisits` / `handlerGetVisits` untouched. |
| `src/routers/api/v1/candidate.route.ts` | `router.get('/visits/stats', fnGetVisitStats)` + `@swagger`, right after `/visits` (both before `/:email`). |
| `src/locales/{en,vi}.ts` | `candidate.getVisitStatsSuccess`, `candidate.visitStatsInvalidQuery`. |
| `src/__tests__/candidate/visitStats.service.test.ts` (new) | 20 tests (aggregate mocked via standalone `mockAggregate`): defaults incl. VN "today" when UTC is still the previous day; tz-dependent today; explicit params; 7 rejection cases; long monthly range allowed; `$match` ObjectId cast + exact VN midnight bounds; America/New_York DST-start-day bounds (05:00Z → next day 04:00Z); zero-fill + total + countries mapping; ISO week labels across 2026-W53 → 2027-W01; month labels; country expression shape + sort; controller 400 without DB call; client-supplied `candidateId` in query/body ignored; 401 without user. |
| `CLAUDE.md`, `README.md` | Endpoint rows, structure entry, test-table row, test count 38 → 39. |

## Live check against real MongoDB (not committed)
Throwaway `mongod` v8.0.1 (`--port 27998 --bind_ip 127.0.0.1`, data dir under the session scratchpad). Probe in `src/__probe__/` deleted after the run (`ls src | grep -c probe` → `0`), mongod stopped (`stopped`), data dir removed. Seeded 10 visits: VN-midnight edges on both sides (`2026-10-01T16:59:59Z`, `2026-10-01T17:00:00Z`), out-of-range edges (`2026-09-30T16:59:59Z`, `2026-10-03T17:00:00Z`), an empty location, another candidate's visit, and ISO-week edges `2026-12-31` / `2027-01-04`. Verbatim:
```
DAY {"interval":"day","tz":"Asia/Ho_Chi_Minh","from":"2026-10-01","to":"2026-10-03","total":5,"series":[{"bucket":"2026-10-01","count":2},{"bucket":"2026-10-02","count":2},{"bucket":"2026-10-03","count":1}],"countries":[{"country":"VN","count":2},{"country":null,"count":1},{"country":"JP","count":1},{"country":"SG","count":1}]}
DAY-UTC [{"bucket":"2026-10-01","count":3},{"bucket":"2026-10-02","count":1},{"bucket":"2026-10-03","count":2}]
WEEK [{"bucket":"2026-W53","count":1},{"bucket":"2027-W01","count":1}]
MONTH [{"bucket":"2026-09","count":1},{"bucket":"2026-10","count":6},{"bucket":"2026-11","count":0},{"bucket":"2026-12","count":1},{"bucket":"2027-01","count":1}]
RAW /visits count 9 keys count,visits
route order: post /upload-cv | post /parse-linkedin-export | post /parse-cv-pdf | get /cv-file | get /visits | get /visits/stats | get /:email | put /update | patch /update | delete /
```
Hand-check: VN Oct 1 = {03:00Z, 16:59:59Z} = 2; Oct 2 = {17:00Z Oct 1 (00:00 VN), 10:00Z} = 2; Oct 3 = {16:30Z} = 1; both out-of-range edges and the other candidate excluded. UTC view of the same data shifts the 17:00Z visit back to Oct 1 (3/1/2), which proves the tz matters. Mongo's `%G-W%V` output equals the JS zero-fill labels at the 53-week boundary. Raw `/visits` keeps its `count,visits` shape (9 = all of this candidate's seeded visits).

## Command
From repo root, per `doctrine/MEMORY.md`: `npm test`, `npm run build`, `npm run lint` (as `npm run lint -- --format json -o …`, compared rule-by-rule with a baseline taken the same way before any `src/` edit).

## Output
`npm test` (load average 7.62):
```
TEST_EXIT=0
Test Suites: 39 passed, 39 total
Tests:       306 passed, 306 total
Time:        30.437 s
PASS src/__tests__/candidate/visitStats.service.test.ts
PASS src/__tests__/candidate/candidate.controller.test.ts
```
`npm run build`:
```
BUILD_EXIT=0
> resume-nodejs-api@1.11.1 copy
> cp -R ./src/views ./src/public ./dist/
```
Lint:
```
lint before 276 after 276
__tests__/candidate/visitStats.service.test.ts 0
candidate/visitStats.service.ts 0
locales/en.ts 0
locales/vi.ts 0
routers/api/v1/candidate.route.ts 0
```
(no `DELTA` lines)

## Acceptance
| Criterion | Evidence |
|---|---|
| Own data only (`req.user._id`, cast to ObjectId) | unit `matches only this candidate (cast to ObjectId)…`, `always uses the authenticated id, never a client-supplied candidateId` ✓; live: other candidate's visit absent from DAY |
| Time-bucketing on seeded multi-day visits incl. local-midnight boundary | live DAY / DAY-UTC / WEEK / MONTH output + hand-check above; unit zero-fill, ISO week, month, DST bound tests ✓ |
| Country breakdown | live `countries` VN 2 / null 1 / JP 1 / SG 1; unit country-expression test ✓ |
| 400 on invalid interval / dates / tz / range | 7 `rejects …` unit tests + `returns 400 without querying on an invalid query` ✓ |
| No regression to `GET /visits` | `handlerGetVisits`/`fnGetVisits` not in the diff; live `RAW /visits count 9 keys count,visits` |
| Referrer deferred (operator decision) | follow-up issue opened: https://github.com/datvt243/resume-nodejs-api/issues/248 |
| Full suite / build / lint | `Tests: 306 passed, 306 total`, `BUILD_EXIT=0`, `lint before 276 after 276` |
| comments per code-comments.md | WHY/JSDoc only: service overview JSDoc (zero-fill + tz contract), `VISIT_STATS_MAX_BUCKETS` `//`, `BUCKET_FORMATS` JSDoc (ISO week, mirrored by `bucketLabel`), `parseLocalDate` (why round-trip), `tzOffsetMs`/`localMidnightUtc` (DST two-pass), `bucketLabel` (why mirror), `resolveVisitStatsQuery` JSDoc (contract), day-span `//`, `COUNTRY_EXPRESSION` JSDoc (location format), `handlerGetVisitStats` JSDoc (why explicit ObjectId cast), controller one-line `//`, test header. No issue refs in production comments. Swagger is a functional doc block. |

## Noticed, not done
- Region breakdown not added: `location` doesn't reliably carry a region (geoip parts are optional), so a positional parse would mislabel. Country only, as `countries`.
- Production MongoDB version isn't recorded anywhere in the repo; the pipeline uses only operators available since Mongo 4.0. Worth recording the real version in `doctrine/domains/PROJECT.md` at some point.
- Outward-facing action taken in this pass: opened follow-up GitHub issue #248 (referrer tracking), as the operator chose ("Defer to new issue") in the up-front AskUserQuestion.

## Seal gate
No commit/push. One outward action: `gh issue create` → #248, approved by the operator's explicit choice of the "Defer to new issue (Recommended) — I'll open a follow-up issue" option.
