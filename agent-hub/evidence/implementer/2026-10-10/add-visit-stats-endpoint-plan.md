# 2026-10-10 — add-visit-stats-endpoint (plan)

Worker: implementer
Version: 0.1.0
Node: `add-visit-stats-endpoint` (`haven/diagrams/dev-loop.prime-mermaid.md`, appended PENDING at table end)
Task (via `/todo #164`): GitHub issue #164 "Extend public-profile visit analytics (time-series, sources)" — full body read via `gh issue view 164`.
Branch: `164-extend-public-profile` (from `staging` @ `b8bcb39`, via `gh issue develop`).

## Hub bytes before: 228015

## Scoping — open questions asked before coding
Asked the operator (AskUserQuestion):
1. Referrer/source tracking → deferred to a new follow-up issue (only part needing a schema change); this node does time-series + country breakdown only.
2. Endpoint → new `GET /api/v1/candidate/visits/stats`; existing `GET /visits` unchanged.
3. Bucket timezone → optional validated IANA `tz` query param, default `Asia/Ho_Chi_Minh`.
Decided without asking (conventional): zero-filled series so a chart needs no gap handling; ISO weeks (`YYYY-Www`, Monday start); `from`/`to` are inclusive local dates, default last 30 days; bucket count capped (400) to bound zero-fill size; country = last comma part of `location` (`geoip-lite` writes `city, region, country`), empty → null.

## Acceptance
1. Own data only: `.candidateId` = `new Types.ObjectId(req.user._id)` (aggregate does NOT auto-cast strings like `find` does).
2. Time bucketing correct on seeded multi-day visits, incl. a visit just after local midnight (would land on the previous day in UTC).
3. Country breakdown from `location`.
4. 400 on invalid interval / malformed or impossible date / from > to / too many buckets / unknown tz.
5. No regression to `GET /visits` (`handlerGetVisits` untouched).
6. `npm test`, `npm run build`, `npm run lint` no new problems.

## Code anchors
- `src/models/visit.model.ts` — `candidateId` (indexed), `ip`, `location` string, `timestamps: true` → `createdAt`.
- `src/candidate_me/index.ts:264-267` — how `location` is written.
- `src/candidate/candidate.service.ts:113-122` `handlerGetVisits`; `src/candidate/candidate.controller.ts:174` `fnGetVisits`; `src/routers/api/v1/candidate.route.ts:225` (`/visits`, before `/:email` at :255).
- No date library in `package.json` → timezone offsets via `Intl.DateTimeFormat`.
- Local `mongod` v8.0.1 available for a live aggregation check; pipeline sticks to operators available since Mongo 4.0 (`$dateToString` with `timezone`, `%G-W%V`, `$split`, `$trim`, `$facet`) since the production Mongo version isn't recorded in the repo.

## Blockers
none.
