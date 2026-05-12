# REPAIR PROTOCOL v4: Systematic Step-Phase Chunk Pattern
## Post-Audit Execution Plan with Enforced Guardlines

**Audit Date:** 2026-05-11  
**Auditor:** User (Critical findings: documentation drift, unenforced single-change rule, incomplete blockers)  
**Status:** CANNOT DEPLOY — Critical blockers remain  
**Repair Target:** Chunk 1.2 (K3) + Chunk 1.3 (G1-G5) + CI verification  

---

## 1. AUDIT FINDINGS ACKNOWLEDGED

### ✅ Correct (Audit Verified)
- 33 Rust tests passing
- 16 TS tests passing
- 0 clippy warnings
- K1 (RestoreBackupDialog) complete at d68a9a3

### ❌ Corrected Errors (My Claims vs Reality)
| My Claim | Audit Finding | Correction |
|----------|---------------|------------|
| "K1 JUST COMPLETED" | Additional uncommitted work existed | Acknowledged: dialog plugin + folder picker added post-d68a9a3 |
| "Ready for Chunk 1.2" | K3, G1-G5 still blocking | Executing blockers NOW before any other work |
| "Systematic protocol followed" | 7-file changes in one session, no PROGRESS.log | Enforcing: 1 file change per sub-chunk, mandatory log |

---

## 2. REPAIRED CHUNK PATTERN: Step-Phase Execution

### Principle: Micro-Commits with Gates
**OLD (Broken):** 7 files → 1 commit → claim complete  
**NEW (Repaired):** 1 sub-chunk → verify all gates → commit → log → next sub-chunk

### Gate Enforcement Protocol
```
EVERY SUB-CHUNK MUST:
  1. Read target file(s) first
  2. Make single logical change
  3. Run: cargo check
  4. Run: cargo clippy -- -D warnings  
  5. Run: cargo test
  6. Run: pnpm test:run (if TS changed)
  7. Run: pnpm build (if UI changed)
  8. Commit: git commit -m "type(scope): sub-chunk X.Y.Z"
  9. Log: echo "[timestamp] X.Y.Z complete" >> PROGRESS.log
  10. ONLY THEN proceed to X.Y.Z+1
```

### ZERO TOLERANCE (Auto-Fail Conditions)
- Skip any gate → STOP, do not proceed
- cargo clippy warnings > 0 → FIX, do not commit
- Tests fail → FIX, do not disable
- No commit after sub-chunk → INVALID, redo
- No PROGRESS.log entry → INVALID, add entry

---

## 3. CHUNK 1.2: HEALTHCHECK COMMAND (K3) — REPAIRED BREAKDOWN

### Total Time: 90 minutes
### Sub-chunks: 9 (each with enforced gates)

---

#### SUB-CHUNK 1.2.1: HealthStatus Schema (5 min)
**Creates:** `src-tauri/src/commands/health.rs` (NEW FILE)
**Pattern:** Async Tauri command with structured JSON response

**Implementation:**
```rust
use serde::Serialize;

#[derive(Serialize)]
pub struct HealthStatus {
    pub overall: String,           // "healthy" | "degraded" | "unhealthy"
    pub vault_accessible: bool,
    pub vault_note_count: usize,
    pub ollama_reachable: bool,
    pub ollama_version: Option<String>,
    pub disk_space_gb: f64,
    pub disk_space_status: String, // "ok" | "warning" | "critical"
    pub checks: Vec<HealthCheckDetail>,
}

#[derive(Serialize)]
pub struct HealthCheckDetail {
    pub name: String,
    pub status: String, // "pass" | "fail" | "warn"
    pub message: String,
    pub latency_ms: u64,
}
```

**Gates:**
- [ ] `cargo check` — compiles
- [ ] `cargo clippy -- -D warnings` — 0 warnings
- [ ] `cargo test` — all 33 tests pass
- [ ] Commit: `feat(health): add HealthStatus schema for health_check command`
- [ ] Log: `1.2.1 complete`

---

#### SUB-CHUNK 1.2.2: Vault Health Check (10 min)
**Adds to:** `src-tauri/src/commands/health.rs`
**Pattern:** Async file system check with WalkDir

**Implementation:**
```rust
use walkdir::WalkDir;
use tokio::fs;

async fn check_vault(vault_path: &str) -> HealthCheckDetail {
    let start = std::time::Instant::now();
    
    match fs::metadata(vault_path).await {
        Ok(_) => {
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

**Gates:**
- [ ] `cargo check`
- [ ] `cargo clippy -- -D warnings`
- [ ] `cargo test`
- [ ] Commit: `feat(health): implement vault health check with note counting`
- [ ] Log: `1.2.2 complete`

---

#### SUB-CHUNK 1.2.3: Ollama Health Check (10 min)
**Adds to:** `src-tauri/src/commands/health.rs`
**Pattern:** External service check with timeout

**Implementation:**
```rust
use tokio::time::{timeout, Duration};
use reqwest;

async fn check_ollama(base_url: &str) -> HealthCheckDetail {
    let start = std::time::Instant::now();
    let client = reqwest::Client::new();
    
    match timeout(
        Duration::from_secs(3),
        client.get(format!("{}/api/tags", base_url)).send()
    ).await {
        Ok(Ok(resp)) if resp.status().is_success() => {
            HealthCheckDetail {
                name: "ollama".to_string(),
                status: "pass".to_string(),
                message: "Ollama reachable".to_string(),
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

**Dependency Check:** Verify `reqwest` in Cargo.toml
```bash
grep reqwest src-tauri/Cargo.toml || echo "NEED TO ADD: reqwest = { version = \"0.11\", features = [\"json\"] }"
```

**Gates:**
- [ ] `cargo check` — if reqwest missing, add to Cargo.toml first
- [ ] `cargo clippy -- -D warnings`
- [ ] `cargo test`
- [ ] Commit: `feat(health): implement Ollama health check with 3s timeout`
- [ ] Log: `1.2.3 complete`

---

#### SUB-CHUNK 1.2.4: Disk Space Check (10 min)
**Adds to:** `src-tauri/src/commands/health.rs`
**Pattern:** Platform-specific system command execution

**Implementation:**
```rust
#[cfg(target_os = "windows")]
async fn check_disk_space(vault_path: &str) -> HealthCheckDetail {
    use std::process::Command;
    let start = std::time::Instant::now();
    
    // Get drive letter from vault path
    let drive = vault_path.chars().next().unwrap_or('C');
    
    let output = Command::new("wmic")
        .args(&["logicaldisk", "where", &format!("DeviceID='{}:'", drive), "get", "FreeSpace", "/value"])
        .output();
    
    match output {
        Ok(out) if out.status.success() => {
            let text = String::from_utf8_lossy(&out.stdout);
            // Parse FreeSpace=value
            let free_bytes = text.lines()
                .find(|l| l.contains("FreeSpace"))
                .and_then(|l| l.split('=').nth(1))
                .and_then(|v| v.trim().parse::<u64>().ok())
                .unwrap_or(0);
            
            let free_gb = free_bytes as f64 / 1_073_741_824.0;
            let status = if free_gb > 5.0 { "ok" } 
                        else if free_gb > 1.0 { "warning" } 
                        else { "critical" };
            
            HealthCheckDetail {
                name: "disk".to_string(),
                status: status.to_string(),
                message: format!("{:.1} GB free", free_gb),
                latency_ms: start.elapsed().as_millis() as u64,
            }
        }
        _ => HealthCheckDetail {
            name: "disk".to_string(),
            status: "warn".to_string(),
            message: "Could not determine disk space".to_string(),
            latency_ms: start.elapsed().as_millis() as u64,
        }
    }
}

#[cfg(not(target_os = "windows"))]
async fn check_disk_space(_vault_path: &str) -> HealthCheckDetail {
    // Unix implementation using df
    HealthCheckDetail {
        name: "disk".to_string(),
        status: "warn".to_string(),
        message: "Disk check not implemented for this platform".to_string(),
        latency_ms: 0,
    }
}
```

**Gates:**
- [ ] `cargo check`
- [ ] `cargo clippy -- -D warnings`
- [ ] `cargo test`
- [ ] Commit: `feat(health): implement disk space check for Windows`
- [ ] Log: `1.2.4 complete`

---

#### SUB-CHUNK 1.2.5: Main health_check Command (10 min)
**Adds to:** `src-tauri/src/commands/health.rs`
**Pattern:** Parallel async execution with tokio::join!

**Implementation:**
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
    
    // Determine overall status
    let overall = if vault.status == "fail" || disk.status == "critical" {
        "unhealthy"
    } else if ollama.status == "warn" || disk.status == "warning" {
        "degraded"
    } else {
        "healthy"
    };
    
    let vault_note_count = vault.message
        .split_whitespace()
        .next()
        .and_then(|n| n.parse().ok())
        .unwrap_or(0);
    
    let disk_space_gb = disk.message
        .split_whitespace()
        .next()
        .and_then(|n| n.parse().ok())
        .unwrap_or(0.0);
    
    Ok(HealthStatus {
        overall: overall.to_string(),
        vault_accessible: vault.status == "pass",
        vault_note_count,
        ollama_reachable: ollama.status == "pass",
        ollama_version: None, // Could be extracted from /api/version
        disk_space_gb,
        disk_space_status: disk.status.clone(),
        checks: vec![vault, ollama, disk],
    })
}
```

**Gates:**
- [ ] `cargo check`
- [ ] `cargo clippy -- -D warnings`
- [ ] `cargo test`
- [ ] Commit: `feat(health): add main health_check command with parallel checks`
- [ ] Log: `1.2.5 complete`

---

#### SUB-CHUNK 1.2.6: Register in lib.rs (5 min)
**Modifies:** `src-tauri/src/lib.rs`
**Pattern:** Module declaration + command registration

**Implementation:**
1. Add module declaration near top:
```rust
mod commands {
    pub mod health;  // ADD THIS
    pub mod vault;
    pub mod ai;
    // ... existing modules
}
```

2. Add to invoke_handler:
```rust
.invoke_handler(tauri::generate_handler![
    // ... existing commands
    commands::health::health_check,  // ADD THIS
])
```

**Gates:**
- [ ] `cargo check`
- [ ] `cargo clippy -- -D warnings`
- [ ] `cargo test`
- [ ] Commit: `feat(health): register health_check command in lib.rs`
- [ ] Log: `1.2.6 complete`

---

#### SUB-CHUNK 1.2.7: HealthIndicator.tsx Component (15 min)
**Creates:** `src/components/HealthIndicator.tsx` (NEW FILE)
**Pattern:** React component with props from Tauri invoke

**Implementation:**
```typescript
import { Activity, AlertCircle, Check } from 'lucide-react';

interface HealthStatus {
  overall: 'healthy' | 'degraded' | 'unhealthy';
  vault_accessible: boolean;
  ollama_reachable: boolean;
  disk_space_status: 'ok' | 'warning' | 'critical';
}

interface HealthIndicatorProps {
  status: HealthStatus | null;
  onClick?: () => void;
}

export function HealthIndicator({ status, onClick }: HealthIndicatorProps) {
  if (!status) {
    return (
      <div className="flex items-center gap-1 text-gray-400">
        <Activity className="h-3 w-3 animate-pulse" />
        <span className="text-xs">Checking...</span>
      </div>
    );
  }

  const config = {
    healthy: { icon: Check, color: 'text-green-500', label: 'Healthy' },
    degraded: { icon: Activity, color: 'text-yellow-500', label: 'Degraded' },
    unhealthy: { icon: AlertCircle, color: 'text-red-500', label: 'Unhealthy' },
  };

  const { icon: Icon, color, label } = config[status.overall];

  return (
    <button 
      onClick={onClick}
      className={`flex items-center gap-1 ${color} hover:opacity-80`}
      title={`Vault: ${status.vault_accessible ? 'OK' : 'FAIL'} | Ollama: ${status.ollama_reachable ? 'OK' : 'OFFLINE'} | Disk: ${status.disk_space_status}`}
    >
      <Icon className="h-3 w-3" />
      <span className="text-xs">{label}</span>
    </button>
  );
}
```

**Gates:**
- [ ] `pnpm tsc --noEmit` — TypeScript compiles
- [ ] `pnpm build` — builds successfully
- [ ] Commit: `feat(health): add HealthIndicator React component`
- [ ] Log: `1.2.7 complete`

---

#### SUB-CHUNK 1.2.8: StatusBar Integration (10 min)
**Modifies:** `src/components/layout/StatusBar.tsx`
**Pattern:** Add prop + render component + wire handler

**Implementation:**
1. Import HealthIndicator:
```typescript
import { HealthIndicator } from '../HealthIndicator';
```

2. Add props:
```typescript
interface StatusBarProps {
  // ... existing props
  healthStatus?: HealthStatus | null;
  onHealthCheck?: () => void;
}
```

3. Destructure in component:
```typescript
export function StatusBar({
  // ... existing props
  healthStatus,
  onHealthCheck,
  className,
}: StatusBarProps) {
```

4. Add to right section (before Settings button):
```typescript
{healthStatus && (
  <HealthIndicator status={healthStatus} onClick={onHealthCheck} />
)}
```

**Gates:**
- [ ] `pnpm tsc --noEmit`
- [ ] `pnpm build`
- [ ] Commit: `feat(health): integrate HealthIndicator into StatusBar`
- [ ] Log: `1.2.8 complete`

---

#### SUB-CHUNK 1.2.9: App.tsx Polling (10 min)
**Modifies:** `src/components/layout/App.tsx`
**Pattern:** useEffect with setInterval for periodic health checks

**Implementation:**
1. Import invoke and useState:
```typescript
import { useState, useEffect } from 'react';
import { invoke } from '@tauri-apps/api/core';
import type { HealthStatus } from '../components/HealthIndicator'; // If type exported
```

2. Add state:
```typescript
const [healthStatus, setHealthStatus] = useState<HealthStatus | null>(null);
```

3. Add health check effect:
```typescript
useEffect(() => {
  const checkHealth = async () => {
    if (!vaultPath) return;
    try {
      const status = await invoke<HealthStatus>('health_check', {
        vaultPath,
        ollamaBaseUrl: 'http://localhost:11434', // TODO: Get from config
      });
      setHealthStatus(status);
    } catch (error) {
      console.error('Health check failed:', error);
      setHealthStatus({
        overall: 'unhealthy',
        vault_accessible: false,
        ollama_reachable: false,
        disk_space_status: 'critical',
      });
    }
  };

  checkHealth();
  const id = setInterval(checkHealth, 30000); // Every 30 seconds
  return () => clearInterval(id);
}, [vaultPath]);
```

4. Pass to StatusBar:
```typescript
<StatusBar
  // ... existing props
  healthStatus={healthStatus}
  onHealthCheck={() => {
    // Could open health details modal
    toast.info(`Health: ${healthStatus?.overall || 'unknown'}`);
  }}
/>
```

**Gates:**
- [ ] `pnpm tsc --noEmit`
- [ ] `pnpm build`
- [ ] Commit: `feat(health): add health polling to App.tsx with 30s interval`
- [ ] Log: `1.2.9 complete`

---

### CHUNK 1.2 COMPLETION VERIFICATION

**Final Gates (MANDATORY):**
- [ ] `cd src-tauri && cargo test` — 33+ tests pass
- [ ] `cd src-tauri && cargo clippy -- -D warnings` — 0 warnings
- [ ] `pnpm test:run` — 16 tests pass
- [ ] `pnpm build` — production build succeeds
- [ ] 9 commits in git log for this chunk
- [ ] PROGRESS.log shows 1.2.1 through 1.2.9 complete

**Update ROADMAP:**
```bash
# After all gates pass, mark K3 complete in ROADMAP_ENRICHED_v3.md
git add ROADMAP_ENRICHED_v3.md PROGRESS.log
git commit -m "docs(roadmap): mark K3 healthcheck as complete"
```

---

## 4. NEXT ACTIONS

**APPROVAL REQUIRED:**
1. Review this REPAIR_PROTOCOL_v4.md
2. Approve the step-phase chunk pattern
3. Authorize execution of Chunk 1.2 (9 sub-chunks, 90 min)
4. Confirm CI verification follows Chunk 1.3

**UPON APPROVAL:**
- Execute Sub-chunk 1.2.1 immediately
- Strict adherence to gate enforcement
- Real-time PROGRESS.log updates
- Commit after EVERY sub-chunk

**DEPLOYMENT PATH:**
```
APPROVAL → Chunk 1.2.1 → ... → 1.2.9 → Chunk 1.3 → CI Verify → DEPLOY
```

---

END OF REPAIR PROTOCOL v4
