use std::process::Command;

#[tauri::command]
pub async fn git_commit(vault_path: String, message: String) -> Result<String, String> {
    let output = Command::new("git")
        .args(["add", "."])
        .current_dir(&vault_path)
        .output();
    
    if output.is_err() {
        return Err("Failed to stage changes".to_string());
    }
    
    let output = Command::new("git")
        .args(["commit", "-m", &message])
        .current_dir(&vault_path)
        .output();
    
    match output {
        Ok(output) => {
            if output.status.success() {
                Ok("Commit successful".to_string())
            } else {
                Err(String::from_utf8_lossy(&output.stderr).to_string())
            }
        }
        Err(e) => Err(format!("Failed to commit: {}", e))
    }
}

#[tauri::command]
pub async fn git_status(vault_path: String) -> Result<String, String> {
    let output = Command::new("git")
        .args(["status", "--short"])
        .current_dir(&vault_path)
        .output();
    
    match output {
        Ok(output) => Ok(String::from_utf8_lossy(&output.stdout).to_string()),
        Err(e) => Err(format!("Failed to get status: {}", e))
    }
}
