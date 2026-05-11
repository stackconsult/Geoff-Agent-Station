use super::Message;
use reqwest::Client;
use serde_json::json;

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
