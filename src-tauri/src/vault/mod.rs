pub mod cache;
pub mod parsing;

use serde::{Deserialize, Serialize};
use std::path::PathBuf;

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
}

#[tauri::command]
pub async fn scan_vault(_vault_path: String) -> Result<Vec<VaultEntry>, String> {
    Ok(Vec::new())
}
