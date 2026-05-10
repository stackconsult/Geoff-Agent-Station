// Learn more about Tauri commands at https://tauri.app/develop/calling-rust/
mod vault;
mod git;
mod mcp;
mod commands;
pub mod validation;

#[tauri::command]
fn greet(name: &str) -> String {
    format!("Hello, {}! You've been greeted from Rust!", name)
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_opener::init())
        .invoke_handler(tauri::generate_handler![
            greet,
            // Vault commands
            vault::scan_vault,
            // Git commands
            git::git_commit,
            git::git_status,
            // MCP commands
            mcp::spawn_mcp_server,
            mcp::register_mcp_tools,
            // Desktop commands
            commands::desktop::reveal_file,
            commands::desktop::open_file,
            commands::media::save_image,
            commands::vault::search_notes,
            commands::vault::update_frontmatter
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
