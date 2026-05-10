use super::{AutomationEngine, workflow::Workflow, triggers::Trigger, actions::Action, conditions::Condition, scheduler::Scheduler};
use std::sync::{Arc, Mutex};
use once_cell::sync::Lazy;

static AUTOMATION_ENGINE: Lazy<Arc<Mutex<AutomationEngine>>> = Lazy::new(|| {
    Arc::new(Mutex::new(AutomationEngine::new()))
});

static SCHEDULER: Lazy<Arc<Mutex<Scheduler>>> = Lazy::new(|| {
    Arc::new(Mutex::new(Scheduler::new()))
});

#[tauri::command]
pub async fn create_workflow(
    name: String,
    description: Option<String>,
    triggers: Vec<Trigger>,
    actions: Vec<Action>,
    conditions: Option<Vec<Condition>>,
) -> Result<String, String> {
    let mut workflow = Workflow::new(name);
    
    if let Some(desc) = description {
        workflow = workflow.with_description(desc);
    }
    
    for trigger in triggers {
        workflow = workflow.add_trigger(trigger);
    }
    
    for action in actions {
        workflow = workflow.add_action(action);
    }
    
    if let Some(conds) = conditions {
        for condition in conds {
            workflow = workflow.add_condition(condition);
        }
    }
    
    let engine = AUTOMATION_ENGINE.lock().map_err(|e| e.to_string())?;
    engine.add_workflow(workflow)
}

#[tauri::command]
pub async fn list_workflows() -> Result<Vec<(String, Workflow)>, String> {
    let engine = AUTOMATION_ENGINE.lock().map_err(|e| e.to_string())?;
    engine.list_workflows()
}

#[tauri::command]
pub async fn get_workflow(id: String) -> Result<Workflow, String> {
    let engine = AUTOMATION_ENGINE.lock().map_err(|e| e.to_string())?;
    engine.get_workflow(&id)
}

#[tauri::command]
pub async fn execute_workflow(id: String) -> Result<String, String> {
    let workflow = {
        let engine = AUTOMATION_ENGINE.lock().map_err(|e| e.to_string())?;
        engine.get_workflow(&id)?
    };
    workflow.execute().await
}

#[tauri::command]
pub async fn delete_workflow(id: String) -> Result<(), String> {
    let engine = AUTOMATION_ENGINE.lock().map_err(|e| e.to_string())?;
    engine.remove_workflow(&id)
}

#[tauri::command]
pub async fn schedule_task(
    name: String,
    cron_expression: String,
    workflow_id: String,
) -> Result<String, String> {
    let scheduler = SCHEDULER.lock().map_err(|e| e.to_string())?;
    scheduler.add_task(name, cron_expression, workflow_id)
}

#[tauri::command]
pub async fn list_scheduled_tasks() -> Result<Vec<super::scheduler::ScheduledTask>, String> {
    let scheduler = SCHEDULER.lock().map_err(|e| e.to_string())?;
    scheduler.list_tasks()
}

#[tauri::command]
pub async fn enable_scheduled_task(id: String) -> Result<(), String> {
    let scheduler = SCHEDULER.lock().map_err(|e| e.to_string())?;
    scheduler.enable_task(&id)
}

#[tauri::command]
pub async fn disable_scheduled_task(id: String) -> Result<(), String> {
    let scheduler = SCHEDULER.lock().map_err(|e| e.to_string())?;
    scheduler.disable_task(&id)
}

#[tauri::command]
pub async fn delete_scheduled_task(id: String) -> Result<(), String> {
    let scheduler = SCHEDULER.lock().map_err(|e| e.to_string())?;
    scheduler.remove_task(&id)
}
