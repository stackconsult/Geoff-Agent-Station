pub mod cache;
pub mod parsing;

use regex::Regex;
use serde::{Deserialize, Serialize};
use std::fs;
use std::path::PathBuf;

fn validate_vault_path(path: &str) -> Result<PathBuf, String> {
    let path = PathBuf::from(path);
    
    if !path.exists() {
        return Err("Vault path does not exist".to_string());
    }
    
    if !path.is_dir() {
        return Err("Vault path is not a directory".to_string());
    }
    
    Ok(path)
}

#[derive(Debug, Serialize, Deserialize, Clone, Default)]
pub struct VaultFrontmatter {
    #[serde(default)]
    pub r#type: Option<String>,
    #[serde(default)]
    pub tags: Option<Vec<String>>,
    #[serde(default)]
    pub created: Option<String>,
    #[serde(default)]
    pub modified: Option<String>,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct VaultEntry {
    pub id: String,
    pub title: String,
    pub path: PathBuf,
    pub frontmatter: VaultFrontmatter,
    pub links: Vec<String>,
}

pub fn extract_links(content: &str) -> Vec<String> {
    let mut links = Vec::new();

    // Extract [[wikilinks]]
    let wikilink_regex = Regex::new(r"\[\[([^\]]+)\]\]").unwrap();
    for cap in wikilink_regex.captures_iter(content) {
        if let Some(link) = cap.get(1) {
            links.push(link.as_str().to_string());
        }
    }

    // Extract [regular links](url)
    let link_regex = Regex::new(r"\[([^\]]+)\]\(([^)]+)\)").unwrap();
    for cap in link_regex.captures_iter(content) {
        if let Some(url) = cap.get(2) {
            links.push(url.as_str().to_string());
        }
    }

    links
}

#[tauri::command]
pub async fn scan_vault(vault_path: String) -> Result<Vec<VaultEntry>, String> {
    use crate::vault::cache::{get_cache_path, read_cache, write_cache};
    use crate::vault::parsing::parse_frontmatter;
    use walkdir::WalkDir;
    
    let vault_path = validate_vault_path(&vault_path)?;
    let cache_path = get_cache_path(vault_path.to_str().ok_or("Invalid vault path")?);
    
    // Try to read from cache first
    if let Some(cached_entries) = read_cache(&cache_path).await {
        return Ok(cached_entries);
    }

    let mut entries = Vec::new();

    // Walk the vault directory for .md files
    for entry in WalkDir::new(&vault_path)
        .into_iter()
        .filter_map(|e| e.ok())
        .filter(|e| e.path().extension().and_then(|ext| ext.to_str()) == Some("md"))
    {
        let path = entry.path();
        
        // Read file content
        let content = fs::read_to_string(&path)
            .map_err(|e| format!("Failed to read file {:?}: {}", path, e))?;
        
        // Parse frontmatter
        let (frontmatter, _) = parse_frontmatter(&content);
        
        // Extract links
        let links = extract_links(&content);
        
        // Create entry
        let entry = VaultEntry {
            id: path.file_stem()
                .and_then(|s| s.to_str())
                .unwrap_or("unknown")
                .to_string(),
            title: path.file_stem()
                .and_then(|s| s.to_str())
                .unwrap_or("unknown")
                .to_string(),
            path: path.to_path_buf(),
            frontmatter: VaultFrontmatter {
                r#type: frontmatter.r#type,
                tags: frontmatter.tags,
                created: frontmatter.created,
                modified: frontmatter.modified,
            },
            links,
        };
        
        entries.push(entry);
    }

    // Write to cache
    write_cache(&cache_path, &entries).await;

    Ok(entries)
}
