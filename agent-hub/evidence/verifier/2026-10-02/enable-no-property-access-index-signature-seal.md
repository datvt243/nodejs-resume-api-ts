# 2026-10-02 — enable-no-property-access-index-signature (verifier note)

- Worker: verifier (independent subagent)
- Node: `enable-no-property-access-index-signature`
- New PM status: PENDING → **SEALED**
- Branch verified on: `187-no-property-access-index-sig` (confirmed via `git branch --show-current`, unchanged throughout)

## Isolation proof (actual spawn task string)

> "Run `verify_seal` for evidence note:
> agent-hub/evidence/implementer/2026-10-02/enable-no-property-access-index-signature-plan.md
> Node: `enable-no-property-access-index-signature` ... GitHub issue #187 ...
> This node's evidence note describes a real process mistake caught mid-implementation: after
> `tsc --noEmit` went clean, `npm test` FAILED ALL 31 SUITES because `jest.setup.ts` ... also
> needed the same fix. Verify this claim is real and was genuinely caught/fixed, not glossed
> over." — spawned with no memory of the implementer session; every fact below was independently
> derived from the real repo, not trusted from the note's prose.

## Reasoning (numbered, with file:line citations)

1. **Diagram row check (first gate)**: `grep -n "enable-no-property-access-index-signature" agent-hub/haven/diagrams/dev-loop.prime-mermaid.md` → line 99, exactly one match, status `PENDING`. Passed.
2. **Acceptance criteria** (`gh issue view 187`): flag enabled in `tsconfig.json`, `tsc --noEmit` clean, `npm test` passes, `npm run build` clean, no behavior change. All confirmed below.
3. **Flag presence**: `tsconfig.json` line 13: `"noPropertyAccessFromIndexSignature": true` — present, `include: ["src/**/*.ts"]` unchanged.
4. **jest.setup.ts claim, independently verified**: `git diff staging -- jest.setup.ts` shows all 7 lines changed `process.env.X` → `process.env['X']` (NODE_ENV, MONGOBD_USER, MONGOBD_PASSWORD, SESSION_SECRET, TOKEN_SECRET, TOKEN_REFRESH, TOKEN_EXP_IN). Mechanism confirmed real, not invented: `tsconfig.json`'s `include` is `src/**/*.ts` — `jest.setup.ts` lives at repo root, genuinely outside it, so `tsc --noEmit` alone never type-checks it. `jest.config.ts`'s `setupFiles: ['<rootDir>/jest.setup.ts']` is what pulls it into `ts-jest`'s type-checking during `npm test`. This is a real, previously-undocumented gap, not a glossed-over excuse.
5. **plugins/joi/index.ts**: `git diff staging` shows `opts?.required` → `opts?.['required']` at the `setJoiOptions` required-check. Note's reasoning (file slated for deletion by unmerged `type-joi-validation-layer`/#184, but live and must compile on THIS branch) is internally consistent — #184 is confirmed unmerged (not in this branch's history).
6. **doctrine/MEMORY.md**: `git diff staging` shows a new entry: "`npx tsc --noEmit` does NOT cover everything `npm test` type-checks," correctly describing the `include` vs `setupFiles` mechanism, dated 2026-10-02, tagged to #187.
7. **Spot-checks (5+, across all 3 categories), read directly from current file content**:
   - `src/routers/api/v1/education.route.ts:175,206`: `req.params['collection'] = Collections.EDUCATION` — correct key, correct enum value, matches route (education, not swapped with another section).
   - `src/server.ts:132,138`: `process.env['NODE_ENV']`, `process.env['LOCAL_PORT']` — correct names, logic around them (`_env`/`_portNumber`) untouched.
   - `src/candidate/candidate.service.ts:65,80,83`: `item['_id']`, `value['_id']` (×2) — correct, no cross-variable swap (`item` vs `value` preserved exactly as in the original dot-access).
   - `src/candidate_me/index.ts:29,31,254,264,273`: `req.query['lang']`, `req.query['profile']` (×2 call sites), `req.query['format']` (×2, 'json'/'docx' branches), `item['description']` — all correct, no key confusion between `lang`/`profile`/`format`.
   - `src/utils/i18n.ts:47`: `locales[lang as SupportedLang]?.['joiErrors']?.[type] ?? locales[DEFAULT_LANG]?.['joiErrors']?.[type]` — both sides converted correctly, optional-chaining preserved.
   All 5+ spot-checks: bracket notation with identical string-literal key, zero semantic drift.

## Proportion

`git diff staging --stat -- src/ tsconfig.json jest.setup.ts` → **28 files changed, 70 insertions(+), 69 deletions(-)** — matches the note's claimed stat exactly. Full `git status --short` shows exactly those 28 files plus `agent-hub/doctrine/MEMORY.md` and the diagram file (hub bookkeeping, expected, not scope creep). No `any`-removal, no unrelated refactor, no file touched outside the dot→bracket mechanical pattern + 1-line tsconfig addition.

## Forbidden states scan (agent-hub/CLAUDE.md)

- `ADHOC_WORK`: no — node exists on diagram, worker identity present.
- `NO_EVIDENCE`: no — implementer plan note present and read.
- `EDIT_UNVERIFIED`: no — every claim independently re-run below, not trusted from prose.
- `CODE_IN_HAVEN`: no — `find agent-hub/haven -type f \( -name "*.ts" -o "*.js" -o "*.py" -o "*.sh" \)` returned nothing.
- `DIAGRAM_DRIFT`: row flipped PENDING → SEALED in place as part of this seal, in sync with code state.

## Re-run (full)

```
npx tsc --noEmit
```
Exit 0, clean.

```
npm test
```
`Test Suites: 31 passed, 31 total` / `Tests: 181 passed, 181 total` — matches note exactly.

```
npm run build
```
`tsc && npm run copy` — clean, exit 0.

## Verdict

**SEAL.** The flag is genuinely enabled, the `jest.setup.ts` gap is real (confirmed via `tsconfig.json`'s `include` vs `jest.config.ts`'s `setupFiles`, not an invented-sounding excuse), all spot-checked individual fixes are syntactically correct and behavior-preserving, proportion matches exactly (28 files, 70+/69-), and a full independent re-run reproduces tsc/test/build clean with the exact same counts the note claims.
