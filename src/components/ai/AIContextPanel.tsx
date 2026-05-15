import { useState } from 'react';
import { invoke } from '@tauri-apps/api/core';

interface ContextItem {
  id: string;
  type: 'note' | 'file' | 'conversation';
  title: string;
  path: string;
  size: number;
  addedAt: Date;
}

interface AIContextPanelProps {
  isOpen: boolean;
  onClose: () => void;
}

export function AIContextPanel({ isOpen, onClose }: AIContextPanelProps) {
  const [contextItems, setContextItems] = useState<ContextItem[]>([]);

  const handleAddDocument = async () => {
    try {
      const docId = await invoke<string>('ai_vector_add_document', {
        docPath: '',
      });
      console.log('Document added:', docId);
    } catch (e) {
      console.error('Failed to add document:', e);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="h-full w-80 border-l border-[var(--color-border)] bg-[var(--color-bg-secondary)] flex flex-col">
      <div className="h-12 border-b border-[var(--color-border)] flex items-center justify-between px-4">
        <h3 className="text-sm font-semibold text-[var(--color-text-primary)]">
          AI Context
        </h3>
        <button
          onClick={onClose}
          className="text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)]"
        >
          ×
        </button>
      </div>
      <div className="flex-1 overflow-y-auto p-4">
        {contextItems.length === 0 ? (
          <div className="text-sm text-[var(--color-text-secondary)] text-center py-8">
            No context added yet
          </div>
        ) : (
          <div className="space-y-2">
            {contextItems.map(item => (
              <div
                key={item.id}
                className="p-2 rounded bg-[var(--color-bg-primary)] border border-[var(--color-border)]"
              >
                <div className="flex items-center gap-2">
                  <span className="text-xs">
                    {item.type === 'note'
                      ? '📝'
                      : item.type === 'file'
                        ? '📄'
                        : '💬'}
                  </span>
                  <span className="text-sm font-medium text-[var(--color-text-primary)]">
                    {item.title}
                  </span>
                </div>
                <div className="text-xs text-[var(--color-text-secondary)] mt-1">
                  {item.path}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
      <div className="p-4 border-t border-[var(--color-border)]">
        <button
          onClick={handleAddDocument}
          className="w-full px-3 py-2 text-sm bg-[var(--color-accent)] text-white rounded"
        >
          + Add Document
        </button>
      </div>
    </div>
  );
}
