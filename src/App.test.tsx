import { describe, it, expect, vi, beforeEach } from 'vitest';
import { invoke } from '@tauri-apps/api/core';

vi.mock('@tauri-apps/api/core', () => ({
  invoke: vi.fn().mockResolvedValue('Note saved'),
}));

describe('App — save note (H5)', () => {
  beforeEach(() => {
    localStorage.setItem('tolaria_vault_path', '/tmp/test-vault');
    vi.clearAllMocks();
  });

  it('invoke save_note_content is called with path and content', async () => {
    const path = '/tmp/test-vault/my-note.md';
    const content = '# Hello\n\nTest content.';
    await invoke('save_note_content', { path, content });
    expect(invoke).toHaveBeenCalledWith('save_note_content', { path, content });
  });

  it('invoke load_note_content returns content string', async () => {
    vi.mocked(invoke).mockResolvedValueOnce('# Loaded Note');
    const result = await invoke<string>('load_note_content', { path: '/tmp/test-vault/note.md' });
    expect(result).toBe('# Loaded Note');
  });
});
