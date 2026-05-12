import { create } from 'zustand';

export type AgentStatus = 'idle' | 'running' | 'paused' | 'completed' | 'error';

export interface Agent {
  id: string;
  name: string;
  description: string;
  type: 'chat' | 'task' | 'workflow';
  status: AgentStatus;
  model: string;
  capabilities: string[];
  createdAt: Date;
}

interface AgentState {
  agents: Agent[];
  activeAgentId: string | null;
  registerAgent: (agent: Omit<Agent, 'id' | 'createdAt'>) => void;
  removeAgent: (id: string) => void;
  setActiveAgent: (id: string) => void;
  updateAgentStatus: (id: string, status: AgentStatus) => void;
}

export const useAgentStore = create<AgentState>((set) => ({
  agents: [],
  activeAgentId: null,

  registerAgent: (agent) => set((state) => ({
    agents: [...state.agents, { ...agent, id: `agent-${Date.now()}`, createdAt: new Date() }]
  })),

  removeAgent: (id) => set((state) => ({
    agents: state.agents.filter((a) => a.id !== id),
    activeAgentId: state.activeAgentId === id ? null : state.activeAgentId
  })),

  setActiveAgent: (id) => set({ activeAgentId: id }),

  updateAgentStatus: (id, status) => set((state) => ({
    agents: state.agents.map((a) => (a.id === id ? { ...a, status } : a))
  }))
}));
