# Ultimate Desktop Work Automation System

A comprehensive desktop automation platform combining workflow automation, AI integration, clipboard management, productivity tools, and system monitoring.

## 🚀 Quick Start

### 1. Install Tools (Automated)

Run the automated installer to set up all required tools:

```powershell
# Full installation (recommended)
powershell -ExecutionPolicy Bypass -File install-automation-tools.ps1 -Full

# Minimal installation (core tools only)
powershell -ExecutionPolicy Bypass -File install-automation-tools.ps1 -Minimal

# Standard installation (no AI or browser tools)
powershell -ExecutionPolicy Bypass -File install-automation-tools.ps1 -SkipAI -SkipBrowser
```

### 2. Start the Application

```powershell
cd "C:\Users\Geoff Parsons\Desktop\tolaria-automation"
pnpm tauri dev
```

### 3. Configure AI (Optional)

If you installed Ollama:

```powershell
# Start Ollama service
ollama serve

# In another terminal, verify models
ollama list
```

## 📋 Features

### 🔧 Workflow Automation
- **Visual Workflow Builder**: Create automation workflows with triggers, conditions, and actions
- **Trigger Types**: File system events, time-based schedules, window focus, clipboard changes, hotkeys
- **Action Types**: Run commands, send notifications, manipulate files, call APIs, AI prompts
- **Scheduler**: Cron-like task scheduling for recurring automation

### 🤖 AI Integration
- **Local LLM Support**: Ollama integration for private, offline AI assistance
- **Cloud LLM Fallback**: OpenAI and Anthropic API support
- **Specialized Agents**: Code assistant, writing assistant, data analyzer, task planner, debugger, researcher
- **Prompt Library**: Pre-built templates for common tasks
- **Context-Aware**: Use current clipboard, files, or window content in prompts

### 📋 Clipboard Manager
- **Unlimited History**: Never lose copied content again
- **Multi-Format Support**: Text, images, files, HTML
- **Semantic Search**: Find clipboard entries by content
- **Favorites**: Star important clipboard items
- **Auto-Monitoring**: Automatically tracks all clipboard changes

### 📊 Productivity Tools
- **Time Tracking**: Automatic tracking by app, window, and project
- **Pomodoro Timer**: Built-in focus timer with break reminders
- **Focus Mode**: Block distracting websites and apps
- **Analytics**: Daily/weekly productivity reports
- **Goal Tracking**: Set and monitor productivity goals

### 💻 System Monitoring
- **Real-time Metrics**: CPU, RAM, disk usage
- **Performance Alerts**: Get notified of resource issues
- **Health Checks**: System health monitoring
- **Activity Logging**: Track all automation activities

## 🎯 Usage Examples

### Creating a Workflow

1. Open the **Workflows** tab
2. Click **+ New Workflow**
3. Add triggers (e.g., "When file is created in Downloads")
4. Add actions (e.g., "Move to Documents/Archive")
5. Save and enable the workflow

### Using AI Assistant

1. Open the **AI Assistant** tab
2. Type your question or request
3. Get instant responses from your local LLM
4. Use prompt templates for common tasks

### Clipboard Management

1. Open the **Clipboard** tab
2. View all your clipboard history
3. Search for specific content
4. Click to copy any item back to clipboard
5. Star favorites for quick access

### Productivity Tracking

1. Open the **Productivity** tab
2. Click **Start Tracking** to begin time tracking
3. Start a **Pomodoro** session for focused work
4. View today's statistics and top apps

## 🛠️ Advanced Configuration

### AI Provider Configuration

Edit AI settings in the app or via code:

```typescript
await invoke('ai_initialize', {
  config: {
    provider: {
      Ollama: {
        model: 'llama3.2:3b',
        base_url: 'http://localhost:11434',
      },
    },
    temperature: 0.7,
    max_tokens: 2048,
  },
});
```

### Custom Workflow Example

```typescript
const workflow = {
  name: 'Auto-organize Downloads',
  description: 'Automatically organize downloaded files',
  enabled: true,
  triggers: [
    {
      type: 'file_created',
      path: 'C:\\Users\\YourName\\Downloads',
    },
  ],
  actions: [
    {
      type: 'move_file',
      destination: 'C:\\Users\\YourName\\Documents\\Archive',
    },
  ],
};

await invoke('create_workflow', { workflow });
```

### Clipboard Monitoring

Clipboard monitoring starts automatically. Access history:

```typescript
const history = await invoke('clipboard_get_history');
const results = await invoke('clipboard_search', { query: 'important' });
```

## 📦 Architecture

### Backend (Rust/Tauri)
- `src-tauri/src/automation/` - Workflow engine
- `src-tauri/src/ai/` - AI integration layer
- `src-tauri/src/clipboard/` - Clipboard manager
- `src-tauri/src/productivity/` - Time tracking & productivity
- `src-tauri/src/commands/` - Tauri command handlers

### Frontend (React/TypeScript)
- `src/pages/AutomationDashboard.tsx` - Main dashboard
- `src/components/automation/` - Workflow builder UI
- `src/components/ai/` - AI chat interface
- `src/components/clipboard/` - Clipboard history UI
- `src/components/productivity/` - Productivity dashboard
- `src/components/monitoring/` - System monitor

## 🔌 API Reference

### Workflow Commands
- `create_workflow(workflow)` - Create new workflow
- `list_workflows()` - Get all workflows
- `execute_workflow(id)` - Run a workflow
- `delete_workflow(id)` - Delete workflow

### AI Commands
- `ai_initialize(config)` - Initialize AI engine
- `ai_chat(message)` - Send message to AI
- `ai_clear_history()` - Clear conversation
- `ai_get_history()` - Get conversation history

### Clipboard Commands
- `clipboard_get_text()` - Get current clipboard
- `clipboard_set_text(text)` - Set clipboard
- `clipboard_get_history()` - Get all history
- `clipboard_search(query)` - Search history

### Productivity Commands
- `productivity_start_tracking(app, window, project)` - Start time tracking
- `productivity_stop_tracking()` - Stop tracking
- `productivity_get_stats(start, end)` - Get statistics
- `productivity_start_pomodoro(...)` - Start pomodoro timer

## 🐛 Troubleshooting

### Ollama Connection Issues
```powershell
# Check if Ollama is running
ollama serve

# Test connection
ollama run llama3.2:3b "Hello"
```

### Build Errors
```powershell
# Clear Rust cache
cd src-tauri
cargo clean

# Clear Node modules
cd ..
rm -rf node_modules
pnpm install
```

### Clipboard Not Working
- Ensure the app has clipboard permissions
- Restart the application
- Check Windows clipboard settings

## 📚 Resources

- **Rust**: https://www.rust-lang.org/
- **Tauri**: https://tauri.app/
- **Ollama**: https://ollama.ai/
- **React**: https://react.dev/
- **TailwindCSS**: https://tailwindcss.com/

## 🎨 Customization

### Themes
Edit CSS variables in `src/index.css`:

```css
:root {
  --color-bg-primary: #1a1a1a;
  --color-bg-secondary: #242424;
  --color-accent: #646cff;
  --color-text-primary: #ffffff;
  --color-text-secondary: #a0a0a0;
}
```

### Keyboard Shortcuts
Configure global hotkeys in Settings (coming soon)

## 🚧 Roadmap

- [ ] Browser automation (Playwright integration)
- [ ] Email automation (IMAP/SMTP)
- [ ] Calendar sync (Google, Outlook)
- [ ] Slack integration
- [ ] GitHub automation
- [ ] Visual workflow canvas with React Flow
- [ ] Plugin system for extensions
- [ ] Cloud sync for workflows
- [ ] Mobile companion app

## 📄 License

MIT License - See LICENSE file for details

## 🤝 Contributing

Contributions welcome! Please read CONTRIBUTING.md first.

## 💬 Support

- GitHub Issues: Report bugs and request features
- Documentation: See docs/ folder
- Community: Join our Discord (coming soon)

---

**Built with ❤️ using Rust, Tauri, React, and TypeScript**
