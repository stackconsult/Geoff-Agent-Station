import { useState } from 'react';
import { invoke } from '@tauri-apps/api/core';
import { useAgentStore } from '../../stores/agentStore';

export function AgentExecutionEngine() {
  const { agents, activeAgentId, updateAgentStatus } = useAgentStore();
  const [isExecuting, setIsExecuting] = useState(false);
  const [output, setOutput] = useState('');
  const activeAgent = agents.find(a => a.id === activeAgentId);

  const executeAgent = async () => {
    if (!activeAgent || isExecuting) return;
    setIsExecuting(true);
    updateAgentStatus(activeAgent.id, 'running');
    try {
      const result = await invoke('agent_execute', {
        agentId: activeAgent.id,
        agentType: activeAgent.type,
        model: activeAgent.model,
        capabilities: activeAgent.capabilities,
      });
      setOutput(result.output);
      updateAgentStatus(activeAgent.id, 'completed');
    } catch (error) {
      setOutput(`Error: ${String(error)}`);
      updateAgentStatus(activeAgent.id, 'error');
    } finally {
      setIsExecuting(false);
    }
  };

  return (
    <div className="h-full flex flex-col bg-[var(--color-bg-primary)]">
      <div className="h-14 border-b border-[var(--color-border)] flex items-center justify-between px-4 bg-[var(--color-bg-secondary)]">
        <h2 className="text-lg font-semibold">Agent Execution</h2>
        {activeAgent && (
          <button
            onClick={executeAgent}
            disabled={isExecuting}
            className="px-4 py-2 bg-[var(--color-accent)] text-white rounded text-sm"
          >
            {isExecuting ? 'Running...' : 'Execute'}
          </button>
        )}
      </div>
      <div className="flex-1 p-4">
        {activeAgent ? (
          <div className="space-y-4">
            <div className="p-4 bg-[var(--color-bg-secondary)] rounded border border-[var(--color-border)]">
              <div className="font-medium">{activeAgent.name}</div>
              <div className="text-sm text-[var(--color-text-secondary)] mt-1">
                {activeAgent.description}
              </div>
              <div className="text-xs text-[var(--color-text-secondary)] mt-2">
                Status: {activeAgent.status}
              </div>
            </div>
            {output && (
              <div className="p-4 bg-[var(--color-bg-secondary)] rounded border border-[var(--color-border)]">
                <div className="text-sm font-medium mb-2">
                  Execution Output:
                </div>
                <div className="text-xs text-[var(--color-text-secondary)]">
                  {output}
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className="text-sm text-[var(--color-text-secondary)] text-center py-8">
            Select an agent
          </div>
        )}
      </div>
    </div>
  );
}
