# doctrine/domains/PROJECT.md — ground truth của Resume API Backend

## What is it
REST API backend (Node.js + TypeScript) để quản lý hồ sơ ứng viên
(CV/Resume): auth JWT, CRUD cho 7 CV section (education/experience/award/
certificate/project/reference/generalInformation), export PDF, rate
limiting + token blacklist qua Redis (fallback in-memory), logging Winston.
Repo: `github.com/datvt243/nodejs-resume-api-ts`. Author: DatVT.

## Stack + shape
| Thing | Value |
|---|---|
| Language/runtime | Node.js (`>=20.19.0 <23.0.0`) + TypeScript 5.5 (strict, CommonJS), Express 4.19 |
| Entry point | `src/server.ts` (Express setup, MongoDB connect, Redis init, dev port 3001 / prod port 3008) |
| Data store | MongoDB + Mongoose 8.4 (primary); Redis 4.6 cho rate-limit + token blacklist (optional, fallback in-memory) |

## Invariants (things that never happen here)
- Mọi Mongo query đi qua `QuerySafe` (`src/utils/querySafe.ts`) — chặn toán
  tử `$` và pattern `javascript:` trước khi chạm DB. Không bao giờ build
  filter Mongo trực tiếp từ input người dùng chưa qua `QuerySafe`.
- Password không bao giờ lưu hoặc so sánh dạng plaintext — luôn bcrypt (12
  rounds) qua `src/utils/bcrypt.ts`.
- Một JWT không bao giờ được tin ngay — `verifyToken.middleware.ts` luôn
  kiểm blacklist (Redis/mem) trước khi gắn `req.user._id`.
- Mọi document CV section (education/experience/award/certificate/project/
  reference/generalInformation) luôn mang `candidateId`; update/delete luôn
  kiểm ownership qua base ops ở `src/services/index.ts`.
- `dist/` luôn gitignored, không bao giờ sửa tay — luôn rebuild bằng
  `npm run build`.

## Diagram-first
Diagram (`haven/diagrams/`) là source of truth cho tiến độ — code phải khớp.

## Forbidden states
Xem `CLAUDE.md` — `ADHOC_WORK`, `NO_EVIDENCE`, `EDIT_UNVERIFIED`,
`CODE_IN_HAVEN`, `DIAGRAM_DRIFT`.

## Traps (append khi gặp cái mới)
> Nguồn: `TODO.md` (repo root), cập nhật lần cuối 2026-07-05.

| Trap | Why | What to do instead |
|---|---|---|
| Hardcoded Chrome executable path (`src/services/createPDF.ts:14-25`) | Breaks PDF export nếu Chrome không nằm đúng path kỳ vọng (CI/Docker) | Dùng `puppeteer.executablePath()` hoặc env var |
| CORS `origin: '*'` (`src/config/cors.config.ts:8`) | Mở cho mọi origin ở mọi môi trường, kể cả prod | Giới hạn về danh sách origin đã biết trước khi coi là prod-ready |
| Không có `limit` trên `bodyParser.json()` (`src/server.ts`) | Body request không giới hạn kích thước — rủi ro DoS | Thêm giới hạn size rõ ràng trước khi ship |
| `auth.service.ts:40` bỏ qua Mongoose model-level validation trước khi save (TODO comment trong code) | Write path chưa được validate đầy đủ | Gọi `validateModel()` (`src/utils/valid.ts`) trước khi persist |
| Không có script `lint` trong `package.json` dù `.eslintrc.cjs` tồn tại | `npm run lint` KHÔNG chạy được — đừng giả định nó có | Xác nhận lệnh thật trước khi điền vào `doctrine/MEMORY.md` (đang `<<FILL>>`) |

## Decisions, with reasoning
> Một quyết định không ghi lý do sẽ bị một agent tương lai "làm đẹp" mất —
> what đã có trong code, chỉ why là load-bearing.

| Date | Decision | Why | Alternative rejected |
|---|---|---|---|
| `<<FILL>>` | `MONGO_URI` (full connection string) được ưu tiên, nhưng `MONGOBD_USER`/`MONGOBD_PASSWORD` vẫn giữ làm fallback | `.env.example` ghi rõ đây là "fallback - for backward compatibility" | Xoá hẳn đường credentials rời, chỉ nhận `MONGO_URI` |
| `<<FILL>>` | Alias `@/*` resolve qua `tsconfig-paths` ở dev, qua `module-alias` ở prod (`dist/`) | `tsc` không tự rewrite path alias khi build, nên dev và output đã compile cần 2 chiến lược resolve khác nhau | Viết lại toàn bộ import thành relative path |
