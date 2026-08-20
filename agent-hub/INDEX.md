# INDEX.md — inventory của agent-hub

> Không lặp nội dung — chỉ trỏ tới. Đọc file gốc nếu cần chi tiết.

## Root
| File | Purpose |
|---|---|
| `NORTHSTAR.md` | "Done" nghĩa là gì, success picture 3 tháng tới |
| `CLAUDE.md` | Hợp đồng agent — forbidden states, seal gate, 4 lenses |
| `BOOT.md` | 5 sự thật định hướng cho `/boot` |
| `README.md` | Entry point cho người đọc |
| `.gitignore` | Loại scratch — KHÔNG ignore `evidence/` |

## doctrine/ — sự thật đã verify
| File | Purpose |
|---|---|
| `doctrine/INDEX.md` | Map của doctrine |
| `doctrine/SOUL.md` | Identity của hub agent + 7 invariants |
| `doctrine/MEMORY.md` ★ | Path, stack, LỆNH CHÍNH XÁC — authority cao nhất |
| `doctrine/domains/PROJECT.md` ★ | Ground truth Resume API: invariants, traps, decisions |
| `doctrine/standards/edit-verification.md` | Luật không claim thứ chưa quan sát |
| `doctrine/standards/recipes.md` | Recipe là gì, format bắt buộc |

## haven/ — memory + convention (KHÔNG BAO GIỜ chứa code)
| File | Purpose |
|---|---|
| `haven/diagrams/dev-loop.prime-mermaid.md` ★ | Nguồn trạng thái duy nhất của mọi task |
| `haven/workers/implementer/` | manifest, SOUL, MEMORY, recipes (`pick_next`, `implement`) |
| `haven/workers/verifier/` | manifest, SOUL, recipes (`verify_seal`) |

## evidence/ — audit trail
| File | Purpose |
|---|---|
| `evidence/README.md` | Format note + 3 quy tắc của thư mục |

## .claude/skills/ — harness (bên ngoài `agent-hub/`, tại repo root)
| File | Purpose |
|---|---|
| `.claude/skills/boot/SKILL.md` | Lệnh `/boot` |
| `.claude/skills/worker/SKILL.md` | Lệnh `/worker <implementer|verifier> "<task>"` |
| `.claude/skills/todo/SKILL.md` | Lệnh `/todo "<task>"` |

★ = file load-bearing — đọc 4 file này là đủ hiểu 80% cơ chế.
