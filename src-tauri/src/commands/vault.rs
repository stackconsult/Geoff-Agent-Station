use crate::vault::{scan_vault, VaultFrontmatter};

/// Strips the leading `---\n...\n---\n` frontmatter block from a markdown string.
/// Returns the body content after the closing `---`.
pub fn strip_frontmatter(content: &str) -> &str {
    if !content.starts_with("---") {
        return content;
    }
    let after_open = &content[3..];
    if let Some(close_pos) = after_open.find("\n---") {
        // "\n---" is 4 bytes; the trailing newline after "---" is 1 more = 5 total
        let skip = 3 + close_pos + 5;
        content.get(skip..).unwrap_or(content)
    } else {
        content
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_strip_frontmatter_removes_existing_block() {
        let input = "---\ntitle: Test\n---\n# Body\n\nContent here.\n";
        let result = strip_frontmatter(input);
        assert_eq!(result, "# Body\n\nContent here.\n");
    }

    #[test]
    fn test_strip_frontmatter_no_frontmatter_unchanged() {
        let input = "# Just a note\n\nNo frontmatter.\n";
        assert_eq!(strip_frontmatter(input), input);
    }

    #[test]
    fn test_strip_frontmatter_idempotent() {
        let input = "---\ntitle: Test\n---\n# Body\n";
        let once = strip_frontmatter(input);
        let twice = strip_frontmatter(once);
        assert_eq!(once, twice, "stripping twice must equal stripping once");
    }
}

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

    // Strip existing frontmatter before prepending new one — prevents duplicate blocks.
    let body = strip_frontmatter(&content).to_string();

    let yaml = serde_yaml::to_string(&frontmatter)
        .map_err(|e| format!("Failed to serialize frontmatter: {}", e))?;

    let new_content = format!("---\n{}---\n{}", yaml, body);

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
