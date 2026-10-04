# 2026-10-05 — feat-i18n-full-coverage

- Worker: implementer
- Version: 0.1.0
- Node: `feat-i18n-full-coverage` (`haven/diagrams/dev-loop.prime-mermaid.md`), PENDING -> this note
- Task (verbatim, via `/todo #160`): "i18n for API messages — full coverage: Joi, Mongoose, CV sections (phase 2/2)" — GitHub issue #160, branch `160-i18n-for-api`

## Hub bytes before
177534 (measured post-investigation, not strictly before any read — see "Noticed, not done" for why this session's `pick_next` ran unusually: a concurrent terminal session was discovered mid-flight operating on the same working directory on unrelated issues #224/#225; this implementer waited for it to go quiet via a background poll before touching anything, then proceeded with the normal `pick_next`/`implement` flow for this node only).

## Finding: this node is mostly already live (backfill, same pattern as `feat-i18n-api-messages-auth`/#159)
Independently reading the real code (not trusting the diagram row's own prose) showed the 3 scope items were already functionally complete:
1. `utils/valid.ts`'s `translateJoiDetail` already translates every Joi error by `detail.type` (via `tErrorType`, a flat lookup — the exact dot-pitfall-safe function the issue describes) + `fieldLabels`, for every schema, already live.
2. `utils/helper.ts`'s `handleError` already does the same for Mongoose `required` errors (`e?.kind === 'required'` branch, `tErrorType('any.required', lang)`).
3. `services/index.ts`, `BaseController.ts`, `BaseService.ts`, `candidate.service.ts`, `generalInformation.{controller,service}.ts`, and every other CV-section controller/service (education/experience/award/certificate/project/reference/application/profile) were confirmed via `grep -rn "message:\s*['\"]"` across `src/candidate_profile/` and `src/candidate/` to contain **zero** hardcoded message strings — everything already routes through `t(key, lang)`.
4. The regression test for the dot-pitfall itself already exists: `src/__tests__/utils/i18n.test.ts` (written for #159) directly asserts `tErrorType('any.required', ...)` isn't misparsed as 3 nested levels.

## Real remaining gap found
The generic system (`tErrorType`) already overrides `detail.message` for every error `type` currently used anywhere in the codebase (`any.required`, `any.only`, `string.empty`, `string.min`, `string.max`, `string.pattern.base`, `string.email`, `number.min`, `number.empty`, `number.greater`, `object.base`, `array.base` — all confirmed present in `locales/{vi,en}.ts`'s `joiErrors`). That means every hardcoded `.messages({...})` call still sitting in the Joi schemas was **already dead code** — `translateJoiDetail` never reaches `detail.message` for any of them — but the issue's own acceptance criterion literally says "replacing hardcoded `.messages()` per schema," and they hadn't actually been removed. Left in place, they're misleading (a future reader could believe they're live) and directly contradict the issue's own stated scope.

Also found: `utils/valid.ts`'s own test (`valid.test.ts`) and `utils/helper.ts`'s own test (`helper.test.ts`) never actually exercised the real translated output of either pipeline end-to-end in both languages — the Mongoose `required` path in particular (scope item 2) had zero test coverage of its i18n behavior.

## Diff
| File | Why |
|---|---|
| `src/config/joi.config.ts` | Removed 15 dead `.messages({...})` blocks (email/password/firstName/lastName/fullName/company/position/phone/introduction/startDate/endDate/slug/description/descriptionOptional/_stringDefault) — every error `type` they covered already has a live `joiErrors` template. Kept every `.label(...)` call (still used as a fallback label). |
| `src/candidate/candidate.validate.ts` | Removed dead `.messages()` on marital/gender/birthday/address |
| `src/auth/auth.validate.ts` | Removed dead `.messages()` on password/repassword (x2)/token |
| `src/candidate_profile/education/education.validate.ts` | Removed dead `.messages()` on school/major |
| `src/candidate_profile/profile/profile.validate.ts` | Removed dead `.messages()` on name |
| `src/candidate_profile/general_information/generalInformation.validate.ts` | Removed dead `.messages()` on professionalSkills items (name/exp)/wrapper, socialMedia, salaryDesired, yearsOfExperience |
| `src/candidate_profile/awards/award.validate.ts` | Removed dead `.messages()` on issueDate |
| `src/candidate_profile/application/application.validate.ts` | Removed dead `.messages()` on appliedDate/status/note/jobLink |
| `src/locales/en.ts`, `src/locales/vi.ts` | Added 7 `fieldLabels` entries (`slug`, `token`, `exp`, `appliedDate`, `status`, `note`, `jobLink`) that the removed hardcoded messages used to cover with a custom field name — without these, those fields would fall back to the raw (English) field key in both languages instead of a translated label. Zero other `fieldLabels`/`joiErrors` gaps found (every other field touched already had an entry). |
| `src/__tests__/utils/valid.test.ts` | Added 4 new tests proving the real `formatValidateError`/`translateJoiDetail` pipeline resolves `any.required` and `string.min` correctly in both `vi`/`en` via `education.validate.ts`'s real schema (whose hardcoded `.messages()` was just removed), plus the no-fieldLabels-entry fallback case. The pre-existing `jest.mock('@/utils', ...)` in this file was a no-op (`formatValidateError` is called as a local function inside `utils/valid.ts`, never imported from `@/utils` by that call site) — left it as-is on the pre-existing 4 tests (unrelated to this change, not touched) and added the new tests without any mock, since they need the real pipeline. |
| `src/__tests__/utils/helper.test.ts` | Added 1 new test constructing a real `mongoose.Error.ValidationError`/`ValidatorError({type:'required', path:'birthday'})` and asserting `handleError` resolves it to `'Ngày sinh là bắt buộc'` (vi) / `'Date of birth is required'` (en) — the literal scope-item-2 case, previously untested. |

Confirmed via `git diff --stat`: 12 files, 128 insertions / 185 deletions — net code reduction, no new production logic (pure dead-code removal + 2 missing-coverage gaps closed + 7 locale entries).

## Noticed, not done
- `src/candidate_me/ats-check.ts:97` (`'ATS self-check completed'`), `src/candidate_me/index.ts:225,270`, `src/services/createPDF.ts:87`, `src/services/createDocx.ts:226`, `src/services/createPDF.ats.ts:478`, `src/middlewares/rateLimit.middleware.ts:108,137` all still have hardcoded (non-i18n) message strings. **Deliberately not touched** — none of these files are named in issue #160's scope (`services/index.ts`, `BaseController.ts`, `BaseService.ts`, `candidate.service.ts`, `generalInformation.*`, plus the Joi/Mongoose generic systems), matching the precedent set by `feat-i18n-api-messages-auth`/#159 of sticking to the named scope rather than silently expanding it (see `doctrine/standards/initiative-scoping.md`'s #177 lesson). Worth a follow-up issue if wanted.
- `src/config/joi.config.ts`'s custom `Joi.extend` type (`objectIdValidator`, lines ~21-31) has its own built-in `messages: {'objectId.base': '...'}` default — also now-dead (the generic `joiErrors.objectId.base` template already overrides it), but it's a type-level default rather than a per-schema override, a different and lower-value/higher-risk edit; left untouched for SmallestDiff.

## Command
```
npm test
```
Run from `/Users/_david/Workspace/Project/resume/resume-nodejs-api`.

## Output (verbatim, full suite)
```
Test Suites: 35 passed, 35 total
Tests:       246 passed, 246 total
Snapshots:   0 total
Time:        7.521 s, estimated 10 s
Ran all test suites.
```
(The "A worker process has failed to exit gracefully..." warning is the pre-existing Puppeteer/Jest teardown quirk from the ATS PDF integration test, unrelated to this diff — present before this change too.)

Also independently re-ran just the 2 modified test files in isolation (`npx jest src/__tests__/utils/valid.test.ts src/__tests__/utils/helper.test.ts --verbose`):
```
PASS src/__tests__/utils/valid.test.ts
  validateSchema
    ✓ ✅ Dữ liệu hợp lệ - Trả về isValidated = true (2 ms)
    ✓ ❌ Dữ liệu không hợp lệ - Trả về lỗi (1 ms)
    ✓ ❌ Thiếu schema - Trả về lỗi "Schema không hợp lệ"
    ✓ ✅ Truyền `item = {}` nhưng schema không yêu cầu field - Vẫn hợp lệ
  formatValidateError — generic i18n templates (issue #160)
    ✓ a missing required field resolves via tErrorType (not a dot-path walk) in vi
    ✓ the same case in en uses the English field label + template
    ✓ a string.min violation interpolates both the field label and the limit
    ✓ a field with no fieldLabels entry falls back to the raw field name

PASS src/__tests__/utils/helper.test.ts
  handleError
    ✓ converts a Mongo duplicate-key error on `slug` into a ConflictError (issue #120) (1 ms)
    ✓ still converts a duplicate-key error on `email` the same way (regression check)
    ✓ translates a Mongoose "required" validation error via tErrorType, in vi and en (issue #160)

Test Suites: 2 passed, 2 total
Tests:       11 passed, 11 total
```

`npm run build` also re-run, clean (`tsc && npm run copy`, no errors).

## Acceptance
| Criterion (from issue #160) | Evidence |
|---|---|
| Joi validation errors resolve through i18n in vi/en | Already live (`utils/valid.ts`'s `translateJoiDetail`); newly proven end-to-end (not just by inspection) by `valid.test.ts`'s 4 new tests, all passing |
| Mongoose `required` errors resolve through i18n in vi/en | Already live (`utils/helper.ts`'s `handleError`); newly proven end-to-end by `helper.test.ts`'s new test, passing, both languages asserted |
| Every CV section's success/error messages are locale-aware | Confirmed via exhaustive `grep -rn "message:\s*['\"]"` across `src/candidate_profile/` + `src/candidate/` — zero hardcoded hits outside already-i18n'd code; all 9 CV sections (education/experience/award/certificate/project/reference/generalInformation/application/profile) route through `t()` |
| Regression test for the Joi dot-pitfall | Pre-existing at the unit level (`i18n.test.ts`, from #159) — this session additionally closed the integration-level gap (`valid.test.ts`'s new tests exercise the real `formatValidateError` pipeline, not just `tErrorType` in isolation) |
| No regression in existing tests | `npm test` after the diff: 35/35 suites, 246/246 tests, all passing (every pre-existing test file ran unmodified except the 2 named above, and both of those still pass their original assertions unchanged) — no separate pre-diff run was taken as a baseline this session, but a `.messages()` removal only matters if some pre-existing test asserted on the old hardcoded string; grep-confirmed no test file asserts against any of the removed Vietnamese strings (only `helper.test.ts`'s pre-existing 2 tests and `valid.test.ts`'s pre-existing 4 tests touch these code paths, and all 6 still pass) |

## Seal gate
None yet — no outward-facing action taken (no commit/push). Diff shown above for operator review before any commit.
