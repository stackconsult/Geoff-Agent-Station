import { describe, it, expect, vi, beforeEach } from 'vitest';
import { useVaultStore } from './vaultStore';

describe('vaultStore', () => {
  beforeEach(() => {
    useVaultStore.setState({
      vaultPath: '',
      notes: [],
      currentNote: null,
      isLoading: false,
      error: null,
    });
  });

  it('selects a note', () => {
    const note = { path: '/test.md', filename: 'test', title: 'Test' } as any;
    useVaultStore.getState().selectNote(note);

    expect(useVaultStore.getState().currentNote).toEqual(note);
  });

  it('sets error state', () => {
    useVaultStore.setState({ error: 'Test error' });
    expect(useVaultStore.getState().error).toBe('Test error');
  });
});
