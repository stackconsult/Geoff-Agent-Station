use serde::{Deserialize, Serialize};
use std::collections::HashMap;

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct PromptTemplate {
    pub name: String,
    pub description: String,
    pub template: String,
    pub variables: Vec<String>,
    pub category: String,
}

pub struct PromptLibrary {
    templates: HashMap<String, PromptTemplate>,
}

impl PromptLibrary {
    pub fn new() -> Self {
        let mut library = Self {
            templates: HashMap::new(),
        };
        library.load_default_templates();
        library
    }

    fn load_default_templates(&mut self) {
        self.add_template(PromptTemplate {
            name: "code_review".to_string(),
            description: "Review code for bugs and improvements".to_string(),
            template: "Review the following code and provide feedback on:\n1. Potential bugs\n2. Performance issues\n3. Best practices\n4. Security concerns\n\nCode:\n{code}".to_string(),
            variables: vec!["code".to_string()],
            category: "development".to_string(),
        });

        self.add_template(PromptTemplate {
            name: "summarize_text".to_string(),
            description: "Summarize long text into key points".to_string(),
            template: "Summarize the following text into 3-5 key points:\n\n{text}".to_string(),
            variables: vec!["text".to_string()],
            category: "productivity".to_string(),
        });

        self.add_template(PromptTemplate {
            name: "explain_code".to_string(),
            description: "Explain what code does in simple terms".to_string(),
            template: "Explain what this code does in simple terms:\n\n{code}".to_string(),
            variables: vec!["code".to_string()],
            category: "development".to_string(),
        });

        self.add_template(PromptTemplate {
            name: "generate_tests".to_string(),
            description: "Generate unit tests for code".to_string(),
            template: "Generate comprehensive unit tests for the following code:\n\n{code}\n\nUse {framework} testing framework.".to_string(),
            variables: vec!["code".to_string(), "framework".to_string()],
            category: "development".to_string(),
        });

        self.add_template(PromptTemplate {
            name: "refactor_code".to_string(),
            description: "Suggest refactoring improvements".to_string(),
            template: "Suggest refactoring improvements for this code to make it more:\n1. Readable\n2. Maintainable\n3. Performant\n\nCode:\n{code}".to_string(),
            variables: vec!["code".to_string()],
            category: "development".to_string(),
        });

        self.add_template(PromptTemplate {
            name: "write_documentation".to_string(),
            description: "Generate documentation for code".to_string(),
            template: "Write comprehensive documentation for the following code including:\n1. Purpose\n2. Parameters\n3. Return values\n4. Examples\n\nCode:\n{code}".to_string(),
            variables: vec!["code".to_string()],
            category: "development".to_string(),
        });

        self.add_template(PromptTemplate {
            name: "brainstorm_ideas".to_string(),
            description: "Generate creative ideas for a topic".to_string(),
            template: "Generate 10 creative ideas for: {topic}\n\nConsider:\n- Innovation\n- Feasibility\n- Impact".to_string(),
            variables: vec!["topic".to_string()],
            category: "creativity".to_string(),
        });

        self.add_template(PromptTemplate {
            name: "debug_error".to_string(),
            description: "Help debug an error message".to_string(),
            template: "Help me debug this error:\n\nError: {error}\n\nContext:\n{context}\n\nProvide:\n1. Likely cause\n2. Solution\n3. Prevention tips".to_string(),
            variables: vec!["error".to_string(), "context".to_string()],
            category: "development".to_string(),
        });
    }

    pub fn add_template(&mut self, template: PromptTemplate) {
        self.templates.insert(template.name.clone(), template);
    }

    pub fn get_template(&self, name: &str) -> Option<&PromptTemplate> {
        self.templates.get(name)
    }

    pub fn list_templates(&self) -> Vec<&PromptTemplate> {
        self.templates.values().collect()
    }

    pub fn list_by_category(&self, category: &str) -> Vec<&PromptTemplate> {
        self.templates
            .values()
            .filter(|t| t.category == category)
            .collect()
    }

    pub fn render_template(
        &self,
        name: &str,
        variables: &HashMap<String, String>,
    ) -> Result<String, String> {
        let template = self
            .get_template(name)
            .ok_or_else(|| format!("Template '{}' not found", name))?;

        let mut rendered = template.template.clone();
        for (key, value) in variables {
            let placeholder = format!("{{{}}}", key);
            rendered = rendered.replace(&placeholder, value);
        }

        Ok(rendered)
    }
}

impl Default for PromptLibrary {
    fn default() -> Self {
        Self::new()
    }
}
