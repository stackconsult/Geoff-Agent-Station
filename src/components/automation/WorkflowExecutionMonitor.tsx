interface WorkflowExecutionStep {
  id: string;
  name: string;
  status: 'pending' | 'running' | 'completed' | 'failed';
  startTime?: Date;
  endTime?: Date;
  output?: string;
  error?: string;
}

interface WorkflowExecutionMonitorProps {
  steps: WorkflowExecutionStep[];
  isRunning: boolean;
}

export function WorkflowExecutionMonitor({ steps, isRunning }: WorkflowExecutionMonitorProps) {
  return (
    <div className="h-full flex flex-col bg-[var(--color-bg-primary)]">
      <div className="h-12 border-b border-[var(--color-border)] flex items-center justify-between px-4 bg-[var(--color-bg-secondary)]">
        <h3 className="text-sm font-semibold text-[var(--color-text-primary)]">Execution Monitor</h3>
        {isRunning && (
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
            <span className="text-xs text-[var(--color-text-secondary)]">Running</span>
          </div>
        )}
      </div>
      <div className="flex-1 overflow-y-auto p-4">
        <div className="space-y-2">
          {steps.map((step, idx) => (
            <div key={step.id} className="p-3 rounded bg-[var(--color-bg-secondary)] border border-[var(--color-border)]">
              <div className="flex items-center gap-2">
                <div className={`w-3 h-3 rounded-full ${
                  step.status === 'completed' ? 'bg-green-500' :
                  step.status === 'running' ? 'bg-blue-500 animate-pulse' :
                  step.status === 'failed' ? 'bg-red-500' :
                  'bg-gray-400'
                }`} />
                <span className="text-sm font-medium text-[var(--color-text-primary)]">{step.name}</span>
                <span className="text-xs text-[var(--color-text-secondary)] ml-auto">
                  {step.status.charAt(0).toUpperCase() + step.status.slice(1)}
                </span>
              </div>
              {step.output && (
                <div className="mt-2 p-2 bg-[var(--color-bg-primary)] rounded text-xs text-[var(--color-text-secondary)]">
                  {step.output}
                </div>
              )}
              {step.error && (
                <div className="mt-2 p-2 bg-red-500/10 border border-red-500 rounded text-xs text-red-400">
                  {step.error}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
