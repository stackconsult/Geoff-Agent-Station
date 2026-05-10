import { useState, useEffect, useCallback } from 'react';
import type { VaultEntry } from '../types';

interface EditorProps {
  currentNote: VaultEntry | null;
  onRevealFile: () => Promise<void>;
  onPaste: (event: React.ClipboardEvent<HTMLTextAreaElement>) => Promise<void>;
  onSave: (path: string, content: string) => Promise<void>;
}

export function Editor({ currentNote, onRevealFile, onPaste, onSave }: EditorProps) {
  const [content, setContent] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (currentNote) {
      loadNoteContent(currentNote.path);
    } else {
      setContent('');
    }
  }, [currentNote?.path]);

  const loadNoteContent = async (path: string) => {
    try {
      const { invoke } = await import('@tauri-apps/api/core');
      const text: string = await invoke('load_note_content', { path });
      setContent(text);
    } catch (error) {
      console.error('Failed to load note:', error);
    }
  };

  const handleSave = useCallback(async () => {
    if (!currentNote || isSaving) return;
    setIsSaving(true);
    try {
      await onSave(currentNote.path, content);
    } finally {
      setIsSaving(false);
    }
  }, [currentNote, content, isSaving, onSave]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 's') {
        e.preventDefault();
        handleSave();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleSave]);

  // Auto-save with debounce (2 seconds after typing stops)
  useEffect(() => {
    if (!currentNote || !content) return;
    
    const timeoutId = setTimeout(() => {
      if (!isSaving) {
        handleSave();
      }
    }, 2000);
    
    return () => clearTimeout(timeoutId);
  }, [content, currentNote?.path]);

  if (!currentNote) {
    return (
      <div className="editor editor-empty">
        <p>Select a note to edit</p>
      </div>
    );
  }

  return (
    <div className="editor">
      <div className="editor-header">
        <h3>{currentNote.title}</h3>
        <div className="editor-actions">
          <button onClick={handleSave} disabled={isSaving}>
            {isSaving ? 'Saving...' : 'Save'}
          </button>
          <button onClick={onRevealFile}>Reveal File</button>
        </div>
      </div>
      <textarea
        value={content}
        onChange={(e) => setContent(e.target.value)}
        onPaste={onPaste}
        placeholder="Start writing..."
      />
    </div>
  );
}

