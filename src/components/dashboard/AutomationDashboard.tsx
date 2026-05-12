import { WorkflowBuilder } from '../automation/WorkflowBuilder';
import { ClipboardHistory } from '../clipboard/ClipboardHistory';
import { ProductivityDashboard } from '../productivity/ProductivityDashboard';
import { SystemMonitor } from '../monitoring/SystemMonitor';

export function AutomationDashboard() {
  return (
    <div className="h-full flex flex-col bg-[var(--color-bg-primary)]">
      <div className="h-14 border-b border-[var(--color-border)] flex items-center px-4 bg-[var(--color-bg-secondary)]">
        <h1 className="text-lg font-semibold text-[var(--color-text-primary)]">Automation Dashboard</h1>
      </div>
      <div className="flex-1 overflow-hidden">
        <WorkflowBuilder />
      </div>
    </div>
  );
}
