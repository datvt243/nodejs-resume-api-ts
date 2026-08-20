> Nếu bất kỳ tài liệu nào khác mâu thuẫn với file này về path hoặc lệnh,
> FILE NÀY THẮNG. One home per fact — một lệnh sống ở hai file sẽ sai ở một
> trong hai.

## What this is
- Hub path (absolute): `/Users/_david/Workspace/Project/ResumeAPI/backend/agent-hub`
- Code repo path (absolute): `/Users/_david/Workspace/Project/ResumeAPI/backend`
- Quan hệ hub ↔ repo: chỉ đối chiếu repo qua worker, có test run và evidence
  note — không bao giờ ad-hoc.

## The exact commands
> COPY these — never type them from memory. Lệnh nhớ trong đầu sẽ trôi, và
> lệnh trôi thì chứng minh sai thứ.

| Purpose | Command | Run from |
|---|---|---|
| Test | `npm test` | `/Users/_david/Workspace/Project/ResumeAPI/backend` |
| Test one file | `npx jest <path/to/file.test.ts>` | `/Users/_david/Workspace/Project/ResumeAPI/backend` |
| Build | `npm run build` | `/Users/_david/Workspace/Project/ResumeAPI/backend` |
| Lint/typecheck | `<<FILL>>` | `<<FILL>>` |
| Run locally | `npm run dev` | `/Users/_david/Workspace/Project/ResumeAPI/backend` |

`npm test` = `jest --passWithNoTests` (xem `package.json`). Không có script
`lint` trong `package.json` dù `.eslintrc.cjs` tồn tại — đừng đoán
`npm run lint` có thật, nó không có tính đến 2026-08-20.

Cho tới khi điền xong Lint/typecheck: implementer báo `blocked` chứ không
đoán. Đó là hành vi ĐÚNG, không phải bug.

## Stack
| Thing | Value |
|---|---|
| Language/runtime | Node.js `>=20.19.0 <23.0.0` + TypeScript 5.5.4 (strict, CommonJS) |
| Package manager | npm (`package-lock.json` present) |
| Test runner | Jest 29.7 + ts-jest (`jest.config.ts`: roots `src/`, testRegex `__tests__` or `.test./.spec.`) |

## The default way to work
`/boot` → `/worker implementer "<task>"` → `/worker verifier "<task>"`. Không bao
giờ bỏ bước 1 ở phiên nguội, không bao giờ bỏ bước 3.

## Workers
| wid | Role | Actions | Seal actions |
|---|---|---|---|
| implementer | Implementer | pick_next, implement | — |
| verifier | Verifier | verify_seal | SEAL, REOPEN |

## Forbidden states
5 state — xem chi tiết ở `CLAUDE.md`. Các state này OVERRIDE mọi skill text
khác.

## Facts that are always true
- Không có LLM API key ở đâu trong hub — Claude Code LÀ runtime.
- `haven/` là memory, không phải code.
- `evidence/` được commit; note "xấu" vẫn được giữ lại.
- Ratchet đơn điệu: PENDING → IN_PROGRESS → SEALED, không bao giờ lùi.
- Verifier sở hữu PM status; implementer không bao giờ tự đặt.
- `dist/` là output build, luôn gitignored, không bao giờ sửa tay.

## Open <<FILL>> values
1. Lint/typecheck command + run-from path — chưa xác nhận có script thật
   nào (không có `npm run lint` trong `package.json` tính tới 2026-08-20).
   `/boot` sẽ báo đây là blocker cho tới khi điền.
