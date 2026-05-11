use serde::{Deserialize, Serialize};
use std::collections::HashMap;
use std::sync::{Arc, Mutex};
use uuid::Uuid;

pub mod workflow;
pub mod triggers;
pub mod actions;
pub mod conditions;
pub mod scheduler;
pub mod commands;

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct AutomationEngine {
    workflows: Arc<Mutex<HashMap<String, workflow::Workflow>>>,
    active_triggers: Arc<Mutex<Vec<String>>>,
}

impl AutomationEngine {
    pub fn new() -> Self {
        Self {
            workflows: Arc::new(Mutex::new(HashMap::new())),
            active_triggers: Arc::new(Mutex::new(Vec::new())),
        }
    }

    pub fn add_workflow(&self, workflow: workflow::Workflow) -> Result<String, String> {
        let id = Uuid::new_v4().to_string();
        let mut workflows = self.workflows.lock().map_err(|e| e.to_string())?;
        workflows.insert(id.clone(), workflow);
        Ok(id)
    }

    pub fn remove_workflow(&self, id: &str) -> Result<(), String> {
        let mut workflows = self.workflows.lock().map_err(|e| e.to_string())?;
        workflows.remove(id).ok_or("Workflow not found")?;
        Ok(())
    }

    pub fn get_workflow(&self, id: &str) -> Result<workflow::Workflow, String> {
        let workflows = self.workflows.lock().map_err(|e| e.to_string())?;
        workflows.get(id).cloned().ok_or("Workflow not found".to_string())
    }

    pub fn list_workflows(&self) -> Result<Vec<(String, workflow::Workflow)>, String> {
        let workflows = self.workflows.lock().map_err(|e| e.to_string())?;
        Ok(workflows.iter().map(|(k, v)| (k.clone(), v.clone())).collect())
    }

    #[allow(dead_code)] // Scaffolding — will be wired to Tauri command
    pub async fn execute_workflow(&self, id: &str) -> Result<String, String> {
        let workflow = self.get_workflow(id)?;
        workflow.execute().await
    }
}

impl Default for AutomationEngine {
    fn default() -> Self {
        Self::new()
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_engine_creation() {
        let engine = AutomationEngine::new();
        assert!(engine.list_workflows().unwrap().is_empty());
    }
}
