# GitHub Integration Skill

## Purpose
Teach coding agents how to execute GitHub environment setup, CI/CD configuration, and deployment workflows for Tauri-based desktop applications.

## Context

Based on benchmark analysis of production-ready Tauri repositories:
- **dannysmith/tauri-template** (238 stars) - Production-ready template with AI agent integration
- **suitedaces/computer-agent** (619 stars) - AI desktop automation
- **kimlimjustin/xplorer** - File explorer with AI features
- **adiljouahri/Automaland** - AI-native automation platform

## Best Practices from Benchmarks

### Type-Safe IPC
```rust
// Pattern: Use tauri-specta for type-safe Rust-TypeScript bridge
#[tauri::command]
pub async fn load_preferences() -> Result<Preferences, String> {
    // Rust implementation
}
```

### Three-Layer State Management
```
Layer 1: useState (component state - form inputs, local toggles)
Layer 2: Zustand (global UI state - sidebar visibility, dialog state)
Layer 3: TanStack Query (persistent data - user preferences, documents)
```

### Single Quality Gate
```bash
npm run check:all  # Runs TypeScript, ESLint, Prettier, ast-grep, clippy, tests
```

## GitHub Integration Patterns

### 1. Environment Configuration

**When to use:** Setting up deployment environments for GitHub Actions

**Pattern:**
```yaml
# .github/workflows/ci.yml
jobs:
  build:
    environment: production  # Reference environment by name
    runs-on: ubuntu-latest
```

**Steps:**
1. Create environment in GitHub Settings → Environments
2. Add environment variables (non-sensitive config)
3. Add environment secrets (sensitive data like tokens)
4. Reference environment in workflow YAML

### 2. Dependabot Configuration

**When to use:** Automated dependency updates

**Pattern:**
```yaml
# .github/dependabot.yml
version: 2
updates:
  - package-ecosystem: "cargo"
    directory: "/src-tauri"
    schedule:
      interval: "weekly"
```

**Steps:**
1. Create `.github/dependabot.yml`
2. Configure package ecosystems (cargo, npm)
3. Set schedule (weekly recommended)
4. Add labels for PRs
5. Configure commit message format

### 3. SSH Deploy Keys

**When to use:** GitHub Pages deployment, automated deployments

**Pattern:**
```bash
# Generate key pair
ssh-keygen -t ed25519 -C "github-deploy-key" -f ~/.ssh/github_deploy_key -N ""

# Add public key to GitHub deploy keys
# Store private key in environment secret
```

**Steps:**
1. Generate ed25519 key pair locally
2. Add public key to GitHub Settings → Keys → Deploy keys
3. Add private key to GitHub Actions secret
4. Configure workflow to use secret
5. **NEVER** commit private key to repository

### 4. Codespaces Configuration

**When to use:** Providing consistent development environment

**Pattern:**
```json
// .devcontainer/devcontainer.json
{
  "name": "Dev Container",
  "image": "mcr.microsoft.com/devcontainers/base:ubuntu-22.04",
  "features": {
    "ghcr.io/devcontainers/features/rust:1": {},
    "ghcr.io/devcontainers/features/node:1": {}
  }
}
```

**Steps:**
1. Create `.devcontainer/devcontainer.json`
2. Configure base image
3. Add features (Rust, Node.js)
4. Add VS Code extensions
5. Configure post-create command

### 5. GitHub Pages Deployment

**When to use:** Deploying documentation or static site

**Pattern:**
```yaml
# .github/workflows/pages.yml
jobs:
  deploy:
    permissions:
      contents: read
      pages: write
      id-token: write
    steps:
      - uses: actions/deploy-pages@v4
```

**Steps:**
1. Enable GitHub Pages in repository settings
2. Create deployment workflow
3. Configure permissions
4. Set source to GitHub Actions
5. Configure build step

## Agent Execution Protocol

### Pre-Flight Checks
```bash
# Verify repository state
git status  # Must be clean
git remote -v  # Verify origin configured
```

### Configuration Execution Order
1. Update CI workflow (blank.yml → production)
2. Create Dependabot configuration
3. Generate SSH keys locally
4. Create Codespaces configuration
5. Create GitHub Pages workflow
6. Create setup documentation
7. Commit and push changes
8. Verify CI runs successfully

### Quality Gates
```bash
# Before pushing
cargo test && pnpm test:run  # Tests must pass
cargo clippy -- -D warnings  # Zero warnings
```

## Common Pitfalls

### ❌ Do NOT commit secrets
```bash
# WRONG
git add .env
git commit -m "add secrets"

# RIGHT
# Add to GitHub Actions secrets instead
```

### ❌ Do NOT commit private SSH keys
```bash
# WRONG
git add ~/.ssh/github_deploy_key
git commit -m "add deploy key"

# RIGHT
# Add public key to GitHub deploy keys
# Store private key in GitHub Actions secret
```

### ❌ Do NOT use default blank workflow
```bash
# WRONG
# Keep blank.yml with "Hello, world!"

# RIGHT
# Replace with production CI workflow matching local ci.yml
```

## Verification Checklist

After executing GitHub integration:

- [ ] CI workflow updated from blank.yml to production
- [ ] Dependabot configuration created
- [ ] SSH keys generated locally (not committed)
- [ ] Codespaces configuration created
- [ ] GitHub Pages workflow created
- [ ] Setup documentation created
- [ ] All changes committed
- [ ] Changes pushed to origin
- [ ] CI workflow runs successfully
- [ ] All jobs pass (Rust tests, Frontend tests)

## References

- Benchmark repos: dannysmith/tauri-template, suitedaces/computer-agent, kimlimjustin/xplorer
- GitHub Actions documentation: https://docs.github.com/en/actions
- Dependabot documentation: https://docs.github.com/en/code-security/dependabot
- GitHub Pages documentation: https://docs.github.com/en/pages
- Codespaces documentation: https://docs.github.com/en/codespaces
