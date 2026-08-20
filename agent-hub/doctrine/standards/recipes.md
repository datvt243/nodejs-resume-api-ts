> Recipe là SAVED REASONING — các bước tốt định thay thế việc suy ra từ
> đầu. Lần sau chỉ cần replay.

## Why they matter (Trí Tuệ Tích Luỹ)
"Recipes are capital. Models are fuel." Trí tuệ tích luỹ không nằm trong
model — nó nằm trong recipe đã viết ra.

## When to write one
Viết recipe khi: (1) task này lặp lại ≥ 2 lần, (2) có bước dễ nhầm/khó nhớ,
(3) có bước tốn công debug mới ra, (4) quy trình đủ dài để đáng lưu lại.

## What they are NOT
Không phải action/lệnh cố định trong `manifest.yaml` — đó là thẩm quyền khác.
Recipe sống ở `haven/workers/<wid>/recipes/*.md`.

## Format (bắt buộc 5 mục)
1. **Contract** — Input, Output, khi nào dùng.
2. **Steps** — đánh số, tất định.
3. **Hard rules honored** — liệt kê tên hard rule liên quan.
4. **Failure branches** — bảng | Failure | Handling |.
5. **Runtime** — cách gọi (`/worker <wid> "<task>"`).

## Maintaining them
Recipe sai thì sửa lại, và ghi vào bảng Corrections trong `MEMORY.md` của
worker khi phát hiện nó sai. Không xoá rồi bỏ đi — sửa và giữ lại bài học.
