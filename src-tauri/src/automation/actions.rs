use serde::{Deserialize, Serialize};
use std::path::PathBuf;
use std::process::Command;

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(tag = "type")]
pub enum Action {
    RunCommand {
        command: String,
        args: Vec<String>,
        working_dir: Option<PathBuf>,
    },
    SendNotification {
        title: String,
        message: String,
        urgency: NotificationUrgency,
    },
    CopyFile {
        source: PathBuf,
        destination: PathBuf,
    },
    MoveFile {
        source: PathBuf,
        destination: PathBuf,
    },
    DeleteFile {
        path: PathBuf,
    },
    WriteFile {
        path: PathBuf,
        content: String,
    },
    HttpRequest {
        url: String,
        method: HttpMethod,
        headers: Option<Vec<(String, String)>>,
        body: Option<String>,
    },
    AIPrompt {
        prompt: String,
        model: Option<String>,
        context: Option<String>,
    },
    SetClipboard {
        content: String,
    },
    OpenUrl {
        url: String,
    },
    Sleep {
        duration_ms: u64,
    },
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub enum NotificationUrgency {
    Low,
    Normal,
    Critical,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub enum HttpMethod {
    GET,
    POST,
    PUT,
    DELETE,
    PATCH,
}

impl Action {
    pub async fn execute(&self) -> Result<String, String> {
        match self {
            Action::RunCommand { command, args, working_dir } => {
                let mut cmd = Command::new(command);
                cmd.args(args);
                if let Some(dir) = working_dir {
                    cmd.current_dir(dir);
                }
                
                let output = cmd.output()
                    .map_err(|e| format!("Failed to execute command: {}", e))?;
                
                if output.status.success() {
                    Ok(String::from_utf8_lossy(&output.stdout).to_string())
                } else {
                    Err(String::from_utf8_lossy(&output.stderr).to_string())
                }
            },
            
            Action::SendNotification { title, message, .. } => {
                // Placeholder for notification implementation
                Ok(format!("Notification sent: {} - {}", title, message))
            },
            
            Action::CopyFile { source, destination } => {
                std::fs::copy(source, destination)
                    .map_err(|e| format!("Failed to copy file: {}", e))?;
                Ok("File copied successfully".to_string())
            },
            
            Action::MoveFile { source, destination } => {
                std::fs::rename(source, destination)
                    .map_err(|e| format!("Failed to move file: {}", e))?;
                Ok("File moved successfully".to_string())
            },
            
            Action::DeleteFile { path } => {
                std::fs::remove_file(path)
                    .map_err(|e| format!("Failed to delete file: {}", e))?;
                Ok("File deleted successfully".to_string())
            },
            
            Action::WriteFile { path, content } => {
                std::fs::write(path, content)
                    .map_err(|e| format!("Failed to write file: {}", e))?;
                Ok("File written successfully".to_string())
            },
            
            Action::HttpRequest { url, method, headers: _headers, body: _body } => {
                // Placeholder for HTTP request implementation
                Ok(format!("HTTP {:?} request to {}", method, url))
            },
            
            Action::AIPrompt { prompt, model, .. } => {
                // Placeholder for AI prompt implementation
                Ok(format!("AI prompt executed: {} (model: {:?})", prompt, model))
            },
            
            Action::SetClipboard { content } => {
                // Placeholder for clipboard implementation
                Ok(format!("Clipboard set to: {}", content))
            },
            
            Action::OpenUrl { url } => {
                opener::open(url)
                    .map_err(|e| format!("Failed to open URL: {}", e))?;
                Ok(format!("Opened URL: {}", url))
            },
            
            Action::Sleep { duration_ms } => {
                std::thread::sleep(std::time::Duration::from_millis(*duration_ms));
                Ok(format!("Slept for {}ms", duration_ms))
            },
        }
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[tokio::test]
    async fn test_sleep_action() {
        let action = Action::Sleep { duration_ms: 100 };
        let result = action.execute().await;
        assert!(result.is_ok());
    }
}
