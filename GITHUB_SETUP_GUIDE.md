# GitHub Environment Setup Guide

## Prerequisites
- GitHub repository: stackconsult/Geoff-Agent-Station
- Environment name: geoffswindowsenv
- SSH deploy keys generated locally (stored in ~/.ssh/github_deploy_key)

## Step 1: Configure GitHub Environment

### 1.1 Create Environment
1. Navigate to: https://github.com/stackconsult/Geoff-Agent-Station/settings/environments/new
2. Name: `geoffswindowsenv`
3. Description: `Production deployment environment`
4. Click "Create environment"

### 1.2 Add Environment Variables
1. In the environment settings, click "Add variable"
2. Name: `geoffswindowsenv1`
3. Value: `geoffswindowsenv`
4. Click "Add variable"

### 1.3 Add Environment Secrets
1. In the environment settings, click "Add secret"
2. Name: `geoffswindowsrepo`
3. Value: `geoffswindowsrepo`
4. Click "Add secret"

## Step 2: Configure GitHub Codespaces

### 2.1 Add Codespaces Variables
1. Navigate to: https://github.com/stackconsult/Geoff-Agent-Station/settings/codespaces
2. Click "Add variable"
3. Name: `geoffswindowsrepo1`
4. Value: `geoffswindowsrepo`
5. Click "Add variable"

## Step 3: Configure Dependabot

### 3.1 Add Dependabot Secrets
1. Navigate to: https://github.com/stackconsult/Geoff-Agent-Station/settings/secrets/dependabot
2. Click "Add secret"
3. Name: `geoffswindowsrepo2`
4. Value: `geoffswindowsrepo`
5. Click "Add secret"

## Step 4: Configure SSH Deploy Keys

### 4.1 Add Public Key to GitHub
1. Navigate to: https://github.com/stackconsult/Geoff-Agent-Station/settings/keys
2. Click "New deploy key"
3. Title: `GitHub Pages Deploy Key`
4. Key: Paste contents of `~/.ssh/github_deploy_key.pub`
5. Check "Allow write access"
6. Click "Add deploy key"

### 4.2 Private Key Storage
- Private key is stored locally at: `~/.ssh/github_deploy_key`
- DO NOT commit private key to repository
- Private key will be used by GitHub Actions via environment secret

## Step 5: Configure Auto-Link References

### 5.1 Add Repository Links
1. Navigate to: https://github.com/stackconsult/Geoff-Agent-Station/settings/key_links
2. Add links to related repositories or documentation
3. Configure custom domain (if applicable)

## Step 6: Enable GitHub Pages

### 6.1 Configure Pages Settings
1. Navigate to: https://github.com/stackconsult/Geoff-Agent-Station/settings/pages
2. Source: GitHub Actions
3. Click "Save"

## Step 7: Verify Configuration

### 7.1 Check CI Workflow
1. Navigate to: https://github.com/stackconsult/Geoff-Agent-Station/actions
2. Verify CI workflow runs on push
3. Verify all jobs pass (Rust tests, Frontend tests)

### 7.2 Check Pages Workflow
1. Navigate to: https://github.com/stackconsult/Geoff-Agent-Station/actions
2. Verify Pages workflow runs on push
3. Verify deployment succeeds

## Summary of Configurations

| Component | Variable/Secret Name | Value | Purpose |
|-----------|---------------------|-------|---------|
| Environment (Actions) | geoffswindowsenv1 | geoffswindowsenv | Environment configuration |
| Environment (Actions) | geoffswindowsrepo | geoffswindowsrepo | Agents repo access |
| Codespaces | geoffswindowsrepo1 | geoffswindowsrepo | Codespaces configuration |
| Dependabot | geoffswindowsrepo2 | geoffswindowsrepo | Dependency updates |
| SSH Keys | github_deploy_key.pub | (public key) | GitHub Pages deploy key |
| SSH Keys | github_deploy_key | (private key) | Local storage only |

## Next Steps

After completing all steps:
1. Push changes to main branch
2. Verify CI workflow runs successfully
3. Verify Pages workflow runs successfully
4. Verify GitHub Pages site is deployed
5. Proceed with Chunk 1.5: GitHub Pages Website Development
