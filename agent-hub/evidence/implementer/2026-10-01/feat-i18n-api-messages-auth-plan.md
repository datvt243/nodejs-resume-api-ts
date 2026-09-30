# 2026-10-01 — feat-i18n-api-messages-auth (implementer note)

- Worker: implementer (main session)
- Node: `feat-i18n-api-messages-auth`
- GitHub issue: #159 — "i18n for API messages — auth flow (phase 1/2)"
- Branch: `159-i18n-for-api` (from `staging`)

## Finding: already fully implemented, same backfill pattern as #158/#161

Read the full acceptance criteria and every file the scope names before
writing anything:

- `src/utils/i18n.ts` — `t(key, lang)` (dot-path lookup, falls back to
  `DEFAULT_LANG` then to the raw key) and `tErrorType(type, lang)` (flat
  one-level lookup for Joi/Mongoose error-type codes) both already exist.
- `src/locales/{vi,en}.ts` — both locale tables exist (TS modules, not
  `.json`, but functionally the "hand-rolled t(key,lang)" the issue
  describes) with a full `auth.*` namespace (19 keys) covering every
  register/login/logout/refresh/forgot-password/reset-password/
  verify-email message in both languages.
- `src/middlewares/language.middleware.ts` — resolves `Accept-Language`
  (first weighted tag, primary subtag, case-insensitive, defaults to
  `vi` for missing/unsupported), attaches `req.lang` + `req.t(key)`.
- `src/auth/auth.controller.ts` / `src/auth/auth.service.ts` — read in
  full. Every one of the 21 `message:` sites in both files resolves
  through `t(key, lang)`; every handler (`handlerRegister`,
  `handlerLogin`, `handlerForgotPassword`, `handlerResetPassword`,
  `handlerVerifyEmail`) takes `lang: string = DEFAULT_LANG`; every
  controller action reads `(req as any).lang` and threads it through to
  the service call, the literal `t()` calls, and `handleError(err, next,
  lang)`. No hardcoded string found anywhere in either file — confirmed
  by grepping every `message:` line in both files.

Real gap: **zero test coverage** existed for any of this — no
`i18n.test.ts`, no `language.middleware` test, and the existing
`auth.controller.test.ts`/`auth.service.test.ts` only ever exercised the
default `vi` path (mock requests never set `req.lang`, so `(req as
any).lang` was `undefined` and `t()` fell through to `DEFAULT_LANG`).
Nothing proved the `en` path actually worked end-to-end.

## What changed (tests only, 0 production code)

1. **`src/__tests__/utils/i18n.test.ts`** (new) — unit tests for `t()`
   (resolves per requested lang, defaults to vi, falls back to
   `DEFAULT_LANG` for an unsupported lang code, falls back to the raw key
   when missing everywhere) and `tErrorType()` (flat lookup vs `t()`'s
   dot-path walk, default-lang fallback, `undefined` for an unknown
   type). Satisfies acceptance criterion 1 ("`t(key,lang)` utility exists
   and is unit-tested").

2. **`src/__tests__/middlewares/language.test.ts`** (new) — unit tests
   for `languageMiddleware`: defaults to `vi` with no header, plain tag,
   regional tag (`en-US` → `en`), multi-tag weighted header (first tag
   wins), case-insensitivity, unsupported-language fallback, and that
   `req.t(key)` genuinely delegates to the real `t()` table (asserts the
   real English/Vietnamese strings, not a mock).

3. **`src/__tests__/auth/auth.controller.test.ts`** (extended in place,
   +117 lines, existing tests untouched) — added one `en`-language test
   per controller action group, real (unmocked) `t()`, asserting the
   actual English string comes back when `req.lang = 'en'`:
   - `authRegister` — fallback success message (`message ||
     t('auth.registerSuccess', lang)`)
   - `authLogin` — fallback failure message (`t('auth.loginFailed')`)
   - `authRefreshToken` — no-refresh-token + revoked-token messages
     (both direct `t()` calls, not fallbacks)
   - `authLogout` — no-token + success messages
   - `authLogoutAll` — success message

   Combined with the pre-existing tests (which all run with `req.lang`
   unset → `vi`), this now proves both languages for every branch
   touched, satisfying acceptance criterion 2 ("verified in both vi and
   en via Accept-Language") at the controller boundary — the layer that
   actually reads `Accept-Language` via `req.lang`.

`handlerLogin`/`handlerRegister`'s own service-level messages were
already implicitly exercised in both directions by `auth.service.test.ts`
(default `vi` calls) — no service-level `en` test was added since the
service functions take a raw `lang` string param (already proven
language-agnostic by the `t()` unit tests) rather than reading
`Accept-Language` themselves; the controller is the integration point
worth testing end-to-end.

## Explicitly not touched

- Joi validation messages (`utils/valid.ts`) and Mongoose `required`
  messages (`utils/helper.ts`'s `handleError`) — out of scope per the
  issue body, tracked as phase 2 (#160 / node
  `feat-i18n-full-coverage`).
- Candidate/CV section messages — same, phase 2.
- `api/v2/auth` (register/login WIP mirror) — issue #159 scopes only the
  v1 auth flow; v2 has its own separate node/issue history
  (`consolidate-v1-v2-auth`).

## Verification run

```
npm test
```
```
Test Suites: 31 passed, 31 total
Tests:       181 passed, 181 total
Snapshots:   0 total
Time:        7.474 s, estimated 8 s
```
(baseline before this change: 29 suites / 160 tests — +2 suites / +21
tests: 8 in `i18n.test.ts`, 8 in `language.test.ts`, 5 new `en`-language
cases in `auth.controller.test.ts`)

```
npm run build
```
```
tsc && npm run copy
```
Clean, no typecheck errors.

## Hub bytes before
(measured by verifier, same 5-category `/hub-tokens` formula)

## Status
`sealed_pending_verifier`
