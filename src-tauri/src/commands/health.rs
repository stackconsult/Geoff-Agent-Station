use serde::Serialize;

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
