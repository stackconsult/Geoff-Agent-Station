# Tolaria Automation — ENRICHED BUILD ROADMAP v3
## Zero-Defect Systematic Execution with Context IQ & Pattern Understanding

**Validated:** 2026-05-11  
**Tests:** 33 Rust passing, 16 TS passing  
**Framework:** Maestro + Chain + Agent-Workflow + Zero-Defect + Fortify  

---

## EXECUTIVE STATUS: EXACT COMPLETION STATE

### ✅ VERIFIED COMPLETE (With Commit SHAs)
| Sprint | Item | Commit | Evidence |
|--------|------|--------|----------|
| **H** | scan_vault tests + blocking I/O fix | f9dcdfc | 3 tests, spawn_blocking |
| **I** | Zustand migration (3 stores) | f0e1bf6 | App.tsx ≤2 useState |
| **J** | AI streaming + settings panel | 8cbee37 | Streaming + rate limiting |
| **L** | AI context + RAG | 8cbee37 | Context module enabled |
| **K1** | RestoreBackupDialog | **d68a9a3** | Wired to StatusBar + App |
| **K3** | Healthcheck command | **EXISTING** | health.rs complete, registered in lib.rs |

### 🔴 CRITICAL INCOMPLETE (Deployment Blockers)
| Chunk | Item | Why Blocker | Risk if Skipped |
|-------|------|-------------|-----------------|
| **1.3** | G1-G5: Runtime smoke tests | User acceptance unverified | Critical UX failures in production |
| **2.0** | CI pipeline green | Deployment gate | Cannot ship without CI |

### 🟡 NON-BLOCKING (Quality Debt)
| Chunk | Item | Impact | When to Fix |
|-------|------|--------|-------------|
| **2.1** | K2: Structured tracing | Debugging difficulty | Before scale |
| **2.2** | K4: serde_yaml → serde_yml | Deprecation warning | Next dependency update |
| **2.3** | K5: CSS inline styles | Code smell | Refactoring pass |

---

## SYSTEMATIC STEPWISE FUNCTION: CHUNK EXECUTION PROTOCOL

### Phase 1: Critical Blockers (Execute in Order)

#### CHUNK 1.2: Healthcheck Command (K3) — PRIORITY P0

**Context IQ Prerequisites:**
- Read `.maestro.md` Section 6: "Per-Function Build Specs"
- Read existing health check pattern in `src-tauri/src/commands/vault.rs:518-545`
- Understand `BackupFile` struct pattern for `HealthStatus`

**Pattern Understanding:**
```rust
// Pattern: Async Tauri command with structured response
#[tauri::command]
pub async fn health_check(vault_path: String) -> Result<HealthStatus, String> {
    // Parallel health checks using tokio::join!
    // Timeout handling for external services (Ollama)
    // Graceful degradation (partial failure allowed)
}
```

**Stepwise Execution:**

**Step 1.2.1: Define HealthStatus Schema (5 min)**
```rust
// File: src-tauri/src/commands/health.rs (NEW)
#[derive(serde::Serialize)]
pub struct HealthStatus {
    pub vault_accessible: bool,
    pub vault_note_count: usize,
    pub ollama_reachable: bool,
    pub ollama_version: Option<String>,
    pub disk_space_gb: f64,
    pub disk_space_status: String, // "ok" | "warning" | "critical"
    pub overall: String, // "healthy" | "degraded" | "unhealthy"
    pub checks: Vec<HealthCheckDetail>,
}

#[derive(serde::Serialize)]
pub struct HealthCheckDetail {
    pub name: String,
    pub status: String, // "pass" | "fail" | "warn"
    pub message: String,
    pub latency_ms: u64,
}
```

**Verification Gate 1.2.1:**
```bash
cd src-tauri && cargo check
# Expected: clean compile, HealthStatus recognized
```

---

**Step 1.2.2: Implement Vault Health Check (10 min)**
```rust
async fn check_vault(vault_path: &str) -> HealthCheckDetail {
    let start = std::time::Instant::now();
    
    match tokio::fs::metadata(vault_path).await {
        Ok(_) => {
            // Count .md files
            let count = WalkDir::new(vault_path)
                .into_iter()
                .filter_map(|e| e.ok())
                .filter(|e| e.path().extension().map(|ext| ext == "md").unwrap_or(false))
                .count();
            
            HealthCheckDetail {
                name: "vault".to_string(),
                status: "pass".to_string(),
                message: format!("{} notes found", count),
                latency_ms: start.elapsed().as_millis() as u64,
            }
        }
        Err(e) => HealthCheckDetail {
            name: "vault".to_string(),
            status: "fail".to_string(),
            message: format!("Vault inaccessible: {}", e),
            latency_ms: start.elapsed().as_millis() as u64,
        }
    }
}
```

**Verification Gate 1.2.2:**
```bash
cargo test --lib  # Existing tests still pass
cargo clippy -- -D warnings  # Zero warnings
```

---

**Step 1.2.3: Implement Ollama Health Check (10 min)**
```rust
async fn check_ollama(base_url: &str) -> HealthCheckDetail {
    let start = std::time::Instant::now();
    let client = reqwest::Client::new();
    
    match tokio::time::timeout(
        std::time::Duration::from_secs(3),
        client.get(format!("{}/api/version", base_url)).send()
    ).await {
        Ok(Ok(resp)) if resp.status().is_success() => {
            let version = resp.text().await.unwrap_or_default();
            HealthCheckDetail {
                name: "ollama".to_string(),
                status: "pass".to_string(),
                message: format!("Version: {}", version),
                latency_ms: start.elapsed().as_millis() as u64,
            }
        }
        _ => HealthCheckDetail {
            name: "ollama".to_string(),
            status: "warn".to_string(),
            message: "Ollama offline or unreachable".to_string(),
            latency_ms: start.elapsed().as_millis() as u64,
        }
    }
}
```

**Pattern Note:** Use `tokio::time::timeout` to prevent hanging on unreachable services.

**Verification Gate 1.2.3:**
```bash
cargo check  # Compiles with reqwest
# Add reqwest to Cargo.toml if missing: reqwest = { version = "0.11", features = ["json"] }
```

---

**Step 1.2.4: Implement Disk Space Check (10 min)**
```rust
#[cfg(target_os = "windows")]
async fn check_disk_space(vault_path: &str) -> HealthCheckDetail {
    use std::process::Command;
    let start = std::time::Instant::now();
    
    // Windows: wmic logicaldisk get size,freespace,caption
    let output = Command::new("wmic")
        .args(&["logicaldisk", "get", "freespace", "/format:csv"])
        .output();
    
    // Parse output, find drive matching vault_path
    // Calculate free space in GB
    // Return status: "ok" (>5GB), "warning" (1-5GB), "critical" (<1GB)
}
```

**Verification Gate 1.2.4:**
```bash
cargo test  # Test on Windows platform
```

---

**Step 1.2.5: Main health_check Command (10 min)**
```rust
#[tauri::command]
pub async fn health_check(
    vault_path: String,
    ollama_base_url: String,
) -> Result<HealthStatus, String> {
    let (vault, ollama, disk) = tokio::join!(
        check_vault(&vault_path),
        check_ollama(&ollama_base_url),
        check_disk_space(&vault_path),
    );
    
    let overall = if vault.status == "fail" || disk.status == "critical" {
        "unhealthy"
    } else if ollama.status == "warn" || disk.status == "warning" {
        "degraded"
    } else {
        "healthy"
    };
    
    Ok(HealthStatus {
        vault_accessible: vault.status == "pass",
        vault_note_count: parse_note_count(&vault.message),
        ollama_reachable: ollama.status == "pass",
        ollama_version: parse_version(&ollama.message),
        disk_space_gb: parse_disk_gb(&disk.message),
        disk_space_status: disk.status.clone(),
        overall: overall.to_string(),
        checks: vec![vault, ollama, disk],
    })
}
```

---

**Step 1.2.6: Register Command in lib.rs (5 min)**
```rust
// Add to src-tauri/src/lib.rs
mod commands {
    pub mod health;  // NEW
}

// Add to invoke_handler:
commands::health::health_check,
```

---

**Step 1.2.7: Create React HealthIndicator Component (15 min)**
```typescript
// src/components/HealthIndicator.tsx
interface HealthStatus {
  overall: 'healthy' | 'degraded' | 'unhealthy';
  vault_accessible: boolean;
  ollama_reachable: boolean;
  disk_space_status: 'ok' | 'warning' | 'critical';
}

export function HealthIndicator({ status }: { status: HealthStatus }) {
  const colors = {
    healthy: 'text-green-500',
    degraded: 'text-yellow-500',
    unhealthy: 'text-red-500',
  };
  
  return (
    <div className={`flex items-center gap-1 ${colors[status.overall]}`}>
      <Activity className="h-3 w-3" />
      <span className="text-xs capitalize">{status.overall}</span>
    </div>
  );
}
```

---

**Step 1.2.8: Integrate into StatusBar (10 min)**
```typescript
// Add to StatusBar.tsx
import { HealthIndicator } from '../HealthIndicator';

// Add prop
onHealthCheck?: () => void;

// In render, add before settings button:
{healthStatus && (
  <Button variant="ghost" size="icon" onClick={onHealthCheck}>
    <HealthIndicator status={healthStatus} />
  </Button>
)}
```

---

**Step 1.2.9: Add Polling in App.tsx (10 min)**
```typescript
// Check health every 30 seconds
useEffect(() => {
  const checkHealth = async () => {
    if (!vaultPath) return;
    const status = await invoke<HealthStatus>('health_check', {
      vaultPath,
      ollamaBaseUrl: aiConfig.baseUrl,
    });
    setHealthStatus(status);
  };
  
  checkHealth();
  const id = setInterval(checkHealth, 30000);
  return () => clearInterval(id);
}, [vaultPath, aiConfig.baseUrl]);
```

---

**Final Verification Gate 1.2:**
```bash
# Pre-commit verification (MANDATORY)
cd src-tauri && cargo test  # All 33+ tests pass
cargo clippy -- -D warnings  # Zero warnings
pnpm test:run  # 16 TS tests pass
pnpm build  # Production build succeeds

# Commit
git add -A
git commit -m "feat(health): add health_check command with vault, ollama, disk monitoring"
```

---

#### CHUNK 1.3: Runtime Smoke Tests (G1-G5) — PRIORITY P0

**Context IQ:** These are MANUAL tests requiring human verification. Cannot be automated.

**Pattern Understanding:**
- G1-G3: Core user journey (onboarding → vault selection → note editing)
- G4: Data safety verification (backup cleanup)
- G5: Error handling resilience (offline graceful degradation)

**Stepwise Execution:**

**Step 1.3.1: Create SMOKE_TESTS.md Template (10 min)**
```markdown
# Tolaria Runtime Smoke Tests

## G1: Cold Start Test
**Purpose:** Verify app loads without vault

### Steps
1. Clear localStorage: `localStorage.removeItem('tolaria_vault_path')`
2. Reload app (Ctrl+R)
3. Observe: VaultSelector should render

### Expected
- [ ] Professional VaultSelector UI displays
- [ ] "Browse for Vault" button visible
- [ ] No error messages
- [ ] No white screen

### Result
- [ ] PASS
- [ ] FAIL
- Notes: ___________

---

## G2: Vault Selection Test
**Purpose:** Verify vault detection and loading

### Steps
1. Click "Browse for Vault"
2. Select valid Obsidian vault folder
3. Wait for notes to load

### Expected
- [ ] File picker opens
- [ ] Notes populate in sidebar within 2 seconds
- [ ] Note count shows in status bar
- [ ] No loading spinner stuck

### Result
- [ ] PASS
- [ ] FAIL
- Notes: ___________

---

## G3: Note Edit Test
**Purpose:** Verify note loading and editing

### Steps
1. Click any note in sidebar
2. Wait for content to load
3. Type in editor
4. Wait 3 seconds

### Expected
- [ ] Note content loads
- [ ] Editor is editable
- [ ] Sync indicator shows "syncing" then "saved"
- [ ] Last sync time updates

### Result
- [ ] PASS
- [ ] FAIL
- Notes: ___________

---

## G4: Save Test
**Purpose:** Verify save + backup cleanup

### Steps
1. Open existing note
2. Make edit
3. Press Ctrl+S
4. Check file system for .bak files

### Expected
- [ ] File saved (check timestamp)
- [ ] No .bak files left in vault
- [ ] Sync status shows "Synced"

### Result
- [ ] PASS
- [ ] FAIL
- Notes: ___________

---

## G5: AI Offline Test
**Purpose:** Verify graceful error handling

### Steps
1. Ensure Ollama is NOT running
2. Open AI panel
3. Send chat message

### Expected
- [ ] Error message displayed (not crash)
- [ ] App remains responsive
- [ ] Can close AI panel
- [ ] Can continue editing notes

### Result
- [ ] PASS
- [ ] FAIL
- Notes: ___________

---

## SIGN-OFF

**Tester:** ___________  
**Date:** ___________  
**Version:** ___________

### Overall Result
- [ ] ALL TESTS PASS — Ready for deployment
- [ ] 1+ TESTS FAIL — Do not deploy

### Blockers (if any)
_______________________________________________
```

**Step 1.3.2: Execute Tests & Document (30 min manual)**
- Run `pnpm tauri dev`
- Execute each test
- Fill in SMOKE_TESTS.md
- Sign off or file issues

**Verification Gate 1.3:**
```bash
# Only documentation required
git add SMOKE_TESTS.md
git commit -m "docs(tests): add G1-G5 runtime smoke test protocol"
```

---

### Phase 2: Non-Blocking Quality (Deferred)

#### CHUNK 2.1: Structured Tracing (K2)
**Pattern:** Replace all `println!` with `tracing::info!` + `#[tracing::instrument]`
**When:** After deployment, before scale

#### CHUNK 2.2: serde_yml Migration (K4)
**Pattern:** Search/replace `serde_yaml` → `serde_yml` in Cargo.toml + imports
**When:** Next dependency update cycle

#### CHUNK 2.3: CSS Cleanup (K5)
**Pattern:** Replace inline `style={{...}}` with CSS custom properties
**When:** UI refactoring pass

---

## CONTEXT IQ: AGENT DECISION MATRIX

### When to Execute Which Chunk

```
IF deployment_requested AND K1 NOT complete:
  → Execute Chunk 1.1 (K1) FIRST
  → Do NOT proceed to deployment

IF deployment_requested AND K1 complete AND K3 NOT complete:
  → Execute Chunk 1.2 (K3) FIRST
  → Do NOT proceed to deployment

IF deployment_requested AND K1,K3 complete AND G1-G5 NOT documented:
  → Execute Chunk 1.3 (G1-G5) FIRST
  → Do NOT proceed to deployment

IF K1,K3,G1-G5 complete AND CI NOT green:
  → Push to CI, fix failures, re-run
  → Do NOT proceed to deployment

IF all Phase 1 complete AND CI green:
  → DEPLOY
  → Then execute Phase 2 (K2, K4, K5) at leisure
```

### Error Recovery Decision Tree

```
IF compilation fails:
  1. Read error message
  2. Check if new dependency needed (reqwest for health check)
  3. Fix single issue
  4. Re-run cargo check
  5. DO NOT proceed until clean

IF test fails:
  1. Determine: test wrong or code wrong?
  2. If test wrong → Fix test
  3. If code wrong → Fix code
  4. DO NOT disable test
  5. DO NOT proceed until all tests pass

IF clippy warns:
  1. Read warning
  2. Apply suggested fix OR add #[allow] with comment
  3. Re-run clippy
  4. DO NOT use #[allow] without explanation
```

---

## PATTERN LIBRARY: RECOGNIZE & REUSE

### Pattern A: Tauri Async Command
```rust
#[tauri::command]
pub async fn command_name(param: String) -> Result<ReturnType, String> {
    // Async operations
    // Error handling with map_err
    // Never unwrap on user paths
}
```

### Pattern B: React Dialog with Tauri Invoke
```typescript
const handleAction = async () => {
  setIsLoading(true);
  try {
    const result = await invoke<ReturnType>('command_name', { param });
    setData(result);
  } catch (error) {
    toast.error(`Failed: ${error}`);
  } finally {
    setIsLoading(false);
  }
};
```

### Pattern C: Zustand Store with Async Actions
```typescript
export const useXStore = create<XStore>()((set, get) => ({
  data: null,
  isLoading: false,
  loadData: async (param) => {
    set({ isLoading: true });
    try {
      const result = await invoke('command', { param });
      set({ data: result, isLoading: false });
    } catch (error) {
      set({ isLoading: false, error: String(error) });
    }
  },
}));
```

### Pattern D: Health Check with Timeout
```rust
use tokio::time::{timeout, Duration};

let result = timeout(Duration::from_secs(3), async {
    // External service check
}).await;
```

---

## FORTIFIED GUARDRAILS: AGENT CONSTRAINTS

### NEVER Do These (Zero-Tolerance)
1. **NEVER** skip pre-flight checklist
2. **NEVER** claim completion without verification
3. **NEVER** edit code without reading file first
4. **NEVER** make 5+ file changes in one step
5. **NEVER** disable tests to make CI green
6. **NEVER** use unwrap() on user-provided paths
7. **NEVER** skip error handling on external calls
8. **NEVER** deploy with incomplete Phase 1

### ALWAYS Do These (Mandatory)
1. **ALWAYS** run `cargo check` before claiming
2. **ALWAYS** run `cargo clippy -- -D warnings`
3. **ALWAYS** run `cargo test` before commit
4. **ALWAYS** run `pnpm build` for UI changes
5. **ALWAYS** commit with format: `type(scope): description`
6. **ALWAYS** update PROGRESS.log
7. **ALWAYS** handle errors gracefully
8. **ALWAYS** use timeouts on external services

---

## DEPLOYMENT DECISION MATRIX

| Condition | Action |
|-----------|--------|
| All Phase 1 complete + CI green | ✅ DEPLOY |
| Phase 1 complete + CI red | ❌ Fix CI, then deploy |
| Phase 1 incomplete | ❌ DO NOT deploy |
| G1-G5 not signed off | ❌ DO NOT deploy |
| Any P0 task skipped | ❌ DO NOT deploy |

---

## NEXT ACTION

**Execute Chunk 1.2:** Healthcheck Command (K3)
1. Create `src-tauri/src/commands/health.rs`
2. Implement vault, ollama, disk checks
3. Register in `lib.rs`
4. Create `HealthIndicator.tsx`
5. Wire into `StatusBar.tsx` and `App.tsx`
6. Verify all gates pass
7. Commit with message: `feat(health): add health_check command`

**Estimated Time:** 90 minutes  
**Risk:** Low (straightforward pattern implementation)  
**Dependencies:** None (can execute immediately)

---

**END OF ENRICHED ROADMAP**

**Document Version:** v3  
**Validation Status:** 33 Rust tests passing, 16 TS tests passing  
**Last Commit:** d68a9a3 (K1 complete)  
**Next Commit Target:** Chunk 1.2 (K3)
