use serde::{Deserialize, Serialize};
use std::fs;

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct DetectedVault {
    pub path: String,
    pub name: String,
    pub note_count: usize,
    pub last_modified: String,
}

#[tauri::command]
pub fn detect_obsidian_vaults() -> Vec<DetectedVault> {
    let mut vaults = Vec::new();
    
    // Common Obsidian vault locations on Windows
    let common_locations = vec![
        dirs::home_dir().unwrap().join("Documents").join("Obsidian"),
        dirs::home_dir().unwrap().join("Documents").join("Notes"),
        dirs::home_dir().unwrap().join("Desktop").join("Notes"),
        dirs::home_dir().unwrap().join("OneDrive").join("Obsidian"),
        dirs::home_dir().unwrap().join("OneDrive").join("Notes"),
    ];
    
    for location in common_locations {
        if location.exists() && location.is_dir() {
            if let Ok(entries) = fs::read_dir(&location) {
                for entry in entries.flatten() {
                    let path = entry.path();
                    if path.is_dir() {
                        // Check if it's a valid Obsidian vault (contains .md files)
                        if let Ok(note_count) = count_markdown_files(&path) {
                            if note_count > 0 {
                                let name = path.file_name()
                                    .and_then(|n| n.to_str())
                                    .unwrap_or("Unknown")
                                    .to_string();
                                
                                let last_modified = get_last_modified(&path);
                                
                                vaults.push(DetectedVault {
                                    path: path.to_string_lossy().to_string(),
                                    name,
                                    note_count,
                                    last_modified,
                                });
                            }
                        }
                    }
                }
            }
        }
    }
    
    vaults.sort_by(|a, b| b.last_modified.cmp(&a.last_modified));
    vaults
}

fn count_markdown_files(dir: &std::path::Path) -> Result<usize, std::io::Error> {
    let mut count = 0;
    if dir.is_dir() {
        for entry in fs::read_dir(dir)? {
            let entry = entry?;
            let path = entry.path();
            if path.is_dir() {
                count += count_markdown_files(&path)?;
            } else if path.extension().and_then(|e| e.to_str()) == Some("md") {
                count += 1;
            }
        }
    }
    Ok(count)
}

fn get_last_modified(dir: &std::path::Path) -> String {
    let mut latest = std::time::SystemTime::UNIX_EPOCH;
    
    if let Ok(entries) = fs::read_dir(dir) {
        for entry in entries.flatten() {
            if let Ok(metadata) = entry.metadata() {
                if let Ok(modified) = metadata.modified() {
                    if modified > latest {
                        latest = modified;
                    }
                }
            }
        }
    }
    
    let duration = latest.duration_since(std::time::UNIX_EPOCH).unwrap_or_default();
    let secs = duration.as_secs();
    
    if secs < 60 {
        format!("{}s ago", secs)
    } else if secs < 3600 {
        format!("{}m ago", secs / 60)
    } else if secs < 86400 {
        format!("{}h ago", secs / 3600)
    } else if secs < 604800 {
        format!("{}d ago", secs / 86400)
    } else {
        format!("{}w ago", secs / 604800)
    }
}
