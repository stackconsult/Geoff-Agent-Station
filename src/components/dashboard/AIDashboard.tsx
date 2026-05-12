import { AIChat } from '../ai/AIChat';

export function AIDashboard() {
  return (
    <div className="h-full flex flex-col bg-[var(--color-bg-primary)]">
      <div className="h-14 border-b border-[var(--color-border)] flex items-center px-4 bg-[var(--color-bg-secondary)]">
        <h1 className="text-lg font-semibold text-[var(--color-text-primary)]">AI Assistant</h1>
      </div>
      <div className="flex-1 overflow-hidden">
        <AIChat />
      </div>
    </div>
  );
}
