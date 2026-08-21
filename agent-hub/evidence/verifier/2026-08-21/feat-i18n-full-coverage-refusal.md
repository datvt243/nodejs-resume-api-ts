# 2026-08-21 — feat-i18n-full-coverage (refusal)

- Worker: verifier
- Node: `feat-i18n-full-coverage`
- PM status: unchanged (still PENDING — no ratchet)

## Reasoning

Cùng lý do đã ghi nhiều lần trong hub này — "TỪ CHỐI TỰ CHẤM TRƯỚC
TIÊN — tôi có viết diff này trong phiên này không?" — Có.
`NeverVerifyOwnWork` áp dụng, bất kể build clean, 45/45 test pass, và
live-test qua HTTP thật (nhiều luồng, 2 ngôn ngữ) xác nhận đúng.

## Missing

Không thiếu evidence. Thiếu tính độc lập giữa người viết và người chấm.

## What would unblock this

Một phiên Claude Code khác (context mới) chạy `/worker verifier` cho
node này.

## Lưu ý cho verifier độc lập

- Node này CÙNG với `feat-i18n-api-messages-auth` hoàn thành issue #78
  — verify cả 2 node nếu muốn đóng issue.
- Evidence implementer có ghi rõ 1 bug tự bắt được trong lúc code
  (`tErrorType` dot-path parsing) — verifier nên kiểm tra kỹ phần field-
  level Joi error message thực sự đổi theo `Accept-Language`, không chỉ
  message tổng quát ở cấp response.
