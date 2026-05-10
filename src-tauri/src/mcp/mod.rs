use std::process::Command;

#[tauri::command]
pub async fn spawn_mcp_server(vault_path: String) -> Result<String, String> {
    let output = Command::new("node")
        .args(["mcp-server/index.js"])
        .current_dir(&vault_path)
        .spawn();
    
    match output {
        Ok(_) => Ok("MCP server started".to_string()),
        Err(e) => Err(format!("Failed to start MCP server: {}", e))
    }
}

#[tauri::command]
pub async fn register_mcp_tools() -> Result<Vec<String>, String> {
    Ok(vec![
        "search_notes".to_string(),
        "get_note".to_string(),
        "update_frontmatter".to_string(),
    ])
}
