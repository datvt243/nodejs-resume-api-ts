# 2026-08-21 — api-regression-bugfixes (refusal, batch)

- Worker: verifier
- Nodes: `fix-idor-broken-access-control`, `fix-candidate-password-leak`,
  `fix-refresh-token-expiry-unused`, `fix-v2-register-missing-await`,
  `fix-create-response-null-id`
- PM status: unchanged, tất cả vẫn PENDING (không ratchet)

## Reasoning

Cùng lý do đã ghi 2 lần trước
(`evidence/verifier/2026-08-20/fix-chrome-executable-path-refusal.md`,
`evidence/verifier/2026-08-21/fix-redis-init-blocks-dev-startup-refusal.md`):
"TỪ CHỐI TỰ CHẤM TRƯỚC TIÊN — tôi có viết diff này trong phiên này
không?" — Có, cả 5 diff đều do implementer viết trong cùng phiên hội
thoại này. `NeverVerifyOwnWork` áp dụng cho cả 5, bất kể chất lượng thật
của diff (build clean, 45/45 test pass, mỗi bug đều có live re-test xác
nhận exploit gốc đã bị chặn — evidence implementer đầy đủ, trích dẫn cụ
thể).

Đây là lần thứ 3 gặp refusal cùng lý do trong hub này. Theo note trước
("nếu pattern lặp lại lần 3, nên ghi thành entry trong
`haven/workers/verifier/MEMORY.md`") — ghi nhận tại đây, chưa tự thêm
vào MEMORY.md (ngoài scope note refusal, để lại cho lần verify thật).

## Missing

Không thiếu evidence — cả 5 note implementer đều đầy đủ diff + command +
output + live verification. Thiếu tính **độc lập** giữa người viết và
người chấm.

## What would unblock this

Một phiên Claude Code khác (context mới) chạy `/worker verifier` cho
từng node, hoặc gộp cả 5 nếu recipe cho phép batch verify. Gợi ý thứ tự
verify theo severity: `fix-idor-broken-access-control` (critical) trước,
rồi `fix-candidate-password-leak`, sau đó 3 node còn lại.
