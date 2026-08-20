# 2026-08-20 — fix-chrome-executable-path (refusal)

- Worker: verifier
- Node: `fix-chrome-executable-path`
- PM status: unchanged (still PENDING — no ratchet movement)

## Reasoning
Step 1 của `recipes/verify_seal.md`: "TỪ CHỐI TỰ CHẤM TRƯỚC TIÊN — tôi có
viết diff này trong phiên này không?"

Có. Diff tại `src/services/createPDF.ts` (evidence:
`evidence/implementer/2026-08-20/fix-chrome-executable-path-diff.md`) được
viết bởi implementer trong cùng phiên hội thoại này, ngay trước khi
`/worker verifier` được gọi.

**I wrote this, a separate verifier pass is required.**

`NeverVerifyOwnWork` (hard rule của `haven/workers/verifier/manifest.yaml`,
invariant #1 của `SOUL.md`) áp dụng — verdict SEAL/REOPEN không được đưa
ra trong tình huống này, bất kể chất lượng thật của diff.

## Missing
Không phải thiếu evidence — evidence implementer đầy đủ. Thiếu tính **độc
lập** giữa người viết và người chấm, điều kiện tiên quyết để một verdict
có ý nghĩa (xem `SOUL.md`: "sự tách biệt đó là lý do mọi phán quyết của
tôi có ý nghĩa").

## What would unblock this
Một phiên Claude Code khác (context mới, không đọc thấy diff này được viết
ra) chạy `/worker verifier "verify node fix-chrome-executable-path"`.
