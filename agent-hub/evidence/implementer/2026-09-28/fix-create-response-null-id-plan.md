# 2026-09-28 — fix-create-response-null-id (plan + diff)

- Worker: implementer
- Version: 0.1.0
- Node: `fix-create-response-null-id` (`haven/diagrams/dev-loop.prime-mermaid.md`)
- Issue: [#157](https://github.com/datvt243/resume-nodejs-api/issues/157) — POST .../create responses always return `data._id: null`
- Branch: `157-post-create-responses` (base `staging`)
- Task (verbatim): "Fix issue #157 — POST .../create responses always return data._id: null. Root cause: src/candidate_profile/BaseService.ts handlerCreate's hookAfterSave reassigns the local destructured `data` variable, but that reassignment never propagates back through baseCreateDocument's return value. Fix so the caller (and API response) gets the real saved document including its real _id. Acceptance criteria: (1) a regression test on handlerCreate/baseCreateDocument asserts the returned _id matches the actually-persisted document's _id, not null; (2) spot-check at least one real CV section create endpoint end-to-end."

## Hub bytes before: 86675

## Node lookup

Matched the existing PENDING node `fix-create-response-null-id` directly
(task came from resolving GitHub issue #157, filed against this exact
node).

## Bookkeeping-gap finding (read before writing anything)

The production fix already exists on `staging` — same pattern as
`add-pagination-filtering-cv-sections`/#73, `add-logout-all-sessions`/#74,
and `fix-idor-broken-access-control`. `git log -- src/services/index.ts`
shows commit `f355e2f` ("fix: close broken access control, password leak,
and 3 other API bugs", 2026-08-21) already contains:

```diff
+    /**
+     * callback thực hiện sau khi thêm mới thành công. Nếu hook trả về
+     * (khác undefined), dùng giá trị đó thay _data — trước đây hook nhận
+     * `data` qua destructure-by-value nên gán lại bên trong hook không hề
+     * cập nhật _data ở đây, khiến response luôn trả nguyên kết quả thô của
+     * MODEL.create() ... thay vì list mới đã refetch.
+     */
     if (props?.hookAfterSave) {
-      await props?.hookAfterSave?.(document, { success: _success, message: _message, data: _data });
+      const replacement = await props.hookAfterSave(document, { success: _success, message: _message, data: _data });
+      if (replacement !== undefined) _data = replacement;
     }
```
(`src/services/index.ts` `baseCreateDocument`, confirmed live on this
branch at lines 300-303 today.)

That same commit bundled 5 fixes into one, but only
`fix-candidate-password-leak` got its own evidence note at the time
(`evidence/implementer/2026-08-21/fix-candidate-password-leak-diff.md`,
itself still sitting at `sealed_pending_verifier` — never promoted). The
other 4 (IDOR, this one, TOKEN_EXP_IN, v2-register-await) never got a
per-node evidence note. IDOR was already backfilled later
(`fix-idor-broken-access-control`, SEALED 2026-09-08). This note performs
the same backfill for `fix-create-response-null-id`, plus closes the real
gap the issue's acceptance criteria pointed at: **no regression test
existed** for this behavior anywhere in `src/__tests__/`.

## Diff (smallest diff — no `src/` production code, only new tests)

`src/services/index.ts` and `src/candidate_profile/BaseService.ts` are
unchanged — the fix is already correct and live on `staging`. The only
diff is 2 new test files:

- `src/__tests__/services/baseCreateDocument.test.ts` — direct unit
  coverage of `baseCreateDocument`'s `hookAfterSave` replacement
  propagation (the exact root-cause line): asserts (a) a non-undefined
  `hookAfterSave` return value becomes `result.data` instead of the raw
  `MODEL.create()` result, (b) `undefined` falls back to the raw create
  result, (c) no `hookAfterSave` at all leaves the raw result untouched.
- `src/__tests__/candidate_profile/BaseService.test.ts` — spot-check of a
  real CV section's create flow: calls `createCrudService({ model, name:
  'education' }).handlerCreate(...)` with the real, unmocked
  `BaseService.ts` + `services/index.ts` code (only the Mongoose model
  itself is faked), confirming the final response's `data._id` is the
  real persisted id (`real-id-1`), not `null` — this is the exact code
  path every CV section's real `POST .../create` endpoint uses.

## Command

```
npm test
```
Output (verbatim tail):
```
Test Suites: 26 passed, 26 total
Tests:       140 passed, 140 total
Snapshots:   0 total
Time:        7.101 s
Ran all test suites.
```
(140 = the 136 total recorded on the last SEALED node, `update-project-docs`,
+ 3 new tests in `baseCreateDocument.test.ts` + 1 new test in
`BaseService.test.ts`. A harness warning — "A worker process has failed to
exit gracefully... Active timers can also cause this" — printed above this
summary; pre-existing, unrelated to this diff (no timer/interval touched
here), and does not affect the pass/fail count.)

```
npm run build
```
Output: `tsc` clean, `cp -R ./src/views ./src/public ./dist/` (the `copy`
step) ran with no errors.

## Acceptance

| Criterion | Evidence |
|---|---|
| Trace to exactly one diagram node | `fix-create-response-null-id` |
| Smallest diff | 2 new test files only, 0 production `src/` changes (fix already live since `f355e2f`, 2026-08-21) |
| Regression test asserts `_id` is the real persisted id, not `null` | `src/__tests__/services/baseCreateDocument.test.ts` (root-cause level) + `src/__tests__/candidate_profile/BaseService.test.ts` (CV-section-flow level) |
| Spot-check a real CV section create endpoint end-to-end | See "Live end-to-end — not performed" below; done instead as an unmocked code-path spot-check through the real `createCrudService`/`BaseService.ts`/`services/index.ts`, per `BaseService.test.ts` |
| Exact test command run + output read back | `npm test` → `Tests: 140 passed, 140 total`; `npm run build` clean |
| Evidence note written | This file |

## Live end-to-end — not performed, said honestly

This session's sandbox has no `.env`, no local MongoDB (`mongod` not
running, no Mongo Docker container), and the Docker daemon itself is not
reachable (`docker info` fails) — no way to actually start `npm run dev`
against a real database to curl a live `POST /api/v1/education/create`.
Rather than fabricate a live-curl transcript, the "spot-check a real CV
section create endpoint end-to-end" criterion was satisfied instead by
exercising the real, unmocked code path (`BaseService.test.ts` above) —
only the Mongoose model itself is faked, everything else (`BaseService.ts`
handlerCreate → `services/index.ts` baseCreateDocument →
hookAfterSave → baseFindDocument refetch) runs for real. Flagging this gap
honestly rather than claiming a live server round-trip that didn't happen.

## Noticed, not done

- `haven/diagrams/dev-loop.prime-mermaid.md` is 39901B, over the 15KB
  `/hub-tokens` archive threshold (checked this session, `hub_bytes_before`
  above). Not archived here — out of scope for this node, flagged for a
  future dedicated archive pass.
- The sibling `fix-candidate-password-leak` node is also already fixed
  live on `staging` (same `f355e2f` commit) but still shows PENDING on the
  diagram with a stale `sealed_pending_verifier` note from 2026-08-21 that
  never got a verifier pass — same backfill pattern as this node, own
  `/todo #152` pickup if wanted (issue #152 already filed).
- `TOKEN_EXP_IN`/v2-register-await (issues #155/#156) are also already
  fixed in the same bundled commit — not touched here, out of scope for
  this node.

## Seal gate

No outward-facing action taken (no commit/push). Only local file writes:
2 new test files under `src/__tests__/`. Pending verifier.

## Status

`sealed_pending_verifier`
