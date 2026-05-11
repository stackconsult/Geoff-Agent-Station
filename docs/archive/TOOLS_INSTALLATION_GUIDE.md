# Ultimate Desktop Automation - Tools Installation Guide

## Core Tools (Required)

### 1. Rust Toolchain
```powershell
# Install Rust via rustup
winget install Rustlang.Rustup

# Verify installation
rustc --version
cargo --version
```

### 2. Node.js & pnpm
```powershell
# Install Node.js
winget install OpenJS.NodeJS.LTS

# Install pnpm
npm install -g pnpm

# Verify
node --version
pnpm --version
```

### 3. Git
```powershell
# Install Git
winget install Git.Git

# Configure
git config --global user.name "Your Name"
git config --global user.email "your.email@example.com"
```

## AI/LLM Tools (Choose One or More)

### Option 1: Ollama (Recommended for Local LLM)
```powershell
# Install Ollama
winget install Ollama.Ollama

# Pull models
ollama pull llama3.2:3b        # Fast, lightweight
ollama pull codellama:7b       # Code-focused
ollama pull mistral:7b         # General purpose
ollama pull phi3:mini          # Ultra-fast

# Verify
ollama list
```

### Option 2: LM Studio (GUI Alternative)
```powershell
# Download from: https://lmstudio.ai/
# Install and download models via GUI
```

### Option 3: llama.cpp (Advanced)
```powershell
# Clone and build
git clone https://github.com/ggerganov/llama.cpp
cd llama.cpp
cmake -B build
cmake --build build --config Release
```

## Browser Automation Tools

### Playwright
```powershell
# Install Playwright
pnpm add -D playwright @playwright/test

# Install browsers
pnpm exec playwright install chromium firefox webkit
```

### Puppeteer (Alternative)
```powershell
pnpm add puppeteer
```

## System Automation Tools

### AutoHotkey (Windows Hotkeys)
```powershell
winget install AutoHotkey.AutoHotkey
```

### PowerToys (Windows Utilities)
```powershell
winget install Microsoft.PowerToys
```

## Database Tools

### SQLite
```powershell
# Already included in Rust via sqlx
# For CLI tool:
winget install SQLite.SQLite
```

### DB Browser for SQLite (GUI)
```powershell
winget install DB.Browser.for.SQLite
```

## Development Tools

### VS Code Extensions
```powershell
# Install VS Code
winget install Microsoft.VisualStudioCode

# Recommended extensions:
code --install-extension rust-lang.rust-analyzer
code --install-extension tauri-apps.tauri-vscode
code --install-extension dbaeumer.vscode-eslint
code --install-extension esbenp.prettier-vscode
code --install-extension bradlc.vscode-tailwindcss
```

### Rust Tools
```powershell
# Install additional Rust tools
cargo install cargo-watch      # Auto-rebuild on file changes
cargo install cargo-edit        # Manage dependencies
cargo install sqlx-cli          # Database migrations
```

## Optional Integrations

### Docker (For Containerized Workflows)
```powershell
winget install Docker.DockerDesktop
```

### GitHub CLI
```powershell
winget install GitHub.cli

# Authenticate
gh auth login
```

### Slack CLI
```powershell
# Download from: https://api.slack.com/automation/cli
```

## Python Tools (For AI/ML Extensions)

### Python & pip
```powershell
winget install Python.Python.3.12

# Install AI libraries
pip install sentence-transformers
pip install chromadb
pip install openai
pip install anthropic
```

## Verification Script

Create a file `verify-tools.ps1`:

```powershell
# Tool Verification Script
Write-Host "=== Verifying Tool Installation ===" -ForegroundColor Cyan

# Core Tools
Write-Host "`nCore Tools:" -ForegroundColor Yellow
try { $rust = rustc --version; Write-Host "✓ Rust: $rust" -ForegroundColor Green } catch { Write-Host "✗ Rust not found" -ForegroundColor Red }
try { $node = node --version; Write-Host "✓ Node.js: $node" -ForegroundColor Green } catch { Write-Host "✗ Node.js not found" -ForegroundColor Red }
try { $pnpm = pnpm --version; Write-Host "✓ pnpm: $pnpm" -ForegroundColor Green } catch { Write-Host "✗ pnpm not found" -ForegroundColor Red }
try { $git = git --version; Write-Host "✓ Git: $git" -ForegroundColor Green } catch { Write-Host "✗ Git not found" -ForegroundColor Red }

# AI Tools
Write-Host "`nAI Tools:" -ForegroundColor Yellow
try { $ollama = ollama --version; Write-Host "✓ Ollama: $ollama" -ForegroundColor Green } catch { Write-Host "✗ Ollama not found (optional)" -ForegroundColor Yellow }

# Browser Automation
Write-Host "`nBrowser Automation:" -ForegroundColor Yellow
if (Test-Path "node_modules/playwright") { Write-Host "✓ Playwright installed" -ForegroundColor Green } else { Write-Host "✗ Playwright not found" -ForegroundColor Yellow }

# Database
Write-Host "`nDatabase:" -ForegroundColor Yellow
try { $sqlite = sqlite3 --version; Write-Host "✓ SQLite: $sqlite" -ForegroundColor Green } catch { Write-Host "✗ SQLite CLI not found (optional)" -ForegroundColor Yellow }

Write-Host "`n=== Verification Complete ===" -ForegroundColor Cyan
```

Run verification:
```powershell
powershell -ExecutionPolicy Bypass -File verify-tools.ps1
```

## Quick Start Installation

### Minimal Setup (Core Only)
```powershell
# Install core tools
winget install Rustlang.Rustup
winget install OpenJS.NodeJS.LTS
winget install Git.Git
npm install -g pnpm

# Navigate to project
cd "C:\Users\Geoff Parsons\Desktop\tolaria-automation"

# Install dependencies
pnpm install
cd src-tauri
cargo build
```

### Full Setup (All Tools)
```powershell
# Core
winget install Rustlang.Rustup
winget install OpenJS.NodeJS.LTS
winget install Git.Git
npm install -g pnpm

# AI
winget install Ollama.Ollama
ollama pull llama3.2:3b
ollama pull codellama:7b

# Utilities
winget install Microsoft.PowerToys
winget install AutoHotkey.AutoHotkey
winget install Microsoft.VisualStudioCode

# Development
cargo install cargo-watch
cargo install sqlx-cli

# Navigate to project
cd "C:\Users\Geoff Parsons\Desktop\tolaria-automation"

# Install dependencies
pnpm install
pnpm add -D playwright @playwright/test
pnpm exec playwright install chromium

# Build
cd src-tauri
cargo build
cd ..
pnpm tauri dev
```

## Next Steps

After installation:
1. Review `AUTOMATION_ARCHITECTURE.md` for system design
2. Run `pnpm tauri dev` to start development server
3. Configure AI models in Settings
4. Create your first automation workflow
5. Explore example workflows in `workflows/examples/`

## Troubleshooting

### Rust Build Errors
```powershell
# Update Rust
rustup update

# Clear cache
cargo clean
```

### Node Module Issues
```powershell
# Clear cache
pnpm store prune
rm -rf node_modules
pnpm install
```

### Ollama Connection Issues
```powershell
# Check Ollama service
ollama serve

# Test connection
ollama run llama3.2:3b "Hello"
```

### Tauri Build Issues
```powershell
# Install WebView2
winget install Microsoft.EdgeWebView2Runtime

# Update Tauri CLI
cargo install tauri-cli --locked
```

## Resource Links

- **Rust**: https://www.rust-lang.org/
- **Tauri**: https://tauri.app/
- **Ollama**: https://ollama.ai/
- **Playwright**: https://playwright.dev/
- **React**: https://react.dev/
- **TailwindCSS**: https://tailwindcss.com/
