import { useEffect, useRef } from 'react';
import { EditorState } from '@codemirror/state';
import {
  EditorView,
  keymap,
  lineNumbers,
  highlightActiveLineGutter,
  highlightSpecialChars,
  drawSelection,
  dropCursor,
  rectangularSelection,
  crosshairCursor,
  highlightActiveLine,
} from '@codemirror/view';
import { defaultKeymap, history, historyKeymap } from '@codemirror/commands';
import { markdown, markdownLanguage } from '@codemirror/lang-markdown';
import {
  syntaxHighlighting,
  defaultHighlightStyle,
  bracketMatching,
  foldGutter,
  indentOnInput,
} from '@codemirror/language';
import { searchKeymap, highlightSelectionMatches } from '@codemirror/search';
import {
  autocompletion,
  completionKeymap,
  closeBrackets,
  closeBracketsKeymap,
} from '@codemirror/autocomplete';

interface RawEditorViewProps {
  content: string;
  onChange?: (content: string) => void;
  readOnly?: boolean;
}

export function RawEditorView({
  content,
  onChange,
  readOnly = false,
}: RawEditorViewProps) {
  const editorRef = useRef<HTMLDivElement>(null);
  const viewRef = useRef<EditorView | null>(null);

  useEffect(() => {
    if (!editorRef.current) return;

    const theme = EditorView.theme({
      '&': {
        height: '100%',
        fontSize: '14px',
      },
      '.cm-content': {
        fontFamily:
          'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace',
        padding: '16px',
      },
      '.cm-gutters': {
        backgroundColor: 'var(--color-bg-secondary)',
        borderRight: '1px solid var(--color-border-primary)',
      },
      '.cm-activeLineGutter': {
        backgroundColor: 'var(--color-bg-elevated)',
      },
      '.cm-activeLine': {
        backgroundColor: 'rgba(255,255,255,0.05)',
      },
      '&.cm-focused .cm-cursor': {
        borderLeftColor: 'var(--color-accent-primary)',
      },
      '&.cm-focused .cm-selectionBackground, ::selection': {
        backgroundColor: 'rgba(59, 130, 246, 0.3)',
      },
    });

    const updateListener = EditorView.updateListener.of(update => {
      if (update.docChanged) {
        onChange?.(update.state.doc.toString());
      }
    });

    const state = EditorState.create({
      doc: content,
      extensions: [
        lineNumbers(),
        highlightActiveLineGutter(),
        highlightSpecialChars(),
        history(),
        foldGutter(),
        drawSelection(),
        dropCursor(),
        EditorState.allowMultipleSelections.of(true),
        indentOnInput(),
        syntaxHighlighting(defaultHighlightStyle, { fallback: true }),
        bracketMatching(),
        closeBrackets(),
        autocompletion(),
        rectangularSelection(),
        crosshairCursor(),
        highlightActiveLine(),
        highlightSelectionMatches(),
        keymap.of([
          ...closeBracketsKeymap,
          ...defaultKeymap,
          ...searchKeymap,
          ...historyKeymap,
          ...completionKeymap,
        ]),
        markdown({ base: markdownLanguage }),
        theme,
        updateListener,
        EditorView.editable.of(!readOnly),
      ],
    });

    const view = new EditorView({
      state,
      parent: editorRef.current,
    });

    viewRef.current = view;

    return () => {
      view.destroy();
      viewRef.current = null;
    };
  }, []);

  useEffect(() => {
    if (viewRef.current && content !== viewRef.current.state.doc.toString()) {
      viewRef.current.dispatch({
        changes: {
          from: 0,
          to: viewRef.current.state.doc.length,
          insert: content,
        },
      });
    }
  }, [content]);

  return <div ref={editorRef} className="h-full overflow-hidden" />;
}
