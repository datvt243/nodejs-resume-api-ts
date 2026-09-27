# 2026-09-28 — fix-candidate-password-leak (plan + diff)

- Worker: implementer
- Version: 0.1.0
- Node: `fix-candidate-password-leak` (`haven/diagrams/dev-loop.prime-mermaid.md`)
- Issue: [#152](https://github.com/datvt243/resume-nodejs-api/issues/152) — Password hash leaked in candidate profile response
- Branch: `152-password-hash-leaked` (base `staging`)
- Task (verbatim): "fix bug #152 tới #156" — this note covers #152 only, part of a 5-issue batch requested in one `/todo` invocation, each issue processed as its own implementer→verifier round per the skill's normal flow.

## Hub bytes before: 88066

## Node lookup

Matched the existing PENDING node `fix-candidate-password-leak` directly
(task resolves to GitHub issue #152, filed against this exact node).

## Bookkeeping-gap finding (read before writing anything)

Same pattern as `fix-create-response-null-id` (sealed earlier this
session) and `fix-idor-broken-access-control`: the fix is already live on
`staging`. There IS an evidence note for this exact node from
`evidence/implementer/2026-08-21/fix-candidate-password-leak-diff.md`
(part of the same bundled commit `f355e2f`), but that note's own
`## Status` line still reads `sealed_pending_verifier` — it was never
picked up by a verifier pass, so the diagram row stayed PENDING for over
a month even though the code fix has been live the whole time. Confirmed
today by reading the live code, `src/candidate/candidate.service.ts`:

```ts
export const handlerGetInformationById = async (id: string, props: { select: string } = { select: '' }) => {
  const { select = '' } = props;
  const find = MODEL.findById(id).select(select || '-password');
  return await find.exec();
};

export const handlerGetInformationByEmail = async (email: string) => {
  const safeEmailQuery = candidateQuerySafe.safeQuery({}, { email });
  const find = await MODEL.findOne(safeEmailQuery).select('-password').exec();
  return find;
};
```
(lines 37-53 today) — exactly matches the diff already recorded in the
2026-08-21 note. This note supersedes that stale note's pending status by
closing the real remaining gap: **no regression test existed anywhere**
for either function (confirmed: no `candidate.service.test.ts` file
existed in `src/__tests__/candidate/` before this diff, and no assertion
about an absent `password` field anywhere in
`candidate.controller.test.ts`).

## Diff (smallest diff — no `src/` production code, 1 new test file)

- `src/__tests__/candidate/candidate.service.test.ts` (new) — 3 tests:
  1. `handlerGetInformationByEmail` always calls `.select('-password')`.
  2. `handlerGetInformationById` defaults to `.select('-password')` when
     no explicit `select` is given.
  3. `handlerGetInformationById` passes a given whitelisted select string
     straight through unchanged (proves the old double-wrap no-op is
     gone — a direct regression test for the exact root-cause bug).

## Command

```
npm test
```
Output (verbatim tail):
```
Test Suites: 27 passed, 27 total
Tests:       143 passed, 143 total
Snapshots:   0 total
Time:        7.739 s
Ran all test suites.
```
(143 = 140 from the last SEALED node (`fix-create-response-null-id`) + 3
new tests here. Same pre-existing, unrelated "worker process has failed
to exit gracefully" harness warning as before — not a failure.)

```
npm run build
```
Output: `tsc` clean, `copy` step ran with no errors.

## Acceptance

| Criterion | Evidence |
|---|---|
| Trace to exactly one diagram node | `fix-candidate-password-leak` |
| Smallest diff | 1 new test file only, 0 production `src/` changes (fix already live since `f355e2f`, 2026-08-21) |
| `GET /api/v1/candidate/:email` response has no `password` field | `handlerGetInformationByEmail` test — asserts `.select('-password')` is always called |
| `PUT`/`PATCH /candidate/update` response has no `password` field | `handlerGetInformationById` tests — asserts default `-password` select, and that an explicit select string is no longer silently dropped |
| Regression test asserting password absence | `src/__tests__/candidate/candidate.service.test.ts`, all 3 tests |
| Exact test command run + output read back | `npm test` → `Tests: 143 passed, 143 total`; `npm run build` clean |
| Evidence note written | This file |

## Noticed, not done

- The stale 2026-08-21 evidence note for this same node
  (`evidence/implementer/2026-08-21/fix-candidate-password-leak-diff.md`)
  is left as-is per the evidence directory's own rule (`NEVER DELETE` —
  "fix a wrong note by adding a correction, don't delete it"). This note
  is that correction.
- Live HTTP end-to-end (curl against a real running server) not
  performed — same sandbox constraint as `fix-create-response-null-id`
  (no local Mongo/Redis, Docker daemon unreachable). The 2026-08-21 note
  already contains a real `npm run dev` manual verification transcript
  for this exact behavior (pasted GET/PUT responses with no `password`
  field) from when the fix was first written — cited here as prior
  evidence of live behavior, not re-run today.

## Seal gate

No outward-facing action taken (no commit/push). Only a local file write:
1 new test file under `src/__tests__/`. Pending verifier.

## Status

`sealed_pending_verifier`
