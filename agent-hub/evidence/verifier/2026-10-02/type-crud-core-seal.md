# 2026-10-02 — type-crud-core (verifier seal)

- Worker: verifier (independent fresh subagent, no memory of implementer session)
- Node: `type-crud-core`
- New PM status: PENDING -> SEALED
- Isolation proof: spawned via Agent tool as a fresh "general-purpose"-class subagent with task string beginning "You are an independent verifier subagent for a one-person dev hub project ... Run `verify_seal` for evidence note: agent-hub/evidence/implementer/2026-10-02/type-crud-core-plan.md ... Node: `type-crud-core` ... GitHub issue #181 ... Verifier contract: VerdictOnly, EvidenceOnly, NeverVerifyOwnWork, RatchetOnly, AppendOnly." No conversation history with the implementer session; every fact below was independently re-derived from files/commands run in this pass.

## Reasoning

1. CRITICAL FIRST CHECK: `grep -n "type-crud-core" agent-hub/haven/diagrams/dev-loop.prime-mermaid.md` — row existed exactly once, state PENDING, before this seal.
2. Read the full evidence note (`type-crud-core-plan.md`) and `gh issue view 181 --json body -q '.body'` — acceptance criteria: zero `any` in the 3 named files (or rare, justified, commented exception), all 9 sections compile/pass unchanged, `npm test`/`npm run build` clean.
3. Read `src/services/index.ts` (474 lines), `src/candidate_profile/BaseService.ts` (72 lines), `src/candidate_profile/BaseController.ts` (278 lines) in full.
4. Core design claims tested, not just read:
   - `CrudDocument` (`services/index.ts:27-36`) is a bare structural interface — confirmed it does not `extends Document`.
   - `baseFindDocument`, `baseCreateDocument`, `baseUpdateDocument`, `basePatchDocument`, `baseDeleteDocument`, `baseRestoreDocument` all declared `<T extends CrudDocument>` — confirmed by reading every signature (lines 74, 129, 168, 205, 284, 350).
   - `baseCheckDocumentById` (lines 442-471) is a real discriminated union (`isExist: true as const`/`false as const`, `document: T`/`null` paired per branch). Traced `baseDeleteDocument` (line 135-138): `const { isExist, message: _mess, document } = await ...; if (!isExist) return ...; const { _id, candidateId = '' } = document;`. Verified narrowing is genuine, not luck: wrote an isolated minimal repro of the identical union shape in `/tmp/narrow_check/check.ts` and compiled with `npx tsc --noEmit --strict` — compiled clean, proving a destructured discriminated union narrows correctly under strict mode.
   - `modelObject` (`BaseController.ts:40-50`): all 9 entries cast `as unknown as Model<CrudDocument>`. Independently tested the central invariance claim: removed the cast from the `educations` entry only, ran `npx tsc --noEmit` — got a real error: `Model<{...Education's real inferred shape...}>` not assignable to `Model<CrudDocument, ...>`, specifically `_id: ObjectId | null` vs `ObjectId` surfaced through `countDocuments(...).$where(...).exec()`'s return type (same invariance class as the note's claim; a different named method than the note's `castObject(...)` example, immaterial to the structural point). Restored the cast, re-ran `npx tsc --noEmit` — clean again; `git diff --stat` on the file matched the pre-experiment state exactly (no residual diff).
   - `images?: string[]` on `CrudDocument`: `grep -n images src/models/project.model.ts src/models/certificate.model.ts src/models/award.model.ts` all hit; `src/models/education.model.ts` had zero hits — matches the "only 3 of 9" claim.
5. `grep -n "\bany\b" src/services/index.ts src/candidate_profile/BaseService.ts src/candidate_profile/BaseController.ts | grep -v "(req as any)"` → 2 hits, both inside comments (one explanatory reference to the old `any`-typed state, one the unrelated English word "any" in a prose comment) — zero real type-annotation `any`. `grep -c "(req as any)" src/candidate_profile/BaseController.ts` → 31, confirming #179's casts are untouched (correct, #179 unmerged on this branch — the GH issue's own scope text wrongly assumes #179 already landed; the note discloses this honestly).
6. Re-ran independently: `npx tsc --noEmit` → clean. `npm test` → `Test Suites: 31 passed, 31 total`, `Tests: 181 passed, 181 total` (matches session baseline exactly). `npm run build` → `tsc && npm run copy`, clean.
7. Public-API/behavior-change check: `npx jest src/__tests__/candidate_profile/BaseController.test.ts src/__tests__/candidate_profile/BaseService.test.ts` → 2 suites, 10 tests, all pass, unchanged.
8. Test-mock diffs: read `git diff staging` in full for `baseFindDocument.test.ts` and `baseSoftDelete.test.ts` — both diffs are purely `model` -> `asModel(model)` at every call site plus a new `asModel` helper/comment; zero assertion or behavior changes.
9. Proportion: `git diff staging --stat -- src/` → 9 files changed, 178 insertions(+), 95 deletions(-), matching the note's claimed file list exactly (3 core files + `generalInformation.service.ts` + 5 test files). No scope creep.
10. Forbidden states scan: worker identity dirs present (`agent-hub/haven/workers/implementer`, `.../verifier`); evidence note present at the expected path (NO_EVIDENCE clear); EDIT_UNVERIFIED clear — every claim above independently re-run, not inferred; no `.ts`/`.py`/`.sh` files found under `agent-hub/haven` (CODE_IN_HAVEN clear); diagram row flipped PENDING->SEALED in this same pass, matching the real code state (DIAGRAM_DRIFT clear). Noted (out of this node's scope, pre-existing, not introduced here): the diagram file has 2 unrelated duplicate node-name rows elsewhere (`fix-candidate-password-leak` lines 60/62, `fix-refresh-token-expiry-unused` lines 61/63) — flagged for a future docs-only pass, does not affect `type-crud-core`'s own single, unique row.

## Proportion
9 files, 178+/95- — matches the implementer's own claimed diff scope exactly, independently re-verified via `git diff staging --stat -- src/`.

## Forbidden states scan
ADHOC_WORK: clear (worker identity present, node exists on diagram). NO_EVIDENCE: clear. EDIT_UNVERIFIED: clear (full independent re-run below). CODE_IN_HAVEN: clear. DIAGRAM_DRIFT: clear (flipped in this pass).

## Re-run
FULL, given this node's size and blast radius (shared generic core for all 9 CV sections). Independently reproduced: `npx tsc --noEmit` (clean), `npm test` (31/31 suites, 181/181 tests), `npm run build` (clean), targeted `npx jest BaseController.test.ts BaseService.test.ts` (2/2 suites, 10/10 tests), plus 2 original experiments not in the implementer's note: an isolated discriminated-union narrowing repro under `tsc --strict`, and a live cast-removal/restoration test of the `Model<CrudDocument>` invariance claim against the real codebase.

## Verdict
SEAL.
