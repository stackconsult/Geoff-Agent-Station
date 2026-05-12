import { create } from 'zustand';

export type DashboardType = 'editor' | 'ai' | 'automation';

export interface DashboardConfig {
  id: string;
  type: DashboardType;
  title: string;
  icon: string;
  isActive: boolean;
}

interface DashboardState {
  activeDashboardId: string | null;
  dashboards: DashboardConfig[];
  setActiveDashboard: (id: string) => void;
  addDashboard: (type: DashboardType) => void;
  removeDashboard: (id: string) => void;
}

export const useDashboardStore = create<DashboardState>((set) => ({
  activeDashboardId: 'editor-1',
  dashboards: [{ id: 'editor-1', type: 'editor', title: 'Editor', icon: '📝', isActive: true }],
  
  setActiveDashboard: (id) => set((state) => ({
    activeDashboardId: id,
    dashboards: state.dashboards.map((d) => ({ ...d, isActive: d.id === id }))
  })),
  
  addDashboard: (type) => set((state) => ({
    dashboards: [...state.dashboards, { 
      id: `${type}-${Date.now()}`, 
      type, 
      title: type === 'ai' ? 'AI' : type === 'automation' ? 'Automation' : 'Editor', 
      icon: type === 'ai' ? '🤖' : type === 'automation' ? '⚙️' : '📝', 
      isActive: false 
    }]
  })),
  
  removeDashboard: (id) => set((state) => ({
    dashboards: state.dashboards.filter((d) => d.id !== id)
  }))
}));
