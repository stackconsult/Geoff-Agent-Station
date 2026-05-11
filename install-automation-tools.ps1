# Ultimate Desktop Automation - Automated Tool Installer
# This script installs all required and optional tools with progress tracking

param(
    [switch]$Minimal,
    [switch]$Full,
    [switch]$SkipAI,
    [switch]$SkipBrowser,
    [switch]$Force
)

$ErrorActionPreference = "Continue"
$ProgressPreference = "SilentlyContinue"

# Color functions
function Write-Success { param($msg) Write-Host "✓ $msg" -ForegroundColor Green }
function Write-Error { param($msg) Write-Host "✗ $msg" -ForegroundColor Red }
function Write-Info { param($msg) Write-Host "ℹ $msg" -ForegroundColor Cyan }
function Write-Warning { param($msg) Write-Host "⚠ $msg" -ForegroundColor Yellow }
function Write-Step { param($msg) Write-Host "`n▶ $msg" -ForegroundColor Magenta }

# Progress tracking
$script:totalSteps = 0
$script:currentStep = 0
$script:installedTools = @()
$script:failedTools = @()

function Update-Progress {
    param($action)
    $script:currentStep++
    $percent = [math]::Round(($script:currentStep / $script:totalSteps) * 100)
    Write-Host "`n[$percent%] $action" -ForegroundColor Yellow
}

function Test-CommandExists {
    param($command)
    try {
        if (Get-Command $command -ErrorAction Stop) { return $true }
    } catch { return $false }
}

function Install-WithWinget {
    param($name, $package, $verifyCommand)
    
    Update-Progress "Installing $name"
    
    if (Test-CommandExists $verifyCommand) {
        Write-Warning "$name already installed"
        $script:installedTools += "$name (existing)"
        return $true
    }
    
    try {
        Write-Info "Installing $package via winget..."
        winget install --id $package --silent --accept-source-agreements --accept-package-agreements
        
        if ($LASTEXITCODE -eq 0) {
            Write-Success "$name installed successfully"
            $script:installedTools += $name
            return $true
        } else {
            Write-Error "$name installation failed (exit code: $LASTEXITCODE)"
            $script:failedTools += $name
            return $false
        }
    } catch {
        Write-Error "Failed to install ${name}: $_"
        $script:failedTools += $name
        return $false
    }
}

# Main installation flow
Write-Host @"
╔════════════════════════════════════════════════════════════╗
║   Ultimate Desktop Automation - Tool Installer            ║
║   Installing tools for Tolaria Automation System          ║
╚════════════════════════════════════════════════════════════╝
"@ -ForegroundColor Cyan

# Determine installation mode
if ($Minimal) {
    Write-Info "Minimal installation mode selected"
    $script:totalSteps = 5
} elseif ($Full) {
    Write-Info "Full installation mode selected"
    $script:totalSteps = 15
} else {
    Write-Info "Standard installation mode (use -Minimal or -Full to change)"
    $script:totalSteps = 10
}

# Check winget availability
Write-Step "Checking prerequisites"
if (-not (Test-CommandExists "winget")) {
    Write-Error "winget not found. Please install App Installer from Microsoft Store."
    exit 1
}
Write-Success "winget is available"

# Core Tools (Always Install)
Write-Step "Installing Core Tools"

# Rust
Install-WithWinget "Rust" "Rustlang.Rustup" "rustc"
if (Test-CommandExists "rustc") {
    $rustVersion = rustc --version
    Write-Info "Rust version: $rustVersion"
}

# Node.js
Install-WithWinget "Node.js" "OpenJS.NodeJS.LTS" "node"
if (Test-CommandExists "node") {
    $nodeVersion = node --version
    Write-Info "Node.js version: $nodeVersion"
}

# Git
Install-WithWinget "Git" "Git.Git" "git"
if (Test-CommandExists "git") {
    $gitVersion = git --version
    Write-Info "Git version: $gitVersion"
}

# pnpm
Update-Progress "Installing pnpm"
if (Test-CommandExists "pnpm") {
    Write-Warning "pnpm already installed"
} else {
    try {
        npm install -g pnpm
        Write-Success "pnpm installed"
        $script:installedTools += "pnpm"
    } catch {
        Write-Error "Failed to install pnpm: $_"
        $script:failedTools += "pnpm"
    }
}

# AI Tools (unless -SkipAI)
if (-not $SkipAI -and (-not $Minimal)) {
    Write-Step "Installing AI Tools"
    
    Install-WithWinget "Ollama" "Ollama.Ollama" "ollama"
    
    if (Test-CommandExists "ollama") {
        Write-Info "Pulling recommended AI models..."
        
        Update-Progress "Pulling llama3.2:3b (fast, lightweight)"
        ollama pull llama3.2:3b 2>&1 | Out-Null
        
        if ($Full) {
            Update-Progress "Pulling codellama:7b (code-focused)"
            ollama pull codellama:7b 2>&1 | Out-Null
            
            Update-Progress "Pulling mistral:7b (general purpose)"
            ollama pull mistral:7b 2>&1 | Out-Null
        }
        
        Write-Success "AI models downloaded"
    }
}

# Development Tools
if ($Full) {
    Write-Step "Installing Development Tools"
    
    Install-WithWinget "VS Code" "Microsoft.VisualStudioCode" "code"
    Install-WithWinget "PowerToys" "Microsoft.PowerToys" "powertoys"
    Install-WithWinget "GitHub CLI" "GitHub.cli" "gh"
    Install-WithWinget "Docker Desktop" "Docker.DockerDesktop" "docker"
}

# Database Tools
if ($Full) {
    Write-Step "Installing Database Tools"
    Install-WithWinget "SQLite" "SQLite.SQLite" "sqlite3"
    Install-WithWinget "DB Browser for SQLite" "DB.Browser.for.SQLite" "DB Browser for SQLite"
}

# Rust Tools
Write-Step "Installing Rust Development Tools"
Update-Progress "Installing cargo tools"

$cargoTools = @(
    @{name="cargo-watch"; desc="Auto-rebuild on file changes"},
    @{name="cargo-edit"; desc="Manage dependencies"},
    @{name="tauri-cli"; desc="Tauri CLI"}
)

foreach ($tool in $cargoTools) {
    if ($Minimal -and $tool.name -ne "tauri-cli") { continue }
    
    Write-Info "Installing $($tool.name) - $($tool.desc)"
    try {
        cargo install $tool.name --locked 2>&1 | Out-Null
        Write-Success "$($tool.name) installed"
        $script:installedTools += $tool.name
    } catch {
        Write-Warning "Failed to install $($tool.name)"
    }
}

# Project Dependencies
Write-Step "Installing Project Dependencies"
Update-Progress "Installing npm packages"

$projectPath = "C:\Users\Geoff Parsons\Desktop\tolaria-automation"
if (Test-Path $projectPath) {
    Push-Location $projectPath
    
    Write-Info "Installing frontend dependencies..."
    pnpm install
    
    if (-not $SkipBrowser -and (-not $Minimal)) {
        Write-Info "Installing browser automation tools..."
        pnpm add -D playwright @playwright/test
        pnpm add puppeteer
        
        Write-Info "Installing Playwright browsers..."
        pnpm exec playwright install chromium
    }
    
    # Additional automation packages
    Write-Info "Installing automation packages..."
    pnpm add zustand react-query @tanstack/react-query
    pnpm add reactflow recharts
    pnpm add date-fns clsx
    
    Pop-Location
    Write-Success "Project dependencies installed"
} else {
    Write-Warning "Project path not found: $projectPath"
}

# Rust Dependencies
Write-Step "Building Rust Backend"
Update-Progress "Compiling Tauri backend"

$tauriPath = Join-Path $projectPath "src-tauri"
if (Test-Path $tauriPath) {
    Push-Location $tauriPath
    
    Write-Info "Building Rust backend (this may take a few minutes)..."
    cargo build --release
    
    if ($LASTEXITCODE -eq 0) {
        Write-Success "Rust backend compiled successfully"
    } else {
        Write-Error "Rust compilation failed"
    }
    
    Pop-Location
}

# Summary
Write-Host @"

╔════════════════════════════════════════════════════════════╗
║                  Installation Complete                     ║
╚════════════════════════════════════════════════════════════╝
"@ -ForegroundColor Green

Write-Host "`nInstalled Tools ($($script:installedTools.Count)):" -ForegroundColor Cyan
foreach ($tool in $script:installedTools) {
    Write-Success $tool
}

if ($script:failedTools.Count -gt 0) {
    Write-Host "`nFailed Installations ($($script:failedTools.Count)):" -ForegroundColor Red
    foreach ($tool in $script:failedTools) {
        Write-Error $tool
    }
}

# Next Steps
Write-Host @"

╔════════════════════════════════════════════════════════════╗
║                      Next Steps                            ║
╚════════════════════════════════════════════════════════════╝

1. Start Ollama service (if installed):
   ollama serve

2. Test AI models:
   ollama run llama3.2:3b "Hello, world!"

3. Start development server:
   cd "$projectPath"
   pnpm tauri dev

4. Configure automation workflows in the app

5. Review documentation:
   - AUTOMATION_ARCHITECTURE.md
   - QUICK_START.md

"@ -ForegroundColor Cyan

# Save installation log
$logPath = Join-Path $projectPath "installation-log.txt"
@"
Installation completed at $(Get-Date)
Mode: $(if ($Minimal) { "Minimal" } elseif ($Full) { "Full" } else { "Standard" })
Installed: $($script:installedTools -join ", ")
Failed: $($script:failedTools -join ", ")
"@ | Out-File $logPath

Write-Info "Installation log saved to: $logPath"
