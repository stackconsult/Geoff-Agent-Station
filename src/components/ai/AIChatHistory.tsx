import { useState } from 'react';

interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  model: string;
}

interface AIChatHistoryProps {
  isOpen: boolean;
  onClose: () => void;
  onLoadConversation: (messages: ChatMessage[]) => void;
}

export function AIChatHistory({
  isOpen,
  onClose,
  onLoadConversation,
}: AIChatHistoryProps) {
  const [conversations, setConversations] = useState<ChatMessage[][]>([]);

  if (!isOpen) return null;

  return (
    <div className="h-full w-80 border-l border-[var(--color-border)] bg-[var(--color-bg-secondary)] flex flex-col">
      <div className="h-12 border-b border-[var(--color-border)] flex items-center justify-between px-4">
        <h3 className="text-sm font-semibold text-[var(--color-text-primary)]">
          Chat History
        </h3>
        <button
          onClick={onClose}
          className="text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)]"
        >
          ×
        </button>
      </div>
      <div className="flex-1 overflow-y-auto p-4">
        {conversations.length === 0 ? (
          <div className="text-sm text-[var(--color-text-secondary)] text-center py-8">
            No chat history yet
          </div>
        ) : (
          <div className="space-y-2">
            {conversations.map((conv, idx) => (
              <div
                key={idx}
                className="p-3 rounded bg-[var(--color-bg-primary)] border border-[var(--color-border)] hover:border-[var(--color-accent)] cursor-pointer"
              >
                <div className="text-sm font-medium text-[var(--color-text-primary)] mb-1">
                  {conv[0]?.content.slice(0, 30) || 'New conversation'}
                </div>
                <div className="text-xs text-[var(--color-text-secondary)]">
                  {conv.length} messages •{' '}
                  {conv[0]?.timestamp.toLocaleDateString()}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
      <div className="p-4 border-t border-[var(--color-border)]">
        <button className="w-full px-3 py-2 text-sm bg-[var(--color-accent)] text-white rounded hover:opacity-90">
          New Conversation
        </button>
      </div>
    </div>
  );
}
