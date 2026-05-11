use crate::productivity::{ProductivityManager, ProductivityStats, PomodoroSession};
use chrono::{DateTime, Utc};
use once_cell::sync::Lazy;
use std::sync::Arc;

static PRODUCTIVITY_MANAGER: Lazy<Arc<ProductivityManager>> = Lazy::new(|| {
    Arc::new(ProductivityManager::new())
});

#[tauri::command]
pub async fn productivity_start_tracking(
    app_name: String,
    window_title: String,
    project: Option<String>,
) -> Result<String, String> {
    PRODUCTIVITY_MANAGER.start_tracking(app_name, window_title, project)
}

#[tauri::command]
pub async fn productivity_stop_tracking() -> Result<(), String> {
    PRODUCTIVITY_MANAGER.stop_tracking()
}

#[tauri::command]
pub async fn productivity_get_stats(start: String, end: String) -> Result<ProductivityStats, String> {
    let start_time = DateTime::parse_from_rfc3339(&start)
        .map_err(|e| format!("Invalid start time: {}", e))?
        .with_timezone(&Utc);
    
    let end_time = DateTime::parse_from_rfc3339(&end)
        .map_err(|e| format!("Invalid end time: {}", e))?
        .with_timezone(&Utc);

    PRODUCTIVITY_MANAGER.get_stats(start_time, end_time)
}

#[tauri::command]
pub async fn productivity_start_pomodoro(
    work_duration: i64,
    break_duration: i64,
    long_break_duration: i64,
    sessions_until_long_break: i32,
) -> Result<String, String> {
    PRODUCTIVITY_MANAGER.start_pomodoro(
        work_duration,
        break_duration,
        long_break_duration,
        sessions_until_long_break,
    )
}

#[tauri::command]
pub async fn productivity_get_pomodoro_status() -> Result<Option<PomodoroSession>, String> {
    PRODUCTIVITY_MANAGER.get_pomodoro_status()
}

#[tauri::command]
pub async fn productivity_stop_pomodoro() -> Result<(), String> {
    PRODUCTIVITY_MANAGER.stop_pomodoro()
}
