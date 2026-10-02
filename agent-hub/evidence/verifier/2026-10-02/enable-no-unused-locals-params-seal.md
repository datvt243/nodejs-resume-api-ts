# 2026-10-02 — enable-no-unused-locals-params (verifier note)

- Worker: verifier (independent subagent, Agent tool, `general-purpose` type)
- Node: `enable-no-unused-locals-params`
- New PM status: PENDING → SEALED

## Isolation proof (actual spawn task string)

Spawned via the `Agent` tool with no prior memory of any implementation
session, given this exact directive (verbatim excerpt from the dispatch
prompt): "Run `verify_seal` for evidence note:
`agent-hub/evidence/implementer/2026-10-02/enable-no-unused-locals-params-plan.md`
... Both deserve real scrutiny — verify each bug claim independently,
don't just trust the note's prose." All findings below were derived from
real `git diff`, `grep`, `Read`, and command output gathered fresh in
this session — nothing was copied from the implementer's note without
independent reproduction.

## Reasoning

1. **Row check**: `grep -n "enable-no-unused-locals-params" agent-hub/haven/diagrams/dev-loop.prime-mermaid.md`
   → exactly one match, line 99, status `PENDING`, before any edit.
2. **Issue body** (`gh issue view 188`): scope = enable both flags,
   `_`-prefix convention for intentional unused params, acceptance =
   both flags on, `tsc --noEmit` clean, tests pass, build clean, no
   behavior change. Matches note's approach.
3. **Flags**: `tsconfig.json:13-14` — `"noUnusedLocals": true,
   "noUnusedParameters": true,` both present.
4. **Bug claim #1** (`src/alias.ts`): `git diff staging -- src/alias.ts`
   shows the deleted line was exactly `const _path = getPath(path.join(__dirname,
   'src'), 'src');` in the `else` (dev) branch, immediately followed by
   `moduleAlias.addAlias('@', path.join(__dirname, ''))` — a different
   expression, never referencing `_path`. Confirmed real, not cosmetic.
   Read `getPath()` (`src/alias.ts:7-13`): pure string manipulation
   (`path.includes`/`path.replace` on a template string), no I/O, no
   side effects — safe to delete the dead call. Confirmed production
   (`if`) branch untouched in the diff — still computes and uses its own
   `_path` from `getPath()`.
5. **Bug claim #2** (`src/services/createPDF.ts`): `git diff staging --
   src/services/createPDF.ts` confirms the OLD code was
   `const getSkills = ((skills = []) => { return !skills.length ? ...
   : ''; })();` — zero-argument IIFE call with its own defaulted param,
   and the inverted ternary (renders the div when EMPTY). Traced the
   call chain: `_layoutItem` (`createPDF.ts:169-218`) destructures
   `skills = []` from `props` (line 170), builds `getSkills` (now fixed,
   lines 198-200), and interpolates `${getSkills}` into the returned
   template at line 214. `renderExperience` (line 328-347) and
   `renderProject` (line 348+) both destructure a real `skills`/
   `technology` field from each list item and pass it through to
   `_layoutItem({..., skills})` — confirming this is genuinely
   user-visible PDF output, not discarded. NEW code: IIFE now declares
   `(skillsList: string[])` and is called with the real `skills` arg;
   condition corrected to `skillsList.length ? renderDiv : ''`. Both
   claims verified independently as real, not overstated.
6. **Spot-checks (4+ categories)**:
   - `utils/helper.ts`: `statusCodeSuccess`/`statusCodeFailed` removed
     from both the `formatReturn` interface and its destructuring;
     `grep -rn "statusCodeSuccess\|statusCodeFailed" src` → zero hits
     anywhere in the codebase (safe dead-field removal).
   - `BaseController.ts`: `baseProp` interface deleted;
     `grep -rn "baseProp" src` → only hit is an unrelated, separate
     interface of the same name already declared independently in
     `services/index.ts:10` (pre-existing, not imported/shared) —
     confirmed zero references to the deleted one.
   - `candidate.service.ts`: `const res = await MODEL.updateOne(...).exec()`
     → bare `await MODEL.updateOne(...).exec()` — `.exec()` still
     called for its side effect, return binding simply removed.
   - Route files: spot-checked `education.route.ts`, `experience.route.ts`,
     `award.route.ts` — each diff shows `res: Response` → `_res: Response`
     on every placeholder `(req, res, next) => { req.params/body.collection
     = Collections.X; next(); }` block. `grep -n "Response"` on each file
     confirms every `Response`-typed param in the file is one of these
     renamed placeholders — no other handler declares `res` there, so
     the blanket rename was exhaustive and safe, not a guess.
   - `jest.setup.ts` independently read in full: 7 lines, all
     `process.env.X ??= ...` assignments, no locals/params at all —
     confirms the note's claim that this node needed no fix there.
7. **Re-run** (full, given 2 real bug fixes):
   `npx tsc --noEmit` → clean, 0 errors.
   `npm test` → `Test Suites: 31 passed, 31 total`, `Tests: 181 passed,
   181 total` — exact match to the note.
   `npm run build` → `tsc && npm run copy`, clean, no errors.
8. **Proportion**: `git diff staging --stat -- src/ tsconfig.json` →
   `32 files changed, 66 insertions(+), 76 deletions(-)` — exact match
   to the note, no scope creep.
9. **Forbidden states scan**: `ADHOC_WORK` — no (worker identity +
   PENDING node existed). `NO_EVIDENCE` — no (plan note present).
   `EDIT_UNVERIFIED` — no (every claim re-run independently above).
   `CODE_IN_HAVEN` — `find agent-hub/haven -name "*.ts" -o -name "*.py"
   -o -name "*.sh" -o -name "*.js"` → empty, clean. `DIAGRAM_DRIFT` —
   resolved by this SEAL edit.

## Proportion

32 files, 66+/76- — matches note exactly, confirmed via independent
`git diff --stat`.

## Forbidden states scan

All 5 checked, none triggered (see item 9 above).

## Re-run

Full re-run performed (not audit-only), given two independently-claimed
real bug fixes in one node: `npx tsc --noEmit` clean; `npm test` 31/31
suites, 181/181 tests; `npm run build` clean.

## Verdict

**SEAL** — both flags genuinely enabled, both bug claims independently
verified as real (not overstated) with full call-chain tracing, all
spot-checked mechanical fixes correct and safe, proportion matches,
no forbidden states triggered, full re-run clean.
