> If any other doc contradicts this file on a path or command, THIS FILE
> WINS. One home per fact — a command living in two files will be wrong in
> one of them.

## What this is
- Hub path (absolute): `/Users/_david/Workspace/Project/resume/resume-nodejs-api/agent-hub`
- Code repo path (absolute): `/Users/_david/Workspace/Project/resume/resume-nodejs-api`
- Hub ↔ repo relationship: only touch the repo through a worker, with an
  actual test run and an evidence note — never ad-hoc.

## The exact commands
> COPY these — never type from memory. A command remembered drifts, and a
> drifted command proves the wrong thing.

| Purpose | Command | Run from |
|---|---|---|
| Test | `npm test` | `/Users/_david/Workspace/Project/resume/resume-nodejs-api` |
| Test one file | `npx jest <path/to/file.test.ts>` | `/Users/_david/Workspace/Project/resume/resume-nodejs-api` |
| Build | `npm run build` | `/Users/_david/Workspace/Project/resume/resume-nodejs-api` |
| Lint/typecheck | `n/a` — no `lint` script in `package.json` (checked 2026-09-18, still true as of 2026-08-20); typecheck happens implicitly inside `npm run build` (`tsc && npm run copy`) | `/Users/_david/Workspace/Project/resume/resume-nodejs-api` |
| Run locally | `npm run dev` | `/Users/_david/Workspace/Project/resume/resume-nodejs-api` |

`npm test` = `jest --passWithNoTests` (see `package.json`). No `lint`
script in `package.json` despite `.eslintrc.cjs` existing — don't assume
`npm run lint` is real, it isn't (re-checked 2026-09-18).

**`npx tsc --noEmit` does NOT cover everything `npm test` type-checks.**
[added 2026-10-02, `enable-no-property-access-index-signature`/#187] `tsc`
only checks files matched by `tsconfig.json`'s `include` (`src/**/*.ts`) —
but `jest.config.ts`'s `setupFiles: ['<rootDir>/jest.setup.ts']` means
`ts-jest` also type-checks `jest.setup.ts`, a root-level file OUTSIDE
`src/`, under the same compiler options. A new strict flag can pass a
clean `tsc --noEmit` and then fail every single test suite at once
(`jest.setup.ts` errors abort the whole run) because that one file was
never in `tsc`'s own scope. When adding/changing a compiler flag, always
run the real `npm test` too — don't stop at a clean `tsc --noEmit` and
assume test files (or their setup files) are covered.

## Stack
| Thing | Value |
|---|---|
| Language/runtime | Node.js `>=20.19.0 <23.0.0` + TypeScript 5.5.4 (strict, CommonJS) |
| Package manager | npm (`package-lock.json` present) |
| Test runner | Jest 29.7 + ts-jest (`jest.config.ts`: roots `src/`, testRegex `__tests__` or `.test./.spec.`) |

## The default way to work
`/boot` → `/worker implementer "<task>"` → `/worker verifier "<task>"`.
Never skip step 1 on a cold session, never skip step 3.

## Workers
| wid | Role | Actions | Seal actions |
|---|---|---|---|
| implementer | Implementer | pick_next, implement | — |
| verifier | Verifier | verify_seal | SEAL, REOPEN |

## Forbidden states
5 states — see `CLAUDE.md` for detail. These OVERRIDE all other skill text.

## Facts that are always true
- No LLM API key anywhere in the hub — Claude Code IS the runtime.
- `haven/` is memory, not code.
- `evidence/` is committed; "bad" notes are kept, not deleted.
- Monotonic ratchet: PENDING → IN_PROGRESS → SEALED, never demoted.
- Verifier owns PM status; implementer never sets it.
- `dist/` is build output, always gitignored, never hand-edited.

## Multi-phase / multi-branch sessions — branch isolation
[added 2026-10-01, after a real `ADHOC_WORK` REOPEN caused by this exact
mistake on node `remove-req-as-any-casts`, GitHub issue #179]

When a single session runs several `/todo`-style phases back-to-back
(e.g. a tracking issue with N sub-issue phases), each phase gets its own
branch, but they all share ONE working directory — there is no isolated
worktree available (see the sandbox gotcha below), so switching branches
mid-session is a real hazard:

- **`git checkout <other-branch>` with uncommitted changes silently
  carries those changes along** if the target branch's tracked files
  don't conflict. This is the normal, correct git behavior — but it means
  a diagram-node addition (or anything else) made while on `staging`
  BEFORE branching into phase N's branch will ride along onto whichever
  branch happens to be checked out next, not necessarily phase N's.
- **`git stash` before switching branches is the fix** — but the same
  hazard reappears if a stash is popped/left implicitly: always
  `git stash push -u -m "<phase>-sealed-pending-ship"` (with a message
  naming the phase) right after a phase is SEALED, before checking out
  the next phase's branch fresh from `staging`. Never pop a stash "to
  save time" onto a different branch than the one it was made on.
- **Add each phase's own diagram PENDING node ON that phase's own
  branch, immediately before implementing it — never batch-add several
  phases' nodes while sitting on `staging`/a shared checkout.** A batch
  addition done once, before branching per-phase, WILL get stashed away
  with whichever phase happens to be isolated first, silently stranding
  the node off every other phase's branch — exactly what happened here:
  12 backlog nodes were added on `staging`, carried onto phase 1's branch
  by the first `gh issue develop --checkout`, then `git stash`ed together
  with phase 1's other changes when isolating phase 2 — phase 2's branch
  was checked out fresh from `staging` and never saw any of the 12 rows,
  including its own. The verifier caught it as `ADHOC_WORK` (correctly —
  the mechanism worked as designed), but re-verification cost a full
  extra round-trip. Adding the node fresh, per-phase, right before that
  phase's own implementation work, makes this class of mistake
  structurally impossible instead of relying on remembering to check.

## Sandbox/tooling gotchas (this machine)
[added 2026-10-01]

- **`git worktree add <path>` OUTSIDE the primary working directory
  fails silently on writes** — the Bash tool's sandbox scopes file writes
  to the primary working directory tree; a worktree created as a sibling
  directory (e.g. `../wt/<branch>`) will let `git worktree add` itself
  succeed, but every subsequent `sed -i`/file-write into that worktree
  fails with a confusing generic error (looked like a `sed` quoting bug,
  wasn't). If real isolation between concurrent branches is needed within
  one session, use `git stash` + branch switching in the primary working
  directory instead (see above) — don't reach for `git worktree add` to a
  sibling path.
- **BSD/macOS `sed` (Darwin, this machine) does NOT support `\b` word
  boundaries** — a pattern like `s/(req as any)\.t\b/req.t/g` silently
  matches nothing (no error, just a no-op) instead of erroring or
  matching. Use an explicit trailing character/space instead of `\b`
  (e.g. `s/(req as any)\.t /req.t /g`), and always re-grep after a sed
  pass to confirm zero remaining matches rather than trusting exit code 0
  (BSD `sed` exits 0 even when a pattern matched nothing).
- **A shell `for f in $files; do sed -i '' ... "$f"; done` loop failed**
  in this Bash tool with a garbled "No such file" error naming the WHOLE
  space-joined file list as one filename, even though `$files` was a
  normal space-separated string and single-file `sed` calls worked fine
  in isolation. Root cause not fully diagnosed (didn't reproduce outside
  the loop) — the reliable workaround is one `sed` invocation per file as
  a separate tool call, not a shell loop, when doing a mechanical
  multi-file find/replace in this environment.

## Scoping a lint/type-safety remediation initiative
[added 2026-10-03, after #177's 12-phase migration shipped with a real
gap the operator caught by eye-reviewing the diff]

The 12-phase Strict TypeScript migration (#177) declared `any` cleanup
"done" after phase 8, then spent phases 9-12 on compiler flags — but 9
files with real `any` were never touched by any phase (24 real
`@typescript-eslint/no-explicit-any` hits; fixing them cleared 84
ESLint problems total once properly measured — the initiative's own
first estimate for this same set, 72, was itself a grep-based guess
that undercounted, exactly the mistake this lesson is about; see
`fix-remaining-any-unsafe-missed-files`/#204's own evidence note).
Root cause, in order of how deep it goes:

1. **Verification-tool mismatch.** Only Phase 1 (the ESLint setup
   itself) ever ran a full `npm run lint`. Every phase from 2 onward
   verified with `npx tsc --noEmit`/`npm test`/`npm run build` only —
   none of which catch `any` (TypeScript allows it by design; only
   ESLint's `no-explicit-any` flags it). "tsc is clean" was silently
   treated as "the any-cleanup is done," which it never meant.
2. **Scoping by manual sampling, not by data.** The 7 any-removal
   phases (#179–#185) had their file lists hand-picked via targeted
   grep for the highest-`any`-concentration files noticed at the time —
   e.g. `type-crud-core`/#181 was scoped off `BaseController.ts` (37),
   `services/index.ts` (15), `BaseService.ts` (7) real counts (real
   numbers, originally recorded in this diagram's `type-crud-core`
   PENDING row, commit `eef5dbd`; that row was later deleted as a stale
   duplicate in commit `4c2847f`, so these are only git-history-
   traceable now, not visible in the live diagram) — never from an
   exhaustive enumeration of every file with real `any` across the whole
   codebase. This is how 9 files fell through a gap nobody was looking
   at.
3. **The headline baseline number (1424 problems at Phase 1) was never
   broken down by rule before planning phases.** A `--format json` run
   grouped by `ruleId` would have shown immediately that a big chunk of
   that 1424 was `@typescript-eslint/no-misused-promises` (Express
   async-handler false positives — nothing to do with `any` at all,
   unrelated ESLint config issue) sitting untouched the whole time,
   visible from day one but never looked at because the initiative's
   mental model collapsed "ESLint problem count" into "`any` count"
   without checking that assumption.
4. **Re-verification follow-through gap.** After the any-removal phases
   (2-8), nothing re-ran the SAME full-codebase measurement used to
   define "not done" at the start, before moving on to the next category
   of work (compiler flags). Each individual phase's own `tsc`/test/build
   re-run was real and honest — the gap was never closing the loop at
   the INITIATIVE level with the tool that actually measures the
   initiative's own stated goal.

**The fix, for any future "clean up X across the whole codebase"
initiative (lint, type coverage, dependency upgrades, anything with a
numeric "problem count" framing):**
- Before carving up phases: run the exhaustive, automatable measurement
  (`--format json`, not a bare terminal scroll) and group it by BOTH
  rule/category AND file. Plan phases from that table, not from grep
  sampling or memory of "the files that seemed bad."
- Each phase still verifies with the tool suited to ITS OWN change
  (`tsc` for a typing phase, `npm test` for behavior) — that discipline
  was correct and should stay.
- Additionally, after the LAST phase in a measured-by-count initiative,
  re-run the exact same full measurement used to define the starting
  baseline, and diff the before/after counts per rule — not just an
  overall "looks clean" impression from the phases' own narrower checks.
- If the full measurement surfaces a category unrelated to the
  initiative's actual target (like `no-misused-promises` here), split it
  into its own issue rather than silently expanding or silently
  dropping it — don't let an unplanned category block or balloon the
  original scope.
