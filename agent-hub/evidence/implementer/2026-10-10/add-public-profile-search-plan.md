# 2026-10-10 — add-public-profile-search (plan)

Worker: implementer
Version: 0.1.0
Node: `add-public-profile-search` (`haven/diagrams/dev-loop.prime-mermaid.md`, appended PENDING at table end)
Task (via `/todo #163`): GitHub issue #163 "Full-text/keyword search on public candidate profiles" — full body read via `gh issue view 163`.
Branch: `163-full-text-keyword` (from `staging` @ `884637f`, via `gh issue develop`).

## Hub bytes before: 226157

## Scoping — open questions asked before coding
The issue lists open questions (search mechanism, fields, pagination, identifier exposure). Per pick_next "task is ambiguous → stop and ask", asked the operator (AskUserQuestion) and got:
1. Search mechanism → escaped case-insensitive regex (no `$text` index, no migration; substring match so "vue" finds "Vue.js").
2. Public candidates without a vanity slug → excluded (only `isPublic` not false AND non-empty slug; never expose email).
3. Route → `GET /api/me/search`, registered before `/api/me/:email` (accepted trade-off: a slug literally "search" is shadowed).

## Acceptance
1. Only candidates with `isPublic !== false` (field-missing docs count as public — Mongoose default is read-side only, `fnGetAboutMe` gates on `=== false`) and a non-empty slug.
2. Result items carry whitelisted public fields only (slug, name, positionDesired) — no password/email.
3. Query input regex-escaped; filters built server-side with a RegExp value, no user-controlled keys/operators.
4. Fields: GeneralInformation positionDesired / professionalSkills.name; Experience company / position / skills; Education school / major; `deletedAt: null`.
5. `page`/`limit` → `{ items, pagination: { page, limit, total, totalPages } }` (same shape as `baseFindDocument`), limit cap 100.
6. 400 on missing/too-short/too-long `q`.
7. Regression test: non-public / slug-less candidate never in results.

## Code anchors
- `src/routers/index.ts` — `router.get('/api/me/:email', fnGetAboutMe)` (search route must precede it).
- `src/candidate_me/index.ts` — `fnGetAboutMe` (`isPublic === false` gate), `handlerGetAboutMe`.
- `src/services/index.ts:64-140` — `MAX_PAGE_LIMIT = 100`, pagination response shape.
- `src/models/{generalInformation,experience,education,candidate}.model.ts` — field names (`positionDesired`, `professionalSkills[].name`, `skills[]`, `isPublic` default true, `slug`).
- `src/__tests__/candidate_me/index.test.ts` — `jest.mock('@/models')` pattern (no in-memory Mongo in this repo).

## Blockers
none.
