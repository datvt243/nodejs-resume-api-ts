# 2026-08-20 — fix-chrome-executable-path

- Worker: implementer
- Version: 0.1.0
- Node: `fix-chrome-executable-path` (`haven/diagrams/dev-loop.prime-mermaid.md`)
- Task (verbatim): "fix-chrome-executable-path"

## Node lookup
Diagram `haven/diagrams/dev-loop.prime-mermaid.md`, PM status table — node
`fix-chrome-executable-path` = PENDING (seed node, only node on diagram).
Notes on diagram: "`src/services/createPDF.ts:14-25` — Chrome executable
path hardcoded, breaks PDF export in CI/Docker."

## Code anchor (grep-verified)
`src/services/createPDF.ts:13-25`:
```ts
const platform = os.platform();
let executablePath = '';

if (platform === 'win32') {
  executablePath = 'C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe';
} else if (platform === 'darwin') {
  executablePath = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
} else if (platform === 'linux') {
  executablePath = '/usr/bin/chromium-browser';
} else {
  _log('Hệ điều hành không được hỗ trợ.');
  process.exit(1);
}
```
Confirmed via `grep -rn "PUPPETEER\|executablePath\|CHROME" src/`: no
existing env var pattern anywhere else in `src/`.

## Dependency check
`package.json:50` → `"puppeteer": "^22.13.1"` — full `puppeteer` package
(not `puppeteer-core`), which bundles its own Chromium and downloads it at
install time. This means the hardcoded OS-path branches are unnecessary in
the common case: puppeteer can resolve its own bundled binary without any
`executablePath` being passed at all.

## Acceptance criteria (from trap in doctrine/domains/PROJECT.md)
"Dùng `puppeteer.executablePath()` hoặc env var"

## Plan (smallest diff)
Replace the OS-branching block with:
1. Read `process.env.PUPPETEER_EXECUTABLE_PATH` if set (operator override
   for CI/Docker where a system Chromium/Chrome must be pinned).
2. Otherwise, don't pass `executablePath` at all in `puppeteer.launch()`
   options — puppeteer resolves its own bundled Chromium automatically.
3. Remove the `process.exit(1)` unsupported-OS branch — it's dead once (1)
   and (2) cover every platform puppeteer already supports.

Files touched: `src/services/createPDF.ts` only (lines 13-25 region).
No other file needs a change — no existing env var name to reuse for this,
so introducing `PUPPETEER_EXECUTABLE_PATH` (puppeteer's own conventional
env var name, recognized by puppeteer itself as a fallback in some
versions, but here explicitly read since we're constructing the launch
options ourselves).

## Blockers
None for this node. (Standing blocker: `doctrine/MEMORY.md` Lint/typecheck
command is `<<FILL>>` — not needed for this change since acceptance here
is build + existing test suite, both of which have real commands.)
