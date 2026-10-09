# 2026-10-10 — add-public-profile-search (verifier verdict)

Worker: verifier (independent subagent, dispatched via Agent tool) · Version 0.1.0
Node: `add-public-profile-search` (`haven/diagrams/dev-loop.prime-mermaid.md`)
New PM status: **SEALED**

## Isolation proof
This was a fresh Agent spawn, briefed as "Verify add-public-profile-search seal". The verbatim verifier bundle (manifest, SOUL, verify_seal recipe) and the `hub_bytes_before=226157` hand-off were not part of the implementer pass, and this spawn has no memory of it. I wrote no code under `src/`.

## Reasoning
I read both implementer notes (`evidence/implementer/2026-10-10/add-public-profile-search-{plan,diff}.md`). I then checked them against the real working tree: `git diff` for `src/routers/index.ts`, `src/locales/{en,vi}.ts`, `CLAUDE.md`, `README.md` and the diagram, plus the full new files `src/candidate_me/search.ts` and `src/__tests__/candidate_me/search.test.ts`. The note matches what is on disk. The commands match `doctrine/MEMORY.md`: `npm test`, `npm run build` (the Typecheck row) and `npm run lint`. None of the output is truncated.

| Criterion | Evidence |
|---|---|
| Never returns a non-public or slug-less candidate (regression test) | Code: Candidate filter `{ _id: { $in }, isPublic: { $ne: false }, slug: { $nin: [null, ''] } }`. The same filter goes to `countDocuments`. Returned rows are re-filtered as defense in depth. Tests `only ever asks Mongo for public candidates…` and `never returns a non-public or slug-less candidate, even if the DB hands one back` both PASS in my re-run. **Independent real-Mongo probe** (throwaway `mongod`, 127.0.0.1:27998, shut down and dir deleted afterwards, nothing under `src/`): seeded pub / legacy (no isPublic) / priv (false) / noslug / nullslug / emptyslug / isPublic:null. The exact filter returned `pub,legacy,privnull`. So `isPublic: null` counts as public, which matches the existing `fnGetAboutMe` gate (`isPublic === false`, `src/candidate_me/index.ts:57`). This is not a new exposure. |
| Only whitelisted public fields, no password/email | The projection is `{ _id, slug, firstName, lastName, isPublic }`, and each item is built explicitly from `slug/firstName/lastName/positionDesired`, so extra fields on a row cannot pass through. Test `returns only whitelisted public fields — never email or password` asserts an exact `toEqual` plus the projection. PASS. |
| User input regex-escaped; no user-controlled operator keys | `fnSearchPublicProfiles` accepts `q` only when `typeof === 'string'`, so `q[$ne]=` (object) and arrays get a 400 before any DB call. The text only ever becomes `new RegExp(escapeRegex(q), 'i')` as a value, and the filter keys are fixed. Tests `matches the query as an escaped…` and `keeps operator-looking input as literal text…` PASS. Probe: escaped `C++ (x)` matched literally, and escaped `.*` matched 0 docs. |
| Agreed fields; soft-deleted rows excluded | The `distinct` filters in code and test are GeneralInformation `positionDesired` / `professionalSkills.name`, Experience `company` / `position` / `skills`, and Education `school` / `major`, each with `deletedAt: null`. The implementer's live output `deleted co` returned `total: 0`. |
| `page`/`limit`, `{ items, pagination }` shape, cap 100 | `MAX_LIMIT = 100`, the default is 20, and invalid page/limit fall back to the defaults. Tests `paginates…` (skip 40, totalPages 3) and `defaults page/limit, caps limit at 100…` PASS. |
| 400 on missing / too-short / too-long `q` | `it.each` covers missing, `a`, whitespace, 101 chars and an array. Each returns 400 with no `Candidate.find` call. PASS. |
| Route `/api/me/search` registered before `/api/me/:email` | `git diff src/routers/index.ts`: `router.get('/api/me/search', …)` is inserted above the `/api/me/{email}` swagger block and route. The implementer's live route dump reads `get /api/me/search \| get /api/me/:email`. |
| `npm test` | Verifier re-run: `Test Suites: 38 passed, 38 total`, `Tests: 286 passed, 286 total`, `PASS src/__tests__/candidate_me/search.test.ts`, TEST_EXIT=0. |
| Typecheck (`npm run build`) | Verifier re-run: `BUILD_EXIT=0`, ending in `cp -R ./src/views ./src/public ./dist/`. |
| `npm run lint`: no new problems | Verifier re-run: `npx eslint . --format json` on the diff tree, then on a `git stash push -u` baseline (`git status --short` identical before and after the pop). Result: `lint before 276 after 276`, no rule deltas, 0 problems in `search.ts`, `search.test.ts`, `routers/index.ts`, `locales/en.ts`, `locales/vi.ts`. |
| comments per code-comments.md | Every comment is either a WHY or JSDoc on an exported API: the file-overview JSDoc, `escapeRegex` (why no injection), the filter block (why `$ne: false` / `$nin`), the defense-in-depth line and the `MAX_LIMIT` line (single-sentence `//`). The `@swagger` block is a functional doc block. There are no `(#N)` refs and no stacked `//`. `@author`/`@see` are present although the file-header opt-in is OFF; that mirrors sibling `ats-check.ts` and no rule forbids it. |

Forbidden states: none apply.
- ADHOC_WORK: the node is on the diagram and the worker identity is recorded.
- NO_EVIDENCE: the plan and diff notes exist.
- EDIT_UNVERIFIED: I re-ran test, build and lint and the results match the note.
- CODE_IN_HAVEN: the only `haven/` change is the diagram row.
- DIAGRAM_DRIFT: the row is now SEALED.

Seal gate: no commit, push or external call happened. The implementer's and my temp `mongod` both bound to 127.0.0.1 only.

Proportion: the diff is limited to the endpoint, its test, two locale keys, the swagger block and the doc rows. Nothing goes beyond the node's scope.

Noted, out of scope (already listed by the implementer): a slug literally `search` is shadowed (operator-accepted); there is no `$text` index; the route uses the general rate limiter only.

## Re-run
partial. The node is an outward-facing, privacy-sensitive public endpoint, so the default audit-only scope does not apply. I re-ran `npm test`, `npm run build`, and an eslint before/after comparison via `git stash`. I also ran an independent real-`mongod` probe of the exact Candidate privacy filter and the regex escaping, because mocked tests cannot prove Mongo's `$ne` / `$nin` null semantics.
