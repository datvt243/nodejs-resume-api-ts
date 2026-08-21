# 2026-08-21 — fix-redis-init-blocks-dev-startup (plan + diff)

- Worker: implementer
- Version: 0.1.0
- Node: `fix-redis-init-blocks-dev-startup` (`haven/diagrams/dev-loop.prime-mermaid.md`)
- Task (verbatim): "giờ hãy chạy 'npm run dev' và giải quyết các bug cho tới khi run được"

## Node lookup

Task không khớp node PENDING sẵn có (`fix-chrome-executable-path`, không
liên quan tới startup). Theo flowchart `dev-loop.prime-mermaid.md`
(`exist -- no --> draft`): tạo node mới sau khi diagnostic xác nhận bug
thật trong `src/`.

## Diagnostic (trước khi có node — chỉ chạy, không sửa code)

1. `npm run dev` (Node hệ thống mặc định, `/opt/homebrew/bin/node`
   v25.9.0) crash ngay: `TypeError: Cannot read properties of undefined
   (reading 'prototype')` tại `node_modules/buffer-equal-constant-time`
   (dep của `jsonwebtoken`→`jwa`→`jws`). Root cause: `Buffer.SlowBuffer`
   bị xoá khỏi Node 24+; máy chạy v25.9.0 dù `package.json` engines khai
   `>=20.19.0 <23.0.0`. Đây là vấn đề PATH cá nhân (`~/.zshrc`), không
   phải bug repo — Homebrew's node che nvm's node vì dòng
   `export PATH="/opt/homebrew/bin:$PATH"` chạy sau khối load nvm. Đã sửa
   `~/.zshrc` (di chuyển khối load nvm xuống cuối, sau mọi PATH export)
   theo đúng khuyến nghị chính thức của nvm — không phải thay đổi trong
   phạm vi hub (dotfile cá nhân, ngoài `src/`), chỉ ghi lại ở đây để việc
   tái lập rerun sau này khỏi mất công debug lại.
2. Sau khi build/test/dev chạy bằng node đúng
   (`~/.nvm/versions/node/v20.18.0/bin/node`, xác nhận
   `typeof require('buffer').SlowBuffer === 'function'`), `npm run dev`
   không crash nữa nhưng **treo vĩnh viễn**: MongoDB connect OK, sau đó
   spam liên tục `[Redis] Connection error` (~1 lần/giây, vô hạn), server
   không bao giờ in `App listening on port` — port 3001 không mở
   (`lsof -i :3001` rỗng, `curl localhost:3001/health` connection
   refused).

## Code anchor (grep-verified)

`src/services/redis.ts:24,36` (trước sửa):
```ts
redisClient = createClient({ url: REDIS_URL });
...
await redisClient.connect();
```
`src/server.ts:125`: `await initRedis();` — chạy TRƯỚC `app.listen()`
(dòng 133) trong cùng hàm `runServer`, không có timeout hay
`Promise.race` nào bọc quanh.

`node_modules/@redis/client/dist/lib/client/socket.d.ts:26`: default
`reconnectStrategy: retries => Math.min(retries * 50, 500)` — retry vô
hạn khi socket không connect được (không có giới hạn số lần thử). Đây là
lý do log spam lặp mãi và `redisClient.connect()` Promise không bao giờ
resolve/reject khi Redis host unreachable liên tục (khác ECONNREFUSED tức
thời — ở đây do local Redis không chạy, kernel trả reject nhanh nhưng
strategy vẫn lặp lại connect tiếp).

`src/utils/timeout.ts:30`: `withRedisTimeout` (2000ms) đã tồn tại sẵn,
đúng mục đích, nhưng `grep -rn "withRedisTimeout" src/` (trước sửa) chỉ
match chính định nghĩa của nó — **0 chỗ dùng trong codebase**.

## Diff (smallest diff — chỉ `src/services/redis.ts`)

```diff
diff --git a/src/services/redis.ts b/src/services/redis.ts
index 73be943..ebb277e 100644
--- a/src/services/redis.ts
+++ b/src/services/redis.ts
@@ -6,6 +6,7 @@
 import { createClient, RedisClientType } from 'redis';
 import { REDIS_URL } from '@/config/process.config';
 import { logger } from '@/logger';
+import { withRedisTimeout } from '@/utils/timeout';
 
 let redisClient: RedisClientType | null = null;
 let isConnected = false;
@@ -21,7 +22,11 @@ export const initRedis = async () => {
   }
 
   try {
-    redisClient = createClient({ url: REDIS_URL });
+    // reconnectStrategy: false — default strategy retries forever
+    // (retries => Math.min(retries * 50, 500)), which kept initRedis()
+    // pending indefinitely when Redis is unreachable and blocked
+    // server.ts's `await initRedis()` from ever reaching app.listen().
+    redisClient = createClient({ url: REDIS_URL, socket: { reconnectStrategy: false } });
 
     redisClient.on('error', (err) => {
       logger.error('[Redis] Connection error', { err: err.message, stack: (err as Error).stack });
@@ -33,7 +38,7 @@ export const initRedis = async () => {
       isConnected = true;
     });
 
-    await redisClient.connect();
+    await withRedisTimeout(redisClient.connect());
   } catch (err) {
     logger.error('[Redis] Failed to initialize', { err: (err as Error).message, stack: (err as Error).stack });
     redisClient = null;
```

Hai thay đổi độc lập, cả hai cần thiết:
- `reconnectStrategy: false` — chặn vòng lặp retry vô hạn tại nguồn
  (dùng option có sẵn của thư viện `redis`, không tự viết logic retry).
- `withRedisTimeout(...)` — backstop đã có sẵn trong codebase, dùng đúng
  như `withDBTimeout` đang được dùng ở
  `src/candidate_profile/BaseService.ts` và
  `generalInformation.service.ts` (khớp idiom hiện có).

## Command

```
npm run build
```
(exact, copied from `agent-hub/doctrine/MEMORY.md`, run from
`/Users/_david/Workspace/Project/ResumeAPI/backend`, dùng
`~/.nvm/versions/node/v20.18.0/bin` trong PATH)

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
Test Suites: 9 passed, 9 total
Tests:       45 passed, 45 total
Snapshots:   0 total
Time:        5.536 s
Ran all test suites.
```
Tất cả 9 suite pass (trước đây, với node hệ thống sai version, 5/9 suite
fail vì `buffer-equal-constant-time` — nay dùng đúng node nvm nên pass
sạch, xác nhận gián tiếp phần diagnostic #1 ở trên).

## Manual verification (npm run dev thật)

Lệnh: `npm run dev` (từ `doctrine/MEMORY.md`, `Run locally`), PATH trỏ
tới `~/.nvm/versions/node/v20.18.0/bin`.

Output (nguyên văn):
```
[nodemon] starting `ts-node -r tsconfig-paths/register ./src/server.ts`
info: [MongoDB] Connected!
error: [Redis] Connection error {...}
error: [Redis] Failed to initialize {...}
info: App listening on port: 3001 - development
```
Redis lỗi ĐÚNG MỘT LẦN (không lặp), sau đó server tiếp tục và listen
port. Trước fix: log lỗi Redis lặp vô hạn (~1/giây), không bao giờ in
dòng "App listening".

`curl -m 3 http://localhost:3001/health`:
```
{"status":"ok","timestamp":"2026-08-21T09:00:41.367Z","uptime":9.989198042}
```
`lsof -i :3001` xác nhận process `node` đang LISTEN.

Server đã dừng sau khi verify (`pkill -f "ts-node ./src/server.ts"`) —
không để tiến trình chạy nền ngoài phiên.

## Acceptance

| Criterion | Evidence |
|---|---|
| Trace to exactly one diagram node | `haven/diagrams/dev-loop.prime-mermaid.md` PM status table, node `fix-redis-init-blocks-dev-startup` |
| Smallest diff | Chỉ `src/services/redis.ts`, 2 dòng thay đổi thật (1 import + 1 option object + 1 wrap) |
| Exact test command run + output read back | `npm run build` → clean. `npm test` → `Tests: 45 passed, 45 total` (pasted above) |
| `npm run dev` thực sự chạy được | Output + `curl /health` 200 OK + `lsof` xác nhận LISTEN (pasted above) |
| Evidence note written | File này |

## Noticed, not done

- Fix Node version mismatch (`~/.zshrc` PATH ordering) — đã sửa nhưng đây
  là dotfile cá nhân ngoài repo, không phải node trên diagram này. Ghi
  lại ở mục Diagnostic #1 để tránh mất công debug lại lần sau.
- `doctrine/domains/PROJECT.md` Traps table chưa có entry cho
  "Node version mismatch crashes buffer-equal-constant-time" dù đã được
  nhắc tới gián tiếp trong evidence note cũ
  (`evidence/implementer/2026-08-20/fix-chrome-executable-path-diff.md`).
  Không tự thêm ở đây (ngoài scope node này, tránh refactor thừa
  `SmallestDiff`) — gợi ý một node/task riêng để chính thức hoá trap này
  vào doctrine.

## Seal gate

Không có hành động outward-facing (không commit, không push). Chỉ sửa
file local (`src/services/redis.ts`, `agent-hub/haven/diagrams/...`,
`~/.zshrc` — dotfile cá nhân ngoài repo, đã có approval rõ ràng của user
qua `AskUserQuestion` trước khi sửa). Pending verifier.

## Status

`sealed_pending_verifier`
