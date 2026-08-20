# agent-hub — Resume API Backend

One-person dev hub cho `nodejs-resume-api-ts`. KHÔNG phải code doctrine
trộn với code — repo là nơi build; `agent-hub/` là markdown thuần: doctrine,
worker memory, diagram, và audit trail.

## Triết lý
Trí tuệ không nằm trong model — model reset mỗi phiên. Trí tuệ nằm trong
`doctrine/`, `haven/workers/*/recipes/`, và evidence đã tích luỹ. Agent là
nhân lực đi thuê theo phiên; hub là cơ thể còn lại.

## Bắt đầu từ đâu
1. `NORTHSTAR.md` — "done" nghĩa là gì.
2. `CLAUDE.md` — hợp đồng agent, forbidden states.
3. `doctrine/MEMORY.md` ★ — lệnh test/build thật (`npm test`, `npm run build`).
4. `doctrine/domains/PROJECT.md` ★ — invariants/traps/decisions thật của
   project này (CORS `origin: '*'`, Chrome executable path hardcode, v.v.).
5. `haven/diagrams/dev-loop.prime-mermaid.md` ★ — trạng thái mọi task.

## Vòng lặp hằng ngày
```
/boot                                   # đọc, không sửa gì
/worker implementer "<task>"            # pick_next → implement → evidence
/worker verifier "<task hoặc note>"     # SEAL hoặc REOPEN
# hoặc gộp 2 lệnh trên:
/todo "<task>"
```

Chi tiết cơ chế: xem `CLAUDE.md` (forbidden states, seal gate) và
`doctrine/standards/` (edit-verification, recipes).

## Trạng thái hiện tại (2026-08-20)
Hub vừa được khởi tạo. `doctrine/MEMORY.md` còn 1 `<<FILL>>` (lệnh
lint/typecheck — không có script `lint` trong `package.json`). Node đầu
tiên trên diagram: `fix-chrome-executable-path` (PENDING).
