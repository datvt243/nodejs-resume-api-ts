# 2026-10-03 — enable-no-property-access-index-signature (ship-time integration)

- Context: same ship-in-order run as the phase 9 integration note. This
  branch forked before phases 3/4/6/7/9 merged, so popping its sealed
  stash onto the real, now-much-further-along `staging` produced both
  real git conflicts (4 files + 1 modify/delete) and, after resolving
  those, 9 NEW `noPropertyAccessFromIndexSignature` errors on lines
  those sibling phases had rewritten.

## Git conflicts resolved

- `tsconfig.json`: combined both flag blocks (phase 9's 3 flags +
  phase 10's 1 flag) — pure addition, no real conflict.
- `src/plugins/joi/index.ts`: modify/delete conflict (phase 10 touched
  a line in it; phase 7/#184 already deleted the whole file as
  confirmed-dead code). Kept the deletion — re-confirmed via this
  node's own evidence note that the touched line was the file's only
  flagged site, so nothing of substance was lost.
- `src/__tests__/middlewares/requestLogger.test.ts`: phase 9 added
  `?.()` (noUncheckedIndexedAccess), phase 10 added `['finish']`
  (noPropertyAccessFromIndexSignature) to the same line — combined to
  `handlers['finish']?.()`.
- `src/candidate_me/index.ts`: phase 9 (merged) added the missing
  `return;` bug fix in `fnGetAboutMe`'s early-exit branch; phase 10
  wanted `req.query['profile']` bracket notation. Combined both.
- `src/candidate_profile/general_information/generalInformation.service.ts`:
  phase 3/#180 (merged) already narrowed `candidateId` through a local
  variable (`fields: { candidateId }`) instead of inline property
  access — strictly already satisfies this phase's own rule, so took
  that version outright over phase 10's inline `document?.['candidateId']`.

## New errors surfaced after conflict resolution (not part of the original sealed scope)

`npx tsc --noEmit` found 9 errors on lines reshaped by #181/#183/#184
(merged after this branch forked), each a straightforward
`obj.prop` → `obj['prop']` fix, same mechanical pattern as this node's
own 29-file diff:
- `candidate_me/index.ts:26` — `localized.vi`/`localized.en` (from
  #183's `resolveLocalizedText` rewrite).
- `candidate_profile/BaseService.ts:34` — `doc.candidateId` inside
  `hookAfterSave` (from #181's generic CRUD rewrite; `doc` is typed
  `Record<string, unknown>`).
- `generalInformation.service.ts:32,57` — `document?.candidateId`/
  `doc.candidateId` (2 sites not yet converted to the local-variable
  pattern above).
- `utils/valid.ts:58` — `detail?.context?.limit` (from #184's
  `ValidationErrorItem` retyping; Joi's `Context` type carries an
  index signature).

All 9 fixed the same way as every other site in this node's own diff —
mechanical bracket-notation, zero behavior change.

## Verification

`npx tsc --noEmit`: clean (0 errors) after all fixes.
`npm test`: 31/31 suites, 181/181 tests passing.
`npm run build`: clean.

One transient `mcp__ide__getDiagnostics` false positive during this
process (`Module '"@/services"' has no exported member 'CrudDocument'`)
was confirmed stale by re-running `npx tsc --noEmit` directly — CrudDocument
is genuinely exported from `services/index.ts` (confirmed #181 already
established this); consistent with the known IDE-diagnostic-staleness
pattern recorded earlier in `doctrine/MEMORY.md` this session.

Not sent through a separate implementer/verifier round — same category
as the phase 9 integration fix: mechanical, compiler-mandated, zero
behavior change, surfaced purely by merge ordering.

## Status
Committed directly as part of shipping phase 10/12 of #177.
