use serde::{Deserialize, Serialize};
use std::path::PathBuf;

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(tag = "type")]
pub enum Trigger {
    FileChange {
        path: PathBuf,
        event_type: FileEventType,
    },
    TimeSchedule {
        cron: String,
    },
    WindowFocus {
        app_name: String,
    },
    ClipboardChange {
        format: ClipboardFormat,
    },
    Hotkey {
        key_combination: String,
    },
    SystemEvent {
        event: SystemEventType,
    },
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub enum FileEventType {
    Created,
    Modified,
    Deleted,
    Renamed,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub enum ClipboardFormat {
    Text,
    Image,
    File,
    Any,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub enum SystemEventType {
    Startup,
    Shutdown,
    Sleep,
    Wake,
    NetworkConnected,
    NetworkDisconnected,
    BatteryLow,
    BatteryCharging,
}

#[allow(dead_code)] // Convenience constructors — scaffolding for future trigger wiring
impl Trigger {
    pub fn file_change(path: PathBuf, event_type: FileEventType) -> Self {
        Self::FileChange { path, event_type }
    }

    pub fn time_schedule(cron: String) -> Self {
        Self::TimeSchedule { cron }
    }

    pub fn window_focus(app_name: String) -> Self {
        Self::WindowFocus { app_name }
    }

    pub fn clipboard_change(format: ClipboardFormat) -> Self {
        Self::ClipboardChange { format }
    }

    pub fn hotkey(key_combination: String) -> Self {
        Self::Hotkey { key_combination }
    }

    pub fn system_event(event: SystemEventType) -> Self {
        Self::SystemEvent { event }
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_trigger_creation() {
        let trigger = Trigger::file_change(
            PathBuf::from("/test/path"),
            FileEventType::Modified
        );
        
        match trigger {
            Trigger::FileChange { path, event_type } => {
                assert_eq!(path, PathBuf::from("/test/path"));
                matches!(event_type, FileEventType::Modified);
            },
            _ => panic!("Wrong trigger type"),
        }
    }
}
