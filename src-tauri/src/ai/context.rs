use serde::{Deserialize, Serialize};
use std::fs;
use std::path::Path;

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

    pub fn add_documentation(&mut self, path: String, content: String) {
        self.sources.push(ContextSource {
            source_type: "documentation".to_string(),
            content,
            metadata: Some(serde_json::json!({"path": path})),
        });
    }

    pub fn add_vault(&mut self, vault_path: String, note_count: usize) {
        self.sources.push(ContextSource {
            source_type: "vault".to_string(),
            content: format!("Obsidian vault at {} with {} notes", vault_path, note_count),
            metadata: Some(serde_json::json!({"path": vault_path, "note_count": note_count})),
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
            context.push('\n');
        }

        context
    }

    pub fn clear(&mut self) {
        self.sources.clear();
    }

    pub fn ingest_documentation_directory(&mut self, docs_path: &Path) -> Result<usize, String> {
        let mut count = 0;

        if !docs_path.exists() {
            return Err(format!("Documentation directory does not exist: {}", docs_path.display()));
        }

        for entry in fs::read_dir(docs_path)
            .map_err(|e| format!("Failed to read docs directory: {}", e))?
        {
            let entry = entry.map_err(|e| format!("Failed to read entry: {}", e))?;
            let path = entry.path();

            if path.extension().and_then(|e| e.to_str()) == Some("md") {
                let content = fs::read_to_string(&path)
                    .map_err(|e| format!("Failed to read file {}: {}", path.display(), e))?;

                let filename = path.file_name()
                    .and_then(|n| n.to_str())
                    .unwrap_or("unknown.md")
                    .to_string();

                self.add_documentation(filename, content);
                count += 1;
            }
        }

        Ok(count)
    }

    pub fn search_documentation(&self, query: &str) -> Vec<&ContextSource> {
        let query_lower = query.to_lowercase();
        self.sources
            .iter()
            .filter(|source| {
                source.source_type == "documentation"
                    && (source.content.to_lowercase().contains(&query_lower)
                        || source
                            .metadata
                            .as_ref()
                            .and_then(|m| m.get("path"))
                            .and_then(|p| p.as_str())
                            .map(|p| p.to_lowercase().contains(&query_lower))
                            .unwrap_or(false))
            })
            .collect()
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use std::fs;

    #[test]
    fn test_ingest_documentation_directory_latency_baseline() {
        let temp_dir = std::env::temp_dir().join("test_perf_docs");
        fs::create_dir_all(&temp_dir).unwrap();

        for i in 0..30 {
            let content = format!("# Document {}\n\nLorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.", i);
            fs::write(temp_dir.join(format!("doc{}.md", i)), content).unwrap();
        }

        let start = std::time::Instant::now();
        let mut window = ContextWindow::new(8192);
        let result = window.ingest_documentation_directory(&temp_dir);
        let duration = start.elapsed();

        assert!(result.is_ok());
        assert_eq!(result.unwrap(), 30);
        eprintln!("M1 Baseline: Documentation ingestion latency for 30 files: {:?}", duration);

        fs::remove_dir_all(temp_dir).unwrap();
    }

    #[test]
    fn test_build_context_latency_baseline() {
        let mut window = ContextWindow::new(8192);
        for i in 0..30 {
            let content = format!("# Document {}\n\nLorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.", i);
            window.add_documentation(format!("doc{}.md", i), content);
        }

        let start = std::time::Instant::now();
        let _context = window.build_context();
        let duration = start.elapsed();

        eprintln!("M2 Baseline: Context building latency for 30 sources: {:?}", duration);
    }

    #[test]
    fn test_search_docs_latency_baseline() {
        let mut window = ContextWindow::new(8192);
        for i in 0..30 {
            let content = format!("# Document {}\n\nLorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.", i);
            window.add_documentation(format!("doc{}.md", i), content);
        }

        let start = std::time::Instant::now();
        let _results = window.search_documentation("lorem");
        let duration = start.elapsed();

        eprintln!("M3 Baseline: search_docs latency for 30 sources: {:?}", duration);
    }
}
