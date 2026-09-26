# 2026-09-27 - update-project-docs

- Worker: implementer
- Version: 0.1.0
- Node: `update-project-docs` (`haven/diagrams/dev-loop.prime-mermaid.md`)
- Task (verbatim): "update readme" then "update CLAUDE.md too" — later
  consolidated by `/todo` into GitHub issue #146: "Update README.md and
  CLAUDE.md to match current codebase state (v1.7.0)"

## Hub bytes before: 82873

## Diff

| File | Why |
|---|---|
| `README.md` | Version bumped 1.0.0 → 1.7.0; added Features/Tech-Stack/Project-Structure/Endpoints/Env entries for every feature merged since 1.0.0 that the file never mentioned: Application tracker (#132), CV Profiles multi-version (#133), LinkedIn export parsing (#141), httpOnly cookie JWT auth + CSRF (#119/#134), soft-delete/restore (#121), vanity slug public profile (#120), visit tracking, i18n vi/en, PDF export's json/docx formats, `CORS_ORIGIN` env var. |
| `CLAUDE.md` (repo root, project-instructions doc — distinct from `agent-hub/CLAUDE.md`) | Same drift, deeper technical detail: Express middleware order (added cookie-parser, language middleware, swagger rate-limit exemption), full API endpoint tables (auth logout-all/forgot-reset-password/verify-email, candidate upload-cv/cv-file/parse-linkedin-export/visits, application+profile CRUD, restore endpoints), Models table (Application/Profile/Visit + `deletedAt` soft-delete + localized-text fields), Service Layer section (soft-delete/restore, `BaseService.ts` factory), Error hierarchy (`NO_TOKEN`/`INSUFFICIENT_PERMISSIONS`/`CSRF_TOKEN_INVALID`), Security section (session-revocation, CSRF, IDOR note, CORS allow-list, i18n), full `__tests__/` file list (was stale — listed files that no longer exist, e.g. a flat `middlewares/verifyToken.test.ts` list without the newer csrf/authCookies/service suites). |

Both files were read in full before editing (via `Read`), and every claim
was checked against the real `src/` tree before being written — actual
route files (`src/routers/api/v1/*.ts`), models (`src/models/*.ts`),
middlewares (`src/middlewares/*.ts`), `src/errors/AppError.ts`,
`src/services/index.ts`, `src/candidate_profile/BaseController.ts` /
`BaseService.ts`, `src/utils/*.ts`, `package.json` (dependencies +
version), `.env.example`, and `src/__tests__/**` were all grepped/read
directly — nothing in the new doc text is inferred from memory or from
the old (stale) doc content.

## Command

```
npm test
```
(`/Users/_david/Workspace/Project/resume/resume-nodejs-api`, per
`doctrine/MEMORY.md`) — plus `npm run build` for typecheck (same file).
Both run even though this is a docs-only diff (no `src/` file touched),
per `TestsBeforeDone` — a docs change must not be assumed harmless.

## Output

`npm test` (tail, verbatim):
```
Test Suites: 24 passed, 24 total
Tests:       136 passed, 136 total
Snapshots:   0 total
Time:        12.557 s
Ran all test suites.
```

`npm run build` (verbatim, full output):
```
> resume-nodejs-api@1.7.0 build
> tsc && npm run copy


> resume-nodejs-api@1.7.0 copy
> cp -R ./src/views ./src/public ./dist/
```
No `tsc` errors printed; `copy` step ran to completion. Confirms the
docs-only diff did not regress typecheck or the existing test suite —
expected, since neither `README.md` nor `CLAUDE.md` is imported/compiled
by anything.

## Acceptance

| Criterion | Evidence |
|---|---|
| README.md version matches `package.json` | `package.json` `"version": "1.7.0"`; `README.md` line 5 now `**Version**: 1.7.0` |
| CLAUDE.md version matches `package.json` | `CLAUDE.md` line 7 now `**Version**: 1.7.0` |
| Every route file under `src/routers/api/v1/` is represented in both docs' endpoint tables | Verified against `application.route.ts`, `profile.route.ts`, `candidate.route.ts`, `auth.route.ts`, `v1/index.ts` (download-pdf), `routers/index.ts` (`/api/me/:email`, `/api/me/:email/visit`) |
| Every model in `src/models/index.ts` is listed in CLAUDE.md's Models table | `Application, Award, Candidate, Certificate, Education, Experience, generalInformation, Profile, Project, Reference, Visit` — all 11 present in the updated table |
| `npm test` still passes (docs-only diff must not regress) | `Tests: 136 passed, 136 total` (`## Output` above) |
| `npm run build` still passes | `tsc && npm run copy` completed with no errors (`## Output` above) |

## Noticed, not done

- `TODO.md` (repo root) was not inspected/updated — out of scope for this
  task (README.md + CLAUDE.md only, per the issue).
- `agent-hub/doctrine/domains/PROJECT.md` may itself reference stale
  file/feature state independent of this task — not audited here, own
  node if it turns out to need it.

## Seal gate

The `README.md` and `CLAUDE.md` diffs were shown to the operator
interactively (via `Edit`/`Write` tool calls) across the two conversation
turns "update readme" and "update CLAUDE.md too" that preceded this
`/todo` run — the operator saw both full rewrites, then explicitly asked
to `/ship --merge` them (twice), which is what surfaced the missing
`SealedOnly` node this note now backfills. No further src/ outward-facing
action (commit/push) has happened yet at the time this note is written —
that remains gated behind `/ship` after SEAL, per this hub's normal flow.
