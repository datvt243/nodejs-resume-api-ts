> Đây là recipe chạm code nhiều nhất — chỗ `EDIT_UNVERIFIED` bị bắt hoặc lọt qua.

# Contract
- Input: output của `pick_next`.
- Output: `{status: sealed_pending_verifier | reopened_by_test | failed, node,
  diff summary, command, evidence}`
- NEVER: `status: done` — chỉ verifier mới dùng trạng thái đã seal.

## Steps
1. Đọc lại node + acceptance criteria.
2. Đọc mọi file liên quan trước khi viết — khớp naming/style/idiom hiện có
   trong `src/` (ví dụ: controller/service/validate tách riêng theo section
   như `src/candidate_profile/*`).
3. Smallest diff — chỉ đổi cái acceptance criteria đòi hỏi.
4. SEAL GATE trước hành động outward-facing — dừng, show diff, đợi approval.
5. Chạy CHÍNH XÁC lệnh test từ `doctrine/MEMORY.md` (`npm test` từ repo
   root) — copy nguyên văn.
6. ĐỌC OUTPUT LẠI nguyên văn — claim không trích dẫn được = `EDIT_UNVERIFIED`.
7. Chỉ báo `sealed_pending_verifier` khi TẤT CẢ criteria pass có evidence.
8–9. Nếu gặp bug/trap mới (giống các trap đã ghi trong
   `doctrine/domains/PROJECT.md`), cân nhắc ghi thêm vào đó hoặc vào
   `MEMORY.md`.
10. Ghi vào `evidence/` theo format ở `evidence/README.md`.

## Hard rules honored
`SmallestDiff` | `TestsBeforeDone` | `EvidencePerAction` | `NoSilentFailure` |
`NodeBeforeCode`

## Failure branches
| Failure | Handling |
|---|---|
| Thiếu lệnh test trong `doctrine/MEMORY.md` | `blocked`, gợi ý điền `<<FILL>>` |
| Lỗi do thiếu setup (env, deps, Mongo/Redis không chạy) | Báo lỗi THẬT, không vòng qua |

## Runtime
`/worker implementer "<task>"`.
