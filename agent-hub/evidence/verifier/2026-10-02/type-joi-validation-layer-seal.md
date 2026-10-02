# 2026-10-02 — type-joi-validation-layer (verifier note)

- Worker: verifier (independent subagent)
- Node: `type-joi-validation-layer`
- New PM status: PENDING → SEALED
- GitHub issue: #184, part of tracking issue #177

## Isolation proof

Spawned via the `Agent` tool as a fresh subagent with no prior memory, given
this exact task string (abridged — full text included the numbered
checklist and contract terms):

> "You are an independent verifier subagent... Run `verify_seal` for
> evidence note: agent-hub/evidence/implementer/2026-10-02/type-joi-validation-layer-plan.md
> ... CRITICAL FIRST CHECK: grep -n 'type-joi-validation-layer'
> agent-hub/haven/diagrams/dev-loop.prime-mermaid.md — confirm the row
> exists, exactly once, PENDING. ... Independently verify BOTH deletions
> are genuinely safe, don't just trust the note's grep commands — re-run
> them yourself from scratch, on the current git history..."

All findings below were independently re-derived by running real commands
in this session; none were copied from the implementer note's prose.

## Reasoning

1. **Critical first check**: `grep -n "type-joi-validation-layer"
   agent-hub/haven/diagrams/dev-loop.prime-mermaid.md` → row existed exactly
   once, status `PENDING`, before any edit.
2. Read the full implementer note and fetched real acceptance criteria via
   `gh issue view 184 --json body -q '.body'`: zero `any` in the named
   files, `npm test`/`npm run build` clean, no behavior change — matches
   what was delivered.
3. **`settingJoiValidate` deletion — independently confirmed dead and
   broken**:
   - `grep -rn "settingJoiValidate" src --include="*.ts"` → zero hits in
     the current working tree.
   - Read the old implementation directly via `git show
     staging:src/config/joi.config.ts` (not the note's paraphrase). The
     bug is real and worse than claimed: `_joi: any = Joi` aliases the Joi
     *namespace* import itself, and the chain `_joi.pattern(pattern)`,
     `_joi.min(min)`, `_joi.max(max)`, `_joi.required()`,
     `_joi.trim().strict()`, `_joi.label(label)`, `_joi.messages(_messages)`
     calls methods that don't exist on the namespace object (`.trim`,
     `.strict`, `.label`, `.messages` are Joi *schema* methods, not
     namespace-level exports) — this function would throw a `TypeError` at
     runtime if ever invoked, not merely fail to compose a schema silently.
     Confirms the function was broken pre-existing dead code.
4. **`src/plugins/joi/index.ts` deletion — independently confirmed dead**:
   - `grep -rn "renderJoi\|JoiSchemaTypesConst\|JoiSchemaTypes\b\|plugins/joi\|plugins\.joi" src --include="*.ts"` → zero hits.
   - Went further than the note: ran `git grep` for the same symbols across
     every commit in `git rev-list --all` (271 commits). All ~15 hits are
     from ancient commits (ancestors going back before `178-eslint-typescript`)
     referencing a `src/api/v1/auth/vaidations/schemaAuthLogin.ts` /
     `schemaAuthRegister.ts` path. Confirmed via `git show staging:...` and
     `git show main:...` that this path does not exist in either branch's
     current tree — dead history under an old directory layout, not a live
     caller on any branch that currently exists (`git branch --all --contains
     <old-commit>` lists only the old commit's own lineage, same as every
     branch in this repo since it's linear history — the path itself is
     gone from HEAD of every branch checked).
   - `ls src/plugins` → directory gone; `git show HEAD:src/plugins/joi/index.ts`
     vs working tree confirmed this is an uncommitted-but-real working-tree
     deletion (`git status --short` shows `D src/plugins/joi/index.ts`).
5. Read `src/config/joi.config.ts`, `src/utils/valid.ts`,
   `src/errors/AppError.ts` in full:
   - `getObject(fields: Joi.SchemaMap)` — real callers confirmed:
     `candidate.validate.ts:11,23`, `generalInformation.validate.ts:51,56`.
   - `node_modules/joi/lib/index.d.ts:682` (`ValidationError`), `:704`
     (`ValidationErrorItem`), `:831` (`SchemaMap`) — all real Joi-exported
     types, not invented.
   - `validateModel(model: { validate: (doc: unknown) => Promise<void> }, ...)`
     — only caller is `candidate.service.ts:74`
     (`validateModel(MODEL, value)`, `MODEL = MODELS.Candidate`). Checked
     `node_modules/mongoose/types/models.d.ts:612`:
     `validate(obj: any): Promise<void>` is a real static Mongoose `Model`
     method — the structural interface matches exactly.
   - `AppErrorDetails = string | string[] | Record<string, string> | null | undefined`
     spot-checked against 2 real call sites in `utils/helper.ts`:
     `new BadRequestError({ errors: err.message })` (CastError `.message`,
     a `string` — line ~104) and `new ValidationError({ errors: details })`
     (`details = Object.entries(...).map(...)` returning `string[]` — line
     ~131). Both fit the union.
   - `grep -n "\bany\b" src/errors/AppError.ts` → zero hits; all 23
     original `any` sites gone.
6. `grep -n "\bany\b" src/config/joi.config.ts` → 12 hits, all
   `'any.required'` Joi string-literal message keys (confirmed false
   positive, same class as `type-auth-module`/#182 this session).
   `grep -n "\bany\b" src/utils/valid.ts` → zero hits.
7. Full re-run (warranted by the 2 deletions):
   - `npx tsc --noEmit` → clean, 0 errors.
   - `npm test` → `Test Suites: 31 passed, 31 total`, `Tests: 181 passed,
     181 total` — matches session baseline exactly.
   - `npm run build` → clean (`tsc && cp -R ./src/views ./src/public ./dist/`).
8. Proportion: `git diff staging --stat -- src/` →
   `src/config/joi.config.ts | 46 +-----`, `src/errors/AppError.ts | 55
   ++++--`, `src/plugins/joi/index.ts | 121 -----` (deleted),
   `src/utils/valid.ts | 24 +++-----`, `4 files changed, 45 insertions(+),
   201 deletions(-)` — exactly matches the note's claimed stat, no scope
   creep. `utils/helper.ts` confirmed untouched (correctly deferred to
   `type-pdf-docx-export`/#185).
9. Forbidden states scan: `git status --short` → only the 4 claimed `src/`
   files + the diagram row + the new evidence-note directory. No
   `ADHOC_WORK` (real node + evidence note exist), no `NO_EVIDENCE`, no
   `EDIT_UNVERIFIED` (all commands actually re-run above, not just
   trusted), no `CODE_IN_HAVEN`, no `DIAGRAM_DRIFT` (row updated in this
   pass). Both deletions independently, verifiably dead per checks 3–4 —
   not just asserted.

## Verdict: SEAL

## Proportion

4 files changed in `src/` (3 modified, 1 deleted), matching the note
exactly. Diagram row updated in place, no reordering.

## Forbidden states scan

Clean — see point 9 above.

## Re-run

Full: `npx tsc --noEmit` (clean), `npm test` (31/31 suites, 181/181
tests), `npm run build` (clean), plus independent `git grep` across all
271 commits in repo history for both deleted symbols' names.
