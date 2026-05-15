import { create } from 'zustand';
import { invoke } from '@tauri-apps/api/core';
import type { VaultEntry } from '../types';

interface VaultState {
  vaultPath: string;
  notes: VaultEntry[];
  currentNote: VaultEntry | null;
  isLoading: boolean;
  error: string | null;
  loadNotes: (path: string) => Promise<void>;
  selectNote: (note: VaultEntry) => void;
  saveNote: (path: string, content: string) => Promise<void>;
}

export const useVaultStore = create<VaultState>((set, get) => ({
  vaultPath: '',
  notes: [],
  currentNote: null,
  isLoading: false,
  error: null,

  loadNotes: async (path: string) => {
    console.log('[vaultStore] Loading notes from:', path);
    set({ isLoading: true, error: null });
    try {
      const notes: VaultEntry[] = await invoke('scan_vault', {
        vaultPath: path,
      });
      console.log('[vaultStore] Loaded', notes.length, 'notes');
      set({ vaultPath: path, notes, isLoading: false });
    } catch (error) {
      console.error('[vaultStore] Failed to load notes:', error);
      set({ error: String(error), isLoading: false });
    }
  },

  selectNote: (note: VaultEntry) => {
    set({ currentNote: note });
  },

  saveNote: async (path: string, content: string) => {
    try {
      await invoke('save_note_content', { path, content });
      const { vaultPath } = get();
      if (vaultPath) {
        await get().loadNotes(vaultPath);
      }
    } catch (error) {
      set({ error: String(error) });
    }
  },
}));
