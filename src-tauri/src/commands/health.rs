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
