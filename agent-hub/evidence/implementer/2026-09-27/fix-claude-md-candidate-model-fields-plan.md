# 2026-09-27 - fix-claude-md-candidate-model-fields

- Worker: implementer
- Version: 0.1.0
- Node: `fix-claude-md-candidate-model-fields` (`haven/diagrams/dev-loop.prime-mermaid.md`)
- Task (verbatim): "fix CLAUDE.md's Candidate model row — missing cvFile/isPublic/emailVerified fields found while updating the wiki", consolidated by `/todo` into GitHub issue #148

## Hub bytes before: 84891

## Diff

| File | Why |
|---|---|
| `CLAUDE.md` | Models table's `Candidate` row was missing 3 real fields present on `src/models/candidate.model.ts`: `cvFile` ({ originalName, uploadedAt }), `isPublic` (default `true`), `emailVerified` (default `false`). This is a follow-up to `update-project-docs`/#146, which synced the rest of CLAUDE.md/README.md to v1.7.0 but missed these 3 fields on the Candidate row specifically (the gap was found while writing the GitHub wiki's Data-Models page, which did capture all 3 — see `evidence/implementer/2026-09-27` from the wiki-sync work for context, not itself part of this repo's evidence trail since the wiki is a separate git repo). |

Read `src/models/candidate.model.ts` in full before editing to confirm the
exact field names/defaults/semantics (`cvFile.originalName`/`uploadedAt`,
`isPublic` default `true`, `emailVerified` default `false`) rather than
trusting the earlier wiki-page text from memory.

## Command

```
npm test
```
(`/Users/_david/Workspace/Project/resume/resume-nodejs-api`, per
`doctrine/MEMORY.md`) — plus `npm run build` for typecheck. Both run even
though this is a one-line docs change, per `TestsBeforeDone`.

## Output

`npm test` (tail, verbatim):
```
Test Suites: 24 passed, 24 total
Tests:       136 passed, 136 total
Snapshots:   0 total
Time:        5.422 s, estimated 7 s
Ran all test suites.
```

`npm run build` (verbatim, full output):
```
> resume-nodejs-api@1.7.0 build
> tsc && npm run copy


> resume-nodejs-api@1.7.0 copy
> cp -R ./src/views ./src/public ./dist/
```
No `tsc` errors; `copy` step ran to completion.

## Acceptance

| Criterion | Evidence |
|---|---|
| `CLAUDE.md`'s Candidate row lists `cvFile`, `isPublic`, `emailVerified` matching `src/models/candidate.model.ts`'s real field names/defaults | `candidate.model.ts` schema block: `cvFile: { originalName, uploadedAt }`, `isPublic: { type: Boolean, default: true }`, `emailVerified: { type: Boolean, default: false }` — all 3 now present in `CLAUDE.md`'s row, with the same default values and the same behavioral notes (`isPublic` gates the public profile, `emailVerified` doesn't gate login) already verified true in code (`candidate_me/index.ts:48` reads `isPublic === false` to short-circuit; `emailVerified` is set/read nowhere else in the auth/login path) |
| No other row/section touched | `git diff` scope is exactly the single Candidate table row |
| `npm test` still passes | `Tests: 136 passed, 136 total` above |
| `npm run build` still passes | clean `tsc && npm run copy` above |

## Noticed, not done

- README.md's Models section doesn't have a per-field table at all (it
  never did, even before `update-project-docs`) — no comparable gap to
  fix there.
- Did not re-audit the rest of CLAUDE.md's Models table (Application/
  Profile/Visit/other CV sections) against their models for similar
  omissions — out of scope for this single-row fix; flagged as a
  possible follow-up if a broader audit is wanted.

## Seal gate

The single-line diff was shown to the operator (via `Edit` tool output)
in the conversation turn immediately preceding this `/todo` run, in
response to the operator's explicit "yes fix CLAUDE.md too". No further
outward-facing action (commit/push) has happened yet — gated behind
`/ship` after SEAL.
