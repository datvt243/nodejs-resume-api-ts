# 2026-09-28 — fix-chrome-executable-path (plan + diff)

- Worker: implementer
- Version: 0.1.0
- Node: `fix-chrome-executable-path` (`haven/diagrams/dev-loop.prime-mermaid.md`)
- Issue: [#154](https://github.com/datvt243/resume-nodejs-api/issues/154) — Puppeteer Chrome executable path hardcoded — breaks PDF export in CI/Docker
- Branch: `154-puppeteer-chrome-executable` (base `staging`)
- Task (verbatim): "fix bug #152 tới #156" — this note covers #154 only, part of the same 5-issue batch as #152/#153/#155/#156, each processed as its own implementer→verifier round.

## Hub bytes before: 88066

## Node lookup

Matched the existing PENDING node `fix-chrome-executable-path` directly
(task resolves to GitHub issue #154, filed against this exact node — this
node was the diagram's own documented "first candidate node").

## Bookkeeping-gap finding (read before writing anything)

Same pattern as the other 3 nodes sealed earlier this session. Reading
`src/services/createPDF.ts` today (lines 9-34) shows there is **no
hardcoded Chrome executable path anywhere** — the trap description in
`doctrine/domains/PROJECT.md` (`src/services/createPDF.ts:14-25`) and the
diagram node's own PENDING description no longer match the live file:

```ts
export const createCV = async (data: Record<string, any>, res: Response) => {
  try {
    if (!fs.existsSync(PDF_OUTPUT_DIR)) fs.mkdirSync(PDF_OUTPUT_DIR, { recursive: true });
    const URL = `${PDF_OUTPUT_DIR}${path.sep}`;

    // Optional override for CI/Docker where a specific Chrome/Chromium must be pinned.
    // Unset: puppeteer resolves its own bundled Chromium automatically.
    const executablePath = process.env.PUPPETEER_EXECUTABLE_PATH;

    const otp = {
      ...(executablePath ? { executablePath } : {}),
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox'],
    };
    const browser = await puppeteer.launch(otp);
    ...
```

This exact shape (env-var override via `PUPPETEER_EXECUTABLE_PATH`,
falling back to Puppeteer's own bundled Chromium resolution when unset)
is precisely what the issue's own "Fix" section asks for. It was
introduced by `add-docker-support` (issue #24, SEALED 2026-09-06) — that
node's diagram entry explicitly says: "Chromium installed via `apt` in
the image... with `PUPPETEER_EXECUTABLE_PATH` set — this is exactly the
CI/Docker case the existing `fix-chrome-executable-path` trap... warns
about; live-verified working (see evidence), not just assumed fixed by
that trap's earlier code change." So the fix has been live and
**Docker-live-verified** since 2026-09-06 — over 3 weeks — but this
node's own PENDING row was never updated, and the `doctrine/domains/
PROJECT.md` Traps table entry is now stale too (out of scope to edit
here — noted below).

The real remaining gap: `services/createPDF.test.ts` had **zero**
coverage of the executable-path resolution logic itself (only
`pageRender`, a separate pure function, was tested) — exactly what issue
#154's acceptance criteria asks for ("add coverage for the
executable-path resolution if not already covered").

## Diff (smallest diff — no `src/` production code, extends 1 existing test file)

- `src/__tests__/services/createPDF.test.ts` — added:
  - `import { createCV } from '@/services/createPDF'` (alongside the
    existing `pageRender` import) and `import puppeteer from 'puppeteer'`.
  - `jest.mock('puppeteer', () => ({ launch: jest.fn() }))` — Puppeteer's
    real `launch()` is never invoked; no real browser is spawned, no
    dependency on a Chrome/Chromium install in the test environment.
  - New describe block `createCV executablePath resolution (issue #154)`,
    2 tests: (1) with `PUPPETEER_EXECUTABLE_PATH` unset, `puppeteer.launch`
    is called with no `executablePath` key at all (bundled Chromium
    resolution); (2) with it set, `puppeteer.launch` is called with that
    exact value (CI/Docker override). Both call the real `createCV`
    end-to-end with a fake browser/page (`newPage`/`setContent`/`pdf`/
    `close` all mocked) — only Puppeteer itself is faked, the option-
    building logic under test is 100% real.

## Command

```
npm test
```
Output (verbatim tail):
```
Test Suites: 26 passed, 26 total
Tests:       142 passed, 142 total
Snapshots:   0 total
Time:        6.705 s
Ran all test suites.
```
(142 = 140 (post-#157-merge baseline on `staging`) + 2 new tests, in an
existing file, so no new suite count. Same pre-existing, unrelated
harness exit warning as prior notes — not a failure.)

```
npm run build
```
Output: `tsc` clean, `copy` step ran with no errors.

## Acceptance

| Criterion | Evidence |
|---|---|
| Trace to exactly one diagram node | `fix-chrome-executable-path` |
| Smallest diff | 1 existing test file extended, 0 production `src/` changes (fix already live since `add-docker-support`/#24, SEALED 2026-09-06) |
| PDF export works with no hardcoded path assumption | Confirmed by reading `src/services/createPDF.ts` — no hardcoded path literal anywhere in the file |
| Works both with Puppeteer's bundled Chromium and with an externally-installed one via `PUPPETEER_EXECUTABLE_PATH` | Both branches now covered by the 2 new tests above; also live-Docker-verified previously (`add-docker-support` node's own evidence, `evidence/verifier/2026-09-06/add-docker-support-round2-seal.md`) |
| `createPDF.test.ts` still passes; executable-path coverage added | `npm test` → `Tests: 142 passed, 142 total`, including the 2 new tests |
| Exact test command run + output read back | `npm test` output above; `npm run build` clean |
| Evidence note written | This file |

## Noticed, not done

- `doctrine/domains/PROJECT.md`'s Traps table still lists "Hardcoded
  Chrome executable path (`src/services/createPDF.ts:14-25`)" as an open
  trap. It is stale — the code no longer matches that description. Not
  edited here (out of scope for this node's smallest diff, and doctrine
  edits are usually done by whichever pass actually changes the
  underlying behavior — that was `add-docker-support`, already SEALED);
  flagged for a future docs-only pass, same category as
  `update-project-docs`/#146.

## Seal gate

No outward-facing action taken (no commit/push). Only a local file edit:
1 existing test file extended under `src/__tests__/`. Pending verifier.

## Status

`sealed_pending_verifier`
