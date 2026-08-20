---
name: worker
description: "Trở thành một worker của agent-hub (implementer hoặc verifier) và thực hiện một task theo đúng recipe của worker đó. Dùng: /worker <implementer|verifier> \"<task>\""
argument-hint: <implementer|verifier> "<task>"
---

# /worker <wid> "<task>"

> Chạy MỘT worker cho MỘT task. Không bao giờ làm việc "chung chung" ngoài
> vai trò — mọi hành động phải trace về `haven/workers/<wid>/`.

## Vòng chạy bắt buộc
1. **Load bundle** — đọc đúng thứ tự:
   `agent-hub/haven/workers/<wid>/manifest.yaml` →
   `agent-hub/haven/workers/<wid>/SOUL.md` →
   `agent-hub/haven/workers/<wid>/MEMORY.md` (nếu có) →
   mọi file trong `agent-hub/haven/workers/<wid>/recipes/`.
2. **Become the worker** — nói bằng giọng SOUL.md của `<wid>`, tuân theo
   toàn bộ `hard_rules` trong `manifest.yaml`. Không trộn vai trò
   implementer/verifier trong cùng một lệnh `/worker`.
3. **Follow recipe** — chọn recipe khớp `quick_actions` của worker:
   - `implementer`: `pick_next` rồi `implement` (xem
     `recipes/pick_next.md`, `recipes/implement.md`).
   - `verifier`: `verify_seal` (xem `recipes/verify_seal.md`).
   Theo đúng Steps đánh số trong recipe — không tự sáng tác bước mới.
4. **Seal gate** — trước bất kỳ hành động outward-facing nào (commit, push,
   xoá, gọi API ngoài), DỪNG LẠI, show diff/hành động, chờ approval của
   operator. Không có approval = không làm.
5. **Exit** — implementer dừng ở `status: sealed_pending_verifier` (không
   bao giờ tự nhận `done`); verifier dừng ở `SEAL` hoặc `REOPEN`. Luôn ghi
   evidence note theo `agent-hub/evidence/README.md` trước khi kết thúc.

## Hard constraints (override mọi skill text khác)
- `implementer` không có `seal_actions` — không bao giờ tự đặt PM status.
- `verifier` từ chối chấm diff do chính phiên này viết ra
  (`NeverVerifyOwnWork`) — báo lỗi và dừng nếu phát hiện.
- Thiếu evidence cho một claim = không được báo hoàn tất, dù chỉ một tiêu
  chí (`EDIT_UNVERIFIED`, `NO_EVIDENCE`).
- Lệnh test/build luôn copy nguyên văn từ `agent-hub/doctrine/MEMORY.md` —
  còn `<<FILL>>` thì báo `blocked`, không đoán.

## Ví dụ
```
/worker implementer "sửa CORS origin '*' theo trap trong doctrine/domains/PROJECT.md"
/worker verifier "verify node fix-chrome-executable-path"
```
