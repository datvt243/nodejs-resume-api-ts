# 2026-10-07 — fix-no-misused-promises-false-positives

Worker: implementer
Version: 0.1.0
Node: `fix-no-misused-promises-false-positives` (`haven/diagrams/dev-loop.prime-mermaid.md`)
Task (verbatim via `/todo #205`): chore(lint): fix no-misused-promises
false positives on Express async route handlers. `@typescript-eslint/no-
misused-promises` fires 85 times across the routers/controllers, all
with the same message: "Promise returned in function argument where a
void return was expected." Standard fix is a rule-option adjustment in
`eslint.config.mjs` — `checksVoidReturn: { arguments: false }` (or
similar, needs verifying against the current `typescript-eslint@8.71.0`
docs) — not touching each of the 85 call sites individually. Before
changing the option, confirm it doesn't also silence a genuinely
different, real misuse-of-promise bug elsewhere (re-run `npm run lint`
after the config change and diff the remaining problem list against the
current count, not just checking the count went to 0).

## Hub bytes before: 215051

## Investigation
Baseline `npx eslint 'src/**/*.ts' --format json`: 360 total problems
(not 1424 or any other historical number — this is the current
post-#204/#211/#218/#220/#222/#236 baseline). `no-misused-promises`:
**87** hits (not the issue's stated 85 — 2 more accrued since #205 was
filed; re-measured for real rather than trusting the issue text), broken
down by `messageId`:
- `voidReturnArgument`: 86 hits across 15 route files + 1 in
  `candidate_me`-adjacent router wiring (`routers/api/v1/index.ts`,
  `auth.route.ts`, `candidate.route.ts`, `award.route.ts`,
  `certificate.route.ts`, `education.route.ts`, `experience.route.ts`,
  `profile.route.ts`, `project.route.ts`, `application.route.ts`,
  `reference.route.ts`, `generalInformation.route.ts`,
  `v2/auth.route.ts`, `routers/index.ts`, `cv.route.ts`) — exactly the
  pattern the issue describes: an async handler passed as an argument to
  `router.get/post/put/delete`, flagged because `RequestHandler`
  nominally expects a `void`-returning function.
- `voidReturnReturnValue`: **1** hit, `src/middlewares/rateLimit.middleware.ts:57`
  — read this one directly (not inferred from the messageId name alone)
  per the issue's own instruction to confirm no different real bug is
  being silenced. `createRateLimiter(opts)` is typed to return
  `RequestHandler` and its body is `return async (req, res, next) => {...}`
  — same root cause as the 86 argument-position hits (an async Express
  handler assigned somewhere Express's type says "void"), just surfacing
  via a `return` statement instead of a call argument. `checksVoidReturn`
  has a separate `returns` sub-flag from `arguments` — confirmed in
  `node_modules/@typescript-eslint/eslint-plugin/dist/rules/no-misused-promises.d.ts`'s
  `ChecksVoidReturnOptions` type (`arguments?`, `attributes?`,
  `inheritedMethods?`, `properties?`, `returns?`, `variables?`) — so
  `{ arguments: false }` alone (the issue's literal suggestion) would
  have left this 1 hit unresolved. Widened the fix to `{ arguments:
  false, returns: false }` based on this direct reading, not scope creep.
- 0 hits in `attributes`/`inheritedMethods`/`properties`/`variables` —
  left those `checksVoidReturn` sub-flags at their implicit default
  (`true`), so a future real misuse in those categories still gets
  caught; only narrowed exactly what today's 87 hits needed.

## Diff
| File | Why |
|---|---|
| `eslint.config.mjs` | `'@typescript-eslint/no-misused-promises': 'error'` → `['error', { checksVoidReturn: { arguments: false, returns: false } }]`, with a short WHY comment (no issue-number reference, per `condense-src-comments`/#236's standing policy). |

1 file, 7 insertions / 1 deletion (`git diff --stat`). No `src/` file
touched — config-only, exactly matching the issue's own instruction not
to touch the 87 call sites.

## Command
```
npx eslint 'src/**/*.ts' --format json
```
```
npm run build
```
```
npm test
```

## Output
Before (`--format json`, parsed): 360 total problems, 87
`no-misused-promises` (86 `voidReturnArgument` + 1
`voidReturnReturnValue`).

After the `eslint.config.mjs` change, same command: **273** total
problems, **0** `no-misused-promises` hits. Every other rule's count is
byte-for-byte identical between the before/after JSON (`no-unsafe-
assignment` 67, `no-unsafe-member-access` 61, `unbound-method` 52,
`no-unnecessary-type-assertion` 22, `no-unsafe-argument` 14, `no-require-
imports` 12, `no-unused-expressions` 10, `await-thenable` 9, `no-unsafe-
call` 7, `no-unused-vars` 5, `require-await` 4, `no-floating-promises` 3,
`restrict-template-expressions` 2, `no-redundant-type-constituents` 2,
`prefer-promise-reject-errors` 1, `no-base-to-string` 1, `prefer-const`
1) — confirming the 87-problem drop (360 → 273) is exactly and only the
`no-misused-promises` suppression, nothing else shifted, no new rule
newly silenced.

`npm run build`:
```
> resume-nodejs-api@1.11.0 build
> tsc && npm run copy

> resume-nodejs-api@1.11.0 copy
> cp -R ./src/views ./src/public ./dist/
```
Clean, exit 0.

`npm test`:
```
Test Suites: 35 passed, 35 total
Tests:       251 passed, 251 total
Snapshots:   0 total
Time:        7.73 s, estimated 9 s
Ran all test suites.
```
Exit 0 (confirmed separately via `echo $?` after the run — a pre-existing
"A worker process has failed to exit gracefully" Jest teardown warning
also printed, present independent of this change, not a new regression:
same suite/test counts as the current baseline, config-only diff with
zero `src/` lines touched).

## Acceptance
| Criterion | Evidence |
|---|---|
| `no-misused-promises` false positives on Express async handlers resolved via rule-option adjustment, not touching the 85+ call sites individually | `eslint.config.mjs` is the only file in the diff (`git diff --stat`); 87→0 `no-misused-promises` hits confirmed via before/after `--format json` parse. |
| Confirm the option doesn't also silence a genuinely different, real misuse-of-promise bug elsewhere | Read the 1 `voidReturnReturnValue` hit directly (`rateLimit.middleware.ts:57`) before deciding — confirmed same root cause (Express handler type mismatch), not a distinct bug; widened scope to `returns: false` specifically because of this direct read, not assumed. Confirmed via the full before/after rule-count diff that no OTHER rule's count moved — the option change touched exactly and only `no-misused-promises`. |
| No behavior change | 0 `src/` files touched; `npm run build`/`npm test` both match the pre-change baseline exactly (251/251 tests, clean build). |

## Noticed, not done
- The issue's own "85" count was already stale (87 at time of
  implementation) — not fixed, just noted; rule-based lint counts are
  expected to drift as the codebase changes, this doesn't need separate
  tracking.
- 273 remaining lint problems are pre-existing, unrelated to this node —
  tracked separately (`no-unsafe-*`/`unbound-method`/etc. are real
  type-safety debt, out of this node's scope per the issue's own "Not
  part of #204's scope" framing).

## Seal gate
Not outward-facing yet (no commit/push) — `/todo #205` invoked without
`--ship`. Diff shown in full to the operator in-session before writing
this note.
