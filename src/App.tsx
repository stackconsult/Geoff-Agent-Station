import { useState, useEffect } from 'react';
import { Editor } from './components/Editor';
import { SidebarSections } from './components/SidebarSections';
import { NoteList } from './components/NoteList';
import { useAutoGit } from './hooks/useAutoGit';
import { useVaultLoader } from './hooks/useVaultLoader';
import { handleImagePaste } from './hooks/useImagePaste';
import type { AppState, VaultEntry } from './types';
import { ErrorBoundary } from './components/ErrorBoundary';
import { LoadingSpinner } from './components/LoadingSpinner';
import { VaultSelector } from './components/VaultSelector';
import { ErrorDisplay } from './components/ErrorDisplay';
import { SearchBar } from './components/SearchBar';

const VAULT_PATH_KEY = 'tolaria_vault_path';

export default function App() {
  const [state, setState] = useState<AppState>({
    vaultPath: '',
    notes: [],
    currentNote: null,
    isLoading: false,
    error: null
  });
  
  const [searchResults, setSearchResults] = useState<VaultEntry[]>([]);
  const [isSearching, setIsSearching] = useState(false);

  // Load vault path from localStorage on mount
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

  const handleRevealFile = async () => {
    if (state.currentNote) {
      const { invoke } = await import('@tauri-apps/api/core');
      await invoke('reveal_file', { path: state.currentNote });
    }
  };

  const handlePaste = async (event: React.ClipboardEvent<HTMLTextAreaElement>) => {
    const items = event.clipboardData?.items;
    if (!items) return;

    for (const item of Array.from(items)) {
      if (item.type.startsWith('image/')) {
        const file = item.getAsFile();
        if (file) {
          const data = await file.arrayBuffer();
          const filename = file.name;
          await handleImagePaste(state.vaultPath, filename, new Uint8Array(data));
        }
      }
    }
  };

  const handleNoteSelect = (note: VaultEntry) => {
    setState(prev => ({ ...prev, currentNote: note }));
  };

  const handleSave = async (path: string, content: string) => {
    try {
      const { invoke } = await import('@tauri-apps/api/core');
      await invoke('save_note_content', { path, content });
    } catch (error) {
      setState(prev => ({ ...prev, error: String(error) }));
    }
  };

  const handleDismissError = () => {
    setState(prev => ({ ...prev, error: null }));
  };

  const handleChangeVault = () => {
    localStorage.removeItem(VAULT_PATH_KEY);
    setState({ vaultPath: '', notes: [], currentNote: null, isLoading: false, error: null });
  };

  return (
    <ErrorBoundary>
      <div className="app">
        {state.isLoading && <LoadingSpinner />}
        {state.error && <ErrorDisplay error={state.error} onDismiss={handleDismissError} />}
        
        {!state.vaultPath ? (
          <VaultSelector onVaultSelect={handleVaultSelect} isLoading={state.isLoading} />
        ) : (
          <div className="integrated-layout">
            <div className="sidebar">
              <div className="sidebar-header">
                <h2>Tolaria</h2>
                <button onClick={handleChangeVault} className="change-vault-btn" title="Change Vault">↻</button>
              </div>
              <SearchBar vaultPath={state.vaultPath} onResults={setSearchResults} />
              <SidebarSections notes={state.notes} />
              <NoteList 
                notes={searchResults.length > 0 ? searchResults : state.notes} 
                currentNote={state.currentNote} 
                onNoteSelect={handleNoteSelect} 
              />
            </div>
            <div className="main">
              <Editor
                currentNote={state.currentNote}
                onRevealFile={handleRevealFile}
                onPaste={handlePaste}
                onSave={handleSave}
              />
            </div>
          </div>
        )}
      </div>
    </ErrorBoundary>
  );
}

