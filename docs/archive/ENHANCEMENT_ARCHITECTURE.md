# Tolaria Enhancement Architecture

## Current State Analysis

### Build Configuration
- **Framework**: Tauri 2.0 (Rust backend + React frontend)
- **Window Size**: 800x600 (fixed)
- **Bundle Targets**: MSI, NSIS
- **Security**: CSP disabled (null)

### Capabilities
- Obsidian vault scanning
- Note search with relevance scoring
- MCP bridge for AI integration
- Git automation hooks
- Image paste handling
- Basic error handling
- localStorage persistence

### Critical Gaps
1. **No Local LLM Integration** - Depends on external MCP server
2. **No Plugin System** - Monolithic architecture
3. **No Machine Adaptation** - Fixed UI regardless of hardware
4. **Manual Path Entry** - High friction for non-coders
5. **No Offline Mode** - Requires external services
6. **No Performance Optimization** - Linear scanning for large vaults
7. **No Adaptive UI** - Doesn't scale with screen size or hardware

## Enhancement Strategy

### Phase 1: Local LLM Integration

**Objective**: Reduce dependency on external services, enable offline operation

**Architecture**:
```
┌─────────────────────────────────────────────────────────┐
│                    Tolaria App                          │
├─────────────────────────────────────────────────────────┤
│  ┌──────────────┐      ┌──────────────┐                 │
│  │   React UI   │◄────►│ Local LLM    │                 │
│  └──────────────┘      │  Bridge      │                 │
│         │              └──────┬───────┘                 │
│         │                     │                          │
│         ▼                     ▼                          │
│  ┌──────────────┐      ┌──────────────┐                 │
│  │   Tauri      │◄────►│   Ollama/    │                 │
│  │   Backend    │      │   LM Studio  │                 │
│  └──────────────┘      └──────────────┘                 │
└─────────────────────────────────────────────────────────┘
```

**Implementation**:
1. Add Ollama HTTP client to Rust backend
2. Create LLM abstraction layer (support multiple providers)
3. Implement local model selection UI
4. Add model download/management interface
5. Fallback to cloud API if local unavailable

**Dependencies**:
- `reqwest` (Rust HTTP client)
- `serde_json` (JSON parsing)
- `ollama-rs` (optional Ollama client)

### Phase 2: Plugin System

**Objective**: Enable extensibility without core changes

**Architecture**:
```
┌─────────────────────────────────────────────────────────┐
│                    Plugin Manager                       │
├─────────────────────────────────────────────────────────┤
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐  │
│  │   Vault      │  │   Search     │  │   Export     │  │
│  │   Plugins    │  │   Plugins    │  │   Plugins    │  │
│  └──────────────┘  └──────────────┘  └──────────────┘  │
└─────────────────────────────────────────────────────────┘
```

**Plugin Interface**:
```rust
pub trait Plugin {
    fn name(&self) -> String;
    fn version(&self) -> String;
    fn init(&mut self) -> Result<(), PluginError>;
    fn execute(&self, context: &PluginContext) -> Result<PluginOutput, PluginError>;
}
```

**Built-in Plugins**:
1. **Vault Scanner** - Enhanced scanning with caching
2. **Note Transformer** - Markdown processing
3. **Git Integration** - Advanced Git operations
4. **Export Manager** - Multiple export formats

### Phase 3: Machine Adaptation Layer

**Objective**: Optimize UI and performance based on hardware capabilities

**Detection Layer**:
```rust
pub struct MachineSpecs {
    pub cpu_cores: usize,
    pub total_memory: usize,
    pub available_memory: usize,
    pub disk_space: usize,
    pub gpu_available: bool,
    pub screen_resolution: (u32, u32),
}

pub fn detect_specs() -> MachineSpecs {
    // System information detection
}
```

**Adaptive Strategies**:
1. **Low-end Machines** (<4GB RAM)
   - Simplified UI (no animations)
   - Lazy loading for notes
   - Reduced search index
   - Smaller window size (600x400)

2. **Mid-range Machines** (4-16GB RAM)
   - Standard UI with animations
   - Full search index
   - Background scanning
   - Standard window (800x600)

3. **High-end Machines** (>16GB RAM)
   - Enhanced UI with transitions
   - Pre-loaded search index
   - Parallel scanning
   - Larger window (1200x800)
   - GPU-accelerated features

### Phase 4: Non-Coder UX Enhancements

**Objective**: Zero-friction onboarding and operation

**Enhancements**:

1. **Smart Vault Detection**
   - Auto-detect Obsidian vaults from common locations
   - Recently used vaults quick access
   - Vault health indicators
   - One-click vault switching

2. **Guided Setup Wizard**
   - First-run onboarding
   - Step-by-step configuration
   - Video tutorials (embedded)
   - Progress indicators

3. **Visual Feedback**
   - Real-time scanning progress
   - Note thumbnails
   - Connection status indicators
   - Success/error animations

4. **Natural Language Interface**
   - Chat-based note search
   - Voice commands (optional)
   - AI-powered suggestions
   - Context-aware help

### Phase 5: Performance Optimization

**Caching Strategy**:
```rust
pub struct VaultCache {
    pub metadata: HashMap<String, NoteMetadata>,
    pub content_cache: LruCache<String, String>,
    pub search_index: SearchIndex,
    pub last_updated: SystemTime,
}
```

**Optimizations**:
1. **Incremental Scanning** - Only scan changed files
2. **Search Indexing** - Tantivy-based full-text search
3. **Content Caching** - LRU cache for note content
4. **Parallel Processing** - Multi-threaded scanning
5. **Memory Management** - Adaptive cache sizing

### Phase 6: Plugin Architecture for Machine Adaptation

**Machine Adaptation Plugins**:
```rust
pub trait MachineAdapter {
    fn detect(&self) -> MachineSpecs;
    fn optimize(&self, specs: MachineSpecs) -> OptimizationConfig;
    fn adapt_ui(&self, config: OptimizationConfig) -> UIConfig;
}
```

**Built-in Adapters**:
1. **CPU Adapter** - Optimizes thread pool size
2. **Memory Adapter** - Adjusts cache sizes
3. **GPU Adapter** - Enables GPU acceleration if available
4. **Storage Adapter** - Manages disk-based caching

## Implementation Priority

### Immediate (Week 1)
1. Add machine specs detection
2. Implement adaptive window sizing
3. Add vault auto-detection
4. Create guided setup wizard

### Short-term (Week 2-3)
1. Local LLM integration (Ollama)
2. Plugin system foundation
3. Performance caching layer
4. Enhanced error handling

### Medium-term (Week 4-6)
1. Full plugin ecosystem
2. Natural language search
3. Advanced performance optimization
4. GPU acceleration

### Long-term (Week 7+)
1. Machine learning features
2. Advanced analytics
3. Cloud synchronization
4. Multi-vault support

## Validation Strategy

### Touch Points to Validate
1. **Startup Performance** - <3s cold start
2. **Vault Scanning** - <1s per 1000 notes
3. **Search Latency** - <100ms for 10k notes
4. **Memory Usage** - <500MB baseline
5. **UI Responsiveness** - 60fps animations

### Test Matrix
| Machine Spec | UI Mode | Features | Performance Targets |
|-------------|---------|----------|-------------------|
| Low-end (4GB) | Simplified | Core only | Startup <5s, Scan <2s/1k notes |
| Mid-range (8GB) | Standard | All features | Startup <3s, Scan <1s/1k notes |
| High-end (32GB) | Enhanced | All + GPU | Startup <2s, Scan <0.5s/1k notes |

## Success Metrics

1. **Non-Coder Success Rate** - 95% complete setup without assistance
2. **Performance Score** - All targets met across machine specs
3. **Plugin Ecosystem** - 5+ community plugins within 3 months
4. **Local LLM Adoption** - 80% of users prefer local models
5. **User Satisfaction** - NPS >50
