use serde::{Deserialize, Serialize};
use chrono::{DateTime, Utc};
use std::sync::{Arc, Mutex};

#[cfg(feature = "productivity-advanced")]
pub mod time_tracking;
#[cfg(feature = "productivity-advanced")]
pub mod focus_mode;
#[cfg(feature = "productivity-advanced")]
pub mod pomodoro;

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct TimeEntry {
    pub id: String,
    pub app_name: String,
    pub window_title: String,
    pub project: Option<String>,
    pub start_time: DateTime<Utc>,
    pub end_time: Option<DateTime<Utc>>,
    pub duration_seconds: i64,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ProductivityStats {
    pub total_time_seconds: i64,
    pub productive_time_seconds: i64,
    pub distracting_time_seconds: i64,
    pub top_apps: Vec<(String, i64)>,
    pub top_projects: Vec<(String, i64)>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct PomodoroSession {
    pub id: String,
    pub work_duration: i64,
    pub break_duration: i64,
    pub long_break_duration: i64,
    pub sessions_until_long_break: i32,
    pub current_session: i32,
    pub is_break: bool,
    pub start_time: DateTime<Utc>,
    pub end_time: Option<DateTime<Utc>>,
}

pub struct ProductivityManager {
    current_entry: Arc<Mutex<Option<TimeEntry>>>,
    entries: Arc<Mutex<Vec<TimeEntry>>>,
    pomodoro_session: Arc<Mutex<Option<PomodoroSession>>>,
}

impl ProductivityManager {
    pub fn new() -> Self {
        Self {
            current_entry: Arc::new(Mutex::new(None)),
            entries: Arc::new(Mutex::new(Vec::new())),
            pomodoro_session: Arc::new(Mutex::new(None)),
        }
    }

    pub fn start_tracking(&self, app_name: String, window_title: String, project: Option<String>) -> Result<String, String> {
        let mut current = self.current_entry.lock().map_err(|e| e.to_string())?;
        
        if let Some(entry) = current.take() {
            self.stop_tracking_internal(entry)?;
        }

        let id = uuid::Uuid::new_v4().to_string();
        let entry = TimeEntry {
            id: id.clone(),
            app_name,
            window_title,
            project,
            start_time: Utc::now(),
            end_time: None,
            duration_seconds: 0,
        };

        *current = Some(entry);
        Ok(id)
    }

    pub fn stop_tracking(&self) -> Result<(), String> {
        let mut current = self.current_entry.lock().map_err(|e| e.to_string())?;
        
        if let Some(entry) = current.take() {
            self.stop_tracking_internal(entry)?;
        }

        Ok(())
    }

    fn stop_tracking_internal(&self, mut entry: TimeEntry) -> Result<(), String> {
        let end_time = Utc::now();
        let duration = end_time.signed_duration_since(entry.start_time);
        
        entry.end_time = Some(end_time);
        entry.duration_seconds = duration.num_seconds();

        let mut entries = self.entries.lock().map_err(|e| e.to_string())?;
        entries.push(entry);

        Ok(())
    }

    pub fn get_stats(&self, start: DateTime<Utc>, end: DateTime<Utc>) -> Result<ProductivityStats, String> {
        let entries = self.entries.lock().map_err(|e| e.to_string())?;
        
        let filtered: Vec<_> = entries
            .iter()
            .filter(|e| e.start_time >= start && e.start_time <= end)
            .collect();

        let total_time: i64 = filtered.iter().map(|e| e.duration_seconds).sum();

        let mut app_times: std::collections::HashMap<String, i64> = std::collections::HashMap::new();
        for entry in &filtered {
            *app_times.entry(entry.app_name.clone()).or_insert(0) += entry.duration_seconds;
        }

        let mut top_apps: Vec<_> = app_times.into_iter().collect();
        top_apps.sort_by(|a, b| b.1.cmp(&a.1));
        top_apps.truncate(10);

        Ok(ProductivityStats {
            total_time_seconds: total_time,
            productive_time_seconds: total_time,
            distracting_time_seconds: 0,
            top_apps,
            top_projects: Vec::new(),
        })
    }

    pub fn start_pomodoro(&self, work_duration: i64, break_duration: i64, long_break_duration: i64, sessions_until_long_break: i32) -> Result<String, String> {
        let mut session = self.pomodoro_session.lock().map_err(|e| e.to_string())?;
        
        let id = uuid::Uuid::new_v4().to_string();
        *session = Some(PomodoroSession {
            id: id.clone(),
            work_duration,
            break_duration,
            long_break_duration,
            sessions_until_long_break,
            current_session: 1,
            is_break: false,
            start_time: Utc::now(),
            end_time: None,
        });

        Ok(id)
    }

    pub fn get_pomodoro_status(&self) -> Result<Option<PomodoroSession>, String> {
        let session = self.pomodoro_session.lock().map_err(|e| e.to_string())?;
        Ok(session.clone())
    }

    pub fn stop_pomodoro(&self) -> Result<(), String> {
        let mut session = self.pomodoro_session.lock().map_err(|e| e.to_string())?;
        *session = None;
        Ok(())
    }
}

impl Default for ProductivityManager {
    fn default() -> Self {
        Self::new()
    }
}
