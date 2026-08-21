# 2026-08-21 — feat-i18n-api-messages-auth (plan + diff)

- Worker: implementer
- Version: 0.1.0
- Node: `feat-i18n-api-messages-auth` (`haven/diagrams/dev-loop.prime-mermaid.md`)
- GitHub issue: #78 (giai đoạn 1/nhiều — hạ tầng + auth flow trọn vẹn)
- Task (verbatim): "làm #78"

## Scope decision (chốt qua AskUserQuestion trước khi code)

56+ message string, 8 file Joi `.messages()`, 8 model Mongoose
required-message trong toàn repo — migrate hết trong 1 lần sẽ là diff
~30-50 file, khó review. Chọn: **hạ tầng i18n + migrate trọn vẹn auth
flow** (register/login/logout/refresh — có test coverage sẵn để verify
đúng-sai rõ ràng), phần còn lại (candidate, 7 CV section, Joi validation
messages) để follow-up riêng, đúng khuyến nghị ghi sẵn trong issue #78.

## Kiến trúc

- **Hand-rolled, không dùng thư viện** (`i18next` etc.) — issue #78 tự
  đề xuất cả 2 hướng, chọn nhẹ vì message surface nhỏ, tránh thêm
  dependency cho use-case đơn giản (lookup key → string theo ngôn ngữ).
- `src/locales/vi.ts`, `src/locales/en.ts` — export object phẳng theo
  namespace (`auth.*`). Dùng `.ts` thay vì `.json` để khỏi phải bật
  `resolveJsonModule` trong `tsconfig.json` hay sửa `copy` script.
- `src/utils/i18n.ts`: `t(key, lang)` — resolve dot-path key, fallback
  về `DEFAULT_LANG` ('vi') nếu thiếu bản dịch, fallback về chính `key`
  nếu thiếu hoàn toàn (không bao giờ throw).
- `src/middlewares/language.middleware.ts`: parse `Accept-Language`
  header (lấy primary subtag đầu tiên, vd `en-US,en;q=0.9` → `en`),
  gắn `req.lang` + `req.t(key)`.
- Wire vào `server.ts` ngay sau `requestLogger`, trước mọi middleware
  khác.
- `handlerRegister`/`handlerLogin` (`auth.service.ts`) nhận thêm tham
  số `lang` (default `'vi'`) — controller truyền `req.lang` xuống.

## Bug gặp phải khi implement

`ts-node` (dùng bởi `npm run dev`) KHÔNG nhận diện `req.lang` dù
`express.d.ts` đã augment type và `tsc --noEmit` (dùng bởi `npm run
build`) hoàn toàn sạch — 2 compiler pipeline khác nhau xử lý ambient
declaration merging khác nhau. Xác nhận qua log crash thật:
```
TSError: ⨯ Unable to compile TypeScript:
src/auth/auth.controller.ts(40,85): error TS2339: Property 'lang' does not exist on type 'Request<...>'.
```
Kiểm tra `verifyToken.middleware.ts` (code có sẵn từ trước) thấy CHÍNH
NÓ cũng không tin tưởng `express.d.ts`'s `user?: {_id}` — luôn viết
`(req as any).user = ...`, không bao giờ dùng `req.user` trực tiếp. Đây
là convention có sẵn của codebase (né đúng bug này). Sửa toàn bộ
`req.lang` → `(req as any).lang` trong `auth.controller.ts` cho khớp
convention — build sạch + `npm run dev` chạy được ngay sau đó.

## Diff

Tóm tắt theo file (diff đầy đủ trong git log/PR):
- `src/locales/vi.ts`, `src/locales/en.ts` — mới, 12 key mỗi file
  (namespace `auth.*`).
- `src/utils/i18n.ts` — mới, hàm `t()`.
- `src/middlewares/language.middleware.ts` — mới.
- `src/middlewares/index.ts` — export middleware mới.
- `src/server.ts` — wire `languageMiddleware` sau `requestLogger`.
- `src/types/express.d.ts` — thêm `lang?: string`, `t?: (key) => string`.
- `src/auth/auth.service.ts` — `handlerRegister`/`handlerLogin` nhận
  `lang`, 5 message hardcode → `t('auth.xxx', lang)`.
- `src/auth/auth.controller.ts` — 4 handler (`authRegister`,
  `authLogin`, `authRefreshToken`, `authLogout`) truyền
  `(req as any).lang`, 7 message hardcode → `t('auth.xxx', ...)`.
- `src/__tests__/auth/auth.controller.test.ts` — 6 assertion cập nhật
  (xem mục Test bên dưới).

## Command

```
npm run build
```
Clean, no `tsc` errors (sau khi fix `req.lang` → `(req as any).lang`).

```
npm test
```
Lần đầu (trước khi update test) — 6 test fail, TẤT CẢ đều do hệ quả có
chủ đích của việc unify default language, không phải regression:
```
Test Suites: 1 failed, 8 passed, 9 total
Tests:       6 failed, 39 passed, 45 total
```
Nguyên nhân từng test:
- `authRegister/authLogin "should register/login successfully"`:
  `handlerRegister`/`handlerLogin` giờ nhận 2 tham số (`item, lang`)
  thay vì 1 — assertion cũ chỉ check 1 tham số.
- `authRefreshToken "should fail if no refresh token"` /
  `"should fail if blacklisted token"`, `authLogout "should logout
  successfully"` / `"should fail if no token"`: message default giờ
  tiếng Việt thống nhất (trước đây các message này hardcode tiếng Anh
  — đúng thứ mà issue #78 gọi là "mixed Vietnamese/English", nay unify
  về 1 default nhất quán).

Sau khi update 6 assertion:
```
Test Suites: 9 passed, 9 total
Tests:       45 passed, 45 total
Snapshots:   0 total
Time:        4.851 s
Ran all test suites.
```

## Manual verification (npm run dev thật, HTTP với header `Accept-Language`)

```
POST /auth/register (không header)                        → "Đăng ký thành công"
POST /auth/login sai pass, Accept-Language: en             → "Incorrect password"
POST /auth/login sai pass, Accept-Language: vi             → "Mật khẩu không chính xác"
POST /auth/login thành công, Accept-Language: en           → "Login successful"
POST /auth/logout có token, Accept-Language: en            → "Logged out successfully"
POST /auth/logout không token, Accept-Language: vi          → "Không có token để đăng xuất"
```
Tất cả đúng ngôn ngữ theo header, và mặc định (không header) là tiếng
Việt như thiết kế.

## Acceptance

| Criterion | Evidence |
|---|---|
| Trace to exactly one diagram node | `feat-i18n-api-messages-auth` |
| Smallest diff cho scope đã chốt (hạ tầng + auth) | Không đụng candidate/CV section/Joi messages |
| Exact test command run + output read back | `npm run build` clean; `npm test` → fail-trước (6 fail, lý do rõ) + pass-sau (`45 passed, 45 total`) |
| Live-tested cả 2 ngôn ngữ qua HTTP thật | 6 lệnh curl trên, output đọc lại nguyên văn |
| Evidence note written | This file |

## Noticed, not done (follow-up cho #78, chưa đóng issue)

- **Joi validation messages** (`config/joi.config.ts`, mọi
  `*.validate.ts`) — chưa migrate. Kiến trúc khác hẳn: Joi schema được
  TẠO 1 LẦN lúc module load (top-level `export const schemaX = Joi.object(...)`),
  không có context request nào tại thời điểm đó để biết `lang`. Cần
  approach khác: map Joi error `type` (vd `'any.required'`,
  `'string.min'`) sang i18n key SAU KHI validate xong (trong
  `utils/valid.ts`'s `validateSchema()`), không phải sửa `.messages()`
  string trực tiếp.
- **Mongoose `required` message strings** (8 model file) — tương tự,
  cần xử lý ở tầng `handleError`'s Mongoose `ValidationError` branch
  (`utils/helper.ts:117-120`), không phải sửa từng model.
- **candidate/candidate_profile/CV section message** — chưa đụng, vẫn
  hardcode tiếng Việt như cũ.
- Không tự đóng issue #78 — vẫn còn scope lớn chưa làm, để mở cho các
  node follow-up.

## Seal gate

Không có hành động outward-facing (không commit/push) tại thời điểm
viết note. Pending verifier.

## Status

`sealed_pending_verifier`
