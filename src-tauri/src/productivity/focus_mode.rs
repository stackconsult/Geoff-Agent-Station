use serde::{Deserialize, Serialize};

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct FocusModeConfig {
    pub block_websites: Vec<String>,
    pub block_apps: Vec<String>,
    pub allow_notifications: bool,
    pub duration_minutes: i32,
}

pub fn enable_focus_mode(_config: FocusModeConfig) -> Result<(), String> {
    Ok(())
}

pub fn disable_focus_mode() -> Result<(), String> {
    Ok(())
}
