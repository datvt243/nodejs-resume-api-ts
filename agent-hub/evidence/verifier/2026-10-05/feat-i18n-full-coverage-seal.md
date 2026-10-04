# 2026-10-05 — feat-i18n-full-coverage (verifier verdict)

- Worker: verifier (subagent, dispatched via Agent tool)
- Node: `feat-i18n-full-coverage`
- New PM status: SEALED

## Isolation proof
Dispatched fresh via the Agent tool as the "verifier" worker for this node, with
no prior conversation turns and no memory of the implementer's session — the
task string handed to me explicitly stated I have "NO memory of any prior
conversation about this" and must verify "independently... from scratch, by
reading real files and running real commands." I never opened the implementer's
working session; I only read its evidence note
(`evidence/implementer/2026-10-05/feat-i18n-full-coverage-plan.md`), then
independently re-derived every claim below from the actual repo state on branch
`160-i18n-for-api`: ran `git status`/`git diff --stat`/full `git diff` myself,
read `src/utils/valid.ts`, `src/utils/helper.ts`, `src/utils/i18n.ts`,
`src/locales/en.ts`/`vi.ts` in full, read the real diff of all 7 touched
`*.validate.ts` files + `joi.config.ts`, ran `npm test` and `npm run build`
myself from repo root, ran the 2 modified test files standalone
(`npx jest src/__tests__/utils/valid.test.ts src/__tests__/utils/helper.test.ts
--verbose`), and ran my own greps across `src/candidate_profile/` and
`src/candidate/candidate.service.ts` rather than trusting the note's grep
output.

## Reasoning

1. **Generic system confirmed, not a dot-path walk.** `src/utils/valid.ts`'s
   `translateJoiDetail` calls `tErrorType(detail.type, lang)` (flat
   `joiErrors[type]` lookup) + `fieldLabels.<key>` for the label, falling back
   to Joi's own rendered message if the type isn't templated. `src/utils/
   helper.ts`'s `handleError`, on `mongoose.Error.ValidationError`, special-
   cases `e?.kind === 'required'` the same way: `tErrorType('any.required',
   lang)` + `fieldLabels.<field>`. Both match the note's description exactly;
   neither walks `detail.type`/`field` as a dot path.

2. **Removed-message type coverage — zero regressions found.** Enumerated
   every Joi error `type` key used inside the ~15 removed `.messages({...})`
   blocks across `joi.config.ts` + the 7 `*.validate.ts` files myself from the
   real diff: `any.required`, `any.only`, `string.empty`, `string.min`,
   `string.max`, `string.pattern.base`, `string.email`, `number.empty`,
   `number.min`, `number.greater`, `object.base`, `array.base`. Read
   `src/locales/en.ts:100-114` and `vi.ts:100-114` directly — every one of
   these 12 types has a live, non-empty `joiErrors` entry in BOTH files. No
   removed type is uncovered.

3. **7 new `fieldLabels` entries confirmed real, in both languages, correctly
   spelled**: `slug`/`token`/`exp`/`appliedDate`/`status`/`note`/`jobLink` —
   present in `en.ts:152-158` and `vi.ts:152-158` with sensible translations
   (e.g. `exp: 'Years of experience'`/`'Số năm kinh nghiệm'`,
   `jobLink: 'Job link'`/`'Liên kết công việc'`).

4. **Spot-checked 2 fields the note's own tests don't directly exercise**,
   reasoning through the generic pipeline by hand: (a) `candidate.validate.ts`
   `birthday`/`any.required` (now bare `.required()`, no `.messages()`) →
   `fieldLabels.birthday` = `'Ngày sinh'`/`'Date of birth'` +
   `joiErrors['any.required']` = `'{{label}} là bắt buộc'`/`'{{label}} is
   required'` → resolves to `'Ngày sinh là bắt buộc'`/`'Date of birth is
   required'`, non-empty and sensible in both languages (this exact string is
   independently proven for the Mongoose path by `helper.test.ts`'s new test,
   and the Joi path uses the identical `fieldLabels`/`joiErrors` tables). (b)
   `application.validate.ts` `note`/`string.max` (now bare `.max(1000).trim()`)
   → `fieldLabels.note` = `'Ghi chú'`/`'Note'` + `joiErrors['string.max']` +
   `{{limit}}` → `'Ghi chú không được vượt quá 1000 ký tự'`/`'Note must not
   exceed 1000 characters'` — sensible, non-empty, limit correctly
   interpolated.

5. **Real test run, not trusted output.** `npm test` (repo root): one run hit
   `FAIL ... A jest worker process ... was terminated by ... SIGSEGV` on
   `auth.service.test.ts` (a worker-process crash, not an assertion failure);
   immediate re-run: `Test Suites: 35 passed, 35 total / Tests: 246 passed,
   246 total` — exact match to the note's claimed numbers, confirming the
   SIGSEGV was a transient infra flake (consistent with the pre-existing
   Puppeteer/Jest teardown warning both runs printed), not a real regression
   caused by this diff. `npm run build`: clean, `tsc && npm run copy`, no
   errors. Standalone run of the 2 modified files
   (`valid.test.ts`+`helper.test.ts`, `--verbose`): `Test Suites: 2 passed, 2
   total / Tests: 11 passed, 11 total` — every individual assertion name
   matches the note's pasted output verbatim, including the 4 new
   `formatValidateError` tests and the 1 new Mongoose-required test in both
   languages.

6. **Zero hardcoded `message:` literals in CV-section code — confirmed by my
   own grep**, not the note's: `grep -rn "message:\s*['\"]" src/
   candidate_profile/ src/candidate/candidate.service.ts` → no matches
   (exit 1).

7. **Scoping call (candidate_me/, createPDF*.ts, createDocx.ts,
   rateLimit.middleware.ts left untouched) is reasonable.** The diagram
   row's own literal scope text names specific files (`services/index.ts`,
   `BaseController.ts`, `BaseService.ts`, `candidate.service.ts`,
   `generalInformation.*`) plus the Joi/Mongoose generic systems, and ties
   "cascades across all 7 CV sections" to the per-section CRUD pattern — not
   to PDF/DOCX export or rate-limiting, which are separate subsystems with
   their own doctrine (`pdf-export-standard.md` doesn't name i18n as one of
   its 10 invariants). `doctrine/standards/initiative-scoping.md`'s lesson is
   about measured-by-count initiatives silently undercounting their own
   stated scope via grep-sampling instead of exhaustive enumeration — this
   node's scope was named explicitly by file, not estimated by sampling, and
   the implementer's own grep WAS exhaustive (`src/candidate_profile/` +
   `src/candidate/`, confirmed by my independent re-grep in point 6). Flagging
   the 4 other files explicitly in "Noticed, not done" rather than silently
   dropping them satisfies that doctrine's actual requirement. Agree this is
   SmallestDiff, not scope-dodging.

8. **Diff is exactly the 12 files claimed — confirmed via `git status`/`git
   diff --stat` myself**: `src/config/joi.config.ts`,
   `src/auth/auth.validate.ts`, `src/candidate/candidate.validate.ts`,
   `src/candidate_profile/{application,awards,education,general_information,
   profile}/*.validate.ts`, `src/locales/{en,vi}.ts`,
   `src/__tests__/utils/{valid,helper}.test.ts` — 128 insertions / 185
   deletions, matching the note. Nothing staged, no stray files, only the new
   evidence-note directory untracked besides these. No forbidden state hit:
   not `ADHOC_WORK` (node exists on the diagram), not `NO_EVIDENCE` (note
   present + this verdict), not `EDIT_UNVERIFIED` (every claim independently
   re-run), not `CODE_IN_HAVEN` (no code written into `haven/`), not
   `DIAGRAM_DRIFT` (PM status updated below to match).

## Re-run
`full` — re-ran the entire `npm test` and `npm run build` from the existing
working tree (not an isolated worktree/`npm ci`) myself, plus the 2 modified
test files standalone, rather than relying on the note's pasted output. Reason:
the task explicitly directed independent re-execution of the exact test/build
commands rather than the audit-only default in `recipes/verify_seal.md`'s
"Re-run scope" section.
