use serde::{Deserialize, Serialize};
use std::sync::Arc;
use std::time::Instant;
use tokio::sync::mpsc::UnboundedSender;
use tokio::sync::Mutex;

pub mod llm_client;
pub mod context;
use context::ContextWindow;
#[cfg(feature = "ai-advanced")]
pub mod prompts;
#[cfg(feature = "ai-advanced")]
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
    rate_limiter: Arc<Mutex<RateLimiter>>,
    context_window: Arc<Mutex<ContextWindow>>,
}

#[derive(Debug)]
struct RateLimiter {
    tokens: usize,
    max_tokens: usize,
    refill_rate: usize,
    last_refill: Instant,
}

impl RateLimiter {
    fn new(max_tokens: usize, refill_rate: usize) -> Self {
        Self {
            tokens: max_tokens,
            max_tokens,
            refill_rate,
            last_refill: Instant::now(),
        }
    }

    fn try_acquire(&mut self) -> bool {
        self.refill();
        if self.tokens > 0 {
            self.tokens -= 1;
            true
        } else {
            false
        }
    }

    fn refill(&mut self) {
        let elapsed = self.last_refill.elapsed();
        let tokens_to_add = (elapsed.as_secs() as usize) * self.refill_rate;
        self.tokens = (self.tokens + tokens_to_add).min(self.max_tokens);
        self.last_refill = Instant::now();
    }
}

impl AIEngine {
    pub fn new(config: AIConfig) -> Self {
        Self {
            config: Arc::new(Mutex::new(config)),
            conversation_history: Arc::new(Mutex::new(Vec::new())),
            rate_limiter: Arc::new(Mutex::new(RateLimiter::new(10, 2))), // 10 tokens, refill 2/sec
            context_window: Arc::new(Mutex::new(ContextWindow::new(8192))),
        }
    }

    pub async fn chat(&self, user_message: String) -> Result<String, String> {
        // Rate limit check
        let mut limiter = self.rate_limiter.lock().await;
        if !limiter.try_acquire() {
            return Err("Rate limit exceeded. Please wait before making another request.".to_string());
        }
        drop(limiter);

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

    pub async fn chat_stream(
        &self,
        user_message: String,
        chunk_sender: UnboundedSender<String>,
    ) -> Result<(), String> {
        let mut limiter = self.rate_limiter.lock().await;
        if !limiter.try_acquire() {
            return Err("Rate limit exceeded. Please wait before making another request.".to_string());
        }
        drop(limiter);

        let config = self.config.lock().await;
        let mut history = self.conversation_history.lock().await;

        history.push(Message {
            role: "user".to_string(),
            content: user_message.clone(),
        });

        match &config.provider {
            LLMProvider::Ollama { model, base_url } => {
                llm_client::ollama_chat_stream(
                    base_url,
                    model,
                    &history,
                    config.temperature,
                    chunk_sender,
                )
                .await?;
            }
            _ => {
                return Err("Streaming only supported for Ollama provider".to_string());
            }
        }

        Ok(())
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

    pub async fn ingest_documentation(&self, docs_path: String) -> Result<usize, String> {
        let path = std::path::Path::new(&docs_path);
        let mut context = self.context_window.lock().await;
        context.ingest_documentation_directory(path)
    }

    pub async fn add_vault_context(&self, vault_path: String, note_count: usize) {
        let mut context = self.context_window.lock().await;
        context.add_vault(vault_path, note_count);
    }

    pub async fn search_docs(&self, query: String) -> Vec<String> {
        let context = self.context_window.lock().await;
        let results = context.search_documentation(&query);
        results
            .into_iter()
            .map(|source| {
                let metadata = source
                    .metadata
                    .as_ref()
                    .and_then(|m| m.get("path"))
                    .and_then(|p| p.as_str())
                    .unwrap_or("unknown");
                format!("{}: {}", metadata, source.content.lines().next().unwrap_or(""))
            })
            .collect()
    }
}

impl Default for AIEngine {
    fn default() -> Self {
        Self::new(AIConfig::default())
    }
}
