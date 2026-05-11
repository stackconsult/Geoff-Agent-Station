import { describe, it, expect } from 'vitest';
import { useEditorStore } from './editorStore';

describe('editorStore', () => {
  it('sets content', () => {
    useEditorStore.getState().setContent('test content');
    expect(useEditorStore.getState().content).toBe('test content');
  });

  it('sets sync status', () => {
    useEditorStore.getState().setSyncStatus('syncing');
    expect(useEditorStore.getState().syncStatus).toBe('syncing');
  });

  it('updates last sync time', () => {
    useEditorStore.getState().updateLastSync();
    expect(useEditorStore.getState().lastSyncTime).toBeGreaterThan(0);
  });
});
