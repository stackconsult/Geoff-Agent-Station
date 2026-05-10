import { useState } from 'react';
import { Editor } from './components/Editor';
import { SidebarSections } from './components/SidebarSections';
import { NoteList } from './components/NoteList';
import { useAutoGit } from './hooks/useAutoGit';
import { useVaultLoader } from './hooks/useVaultLoader';
import { handleImagePaste } from './hooks/useImagePaste';

export default function App() {
  const [vaultPath] = useState('');
  const [currentPath] = useState('');
  const [notes] = useState<any[]>([]);

  useVaultLoader(vaultPath);
  useAutoGit(vaultPath);

  const handleRevealFile = async () => {
    if (currentPath) {
      const { invoke } = await import('@tauri-apps/api/tauri');
      await invoke('reveal_file', { path: currentPath });
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
          await handleImagePaste(vaultPath, filename, new Uint8Array(data));
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
          <NoteList notes={notes} />
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
