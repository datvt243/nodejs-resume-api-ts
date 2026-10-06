# 2026-10-07 — fix-no-misused-promises-false-positives — SEAL

Worker: verifier
Version: 0.1.0
Node: `fix-no-misused-promises-false-positives` (`haven/diagrams/dev-loop.prime-mermaid.md`)
Verdict: **SEAL**

## Isolation proof
Dispatched fresh via the Agent tool with the full worker bundle (manifest +
SOUL + recipe) embedded in the prompt, and no prior implementation-session
history. Did not write the diff under review. Read the evidence note only
first, then independently re-derived every falsifiable claim before opening
agent-hub again.

## Re-run
`full` — this node's central claim (87→0 `no-misused-promises`, every other
rule count byte-for-byte unchanged) is exactly the numeric/behavioral class
the recipe calls out for independent reproduction, not note-trusting.
Re-ran `npx eslint 'src/**/*.ts' --format json` twice: once on the current
working tree (fix present), once against a temporary config with only the
`no-misused-promises` line reverted to `'error'` (fix absent), both parsed
independently rule-by-rule and messageId-by-messageId myself. Also
independently ran `npm run build` and `npm test` fresh, and `npx eslint`
directly on 3 individual route files.

## Reasoning (per acceptance criterion)

1. **False positives resolved via rule-option adjustment, not touching call
   sites.** Independently confirmed via `git diff -- eslint.config.mjs`:
   one line changed (`'@typescript-eslint/no-misused-promises': 'error'` →
   `['error', { checksVoidReturn: { arguments: false, returns: false } }]`),
   plus a 5-line WHY comment, no issue-number reference (matches
   `condense-src-comments`/#236). `git status --short` / `git diff --stat`
   show only `eslint.config.mjs` (+7/-1) and the diagram md changed — zero
   `src/` files touched.

2. **No genuinely different bug silenced.** Read
   `src/middlewares/rateLimit.middleware.ts` lines 51-60 myself:
   `createRateLimiter` is typed `(): RequestHandler`, body is
   `return async (req: Request, res: Response, next: NextFunction) => {...}`
   at line 57 — confirms the note's claim verbatim, same root cause as the
   86 argument-position hits (an async Express handler assigned where
   Express's type says void), not a distinct bug. Independently verified
   via the reverted-config run that this was the ONLY `voidReturnReturnValue`
   hit (1), alongside 86 `voidReturnArgument` hits = 87 total, matching the
   note exactly.

3. **No behavior change / nothing else silenced.** Independently built two
   full `--format json` runs and parsed them myself (not trusting the
   note's table):
   - Before (config reverted, temp file in repo root for node_modules
     resolution, deleted after): **360** total, 17 distinct rules, incl.
     `no-misused-promises` **87** (86 voidReturnArgument + 1
     voidReturnReturnValue at `rateLimit.middleware.ts:57`).
   - After (current working tree, fix present): **273** total,
     `no-misused-promises` **0**. Every other rule's count matched the
     before run exactly, digit-for-digit: no-unsafe-assignment 67,
     no-unsafe-member-access 61, unbound-method 52,
     no-unnecessary-type-assertion 22, no-unsafe-argument 14,
     no-require-imports 12, no-unused-expressions 10, await-thenable 9,
     no-unsafe-call 7, no-unused-vars 5, require-await 4,
     no-floating-promises 3, restrict-template-expressions 2,
     no-redundant-type-constituents 2, prefer-promise-reject-errors 1,
     no-base-to-string 1, prefer-const 1.
   - 360 − 273 = 87, i.e. the entire delta is exactly the
     `no-misused-promises` suppression, independently confirmed, not just
     parroting the note's own diff.
   - Spot-checked `src/routers/api/v1/auth.route.ts`,
     `src/routers/api/v1/candidate.route.ts`, and
     `src/routers/api/v1/index.ts` individually via `npx eslint <file>
     --format json`: 0 `no-misused-promises` hits in each.
   - Fresh `npm run build`: clean, exit 0, same `tsc && npm run copy` /
     `cp -R ./src/views ./src/public ./dist/` output as the note.
   - Fresh `npm test`: `Test Suites: 35 passed, 35 total` /
     `Tests: 251 passed, 251 total`, exit 0 — exact match to the note. Same
     pre-existing "worker process failed to exit gracefully" Jest teardown
     warning present, independent of this change.

## Forbidden-state scan
- `ADHOC_WORK` — not hit: node `fix-no-misused-promises-false-positives`
  exists on `dev-loop.prime-mermaid.md` (added PENDING by the implementer).
- `NO_EVIDENCE` — not hit: evidence note present with real command output.
- `EDIT_UNVERIFIED` — not hit: every claim in the note reproduced
  independently above, not just inferred from the note's prose.
- `CODE_IN_HAVEN` — not hit: `agent-hub/evidence/implementer/2026-10-07/`
  contains only the one `.md` note; no `.ts`/`.js`/`.sh`/`.mjs` files
  anywhere under `agent-hub/haven/`.
- `DIAGRAM_DRIFT` — resolved by this verdict: PM status updated below from
  PENDING to SEALED in place, same row, no reordering.

## Seal gate
Correctly "not outward-facing" per the note — confirmed via `git status
--short`: no commits ahead, nothing pushed, working tree only has the
uncommitted `eslint.config.mjs` + diagram diff. `/todo #205` was run without
`--ship`. This SEAL authorizes the node's evidence state, not a commit —
commit/push still needs separate operator approval per the seal gate in
`agent-hub/CLAUDE.md`.
