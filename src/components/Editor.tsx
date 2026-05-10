import { useState } from 'react';
import { invoke } from '@tauri-apps/api/tauri';

export function Editor() {
  const [content, setContent] = useState('');
  const [currentPath, setCurrentPath] = useState('');

  const handleReveal = async () => {
    try {
      await invoke('reveal_file', { path: currentPath });
    } catch (error) {
      console.error('Failed to reveal file:', error);
    }
  };

  const handleImagePaste = async (event: ClipboardEvent) => {
    const items = event.clipboardData?.items;
    if (!items) return;

    for (const item of Array.from(items)) {
      if (item.type.startsWith('image/')) {
        const file = item.getAsFile();
        if (file) {
          const data = await file.arrayBuffer();
          const filename = file.name;
          // Save image to attachments
        }
      }
    }
  };

  return (
    <div className="editor">
      <textarea
        value={content}
        onChange={(e) => setContent(e.target.value)}
        onPaste={handleImagePaste}
        placeholder="Start writing..."
      />
      <button onClick={handleReveal}>Reveal File</button>
    </div>
  );
}
