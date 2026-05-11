use super::{AIEngine, AIConfig};
use serde::{Deserialize, Serialize};

#[derive(Debug, Clone, Serialize, Deserialize)]
pub enum AgentType {
    CodeAssistant,
    WritingAssistant,
    DataAnalyzer,
    TaskPlanner,
    Debugger,
    Researcher,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Agent {
    pub agent_type: AgentType,
    pub name: String,
    pub system_prompt: String,
    pub config: AIConfig,
}

impl Agent {
    pub fn new(agent_type: AgentType, config: AIConfig) -> Self {
        let (name, system_prompt) = match agent_type {
            AgentType::CodeAssistant => (
                "Code Assistant".to_string(),
                "You are an expert programming assistant. Help users write, review, and debug code. Provide clear explanations and best practices.".to_string(),
            ),
            AgentType::WritingAssistant => (
                "Writing Assistant".to_string(),
                "You are a professional writing assistant. Help users write clear, concise, and engaging content. Provide grammar corrections and style suggestions.".to_string(),
            ),
            AgentType::DataAnalyzer => (
                "Data Analyzer".to_string(),
                "You are a data analysis expert. Help users understand data, create visualizations, and derive insights. Explain statistical concepts clearly.".to_string(),
            ),
            AgentType::TaskPlanner => (
                "Task Planner".to_string(),
                "You are a productivity expert. Help users break down complex tasks, create action plans, and optimize workflows.".to_string(),
            ),
            AgentType::Debugger => (
                "Debugger".to_string(),
                "You are a debugging specialist. Help users identify and fix bugs, understand error messages, and prevent future issues.".to_string(),
            ),
            AgentType::Researcher => (
                "Researcher".to_string(),
                "You are a research assistant. Help users find information, summarize findings, and synthesize knowledge from multiple sources.".to_string(),
            ),
        };

        let mut agent_config = config;
        agent_config.system_prompt = Some(system_prompt.clone());

        Self {
            agent_type,
            name,
            system_prompt,
            config: agent_config,
        }
    }

    pub async fn chat(&self, message: String) -> Result<String, String> {
        let engine = AIEngine::new(self.config.clone());
        engine.chat(message).await
    }

    pub fn get_capabilities(&self) -> Vec<String> {
        match self.agent_type {
            AgentType::CodeAssistant => vec![
                "Code review".to_string(),
                "Bug detection".to_string(),
                "Refactoring suggestions".to_string(),
                "Documentation generation".to_string(),
                "Test generation".to_string(),
            ],
            AgentType::WritingAssistant => vec![
                "Grammar correction".to_string(),
                "Style improvement".to_string(),
                "Content summarization".to_string(),
                "Tone adjustment".to_string(),
                "Proofreading".to_string(),
            ],
            AgentType::DataAnalyzer => vec![
                "Data interpretation".to_string(),
                "Statistical analysis".to_string(),
                "Trend identification".to_string(),
                "Visualization suggestions".to_string(),
                "Insight generation".to_string(),
            ],
            AgentType::TaskPlanner => vec![
                "Task breakdown".to_string(),
                "Priority setting".to_string(),
                "Timeline creation".to_string(),
                "Resource allocation".to_string(),
                "Workflow optimization".to_string(),
            ],
            AgentType::Debugger => vec![
                "Error analysis".to_string(),
                "Root cause identification".to_string(),
                "Fix suggestions".to_string(),
                "Prevention strategies".to_string(),
                "Performance optimization".to_string(),
            ],
            AgentType::Researcher => vec![
                "Information gathering".to_string(),
                "Source summarization".to_string(),
                "Fact checking".to_string(),
                "Knowledge synthesis".to_string(),
                "Citation generation".to_string(),
            ],
        }
    }
}
