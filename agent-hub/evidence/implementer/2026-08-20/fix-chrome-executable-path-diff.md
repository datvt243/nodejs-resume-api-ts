# 2026-08-20 — fix-chrome-executable-path (diff)

- Worker: implementer
- Version: 0.1.0
- Node: `fix-chrome-executable-path` (`haven/diagrams/dev-loop.prime-mermaid.md`)
- Task (verbatim): "fix-chrome-executable-path"

## Diff

| File | Why |
|---|---|
| `src/services/createPDF.ts` | Remove hardcoded per-OS Chrome executable paths (win32/darwin/linux) and the `process.exit(1)` crash on unrecognized platforms. Replace with an optional `PUPPETEER_EXECUTABLE_PATH` env var override; when unset, `puppeteer.launch()` is called with no `executablePath`, so `puppeteer` (full package, not `puppeteer-core` — confirmed `package.json:50` `"puppeteer": "^22.13.1"`) resolves its own bundled Chromium automatically on any platform, including CI/Docker. |

```diff
diff --git a/src/services/createPDF.ts b/src/services/createPDF.ts
index b04ad35..f205aed 100644
--- a/src/services/createPDF.ts
+++ b/src/services/createPDF.ts
@@ -1,31 +1,19 @@
 import puppeteer from 'puppeteer';
 // import open from 'open';
 
-import os from 'os';
 import { Response } from 'express';
-import { _log } from '@/utils';
 import { informationPersonal, Skill, Item, Language, Reference, Certificate, Award } from '@/types/candidate.type';
 
 export const createCV = async (data: Record<string, any>, res: Response) => {
   try {
     const URL = `src/public/pdf/`;
 
-    const platform = os.platform();
-    let executablePath = '';
-
-    if (platform === 'win32') {
-      executablePath = 'C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe';
-    } else if (platform === 'darwin') {
-      executablePath = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
-    } else if (platform === 'linux') {
-      executablePath = '/usr/bin/chromium-browser';
-    } else {
-      _log('Hệ điều hành không được hỗ trợ.');
-      process.exit(1);
-    }
+    // Optional override for CI/Docker where a specific Chrome/Chromium must be pinned.
+    // Unset: puppeteer resolves its own bundled Chromium automatically.
+    const executablePath = process.env.PUPPETEER_EXECUTABLE_PATH;
 
     const otp = {
-      executablePath,
+      ...(executablePath ? { executablePath } : {}),
       headless: true,
       args: ['--no-sandbox', '--disable-setuid-sandbox'],
     };
```

`os` and `_log` imports removed because their only usages in this file were
inside the deleted branches (verified: `grep -n "^import os\|\bos\."` and
`grep -n "_log"` on the file before edit both showed exactly one usage
site each, both inside the removed block).

## Command
```
npm run build
```
(exact, copied from `agent-hub/doctrine/MEMORY.md`, run from
`/Users/_david/Workspace/Project/ResumeAPI/backend`)

## Output
```
> nodejs-resume-api@1.0.0 build
> tsc && npm run copy


> nodejs-resume-api@1.0.0 copy
> cp -R ./src/views ./src/public ./dist/
```
No `tsc` errors. Exit clean.

## Command
```
npm test
```
(exact, copied from `agent-hub/doctrine/MEMORY.md`)

## Output
```
Test Suites: 5 failed, 4 passed, 9 total
Tests:       13 passed, 13 total
Snapshots:   0 total
Time:        4.077 s
Ran all test suites.
```
All 5 failing suites fail with the identical stack trace, none of it
touching `createPDF.ts`:
```
FAIL src/__tests__/middlewares/verifyToken.test.ts
  ● Test suite failed to run
    TypeError: Cannot read properties of undefined (reading 'prototype')
       7 | import jwt from 'jsonwebtoken';
         | ^
      at Object.<anonymous> (node_modules/buffer-equal-constant-time/index.js:37:35)
```
(same trace, different entry file, for: verifyToken.test.ts,
refreshToken.test.ts, auth.controller.test.ts, bcrypt.test.ts,
auth.service.test.ts)

Confirmed no test file references the edited module:
```
$ grep -rln "createPDF\|createCV\|pageRender" src/__tests__
(no output, exit 1)
```

This is a pre-existing local-environment defect (this machine's installed
Node version is newer than what `buffer-equal-constant-time`, a transitive
dep of `jsonwebtoken` via `jws`→`jwa`, supports — `Buffer.SlowBuffer` was
removed) — unrelated to this diff, does not touch any file this diff
changed, and was present before this edit (not verified against
pre-edit HEAD in this note, but the traceback origin — `jsonwebtoken`
require chain — has zero overlap with `createPDF.ts`'s import graph:
`puppeteer`, `express`, `@/types/candidate.type`).

## Acceptance

| Criterion | Evidence |
|---|---|
| Trace to exactly one diagram node | `haven/diagrams/dev-loop.prime-mermaid.md` PM status table, node `fix-chrome-executable-path` |
| Smallest diff (no refactor beyond acceptance) | Diff above touches only the executablePath block + 2 now-dead imports it left behind; rest of file (`pageRender`, `_helper`, `getHTMLLayout`, etc.) untouched |
| Exact test command run + output read back | `npm run build` → clean, no errors (pasted above). `npm test` → `Tests: 13 passed, 13 total` (pasted above) |
| Trap resolved per `doctrine/domains/PROJECT.md` | Trap said "Dùng `puppeteer.executablePath()` hoặc env var" — implemented via env var (`PUPPETEER_EXECUTABLE_PATH`), no more hardcoded per-OS paths, no more `process.exit(1)` on unrecognized platform |
| Evidence note written | This file + `fix-chrome-executable-path-plan.md` |

## Noticed, not done
- `Test Suites: 5 failed` — all 5 failures share one root cause
  (`buffer-equal-constant-time` incompatible with this machine's Node
  version via `jsonwebtoken`), unrelated to `createPDF.ts`. Not fixed
  here — out of scope for this node, and CI (GitHub Actions, Node
  20.x/22.x) is unaffected by this local-only issue per earlier work this
  session on the `nodejs-resume-api-ts` repo (Render deploy investigation
  capped `engines.node` to `<23.0.0` for the same reason). Flagging for a
  future `doctrine/domains/PROJECT.md` trap entry — not adding it myself
  in this node's diff (would violate `SmallestDiff`).
- `src/services/createPDF.ts:154` — pre-existing unused-variable lint hint
  (`'skills' is declared but its value is never read`), unrelated line,
  not touched by this diff.

## Seal gate
No outward-facing action taken (no commit, no push). Local file edit only,
pending verifier.

## Status
`sealed_pending_verifier`
