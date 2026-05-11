#![allow(dead_code)] // All items are Tauri commands — registered via generate_handler! macro

use std::fs;
use std::path::PathBuf;

#[tauri::command]
pub async fn save_image(vault_path: String, filename: String, data: Vec<u8>) -> Result<String, String> {
    let attachments_path = PathBuf::from(&vault_path).join("attachments");
    
    fs::create_dir_all(&attachments_path)
        .map_err(|e| format!("Failed to create attachments directory: {}", e))?;
    
    let image_path = attachments_path.join(&filename);
    fs::write(&image_path, data)
        .map_err(|e| format!("Failed to write image: {}", e))?;
    
    Ok(image_path.to_string_lossy().to_string())
}
