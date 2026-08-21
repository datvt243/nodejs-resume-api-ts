# 2026-08-21 — fix-v2-register-missing-await (plan + diff)

- Worker: implementer
- Version: 0.1.0
- Node: `fix-v2-register-missing-await` (`haven/diagrams/dev-loop.prime-mermaid.md`)
- Task (verbatim): "giờ new branch mới, chạy test lại toàn bộ các API đang có, và fix bug nếu có"

## Diagnostic (trước khi sửa)

`POST /api/v2/auth/register` (task: test toàn bộ API) trả:
```json
{"success":false,"message":"candidate validation failed: password: Cast to string failed for value \"Promise { <pending> }\" (type Promise) at path \"password\"","errors":null,"data":null}
```
HTTP 401.

Root cause: `src/api/v1/auth/services/register.ts:45` (đây là code của
route `POST /api/v2/auth/register` — `routers/api/v2/auth.route.ts` import
controller từ `@/api/v1/auth/controllers/index`, một implementation
Auth v2/WIP riêng biệt khỏi `src/auth/`):
```ts
const bcryptPwd = bcryptGenerateSalt(password); // thiếu await
```
`bcryptGenerateSalt` là `async` (`src/utils/bcrypt.ts:11`,
`Promise<string>`). Thiếu `await` → biến `bcryptPwd` là chính object
`Promise`, được gán thẳng vào field `password` khi `CandidateModel.create()`
→ Mongoose cast Promise → string thất bại → mọi request đăng ký qua v2
đều fail.

## Diff (smallest diff — 1 dòng, 1 file)

```diff
diff --git a/src/api/v1/auth/services/register.ts b/src/api/v1/auth/services/register.ts
index 97a05e2..0d62053 100644
--- a/src/api/v1/auth/services/register.ts
+++ b/src/api/v1/auth/services/register.ts
@@ -42,7 +42,7 @@ export const handlerRegister = async (item: Auth) => {
      * TODO: validate data với mongo model.valid
      */
 
-    const bcryptPwd = bcryptGenerateSalt(password);
+    const bcryptPwd = await bcryptGenerateSalt(password);
     const document = await CandidateModel.create({
       _id: null,
       email: email,
```

## Command

```
npm run build
```
Output: clean, no `tsc` errors.

```
npm test
```
Output:
```
Test Suites: 9 passed, 9 total
Tests:       45 passed, 45 total
Snapshots:   0 total
Time:        3.69 s, estimated 4 s
Ran all test suites.
```
(Không có test suite nào cover `src/api/v1/auth/` — file legacy này
không nằm trong `Testing` table của `CLAUDE.md`; verify chỉ qua build +
manual live test bên dưới.)

## Manual verification (npm run dev thật)

```
POST /api/v2/auth/register → {"success":true,"message":"Đăng ký thành công","errors":null,"data":null}  HTTP 200
POST /api/v2/auth/login    → {"success":true,"message":"Đăng nhập thành công", "data":{"user":{...},"token":"...","tokenRefresh":"..."}}  HTTP 200
```

## Acceptance

| Criterion | Evidence |
|---|---|
| Trace to exactly one diagram node | `fix-v2-register-missing-await` |
| Smallest diff | 1 dòng, 1 file |
| Exact test command run + output read back | `npm run build` clean; `npm test` → `45 passed, 45 total` |
| Live-tested fix | register + login v2 pasted above, cả hai 200 |
| Evidence note written | This file |

## Noticed, not done

- Không có unit test nào cho `src/api/v1/auth/` — out of scope thêm test
  mới cho node bug-fix này (`SmallestDiff`); nếu muốn coverage lâu dài
  nên là node riêng.
- Pattern `finally { return {...} }` trong cùng hàm nuốt gọn kết quả dù
  try có lỗi hay không — không phải bug (có `catch` riêng xử lý trước),
  không đổi.

## Seal gate

Không có hành động outward-facing. Chỉ sửa file local trên branch
`test-api-regression-2026-08-21`. Pending verifier.

## Status

`sealed_pending_verifier`
