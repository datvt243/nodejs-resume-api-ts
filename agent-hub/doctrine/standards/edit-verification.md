> "You may not claim an outcome you have not observed." Quy tắc bị vi phạm
> nhiều nhất trong agent work. Exceptions: None.

## The rule
Chỉ được báo hoàn tất khi output đã thực sự được xuất ra và đọc lại — không
phải khi bạn nghĩ edit đã đúng.

## Not evidence vs Evidence
| Not evidence | Evidence |
|---|---|
| "Fix này chắc sẽ giải quyết được lỗi" | Chạy lại, đọc output thật |
| "Tests should pass now" | `Tests: 42 passed, 42 total` (verbatim) |

## Why reasoning doesn't count
Lập luận về code không phải là chạy code. Mô hình thường tin vào mô tả của
chính nó hơn là kiểm tra thật.

## What read back means
Copy nguyên văn lệnh CHÍNH XÁC từ `doctrine/MEMORY.md`, chạy, đọc kết quả
verbatim, ghi vào evidence note — không tự diễn giải, không tóm tắt thành
kết luận riêng.

## No Exceptions
Chưa verify được → báo `blocked`. Không có ngoại lệ "chắc là đúng".

## Failure mode this catches
"Green-by-supposition" — tự claim test pass mà không thực sự chạy.

## Enforcement
Implementer: hard rule `TestsBeforeDone`. Verifier: hard rule `EvidencePerAction` —
claim không đủ bằng chứng → REOPEN. Liên quan: `EDIT_UNVERIFIED`.
