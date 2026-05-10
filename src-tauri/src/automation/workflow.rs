use serde::{Deserialize, Serialize};
use super::{triggers::Trigger, actions::Action, conditions::Condition};

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Workflow {
    pub name: String,
    pub description: Option<String>,
    pub triggers: Vec<Trigger>,
    pub actions: Vec<Action>,
    pub conditions: Option<Vec<Condition>>,
    pub enabled: bool,
}

impl Workflow {
    pub fn new(name: String) -> Self {
        Self {
            name,
            description: None,
            triggers: Vec::new(),
            actions: Vec::new(),
            conditions: None,
            enabled: true,
        }
    }

    pub fn with_description(mut self, description: String) -> Self {
        self.description = Some(description);
        self
    }

    pub fn add_trigger(mut self, trigger: Trigger) -> Self {
        self.triggers.push(trigger);
        self
    }

    pub fn add_action(mut self, action: Action) -> Self {
        self.actions.push(action);
        self
    }

    pub fn add_condition(mut self, condition: Condition) -> Self {
        if let Some(ref mut conditions) = self.conditions {
            conditions.push(condition);
        } else {
            self.conditions = Some(vec![condition]);
        }
        self
    }

    pub async fn execute(&self) -> Result<String, String> {
        if !self.enabled {
            return Err("Workflow is disabled".to_string());
        }

        // Check conditions
        if let Some(conditions) = &self.conditions {
            for condition in conditions {
                if !condition.evaluate()? {
                    return Err("Condition not met".to_string());
                }
            }
        }

        // Execute actions
        let mut results = Vec::new();
        for action in &self.actions {
            let result = action.execute().await?;
            results.push(result);
        }

        Ok(format!("Executed {} actions successfully", results.len()))
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_workflow_builder() {
        let workflow = Workflow::new("Test Workflow".to_string())
            .with_description("A test workflow".to_string());
        
        assert_eq!(workflow.name, "Test Workflow");
        assert_eq!(workflow.description, Some("A test workflow".to_string()));
        assert!(workflow.enabled);
    }
}
