---
description: Tolaria Sprint F — TOCTOU backup fix, remove dead #![allow(dead_code)], CI dedup
---

# Tolaria Sprint F — Instruction Set F Execution

**Domain:** Rust/Tauri desktop application — file-safety critical path
**Audit gate required after ALL steps complete before proceeding to Sprint G.**

---

## Pre-flight Check

// turbo
1. Verify baseline — all gates must be green before any edits:
```pwsh
Set-Location "c:\Users\Geoff Parsons\Desktop\tolaria-automation\src-tauri"
cargo test 2>&1 | Select-String "test result"
cargo clippy -- -D warnings 2>&1 | Select-Object -Last 2
```
Expected: `16 passed`, `Finished` with no errors.

---

## F1 — Fix TOCTOU backup in `update_frontmatter`

**File:** `src-tauri/src/commands/vault.rs`
**Problem:** `update_frontmatter` reads file content at line 222 then does `fs::copy` from disk at line 236.
Between those two calls another process can modify the file — the backup captures modified data, not the user's version.
**Fix:** Replace `fs::copy` with `fs::write(&bak_path, &content)` — backup from the already-loaded in-memory string.

2. Open `src-tauri/src/commands/vault.rs`. Locate the `update_frontmatter` function.

3. Replace this block inside `update_frontmatter` (the backup section after `let new_content = format!(...)`):
```rust
// REMOVE:
let bak_path = make_bak_path(&path);
if std::path::Path::new(&path).exists() {
    std::fs::copy(&path, &bak_path)
        .map_err(|e| format!("Failed to create backup: {}", e))?;
}

// REPLACE WITH:
let bak_path = make_bak_path(&path);
std::fs::write(&bak_path, &content)
    .map_err(|e| format!("Failed to create backup: {}", e))?;
```
The `exists()` guard is no longer needed — `content` is already loaded from the file above, so if the file was readable then, the backup write to a sibling path will succeed regardless of the source file's current state.

---

## F2 — Remove `#![allow(dead_code)]` from all 5 command files

**Files:** `commands/vault.rs`, `commands/ai.rs`, `commands/clipboard.rs`, `commands/productivity.rs`, `commands/desktop.rs`
**Problem:** These attributes suppress warnings that do not exist — the commands are registered via `generate_handler!` and the helpers are called internally. The suppression is cargo-culted dead weight that hides future real issues.

4. Delete line 1 (`#![allow(dead_code)] // ...`) from each of these files:
   - `src-tauri/src/commands/vault.rs`
   - `src-tauri/src/commands/ai.rs`
   - `src-tauri/src/commands/clipboard.rs`
   - `src-tauri/src/commands/productivity.rs`
   - `src-tauri/src/commands/desktop.rs`

// turbo
5. After removal, verify no new warnings were introduced:
```pwsh
Set-Location "c:\Users\Geoff Parsons\Desktop\tolaria-automation\src-tauri"
cargo build 2>&1 | Select-String "^warning" | Where-Object { $_ -match "src\\" }
```
Expected output: **empty** (zero warnings from project source files).
If any warnings appear, fix each individually — do NOT re-add the blanket `#![allow(dead_code)]`.

---

## F3 — Remove redundant `cargo check` step from CI

**File:** `.github/workflows/ci.yml`
**Problem:** `cargo check` runs before `cargo clippy -- -D warnings`. Clippy is a strict superset — it runs all check passes plus lint passes. The check step wastes ~30-60s of CI time for zero additional coverage.

6. Open `.github/workflows/ci.yml`. Delete the entire step block:
```yaml
      - name: cargo check (zero warnings gate)
        working-directory: src-tauri
        run: cargo check 2>&1
        # Note: warnings are suppressed at source, so this should be clean
```

---

## Post-edit Gate (STOP HERE — run all gates before committing)

// turbo
7. Run full gate suite:
```pwsh
Set-Location "c:\Users\Geoff Parsons\Desktop\tolaria-automation\src-tauri"
cargo test 2>&1 | Select-String "test result"
```
Expected: `16 passed; 0 failed`

// turbo
8. Clippy clean:
```pwsh
Set-Location "c:\Users\Geoff Parsons\Desktop\tolaria-automation\src-tauri"
cargo clippy -- -D warnings 2>&1 | Select-Object -Last 2
```
Expected: `Finished` — no errors, no warnings.

// turbo
9. Frontend gates:
```pwsh
Set-Location "c:\Users\Geoff Parsons\Desktop\tolaria-automation"
pnpm exec tsc --noEmit; pnpm test:run 2>&1 | Select-Object -Last 4
```
Expected: tsc silent, `5 passed (5)`.

---

## Commit (only after ALL gates green)

10. Commit the F fixes:
```pwsh
Set-Location "c:\Users\Geoff Parsons\Desktop\tolaria-automation"
git add src-tauri/src/commands/vault.rs src-tauri/src/commands/ai.rs src-tauri/src/commands/clipboard.rs src-tauri/src/commands/productivity.rs src-tauri/src/commands/desktop.rs .github/workflows/ci.yml
git commit -m "fix(sprint-f): TOCTOU backup fix, remove dead allow(dead_code), dedup CI check step"
```

---

## Audit Handoff

After commit, report:
- Exact test count from `cargo test`
- Output of `cargo clippy -- -D warnings` last line
- Output of `cargo build 2>&1 | Select-String "^warning"` (should be empty)
- Git log `--oneline -3`

**DO NOT proceed to Sprint G (runtime smoke test) until audit grading is returned.**
