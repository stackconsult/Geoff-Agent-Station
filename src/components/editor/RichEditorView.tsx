import { useEffect, useState, useRef } from 'react';
import { BlockNoteViewRaw, useCreateBlockNote } from '@blocknote/react';
import { Loader2 } from 'lucide-react';

interface RichEditorViewProps {
  content: string;
  onChange?: (content: string) => void;
  readOnly?: boolean;
}

export function RichEditorView({ content, onChange, readOnly = false }: RichEditorViewProps) {
  const [isLoading, setIsLoading] = useState(true);

  const editor = useCreateBlockNote({
    uploadFile: async (file) => {
      return URL.createObjectURL(file);
    },
  });

  const contentRef = useRef(content);
  contentRef.current = content;

  useEffect(() => {
    if (editor && content) {
      const currentContent = editor.document;
      if (currentContent.length === 0 || (currentContent.length === 1 && currentContent[0].content === undefined)) {
        editor.pasteMarkdown(content);
      }
    }
    setIsLoading(false);
  }, [editor]);

  useEffect(() => {
    if (!readOnly && editor) {
      const handleChange = () => {
        try {
          const doc = editor.document;
          const markdown = serializeBlocksToMarkdown(doc);
          if (markdown !== contentRef.current) {
            onChange?.(markdown);
          }
        } catch (e) {
          console.error('Markdown export failed:', e);
        }
      };
      editor.onChange(handleChange);
    }
  }, [editor, onChange, readOnly]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <Loader2 className="h-6 w-6 animate-spin text-[var(--color-accent-primary)]" />
        <span className="ml-2 text-[var(--color-text-secondary)]">Loading editor...</span>
      </div>
    );
  }

  return (
    <div className="h-full overflow-auto">
      <BlockNoteViewRaw
        editor={editor}
        theme="dark"
        editable={!readOnly}
        className="h-full"
      />
    </div>
  );
}

function serializeBlocksToMarkdown(doc: any[]): string {
  if (!doc || doc.length === 0) return '';
  
  return doc.map(block => {
    if (!block) return '';
    
    const content = block.content;
    if (!content) return '';
    
    const text = Array.isArray(content) 
      ? content.map((c: any) => c.text || '').join('')
      : content.text || '';
    
    switch (block.type) {
      case 'heading':
        const level = block.props?.level || 1;
        return '#'.repeat(level) + ' ' + text;
      case 'bulletListItem':
        return '- ' + text;
      case 'numberedListItem':
        return '1. ' + text;
      case 'paragraph':
      default:
        return text;
    }
  }).join('\n');
}

function parseMarkdownToBlocks(markdown: string) {
  const lines = markdown.split('\n');
  const blocks: { type: string; content: string }[] = [];

  for (const line of lines) {
    if (line.startsWith('# ')) {
      blocks.push({ type: 'heading', content: line.slice(2) });
    } else if (line.startsWith('## ')) {
      blocks.push({ type: 'heading', content: line.slice(3) });
    } else if (line.startsWith('### ')) {
      blocks.push({ type: 'heading', content: line.slice(4) });
    } else if (line.startsWith('- ')) {
      blocks.push({ type: 'bulletListItem', content: line.slice(2) });
    } else if (line.match(/^\d+\. /)) {
      blocks.push({ type: 'numberedListItem', content: line.replace(/^\d+\. /, '') });
    } else if (line.trim() === '') {
      blocks.push({ type: 'paragraph', content: '' });
    } else {
      blocks.push({ type: 'paragraph', content: line });
    }
  }

  return blocks.length > 0 ? blocks : undefined;
}
