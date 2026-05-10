import { useState } from 'react';

interface EditorProps {
  onRevealFile: () => Promise<void>;
  onPaste: (event: React.ClipboardEvent<HTMLTextAreaElement>) => Promise<void>;
}

export function Editor({ onRevealFile, onPaste }: EditorProps) {
  const [content, setContent] = useState('');

  return (
    <div className="editor">
      <textarea
        value={content}
        onChange={(e) => setContent(e.target.value)}
        onPaste={onPaste}
        placeholder="Start writing..."
      />
      <button onClick={onRevealFile}>Reveal File</button>
    </div>
  );
}
