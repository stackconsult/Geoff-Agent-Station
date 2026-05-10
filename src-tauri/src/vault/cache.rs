use serde::{Deserialize, Serialize};
use std::path::PathBuf;

#[derive(Debug, Serialize, Deserialize)]
pub struct VaultCache {
    pub entries: Vec<super::VaultEntry>,
    pub timestamp: i64,
}

pub fn get_cache_path(vault_path: &str) -> PathBuf {
    let hash = format!("{:x}", md5::compute(vault_path.as_bytes()));
    PathBuf::from(format!("~/.tolaria/cache/{}.json", hash))
}

pub async fn read_cache(path: &PathBuf) -> Option<Vec<super::VaultEntry>> {
    let content = std::fs::read_to_string(path).ok()?;
    let cache: VaultCache = serde_json::from_str(&content).ok()?;
    
    // Check if cache is valid (less than 1 hour old)
    let now = chrono::Utc::now().timestamp();
    if now - cache.timestamp < 3600 {
        Some(cache.entries)
    } else {
        None
    }
}

pub async fn write_cache(path: &PathBuf, entries: &[super::VaultEntry]) {
    let cache = VaultCache {
        entries: entries.to_vec(),
        timestamp: chrono::Utc::now().timestamp(),
    };
    
    if let Some(parent) = path.parent() {
        std::fs::create_dir_all(parent).ok();
    }
    
    let json = serde_json::to_string(&cache).unwrap();
    std::fs::write(path, json).ok();
}
