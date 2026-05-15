import { useEffect, useState, useRef, useMemo } from 'react';
import { BlockNoteViewRaw, useCreateBlockNote } from '@blocknote/react';
import { BlockNoteEditor } from '@blocknote/core';
import { Loader2 } from 'lucide-react';

// ─── Error Types ───
export type EditorError =
  | { type: 'parse_failed'; markdown: string; reason: string }
  | { type: 'export_failed'; reason: string }
  | { type: 'import_failed'; reason: string };

// ─── Props ───
interface RichEditorViewProps {
  content: string;
  onChange?: (
    content: string,
    metadata: { isValid: boolean; errors?: EditorError[] }
  ) => void;
  onError?: (error: EditorError) => void;
  readOnly?: boolean;
}

export function RichEditorView({
  content,
  onChange,
  onError,
  readOnly = false,
}: RichEditorViewProps) {
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);

  // ─── Import: parse markdown to blocks BEFORE editor mounts ───
  // tryParseMarkdownToBlocks is a static editor method — create a temp editor
  // instance just to call it, then pass the result as initialContent.
  const initialContent = useMemo(() => {
    try {
      if (!content) return undefined;
      return BlockNoteEditor.create().tryParseMarkdownToBlocks(content);
    } catch (e) {
      const err: EditorError = {
        type: 'import_failed',
        reason: e instanceof Error ? e.message : String(e),
      };
      onError?.(err);
      return undefined;
    }
    // content intentionally not in deps — initial load only; parent controls updates
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const editor = useCreateBlockNote({
    initialContent,
    uploadFile: async file => {
      return URL.createObjectURL(file);
    },
  });

  const contentRef = useRef(content);
  contentRef.current = content;

  useEffect(() => {
    setIsLoading(false);
  }, [editor]);

  // ─── Export: Convert editor blocks → markdown on change ───
  useEffect(() => {
    if (readOnly || !editor) return;

    const handleChange = () => {
      try {
        const markdown = editor.blocksToMarkdownLossy(editor.document);
        if (markdown !== contentRef.current) {
          onChange?.(markdown, { isValid: true });
        }
      } catch (e) {
        const err: EditorError = {
          type: 'export_failed',
          reason: e instanceof Error ? e.message : String(e),
        };
        onError?.(err);
        console.error('[RichEditorView] Markdown export failed:', e);
      }
    };

    editor.onChange(handleChange);
  }, [editor, onChange, onError, readOnly]);

  // ─── Error State ───
  if (hasError) {
    return (
      <div className="flex flex-col items-center justify-center h-full p-6 text-center">
        <div className="text-red-400 mb-2">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="48"
            height="48"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <circle cx="12" cy="12" r="10" />
            <line x1="12" y1="8" x2="12" y2="12" />
            <line x1="12" y1="16" x2="12.01" y2="16" />
          </svg>
        </div>
        <h3 className="text-lg font-semibold text-red-300 mb-1">
          Editor Error
        </h3>
        <p className="text-sm text-[var(--color-text-secondary)] max-w-md">
          The rich editor failed to load. Switch to <strong>Raw mode</strong> to
          edit this note safely.
        </p>
      </div>
    );
  }

  // ─── Loading State ───
  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <Loader2 className="h-6 w-6 animate-spin text-[var(--color-accent-primary)]" />
        <span className="ml-2 text-[var(--color-text-secondary)]">
          Loading editor...
        </span>
      </div>
    );
  }

  // ─── Editor ───
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
