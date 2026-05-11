use arboard::Clipboard;
use serde::{Deserialize, Serialize};
use std::sync::{Arc, Mutex};
use chrono::{DateTime, Utc};

pub mod history;
pub mod monitor;

#[derive(Debug, Clone, Serialize, Deserialize)]
pub enum ClipboardFormat {
    Text,
    Image,
    File,
    Html,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ClipboardEntry {
    pub id: String,
    pub content: String,
    pub format: ClipboardFormat,
    pub source_app: Option<String>,
    pub timestamp: DateTime<Utc>,
    pub favorite: bool,
}

pub struct ClipboardManager {
    clipboard: Arc<Mutex<Clipboard>>,
    history: Arc<Mutex<Vec<ClipboardEntry>>>,
    max_history: usize,
}

impl ClipboardManager {
    pub fn new(max_history: usize) -> Result<Self, String> {
        let clipboard = Clipboard::new()
            .map_err(|e| format!("Failed to initialize clipboard: {}", e))?;

        Ok(Self {
            clipboard: Arc::new(Mutex::new(clipboard)),
            history: Arc::new(Mutex::new(Vec::new())),
            max_history,
        })
    }

    pub fn get_text(&self) -> Result<String, String> {
        let mut clipboard = self.clipboard.lock().map_err(|e| e.to_string())?;
        clipboard
            .get_text()
            .map_err(|e| format!("Failed to get clipboard text: {}", e))
    }

    pub fn set_text(&self, text: String) -> Result<(), String> {
        let mut clipboard = self.clipboard.lock().map_err(|e| e.to_string())?;
        clipboard
            .set_text(text)
            .map_err(|e| format!("Failed to set clipboard text: {}", e))
    }

    pub fn add_to_history(&self, entry: ClipboardEntry) -> Result<(), String> {
        let mut history = self.history.lock().map_err(|e| e.to_string())?;
        
        history.insert(0, entry);
        
        if history.len() > self.max_history {
            history.truncate(self.max_history);
        }

        Ok(())
    }

    pub fn get_history(&self) -> Result<Vec<ClipboardEntry>, String> {
        let history = self.history.lock().map_err(|e| e.to_string())?;
        Ok(history.clone())
    }

    pub fn get_entry(&self, id: &str) -> Result<ClipboardEntry, String> {
        let history = self.history.lock().map_err(|e| e.to_string())?;
        history
            .iter()
            .find(|e| e.id == id)
            .cloned()
            .ok_or_else(|| "Entry not found".to_string())
    }

    pub fn toggle_favorite(&self, id: &str) -> Result<(), String> {
        let mut history = self.history.lock().map_err(|e| e.to_string())?;
        if let Some(entry) = history.iter_mut().find(|e| e.id == id) {
            entry.favorite = !entry.favorite;
            Ok(())
        } else {
            Err("Entry not found".to_string())
        }
    }

    pub fn delete_entry(&self, id: &str) -> Result<(), String> {
        let mut history = self.history.lock().map_err(|e| e.to_string())?;
        history.retain(|e| e.id != id);
        Ok(())
    }

    pub fn clear_history(&self) -> Result<(), String> {
        let mut history = self.history.lock().map_err(|e| e.to_string())?;
        history.clear();
        Ok(())
    }

    pub fn search_history(&self, query: &str) -> Result<Vec<ClipboardEntry>, String> {
        let history = self.history.lock().map_err(|e| e.to_string())?;
        let query_lower = query.to_lowercase();
        
        Ok(history
            .iter()
            .filter(|e| e.content.to_lowercase().contains(&query_lower))
            .cloned()
            .collect())
    }
}

impl Default for ClipboardManager {
    fn default() -> Self {
        Self::new(1000).expect("Failed to create clipboard manager")
    }
}
