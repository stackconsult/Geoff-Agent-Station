use serde::{Deserialize, Serialize};
use sysinfo::System;

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct MachineSpecs {
    pub cpu_cores: usize,
    pub total_memory_gb: f64,
    pub available_memory_gb: f64,
    pub cpu_brand: String,
    pub os_name: String,
    pub os_version: String,
}

#[tauri::command]
pub fn get_machine_specs() -> MachineSpecs {
    let mut sys = System::new_all();
    sys.refresh_all();

    let total_memory_gb = sys.total_memory() as f64 / (1024.0 * 1024.0 * 1024.0);
    let available_memory_gb = sys.available_memory() as f64 / (1024.0 * 1024.0 * 1024.0);
    
    let cpu_brand = sys.cpus()
        .first()
        .map(|cpu| cpu.brand().to_string())
        .unwrap_or_else(|| "Unknown".to_string());

    let os_name = std::env::consts::OS.to_string();
    let os_version = System::long_os_version().unwrap_or_else(|| "Unknown".to_string());

    MachineSpecs {
        cpu_cores: sys.cpus().len(),
        total_memory_gb,
        available_memory_gb,
        cpu_brand,
        os_name,
        os_version,
    }
}

#[tauri::command]
pub fn get_performance_tier(specs: MachineSpecs) -> String {
    match specs.total_memory_gb {
        mem if mem < 4.0 => "low".to_string(),
        mem if mem < 16.0 => "medium".to_string(),
        _ => "high".to_string(),
    }
}
