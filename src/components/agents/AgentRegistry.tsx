import { useState } from 'react';
import { useAgentStore, AgentStatus } from '../../stores/agentStore';

export function AgentRegistry() {
  const { agents, registerAgent, removeAgent, setActiveAgent, activeAgentId } =
    useAgentStore();
  const [showCreateForm, setShowCreateForm] = useState(false);

  const handleCreateAgent = () => {
    registerAgent({
      name: 'New Agent',
      description: 'AI assistant for tasks',
      type: 'task',
      status: 'idle',
      model: 'ollama-llama3',
      capabilities: ['chat', 'analysis'],
    });
    setShowCreateForm(false);
  };

  return (
    <div className="h-full flex flex-col bg-[var(--color-bg-primary)]">
      <div className="h-14 border-b border-[var(--color-border)] flex items-center justify-between px-4 bg-[var(--color-bg-secondary)]">
        <h2 className="text-lg font-semibold text-[var(--color-text-primary)]">
          Agent Registry
        </h2>
        <button
          onClick={() => setShowCreateForm(!showCreateForm)}
          className="px-3 py-1.5 text-sm bg-[var(--color-accent)] text-white rounded hover:opacity-90"
        >
          + New Agent
        </button>
      </div>

      {showCreateForm && (
        <div className="p-4 border-b border-[var(--color-border)] bg-[var(--color-bg-secondary)]">
          <input
            type="text"
            placeholder="Agent name"
            className="w-full px-3 py-2 rounded bg-[var(--color-bg-primary)] border border-[var(--color-border)] text-[var(--color-text-primary)] mb-2"
          />
          <textarea
            placeholder="Description"
            className="w-full px-3 py-2 rounded bg-[var(--color-bg-primary)] border border-[var(--color-border)] text-[var(--color-text-primary)] mb-2"
          />
          <button
            onClick={handleCreateAgent}
            className="px-4 py-2 bg-[var(--color-accent)] text-white rounded text-sm"
          >
            Create Agent
          </button>
        </div>
      )}

      <div className="flex-1 overflow-y-auto p-4">
        {agents.length === 0 ? (
          <div className="text-sm text-[var(--color-text-secondary)] text-center py-8">
            No agents registered yet
          </div>
        ) : (
          <div className="space-y-2">
            {agents.map(agent => (
              <div
                key={agent.id}
                onClick={() => setActiveAgent(agent.id)}
                className={`p-4 rounded border cursor-pointer ${
                  activeAgentId === agent.id
                    ? 'bg-[var(--color-accent)] border-[var(--color-accent)] text-white'
                    : 'bg-[var(--color-bg-secondary)] border-[var(--color-border)]'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div>
                    <div className="font-medium">{agent.name}</div>
                    <div className="text-xs opacity-70 mt-1">
                      {agent.description}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span
                      className={`text-xs px-2 py-1 rounded ${
                        agent.status === 'running'
                          ? 'bg-green-500'
                          : agent.status === 'error'
                            ? 'bg-red-500'
                            : 'bg-gray-500'
                      }`}
                    >
                      {agent.status}
                    </span>
                    <button
                      onClick={e => {
                        e.stopPropagation();
                        removeAgent(agent.id);
                      }}
                      className="text-xs hover:text-red-400"
                    >
                      ×
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
