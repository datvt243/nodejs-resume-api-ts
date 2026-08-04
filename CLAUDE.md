# Resume API — Backend

Node.js/TypeScript REST API for managing candidate CVs/resumes with auth, PDF export, Redis caching, and Winston logging.

**Version**: 1.0.0 | **Author**: DatVT | **License**: ISC

---

## Tech Stack

| Layer | Tech |
|---|---|
| Runtime | Node.js + TypeScript 5.5 (strict, CommonJS) |
| Framework | Express 4.19 |
| Database | MongoDB + Mongoose 8.4 |
| Cache / Blacklist | Redis 4.6 (in-memory fallback) |
| Auth | JWT (access + refresh), Bcrypt (12 rounds) |
| Validation | Joi 17.13 |
| PDF | Puppeteer 22.13 + PDFKit 0.15 + Pug 3.0 |
| Logging | Winston 3.19 + daily-rotate-file |
| Testing | Jest 29 + ts-jest |

---

## Commands

```bash
npm run dev          # ts-node + nodemon hot reload
npm run build        # tsc + copy views/public → dist/
npm start            # build + NODE_ENV=production node dist/server.js
npm test             # jest --passWithNoTests

npm run env:setup    # cp .env.example .env
npm run env:dev      # cp .env.development .env
npm run env:prod     # cp .env.production .env
npm run copy         # copy views + public to dist/ (post-build fix)
```

---

## Environment Variables

```
NODE_ENV=development
LOCAL_PORT=3001              # prod uses 3008
MONGO_URI=...                # full URI, or use MONGOBD_USER + MONGOBD_PASSWORD
MONGOBD_USER=...
MONGOBD_PASSWORD=...
TOKEN_SECRET=...             # 32+ chars, signs access tokens
TOKEN_REFRESH=...            # signs refresh tokens
TOKEN_EXP_IN=...             # access token expiry
SESSION_SECRET=...
REDIS_URL=redis://localhost:6379   # optional; fallback to in-memory if absent
MONGO_MAX_POOL_SIZE=10       # optional; MongoDB connection pool max size
MONGO_MIN_POOL_SIZE=2        # optional; MongoDB connection pool min size
```

---

## Project Structure

```
src/
├── server.ts                  # Entry: Express setup, MongoDB connect, Redis init
├── alias.ts                   # module-alias: @ → src/ (dev) or dist/ (prod)
├── config/
│   ├── process.config.ts      # Env var validation + export
│   ├── cors.config.ts         # CORS: origin '*'
│   ├── session.config.ts      # Express session config
│   ├── joi.config.ts          # Shared Joi schemas (email, password, phone, etc.)
│   └── regex.config.ts        # Password + phone regex
├── database/
│   └── mongo.db.ts            # Singleton MongoDB connection manager
├── middlewares/
│   ├── verifyToken.middleware.ts   # JWT extraction + blacklist check; attaches req.user._id
│   ├── rateLimit.middleware.ts     # Redis-backed rate limit (100 req/15 min); mem fallback
│   ├── errors.middleware.ts        # Global error handler; AppError-aware; stack in dev only
│   └── requestLogger.middleware.ts # Logs method, URL, status, duration via Winston
├── models/
│   ├── candidate.model.ts
│   ├── generalInformation.model.ts
│   ├── experience.model.ts
│   ├── education.model.ts
│   ├── project.model.ts
│   ├── certificate.model.ts
│   ├── award.model.ts
│   ├── reference.modal.ts
│   └── part/index.ts          # Reusable sub-schemas (skills, languages, socialMedia)
├── routers/
│   ├── api/v1/                # All active routes (see API section)
│   └── api/v2/                # Auth v2 (WIP)
├── auth/
│   ├── auth.controller.ts
│   └── auth.service.ts
├── candidate/
│   ├── candidate.controller.ts
│   └── candidate.service.ts
├── candidate_profile/         # One controller+service+validate per CV section
│   ├── experience/
│   ├── education/
│   ├── general_information/
│   ├── awards/
│   ├── certificates/
│   ├── project/
│   ├── reference_information/
│   └── BaseController.ts      # baseGetAll() + baseDelete() shared across sections
├── candidate_me/
│   └── index.ts               # Public profile aggregation + PDF export
├── services/
│   ├── index.ts               # Core DB ops: baseFindDocument, baseCreateDocument, etc.
│   ├── redis.ts               # Redis client singleton (init/get/close/isAvailable)
│   └── createPDF.ts           # Puppeteer PDF generation (createCV, pageRender)
├── utils/
│   ├── jwt.ts                 # jwtSign(), jwtVerify()
│   ├── bcrypt.ts              # bcryptGenerateSalt(), bcryptCompareHash()
│   ├── tokenBlacklist.ts      # Redis/mem blacklist; cleanup every 60s; key: blacklist:{token}
│   ├── helper.ts              # asyncHandler, throwError, formatReturn, response helpers
│   ├── helper-auth.ts         # extractTokenFromRequest() (header/body/query/cookie)
│   ├── valid.ts               # validateSchema() (Joi), validateModel() (Mongoose)
│   ├── querySafe.ts           # QuerySafe: blocks $ and javascript: to prevent NoSQL injection
│   ├── timeout.ts             # withTimeout, withDBTimeout(5s), withRedisTimeout(2s)
│   └── index.ts               # Re-exports all utils
├── errors/
│   └── index.ts               # AppError hierarchy (see Errors section)
├── types/
│   ├── base.type.ts           # BaseReturn interface, Collections enum
│   ├── candidate.type.ts      # Types for PDF rendering
│   └── express.d.ts           # Extends Express Request: user?: { _id: string }
├── logger/                    # Winston setup: console + combined + error logs; JSON in prod
├── constant/                  # App-wide constants
├── plugins/joi/               # Custom Joi plugins
├── views/                     # Pug templates for PDF
└── public/                    # Static assets + generated PDFs
```

---

## Express Middleware Stack (server.ts order)

1. Request logger (Winston)
2. Session middleware
3. CORS (origin: `*`)
4. Body parser (JSON + URL-encoded)
5. `GET /health` — exempt from rate limit
6. Rate limiter (Redis or mem)
7. Static files (`public/`)
8. API router
9. Global error handler

Pug is set as view engine. Dev: port 3001, Prod: port 3008.

---

## API Endpoints

All v1 routes: `/api/v1/...` — JWT required except auth.

### Auth `/api/v1/auth` (authLimiter: 150 req/15 min)

| Method | Path | Description |
|---|---|---|
| POST | `/register` | Create user, bcrypt hash password |
| GET | `/login` | Validate + return access + refresh tokens |
| POST | `/logout` | Blacklist current token |
| POST | `/refresh` | Rotate tokens; blacklist old refresh token |

### Candidate `/api/v1/candidate`

| Method | Path | Description |
|---|---|---|
| GET | `/:email` | Get profile by email |
| PUT | `/update` | Full update |
| PATCH | `/update` | Partial update |

### CV Sections (all follow same CRUD pattern)

Sections: `education`, `experience`, `award`, `certificate`, `project`, `reference`, `generalInformation`

| Method | Path | Description |
|---|---|---|
| GET | `/` | List all for authenticated user |
| POST | `/create` | Create entry |
| PUT | `/update` | Update entry |
| DELETE | `/delete/:id` | Delete by ID (ownership checked) |

`generalInformation` also has `PATCH /update`.

### Other

| Method | Path | Auth | Description |
|---|---|---|---|
| GET | `/health` | None | Health check |
| GET | `/api/me/:email` | None | Public profile |
| GET | `/api/download-pdf` | Token via query | Export PDF |

---

## Auth Flow

1. `POST /auth/register` → validate Joi → check duplicate email → bcrypt(password, 12) → create Candidate doc
2. `POST /auth/login` → find by email → bcryptCompare → sign `accessToken` (TOKEN_SECRET) + `refreshToken` (TOKEN_REFRESH) with payload `{ _id: candidateId }`
3. All protected requests → `verifyToken` middleware → extract Bearer token → `jwtVerify` → check blacklist → attach `req.user._id`
4. `POST /auth/refresh` → verify refresh token → blacklist old refresh token → issue new pair
5. `POST /auth/logout` → add token to blacklist (Redis TTL = token remaining exp; mem fallback)

---

## Models

All models use Mongoose with `timestamps: true` and `candidateId` foreign key (except Candidate).

| Model | Key Fields |
|---|---|
| Candidate | email, password, firstName, lastName, gender, marital, birthday, address, phone, introduction, socialMedia |
| GeneralInformation | candidateId, position/career, professionalSkills[], personalSkills[], foreignLanguages[], workLocation, workForm |
| Experience | candidateId, company, position, startDate, endDate, isCurrent, description, skills[] |
| Education | candidateId, school, major, startDate, endDate, isCurrent, description |
| Project | candidateId, name, position, description, technology[], startDate, endDate, isWorking, images[], link |
| Certificate | candidateId, name, organization, startDate, endDate, isNoExpiration, link, images[], description |
| Award | candidateId, name, organization, issueDate, link, images[], description |
| Reference | candidateId, fullName, phone, company, position |

**Reusable sub-schemas** (`models/part/index.ts`): `foreignLanguageSchema`, `professionalSkillsSchema`, `personalSkills`, `socialMediaSchema`

---

## Service Layer Pattern

`services/index.ts` exposes base DB operations used by all feature services:

- `baseFindDocument(model, query, findMany?)` — query with NoSQL injection guard
- `baseCreateDocument(model, data, hooks?)` — create with Mongoose validation + optional hooks
- `baseUpdateDocument(model, filter, data)` — update with validation
- `baseDeleteDocument(model, id, candidateId)` — delete with ownership check
- `basePatchDocument(model, filter, data)` — partial update

`BaseController.ts` wraps `baseGetAll()` (find all by `candidateId`) and `baseDelete()` shared across all CV section controllers.

---

## Error Hierarchy (`errors/index.ts`)

```
AppError (base: statusCode, message, errorCode, isOperational)
├── ValidationError       400  VALIDATION_ERROR
├── BadRequestError       400  BAD_REQUEST
├── AuthenticationError   401  UNAUTHORIZED
│   ├── InvalidCredentialsError   INVALID_CREDENTIALS
│   ├── TokenExpiredError         TOKEN_EXPIRED
│   ├── TokenRevokedError         TOKEN_REVOKED
│   └── InvalidTokenError         INVALID_TOKEN
├── AuthorizationError    403  FORBIDDEN
├── NotFoundError         404  NOT_FOUND
└── ConflictError         409  CONFLICT
```

Global error middleware catches all `AppError` instances, logs via Winston, and returns `{ errorCode, message, stack? }` (stack dev-only).

---

## Security

- **NoSQL injection**: `QuerySafe` class in `utils/querySafe.ts` blocks `$` operators and `javascript:` patterns before any DB query
- **Password**: bcrypt with 12 salt rounds
- **Token blacklist**: Redis `blacklist:{token}` with TTL; in-memory Map fallback; cleanup job every 60s
- **Rate limiting**: Redis-backed (100 req/15 min general, 150 req/15 min auth); Redis failure falls back to in-memory
- **Token extraction**: Supports Bearer header, request body, query param, and cookie

---

## Testing

```bash
npm test                         # run all tests
```

- Config: `jest.config.ts` — preset `ts-jest`, root `src/`, module alias `@/* → src/*`, coverage from `src/**/*.{js,ts}`
- Test files: `src/__tests__/` and co-located `.test.ts`

| Test File | Coverage |
|---|---|
| auth/auth.service.test.ts | register, login, email check (mocks: CandidateModel, bcrypt, JWT) |
| auth/auth.controller.test.ts | controller layer |
| auth/refreshToken.test.ts | token rotation |
| middlewares/verifyToken.test.ts | token extraction + blacklist check |
| middlewares/rateLimit.test.ts | rate limiting logic |
| middlewares/requestLogger.test.ts | request logging |
| utils/bcrypt.test.ts | hash + compare |
| utils/valid.test.ts | Joi + Mongoose validation |
| database/mongo.db.ts | DB connection |

---

## Logging

Winston config in `src/logger/`:
- **Console**: all levels in dev; errors only in prod
- **Combined log**: `logs/combined-YYYY-MM-DD.log` (daily rotation)
- **Error log**: `logs/error-YYYY-MM-DD.log`
- Format: simple in dev, JSON in prod

---

## Path Aliases

| Alias | Resolves to |
|---|---|
| `@/*` | `src/*` (dev via tsconfig-paths) / `dist/*` (prod via module-alias) |

Always import as `@/utils/helper`, `@/models/candidate.model`, etc.

---

## Build Notes

- `npm run build` = `tsc && npm run copy`
- `copy` step: `cp -R ./src/views ./src/public ./dist/` — required because Pug templates and static assets are not compiled by tsc
- If build succeeds but PDF/views break in prod: run `npm run copy` manually
- `dist/` is gitignored; always rebuild before deploying
