import { useState, useEffect, useCallback, useRef } from 'react';
import { invoke } from '@tauri-apps/api/core';
import { Routes, Route } from 'react-router-dom';
import { systemManager } from './integration';
import { useAutoGit } from './hooks/useAutoGit';
import { useVaultLoader } from './hooks/useVaultLoader';
import { useVaultStore } from './stores/vaultStore';
import { useUIStore } from './stores/uiStore';
import { useEditorStore } from './stores/editorStore';
import type { VaultEntry, SidebarSelection } from './types';
import { ErrorBoundary as ClassErrorBoundary } from './components/ErrorBoundary';
import { ErrorBoundary } from 'react-error-boundary';
import { LoadingSpinner } from './components/LoadingSpinner';
import { VaultSelector } from './components/VaultSelector';
import { ErrorDisplay } from './components/ErrorDisplay';
import { SettingsPanel } from './components/SettingsPanel';
import { RestoreBackupDialog } from './components/RestoreBackupDialog';
import type { HealthStatus } from './components/HealthIndicator';
import { AppLayout, Sidebar, NoteList, Editor, AiPanel, StatusBar } from './components/layout';
import { AutomationDashboard } from './pages/AutomationDashboard';
import { DashboardManager } from './components/dashboard/DashboardManager';
import { MainDashboard } from './components/dashboard/MainDashboard';
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
  const { vaultPath, notes, currentNote, isLoading, error, loadNotes, selectNote, saveNote } = useVaultStore();
  const { aiPanelOpen, editorMode, searchQuery, sidebarSelection, showAutomation, toggleAi, setEditorMode, setSearchQuery, setSidebarSelection, setShowAutomation } = useUIStore();
  const { content, syncStatus, lastSyncTime, isLoadingNote, setContent, setSyncStatus, setIsLoadingNote, updateLastSync } = useEditorStore();

  // Local state only for localStorage vault path persistence and settings panel
  const [localVaultPath, setLocalVaultPath] = useState<string | null>(null);
  const [showSettings, setShowSettings] = useState(false);
  const [showBackups, setShowBackups] = useState(false);
  const [healthStatus, setHealthStatus] = useState<HealthStatus | null>(null);
  const [useMultiDashboard, setUseMultiDashboard] = useState(false);

  // Initialize system manager
  useEffect(() => {
    systemManager.initialize().catch(console.error);
    return () => { systemManager.shutdown().catch(console.error); };
  }, []);

  // Load vault path from localStorage on mount — if none saved, VaultSelector appears
  useEffect(() => {
    const savedPath = localStorage.getItem(VAULT_PATH_KEY);
    if (savedPath) {
      setLocalVaultPath(savedPath);
      loadNotes(savedPath);
    } else {
      // Force VaultSelector to show if no vault path
      toast.info('Select a vault to get started');
    }
  }, []);

  // Save vault path to localStorage when it changes
  useEffect(() => {
    if (vaultPath) {
      localStorage.setItem(VAULT_PATH_KEY, vaultPath);
      setLocalVaultPath(vaultPath);
    }
  }, [vaultPath]);

  useVaultLoader(vaultPath);
  useAutoGit(vaultPath);

  // Health check polling every 30 seconds
  useEffect(() => {
    const checkHealth = async () => {
      if (!vaultPath) return;
      try {
        const status = await invoke<HealthStatus>('health_check', {
          vaultPath,
          ollamaBaseUrl: 'http://localhost:11434',
        });
        setHealthStatus(status);
      } catch (error) {
        console.error('Health check failed:', error);
        setHealthStatus({
          overall: 'unhealthy',
          vault_accessible: false,
          vault_note_count: 0,
          ollama_reachable: false,
          disk_space_gb: 0,
          disk_space_status: 'critical',
          checks: [],
        });
      }
    };

    checkHealth();
    const id = setInterval(checkHealth, 30000);
    return () => clearInterval(id);
  }, [vaultPath]);

  const handleVaultSelect = (path: string) => {
    loadNotes(path);
  };

  const handleNoteSelect = useCallback(async (note: VaultEntry) => {
    selectNote(note);
    
    // CRITICAL: Load actual note content from disk
    if (note.path) {
      setIsLoadingNote(true);
      try {
        const noteContent: string = await invoke('load_note_content', { path: note.path });
        setContent(noteContent);
      } catch (error) {
        console.error('Failed to load note:', error);
        setContent('');
      } finally {
        setIsLoadingNote(false);
      }
    }
  }, [selectNote, setIsLoadingNote, setContent]);

  const autoSaveDebounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const handleContentChange = useCallback((noteContent: string) => {
    setContent(noteContent);
    // Clear any pending debounced save — actual save is always manual (Cmd+S)
    if (autoSaveDebounceRef.current) clearTimeout(autoSaveDebounceRef.current);
  }, [setContent]);

  const handleSaveNote = useCallback(async () => {
    if (!currentNote?.path) return;
    setSyncStatus('syncing');
    try {
      await saveNote(currentNote.path, content);
      updateLastSync();
      setSyncStatus('idle');
    } catch (error) {
      setSyncStatus('error');
    }
  }, [currentNote, content, saveNote, setSyncStatus, updateLastSync]);

  const handleDismissError = () => {
    // Error handling in vaultStore clears error on next action
  };

  const handleChangeVault = () => {
    localStorage.removeItem(VAULT_PATH_KEY);
    setLocalVaultPath(null);
    // Store reset happens via vault path being empty
  };

  // Filter notes by sidebar selection + search query
  const filteredNotes = notes.filter((note) => {
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
  const editorNote = currentNote ? {
    id: currentNote.path,
    title: currentNote.title,
    content,
    path: currentNote.path.split(/[\\/]/).filter(Boolean).slice(-3),
    isLoading: isLoadingNote,
  } : null;

  return (
    <ClassErrorBoundary>
      <Routes>
        <Route path="/dashboard" element={<MainDashboard />} />
        <Route path="/*" element={
          <div className="h-screen w-screen bg-[var(--color-bg-primary)]">
            {!localVaultPath ? <VaultSelector onVaultSelect={handleVaultSelect} isLoading={isLoading} /> : (
              <>
                {isLoading && <LoadingSpinner />}
                {error && <ErrorDisplay error={error} onDismiss={handleDismissError} />}
                <button onClick={() => setUseMultiDashboard(!useMultiDashboard)} className="fixed top-4 right-4 z-50 px-4 py-2 bg-[var(--color-accent)] text-white rounded text-sm">
                  {useMultiDashboard ? '← Legacy' : 'Multi-Dashboard →'}
                </button>
                {useMultiDashboard ? <DashboardManager /> : showAutomation ? (
                  <ErrorBoundary
                    fallback={
                      <div className="h-screen flex items justify-center bg-[var(--color-bg-primary)]">
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
              vaultName={vaultPath.split(/[\\/]/).pop() || 'Vault'}
              entries={notes}
              selection={sidebarSelection}
              onSelect={setSidebarSelection}
            />
          }
          noteList={
            <NoteList
              notes={filteredNotes}
              selectedNotePath={currentNote?.path}
              onSelectNote={handleNoteSelect}
              onCreateNote={async () => {
                if (!vaultPath) return;
                const newNotePath = `${vaultPath}/Untitled.md`;
                const template = `---
created: ${new Date().toISOString()}
---
# Untitled

`;
                try {
                  await invoke('save_note_content', { path: newNotePath, content: template });
                  await loadNotes(vaultPath);
                  toast.success('Note created');
                } catch (error) {
                  toast.error(`Failed to create note: ${error}`);
                }
              }}
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
              onToggle={toggleAi}
            />
          }
          statusBar={
            <StatusBar
              noteCount={notes.length}
              vaultPath={vaultPath}
              syncStatus={syncStatus}
              lastSyncTime={lastSyncTime}
              isVaultReloading={isLoading}
              onSync={handleSaveNote}
              onOpenVault={handleChangeVault}
              onOpenSettings={() => setShowSettings(true)}
              onToggleAutomation={() => setShowAutomation(!showAutomation)}
              onOpenBackups={() => setShowBackups(true)}
              healthStatus={healthStatus}
              onHealthCheck={() => toast.info(`Health: ${healthStatus?.overall || 'unknown'}`)}
            />
          }
        />
        )}
              </>
            )}
          </div>
        } />
      </Routes>
      <SettingsPanel isOpen={showSettings} onClose={() => setShowSettings(false)} />
      <RestoreBackupDialog
        isOpen={showBackups}
        onClose={() => setShowBackups(false)}
        vaultPath={vaultPath || ''}
        onRestore={(originalPath) => {
          toast.success(`Restored: ${originalPath.split(/[\\/]/).pop()}`);
          loadNotes(vaultPath || '');
        }}
      />
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

