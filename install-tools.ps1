# Ultimate Desktop Automation - Automated Tool Installation
# Run as Administrator: powershell -ExecutionPolicy Bypass -File install-tools.ps1

param(
    [switch]$Minimal,
    [switch]$Full,
    [switch]$AIOnly,
    [switch]$DevOnly
)

Write-Host "=== Tolaria Desktop Automation - Tool Installer ===" -ForegroundColor Cyan
Write-Host ""

# Check if running as Administrator
$isAdmin = ([Security.Principal.WindowsPrincipal] [Security.Principal.WindowsIdentity]::GetCurrent()).IsInRole([Security.Principal.WindowsBuiltInRole]::Administrator)
if (-not $isAdmin) {
    Write-Host "⚠️  Warning: Not running as Administrator. Some installations may fail." -ForegroundColor Yellow
    Write-Host "   Restart PowerShell as Administrator for best results." -ForegroundColor Yellow
    Write-Host ""
}

# Function to check if command exists
function Test-Command {
    param($Command)
    try {
        if (Get-Command $Command -ErrorAction SilentlyContinue) {
            return $true
        }
    } catch {
        return $false
    }
    return $false
}

# Function to install via winget
function Install-Tool {
    param(
        [string]$Name,
        [string]$WingetId,
        [string]$TestCommand
    )
    
    Write-Host "Installing $Name..." -ForegroundColor Yellow
    
    if ($TestCommand -and (Test-Command $TestCommand)) {
        Write-Host "✓ $Name already installed" -ForegroundColor Green
        return $true
    }
    
    try {
        winget install --id $WingetId --silent --accept-source-agreements --accept-package-agreements
        Write-Host "✓ $Name installed successfully" -ForegroundColor Green
        return $true
    } catch {
        Write-Host "✗ Failed to install $Name" -ForegroundColor Red
        return $false
    }
}

# Determine installation mode
$installMode = "Custom"
if ($Minimal) { $installMode = "Minimal" }
if ($Full) { $installMode = "Full" }
if ($AIOnly) { $installMode = "AI Only" }
if ($DevOnly) { $installMode = "Dev Only" }

Write-Host "Installation Mode: $installMode" -ForegroundColor Cyan
Write-Host ""

# Core Tools (Always Install)
Write-Host "=== Core Tools ===" -ForegroundColor Cyan

Install-Tool "Rust" "Rustlang.Rustup" "rustc"
Install-Tool "Node.js" "OpenJS.NodeJS.LTS" "node"
Install-Tool "Git" "Git.Git" "git"

# Install pnpm via npm
if (Test-Command "npm") {
    Write-Host "Installing pnpm..." -ForegroundColor Yellow
    npm install -g pnpm
    Write-Host "✓ pnpm installed" -ForegroundColor Green
}

# AI Tools
if ($Full -or $AIOnly) {
    Write-Host "`n=== AI Tools ===" -ForegroundColor Cyan
    
    Install-Tool "Ollama" "Ollama.Ollama" "ollama"
    
    if (Test-Command "ollama") {
        Write-Host "Pulling AI models..." -ForegroundColor Yellow
        ollama pull llama3.2:3b
        ollama pull codellama:7b
        ollama pull mistral:7b
        Write-Host "✓ AI models downloaded" -ForegroundColor Green
    }
}

# Development Tools
if ($Full -or $DevOnly) {
    Write-Host "`n=== Development Tools ===" -ForegroundColor Cyan
    
    Install-Tool "VS Code" "Microsoft.VisualStudioCode" "code"
    Install-Tool "PowerToys" "Microsoft.PowerToys" $null
    Install-Tool "AutoHotkey" "AutoHotkey.AutoHotkey" "autohotkey"
    Install-Tool "GitHub CLI" "GitHub.cli" "gh"
    Install-Tool "Docker Desktop" "Docker.DockerDesktop" "docker"
    Install-Tool "SQLite" "SQLite.SQLite" "sqlite3"
    Install-Tool "DB Browser for SQLite" "DB.Browser.for.SQLite" $null
    
    # Install Rust tools
    if (Test-Command "cargo") {
        Write-Host "Installing Rust development tools..." -ForegroundColor Yellow
        cargo install cargo-watch
        cargo install cargo-edit
        Write-Host "✓ Rust tools installed" -ForegroundColor Green
    }
    
    # Install VS Code extensions
    if (Test-Command "code") {
        Write-Host "Installing VS Code extensions..." -ForegroundColor Yellow
        code --install-extension rust-lang.rust-analyzer
        code --install-extension tauri-apps.tauri-vscode
        code --install-extension dbaeumer.vscode-eslint
        code --install-extension esbenp.prettier-vscode
        Write-Host "✓ VS Code extensions installed" -ForegroundColor Green
    }
}

# Python Tools (Optional)
if ($Full) {
    Write-Host "`n=== Python Tools ===" -ForegroundColor Cyan
    
    Install-Tool "Python 3.12" "Python.Python.3.12" "python"
    
    if (Test-Command "pip") {
        Write-Host "Installing Python AI libraries..." -ForegroundColor Yellow
        pip install sentence-transformers chromadb openai anthropic
        Write-Host "✓ Python AI libraries installed" -ForegroundColor Green
    }
}

# Install WebView2 Runtime (Required for Tauri)
Write-Host "`n=== Tauri Dependencies ===" -ForegroundColor Cyan
Install-Tool "WebView2 Runtime" "Microsoft.EdgeWebView2Runtime" $null

# Project Setup
Write-Host "`n=== Project Setup ===" -ForegroundColor Cyan

$projectPath = "C:\Users\Geoff Parsons\Desktop\tolaria-automation"
if (Test-Path $projectPath) {
    Write-Host "Setting up project dependencies..." -ForegroundColor Yellow
    
    Push-Location $projectPath
    
    # Install Node dependencies
    if (Test-Command "pnpm") {
        pnpm install
        Write-Host "✓ Node dependencies installed" -ForegroundColor Green
    }
    
    # Install Playwright (if Full or DevOnly)
    if ($Full -or $DevOnly) {
        pnpm add -D playwright @playwright/test
        pnpm exec playwright install chromium
        Write-Host "✓ Playwright installed" -ForegroundColor Green
    }
    
    # Build Rust backend
    if (Test-Command "cargo") {
        Push-Location "src-tauri"
        cargo build
        Write-Host "✓ Rust backend built" -ForegroundColor Green
        Pop-Location
    }
    
    Pop-Location
}

# Final Summary
Write-Host "`n=== Installation Complete ===" -ForegroundColor Cyan
Write-Host ""
Write-Host "Next steps:" -ForegroundColor Yellow
Write-Host "1. Restart your terminal to refresh PATH" -ForegroundColor White
Write-Host "2. Run: cd '$projectPath'" -ForegroundColor White
Write-Host "3. Run: pnpm tauri dev" -ForegroundColor White
Write-Host "4. Configure your vault path in the app" -ForegroundColor White
Write-Host ""
Write-Host "For verification, run: .\verify-tools.ps1" -ForegroundColor Yellow
Write-Host ""
