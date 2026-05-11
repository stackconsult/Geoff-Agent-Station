import { ErrorBoundary } from 'react-error-boundary';
import { AIChat } from '../ai/AIChat';
import { ErrorFallback } from '../ui/ErrorFallback';

interface AiPanelProps {
  isOpen?: boolean;
  onToggle?: () => void;
  className?: string;
}

export function AiPanel({ isOpen }: AiPanelProps) {
  if (!isOpen) return null;
  return (
    <div className="h-full border-l border-[var(--color-border-primary)]">
      <ErrorBoundary
        fallback={<ErrorFallback message="AI panel unavailable. Is Ollama running?" />}
        onReset={() => window.location.reload()}
      >
        <AIChat />
      </ErrorBoundary>
    </div>
  );
}
