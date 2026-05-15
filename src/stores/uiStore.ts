import { create } from 'zustand';
import type { SidebarSelection } from '../types';

interface UIState {
  aiPanelOpen: boolean;
  editorMode: 'rich' | 'raw';
  searchQuery: string;
  sidebarSelection: SidebarSelection;
  showAutomation: boolean;
  toggleAi: () => void;
  setEditorMode: (mode: 'rich' | 'raw') => void;
  setSearchQuery: (query: string) => void;
  setSidebarSelection: (selection: SidebarSelection) => void;
  setShowAutomation: (show: boolean) => void;
}

export const useUIStore = create<UIState>(set => ({
  aiPanelOpen: true,
  editorMode: 'rich',
  searchQuery: '',
  sidebarSelection: { kind: 'filter', filter: 'inbox' },
  showAutomation: false,

  toggleAi: () => set(state => ({ aiPanelOpen: !state.aiPanelOpen })),
  setEditorMode: mode => set({ editorMode: mode }),
  setSearchQuery: query => set({ searchQuery: query }),
  setSidebarSelection: selection => set({ sidebarSelection: selection }),
  setShowAutomation: show => set({ showAutomation: show }),
}));
