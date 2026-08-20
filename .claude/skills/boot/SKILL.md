---
name: boot
description: Đọc doctrine + diagram + evidence gần nhất của agent-hub, báo cáo trạng thái phiên trong đúng 6 dòng. Dùng đầu mỗi phiên làm việc.
---

# /boot

> Đọc, KHÔNG sửa gì. Launchpad 60 giây cho một phiên "nguội" — không cần
> re-scan toàn bộ codebase mỗi lần.

## 7 bước, đúng thứ tự
1. Đọc `agent-hub/NORTHSTAR.md`.
2. Đọc `agent-hub/CLAUDE.md`.
3. Đọc `agent-hub/doctrine/MEMORY.md` — lấy path, stack, lệnh chính xác.
4. Đọc `agent-hub/doctrine/domains/PROJECT.md` — invariants/traps/decisions.
5. Đọc mọi file trong `agent-hub/haven/diagrams/` — đếm node theo PM status.
6. Đọc `agent-hub/haven/workers/*/manifest.yaml` — roster worker khả dụng.
7. Đọc tối đa 5 evidence note gần nhất trong `agent-hub/evidence/`
   (implementer + verifier, mới nhất trước).

## Report — đúng 6 dòng, không hơn
```
🎯 Northstar: <one sentence từ NORTHSTAR.md>
✅ Forbidden: <none active | tên state nếu có tín hiệu vi phạm>
📊 Diagrams: <N nodes = X sealed, Y pending, Z in_progress>
🔧 Workers: implementer, verifier
📝 Last action: <node — verdict — date, hoặc "none yet">
🚧 Blockers: <danh sách <<FILL>> còn mở trong doctrine/MEMORY.md, hoặc "none">
```

## Rules
- Không sửa file nào trong bước này — `/boot` là read-only.
- Nếu `doctrine/MEMORY.md` còn `<<FILL>>` ở lệnh test/build, liệt kê rõ
  trong dòng Blockers — đây là tín hiệu đúng, không phải lỗi.
- Nếu chưa từng `/boot` trong phiên hiện tại và sắp dùng `/worker` hoặc
  `/todo`, chạy `/boot` trước — không bỏ qua kể cả việc nhỏ.
