# 2026-10-04 — add-ats-pdf-export (verifier note) — SEAL

## Isolation proof
Spawned fresh via the Agent tool with only the dispatch task description —
no prior conversation, no memory of the implementer session. Did not write
any of this diff.

## Re-run
full — independently re-ran `npm run build` (clean, matches note) and
`npm test` (35/35 suites, 235/235 tests, matches note exactly, including
the real-Puppeteer `atsPdfIntegration.test.ts` actually executing, not
`describe.skip`'d via `CI_NO_CHROME`). Justified per the task's own
"Re-run scope" instruction: ~13 new/changed files, 3 new runtime deps, a
dependency swap found via a real Jest failure, and a case-sensitivity bug
found via a real Puppeteer run are exactly the kind of headline claims
worth reproducing, not just auditing.

## Evidence note read
`agent-hub/evidence/implementer/2026-10-04/add-ats-pdf-export-plan.md`,
read in full before touching the real diagram or diff, per `EvidenceOnly`.

## Node / diagram / issue cross-check
- `add-ats-pdf-export` row on `haven/diagrams/dev-loop.prime-mermaid.md`
  was PENDING, near the end of the PM table, matching the node description
  — not `DIAGRAM_DRIFT`, not a node absent from any diagram.
- `gh issue view 211` read in full; the note's described scope (template
  param, ats-check endpoint, 10 checks, keyword matcher, formatDate fix,
  getSkills regression test) matches the issue's spec and acceptance
  criteria line for line.
- `doctrine/MEMORY.md`'s exact test commands (`npm test`, `npm run build`,
  both from repo root) match what the note cites — not an invented
  command.
- The note's pasted test/build output is not truncated or redacted (full
  Jest summary line + full build command sequence present).

## Acceptance criteria, walked one at a time (own evidence, not the note's prose)
1. **`npm run build`/`npm test` pass, no new `any` outside Express
   boundary** — independently re-ran both (see Re-run above). Grepped all
   8 new/changed ATS-feature source files for `: any`, `<any>`, `as any`,
   non-null `!`, `@ts-ignore`, `@ts-nocheck` — zero hits (the one grep
   match was the English word "any" inside a comment). The Express
   boundary itself (`ats-check.ts`'s `req.body?.['...']`) uses bracket
   access + runtime type guards, not `any`.
2. **ATS template invariants** — read `src/services/createPDF.ats.ts` in
   full: single CSS body, no `display:flex/grid`, no `<table>`/`<img>`;
   `grep -n letter-spacing` shows only `letter-spacing: normal` (line
   306), no numeric value; `grep -n fonts.googleapis` empty; headings
   pulled from `t('cv.*', lang)` against the new `cv` namespace confirmed
   present in both `src/locales/en.ts` and `vi.ts` (diffed directly);
   `formatMonthYear` uses `.padStart(2,'0')`; `sanitizeDescription` uses
   `xss`'s `filterXSS` with an allow-list; no DOB/gender/marital/photo
   fields anywhere in `AtsContent`/`buildAtsContent`.
3. **`GET /api/v1/download-pdf?template=ats` works, `template=classic`
   unchanged** — `git diff -- src/candidate_me/index.ts` shows only an
   additive `if (req.query['template'] === 'ats')` branch before the
   existing `createCV` call, which is otherwise untouched; `git diff --
   src/services/createPDF.ts` shows `createCV`'s own body unchanged
   beyond the 1-line `formatDate` fix, plus a new appended
   `renderPdfBuffer` export.
4. **`POST /api/v1/cv/ats-check` returns `{score, pages, checks[],
   extractedText, keywordMatch?}`** — read `src/candidate_me/ats-check.ts`
   in full: response object matches exactly, `keywordMatch` spread in
   only `...(keywordMatch ? {...} : {})`, i.e. genuinely optional, present
   only when `jobDescription` was given — matches the spec's `keywordMatch?`.
5. **10 check functions, each unit-tested pass+fail** — read
   `src/services/atsChecks.ts` (10 named functions + `scoreChecks`) and
   `src/__tests__/services/atsChecks.test.ts`: every one of
   `checkTextExtractable`, `checkReadingOrder`, `checkNoSpacedLetters`,
   `checkContactInBody`, `checkStandardHeadings`, `checkDateFormat`,
   `checkReverseChronological`, `checkNoForbiddenFields`,
   `checkPageCount`, `checkMetadata` has both a passing and a failing
   `it(...)`, confirmed by reading the full `it(...)` title list.
6. **Keyword matcher: aliases + Vietnamese diacritics** — read
   `src/services/keywordMatcher.ts` and
   `src/__tests__/services/keywordMatcher.test.ts`: dedicated tests for
   vue/vuejs/vue.js, ts/typescript, reactjs/react aliasing,
   case-insensitivity, substring-false-positive avoidance, and a
   Vietnamese-diacritics-don't-break-tokenization test, all present and
   passing in the independent re-run.
7. **Real-Puppeteer integration test exists and passes** —
   `src/__tests__/services/atsPdfIntegration.test.ts` runs real
   `renderAtsPdfBuffer`/`extractPdfText` (no mocks), asserts
   `scoreChecks(checks) >= 90` and `failed === []` as a hard `expect` (not
   just a manually-observed number in the note), plus a second test
   scoring real keyword coverage against a sample JD. Both passed in the
   independent re-run; `describeOrSkip` only skips under `CI_NO_CHROME`,
   which was not set, so it genuinely executed with real Chromium.
8. **`formatDate` September-padding bug fixed + regression test** —
   confirmed the 1-line fix in the `createPDF.ts` diff
   (`String(m).padStart(2,'0')`) and the dedicated regression tests in
   `src/__tests__/services/createPDF.test.ts` ("zero-pads September" +
   "still renders double-digit months correctly").
9. **`npm run build`/`npm test` pass** — independently re-run, see above.
10. **New standard doc wired in** — `agent-hub/doctrine/standards/pdf-export-standard.md`
    read in full (10 binding invariants, Not-evidence/Evidence table,
    Why-this-matters case study, No-exceptions, Failure mode,
    Enforcement sections, well-formed); confirmed referenced in
    `agent-hub/CLAUDE.md`'s "Touching PDF/DOCX export" paragraph (present
    in this session's own auto-injected system reminder) and in both
    `agent-hub/INDEX.md` and `agent-hub/doctrine/INDEX.md` via direct
    grep — this was an explicit operator request, confirmed present, not
    just claimed.

## Forbidden states scan
- `ADHOC_WORK` — not triggered: node existed on the diagram (PENDING)
  before this verification touched anything.
- `NO_EVIDENCE` — not triggered: detailed implementer evidence note
  exists and was read in full.
- `EDIT_UNVERIFIED` — not triggered: build/test independently re-run by a
  fresh subagent (this one), not just trusting the note's pasted output;
  rules 1-5 of pdf-export-standard.md (the ones invisible to
  `tsc`/visual-check) are each backed by a real extracted-text assertion
  in a passing test, confirmed by reading the test files directly.
- `CODE_IN_HAVEN` — not triggered: only the diagram row (PM status table)
  was edited under `agent-hub/`; no runnable code added to `haven/`.
- `DIAGRAM_DRIFT` — not triggered, and now resolved: the diagram row is
  updated in place (PENDING → SEALED) to match the real, verified diff;
  row position unchanged, nothing reordered.

## Seal gate
Not outward-facing yet: `git status --short` (pre-verification) showed
only working-tree modifications/untracked files, no staged commit;
`git log origin/staging..HEAD --oneline` returned empty (nothing ahead of
`origin/staging` on this branch). No commit/push has occurred, so no
operator-approval citation is required for this SEAL.

## Proportion (`SmallestDiff`)
All 7 documented deviations reviewed individually:
1. `pdf-parse` pinned `^1.1.4` (not latest `2.x`) — reasonable: v2 is a
   full rewrite incompatible with the stable `@types/pdf-parse`; verified
   `package-lock.json` resolves to exactly `1.1.4`.
2. `sanitize-html` → `xss` swap — reasonable: real Jest `SyntaxError`
   from an ESM-only transitive dep, not a style preference; verified
   `sanitize-html` is fully absent from `package.json`, `xss` present.
3. Dropped bare `'js'` alias — reasonable: caught by the matcher's own
   unit test's coverage-math assertion, not inspection; verified the
   comment and absence of a bare `'js'` entry in `atsKeywords.ts`.
4. Added `node.js`/`nodejs` dictionary entry, excluding bare `'node'` —
   reasonable, narrowly scoped, justified in a code comment.
5. Case-insensitive `checkReadingOrder` heading search — reasonable and
   necessary: Chromium's `text-transform: uppercase` is pixel-real in
   extracted text; `checkStandardHeadings` correctly left exact-case
   since it compares structured data, not raw text — confirmed by
   reading both functions.
6. `renderPdfBuffer` added to `createPDF.ts` — additive only, confirmed
   via diff that `createCV`'s own body is untouched beyond the 1-line
   date fix; avoids duplicating Puppeteer boilerplate a third time for
   the classic-template arm of `ats-check`. Reasonable.
7. `PERSIST_EXPORTED_PDF` opt-in gate for ATS export — matches
   pdf-export-standard.md rule 10 exactly; classic template's own disk
   behavior untouched. Reasonable.

No unjustified scope creep found. Diff is proportionate to a genuinely
~13-file, 3-new-dependency feature with two real bugs found through
actual runs (not invented complexity).

## Verdict: SEAL

Every acceptance criterion from issue #211 has real, independently
obtained evidence — not a repetition of the implementer note's prose.
Build and test were re-run by this fresh verifier and matched exactly.
Source files were read directly and match the note's characterization in
every spot-checked case. No forbidden state found.
