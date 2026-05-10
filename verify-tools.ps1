# Tool Verification Script for Tolaria Desktop Automation
Write-Host "=== Verifying Tool Installation ===" -ForegroundColor Cyan
Write-Host ""

$results = @{
    Core = @()
    AI = @()
    Dev = @()
    Browser = @()
    Database = @()
}

# Function to test command
function Test-Tool {
    param(
        [string]$Name,
        [string]$Command,
        [string]$Category
    )
    
    try {
        $version = & $Command --version 2>&1 | Select-Object -First 1
        $results[$Category] += @{ Name = $Name; Status = "✓"; Version = $version; Color = "Green" }
    } catch {
        $results[$Category] += @{ Name = $Name; Status = "✗"; Version = "Not found"; Color = "Red" }
    }
}

# Core Tools
Test-Tool "Rust" "rustc" "Core"
Test-Tool "Cargo" "cargo" "Core"
Test-Tool "Node.js" "node" "Core"
Test-Tool "pnpm" "pnpm" "Core"
Test-Tool "Git" "git" "Core"

# AI Tools
Test-Tool "Ollama" "ollama" "AI"

# Development Tools
Test-Tool "VS Code" "code" "Dev"
Test-Tool "GitHub CLI" "gh" "Dev"
Test-Tool "Docker" "docker" "Dev"

# Browser Automation
$projectPath = "C:\Users\Geoff Parsons\Desktop\tolaria-automation"
if (Test-Path "$projectPath\node_modules\playwright") {
    $results["Browser"] += @{ Name = "Playwright"; Status = "✓"; Version = "Installed"; Color = "Green" }
} else {
    $results["Browser"] += @{ Name = "Playwright"; Status = "✗"; Version = "Not found"; Color = "Yellow" }
}

# Database
Test-Tool "SQLite" "sqlite3" "Database"

# Display Results
foreach ($category in $results.Keys | Sort-Object) {
    Write-Host "`n$category Tools:" -ForegroundColor Yellow
    foreach ($tool in $results[$category]) {
        Write-Host "$($tool.Status) $($tool.Name): $($tool.Version)" -ForegroundColor $tool.Color
    }
}

# Check Ollama Models
if (Get-Command "ollama" -ErrorAction SilentlyContinue) {
    Write-Host "`nOllama Models:" -ForegroundColor Yellow
    try {
        ollama list
    } catch {
        Write-Host "No models installed" -ForegroundColor Yellow
    }
}

# Check Project Dependencies
Write-Host "`nProject Status:" -ForegroundColor Yellow
if (Test-Path "$projectPath\node_modules") {
    Write-Host "✓ Node modules installed" -ForegroundColor Green
} else {
    Write-Host "✗ Node modules not installed - Run: pnpm install" -ForegroundColor Red
}

if (Test-Path "$projectPath\src-tauri\target") {
    Write-Host "✓ Rust backend built" -ForegroundColor Green
} else {
    Write-Host "✗ Rust backend not built - Run: cd src-tauri && cargo build" -ForegroundColor Red
}

Write-Host "`n=== Verification Complete ===" -ForegroundColor Cyan
Write-Host ""
