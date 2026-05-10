use serde::{Deserialize, Serialize};

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct WindowConfig {
    pub width: u32,
    pub height: u32,
    pub min_width: u32,
    pub min_height: u32,
    pub resizable: bool,
}

#[tauri::command]
pub fn get_adaptive_window_config(performance_tier: String) -> WindowConfig {
    match performance_tier.as_str() {
        "low" => WindowConfig {
            width: 600,
            height: 400,
            min_width: 500,
            min_height: 350,
            resizable: true,
        },
        "medium" => WindowConfig {
            width: 800,
            height: 600,
            min_width: 600,
            min_height: 450,
            resizable: true,
        },
        "high" => WindowConfig {
            width: 1200,
            height: 800,
            min_width: 800,
            min_height: 600,
            resizable: true,
        },
        _ => WindowConfig {
            width: 800,
            height: 600,
            min_width: 600,
            min_height: 450,
            resizable: true,
        },
    }
}
