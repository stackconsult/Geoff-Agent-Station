import { useState, useCallback, useEffect } from 'react';
import { invoke } from '@tauri-apps/api/core';
import { toast } from 'sonner';

interface Workflow {
  id: string;
  name: string;
  description: string;
  enabled: boolean;
  triggers: any[];
  actions: any[];
}

export function WorkflowBuilder() {
  const [workflows, setWorkflows] = useState<Workflow[]>([]);
  const [selectedWorkflow, setSelectedWorkflow] = useState<Workflow | null>(
    null
  );
  const [isCreating, setIsCreating] = useState(false);

  const loadWorkflows = useCallback(async () => {
    try {
      const result = await invoke<Array<[string, Workflow]>>('list_workflows');
      const workflowList = result.map(([id, workflow]) => ({
        ...workflow,
        id,
      }));
      setWorkflows(workflowList);
    } catch (error) {
      console.error('Failed to load workflows:', error);
    }
  }, []);

  useEffect(() => {
    loadWorkflows();
  }, [loadWorkflows]);

  const createWorkflow = async () => {
    const newWorkflow = {
      name: 'New Workflow',
      description: 'Description',
      enabled: true,
      triggers: [],
      actions: [],
      conditions: null,
    };

    try {
      const id = await invoke<string>('create_workflow', {
        workflow: newWorkflow,
      });
      await loadWorkflows();
      setIsCreating(false);
    } catch (error) {
      toast.error(`Failed to create workflow: ${error}`);
    }
  };

  const executeWorkflow = async (id: string) => {
    try {
      await invoke('execute_workflow', { id });
      toast.success('Workflow executed successfully!');
    } catch (error) {
      toast.error(`Failed to execute workflow: ${error}`);
    }
  };

  const deleteWorkflow = async (id: string) => {
    try {
      await invoke('delete_workflow', { id });
      await loadWorkflows();
    } catch (error) {
      console.error('Failed to delete workflow:', error);
    }
  };

  return (
    <div className="h-full flex">
      {/* Workflow List */}
      <div className="w-80 border-r border-[var(--color-border)] bg-[var(--color-bg-secondary)] flex flex-col">
        <div className="p-4 border-b border-[var(--color-border)]">
          <button
            onClick={() => setIsCreating(true)}
            className="w-full px-4 py-2 bg-[var(--color-accent)] text-white rounded-md hover:opacity-90 font-medium"
          >
            + New Workflow
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-2">
          {workflows.map(workflow => (
            <div
              key={workflow.id}
              onClick={() => setSelectedWorkflow(workflow)}
              className={`p-3 rounded-md cursor-pointer transition-colors ${
                selectedWorkflow?.id === workflow.id
                  ? 'bg-[var(--color-accent)] text-white'
                  : 'bg-[var(--color-bg-primary)] hover:bg-[var(--color-bg-hover)]'
              }`}
            >
              <div className="flex items-center justify-between">
                <h3 className="font-medium">{workflow.name}</h3>
                <span
                  className={`w-2 h-2 rounded-full ${
                    workflow.enabled ? 'bg-green-500' : 'bg-gray-400'
                  }`}
                />
              </div>
              <p className="text-sm opacity-70 mt-1">{workflow.description}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Workflow Editor */}
      <div className="flex-1 p-6">
        {selectedWorkflow ? (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-bold text-[var(--color-text-primary)]">
                  {selectedWorkflow.name}
                </h2>
                <p className="text-[var(--color-text-secondary)] mt-1">
                  {selectedWorkflow.description}
                </p>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => executeWorkflow(selectedWorkflow.id)}
                  className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700"
                >
                  ▶ Run
                </button>
                <button
                  onClick={() => deleteWorkflow(selectedWorkflow.id)}
                  className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700"
                >
                  Delete
                </button>
              </div>
            </div>

            {/* Workflow Canvas */}
            <div className="border border-[var(--color-border)] rounded-lg p-8 bg-[var(--color-bg-secondary)] min-h-[400px]">
              <div className="text-center text-[var(--color-text-secondary)]">
                <p className="text-lg mb-2">Visual Workflow Builder</p>
                <p className="text-sm">
                  Drag and drop triggers, conditions, and actions to build your
                  workflow
                </p>
                <div className="mt-8 space-y-4">
                  <div className="p-4 bg-blue-500/10 border border-blue-500/30 rounded-md">
                    <p className="font-medium text-blue-400">
                      Triggers: {selectedWorkflow.triggers.length}
                    </p>
                  </div>
                  <div className="p-4 bg-purple-500/10 border border-purple-500/30 rounded-md">
                    <p className="font-medium text-purple-400">
                      Actions: {selectedWorkflow.actions.length}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="h-full flex items-center justify-center text-[var(--color-text-secondary)]">
            <div className="text-center">
              <p className="text-lg mb-2">No workflow selected</p>
              <p className="text-sm">
                Select a workflow from the list or create a new one
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
