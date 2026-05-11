import { AIChat } from '../ai/AIChat';

interface AiPanelProps {
  isOpen?: boolean;
  onToggle?: () => void;
  className?: string;
}

export function AiPanel({ isOpen }: AiPanelProps) {
  if (!isOpen) return null;
  return (
    <div className="h-full border-l border-[var(--color-border-primary)]">
      <AIChat />
    </div>
  );
}
