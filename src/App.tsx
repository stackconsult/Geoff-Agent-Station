import { useState } from 'react';
import { Editor } from './components/Editor';
import { SidebarSections } from './components/SidebarSections';
import { NoteList } from './components/NoteList';
import { useAutoGit } from './hooks/useAutoGit';
import { useVaultLoader } from './hooks/useVaultLoader';
import { handleImagePaste } from './hooks/useImagePaste';

interface AppState {
  vaultPath: string;
  notes: any[];
  currentNote: string | null;
  isLoading: boolean;
  error: string | null;
}

export default function App() {
  const [state, setState] = useState<AppState>({
    vaultPath: '',
    notes: [],
    currentNote: null,
    isLoading: false,
    error: null
  });

  const loadNotes = async (path: string) => {
    setState(prev => ({ ...prev, isLoading: true, error: null }));
    try {
      const { invoke } = await import('@tauri-apps/api/tauri');
      const notes = await invoke('scan_vault', { vaultPath: path });
      setState(prev => ({ ...prev, notes, isLoading: false }));
    } catch (error) {
      setState(prev => ({ ...prev, error: String(error), isLoading: false }));
    }
  };

  useVaultLoader(state.vaultPath);
  useAutoGit(state.vaultPath);

  const handleRevealFile = async () => {
    if (state.currentNote) {
      const { invoke } = await import('@tauri-apps/api/tauri');
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

  return (
    <div className="app">
      <div className="integrated-layout">
        <div className="sidebar">
          <h2>Tolaria</h2>
          <SidebarSections />
          <NoteList notes={state.notes} />
        </div>
        <div className="main">
          <Editor
            onRevealFile={handleRevealFile}
            onPaste={handlePaste}
          />
        </div>
      </div>
    </div>
  );
}
