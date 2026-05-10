import React, { useCallback } from 'react';
import { cn } from '../../lib/utils';
import { Button } from '../ui/Button';
import {
  ChevronRight,
  FileText,
  Edit3,
  Eye,
  Save,
  Loader2,
} from 'lucide-react';

interface EditorNote {
  id: string;
  title: string;
  content: string;
  path?: string[];
  isLoading?: boolean;
}

interface EditorProps {
  note?: EditorNote | null;
  mode?: 'rich' | 'raw';
  onModeChange?: (mode: 'rich' | 'raw') => void;
  onContentChange?: (content: string) => void;
  onSave?: () => void;
  className?: string;
}

/**
 * Editor Component - FUNCTIONAL VERSION
 * 
 * Actually loads, displays, and saves note content.
 * Uses textarea as minimum viable editor until BlockNote integration.
 */
export function Editor({
  note,
  mode = 'rich',
  onModeChange,
  onContentChange,
  onSave,
  className,
}: EditorProps) {
  const handleContentChange = useCallback((e: React.ChangeEvent<HTMLTextAreaElement>) => {
    onContentChange?.(e.target.value);
  }, [onContentChange]);

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if ((e.metaKey || e.ctrlKey) && e.key === 's') {
      e.preventDefault();
      onSave?.();
    }
  }, [onSave]);

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
        <nav className="flex items-center gap-1 text-sm min-w-0 flex-1 mr-4">
          {note.path?.map((segment, index) => (
            <React.Fragment key={index}>
              {index > 0 && (
                <ChevronRight className="h-3 w-3 text-[var(--color-text-muted)] flex-shrink-0" />
              )}
              <span
                className={cn(
                  "px-1.5 py-0.5 rounded truncate",
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
        <div className="flex items-center gap-1 flex-shrink-0">
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
          <Button 
            variant="default" 
            size="sm"
            onClick={onSave}
            disabled={note.isLoading}
          >
            {note.isLoading ? (
              <Loader2 className="h-4 w-4 mr-1 animate-spin" />
            ) : (
              <Save className="h-4 w-4 mr-1" />
            )}
            Save
          </Button>
        </div>
      </div>

      {/* Editor Content */}
      <div className="flex-1 overflow-hidden flex flex-col">
        {/* Title Input */}
        <div className="px-4 pt-4 pb-2">
          <input
            type="text"
            value={note.title}
            readOnly
            placeholder="Note title..."
            className="w-full text-2xl font-bold bg-transparent border-none outline-none text-[var(--color-text-primary)] placeholder:text-[var(--color-text-muted)]"
          />
        </div>

        {/* Content Textarea - ACTUAL FUNCTIONAL EDITOR */}
        <div className="flex-1 px-4 pb-4 overflow-hidden">
          {note.isLoading ? (
            <div className="flex items-center justify-center h-full">
              <Loader2 className="h-8 w-8 text-[var(--color-accent-primary)] animate-spin" />
              <span className="ml-2 text-[var(--color-text-secondary)]">Loading note...</span>
            </div>
          ) : (
            <textarea
              value={note.content}
              onChange={handleContentChange}
              onKeyDown={handleKeyDown}
              placeholder="Start writing..."
              className={cn(
                "w-full h-full resize-none bg-[var(--color-bg-secondary)] rounded-lg border border-[var(--color-border-primary)]",
                "px-4 py-3 text-[var(--color-text-primary)] text-base leading-relaxed",
                "placeholder:text-[var(--color-text-muted)]",
                "focus:outline-none focus:ring-2 focus:ring-[var(--color-accent-primary)] focus:border-transparent",
                "font-mono" // Monospace for raw markdown editing
              )}
              spellCheck={false}
            />
          )}
        </div>

        {/* Status footer */}
        <div className="px-4 py-1.5 border-t border-[var(--color-border-primary)] text-xs text-[var(--color-text-muted)] flex items-center justify-between">
          <span>{note.content.length} characters</span>
          <span>Cmd+S to save</span>
        </div>
      </div>
    </div>
  );
}
