# 2026-10-02 — enable-exact-optional-property-types (verifier note)

- Worker: verifier (independent subagent, dispatched via Agent tool from the
  main session running `/worker verifier`)
- Node: `enable-exact-optional-property-types`
- GitHub issue: #189, part of tracking issue #177 (Strict TypeScript / Type
  Safety migration) — LAST of 12 phases (#178–#189)
- Evidence audited: `evidence/implementer/2026-10-02/enable-exact-optional-property-types-plan.md`

## Isolation proof

Spawned as a fresh `Agent` subagent with task description "Verify
enable-exact-optional-property-types (issue #189)" — no conversation
history from the implementer session; all findings below were independently
re-derived from the real repo state, not copied from the note.

## 1. Diagram check

`agent-hub/haven/diagrams/dev-loop.prime-mermaid.md` — grepped for
`exact-optional-property-types`: exactly ONE row, status `PENDING`, no
duplicates anywhere else under `agent-hub/haven/diagrams/`. Clean.

## 2. Real acceptance criteria (`gh issue view 189`, read verbatim)

- Flag enabled in `tsconfig.json`.
- `tsc --noEmit` clean.
- `npm test` passes, `npm run build` clean, no behavior change.
- Any type shape that had to change (e.g. `x?: T` → `x?: T | undefined`) is
  called out explicitly in the evidence note, not silently patched.

All 4 independently confirmed below.

## 3. Git state

- `git branch --show-current` → `189-exact-optional-property-types`
  (matches).
- `git status --short` → only the expected working-tree state (implementer's
  untracked evidence dir, the diagram row already staged as modified from
  node-creation, plus the 5 target files) — nothing stray.
- `git diff staging --stat -- src/ tsconfig.json` → exactly the 5 claimed
  files, counts match the note's pasted stat verbatim:
  ```
  src/__tests__/config/cors.config.test.ts    |  6 +++++-
  src/__tests__/middlewares/rateLimit.test.ts |  7 ++++++-
  src/services/createDocx.ts                  |  6 +++++-
  src/services/index.ts                       | 20 +++++++++++++++-----
  tsconfig.json                                |  1 +
  5 files changed, 32 insertions(+), 8 deletions(-)
  ```

## 4. Independent re-derivation of each of the 6 fixes (read real file diffs, not the note's prose)

1. **`cors.config.test.ts`** — `loadWith`'s `env` param widened to
   `CORS_ORIGIN?: string | undefined`. Confirmed the surrounding test file
   does call `loadWith({ CORS_ORIGIN: undefined, ... })` as a deliberate
   "env var unset" simulation. Matches.

2. **`rateLimit.test.ts`** — `makeReq()`'s return cast changed
   `as Request` → `as unknown as Request`. Confirmed via grep that
   `makeRes()` in the SAME file already uses `as unknown as Response`, so
   this is genuinely consistent with pre-existing style in the file, not a
   new pattern invented to dodge a type error. Matches claim exactly.

3. **`services/index.ts`** `baseProp` — `lang?`, `page?`, `limit?`, `sort?`
   widened to `| undefined`. Cross-checked the real call site in
   `BaseController.ts:47-57`: `page`/`limit`/`sort` are indeed built as
   `cond ? value : undefined` ternaries. I independently reverted only the
   `page` widening and re-ran `npx tsc --noEmit` — reproduced the exact
   TS2379 error the note describes, confirming `page` is genuinely
   required. **Finding not in the note**: I separately reverted only the
   `lang` widening (leaving page/limit/sort widened) and `npx tsc --noEmit`
   stayed clean (0 errors) — `lang` is populated via `(req as any).lang`
   in `BaseController.ts:54`, not a `cond ? value : undefined` ternary like
   its three siblings, so its widening was not strictly compiler-required.
   This is a minor imprecision in the note's "all 4 siblings follow the
   identical pattern" claim (3 of 4 do; `lang` doesn't, but is still
   logically a "may genuinely be absent" value given its own call sites
   elsewhere in `BaseService.ts` use `lang: string = DEFAULT_LANG`
   defaults). The widening itself is still 100% sound (never narrows or
   weakens a check, `| undefined` is always a superset), costs one word,
   and introduces zero risk — I do not consider this disqualifying, just
   noting the inaccuracy in the stated rationale for the record.

4. **`services/index.ts`** `baseUpdateDocument`'s `userID?: string |
   undefined` — confirmed `BaseService.ts:50-52`'s `handlerUpdate(item,
   userID?, lang)` forwards the optional param straight through. I
   independently reverted this widening alone and reran `tsc --noEmit`:
   reproduced the exact TS2379 error on `userID`. Genuinely required.

5. **`services/createDocx.ts`** — `bullet` now uses conditional spread to
   omit the key instead of passing `bullet: undefined`. I independently
   grepped `node_modules/docx/dist/index.d.ts` and confirmed
   `IParagraphOptions` (line 1537) really does define `bullet?: { level:
   number }` — a genuine third-party type this codebase cannot widen.
   Confirmed this is the correct fix shape (omit key vs. pass `undefined`)
   given `exactOptionalPropertyTypes` semantics.

6. **`tsconfig.json`** — `"exactOptionalPropertyTypes": true` confirmed
   present via direct grep.

## 5. Re-ran verification commands myself, from scratch

```
npx tsc --noEmit
```
→ 0 errors, exit code 0. Matches note's claim.

```
npm test
```
→ read actual terminal output:
```
Test Suites: 31 passed, 31 total
Tests:       181 passed, 181 total
Snapshots:   0 total
```
Matches the note's claimed "31 passed, 31 total / 181 passed, 181 total"
exactly.

```
npm run build
```
→ `tsc && npm run copy` completed with no errors, `cp -R ./src/views
./src/public ./dist/` ran clean. Matches "Clean" claim.

`jest.setup.ts` — read in full: only `process.env.X ??= '...'` string
assignments, no optional-property object literals. Confirmed nothing in
this file needed the same treatment, same conclusion as the note.

## 6. Forbidden-state scan

- `ADHOC_WORK`: node exists on diagram (PENDING, confirmed step 1) — not
  ad-hoc.
- `NO_EVIDENCE`: implementer note exists with verbatim command output.
- `EDIT_UNVERIFIED`: independently re-ran every command myself (section 5)
  rather than trusting the note alone, given this is the capstone node of
  the 12-phase #177 initiative — all claims reproduced.
- `CODE_IN_HAVEN`: no `.ts`/`.js` files touched under `haven/`.
- `DIAGRAM_DRIFT`: diagram row was PENDING, matching real code state
  (flag not yet reflected as sealed) prior to this verdict.
- Grepped the full diff for `any`/`!`/`@ts-ignore`/`@ts-nocheck`/unjustified
  `as`: the only `any` tokens in the diff are pre-existing unchanged
  context lines (`model: any`, `hookHasErrors?: (props: any) => void`),
  not newly added. The only cast change (`as unknown as Request`) is
  justified and stylistically consistent with the same file (see item 2
  above). No type-safety shortcuts were used to force the compiler green.

## 7. Diff proportionality

`git diff staging --stat` (including the diagram row) → 6 files, 33
insertions / 8 deletions. Exactly the 5 files the 6 original compiler
errors pointed at, plus the 1-line `tsconfig.json` flag and the 1-line
diagram row from node creation. No unrelated refactors, no version bump,
no scope creep beyond what §4's minor `lang` note already covers (which is
inert, not a smell).

## Re-run

`full` — independently re-ran `npx tsc --noEmit`, `npm test`, and `npm run
build` from scratch in the existing working tree (not an isolated
worktree/`npm ci`), plus two targeted single-property revert-and-recompile
experiments to confirm the `page` and `userID` widenings are genuinely
compiler-required. Reason: this is the capstone/highest-ripple-risk node of
the entire 12-phase #177 strict-type-safety initiative, where the explicit
goal is proving type safety wasn't faked — worth the extra independent-
confirmation cost per the recipe's own "release gate / high-stakes" carve-
out.

## Verdict: SEAL

Every acceptance criterion from the real GitHub issue text is independently
verified with reproduced evidence, not just audited prose. The one
imprecision found (the `lang` widening in `baseProp` not being strictly
compiler-required, unlike its three siblings) is sound, harmless, and
disclosed — not a forbidden-state hit, not a fake-pass shortcut, not a
proportionality violation worth blocking on. Diagram row flipped
PENDING → SEALED in place (no reorder).
