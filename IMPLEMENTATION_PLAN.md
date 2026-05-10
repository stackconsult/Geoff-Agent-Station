# Implementation Plan - Tolaria Desktop Automation

## Overview
This plan addresses all critical audit findings with a systematic, repeatable approach focused on quality, maintainability, and regression prevention.

## Architecture Principles
- **Type Safety**: All data structures have strict TypeScript and Rust types
- **Error Handling**: Comprehensive error boundaries and user-friendly messages
- **State Management**: Centralized state with proper React patterns
- **Testing**: Unit tests for Rust modules, integration tests for React components
- **Validation**: Input validation at all boundaries
- **Documentation**: Code comments and API documentation
- **Repeatability**: Standardized patterns for similar operations

## Phase 1: Critical Fixes (Blocking) - Day 1

### 1.1 Fix App.tsx Hook Usage Error
**File**: `src/App.tsx`
**Issue**: useVaultLoader called incorrectly in useEffect
**Solution**: Move hook to component level, use effect for logic only

```typescript
// Before (BROKEN):
useEffect(() => {
  useVaultLoader(vaultPath);
}, [vaultPath]);

// After (FIXED):
useVaultLoader(vaultPath);
```

**Validation**: App renders without React errors
**Test**: Manual dev server verification

### 1.2 Add Missing VaultEntry.links Field
**File**: `src-tauri/src/vault/mod.rs`
**Issue**: useNoteActions expects entry.links but field doesn't exist
**Solution**: Add links field to VaultEntry struct

```rust
#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct VaultEntry {
    pub id: String,
    pub title: String,
    pub path: PathBuf,
    pub frontmatter: VaultFrontmatter,
    pub links: Vec<String>, // NEW FIELD
}
```

**Validation**: TypeScript types match Rust types
**Test**: Compile succeeds, no type errors

### 1.3 Fix TypeScript Type Errors
**File**: `src/hooks/useImagePaste.ts`
**Issue**: Uses String (object) instead of string (primitive)
**Solution**: Change to primitive string type

```typescript
// Before (BROKEN):
export async function handleImagePaste(vaultPath: String, filename: String, data: Uint8Array)

// After (FIXED):
export async function handleImagePaste(vaultPath: string, filename: string, data: Uint8Array)
```

**Validation**: TypeScript compiles without errors
**Test**: tsc --noEmit passes

### 1.4 Replace Direct Tauri API Access
**File**: `src/App.tsx`
**Issue**: Uses window.__TAURI__ directly
**Solution**: Use proper invoke from @tauri-apps/api/tauri

```typescript
// Before (BROKEN):
window.__TAURI__.invoke('reveal_file', { path: currentPath });

// After (FIXED):
import { invoke } from '@tauri-apps/api/tauri';
await invoke('reveal_file', { path: currentPath });
```

**Validation**: App works in production build
**Test: npm run tauri build succeeds

### 1.5 Fix Missing Component Props
**File**: `src/App.tsx`
**Issue**: NoteList expects notes prop but doesn't receive it
**Solution**: Add state for notes and pass to NoteList

```typescript
const [notes, setNotes] = useState<any[]>([]);

// In render:
<NoteList notes={notes} vaultPath={vaultPath} />
```

**Validation**: NoteList renders without errors
**Test**: Manual UI verification

## Phase 2: Core Functionality - Days 2-4

### 2.1 Implement Vault Scanning
**File**: `src-tauri/src/vault/mod.rs`
**Issue**: scan_vault returns empty Vec (placeholder)
**Solution**: Implement actual scanning with walkdir, cache, parsing

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
        
        entries.push(VaultEntry {
            id: path.to_string_lossy().to_string(),
            title,
            path: path.to_path_buf(),
            frontmatter,
            links: vec![], // TODO: Extract links from content
        });
    }
    
    // Write to cache
    cache::write_cache(&cache_path, &entries).await;
    
    Ok(entries)
}
```

**Quality Assets**:
- Unit test for cache hit/miss
- Unit test for markdown file filtering
- Error handling for invalid paths
- Performance test for large vaults

**Validation**:
- Returns actual notes from vault
- Cache works correctly
- No memory leaks
- Handles errors gracefully

### 2.2 Implement Note Search
**File**: `src-tauri/src/commands/vault.rs`
**Issue**: search_notes returns empty Vec (placeholder)
**Solution**: Implement full-text search with relevance scoring

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

**Quality Assets**:
- Test case sensitivity
- Test relevance scoring
- Test empty query handling
- Performance test for large vaults

### 2.3 Implement Note Content Loading
**File**: `src-tauri/src/commands/vault.rs` (new command)
**Issue**: No way to load note content
**Solution**: Add get_note_content command

```rust
#[tauri::command]
pub async fn get_note_content(path: String) -> Result<String, String> {
    std::fs::read_to_string(&path)
        .map_err(|e| format!("Failed to read file: {}", e))
}
```

**Quality Assets**:
- Test file not found
- Test permission errors
- Test encoding handling

### 2.4 Implement Link Extraction
**File**: `src-tauri/src/vault/mod.rs` (new function)
**Issue**: Links field is empty
**Solution**: Extract [[wiki-style]] links from markdown

```rust
fn extract_links(content: &str) -> Vec<String> {
    let re = regex::Regex::new(r"\[\[([^\]]+)\]\]").unwrap();
    re.captures_iter(content)
        .map(|cap| cap[1].to_string())
        .collect()
}
```

**Quality Assets**:
- Test various link formats
- Test nested brackets
- Test escaped brackets

### 2.5 Add State Management
**File**: `src/App.tsx`
**Issue**: No centralized state management
**Solution**: Implement proper React state patterns

```typescript
interface AppState {
  vaultPath: string;
  notes: Note[];
  currentNote: Note | null;
  isLoading: boolean;
  error: string | null;
}

function App() {
  const [state, setState] = useState<AppState>({
    vaultPath: '',
    notes: [],
    currentNote: null,
    isLoading: false,
    error: null
  });
  
  // Load notes when vault path changes
  useEffect(() => {
    if (state.vaultPath) {
      loadNotes(state.vaultPath);
    }
  }, [state.vaultPath]);
}
```

**Quality Assets**:
- TypeScript interfaces for all state
- Error boundary component
- Loading state component
- Error display component

## Phase 3: Quality Assets - Days 5-6

### 3.1 Add Rust Unit Tests
**File**: `src-tauri/src/vault/tests.rs`
**Framework**: Use Rust's built-in test framework

```rust
#[cfg(test)]
mod tests {
    use super::*;
    
    #[test]
    fn test_parse_frontmatter() {
        let content = "---\ntype: test\n---\nbody";
        let (frontmatter, body) = parse_frontmatter(content);
        assert_eq!(frontmatter.r#type, Some("test".to_string()));
        assert_eq!(body, "body");
    }
    
    #[test]
    fn test_extract_links() {
        let content = "Link to [[note1]] and [[note2]]";
        let links = extract_links(content);
        assert_eq!(links.len(), 2);
    }
}
```

### 3.2 Add React Component Tests
**File**: `src/components/Editor.test.tsx`
**Framework**: Vitest + React Testing Library

```typescript
import { render, screen } from '@testing-library/react';
import { Editor } from './Editor';

describe('Editor', () => {
  it('renders textarea', () => {
    render(<Editor />);
    expect(screen.getByRole('textbox')).toBeInTheDocument();
  });
  
  it('handles content changes', () => {
    render(<Editor />);
    const textarea = screen.getByRole('textbox');
    fireEvent.change(textarea, { target: { value: 'test' } });
    expect(textarea).toHaveValue('test');
  });
});
```

### 3.3 Add Type Definitions
**File**: `src/types/index.ts`
**Purpose**: Centralized TypeScript types

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

### 3.4 Add Input Validation
**File**: `src-tauri/src/validation.rs`
**Purpose**: Validate all inputs at Rust boundary

```rust
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

### 3.5 Add Error Boundary
**File**: `src/components/ErrorBoundary.tsx`
**Purpose**: Catch React errors and display user-friendly messages

```typescript
interface Props {
  children: React.ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }
  
  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
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

### 3.6 Add Loading States
**File**: `src/components/LoadingSpinner.tsx`
**Purpose**: Consistent loading UI

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

## Phase 4: Regression Prevention - Day 7

### 4.1 Add Pre-commit Hooks
**File**: `.husky/pre-commit`
**Purpose**: Run tests before commits

```bash
#!/bin/sh
npm run test
npm run type-check
cargo test
```

### 4.2 Add CI/CD Pipeline
**File**: `.github/workflows/ci.yml`
**Purpose**: Automated testing on PRs

```yaml
name: CI
on: [push, pull_request]
jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - name: Install Rust
        uses: actions-rs/toolchain@v1
      - name: Install Node
        uses: actions/setup-node@v3
      - name: Run tests
        run: |
          npm test
          cargo test
      - name: Type check
        run: npm run type-check
```

### 4.3 Add Documentation
**File**: `docs/API.md`
**Purpose**: Document all Tauri commands

```markdown
# Tauri Commands Reference

## Vault Commands

### scan_vault
Scans vault directory for markdown files.

**Parameters**: `vault_path: String`
**Returns**: `Vec<VaultEntry>`
**Errors**: Invalid path, permission denied

### search_notes
Searches notes for query string.

**Parameters**: `vault_path: String, query: String`
**Returns**: `Vec<String>` (note paths)
**Errors**: Invalid vault, search failed
```

### 4.4 Add Code Comments
**Purpose**: Document complex logic
**Standard**: Rust doc comments, JSDoc for TypeScript

```rust
/// Scans the vault directory for markdown files.
/// 
/// This function walks through the vault directory, parses markdown files,
/// extracts frontmatter, and returns a list of VaultEntry objects.
/// 
/// # Arguments
/// * `vault_path` - Path to the vault directory
/// 
/// # Returns
/// * `Ok(Vec<VaultEntry>)` - List of vault entries
/// * `Err(String)` - Error message if scan fails
/// 
/// # Example
/// ```
/// let entries = scan_vault("/path/to/vault").await?;
/// ```
#[tauri::command]
pub async fn scan_vault(vault_path: String) -> Result<Vec<VaultEntry>, String> {
    // Implementation...
}
```

## Quality Gates

### Before Each Phase
- [ ] All tests pass
- [ ] TypeScript compiles without errors
- [ ] Rust compiles without warnings
- [ ] No new lint errors
- [ ] Code review completed

### Before Production Deploy
- [ ] All tests pass in CI
- [ ] Security scan passes
- [ ] Performance benchmarks met
- [ ] Documentation updated
- [ ] Release notes written

## Success Criteria

### Phase 1 Success
- App renders without React errors
- TypeScript compiles without errors
- No runtime errors in dev mode

### Phase 2 Success
- Vault scanning returns actual notes
- Search functionality works
- Note content loads correctly
- State management works properly

### Phase 3 Success
- Test coverage > 80%
- All types are strictly defined
- Error handling works for all edge cases
- Loading states display correctly

### Phase 4 Success
- Pre-commit hooks prevent bad commits
- CI/CD pipeline passes on all PRs
- Documentation is complete
- No regressions in subsequent development

## Risk Mitigation

### Risk: Breaking Changes
**Mitigation**: Version all APIs, document breaking changes, use semantic versioning

### Risk: Performance Issues
**Mitigation**: Performance benchmarks, optimize hot paths, use caching

### Risk: Security Vulnerabilities
**Mitigation**: Regular dependency audits, input validation, least privilege

### Risk: Regression
**Mitigation**: Comprehensive tests, pre-commit hooks, CI/CD pipeline

## Timeline
- **Phase 1**: Day 1 (Critical fixes)
- **Phase 2**: Days 2-4 (Core functionality)
- **Phase 3**: Days 5-6 (Quality assets)
- **Phase 4**: Day 7 (Regression prevention)

## Next Steps
1. Start with Phase 1 fixes immediately
2. Create feature branch for each phase
3. Submit PRs for review after each phase
4. Merge only after quality gates pass
5. Deploy to production after all phases complete
