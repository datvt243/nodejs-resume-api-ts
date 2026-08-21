# 2026-08-21 — fix-refresh-token-expiry-unused (plan + diff)

- Worker: implementer
- Version: 0.1.0
- Node: `fix-refresh-token-expiry-unused` (`haven/diagrams/dev-loop.prime-mermaid.md`)
- Task (verbatim): "giờ new branch mới, chạy test lại toàn bộ các API đang có, và fix bug nếu có"

## Diagnostic (trước khi sửa)

Login response: `token` và `tokenRefresh` decode ra payload IDENTICAL
`iat`/`exp` (chênh lệch 3600s cả hai — mặc định `1h` trong `jwtSign()`).
`grep -rn "TOKEN_EXP_IN" src/` (trước sửa) → chỉ xuất hiện ở
`process.config.ts` (khai báo + export), KHÔNG có chỗ nào dùng làm
`expiresIn` khi gọi `jwtSign()`. 3 call site gọi `jwtSign({ _id },
SECRET)` — chỉ 2 tham số, không có object `props` thứ 3 → luôn fallback
default `{ expiresIn: '1h' }` trong `utils/jwt.ts`.

Hệ quả: refresh token và access token hết hạn CÙNG LÚC → khi access token
hết hạn, refresh token cũng đã hết hạn → cơ chế refresh vô nghĩa trên
thực tế.

## Plan

Không có env var riêng cho thời hạn refresh token. Chọn: dùng
`TOKEN_EXP_IN` (đã có, đúng như doc mô tả "access token expiry") cho
access token; thêm hằng số `TOKEN_REFRESH_EXP_IN` (default `'7d'`, không
yêu cầu env var mới bắt buộc — đọc `process.env.TOKEN_REFRESH_EXP_IN` nếu
có, fallback `'7d'`) cho refresh token, đặt tại `process.config.ts` theo
đúng pattern export hiện có.

3 call site cần sửa (đều gọi `jwtSign({ _id }, SECRET)` × 2 — access +
refresh):
- `src/auth/auth.service.ts` (`handlerLogin`)
- `src/auth/auth.controller.ts` (`authRefreshToken` — rotate tokens)
- `src/api/v1/auth/services/login.ts` (v2/legacy login, dùng bởi
  `POST /api/v2/auth/login`)

Không sửa `src/api/v1/auth/controllers/refreshToken.ts` (cùng bug,
`jwtSign({ _id }, TOKEN_SECRET)` không có expiresIn) — file này KHÔNG
được route nào wire tới (`routers/api/v2/index.ts` chỉ có
`/register`, `/login`), dead code, `SmallestDiff` → không sửa.

## Diff

```diff
diff --git a/src/config/process.config.ts b/src/config/process.config.ts
index 417e319..8e7ecbc 100644
--- a/src/config/process.config.ts
+++ b/src/config/process.config.ts
@@ -31,6 +31,11 @@ const {
   MONGO_MIN_POOL_SIZE,
 } = process.env;
 
+// No dedicated env var for refresh-token lifetime; default it to
+// meaningfully outlive the access token (TOKEN_EXP_IN) so the refresh
+// flow (get a new access token once the old one expires) stays usable.
+const TOKEN_REFRESH_EXP_IN = process.env.TOKEN_REFRESH_EXP_IN || '7d';
+
 export {
   NODE_ENV,
   LOCAL_PORT,
@@ -41,6 +46,7 @@ export {
   TOKEN_SECRET,
   TOKEN_REFRESH,
   TOKEN_EXP_IN,
+  TOKEN_REFRESH_EXP_IN,
   REDIS_URL,
   MONGO_MAX_POOL_SIZE,
   MONGO_MIN_POOL_SIZE,
diff --git a/src/auth/auth.service.ts b/src/auth/auth.service.ts
index 63bd0e9..e131b44 100644
--- a/src/auth/auth.service.ts
+++ b/src/auth/auth.service.ts
@@ -6,7 +6,7 @@
 
 import CandidateModel from '@/models/candidate.model';
 import { bcryptGenerateSalt, bcryptCompareHash, jwtSign } from '@/utils';
-import { TOKEN_SECRET, TOKEN_REFRESH } from '@/config/process.config';
+import { TOKEN_SECRET, TOKEN_REFRESH, TOKEN_EXP_IN, TOKEN_REFRESH_EXP_IN } from '@/config/process.config';
 
 interface Auth {
   email: string;
@@ -76,8 +76,8 @@ export const handlerLogin = async (data: Auth) => {
   /**
    * init token
    */
-  const token = jwtSign({ _id }, TOKEN_SECRET);
-  const tokenRefresh = jwtSign({ _id }, TOKEN_REFRESH);
+  const token = jwtSign({ _id }, TOKEN_SECRET, { expiresIn: TOKEN_EXP_IN || '1h' });
+  const tokenRefresh = jwtSign({ _id }, TOKEN_REFRESH, { expiresIn: TOKEN_REFRESH_EXP_IN });
 
   return {
     success: true,
diff --git a/src/auth/auth.controller.ts b/src/auth/auth.controller.ts
index ab41bc6..cac16ab 100644
--- a/src/auth/auth.controller.ts
+++ b/src/auth/auth.controller.ts
@@ -12,7 +12,7 @@ import { handlerRegister, handlerLogin } from './auth.service';
 import { addToBlacklist, isBlacklisted } from '@/utils/tokenBlacklist';
 import { jwtSign, jwtVerify } from '@/utils';
 import { extractTokenFromRequest } from '@/utils/helper-auth';
-import { TOKEN_SECRET, TOKEN_REFRESH } from '@/config/process.config';
+import { TOKEN_SECRET, TOKEN_REFRESH, TOKEN_EXP_IN, TOKEN_REFRESH_EXP_IN } from '@/config/process.config';
 
 /**
  * Chức năng Đăng ký mới
@@ -122,8 +122,8 @@ export const authRefreshToken = async (req: Request, res: Response, next: NextFu
     await addToBlacklist(refreshToken);
 
     // create new tokens
-    const newAccess = jwtSign({ _id }, TOKEN_SECRET);
-    const newRefresh = jwtSign({ _id }, TOKEN_REFRESH);
+    const newAccess = jwtSign({ _id }, TOKEN_SECRET, { expiresIn: TOKEN_EXP_IN || '1h' });
+    const newRefresh = jwtSign({ _id }, TOKEN_REFRESH, { expiresIn: TOKEN_REFRESH_EXP_IN });
 
     return formatReturn(res, {
       statusCode: StatusCodes.OK,
diff --git a/src/api/v1/auth/services/login.ts b/src/api/v1/auth/services/login.ts
index 6d85d89..eaad12f 100644
--- a/src/api/v1/auth/services/login.ts
+++ b/src/api/v1/auth/services/login.ts
@@ -6,7 +6,7 @@
 
 import CandidateModel from '@/models/candidate.model';
 import { bcryptCompareHash, jwtSign } from '@/utils';
-import { TOKEN_SECRET, TOKEN_REFRESH } from '@/config/process.config';
+import { TOKEN_SECRET, TOKEN_REFRESH, TOKEN_EXP_IN, TOKEN_REFRESH_EXP_IN } from '@/config/process.config';
 
 interface Auth {
   email: string;
@@ -41,8 +41,8 @@ export const handlerLogin = async (data: Auth) => {
   /**
    * init token
    */
-  const token = jwtSign({ _id }, TOKEN_SECRET);
-  const tokenRefresh = jwtSign({ _id }, TOKEN_REFRESH);
+  const token = jwtSign({ _id }, TOKEN_SECRET, { expiresIn: TOKEN_EXP_IN || '1h' });
+  const tokenRefresh = jwtSign({ _id }, TOKEN_REFRESH, { expiresIn: TOKEN_REFRESH_EXP_IN });
 
   return {
     success: true,
diff --git a/src/__tests__/auth/auth.service.test.ts b/src/__tests__/auth/auth.service.test.ts
index 021623a..25f13d2 100644
--- a/src/__tests__/auth/auth.service.test.ts
+++ b/src/__tests__/auth/auth.service.test.ts
@@ -97,7 +97,7 @@ describe('auth.service', () => {
 
       expect(CandidateModel.findOne).toHaveBeenCalledWith({ email: 'test@example.com' });
       expect(bcrypt.bcryptCompareHash).toHaveBeenCalledWith('correctpass', mockUser.password);
-      expect(jwt.jwtSign).toHaveBeenNthCalledWith(1, { _id: 'user_id' }, expect.any(String));
+      expect(jwt.jwtSign).toHaveBeenNthCalledWith(1, { _id: 'user_id' }, expect.any(String), expect.objectContaining({ expiresIn: expect.any(String) }));
       expect(result).toEqual({
         success: true,
         message: 'Đăng nhập thành công',
```

Test update là bắt buộc: `jwtSign` giờ luôn gọi với 3 tham số (trước là
2), `toHaveBeenNthCalledWith` là strict-arity match nên assertion cũ fail
đúng như kỳ vọng (không phải regression — cập nhật assertion cho khớp
hành vi mới, có chủ đích).

## Command

```
npm run build
```
Output: clean, no `tsc` errors.

```
npm test
```
Lần chạy đầu (trước khi update test) — output nguyên văn:
```
FAIL src/__tests__/auth/auth.service.test.ts
  ● auth.service › handlerLogin › should login successfully with correct credentials
    expect(jest.fn()).toHaveBeenNthCalledWith(n, ...expected)
    n: 1
    Expected: {"_id": "user_id"}, Any<String>
    Received
    ->     1
              {"_id": "user_id"},
              "test-token-secret",
            + {"expiresIn": "7d"},
Test Suites: 1 failed, 8 passed, 9 total
Tests:       1 failed, 44 passed, 45 total
```
Sau khi update assertion (thêm expect thứ 3 cho `expiresIn`):
```
Test Suites: 9 passed, 9 total
Tests:       45 passed, 45 total
Snapshots:   0 total
Time:        4.188 s
Ran all test suites.
```

## Manual verification (npm run dev thật, decode JWT payload)

Login response, decode base64 payload của `token` và `tokenRefresh`:
```
access token:  {'_id': '...', 'iat': 1787304047, 'exp': 1787314847}   -> 10800s = 3h (khớp .env TOKEN_EXP_IN=3h)
refresh token: {'_id': '...', 'iat': 1787304047, 'exp': 1787908847}   -> 604800s = 7 ngày (khớp TOKEN_REFRESH_EXP_IN default)
```
Access và refresh giờ có thời hạn khác nhau, refresh dài hơn access —
đúng mục đích thiết kế.

## Acceptance

| Criterion | Evidence |
|---|---|
| Trace to exactly one diagram node | `fix-refresh-token-expiry-unused` |
| Smallest diff | 5 file (1 config + 3 call site + 1 test), mỗi thay đổi cần thiết |
| Exact test command run + output read back | `npm run build` clean; `npm test` → `45 passed, 45 total` (cả output fail-trước và pass-sau đã trích) |
| Live-verified fix | decode JWT payload thật, exp khác nhau đúng như kỳ vọng |
| Evidence note written | This file |

## Noticed, not done

- `src/api/v1/auth/controllers/refreshToken.ts` có cùng bug
  (`jwtSign({ _id }, TOKEN_SECRET)` không expiresIn) nhưng không route
  nào wire tới nó (`routers/api/v2/index.ts` chỉ có register/login) —
  dead code, không sửa (`SmallestDiff`).
- `.env.example`/docs chưa nhắc `TOKEN_REFRESH_EXP_IN` — biến này optional
  với default hợp lý (`7d`), không bắt buộc phải set; không cập nhật
  `.env.example` trong node này (ngoài scope, có thể làm riêng nếu cần).

## Seal gate

Không có hành động outward-facing. Chỉ sửa file local trên branch
`test-api-regression-2026-08-21`. Pending verifier.

## Status

`sealed_pending_verifier`
