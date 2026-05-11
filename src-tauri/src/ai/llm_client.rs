use super::Message;
use futures_util::StreamExt;
use reqwest::Client;
use serde_json::json;

pub async fn ollama_chat_stream(
    base_url: &str,
    model: &str,
    messages: &[Message],
    temperature: f32,
    chunk_sender: tokio::sync::mpsc::UnboundedSender<String>,
) -> Result<(), String> {
    let client = Client::new();

    let formatted_messages: Vec<serde_json::Value> = messages
        .iter()
        .map(|m| json!({"role": m.role, "content": m.content}))
        .collect();

    let payload = json!({
        "model": model,
        "messages": formatted_messages,
        "temperature": temperature,
        "stream": true
    });

    let response = client
        .post(format!("{}/api/chat", base_url))
        .json(&payload)
        .send()
        .await
        .map_err(|e| format!("Ollama request failed: {}", e))?;

    if !response.status().is_success() {
        return Err(format!("Ollama error: {}", response.status()));
    }

    let mut stream = response.bytes_stream();

    while let Some(chunk_result) = stream.next().await {
        let chunk = chunk_result.map_err(|e| format!("Stream chunk error: {}", e))?;
        let text = String::from_utf8_lossy(&chunk);
        for line in text.lines() {
            if let Ok(json_val) = serde_json::from_str::<serde_json::Value>(line) {
                if let Some(content) = json_val["message"]["content"].as_str() {
                    if !content.is_empty() {
                        let _ = chunk_sender.send(content.to_string());
                    }
                }
                if json_val["done"].as_bool() == Some(true) {
                    return Ok(());
                }
            }
        }
    }

    Ok(())
}

pub async fn ollama_chat(
    base_url: &str,
    model: &str,
    messages: &[Message],
    temperature: f32,
) -> Result<String, String> {
    let client = Client::new();
    
    let formatted_messages: Vec<serde_json::Value> = messages
        .iter()
        .map(|m| json!({"role": m.role, "content": m.content}))
        .collect();

    let payload = json!({
        "model": model,
        "messages": formatted_messages,
        "temperature": temperature,
        "stream": false
    });

    let response = client
        .post(format!("{}/api/chat", base_url))
        .json(&payload)
        .send()
        .await
        .map_err(|e| format!("Ollama request failed: {}", e))?;

    if !response.status().is_success() {
        return Err(format!("Ollama error: {}", response.status()));
    }

    let json: serde_json::Value = response
        .json()
        .await
        .map_err(|e| format!("Failed to parse Ollama response: {}", e))?;

    json["message"]["content"]
        .as_str()
        .map(|s| s.to_string())
        .ok_or_else(|| "Invalid Ollama response format".to_string())
}

pub async fn openai_chat(
    api_key: &str,
    model: &str,
    messages: &[Message],
    temperature: f32,
) -> Result<String, String> {
    let client = Client::new();
    
    let formatted_messages: Vec<serde_json::Value> = messages
        .iter()
        .map(|m| json!({"role": m.role, "content": m.content}))
        .collect();

    let payload = json!({
        "model": model,
        "messages": formatted_messages,
        "temperature": temperature
    });

    let response = client
        .post("https://api.openai.com/v1/chat/completions")
        .header("Authorization", format!("Bearer {}", api_key))
        .header("Content-Type", "application/json")
        .json(&payload)
        .send()
        .await
        .map_err(|e| format!("OpenAI request failed: {}", e))?;

    if !response.status().is_success() {
        return Err(format!("OpenAI error: {}", response.status()));
    }

    let json: serde_json::Value = response
        .json()
        .await
        .map_err(|e| format!("Failed to parse OpenAI response: {}", e))?;

    json["choices"][0]["message"]["content"]
        .as_str()
        .map(|s| s.to_string())
        .ok_or_else(|| "Invalid OpenAI response format".to_string())
}

pub async fn anthropic_chat(
    api_key: &str,
    model: &str,
    messages: &[Message],
    _temperature: f32,
) -> Result<String, String> {
    let client = Client::new();
    
    let formatted_messages: Vec<serde_json::Value> = messages
        .iter()
        .map(|m| json!({"role": m.role, "content": m.content}))
        .collect();

    let payload = json!({
        "model": model,
        "messages": formatted_messages,
        "max_tokens": 1024
    });

    let response = client
        .post("https://api.anthropic.com/v1/messages")
        .header("x-api-key", api_key)
        .header("anthropic-version", "2023-06-01")
        .header("Content-Type", "application/json")
        .json(&payload)
        .send()
        .await
        .map_err(|e| format!("Anthropic request failed: {}", e))?;

    if !response.status().is_success() {
        return Err(format!("Anthropic error: {}", response.status()));
    }

    let json: serde_json::Value = response
        .json()
        .await
        .map_err(|e| format!("Failed to parse Anthropic response: {}", e))?;

    json["content"][0]["text"]
        .as_str()
        .map(|s| s.to_string())
        .ok_or_else(|| "Invalid Anthropic response format".to_string())
}

pub async fn local_chat(
    _model_path: &str,
    _messages: &[Message],
) -> Result<String, String> {
    Err("Local LLM not yet implemented".to_string())
}
