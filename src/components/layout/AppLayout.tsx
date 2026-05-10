import React from 'react';
import { cn } from '../../lib/utils';

interface AppLayoutProps {
  sidebar: React.ReactNode;
  noteList: React.ReactNode;
  editor: React.ReactNode;
  aiPanel: React.ReactNode;
  statusBar: React.ReactNode;
  className?: string;
}

/**
 * Four-Panel Layout matching Tolaria architecture
 * 
 * ┌────────┬─────────────┬─────────────────────────┬────────────┐
 * │Sidebar │ Note List   │ Editor                  │ Right Panel│
 * │(250px) │ (300px)     │ (flex-1)                │ (280px)    │
 * ├────────┴─────────────┴─────────────────────────┴────────────┤
 * │ StatusBar                                                   │
 * └─────────────────────────────────────────────────────────────┘
 */
export function AppLayout({
  sidebar,
  noteList,
  editor,
  aiPanel,
  statusBar,
  className,
}: AppLayoutProps) {
  return (
    <div className={cn("flex flex-col h-screen w-screen overflow-hidden bg-[var(--color-bg-primary)]", className)}>
      {/* Main Content Area */}
      <div className="flex flex-1 overflow-hidden">
        {/* Sidebar - 250px fixed */}
        <aside className="w-[var(--sidebar-width)] min-w-[200px] max-w-[400px] flex-shrink-0 border-r border-[var(--color-border-primary)] overflow-hidden">
          {sidebar}
        </aside>

        {/* Note List - 300px fixed */}
        <div className="w-[var(--note-list-width)] min-w-[250px] max-w-[500px] flex-shrink-0 border-r border-[var(--color-border-primary)] overflow-hidden">
          {noteList}
        </div>

        {/* Editor - flex-1 takes remaining */}
        <main className="flex-1 min-w-[400px] overflow-hidden">
          {editor}
        </main>

        {/* AI Panel - 280px fixed, collapsible */}
        <aside className="w-[var(--ai-panel-width)] min-w-[200px] max-w-[400px] flex-shrink-0 border-l border-[var(--color-border-primary)] overflow-hidden">
          {aiPanel}
        </aside>
      </div>

      {/* Status Bar - 32px fixed height */}
      <footer className="h-[var(--status-bar-height)] border-t border-[var(--color-border-primary)] flex-shrink-0">
        {statusBar}
      </footer>
    </div>
  );
}
