import { useState, useEffect, useCallback, useRef } from 'react';
import { invoke } from '@tauri-apps/api/core';
import { useAutoGit } from './hooks/useAutoGit';
import { useVaultLoader } from './hooks/useVaultLoader';
import type { AppState, VaultEntry, SidebarSelection, SyncStatus } from './types';
import { ErrorBoundary as ClassErrorBoundary } from './components/ErrorBoundary';
import { ErrorBoundary } from 'react-error-boundary';
import { LoadingSpinner } from './components/LoadingSpinner';
import { VaultSelector } from './components/VaultSelector';
import { ErrorDisplay } from './components/ErrorDisplay';
import { AppLayout, Sidebar, NoteList, Editor, AiPanel, StatusBar } from './components/layout';
import { AutomationDashboard } from './pages/AutomationDashboard';
import { Toaster, toast } from 'sonner';

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
  const [showAutomation, setShowAutomation] = useState(false);

  // Load vault path from localStorage on mount — if none saved, VaultSelector appears
  useEffect(() => {
    const savedPath = localStorage.getItem(VAULT_PATH_KEY);
    if (savedPath) {
      setState(prev => ({ ...prev, vaultPath: savedPath }));
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

  const autoSaveDebounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const handleContentChange = useCallback((content: string) => {
    setCurrentNoteContent(content);
    // Clear any pending debounced save — actual save is always manual (Cmd+S)
    if (autoSaveDebounceRef.current) clearTimeout(autoSaveDebounceRef.current);
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
      <ClassErrorBoundary>
        <div className="h-screen w-screen bg-[var(--color-bg-primary)]">
          {state.isLoading && <LoadingSpinner />}
          {state.error && <ErrorDisplay error={state.error} onDismiss={handleDismissError} />}
          <VaultSelector onVaultSelect={handleVaultSelect} isLoading={state.isLoading} />
        </div>
      </ClassErrorBoundary>
    );
  }

  return (
    <ClassErrorBoundary>
      <div className="h-screen w-screen bg-[var(--color-bg-primary)]">
        {state.isLoading && <LoadingSpinner />}
        {state.error && <ErrorDisplay error={state.error} onDismiss={handleDismissError} />}
        {showAutomation ? (
          <ErrorBoundary
            fallback={
              <div className="h-screen flex items-center justify-center bg-[var(--color-bg-primary)]">
                <div className="text-center p-8 max-w-md">
                  <p className="text-red-400 text-lg font-semibold mb-2">Automation Dashboard Error</p>
                  <p className="text-[var(--color-text-secondary)] text-sm mb-4">
                    A tab component crashed. Check the console for details.
                  </p>
                  <button
                    onClick={() => setShowAutomation(false)}
                    className="px-4 py-2 bg-[var(--color-accent)] text-white rounded text-sm"
                  >
                    Return to Editor
                  </button>
                </div>
              </div>
            }
          >
            <AutomationDashboard />
          </ErrorBoundary>
        ) : (
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
              onCreateNote={() => toast.info('Create note coming soon')}
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
              onOpenSettings={() => toast.info('Settings coming soon')}
              onToggleAutomation={() => setShowAutomation(!showAutomation)}
            />
          }
        />
        )}
      </div>
      <Toaster
        position="bottom-right"
        toastOptions={{
          style: {
            background: 'var(--color-bg-secondary)',
            color: 'var(--color-text-primary)',
            border: '1px solid var(--color-border-primary)',
          },
        }}
      />
    </ClassErrorBoundary>
  );
}

