use crate::ai::{AIEngine, AIConfig, Message};
use once_cell::sync::Lazy;
use std::sync::Arc;
use tauri::{AppHandle, Emitter};
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
pub async fn ai_chat_stream(message: String, app: AppHandle) -> Result<(), String> {
    let engine = {
        let guard = AI_ENGINE.lock().await;
        guard.as_ref().map(|e| e.clone()).ok_or_else(|| {
            "AI engine not initialized. Call ai_initialize first.".to_string()
        })?
    };

    let (tx, mut rx) = tokio::sync::mpsc::unbounded_channel::<String>();

    let app_err = app.clone();
    let msg = message.clone();
    tokio::spawn(async move {
        if let Err(e) = engine.chat_stream(msg, tx).await {
            let _ = app_err.emit("ai-stream-error", e);
        }
    });

    tokio::spawn(async move {
        while let Some(chunk) = rx.recv().await {
            let _ = app.emit("ai-stream-chunk", chunk);
        }
        let _ = app.emit("ai-stream-done", ());
    });

    Ok(())
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
