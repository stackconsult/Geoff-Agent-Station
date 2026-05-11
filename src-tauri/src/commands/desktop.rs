#![allow(dead_code)] // All items are Tauri commands — registered via generate_handler! macro

use opener;

#[tauri::command]
pub async fn reveal_file(path: String) -> Result<String, String> {
    match opener::reveal(&path) {
        Ok(_) => Ok("File revealed".to_string()),
        Err(e) => Err(format!("Failed to reveal file: {}", e))
    }
}

#[tauri::command]
pub async fn open_file(path: String) -> Result<String, String> {
    match opener::open(&path) {
        Ok(_) => Ok("File opened".to_string()),
        Err(e) => Err(format!("Failed to open file: {}", e))
    }
}
