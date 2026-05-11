use serde::{Deserialize, Serialize};

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ContextSource {
    pub source_type: String,
    pub content: String,
    pub metadata: Option<serde_json::Value>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ContextWindow {
    pub sources: Vec<ContextSource>,
    pub max_tokens: usize,
}

impl ContextWindow {
    pub fn new(max_tokens: usize) -> Self {
        Self {
            sources: Vec::new(),
            max_tokens,
        }
    }

    pub fn add_clipboard(&mut self, content: String) {
        self.sources.push(ContextSource {
            source_type: "clipboard".to_string(),
            content,
            metadata: None,
        });
    }

    pub fn add_file(&mut self, path: String, content: String) {
        self.sources.push(ContextSource {
            source_type: "file".to_string(),
            content,
            metadata: Some(serde_json::json!({"path": path})),
        });
    }

    pub fn add_window(&mut self, title: String, content: String) {
        self.sources.push(ContextSource {
            source_type: "window".to_string(),
            content,
            metadata: Some(serde_json::json!({"title": title})),
        });
    }

    pub fn add_selection(&mut self, content: String) {
        self.sources.push(ContextSource {
            source_type: "selection".to_string(),
            content,
            metadata: None,
        });
    }

    pub fn build_context(&self) -> String {
        let mut context = String::new();
        
        for source in &self.sources {
            context.push_str(&format!("\n--- {} ---\n", source.source_type.to_uppercase()));
            if let Some(metadata) = &source.metadata {
                context.push_str(&format!("Metadata: {}\n", metadata));
            }
            context.push_str(&source.content);
            context.push_str("\n");
        }

        context
    }

    pub fn clear(&mut self) {
        self.sources.clear();
    }
}
