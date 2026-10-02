# 2026-10-02 — type-crud-core (implementer note)

- Worker: implementer (main session)
- Node: `type-crud-core`
- GitHub issue: #181 — "type-safety: type the generic CRUD core (BaseController/BaseService/services/index.ts)", part of tracking issue #177
- Branch: `181-type-crud-core` (from `staging`, fresh — does not include #179's unmerged `(req as any)` removal; those casts are left untouched here, out of scope)

## Design decisions (the real work of this node)

1. **`T extends CrudDocument` generics, not a fixed `Model<CrudDocument>` parameter.** First attempt: type every `model: any` as `model: Model<CrudDocument>` directly. This failed — Mongoose's `Model<T>` is invariant enough (via methods like `castObject(...)` appearing in both covariant and contravariant positions) that a concrete model (e.g. `Model<EducationRawDocType, ...>`, which `mongoose.model(name, schema)` infers automatically from the schema even with no explicit type argument) is NOT assignable to a differently-parameterized `Model<CrudDocument>` — confirmed by trying it and reading the real `tsc` output (`castObject(...)` return-type mismatch). Fix: made every `base*Document` function and `createCrudService`/`createCrudController` generic over `<T extends CrudDocument>`, so `T` is inferred fresh per call site instead of checked against a fixed type. Real models satisfy the inference-based constraint fine; only a FIXED `Model<CrudDocument>` variable slot (see point 3) needed a cast.

2. **`CrudDocument` does NOT extend Mongoose's `Document`.** A `Model<T>`'s `T` parameter is the raw schema-inferred shape, before the `Document` instance-method wrapper Mongoose adds — constraining `T extends Document` rejected every real model (their raw inferred types don't carry `$`-prefixed instance methods themselves). `CrudDocument` ended up as a plain structural interface: `candidateId?`, `deletedAt?`, `images?` (the 3 fields this generic layer actually reads/writes across all 9 sections — `images` added after `baseUploadImages` needed it, only 3 of 9 sections actually have it, commented as such).

3. **One necessary, narrowly-scoped exception: `BaseController.ts`'s `modelObject` lookup table.** This is a `{ [key: string]: Model<CrudDocument> }` dictionary built from 9 differently-shaped concrete models, accessed with a request-supplied string key — an index signature on a FIXED variable type, not a generic function call, so point 1's generic-inference escape hatch doesn't apply here. Each of the 9 entries is cast `as unknown as Model<CrudDocument>` once, at this single declaration site, with a comment explaining why (same invariance issue as point 1, but unavoidable for a dynamic lookup table rather than a generic call). Every USE of `modelObject[x]` downstream (`baseGetAll`, `baseDelete`, `baseRestore`, `baseUploadImages`) stays fully generic-typed with zero further casts, since it flows straight into the generic `base*Document` functions, which re-infer `T` themselves from the (already-cast-once) `Model<CrudDocument>` value.

4. **Real null-safety bug found and fixed via a discriminated union, not papered over.** `_baseHelper().baseCheckDocumentById()`'s old return shape was `{isExist: boolean; message: string; document: T | null}` — a non-literal `boolean`, so callers' `if (!isExist) return ...;` guard did NOT narrow `document`'s nullability for TS (even though it's correct at runtime). Before this generic pass, `document` was implicitly `any` (since `MODEL`/`_find` were `any`), which silently hid every caller (`baseDeleteDocument`, `baseRestoreDocument`) accessing `.candidateId`/`._id` on a value TS could not prove was non-null. Fixed by making `isExist` a real discriminated union (`isExist: true as const` / `isExist: false as const`, with `document: null` paired to the false branch) — now `if (!isExist) return ...;` genuinely narrows `document` to non-null afterward, a real type-safety improvement, not a workaround.

5. **`document: Record<string, unknown>` for update/create/patch payloads**, not a per-section interface (those don't exist yet — a larger, separate follow-up; this core layer genuinely accepts arbitrary per-section Joi-validated shapes). Where `_id` specifically needed to flow through as `string | undefined` (not `unknown`), typed it explicitly: `Record<string, unknown> & { _id?: string }`. Two downstream helper signatures (`getDocumentUpdated`, `baseCheckDocumentById`) were widened from `_id: string` to `_id: string | undefined` to honestly match — both already null/empty-guard internally (`if (!_id) return ...`), so this is a real type accuracy fix, not newly introduced laxness.

6. **One real, justified `as` at the Mongoose-API boundary was NOT needed in the end** — expected friction with `MODEL.updateOne({_id}, _valueUpdate)` (where `_valueUpdate: Record<string, unknown>` vs Mongoose's `UpdateQuery<T>`) resolved itself once `_id`'s type was fixed (see point 5); no cast was required there after all. Verified by removing my first draft of a planned `as UpdateQuery<T>` cast and confirming `tsc` was still clean without it.

7. **`hookAfterSave`/`hookHasErrors` callback signatures** in `services/index.ts`, `BaseService.ts`, and `BaseController.ts`'s `service` interface — all moved from `any` to real `Record<string, unknown>`/`{success: boolean; [key: string]: unknown}`/`{err: unknown}` shapes. `BaseController.ts`'s bulk-create `results` array's index signature: `any` → `unknown`.

8. **`BaseService.ts` (standalone `createCrudService`) and `generalInformation.service.ts`'s own separate `handlerCreate`** (it doesn't use `createCrudService` for create — has its own duplicate-check logic) both needed fixing in step with `services/index.ts`'s new generics, since both call the now-generic `baseFindDocument`/`baseCreateDocument` directly. `doc.candidateId`/`document?.candidateId` (both `unknown` now) narrowed via `typeof === 'string'` checks instead of casts. `error: any` → `error: unknown` with a shared `errorMessage()` helper (`BaseService.ts`) / inline `instanceof Error` check (`generalInformation.service.ts`).

## Explicitly not touched

- `(req as any).lang`/`.user` casts throughout `BaseController.ts` and `generalInformation.service.ts`'s controller — `remove-req-as-any-casts`/#179's scope, unmerged as of this branch's fork point.
- Per-model document interfaces for the 9 CV-section models (`Education`, `Experience`, ...) — flagged in multiple places above as the real follow-up that would let `T` vary meaningfully per section instead of collapsing to the shared `CrudDocument` structural minimum. Not required by #181's own scope, which only named `BaseController.ts`/`BaseService.ts`/`services/index.ts`.
- `generalInformation.service.ts`'s `handlerGet`/`handlerUpdate`/`handlerDelete` (destructured straight from `createCrudService(...)`, untouched beyond what the generic signature change required) and the file's own `handlerCreate` — only the 2 lines that broke were fixed (point 8), no broader rewrite.

## Verification run

```
npx tsc --noEmit
```
Clean, 0 errors — reached after resolving, in order: the `Model<CrudDocument>`-vs-concrete-model invariance error (→ generics), the null-safety `document` access errors (→ discriminated union), 4x `unknown`-not-assignable-to-`string` errors (→ widened 2 helper signatures to `string | undefined`), 1 `UpdateQuery<T>` mismatch (→ resolved itself once `_id`'s type was fixed, no cast needed), 1 `images` property-missing error (→ added to `CrudDocument`), and 2 downstream `unknown`-not-assignable errors in `BaseService.ts`/`generalInformation.service.ts` (→ `typeof` narrowing). Each fix was verified individually by re-running `tsc` before moving to the next, not all applied blind and checked once at the end.

5 test files needed their fake-model mocks cast through `unknown` to the new `Model<CrudDocument>` parameter type (relaxed test policy, tracking issue #177) — `baseFindDocument.test.ts`, `baseCreateDocument.test.ts`, `baseSoftDelete.test.ts`, `baseUpdatePatchSoftDelete.test.ts`, `BaseService.test.ts`. Each uses the same `asModel()`/inline-cast pattern already established by `baseFindDocument.test.ts`.

```
npm test
```
```
Test Suites: 31 passed, 31 total
Tests:       181 passed, 181 total
Snapshots:   0 total
Time:        6.061 s
```
Same suite/test count as every prior sealed node this session — the 5 test-file changes are cast-only (no assertion/behavior changes), and all 9 CV sections built on this core (education/experience/award/certificate/project/reference/generalInformation/application/profile) pass their existing suites unchanged, confirming no public API or behavior change despite the significant internal type redesign.

```
npm run build
```
```
tsc && npm run copy
```
Clean.

## Diff scope

```
git diff staging --stat -- src/
```
```
 .../candidate_profile/BaseService.test.ts           |   7 +-
 src/__tests__/services/baseCreateDocument.test.ts   |   8 +-
 src/__tests__/services/baseFindDocument.test.ts     |  24 +++--
 src/__tests__/services/baseSoftDelete.test.ts       |  20 +++--
 .../services/baseUpdatePatchSoftDelete.test.ts      |  16 ++--
 src/candidate_profile/BaseController.ts             |  52 +++++++----
 src/candidate_profile/BaseService.ts                |  32 ++++---
 .../generalInformation.service.ts                   |  14 +--
 src/services/index.ts                               | 100 ++++++++++++++-------
 9 files changed, 178 insertions(+), 95 deletions(-)
```
3 named core files + `generalInformation.service.ts` (necessitated, point 8) + 5 test files (mock-cast updates, necessitated by the new generic signatures). `grep -n "\bany\b"` on the 3 named files (excluding `(req as any)`, #179's scope) returns zero real matches — only 2 explanatory-comment hits referencing the OLD `any`-typed state for context.

## Status
`sealed_pending_verifier`
