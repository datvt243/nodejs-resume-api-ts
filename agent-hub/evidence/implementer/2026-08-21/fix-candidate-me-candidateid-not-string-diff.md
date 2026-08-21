# 2026-08-21 — fix-candidate-me-candidateid-not-string (plan + diff)

- Worker: implementer
- Version: 0.1.0
- Node: `fix-candidate-me-candidateid-not-string` (`haven/diagrams/dev-loop.prime-mermaid.md`)
- Task: phát hiện tình cờ trong lúc live-test feature #79 (multi-language resume content)
- Severity: **Critical** — public, unauthenticated data leak across ALL candidates.

## Diagnostic

Trong lúc test `GET /api/me/:email` cho một tài khoản test **mới toanh**
(0 CV data của chính nó), response lại trả về đúng dữ liệu thật của
`votan.it@gmail.com` (experiences, educations, generalInformation —
toàn bộ CV section data).

Root cause, `src/candidate_me/index.ts` `handlerGetAboutMe`:
```ts
const { _id } = document;              // document = raw Mongoose doc → _id là ObjectId INSTANCE, không phải string
...
const safeCandidateQuery = idQuerySafe.safeQuery({}, { candidateId: _id });
```
`QuerySafe.safeQuery()` (`utils/querySafe.ts:18`):
```ts
if (this.allowedFields.includes(key) && typeof value === 'string' && ...) {
  sanitized[key] = value.trim();
}
```
`value = _id` (ObjectId) → `typeof value === 'string'` → **false** →
`candidateId` bị loại khỏi `sanitized` một cách âm thầm → `safeCandidateQuery = {}`.
`model.find({}, {...})` với filter rỗng → trả về **TOÀN BỘ document trong
collection**, không phân biệt candidate nào — cho MỌI 7 CV section
model (`generalInformation`, `Experience`, `Education`, `Reference`,
`Project`, `Certificate`, `Award`) trong vòng lặp `getMoreInfo`.

Ảnh hưởng: `GET /api/me/:email` (public, KHÔNG cần token) và
`GET /api/v1/download-pdf` (dùng chung `handlerGetAboutMe`) — nghĩa là
**PDF CV xuất ra cũng bị trộn data của candidate khác**. Bug này tồn
tại từ trước, không liên quan gì tới bất kỳ thay đổi nào trong ngày
hôm nay — chỉ tình cờ lộ ra vì tạo đủ nhiều test data có nội dung phân
biệt được để nhận ra sự trộn lẫn.

## Diff (smallest diff — 1 dòng)

```diff
diff --git a/src/candidate_me/index.ts b/src/candidate_me/index.ts
--- a/src/candidate_me/index.ts
+++ b/src/candidate_me/index.ts
@@ -67,7 +67,13 @@
   for (const { collection, model } of getMoreInfo) {
     dataResult[collection] = [];
     const { idQuerySafe } = await import('@/utils/querySafe');
-    const safeCandidateQuery = idQuerySafe.safeQuery({}, { candidateId: _id });
+    // _id here is a Mongoose ObjectId instance (from the raw document,
+    // destructured before the JSON.parse/stringify flatten above), not a
+    // string. QuerySafe.safeQuery only accepts string values (typeof
+    // check) — passing the ObjectId directly made it silently drop the
+    // candidateId filter, so this query returned EVERY candidate's CV
+    // section data unfiltered.
+    const safeCandidateQuery = idQuerySafe.safeQuery({}, { candidateId: _id?.toString() || '' });
```

Đã grep toàn bộ các call site khác của `idQuerySafe.safeQuery`/
`candidateQuerySafe.safeQuery` (`services/index.ts:44,330`,
`candidate/candidate.service.ts:38`, `candidate_me/index.ts:45,141`) —
tất cả các chỗ khác đều nhận `string` hợp lệ từ input đã validate
(Joi `_id`, `req.body.candidateId`, hoặc tham số hàm khai báo kiểu
`string` tường minh) — đã verify gián tiếp qua toàn bộ testing của node
`fix-idor-broken-access-control` sáng nay (những path đó hoạt động đúng
trong mọi live-test). Chỉ riêng `handlerGetAboutMe` lấy `_id` trực tiếp
từ Mongoose document (không qua validate) nên mắc bug này.

## Command

```
npm run build
```
Clean, no `tsc` errors (1 lần fix: TS báo `_id` possibly null vì
`Candidate._id` optional trong schema — thêm `?.toString() || ''`).

```
npm test
```
```
Test Suites: 9 passed, 9 total
Tests:       45 passed, 45 total
```

## Manual verification (npm run dev thật, trên database thật — xem ghi
chú "Database context" bên dưới)

1. Trước fix: tài khoản test mới `mltest3+...@example.com` (0 CV data)
   → `GET /api/me/mltest3+...` trả về education/experience/generalInformation
   **giống hệt** `votan.it@gmail.com`.
2. Sau fix: tài khoản test mới `leakcheck+...@example.com` (0 CV data)
   → `GET /api/me/leakcheck+...`:
   ```
   educations: []
   experiences: []
   generalInformation: {}
   ```
3. Sau fix: `GET /api/me/votan.it@gmail.com` chỉ còn đúng data thật của
   họ — 1 education ("Cao đẳng kỹ thuật Cao Thắng"), 5 experience
   (JOBTEST/FASTCODING/VIETRY/ZAGO/Laidon Group) — không còn lẫn các
   record test/Lorem-ipsum từ candidate khác từng bị leak vào trước đó.

## Database context (quan trọng, correction cho note cũ)

`.env` local (`MONGOBD_USER`/`MONGOBD_PASSWORD`) trỏ tới
`davidapi.jhhu4ml.mongodb.net/resume-api` — cluster Atlas **thật**,
KHÔNG phải MongoDB local/dev riêng biệt. Toàn bộ "local" testing trong
suốt phiên hôm nay (bao gồm cả node `fix-idor-broken-access-control`
sáng nay) thực chất chạy trên database này. User xác nhận đây là
database cá nhân của họ, đồng ý cho thao tác tự do. Đã dọn toàn bộ test
account tạo ra trong lúc test (script trực tiếp qua Mongo driver, xoá
đúng theo email pattern, verify danh sách trước khi xoá, KHÔNG đụng
`votan.it@gmail.com`/`david4d@gmail.com`).

## Acceptance

| Criterion | Evidence |
|---|---|
| Trace to exactly one diagram node | `fix-candidate-me-candidateid-not-string` |
| Smallest diff | 1 dòng, 1 file |
| Exact test command run + output read back | `npm run build` clean; `npm test` → `45 passed, 45 total` |
| Live-tested leak now closed, real data unaffected | 3 bước manual verification trên, trên database thật |
| Evidence note written | This file |

## Seal gate

Không có hành động outward-facing (không commit/push) tại thời điểm
viết note này — sẽ gộp vào cùng PR với `feat-multilang-resume-content`
theo quyết định của user. Pending verifier.

## Status

`sealed_pending_verifier`
