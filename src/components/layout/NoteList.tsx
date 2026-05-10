import { cn } from '../../lib/utils'
import { Input } from '../ui/Input'
import { Button } from '../ui/Button'
import { Card, CardContent } from '../ui/Card'
import { Search, Plus, ArrowUpDown } from 'lucide-react'
import type { VaultEntry } from '../../types'

interface NoteListProps {
  notes: VaultEntry[]
  selectedNotePath?: string  // uses path as ID, per real Tolaria
  onSelectNote: (note: VaultEntry) => void
  onCreateNote?: () => void
  searchQuery?: string
  onSearchChange?: (query: string) => void
  className?: string
}

function formatDate(ts: number | null): string {
  if (!ts) return ''
  const d = new Date(ts)
  const now = new Date()
  const diffMs = now.getTime() - d.getTime()
  const diffDays = Math.floor(diffMs / 86_400_000)
  if (diffDays === 0) return 'Today'
  if (diffDays === 1) return 'Yesterday'
  if (diffDays < 7) return `${diffDays}d ago`
  return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' })
}

/**
 * NoteList — uses real VaultEntry fields from Tolaria source:
 * - path as unique key (not id)
 * - snippet from vault scan
 * - modifiedAt as unix timestamp → formatted
 * - isA for type badge
 */
export function NoteList({
  notes,
  selectedNotePath,
  onSelectNote,
  onCreateNote,
  searchQuery = '',
  onSearchChange,
  className,
}: NoteListProps) {
  return (
    <div className={cn('flex flex-col h-full bg-[var(--color-bg-primary)]', className)}>
      {/* Header */}
      <div className="p-3 border-b border-[var(--color-border-primary)] space-y-2 flex-shrink-0">
        <div className="flex items-center gap-2">
          <Input
            placeholder="Search notes..."
            value={searchQuery}
            onChange={(e) => onSearchChange?.(e.target.value)}
            icon={<Search className="h-4 w-4" />}
            className="flex-1"
          />
          <Button variant="ghost" size="icon" className="h-9 w-9 flex-shrink-0">
            <ArrowUpDown className="h-4 w-4" />
          </Button>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-xs text-[var(--color-text-muted)]">{notes.length} notes</span>
          <Button variant="ghost" size="sm" onClick={onCreateNote}>
            <Plus className="h-4 w-4 mr-1" />
            New
          </Button>
        </div>
      </div>

      {/* List */}
      <div className="flex-1 overflow-y-auto scrollbar-thin p-2 space-y-1">
        {notes.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-32 text-[var(--color-text-muted)]">
            <p className="text-sm">No notes found</p>
            <p className="text-xs mt-1">Create a note to get started</p>
          </div>
        ) : (
          notes.map((note) => {
            const isSelected = selectedNotePath === note.path
            return (
              <Card
                key={note.path}
                className={cn(
                  'cursor-pointer transition-colors',
                  isSelected
                    ? 'bg-[var(--color-accent-primary)]/10 border-[var(--color-accent-primary)]'
                    : 'hover:bg-[var(--color-bg-elevated)] border-transparent',
                )}
                onClick={() => onSelectNote(note)}
              >
                <CardContent className="p-3">
                  <h3 className={cn(
                    'font-medium text-sm truncate',
                    isSelected ? 'text-[var(--color-accent-primary)]' : 'text-[var(--color-text-primary)]',
                  )}>
                    {note.title}
                  </h3>
                  {note.snippet && (
                    <p className="text-xs text-[var(--color-text-secondary)] mt-1 line-clamp-2">
                      {note.snippet}
                    </p>
                  )}
                  <div className="flex items-center gap-2 mt-2">
                    {note.isA && (
                      <span className="text-xs px-1.5 py-0.5 rounded bg-[var(--color-bg-tertiary)] text-[var(--color-text-secondary)] capitalize">
                        {note.isA}
                      </span>
                    )}
                    <span className="text-xs text-[var(--color-text-muted)] ml-auto">
                      {formatDate(note.modifiedAt)}
                    </span>
                  </div>
                </CardContent>
              </Card>
            )
          })
        )}
      </div>
    </div>
  )
}
