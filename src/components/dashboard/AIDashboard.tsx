import { useState } from 'react';
import { AIChat } from '../ai/AIChat';
import { AIModelSelector } from '../ai/AIModelSelector';
import { AIContextPanel } from '../ai/AIContextPanel';
import { AIChatHistory } from '../ai/AIChatHistory';

export function AIDashboard() {
  const [selectedModel, setSelectedModel] = useState('ollama-llama3');
  const [showContext, setShowContext] = useState(false);
  const [showHistory, setShowHistory] = useState(false);

  return (
    <div className="h-full flex flex-col bg-[var(--color-bg-primary)]">
      <div className="h-14 border-b border-[var(--color-border)] flex items-center justify-between px-4 bg-[var(--color-bg-secondary)]">
        <div className="flex items-center gap-4">
          <h1 className="text-lg font-semibold text-[var(--color-text-primary)]">AI Assistant</h1>
          <AIModelSelector selectedModel={selectedModel} onModelChange={setSelectedModel} />
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowContext(!showContext)}
            className={`px-3 py-1.5 text-sm rounded ${showContext ? 'bg-[var(--color-accent)] text-white' : 'hover:bg-[var(--color-bg-hover)] text-[var(--color-text-secondary)]'}`}
          >
            Context
          </button>
          <button
            onClick={() => setShowHistory(!showHistory)}
            className={`px-3 py-1.5 text-sm rounded ${showHistory ? 'bg-[var(--color-accent)] text-white' : 'hover:bg-[var(--color-bg-hover)] text-[var(--color-text-secondary)]'}`}
          >
            History
          </button>
        </div>
      </div>
      <div className="flex-1 flex overflow-hidden">
        <div className="flex-1 overflow-hidden">
          <AIChat />
        </div>
        {showContext && <AIContextPanel isOpen={showContext} onClose={() => setShowContext(false)} />}
        {showHistory && <AIChatHistory isOpen={showHistory} onClose={() => setShowHistory(false)} onLoadConversation={() => {}} />}
      </div>
    </div>
  );
}
