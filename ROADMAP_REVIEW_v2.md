# Tolaria Automation — HIGH DEFINITION ROADMAP REVIEW
## Systematic Build Map with Zero-Defect Execution Harness

**Generated:** 2026-05-11  
**Framework:** Maestro + Chain + Agent-Workflow + Zero-Defect  
**Execution Mode:** Chunk-based engineering with verification gates

---

## 1. EXECUTIVE SUMMARY: CURRENT STATE

### ✅ COMPLETED (Production Quality Verified)
| Sprint | Items | Quality Gate |
|--------|-------|--------------|
| **H** | scan_vault tests, blocking I/O fix, VaultSelector tests | 30 Rust tests, 16 TS tests |
| **I** | Zustand migration (3 stores), App.tsx ≤2 useState | Stores wired, all tests pass |
| **J** | AI streaming, settings panel, rate limiting | Streaming verified, settings persist |
| **L** | AI context, documentation ingestion, RAG search | Context module enabled |
| **VaultSelector** | Professional UI/UX redesign | Skeleton loading, dialog, accessibility |

### 🔴 INCOMPLETE (Blocking Deployment)
| Item | Severity | Effort | Risk |
|------|----------|--------|------|
| **K1: RestoreBackupDialog** | CRITICAL | Medium | Data loss recovery |
| **K3: Healthcheck command** | HIGH | Low | Production monitoring |
| **G1-G5: Runtime smoke tests** | CRITICAL | Manual | User acceptance |
| **CI pipeline verification** | HIGH | Low | Deployment readiness |

### 🟡 REMAINING (Non-blocking polish)
| Item | Severity | Effort |
|------|----------|--------|
| K2: Structured tracing | Medium | Medium |
| K4: serde_yaml → serde_yml | Low | Low |
| K5: SystemMonitor.tsx inline styles | Low | Low |

---

## 2. MVP vs DEPLOYED PRODUCT: KEY DIFFERENTIATORS

### MVP Quality (Current State)
```
✓ Core features functional
✓ Tests pass (30 Rust, 16 TS)
✓ No hardcoded paths
✓ Backup-before-write safety
✗ .bak files invisible to users (no recovery UI)
✗ No health monitoring
✗ Manual smoke tests not documented
✗ No structured logging
```

### Deployed Product Quality (Target)
```
✓ All MVP items
✓ User can recover from .bak files (RestoreBackupDialog)
✓ Healthcheck endpoint for monitoring
✓ Documented runtime smoke tests (G1-G5)
✓ Structured tracing for observability
✓ CI/CD pipeline green
✓ Zero deprecation warnings
```

### KEY DIFFERENCES
| Dimension | MVP | Deployed |
|-----------|-----|----------|
| **Data Recovery** | Automatic .bak creation | User-visible recovery dialog |
| **Observability** | println! debugging | Structured tracing + spans |
| **Monitoring** | None | Healthcheck command |
| **Quality Gates** | Automated tests only | Tests + documented smoke tests |
| **Dependencies** | Deprecated serde_yaml | Modern serde_yml |
| ** polish** | Inline styles | CSS custom properties |

---

## 3. SYSTEMATIC BUILD MAP: CHUNK-BASED ENGINEERING

### Phase 1: CRITICAL BLOCKERS (Deploy Without These = Unacceptable)

#### Chunk 1.1: RestoreBackupDialog (K1) — PRIORITY P0
**Purpose:** Surface .bak files to user for data recovery
**Why Critical:** Users need visibility into backup files created by backup-before-write safety

**Sub-chunks:**
```
1.1.1: Rust command — list_backup_files(vault_path) → Vec<BackupInfo>
1.1.2: Rust command — restore_from_backup(file_path, backup_path) → Result<()>
1.1.3: React component — RestoreBackupDialog.tsx
1.1.4: Integration — Add to StatusBar menu
1.1.5: Test — Backup detection, restore flow, error handling
```

**Zero-Defect Gates per Sub-chunk:**
- [ ] Code compiles: `cargo check`
- [ ] Clippy clean: `cargo clippy -- -D warnings`
- [ ] Tests pass: `cargo test` and `pnpm test:run`
- [ ] No unwrap() on user paths
- [ ] Error handling for missing .bak files
- [ ] UI tested manually (dialog opens, lists backups, restores)

**Data Flow:**
```
User clicks "View Backups" → 
  invoke('list_backup_files', { vaultPath }) → 
    Rust: WalkDir *.bak → Return { original_path, backup_path, created_at, size } →
      React: Render list with "Restore" buttons →
        User clicks Restore →
          invoke('restore_from_backup', { filePath, backupPath }) →
            Rust: fs::copy(backup, original) → Return Ok(()) →
              React: Show success toast, refresh editor
```

**Error Handling:**
- No backups found → Empty state with helpful message
- Restore fails → Error toast with file path, keep dialog open
- Backup file missing → Remove from list, show warning

---

#### Chunk 1.2: Healthcheck Command (K3) — PRIORITY P0
**Purpose:** Production monitoring endpoint
**Why Critical:** Operations need visibility into system health

**Sub-chunks:**
```
1.2.1: Rust command — health_check() → HealthStatus
1.2.2: Frontend — HealthIndicator component in StatusBar
1.2.3: Test — Healthcheck returns correct status for each component
```

**HealthStatus Schema:**
```rust
struct HealthStatus {
    vault_accessible: bool,
    vault_path: String,
    vault_note_count: usize,
    ollama_reachable: bool,
    ollama_version: Option<String>,
    disk_space_gb: f64,
    disk_space_status: String, // "ok", "warning", "critical"
    overall: String, // "healthy", "degraded", "unhealthy"
}
```

**Zero-Defect Gates:**
- [ ] All health checks have timeouts (no hanging)
- [ ] Graceful degradation (one failure doesn't break others)
- [ ] Disk space thresholds: warning < 5GB, critical < 1GB
- [ ] Ollama check attempts connection, handles offline gracefully
- [ ] Frontend shows green/yellow/red indicator

---

#### Chunk 1.3: Runtime Smoke Tests (G1-G5) — PRIORITY P0
**Purpose:** Documented manual acceptance testing
**Why Critical:** Automated tests don't catch UX/integration issues

**Test Protocol:**
```
G1: Cold Start Test
  Action: Clear localStorage, reload app
  Expected: VaultSelector renders with professional UI
  Pass: [ ] Fail: [ ] Notes: ___________

G2: Vault Selection Test
  Action: Click "Browse for Vault", select valid Obsidian vault
  Expected: Notes populate in sidebar within 2 seconds
  Pass: [ ] Fail: [ ] Notes: ___________

G3: Note Edit Test
  Action: Click note, type in editor, wait 3 seconds
  Expected: Sync indicator shows "syncing" then "saved"
  Pass: [ ] Fail: [ ] Notes: ___________

G4: Save Test
  Action: Press Ctrl+S, check file system
  Expected: File saved, no .bak files left behind (cleaned up)
  Pass: [ ] Fail: [ ] Notes: ___________

G5: AI Offline Test
  Action: Ensure Ollama is offline, send chat message
  Expected: Error message displayed, no crash, app responsive
  Pass: [ ] Fail: [ ] Notes: ___________
```

**Deliverable:** `SMOKE_TESTS.md` with signed-off checklist

---

### Phase 2: PRODUCTION HARDENING (Quality Differentiators)

#### Chunk 2.1: Structured Tracing (K2) — PRIORITY P1
**Purpose:** Replace println! with structured logging
**Effort:** Medium (requires adding tracing to many files)

**Sub-chunks:**
```
2.1.1: Add tracing to vault commands (load, save, update_frontmatter)
2.1.2: Add tracing to AI commands (chat, streaming, rate limiting)
2.1.3: Add tracing to vault_detection commands
2.1.4: Configure tracing subscriber in lib.rs with filter
2.1.5: Add tracing to file operations (backup, restore)
```

**Pattern:**
```rust
#[tracing::instrument(skip(content), fields(path = %path.display()))]
pub async fn save_note_content(
    path: PathBuf,
    content: String,
) -> Result<(), String> {
    tracing::info!("saving note");
    // ... logic ...
    tracing::info!("note saved successfully");
    Ok(())
}
```

---

#### Chunk 2.2: Dependency Migration (K4) — PRIORITY P2
**Purpose:** Replace deprecated serde_yaml with serde_yml
**Effort:** Low (search/replace dependency)

**Sub-chunks:**
```
2.2.1: Update Cargo.toml: serde_yaml → serde_yml
2.2.2: Update all imports: serde_yaml → serde_yml
2.2.3: Verify no API differences affect codebase
2.2.4: Run full test suite
```

---

#### Chunk 2.3: CSS Cleanup (K5) — PRIORITY P2
**Purpose:** Replace inline styles with CSS custom properties
**Effort:** Low

**Sub-chunks:**
```
2.3.1: Find SystemMonitor.tsx lines 76, 103 inline styles
2.3.2: Add CSS custom properties to App.css
2.3.3: Replace inline styles with classNames
2.3.4: Verify visual appearance unchanged
```

---

## 4. AGENT EXECUTION HARNESS (Even Unskilled Agents Can Execute)

### Pre-Flight Checklist (MANDATORY Before Any Code)
```bash
# 1. Verify clean state
git status  # MUST be clean
git log --oneline -3  # Verify current branch

# 2. Run baseline gates
cargo test
pnpm test:run

# 3. Document current state
echo "Starting: [CHUNK_NAME] at $(date)" >> PROGRESS.log
```

### Chunk Execution Template
```markdown
## Chunk: [CHUNK_ID] — [BRIEF DESCRIPTION]

### Pre-Chunk Verification
- [ ] Working tree clean
- [ ] Baseline tests pass
- [ ] .maestro.md context read and understood

### Sub-Chunk Execution
For each sub-chunk:
1. **Read** relevant files before writing (Zero-Defect Rule #1)
2. **Implement** with single logical change (Zero-Defect Rule #3)
3. **Verify** before claiming (Zero-Defect Rule #2):
   - `cargo check` — compiles
   - `cargo clippy -- -D warnings` — 0 warnings
   - `cargo test` — all pass
   - `pnpm test:run` — all pass
4. **Commit** with format: `type(scope): description`
5. **Document** in PROGRESS.log

### Post-Chunk Verification
- [ ] All gates pass
- [ ] Manual test completed (if UI change)
- [ ] Commit pushed to branch
- [ ] PROGRESS.log updated
```

### Error Recovery Protocol
```
IF compilation fails:
  1. Read error message carefully
  2. Fix only the reported issue
  3. Re-run cargo check
  4. DO NOT proceed until clean

IF tests fail:
  1. Read test output
  2. Determine if test or code is wrong
  3. Fix the root cause
  4. Re-run tests
  5. DO NOT disable tests

IF clippy warns:
  1. Read warning message
  2. Apply suggested fix OR justify with #[allow(...)]
  3. Re-run clippy
  4. DO NOT use #[allow] without comment explaining why
```

### Chain Pattern for Sequential Chunks
```
Chunk 1.1.1 (Rust command) 
  → Output: list_backup_files function
  → Input for 1.1.3: API contract defined

Chunk 1.1.3 (React component)
  → Depends on: 1.1.1 API
  → Output: RestoreBackupDialog.tsx
  → Input for 1.1.4: Component ready

Chunk 1.1.4 (Integration)
  → Depends on: 1.1.3 component
  → Output: Wired into StatusBar

Error Handling per Link:
- If 1.1.1 fails → Do not start 1.1.3
- If 1.1.3 fails → Fix before 1.1.4
- Partial results: Document what works
```

---

## 5. COMPLETE SCOPE ROADMAP CHECKLIST

### Phase 1: CRITICAL BLOCKERS (Must Complete for Deployment)

- [ ] **Chunk 1.1.1:** Rust list_backup_files command
  - [ ] Implementation
  - [ ] Tests
  - [ ] Verification gates
  - [ ] Commit

- [ ] **Chunk 1.1.2:** Rust restore_from_backup command
  - [ ] Implementation
  - [ ] Tests
  - [ ] Verification gates
  - [ ] Commit

- [ ] **Chunk 1.1.3:** RestoreBackupDialog React component
  - [ ] Implementation
  - [ ] Tests
  - [ ] Verification gates
  - [ ] Commit

- [ ] **Chunk 1.1.4:** StatusBar integration
  - [ ] Implementation
  - [ ] Manual test
  - [ ] Verification gates
  - [ ] Commit

- [ ] **Chunk 1.2.1:** Healthcheck Rust command
  - [ ] Implementation
  - [ ] Tests
  - [ ] Verification gates
  - [ ] Commit

- [ ] **Chunk 1.2.2:** HealthIndicator React component
  - [ ] Implementation
  - [ ] Manual test
  - [ ] Verification gates
  - [ ] Commit

- [ ] **Chunk 1.3:** Runtime smoke tests G1-G5
  - [ ] G1: Cold start test
  - [ ] G2: Vault selection test
  - [ ] G3: Note edit test
  - [ ] G4: Save test
  - [ ] G5: AI offline test
  - [ ] SMOKE_TESTS.md documentation

### Phase 2: PRODUCTION HARDENING

- [ ] **Chunk 2.1.1-2.1.5:** Structured tracing
- [ ] **Chunk 2.2.1-2.2.4:** serde_yml migration
- [ ] **Chunk 2.3.1-2.3.4:** CSS cleanup

### Final Deployment Gate

- [ ] All Phase 1 chunks complete
- [ ] All Phase 2 chunks complete (or deferred)
- [ ] SMOKE_TESTS.md signed off
- [ ] CI pipeline green
- [ ] Merge to master
- [ ] Tag release

---

## 6. FILE INVENTORY & OWNERSHIP

### Rust Commands
| File | Owner | Status |
|------|-------|--------|
| `src-tauri/src/commands/vault.rs` | Core | Complete |
| `src-tauri/src/commands/ai.rs` | Core | Complete |
| `src-tauri/src/commands/backup.rs` | **NEW** | Chunk 1.1 |
| `src-tauri/src/commands/health.rs` | **NEW** | Chunk 1.2 |

### React Components
| File | Owner | Status |
|------|-------|--------|
| `src/components/VaultSelector.tsx` | UI | Complete |
| `src/components/RestoreBackupDialog.tsx` | **NEW** | Chunk 1.1.3 |
| `src/components/HealthIndicator.tsx` | **NEW** | Chunk 1.2.2 |
| `src/components/StatusBar.tsx` | UI | Update needed |

### Tests
| File | Owner | Status |
|------|-------|--------|
| `src-tauri/src/commands/backup_tests.rs` | **NEW** | Chunk 1.1 |
| `src-tauri/src/commands/health_tests.rs` | **NEW** | Chunk 1.2 |
| `src/components/RestoreBackupDialog.test.tsx` | **NEW** | Chunk 1.1.3 |

---

## 7. DECISION LOG (Append Only)

| Date | Decision | Rationale |
|------|----------|-----------|
| 2026-05-11 | RestoreBackupDialog = P0 | Users need visibility into backups |
| 2026-05-11 | Healthcheck = P0 | Production monitoring required |
| 2026-05-11 | serde_yml = P2 | Deprecation non-blocking |
| 2026-05-11 | Chunk-based execution | Zero-defect, verifiable progress |

---

## 8. QUICK REFERENCE: Commands

```bash
# Pre-flight
git status && cargo test && pnpm test:run

# Verification gates
cargo check
cargo clippy -- -D warnings
cargo test
pnpm test:run
tsc --noEmit

# Commit
git add -A
git commit -m "type(scope): description"

# Manual testing
pnpm tauri dev
```

---

**END OF HIGH DEFINITION BUILD MAP**

Next Action: Execute Chunk 1.1.1 (list_backup_files Rust command)
