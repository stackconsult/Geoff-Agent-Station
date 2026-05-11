use super::{ClipboardEntry, ClipboardFormat, ClipboardManager};
use chrono::Utc;
use std::sync::Arc;
use std::time::Duration;
use tokio::time;
use uuid::Uuid;

pub async fn start_monitoring(manager: Arc<ClipboardManager>) {
    let mut last_content = String::new();

    loop {
        time::sleep(Duration::from_millis(500)).await;

        if let Ok(current_content) = manager.get_text() {
            if current_content != last_content && !current_content.is_empty() {
                let entry = ClipboardEntry {
                    id: Uuid::new_v4().to_string(),
                    content: current_content.clone(),
                    format: ClipboardFormat::Text,
                    source_app: None,
                    timestamp: Utc::now(),
                    favorite: false,
                };

                if let Err(e) = manager.add_to_history(entry) {
                    eprintln!("Failed to add clipboard entry to history: {}", e);
                }

                last_content = current_content;
            }
        }
    }
}
