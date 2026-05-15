# Tolaria Automation — Agent Harness

## Repository
- Path: c:\Users\Geoff Parsons\Desktop\tolaria-automation
- Remote: https://github.com/stackconsult/Geoff-Agent-Station.git
- Branch: master

## Available Commands
- pnpm build — Vite production build (must pass)
- npx tsc --noEmit — TypeScript check (must be 0 errors)
- pnpm test:run — Vitest test suite (must pass)
- cargo test — Rust test suite (31 tests, must pass)
- cargo clippy -- -D warnings — Rust lint gate (must be 0 warnings)

## Forbidden Operations
- NEVER use PowerShell scripts with -- in strings (causes parsing errors)
- NEVER use cd inside commands (use Cwd parameter instead)
- NEVER call console.log — use Sonner toast instead
- NEVER import from packages/internal directly
- NEVER bypass proper GitHub MCP authentication

## Failure Ledger (Real Errors Fixed)

### TS2300: Duplicate identifier ApiError
- Context: ApiError class conflicted with Zod-inferred ApiError type
- Fix: Renamed class to ApiErrorClass, updated all references

### TS2341: Private property access
- Context: Span properties were private, accessed by OTLPSpanExporter
- Fix: Changed all Span properties to public

### TS2322: Type mismatch in React props
- Context: mode=markdown passed to Editor expecting rich | raw
- Fix: Changed to mode=rich

### TS2345: Argument type mismatch in Zustand store
- Context: string passed to addDashboard expecting DashboardType
- Fix: Changed parameter type from string to DashboardType

### TS2882: CSS module declarations missing
- Context: Imported ./index.css without type declarations
- Fix: Created src/index.css.d.ts

## Architecture Rules

### Rust (src-tauri/src/)
- Every Tauri command: pub async fn — no sync commands
- File writes: backup-before-write via make_bak_path()
- Path construction: std::path::PathBuf only
- Lint gate: cargo clippy -- -D warnings must be 0

### TypeScript (src/)
- React 19 strict mode off, TypeScript strict mode on
- Zustand stores typed with explicit interfaces
- Toast notifications via Sonner (bottom-right)
- No console.log — always use toast()

### Module Boundaries
- src/api/ — HTTP API layer, no direct file system access
- src/stores/ — Zustand state only, no side effects
- src/components/ — React components only, business logic in stores
- src-tauri/src/commands/ — Tauri commands only