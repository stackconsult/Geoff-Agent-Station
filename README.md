# Geoff-Agent-Station
Personal Automation Workstation

A comprehensive desktop automation platform built with Tauri, React, and Rust. Automate your workflows, boost productivity, and integrate AI-powered tools into your daily work.

## Features

### Core Automation Engine
- **Workflow Builder** - Create custom automation workflows with triggers, actions, and conditions
- **Task Scheduler** - Cron-based scheduling for recurring tasks
- **File Automation** - Watch files, auto-organize, and transform
- **System Monitoring** - Track resources, processes, and system events

### Productivity Tools (Planned)
- **Time Tracking** - Automatic time tracking by app and project
- **Focus Mode** - Block distractions when you need to concentrate
- **Pomodoro Timer** - Built-in productivity timer
- **Clipboard Manager** - Unlimited clipboard history with semantic search

### AI Integration (Ready)
- **Local LLM Support** - Ollama, LM Studio, llama.cpp
- **Cloud LLM Fallback** - OpenAI, Anthropic, Google
- **AI Agents** - Code assistant, writing assistant, data analyzer
- **Prompt Templates** - Reusable AI prompt library

### System Integration (Planned)
- **Browser Automation** - Playwright/Puppeteer integration
- **Email Automation** - IMAP/SMTP automation
- **Calendar Sync** - Google Calendar, Outlook
- **Window Management** - Auto-positioning and workspace management

## Documentation

- **[Quick Start Guide](QUICK_START.md)** - Get up and running in minutes
- **[Architecture](AUTOMATION_ARCHITECTURE.md)** - System design and architecture
- **[Tools Installation](TOOLS_INSTALLATION_GUIDE.md)** - Install required tools
- **[Implementation Summary](IMPLEMENTATION_SUMMARY.md)** - What's built and what's next

## Installation

### Prerequisites
- Rust 1.70+
- Node.js 18+
- pnpm
- Git

### Quick Install

```powershell
# Install core tools
winget install Rustlang.Rustup
winget install OpenJS.NodeJS.LTS
npm install -g pnpm

# Clone and setup
cd "C:\Users\Geoff Parsons\Desktop\tolaria-automation"
pnpm install
cd src-tauri
cargo build
```

### Optional: AI Tools

```powershell
# Install Ollama for local LLM
winget install Ollama.Ollama
ollama pull llama3.2:3b
ollama pull codellama:7b
```

## Usage

### Development Mode

```powershell
pnpm tauri dev
```

### Production Build

```powershell
pnpm tauri build
```

### Example Workflow

```typescript
import { invoke } from '@tauri-apps/api/tauri';

// Create an automation workflow
const workflowId = await invoke('create_workflow', {
  name: "Auto-Organize Downloads",
  description: "Automatically organize downloaded images",
  triggers: [{
    type: "FileChange",
    path: "C:\\Users\\YourName\\Downloads",
    event_type: "Created"
  }],
  actions: [{
    type: "MoveFile",
    source: "{{trigger.file}}",
    destination: "C:\\Pictures\\Auto-Sorted\\{{date}}\\"
  }]
});

// Execute the workflow
await invoke('execute_workflow', { id: workflowId });
```

## Architecture

### Backend (Rust)

```rust
src-tauri/src/
├── automation/          # Core automation engine
│   ├── mod.rs          # Engine orchestrator
│   ├── workflow.rs     # Workflow management
│   ├── triggers.rs     # Event triggers
│   ├── actions.rs      # Automation actions
│   ├── conditions.rs   # Conditional logic
│   ├── scheduler.rs    # Task scheduling
│   └── commands.rs     # Tauri commands
├── vault/              # Vault management
├── git/                # Git automation
├── mcp/                # MCP integration
└── commands/           # Additional commands
```

### Frontend (React + TypeScript)

```typescript
src/
├── components/         # React components
├── hooks/             # Custom React hooks
└── types/             # TypeScript types
```

## Example Workflows

### 1. Daily Backup

```json
{
  "name": "Daily Backup",
  "triggers": [{ "type": "TimeSchedule", "cron": "0 2 * * *" }],
  "actions": [{
    "type": "RunCommand",
    "command": "robocopy",
    "args": ["C:\\Work", "D:\\Backups\\Work", "/MIR"]
  }]
}
```

### 2. Focus Mode

```json
{
  "name": "Focus Mode",
  "triggers": [{ "type": "WindowFocus", "app_name": "Code.exe" }],
  "actions": [{
    "type": "SendNotification",
    "title": "Focus Mode Activated",
    "message": "Distractions blocked!"
  }]
}
```

### 3. AI Code Review

```json
{
  "name": "AI Code Review",
  "triggers": [{ "type": "FileChange", "path": ".git", "event_type": "Modified" }],
  "actions": [{
    "type": "AIPrompt",
    "prompt": "Review this code: {{git.diff}}",
    "model": "codellama:7b"
  }]
}
```

## Development

### Run Tests

```powershell
cd src-tauri
cargo test
```

### Add New Trigger Type

```rust
// src-tauri/src/automation/triggers.rs
#[derive(Debug, Clone, Serialize, Deserialize)]
pub enum Trigger {
    // ... existing triggers
    CustomTrigger {
        param: String,
    },
}
```

### Add New Action Type

```rust
// src-tauri/src/automation/actions.rs
#[derive(Debug, Clone, Serialize, Deserialize)]
pub enum Action {
    // ... existing actions
    CustomAction {
        param: String,
    },
}
```

## Status

### Completed
- Core automation engine
- Workflow system (create, execute, manage)
- Trigger system (file, time, window, clipboard, hotkey, system)
- Action system (command, notification, file ops, HTTP, AI, clipboard)
- Condition system (file, time, process, network, battery, env)
- Task scheduler (cron-based)
- Tauri integration
- Comprehensive documentation

### In Progress
- Frontend UI components
- React hooks for automation API

### Planned
- File watcher implementation
- Clipboard manager with history
- Window automation
- Global hotkey system
- AI integration (Ollama, LM Studio)
- Time tracking
- Focus mode
- Pomodoro timer
- Browser automation
- Email automation
- Calendar sync

## Contributing

This is a personal automation system, but feel free to fork and customize for your needs!

## License

The Unlicense

## Acknowledgments

Built with:
- [Tauri](https://tauri.app/) - Desktop framework
- [React](https://react.dev/) - UI framework
- [Rust](https://www.rust-lang.org/) - Systems programming language
- [TypeScript](https://www.typescriptlang.org/) - Type-safe JavaScript

## Support

See documentation files for detailed guides and troubleshooting:
- `QUICK_START.md` - Getting started
- `AUTOMATION_ARCHITECTURE.md` - System architecture
- `TOOLS_INSTALLATION_GUIDE.md` - Tool installation
- `IMPLEMENTATION_SUMMARY.md` - Implementation details

---

**Start automating your workflow today!**
