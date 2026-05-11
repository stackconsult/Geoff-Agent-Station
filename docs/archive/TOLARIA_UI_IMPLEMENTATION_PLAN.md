# Tolaria UI Implementation Plan

## Source Architecture: refactoringhq/tolaria

Based on the actual Tolaria desktop app from GitHub - a production-ready knowledge management platform with AI integration.

---

## Target UI: Four-Panel Layout

```
┌────────┬─────────────┬─────────────────────────┬────────────┐
│Sidebar │ Note List   │ Editor                  │ Right Panel│
│(250px) │ (300px)     │ (flex-1)                │ (280px)    │
│        │ OR          │                         │ OR         │
│ All    │ Pulse View  │ [Breadcrumb Bar]        │ TOC        │
│ Changes│             │                         │ OR         │
│ Pulse  │ [Search]    │ # My Note               │ AI Agent   │
│ Inbox  │ [Sort/Filt] │                         │            │
│        │             │ Content here...         │ Context    │
│Projects│ Note 1      │ (BlockNote or Raw)      │ Messages   │
│Experim.│ Note 2      │                         │ Actions    │
│Respons.│ Note 3      │                         │ Input      │
│People  │ ...         │                         │            │
│Events  │             │                         │            │
│Topics  │             │                         │            │
├────────┴─────────────┴─────────────────────────┴────────────┤
│ StatusBar: v0.4.2 │ main │ Synced 2m ago │ Vault: ~/Laputa │
└──────────────────────────────────────────────────────────────┘
```

---

## Component Architecture (from real Tolaria)

### 1. Core Layout Components

| Component | File | Purpose |
|-----------|------|---------|
| **App.tsx** | `src/App.tsx` | Root component, 4-panel layout, state flow |
| **Sidebar** | `src/components/Sidebar.tsx` | Left panel: filters, views, folder tree |
| **NoteList** | `src/components/NoteList.tsx` | Center-left: filtered notes, snippets, dates |
| **Editor** | `src/components/Editor.tsx` | Center: BlockNote + breadcrumb + diff/raw toggle |
| **AiPanel** | `src/components/AiPanel.tsx` | Right panel: CLI agent interface |
| **StatusBar** | `src/components/StatusBar.tsx` | Bottom: version, git sync, vault path |

### 2. Editor Components

| Component | File | Purpose |
|-----------|------|---------|
| **SingleEditorView** | `src/components/SingleEditorView.tsx` | BlockNote shell with formatting |
| **RawEditorView** | `src/components/RawEditorView.tsx` | CodeMirror 6 raw markdown |
| **editorSchema** | `src/components/editorSchema.tsx` | Wikilink inline content type |
| **tolariaEditorFormatting** | `src/components/tolariaEditorFormatting.tsx` | Markdown-safe toolbar |

### 3. AI Components

| Component | File | Purpose |
|-----------|------|---------|
| **AiPanel** | `src/components/AiPanel.tsx` | AI agent panel with tool execution |
| **useCliAiAgent** | `src/hooks/useCliAiAgent.ts` | CLI agent session state |
| **aiAgentSession** | `src/lib/aiAgentSession.ts` | Message/session lifecycle |

### 4. Data Hooks

| Hook | File | Purpose |
|------|------|---------|
| **useVaultLoader** | `src/hooks/useVaultLoader.ts` | Vault data loading with Tauri/mock branching |
| **useNoteActions** | `src/hooks/useNoteActions.ts` | Note operations orchestration |
| **useVaultSwitcher** | `src/hooks/useVaultSwitcher.ts` | Multi-vault management |
| **useSettings** | `src/hooks/useSettings.ts` | App settings (theme, language, sync) |

---

## Tech Stack (from real Tolaria)

### Frontend
- **Framework**: React 18 + TypeScript
- **Editor**: BlockNote (rich) + CodeMirror 6 (raw)
- **Styling**: CSS custom properties (semantic theming)
- **State**: Props-down, callbacks-up (no Redux)
- **Command Palette**: Cmd+K with fuzzy search

### Backend (Tauri v2)
- **Rust**: Vault scanning, frontmatter parsing, git operations
- **AI**: CLI agent adapters (Claude, Codex, OpenCode, Pi, Gemini)
- **MCP**: WebSocket bridge (ports 9710, 9711)
- **Cache**: Git-based incremental caching

---

## Implementation Phases

### Phase 1: Foundation (Week 1)

**Goal**: Establish four-panel layout architecture

**Components to Build**:
1. **AppLayout** - Root 4-panel grid layout
2. **Sidebar** - 220-400px resizable left panel
   - Top-level filters (All Notes, Changes, Pulse)
   - Collapsible type-based sections
   - Folder tree with vault root
3. **NoteList** - 220-500px resizable center-left
   - Note snippets with dates
   - Search bar
   - Sort/filter controls
4. **Editor** - Flex-1 center panel
   - Breadcrumb bar
   - BlockNote editor integration
   - Raw/CodeMirror toggle
5. **AiPanel** - 280px right panel (placeholder)
6. **StatusBar** - Bottom bar

**Dependencies**:
```bash
pnpm add blocknote react-codemirror @codemirror/lang-markdown
pnpm add @uiw/react-codemirror
```

### Phase 2: Editor Implementation (Week 2)

**Goal**: Full markdown editor with wikilinks

**Components**:
1. **BlockNote Integration**
   - Custom schema with wikilink inline content
   - Markdown-safe formatting toolbar
   - Slash commands
2. **CodeMirror 6 Raw Editor**
   - Syntax highlighting
   - Line numbers
   - Vim mode (optional)
3. **Wikilink System**
   - `[[Note Title]]` autocomplete
   - Link preprocessing pipeline
   - Navigation on click

### Phase 3: AI Integration (Week 3)

**Goal**: AI agent panel with MCP

**Components**:
1. **AiPanel UI**
   - Agent selection (Claude, Codex, etc.)
   - Message threading
   - Tool action cards
   - Permission mode (Safe/Power User)
2. **MCP Server**
   - 14 tool surface (open_note, create_note, search, etc.)
   - WebSocket bridge (ports 9710, 9711)
   - External CLI integration
3. **Context Builder**
   - Note context snapshots
   - Vault summary for AI

### Phase 4: Advanced Features (Week 4)

**Goal**: Command palette, git integration, polish

**Components**:
1. **Command Palette (Cmd+K)**
   - Fuzzy search all commands
   - Keyboard shortcuts
   - Command registry pattern
2. **Git Integration**
   - Pulse view (git activity feed)
   - Auto-commit
   - Sync status
3. **Settings Panel**
   - Theme (light/dark/system)
   - AI agent selection
   - Sync configuration
4. **Polish**
   - Animations
   - Accessibility
   - Performance

---

## File Structure (Target)

```
src/
├── components/
│   ├── App.tsx                 # Root 4-panel layout
│   ├── Sidebar.tsx             # Left panel
│   ├── NoteList.tsx            # Center-left note list
│   ├── Editor.tsx              # Center editor shell
│   ├── SingleEditorView.tsx    # BlockNote wrapper
│   ├── RawEditorView.tsx       # CodeMirror wrapper
│   ├── AiPanel.tsx             # Right AI panel
│   ├── StatusBar.tsx           # Bottom status
│   ├── CommandPalette.tsx      # Cmd+K interface
│   ├── SettingsPanel.tsx       # Settings UI
│   ├── AddRemoteModal.tsx      # Git remote modal
│   ├── editorSchema.tsx        # BlockNote schema
│   ├── tolariaEditorFormatting.tsx  # Toolbar
│   └── ...
├── hooks/
│   ├── useVaultLoader.ts       # Vault data loading
│   ├── useNoteActions.ts       # Note CRUD
│   ├── useVaultSwitcher.ts     # Multi-vault
│   ├── useSettings.ts          # App settings
│   ├── useCliAiAgent.ts        # AI agent state
│   ├── useCommandRegistry.ts   # Command palette
│   └── ...
├── lib/
│   ├── aiAgentSession.ts       # AI session lifecycle
│   ├── aiAgents.ts             # Agent definitions
│   ├── releaseChannel.ts       # Updater channels
│   └── ...
├── utils/
│   ├── wikilinks.ts            # Wikilink processing
│   ├── ai-context.ts           # AI context builder
│   └── ...
├── types.ts                    # All TypeScript types
├── index.css                   # Semantic CSS variables
├── theme.json                  # Editor typography theme
└── mock-tauri.ts               # Mock data for browser
```

---

## Backend Commands (Tauri)

### Vault Operations
- `scan_vault` - Scan vault files
- `get_note_content` - Read note
- `save_note` - Write note
- `search_notes` - Search vault

### AI & MCP
- `ai_agents::get_available_agents` - List CLI agents
- `ai_agents::run_agent` - Run CLI agent with streaming
- `mcp::spawn_mcp_server` - Start MCP server

### Git
- `git::git_commit` - Auto-commit
- `git::git_status` - Get status
- `git::get_vault_pulse` - Git activity feed

### Settings
- `get_settings` - Load app settings
- `set_settings` - Save app settings

---

## Design Principles (from real Tolaria)

1. **Filesystem as single source of truth**
   - All data in markdown files
   - Cache/state reconstructible

2. **Convention over configuration**
   - Standard fields (type:, status:, url:)
   - Relationship fields with [[wikilinks]]
   - Works out of the box

3. **AI-first knowledge graph**
   - Notes as graph nodes
   - Human + AI readable

4. **Props-down, callbacks-up**
   - No global state
   - App.tsx owns state

5. **Tauri/Mock branching**
   - Every data call checks `isTauri()`
   - Browser testing with mock data

---

## Success Criteria

### Week 1
- [ ] Four-panel layout renders
- [ ] Sidebar with filters
- [ ] Note list displays vault notes
- [ ] Editor shows note content
- [ ] Status bar visible

### Week 2
- [ ] BlockNote editor functional
- [ ] Wikilink autocomplete
- [ ] Raw/CodeMirror toggle
- [ ] Markdown formatting toolbar

### Week 3
- [ ] AI panel UI
- [ ] MCP server bridge
- [ ] Agent message display
- [ ] Tool action cards

### Week 4
- [ ] Command palette (Cmd+K)
- [ ] Git pulse view
- [ ] Settings panel
- [ ] Theme switching
- [ ] Production build

---

## Resources

- **GitHub**: https://github.com/refactoringhq/tolaria
- **Docs**: https://github.com/refactoringhq/tolaria/tree/main/docs
- **Architecture**: `docs/ARCHITECTURE.md`
- **Getting Started**: `docs/GETTING-STARTED.md`

---

## Immediate Next Steps

1. **Install BlockNote + CodeMirror**
2. **Create AppLayout with 4 panels**
3. **Build Sidebar component**
4. **Integrate BlockNote editor**
5. **Add StatusBar**

**Reference implementation**: Study `refactoringhq/tolaria` source code for exact patterns.

