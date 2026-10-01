# Workspace Instructions

## Ponytail Skill Enforcement
Whenever writing, modifying, refactoring, or generating code in this repository:
- Always use the **`ponytail`** skill (`.agents/skills/ponytail/SKILL.md`).
- Follow the **Decision Ladder**:
  1. **YAGNI**: Question if code/feature is required.
  2. **Reuse**: Check codebase for existing functions/helpers.
  3. **Stdlib**: Prefer language standard library functions.
  4. **Native**: Use platform native capabilities before custom code.
  5. **Dependencies**: Use existing installed dependencies before adding new ones.
  6. **One-liner**: Implement in one line if possible.
  7. **Minimum Code**: Write only the simplest working code required.
- Do not over-engineer or add unrequested abstractions.

## Dokumentasi & Knowledge Graph
- Konvensi lengkap untuk agent ada di [`agent.md`](agent.md); gambaran proyek di [`README.md`](README.md), [`prd.md`](prd.md), [`architecture.md`](architecture.md), dan [`database.md`](database.md).
- Sebelum menelusuri banyak file untuk pertanyaan arsitektur, gunakan skill **`graphify`** (`graphify-out/GRAPH_REPORT.md`, `graphify query "<pertanyaan>"`). `graphify-out/` tidak di-commit; buat/perbarui dengan `graphify update .`.
- Setelah mengubah perilaku, skema, versi dependensi, atau jumlah test, perbarui dokumen yang terkait.
