// Learn more about Tauri commands at https://tauri.app/develop/calling-rust/
mod vault;
mod git;
mod mcp;
mod system;
mod window;
mod vault_detection;
pub mod validation;
mod automation;
pub mod ai;
pub mod clipboard;
pub mod productivity;

// Commands module - must be declared before use
mod commands;

#[tauri::command]
fn greet(name: &str) -> String {
    format!("Hello, {}! You've been greeted from Rust!", name)
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    // Initialize tracing subscriber
    tracing_subscriber::fmt()
        .with_env_filter(
            tracing_subscriber::EnvFilter::from_default_env()
                .add_directive(tracing::Level::DEBUG.into())
                .add_directive(tracing::metadata::LevelFilter::INFO.into()),
        )
        .init();

    tauri::Builder::default()
        .plugin(tauri_plugin_opener::init())
        .plugin(tauri_plugin_dialog::init())
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
            commands::vault::list_backup_files,
            commands::vault::restore_from_backup,
            // Health commands
            commands::health::health_check,
            // System commands
            system::get_machine_specs,
            system::get_performance_tier,
            // Window commands
            window::get_adaptive_window_config,
            // Vault detection commands
            vault_detection::detect_obsidian_vaults,
            vault_detection::start_file_watcher,
            vault_detection::stop_file_watcher,
            vault_detection::pick_folder_dialog,
            vault_detection::validate_vault_path,
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
            automation::commands::delete_scheduled_task,
            // AI commands
            commands::ai::ai_initialize,
            commands::ai::ai_chat,
            commands::ai::ai_chat_stream,
            commands::ai::ai_clear_history,
            commands::ai::ai_get_history,
            commands::ai::ai_update_config,
            commands::ai::ai_setup_obsidian_vault,
            commands::ai::ai_ingest_documentation,
            commands::ai::ai_search_docs,
            commands::ai::ai_list_models,
            commands::ai::ai_switch_model,
            // Clipboard commands
            commands::clipboard::clipboard_get_text,
            commands::clipboard::clipboard_set_text,
            commands::clipboard::clipboard_get_history,
            commands::clipboard::clipboard_search,
            commands::clipboard::clipboard_toggle_favorite,
            commands::clipboard::clipboard_delete_entry,
            commands::clipboard::clipboard_clear_history,
            // Productivity commands
            commands::productivity::productivity_start_tracking,
            commands::productivity::productivity_stop_tracking,
            commands::productivity::productivity_get_stats,
            commands::productivity::productivity_start_pomodoro,
            commands::productivity::productivity_get_pomodoro_status,
            commands::productivity::productivity_stop_pomodoro
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
