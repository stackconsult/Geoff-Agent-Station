use serde::{Deserialize, Serialize};
use std::collections::HashMap;
use std::sync::{Arc, Mutex};
use uuid::Uuid;

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ScheduledTask {
    pub id: String,
    pub name: String,
    pub cron_expression: String,
    pub workflow_id: String,
    pub enabled: bool,
    pub last_run: Option<chrono::DateTime<chrono::Utc>>,
    pub next_run: Option<chrono::DateTime<chrono::Utc>>,
}

pub struct Scheduler {
    tasks: Arc<Mutex<HashMap<String, ScheduledTask>>>,
}

impl Scheduler {
    pub fn new() -> Self {
        Self {
            tasks: Arc::new(Mutex::new(HashMap::new())),
        }
    }

    pub fn add_task(&self, name: String, cron_expression: String, workflow_id: String) -> Result<String, String> {
        let id = Uuid::new_v4().to_string();
        let task = ScheduledTask {
            id: id.clone(),
            name,
            cron_expression,
            workflow_id,
            enabled: true,
            last_run: None,
            next_run: None,
        };

        let mut tasks = self.tasks.lock().map_err(|e| e.to_string())?;
        tasks.insert(id.clone(), task);
        Ok(id)
    }

    pub fn remove_task(&self, id: &str) -> Result<(), String> {
        let mut tasks = self.tasks.lock().map_err(|e| e.to_string())?;
        tasks.remove(id).ok_or("Task not found")?;
        Ok(())
    }

    pub fn enable_task(&self, id: &str) -> Result<(), String> {
        let mut tasks = self.tasks.lock().map_err(|e| e.to_string())?;
        if let Some(task) = tasks.get_mut(id) {
            task.enabled = true;
            Ok(())
        } else {
            Err("Task not found".to_string())
        }
    }

    pub fn disable_task(&self, id: &str) -> Result<(), String> {
        let mut tasks = self.tasks.lock().map_err(|e| e.to_string())?;
        if let Some(task) = tasks.get_mut(id) {
            task.enabled = false;
            Ok(())
        } else {
            Err("Task not found".to_string())
        }
    }

    pub fn list_tasks(&self) -> Result<Vec<ScheduledTask>, String> {
        let tasks = self.tasks.lock().map_err(|e| e.to_string())?;
        Ok(tasks.values().cloned().collect())
    }

    pub fn get_task(&self, id: &str) -> Result<ScheduledTask, String> {
        let tasks = self.tasks.lock().map_err(|e| e.to_string())?;
        tasks.get(id).cloned().ok_or("Task not found".to_string())
    }
}

impl Default for Scheduler {
    fn default() -> Self {
        Self::new()
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_scheduler_creation() {
        let scheduler = Scheduler::new();
        assert!(scheduler.list_tasks().unwrap().is_empty());
    }

    #[test]
    fn test_add_task() {
        let scheduler = Scheduler::new();
        let id = scheduler.add_task(
            "Test Task".to_string(),
            "0 0 * * *".to_string(),
            "workflow-123".to_string()
        ).unwrap();
        
        let task = scheduler.get_task(&id).unwrap();
        assert_eq!(task.name, "Test Task");
        assert_eq!(task.cron_expression, "0 0 * * *");
        assert!(task.enabled);
    }
}
