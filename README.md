# 📄 Resume API - Backend

Một ứng dụng API backend để quản lý hồ sơ ứng viên (CV/Resume). Cho phép người dùng tạo, quản lý và xuất hồ sơ dưới dạng PDF.

---

## 🎯 Mục Đích

Resume API giúp ứng viên:

- ✅ Tạo tài khoản và đăng nhập an toàn
- ✅ Quản lý thông tin hồ sơ cá nhân (thông tin cơ bản, học vấn, kinh nghiệm, etc.)
- ✅ Lưu trữ các thành phần CV: Giáo dục, kinh nghiệm, giải thưởng, chứng chỉ, dự án, tham chiếu
- ✅ Xuất hồ sơ thành file PDF

---

## 🛠️ Stack Công Nghệ

### Backend

- **Runtime**: Node.js
- **Ngôn ngữ**: TypeScript
- **Framework**: Express.js
- **Database**: MongoDB + Mongoose ODM

### Authentication & Security

- **JWT**: JSON Web Tokens (access + refresh tokens)
- **Password**: Bcrypt (mã hóa)

### Validation & Data

- **Schema Validation**: Joi
- **Mongoose Validation**: Built-in model validation

### Utilities

- **PDF Generation**: PDFKit + Puppeteer
- **Template Engine**: Pug
- **HTTP**: cors, body-parser, express-session

### DevTools

- **TypeScript Config**: tsconfig.json
- **Testing**: Jest (cơ bản)
- **Dev Server**: Nodemon + ts-node

---

## 📁 Cấu Trúc Project

```
backend/
├── src/
│   ├── auth/                          # Xác thực (register, login)
│   │   ├── auth.controller.ts        # Route handlers
│   │   ├── auth.service.ts           # Business logic
│   │   └── auth.validate.ts          # Validation schema
│   │
│   ├── models/                        # Database schemas
│   │   ├── candidate.model.ts        # User info
│   │   ├── award.model.ts
│   │   ├── certificate.model.ts
│   │   ├── education.model.ts
│   │   ├── experience.model.ts
│   │   ├── project.model.ts
│   │   └── reference.model.ts
│   │
│   ├── candidate_profile/             # Quản lý hồ sơ chi tiết
│   │   ├── awards/
│   │   ├── certificates/
│   │   ├── education/
│   │   ├── experience/
│   │   ├── general_information/
│   │   ├── project/
│   │   └── reference_information/
│   │
│   ├── middlewares/                   # Custom middlewares
│   │   ├── errors.middleware.ts      # Error handling
│   │   └── verifyToken.middleware.ts # JWT verification
│   │
│   ├── routers/                       # Route definitions
│   │   └── api/v1/                   # API V1
│   │
│   ├── services/                      # Utilities
│   │   ├── createPDF.ts
│   │   └── fonts/
│   │
│   ├── utils/                         # Helper functions
│   │   ├── bcrypt.ts                 # Password hashing
│   │   ├── jwt.ts                    # Token generation
│   │   ├── valid.ts                  # Validation helpers
│   │   └── helper.ts
│   │
│   ├── config/                        # Configuration
│   │   ├── cors.config.ts
│   │   ├── joi.config.ts
│   │   ├── process.config.ts         # Environment variables
│   │   ├── session.config.ts
│   │   └── regex.config.ts
│   │
│   ├── database/                      # Database connection
│   │   └── mongo.db.ts
│   │
│   ├── views/                         # Pug templates
│   │   ├── login.pug
│   │   ├── register.pug
│   │   └── ...
│   │
│   ├── public/                        # Static files
│   │   ├── css/
│   │   ├── js/
│   │   ├── img/
│   │   └── pdf/
│   │
│   ├── types/                         # TypeScript types
│   │   ├── base.type.ts
│   │   └── candidate.type.ts
│   │
│   └── server.ts                      # Entry point
│
├── .env.example                       # Environment template
├── package.json
├── tsconfig.json
├── jest.config.ts
└── nodemon.json
```

---

## 🚀 Cài Đặt & Chạy Ứng Dụng

### 1. Clone Repository

```bash
git clone <repository-url>
cd backend
```

### 2. Cài Đặt Dependencies

```bash
npm install
```

### 3. Cấu Hình Environment

Tạo file `.env` dựa trên `.env.example`:

```bash
cp .env.example .env
```

Điền các giá trị cần thiết:

```env
# Node Environment
NODE_ENV=development
LOCAL_PORT=3001

# MongoDB
MONGOBD_USER=<your-mongodb-user>
MONGOBD_PASSWORD=<your-mongodb-password>

# JWT Tokens (generate strong secrets)
TOKEN_SECRET=<your-strong-jwt-secret>
TOKEN_REFRESH=<your-refresh-token-secret>
TOKEN_EXP_IN=24h

# Session
SESSION_SECRET=<your-session-secret>
```

### 4. Chạy Development Server

```bash
npm run dev
```

Server sẽ start tại `http://localhost:3001`

### 5. Build Production

```bash
npm run build
npm start
```

### 6. Chạy Tests

```bash
npm test
```

---

## 📚 API Endpoints

### Authentication Routes `/api/v1/auth`

- **POST** `/register` - Đăng ký tài khoản mới
- **POST** `/login` - Đăng nhập
- **POST** `/refresh-token` - Làm mới token

### Candidate Profile Routes `/api/v1/candidate`

_(Cần JWT token)_

- **GET** `/:id` - Lấy thông tin ứng viên theo ID
- **GET** `/email/:email` - Lấy thông tin ứng viên theo Email
- **PUT** `/` - Cập nhật thông tin cá nhân
- **PATCH** `/` - Cập nhật một số trường

### Education Routes `/api/v1/education`

_(Cần JWT token)_

- **GET** `/:id` - Lấy học vấn
- **POST** `/` - Tạo học vấn mới
- **PUT** `/:id` - Cập nhật học vấn
- **DELETE** `/:id` - Xoá học vấn

### Experience Routes `/api/v1/experience`

_(Cần JWT token)_

- **GET** `/:id` - Lấy kinh nghiệm
- **POST** `/` - Tạo kinh nghiệm mới
- **PUT** `/:id` - Cập nhật kinh nghiệm
- **DELETE** `/:id` - Xoá kinh nghiệm

### Award Routes `/api/v1/award`

### Certificate Routes `/api/v1/certificate`

### Project Routes `/api/v1/project`

### Reference Routes `/api/v1/reference`

### General Information Routes `/api/v1/general-information`

### PDF Export

- **GET** `/api/v1/download-pdf?token=<jwt-token>` - Tải xuống hồ sơ dưới dạng PDF

---

## 🔐 Authentication

### Quy trình Đăng Nhập

1. Người dùng gửi email & password đến `/auth/login`
2. Server xác minh password dùng Bcrypt
3. Server trả về `token` (access) và `tokenRefresh` (refresh)
4. Client gửi `token` trong header: `Authorization: Bearer <token>`

### Header Authorization

```
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

---

## 🔧 Available Scripts

| Script             | Mô Tả                                      |
| ------------------ | ------------------------------------------ |
| `npm run dev`      | Start dev server với auto-reload (nodemon) |
| `npm run dev-node` | Start dev server bằng ts-node              |
| `npm run build`    | Build TypeScript thành JavaScript          |
| `npm run start`    | Chạy production build                      |
| `npm test`         | Chạy unit tests (jest)                     |

---

## 📝 Ví Dụ Request/Response

### Register

```bash
POST /api/v1/auth/register
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "password123",
  "repassword": "password123"
}
```

**Response:**

```json
{
  "success": true,
  "message": "Đăng ký thành công",
  "data": null,
  "errors": null
}
```

### Login

```bash
POST /api/v1/auth/login
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "password123"
}
```

**Response:**

```json
{
  "success": true,
  "message": "Đăng nhập thành công",
  "data": {
    "user": {
      "email": "user@example.com",
      "first_name": "Dat",
      "last_name": "Vo"
    },
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "tokenRefresh": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  }
}
```

### Get User Profile

```bash
GET /api/v1/candidate/507f1f77bcf86cd799439011
Authorization: Bearer <token>
```

**Response:**

```json
{
  "success": true,
  "message": "",
  "data": {
    "_id": "507f1f77bcf86cd799439011",
    "email": "user@example.com",
    "firstName": "Dat",
    "lastName": "Vo",
    "phone": "0123456789",
    "address": "Hanoi, Vietnam",
    "socialMedia": {
      "github": "https://github.com/datvt243",
      "linkedin": "https://linkedin.com/in/datvt",
      "website": "https://example.com"
    }
  }
}
```

---

## 🛡️ Security Notes

- ✅ Passwords được mã hóa bằng Bcrypt
- ✅ JWT tokens để bảo vệ API
- ✅ CORS được cấu hình
- ✅ Environment variables cho credentials

⚠️ **Cần improvement:**

- [ ] Input sanitization
- [ ] Rate limiting
- [ ] HTTPS enforcement (production)
- [ ] Comprehensive logging
- [ ] Request validation stricter

---

## 🐛 Troubleshooting

### MongoDB Connection Failed

```
Error: MongoDB Connect failed
```

**Solution:** Kiểm tra `MONGOBD_USER` và `MONGOBD_PASSWORD` trong `.env`

### JWT Token Invalid

```
Error: Access denied. No token provided.
```

**Solution:** Thêm token vào header: `Authorization: Bearer <token>`

### TypeScript Compilation Error

```bash
# Rebuild project
npm run build
```

---

## 📖 Các Tính Năng Chính

### Phần 1: Authentication

- ✅ Đăng ký tài khoản
- ✅ Đăng nhập & JWT tokens
- ✅ Token refresh (coming soon)

### Phần 2: Profile Management

- ✅ Cập nhật thông tin cá nhân
- ✅ Quản lý học vấn
- ✅ Quản lý kinh nghiệm
- ✅ Quản lý giải thưởng
- ✅ Quản lý chứng chỉ
- ✅ Quản lý dự án
- ✅ Quản lý tham chiếu

### Phần 3: Export

- ✅ Xuất hồ sơ PDF

---

## 📞 Support

Để báo cáo bug hoặc đề xuất tính năng, vui lòng tạo issue trên repository.

---

## 👨‍💻 Author

**Đạt Võ** (DatVT)

- GitHub: [@datvt243](https://github.com/datvt243)

---

## 📜 License

ISC

---

## 🗂️ Database Schema Reference

### Candidate Model

```typescript
{
  _id: ObjectId,
  email: String (required),
  password: String (required),
  firstName: String,
  lastName: String,
  gender: Boolean,
  marital: Boolean,
  birthday: Number,
  address: String,
  phone: String,
  introduction: String,
  socialMedia: {
    github: String,
    linkedin: String,
    website: String
  },
  createdAt: Date,
  updatedAt: Date
}
```

---

## 🎓 Learning Notes

Dự án này là một bài tập học Node.js/Express/MongoDB. Được tổ chức theo pattern MVC (Model-View-Controller) với:

- Service layer cho business logic
- Validation layer cho data validation
- Middleware cho error handling

---
