# 2026-08-21 — fix-create-response-null-id (plan + diff)

- Worker: implementer
- Version: 0.1.0
- Node: `fix-create-response-null-id` (`haven/diagrams/dev-loop.prime-mermaid.md`)
- Task (verbatim): "giờ new branch mới, chạy test lại toàn bộ các API đang có, và fix bug nếu có"
- Severity: Minor.

## Diagnostic (trước khi sửa)

`POST /api/v1/education/create` (và mọi `POST .../create` khác dùng
`createCrudService`, kể cả `generalInformation`) trả:
```json
{"success":true,"data":{"_id":null, "school":"...", ...}}
```
`_id: null` dù bản ghi được lưu thật trong MongoDB với ObjectId hợp lệ
(xác nhận qua `GET` list sau đó thấy `_id` thật).

Root cause: `BaseService.ts`'s `hookAfterSave` callback nhận `{ data }`
qua destructuring-by-value từ object literal `{ success, message, data:
_data }` — gán lại `data = find` bên trong callback chỉ thay đổi biến
cục bộ trong scope của callback, KHÔNG propagate ngược lại `_data` ở
`baseCreateDocument` (`services/index.ts`). Do đó response luôn trả
nguyên kết quả thô `MODEL.create({ _id: null, ...document })` — và với
input `_id: null` tường minh, giá trị `_id` trong document JS trả về
ngay sau `.create()` vẫn là `null` (Mongoose/Mongo chỉ gán ObjectId thật
ở tầng lưu trữ, không phản ánh ngược lại object JS đã return trong
trường hợp này).

Chủ đích ban đầu của `hookAfterSave` rõ ràng là fetch lại TOÀN BỘ danh
sách bản ghi của candidate đó (`baseFindDocument(..., findOne: false)`)
và dùng làm response — matching cách `GET .../` trả về (array), không
phải chỉ 1 object vừa tạo.

## Diff

```diff
diff --git a/src/services/index.ts b/src/services/index.ts
--- a/src/services/index.ts
+++ b/src/services/index.ts
@@ -163,7 +174,7 @@ export const baseCreateDocument = async (props: {
   model: any;
   name: string;
   hookHasErrors?: (p: any) => Promise<void> | void;
-  hookAfterSave?: (document: any, prop: BaseReturn) => void;
+  hookAfterSave?: (document: any, prop: BaseReturn) => Promise<any> | any;
 }) => {
@@ -195,10 +206,16 @@ export const baseCreateDocument = async (props: {
   try {
     _data = await MODEL.create({ _id: null, ...document });
     /**
-     * callback thực hiện sau khi thêm mới thành công
+     * callback thực hiện sau khi thêm mới thành công. Nếu hook trả về
+     * (khác undefined), dùng giá trị đó thay _data — trước đây hook nhận
+     * `data` qua destructure-by-value nên gán lại bên trong hook không hề
+     * cập nhật _data ở đây, khiến response luôn trả nguyên kết quả thô của
+     * MODEL.create() (Mongoose giữ `_id: null` như đã truyền, thay vì id
+     * thật mà MongoDB gán khi lưu) thay vì list mới đã refetch.
      */
     if (props?.hookAfterSave) {
-      await props.hookAfterSave?.(document, { success: _success, message: _message, data: _data });
+      const replacement = await props.hookAfterSave(document, { success: _success, message: _message, data: _data });
+      if (replacement !== undefined) _data = replacement;
     }
   } catch (err) {

diff --git a/src/candidate_profile/BaseService.ts b/src/candidate_profile/BaseService.ts
--- a/src/candidate_profile/BaseService.ts
+++ b/src/candidate_profile/BaseService.ts
@@ -25,7 +25,7 @@ export const createCrudService = (props: { model: any; name?: string }) => {
           document: { ...item },
           model: MODEL,
           name,
-          hookAfterSave: async (doc, { data }) => {
+          hookAfterSave: async (doc) => {
             const { success, data: find } = await withDBTimeout(
               baseFindDocument({
                 model: MODEL,
@@ -33,7 +33,7 @@ export const createCrudService = (props: { model: any; name?: string }) => {
                 findOne: false,
               }),
             );
-            success && (data = find);
+            return success ? find : undefined;
           },

diff --git a/src/candidate_profile/general_information/generalInformation.service.ts b/src/candidate_profile/general_information/generalInformation.service.ts
--- a/src/candidate_profile/general_information/generalInformation.service.ts
+++ b/src/candidate_profile/general_information/generalInformation.service.ts
@@ -50,7 +50,7 @@ export const handlerCreate = async (document: Record<string, any>) => {
         document: { ...document },
         model: MODEL,
         name: NAME,
-        hookAfterSave: async (doc, { data }) => {
+        hookAfterSave: async (doc) => {
           const { success, data: find } = await withDBTimeout(
             baseFindDocument({
               model: MODEL,
@@ -58,7 +58,7 @@ export const handlerCreate = async (document: Record<string, any>) => {
             }),
           );
-          success && (data = find);
+          return success ? find : undefined;
         },
```

(`services/index.ts` diff ở trên chỉ trích phần `baseCreateDocument` liên
quan node này — phần `baseUpdateDocument`/`userID` cùng file đã có
evidence riêng ở node `fix-idor-broken-access-control`, cùng đợt sửa nên
nằm chung 1 lần `git diff`, không lặp lại ở đây.)

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
Time:        3.484 s, estimated 4 s
Ran all test suites.
```

## Manual verification (npm run dev thật)

`POST /api/v1/education/create`:
```json
{"success":true,"message":"Thêm mới học vấn thành công","errors":{},"data":[{"_id":"6a881965ebffacd2551c3efe","school":"Fixed Id Test University", ..., "candidateId":"6a881964ebffacd2551c3efb", ...}]}
```
`_id` giờ là ObjectId thật (trước: `null`). Response shape đổi từ single
object → array (khớp đúng ý đồ gốc của `hookAfterSave`: refetch toàn bộ
list theo candidateId, giống format của `GET .../`).

## Acceptance

| Criterion | Evidence |
|---|---|
| Trace to exactly one diagram node | `fix-create-response-null-id` |
| Smallest diff | 3 file, đổi đúng chỗ hook nhận/trả giá trị |
| Exact test command run + output read back | `npm run build` clean; `npm test` → `45 passed, 45 total` |
| Live-tested fix | create response pasted above, `_id` thật |
| Evidence note written | This file |

## Noticed, not done

- Response shape đổi từ object → array cho MỌI `POST .../create` (7 CV
  section + generalInformation) — đây là thay đổi **breaking** cho bất
  kỳ client nào đang parse `data` như 1 object đơn. Đã note rõ vì đây là
  hệ quả trực tiếp của việc fix bug (khôi phục đúng ý đồ gốc của code),
  không phải side-effect ẩn — nhưng client (frontend) cần biết để cập
  nhật nếu có.

## Seal gate

Không có hành động outward-facing. Chỉ sửa file local trên branch
`test-api-regression-2026-08-21`. Pending verifier.

## Status

`sealed_pending_verifier`
