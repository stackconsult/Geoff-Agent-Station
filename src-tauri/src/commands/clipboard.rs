#![allow(dead_code)] // All items are Tauri commands — registered via generate_handler! macro

use crate::clipboard::{ClipboardManager, ClipboardEntry};
use once_cell::sync::Lazy;
use std::sync::Arc;

static CLIPBOARD_MANAGER: Lazy<Arc<ClipboardManager>> = Lazy::new(|| {
    Arc::new(ClipboardManager::new(1000).expect("Failed to create clipboard manager"))
});

#[tauri::command]
pub fn clipboard_get_text() -> Result<String, String> {
    CLIPBOARD_MANAGER.get_text()
}

#[tauri::command]
pub fn clipboard_set_text(text: String) -> Result<(), String> {
    CLIPBOARD_MANAGER.set_text(text)
}

#[tauri::command]
pub fn clipboard_get_history() -> Result<Vec<ClipboardEntry>, String> {
    CLIPBOARD_MANAGER.get_history()
}

#[tauri::command]
pub fn clipboard_search(query: String) -> Result<Vec<ClipboardEntry>, String> {
    CLIPBOARD_MANAGER.search_history(&query)
}

#[tauri::command]
pub fn clipboard_toggle_favorite(id: String) -> Result<(), String> {
    CLIPBOARD_MANAGER.toggle_favorite(&id)
}

#[tauri::command]
pub fn clipboard_delete_entry(id: String) -> Result<(), String> {
    CLIPBOARD_MANAGER.delete_entry(&id)
}

#[tauri::command]
pub fn clipboard_clear_history() -> Result<(), String> {
    CLIPBOARD_MANAGER.clear_history()
}

pub fn start_clipboard_monitoring() {
    let manager = CLIPBOARD_MANAGER.clone();
    tokio::spawn(async move {
        crate::clipboard::monitor::start_monitoring(manager).await;
    });
}
