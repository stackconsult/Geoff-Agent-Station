import { useMemo } from 'react'
import { cn } from '../../lib/utils'
import { Button } from '../ui/Button'
import { Files, GitBranch, Inbox, Activity, Star, Archive, ChevronRight } from 'lucide-react'
import type { VaultEntry, SidebarSelection, SidebarFilter, FolderNode } from '../../types'

interface SidebarProps {
  vaultName?: string
  entries: VaultEntry[]
  selection: SidebarSelection
  onSelect: (selection: SidebarSelection) => void
  folders?: FolderNode[]
  inboxCount?: number
  className?: string
}

const TOP_FILTERS: { filter: SidebarFilter; label: string; icon: React.ComponentType<{ className?: string }> }[] = [
  { filter: 'all',       label: 'All Notes', icon: Files },
  { filter: 'inbox',     label: 'Inbox',     icon: Inbox },
  { filter: 'changes',   label: 'Changes',   icon: GitBranch },
  { filter: 'pulse',     label: 'Pulse',     icon: Activity },
  { filter: 'favorites', label: 'Favorites', icon: Star },
  { filter: 'archived',  label: 'Archived',  icon: Archive },
]

function isFilterActive(selection: SidebarSelection, filter: SidebarFilter): boolean {
  return selection.kind === 'filter' && selection.filter === filter
}

function isSectionActive(selection: SidebarSelection, type: string): boolean {
  return selection.kind === 'sectionGroup' && selection.type === type
}

function FolderItem({
  node,
  selection,
  onSelect,
  depth = 0,
}: {
  node: FolderNode
  selection: SidebarSelection
  onSelect: (s: SidebarSelection) => void
  depth?: number
}) {
  const isActive = selection.kind === 'folder' && selection.path === node.path
  return (
    <li>
      <button
        onClick={() => onSelect({ kind: 'folder', path: node.path })}
        className={cn(
          'w-full flex items-center gap-1.5 px-2 py-1 rounded text-sm text-left',
          'text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] hover:bg-[var(--color-bg-hover)]',
          isActive && 'bg-[var(--color-bg-elevated)] text-[var(--color-text-primary)] font-medium',
        )}
        style={{ paddingLeft: `${8 + depth * 12}px` }}
      >
        <ChevronRight className="h-3 w-3 flex-shrink-0 opacity-50" />
        <span className="truncate">{node.name}</span>
      </button>
      {node.children.length > 0 && (
        <ul>
          {node.children.map((child) => (
            <FolderItem key={child.path} node={child} selection={selection} onSelect={onSelect} depth={depth + 1} />
          ))}
        </ul>
      )}
    </li>
  )
}

/**
 * Sidebar — follows real Tolaria SidebarSelection union type.
 * Top filters map to { kind: 'filter', filter: SidebarFilter }.
 * Type sections map to { kind: 'sectionGroup', type }.
 * Folders map to { kind: 'folder', path }.
 */
export function Sidebar({ vaultName = 'Vault', entries, selection, onSelect, folders, inboxCount, className }: SidebarProps) {
  // Derive distinct types from real VaultEntry.isA (not hardcoded)
  const typeGroups = useMemo(() => {
    const seen = new Set<string>()
    for (const e of entries) {
      if (e.isA && !e.archived) seen.add(e.isA)
    }
    return Array.from(seen).sort()
  }, [entries])

  const inboxBadge = inboxCount && inboxCount > 0 ? inboxCount : null

  return (
    <div className={cn('flex flex-col h-full bg-[var(--color-bg-secondary)]', className)}>
      {/* Vault title bar */}
      <div className="px-4 py-3 border-b border-[var(--color-border-primary)] flex-shrink-0">
        <h2 className="text-sm font-semibold text-[var(--color-text-primary)] truncate">{vaultName}</h2>
      </div>

      <nav className="flex-1 overflow-y-auto scrollbar-thin py-2">
        {/* Top-level filters */}
        <ul className="px-2 space-y-0.5">
          {TOP_FILTERS.map(({ filter, label, icon: Icon }) => (
            <li key={filter}>
              <Button
                variant={isFilterActive(selection, filter) ? 'secondary' : 'ghost'}
                size="sm"
                className="w-full justify-start gap-2 h-8"
                onClick={() => onSelect({ kind: 'filter', filter })}
              >
                <Icon className="h-4 w-4 flex-shrink-0" />
                <span className="flex-1 text-left">{label}</span>
                {filter === 'inbox' && inboxBadge && (
                  <span className="ml-auto text-xs bg-[var(--color-accent-primary)] text-white rounded-full px-1.5 py-0.5 leading-none">
                    {inboxBadge}
                  </span>
                )}
              </Button>
            </li>
          ))}
        </ul>

        {/* Type sections — derived from real vault entries */}
        {typeGroups.length > 0 && (
          <div className="mt-4 px-2">
            <div className="text-xs font-medium text-[var(--color-text-muted)] uppercase tracking-wider px-2 mb-1">
              Types
            </div>
            <ul className="space-y-0.5">
              {typeGroups.map((type) => (
                <li key={type}>
                  <Button
                    variant={isSectionActive(selection, type) ? 'secondary' : 'ghost'}
                    size="sm"
                    className="w-full justify-between h-8"
                    onClick={() => onSelect({ kind: 'sectionGroup', type })}
                  >
                    <span className="capitalize">{type}</span>
                    <ChevronRight className="h-3 w-3 opacity-40" />
                  </Button>
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Folder tree — from real FolderNode[] */}
        {folders && folders.length > 0 && (
          <div className="mt-4 px-2 border-t border-[var(--color-border-primary)] pt-3">
            <div className="text-xs font-medium text-[var(--color-text-muted)] uppercase tracking-wider px-2 mb-1">
              Folders
            </div>
            <ul className="space-y-0.5">
              {folders.map((node) => (
                <FolderItem key={node.path} node={node} selection={selection} onSelect={onSelect} />
              ))}
            </ul>
          </div>
        )}
      </nav>
    </div>
  )
}
