# 2026-10-04 — sync-readme-claude-md-post-211 (implementer note)

- Worker: implementer (main session)
- Node: `sync-readme-claude-md-post-211`
- GitHub issue: #212
- Branch: `211-add-ats-friendly-cv` (same branch as `add-ats-pdf-export`/#211,
  deliberately — see the node's own PENDING-row rationale: the code being
  documented doesn't exist on `staging` yet, so a fresh branch would
  describe not-yet-shipped files as real)

## What changed
`README.md` + root `CLAUDE.md` only — no `src/` changes in this pass
(confirmed via `git diff --stat -- src/ package.json package-lock.json`
showing only the pre-existing `add-ats-pdf-export` diff, untouched here).

### CLAUDE.md
- Version `1.8.1` → `1.9.0` (matches `package.json`, already bumped by
  the `/release` earlier this session — was stale).
- Tech Stack PDF row: added `pdf-lib`/`pdf-parse`/`xss` alongside the
  existing Puppeteer/PDFKit/Pug line.
- Project Structure tree: added `candidate_me/ats-check.ts`,
  `services/createPDF.ats.ts`, `services/pdfMetadata.ts`,
  `services/atsExtract.ts`, `services/atsChecks.ts`,
  `services/keywordMatcher.ts`, noted `cv.route.ts` under `routers/api/v1/`
  and `atsKeywords.ts` under `constant/`.
- API Endpoints table: `download-pdf` row gained `?template=classic|ats`;
  added the `POST /api/v1/cv/ats-check` row.
- Testing table: added the 4 new test files
  (`createPDF.ats.test.ts`, `atsChecks.test.ts`, `keywordMatcher.test.ts`,
  `atsPdfIntegration.test.ts`), grouped under `services/` next to the
  existing PDF/DOCX rows per the table's established convention.

### README.md
Same set of facts, mirrored into README's own sections: version, Features
list (new ATS bullet), Tech Stack table, Project Structure, API Endpoints
table, test file count (31 → 35), Production Notes PDF/DOCX line.

## Every fact independently verified against real code/config (not copied from memory)
| Claim | Check run | Result |
|---|---|---|
| `package.json` version | `grep -n '"version"' package.json` | `"version": "1.9.0"` |
| `pdf-lib`/`pdf-parse`/`xss` present, versions | `grep -nE '"(pdf-lib\|pdf-parse\|xss)"' package.json` | `pdf-lib: ^1.17.1`, `pdf-parse: ^1.1.4`, `xss: ^1.0.15` — matches what's written (table truncates to major.minor, same convention the table already used for Puppeteer/PDFKit/Pug) |
| `sanitize-html` NOT present (shouldn't be mentioned anywhere) | `grep -n '"sanitize-html"' package.json` | no match — confirmed absent, not referenced in either doc |
| Test file count | `find src/__tests__ -name "*.test.ts" \| wc -l` (34) + the pre-existing non-`.test.ts` `database/mongo.db.ts` row | 35 total — matches `npm test`'s own "35 passed, 35 total" output from the `add-ats-pdf-export` evidence note |
| The 4 new test files' names | `find src/__tests__ -name "*.test.ts" \| sort` | `services/atsChecks.test.ts`, `services/atsPdfIntegration.test.ts`, `services/createPDF.ats.test.ts`, `services/keywordMatcher.test.ts` — all 4 real, all 4 listed |
| New service/controller/router files exist | `ls` each path mentioned | `src/services/createPDF.ats.ts`, `pdfMetadata.ts`, `atsExtract.ts`, `atsChecks.ts`, `keywordMatcher.ts`, `src/candidate_me/ats-check.ts`, `src/routers/api/v1/cv.route.ts`, `src/constant/atsKeywords.ts` — all confirmed present |
| `download-pdf` really has `template` param now | read `src/routers/api/v1/index.ts`'s swagger block + `src/candidate_me/index.ts`'s `fnExportPDF` | confirmed `req.query['template'] === 'ats'` branch exists, default stays classic |
| `ats-check` really mounted at `/api/v1/cv/ats-check` | read `src/routers/api/v1/index.ts` (`router.use('/cv', verifyToken, routeCv)`) + `src/routers/api/v1/cv.route.ts` (`router.post('/ats-check', fnAtsCheck)`) | confirmed, full path `/api/v1/cv/ats-check`, behind `verifyToken` (Bearer/cookie) |
| PDFKit still listed as a dep in the Tech Stack table | `grep -rln "pdfkit" src --include="*.ts"` | zero real usages in `src/` — this is a PRE-EXISTING inaccuracy (PDFKit is an unused dependency), predates this node, explicitly left untouched here as out of scope (this node's job is documenting the ATS feature, not auditing every pre-existing doc claim) |

## Test run (re-confirmed unaffected by a docs-only change)
```
git status --short -- README.md CLAUDE.md
 M CLAUDE.md
 M README.md
git diff --stat -- src/ package.json package-lock.json
 (only the pre-existing add-ats-pdf-export diff, unchanged by this pass)
```
No `npm test`/`npm run build` re-run needed for a docs-only change — same
precedent as `sync-readme-claude-md-post-177`/#203's own evidence note
(`EDIT_UNVERIFIED` doesn't apply: no `src/` file changed, no test/build
claim is being made here).

## Scope confirmed
Exactly 2 files changed (`README.md`, `CLAUDE.md`). One pre-existing
inaccuracy (PDFKit unused) was found but deliberately left alone —
named explicitly above rather than silently left stale or silently
expanded into an unrelated fix, per `initiative-scoping.md`'s spirit
("split into its own issue rather than silently expanding or dropping
it"). No commit/push has happened yet.
