import React from 'react';
import { cn } from '../../lib/utils';
import { Input } from '../ui/Input';
import { Button } from '../ui/Button';
import { Card, CardContent } from '../ui/Card';
import { Search, Plus, ArrowUpDown } from 'lucide-react';
import type { VaultEntry } from '../../types';

interface NoteListProps {
  notes: VaultEntry[];
  selectedNoteId?: string;
  onSelectNote: (note: VaultEntry) => void;
  onCreateNote?: () => void;
  searchQuery?: string;
  onSearchChange?: (query: string) => void;
  className?: string;
}

/**
 * NoteList Component
 * 
 * Features:
 * - Search bar with icon
 * - Sort/filter controls
 * - Note cards with title, snippet, metadata
 * - Selection state
 */
export function NoteList({
  notes,
  selectedNoteId,
  onSelectNote,
  onCreateNote,
  searchQuery = '',
  onSearchChange,
  className,
}: NoteListProps) {
  return (
    <div className={cn("flex flex-col h-full bg-[var(--color-bg-primary)]", className)}>
      {/* Header with Search */}
      <div className="p-3 border-b border-[var(--color-border-primary)] space-y-2">
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
          <span className="text-xs text-[var(--color-text-muted)]">
            {notes.length} notes
          </span>
          <Button variant="ghost" size="sm" onClick={onCreateNote}>
            <Plus className="h-4 w-4 mr-1" />
            New
          </Button>
        </div>
      </div>

      {/* Note List */}
      <div className="flex-1 overflow-y-auto scrollbar-thin p-2 space-y-1">
        {notes.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-32 text-[var(--color-text-muted)]">
            <p className="text-sm">No notes found</p>
            <p className="text-xs mt-1">Create a new note to get started</p>
          </div>
        ) : (
          notes.map((note) => {
            const isSelected = selectedNoteId === note.id;
            
            return (
              <Card
                key={note.id}
                className={cn(
                  "cursor-pointer transition-colors",
                  isSelected
                    ? "bg-[var(--color-accent-primary)]/10 border-[var(--color-accent-primary)]"
                    : "hover:bg-[var(--color-bg-elevated)] border-transparent"
                )}
                onClick={() => onSelectNote(note)}
              >
                <CardContent className="p-3">
                  <h3 className={cn(
                    "font-medium text-sm truncate",
                    isSelected
                      ? "text-[var(--color-accent-primary)]"
                      : "text-[var(--color-text-primary)]"
                  )}>
                    {note.title}
                  </h3>
                  {note.snippet && (
                    <p className="text-xs text-[var(--color-text-secondary)] mt-1 line-clamp-2">
                      {note.snippet}
                    </p>
                  )}
                  <div className="flex items-center gap-2 mt-2">
                    {note.type && (
                      <span className="text-xs px-1.5 py-0.5 rounded bg-[var(--color-bg-tertiary)] text-[var(--color-text-secondary)]">
                        {note.type}
                      </span>
                    )}
                    <span className="text-xs text-[var(--color-text-muted)]">
                      {note.modifiedAt}
                    </span>
                  </div>
                </CardContent>
              </Card>
            );
          })
        )}
      </div>
    </div>
  );
}
