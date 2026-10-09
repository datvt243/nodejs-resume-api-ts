# 2026-10-10 — add-public-profile-search (diff)

Worker: implementer
Version: 0.1.0
Node: `add-public-profile-search` (`haven/diagrams/dev-loop.prime-mermaid.md`)
Task: `/todo #163` — GitHub issue #163 "Full-text/keyword search on public candidate profiles". Plan + operator decisions: `evidence/implementer/2026-10-10/add-public-profile-search-plan.md`.
Branch: `163-full-text-keyword` (base `staging` @ `884637f`). Status: sealed_pending_verifier.

## Hub bytes before: 226157

## Diff
`git diff --stat` (new files via `git add -N`): 7 files, 398(+)/2(-).

| File | Why |
|---|---|
| `src/candidate_me/search.ts` (new) | `handlerSearchPublicProfiles({ query, page, limit })`: builds one `new RegExp(escapeRegex(query), 'i')`; `distinct('candidateId', …)` on GeneralInformation (`positionDesired`, `professionalSkills.name`), Experience (`company`, `position`, `skills`), Education (`school`, `major`), each with `deletedAt: null`; Candidate filter `{ _id: { $in: ids }, isPublic: { $ne: false }, slug: { $nin: [null, ''] } }` with projection `{ _id, slug, firstName, lastName, isPublic }`, sort `_id`, skip/limit, plus `countDocuments` on the same filter; returned rows re-filtered (`isPublic !== false` and non-empty slug) as defense in depth; `positionDesired` joined from GeneralInformation; returns `{ items: [{ slug, firstName, lastName, positionDesired }], pagination: { page, limit, total, totalPages } }` (same pagination shape as `baseFindDocument`). `fnSearchPublicProfiles`: `q` must be a string, trimmed length 2–100, else 400 `publicSearch.invalidQuery` without touching the DB; `page` default 1, `limit` default 20 capped at 100 (same cap as `MAX_PAGE_LIMIT`); errors → `handleError`. |
| `src/routers/index.ts` | `router.get('/api/me/search', fnSearchPublicProfiles)` + `@swagger` block, placed BEFORE `/api/me/:email` (operator-accepted: a slug literally "search" is shadowed; documented in swagger description). |
| `src/locales/{en,vi}.ts` | `publicSearch.invalidQuery` (same key both files). |
| `src/__tests__/candidate_me/search.test.ts` (new) | 14 tests, models mocked through standalone `mock*` fns (avoids `unbound-method`): filter sent to Mongo (public + slug + `$in` ids, same filter to count); regression — DB-returned private / missing-slug / empty-slug rows never reach `items`; doc without `isPublic` treated as public; items exact-equal whitelisted 4 fields even when the row carries `email`/`password`, and the projection asserted; escaped pattern for `C++ (senior)` on exactly the agreed fields; operator-looking input stays a literal RegExp value, filter keys only `deletedAt`/`$or`; pagination skip/limit/totalPages; controller 400 for missing / 1 char / whitespace / 101 chars / array `q` with no DB call; default page + limit cap + trim; DB error forwarded as 500. |
| `CLAUDE.md`, `README.md` | Endpoint rows, structure entry, test-table row, README feature bullet + test count 37 → 38. |

## Live check against real MongoDB (not committed)
Mocked tests can't prove Mongo's own semantics for `$ne: false` / `$nin: [null, '']`, so I ran the real handler and real router against a throwaway local `mongod` (`/opt/homebrew/bin/mongod --dbpath <scratchpad>/mongo-db --port 27999`). The probe script was copied into `src/__probe__/` only for the run and deleted right after (`ls src | grep -c probe` → `0`). mongod was shut down (`nc -z 127.0.0.1 27999` → `stopped`) and its data dir removed.
Seeded candidates: `jane-doe` (isPublic true), `old-timer` (no isPublic field), `pri-vate` (isPublic false), one with no slug field, one with `slug: null`, one with `slug: ''` — all 6 have the same matching Experience; plus a candidate whose only match is a soft-deleted Experience. Verbatim output:
```
{"q":"vue","items":[{"slug":"jane-doe","firstName":"Jane","lastName":"Doe","positionDesired":"Backend Engineer"},{"slug":"old-timer","firstName":"Old","lastName":"Timer","positionDesired":""}],"pagination":{"page":1,"limit":20,"total":2,"totalPages":1}}
{"q":"node","items":[{"slug":"jane-doe","firstName":"Jane","lastName":"Doe","positionDesired":"Backend Engineer"}],"pagination":{"page":1,"limit":20,"total":1,"totalPages":1}}
{"q":"bách khoa","items":[{"slug":"old-timer","firstName":"Old","lastName":"Timer","positionDesired":""}],"pagination":{"page":1,"limit":20,"total":1,"totalPages":1}}
{"q":"deleted co","items":[],"pagination":{"page":1,"limit":20,"total":0,"totalPages":1}}
{"q":".*","items":[],"pagination":{"page":1,"limit":20,"total":0,"totalPages":1}}
{"q":"acme","items":[{"slug":"old-timer","firstName":"Old","lastName":"Timer","positionDesired":""}],"pagination":{"page":2,"limit":1,"total":2,"totalPages":2}}
route order: get /api/me/search | get /api/me/:email | post /api/me/:email/visit | get /api/* | get /*
```

## Command
From repo root, per `doctrine/MEMORY.md`: `npm test`, `npm run build`, `npm run lint` (as `npm run lint -- --format json -o …`, compared rule-by-rule with a baseline taken the same way before any `src/` edit).

## Output
`npm test` (final tree, load average 9.93):
```
TEST_EXIT=0
Test Suites: 38 passed, 38 total
Tests:       286 passed, 286 total
Time:        20.005 s, estimated 26 s
PASS src/__tests__/candidate_me/index.test.ts (5.817 s)
PASS src/__tests__/candidate_me/search.test.ts
```
`npm run build`:
```
BUILD_EXIT=0
> resume-nodejs-api@1.11.1 copy
> cp -R ./src/views ./src/public ./dist/
```
Lint (final tree):
```
lint before 276 after 276
__tests__/candidate_me/search.test.ts 0
candidate_me/search.ts 0
locales/en.ts 0
locales/vi.ts 0
routers/index.ts 0
```
(no `DELTA` lines). An intermediate run showed `lint before 276 after 281` / `DELTA @typescript-eslint/unbound-method 55 -> 60`, all 5 in `search.test.ts` (`expect(MODEL.X.method)` references). Fixed by switching to standalone `mock*` functions, then re-ran everything above.

## Acceptance
| Criterion | Evidence |
|---|---|
| Never returns a non-public or slug-less candidate (regression test) | unit: `only ever asks Mongo for public candidates that have a slug…`, `never returns a non-public or slug-less candidate, even if the DB hands one back` ✓; live Mongo: `vue` matched all 6 seeded candidates via Experience → only `jane-doe` + `old-timer` returned |
| Legacy doc without `isPublic` counts as public | unit `treats a document without isPublic as public` ✓; live `old-timer` returned |
| Only whitelisted public fields (no password/email) | unit `returns only whitelisted public fields — never email or password` ✓ (exact `toEqual` + projection asserted); live output items carry only `slug/firstName/lastName/positionDesired` |
| Input regex-escaped, no user-controlled keys/operators | unit `matches the query as an escaped…` + `keeps operator-looking input as literal text…` ✓; live `.*` → `total: 0` |
| Agreed fields; soft-deleted excluded | unit asserts exact `distinct` filters ✓; live `node` (professionalSkills.name), `bách khoa` (Education.school, case-insensitive Vietnamese), `deleted co` → 0 |
| `page`/`limit`, `{ items, pagination }`, cap 100 | unit `paginates…`, `defaults page/limit, caps limit at 100…` ✓; live `acme` page 2 limit 1 → `total 2, totalPages 2` |
| 400 on missing / short / long `q` | unit `returns 400 without querying when q is …` ×5 ✓ |
| Route reaches search, not `/:email` | live `route order: get /api/me/search | get /api/me/:email | …` |
| Full suite / build / lint | `Tests: 286 passed, 286 total`, `BUILD_EXIT=0`, `lint before 276 after 276` |
| comments per code-comments.md | New comments are WHY or JSDoc on exported/public pieces: file-overview JSDoc (contract + why slug-only), `MAX_LIMIT` (same cap as baseFindDocument), `escapeRegex` JSDoc (why no injection), filter JSDoc (why `$ne: false` / `$nin`), defense-in-depth `//` line, test-file header, standalone-mocks `//` line. No issue refs in production comments; swagger block is a functional doc block. File-header opt-in OFF; `search.ts` carries the same `@author`/`@see` as its sibling `ats-check.ts`. |

## Noticed, not done
- No text index: every search scans the 3 section collections with a case-insensitive regex. Fine at current data size (operator choice); a separate node should revisit if usage grows.
- `slug` "search" is shadowed by the new route (operator-accepted). `utils/slug.ts` has no reserved-word list; adding `search` there is a possible follow-up node, not done here.
- `GET /api/me/search` uses the general rate limiter only (100 req/15 min), like the other `/api/me/*` routes.

## Seal gate
No outward-facing action (no commit/push). `src/` changes shown in-session via the Write tool output. The local throwaway `mongod` bound to 127.0.0.1 only, with no external service involved.
