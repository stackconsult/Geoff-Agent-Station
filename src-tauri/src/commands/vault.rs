#![allow(dead_code)] // Tauri commands registered via generate_handler! macro + helper functions

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

    #[tokio::test]
    async fn test_save_note_content_creates_and_cleans_backup() {
        let dir = std::env::temp_dir().join("tolaria_test_save");
        let _ = std::fs::create_dir_all(&dir);
        let path = dir.join("test_note.md");
        let bak_path = format!("{}.bak", path.display());

        // Write initial content
        std::fs::write(&path, "original content").unwrap();

        // Save new content via our function
        let result = save_note_content(path.display().to_string(), "updated content".to_string()).await;
        assert!(result.is_ok(), "save should succeed");

        // File should have new content
        let content = std::fs::read_to_string(&path).unwrap();
        assert_eq!(content, "updated content");

        // Backup should be cleaned up on success
        assert!(!std::path::Path::new(&bak_path).exists(), ".bak should be removed after successful save");

        // Cleanup
        let _ = std::fs::remove_dir_all(&dir);
    }

    #[tokio::test]
    async fn test_save_note_content_new_file_no_backup_needed() {
        let dir = std::env::temp_dir().join("tolaria_test_save_new");
        let _ = std::fs::create_dir_all(&dir);
        let path = dir.join("brand_new.md");

        // File doesn't exist yet — should still work
        let result = save_note_content(path.display().to_string(), "fresh content".to_string()).await;
        assert!(result.is_ok(), "save of new file should succeed");

        let content = std::fs::read_to_string(&path).unwrap();
        assert_eq!(content, "fresh content");

        // Cleanup
        let _ = std::fs::remove_dir_all(&dir);
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
    let bak_path = format!("{}.bak", &path);

    // Create backup of existing file (if it exists) before overwriting
    if std::path::Path::new(&path).exists() {
        std::fs::copy(&path, &bak_path)
            .map_err(|e| format!("Failed to create backup: {}", e))?;
    }

    // Attempt the write
    match std::fs::write(&path, &content) {
        Ok(_) => {
            // Success — remove backup
            let _ = std::fs::remove_file(&bak_path);
            Ok("Note saved".to_string())
        }
        Err(e) => {
            // Write failed — attempt restore from backup
            if std::path::Path::new(&bak_path).exists() {
                let _ = std::fs::copy(&bak_path, &path);
                let _ = std::fs::remove_file(&bak_path);
            }
            Err(format!("Failed to save note: {}", e))
        }
    }
}
