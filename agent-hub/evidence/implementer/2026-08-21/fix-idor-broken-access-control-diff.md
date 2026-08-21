# 2026-08-21 — fix-idor-broken-access-control (plan + diff)

- Worker: implementer
- Version: 0.1.0
- Node: `fix-idor-broken-access-control` (`haven/diagrams/dev-loop.prime-mermaid.md`)
- Task (verbatim): "giờ new branch mới, chạy test lại toàn bộ các API đang có, và fix bug nếu có"
- Severity: **Critical** — broken access control (IDOR) trên toàn bộ CRUD API xác thực.

## Node lookup

Phát hiện trong lúc test toàn bộ API surface (task yêu cầu) — không khớp
node PENDING nào có sẵn. Theo flowchart (`exist -- no --> draft`): tạo
node mới sau khi live-test xác nhận bug thật.

## Diagnostic (live test, chạy server thật, KHÔNG sửa code)

Root cause: `req.user._id` (set bởi `verifyToken.middleware.ts` từ JWT
payload) **không được đối chiếu ở bất kỳ đâu** trong toàn bộ
`candidate_profile/*` và `candidate/candidate.service.ts`. `grep -rn
"req.user" src/candidate_profile/ src/routers/api/v1/*.route.ts` (trước
sửa) → 0 match. Mọi list/create/update/delete tin `candidateId`/`_id`
client tự gửi trong `req.body`.

Live-test với 2 user thật (branch `test-api-regression-2026-08-21`,
server `npm run dev`, MongoDB local):

1. User A tạo education record ("secret record of user A").
2. User B (token riêng, hợp lệ, KHÔNG liên quan tới A) — gửi
   `candidateId` của A trong body của `GET /api/v1/education`:
   ```
   {"success":true,"data":[{... "description":"secret record of user A" ...}]}
   ```
   → B đọc được data của A.
3. User B **xoá được** education record của A qua
   `DELETE /api/v1/education/delete/:id` với `candidateId` của A trong
   body:
   ```
   {"success":true,"message":"Xoá thành công"}
   ```
   Verify lại bằng GET as A: record biến mất.
4. User B **ghi đè toàn bộ profile** của A qua
   `PUT /api/v1/candidate/update` với `_id` của A trong body:
   ```
   {"success":true,"data":{"_id":"<A's id>","firstName":"HACKED","lastName":"ByUserB", ...}}
   ```
   → profile A bị đổi thành "HACKED"/"ByUserB"/địa chỉ "pwned".

Root cause cụ thể theo từng file:
- `BaseController.ts` `baseGetAll`: `const { candidateId } = req.body` — client-controlled.
- `BaseController.ts` `baseDelete`: `userID: req.body.candidateId || ''` — client-controlled, và `services/index.ts` `baseDeleteDocument` CHECK `candidateId.toString() !== userID` nhưng `userID` đã bị spoof từ nguồn nên check vô nghĩa.
- `services/index.ts` `baseUpdateDocument`: **hoàn toàn không có ownership check** nào — chỉ check document `_id` tồn tại, không check `candidateId` của document đó khớp người update.
- `candidate/candidate.service.ts` `handlerUpdate`: chỉ check `_id` tồn tại (`MODEL.findById(item._id)`), không check `item._id === req.user._id`.
- `candidate_me/index.ts` `fnExportPDF`: `const _id = req.body.candidateId` — cùng lỗi, dùng làm Candidate `_id` để export PDF của bất kỳ ai.
- `generalInformation.controller.ts` `fnGet`: `req.body.candidateId` — cùng lỗi (không live-test riêng, cùng root cause).

## Plan (smallest diff đóng được toàn bộ lỗ hổng)

1. **`middlewares/verifyToken.middleware.ts`** — sau khi set `req.user`,
   ép `req.body.candidateId = _id` (ghi đè bất kể client gửi gì). Đây là
   điểm chặn trung tâm cho MỌI route dùng `verifyToken`/`verifyTokenByQuery`
   — đóng lỗ hổng list/create/export ở một chỗ duy nhất thay vì sửa từng
   controller.
2. **`services/index.ts` `baseUpdateDocument`** — thêm param `userID`,
   sau khi fetch document hiện có (`baseCheckDocumentById`), check
   `_existing.candidateId.toString() !== userID` → reject. Cần thiết
   RIÊNG vì (1) chỉ đảm bảo payload GỬI LÊN có candidateId đúng, không
   đảm bảo document ĐÍCH (theo `_id` trong payload) thuộc về user đó —
   nếu không có check này, user vẫn "cướp" được document người khác bằng
   cách update `_id` của họ kèm `candidateId` của chính mình.
3. **`candidate_profile/BaseService.ts`** `handlerUpdate(item, userID?)` —
   truyền `userID` xuống `baseUpdateDocument`.
4. **`candidate_profile/BaseController.ts`** `createCrudController.fnUpdate`
   — gọi `service.handlerUpdate(value, (req as any).user?._id)`; cập nhật
   type signature tương ứng.
5. **`generalInformation.controller.ts`** `fnUpdate`/`fnUpdateFields` —
   cùng thay đổi (controller riêng, không qua `createCrudController`).
6. **`candidate/candidate.controller.ts`** `fnUpdate`/`fnUpdateFields` —
   ép `value._id = (req as any).user?._id` trước khi gọi `handlerUpdate`
   (Candidate model dùng `_id` tự tham chiếu, không phải `candidateId`,
   nên fix (1) không tự động che được — cần fix riêng).
7. **`candidate_me/index.ts`** `fnExportPDF` — đổi `req.body.candidateId`
   thành `(req as any).user?._id` trực tiếp (route GET, không nên phụ
   thuộc vào middleware ghi `req.body` cho rõ ràng/chắc chắn).

Files touched: 7 file, tổng 46 dòng thêm / 15 dòng xoá (`git diff --stat`).
Không đổi bất kỳ file nào khác — `baseGetAll`/`baseDelete` (BaseController.ts)
KHÔNG cần sửa vì đã tin `req.body.candidateId`, và sau fix (1) giá trị đó
luôn đáng tin.

## Diff

```diff
diff --git a/src/candidate/candidate.controller.ts b/src/candidate/candidate.controller.ts
index 8e540f9..ac3cca3 100644
--- a/src/candidate/candidate.controller.ts
+++ b/src/candidate/candidate.controller.ts
@@ -35,9 +35,12 @@ export const fnUpdate = async (req: Request, res: Response, next: NextFunction)
 
   /**
    * update data
+   * Force _id to the authenticated user's own id — never trust a client-
+   * supplied _id here, or any authenticated user could overwrite another
+   * candidate's profile.
    */
   try {
-    const _result = await handlerUpdate(value);
+    const _result = await handlerUpdate({ ...value, _id: (req as any).user?._id });
     return formatReturn(res, { ..._result });
   } catch (err) {
     handleError(err, next);
@@ -56,10 +59,10 @@ export const fnUpdateFields = async (req: Request, res: Response, next: NextFunc
     return formatReturn(res, { statusCode: StatusCodes.UNAUTHORIZED, success: false, message: 'Xảy ra lỗi', errors });
 
   /**
-   * update data
+   * update data — force _id to the authenticated user (see fnUpdate)
    */
   try {
-    const _result = await handlerUpdate(value);
+    const _result = await handlerUpdate({ ...value, _id: (req as any).user?._id });
     return formatReturn(res, { ..._result });
   } catch (err) {
     handleError(err, next);
diff --git a/src/candidate_me/index.ts b/src/candidate_me/index.ts
index 958ecda..4e3464d 100644
--- a/src/candidate_me/index.ts
+++ b/src/candidate_me/index.ts
@@ -81,7 +81,9 @@ export const fnExportPDF = async (req: Request, res: Response, next: NextFunctio
    *
    */
 
-  const _id = req.body.candidateId;
+  // Use the authenticated user's own id — never a client-supplied one,
+  // or any authenticated user could export another candidate's PDF.
+  const _id = (req as any).user?._id;
   if (!_id) {
     res.status(StatusCodes.BAD_REQUEST).json(formatReturnFailed('CandidateId not found'));
     return;
diff --git a/src/candidate_profile/BaseController.ts b/src/candidate_profile/BaseController.ts
index 33d6a59..88fd8e5 100644
--- a/src/candidate_profile/BaseController.ts
+++ b/src/candidate_profile/BaseController.ts
@@ -65,7 +65,10 @@ export const baseDelete = async (req: Request, res: Response, next: NextFunction
 
 export const createCrudController = (props: {
   schema: Schema;
-  service: { handlerCreate: (item: Record<string, any>) => Promise<any>; handlerUpdate: (item: Record<string, any>) => Promise<any> };
+  service: {
+    handlerCreate: (item: Record<string, any>) => Promise<any>;
+    handlerUpdate: (item: Record<string, any>, userID?: string) => Promise<any>;
+  };
   booleanDefaultField?: string;
 }) => {
   const { schema, service, booleanDefaultField } = props;
@@ -89,7 +92,7 @@ export const createCrudController = (props: {
 
     try {
       if (booleanDefaultField && !value[booleanDefaultField]) value[booleanDefaultField] = false;
-      const _result = await service.handlerUpdate(value);
+      const _result = await service.handlerUpdate(value, (req as any).user?._id);
       return formatReturn(res, { ..._result });
     } catch (err) {
       handleError(err, next);
diff --git a/src/candidate_profile/BaseService.ts b/src/candidate_profile/BaseService.ts
index 207850c..c34942f 100644
--- a/src/candidate_profile/BaseService.ts
+++ b/src/candidate_profile/BaseService.ts
@@ -45,9 +45,9 @@ export const createCrudService = (props: { model: any; name?: string }) => {
     }
   };
 
-  const handlerUpdate = async (item: Record<string, any>) => {
+  const handlerUpdate = async (item: Record<string, any>, userID?: string) => {
     try {
-      return await withDBTimeout(baseUpdateDocument({ document: item, model: MODEL }));
+      return await withDBTimeout(baseUpdateDocument({ document: item, model: MODEL, userID }));
     } catch (error: any) {
       return { success: false, message: 'Failed to update document', error: error.message };
     }
diff --git a/src/candidate_profile/general_information/generalInformation.controller.ts b/src/candidate_profile/general_information/generalInformation.controller.ts
index 05b1f97..fe6eaf0 100644
--- a/src/candidate_profile/general_information/generalInformation.controller.ts
+++ b/src/candidate_profile/general_information/generalInformation.controller.ts
@@ -71,7 +71,7 @@ export const fnUpdate = async (req: Request, res: Response, next: NextFunction)
    */
 
   try {
-    const _result = await handlerUpdate(value);
+    const _result = await handlerUpdate(value, (req as any).user?._id);
     return formatReturn(res, { ..._result });
   } catch (err) {
     handleError(err, next);
@@ -94,7 +94,7 @@ export const fnUpdateFields = async (req: Request, res: Response, next: NextFunc
    */
 
   try {
-    const _result = await handlerUpdate(value);
+    const _result = await handlerUpdate(value, (req as any).user?._id);
     return formatReturn(res, { ..._result });
   } catch (err) {
     handleError(err, next);
diff --git a/src/middlewares/verifyToken.middleware.ts b/src/middlewares/verifyToken.middleware.ts
index dbb7ac9..fd7aca7 100644
--- a/src/middlewares/verifyToken.middleware.ts
+++ b/src/middlewares/verifyToken.middleware.ts
@@ -35,8 +35,15 @@ export const verifyToken = async (req: Request, res: Response, next: NextFunctio
       return next(new InvalidTokenError('Invalid token payload.'));
     }
 
-    // attach authenticated user info without mutating body
+    // Attach authenticated user info. Also force req.body.candidateId to the
+    // authenticated user's own _id, overwriting whatever the client sent —
+    // every candidate_profile handler (list/create/update/delete/export)
+    // trusts req.body.candidateId as the acting user, so leaving it
+    // client-controlled let any authenticated user read/write/delete any
+    // other user's data by supplying a different candidateId in the body.
     (req as any).user = { _id };
+    if (!req.body || typeof req.body !== 'object') req.body = {};
+    req.body.candidateId = _id;
     return next();
   } catch (err: any) {
     if (err?.name === 'TokenExpiredError' || err?.name === 'JsonWebTokenError') {
diff --git a/src/services/index.ts b/src/services/index.ts
index 95dafa3..7899d28 100644
--- a/src/services/index.ts
+++ b/src/services/index.ts
@@ -97,12 +97,13 @@ export const baseDeleteDocument = async (props: { model: any; _id: string; name:
 export const baseUpdateDocument = async (props: {
   document: Record<string, any>;
   model: any;
+  userID?: string;
   hookHasErrors?: (props: any) => void;
 }) => {
   /**
    * get values
    */
-  const { document, model: MODEL } = props;
+  const { document, model: MODEL, userID } = props;
 
   /**
    * @return
@@ -119,9 +120,19 @@ export const baseUpdateDocument = async (props: {
   /**
    * Check Document có tồn tại không -> findById
    */
-  const { isExist, message: _mess } = await _baseHelper().baseCheckDocumentById(MODEL, _id);
+  const { isExist, message: _mess, document: _existing } = await _baseHelper().baseCheckDocumentById(MODEL, _id);
   if (!isExist) return formatReturnFailed(_mess);
 
+  /**
+   * Kiểm tra doc cần update có thuộc người đang update hay không
+   * (đối chiếu owner của document ĐÃ TỒN TẠI, không phải candidateId gửi
+   * lên trong payload — nếu không, update có thể "cướp" document của
+   * người khác bằng cách gửi kèm candidateId của chính mình)
+   */
+  if (userID !== undefined && _existing?.candidateId !== undefined && _existing.candidateId.toString() !== userID) {
+    return formatReturnFailed('Không thể cập nhật thông tin không phải của bạn');
+  }
+
   /**
    * validate ở mongoose model
    */
```

## Command

```
npm run build
```
Output: clean, no `tsc` errors (had to fix 1 type signature in
`BaseController.ts` — `handlerUpdate` prop type needed the optional
second param added, TS caught it immediately: "Expected 1 arguments, but
got 2").

```
npm test
```
Output:
```
Test Suites: 9 passed, 9 total
Tests:       45 passed, 45 total
Snapshots:   0 total
Time:        3.883 s, estimated 6 s
Ran all test suites.
```

## Manual verification (live re-test of the exact exploit, post-fix)

Server: `npm run dev` (nvm node v20.18.0), 2 fresh users A/B (branch
`test-api-regression-2026-08-21`).

1. B lists A's education by spoofing `candidateId` in body:
   ```
   {"success":true,"message":"","errors":null,"data":[]}
   ```
   (before fix: returned A's real records)

2. B attempts to UPDATE A's education record (`_id` known, `candidateId`
   spoofed to A's... irrelevant now since middleware overwrites it to B's
   own id regardless):
   ```
   {"success":false,"message":"Không thể cập nhật thông tin không phải của bạn","errors":null,"data":null}
   ```
   HTTP 400. (before fix: would have succeeded)

3. B attempts to DELETE A's education record:
   ```
   {"success":false,"message":"Không thể xoá thông tin không phải của bạn","errors":null,"data":null}
   ```
   HTTP 400. (before fix: `{"success":true,"message":"Xoá thành công"}` — actually deleted)

4. A can still update own record (regression check):
   ```
   {"success":true,"message":"Cập nhật thành công", ...}
   ```
   HTTP 200.

5. B updates own candidate profile, sending a spoofed `_id:
   "000000000000000000000000"` in body — response's `_id` is B's REAL own
   id (`6a881717758ade31aff1e39f`), proving the spoofed `_id` was ignored
   and B only ever modified their own document:
   ```
   {"success":true, "data":{"_id":"6a881717758ade31aff1e39f", "firstName":"OnlyMyself", ...}}
   ```

`fnExportPDF` fix (candidate_me/index.ts) not live-retested separately
(same one-line root-cause pattern as the others, already proven fixed by
tests 1–5 above; low risk, single-variable-source change) — flagging this
explicitly rather than claiming it was verified live.

## Acceptance

| Criterion | Evidence |
|---|---|
| Trace to exactly one diagram node | `haven/diagrams/dev-loop.prime-mermaid.md`, node `fix-idor-broken-access-control` |
| Smallest diff that closes the hole | 7 files, each change necessary (see Plan section reasoning per file) — no unrelated refactor |
| Exact test command run + output read back | `npm run build` clean; `npm test` → `Tests: 45 passed, 45 total` |
| Original live-tested exploit now blocked | 5 manual re-tests above, verbatim output pasted |
| Evidence note written | This file |

## Noticed, not done

- `fnGetInformationById` in `candidate.controller.ts` (unrouted — no route
  in `candidate.route.ts` currently calls it) has the same
  no-select/no-ownership pattern but is dead code today; not touched
  (`SmallestDiff`, no live route exercises it).
- The `userID !== undefined` guard in `baseUpdateDocument` means any
  FUTURE caller that forgets to pass `userID` silently skips the
  ownership check rather than failing closed. Chose this over
  fail-closed to avoid a wider blast radius touching every caller
  signature in one node; flagging for `doctrine/domains/PROJECT.md`
  Traps as a follow-up hardening candidate.

## Seal gate

Không có hành động outward-facing (không commit, không push). Chỉ sửa
file local trên branch `test-api-regression-2026-08-21`. Pending
verifier.

## Status

`sealed_pending_verifier`
