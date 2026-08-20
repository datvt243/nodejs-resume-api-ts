---
title: Resume API Hub Northstar
date: 2026-08-20
status: active
authority: 65537
dna: resume_api_hub
---

> Northstar là cái KHÔNG đổi khi mọi thứ khác đổi.

## One sentence
Giúp đưa Resume API backend (Node.js/TypeScript/Express/Mongo/Redis) từ task
sang diff nhỏ nhất **có bằng chứng kiểm chứng được** — không phải một lời hứa
"chắc là xong".

## What done means
Một node CHỈ được coi là xong khi **TẤT CẢ** (không phải chỉ một trong số)
điều sau đúng:

1. Trace được về đúng một node trên `haven/diagrams/`.
2. Có diff nhỏ nhất khiến node đó đủ điều kiện (không refactor thừa).
3. Đã chạy đúng lệnh test của project (từ `doctrine/MEMORY.md`) và ĐỌC LẠI
   output — không suy luận.
4. Có evidence note tại `evidence/<...>/<date>-<slug>.md`.
5. Verifier trả `SEAL` với evidence trích dẫn cụ thể.
6. Bảng PM status trên diagram đã cập nhật khớp.

Thiếu điều (3) hoặc (5) → forbidden state `EDIT_UNVERIFIED`.

## What this hub does NOT do
- `ADHOC_WORK` — không sửa `src/` ngoài vòng `/worker` + không có node trên
  diagram, kể cả sửa "một dòng nhỏ".
- `NO_EVIDENCE` — không chấp nhận báo cáo một hành động thật mà không có note
  trong `evidence/`.
- `EDIT_UNVERIFIED` — không claim `npm test` pass mà không dán lại output
  nguyên văn từ terminal.
- `CODE_IN_HAVEN` — không để `.ts`/`.js`/config lọt vào `haven/` — nơi đó chỉ
  là memory của worker, không phải chỗ chứa code chạy được.
- `DIAGRAM_DRIFT` — không để PM status trên diagram lệch với trạng thái code
  thật (ví dụ: code đã fix CORS `origin: '*'` nhưng diagram vẫn PENDING).

## The success picture (3 months out)
- 3 traps đã biết trong `doctrine/domains/PROJECT.md` (Chrome executable
  path hardcode, CORS `origin: '*'`, thiếu body-size limit) có node SEALED
  kèm evidence — không còn nằm im trong `TODO.md`.
- Ít nhất 5 recipe trong `haven/workers/implementer/recipes/` đã được replay
  ≥ 2 lần (cột "Times replayed" trong `MEMORY.md` của implementer > 0).
- 0 forbidden-state hit trong 20 evidence note gần nhất.
- `doctrine/MEMORY.md` không còn `<<FILL>>` nào (lệnh lint/typecheck đã điền
  thật).
- Mỗi node SEALED trên `haven/diagrams/dev-loop.prime-mermaid.md` trace được
  về đúng một cặp evidence note (implementer + verifier).

## Cross-references
`CLAUDE.md` · `doctrine/MEMORY.md` · `haven/diagrams/dev-loop.prime-mermaid.md`
