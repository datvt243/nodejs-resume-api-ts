# 2026-08-21 — add-candidate-self-delete (plan + diff)

- Worker: implementer
- Version: 0.1.0
- Node: `add-candidate-self-delete` (`haven/diagrams/dev-loop.prime-mermaid.md`)
- Task (verbatim): "3" (chọn option 3 sau khi hỏi cách dọn 2 account test trên
  production: "Để tôi thêm tạm 1 endpoint DELETE /candidate (self-delete,
  dùng req.user._id) — nhưng đây là thay đổi code/API mới, không chỉ là
  dọn dẹp, cần qua flow bug-fix/feature bình thường")
- Loại: Feature (không phải bug fix).

## Node lookup

Không có node PENDING nào khớp (đây là feature mới, không phải bug tìm
thấy khi test API). Theo flowchart (`exist -- no --> draft`): tạo node
mới trước khi viết code.

## Motivation

Live-verify 5 fix bug trên production (phiên trước) đã tạo 2 tài khoản
test (`livecheck+...@example.com`, `livecheckB+...@example.com`) trên
DB production thật. Không có endpoint xoá Candidate nào tồn tại
(`candidate.route.ts` trước sửa chỉ có GET/PUT/PATCH), và không có quyền
truy cập trực tiếp Mongo production để dọn tay → cần thêm endpoint tự
xoá tài khoản.

## Plan (smallest diff)

- `DELETE /api/v1/candidate` (route mount `/candidate` đã có `verifyToken`
  ở `routers/api/v1/index.ts:25` — không cần thêm middleware).
- **Chỉ tự xoá** — `fnDelete` lấy `_id` DUY NHẤT từ `(req as any).user?._id`
  (không nhận id từ client ở bất kỳ đâu — path, query, body), đúng pattern
  IDOR-safe đã áp dụng ở `fnUpdate`/`fnUpdateFields` cùng file (node
  `fix-idor-broken-access-control`).
- **Cascade delete**: xoá luôn document ở cả 7 CV section model
  (generalInformation/experience/education/reference/project/certificate/
  award) theo `candidateId === _id`, tránh để lại orphaned data — nếu chỉ
  xoá Candidate mà không cascade, đây sẽ là một bug mới (data mồ côi)
  ngay từ ngày đầu ra mắt endpoint.
- Update Swagger doc comment (khớp style các route khác trong cùng file)
  và bảng API endpoint trong `CLAUDE.md` (Candidate section) — vì đây là
  API thật mới thêm, tài liệu cần khớp ngay, không phải scope creep.

Files touched: `src/candidate/candidate.service.ts`,
`src/candidate/candidate.controller.ts`,
`src/routers/api/v1/candidate.route.ts`, `CLAUDE.md` (doc).

## Diff

```diff
diff --git a/src/candidate/candidate.service.ts b/src/candidate/candidate.service.ts
--- a/src/candidate/candidate.service.ts
+++ b/src/candidate/candidate.service.ts
@@ -4,11 +4,23 @@
  * Description:
  */
 
-import CandidateModel from '@/models/candidate.model';
+import * as MODELS from '@/models';
 import { validateModel } from '@/utils';
 import { candidateQuerySafe } from '@/utils/querySafe';
 
-const MODEL = CandidateModel;
+const MODEL = MODELS.Candidate;
+
+// CV section models keyed by candidateId — deleted alongside the
+// candidate document itself so a self-delete doesn't leave orphaned data.
+const CV_SECTION_MODELS: any[] = [
+  MODELS.generalInformation,
+  MODELS.Experience,
+  MODELS.Education,
+  MODELS.Reference,
+  MODELS.Project,
+  MODELS.Certificate,
+  MODELS.Award,
+];
 
 export const handlerGetInformationById = async (id: string, props: { select: string } = { select: '' }) => {
@@ -65,3 +77,14 @@ export const handlerUpdate = async (item: Record<string, any>) => {
    */
   return { success: true, message: 'Cập nhật thành công', errors: {}, data: _find ? _find : {} };
 };
+
+export const handlerDelete = async (_id: string) => {
+  if (!(await MODEL.findById(_id))) {
+    return { success: false, message: 'ID không tồn tại' };
+  }
+
+  await Promise.all(CV_SECTION_MODELS.map((model) => model.deleteMany({ candidateId: _id })));
+  await MODEL.deleteOne({ _id }).exec();
+
+  return { success: true, message: 'Xoá tài khoản thành công', errors: {}, data: null };
+};

diff --git a/src/candidate/candidate.controller.ts b/src/candidate/candidate.controller.ts
--- a/src/candidate/candidate.controller.ts
+++ b/src/candidate/candidate.controller.ts
@@ -8,7 +8,7 @@ import { Request, Response, NextFunction } from 'express';
 import { StatusCodes } from 'http-status-codes';
 import { formatReturn, validateSchema, handleError } from '@/utils';
 import { schemaCandidate, schemaCandidatePatch } from '@/candidate/candidate.validate';
-import { handlerUpdate, handlerGetInformationByEmail, handlerGetInformationById } from '@/candidate/candidate.service';
+import { handlerUpdate, handlerDelete, handlerGetInformationByEmail, handlerGetInformationById } from '@/candidate/candidate.service';
 
 export const fnGetInformationById = async (req: Request, res: Response) => {
@@ -47,6 +47,19 @@ export const fnUpdate = async (req: Request, res: Response, next: NextFunction)
   }
 };
 
+export const fnDelete = async (req: Request, res: Response, next: NextFunction) => {
+  /**
+   * Self-delete only — always the authenticated user's own id, never a
+   * client-supplied one (see fnUpdate for the same IDOR-safety pattern).
+   */
+  try {
+    const _result = await handlerDelete((req as any).user?._id);
+    return formatReturn(res, { ..._result });
+  } catch (err) {
+    handleError(err, next);
+  }
+};
+
 export const fnUpdateFields = async (req: Request, res: Response, next: NextFunction) => {

diff --git a/src/routers/api/v1/candidate.route.ts b/src/routers/api/v1/candidate.route.ts
--- a/src/routers/api/v1/candidate.route.ts
+++ b/src/routers/api/v1/candidate.route.ts
@@ -7,7 +7,7 @@
 import express from 'express';
 const router = express.Router();
 
-import { fnGetInformationByEmail, fnUpdate, fnUpdateFields } from '@/candidate/candidate.controller';
+import { fnGetInformationByEmail, fnUpdate, fnUpdateFields, fnDelete } from '@/candidate/candidate.controller';
@@ -91,4 +91,22 @@ router.put('/update', fnUpdate);
  */
 router.patch('/update', fnUpdateFields);
 
+/**
+ * @swagger
+ * /api/v1/candidate:
+ *   delete:
+ *     tags: [Candidate]
+ *     summary: Delete the authenticated candidate's own account (and all their CV section data)
+ *     security:
+ *       - bearerAuth: []
+ *     responses:
+ *       200:
+ *         description: Account deleted
+ *         content:
+ *           application/json:
+ *             schema:
+ *               $ref: '#/components/schemas/ApiResponse'
+ */
+router.delete('/', fnDelete);
+
 export default router;

diff --git a/CLAUDE.md b/CLAUDE.md
--- a/CLAUDE.md
+++ b/CLAUDE.md
@@ -171,6 +171,7 @@
 | GET | `/:email` | Get profile by email |
 | PUT | `/update` | Full update |
 | PATCH | `/update` | Partial update |
+| DELETE | `/` | Delete own account + all CV section data (self only, via `req.user._id`) |
```

## Command

```
npm run build
```
Output: clean, no `tsc` errors. (1 lần fix type: `CV_SECTION_MODELS` cần
khai báo `: any[]` — TS không tự union được các Mongoose `Model<T>` khác
schema, giống pattern `modelObject: { [key: string]: any }` đã có sẵn ở
`BaseController.ts`.)

```
npm test
```
Output:
```
Test Suites: 9 passed, 9 total
Tests:       45 passed, 45 total
Snapshots:   0 total
Time:        3.921 s, estimated 5 s
Ran all test suites.
```

## Manual verification (npm run dev thật)

1. Tạo user A, tạo 1 education record cho A.
2. `GET /education` (A) trước xoá: `data: [{...1 record...}]`.
3. `DELETE /api/v1/candidate` (A): `{"success":true,"message":"Xoá tài khoản thành công",...}` HTTP 200.
4. `GET /education` (cùng token A, vẫn hợp lệ về mặt JWT signature) sau xoá: `data: []` — xác nhận cascade delete xoá cả education record.
5. `GET /api/v1/candidate/:email` (A) sau xoá: `{"success":false,"message":"Không tìm thấy người dùng",...}` HTTP 400 — xác nhận Candidate document đã bị xoá thật.

## Acceptance

| Criterion | Evidence |
|---|---|
| Trace to exactly one diagram node | `add-candidate-self-delete` |
| Smallest diff cho scope đã định (self-delete + cascade) | 3 file code + 1 doc |
| Exact test command run + output read back | `npm run build` clean; `npm test` → `45 passed, 45 total` |
| Live-tested: xoá thành công + cascade + không truy cập lại được | 5 bước manual verification trên |
| Evidence note written | This file |

## Noticed, not done

- Không thêm test unit mới cho `handlerDelete`/`fnDelete` — `Testing`
  table trong `CLAUDE.md` hiện chỉ cover auth/middleware/utils/db, không
  có test riêng cho `candidate.service.ts` (`handlerUpdate` cũng không có
  test). Giữ nhất quán với phần còn lại của file, không tự thêm coverage
  mới ngoài scope node này.
- Endpoint không có confirmation step (vd. yêu cầu nhập lại password) —
  chấp nhận được cho mục đích hiện tại (dọn tài khoản test), nhưng nếu
  dùng cho user thật trong tương lai nên cân nhắc thêm bước xác nhận.

## Seal gate

Không có hành động outward-facing (không commit, không push, không gọi
DELETE trên production ở bước implementer). Chỉ sửa file local. Pending
verifier. **Bước tiếp theo sau seal**: merge + deploy, rồi gọi
`DELETE /api/v1/candidate` trên production 2 lần (1 lần mỗi token test)
để dọn 2 account `livecheck+...`/`livecheckB+...` — đó LÀ hành động
outward-facing thật, sẽ xin approval riêng trước khi gọi.

## Status

`sealed_pending_verifier`
