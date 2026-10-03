# 2026-10-01 — feat-i18n-api-messages-auth (verifier verdict)

- Worker: verifier (subagent, dispatched via Agent tool)
- Node: `feat-i18n-api-messages-auth`
- New PM status: SEALED

## Isolation proof
Dispatched fresh via the Agent tool with the task string: "You are being
spawned as an independent verifier subagent... Run `verify_seal` for
evidence note: `agent-hub/evidence/implementer/2026-10-01/feat-i18n-api-messages-auth-plan.md`.
Node: `feat-i18n-api-messages-auth`..." — no memory of any implementation
session. Everything below was re-derived independently: reading real
files (`i18n.ts`, `language.middleware.ts`, `auth.controller.ts`,
`auth.service.ts`, `locales/en.ts`, both new test files, the test diff),
running `git status`/`git diff staging` myself, re-running `npm test`/
`npm run build` myself, and fetching GitHub issue #159 directly via `gh
issue view` rather than trusting the note's paraphrase.

## Reasoning

1. **`t(key,lang)`/`tErrorType` read in full** (`src/utils/i18n.ts`) —
   matches the note's description exactly: dot-path `getNested` walker,
   falls back to `DEFAULT_LANG` then the raw key; `tErrorType` does a flat
   one-level `joiErrors[type]` lookup specifically because a Joi type
   string like `any.required` already contains a dot.

2. **`language.middleware.ts` read in full** — `resolveLang` takes the
   first comma-separated tag, strips `-XX` regional suffix, lowercases,
   falls back to `vi` if unsupported; attaches `req.lang` + `req.t`.
   Matches the note.

3. **Zero hardcoded strings confirmed by my own grep**, not the note's
   claim: `grep -n "message:" src/auth/auth.controller.ts
   src/auth/auth.service.ts` → exactly 21 lines, every single one calls
   `t('auth.xxx', lang)` or `t('auth.xxx', (req as any).lang)`. Cross-
   checked against `src/locales/en.ts:6-25` — 19 `auth.*` keys present,
   covering every key referenced by the 21 call sites.

4. **Diff matches the note's claim, genuinely minimal.** `git status
   --short` on `159-i18n-for-api`: `M
   src/__tests__/auth/auth.controller.test.ts` plus 2 new untracked test
   files (`i18n.test.ts`, `language.test.ts`) and the evidence-note
   directory — no production file touched. `git diff --stat staging --
   src/`: 1 file, `+117/-0` on `auth.controller.test.ts` — confirmed via
   full diff read that every hunk is a pure addition (new `it(...)`
   blocks appended after existing tests), the pre-existing tests are
   byte-for-byte untouched.

5. **New test files read in full.** `i18n.test.ts` — 8 real assertions:
   per-lang resolution (`loginSuccess` en/vi), default-vi-with-no-lang,
   fallback-to-default-lang for an unsupported code, fallback-to-raw-key
   when missing everywhere, `tErrorType`'s flat lookup (`any.required` en/
   vi), `tErrorType` default-lang fallback, `tErrorType` returns
   `undefined` for an unknown type. `language.test.ts` — 8 real
   assertions matching the note's description (default/plain/regional/
   multi-tag-weighted/case-insensitive/unsupported-fallback, plus `req.t`
   proven to delegate to the real table for both en and vi, not a mock).
   `auth.controller.test.ts`'s 5 new tests each set `req.lang = 'en'` and
   assert the literal English string from `locales/en.ts` comes back
   through `formatReturn` — genuinely exercises the previously-untested
   `en` branch, not a re-assertion of the `vi` default.

6. **GitHub issue #159 fetched directly** (`gh issue view 159`), not
   trusted from the note's paraphrase. Its 3 acceptance criteria:
   - "`t(key, lang)` utility exists and is unit-tested" — met, `i18n.test.ts`.
   - "Every auth-flow response/error message resolves through `t()`,
     verified in both `vi` and `en` via `Accept-Language`" — met: the
     21-site grep (step 3) proves the "resolves through `t()`" half;
     the 5 new controller `en` tests + pre-existing `vi`-default tests
     prove the "verified in both languages" half at the layer that
     actually reads `Accept-Language`.
   - "No regression in existing auth tests" — met: `git diff` on
     `auth.controller.test.ts` shows pure additions; `auth.service.
     test.ts` untouched; full suite green (see below).
   Issue explicitly scopes out Joi validation messages and candidate/CV
   messages as a separate phase — matches the note's "explicitly not
   touched" section and the node's own PENDING description before this
   SEAL.

7. **`npm test` independently re-run.** My own verbatim tail:
   ```
   Test Suites: 31 passed, 31 total
   Tests:       181 passed, 181 total
   Snapshots:   0 total
   Time:        7.946 s
   Ran all test suites.
   ```
   Matches the note's claimed `31 passed, 31 total` / `181 passed, 181
   total` exactly (baseline 29/160 + 2 new suites + 21 new tests, also
   checks out arithmetically: 8 + 8 + 5 = 21).

8. **`npm run build` independently re-run.** `tsc && npm run copy` →
   clean, no typecheck errors, `cp -R ./src/views ./src/public ./dist/`
   ran without complaint.

**Proportion**: 3 test files, 0 production code — appropriately minimal
given the feature was already fully live; does not exceed the node's
scope (SmallestDiff) and does not fall short of any of #159's 3
acceptance criteria.

**Forbidden states scan**: `ADHOC_WORK` — no, real diagram node existed
(PENDING) and this ran through the verify_seal recipe. `NO_EVIDENCE` —
no, implementer note + this verdict note both exist. `EDIT_UNVERIFIED` —
no, `npm test`/`npm run build` independently re-run and read back
verbatim above. `CODE_IN_HAVEN` — no `.ts`/`.js` files added to `haven/`.
`DIAGRAM_DRIFT` — corrected by this SEAL (PM status now matches the
confirmed-live code + newly-added test coverage).

## Re-run
`full` — re-ran `npm test` (31/31 suites, 181/181 tests, matched exactly)
and `npm run build` (clean) myself from the repo root; independently read
every file the note cited (`i18n.ts`, `language.middleware.ts`,
`auth.controller.ts`, `auth.service.ts`, `locales/en.ts`, both new test
files, the full `auth.controller.test.ts` diff) rather than auditing the
note's prose alone; ran `git status`/`git diff staging --stat` myself to
confirm the minimal-diff claim; fetched GitHub issue #159 directly via
`gh issue view 159 --json body` rather than trusting the note's
paraphrase of acceptance criteria. Justification: same class as
`add-candidate-self-delete`/`fix-idor-broken-access-control` — an
unusual "0 production diff, already fully live" claim, and the
dispatching task explicitly asked me to judge whether that warrants a
re-run under the recipe's criteria; it does.

## Hub bytes before
n/a — not measured (not trivial to isolate cheaply from this dispatch context).

## Hub bytes after
n/a — same reason; the diagram-row edit is the only hub-byte-affecting
write made this pass.
