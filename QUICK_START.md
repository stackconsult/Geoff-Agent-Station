# Tolaria Desktop Automation - Quick Start Guide

## 🚀 Installation Options

### Option 1: Minimal (Core Tools Only - 5 minutes)
```powershell
powershell -ExecutionPolicy Bypass -File install-tools.ps1 -Minimal
```

### Option 2: Full (Everything - 15-20 minutes)
```powershell
powershell -ExecutionPolicy Bypass -File install-tools.ps1 -Full
```

### Option 3: AI Only (Just AI tools)
```powershell
powershell -ExecutionPolicy Bypass -File install-tools.ps1 -AIOnly
```

### Option 4: Dev Only (Development tools)
```powershell
powershell -ExecutionPolicy Bypass -File install-tools.ps1 -DevOnly
```

## ✅ Verify Installation

```powershell
powershell -ExecutionPolicy Bypass -File verify-tools.ps1
```

## 🏃 Quick Start

## What You've Built

A comprehensive desktop work automation system with:

✅ **Workflow Engine** - Create custom automation workflows with triggers, actions, and conditions  
✅ **Task Scheduler** - Cron-based scheduling for automated tasks  
✅ **AI Integration Ready** - Prepared for local LLM integration (Ollama, LM Studio)  
✅ **System Monitoring** - Track resources, processes, and system events  
✅ **File Automation** - Watch files, auto-organize, and transform  
✅ **Clipboard Manager** - Unlimited history with semantic search  
✅ **Window Automation** - Auto-positioning and workspace management  
✅ **Productivity Tools** - Time tracking, focus mode, pomodoro timer  

## Installation Steps

### 1. Install Core Tools

```powershell
# Install Rust
winget install Rustlang.Rustup

# Install Node.js & pnpm
winget install OpenJS.NodeJS.LTS
npm install -g pnpm

# Install Git
winget install Git.Git
```

### 2. Install Project Dependencies

```powershell
cd "C:\Users\Geoff Parsons\Desktop\tolaria-automation"

# Install frontend dependencies
pnpm install

# Build Rust backend
cd src-tauri
cargo build
cd ..
```

### 3. Optional: Install AI Tools

```powershell
# Install Ollama for local LLM
winget install Ollama.Ollama

# Pull recommended models
ollama pull llama3.2:3b      # Fast, lightweight
ollama pull codellama:7b     # Code-focused
ollama pull mistral:7b       # General purpose
```

## Running the Application

### Development Mode

```powershell
cd "C:\Users\Geoff Parsons\Desktop\tolaria-automation"
pnpm tauri dev
```

### Production Build

```powershell
pnpm tauri build
```

The installer will be created in `src-tauri/target/release/bundle/`

## Example Workflows

### 1. Auto-Organize Downloads

**Trigger:** File created in Downloads folder  
**Condition:** File is an image (jpg, png, gif)  
**Action:** Move to Pictures/Auto-Sorted/YYYY-MM-DD/

```json
{
  "name": "Auto-Organize Images",
  "triggers": [{
    "type": "FileChange",
    "path": "C:\\Users\\YourName\\Downloads",
    "event_type": "Created"
  }],
  "conditions": [{
    "type": "FileSize",
    "path": "{{trigger.file}}",
    "operator": "GreaterThan",
    "size_bytes": 1024
  }],
  "actions": [{
    "type": "MoveFile",
    "source": "{{trigger.file}}",
    "destination": "C:\\Users\\YourName\\Pictures\\Auto-Sorted\\{{date}}\\"
  }]
}
```

### 2. Daily Backup Automation

**Trigger:** Every day at 2 AM  
**Action:** Backup important folders to external drive

```json
{
  "name": "Daily Backup",
  "triggers": [{
    "type": "TimeSchedule",
    "cron": "0 2 * * *"
  }],
  "actions": [
    {
      "type": "RunCommand",
      "command": "robocopy",
      "args": ["C:\\Work", "D:\\Backups\\Work", "/MIR", "/R:3", "/W:10"]
    },
    {
      "type": "SendNotification",
      "title": "Backup Complete",
      "message": "Daily backup finished successfully",
      "urgency": "Normal"
    }
  ]
}
```

### 3. Focus Mode Activator

**Trigger:** Specific app gains focus (e.g., VS Code)  
**Action:** Block distracting websites, mute notifications

```json
{
  "name": "Focus Mode",
  "triggers": [{
    "type": "WindowFocus",
    "app_name": "Code.exe"
  }],
  "conditions": [{
    "type": "TimeRange",
    "start_hour": 9,
    "end_hour": 17
  }],
  "actions": [
    {
      "type": "RunCommand",
      "command": "powershell",
      "args": ["-Command", "Add-Content -Path C:\\Windows\\System32\\drivers\\etc\\hosts -Value '127.0.0.1 facebook.com'"]
    },
    {
      "type": "SendNotification",
      "title": "Focus Mode Activated",
      "message": "Distractions blocked. Time to code!",
      "urgency": "Low"
    }
  ]
}
```

### 4. AI Code Review on Git Commit

**Trigger:** Git commit in watched repository  
**Action:** Run AI code review, post results

```json
{
  "name": "AI Code Review",
  "triggers": [{
    "type": "FileChange",
    "path": "C:\\Projects\\MyApp\\.git",
    "event_type": "Modified"
  }],
  "actions": [
    {
      "type": "AIPrompt",
      "prompt": "Review the following git diff for bugs, security issues, and best practices: {{git.diff}}",
      "model": "codellama:7b"
    },
    {
      "type": "WriteFile",
      "path": "C:\\Projects\\MyApp\\code-review.md",
      "content": "{{ai.response}}"
    }
  ]
}
```

### 5. Clipboard History Search

**Trigger:** Hotkey (Ctrl+Shift+V)  
**Action:** Show clipboard history with semantic search

```json
{
  "name": "Clipboard Search",
  "triggers": [{
    "type": "Hotkey",
    "key_combination": "Ctrl+Shift+V"
  }],
  "actions": [{
    "type": "RunCommand",
    "command": "tolaria-clipboard-search.exe",
    "args": []
  }]
}
```

## Using the API

### Create a Workflow (TypeScript/JavaScript)

```typescript
import { invoke } from '@tauri-apps/api/tauri';

const workflow = {
  name: "My Automation",
  description: "Automates my daily tasks",
  triggers: [{
    type: "TimeSchedule",
    cron: "0 9 * * 1-5" // Every weekday at 9 AM
  }],
  actions: [{
    type: "SendNotification",
    title: "Good Morning!",
    message: "Time to start your day",
    urgency: "Normal"
  }],
  conditions: null
};

const workflowId = await invoke('create_workflow', {
  name: workflow.name,
  description: workflow.description,
  triggers: workflow.triggers,
  actions: workflow.actions,
  conditions: workflow.conditions
});

console.log('Workflow created:', workflowId);
```

### List All Workflows

```typescript
const workflows = await invoke('list_workflows');
console.log('All workflows:', workflows);
```

### Execute a Workflow

```typescript
const result = await invoke('execute_workflow', {
  id: 'workflow-id-here'
});
console.log('Execution result:', result);
```

### Schedule a Task

```typescript
const taskId = await invoke('schedule_task', {
  name: "Daily Report",
  cronExpression: "0 17 * * 1-5", // 5 PM weekdays
  workflowId: 'workflow-id-here'
});
```

## Next Steps

1. **Explore the Architecture** - Read `AUTOMATION_ARCHITECTURE.md` for system design
2. **Install Tools** - Follow `TOOLS_INSTALLATION_GUIDE.md` for optional integrations
3. **Build Custom Workflows** - Use the workflow builder UI (coming soon)
4. **Integrate AI** - Connect Ollama or other LLM providers
5. **Add Productivity Tools** - Enable time tracking, focus mode, pomodoro
6. **Customize** - Extend with your own triggers, actions, and conditions

## Troubleshooting

### Build Errors

```powershell
# Clear Rust cache
cd src-tauri
cargo clean
cargo build

# Clear Node modules
cd ..
rm -rf node_modules
pnpm install
```

### Runtime Errors

Check the logs:
- **Frontend:** Browser DevTools Console
- **Backend:** Terminal running `pnpm tauri dev`

### Permission Issues

Run PowerShell as Administrator for system-level automations.

## Resources

- **Architecture:** `AUTOMATION_ARCHITECTURE.md`
- **Tools:** `TOOLS_INSTALLATION_GUIDE.md`
- **Roadmap:** `OPTIMIZED_ROADMAP.md`
- **Build Plan:** `BUILD_PLAN.md`

## Support

For issues or questions:
1. Check the documentation files
2. Review example workflows
3. Inspect the Rust source code in `src-tauri/src/automation/`
4. Review the TypeScript hooks in `src/hooks/`

---

**You now have a powerful desktop automation system!** Start with simple workflows and gradually build more complex automations as you learn the system.
