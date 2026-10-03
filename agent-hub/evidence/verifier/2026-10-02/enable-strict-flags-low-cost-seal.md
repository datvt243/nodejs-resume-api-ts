# 2026-10-02 — enable-strict-flags-low-cost (verifier note)

- Worker: verifier (independent subagent)
- Node: `enable-strict-flags-low-cost`
- New PM status: SEALED

## Isolation proof (actual spawn task string, as received)

> "You are an independent verifier subagent for a one-person dev hub project
> (Resume API backend, /Users/_david/Workspace/Project/resume/resume-nodejs-api).
> No memory of any implementation session — derive everything from real
> files/commands you run yourself. Repo is on branch `186-strict-flags-low-cost`
> — stay on it. Run `verify_seal` for evidence note:
> agent-hub/evidence/implementer/2026-10-02/enable-strict-flags-low-cost-plan.md
> ... [full verifier contract + numbered checklist, GitHub issue #186 context,
> bug-claim scrutiny instructions]"

No implementer session context was inherited — every finding below was
independently re-derived from the real repo state.

## Reasoning (numbered)

1. **Diagram row check (first gate).** `grep -n "enable-strict-flags-low-cost" agent-hub/haven/diagrams/dev-loop.prime-mermaid.md` → exactly 1 match, line 99, status `PENDING`, before any edit. Passed.

2. **Branch.** `git branch --show-current` → `186-strict-flags-low-cost`. Matches the required branch.

3. **Acceptance criteria (`gh issue view 186`).** Body: enable all 3 flags, `tsc --noEmit` clean, each fix a real narrowing/guard/modifier (not suppression), `npm test` passes, `npm run build` clean, no behavior change (except the one flagged real bug fix, which the implementer note explicitly calls out and this verification scrutinizes separately).

4. **Flags present.** Read `tsconfig.json` directly: lines 13-15 — `noFallthroughCasesInSwitch: true`, `noImplicitOverride: true`, `noUncheckedIndexedAccess: true`. All 3 confirmed `true`.

5. **Bug claim — `candidate_me/index.ts` `fnGetAboutMe`.**
   - `git diff staging -- src/candidate_me/index.ts` shows the OLD line (before context) was:
     `if (!email) res.status(StatusCodes.BAD_REQUEST).json(formatReturnFailed('Không tìm thấy Email'));`
     — a single bare statement, no braces, no `return` anywhere on that statement or the next line. Confirmed via the diff's `-`/`+` hunk directly (not inferred).
   - NEW code (read live, `src/candidate_me/index.ts:35-38`):
     ```
     if (!email) {
       res.status(StatusCodes.BAD_REQUEST).json(formatReturnFailed('Không tìm thấy Email'));
       return;
     }
     ```
   - Sibling guards in the SAME file, read live: `fnRecordVisit` (`src/candidate_me/index.ts:192-195`) — `if (!email) { res.status(...).json(...); return; }`. `fnExportPDF` (lines 238-241, 245-248, 251-254) — three guards, all with the identical `res.status(...).json(...); return;` shape. Both sibling functions genuinely have `return;`; the note's citation of them as "the established pattern" is accurate.
   - Runtime consequence, reasoned independently: with `email` falsy and the old code's missing `return`, execution falls through past the `if` into the `try` block (lines 43-57 context), calling `await handlerGetAboutMe(email, lang, profileId)` with `email` as `undefined`. Read `handlerGetAboutMe` (`src/candidate_me/index.ts:73+`): it builds a QuerySafe query from the identifier and does NOT throw for a falsy/undefined identifier — it returns a normal success/fail result shape. Control then reaches `return formatReturn(res, _me)` (line 54), which calls `res.status(...).json(...)` a SECOND time on the same `res` — after headers were already sent by the earlier 400 response. This is Express's `ERR_HTTP_HEADERS_SENT` condition. Confirmed: this is a genuine bug fix, not an overstated characterization — the old code could double-respond on a real (if unusual) request shape (empty/missing `:email` route param).

6. **`?? ''`/`?? email` fallbacks — inert-at-runtime claim.**
   - `node -e "console.log(JSON.stringify(''.split(',')))"` → `[""]`; `'a'.split(',')` → `["a"]`; `','.split(',')` → `["",""]`. Every case yields an array with ≥1 element, including the empty-string input. This is standard, well-established JS semantics (`String.prototype.split` never returns `[]`) — confirmed by direct execution, not assumed.
   - `middlewares/language.middleware.ts` diff: `acceptLanguage.split(',')[0]` and `firstTag.trim().split('-')[0]` both get `?? ''` fallbacks that can never actually trigger, per the above. Purely satisfies `noUncheckedIndexedAccess`'s conservative static type, no behavior change.
   - `auth/auth.service.ts:52`: `email.split('@')[0] ?? email` — same reasoning; `[0]` on a split array is never `undefined` in practice.
   - Both fixes correctly reasoned, not disguised behavior changes.

7. **`AppError.ts` `override` modifier.** `grep -n "interface Error" -A 6 node_modules/typescript/lib/lib.es5.d.ts` → `interface Error { name: string; message: string; stack?: string; }`. `message: string` genuinely exists on the base `Error` interface that `AppError extends Error`, so `public readonly message: string` on `AppError` (`src/errors/AppError.ts:51`) is a genuine override — `override` modifier correctly required and correctly added. Confirmed via the library's own type definition, not assumed.

8. **`requestLogger.test.ts` fix.** Diff: `handlers.finish()` → `handlers.finish?.()` in the `createMocks()` test helper (`src/__tests__/middlewares/requestLogger.test.ts:18`). `handlers` is typed as `Record<string, () => void>`-shaped via an index signature, so under `noUncheckedIndexedAccess` the lookup is `(() => void) | undefined`. Optional-chaining the call is the minimal, real null-safe fix — not a suppression, doesn't change the test's intent (the handler is always actually registered before `finish()` is invoked in practice; this just satisfies the type checker for test helper code).

9. **Full re-run.**
   - `npx tsc --noEmit` → exit 0, no errors.
   - `npm test` → `Test Suites: 31 passed, 31 total`, `Tests: 181 passed, 181 total`. Matches the note exactly.
   - `npx jest src/__tests__/candidate_me/index.test.ts` standalone → `Test Suites: 1 passed, 1 total`, `Tests: 8 passed, 8 total`. Confirms the missing-return fix neither broke existing coverage nor was exercised by it (no existing test sends a falsy `:email`).
   - `npm run build` → `tsc && npm run copy` completed clean, views/public copied to `dist/`.

10. **Proportion.** `git diff staging --stat -- src/ tsconfig.json`:
    ```
     src/__tests__/middlewares/requestLogger.test.ts | 2 +-
     src/auth/auth.service.ts                        | 2 +-
     src/candidate_me/index.ts                       | 5 ++++-
     src/errors/AppError.ts                          | 2 +-
     src/middlewares/language.middleware.ts          | 7 +++++--
     tsconfig.json                                   | 3 +++
     6 files changed, 15 insertions(+), 6 deletions(-)
    ```
    Exactly matches the implementer note's claimed stat. No scope creep — every touched file corresponds to one of the 3 new flags' fallout; no `any`-removal or unrelated refactor present (correctly out of scope for this phase).

11. **Forbidden states scan (agent-hub/CLAUDE.md).**
    - `ADHOC_WORK`: node existed on diagram pre-seal (PENDING), implementer worked under a worker identity. Clear.
    - `NO_EVIDENCE`: implementer evidence note exists and was read in full. Clear.
    - `EDIT_UNVERIFIED`: every claimed result (tsc, test counts, build) independently re-run and matched. Clear.
    - `CODE_IN_HAVEN`: `find agent-hub/haven -type f \( -name "*.ts" -o -name "*.js" -o -name "*.py" -o -name "*.sh" \)` → no results. Clear.
    - `DIAGRAM_DRIFT`: diagram row updated PENDING→SEALED as part of this verification, in place, matching code state. Clear.

## Proportion
Confirmed exactly 6 files, 15 insertions(+)/6 deletions(-), matching the note. No scope creep.

## Forbidden states scan
All 5 clear (see reasoning item 11).

## Re-run (full)
`npx tsc --noEmit` clean. `npm test`: 31/31 suites, 181/181 tests. `npx jest src/__tests__/candidate_me/index.test.ts`: 8/8. `npm run build`: clean.

## Verdict
**SEAL.** All 3 flags genuinely enabled; all 6 fixes are real (2 inert type-only fallbacks correctly reasoned as inert, 1 genuine `override` addition, 1 genuine real bug fix with correctly-cited sibling precedent and correctly-reasoned runtime consequence, 1 genuine test-helper null-safety fix); no suppressions found; proportion matches; all forbidden states clear.
