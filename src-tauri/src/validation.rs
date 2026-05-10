use std::path::PathBuf;

pub fn validate_vault_path(path: &str) -> Result<PathBuf, String> {
    let path = PathBuf::from(path);
    
    if !path.exists() {
        return Err("Vault path does not exist".to_string());
    }
    
    if !path.is_dir() {
        return Err("Vault path is not a directory".to_string());
    }
    
    Ok(path)
}

pub fn validate_note_id(id: &str) -> Result<(), String> {
    if id.is_empty() {
        return Err("Note ID cannot be empty".to_string());
    }
    
    if id.contains("..") {
        return Err("Note ID contains invalid path traversal".to_string());
    }
    
    Ok(())
}
