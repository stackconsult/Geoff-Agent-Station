import { useState, useEffect } from 'react';
import { VisualWorkflowBuilder } from '../automation/VisualWorkflowBuilder';
import { WorkflowExecutionMonitor } from '../automation/WorkflowExecutionMonitor';
import { WorkflowBuilder } from '../automation/WorkflowBuilder';
import { eventBus } from '../../utils/eventBus';

export function AutomationDashboard() {
  const [view, setView] = useState<'visual' | 'list' | 'monitor'>('visual');
  const [executionSteps, setExecutionSteps] = useState([]);

  useEffect(() => {
    const unsubscribeNote = eventBus.on('note_selected', (data) => {
      console.log('AutomationDashboard received note_selected:', data);
    });

    const unsubscribeAgent = eventBus.on('agent_started', (data) => {
      console.log('AutomationDashboard received agent_started:', data);
    });

    return () => {
      unsubscribeNote();
      unsubscribeAgent();
    };
  }, []);

  return (
    <div className="h-full flex flex-col bg-[var(--color-bg-primary)]">
      <div className="h-14 border-b border-[var(--color-border)] flex items-center justify-between px-4 bg-[var(--color-bg-secondary)]">
        <h1 className="text-lg font-semibold text-[var(--color-text-primary)]">Automation Dashboard</h1>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setView('visual')}
            className={`px-3 py-1.5 text-sm rounded ${view === 'visual' ? 'bg-[var(--color-accent)] text-white' : 'hover:bg-[var(--color-bg-hover)] text-[var(--color-text-secondary)]'}`}
          >
            Visual Builder
          </button>
          <button
            onClick={() => setView('list')}
            className={`px-3 py-1.5 text-sm rounded ${view === 'list' ? 'bg-[var(--color-accent)] text-white' : 'hover:bg-[var(--color-bg-hover)] text-[var(--color-text-secondary)]'}`}
          >
            List View
          </button>
          <button
            onClick={() => setView('monitor')}
            className={`px-3 py-1.5 text-sm rounded ${view === 'monitor' ? 'bg-[var(--color-accent)] text-white' : 'hover:bg-[var(--color-bg-hover)] text-[var(--color-text-secondary)]'}`}
          >
            Monitor
          </button>
        </div>
      </div>
      <div className="flex-1 flex overflow-hidden">
        {view === 'visual' && <VisualWorkflowBuilder onWorkflowSave={() => {}} />}
        {view === 'list' && <WorkflowBuilder />}
        {view === 'monitor' && <WorkflowExecutionMonitor steps={executionSteps} isRunning={false} />}
      </div>
    </div>
  );
}
