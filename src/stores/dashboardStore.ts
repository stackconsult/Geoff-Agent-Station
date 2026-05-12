import { create } from 'zustand';

export type DashboardType = 'editor' | 'ai' | 'automation';

export interface DashboardConfig {
  id: string;
  type: DashboardType;
  title: string;
  icon: string;
  isActive: boolean;
}

export interface VaultConfig {
  id: string;
  path: string;
  name: string;
  isActive: boolean;
}

interface DashboardState {
  activeDashboardId: string | null;
  dashboards: DashboardConfig[];
  vaultConfigs: VaultConfig[];
  setVaultConfigs: (configs: VaultConfig[]) => void;
  addVaultConfig: (config: VaultConfig) => void;
  removeVaultConfig: (id: string) => void;
}

export const useDashboardStore = create<DashboardState>((set) => ({
  activeDashboardId: 'editor-1',
  dashboards: [{ id: 'editor-1', type: 'editor', title: 'Editor', icon: '📝', isActive: true }],
  vaultConfigs: [],
  
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
    dashboards: state.dashboards.filter((d) => d.id !== id),
    activeDashboardId: state.activeDashboardId === id ? null : state.activeDashboardId
  })),
  
  setVaultConfigs: (configs) => set({ vaultConfigs: configs }),
  
  addVaultConfig: (config) => set((state) => ({
    vaultConfigs: [...state.vaultConfigs, config]
  })),
  
  removeVaultConfig: (id) => set((state) => ({
    vaultConfigs: state.vaultConfigs.filter((v) => v.id !== id)
  }))
}));
