# 2026-09-28 — fix-candidate-me-candidateid-not-string (plan + diff)

- Worker: implementer
- Version: 0.1.0
- Node: `fix-candidate-me-candidateid-not-string` (`haven/diagrams/dev-loop.prime-mermaid.md`)
- Issue: [#153](https://github.com/datvt243/resume-nodejs-api/issues/153) — [Critical] candidate_me: ObjectId dropped by QuerySafe can leak an arbitrary candidate's profile
- Branch: `153-critical-candidate-me` (base `staging`)
- Task (verbatim): "fix bug #152 tới #156" — this note covers #153 only, part of the same 5-issue batch as #152/#154/#155/#156, each processed as its own implementer→verifier round.

## Hub bytes before: 88066

## Node lookup

Matched the existing PENDING node `fix-candidate-me-candidateid-not-string`
directly (task resolves to GitHub issue #153, filed against this exact
node, marked Critical).

## Bookkeeping-gap finding (read before writing anything)

Same pattern as the other 2 nodes sealed earlier this session
(`fix-create-response-null-id`, `fix-candidate-password-leak`): the fix is
already live on `staging`, and the diagram node itself even documents
why — this bug was found "by accident while testing #79" and its sibling,
the exact same "value silently dropped by QuerySafe" bug class at the
*identifier* lookup instead of the *candidateId* filter, was already
fixed and SEALED as `fix-candidate-me-nosql-filter-collapse` (issue #135,
2026-09-19). Reading `src/candidate_me/index.ts` today (lines 122-129)
confirms the `candidateId`-filter half of the same bug class was fixed
in that same pass, with its own explanatory comment already in place:

```ts
const { idQuerySafe } = await import('@/utils/querySafe');
// _id here is a Mongoose ObjectId instance (from the raw document,
// destructured before the JSON.parse/stringify flatten above), not a
// string. QuerySafe.safeQuery only accepts string values (typeof
// check) — passing the ObjectId directly made it silently drop the
// candidateId filter, so this query returned EVERY candidate's CV
// section data unfiltered.
const safeCandidateQuery = idQuerySafe.safeQuery({}, { candidateId: _id?.toString() || '' });
```

`.toString()` is already applied, exactly as issue #153's proposed fix
asks. `fnExportPDF` (`/download-pdf`) calls `handlerGetAboutMe(email,
lang)` internally (confirmed, line ~253) rather than re-implementing its
own candidateId filter, so it inherits the same fix — no separate call
site needed there. This node's real gap: the diagram never got
backfilled when #135 shipped, and **no regression test specifically
exercised an ObjectId-typed `_id`** — every existing `candidate_me`
test used a plain string `_id` (`'507f1f77bcf86cd799439000'`), which
would pass even with the old buggy code (a plain string already survives
`typeof value === 'string'`), so it never actually proved this exact
bug class was fixed.

## Diff (smallest diff — no `src/` production code, extends 1 existing test file)

- `src/__tests__/candidate_me/index.test.ts` — added a new describe block
  `handlerGetAboutMe — candidateId filter with an ObjectId _id (issue
  #153)`: mocks `Candidate.findOne` to resolve a document whose `_id` is
  an object with only a `.toString()` method (mirroring a real Mongoose
  ObjectId, not a plain string) and asserts every CV-section `model.find`
  call receives the stringified `candidateId` — never the raw object,
  and never a filter silently collapsed to `{}`. Also added a short
  file-header note pointing to this new block for future readers.

## Command

```
npm test
```
Output (verbatim tail):
```
Test Suites: 26 passed, 26 total
Tests:       141 passed, 141 total
Snapshots:   0 total
Time:        7.421 s
Ran all test suites.
```
(This branch was cut from `staging` before `fix-create-response-null-id`'s
139→140 test merged plus `fix-candidate-password-leak`'s 3 new tests —
141 = 140 (post-#157-merge baseline on `staging`) + 1 new test added here,
in an existing file, so no new suite count. Same pre-existing, unrelated
harness exit warning as prior notes — not a failure.)

```
npm run build
```
Output: `tsc` clean, `copy` step ran with no errors.

## Acceptance

| Criterion | Evidence |
|---|---|
| Trace to exactly one diagram node | `fix-candidate-me-candidateid-not-string` |
| Smallest diff | 1 existing test file extended, 0 production `src/` changes (fix already live, part of the #135 pass, 2026-09-19) |
| A regression test proves a candidate with an ObjectId `_id` only ever returns their own CV data | `src/__tests__/candidate_me/index.test.ts`, new describe block, asserts stringified `candidateId` reaches every section's `.find()` call, never the raw ObjectId-like object, never an unfiltered `{}` |
| `GET /api/me/:email` and `/download-pdf` verified against 2+ real accounts | See "Live end-to-end — not performed" below |
| Exact test command run + output read back | `npm test` → `Tests: 141 passed, 141 total`; `npm run build` clean |
| Evidence note written | This file |

## Live end-to-end — not performed, said honestly

Same sandbox constraint as the other 2 nodes sealed this session: no
`.env`, no local MongoDB, Docker daemon unreachable — no way to actually
curl `GET /api/me/:email` or `/download-pdf` against 2 real accounts in
this environment. The issue's own diagnostic section already documents a
real live-test finding this exact bug against production data
(`votan.it@gmail.com`'s real CV data leaking into a brand-new profile) —
cited as the original proof the bug existed and was worth fixing, not
re-run today. In place of a fresh live round-trip, the regression test
above exercises the real, unmocked root-cause code path (only the
Mongoose model calls are faked) with an ObjectId-shaped `_id`, which is
the exact condition the original live test hit.

## Noticed, not done

- Issue #153 also suggests (optional, "consider") making
  `QuerySafe.safeQuery` fail closed instead of silently dropping a
  rejected key, to prevent this bug class from recurring elsewhere. Not
  done here — out of scope for this node's smallest diff, and a larger
  behavior change to a shared utility with many call sites; own node if
  picked up.

## Seal gate

No outward-facing action taken (no commit/push). Only a local file edit:
1 existing test file extended under `src/__tests__/`. Pending verifier.

## Status

`sealed_pending_verifier`
