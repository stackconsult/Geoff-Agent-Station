use super::ClipboardEntry;

pub fn save_to_disk(entries: &[ClipboardEntry], path: &str) -> Result<(), String> {
    let json = serde_json::to_string_pretty(entries)
        .map_err(|e| format!("Failed to serialize clipboard history: {}", e))?;
    
    std::fs::write(path, json)
        .map_err(|e| format!("Failed to write clipboard history: {}", e))
}

pub fn load_from_disk(path: &str) -> Result<Vec<ClipboardEntry>, String> {
    let json = std::fs::read_to_string(path)
        .map_err(|e| format!("Failed to read clipboard history: {}", e))?;
    
    serde_json::from_str(&json)
        .map_err(|e| format!("Failed to parse clipboard history: {}", e))
}
