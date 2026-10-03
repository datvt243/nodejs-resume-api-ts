> "The baseline you measure is the baseline you'll be judged against —
> measure it with the same tool you'll use to confirm you're done, or
> you're not actually measuring anything." Applies to any "clean up X
> across the whole codebase" initiative: lint rules, type coverage,
> dependency upgrades, security findings — anything framed as a numeric
> problem count.

## The rule
Before splitting a measured-by-count initiative into phases, run the
exhaustive, machine-readable measurement (`--format json`, not a bare
terminal scroll) and group it by BOTH rule/category AND file. Plan
phases from that table — never from manual grep sampling, memory of
"the files that seemed bad," or an un-decomposed single total number.

After the LAST phase, re-run the SAME full measurement used to define
the starting baseline, and diff the before/after counts per rule. A
phase's own narrower verification (`tsc`, `npm test`) checks that
phase's own change — it does not, and cannot, confirm the initiative's
own stated goal was reached.

## Not evidence vs Evidence
| Not evidence | Evidence |
|---|---|
| "ESLint reported 1424 problems, so we have 1424 `any` to fix" | `--format json` grouped by `ruleId`: how many are actually `no-explicit-any`? |
| "I grepped for `any` and picked the worst-looking files" | A table of every file with a real `any`/unsafe-* hit, built once, exhaustively |
| "Phases 2-8 are done, `tsc`/tests/build are clean" | Re-ran the SAME tool that defined "not done" (here, `npm run lint`) and the count actually dropped to the claimed number |
| "The initiative is complete" | The after-measurement's per-rule breakdown has zero in every rule the initiative claimed to fix, and anything left is named as explicitly out of scope |

## Why this matters (case: #177 → #204)
The 12-phase Strict TypeScript migration (#177) declared `any` cleanup
done after phase 8, then spent phases 9-12 on compiler flags. 9 files
with real `any` were never touched — found only when the operator
hand-reviewed the merged diff. Root cause: only Phase 1 ever ran a full
`npm run lint`; every later phase verified with `tsc`/test/build only
(which can't catch `any` at all — TypeScript allows it by design, only
ESLint's `no-explicit-any` flags it). The any-removal phases were also
scoped by manual grep for the highest-concentration files rather than
an exhaustive enumeration — literally how the 9 files fell through.
Separately, the original 1424-problem baseline was never broken down by
`ruleId`, so a big chunk of it — `@typescript-eslint/no-misused-promises`,
an unrelated Express-async-handler ESLint config issue, nothing to do
with `any` — sat invisible in that total from day one. Full account:
`doctrine/MEMORY.md`'s "Scoping a lint/type-safety remediation
initiative" section.

## What "measure exhaustively" means
Run the tool with a structured output format (e.g. `npx eslint
'src/**/*.ts' --format json`), parse it, and produce two views before
writing a single phase description: total count grouped by `ruleId`,
and total count grouped by file. Phases get carved from THAT data. A
category unrelated to the initiative's actual target (e.g.
`no-misused-promises` here) gets split into its own separate issue, not
silently folded in or silently dropped.

## No exceptions
"The phase's own `tsc`/test/build is clean" is never substituted for
the initiative-level re-measurement, no matter how confident the
individual phases felt. If the full measurement hasn't been re-run
after the last phase, the initiative is not done — it's `blocked` on
that re-run, same as any other unverified claim.

## Failure mode this catches
"Narrow-tool false completion" — every individual phase's own
verification was real and honest, but the initiative as a whole was
declared done using a DIFFERENT, narrower tool than the one that
defined "not done" in the first place.

## Enforcement
Implementer: when scoping a new measured-by-count initiative, the FIRST
artifact (before any phase description, before any GitHub issue) is the
rule+file breakdown table. Verifier: on the node that claims to be the
LAST phase of such an initiative, re-run the full original measurement
yourself and confirm the per-rule counts the implementer claims —
treating the initiative's aggregate claim with the same
`EvidenceOnly`/`EDIT_UNVERIFIED` scrutiny as any other numeric claim,
not just each phase's own narrower diff.
