import { describe, it, expect } from 'vitest';
import { useUIStore } from './uiStore';

describe('uiStore', () => {
  it('toggles AI panel', () => {
    const initialOpen = useUIStore.getState().aiPanelOpen;
    useUIStore.getState().toggleAi();
    expect(useUIStore.getState().aiPanelOpen).toBe(!initialOpen);
  });

  it('sets editor mode', () => {
    useUIStore.getState().setEditorMode('raw');
    expect(useUIStore.getState().editorMode).toBe('raw');
  });

  it('sets search query', () => {
    useUIStore.getState().setSearchQuery('test');
    expect(useUIStore.getState().searchQuery).toBe('test');
  });
});
