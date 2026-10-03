> "A PDF that looks right to a human and unreadable to a parser is a
> silent failure — nobody files a bug against their own resume." Applies
> to ANY code that renders or edits `src/services/createPDF*.ts`,
> `src/services/createDocx.ts`, or any future export format that turns
> candidate data into a downloadable document.

## The rule
Every PDF/DOCX CV export path (classic template, ATS template, any new
one) MUST hold these invariants. A fix or feature that touches export
code and violates one of these without recording a reasoned exception in
the same diagram node is not done — it's a regression waiting to be
found by a parser, not a human reviewer.

1. **No `letter-spacing` on real text, ever.** Puppeteer/Chromium text
   extraction (and every real-world ATS parser) reads spaced-out
   characters as separate tokens — `letter-spacing: .25em` on a heading
   turns `FRONTEND` into `F R O N T E N D` in the extracted text, making
   that keyword unmatchable. This applies to any CSS that visually
   stretches text (`letter-spacing`, `word-spacing` beyond normal,
   per-character `<span>` wrapping for a "designed" look).
2. **No network-fetched fonts, or fetch-and-wait-for-real.** A Google
   Fonts `<link>` loaded with `page.setContent(html, { waitUntil:
   'domcontentloaded' })` races the font download — Puppeteer may print
   before the face swaps in, both breaking the visual design AND (for
   display-swap stacks) sometimes substituting line/character widths. If
   a non-system font is genuinely required, await `document.fonts.ready`
   in `page.evaluate` before calling `page.pdf()`, or embed the font
   directly (base64 `@font-face`). Default: a system sans-serif stack
   (`Arial, Helvetica, "Liberation Sans", sans-serif`) — no network
   dependency, full Vietnamese glyph coverage on the Docker image this
   app already ships (`fix-chrome-executable-path` trap note).
3. **Labels, `<html lang>`, and `<title>` must follow the requested
   language — never hardcoded to one locale.** Every user-facing string
   in export HTML comes from `src/locales/en.ts`/`vi.ts` (same source as
   the rest of the API's i18n, see `utils/i18n.ts`), resolved by the
   same `lang` query param the endpoint already accepts. A template that
   hardcodes Vietnamese strings while serving `lang=en` produces a
   mixed-language document — exactly the kind of inconsistency ATS
   parsers' "standard heading" detection fails on.
4. **Dates are always `MM/YYYY`, zero-padded with `String(m).padStart(2,
   '0')` (or equivalent) — never a bare ternary like `m < 9 ? '0'+m :
   m`.** That exact ternary is an off-by-one (excludes month 9 itself)
   and shipped as a real bug in `createPDF.ts`'s `formatDate` — fixed by
   `add-ats-pdf-export`/#211, kept here so it can't silently reappear in
   a future rewrite. `createDocx.ts`'s own `formatDate` already uses the
   correct `m < 10` form — match that, not the old PDF one.
5. **Per-item list fields (skills/technology/etc.) must actually render
   when present.** `getSkills`-style helpers take the list as an
   explicit parameter and render when `list.length > 0` — not inverted
   (`!list.length ? render : ''`) and not silently shadowed by an IIFE
   default parameter. (`#188`, already fixed in `createPDF.ts` — kept
   here as the regression this standard exists to prevent.)
6. **Free-text fields injected as raw HTML (`description` and similar)
   must be sanitized before reaching the Puppeteer page**, at minimum an
   allow-list of `p, ul, ol, li, strong, em, br, a[href]`. Candidate-
   authored free text reaching an HTML-rendering context without
   sanitization is an injection surface, not just an ATS-parsing
   concern — treat it as a security requirement, not a style choice.
7. **No content a parser (or a human) should never see in a résumé
   export**: date of birth, gender, marital status, photo. If the
   candidate model carries these fields, an export template must
   actively exclude them, not merely "not mention" them by omission of a
   render call that could later be added back without anyone noticing.
8. **Single-column, real semantic structure, for any template claiming
   ATS-safety.** No CSS grid/flex side-by-side columns, no layout
   tables, no floats, no absolutely-positioned text, no image-based
   bullets/icons/skill-bars, no header/footer/watermark/page-number text
   (parsers often drop header/footer zones entirely). Real `<ul><li>`
   bullets, not pseudo-element glyphs. This invariant applies ONLY to a
   template that advertises itself as ATS-optimized (e.g. `template=ats`)
   — the classic/visual template is explicitly allowed to use layout
   CSS for human readers, per `add-ats-pdf-export`/#211's scoping
   (backward compatibility — the classic template's look does not
   change).
9. **PDF metadata should be set deliberately** (Title/Author/
   Subject/Keywords/Creator/Language) when the export format supports it
   — an unidentified PDF loses "open in the right app with the right
   name" affordances and fails `metadata`-type ATS checks. Use `pdf-lib`
   post-Puppeteer-render, not a layout hack inside the HTML.
10. **No PII in on-disk filenames or paths**, and no silent persistence
    of a generated personal document to a location `express.static`
    serves unauthenticated (see the `doctrine/domains/PROJECT.md` trap:
    "Anything saved under `src/public/` is served unauthenticated"). A
    new export path should default to in-memory response (`res.send`),
    only writing to disk behind an explicit opt-in env flag, and even
    then never under `public/`.

## Not evidence vs Evidence
| Not evidence | Evidence |
|---|---|
| "The PDF renders and looks correct in a browser preview" | Extracted text (`pdftotext`/`pdf-parse`) read back and checked for spaced letters, correct reading order, and correct date format |
| "I added `letter-spacing` for visual polish, it's just CSS" | Grepped the generated HTML/CSS for `letter-spacing` — zero matches outside an explicitly-approved non-ATS template |
| "Labels are fine, the whole app defaults to Vietnamese anyway" | The template's headings/labels come from `src/locales/<lang>.ts`, verified by passing `lang=en` and reading the actual rendered output, not assumed from the default |
| "Dates look right in the sample I tried" | `formatDate` unit-tested across month boundaries including September (month 9) and December (month 12), not spot-checked on one example |
| "Nothing security-sensitive in a résumé" | Checked the real model fields reaching the template against the no-forbidden-fields list (DOB/gender/marital/photo), not assumed absent |

## Why this matters (case: `add-ats-pdf-export`/#211)
The classic template (`createPDF.ts`) was shipped with `letter-spacing:
.25em`/`.18em` on the name, section headings, and job titles — purely a
visual choice, never tested against text extraction. The same file's
`formatDate` had a one-character bug (`m < 9` instead of `m < 10`) that
silently mis-rendered every September date, present since the function
was written, never caught because every manual QA pass visually scanned
rendered PDFs rather than reading back the extracted text or testing
date boundaries. Both defects were invisible to a human looking at the
rendered page and would have been invisible to a human reviewing a diff
that "looks like a styling change" — only became visible when #211's
ATS self-check endpoint was built specifically to extract text back out
and check it, which is why this standard requires evidence that comes
from the SAME extraction path an ATS system actually uses, not visual
inspection.

## No exceptions
A template may deliberately opt out of rule 8 (the ATS single-column
invariants) ONLY if it does not advertise itself as ATS-safe anywhere in
its name, query param, or documentation (e.g. the pre-existing `classic`
template). Rules 1-7, 9, 10 apply to EVERY export template, ATS-branded
or not — there is no "visual template, so XSS/PII/date-bug rules don't
apply" carve-out.

## Failure mode
Shipping an export change that passes `npm test`/`npm run build` but was
never run through actual text extraction (`pdf-parse`/`pdftotext`) is
`EDIT_UNVERIFIED` for any change touching rules 1-5 specifically — those
five are defects that are invisible to TypeScript's type checker and to
a rendered-page visual check, and only show up in extracted text.

## Enforcement
Any node that touches `src/services/createPDF*.ts`, `createDocx.ts`, or
a new export service must, in its evidence note, either (a) confirm each
of the 10 rules above still holds (grep for `letter-spacing`, re-read
`formatDate`, confirm locale usage, etc.), or (b) name the specific rule
it doesn't apply to and why (e.g. "rule 8 doesn't apply — this is the
classic template, which doesn't claim ATS-safety"). A verifier seeing an
export-code diff with no mention of this file should treat that as a
gap, not assume compliance.
