use crate::vault::{scan_vault, VaultFrontmatter};

#[tauri::command]
pub async fn search_notes(vault_path: String, query: String) -> Result<Vec<String>, String> {
    if query.is_empty() {
        return Ok(vec![]);
    }

    let entries = scan_vault(vault_path.clone()).await?;
    let query_lower = query.to_lowercase();

    let mut scored_results: Vec<(String, f32)> = Vec::new();

    for entry in entries {
        let mut score = 0.0;

        // Title match (highest weight)
        if entry.title.to_lowercase().contains(&query_lower) {
            score += 10.0;
        }

        // Snippet match
        if entry.snippet.to_lowercase().contains(&query_lower) {
            score += 5.0;
        }

        // Tag match
        for tag in &entry.aliases {
            if tag.to_lowercase().contains(&query_lower) {
                score += 5.0;
            }
        }

        // Link match
        for link in &entry.outgoing_links {
            if link.to_lowercase().contains(&query_lower) {
                score += 3.0;
            }
        }

        // Content match (read file and search)
        if let Ok(content) = std::fs::read_to_string(&entry.path) {
            if content.to_lowercase().contains(&query_lower) {
                score += 2.0;
            }
        }

        if score > 0.0 {
            scored_results.push((entry.path.clone(), score));
        }
    }

    // Sort by score descending
    scored_results.sort_by(|a, b| b.1.partial_cmp(&a.1).unwrap());

    // Return only note IDs
    Ok(scored_results.into_iter().map(|(id, _)| id).collect())
}

#[tauri::command]
pub async fn load_note_content(path: String) -> Result<String, String> {
    std::fs::read_to_string(&path)
        .map_err(|e| format!("Failed to read file: {}", e))
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

#[tauri::command]
pub async fn save_note_content(path: String, content: String) -> Result<String, String> {
    std::fs::write(&path, content)
        .map_err(|e| format!("Failed to save note: {}", e))?;
    
    Ok("Note saved".to_string())
}
