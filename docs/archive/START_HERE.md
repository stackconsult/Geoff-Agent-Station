# 🚀 Ultimate Desktop Automation System - Quick Start

Welcome to your new **Ultimate Desktop Work Automation System**! This guide will get you up and running in minutes.

## ⚡ Installation (Choose One)

### Option 1: Automated Installation (Recommended)

Run this single command to install everything:

```powershell
powershell -ExecutionPolicy Bypass -File install-automation-tools.ps1 -Full
```

This will install:
- ✅ Rust toolchain
- ✅ Node.js & pnpm
- ✅ Git
- ✅ Ollama (local AI)
- ✅ AI models (llama3.2, codellama, mistral)
- ✅ All project dependencies
- ✅ Compiles the Rust backend

**Time:** ~15-30 minutes (depending on internet speed)

### Option 2: Minimal Installation (Faster)

Just the essentials:

```powershell
powershell -ExecutionPolicy Bypass -File install-automation-tools.ps1 -Minimal
```

This installs only core tools (Rust, Node.js, Git, pnpm) without AI or extras.

**Time:** ~5-10 minutes

### Option 3: Manual Installation

See `TOOLS_INSTALLATION_GUIDE.md` for step-by-step manual installation.

## 🎯 First Run

### 1. Start Ollama (if installed)

```powershell
# In a new terminal window
ollama serve
```

Leave this running in the background.

### 2. Start the Application

```powershell
cd "C:\Users\Geoff Parsons\Desktop\tolaria-automation"
pnpm tauri dev
```

The app will open automatically!

## 🎨 What You Can Do

### 🔧 Workflows Tab
- Create automation workflows
- Set up triggers (file changes, time-based, etc.)
- Define actions (move files, run commands, etc.)
- Execute workflows on demand

### 🤖 AI Assistant Tab
- Chat with local AI (Ollama)
- Get coding help
- Analyze data
- Generate content
- Use prompt templates

### 📋 Clipboard Tab
- View unlimited clipboard history
- Search past clipboard items
- Star favorites
- Copy any item back to clipboard

### 📊 Productivity Tab
- Start/stop time tracking
- Use Pomodoro timer
- View today's activity stats
- See top applications used

### 💻 System Tab
- Monitor CPU usage
- Track memory usage
- View system information
- Real-time performance metrics

## 🎓 Quick Examples

### Example 1: Auto-organize Downloads

1. Go to **Workflows** tab
2. Click **+ New Workflow**
3. Name it "Auto-organize Downloads"
4. Add trigger: "File created in Downloads folder"
5. Add action: "Move to Documents/Archive"
6. Enable the workflow

Now all new downloads will be automatically organized!

### Example 2: Ask AI for Help

1. Go to **AI Assistant** tab
2. Type: "Explain how to create a Python web scraper"
3. Get instant, detailed response
4. Continue the conversation

### Example 3: Find Old Clipboard Item

1. Go to **Clipboard** tab
2. Type in search: "important link"
3. Find the link you copied days ago
4. Click to copy it again

## 🔧 Configuration

### Change AI Model

In the AI Assistant tab, you can switch models:
- `llama3.2:3b` - Fast, lightweight (default)
- `codellama:7b` - Best for coding
- `mistral:7b` - General purpose

### Customize Appearance

Edit `src/index.css` to change colors and themes.

## 📚 Next Steps

1. **Read the full guide**: `ULTIMATE_AUTOMATION_GUIDE.md`
2. **Check architecture**: `AUTOMATION_ARCHITECTURE.md`
3. **Explore examples**: Create your first workflow
4. **Join community**: (Coming soon)

## 🐛 Troubleshooting

### "Ollama not found"
```powershell
ollama serve
```
Make sure Ollama is running before using AI features.

### "Build failed"
```powershell
cd src-tauri
cargo clean
cargo build
```

### "pnpm not found"
```powershell
npm install -g pnpm
```

## 💡 Pro Tips

1. **Use keyboard shortcuts** - Coming soon!
2. **Star important clipboard items** - Never lose important content
3. **Create workflow templates** - Reuse common automation patterns
4. **Track your time** - See where your day goes
5. **Use AI for coding** - Get instant code reviews and suggestions

## 🎉 You're Ready!

Start automating your desktop workflow and boost your productivity!

**Need help?** Check `ULTIMATE_AUTOMATION_GUIDE.md` or open an issue on GitHub.

---

**Happy Automating! 🚀**
