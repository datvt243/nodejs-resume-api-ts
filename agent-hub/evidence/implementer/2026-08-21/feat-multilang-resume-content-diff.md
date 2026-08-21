# 2026-08-21 — feat-multilang-resume-content (plan + diff)

- Worker: implementer
- Version: 0.1.0
- Node: `feat-multilang-resume-content` (`haven/diagrams/dev-loop.prime-mermaid.md`)
- GitHub issue: #79
- Task (verbatim): "1. áp dụng i18n / 2. resume có thể lưu đa ngôn ngữ" →
  scoped down to #79 only (i18n cho API messages là issue #78 riêng,
  chưa làm trong node này).

## Scope decisions (chốt qua AskUserQuestion trước khi code)

1. **Field nào localize**: chỉ field mô tả tự do — `Candidate.introduction`,
   `description` ở Education/Experience/Award/Certificate/Project,
   `generalInformation.career`/`careerGoal`. KHÔNG đụng field tên
   riêng/label ngắn (`school`/`company`/`major`/`position`/`positionDesired`/
   `levelCurrent`/`levelDesired`/`education`/`workLocation`/`workForm`) —
   `positionDesired` ban đầu định đưa vào nhưng phát hiện nó dùng chung
   Joi validator `position` với `Experience.position` (chức danh, không
   phải mô tả), nên loại ra khỏi scope.
2. **Tập ngôn ngữ**: cố định `vi`/`en` — `{ vi: string, en: string }`.
3. **Migration**: có data thật cần migrate — viết script riêng, chạy
   thật trước khi deploy (xem mục Migration bên dưới).

## Diff

### 1. `models/part/index.ts` — sub-schema tái sử dụng
```diff
+export const localizedTextSchema = new Schema(
+  {
+    vi: { type: String, default: '' },
+    en: { type: String, default: '' },
+  },
+  { _id: false },
+);
```

### 2. 7 model — đổi field sang `localizedTextSchema`
`candidate.model.ts` (`introduction`), `education.model.ts`,
`experience.model.ts`, `award.model.ts`, `certificate.model.ts`,
`project.model.ts` (`description`), `generalInformation.model.ts`
(`career`, `careerGoal`) — mỗi file: `{ type: String, default: '', ... }`
→ `{ type: localizedTextSchema, default: () => ({}) }`. (Diff đầy đủ:
xem `git log`/PR — 7 file, ~2 dòng mỗi file, lặp lại cùng 1 pattern.)

### 3. `config/joi.config.ts` — validator dùng chung
`description`, `descriptionOptional`, `introduction` đổi từ
`Joi.string()` sang `Joi.object({ vi: Joi.string().allow(''), en: Joi.string().allow('') })`.
Vì 3 export này được TÁI SỬ DỤNG bởi `education.validate.ts`,
`experience.validate.ts`, `award.validate.ts`, `certificate.validate.ts`,
`project.validate.ts` (không định nghĩa riêng), sửa 1 chỗ này cascade
đúng ra cả 5 file mà không cần đụng từng file.

### 4. `candidate/candidate.validate.ts`
`introduction` trước đó định nghĩa TRÙNG LẶP inline (`Joi.string().required()...`)
thay vì dùng export chung — nay import + dùng `introduction` từ
`joi.config.ts` (xoá bản duplicate, giờ chỉ có 1 nguồn sự thật).

### 5. `generalInformation.validate.ts`
`career`/`careerGoal` trước dùng `_stringDefault({min,max,title})`
(short-label validator) → nay dùng `description.label(...)` (giữ đúng
label riêng cho message lỗi, ví dụ "Nghề nghiệp là bắt buộc" thay vì
"Mô tả là bắt buộc" chung chung).

### 6. `candidate_me/index.ts` — resolve `?lang=` cho public-facing reads
- `resolveLocalizedText(value, lang)`: helper mới, ưu tiên `value[lang]`,
  fallback ngôn ngữ còn lại nếu rỗng.
- `fnGetAboutMe`/`fnExportPDF`: đọc `req.query.lang` (`'en'` hoặc mặc
  định `'vi'`), truyền vào `handlerGetAboutMe(email, lang)`.
- `handlerGetAboutMe`: sau khi build `dataResult`, resolve
  `introduction`, mỗi `description` trong 5 mảng CV section, và
  `generalInformation.career`/`careerGoal` xuống string đơn.
- **Authenticated CRUD KHÔNG đổi** — `GET /education` v.v. vẫn trả
  nguyên `{vi, en}` để owner tự sửa cả 2 ngôn ngữ.

### 7. Swagger docs
Thêm query param `lang` (optional, enum `[vi, en]`, default `vi`) vào
`/api/me/{email}` (`routers/index.ts`) và `/api/v1/download-pdf`
(`routers/api/v1/index.ts`).

### 8. Migration script — `src/scripts/migrate-localize-text-fields.ts`
- Dùng `Model.updateMany({ $expr: { $eq: [{ $type: "$field" }, "string"] } }, [{ $set: { field: { vi: "$field", en: "" } } }])`
  — MongoDB aggregation-pipeline update: chỉ match doc mà field ĐANG là
  string (chưa migrate), wrap giá trị hiện có vào `{ vi: <giá trị cũ>, en: '' }`
  ngay trong 1 query, KHÔNG cần fetch-loop-write từng document.
- **Idempotent**: chạy lại lần 2 → tất cả field đã là object → điều
  kiện `$type: "string"` không match → 0 document nào bị đổi thêm.
- npm script: `npm run migrate:localize-text`.

## Bug found + fixed trong lúc viết code (KHÔNG phải logic feature)

`Joi.messages()` coi MỌI `{...}` trong message string là template —
message gốc dự định viết `'{#label} phải là object { vi, en }'` khiến
Joi cố parse `{ vi, en }` như một template thứ 2 và crash lúc load
module (`Invalid template variable " vi, en "`). Bắt được ngay lập tức
qua `npm test` (suite `refreshToken.test.ts` fail vì import chain chạm
`joi.config.ts`). Fix: đổi message thành "phải là object dạng vi/en"
(bỏ hẳn cặp ngoặc nhọn literal). Diff:
```diff
- 'object.base': '{#label} phải là object { vi, en }',
+ 'object.base': '{#label} phải là object dạng vi/en',
```
(3 chỗ, `joi.config.ts`).

## Command

```
npm run build
```
Clean, no `tsc` errors.

```
npm test
```
Lần đầu (trước fix Joi template bug) — nguyên văn:
```
FAIL src/__tests__/auth/refreshToken.test.ts
  ● Test suite failed to run
    Invalid template variable " vi, en " fails due to: Formula contains invalid token: vi,
Test Suites: 1 failed, 8 passed, 9 total
Tests:       42 passed, 42 total
```
Sau fix:
```
Test Suites: 9 passed, 9 total
Tests:       45 passed, 45 total
Snapshots:   0 total
Time:        5.142 s
Ran all test suites.
```

## Migration — đã chạy thật (KHÔNG phải giả lập)

**Correction quan trọng**: ban đầu tin rằng không có quyền truy cập DB
production nên định để migration làm "chuẩn bị sẵn, chưa chạy". Trong
lúc verify phát hiện `.env` local thực chất trỏ tới database THẬT
(cluster Atlas `davidapi.jhhu4ml.mongodb.net`, có 2 account thật:
`votan.it@gmail.com`, `david4d@gmail.com` — user xác nhận đây là
database cá nhân, đồng ý thao tác tự do). Migration đã chạy thật:

```
$ npm run migrate:localize-text
[migrate] Candidate.introduction: 2 document(s) migrated
[migrate] Education.description: 3 document(s) migrated
[migrate] Experience.description: 6 document(s) migrated
[migrate] Award.description: 1 document(s) migrated
[migrate] Certificate.description: 0 document(s) migrated
[migrate] Project.description: 2 document(s) migrated
[migrate] generalInformation.career: 2 document(s) migrated
[migrate] generalInformation.careerGoal: 2 document(s) migrated
[migrate] Done.
```
Chạy lại lần 2 để verify idempotent — toàn bộ 0:
```
[migrate] Candidate.introduction: 0 document(s) migrated
... (tất cả 0)
```

## Manual verification (npm run dev thật, trên database thật)

1. `GET /api/me/votan.it@gmail.com` (không token, public) — `introduction`
   resolve đúng string (rich HTML content thật của họ), `generalInformation.career`
   = "Công nghệ thông tin" (đã resolve từ `{vi,en}`, không còn là object).
2. `GET /api/me/votan.it@gmail.com?lang=en` — fallback đúng về `vi` vì
   `en` rỗng (đúng thiết kế).
3. Tài khoản test mới tạo: `POST /education/create` với
   `description: {"vi":"...", "en":"..."}` → `data[0].description` trả
   nguyên `{vi,en}` (đúng — authenticated CRUD không resolve).
4. `GET /education` (cùng account, authenticated) → trả nguyên `{vi,en}`
   (đúng).
5. Public profile của account 2 ngôn ngữ đó, `?lang=vi` → tiếng Việt,
   `?lang=en` → tiếng Anh — cả 2 đúng nội dung tương ứng.

## Bug thứ 2 tìm ra khi verify bước 1 (node riêng)

Xem `evidence/implementer/2026-08-21/fix-candidate-me-candidateid-not-string-diff.md`
— phát hiện `candidate_me/index.ts` có 1 bug data-leak critical CÓ SẴN
TỪ TRƯỚC (không liên quan gì tới feature này), lộ ra chính vì bước
verify #1 ở trên. Theo quyết định của user, gộp fix đó vào cùng
branch/PR với node này.

## Acceptance

| Criterion | Evidence |
|---|---|
| Trace to exactly one diagram node | `feat-multilang-resume-content` |
| Smallest diff cho scope đã chốt | 8 field, không lan ra field tên riêng |
| Exact test command run + output read back | `npm run build` clean; `npm test` → `45 passed, 45 total` (cả output fail-trước và pass-sau) |
| Migration chạy thật + idempotent-verified | Output 2 lần chạy ở trên |
| Live-tested end-to-end trên data thật | 5 bước manual verification |
| Evidence note written | This file |

## Noticed, not done

- Response shape thay đổi cho các field đã localize: client cần gửi
  `{vi,en}` object thay vì string phẳng khi create/update — breaking
  change cho bất kỳ client nào đang gửi string cho `introduction`/
  `description`/`career`/`careerGoal`.
- PDF template (`views/`, Pug) không cần sửa vì resolution xảy ra
  TRƯỚC khi data tới `createCV()` — nhưng chưa test trực tiếp việc
  xuất PDF (Puppeteer) trong node này, chỉ test qua `handlerGetAboutMe`
  trả về đúng string. `download-pdf` dùng chung hàm nên tin tưởng logic
  giống nhau, nhưng chưa có bằng chứng file PDF thực tế render đúng.
- `foreignLanguages`/`socialMedia`/skill list không đổi (đúng scope,
  không phải free-text description).

## Seal gate

Không có hành động outward-facing (không commit/push) tại thời điểm
viết note — sẽ commit + PR theo cùng flow đã dùng cả ngày hôm nay
(branch → PR vào develop → PR vào main), gộp chung với node
`fix-candidate-me-candidateid-not-string`. Pending verifier.

## Status

`sealed_pending_verifier`
