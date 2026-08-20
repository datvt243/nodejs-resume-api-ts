---
name: todo
description: "Gộp /worker implementer và /worker verifier thành 1 lệnh gõ cho một task — vẫn chạy 2 lượt tách biệt bên trong, tự lặp lại khi REOPEN. Dùng: /todo \"<task>\""
argument-hint: "<task>"
---

# /todo "<task>"

> Orchestrate lại đúng skill `worker` 2 lần, ở 2 lượt tách biệt. KHÔNG tự
> triển khai lại logic implement/verify riêng — chỉ gọi `/worker` theo
> đúng thứ tự bên dưới.

## Quy trình
1. **Lượt 1 — implementer**: chạy tương đương `/worker implementer "<task>"`.
   Dừng ở `status: sealed_pending_verifier` (hoặc `blocked` /
   `reopened_by_test` nếu test tại chỗ fail — xem `recipes/implement.md`).
2. **Lượt 2 — verifier**: chạy tương đương
   `/worker verifier "<evidence note vừa tạo ở lượt 1>"`, ở một lượt suy
   luận RIÊNG — không mang theo lý luận của lượt 1 (`NeverVerifyOwnWork`
   vẫn áp dụng nguyên vẹn dù gộp lệnh).
3. **Verdict = REOPEN** → tự động quay lại Lượt 1 với đúng lý do REOPEN
   trích từ evidence note của verifier. Lặp tối đa **3 lần**. Chạm giới
   hạn → dừng, báo operator tự quyết định, không tự lặp thêm.
4. **Verdict = SEAL** → dừng, báo kết quả. KHÔNG tự `commit`/`push` —
   seal gate trong `CLAUDE.md` vẫn áp dụng cho mọi hành động
   outward-facing, kể cả khi gọi qua `/todo`.

## Ràng buộc cứng
- Đây KHÔNG phải 1 pass tự viết tự chấm — luôn là 2 lượt implementer →
  verifier tách biệt, đúng như gọi `/worker` 2 lần thủ công.
- Mỗi lượt đều phải để lại evidence note riêng
  (`evidence/implementer/...`, `evidence/verifier/...`) — không gộp note.
- Nếu `doctrine/MEMORY.md` còn `<<FILL>>` khiến implementer `blocked` ngay
  từ lượt 1, dừng và báo blocker — không cố gắng "đoán qua" để tiếp tục
  vòng lặp.

## Ví dụ
```
/todo "sửa CORS origin '*' theo trap trong doctrine/domains/PROJECT.md"
# Lượt 1 (implementer): pick_next → implement → evidence → sealed_pending_verifier
# Lượt 2 (verifier): đọc evidence → SEAL (hoặc REOPEN kèm lý do cụ thể)
# REOPEN → tự lặp lượt 1 với lý do đó, tối đa 3 lần → nếu vẫn REOPEN, dừng
# SEAL → dừng, báo kết quả, không tự commit
```
