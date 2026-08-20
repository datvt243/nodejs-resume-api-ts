# Contract
- Input: `{task: string}`
- Output: `{node, diagram, current_state, acceptance: string[],
  files: string[], blocked_by: string|null}`

## Steps
1. Đọc `NORTHSTAR.md` + `doctrine/MEMORY.md` +
   `doctrine/domains/PROJECT.md`.
2. Đọc MỌI diagram trong `haven/diagrams/`, lập danh sách node + PM status.
3. Tìm node PENDING sớm nhất trên critical path (ví dụ node hạt giống
   `fix-chrome-executable-path` trong `dev-loop.prime-mermaid.md`).
4. Không match → không tự bịa việc; báo rõ "không có node PENDING", dừng.
5. Định vị code anchors bằng grep — path thật trong `src/`, không tự bịa
   (ví dụ `src/services/createPDF.ts:14-25`, `src/config/cors.config.ts:8`).
6. Khai báo blockers: nếu cần lệnh còn `<<FILL>>` trong
   `doctrine/MEMORY.md` (hiện tại: lint/typecheck), báo blocked thay vì
   đoán.
7. Evidence: viết `evidence/implementer/<date>/<slug>-plan.md`.

## Hard rules honored
`NodeBeforeCode` | `EvidencePerAction` | `NoSilentFailure`

## Failure branches
| Failure | Handling |
|---|---|
| Chưa có diagram | Tạo `haven/diagrams/<slug>.prime-mermaid.md` khớp format `dev-loop` |
| Task mơ hồ | Dừng và hỏi, không đoán |

## Runtime
`/worker implementer "<task>"`. Không API key, không network call — Claude Code
LÀ runtime.
