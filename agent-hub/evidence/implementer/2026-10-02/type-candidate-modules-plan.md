# 2026-10-02 — type-candidate-modules (implementer note)

- Worker: implementer (main session)
- Node: `type-candidate-modules`
- GitHub issue: #183 — "type-safety: type candidate + generalInformation + candidate_me modules", part of tracking issue #177
- Branch: `183-type-candidate-modules` (from `staging`, fresh — does not include #179/#180's unmerged fixes)

## Scoping check before writing anything

Of the 3 named files:
- **`src/candidate/candidate.controller.ts`** — `grep -n "\bany\b" ... | grep -v "(req as any)"` returns only a comment match ("or any authenticated user"). Zero real `any` beyond the `(req as any)` family (#179's scope, unmerged here). **Nothing to do.**
- **`src/candidate_profile/general_information/generalInformation.controller.ts`** — same grep returns exactly 1 hit: `(_resultRaw as any).data` (line 29) — the EXACT site `fix-utils-real-any-casts`/#180 already fixes on its own branch (confirmed by reading that node's own evidence note content described in tracking issue #177). Out of this node's scope, left untouched. **Nothing to do.**
- **`src/candidate_me/index.ts`** — real work here, 7 genuine `any` sites beyond the 1 that's also #180's scope (`(_me.data as any)?.isPublic`, line 48 originally, left untouched for the same reason as above).

So this node's actual diff is scoped entirely to `candidate_me/index.ts`.

## What changed, per site

1. **`resolveLocalizedText(value: any, lang: string)`** → `value: unknown`. Body already did its own narrowing (`typeof value === 'string'`, `typeof value !== 'object'`) — only the final `value[lang] || value.vi || value.en` line needed a cast to read arbitrary string keys off a narrowed-to-object value (`localizedTextSchema`'s real shape, `{vi, en}`, isn't exported as a reusable type anywhere in this codebase yet). Cast once, narrowly, after the null/object narrowing, not before: `const localized = value as Record<string, unknown>`. Also fixed a latent type-looseness in the same line: the old `value[lang] || value.vi || value.en || ''` would happily return a non-string if `value[lang]` were e.g. `0` or `false` in some corrupted-data edge case — added an explicit `typeof resolved === 'string' ? resolved : ''` guard matching the function's own declared `: string` return type.
2. **`profileDoc: Record<string, any> | null`** → tried `Record<string, unknown> | null` first; `tsc` correctly rejected it (`MODEL.Profile.findOne().exec()` returns a real hydrated Mongoose document, which has no string index signature — same invariant Mongoose has everywhere in this codebase). Fixed properly instead of forcing it: `Awaited<ReturnType<typeof MODEL.Profile.findOne>>` (the real inferred type, no cast). The one genuinely dynamic access this file does on it (`profileDoc[profileIdsField]`, where `profileIdsField` is only known at runtime via the `PROFILE_ID_FIELDS` lookup) still needs a narrow, commented cast — real Mongoose documents can't be indexed by an arbitrary runtime string without one.
3. **`getMoreInfo: { collection: string; model: any }[]`** → same justified-cast pattern `type-crud-core`/#181 established for `BaseController.ts`'s `modelObject` (confirmed there: Mongoose's `Model<T>` is invariant enough that no concrete model can be assigned to a fixed `Model<SomeInterface>`-typed slot without a cast). Defined a local, minimal `SectionDocument` interface (not importing #181's `CrudDocument` — that export doesn't exist on this branch, forked independently off `staging`) and cast each of the 7 models once, at this single declaration site.
4. **`_find: undefined | Record<string, any> | Record<string, any>[]`** → removed the manual annotation entirely; `model.find(...).exec()`'s real inferred return type (an array of hydrated `SectionDocument`s) is accurate and sufficient, since `_find` is immediately flattened via `JSON.parse(JSON.stringify(_find))` right after — no manual type was actually buying anything here, and the old manual type was wrong anyway (claimed `undefined` was possible; Mongoose's `.find().exec()` always resolves to an array, never `undefined`).
5. **2 remaining `Record<string, any>` callback parameters** (`dataResult['generalInformation']`'s IIFE, the per-section `.map((item: Record<string, any>) => ...)`) → `Record<string, unknown>`. Flagged honestly in the note below: `dataResult` itself (`= JSON.parse(JSON.stringify(document))`) is still `any` end-to-end — `JSON.parse`'s return type is `any` by definition, so the CALL sites passing `dataResult[...]` into these callbacks don't get any stricter at the boundary. The fix still has real value: each callback's own BODY is now checked against `Record<string, unknown>` instead of silently accepting anything, catching a real mistake inside the callback itself (e.g. a typo'd field access) even though the outer `dataResult` variable's own looseness is a separate, larger problem.

## Explicitly not touched (and why)

- **`dataResult`'s root `any`-ness** (`JSON.parse(JSON.stringify(document))`) — flagged above, not fixed. Properly typing the full aggregated public-profile response shape (~15+ fields across Candidate + 7 CV sections + profile filtering) would be a real interface-design task on its own, not a "remaining any" cleanup — reasonable to treat as a separate, larger follow-up if the operator wants it (no GitHub issue currently tracks it; could be filed against the tracking issue #177 if desired).
- `candidate.controller.ts`, `generalInformation.controller.ts` — confirmed empty scope (see above), zero changes.
- `(req as any)` throughout `candidate_me/index.ts` — #179's scope, unmerged on this branch.
- `(_me.data as any)?.isPublic` — #180's scope, unmerged on this branch.

## Verification run

```
npx tsc --noEmit
```
Clean, 0 errors — reached incrementally: `profileDoc`'s first attempt (`Record<string, unknown>`) correctly failed against the real Mongoose document type, fixed with `Awaited<ReturnType<...>>` instead of forcing the loose type; `_find`'s manual annotation similarly failed and was removed rather than forced.

```
npm test
```
```
Test Suites: 31 passed, 31 total
Tests:       181 passed, 181 total
Snapshots:   0 total
Time:        5.237 s
```
Same baseline as every prior sealed node this session — `candidate_me/index.test.ts`'s existing suites (QuerySafe fail-closed checks, profile filtering issue #133, ObjectId candidateId stringification issue #153) all pass unchanged, confirming no behavior change despite the type rewrite.

```
npm run build
```
Clean.

## Diff scope

```
git diff staging --stat -- src/
```
```
 src/candidate_me/index.ts | 56 ++++++++++++++++++++++++++++++++---------------
 1 file changed, 38 insertions(+), 18 deletions(-)
```
Exactly 1 file — matches the node's real scope (the other 2 named files had nothing left once #179/#180's overlapping sites are excluded).

## Status
`sealed_pending_verifier`
