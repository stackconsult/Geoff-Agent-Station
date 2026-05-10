import { useState, useEffect, useCallback } from 'react';
import { invoke } from '@tauri-apps/api/core';
import { useAutoGit } from './hooks/useAutoGit';
import { useVaultLoader } from './hooks/useVaultLoader';
import type { AppState, VaultEntry, SidebarSelection, SyncStatus } from './types';
import { ErrorBoundary } from './components/ErrorBoundary';
import { LoadingSpinner } from './components/LoadingSpinner';
import { VaultSelector } from './components/VaultSelector';
import { ErrorDisplay } from './components/ErrorDisplay';
import { AppLayout, Sidebar, NoteList, Editor, AiPanel, StatusBar } from './components/layout';

const VAULT_PATH_KEY = 'tolaria_vault_path';

/**
 * Tolaria App - Four-Panel Layout
 * 
 * ┌────────┬─────────────┬─────────────────────────┬────────────┐
 * │Sidebar │ Note List   │ Editor                  │ Right Panel│
 * │(250px) │ (300px)     │ (flex-1)                │ (280px)    │
 * ├────────┴─────────────┴─────────────────────────┴────────────┤
 * │ StatusBar                                                   │
 * └─────────────────────────────────────────────────────────────┘
 */
export default function App() {
  const [state, setState] = useState<AppState>({
    vaultPath: '',
    notes: [],
    currentNote: null,
    isLoading: false,
    error: null
  });
  
  const [searchQuery, setSearchQuery] = useState('');
  const [aiPanelOpen, setAiPanelOpen] = useState(true);
  const [currentNoteContent, setCurrentNoteContent] = useState('');
  const [isLoadingNote, setIsLoadingNote] = useState(false);
  const [editorMode, setEditorMode] = useState<'rich' | 'raw'>('rich');
  const [lastSyncTime, setLastSyncTime] = useState<number | null>(null);
  const [syncStatus, setSyncStatus] = useState<SyncStatus>('idle');
  // SidebarSelection — real Tolaria union type
  const [sidebarSelection, setSidebarSelection] = useState<SidebarSelection>({ kind: 'filter', filter: 'inbox' });

  const DEFAULT_VAULT_PATH = 'C:\\Users\\Geoff Parsons\\Desktop\\tolaria-automation\\vault';

  // Load vault path from localStorage on mount, fallback to default
  useEffect(() => {
    const savedPath = localStorage.getItem(VAULT_PATH_KEY);
    if (savedPath) {
      setState(prev => ({ ...prev, vaultPath: savedPath }));
    } else {
      localStorage.setItem(VAULT_PATH_KEY, DEFAULT_VAULT_PATH);
      setState(prev => ({ ...prev, vaultPath: DEFAULT_VAULT_PATH }));
    }
  }, []);

  // Save vault path to localStorage when it changes
  useEffect(() => {
    if (state.vaultPath) {
      localStorage.setItem(VAULT_PATH_KEY, state.vaultPath);
    }
  }, [state.vaultPath]);

  // Load notes when vault path is set
  useEffect(() => {
    if (state.vaultPath) {
      loadNotes(state.vaultPath);
    }
  }, [state.vaultPath]);

  const loadNotes = async (path: string) => {
    setState(prev => ({ ...prev, isLoading: true, error: null }));
    try {
      const { invoke } = await import('@tauri-apps/api/core');
      const notes: VaultEntry[] = await invoke('scan_vault', { vaultPath: path });
      setState(prev => ({ ...prev, notes, isLoading: false }));
    } catch (error) {
      setState(prev => ({ ...prev, error: String(error), isLoading: false }));
    }
  };

  useVaultLoader(state.vaultPath);
  useAutoGit(state.vaultPath);

  const handleVaultSelect = (path: string) => {
    setState(prev => ({ ...prev, vaultPath: path }));
  };

  const handleNoteSelect = useCallback(async (note: VaultEntry) => {
    setState(prev => ({ ...prev, currentNote: note }));
    
    // CRITICAL: Load actual note content from disk
    if (note.path) {
      setIsLoadingNote(true);
      try {
        const content: string = await invoke('load_note_content', { path: note.path });
        setCurrentNoteContent(content);
      } catch (error) {
        console.error('Failed to load note:', error);
        setCurrentNoteContent('');
      } finally {
        setIsLoadingNote(false);
      }
    }
  }, []);

  const handleContentChange = useCallback((content: string) => {
    setCurrentNoteContent(content);
  }, []);

  const handleSaveNote = useCallback(async () => {
    if (!state.currentNote?.path) return;
    setSyncStatus('syncing');
    try {
      await invoke('save_note_content', {
        path: state.currentNote.path,
        content: currentNoteContent,
      });
      setLastSyncTime(Date.now());
      setSyncStatus('idle');
      loadNotes(state.vaultPath);
    } catch (error) {
      setSyncStatus('error');
      setState(prev => ({ ...prev, error: String(error) }));
    }
  }, [state.currentNote, currentNoteContent, state.vaultPath]);

  const handleDismissError = () => {
    setState(prev => ({ ...prev, error: null }));
  };

  const handleChangeVault = () => {
    localStorage.removeItem(VAULT_PATH_KEY);
    setState({ vaultPath: '', notes: [], currentNote: null, isLoading: false, error: null });
  };

  // Filter notes by sidebar selection + search query
  const filteredNotes = state.notes.filter((note) => {
    if (searchQuery && !note.title.toLowerCase().includes(searchQuery.toLowerCase())) return false;
    if (sidebarSelection.kind === 'filter') {
      if (sidebarSelection.filter === 'archived') return note.archived;
      if (sidebarSelection.filter === 'favorites') return note.favorite;
      if (sidebarSelection.filter === 'inbox') return !note.organized && !note.archived;
      // 'all', 'changes', 'pulse' — show all non-archived
      return !note.archived;
    }
    if (sidebarSelection.kind === 'sectionGroup') return note.isA === sidebarSelection.type;
    if (sidebarSelection.kind === 'folder') return note.path.startsWith(sidebarSelection.path);
    return true;
  });

  // Editor note shape — path as breadcrumb segments
  const editorNote = state.currentNote ? {
    id: state.currentNote.path,
    title: state.currentNote.title,
    content: currentNoteContent,
    path: state.currentNote.path.split(/[\\/]/).filter(Boolean).slice(-3),
    isLoading: isLoadingNote,
  } : null;

  if (!state.vaultPath) {
    return (
      <ErrorBoundary>
        <div className="h-screen w-screen bg-[var(--color-bg-primary)]">
          {state.isLoading && <LoadingSpinner />}
          {state.error && <ErrorDisplay error={state.error} onDismiss={handleDismissError} />}
          <VaultSelector onVaultSelect={handleVaultSelect} isLoading={state.isLoading} />
        </div>
      </ErrorBoundary>
    );
  }

  return (
    <ErrorBoundary>
      <div className="h-screen w-screen bg-[var(--color-bg-primary)]">
        {state.isLoading && <LoadingSpinner />}
        {state.error && <ErrorDisplay error={state.error} onDismiss={handleDismissError} />}
        
        <AppLayout
          sidebar={
            <Sidebar
              vaultName={state.vaultPath.split(/[\\/]/).pop() || 'Vault'}
              entries={state.notes}
              selection={sidebarSelection}
              onSelect={setSidebarSelection}
            />
          }
          noteList={
            <NoteList
              notes={filteredNotes}
              selectedNotePath={state.currentNote?.path}
              onSelectNote={handleNoteSelect}
              onCreateNote={() => console.log('TODO: create note')}
              searchQuery={searchQuery}
              onSearchChange={setSearchQuery}
            />
          }
          editor={
            <Editor
              note={editorNote}
              mode={editorMode}
              onModeChange={setEditorMode}
              onContentChange={handleContentChange}
              onSave={handleSaveNote}
            />
          }
          aiPanel={
            <AiPanel
              isOpen={aiPanelOpen}
              onToggle={() => setAiPanelOpen(!aiPanelOpen)}
            />
          }
          statusBar={
            <StatusBar
              noteCount={state.notes.length}
              vaultPath={state.vaultPath}
              syncStatus={syncStatus}
              lastSyncTime={lastSyncTime}
              isVaultReloading={state.isLoading}
              onSync={handleSaveNote}
              onOpenVault={handleChangeVault}
              onOpenSettings={() => console.log('TODO: settings')}
            />
          }
        />
      </div>
    </ErrorBoundary>
  );
}

