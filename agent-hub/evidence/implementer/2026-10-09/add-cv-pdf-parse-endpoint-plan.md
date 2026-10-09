# 2026-10-09 — add-cv-pdf-parse-endpoint (plan)

Worker: implementer
Version: 0.1.0
Node: `add-cv-pdf-parse-endpoint` (`haven/diagrams/dev-loop.prime-mermaid.md`, appended PENDING at table end)
Task (via `/todo #234`): GitHub issue #234 "PDF CV parsing endpoint for CV data import (PDF half of #141)" — full body read via `gh issue view 234`.
Branch: `234-pdf-cv-parsing` (from `staging` @ `eee9cb0`, created with `gh issue develop`).

## Hub bytes before: 224469
(root files + doctrine/ + non-archive haven/diagrams + implementer/verifier bundles, measured before the diagram row was appended)

## Acceptance (from issue #234)
1. `POST /api/v1/candidate/parse-cv-pdf` behind verifyToken (router-level), multipart field, sibling of `parse-linkedin-export`.
2. PDF only (mimetype + extension), max 5MB, memory storage — nothing written to disk, nothing persisted.
3. Reuse `extractPdfText` (`src/services/atsExtract.ts`), no new dependency.
4. Heuristic: section split by vi + en headings; entries detected by date ranges (`MM/YYYY – MM/YYYY`, `YYYY – Present/Hiện tại`, ...); adjacent lines → school/major, company/position.
5. Response `data: { educations[], experiences[] }` in the exact `ParsedEducation`/`ParsedExperience` shape of parse-linkedin-export, `''`/`null` for unknowns, plus `extractedText`.
6. 400: missing file, non-PDF, > 5MB, corrupt/unreadable PDF. 200 + empty arrays when readable but nothing recognized.
7. Tests: unit tests for heuristics on vi + en fixture text; round-trip via `renderAtsPdfBuffer` → parse back.

## Code anchors (read before writing)
- `src/candidate/parseLinkedInExport.service.ts` — `ParsedEducation`/`ParsedExperience` types to reuse.
- `src/middlewares/uploadLinkedInExport.middleware.ts` — memory-storage multer pattern to mirror; `src/middlewares/uploadCV.middleware.ts` — `CV_MAX_FILE_SIZE` (5MB) + PDF filter.
- `src/candidate/candidate.controller.ts:109` `fnParseLinkedInExport` — controller pattern.
- `src/routers/api/v1/candidate.route.ts:52-110` — swagger + route.
- `src/locales/{vi,en}.ts` `linkedinImport` block — i18n message pattern.
- `src/services/createPDF.ats.ts` — `formatDateRange` (`MM/YYYY – end`), headings from `cv.*` locale keys; real extracted text probed (temp test, removed): heading line uppercase, `title — org` line, date line, description lines.

## Blockers
none — test/build/lint commands present in `doctrine/MEMORY.md`.
