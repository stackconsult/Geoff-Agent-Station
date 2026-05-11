# Ultimate Desktop Automation - Installation Verification Script
# Checks if all components are properly installed and configured

$ErrorActionPreference = "Continue"

function Write-Success { param($msg) Write-Host "✓ $msg" -ForegroundColor Green }
function Write-Error { param($msg) Write-Host "✗ $msg" -ForegroundColor Red }
function Write-Info { param($msg) Write-Host "ℹ $msg" -ForegroundColor Cyan }
function Write-Warning { param($msg) Write-Host "⚠ $msg" -ForegroundColor Yellow }
function Write-Section { param($msg) Write-Host "`n▶ $msg" -ForegroundColor Magenta }

function Test-CommandExists {
    param($command)
    try {
        if (Get-Command $command -ErrorAction Stop) { return $true }
    } catch { return $false }
}

Write-Host @"
╔════════════════════════════════════════════════════════════╗
║   Ultimate Desktop Automation - Installation Verifier    ║
╚════════════════════════════════════════════════════════════╝
"@ -ForegroundColor Cyan

$issues = @()
$warnings = @()

# Core Tools
Write-Section "Checking Core Tools"

if (Test-CommandExists "rustc") {
    $rustVersion = rustc --version
    Write-Success "Rust: $rustVersion"
} else {
    Write-Error "Rust not found"
    $issues += "Rust is not installed. Run: winget install Rustlang.Rustup"
}

if (Test-CommandExists "cargo") {
    $cargoVersion = cargo --version
    Write-Success "Cargo: $cargoVersion"
} else {
    Write-Error "Cargo not found"
    $issues += "Cargo is not installed (should come with Rust)"
}

if (Test-CommandExists "node") {
    $nodeVersion = node --version
    Write-Success "Node.js: $nodeVersion"
} else {
    Write-Error "Node.js not found"
    $issues += "Node.js is not installed. Run: winget install OpenJS.NodeJS.LTS"
}

if (Test-CommandExists "pnpm") {
    $pnpmVersion = pnpm --version
    Write-Success "pnpm: $pnpmVersion"
} else {
    Write-Error "pnpm not found"
    $issues += "pnpm is not installed. Run: npm install -g pnpm"
}

if (Test-CommandExists "git") {
    $gitVersion = git --version
    Write-Success "Git: $gitVersion"
} else {
    Write-Error "Git not found"
    $issues += "Git is not installed. Run: winget install Git.Git"
}

# AI Tools
Write-Section "Checking AI Tools"

if (Test-CommandExists "ollama") {
    $ollamaVersion = ollama --version
    Write-Success "Ollama: $ollamaVersion"
    
    # Check if Ollama is running
    try {
        $response = Invoke-WebRequest -Uri "http://localhost:11434/api/tags" -Method GET -TimeoutSec 2 -ErrorAction Stop
        Write-Success "Ollama service is running"
        
        # Check for models
        $models = $response.Content | ConvertFrom-Json
        if ($models.models.Count -gt 0) {
            Write-Success "Ollama models installed: $($models.models.Count)"
            foreach ($model in $models.models) {
                Write-Info "  - $($model.name)"
            }
        } else {
            Write-Warning "No Ollama models installed"
            $warnings += "Install models with: ollama pull llama3.2:3b"
        }
    } catch {
        Write-Warning "Ollama service not running"
        $warnings += "Start Ollama with: ollama serve"
    }
} else {
    Write-Warning "Ollama not found (optional)"
    $warnings += "Install Ollama for local AI: winget install Ollama.Ollama"
}

# Rust Tools
Write-Section "Checking Rust Development Tools"

$rustTools = @("cargo-watch", "cargo-edit", "tauri")
foreach ($tool in $rustTools) {
    if (Test-CommandExists $tool) {
        Write-Success "$tool installed"
    } else {
        Write-Warning "$tool not found"
        $warnings += "Install $tool with: cargo install $tool"
    }
}

# Project Files
Write-Section "Checking Project Structure"

$projectPath = "C:\Users\Geoff Parsons\Desktop\tolaria-automation"
if (Test-Path $projectPath) {
    Write-Success "Project directory found"
    
    # Check key files
    $keyFiles = @(
        "package.json",
        "src-tauri\Cargo.toml",
        "src\App.tsx",
        "src\pages\AutomationDashboard.tsx"
    )
    
    foreach ($file in $keyFiles) {
        $filePath = Join-Path $projectPath $file
        if (Test-Path $filePath) {
            Write-Success "Found: $file"
        } else {
            Write-Error "Missing: $file"
            $issues += "Missing file: $file"
        }
    }
    
    # Check node_modules
    $nodeModulesPath = Join-Path $projectPath "node_modules"
    if (Test-Path $nodeModulesPath) {
        Write-Success "node_modules installed"
    } else {
        Write-Warning "node_modules not found"
        $warnings += "Run 'pnpm install' in project directory"
    }
    
    # Check Rust build
    $targetPath = Join-Path $projectPath "src-tauri\target"
    if (Test-Path $targetPath) {
        Write-Success "Rust build artifacts found"
    } else {
        Write-Warning "Rust not built yet"
        $warnings += "Run 'cargo build' in src-tauri directory"
    }
    
} else {
    Write-Error "Project directory not found: $projectPath"
    $issues += "Project directory not found"
}

# System Requirements
Write-Section "Checking System Requirements"

$os = Get-WmiObject -Class Win32_OperatingSystem
Write-Info "OS: $($os.Caption) $($os.Version)"

$cpu = Get-WmiObject -Class Win32_Processor
Write-Info "CPU: $($cpu.Name) ($($cpu.NumberOfCores) cores)"

$memory = Get-WmiObject -Class Win32_ComputerSystem
$memoryGB = [math]::Round($memory.TotalPhysicalMemory / 1GB, 2)
Write-Info "RAM: $memoryGB GB"

if ($memoryGB -lt 4) {
    Write-Warning "Low memory detected. Recommended: 8GB+"
    $warnings += "Consider upgrading RAM for better performance"
}

# Summary
Write-Host @"

╔════════════════════════════════════════════════════════════╗
║                  Verification Summary                      ║
╚════════════════════════════════════════════════════════════╝
"@ -ForegroundColor Cyan

if ($issues.Count -eq 0 -and $warnings.Count -eq 0) {
    Write-Host "`n🎉 All checks passed! Your system is ready." -ForegroundColor Green
    Write-Host "`nNext steps:" -ForegroundColor Cyan
    Write-Host "1. cd `"$projectPath`"" -ForegroundColor White
    Write-Host "2. pnpm tauri dev" -ForegroundColor White
} else {
    if ($issues.Count -gt 0) {
        Write-Host "`n❌ Critical Issues Found ($($issues.Count)):" -ForegroundColor Red
        foreach ($issue in $issues) {
            Write-Host "  • $issue" -ForegroundColor Red
        }
    }
    
    if ($warnings.Count -gt 0) {
        Write-Host "`n⚠️  Warnings ($($warnings.Count)):" -ForegroundColor Yellow
        foreach ($warning in $warnings) {
            Write-Host "  • $warning" -ForegroundColor Yellow
        }
    }
    
    Write-Host "`nRecommendation:" -ForegroundColor Cyan
    if ($issues.Count -gt 0) {
        Write-Host "Fix critical issues before running the application." -ForegroundColor Yellow
        Write-Host "Run the automated installer: .\install-automation-tools.ps1 -Full" -ForegroundColor White
    } else {
        Write-Host "Warnings are optional but recommended for full functionality." -ForegroundColor Yellow
    }
}

Write-Host ""
