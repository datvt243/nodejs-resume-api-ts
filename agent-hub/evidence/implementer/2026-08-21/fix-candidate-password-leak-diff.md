# 2026-08-21 — fix-candidate-password-leak (plan + diff)

- Worker: implementer
- Version: 0.1.0
- Node: `fix-candidate-password-leak` (`haven/diagrams/dev-loop.prime-mermaid.md`)
- Task (verbatim): "giờ new branch mới, chạy test lại toàn bộ các API đang có, và fix bug nếu có"

## Node lookup

Phát hiện trong lúc test `GET /api/v1/candidate/:email` (task: test toàn
bộ API). Không khớp node có sẵn → tạo node mới (cùng đợt với
`fix-idor-broken-access-control`).

## Diagnostic (trước khi sửa)

`GET /api/v1/candidate/:email` trả về:
```json
{"data":{"_id":"...","email":"...","password":"$2b$12$iIy65KoIHcYmezuZ675ce.VIXbp6MIG.hpz76DClc0v7vXLXMBrES", ...}}
```
`PUT /api/v1/candidate/update` cũng trả `password` nguyên trong response.

Root cause, 2 chỗ độc lập trong `src/candidate/candidate.service.ts`:

1. `handlerGetInformationByEmail` (dùng bởi `GET /:email`): `MODEL.findOne(safeEmailQuery).exec()` — **không có `.select()` nào cả**.
2. `handlerGetInformationById` (dùng bởi `handlerUpdate` để trả data sau khi PUT/PATCH): có cơ chế `select` nhưng bị bug double-wrap —
   ```ts
   const safeSelect = candidateQuerySafe.whitelistSelect(Object.keys(value)); // ở handlerUpdate, TRẢ VỀ 1 STRING đã join dấu cách, vd "firstName lastName phone"
   const _find = await handlerGetInformationById(value._id, { select: safeSelect });
   // bên trong handlerGetInformationById:
   const safeSelect = candidateQuerySafe.whitelistSelect([select]); // select đã là "firstName lastName phone" (1 string), bị wrap thành mảng 1 phần tử
   // whitelistSelect filter: this.allowedFields.includes(field) — field ở đây là CẢ CHUỖI "firstName lastName phone", không match field đơn lẻ nào trong allowedFields
   // → safeFields = [] → .join(' ') = "" → find.select("") = NO-OP → trả full document
   ```

## Diff (smallest diff — chỉ `src/candidate/candidate.service.ts`)

```diff
diff --git a/src/candidate/candidate.service.ts b/src/candidate/candidate.service.ts
index 1565c8e..ae08754 100644
--- a/src/candidate/candidate.service.ts
+++ b/src/candidate/candidate.service.ts
@@ -12,18 +12,19 @@ const MODEL = CandidateModel;
 
 export const handlerGetInformationById = async (id: string, props: { select: string } = { select: '' }) => {
   const { select = '' } = props;
-  const find = MODEL.findById(id);
-  if (select) {
-    const safeSelect = candidateQuerySafe.whitelistSelect([select]);
-    find.select(safeSelect);
-  }
-
+  // `select` here is already a whitelisted, space-joined field list (see
+  // callers) — re-wrapping it in candidateQuerySafe.whitelistSelect([select])
+  // treated the whole joined string as a single field name, which never
+  // matched the allow-list, silently making the select a no-op and
+  // returning the full document (including password) to every caller.
+  // Default to excluding password when no explicit select is given.
+  const find = MODEL.findById(id).select(select || '-password');
   return await find.exec();
 };
 
 export const handlerGetInformationByEmail = async (email: string) => {
   const safeEmailQuery = candidateQuerySafe.safeQuery({}, { email });
-  const find = await MODEL.findOne(safeEmailQuery).exec();
+  const find = await MODEL.findOne(safeEmailQuery).select('-password').exec();
   return find;
 };
```

Cách fix: bỏ logic double-wrap lỗi, gọi `.select()` trực tiếp với giá trị
`select` đã được whitelist SẴN từ caller (`handlerUpdate`, dòng 60-61,
không đổi) — hoặc mặc định `-password` khi không có `select` tường minh.
`handlerGetInformationByEmail` thêm `.select('-password')` trực tiếp
(route `GET /:email` không có khái niệm "select tường minh", luôn cần ẩn
password).

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
Time:        3.733 s, estimated 4 s
Ran all test suites.
```

## Manual verification (npm run dev thật)

1. `GET /api/v1/candidate/:email` (user mới đăng ký):
   ```json
   {"success":true,"data":{"_id":"6a8817b1b0cd6bf244fc4c6c","email":"...","firstName":"","lastName":"","gender":false,"marital":false,"birthday":0,"address":"","phone":"","introduction":"","createdAt":"...","updatedAt":"...","__v":0}}
   ```
   Không còn field `password`.

2. `PUT /api/v1/candidate/update` (gửi kèm `_id` placeholder — bị fix
   `fix-idor-broken-access-control` ép về `_id` thật của user trước khi
   tới `handlerUpdate`):
   ```json
   {"success":true,"message":"Cập nhật thành công","errors":{},"data":{"_id":"6a8817b1b0cd6bf244fc4c6c","firstName":"NoLeak","lastName":"Test","gender":true,"marital":false,"birthday":0,"address":"x","phone":"0912345678","introduction":"x"}}
   ```
   Không còn field `password`.

## Acceptance

| Criterion | Evidence |
|---|---|
| Trace to exactly one diagram node | `haven/diagrams/dev-loop.prime-mermaid.md`, node `fix-candidate-password-leak` |
| Smallest diff | 1 file, `src/candidate/candidate.service.ts`, 2 functions |
| Exact test command run + output read back | `npm run build` clean; `npm test` → `Tests: 45 passed, 45 total` |
| Live-tested leak now closed | GET + PUT responses pasted above, no `password` field |
| Evidence note written | This file |

## Noticed, not done

- `handlerGetInformationById` khi gọi KHÔNG qua `handlerUpdate` (vd. nếu
  tương lai có route wire tới `fnGetInformationById` — hiện đang là dead
  code, không có route) sẽ dùng default `select: ''` → fallback
  `-password` — đã an toàn by default, không cần sửa thêm gì.

## Seal gate

Không có hành động outward-facing. Chỉ sửa file local trên branch
`test-api-regression-2026-08-21`. Pending verifier.

## Status

`sealed_pending_verifier`
