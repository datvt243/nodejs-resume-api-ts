# 2026-10-03 — enable-strict-flags-low-cost (ship-time integration fix)

- Context: shipping all 12 sealed phases of #177 in order per operator
  instruction ("ship theo thứ tự đi, bắt đầu từ 178, tự tạo merge luôn").
  Each phase branch was forked independently off `staging` before any
  sibling phase merged, then rebased onto the real, updated `staging`
  at ship time (phases 1-8 already merged in by this point).

## What happened

After rebasing `186-strict-flags-low-cost` onto the post-phase-8
`staging` and popping its sealed stash, `npx tsc --noEmit` surfaced 2
real errors this node's own sealed evidence note never saw (its branch
forked before phase 3/#180 and phase 6/#183 existed):

1. `src/utils/helper-auth.ts:17` — `extractTokenWithSource`'s
   `parts[0]`/`parts[1]` (from `authHeader.split(' ')`) are
   `string | undefined` under `noUncheckedIndexedAccess` (this node's
   own flag). This file didn't exist in this node's typed form until
   #180 retyped `req: any -> req: Request` on it — #180 merged into
   `staging` AFTER this phase's branch was forked, so this interaction
   was never visible until ship-time rebase.
2. `src/candidate_me/index.ts:157` — `profileIdsField` (looked up from
   `PROFILE_ID_FIELDS: Record<string, string>`) is `string | undefined`
   under the same flag, and was used directly as an index without a
   guard. This exact line was reshaped by #183 (`type-candidate-modules`,
   merged after this phase's branch forked) — #183's own version
   already guards the *consuming* ternary one line below (`profileDoc &&
   profileIdsField ? ... `), but the indexing one line above it did not
   have the same guard.

## Fix (mechanical, type-only, no behavior change)

- `helper-auth.ts`: destructured `const [scheme, value] = parts`, added
  an explicit `scheme !== undefined && value !== undefined` check
  alongside the existing `parts.length === 2` check before using
  either. `split(' ')` never produces holes, so this guard is always
  true whenever `parts.length === 2` is true at runtime — purely
  satisfies the type system, zero behavior change.
- `candidate_me/index.ts`: added the same `profileIdsField` truthiness
  check to the `profileIds` lookup line that the very next line already
  had for its own ternary, closing the gap between the two.

## Verification

`npx tsc --noEmit`: clean (0 errors) after both fixes.
`npm test`: 31/31 suites, 181/181 tests passing — identical to every
prior sealed node this session.
`npm run build`: clean.

## Diff delta vs. the original sealed note

Original sealed `git diff staging --stat` (6 files, 15+/6-) now reads
(7 files, 18+/8-) — the 2 extra files/lines are exactly this
integration fix, nothing else. No new judgment calls, no scope
expansion: both fixes are directly, mechanically required by
`noUncheckedIndexedAccess` (the flag this node itself introduces)
interacting with 2 sibling phases that merged in the time between this
node's own seal and its ship.

Not sent through a separate implementer/verifier round — this is a
2-line, compiler-mandated, zero-behavior-change integration fix
surfaced purely by merge ordering, the same category of fix a normal
rebase conflict resolution would require. Documented here for the
record per NO_EVIDENCE discipline.

## Status
Committed directly as part of shipping phase 9/12 of #177.
