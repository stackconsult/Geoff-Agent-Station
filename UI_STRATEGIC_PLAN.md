# Tolaria UI Strategic Engineering Plan

## Executive Vision

Transform Tolaria from a **bare-bones prototype** into a **professional-grade desktop automation platform** that rivals Obsidian, VS Code, and modern productivity tools.

**Target State:** Native desktop app with:
- VS Code-level extensibility
- Obsidian-level knowledge management
- Raycast-level command interface
- Claude-level AI integration

---

## Phase 1: Foundation (Days 1-3) - CRITICAL

### 1.1 Design System Architecture

**Goal:** Establish professional design foundation

**Actions:**
```bash
# Install Tailwind CSS v4 with all plugins
pnpm add -D tailwindcss@next @tailwindcss/forms @tailwindcss/typography @tailwindcss/aspect-ratio

# Install Radix UI primitives (accessibility-first)
pnpm add @radix-ui/react-dialog @radix-ui/react-dropdown-menu @radix-ui/react-tooltip @radix-ui/react-context-menu @radix-ui/react-tabs @radix-ui/react-accordion @radix-ui/react-scroll-area @radix-ui/react-separator @radix-ui/react-slot

# Install animation library
pnpm add framer-motion

# Install icon library
pnpm add lucide-react

# Install state management
pnpm add zustand

# Install command palette
pnpm add cmdk
```

**Create Design Tokens:**
- File: `src/styles/design-tokens.ts`
- Colors (dark/light themes)
- Typography scale
- Spacing system
- Animation timings
- Elevation/shadows

**Create Base Components:**
1. `Button` - All variants (primary, secondary, ghost, danger, icon)
2. `Input` - Text, search, textarea with validation
3. `Card` - Container with elevation
4. `Modal/Dialog` - Accessible overlay
5. `Tooltip` - Contextual help
6. `Toast` - Notification system
7. `Skeleton` - Loading states
8. `Badge` - Status indicators
9. `Avatar` - User/project icons
10. `Separator` - Visual dividers

### 1.2 Layout Architecture Redesign

**Current:** Broken flexbox layout  
**Target:** VS Code-style layout

**Components:**
1. `AppLayout` - Root layout with grid
2. `TitleBar` - Custom window controls
3. `ActivityBar` - Left tool icons
4. `Sidebar` - Collapsible panels
5. `EditorArea` - Tabbed editing
6. `Panel` - Bottom/side panels
7. `StatusBar` - Bottom info bar

**Layout Structure:**
```
┌─────────────────────────────────────────────┐
│ TitleBar (custom controls)                  │
├──────────┬────────────────────────────────┤
│          │  EditorArea (tabs + editor)      │
│ Activity │  ┌───────────────────────────┐   │
│   Bar    │  │ Tab1 │ Tab2 │ Tab3        │   │
│          │  ├───────────────────────────┤   │
│          │  │                           │   │
│          │  │    Markdown Editor        │   │
│          │  │                           │   │
│          │  └───────────────────────────┘   │
├──────────┴────────────────────────────────┤
│ StatusBar (git, vault, auto-save)         │
└─────────────────────────────────────────────┘
```

---

## Phase 2: Core Features (Days 4-7) - HIGH PRIORITY

### 2.1 Command Palette (Cmd+K)

**Purpose:** Quick access to all commands (Raycast-style)

**Features:**
- Fuzzy search
- Recent commands
- Command categories
- Keyboard shortcuts display
- AI command suggestions

**Commands to Include:**
- Open file/note
- Create new note
- Switch vault
- Run workflow
- AI chat
- Settings
- Git commit
- Search notes

### 2.2 File Explorer (Tree View)

**Purpose:** Hierarchical vault navigation

**Features:**
- Collapsible folders
- Drag & drop
- Context menus (new file, delete, rename)
- File icons (seti-ui style)
- Breadcrumb navigation
- Quick filter
- Recent files section

**Obsidian Parity:**
- Graph view toggle
- Canvas view toggle
- Starred files
- Tags view
- Backlinks panel

### 2.3 Rich Markdown Editor

**Purpose:** Replace textarea with professional editor

**Options:**
1. **CodeMirror 6** - Lightweight, fast
2. **Monaco Editor** - VS Code experience
3. **Milkdown** - ProseMirror-based, plugin-rich

**Features:**
- Syntax highlighting
- Live preview split
- Link autocomplete [[ ]]
- Tag autocomplete #
- Command palette integration
- Table editor
- Callout blocks
- Math rendering (KaTeX)
- Code block execution

### 2.4 Settings Panel

**Purpose:** Comprehensive configuration UI

**Sections:**
- General (theme, language, startup)
- Editor (font, line numbers, word wrap)
- Vault (default path, sync)
- AI (models, API keys, prompts)
- Workflows (default triggers)
- Git (auto-commit, remote)
- Keyboard shortcuts
- Plugins (extensions)

---

## Phase 3: MCP & AI Integration (Days 8-12) - CRITICAL

### 3.1 AI Chat Interface

**Purpose:** Conversational AI assistant

**Layout:** Right sidebar or floating panel

**Features:**
- Message threading
- Code block rendering with syntax highlighting
- Copy button on code blocks
- Model switcher (Ollama/Claude/GPT)
- Context awareness (current note)
- Quick actions (summarize, explain, rewrite)
- History persistence
- Token usage display

**Integration:**
- Backend: Ollama via Rust commands
- Backend: Cloud LLM via MCP

### 3.2 MCP Server Manager

**Purpose:** Manage Model Context Protocol servers

**Features:**
- Server list with status indicators
- Connect/disconnect buttons
- Configuration editor
- Tool discovery display
- Permission management
- Logs viewer

### 3.3 Workflow Builder

**Purpose:** Visual automation designer

**Layout:** Canvas-based node editor

**Features:**
- Drag-and-drop nodes
- Connection lines
- Node properties panel
- Trigger configuration
- Action library browser
- Condition builder
- Execution timeline
- Live monitoring

**Nodes:**
- Trigger nodes (file, time, window, hotkey)
- Action nodes (command, notification, AI, file ops)
- Condition nodes (if/else logic)
- Utility nodes (delay, variables)

---

## Phase 4: Productivity Tools (Days 13-17) - MEDIUM PRIORITY

### 4.1 Time Tracking

**Purpose:** Automatic project time tracking

**Features:**
- Start/stop timer
- Project/category selection
- Idle detection
- Reports view
- Daily/weekly summaries
- Export to CSV

### 4.2 Focus Mode

**Purpose:** Distraction-free work environment

**Features:**
- Full screen mode
- Block notifications
- Website blocking
- App usage tracking
- Session goals
- Ambient sounds

### 4.3 Pomodoro Timer

**Purpose:** Built-in productivity timer

**Features:**
- Configurable work/break intervals
- Sound notifications
- Session counter
- Integration with focus mode
- Statistics tracking

### 4.4 Clipboard Manager

**Purpose:** Enhanced clipboard with history

**Features:**
- Unlimited history
- Fuzzy search
- Categories/tags
- Pin favorites
- Image support
- Code snippet detection

---

## Phase 5: Polish & Production (Days 18-21) - REQUIRED

### 5.1 Theme System

**Create:**
- Light theme (default)
- Dark theme (current)
- High contrast theme
- Custom theme editor

**Components:**
- Color token system
- CSS variables
- Theme switcher UI
- Persist selection

### 5.2 Animations & Micro-interactions

**Add:**
- Page transitions (0.2s ease-out)
- Button hover effects
- Loading states
- Toast notifications
- Modal animations
- Sidebar collapse
- Tab switching

### 5.3 Accessibility Audit

**Ensure:**
- WCAG 2.1 AA compliance
- Keyboard navigation
- Screen reader support
- Focus indicators
- Color contrast ratios
- Reduced motion support

### 5.4 Performance Optimization

**Targets:**
- First paint < 1s
- Time to interactive < 2s
- 60fps animations
- Bundle size < 5MB
- Virtualized lists (1000+ notes)

---

## Component Library Structure

```
src/
├── components/
│   ├── ui/                    # Base UI components
│   │   ├── button.tsx
│   │   ├── input.tsx
│   │   ├── card.tsx
│   │   ├── dialog.tsx
│   │   ├── tooltip.tsx
│   │   ├── toast.tsx
│   │   └── ...
│   ├── layout/                # Layout components
│   │   ├── app-layout.tsx
│   │   ├── title-bar.tsx
│   │   ├── activity-bar.tsx
│   │   ├── sidebar.tsx
│   │   ├── editor-area.tsx
│   │   └── status-bar.tsx
│   ├── editor/                # Editor components
│   │   ├── markdown-editor.tsx
│   │   ├── preview-pane.tsx
│   │   ├── toolbar.tsx
│   │   └── link-autocomplete.tsx
│   ├── file-explorer/         # File management
│   │   ├── tree-view.tsx
│   │   ├── file-item.tsx
│   │   ├── context-menu.tsx
│   │   └── breadcrumb.tsx
│   ├── ai/                    # AI features
│   │   ├── chat-panel.tsx
│   │   ├── chat-message.tsx
│   │   ├── model-selector.tsx
│   │   └── prompt-library.tsx
│   ├── workflow/              # Workflow builder
│   │   ├── workflow-canvas.tsx
│   │   ├── node-base.tsx
│   │   ├── trigger-node.tsx
│   │   ├── action-node.tsx
│   │   └── property-panel.tsx
│   ├── command-palette/       # Command interface
│   │   ├── command-palette.tsx
│   │   ├── command-item.tsx
│   │   └── command-groups.tsx
│   └── productivity/          # Productivity tools
│       ├── timer.tsx
│       ├── focus-mode.tsx
│       └── clipboard-history.tsx
├── hooks/
│   ├── use-theme.ts
│   ├── use-command-palette.ts
│   ├── use-workflow.ts
│   └── use-ai-chat.ts
├── stores/
│   ├── theme-store.ts
│   ├── ui-store.ts
│   ├── editor-store.ts
│   └── workflow-store.ts
├── styles/
│   ├── design-tokens.ts
│   ├── globals.css
│   └── animations.css
└── lib/
    ├── utils.ts
    └── cn.ts                  # Tailwind class merging
```

---

## Dependencies Summary

### Core UI
```json
{
  "@radix-ui/react-dialog": "^1.1.0",
  "@radix-ui/react-dropdown-menu": "^2.1.0",
  "@radix-ui/react-tooltip": "^1.1.0",
  "@radix-ui/react-context-menu": "^2.2.0",
  "@radix-ui/react-tabs": "^1.1.0",
  "@radix-ui/react-accordion": "^1.2.0",
  "@radix-ui/react-scroll-area": "^1.1.0",
  "@radix-ui/react-separator": "^1.1.0",
  "@radix-ui/react-slot": "^1.1.0",
  "@radix-ui/react-toast": "^1.2.0"
}
```

### Editor
```json
{
  "@codemirror/lang-markdown": "^6.2.5",
  "@codemirror/theme-one-dark": "^6.1.2",
  "@codemirror/view": "^6.28.0",
  "@codemirror/state": "^6.4.1",
  "@uiw/react-codemirror": "^4.22.0",
  "react-markdown": "^9.0.0",
  "remark-gfm": "^4.0.0",
  "rehype-highlight": "^7.0.0"
}
```

### Animation & Icons
```json
{
  "framer-motion": "^11.2.0",
  "lucide-react": "^0.400.0"
}
```

### State & Utilities
```json
{
  "zustand": "^4.5.0",
  "cmdk": "^0.2.0",
  "class-variance-authority": "^0.7.0",
  "clsx": "^2.1.0",
  "tailwind-merge": "^2.3.0"
}
```

---

## Success Metrics

### Week 1 (Foundation)
- [ ] Design system implemented
- [ ] 10+ base components created
- [ ] New layout architecture working
- [ ] TypeScript strict mode passes

### Week 2 (Core)
- [ ] Command palette functional
- [ ] File explorer with tree view
- [ ] Rich editor replacing textarea
- [ ] Settings panel operational

### Week 3 (AI/MCP)
- [ ] AI chat interface connected to Ollama
- [ ] MCP server manager UI
- [ ] Workflow builder canvas
- [ ] All AI features functional

### Week 4 (Production)
- [ ] Light/dark themes
- [ ] Animations polished
- [ ] Accessibility audit passes
- [ ] Performance targets met

---

## Risk Mitigation

### Risk 1: Editor Performance
**Mitigation:** Use CodeMirror 6 (proven performance)  
**Fallback:** Implement virtualized rendering for large files

### Risk 2: Bundle Size
**Mitigation:** Code splitting, lazy load components  
**Target:** < 5MB initial bundle

### Risk 3: Tauri Integration
**Mitigation:** Test each new command immediately  
**Validation:** Build after each major feature

### Risk 4: Complexity
**Mitigation:** Build incrementally, validate each phase  
**Strategy:** MVP first, polish later

---

## Immediate Next Actions (TODAY)

1. **Install dependencies** (30 min)
   - Tailwind v4
   - Radix UI
   - Framer Motion
   - Lucide

2. **Create design tokens** (1 hour)
   - Color system
   - Typography
   - Spacing

3. **Build first 5 components** (2 hours)
   - Button
   - Input
   - Card
   - Dialog
   - Tooltip

4. **Rebuild AppLayout** (2 hours)
   - VS Code style layout
   - Activity bar
   - Collapsible sidebar

**Total: Day 1 (5.5 hours)**

---

## Conclusion

This plan transforms Tolaria from a **proof-of-concept** into a **production-ready desktop automation platform** in 4 weeks.

**Current baseline:** 482 lines of UI code, barely functional  
**Target baseline:** 5000+ lines of professional UI, fully featured

**Success:** Native desktop app with:
- Professional design system
- VS Code-level functionality
- AI integration at every level
- MCP automation platform
- Extensible plugin system

**Let's execute.**

