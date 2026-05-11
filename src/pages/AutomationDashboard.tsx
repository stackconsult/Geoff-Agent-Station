import { useState } from 'react';
import { WorkflowBuilder } from '../components/automation/WorkflowBuilder';
import { AIChat } from '../components/ai/AIChat';
import { ClipboardHistory } from '../components/clipboard/ClipboardHistory';
import { ProductivityDashboard } from '../components/productivity/ProductivityDashboard';
import { SystemMonitor } from '../components/monitoring/SystemMonitor';

type Tab = 'workflows' | 'ai' | 'clipboard' | 'productivity' | 'monitoring';

export function AutomationDashboard() {
  const [activeTab, setActiveTab] = useState<Tab>('workflows');

  const tabs: { id: Tab; label: string; icon: string }[] = [
    { id: 'workflows', label: 'Workflows', icon: '⚙️' },
    { id: 'ai', label: 'AI Assistant', icon: '🤖' },
    { id: 'clipboard', label: 'Clipboard', icon: '📋' },
    { id: 'productivity', label: 'Productivity', icon: '📊' },
    { id: 'monitoring', label: 'System', icon: '💻' },
  ];

  return (
    <div className="h-screen flex flex-col bg-[var(--color-bg-primary)]">
      {/* Header */}
      <header className="h-14 border-b border-[var(--color-border)] flex items-center px-4 bg-[var(--color-bg-secondary)]">
        <h1 className="text-lg font-semibold text-[var(--color-text-primary)]">
          Ultimate Desktop Automation
        </h1>
        <div className="ml-auto flex gap-2">
          <button className="px-3 py-1.5 text-sm rounded hover:bg-[var(--color-bg-hover)] text-[var(--color-text-secondary)]">
            Settings
          </button>
        </div>
      </header>

      {/* Tab Navigation */}
      <nav className="h-12 border-b border-[var(--color-border)] flex items-center px-4 gap-2 bg-[var(--color-bg-secondary)]">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
              activeTab === tab.id
                ? 'bg-[var(--color-accent)] text-white'
                : 'text-[var(--color-text-secondary)] hover:bg-[var(--color-bg-hover)]'
            }`}
          >
            <span className="mr-2">{tab.icon}</span>
            {tab.label}
          </button>
        ))}
      </nav>

      {/* Content Area */}
      <main className="flex-1 overflow-hidden">
        {activeTab === 'workflows' && <WorkflowBuilder />}
        {activeTab === 'ai' && <AIChat />}
        {activeTab === 'clipboard' && <ClipboardHistory />}
        {activeTab === 'productivity' && <ProductivityDashboard />}
        {activeTab === 'monitoring' && <SystemMonitor />}
      </main>
    </div>
  );
}
