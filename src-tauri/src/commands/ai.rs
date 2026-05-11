#![allow(dead_code)] // All items are Tauri commands — registered via generate_handler! macro

use crate::ai::{AIEngine, AIConfig, Message};
use once_cell::sync::Lazy;
use std::sync::Arc;
use tokio::sync::Mutex;

static AI_ENGINE: Lazy<Arc<Mutex<Option<AIEngine>>>> = Lazy::new(|| Arc::new(Mutex::new(None)));

#[tauri::command]
pub async fn ai_initialize(config: AIConfig) -> Result<(), String> {
    let engine = AIEngine::new(config);
    let mut global_engine: tokio::sync::MutexGuard<'_, Option<AIEngine>> = AI_ENGINE.lock().await;
    *global_engine = Some(engine);
    Ok(())
}

#[tauri::command]
pub async fn ai_chat(message: String) -> Result<String, String> {
    let global_engine: tokio::sync::MutexGuard<'_, Option<AIEngine>> = AI_ENGINE.lock().await;
    if let Some(engine) = global_engine.as_ref() {
        engine.chat(message).await
    } else {
        Err("AI engine not initialized. Call ai_initialize first.".to_string())
    }
}

#[tauri::command]
pub async fn ai_clear_history() -> Result<(), String> {
    let global_engine: tokio::sync::MutexGuard<'_, Option<AIEngine>> = AI_ENGINE.lock().await;
    if let Some(engine) = global_engine.as_ref() {
        engine.clear_history().await;
        Ok(())
    } else {
        Err("AI engine not initialized".to_string())
    }
}

#[tauri::command]
pub async fn ai_get_history() -> Result<Vec<Message>, String> {
    let global_engine: tokio::sync::MutexGuard<'_, Option<AIEngine>> = AI_ENGINE.lock().await;
    if let Some(engine) = global_engine.as_ref() {
        Ok(engine.get_history().await)
    } else {
        Err("AI engine not initialized".to_string())
    }
}

#[tauri::command]
pub async fn ai_update_config(config: AIConfig) -> Result<(), String> {
    let global_engine: tokio::sync::MutexGuard<'_, Option<AIEngine>> = AI_ENGINE.lock().await;
    if let Some(engine) = global_engine.as_ref() {
        engine.update_config(config).await;
        Ok(())
    } else {
        Err("AI engine not initialized".to_string())
    }
}
