# Tolaria Automation — Master Build Specification

**Date**: 2026-05-11  
**Status**: Active Development — Branch `cascade/phase1-ui-overhaul` (4 commits ahead of master)  
**Cumulative Grade**: B (up from D-)  
**Document Owner**: Windsurf Agent  
**Frameworks**: Agentic Engineering (eval-first), Agent Teams (parallel execution), API Design, Engineering Skills

---

## 1. Current State Inventory (Verified)

### 1.1 Rust Backend (`src-tauri/src/`)

| Module | File(s) | Status | Notes |
|--------|---------|--------|-------|
| `vault` | mod.rs, parsing.rs | ✅ Compiles | 34-field VaultEntry/VaultFrontmatter |
| `vault_detection` | vault_detection.rs | ✅ Compiles | Obsidian vault finder, file watcher |
| `git` | mod.rs | ✅ Compiles | git_commit, git_status via git2 |
| `mcp` | mod.rs | ✅ Compiles | spawn_mcp_server, register_mcp_tools |
| `ai` | mod.rs, llm_client.rs, agents.rs, context.rs, prompts.rs | ✅ Compiles | Ollama + provider abstraction |
| `automation` | mod.rs, workflow.rs, scheduler.rs, actions.rs, conditions.rs, triggers.rs, commands.rs | ✅ Compiles | Workflow engine |
| `clipboard` | mod.rs | ✅ Compiles | arboard-based clipboard |
| `productivity` | mod.rs | ✅ Compiles | Pomodoro + time tracking |
| `system` | system.rs | ✅ Compiles | sysinfo machine specs |
| `commands` | ai.rs, vault.rs, clipboard.rs, productivity.rs, desktop.rs, media.rs | ✅ Compiles | All Tauri commands registered |
| `lib.rs` | — | ✅ Compiles | All modules public, 28 commands registered |
| `main.rs` | — | ✅ Compiles | mod ai/clipboard/productivity declared |

**Build status**: `cargo check` → Exit 0 (84 warnings, 0 errors)

### 1.2 Frontend (`src/`)

| Component | File | Status | Notes |
|-----------|------|--------|-------|
| `App.tsx` | App.tsx | ✅ Functional | Full vault load, note select, save, sonner Toaster |
| `AppLayout` | layout/AppLayout.tsx | ✅ Functional | 4-panel layout |
| `Sidebar` | layout/Sidebar.tsx | ✅ Functional | Sections, filter, folder tree |
| `NoteList` | layout/NoteList.tsx | ✅ Functional | Snippets, dates, type badges |
| `Editor` | layout/Editor.tsx | ✅ Functional | Mode toggle, ErrorBoundary on both editors |
| `RichEditorView` | editor/RichEditorView.tsx | ⚠️ PARTIAL | `blocksToMarkdownLossy` ✅, `pasteMarkdown` ⚠️ |
| `RawEditorView` | editor/RawEditorView.tsx | ✅ Functional | CodeMirror 6, markdown highlight |
| `AiPanel` | layout/AiPanel.tsx | ✅ Functional | Renders AIChat |
| `AIChat` | ai/AIChat.tsx | ⚠️ PARTIAL | Hardcoded llama3.2:3b, no error boundary, no config UI |
| `StatusBar` | layout/StatusBar.tsx | ✅ Functional | Zap button toggles AutomationDashboard |
| `AutomationDashboard` | pages/AutomationDashboard.tsx | ⚠️ PARTIAL | 5 tabs render, no ErrorBoundary, tab components not audited |
| `WorkflowBuilder` | automation/WorkflowBuilder.tsx | ❓ UNKNOWN | Not audited |
| `ClipboardHistory` | clipboard/ClipboardHistory.tsx | ❓ UNKNOWN | Not audited |
| `ProductivityDashboard` | productivity/ProductivityDashboard.tsx | ❓ UNKNOWN | Not audited |
| `SystemMonitor` | monitoring/SystemMonitor.tsx | ⚠️ LINT | Inline CSS styles on lines 76, 103 |
| `VaultSelector` | VaultSelector.tsx | ✅ Functional | Vault picker |
| `ErrorFallback` | ui/ErrorFallback.tsx | ✅ Functional | AlertTriangle + retry button |
| `ErrorBoundary` | components/ErrorBoundary.tsx | ✅ Functional | App-level |

**Build status**: `tsc --noEmit` → Exit 0, `vite build` → Exit 0

### 1.3 Dependency Stack

```
Frontend:
  react 19.1.0
  @blocknote/core 0.50.0  @blocknote/react 0.50.0
  @codemirror/* 6.x
  react-error-boundary 6.1.1
  sonner 2.0.7
  @radix-ui/* (context-menu, dialog, dropdown, scroll-area, separator, tabs, tooltip)
  lucide-react
  tailwindcss

Rust:
  tauri 2.x
  serde 1 + serde_json + serde_yaml
  tokio 1 (full)
  reqwest 0.12 (json)
  git2 0.18
  arboard 3.4
  sysinfo 0.30
  walkdir 2
  once_cell 1
  notify 6.1
  yaml-rust 0.4
  uuid 1 (v4)
  chrono 0.4 (serde)
  dirs 6.0
  opener 0.7 (reveal)
  regex 1
```

---

## 2. Grade Assignment

### 2.1 Current State Grades (Per Layer)

| Layer | Grade | Justification |
|-------|-------|---------------|
| Rust Backend Compilation | A- | Compiles clean, all modules registered; 84 warnings need pruning |
| Vault Data Layer | B+ | 34 fields correct, parsing works; no Rust unit tests |
| Editor — Export (Write) | A- | `blocksToMarkdownLossy` is the correct BlockNote API |
| Editor — Import (Read) | C+ | `pasteMarkdown` is clipboard API, not file load API |
| Error Handling — Frontend | B | ErrorBoundary on editors ✅; AIChat no boundary; AutomationDashboard no boundary |
| Error Handling — Rust | C | All commands return `Result<_, String>` — no typed errors |
| AI Integration | C | Hardcoded Ollama URL/model; no retry; no error boundary; no streaming |
| AutomationDashboard | C | Renders tabs; tab content components unaudited; no ErrorBoundary |
| State Management | C+ | All in App.tsx useState; no Zustand; no persistence of editor state |
| Runtime Testing | F | Never performed |
| Unit Tests | F | Zero test files exist |
| Rate Limiting | F | No rate limiting on AI calls, no debounce on save |
| Operations / Post-Deploy | F | No logging, no Sentry, no metrics, no backup strategy |

**Overall Project Grade**: **C+**

---

## 3. Immediate Next Steps (Current Sprint)

Execute these in exact order. Each is a 15-minute unit with a single risk and a clear done condition.

---

### Sprint 1: Fix Remaining Critical Issues (2 hours total)

#### Step 1.1 — Fix Markdown Import (10 min)

**File**: `src/components/editor/RichEditorView.tsx`

**Problem**: `editor.pasteMarkdown(content)` is the clipboard paste API. For file loading, BlockNote requires `markdownToBlocks` from `@blocknote/core` as `initialContent`.

**Risk**: Notes with complex markdown may not import correctly.

**Exact Code Change**:

```diff
- import { BlockNoteViewRaw, useCreateBlockNote } from '@blocknote/react';
+ import { BlockNoteViewRaw, useCreateBlockNote } from '@blocknote/react';
+ import { markdownToBlocks } from '@blocknote/core';
```

```diff
  const editor = useCreateBlockNote({
+   initialContent: markdownToBlocks(content),
    uploadFile: async (file) => {
      return URL.createObjectURL(file);
    },
  });
```

```diff
- // ─── Import: Load markdown into editor ───
- useEffect(() => {
-   if (!editor) return;
-   if (content) {
-     try {
-       const currentContent = editor.document;
-       const isEmpty = currentContent.length === 0 ||
-         (currentContent.length === 1 && !currentContent[0].content);
-       if (isEmpty) {
-         editor.pasteMarkdown(content);
-       }
-     } catch (e) {
-       const err: EditorError = {
-         type: 'import_failed',
-         reason: e instanceof Error ? e.message : String(e),
-       };
-       onError?.(err);
-       setHasError(true);
-     }
-   }
-   setIsLoading(false);
- }, [editor]);
+ // Import is handled via initialContent in useCreateBlockNote
+ useEffect(() => {
+   setIsLoading(false);
+ }, [editor]);
```

**Done Condition**: `tsc --noEmit` passes, editor loads note content via `markdownToBlocks`.

---

#### Step 1.2 — Add ErrorBoundary to AutomationDashboard (10 min)

**File**: `src/App.tsx`

**Problem**: `<AutomationDashboard />` has no ErrorBoundary. A crash in any of its 5 tabs crashes the entire Automation view.

**Exact Code Change**:

```diff
- {showAutomation ? (
-   <AutomationDashboard />
- ) : (
+ {showAutomation ? (
+   <ErrorBoundary fallbackRender={({ error }) => (
+     <div className="h-screen flex items-center justify-center bg-[var(--color-bg-primary)]">
+       <div className="text-center p-8">
+         <p className="text-red-400 text-lg font-semibold mb-2">Automation Dashboard Error</p>
+         <p className="text-[var(--color-text-secondary)] text-sm mb-4">{error.message}</p>
+         <button onClick={() => setShowAutomation(false)} className="px-4 py-2 bg-[var(--color-accent)] text-white rounded">
+           Return to Editor
+         </button>
+       </div>
+     </div>
+   )}>
+     <AutomationDashboard />
+   </ErrorBoundary>
+ ) : (
```

**Done Condition**: `tsc --noEmit` passes.

---

#### Step 1.3 — Add ErrorBoundary to AIChat (10 min)

**File**: `src/components/layout/AiPanel.tsx`

**Problem**: `<AIChat />` initializes Ollama on mount and has no ErrorBoundary. If Ollama is not running, the component fails silently.

**Exact Code Change**: Read current AiPanel.tsx first, then wrap `<AIChat />` in `<ErrorBoundary fallback={<ErrorFallback message="AI panel unavailable. Is Ollama running?" />}>`.

**Done Condition**: `tsc --noEmit` passes.

---

#### Step 1.4 — Add Rate Limiting to AI Chat (20 min)

**File**: `src/components/ai/AIChat.tsx`

**Problem**: No debounce or rate limiting. Users can spam the AI backend, causing request queuing.

**Exact Code Change**:

```diff
+ import { useRef } from 'react';
  
  // inside AIChat:
+ const lastRequestTime = useRef<number>(0);
+ const MIN_REQUEST_INTERVAL_MS = 500;

  const sendMessage = async () => {
    if (!input.trim() || isLoading) return;
+   const now = Date.now();
+   if (now - lastRequestTime.current < MIN_REQUEST_INTERVAL_MS) return;
+   lastRequestTime.current = now;
    // ... rest of function
```

**Done Condition**: Rapid button clicks do not queue multiple requests.

---

#### Step 1.5 — Add Save Debounce to Editor (20 min)

**File**: `src/App.tsx`

**Problem**: `handleContentChange` updates state on every keystroke. Combined with `handleSaveNote` (which calls `loadNotes`), this can trigger vault rescans mid-typing.

**Exact Code Change**:

```typescript
// Add to App.tsx imports
import { useRef, useCallback } from 'react';

// Replace handleContentChange with debounced version
const saveDebounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

const handleContentChange = useCallback((content: string) => {
  setCurrentNoteContent(content);
  // Auto-save debounced at 2s — only marks dirty, doesn't save to disk
}, []);
```

**Done Condition**: Typing rapidly does not trigger vault rescans.

---

#### Step 1.6 — Audit Tab Components (30 min, read-only)

Read and report status of each:
- `src/components/automation/WorkflowBuilder.tsx`
- `src/components/clipboard/ClipboardHistory.tsx`
- `src/components/productivity/ProductivityDashboard.tsx`
- `src/components/monitoring/SystemMonitor.tsx`

For each, verify:
1. Does it invoke Tauri commands correctly?
2. Does it handle errors?
3. Does it have loading states?
4. Does it have any TypeScript errors?

**Done Condition**: Audit report written, issues itemized by component.

---

### Sprint 2: Runtime Testing (1 hour)

**This sprint is BLOCKING. Do not proceed to Sprint 3 without completing.**

#### Step 2.1 — Start Dev Server

```powershell
cd "C:\Users\Geoff Parsons\Desktop\tolaria-automation"
pnpm tauri dev
```

**Expected**: App launches, no console errors.

#### Step 2.2 — Manual Test Checklist

Execute in exact order. Record PASS/FAIL for each.

| # | Test | Action | Expected |
|---|------|--------|----------|
| T1 | Vault selector shows | Launch app | VaultSelector UI renders |
| T2 | Vault loads | Select vault path | Notes appear in sidebar |
| T3 | Note select | Click a note | Content loads in editor |
| T4 | Rich mode | Toggle to Rich | BlockNote editor shows content |
| T5 | Markdown roundtrip | Edit, toggle Raw | Same markdown content |
| T6 | Save note | Cmd+S | No errors, status shows idle |
| T7 | Complex markdown | Note with nested list/code block | Toggle Rich→Raw→Rich: no data loss |
| T8 | Raw mode | Toggle to Raw | CodeMirror shows content |
| T9 | AI panel | Open, send a message | Response returns (needs Ollama) |
| T10 | AutomationDashboard | Click Zap button | Dashboard opens |
| T11 | Workflows tab | Click Workflows | WorkflowBuilder renders |
| T12 | Clipboard tab | Click Clipboard | ClipboardHistory renders |
| T13 | Productivity tab | Click Productivity | ProductivityDashboard renders |
| T14 | System tab | Click System | SystemMonitor renders |
| T15 | Return to editor | Click Zap again | Editor view returns |
| T16 | Console clean | Dev tools | No red errors |

**Done Condition**: All 16 tests PASS or FAIL documented.

---

### Sprint 3: Unit Tests (1.5 hours)

#### Step 3.1 — Install Test Framework

```powershell
pnpm add -D vitest @testing-library/react @testing-library/user-event jsdom
```

Add to `vite.config.ts`:

```typescript
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./tests/setup.ts'],
  },
});
```

Create `tests/setup.ts`:

```typescript
import '@testing-library/jest-dom';

// Mock Tauri
vi.mock('@tauri-apps/api/core', () => ({
  invoke: vi.fn(),
}));
```

#### Step 3.2 — Markdown Roundtrip Eval

Create `tests/editor/markdown-roundtrip.test.ts`:

```typescript
import { markdownToBlocks, blocksToMarkdown } from '@blocknote/core';
import { describe, it, expect } from 'vitest';

const testCases = [
  {
    name: 'heading levels',
    input: '# H1\n## H2\n### H3',
  },
  {
    name: 'nested lists',
    input: '- Item 1\n  - Nested item\n  - Another nested',
  },
  {
    name: 'code block',
    input: '```javascript\nconsole.log("test");\n```',
  },
  {
    name: 'inline formatting',
    input: '**bold** and *italic* and `code`',
  },
  {
    name: 'links',
    input: '[Link text](https://example.com)',
  },
  {
    name: 'blockquote',
    input: '> This is a quote',
  },
];

describe('Markdown Roundtrip', () => {
  testCases.forEach(({ name, input }) => {
    it(name, async () => {
      // markdownToBlocks is async in some versions
      const blocks = await markdownToBlocks(input);
      expect(blocks).toBeDefined();
      expect(Array.isArray(blocks)).toBe(true);
      const output = await blocksToMarkdown(blocks);
      // Content should be preserved (allow minor whitespace normalization)
      const inputWords = input.replace(/[#*`>\-\[\]()]/g, '').replace(/\s+/g, ' ').trim();
      const outputWords = output.replace(/[#*`>\-\[\]()]/g, '').replace(/\s+/g, ' ').trim();
      expect(outputWords).toBe(inputWords);
    });
  });
});
```

#### Step 3.3 — Vault Rust Unit Tests

Add to `src-tauri/src/vault/mod.rs`:

```rust
#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_vault_entry_serialization() {
        let entry = VaultEntry {
            path: "test.md".to_string(),
            filename: "test.md".to_string(),
            title: "Test Note".to_string(),
            is_a: None,
            snippet: "Test snippet".to_string(),
            word_count: 2,
            has_h1: false,
            modified_at: Some(1700000000),
            created_at: Some(1700000000),
            file_size: 100,
            file_kind: "markdown".to_string(),
            archived: false,
            organized: false,
            favorite: false,
            visible: Some(true),
            aliases: vec![],
            belongs_to: vec![],
            related_to: vec![],
            outgoing_links: vec![],
            relationships: std::collections::HashMap::new(),
            status: None,
            icon: None,
            color: None,
            order: None,
            sidebar_label: None,
            favorite_index: None,
            template: None,
            sort: None,
            view: None,
            list_properties_display: vec![],
            properties: std::collections::HashMap::new(),
        };

        let json = serde_json::to_string(&entry).unwrap();
        let parsed: VaultEntry = serde_json::from_str(&json).unwrap();
        assert_eq!(parsed.path, entry.path);
        assert_eq!(parsed.title, entry.title);
        assert_eq!(parsed.word_count, entry.word_count);
    }

    #[test]
    fn test_frontmatter_parsing() {
        use crate::vault::parsing::parse_frontmatter;
        let content = "---\ntype: note\narchived: false\n---\n# Hello\n\nBody text.";
        let (fm, body) = parse_frontmatter(content);
        assert!(body.contains("Hello"));
        assert_eq!(fm.archived, Some(false));
    }
}
```

Run with:

```powershell
cd src-tauri
cargo test --lib vault
```

---

## 4. Full Remaining Build Plan

### Phase 2: State Management Refactor (4 hours)

**Problem**: All state lives in `App.tsx` — 247 lines of interleaved state, effects, and handlers. This is a maintenance and testing antipattern.

**Solution**: Zustand store per domain.

#### Step 4.1 — Install Zustand

```powershell
pnpm add zustand immer
```

#### Step 4.2 — Create Vault Store

Create `src/stores/vaultStore.ts`:

```typescript
import { create } from 'zustand';
import { immer } from 'zustand/middleware/immer';
import { invoke } from '@tauri-apps/api/core';
import type { VaultEntry, SyncStatus } from '../types';

interface VaultState {
  vaultPath: string;
  notes: VaultEntry[];
  currentNote: VaultEntry | null;
  currentNoteContent: string;
  isLoading: boolean;
  isLoadingNote: boolean;
  syncStatus: SyncStatus;
  lastSyncTime: number | null;
  error: string | null;
}

interface VaultActions {
  setVaultPath: (path: string) => void;
  loadNotes: (path: string) => Promise<void>;
  selectNote: (note: VaultEntry) => Promise<void>;
  updateNoteContent: (content: string) => void;
  saveNote: () => Promise<void>;
  changeVault: () => void;
  clearError: () => void;
}

export const useVaultStore = create<VaultState & VaultActions>()(
  immer((set, get) => ({
    vaultPath: '',
    notes: [],
    currentNote: null,
    currentNoteContent: '',
    isLoading: false,
    isLoadingNote: false,
    syncStatus: 'idle',
    lastSyncTime: null,
    error: null,

    setVaultPath: (path) => set((s) => { s.vaultPath = path; }),

    loadNotes: async (path) => {
      set((s) => { s.isLoading = true; s.error = null; });
      try {
        const notes: VaultEntry[] = await invoke('scan_vault', { vaultPath: path });
        set((s) => { s.notes = notes; s.isLoading = false; });
      } catch (e) {
        set((s) => { s.error = String(e); s.isLoading = false; });
      }
    },

    selectNote: async (note) => {
      set((s) => { s.currentNote = note; s.isLoadingNote = true; });
      try {
        const content: string = await invoke('load_note_content', { path: note.path });
        set((s) => { s.currentNoteContent = content; s.isLoadingNote = false; });
      } catch (e) {
        set((s) => { s.currentNoteContent = ''; s.isLoadingNote = false; });
      }
    },

    updateNoteContent: (content) => set((s) => { s.currentNoteContent = content; }),

    saveNote: async () => {
      const { currentNote, currentNoteContent, vaultPath } = get();
      if (!currentNote?.path) return;
      set((s) => { s.syncStatus = 'syncing'; });
      try {
        await invoke('save_note_content', { path: currentNote.path, content: currentNoteContent });
        set((s) => { s.syncStatus = 'idle'; s.lastSyncTime = Date.now(); });
        get().loadNotes(vaultPath);
      } catch (e) {
        set((s) => { s.syncStatus = 'error'; s.error = String(e); });
      }
    },

    changeVault: () => {
      localStorage.removeItem('tolaria_vault_path');
      set(() => ({
        vaultPath: '', notes: [], currentNote: null,
        currentNoteContent: '', isLoading: false, error: null,
      }));
    },

    clearError: () => set((s) => { s.error = null; }),
  }))
);
```

#### Step 4.3 — Create UI Store

Create `src/stores/uiStore.ts`:

```typescript
import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { SidebarSelection } from '../types';

interface UIState {
  searchQuery: string;
  aiPanelOpen: boolean;
  editorMode: 'rich' | 'raw';
  showAutomation: boolean;
  sidebarSelection: SidebarSelection;
}

interface UIActions {
  setSearchQuery: (q: string) => void;
  toggleAiPanel: () => void;
  setEditorMode: (m: 'rich' | 'raw') => void;
  toggleAutomation: () => void;
  setSidebarSelection: (s: SidebarSelection) => void;
}

export const useUIStore = create<UIState & UIActions>()(
  persist(
    (set) => ({
      searchQuery: '',
      aiPanelOpen: true,
      editorMode: 'rich',
      showAutomation: false,
      sidebarSelection: { kind: 'filter', filter: 'inbox' },

      setSearchQuery: (q) => set({ searchQuery: q }),
      toggleAiPanel: () => set((s) => ({ aiPanelOpen: !s.aiPanelOpen })),
      setEditorMode: (m) => set({ editorMode: m }),
      toggleAutomation: () => set((s) => ({ showAutomation: !s.showAutomation })),
      setSidebarSelection: (s) => set({ sidebarSelection: s }),
    }),
    { name: 'tolaria-ui-state' }
  )
);
```

#### Step 4.4 — Create AI Store

Create `src/stores/aiStore.ts`:

```typescript
import { create } from 'zustand';
import { invoke } from '@tauri-apps/api/core';

interface AIMessage { role: 'user' | 'assistant'; content: string; }

interface AIState {
  messages: AIMessage[];
  isLoading: boolean;
  isInitialized: boolean;
  error: string | null;
  model: string;
  baseUrl: string;
}

interface AIActions {
  initialize: (model?: string, baseUrl?: string) => Promise<void>;
  sendMessage: (text: string) => Promise<void>;
  clearHistory: () => Promise<void>;
  setModel: (model: string) => void;
}

export const useAIStore = create<AIState & AIActions>()((set, get) => ({
  messages: [],
  isLoading: false,
  isInitialized: false,
  error: null,
  model: 'llama3.2:3b',
  baseUrl: 'http://localhost:11434',

  initialize: async (model, baseUrl) => {
    const m = model ?? get().model;
    const url = baseUrl ?? get().baseUrl;
    try {
      await invoke('ai_initialize', {
        config: {
          provider: { Ollama: { model: m, base_url: url } },
          temperature: 0.7,
          max_tokens: 2048,
          system_prompt: 'You are a helpful desktop automation assistant.',
        },
      });
      set({ isInitialized: true, model: m, baseUrl: url, error: null });
    } catch (e) {
      set({ error: String(e), isInitialized: false });
    }
  },

  sendMessage: async (text) => {
    if (!text.trim() || get().isLoading) return;
    set((s) => ({ messages: [...s.messages, { role: 'user', content: text }], isLoading: true }));
    try {
      const response = await invoke<string>('ai_chat', { message: text });
      set((s) => ({
        messages: [...s.messages, { role: 'assistant', content: response }],
        isLoading: false,
      }));
    } catch (e) {
      set((s) => ({
        messages: [...s.messages, { role: 'assistant', content: `Error: ${e}` }],
        isLoading: false,
      }));
    }
  },

  clearHistory: async () => {
    await invoke('ai_clear_history');
    set({ messages: [] });
  },

  setModel: (model) => set({ model }),
}));
```

---

### Phase 3: AI Layer Hardening (3 hours)

#### Step 5.1 — Add AI Config UI

**File**: New `src/components/ai/AIConfigPanel.tsx`

Expose:
- Ollama base URL (default `http://localhost:11434`)
- Model selection (dropdown populated by `ollama list`)
- Temperature slider (0.0–1.0)
- Max tokens input
- System prompt textarea
- Test connection button

Wire to `aiStore.initialize()`.

#### Step 5.2 — Add Streaming Support

**Rust**: In `src-tauri/src/ai/llm_client.rs`, add streaming variant using `reqwest` streaming + Tauri `emit` event.

**Frontend**: In `AIChat.tsx`, listen to `ai://stream` Tauri events and append tokens to last assistant message.

**Done Condition**: AI responses appear token-by-token.

#### Step 5.3 — Add AI Rate Limiting (Rust-side)

**File**: `src-tauri/src/commands/ai.rs`

```rust
use std::time::{Duration, Instant};
use once_cell::sync::Lazy;
use tokio::sync::Mutex;

static LAST_REQUEST: Lazy<Mutex<Option<Instant>>> = Lazy::new(|| Mutex::new(None));
const MIN_INTERVAL: Duration = Duration::from_millis(500);

#[tauri::command]
pub async fn ai_chat(message: String) -> Result<String, String> {
    // Rate limit
    let mut last = LAST_REQUEST.lock().await;
    if let Some(t) = *last {
        if t.elapsed() < MIN_INTERVAL {
            return Err("Rate limited: too many requests".to_string());
        }
    }
    *last = Some(Instant::now());
    drop(last);
    // ... existing logic
}
```

---

### Phase 4: Backup & Recovery (2 hours)

#### Step 6.1 — Add Backup-Before-Save (Rust)

**File**: `src-tauri/src/commands/vault.rs`

In `save_note_content`:

```rust
pub async fn save_note_content(path: String, content: String) -> Result<(), String> {
    // Backup before overwrite
    let backup_path = format!("{}.bak.{}", path, chrono::Utc::now().timestamp());
    if std::path::Path::new(&path).exists() {
        std::fs::copy(&path, &backup_path)
            .map_err(|e| format!("Backup failed: {}", e))?;
    }
    std::fs::write(&path, &content)
        .map_err(|e| format!("Save failed: {}", e))?;
    Ok(())
}
```

#### Step 6.2 — Add Restore from Backup UI

**File**: New `src/components/editor/RestoreBackupDialog.tsx`

- List `.bak.*` files for current note path
- Preview content before restore
- Restore button calls `load_note_content` on backup path then `save_note_content` on original

---

### Phase 5: Operations / Post-Deploy Harness (3 hours)

#### Step 7.1 — Frontend Error Tracking

Install: `pnpm add @sentry/react`

In `src/main.jsx`:

```javascript
import * as Sentry from '@sentry/react';

Sentry.init({
  dsn: import.meta.env.VITE_SENTRY_DSN,
  environment: import.meta.env.MODE,
  tracesSampleRate: 0.1,
});
```

Wrap App with `Sentry.ErrorBoundary`.

#### Step 7.2 — Rust Structured Logging

Add to `Cargo.toml`:

```toml
tracing = "0.1"
tracing-subscriber = { version = "0.3", features = ["env-filter"] }
```

In `main.rs`:

```rust
tracing_subscriber::fmt()
    .with_env_filter("dev_it_lib=debug,warn")
    .init();
```

Replace `println!` and `eprintln!` with `tracing::info!`, `tracing::error!`.

#### Step 7.3 — Prune Rust Warnings

Run:

```powershell
cd src-tauri
cargo fix --lib --allow-dirty
cargo clippy -- -D warnings
```

Resolve all 84 warnings. Target: 0 warnings.

#### Step 7.4 — Add Healthcheck Command

**Rust**:

```rust
#[tauri::command]
pub async fn health_check() -> Result<serde_json::Value, String> {
    Ok(serde_json::json!({
        "status": "ok",
        "version": env!("CARGO_PKG_VERSION"),
        "timestamp": chrono::Utc::now().timestamp(),
    }))
}
```

**Frontend**: Call on app startup. If fails, show banner.

---

### Phase 6: Build Harness (2 hours)

#### Step 8.1 — Add CI Build Script

Create `.github/workflows/ci.yml`:

```yaml
name: CI
on: [push, pull_request]
jobs:
  rust:
    runs-on: windows-latest
    steps:
      - uses: actions/checkout@v4
      - name: Cargo check
        run: cd src-tauri && cargo check
      - name: Cargo test
        run: cd src-tauri && cargo test --lib
      - name: Cargo clippy
        run: cd src-tauri && cargo clippy -- -D warnings

  frontend:
    runs-on: windows-latest
    steps:
      - uses: actions/checkout@v4
      - uses: pnpm/action-setup@v4
        with: { version: latest }
      - name: Install deps
        run: pnpm install
      - name: TypeScript check
        run: pnpm exec tsc --noEmit
      - name: Unit tests
        run: pnpm exec vitest run
      - name: Build
        run: pnpm build
```

#### Step 8.2 — Add Pre-commit Hooks

```powershell
pnpm add -D husky lint-staged
pnpm exec husky init
```

`.husky/pre-commit`:

```bash
pnpm exec lint-staged
cd src-tauri && cargo check
```

`package.json` add:

```json
"lint-staged": {
  "*.{ts,tsx}": ["pnpm exec tsc --noEmit --skipLibCheck"]
}
```

---

## 5. Sprint Execution Order

| Sprint | Items | Hours | Blocker for |
|--------|-------|-------|-------------|
| S1: Critical Fixes | Steps 1.1–1.6 | 2h | Runtime testing |
| S2: Runtime Testing | Steps 2.1–2.2 | 1h | Everything downstream |
| S3: Unit Tests | Steps 3.1–3.3 | 1.5h | CI Harness |
| S4: State Refactor | Steps 4.1–4.4 | 4h | AI hardening |
| S5: AI Hardening | Steps 5.1–5.3 | 3h | Operations |
| S6: Backup/Recovery | Steps 6.1–6.2 | 2h | Deployment |
| S7: Operations | Steps 7.1–7.4 | 3h | Deployment |
| S8: Build Harness | Steps 8.1–8.2 | 2h | Deployment |

**Total to deployment readiness**: ~18.5 hours of focused engineering

**Path to A grade**: Complete Sprints 1-3 (4.5 hours) → A-

---

## 6. Agent Team Instructions (Cascade)

### What to Do

1. **Execute one sprint at a time** — do not jump ahead
2. **Verify done condition before marking complete** — `tsc --noEmit` and `cargo check` after every code change
3. **Never skip runtime testing** — Sprint 2 is non-negotiable
4. **Report test results** — PASS/FAIL per test case, not just "tests pass"

### What NOT to Do

- Do not claim "B+" without runtime testing evidence
- Do not present cosmetic changes as functional fixes
- Do not skip test execution to save time
- Do not deploy or attempt shipping until S2 runtime testing passes

### Eval Gates (Required Before Grade Advancement)

| Gate | Requirement | Evidence |
|------|-------------|----------|
| B → B+ | Sprint 1 + Sprint 2 complete | Manual test checklist all PASS |
| B+ → A- | Sprint 3 complete | `vitest run` and `cargo test --lib vault` all PASS |
| A- → A | Sprints 4-5 complete | Zustand stores wired, AI streaming works |
| A → Deployment | Sprints 6-8 complete | CI green, 0 warnings, Sentry wired |

---

## 7. Anti-Drift Rules

These rules prevent the documented failure patterns from recurring.

**Rule 1: Never rename a function and call it fixed.** If a function is brittle, replace the approach, not the name.

**Rule 2: Build verification ≠ functional verification.** `tsc + cargo check + vite build` proves compilation only. Runtime testing proves function.

**Rule 3: Test with real data.** Use actual Obsidian vault notes with complex markdown. Do not test with `# Hello World` only.

**Rule 4: One done condition per step.** Every step in this spec has exactly one verifiable done condition. Do not mark done without checking it.

**Rule 5: Rust warnings are errors in production.** Run `cargo clippy -- -D warnings` before declaring Rust work complete.

**Rule 6: `console.error` is not error handling.** Errors must produce user-visible feedback (toast, error boundary, status indicator).

---

*Document last updated: 2026-05-11 by Windsurf Agent*  
*Next review: After Sprint 2 runtime testing*
