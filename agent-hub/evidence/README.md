> Evidence is ai đã làm gì và tại sao (`NO_EVIDENCE` nếu thiếu). Mọi worker
> action kết thúc bằng một note.

## Layout
```
evidence/implementer/<date>/<slug>-plan.md
evidence/implementer/<date>/<slug>-diff.md
evidence/verifier/<date>/<slug>-{seal|reopen}.md
```
Ngày dạng `YYYY-mm-dd`, slug kebab-case lấy từ tên task.

## Format — implementer note
- Tiêu đề (ngày - node) · Worker · Version · Node (trỏ diagram) · Task
  (nguyên văn prompt)
- `## Diff` — files | file | why |
- `## Command` — lệnh nguyên văn từ `doctrine/MEMORY.md`
- `## Output` — nguyên văn, không tự diễn giải
- `## Acceptance` — bảng | Criterion | Evidence | (evidence trỏ tới dòng
  output cụ thể — không nói suông "tests pass", phải trích "Tests: 42
  passed, 42 total")
- `## Noticed, not done` — điều nhận thấy ngoài scope nhưng không tự sửa
- `## Seal gate` — ghi approval nếu có hành động outward-facing, hoặc "none"

## Format — verifier verdict
- Worker · Node · PM status mới (PENDING/SEALED/REOPEN)
- `## Reasoning` — trích dẫn evidence cho từng criterion
- `## Missing` — chỉ có khi REOPEN

## The three rules of this directory
1. **VERBATIM, ALWAYS** — không claim gì thiếu evidence trích dẫn thật.
2. **KHÔNG BAO GIỜ XOÁ** — note sai thì thêm correction, không xoá.
3. **BAD NOTES STAY** — note "task thất bại" vẫn giữ lại; giữ trail sạch
   không quan trọng bằng giữ giá trị của doctrine.
