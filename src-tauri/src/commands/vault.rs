use crate::vault::VaultFrontmatter;

#[tauri::command]
pub async fn search_notes(vault_path: String, query: String) -> Result<Vec<String>, String> {
    // Simple search implementation
    Ok(vec![])
}

#[tauri::command]
pub async fn update_frontmatter(path: String, frontmatter: VaultFrontmatter) -> Result<String, String> {
    let content = std::fs::read_to_string(&path)
        .map_err(|e| format!("Failed to read file: {}", e))?;
    
    let yaml = serde_yaml::to_string(&frontmatter)
        .map_err(|e| format!("Failed to serialize frontmatter: {}", e))?;
    
    let new_content = format!("---\n{}---\n{}", yaml, content);
    
    std::fs::write(&path, new_content)
        .map_err(|e| format!("Failed to write file: {}", e))?;
    
    Ok("Frontmatter updated".to_string())
}
