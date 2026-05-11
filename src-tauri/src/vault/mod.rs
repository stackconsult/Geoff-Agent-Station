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
    // Type system
    #[serde(default)]
    pub r#type: Option<String>,
    
    // Timestamps
    #[serde(default)]
    pub created: Option<String>,
    #[serde(default)]
    pub modified: Option<String>,
    
    // Boolean flags
    #[serde(default)]
    pub archived: Option<bool>,
    #[serde(default)]
    pub organized: Option<bool>,
    #[serde(default)]
    pub favorite: Option<bool>,
    #[serde(default)]
    pub visible: Option<bool>,
    
    // Categorization
    #[serde(default)]
    pub tags: Option<Vec<String>>,
    #[serde(default)]
    pub aliases: Option<Vec<String>>,
    #[serde(default)]
    pub status: Option<String>,
    
    // Display
    #[serde(default)]
    pub icon: Option<String>,
    #[serde(default)]
    pub color: Option<String>,
    #[serde(default)]
    pub order: Option<i32>,
    
    // Relationships
    #[serde(default)]
    pub belongs_to: Option<Vec<String>>,
    #[serde(default)]
    pub related_to: Option<Vec<String>>,
    
    // Catch-all for custom fields
    #[serde(flatten)]
    pub extra: std::collections::HashMap<String, serde_json::Value>,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct VaultEntry {
    // Core identification
    pub path: String,
    pub filename: String,
    pub title: String,
    
    // Type and categorization
    #[serde(rename = "isA")]
    pub is_a: Option<String>,
    
    // Content metadata
    pub snippet: String,
    #[serde(rename = "wordCount")]
    pub word_count: usize,
    #[serde(rename = "hasH1")]
    pub has_h1: bool,
    
    // Timestamps (unix seconds)
    #[serde(rename = "modifiedAt")]
    pub modified_at: Option<i64>,
    #[serde(rename = "createdAt")]
    pub created_at: Option<i64>,
    
    // File metadata
    #[serde(rename = "fileSize")]
    pub file_size: u64,
    #[serde(rename = "fileKind")]
    pub file_kind: String,
    
    // Boolean flags
    pub archived: bool,
    pub organized: bool,
    pub favorite: bool,
    pub visible: Option<bool>,
    
    // Relationships
    pub aliases: Vec<String>,
    #[serde(rename = "belongsTo")]
    pub belongs_to: Vec<String>,
    #[serde(rename = "relatedTo")]
    pub related_to: Vec<String>,
    #[serde(rename = "outgoingLinks")]
    pub outgoing_links: Vec<String>,
    pub relationships: std::collections::HashMap<String, Vec<String>>,
    
    // Display customization
    pub status: Option<String>,
    pub icon: Option<String>,
    pub color: Option<String>,
    pub order: Option<i32>,
    #[serde(rename = "sidebarLabel")]
    pub sidebar_label: Option<String>,
    #[serde(rename = "favoriteIndex")]
    pub favorite_index: Option<i32>,
    
    // View configuration
    pub template: Option<String>,
    pub sort: Option<String>,
    pub view: Option<String>,
    #[serde(rename = "listPropertiesDisplay")]
    pub list_properties_display: Vec<String>,
    
    // Custom properties (catch-all for frontmatter)
    pub properties: std::collections::HashMap<String, serde_json::Value>,
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
        let content = fs::read_to_string(path)
            .map_err(|e| format!("Failed to read file {:?}: {}", path, e))?;
        
        // Parse frontmatter
        let (frontmatter, _) = parse_frontmatter(&content);
        
        // Extract links
        let links = extract_links(&content);
        
        // Create entry
        let path_str = path.to_string_lossy().to_string();
        let filename = path.file_stem()
            .and_then(|s| s.to_str())
            .unwrap_or("unknown")
            .to_string();

        // Extract body (skip frontmatter)
        let body = if content.starts_with("---") {
            content.lines()
                .skip_while(|line| *line != "---")
                .skip(1)
                .skip_while(|line| *line != "---")
                .skip(1)
                .collect::<Vec<_>>()
                .join("\n")
        } else {
            content.clone()
        };

        // Generate snippet (first 150 chars of body, no markdown)
        let snippet = body
            .lines()
            .filter(|line| !line.trim().is_empty())
            .collect::<Vec<_>>()
            .join(" ")
            .chars()
            .take(150)
            .collect::<String>();

        // Word count
        let word_count = body.split_whitespace().count();

        // Check for H1
        let has_h1 = body.lines()
            .find(|line| !line.trim().is_empty())
            .map(|line| line.trim().starts_with("# "))
            .unwrap_or(false);

        // File metadata
        let metadata = fs::metadata(path).ok();
        let file_size = metadata.as_ref().map(|m| m.len()).unwrap_or(0);
        let modified_at = metadata
            .as_ref()
            .and_then(|m| m.modified().ok())
            .and_then(|t| t.duration_since(std::time::UNIX_EPOCH).ok())
            .map(|d| d.as_secs() as i64);
        let created_at = metadata
            .and_then(|m| m.created().ok())
            .and_then(|t| t.duration_since(std::time::UNIX_EPOCH).ok())
            .map(|d| d.as_secs() as i64);

        // Build properties map from frontmatter.extra
        let mut properties = std::collections::HashMap::new();
        for (key, value) in frontmatter.extra.iter() {
            properties.insert(key.clone(), value.clone());
        }

        // Build relationships map
        let mut relationships = std::collections::HashMap::new();
        if let Some(belongs_to) = &frontmatter.belongs_to {
            relationships.insert("belongsTo".to_string(), belongs_to.clone());
        }
        if let Some(related_to) = &frontmatter.related_to {
            relationships.insert("relatedTo".to_string(), related_to.clone());
        }

        let entry = VaultEntry {
            path: path_str,
            filename: filename.clone(),
            title: filename,
            is_a: frontmatter.r#type.clone(),
            snippet,
            word_count,
            has_h1,
            modified_at,
            created_at,
            file_size,
            file_kind: "markdown".to_string(),
            archived: frontmatter.archived.unwrap_or(false),
            organized: frontmatter.organized.unwrap_or(false),
            favorite: frontmatter.favorite.unwrap_or(false),
            visible: frontmatter.visible,
            aliases: frontmatter.aliases.clone().unwrap_or_default(),
            belongs_to: frontmatter.belongs_to.clone().unwrap_or_default(),
            related_to: frontmatter.related_to.clone().unwrap_or_default(),
            outgoing_links: links,
            relationships,
            status: frontmatter.status.clone(),
            icon: frontmatter.icon.clone(),
            color: frontmatter.color.clone(),
            order: frontmatter.order,
            sidebar_label: None,
            favorite_index: None,
            template: None,
            sort: None,
            view: None,
            list_properties_display: Vec::new(),
            properties,
        };
        
        entries.push(entry);
    }

    // Write to cache
    write_cache(&cache_path, &entries).await;

    Ok(entries)
}
