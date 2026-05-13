use crate::ai::{AIEngine, AIConfig, Message};
use once_cell::sync::Lazy;
use std::sync::Arc;
use tauri::{AppHandle, Emitter};
use tokio::sync::Mutex;
use chrono::Utc;

static AI_ENGINE: Lazy<Arc<Mutex<Option<AIEngine>>>> = Lazy::new(|| Arc::new(Mutex::new(None)));

#[tauri::command]
pub async fn ai_setup_obsidian_vault(vault_path: String, note_count: usize) -> Result<(), String> {
    let guard = AI_ENGINE.lock().await;
    if let Some(engine) = guard.as_ref() {
        engine.add_vault_context(vault_path, note_count).await;
        Ok(())
    } else {
        Err("AI engine not initialized. Call ai_initialize first.".to_string())
    }
}

#[tauri::command]
pub async fn ai_ingest_documentation(docs_path: String) -> Result<usize, String> {
    let guard = AI_ENGINE.lock().await;
    if let Some(engine) = guard.as_ref() {
        engine.ingest_documentation(docs_path).await
    } else {
        Err("AI engine not initialized. Call ai_initialize first.".to_string())
    }
}

#[tauri::command]
pub async fn ai_search_docs(query: String) -> Result<Vec<String>, String> {
    let guard = AI_ENGINE.lock().await;
    if let Some(engine) = guard.as_ref() {
        Ok(engine.search_docs(query).await)
    } else {
        Err("AI engine not initialized. Call ai_initialize first.".to_string())
    }
}

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

#[derive(serde::Serialize)]
pub struct AIModelInfo {
    pub id: String,
    pub name: String,
    pub provider: String,
    pub capabilities: Vec<String>,
    pub context_window: usize,
}

#[tauri::command]
pub async fn ai_list_models() -> Result<Vec<AIModelInfo>, String> {
    Ok(vec![
        AIModelInfo { id: "ollama-llama3".to_string(), name: "Llama 3".to_string(), provider: "Ollama".to_string(), capabilities: vec!["chat".to_string()], context_window: 8192 },
        AIModelInfo { id: "ollama-mistral".to_string(), name: "Mistral".to_string(), provider: "Ollama".to_string(), capabilities: vec!["chat".to_string()], context_window: 32768 },
    ])
}

#[tauri::command]
pub async fn ai_switch_model(model_id: String) -> Result<(), String> {
    let global_engine: tokio::sync::MutexGuard<'_, Option<AIEngine>> = AI_ENGINE.lock().await;
    if let Some(engine) = global_engine.as_ref() {
        engine.switch_model(model_id).await
    } else {
        Err("AI engine not initialized. Call ai_initialize first.".to_string())
    }
}

#[tauri::command]
pub async fn ai_vector_add_document(doc_path: String) -> Result<String, String> {
    let doc_id = format!("doc-{}", chrono::Utc::now().timestamp());
    println!("Adding document: {} -> {}", doc_path, doc_id);
    Ok(doc_id)
}

#[tauri::command]
pub async fn ai_vector_search(query: String) -> Result<Vec<String>, String> {
    println!("Searching for: {}", query);
    Ok(vec!["result1".to_string(), "result2".to_string()])
}

#[tauri::command]
pub async fn ai_vector_delete(doc_id: String) -> Result<(), String> {
    println!("Deleting document: {}", doc_id);
    Ok(())
}
