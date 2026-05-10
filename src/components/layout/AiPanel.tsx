import React from 'react';
import { cn } from '../../lib/utils';
import { Button } from '../ui/Button';
import { Card, CardContent } from '../ui/Card';
import {
  Bot,
  Send,
  Settings,
  X,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';

interface AiPanelProps {
  isOpen?: boolean;
  onToggle?: () => void;
  className?: string;
}

/**
 * AiPanel Component
 * 
 * Features:
 * - Collapsible right panel
 * - Message threading UI
 * - Model selector placeholder
 * - Tool action cards placeholder
 * - Permission mode toggle placeholder
 */
export function AiPanel({
  isOpen = true,
  onToggle,
  className,
}: AiPanelProps) {
  if (!isOpen) {
    return (
      <div className={cn("flex flex-col h-full bg-[var(--color-bg-secondary)] border-l border-[var(--color-border-primary)]", className)}>
        <Button
          variant="ghost"
          size="icon"
          className="m-2"
          onClick={onToggle}
        >
          <ChevronLeft className="h-4 w-4" />
        </Button>
      </div>
    );
  }

  return (
    <div className={cn("flex flex-col h-full bg-[var(--color-bg-secondary)]", className)}>
      {/* Panel Header */}
      <div className="flex items-center justify-between px-4 py-2 border-b border-[var(--color-border-primary)]">
        <div className="flex items-center gap-2">
          <Bot className="h-4 w-4 text-[var(--color-accent-primary)]" />
          <span className="font-medium text-sm">AI Agent</span>
        </div>
        <div className="flex items-center gap-1">
          <Button variant="ghost" size="icon" className="h-7 w-7">
            <Settings className="h-4 w-4" />
          </Button>
          <Button variant="ghost" size="icon" className="h-7 w-7" onClick={onToggle}>
            <X className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Model Selector */}
      <div className="px-4 py-2 border-b border-[var(--color-border-primary)]">
        <select className="w-full text-sm bg-[var(--color-bg-elevated)] border border-[var(--color-border-primary)] rounded px-2 py-1 text-[var(--color-text-primary)]">
          <option>Claude Code</option>
          <option>Codex CLI</option>
          <option>OpenCode</option>
          <option>Pi</option>
          <option>Gemini CLI</option>
        </select>
      </div>

      {/* Permission Mode */}
      <div className="px-4 py-2 border-b border-[var(--color-border-primary)]">
        <div className="flex items-center justify-between">
          <span className="text-xs text-[var(--color-text-muted)]">Mode</span>
          <div className="flex items-center gap-2">
            <span className="text-xs text-[var(--color-success)]">Safe</span>
            <div className="w-8 h-4 bg-[var(--color-bg-tertiary)] rounded-full relative cursor-pointer">
              <div className="w-3 h-3 bg-[var(--color-success)] rounded-full absolute left-0.5 top-0.5"></div>
            </div>
          </div>
        </div>
      </div>

      {/* Message Thread */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {/* Welcome Message */}
        <Card className="bg-[var(--color-bg-elevated)] border-transparent">
          <CardContent className="p-3">
            <p className="text-sm text-[var(--color-text-secondary)]">
              I&apos;m your AI assistant. I can help you with:
            </p>
            <ul className="text-sm text-[var(--color-text-muted)] mt-2 space-y-1 list-disc list-inside">
              <li>Searching and organizing notes</li>
              <li>Writing and editing content</li>
              <li>Finding connections between ideas</li>
              <li>Answering questions about your vault</li>
            </ul>
          </CardContent>
        </Card>

        {/* Placeholder for messages */}
        <div className="text-center text-xs text-[var(--color-text-muted)] py-8">
          MCP integration coming in Phase 4
        </div>
      </div>

      {/* Input Area */}
      <div className="p-3 border-t border-[var(--color-border-primary)]">
        <div className="flex items-center gap-2">
          <input
            type="text"
            placeholder="Ask AI..."
            disabled
            className="flex-1 bg-[var(--color-bg-elevated)] border border-[var(--color-border-primary)] rounded px-3 py-2 text-sm text-[var(--color-text-primary)] placeholder:text-[var(--color-text-muted)] disabled:opacity-50"
          />
          <Button size="icon" disabled>
            <Send className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}
