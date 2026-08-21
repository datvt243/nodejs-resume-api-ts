# 2026-08-21 — feat-i18n-full-coverage (plan + diff)

- Worker: implementer
- Version: 0.1.0
- Node: `feat-i18n-full-coverage` (`haven/diagrams/dev-loop.prime-mermaid.md`)
- GitHub issue: #78 (giai đoạn 2/2 — hoàn tất phần "Noticed, not done" của giai đoạn 1)
- Task (verbatim): "làm nốt phần còn lại của #78"

## Scope (khớp đúng "Noticed, not done" ghi ở giai đoạn 1)

1. Joi validation messages (`config/joi.config.ts`, mọi `*.validate.ts`).
2. Mongoose `required` messages (8 model file, chạm qua `handleError`).
3. candidate/candidate_profile/CV section success/error messages (7 CV section + candidate + generalInformation).

## Kiến trúc

### 1. Joi validation — generic translator, không dựa vào `.messages()` hardcode

Thay vì sửa từng `.messages({...})` string trên từng schema (~13 file),
xây 1 hệm dịch tổng quát trong `utils/valid.ts`:
- `translateJoiDetail(detail, lang)`: lookup template theo
  `detail.type` (Joi error type code, vd `any.required`, `string.min`)
  trong `joiErrors` dict, thay `{{label}}` bằng label đã dịch (tra
  `fieldLabels` dict theo `detail.context.key`, fallback về label gốc
  của Joi nếu không có trong dict), thay `{{limit}}` bằng
  `detail.context.limit`.
- Nếu error type không có trong dict → fallback về `detail.message`
  (Joi tự render, degradation graceful thay vì crash).
- `.messages({...})` hardcode trên từng schema giờ là dead code (không
  còn được đọc) — **cố tình không xoá** (giảm rủi ro, giữ diff nhỏ; các
  block đó giờ vô hại, không ảnh hưởng logic).
- `validateSchema()` nhận thêm `lang` (default `'vi'`), truyền xuống
  `formatValidateError(error, lang)`.

Bao phủ TOÀN BỘ Joi error type đang dùng trong repo (khảo sát bằng
grep): `any.required`, `any.only`, `array.base`, `number.empty`,
`number.greater`, `number.min`, `object.base`, `objectId.base` (custom
Joi type), `string.email`, `string.empty`, `string.max`, `string.min`,
`string.pattern.base`.

**Đơn giản hoá có chủ đích**: `repassword`'s `any.only` message gốc là
"Password không khớp" (rất cụ thể) → generic template "{{label}} không
hợp lệ"/"is invalid" (ít cụ thể hơn). `number.greater` (chỉ 1 usage:
`endDate > startDate`) không parameterize qua `{{label}}`, dùng message
cố định "Ngày kết thúc phải lớn hơn ngày bắt đầu" — vì `context.limit`
của `number.greater` là 1 Joi ref structure, không phải giá trị đơn
giản để nội suy gọn.

### 2. Mongoose required messages — cùng cách, áp trong `handleError`

`utils/helper.ts`'s `handleError(err, next, lang)` — nhánh
`err.name === 'ValidationError'`: với mỗi `err.errors[field]` có
`.kind === 'required'`, dùng CÙNG `joiErrors['any.required']` template
+ `fieldLabels` dict (dùng chung với Joi, cùng 1 nguồn label). Field
khác (không phải `required`) fallback về `e.message` gốc — khảo sát
xác nhận TOÀN BỘ 8 model hiện tại chỉ dùng `required: [false/true,
'...']` tuple, không có `min`/`max`/`enum` ở tầng Mongoose, nên
`required` là type DUY NHẤT thực sự cần xử lý.

`handleError` cũng nhận `lang`, và 3 message khác trong cùng hàm
(`Invalid ID format`, `${field} already exists`, `Internal Server
Error` — TRƯỚC ĐÓ hardcode tiếng Anh bất kể ngôn ngữ, cùng loại "mixed
Vietnamese/English" mà #78 tồn tại để fix) → key mới `errors.*`.

Threading `lang` qua 20 call site `handleError(err, next)` → `handleError(err,
next, (req as any).lang)`, 8 file, bulk-replace (cùng pattern chính
xác, verify bằng build sau khi đổi).

### 3. candidate/CV section messages — cascade qua `services/index.ts`

`services/index.ts`'s 5 hàm base (`baseFindDocument`,
`baseCreateDocument`, `baseUpdateDocument`, `baseDeleteDocument`,
`basePatchDocument`) + `_baseHelper().baseCheckDocumentById` nhận
`lang`, dùng key mới `common.*` — vì được DÙNG CHUNG bởi cả 7 CV
section (qua `BaseService.ts`'s `createCrudService` factory), sửa 1
chỗ này cascade tự động ra toàn bộ education/experience/award/
certificate/project/reference/generalInformation, giống cách sửa
`joi.config.ts`'s shared export cascade ra 5 validate file ở giai đoạn
1.

`BaseController.ts` (`baseGetAll`, `baseDelete`, `createCrudController`),
`candidate.controller.ts`+`candidate.service.ts`, `generalInformation.controller.ts`+
`generalInformation.service.ts` (controller riêng, không qua
`createCrudController`) — thread `(req as any).lang` xuống, đổi
signature `handlerGet/handlerCreate/handlerUpdate/handlerDelete` thêm
tham số `lang` cuối (optional, default `'vi'`).

Phát hiện thêm 2 message hardcode tiếng Anh trong lúc sửa (cùng loại
inconsistency #78 fix): `BaseService.ts`'s catch-block messages
("Failed to fetch/create/update/delete document"),
`generalInformation.service.ts`'s "Candidate already has information,
can not save" — cả 2 giờ đã i18n.

## Bug phát hiện khi implement (bắt được nhờ live-test, không phải code review)

`t(key, lang)`'s dot-path walker (`getNested`, split key theo `.`, đi
từng cấp) coi TOÀN BỘ chuỗi key là 1 chain nesting đồng nhất. Nhưng Joi
error TYPE tự nó là chuỗi có dấu chấm (`any.required`,
`string.pattern.base`) — khi build key `joiErrors.${detail.type}` =
`"joiErrors.any.required"`, walker tách thành 3 cấp
(`joiErrors`→`any`→`required`) thay vì đúng ý là 2 cấp
(`joiErrors`→literal-key-"any.required"`). Lookup luôn fail, fallback
về `detail.message` gốc (không dịch) — **im lặng, không lỗi TypeScript,
không lỗi runtime** — chỉ lộ ra khi curl thật 2 ngôn ngữ và so sánh output
(field-level error message giống hệt nhau ở cả 2 header
`Accept-Language` dù message TỔNG (`"Dữ liệu không hợp lệ"` vs
`"Validation has errors"`) đã đúng — dấu hiệu rõ ràng phần field-level
dịch bị bỏ sót).

Fix: thêm `tErrorType(type, lang)` riêng trong `utils/i18n.ts` — lookup
PHẲNG (`locales[lang]?.joiErrors?.[type]`), không qua dot-path walker.
Dùng ở cả `utils/valid.ts` (Joi) và `utils/helper.ts` (Mongoose
required).

## Command

```
npm run build
```
Clean, no `tsc` errors (qua nhiều vòng sửa type — mỗi lần đổi signature
hàm, `tsc` bắt ngay các call site chưa cập nhật).

```
npm test
```
Trước khi sửa 2 assertion trong `valid.test.ts`:
```
Test Suites: 1 failed, 8 passed, 9 total
Tests:       2 failed, 43 passed, 45 total
```
(2 fail: `'Validation has errors'` → `'Dữ liệu không hợp lệ'`,
`'Invalid schema'` → `'Schema không hợp lệ'` — default language giờ
Vietnamese thống nhất, đúng chủ đích.)

Sau khi sửa:
```
Test Suites: 9 passed, 9 total
Tests:       45 passed, 45 total
Snapshots:   0 total
Time:        4.02 s
Ran all test suites.
```

## Manual verification (npm run dev thật, HTTP với header `Accept-Language`, trên database thật)

```
POST /auth/register thiếu field, vi:
  {"password":"Password là bắt buộc","repassword":"Xác nhận mật khẩu là bắt buộc","email":"Email không đúng định dạng email"}
POST /auth/register thiếu field, en:
  {"password":"Password is required","repassword":"Confirm password is required","email":"Email must be a valid email"}

POST /education/create thiếu field, vi:
  {"school":"Tên trường là bắt buộc","major":"Ngành học là bắt buộc","startDate":"Ngày bắt đầu là bắt buộc"}
POST /education/create thiếu field, en:
  {"school":"School name is required","major":"Major is required","startDate":"Start date is required"}

POST /education/create thành công, en → message: "Created successfully"
PUT  /education/update  thành công, vi → message: "Cập nhật thành công"
DEL  /education/delete   thành công, en → message: "Deleted successfully"

User B xoá record của User A, en → "You cannot delete information that is not yours"
User B xoá record của User A, vi → "Không thể xoá thông tin không phải của bạn"

POST /general-information/create lần 2 (đã có), en → "Candidate already has information, cannot save"
POST /general-information/create lần 2 (đã có), vi → "Candidate đã có thông tin, không thể lưu thêm"
```

Toàn bộ đúng theo `Accept-Language`, sau khi fix bug `tErrorType`
(trước fix: field-level error message giống hệt bất kể header — xem
mục "Bug phát hiện" ở trên).

## Database context

Chạy trên cùng database thật đã dùng suốt phiên hôm nay
(`davidapi.jhhu4ml.mongodb.net`, user đã xác nhận là database cá nhân,
đồng ý thao tác tự do). Tạo 4 tài khoản test
(`i18nfull*@example.com`, `i18nfull2*@example.com`) để test cross-user
+ CRUD, đã xoá sạch (cascade cả CV section data) sau khi verify xong —
xác nhận `Remaining total: 2` (chỉ còn 2 account thật:
`votan.it@gmail.com`, `david4d@gmail.com`).

## Acceptance

| Criterion | Evidence |
|---|---|
| Trace to exactly one diagram node | `feat-i18n-full-coverage` |
| Smallest diff cho scope đã định | Cascade qua shared functions thay vì sửa từng file lẻ (13 validate file, 7 CV section) |
| Exact test command run + output read back | `npm run build` clean; `npm test` → fail-trước (2 fail, lý do rõ) + pass-sau (`45 passed, 45 total`) |
| Live-tested cả 2 ngôn ngữ, nhiều luồng (Joi error, CRUD success/fail, ownership, generalInformation) | Output curl nguyên văn ở trên |
| Evidence note written | This file |

## Noticed, not done

- `.messages({...})` hardcode cũ trên từng schema giờ là dead code —
  chưa dọn (out of scope, `SmallestDiff`; không ảnh hưởng hành vi vì
  không còn được đọc).
- `sectionNames` (label loại CV section trong message "không phải của
  bạn", vd "học vấn"/"kinh nghiệm") — bỏ qua interpolation động, dùng
  message cố định thay vì dịch riêng từng tên section (đơn giản hoá có
  chủ đích, xem mục Kiến trúc #1).
- `api/v1/auth/controllers/refreshToken.ts` (v2 legacy, unrouted) —
  chỉ update `handleError` call site (mechanical, đã có sẵn trong bulk
  replace), KHÔNG thêm `lang` cho message riêng của nó — file này nằm
  trong scope "đề xuất xoá" của issue #77.
- Field label dictionary (`fieldLabels`) là danh sách hữu hạn khảo sát
  thủ công từ toàn bộ schema hiện có — field mới thêm sau này cần tự
  bổ sung vào dict, nếu không sẽ fallback về field key gốc (không lỗi,
  chỉ kém đẹp).

## Seal gate

Không có hành động outward-facing (không commit/push) tại thời điểm
viết note. Pending verifier.

## Status

`sealed_pending_verifier`
