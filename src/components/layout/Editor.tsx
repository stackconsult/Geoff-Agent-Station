import React from 'react';
import { cn } from '../../lib/utils';
import { Button } from '../ui/Button';
import { Card } from '../ui/Card';
import {
  ChevronRight,
  FileText,
  Edit3,
  Eye,
  MoreVertical,
} from 'lucide-react';

interface EditorProps {
  note?: {
    id: string;
    title: string;
    content: string;
    path?: string[];
  } | null;
  mode?: 'rich' | 'raw';
  onModeChange?: (mode: 'rich' | 'raw') => void;
  className?: string;
}

/**
 * Editor Component
 * 
 * Features:
 * - Breadcrumb navigation
 * - Title editing
 * - Rich/Raw mode toggle
 * - BlockNote integration (placeholder)
 * - CodeMirror fallback (placeholder)
 */
export function Editor({
  note,
  mode = 'rich',
  onModeChange,
  className,
}: EditorProps) {
  if (!note) {
    return (
      <div className={cn("flex flex-col h-full items-center justify-center bg-[var(--color-bg-primary)]", className)}>
        <div className="text-center">
          <FileText className="h-12 w-12 mx-auto text-[var(--color-text-muted)] mb-4" />
          <h3 className="text-lg font-medium text-[var(--color-text-secondary)]">
            Select a note to edit
          </h3>
          <p className="text-sm text-[var(--color-text-muted)] mt-2">
            Or create a new note to get started
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className={cn("flex flex-col h-full bg-[var(--color-bg-primary)]", className)}>
      {/* Breadcrumb & Toolbar */}
      <div className="flex items-center justify-between px-4 py-2 border-b border-[var(--color-border-primary)]">
        {/* Breadcrumb */}
        <nav className="flex items-center gap-1 text-sm">
          {note.path?.map((segment, index) => (
            <React.Fragment key={index}>
              {index > 0 && (
                <ChevronRight className="h-3 w-3 text-[var(--color-text-muted)]" />
              )}
              <span
                className={cn(
                  "px-1.5 py-0.5 rounded",
                  note.path && index === note.path.length - 1
                    ? "text-[var(--color-text-primary)] font-medium"
                    : "text-[var(--color-text-muted)] hover:text-[var(--color-text-secondary)] cursor-pointer"
                )}
              >
                {segment}
              </span>
            </React.Fragment>
          ))}
        </nav>

        {/* Toolbar */}
        <div className="flex items-center gap-1">
          <Button
            variant={mode === 'rich' ? 'secondary' : 'ghost'}
            size="sm"
            onClick={() => onModeChange?.('rich')}
          >
            <Edit3 className="h-4 w-4 mr-1" />
            Rich
          </Button>
          <Button
            variant={mode === 'raw' ? 'secondary' : 'ghost'}
            size="sm"
            onClick={() => onModeChange?.('raw')}
          >
            <Eye className="h-4 w-4 mr-1" />
            Raw
          </Button>
          <Button variant="ghost" size="icon">
            <MoreVertical className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Editor Content */}
      <div className="flex-1 overflow-y-auto p-4">
        {/* Title Input */}
        <input
          type="text"
          value={note.title}
          placeholder="Note title..."
          className="w-full text-2xl font-bold bg-transparent border-none outline-none text-[var(--color-text-primary)] placeholder:text-[var(--color-text-muted)] mb-4"
        />

        {/* Editor Placeholder */}
        <Card className="min-h-[400px] bg-[var(--color-bg-secondary)] border-dashed border-2 border-[var(--color-border-primary)]">
          <div className="flex flex-col items-center justify-center h-full p-8 text-center">
            <Edit3 className="h-8 w-8 text-[var(--color-text-muted)] mb-3" />
            <p className="text-[var(--color-text-secondary)]">
              BlockNote Editor Integration
            </p>
            <p className="text-sm text-[var(--color-text-muted)] mt-1">
              Phase 3: Rich markdown editor with wikilink support
            </p>
          </div>
        </Card>
      </div>
    </div>
  );
}
