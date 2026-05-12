import { useState, useCallback } from 'react';

interface WorkflowNode {
  id: string;
  type: 'trigger' | 'action' | 'condition' | 'loop';
  label: string;
  position: { x: number; y: number };
  connections: string[];
}

interface VisualWorkflowBuilderProps {
  onWorkflowSave: (workflow: WorkflowNode[]) => void;
}

export function VisualWorkflowBuilder({ onWorkflowSave }: VisualWorkflowBuilderProps) {
  const [nodes, setNodes] = useState<WorkflowNode[]>([
    { id: '1', type: 'trigger', label: 'Start', position: { x: 100, y: 100 }, connections: ['2'] },
    { id: '2', type: 'action', label: 'Action', position: { x: 300, y: 100 }, connections: [] }
  ]);
  const [selectedNode, setSelectedNode] = useState<string | null>(null);

  const handleNodeDrag = useCallback((nodeId: string, dx: number, dy: number) => {
    setNodes(nodes => nodes.map(node => 
      node.id === nodeId 
        ? { ...node, position: { x: node.position.x + dx, y: node.position.y + dy } }
        : node
    ));
  }, []);

  const addNode = (type: WorkflowNode['type']) => {
    const newNode: WorkflowNode = {
      id: `${Date.now()}`,
      type,
      label: type.charAt(0).toUpperCase() + type.slice(1),
      position: { x: 100 + Math.random() * 200, y: 100 + Math.random() * 200 },
      connections: []
    };
    setNodes([...nodes, newNode]);
  };

  const deleteNode = (nodeId: string) => {
    setNodes(nodes.filter(n => n.id !== nodeId));
    if (selectedNode === nodeId) setSelectedNode(null);
  };

  return (
    <div className="h-full flex flex-col bg-[var(--color-bg-primary)]">
      <div className="h-14 border-b border-[var(--color-border)] flex items-center justify-between px-4 bg-[var(--color-bg-secondary)]">
        <h1 className="text-lg font-semibold text-[var(--color-text-primary)]">Visual Workflow Builder</h1>
        <div className="flex items-center gap-2">
          <button className="px-3 py-1.5 text-sm bg-[var(--color-accent)] text-white rounded hover:opacity-90">
            Save Workflow
          </button>
        </div>
      </div>
      <div className="flex-1 flex overflow-hidden">
        <div className="w-64 border-r border-[var(--color-border)] bg-[var(--color-bg-secondary)] p-4">
          <h3 className="text-sm font-semibold text-[var(--color-text-primary)] mb-3">Add Node</h3>
          <div className="space-y-2">
            <button onClick={() => addNode('trigger')} className="w-full px-3 py-2 text-sm rounded bg-[var(--color-bg-primary)] hover:bg-[var(--color-bg-hover)] text-[var(--color-text-primary)] border border-[var(--color-border)]">
              ⚡ Trigger
            </button>
            <button onClick={() => addNode('action')} className="w-full px-3 py-2 text-sm rounded bg-[var(--color-bg-primary)] hover:bg-[var(--color-bg-hover)] text-[var(--color-text-primary)] border border-[var(--color-border)]">
              🔧 Action
            </button>
            <button onClick={() => addNode('condition')} className="w-full px-3 py-2 text-sm rounded bg-[var(--color-bg-primary)] hover:bg-[var(--color-bg-hover)] text-[var(--color-text-primary)] border border-[var(--color-border)]">
              🔀 Condition
            </button>
            <button onClick={() => addNode('loop')} className="w-full px-3 py-2 text-sm rounded bg-[var(--color-bg-primary)] hover:bg-[var(--color-bg-hover)] text-[var(--color-text-primary)] border border-[var(--color-border)]">
              🔄 Loop
            </button>
          </div>
        </div>
        <div className="flex-1 relative bg-[var(--color-bg-primary)] overflow-hidden">
          <svg className="w-full h-full">
            {nodes.map(node => (
              <g key={node.id}>
                <line
                  stroke="var(--color-border)"
                  strokeWidth="2"
                  markerEnd="url(#arrowhead)"
                />
                <rect
                  x={node.position.x}
                  y={node.position.y}
                  width={120}
                  height={50}
                  rx={8}
                  fill={selectedNode === node.id ? 'var(--color-accent)' : 'var(--color-bg-secondary)'}
                  stroke={selectedNode === node.id ? 'var(--color-accent)' : 'var(--color-border)'}
                  strokeWidth={2}
                  onClick={() => setSelectedNode(node.id)}
                  className="cursor-move"
                />
                <text
                  x={node.position.x + 60}
                  y={node.position.y + 30}
                  textAnchor="middle"
                  fill={selectedNode === node.id ? 'white' : 'var(--color-text-primary)'}
                  fontSize={12}
                >
                  {node.label}
                </text>
              </g>
            ))}
          </svg>
          {selectedNode && (
            <div className="absolute bottom-4 right-4 px-4 py-2 bg-[var(--color-bg-secondary)] border border-[var(--color-border)] rounded shadow-lg">
              <button
                onClick={() => deleteNode(selectedNode)}
                className="px-3 py-1 text-sm bg-red-500 text-white rounded hover:bg-red-600"
              >
                Delete Node
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
