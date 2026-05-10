// Learn more about Tauri commands at https://tauri.app/develop/calling-rust/
mod vault;
mod git;
mod mcp;
mod system;
mod window;
mod vault_detection;
pub mod validation;
mod automation;

// Commands module - must be declared before use
mod commands;

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
            // Media commands
            commands::media::save_image,
            // Vault commands
            commands::vault::search_notes,
            commands::vault::load_note_content,
            commands::vault::save_note_content,
            commands::vault::update_frontmatter,
            // System commands
            system::get_machine_specs,
            system::get_performance_tier,
            // Window commands
            window::get_adaptive_window_config,
            // Vault detection commands
            vault_detection::detect_obsidian_vaults,
            // Automation commands
            automation::commands::create_workflow,
            automation::commands::list_workflows,
            automation::commands::get_workflow,
            automation::commands::execute_workflow,
            automation::commands::delete_workflow,
            automation::commands::schedule_task,
            automation::commands::list_scheduled_tasks,
            automation::commands::enable_scheduled_task,
            automation::commands::disable_scheduled_task,
            automation::commands::delete_scheduled_task
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
