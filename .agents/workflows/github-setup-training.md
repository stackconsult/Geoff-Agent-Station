# GitHub Setup Training Workflow for Coding Agents

## Purpose
Systematic training workflow for coding agents to execute GitHub environment setup, CI/CD configuration, and deployment workflows based on production-ready benchmarks.

## Benchmark Analysis Summary

### Top Benchmark Repositories

| Repository | Stars | Key Features | Relevance |
|------------|-------|--------------|-----------|
| **dannysmith/tauri-template** | 238 | AI agent integration, type-safe IPC, three-layer state management, single quality gate | HIGH - Designed for AI agents |
| **suitedaces/computer-agent** | 619 | AI desktop automation, terminal/browser control | HIGH - Similar domain |
| **kimlimjustin/xplorer** | - | File explorer with AI features, Git integration | MEDIUM - File management patterns |
| **adiljouahri/Automaland** | 7 | AI-native automation platform, TriPanel architecture | MEDIUM - Automation patterns |
| **tihiera/raincast** | - | AI-powered app generator, live preview | LOW - App generation patterns |

### Key Patterns from Benchmarks

#### 1. Type-Safe IPC (dannysmith/tauri-template)
```rust
// Pattern: Use tauri-specta for type-safe Rust-TypeScript bridge
#[tauri::command]
pub async fn load_preferences() -> Result<Preferences, String> {
    // Rust implementation
}
```

**Agent Learning:** Always use type-safe IPC. Never use string-based `invoke()`. Generate TypeScript bindings via `npm run rust:bindings`.

#### 2. Three-Layer State Management (dannysmith/tauri-template)
```
Decision Tree:
- Component state (form inputs, local toggles) → useState
- Global UI state (sidebar visibility, dialog state) → Zustand
- Persistent data (user preferences, documents) → TanStack Query
```

**Agent Learning:** Follow this decision tree for all state management decisions.

#### 3. Single Quality Gate (dannysmith/tauri-template)
```bash
npm run check:all  # Runs TypeScript, ESLint, Prettier, ast-grep, clippy, tests
```

**Agent Learning:** Always implement single quality gate command. Run before committing.

#### 4. Security by Default (dannysmith/tauri-template)
- Minimal permissions
- Scoped file system access
- CSP configured
- Type-safe IPC prevents injection attacks

**Agent Learning:** Always use minimal permissions. Never request broader access than needed.

#### 5. AI-Ready Development (dannysmith/tauri-template)
- Predictable structure (React in `src/`, Rust in `src-tauri/src/`)
- Comprehensive documentation
- Claude Code integration
- Quality gates

**Agent Learning:** Follow predictable file organization. Document architectural decisions.

## Training Workflow

### Phase 1: Pre-Flight Validation (5 min)

**Objective:** Verify repository is ready for GitHub integration

**Steps:**
1. Check git status: `git status` (must be clean)
2. Verify remote configured: `git remote -v` (must have origin)
3. Run local tests: `cargo test && pnpm test:run` (must pass)
4. Run linting: `cargo clippy -- -D warnings` (zero warnings)

**Gate:** All checks must pass before proceeding.

### Phase 2: CI Workflow Update (10 min)

**Objective:** Replace blank.yml with production CI workflow

**Steps:**
1. Read existing local CI workflow: `src-tauri/.github/workflows/ci.yml`
2. Update `.github/workflows/blank.yml` to match production CI
3. Include Rust job (Windows runner, cargo test, clippy)
4. Include Frontend job (Ubuntu runner, tsc, vitest)
5. Add triggers: push to main/master, PRs, workflow_dispatch
6. Add caching for cargo registry and build artifacts

**Verification:**
```bash
git diff .github/workflows/blank.yml
```

### Phase 3: Dependabot Configuration (5 min)

**Objective:** Enable automated dependency updates

**Steps:**
1. Create `.github/dependabot.yml`
2. Configure Cargo ecosystem (src-tauri directory)
3. Configure npm ecosystem (root directory)
4. Set weekly schedule (Monday)
5. Add labels: dependencies, rust, javascript
6. Configure commit message format: `chore(cargo)` or `chore(npm)`

**Verification:**
```bash
git diff .github/dependabot.yml
```

### Phase 4: SSH Deploy Keys (5 min)

**Objective:** Generate and configure SSH keys for deployment

**Steps:**
1. Generate ed25519 key pair locally:
   ```bash
   ssh-keygen -t ed25519 -C "github-deploy-key" -f ~/.ssh/github_deploy_key -N ""
   ```
2. Store private key location: `~/.ssh/github_deploy_key`
3. Read public key: `cat ~/.ssh/github_deploy_key.pub`
4. **CRITICAL:** DO NOT commit private key to repository
5. Document public key for user to add to GitHub

**Verification:**
```bash
ls -la ~/.ssh/github_deploy_key*
```

### Phase 5: Codespaces Configuration (5 min)

**Objective:** Provide consistent development environment

**Steps:**
1. Create `.devcontainer/devcontainer.json`
2. Configure base image: `mcr.microsoft.com/devcontainers/base:ubuntu-22.04`
3. Add Rust feature: `ghcr.io/devcontainers/features/rust:1`
4. Add Node.js feature: `ghcr.io/devcontainers/features/node:1` (version 20)
5. Add VS Code extensions: rust-analyzer, lldb, tauri-vscode
6. Configure post-create command: `cd src-tauri && cargo build && cd .. && pnpm install`

**Verification:**
```bash
git diff .devcontainer/devcontainer.json
```

### Phase 6: GitHub Pages Workflow (5 min)

**Objective:** Enable GitHub Pages deployment

**Steps:**
1. Create `.github/workflows/pages.yml`
2. Configure build job (Ubuntu runner, environment: geoffswindowsenv)
3. Add pnpm setup and Node.js 20
4. Add build step: `pnpm build`
5. Add deploy job with permissions: contents:read, pages:write, id-token:write
6. Use `actions/deploy-pages@v4` for deployment
7. Configure triggers: push to main/master, workflow_dispatch

**Verification:**
```bash
git diff .github/workflows/pages.yml
```

### Phase 7: Documentation Creation (10 min)

**Objective:** Create comprehensive setup guide for user

**Steps:**
1. Create `GITHUB_SETUP_GUIDE.md`
2. Document environment configuration steps
3. Document Codespaces configuration steps
4. Document Dependabot configuration steps
5. Document SSH key configuration steps
6. Document GitHub Pages configuration steps
7. Include URLs for each GitHub settings page
8. Include variable and secret names with values

**Verification:**
```bash
git diff GITHUB_SETUP_GUIDE.md
```

### Phase 8: Commit and Push (5 min)

**Objective:** Commit all changes and push to GitHub

**Steps:**
1. Stage all configuration files:
   ```bash
   git add .github/workflows/blank.yml .github/dependabot.yml .github/workflows/pages.yml .devcontainer/devcontainer.json GITHUB_SETUP_GUIDE.md
   ```
2. Commit with conventional message:
   ```bash
   git commit -m "feat(github): add CI, Dependabot, Pages, Codespaces, and setup guide"
   ```
3. Push to origin:
   ```bash
   git push origin master
   ```

**Verification:**
```bash
git log --oneline -1
git status
```

### Phase 9: CI Verification (5 min)

**Objective:** Verify CI workflow runs successfully

**Steps:**
1. Navigate to GitHub Actions tab
2. Verify CI workflow triggered
3. Monitor Rust job (Windows runner)
4. Monitor Frontend job (Ubuntu runner)
5. Verify all jobs pass
6. Verify no errors in logs

**Gate:** CI must pass green before proceeding to user configuration.

### Phase 10: User Configuration (Manual - User Action)

**Objective:** User completes GitHub UI configuration

**Steps:**
1. User configures GitHub environment (geoffswindowsenv)
2. User adds environment variables (geoffswindowsenv1)
3. User adds environment secrets (geoffswindowsrepo)
4. User configures Codespaces variables (geoffswindowsrepo1)
5. User configures Dependabot secrets (geoffswindowsrepo2)
6. User adds SSH public key to deploy keys
7. User enables GitHub Pages
8. User configures auto-link references

**Verification:**
- User confirms all configurations complete
- CI workflow runs on next push
- Dependabot creates first PR

## Agent Success Criteria

### Must Complete
- [ ] CI workflow updated to production
- [ ] Dependabot configuration created
- [ ] SSH keys generated locally (not committed)
- [ ] Codespaces configuration created
- [ ] GitHub Pages workflow created
- [ ] Setup documentation created
- [ ] All changes committed and pushed
- [ ] CI workflow runs successfully

### Must NOT Do
- [ ] Commit private SSH keys to repository
- [ ] Commit environment secrets to repository
- [ ] Use blank.yml "Hello, world" workflow
- [ ] Skip quality gates before pushing
- [ ] Commit without conventional message format

## Common Pitfalls and Solutions

### Pitfall 1: Committing Secrets
**Problem:** Agent commits .env file or private keys
**Solution:** Add to GitHub Actions secrets instead. Document in setup guide.

### Pitfall 2: Wrong CI Workflow
**Problem:** Agent keeps blank.yml with "Hello, world!"
**Solution:** Always replace with production CI matching local ci.yml.

### Pitfall 3: Skipping Quality Gates
**Problem:** Agent pushes without running tests
**Solution:** Always run `cargo test && pnpm test:run && cargo clippy -- -D warnings` before pushing.

### Pitfall 4: Wrong Branch Name
**Problem:** Agent pushes to wrong branch
**Solution:** Verify branch with `git branch` before pushing. Use `master` or `main` consistently.

## Next Steps After Training

After agents complete this workflow:

1. **Chunk 1.5:** Build full stack master UI/UX for GitHub Pages
2. **Chunk 1.6:** Create deployment wizard
3. **Chunk 1.3:** Execute G1-G5 runtime smoke tests
4. **Chunk 2.0:** CI pipeline verification (green check)

## References

- Benchmark repos: dannysmith/tauri-template, suitedaces/computer-agent, kimlimjustin/xplorer
- GitHub Actions docs: https://docs.github.com/en/actions
- Dependabot docs: https://docs.github.com/en/code-security/dependabot
- GitHub Pages docs: https://docs.github.com/en/pages
- Codespaces docs: https://docs.github.com/en/codespaces
- Skill file: `.agents/skills/github-integration.md`
