# 2026-10-02 — type-joi-validation-layer (implementer note)

- Worker: implementer (main session)
- Node: `type-joi-validation-layer`
- GitHub issue: #184 — "type-safety: type the Joi config/validation layer", part of tracking issue #177
- Branch: `184-type-joi-validation` (from `staging`, fresh)

## What changed, per file

### `src/config/joi.config.ts`
- `JoiMessages = Record<string, any>` → fixed to `Record<string, string>` (Joi message templates are always strings), then found genuinely unused after the next change and removed entirely.
- **`settingJoiValidate()` deleted.** Investigating its `_joi: any = Joi` line (needed to understand what to type it as) revealed it's not just untyped but actually broken: `_joi` is assigned the Joi *namespace* itself, and every subsequent call (`_joi.string()`, `_joi.pattern(pattern)`, `_joi.min(min)`, `_joi.trim().strict()`, `_joi.label(label)`, `_joi.messages(_messages)`) is called on that same namespace reference, never reassigning the returned schema — so the chain never actually composes a single configured schema the way the function's own logic implies it should. Confirmed via `grep -rn "settingJoiValidate" src` that it has zero callers anywhere in the codebase. Per this repo's own convention (confirmed-unused code is fine to delete, not rename-with-underscore), removed it rather than either (a) leaving `any` to keep hiding a bug nothing exercises, or (b) guessing how to fix broken logic for a function nothing calls — properly typing it would have required rewriting its behavior, which is not what a type-safety pass should silently do to dead code.
- `getObject(fields: Record<string, any>)` → `fields: Joi.SchemaMap` (Joi's own real parameter type for `Joi.object(...)`). This function IS used (`candidate.validate.ts`, `generalInformation.validate.ts`), confirmed via grep before touching it.

### `src/plugins/joi/index.ts` — deleted entirely
`grep -rn "renderJoi\|JoiSchemaTypesConst\|JoiSchemaTypes\b" src --include="*.ts" | grep -v "plugins/joi/index.ts"` and `grep -rn "from '@/plugins/joi'" src` both returned empty — this entire module (a duplicate `password` export, `renderJoi()`, `setJoiOptions()`) has zero callers anywhere. `setJoiOptions(schema: any, ...)` does genuinely dynamic property access (`schema?.[key]?.(value)`, a method name computed from a runtime string) that can't be typed safely without either `any` or a large, speculative structural interface for code nothing calls. Deleted the file and its now-empty `src/plugins/joi/` and `src/plugins/` directories, same reasoning as `settingJoiValidate` above — confirmed dead first, not guessed.

### `src/utils/valid.ts`
- `item: Partial<Record<string, any>>` → `Partial<Record<string, unknown>>`.
- `translateJoiDetail(detail: any, ...)` → `detail: ValidationErrorItem` (Joi's own real exported type for a validation error detail).
- `formatValidateError(error: any, ...)` → `error: ValidationError` (Joi's own real exported type).
- `messages: Record<string, any>` → `Record<string, string>` (every value is `translateJoiDetail(...)`'s return, already typed `string`).
- `validateModel(model: any, value: Record<string, any>)` → `model: { validate: (doc: unknown) => Promise<void> }` (a minimal structural interface for the one method actually called — sidesteps the same Mongoose `Model<T>` invariance friction `type-crud-core`/#181 hit, without needing that node's generic machinery, since only `.validate()` is used here), `value: Record<string, unknown>`.
- Also removed an unused `Model` import from `mongoose` (imported but never referenced anywhere in the file — found while reading the file to design the above).
- `for (const [k, v] of Object.entries(_errs))` → `for (const k of Object.keys(_errs))` (`v` was never used — same pattern already fixed once in `services/index.ts` during `type-crud-core`/#181). Also `var valid` → `let valid` (directly adjacent to the same block being touched; ESLint's `no-var` rule, part of the `setup-eslint-typescript`/#178 config, would flag it — trivial, in-scope since the line was already being edited).

### `src/errors/AppError.ts`
New exported `AppErrorDetails = string | string[] | Record<string, string> | null | undefined` type, derived from every REAL shape `errors` is actually constructed with across the codebase (checked via `grep -rn "new (ValidationError|BadRequestError|ConflictError|NotFoundError|AuthenticationError|AuthorizationError|AppError)" src`, then read each call site in `utils/helper.ts`): a single string (a Mongoose CastError's `.message`), a list of per-field translated messages (`formatValidateError`'s `Object.values()`-shaped output used as an array in one branch, or `services/index.ts`'s `modelValidate`'s `string[] | null`), or a field-name-keyed map (`formatValidateError`'s actual return shape, `Record<string, string>`). Replaced all 23 `any` occurrences (the interface field, every constructor overload's `errors?:` parameter across `AppError`/`ValidationError`/`AuthenticationError`/`AuthorizationError`/`NotFoundError`/`ConflictError`/`BadRequestError`, and every `let finalErrors: any;` local) with `AppErrorDetails`. `| undefined` was added to the union after `tsc` correctly rejected the first (undefined-less) version — every `finalErrors` local can legitimately end up `undefined` when the optional `errors` constructor param isn't given, which is a real, valid state, not something to force away with a non-null assertion.

## Explicitly not touched

- `utils/helper.ts`'s own `any` usage (`err: any` in `handleError`, `message: any` in the deprecated `throwError`, `[string, any]` in the `Object.entries(err?.errors)` map inside `handleError`) — that file is named in `type-pdf-docx-export`/#185's scope, not this node's.
- `InvalidCredentialsError`/`TokenExpiredError`/`TokenRevokedError`/`InvalidTokenError` (the 4 subclasses extending `AuthenticationError` directly, not `AppError`) — already had no `any` of their own (their constructors only take `message`/`options`, no `errors` param), confirmed by reading them; nothing needed there.

## Verification run

```
npx tsc --noEmit
```
Clean, 0 errors — reached in 2 steps: `AppErrorDetails` without `undefined` was tried first and correctly rejected (14 real "undefined not assignable" errors, one per `finalErrors = messageOrOptions?.errors`/`finalErrors = errors` assignment), widened to include `undefined`, then clean.

```
npm test
```
```
Test Suites: 31 passed, 31 total
Tests:       181 passed, 181 total
Snapshots:   0 total
Time:        6.676 s
```
Same baseline as every prior sealed node this session. No test needed updating — `getObject`/`validateModel`/`validateSchema`/`formatValidateError`/the `AppError` hierarchy all kept their exact runtime behavior; only their declared types changed, plus 2 confirmed-dead code paths were removed (zero behavior surface, zero callers).

```
npm run build
```
Clean.

```
grep -n "\bany\b" src/config/joi.config.ts src/utils/valid.ts src/errors/AppError.ts
```
Only Joi's own `'any.required'` error-type string-literal keys remain in `joi.config.ts` (12 hits) — not TypeScript `any`, same false-positive class confirmed in this tracking issue's earlier `type-auth-module`/#182 node. Zero real `any` in any of the 3 touched files (`plugins/joi/index.ts` no longer exists to check).

## Diff scope

```
git diff staging --stat -- src/
```
```
 src/config/joi.config.ts |  46 +-----------------
 src/errors/AppError.ts   |  55 ++++++++++++---------
 src/plugins/joi/index.ts | 121 -----------------------------------------------
 src/utils/valid.ts       |  24 +++++-----
 4 files changed, 45 insertions(+), 201 deletions(-)
```
3 named files + 1 confirmed-dead file deleted as a direct consequence of attempting to type it (not scope creep — the alternative was leaving `any` on code nothing calls, or guessing at a rewrite of broken unused logic).

## Status
`sealed_pending_verifier`
