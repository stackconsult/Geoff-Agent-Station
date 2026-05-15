import { create } from 'zustand';

type SyncStatus = 'idle' | 'syncing' | 'error';

interface EditorState {
  content: string;
  syncStatus: SyncStatus;
  lastSyncTime: number | null;
  isLoadingNote: boolean;
  setContent: (content: string) => void;
  setSyncStatus: (status: SyncStatus) => void;
  setIsLoadingNote: (loading: boolean) => void;
  updateLastSync: () => void;
}

export const useEditorStore = create<EditorState>(set => ({
  content: '',
  syncStatus: 'idle',
  lastSyncTime: null,
  isLoadingNote: false,

  setContent: content => set({ content }),
  setSyncStatus: status => set({ syncStatus: status }),
  setIsLoadingNote: loading => set({ isLoadingNote: loading }),
  updateLastSync: () => set({ lastSyncTime: Date.now() }),
}));
