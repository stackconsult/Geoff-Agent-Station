// ─── Real Tolaria VaultEntry (from refactoringhq/tolaria) ───────────────────
export interface VaultEntry {
  path: string
  filename: string
  title: string
  isA: string | null
  aliases: string[]
  belongsTo: string[]
  relatedTo: string[]
  status: string | null
  archived: boolean
  modifiedAt: number | null
  createdAt: number | null
  fileSize: number
  snippet: string
  wordCount: number
  relationships: Record<string, string[]>
  icon: string | null
  color: string | null
  order: number | null
  sidebarLabel: string | null
  template: string | null
  sort: string | null
  view: string | null
  visible: boolean | null
  organized: boolean
  favorite: boolean
  favoriteIndex: number | null
  listPropertiesDisplay: string[]
  outgoingLinks: string[]
  properties: Record<string, string | number | boolean | null>
  hasH1: boolean
  fileKind?: 'markdown' | 'text' | 'binary'
}

// ─── Real Tolaria Sidebar types ───────────────────────────────────────────────
export type SidebarFilter = 'all' | 'archived' | 'changes' | 'pulse' | 'inbox' | 'favorites'

export type SidebarSelection =
  | { kind: 'filter'; filter: SidebarFilter }
  | { kind: 'sectionGroup'; type: string }
  | { kind: 'folder'; path: string; rootPath?: string }
  | { kind: 'entity'; entry: VaultEntry }
  | { kind: 'view'; filename: string }

export interface FolderNode {
  name: string
  path: string
  children: FolderNode[]
}

// ─── Real Tolaria Git/Sync types ──────────────────────────────────────────────
export type SyncStatus = 'idle' | 'syncing' | 'error' | 'conflict' | 'pull_required'

export interface GitRemoteStatus {
  branch: string
  ahead: number
  behind: number
  hasRemote: boolean
}

export type NoteStatus = 'new' | 'modified' | 'clean' | 'pendingSave' | 'unsaved'

// ─── App-local state (not in upstream Tolaria) ────────────────────────────────
export interface AppState {
  vaultPath: string
  notes: VaultEntry[]
  currentNote: VaultEntry | null
  isLoading: boolean
  error: string | null
}
