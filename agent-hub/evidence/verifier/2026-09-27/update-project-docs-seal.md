# 2026-09-27 - update-project-docs (verdict)

- Worker: verifier (subagent, dispatched via Agent tool)
- Node: `update-project-docs` (`haven/diagrams/dev-loop.prime-mermaid.md`)
- New PM status: SEALED

## Isolation proof

This pass was spawned as a fresh Agent-tool subagent invocation with the
task "run `verify_seal` on evidence note
`evidence/implementer/2026-09-27/update-project-docs-plan.md` for node
`update-project-docs`" as its entire starting context — no conversation
history, no memory of the implementer session that wrote the README.md/
CLAUDE.md diffs or the "update readme" / "update CLAUDE.md too" turns
referenced in that note's `## Seal gate`. Everything I know about this
diff (its file list, its specific claims) I re-derived by reading the
evidence note and the real repo files fresh in this pass — I did not
write any of the reviewed content in this session. Confirmed via `git
status --short`/`git diff` at the start of this pass, before writing
anything, that only `README.md`, `CLAUDE.md`, and this diagram's own
`update-project-docs` row (added PENDING by the implementer) were
modified in the working tree.

## Reasoning

Per criterion in the note's `## Acceptance` table:

1. **README.md version matches `package.json`** — confirmed:
   `package.json` `"version": "1.7.0"`; `README.md` line 5
   `**Version**: 1.7.0`.
2. **CLAUDE.md version matches `package.json`** — confirmed: `CLAUDE.md`
   line 5 `**Version**: 1.7.0`.
3. **Every route file under `src/routers/api/v1/` represented in both
   docs' endpoint tables** — `ls src/routers/api/v1/` gives 11 entries
   (application, auth, award, candidate, certificate, education,
   experience, generalInformation, index, profile, project, reference).
   All corresponding routes appear in CLAUDE.md's Auth/Candidate/CV
   Sections+Application+Profile/Other tables and README.md's mirrored
   tables. `routers/index.ts` (`/api/me/:email`, `/api/me/:email/visit`)
   and `v1/index.ts` (`/download-pdf`) both read directly and confirmed
   present.
4. **Every model in `src/models/index.ts` listed in CLAUDE.md's Models
   table** — read `src/models/index.ts` directly: exports Application,
   Award, Candidate, Certificate, Education, Experience,
   generalInformation, Profile, Project, Reference, Visit (11). All 11
   present as rows in CLAUDE.md's Models table.
5. **`npm test` still passes** — independently re-ran (not just trusted
   the note's paste): `Test Suites: 24 passed, 24 total / Tests: 136
   passed, 136 total`, matching the note's claimed output exactly.
6. **`npm run build` still passes** — independently re-ran: `tsc && npm
   run copy` completed with no `tsc` errors, `cp -R ./src/views
   ./src/public ./dist/` ran to completion — matches the note.

Additional cross-checks beyond the note's own table (per recipe step 6,
sampling specific factual claims against the real tree, not just the
listed criteria):

- `server.ts`'s actual middleware registration order (`grep -n "app.use\|
  app.get\|app.set" src/server.ts`) — requestLogger → cookieParser →
  languageMiddleware → session → cors → bodyParser(urlencoded+json) →
  `/health` → swagger → rateLimit → static → router → errorsMiddleware —
  matches CLAUDE.md's documented 12-step order exactly, including the
  new cookie-parser/language-middleware/swagger-exemption steps the note
  claims were added.
- `src/middlewares/` (9 files) and `src/utils/` (16 files) directory
  listings match CLAUDE.md's Project Structure tree file-for-file,
  including the new `csrf.middleware.ts`, `language.middleware.ts`,
  `uploadLinkedInExport.middleware.ts`, `sessionRevocation.ts`,
  `authCookies.ts`, `csrf.ts`, `slug.ts`, `i18n.ts`,
  `emailVerification.ts`, `passwordReset.ts`.
- `src/errors/AppError.ts` — grepped directly: `NO_TOKEN`,
  `INSUFFICIENT_PERMISSIONS`, `CSRF_TOKEN_INVALID` all real `ErrorCode`
  members, matching CLAUDE.md's updated Error Hierarchy block.
- `src/middlewares/verifyToken.middleware.ts` — read directly: contains
  the CSRF check (`ErrorCode.CSRF_TOKEN_INVALID`) and
  `req.body.candidateId = _id` forced-ownership line, matching both
  docs' Security-section claims.
- Full `src/__tests__/**` tree (`find ... -name "*.test.ts"` plus the
  non-`.test.ts` `database/mongo.db.ts`) — 23 files total, matching
  CLAUDE.md's Testing table row-for-row (including the previously-stale
  entries the note claimed to fix: `candidate/parseLinkedInExport.
  service.test.ts`, `candidate_profile/profile.service.test.ts`,
  `middlewares/csrf.test.ts`, `utils/csrf.test.ts`,
  `utils/authCookies.test.ts`, `services/createDocx.test.ts`, etc. — none
  of the old flat/stale list survived).
- Sampled README.md's dependency version table (`express`, `mongoose`,
  `redis`, `jsonwebtoken`, `bcrypt`, `express-rate-limit`,
  `cookie-parser`, `geoip-lite`, `joi`, `docx`, `multer`, `adm-zip`,
  `csv-parse`, `winston`, `swagger-jsdoc`, `swagger-ui-express`) against
  `package.json` directly — every version cited matches exactly (e.g.
  `express@^4.19.2`, `mongoose@^8.4.0`, `docx@^9.7.1`).
- `git status --short` (before any edit) showed only `CLAUDE.md`,
  `README.md` modified plus this diagram file (the implementer's own
  PENDING-row addition, expected diagram-first bookkeeping) and the
  untracked evidence dir — no `src/` file touched. Proportion matches: a
  docs-only node with a docs-only diff.

## Forbidden states scan

- `ADHOC_WORK` — no. Node existed (added PENDING by implementer before
  this verdict) on the diagram before I graded it.
- `NO_EVIDENCE` — no. Evidence note present at the cited path.
- `EDIT_UNVERIFIED` — no. Both commands independently re-run in this
  pass and output read back verbatim, not just trusted from the note.
- `CODE_IN_HAVEN` — no. Only `.md` files touched in `agent-hub/`
  (diagram row + this note).
- `DIAGRAM_DRIFT` — no, resolved by this verdict: PM status row updated
  PENDING → SEALED in place, same row, not reordered.

## Seal gate

Note's account (diff shown to the operator interactively via `Edit`/
`Write` across the "update readme" / "update CLAUDE.md too" turns, no
commit/push yet) is acceptable for this node: docs-only, not
outward-facing (no commit/push has happened), not a release gate. The
real seal gate for the outward-facing action (commit/push) remains
ahead, gated behind `/ship` after this SEAL, per the hub's normal flow.

## Missing

None — no acceptance criterion lacked evidence.

## Re-run

**full** — independently re-ran both `npm test` (reproduced 24/24
suites, 136/136 tests, exact match) and `npm run build` (clean) myself,
rather than defaulting to audit-only. Reasoning: this is the hub's first
fully docs-only node (zero `src/` files in the diff) sealed under this
recipe; while the recipe's default for a non-outward-facing, non-release
docs change is audit-only, a near-zero-cost independent re-run removed
all doubt about whether the pasted output was accurate, at negligible
cost (test suite ~7-12s, build ~seconds). Also independently
cross-checked a broad sample of the note's specific factual claims
(middleware order, directory listings, error codes, dependency
versions, full test-file tree) against the real files rather than
trusting the note's prose alone.
