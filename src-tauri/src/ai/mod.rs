use serde::{Deserialize, Serialize};
use std::sync::Arc;
use tokio::sync::Mutex;

pub mod llm_client;
pub mod prompts;
pub mod context;
pub mod agents;

#[derive(Debug, Clone, Serialize, Deserialize)]
pub enum LLMProvider {
    Ollama { model: String, base_url: String },
    OpenAI { model: String, api_key: String },
    Anthropic { model: String, api_key: String },
    Local { model_path: String },
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct AIConfig {
    pub provider: LLMProvider,
    pub temperature: f32,
    pub max_tokens: usize,
    pub system_prompt: Option<String>,
}

impl Default for AIConfig {
    fn default() -> Self {
        Self {
            provider: LLMProvider::Ollama {
                model: "llama3.2:3b".to_string(),
                base_url: "http://localhost:11434".to_string(),
            },
            temperature: 0.7,
            max_tokens: 2048,
            system_prompt: None,
        }
    }
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Message {
    pub role: String,
    pub content: String,
}

#[derive(Debug, Clone)]
pub struct AIEngine {
    config: Arc<Mutex<AIConfig>>,
    conversation_history: Arc<Mutex<Vec<Message>>>,
}

impl AIEngine {
    pub fn new(config: AIConfig) -> Self {
        Self {
            config: Arc::new(Mutex::new(config)),
            conversation_history: Arc::new(Mutex::new(Vec::new())),
        }
    }

    pub async fn chat(&self, user_message: String) -> Result<String, String> {
        let config = self.config.lock().await;
        let mut history = self.conversation_history.lock().await;

        history.push(Message {
            role: "user".to_string(),
            content: user_message.clone(),
        });

        let response = match &config.provider {
            LLMProvider::Ollama { model, base_url } => {
                llm_client::ollama_chat(base_url, model, &history, config.temperature).await?
            }
            LLMProvider::OpenAI { model, api_key } => {
                llm_client::openai_chat(api_key, model, &history, config.temperature).await?
            }
            LLMProvider::Anthropic { model, api_key } => {
                llm_client::anthropic_chat(api_key, model, &history, config.temperature).await?
            }
            LLMProvider::Local { model_path } => {
                llm_client::local_chat(model_path, &history).await?
            }
        };

        history.push(Message {
            role: "assistant".to_string(),
            content: response.clone(),
        });

        Ok(response)
    }

    pub async fn clear_history(&self) {
        let mut history = self.conversation_history.lock().await;
        history.clear();
    }

    pub async fn get_history(&self) -> Vec<Message> {
        let history = self.conversation_history.lock().await;
        history.clone()
    }

    pub async fn update_config(&self, new_config: AIConfig) {
        let mut config = self.config.lock().await;
        *config = new_config;
    }
}

impl Default for AIEngine {
    fn default() -> Self {
        Self::new(AIConfig::default())
    }
}
