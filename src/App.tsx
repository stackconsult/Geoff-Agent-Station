import { useState, useEffect } from 'react';
import Editor from './components/Editor';
import SidebarSections from './components/SidebarSections';
import NoteList from './components/NoteList';
import { useAutoGit } from './hooks/useAutoGit';
import { useCommitFlow } from './hooks/useCommitFlow';
import { useVaultLoader } from './hooks/useVaultLoader';
import { useNoteActions } from './hooks/useNoteActions';
import { useImagePaste } from './hooks/useImagePaste';

export default function App() {
  const [vaultPath, setVaultPath] = useState('');
  const [currentNote, setCurrentNote] = useState('');
  const [currentPath, setCurrentPath] = useState('');

  const { calculateInboxNotes } = useNoteActions();
  const { handlePaste } = useImagePaste(vaultPath);

  useEffect(() => {
    useVaultLoader(vaultPath);
  }, [vaultPath]);

  useAutoGit(vaultPath);

  const handleRevealFile = () => {
    if (currentPath) {
      window.__TAURI__.invoke('reveal_file', { path: currentPath });
    }
  };

  return (
    <div className="app">
      <div className="integrated-layout">
        <div className="sidebar">
          <h2>Tolaria</h2>
          <SidebarSections vaultPath={vaultPath} />
          <NoteList vaultPath={vaultPath} />
        </div>
        <div className="main">
          <Editor
            content={currentNote}
            path={currentPath}
            onRevealFile={handleRevealFile}
            onPaste={handlePaste}
          />
        </div>
      </div>
    </div>
  );
}
