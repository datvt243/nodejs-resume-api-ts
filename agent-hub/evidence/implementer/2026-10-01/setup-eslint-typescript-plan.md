# 2026-10-01 — setup-eslint-typescript (implementer note)

- Worker: implementer (main session)
- Node: `setup-eslint-typescript`
- GitHub issue: #178 — "type-safety: set up ESLint + typescript-eslint (real TS linting)", part of tracking issue #177
- Branch: `178-eslint-typescript` (from `staging`)

## Problem confirmed before writing anything

- `.eslintrc.cjs` (read in full): a leftover "Sample Eslint config for
  Node.js project" — `@babel/eslint-parser`, `extends: ['eslint:recommended']`
  only, zero TypeScript awareness, zero type-safety rules. Not referenced
  by `package.json` (no `lint` script existed) or either GitHub Actions
  workflow (`grep -rn "eslintrc" .github/workflows/*.yml package.json` —
  no hits).
- `eslint` v9.15.0 existed in `node_modules`/`package-lock.json` but was
  **not declared in `package.json` at all** — an orphaned install (`grep
  -n "\"eslint\"" package.json` — no hits before this change; confirmed via
  a `python3 -c "json.load(...)"` check of `package-lock.json`'s root
  `packages[""]` entry that neither `dependencies` nor `devDependencies`
  listed it).
- No `@typescript-eslint`/`typescript-eslint` packages existed anywhere.

## What changed

1. `npm install --save-dev eslint@^9.15.0 typescript-eslint@^8.71.0` — now
   real, declared devDependencies (resolved to `eslint@9.39.5`,
   `typescript-eslint@8.71.0` — both within the requested ranges).
2. **New `eslint.config.mjs`** (ESLint 9 flat config, since the installed
   ESLint major version defaults to flat config) using `defineConfig`/
   `globalIgnores` from `eslint/config` (the current, non-deprecated API —
   `tseslint.config()`'s own bare multi-arg form is deprecated as of this
   `typescript-eslint` version in favor of `defineConfig()`, confirmed via
   the `@deprecated` JSDoc in
   `node_modules/typescript-eslint/dist/config-helper.d.ts:67-68`, which
   points at ESLint core's `defineConfig()` as the replacement — this is
   why the config uses `extends: [tseslint.configs.recommendedTypeChecked]`
   inside a `defineConfig()` block rather than the older
   `tseslint.config(...tseslint.configs.recommendedTypeChecked)` spread
   form).
   - Type-aware (`languageOptions.parserOptions.projectService: true` +
     `tsconfigRootDir`), scoped to `files: ['src/**/*.ts']` — the same set
     `tsconfig.json`'s own `include` covers, so every linted file belongs
     to a real TS program (root-level config files and `src/public/**`
     static JS assets are excluded via `globalIgnores`, not linted at all
     — they're outside the `tsc` build already).
   - Extends `tseslint.configs.recommendedTypeChecked`, then explicitly
     sets (all `'error'`, matching the issue's required list):
     `no-explicit-any`, `no-non-null-assertion`, `no-unsafe-assignment`,
     `no-unsafe-member-access`, `no-unsafe-call`, `no-unsafe-return`,
     `no-unsafe-argument`, `no-floating-promises`, `no-misused-promises`,
     `no-unused-vars` (with `argsIgnorePattern`/`varsIgnorePattern: '^_'`
     for the intentionally-unused-param convention later phases will use).
   - A second block scoped to `files: ['src/__tests__/**/*.ts']` turns the
     any/unsafe-* rules back `'off'` — the locked policy from tracking
     issue #177 (relaxed for Jest-mock-heavy test code; every other rule
     still applies there).
3. **Deleted `.eslintrc.cjs`** — fully superseded, confirmed unreferenced
   anywhere first (see above).
4. **`package.json`** — added `"lint": "eslint ."` and `"lint:fix":
   "eslint . --fix"` scripts.

No `src/` production files were touched. This phase is tooling-only, per
the issue's own scope note.

## Verification the config actually works (not just "doesn't crash")

```
npm run lint
```
Ran clean (no config errors), reported **1424 real problems** across
`src/` — spot-checked a sample of the output and confirmed it's catching
genuine violations already known from the issue #177 audit, e.g.:
- `src/utils/querySafe.ts` — `no-explicit-any` + 2 `no-unnecessary-type-assertion` hits.
- `src/utils/tokenBlacklist.ts` / `sessionRevocation.ts` — the exact
  `(_cleanup as any).unref()` sites named in issue #180's scope, correctly
  flagged as `no-unsafe-member-access`/`no-unsafe-call`.
- `src/utils/valid.ts` — dozens of `no-unsafe-*` hits on Joi's loosely-typed
  error details, matching issue #184's scope.

This confirms the linter is genuinely type-aware (catching unsafe member
access/calls on `any`-typed values, not just syntactic patterns) — fixing
these 1424 violations is explicitly out of scope for this phase (that's
issues #179–#189); this phase only needed to prove the tool works.

## Verification run

```
npm test
```
```
Test Suites: 31 passed, 31 total
Tests:       181 passed, 181 total
Snapshots:   0 total
Time:        4.651 s, estimated 8 s
```
(unchanged from before this change — confirms zero behavior impact)

```
npm run build
```
```
tsc && npm run copy
```
Clean, no typecheck errors.

## Diff scope

```
git diff staging --stat
```
```
 .eslintrc.cjs                                      |  34 --
 agent-hub/haven/diagrams/dev-loop.prime-mermaid.md |  12 +
 package-lock.json                                  | 635 ++++++++++++++++-----
 package.json                                       |   6 +-
 4 files changed, 517 insertions(+), 170 deletions(-)
```
Plus the new untracked `eslint.config.mjs`. `package-lock.json`'s size is
from `npm install` resolving the `eslint`/`typescript-eslint` dependency
trees (171 packages) — not hand-edited.

## Explicitly not touched

- No `src/` production code changes (out of scope for this phase).
- CI workflows (`.github/workflows/*.yml`) — not wired into CI in this
  phase; the issue only requires `npm run lint` to exist and work, wiring
  it into required status checks is a separate, more sensitive decision
  (would affect branch-protection gating) not requested here.
- `npm audit` reported 37 pre-existing vulnerabilities in the dependency
  tree (unrelated packages, not introduced by this change) — out of scope
  for a type-safety initiative, not touched.

## Status
`sealed_pending_verifier`
