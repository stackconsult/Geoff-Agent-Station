use crate::vault::{scan_vault, VaultFrontmatter};
use std::path::PathBuf;
use std::fs;
use walkdir::WalkDir;

#[derive(serde::Serialize, serde::Deserialize)]
pub struct BackupFile {
    pub path: String,
    pub original_path: String,
    pub size: u64,
    pub modified: i64,
}

#[tauri::command]
pub fn list_backup_files(vault_path: String) -> Result<Vec<BackupFile>, String> {
    let mut backups = Vec::new();
    
    for entry in WalkDir::new(&vault_path)
        .into_iter()
        .filter_map(|e| e.ok())
        .filter(|e| e.path().extension().and_then(|ext| ext.to_str()) == Some("bak"))
    {
        let path = entry.path();
        
        // Get original path by replacing .bak with original extension
        let original_path = if let Some(stem) = path.file_stem() {
            // Check if stem ends with .bak or is the original name
            let stem_str = stem.to_string_lossy();
            let parent = path.parent().unwrap_or_else(|| std::path::Path::new("."));
            
            // Try common extensions
            let mut possible_originals = vec![".md", ".txt", ".json"];
            possible_originals.push(""); // no extension
            
            let found = possible_originals.into_iter()
                .find(|ext| {
                    let test_path = parent.join(format!("{}{}", stem_str, ext));
                    test_path.exists()
                });
            
            found.map(|ext| parent.join(format!("{}{}", stem_str, ext)))
                .unwrap_or_else(|| path.to_path_buf())
        } else {
            path.to_path_buf()
        };
        
        let metadata = fs::metadata(path)
            .map_err(|e| format!("Failed to read metadata: {}", e))?;
        
        let modified = metadata.modified()
            .ok()
            .and_then(|t| t.duration_since(std::time::UNIX_EPOCH).ok())
            .map(|d| d.as_secs() as i64)
            .unwrap_or(0);
        
        backups.push(BackupFile {
            path: path.display().to_string(),
            original_path: original_path.display().to_string(),
            size: metadata.len(),
            modified,
        });
    }
    
    // Sort by modified time (newest first)
    backups.sort_by(|a, b| b.modified.cmp(&a.modified));
    
    Ok(backups)
}

#[tauri::command]
pub fn restore_from_backup(backup_path: String, original_path: String) -> Result<(), String> {
    let backup_content = fs::read_to_string(&backup_path)
        .map_err(|e| format!("Failed to read backup: {}", e))?;
    
    fs::write(&original_path, &backup_content)
        .map_err(|e| format!("Failed to restore: {}", e))?;
    
    // Optionally remove the backup after successful restore
    let _ = fs::remove_file(&backup_path);
    
    Ok(())
}

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

    #[tokio::test]
    async fn test_list_backup_files_empty_dir() {
        let dir = std::env::temp_dir().join("tolaria_test_backup_list_empty");
        let _ = std::fs::create_dir_all(&dir);

        let result = list_backup_files(dir.display().to_string());
        assert!(result.is_ok());
        assert!(result.unwrap().is_empty());

        let _ = std::fs::remove_dir_all(&dir);
    }

    #[tokio::test]
    async fn test_list_backup_files_finds_bak() {
        let dir = std::env::temp_dir().join("tolaria_test_backup_list");
        let _ = std::fs::create_dir_all(&dir);
        let bak_path = dir.join("test.md.bak");
        std::fs::write(&bak_path, "backup content").unwrap();

        let result = list_backup_files(dir.display().to_string());
        assert!(result.is_ok());
        let backups = result.unwrap();
        assert_eq!(backups.len(), 1);
        assert!(backups[0].path.ends_with("test.md.bak"));

        let _ = std::fs::remove_dir_all(&dir);
    }

    #[tokio::test]
    async fn test_restore_from_backup() {
        let dir = std::env::temp_dir().join("tolaria_test_restore");
        let _ = std::fs::create_dir_all(&dir);
        let bak_path = dir.join("restore_test.md.bak");
        let original_path = dir.join("restore_test.md");
        std::fs::write(&bak_path, "restored content").unwrap();

        let result = restore_from_backup(bak_path.display().to_string(), original_path.display().to_string());
        assert!(result.is_ok());

        let content = std::fs::read_to_string(&original_path).unwrap();
        assert_eq!(content, "restored content");
        assert!(!bak_path.exists(), "backup should be removed after restore");

        let _ = std::fs::remove_dir_all(&dir);
    }

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

    #[test]
    fn test_make_bak_path_replaces_extension() {
        assert!(make_bak_path("notes/test.note.md").ends_with("test.note.bak"));
        assert!(!make_bak_path("notes/test.note.md").contains(".md"));
    }

    #[test]
    fn test_make_bak_path_no_extension() {
        assert!(make_bak_path("notes/README").ends_with("README.bak"));
    }

    #[tokio::test]
    async fn test_save_note_content_creates_and_cleans_backup() {
        let dir = std::env::temp_dir().join("tolaria_test_save");
        let _ = std::fs::create_dir_all(&dir);
        let path = dir.join("test_note.md");
        let bak_path = make_bak_path(&path.display().to_string());

        std::fs::write(&path, "original content").unwrap();

        let result = save_note_content(path.display().to_string(), "updated content".to_string()).await;
        assert!(result.is_ok(), "save should succeed");

        let content = std::fs::read_to_string(&path).unwrap();
        assert_eq!(content, "updated content");

        assert!(!std::path::Path::new(&bak_path).exists(), ".bak should be removed after successful save");

        let _ = std::fs::remove_dir_all(&dir);
    }

    #[tokio::test]
    async fn test_save_note_content_new_file_no_backup_needed() {
        let dir = std::env::temp_dir().join("tolaria_test_save_new");
        let _ = std::fs::create_dir_all(&dir);
        let path = dir.join("brand_new.md");

        let result = save_note_content(path.display().to_string(), "fresh content".to_string()).await;
        assert!(result.is_ok(), "save of new file should succeed");

        let content = std::fs::read_to_string(&path).unwrap();
        assert_eq!(content, "fresh content");

        let _ = std::fs::remove_dir_all(&dir);
    }

    #[tokio::test]
    async fn test_save_note_content_orphaned_bak_replaced_and_cleaned() {
        let dir = std::env::temp_dir().join("tolaria_test_orphaned_bak");
        let _ = std::fs::create_dir_all(&dir);
        let path = dir.join("orphan_test.md");
        let bak_path = make_bak_path(&path.display().to_string());

        std::fs::write(&path, "current content").unwrap();
        std::fs::write(&bak_path, "stale orphaned backup").unwrap();

        let result = save_note_content(path.display().to_string(), "new content".to_string()).await;
        assert!(result.is_ok(), "save should succeed even with orphaned .bak");

        let content = std::fs::read_to_string(&path).unwrap();
        assert_eq!(content, "new content");

        assert!(!std::path::Path::new(&bak_path).exists(), "orphaned .bak should be cleaned up after successful save");

        let _ = std::fs::remove_dir_all(&dir);
    }

    #[tokio::test]
    async fn test_update_frontmatter_creates_backup() {
        let dir = std::env::temp_dir().join("tolaria_test_fm_backup");
        let _ = std::fs::create_dir_all(&dir);
        let path = dir.join("fm_test.md");
        let bak_path = make_bak_path(&path.display().to_string());

        std::fs::write(&path, "---\ntitle: Old\n---\n# Body\n").unwrap();

        let fm = VaultFrontmatter {
            r#type: Some("New Title".to_string()),
            ..Default::default()
        };

        let result = update_frontmatter(path.display().to_string(), fm).await;
        assert!(result.is_ok(), "update_frontmatter should succeed");

        let content = std::fs::read_to_string(&path).unwrap();
        assert!(content.contains("New Title"), "frontmatter should contain new title");
        assert!(!content.contains("title: Old"), "old frontmatter should be replaced");

        assert!(!std::path::Path::new(&bak_path).exists(), ".bak should be removed after successful update_frontmatter");

        let _ = std::fs::remove_dir_all(&dir);
    }

    #[tokio::test]
    async fn test_search_notes_empty_query() {
        let result = search_notes("/any/path".to_string(), "".to_string()).await;
        assert!(result.is_ok());
        assert!(result.unwrap().is_empty());
    }

    #[tokio::test]
    async fn test_search_notes_query() {
        let dir = std::env::temp_dir().join("tolaria_test_search");
        let _ = std::fs::create_dir_all(&dir);
        let note1 = dir.join("test_note.md");
        let note2 = dir.join("other_note.md");
        std::fs::write(&note1, "# Test Note\nContent").unwrap();
        std::fs::write(&note2, "# Other Note\nContent").unwrap();

        let result = search_notes(dir.display().to_string(), "test".to_string()).await;
        assert!(result.is_ok());
        let paths = result.unwrap();
        assert!(!paths.is_empty());

        let _ = std::fs::remove_dir_all(&dir);
    }

    #[tokio::test]
    async fn test_load_note_content() {
        let dir = std::env::temp_dir().join("tolaria_test_load");
        let _ = std::fs::create_dir_all(&dir);
        let path = dir.join("load_test.md");
        std::fs::write(&path, "# Test\nContent").unwrap();

        let result = load_note_content(path.display().to_string()).await;
        assert!(result.is_ok());
        assert!(result.unwrap().contains("Content"));

        let _ = std::fs::remove_dir_all(&dir);
    }

    #[tokio::test]
    async fn test_load_note_content_with_frontmatter() {
        let dir = std::env::temp_dir().join("tolaria_test_load_fm");
        let _ = std::fs::create_dir_all(&dir);
        let path = dir.join("load_test_fm.md");
        std::fs::write(&path, "---\ntitle: Test\n---\n# Body\nContent").unwrap();

        let result = load_note_content(path.display().to_string()).await;
        assert!(result.is_ok());
        let content = result.unwrap();
        assert!(content.contains("Content"));
        assert!(content.contains("title: Test"));

        let _ = std::fs::remove_dir_all(&dir);
    }

    #[tokio::test]
    async fn test_search_notes_case_insensitive() {
        let dir = std::env::temp_dir().join("tolaria_test_search_ci");
        let _ = std::fs::create_dir_all(&dir);
        let note = dir.join("TEST_NOTE.md");
        std::fs::write(&note, "# Test Note\nContent").unwrap();

        let result = search_notes(dir.display().to_string(), "test".to_string()).await;
        assert!(result.is_ok());
        assert!(!result.unwrap().is_empty());

        let _ = std::fs::remove_dir_all(&dir);
    }

    #[tokio::test]
    async fn test_list_backup_files_sorts_by_modified() {
        let dir = std::env::temp_dir().join("tolaria_test_backup_sort");
        let _ = std::fs::create_dir_all(&dir);
        
        let bak1 = dir.join("old.md.bak");
        let bak2 = dir.join("new.md.bak");
        
        std::fs::write(&bak1, "old").unwrap();
        std::thread::sleep(std::time::Duration::from_millis(10));
        std::fs::write(&bak2, "new").unwrap();

        let result = list_backup_files(dir.display().to_string());
        assert!(result.is_ok());
        let backups = result.unwrap();
        assert_eq!(backups.len(), 2);
        // Newest first
        assert!(backups[0].path.contains("new"));
        assert!(backups[1].path.contains("old"));

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

    // Backup before write — write from in-memory content (avoids TOCTOU from fs::copy)
    let bak_path = make_bak_path(&path);
    std::fs::write(&bak_path, &content)
        .map_err(|e| format!("Failed to create backup: {}", e))?;

    match std::fs::write(&path, &new_content) {
        Ok(_) => {
            let _ = std::fs::remove_file(&bak_path);
            Ok("Frontmatter updated".to_string())
        }
        Err(e) => {
            if std::path::Path::new(&bak_path).exists() {
                let _ = std::fs::copy(&bak_path, &path);
                let _ = std::fs::remove_file(&bak_path);
            }
            Err(format!("Failed to write file: {}", e))
        }
    }
}

/// Constructs a `.bak` sibling path using PathBuf — safe on all platforms.
/// e.g. "notes/test.note.md" → "notes/test.note.bak"
fn make_bak_path(path: &str) -> String {
    let mut p = PathBuf::from(path);
    p.set_extension("bak");
    p.display().to_string()
}

#[tauri::command]
pub async fn save_note_content(path: String, content: String) -> Result<String, String> {
    let bak_path = make_bak_path(&path);

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
