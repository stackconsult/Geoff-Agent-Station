use serde::Serialize;
use tokio::fs;
use walkdir::WalkDir;

/// Check vault accessibility and count markdown notes
pub async fn check_vault(vault_path: &str) -> HealthCheckDetail {
    let start = std::time::Instant::now();

    match fs::metadata(vault_path).await {
        Ok(metadata) if metadata.is_dir() => {
            // Count markdown files in vault
            let count = WalkDir::new(vault_path)
                .into_iter()
                .filter_map(|e| e.ok())
                .filter(|e| {
                    e.path()
                        .extension()
                        .map(|ext| ext == "md" || ext == "markdown")
                        .unwrap_or(false)
                })
                .count();

            HealthCheckDetail {
                name: "vault".to_string(),
                status: "pass".to_string(),
                message: format!("{} notes found", count),
                latency_ms: start.elapsed().as_millis() as u64,
            }
        }
        Ok(_) => HealthCheckDetail {
            name: "vault".to_string(),
            status: "fail".to_string(),
            message: "Path exists but is not a directory".to_string(),
            latency_ms: start.elapsed().as_millis() as u64,
        },
        Err(e) => HealthCheckDetail {
            name: "vault".to_string(),
            status: "fail".to_string(),
            message: format!("Vault inaccessible: {}", e),
            latency_ms: start.elapsed().as_millis() as u64,
        },
    }
}

/// Check Ollama LLM service reachability with 3-second timeout
pub async fn check_ollama(base_url: &str) -> HealthCheckDetail {
    use tokio::time::{timeout, Duration};

    let start = std::time::Instant::now();
    let client = reqwest::Client::new();

    match timeout(
        Duration::from_secs(3),
        client.get(format!("{}/api/tags", base_url)).send(),
    ).await
    {
        Ok(Ok(resp)) if resp.status().is_success() => HealthCheckDetail {
            name: "ollama".to_string(),
            status: "pass".to_string(),
            message: "Ollama reachable".to_string(),
            latency_ms: start.elapsed().as_millis() as u64,
        },
        Ok(Ok(resp)) => HealthCheckDetail {
            name: "ollama".to_string(),
            status: "warn".to_string(),
            message: format!("Ollama returned status {}", resp.status()),
            latency_ms: start.elapsed().as_millis() as u64,
        },
        Ok(Err(e)) => HealthCheckDetail {
            name: "ollama".to_string(),
            status: "warn".to_string(),
            message: format!("Ollama connection error: {}", e),
            latency_ms: start.elapsed().as_millis() as u64,
        },
        Err(_) => HealthCheckDetail {
            name: "ollama".to_string(),
            status: "warn".to_string(),
            message: "Ollama connection timeout (>3s)".to_string(),
            latency_ms: start.elapsed().as_millis() as u64,
        },
    }
}

/// Check disk space for Windows vault drive
#[cfg(target_os = "windows")]
pub async fn check_disk_space(vault_path: &str) -> HealthCheckDetail {
    use std::process::Command;
    let start = std::time::Instant::now();

    // Extract drive letter from vault path (e.g., "C:\\path" -> "C:")
    let drive = vault_path.chars().next().map(|c| c.to_string()).unwrap_or_else(|| "C".to_string());

    let output = Command::new("wmic")
        .args(&[
            "logicaldisk",
            "where",
            &format!("DeviceID='{}:'", drive),
            "get",
            "FreeSpace,Size",
            "/value",
        ])
        .output();

    match output {
        Ok(out) if out.status.success() => {
            let text = String::from_utf8_lossy(&out.stdout);

            // Parse FreeSpace=value from WMIC output
            let free_bytes = text
                .lines()
                .find(|l| l.contains("FreeSpace"))
                .and_then(|l| l.split('=').nth(1))
                .and_then(|v| v.trim().parse::<u64>().ok())
                .unwrap_or(0);

            let free_gb = free_bytes as f64 / 1_073_741_824.0;
            let status = if free_gb > 5.0 {
                "ok"
            } else if free_gb > 1.0 {
                "warning"
            } else {
                "critical"
            };

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
        },
    }
}

/// Non-Windows placeholder for disk space check
#[cfg(not(target_os = "windows"))]
pub async fn check_disk_space(_vault_path: &str) -> HealthCheckDetail {
    HealthCheckDetail {
        name: "disk".to_string(),
        status: "warn".to_string(),
        message: "Disk check not implemented for this platform".to_string(),
        latency_ms: 0,
    }
}

/// Overall health status response from health_check command
#[derive(Serialize)]
pub struct HealthStatus {
    /// Overall system status: "healthy" | "degraded" | "unhealthy"
    pub overall: String,
    /// Whether the vault path is accessible
    pub vault_accessible: bool,
    /// Number of markdown notes found in vault
    pub vault_note_count: usize,
    /// Whether Ollama LLM service is reachable
    pub ollama_reachable: bool,
    /// Ollama version string if available
    pub ollama_version: Option<String>,
    /// Free disk space in gigabytes
    pub disk_space_gb: f64,
    /// Disk space status: "ok" | "warning" | "critical"
    pub disk_space_status: String,
    /// Individual check results with latency
    pub checks: Vec<HealthCheckDetail>,
}

/// Individual health check component result
#[derive(Serialize)]
pub struct HealthCheckDetail {
    /// Name of the check ("vault", "ollama", "disk")
    pub name: String,
    /// Check status: "pass" | "fail" | "warn"
    pub status: String,
    /// Human-readable message about the check result
    pub message: String,
    /// Time taken to execute the check in milliseconds
    pub latency_ms: u64,
}

/// Main health check command — runs vault, Ollama, and disk checks in parallel
#[tauri::command]
pub async fn health_check(
    vault_path: String,
    ollama_base_url: String,
) -> Result<HealthStatus, String> {
    // Run all checks in parallel for efficiency
    let (vault, ollama, disk) = tokio::join!(
        check_vault(&vault_path),
        check_ollama(&ollama_base_url),
        check_disk_space(&vault_path),
    );

    // Determine overall status based on individual results
    let overall = if vault.status == "fail" || disk.status == "critical" {
        "unhealthy"
    } else if ollama.status == "warn" || disk.status == "warning" {
        "degraded"
    } else {
        "healthy"
    };

    // Parse vault note count from message (e.g., "42 notes found")
    let vault_note_count = vault
        .message
        .split_whitespace()
        .next()
        .and_then(|n| n.parse().ok())
        .unwrap_or(0);

    // Parse disk space from message (e.g., "12.5 GB free")
    let disk_space_gb = disk
        .message
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
