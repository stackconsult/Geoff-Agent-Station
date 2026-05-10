# Optimized Agent-Executable Roadmap - Tolaria Desktop Automation

## Executive Directive
This roadmap breaks all phases into atomic, validated steps that any coding agent can execute successfully. Each step has: preconditions, exact commands, validation criteria, and rollback procedures. No drift, no negligence, no failure.

## Harness Engineering Principles Applied

### Pillar 1: Context Engineering
- Every step references specific files/lines (no "check the config file")
- Every failure adds to failure ledger (this document)
- Every command is exact (no "run the build command")

### Pillar 2: Architectural Constraints
- Type safety gates at every boundary
- No cross-boundary imports without explicit approval
- All Tauri commands must be registered in lib.rs before use

### Pillar 3: Garbage Collection
- Remove unused code after each phase
- Validate no dead code warnings exceed threshold
- Remove placeholder implementations when real implementations added

## Phase 1 Enhancement: Complete Critical Fixes

### Step 1.1: Fix Tauri API Import (Static Import)
**Preconditions:**
- File `src/App.tsx` exists
- File `src/hooks/useImagePaste.ts` exists
- Package `@tauri-apps/api` installed in package.json

**Exact Action:**
```bash
cd "C:\Users\Geoff Parsons\Desktop\tolaria-automation"
```

**File Edit 1: src/App.tsx**
Replace line 19:
```typescript
const { invoke } = await import('@tauri-apps/api/tauri');
```
With:
```typescript
import { invoke } from '@tauri-apps/api/tauri';
```

**File Edit 2: src/hooks/useImagePaste.ts**
Replace line 1:
```typescript
export async function handleImagePaste(vaultPath: string, filename: string, data: Uint8Array) {
```
With:
```typescript
import { invoke } from '@tauri-apps/api/tauri';

export async function handleImagePaste(vaultPath: string, filename: string, data: Uint8Array) {
```

Replace line 3:
```typescript
const { invoke } = await import('@tauri-apps/api/tauri');
```
With:
```typescript
const path = await invoke('save_image', {
```

**Validation Criteria:**
```bash
npm run tauri build
```
MUST: Exit code 0
MUST: No TypeScript errors about @tauri-apps/api/tauri

**Rollback Procedure:**
If validation fails:
```bash
git checkout HEAD -- src/App.tsx src/hooks/useImagePaste.ts
```

**Failure Ledger Entry:**
If static import fails, add: "Always use dynamic import for @tauri-apps/api/tauri due to TypeScript module resolution issue (verified 2025-05-09)"

---

### Step 1.2: Manual Dev Server Verification
**Preconditions:**
- Step 1.1 completed successfully
- No TypeScript errors

**Exact Action:**
```bash
cd "C:\Users\Geoff Parsons\Desktop\tolaria-automation"
npm run tauri dev
```

**Wait:** 30 seconds for dev server to start

**Validation Criteria:**
MUST: Dev server starts without crashing
MUST: App window opens
MUST: No React errors in console
MUST: No "Hooks can only be called inside the body of a function component" error

**Termination:**
After verification, press Ctrl+C to stop dev server

**Rollback Procedure:**
If React hook error appears, revert to dynamic import (Step 1.1 rollback)

**Failure Ledger Entry:**
If dev server crashes on startup, add: "Always verify dev server starts before committing to static imports"

---

### Step 1.3: Manual UI Verification
**Preconditions:**
- Step 1.2 completed successfully
- Dev server is running

**Exact Action:**
1. Observe the opened app window
2. Verify sidebar renders (shows "Tolaria" heading)
3. Verify main editor area renders (shows textarea)
4. Verify "Reveal File" button exists

**Validation Criteria:**
MUST: Sidebar visible
MUST: Editor textarea visible
MUST: "Reveal File" button visible
MUST: No blank/missing UI elements

**Rollback Procedure:**
If UI elements missing:
- Check component imports in App.tsx
- Verify component exports (should be named exports, not default)

**Failure Ledger Entry:**
If UI elements missing, add: "Always verify named exports for components (Editor, SidebarSections, NoteList)"

---

### Step 1.4: TypeScript Type Check
**Preconditions:**
- Step 1.3 completed successfully

**Exact Action:**
```bash
cd "C:\Users\Geoff Parsons\Desktop\tolaria-automation"
npx tsc --noEmit
```

**Validation Criteria:**
MUST: Exit code 0
MUST: No TypeScript errors
MUST: No type errors about @tauri-apps/api/tauri

**Rollback Procedure:**
If type errors appear:
- Fix type mismatches
- Re-run type check
- Commit only when type check passes

**Failure Ledger Entry:**
If type check fails, add: "Never commit code that fails npx tsc --noEmit"

---

### Step 1.5: Remove Unused State Variables
**Preconditions:**
- Step 1.4 completed successfully

**Exact Action:**

**File Edit: src/App.tsx**
Remove line 12:
```typescript
const [currentNote, setCurrentNote] = useState('');
```
Remove line 13:
```typescript
const [currentPath, setCurrentPath] = useState('');
```

**Validation Criteria:**
```bash
npx tsc --noEmit
```
MUST: Exit code 0
MUST: No "unused variable" warnings

**Rollback Procedure:**
If removing breaks functionality, keep variables and mark with underscore prefix

**Failure Ledger Entry:**
If unused variables cause issues, add: "Mark unused state variables with underscore prefix"

---

### Step 1.6: Commit Phase 1 Enhancement
**Preconditions:**
- All previous steps completed successfully
- TypeScript type check passes

**Exact Action:**
```bash
cd "C:\Users\Geoff Parsons\Desktop\tolaria-automation"
git add .
git commit -m "feat: complete Phase 1 critical fixes with validation

- Fixed Tauri API import to use static import
- Verified dev server starts without React errors
- Verified UI renders correctly (sidebar, editor, button)
- TypeScript type check passes (npx tsc --noEmit)
- Removed unused state variables (currentNote, currentPath)

Phase 1 enhancement complete per OPTIMIZED_ROADMAP.md"
```

**Validation Criteria:**
MUST: Git commit succeeds
MUST: Commit message includes all completed steps

**Rollback Procedure:**
If commit fails, check git status and resolve conflicts

**Failure Ledger Entry:**
If commit fails, add: "Always run git status before committing to resolve conflicts"

---

## Phase 2 Build Out: Core Functionality Implementation

### Step 2.1: Add regex Dependency to Cargo.toml
**Preconditions:**
- Phase 1 complete
- File `src-tauri/Cargo.toml` exists

**Exact Action:**

**File Edit: src-tauri/Cargo.toml**
Add to dependencies section:
```toml
regex = "1"
```

**Validation Criteria:**
```bash
cd "C:\Users\Geoff Parsons\Desktop\tolaria-automation\src-tauri"
cargo check
```
MUST: Exit code 0
MUST: No cargo check errors

**Rollback Procedure:**
If regex dependency fails, remove from Cargo.toml and use alternative link extraction

**Failure Ledger Entry:**
If regex dependency fails, add: "Use manual string parsing for link extraction if regex crate unavailable"

---

### Step 2.2: Implement Link Extraction Function
**Preconditions:**
- Step 2.1 completed successfully
- File `src-tauri/src/vault/mod.rs` exists

**Exact Action:**

**File Edit: src-tauri/src/vault/mod.rs**
Add after VaultEntry struct (after line 26):
```rust
fn extract_links(content: &str) -> Vec<String> {
    let re = regex::Regex::new(r"\[\[([^\]]+)\]\]").unwrap();
    re.captures_iter(content)
        .map(|cap| cap[1].to_string())
        .collect()
}
```

**Validation Criteria:**
```bash
cd "C:\Users\Geoff Parsons\Desktop\tolaria-automation\src-tauri"
cargo check
```
MUST: Exit code 0
MUST: No compilation errors

**Rollback Procedure:**
If regex compilation fails, use simpler string matching

**Failure Ledger Entry:**
If regex fails, add: "Use simple string search for [[pattern]] if regex crate unavailable"

---

### Step 2.3: Implement Actual Vault Scanning
**Preconditions:**
- Step 2.2 completed successfully
- File `src-tauri/src/vault/mod.rs` exists
- Dependencies: walkdir, serde_yaml, chrono, yaml-rust already in Cargo.toml

**Exact Action:**

**File Edit: src-tauri/src/vault/mod.rs**
Replace entire scan_vault function (lines 28-31):
```rust
#[tauri::command]
pub async fn scan_vault(vault_path: String) -> Result<Vec<VaultEntry>, String> {
    let vault_path = PathBuf::from(&vault_path);
    
    // Check cache first
    let cache_path = cache::get_cache_path(&vault_path);
    if let Some(cached) = cache::read_cache(&cache_path).await {
        return Ok(cached);
    }
    
    // Scan vault
    let mut entries = Vec::new();
    for entry in walkdir::WalkDir::new(&vault_path)
        .into_iter()
        .filter_map(|e| e.ok())
        .filter(|e| e.path().extension().map(|ext| ext == "md").unwrap_or(false))
    {
        let path = entry.path();
        let content = std::fs::read_to_string(path)
            .map_err(|e| format!("Failed to read file: {}", e))?;
        
        let (frontmatter, _body) = parsing::parse_frontmatter(&content);
        let title = frontmatter.r#type.clone().unwrap_or_else(|| {
            path.file_stem()
                .and_then(|s| s.to_str())
                .unwrap_or("Untitled")
                .to_string()
        });
        
        let links = extract_links(&content);
        
        entries.push(VaultEntry {
            id: path.to_string_lossy().to_string(),
            title,
            path: path.to_path_buf(),
            frontmatter,
            links,
        });
    }
    
    // Write to cache
    cache::write_cache(&cache_path, &entries).await;
    
    Ok(entries)
}
```

**Validation Criteria:**
```bash
cd "C:\Users\Geoff Parsons\Desktop\tolaria-automation\src-tauri"
cargo check
```
MUST: Exit code 0
MUST: No compilation errors
MUST: No unused variable warnings

**Rollback Procedure:**
If compilation fails, revert to placeholder implementation and fix errors iteratively

**Failure Ledger Entry:**
If vault scanning fails, add: "Implement vault scanning incrementally: add file reading first, then parsing, then caching"

---

### Step 2.4: Implement Note Search
**Preconditions:**
- Step 2.3 completed successfully
- File `src-tauri/src/commands/vault.rs` exists

**Exact Action:**

**File Edit: src-tauri/src/commands/vault.rs**
Replace entire search_notes function (lines 4-7):
```rust
#[tauri::command]
pub async fn search_notes(vault_path: String, query: String) -> Result<Vec<String>, String> {
    let vault_path = PathBuf::from(&vault_path);
    let mut results = Vec::new();
    
    for entry in walkdir::WalkDir::new(&vault_path)
        .into_iter()
        .filter_map(|e| e.ok())
        .filter(|e| e.path().extension().map(|ext| ext == "md").unwrap_or(false))
    {
        let path = entry.path();
        let content = std::fs::read_to_string(path)
            .map_err(|e| format!("Failed to read file: {}", e))?;
        
        // Simple relevance scoring
        let score = content.to_lowercase().matches(&query.to_lowercase()).count();
        if score > 0 {
            results.push((path.to_string_lossy().to_string(), score));
        }
    }
    
    // Sort by relevance
    results.sort_by(|a, b| b.1.cmp(&a.1));
    
    Ok(results.into_iter().map(|(path, _)| path).collect())
}
```

**Validation Criteria:**
```bash
cd "C:\Users\Geoff Parsons\Desktop\tolaria-automation\src-tauri"
cargo check
```
MUST: Exit code 0
MUST: No compilation errors

**Rollback Procedure:**
If compilation fails, fix unused variable warnings by prefixing with underscore

**Failure Ledger Entry:**
If search fails, add: "Mark unused search parameters with underscore prefix"

---

### Step 2.5: Add Note Content Loading Command
**Preconditions:**
- Step 2.4 completed successfully
- File `src-tauri/src/commands/vault.rs` exists

**Exact Action:**

**File Edit: src-tauri/src/commands/vault.rs**
Add after update_frontmatter function (after line 23):
```rust
#[tauri::command]
pub async fn get_note_content(path: String) -> Result<String, String> {
    std::fs::read_to_string(&path)
        .map_err(|e| format!("Failed to read file: {}", e))
}
```

**File Edit: src-tauri/src/lib.rs**
Add to invoke_handler array (after line 31):
```rust
commands::vault::get_note_content,
```

**Validation Criteria:**
```bash
cd "C:\Users\Geoff Parsons\Desktop\tolaria-automation\src-tauri"
cargo check
```
MUST: Exit code 0
MUST: No compilation errors
MUST: Command registered in invoke_handler

**Rollback Procedure:**
If command registration fails, verify command is exported from vault.rs

**Failure Ledger Entry:**
If command registration fails, add: "Always add new commands to both the module file AND lib.rs invoke_handler"

---

### Step 2.6: Implement Centralized State Management
**Preconditions:**
- Step 2.5 completed successfully
- File `src/App.tsx` exists

**Exact Action:**

**File Edit: src/App.tsx**
Replace entire AppState interface and component:
```typescript
import { useState } from 'react';
import { Editor } from './components/Editor';
import { SidebarSections } from './components/SidebarSections';
import { NoteList } from './components/NoteList';
import { useAutoGit } from './hooks/useAutoGit';
import { useVaultLoader } from './hooks/useVaultLoader';
import { handleImagePaste } from './hooks/useImagePaste';
import { invoke } from '@tauri-apps/api/tauri';

interface AppState {
  vaultPath: string;
  notes: any[];
  currentNote: string | null;
  isLoading: boolean;
  error: string | null;
}

export default function App() {
  const [state, setState] = useState<AppState>({
    vaultPath: '',
    notes: [],
    currentNote: null,
    isLoading: false,
    error: null
  });

  const loadNotes = async (path: string) => {
    setState(prev => ({ ...prev, isLoading: true, error: null }));
    try {
      const notes = await invoke('scan_vault', { vaultPath: path });
      setState(prev => ({ ...prev, notes, isLoading: false }));
    } catch (error) {
      setState(prev => ({ ...prev, error: String(error), isLoading: false }));
    }
  };

  useVaultLoader(state.vaultPath);
  useAutoGit(state.vaultPath);

  const handleRevealFile = async () => {
    if (state.currentNote) {
      await invoke('reveal_file', { path: state.currentNote });
    }
  };

  const handlePaste = async (event: React.ClipboardEvent<HTMLTextAreaElement>) => {
    const items = event.clipboardData?.items;
    if (!items) return;

    for (const item of Array.from(items)) {
      if (item.type.startsWith('image/')) {
        const file = item.getAsFile();
        if (file) {
          const data = await file.arrayBuffer();
          const filename = file.name;
          await handleImagePaste(state.vaultPath, filename, new Uint8Array(data));
        }
      }
    }
  };

  return (
    <div className="app">
      <div className="integrated-layout">
        <div className="sidebar">
          <h2>Tolaria</h2>
          <SidebarSections />
          <NoteList notes={state.notes} />
        </div>
        <div className="main">
          <Editor
            onRevealFile={handleRevealFile}
            onPaste={handlePaste}
          />
        </div>
      </div>
    </div>
  );
}
```

**Validation Criteria:**
```bash
cd "C:\Users\Geoff Parsons\Desktop\tolaria-automation"
npx tsc --noEmit
```
MUST: Exit code 0
MUST: No TypeScript errors

**Rollback Procedure:**
If TypeScript errors, fix AppState interface and state initialization

**Failure Ledger Entry:**
If state management fails, add: "Always initialize all state fields in useState to avoid undefined errors"

---

### Step 2.7: Commit Phase 2 Build Out
**Preconditions:**
- All Phase 2 steps completed successfully
- TypeScript type check passes

**Exact Action:**
```bash
cd "C:\Users\Geoff Parsons\Desktop\tolaria-automation"
git add .
git commit -m "feat: implement Phase 2 core functionality

- Added regex dependency to Cargo.toml
- Implemented link extraction function with regex
- Implemented actual vault scanning with walkdir, cache, parsing
- Implemented note search with relevance scoring
- Added get_note_content command
- Implemented centralized state management with AppState interface
- Added error handling and loading states

Phase 2 build out complete per OPTIMIZED_ROADMAP.md"
```

**Validation Criteria:**
MUST: Git commit succeeds
MUST: Build compiles successfully

**Rollback Procedure:**
If commit fails, resolve conflicts and retry

**Failure Ledger Entry:**
If commit fails, add: "Always resolve git conflicts before committing"

---

## Phase 3 Next Steps: Quality Assets and Regression Prevention

### Step 3.1: Create Type Definitions File
**Preconditions:**
- Phase 2 complete
- File `src/types/` directory exists or create it

**Exact Action:**
```bash
cd "C:\Users\Geoff Parsons\Desktop\tolaria-automation"
mkdir -p src/types
```

**File Create: src/types/index.ts**
```typescript
export interface VaultEntry {
  id: string;
  title: string;
  path: string;
  frontmatter: VaultFrontmatter;
  links: string[];
}

export interface VaultFrontmatter {
  type?: string;
  tags?: string[];
  created?: string;
  modified?: string;
}

export interface AppState {
  vaultPath: string;
  notes: VaultEntry[];
  currentNote: VaultEntry | null;
  isLoading: boolean;
  error: string | null;
}
```

**Validation Criteria:**
```bash
npx tsc --noEmit
```
MUST: Exit code 0
MUST: No type errors

**Rollback Procedure:**
If type errors, fix interface definitions to match Rust structs

**Failure Ledger Entry:**
If type definitions fail, add: "Always keep TypeScript interfaces in sync with Rust structs"

---

### Step 3.2: Update App.tsx to Use Type Definitions
**Preconditions:**
- Step 3.1 completed successfully
- File `src/App.tsx` exists

**Exact Action:**

**File Edit: src/App.tsx**
Add import after line 7:
```typescript
import type { AppState, VaultEntry } from './types';
```

Replace line 11:
```typescript
  const [state, setState] = useState<AppState>({
```
With:
```typescript
  const [state, setState] = useState<AppState>({
    vaultPath: '',
    notes: [],
    currentNote: null,
    isLoading: false,
    error: null
  });
```

Replace line 26:
```typescript
      const notes = await invoke('scan_vault', { vaultPath: path });
```
With:
```typescript
      const notes: VaultEntry[] = await invoke('scan_vault', { vaultPath: path });
```

**Validation Criteria:**
```bash
npx tsc --noEmit
```
MUST: Exit code 0
MUST: No type errors

**Rollback Procedure:**
If type errors, fix type annotations

**Failure Ledger Entry:**
If type annotations fail, add: "Always use type assertions for Tauri command returns"

---

### Step 3.3: Add Input Validation Module
**Preconditions:**
- Step 3.2 completed successfully
- File `src-tauri/src/validation.rs` exists or create it

**Exact Action:**

**File Create: src-tauri/src/validation.rs**
```rust
use std::path::PathBuf;

pub fn validate_vault_path(path: &str) -> Result<PathBuf, String> {
    let path = PathBuf::from(path);
    
    if !path.exists() {
        return Err("Vault path does not exist".to_string());
    }
    
    if !path.is_dir() {
        return Err("Vault path is not a directory".to_string());
    }
    
    Ok(path)
}

pub fn validate_note_id(id: &str) -> Result<(), String> {
    if id.is_empty() {
        return Err("Note ID cannot be empty".to_string());
    }
    
    if id.contains("..") {
        return Err("Note ID contains invalid path traversal".to_string());
    }
    
    Ok(())
}
```

**File Edit: src-tauri/src/vault/mod.rs**
Add at top after imports:
```rust
use crate::validation::validate_vault_path;
```

Replace scan_vault function signature (line 28):
```rust
pub async fn scan_vault(vault_path: String) -> Result<Vec<VaultEntry>, String> {
```
With:
```rust
pub async fn scan_vault(vault_path: String) -> Result<Vec<VaultEntry>, String> {
    let vault_path = validate_vault_path(&vault_path)?;
```

**File Edit: src-tauri/src/lib.rs**
Add module declaration after line 5:
```rust
mod validation;
```

**Validation Criteria:**
```bash
cd "C:\Users\Geoff Parsons\Desktop\tolaria-automation\src-tauri"
cargo check
```
MUST: Exit code 0
MUST: No compilation errors

**Rollback Procedure:**
If validation module fails, add validation inline to commands

**Failure Ledger Entry:**
If validation module fails, add: "Add validation inline if separate module causes circular dependencies"

---

### Step 3.4: Add Error Boundary Component
**Preconditions:**
- Step 3.3 completed successfully
- File `src/components/ErrorBoundary.tsx` exists or create it

**Exact Action:**

**File Create: src/components/ErrorBoundary.tsx**
```typescript
import React, { Component, ErrorInfo, ReactNode } from 'react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }
  
  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }
  
  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('ErrorBoundary caught an error:', error, errorInfo);
  }
  
  render() {
    if (this.state.hasError) {
      return (
        <div className="error-boundary">
          <h2>Something went wrong</h2>
          <p>{this.state.error?.message}</p>
          <button onClick={() => window.location.reload()}>Reload</button>
        </div>
      );
    }
    
    return this.props.children;
  }
}
```

**File Edit: src/App.tsx**
Add import after line 7:
```typescript
import { ErrorBoundary } from './components/ErrorBoundary';
```

Wrap return statement with ErrorBoundary:
```typescript
  return (
    <ErrorBoundary>
      <div className="app">
        <div className="integrated-layout">
          <div className="sidebar">
            <h2>Tolaria</h2>
            <SidebarSections />
            <NoteList notes={state.notes} />
          </div>
          <div className="main">
            <Editor
              onRevealFile={handleRevealFile}
              onPaste={handlePaste}
            />
          </div>
        </div>
      </div>
    </ErrorBoundary>
  );
```

**Validation Criteria:**
```bash
npx tsc --noEmit
```
MUST: Exit code 0
MUST: No TypeScript errors

**Rollback Procedure:**
If ErrorBoundary fails, remove temporarily and add after debugging

**Failure Ledger Entry:**
If ErrorBoundary fails, add: "Always test ErrorBoundary with intentional errors"

---

### Step 3.5: Add Loading Spinner Component
**Preconditions:**
- Step 3.4 completed successfully
- File `src/components/LoadingSpinner.tsx` exists or create it

**Exact Action:**

**File Create: src/components/LoadingSpinner.tsx**
```typescript
export function LoadingSpinner() {
  return (
    <div className="loading-spinner">
      <div className="spinner"></div>
      <p>Loading...</p>
    </div>
  );
}
```

**File Edit: src/App.tsx**
Add import after line 8:
```typescript
import { LoadingSpinner } from './components/LoadingSpinner';
```

Add loading state display in return statement after ErrorBoundary:
```typescript
  return (
    <ErrorBoundary>
      <div className="app">
        {state.isLoading && <LoadingSpinner />}
        <div className="integrated-layout">
          <div className="sidebar">
            <h2>Tolaria</h2>
            <SidebarSections />
            <NoteList notes={state.notes} />
          </div>
          <div className="main">
            <Editor
              onRevealFile={handleRevealFile}
              onPaste={handlePaste}
            />
          </div>
        </div>
      </div>
    </ErrorBoundary>
  );
```

**Validation Criteria:**
```bash
npx tsc --noEmit
```
MUST: Exit code 0
MUST: No TypeScript errors

**Rollback Procedure:**
If LoadingSpinner fails, use simple text "Loading..." instead

**Failure Ledger Entry:**
If LoadingSpinner fails, add: "Use simple text loading indicator before CSS spinner"

---

### Step 3.6: Add CSS for Loading Spinner
**Preconditions:**
- Step 3.5 completed successfully
- File `src/App.css` exists

**Exact Action:**

**File Edit: src/App.css**
Add at end:
```css
.loading-spinner {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 100vh;
}

.spinner {
  width: 40px;
  height: 40px;
  border: 4px solid #f3f3f3;
  border-top: 4px solid #3498db;
  border-radius: 50%;
  animation: spin 1s linear infinite;
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}
```

**Validation Criteria:**
```bash
npm run build
```
MUST: Exit code 0
MUST: CSS compiles

**Rollback Procedure:**
If CSS fails, remove spinner animation

**Failure Ledger Entry:**
If CSS animation fails, add: "Use simple text indicator before CSS animations"

---

### Step 3.7: Commit Phase 3 Quality Assets
**Preconditions:**
- All Phase 3 steps completed successfully
- TypeScript type check passes

**Exact Action:**
```bash
cd "C:\Users\Geoff Parsons\Desktop\tolaria-automation"
git add .
git commit -m "feat: implement Phase 3 quality assets and regression prevention

- Created centralized type definitions (src/types/index.ts)
- Added input validation module (src-tauri/src/validation.rs)
- Added error boundary component with reload functionality
- Added loading spinner component with CSS animation
- Integrated type definitions into App.tsx
- Integrated error boundary into app root
- Integrated loading spinner with state management
- Added validation to vault scanning

Phase 3 quality assets complete per OPTIMIZED_ROADMAP.md"
```

**Validation Criteria:**
MUST: Git commit succeeds
MUST: Build compiles successfully

**Rollback Procedure:**
If commit fails, resolve conflicts and retry

**Failure Ledger Entry:**
If commit fails, add: "Always resolve git conflicts before committing"

---

## Final Validation Gate

### Step Final: Full Build and Test
**Preconditions:**
- All phases completed successfully
- All commits made

**Exact Action:**
```bash
cd "C:\Users\Geoff Parsons\Desktop\tolaria-automation"
npm run tauri build
```

**Validation Criteria:**
MUST: Exit code 0
MUST: MSI installer created
MUST: NSIS installer created
MUST: No compilation errors
MUST: No TypeScript errors
MUST: No unused code warnings exceeding threshold (acceptable: < 10)

**Final Success Criteria:**
- Application builds successfully
- All critical blocking errors resolved
- Core functionality implemented
- Quality assets in place
- Type safety enforced
- Error handling implemented
- Loading states implemented
- Regression prevention measures in place

**Rollback Procedure:**
If final build fails, identify failing step, revert to last working commit, fix issue, retry from that step

**Failure Ledger Entry:**
If final build fails, add: "Always revert to last working commit before attempting fixes, not accumulate broken changes"

---

## Agent Execution Instructions

### For Any Coding Agent:
1. **Read this entire document first** - no skipping steps
2. **Execute steps sequentially** - do not skip ahead
3. **Validate each step** - run validation criteria before proceeding
4. **On failure, execute rollback** - do not proceed with broken code
5. **Add to failure ledger** - update this document with new failure patterns
6. **Commit after each phase** - do not accumulate uncommitted changes
7. **Report status** - after each phase completion, report success/failure

### Success Metrics:
- All validation criteria pass
- Build compiles without errors
- TypeScript type check passes
- No runtime errors in dev mode
- All features work as specified

### Anti-Patterns:
- Skipping validation steps
- Proceeding with broken code
- Committing without testing
- Ignoring rollback procedures
- Not updating failure ledger
- Skipping ahead to later phases
