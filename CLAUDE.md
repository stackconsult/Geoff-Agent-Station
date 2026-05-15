# Tolaria Automation — CLAUDE.md

## Project Overview
Tauri 2 + React 19 desktop automation platform for knowledge work.
Vault-based note system with AI integration, automation workflows,
and multi-dashboard architecture.

## Quick Reference
- **Build:** pnpm build && cargo build
- **Test:** npx tsc --noEmit && pnpm test:run && cargo test
- **Lint:** cargo clippy -- -D warnings
- **Dev:** pnpm tauri dev

## Spec Files (read in this order)
1. AGENTS.md — Agent rules, failure ledger, architecture constraints
2. .maestro.md — Maestro build specification (tech stack, conventions)
3. ROADMAP_ENRICHED_v4.md — Current sprint status and blockers
4. SMOKE_TESTS.md — Manual verification checklist

## Tech Stack
- Frontend: React 19, Vite 7, TypeScript (strict), Tailwind CSS
- Backend: Tauri 2, Rust (tokio), SQLite
- State: Zustand (3 stores: vault, ui, editor)
- AI: BlockNote editor, CodeMirror 6, Sonner toasts

## Critical Rules
- TypeScript errors = 0 (tsc --noEmit must pass)
- Rust warnings = 0 (cargo clippy -- -D warnings)
- No console.log — use Sonner toast
- No PowerShell -- in strings (use Python scripts instead)

## Current Status
- Build: PASSING
- TypeScript: 0 errors
- Rust tests: 31 passed
- TS tests: 16 passed
- Commit: c24d2ab on master

## Active Workstreams
- Chunk 1.3: G1-G5 Runtime smoke tests (G1 done, G2-G5 pending manual)
- Chunk 2.0: CI pipeline green (needs verification)