> Đây là chỗ TÔI học được khi làm việc. Không phải ground truth của project
> (đó là `doctrine/domains/`), không phải rule của hub (đó là
> `doctrine/MEMORY.md`) — mà là craft riêng tôi tích trên codebase này.
> Append-only: sửa một entry khi nó hoá ra sai, đừng lặng lẽ bỏ nó đi.

## Always true for me
- Tôi đọc `doctrine/MEMORY.md` để lấy lệnh test CHÍNH XÁC mỗi phiên
  (`npm test` từ repo root — xem `<<FILL>>` cho lint/typecheck).
- Tôi chạy test từ repo root (`/Users/_david/Workspace/Project/ResumeAPI/backend`)
  trừ khi `doctrine/MEMORY.md` nói khác.
- Khi test fail HAI LẦN cùng lý do, tôi dừng và đọc lại `doctrine/domains/`
  trước khi thử lần ba — hai lần fail nghĩa là mô hình của tôi về project
  sai, không phải code sai.

## Patterns that work here
<<FILL>>

## Recipes I've earned
| Recipe | Written | Times replayed |
|---|---|---|
| pick_next | 2026-08-20 | 0 |
| implement | 2026-08-20 | 0 |

## Corrections
| Date | I believed | Actually |
|---|---|---|
