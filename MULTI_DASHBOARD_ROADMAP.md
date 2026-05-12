# Multi-Dashboard AI Workspace Roadmap

## Vision
Transform Tolaria from a single-view note-taking app into a **multi-dashboard highly capable AI workspace** with simultaneous panels, advanced AI integration, and seamless workflow automation.

## Current State Analysis

### Existing Components
- **Vault Management**: Full-featured Obsidian vault support
- **AI Integration**: AIChat component with Ollama backend
- **Automation**: WorkflowBuilder with workflow execution
- **Clipboard**: ClipboardHistory with search and favorites
- **Productivity**: ProductivityDashboard with time tracking and Pomodoro
- **System Monitoring**: SystemMonitor with health checks
- **4-Panel Layout**: Sidebar, NoteList, Editor, AiPanel

### Current Limitations
- Single-view architecture (editor OR automation dashboard, not both)
- AI panel is toggleable sidebar, not a full dashboard
- No multi-dashboard simultaneous viewing
- Limited AI context management
- No cross-dashboard data flow

## Phase 1: Foundation (Blocking Items First)

### 1.1 Complete Manual Testing (G2-G5)
- [ ] G2: Vault Selection Test - verify vault detection and loading
- [ ] G3: Note Edit Test - verify note loading and editing
- [ ] G4: Save Test - verify save + backup cleanup
- [ ] G5: AI Offline Test - verify graceful error handling

### 1.2 Verify CI Pipeline
- [ ] Check GitHub Actions status for latest commits
- [ ] Ensure all workflows pass
- [ ] Confirm no deployment blockers

## Phase 2: Multi-Dashboard Architecture

### 2.1 Dashboard Manager System
**Goal**: Enable multiple simultaneous dashboards with independent state

**Components to Create**:
- `DashboardManager` - Central dashboard lifecycle management
- `DashboardRegistry` - Track open dashboards and their state
- `DashboardTabs` - Tab bar for switching between dashboards
- `DashboardSplitView` - Split-pane layout for side-by-side dashboards

**State Management**:
- Extend `uiStore` with dashboard management
- Add `activeDashboard`, `openDashboards`, `dashboardLayouts`
- Support dashboard persistence across sessions

**File Structure**:
```
src/
  components/
    dashboard/
      DashboardManager.tsx
      DashboardTabs.tsx
      DashboardSplitView.tsx
      DashboardRegistry.ts
  stores/
    dashboardStore.ts (new)
```

### 2.2 Enhanced AI Dashboard
**Goal**: Transform AI panel into full-featured AI workspace

**Features**:
- Multiple AI model support (Ollama, OpenAI, Claude, local models)
- Context-aware conversations with vault RAG
- AI agent orchestration for complex tasks
- Streaming responses with markdown rendering
- Chat history with search and export
- AI-powered code execution sandbox
- Multi-turn context preservation

**Components**:
- `AIDashboard` - Full AI workspace interface
- `AIModelSelector` - Switch between AI models
- `AIContextPanel` - View and manage AI context
- `AIAgentManager` - Orchestrate AI agents
- `AIChatHistory` - Persistent chat history
- `AIResponseRenderer` - Enhanced markdown/code rendering

### 2.3 Enhanced Automation Dashboard
**Goal**: Visual workflow builder with real-time execution

**Features**:
- Drag-and-drop workflow builder
- Real-time workflow execution monitoring
- Workflow templates library
- Conditional logic and branching
- Scheduled task management
- Webhook integrations
- Workflow versioning

**Components**:
- `VisualWorkflowBuilder` - Canvas-based workflow designer
- `WorkflowExecutionMonitor` - Real-time execution view
- `WorkflowTemplateLibrary` - Pre-built templates
- `WorkflowScheduler` - Cron-based scheduling UI
- `WorkflowVersionControl` - Version management

### 2.4 Productivity Suite Integration
**Goal**: Seamless productivity tools across dashboards

**Features**:
- Time tracking with project association
- Pomodoro timer with dashboard integration
- Task management with Kanban view
- Calendar integration
- Focus mode with dashboard isolation
- Productivity analytics dashboard

**Components**:
- `TimeTrackerDashboard` - Time tracking interface
- `PomodoroDashboard` - Focus timer dashboard
- `TaskManagerDashboard` - Kanban task board
- `CalendarDashboard` - Calendar view
- `ProductivityAnalytics` - Stats and insights

## Phase 3: Advanced AI Capabilities

### 3.1 Multi-Model AI Support
**Backend Commands**:
- `ai_switch_model` - Switch between AI models
- `ai_list_models` - List available models
- `ai_model_config` - Configure model parameters

**Frontend Integration**:
- Model selector in AI dashboard
- Per-conversation model selection
- Model capability detection
- Fallback model configuration

### 3.2 RAG and Context Management
**Features**:
- Vault-wide semantic search
- Document chunking and embedding
- Context window management
- Relevance scoring
- Source attribution

**Components**:
- `RAGEngine` - Retrieval-augmented generation
- `ContextManager` - Context window management
- `EmbeddingCache` - Cached embeddings
- `SemanticSearch` - Vector similarity search

### 3.3 AI Agent Orchestration
**Features**:
- Specialized AI agents (research, code, writing, analysis)
- Agent chaining and composition
- Tool use for agents (file access, web search, code execution)
- Agent memory and state
- Agent collaboration

**Components**:
- `AgentOrchestrator` - Agent lifecycle management
- `AgentRegistry` - Available agent catalog
- `AgentToolbox` - Tool integration
- `AgentMemory` - Persistent agent state

## Phase 4: Workspace Integration

### 4.1 Cross-Dashboard Data Flow
**Features**:
- Shared state between dashboards
- Event bus for dashboard communication
- Drag-and-drop between dashboards
- Unified search across all dashboards
- Global shortcuts and commands

**Components**:
- `WorkspaceEventBus` - Event system
- `SharedStateProvider` - State sharing
- `UnifiedSearch` - Cross-dashboard search
- `GlobalCommandPalette` - Command interface

### 4.2 Multi-Vault Support
**Features**:
- Multiple vaults simultaneously
- Vault switching without reload
- Cross-vault search
- Vault-specific settings
- Vault templates

**Components**:
- `MultiVaultManager` - Vault lifecycle
- `VaultSwitcher` - Quick vault switcher
- `CrossVaultSearch` - Search across vaults
- `VaultTemplateManager` - Vault templates

### 4.3 Collaboration Features
**Features**:
- Real-time collaboration on notes
- Shared workspaces
- Activity feed
- Comments and discussions
- Version history with diff view

**Components**:
- `CollaborationManager` - Real-time sync
- `ActivityFeed` - Activity timeline
- `CommentSystem` - Comments and discussions
- `VersionHistory` - Diff viewer

## Implementation Priority

### Sprint 1: Foundation (Week 1)
1. Complete G2-G5 manual testing
2. Verify CI pipeline
3. Create DashboardManager system
4. Implement dashboard tabs

### Sprint 2: AI Enhancement (Week 2)
1. Build AIDashboard component
2. Implement multi-model support
3. Add RAG capabilities
4. Create AI agent orchestration

### Sprint 3: Automation & Productivity (Week 3)
1. Enhance WorkflowBuilder to visual builder
2. Add workflow templates
3. Integrate productivity suite
4. Create productivity analytics

### Sprint 4: Workspace Integration (Week 4)
1. Implement cross-dashboard data flow
2. Add multi-vault support
3. Create unified search
4. Add collaboration features

## Success Metrics

- **Dashboard Performance**: <100ms dashboard switch
- **AI Response Time**: <2s for AI responses
- **Workflow Execution**: Real-time monitoring
- **Multi-Vault**: Support 5+ vaults simultaneously
- **Collaboration**: <50ms sync latency

## Technical Considerations

### Performance
- Virtual scrolling for large lists
- Lazy loading dashboard components
- Web Workers for AI processing
- IndexedDB for offline support

### Scalability
- Component lazy loading
- State normalization
- Memoization strategies
- Debounced operations

### Security
- Vault encryption at rest
- API key management
- Permission system
- Audit logging

## Dependencies to Add

```json
{
  "dependencies": {
    "@tiptap/react": "^2.1.0",
    "@tiptap/starter-kit": "^2.1.0",
    "react-split-pane": "^0.1.3",
    "reactflow": "^11.10.0",
    "dnd-kit": "^6.1.0",
    "zustand": "^4.4.0",
    "immer": "^10.0.0"
  }
}
```

## Migration Path

1. **Backward Compatible**: Maintain current single-view mode
2. **Opt-In Multi-Dashboard**: Enable via settings
3. **Progressive Enhancement**: Add features incrementally
4. **Data Migration**: Automatic state migration
5. **Feature Flags**: Gradual rollout

## Testing Strategy

- Unit tests for dashboard components
- Integration tests for cross-dashboard flows
- E2E tests for critical workflows
- Performance benchmarks
- Accessibility testing
