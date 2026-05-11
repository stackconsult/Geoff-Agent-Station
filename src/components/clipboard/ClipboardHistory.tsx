import { useState, useEffect } from 'react';
import { invoke } from '@tauri-apps/api/core';

interface ClipboardEntry {
  id: string;
  content: string;
  format: string;
  source_app: string | null;
  timestamp: string;
  favorite: boolean;
}

export function ClipboardHistory() {
  const [entries, setEntries] = useState<ClipboardEntry[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [filteredEntries, setFilteredEntries] = useState<ClipboardEntry[]>([]);

  useEffect(() => {
    loadHistory();
  }, []);

  useEffect(() => {
    if (searchQuery) {
      searchEntries(searchQuery);
    } else {
      setFilteredEntries(entries);
    }
  }, [searchQuery, entries]);

  const loadHistory = async () => {
    try {
      const history = await invoke<ClipboardEntry[]>('clipboard_get_history');
      setEntries(history);
      setFilteredEntries(history);
    } catch (error) {
      console.error('Failed to load clipboard history:', error);
    }
  };

  const searchEntries = async (query: string) => {
    try {
      const results = await invoke<ClipboardEntry[]>('clipboard_search', { query });
      setFilteredEntries(results);
    } catch (error) {
      console.error('Failed to search clipboard:', error);
    }
  };

  const copyToClipboard = async (content: string) => {
    try {
      await invoke('clipboard_set_text', { text: content });
      alert('Copied to clipboard!');
    } catch (error) {
      console.error('Failed to copy:', error);
    }
  };

  const toggleFavorite = async (id: string) => {
    try {
      await invoke('clipboard_toggle_favorite', { id });
      await loadHistory();
    } catch (error) {
      console.error('Failed to toggle favorite:', error);
    }
  };

  const deleteEntry = async (id: string) => {
    try {
      await invoke('clipboard_delete_entry', { id });
      await loadHistory();
    } catch (error) {
      console.error('Failed to delete entry:', error);
    }
  };

  const clearHistory = async () => {
    if (confirm('Are you sure you want to clear all clipboard history?')) {
      try {
        await invoke('clipboard_clear_history');
        await loadHistory();
      } catch (error) {
        console.error('Failed to clear history:', error);
      }
    }
  };

  return (
    <div className="h-full flex flex-col bg-[var(--color-bg-primary)]">
      {/* Header */}
      <div className="p-4 border-b border-[var(--color-border)] bg-[var(--color-bg-secondary)]">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-lg font-semibold text-[var(--color-text-primary)]">
            Clipboard History
          </h2>
          <button
            onClick={clearHistory}
            className="px-3 py-1.5 text-sm rounded hover:bg-[var(--color-bg-hover)] text-red-500"
          >
            Clear All
          </button>
        </div>
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Search clipboard history..."
          className="w-full px-4 py-2 rounded-md bg-[var(--color-bg-primary)] border border-[var(--color-border)] text-[var(--color-text-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--color-accent)]"
        />
      </div>

      {/* Entries */}
      <div className="flex-1 overflow-y-auto p-4 space-y-2">
        {filteredEntries.length === 0 ? (
          <div className="h-full flex items-center justify-center text-[var(--color-text-secondary)]">
            <div className="text-center">
              <p className="text-lg mb-2">No clipboard history</p>
              <p className="text-sm">Copy something to get started</p>
            </div>
          </div>
        ) : (
          filteredEntries.map((entry) => (
            <div
              key={entry.id}
              className="p-3 rounded-md bg-[var(--color-bg-secondary)] border border-[var(--color-border)] hover:border-[var(--color-accent)] transition-colors group"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-[var(--color-text-primary)] line-clamp-2 font-mono">
                    {entry.content}
                  </p>
                  <div className="flex items-center gap-2 mt-2 text-xs text-[var(--color-text-secondary)]">
                    <span>{new Date(entry.timestamp).toLocaleString()}</span>
                    {entry.source_app && <span>• {entry.source_app}</span>}
                  </div>
                </div>
                <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button
                    onClick={() => toggleFavorite(entry.id)}
                    className="p-1.5 rounded hover:bg-[var(--color-bg-hover)]"
                    title="Toggle favorite"
                  >
                    {entry.favorite ? '⭐' : '☆'}
                  </button>
                  <button
                    onClick={() => copyToClipboard(entry.content)}
                    className="p-1.5 rounded hover:bg-[var(--color-bg-hover)]"
                    title="Copy"
                  >
                    📋
                  </button>
                  <button
                    onClick={() => deleteEntry(entry.id)}
                    className="p-1.5 rounded hover:bg-[var(--color-bg-hover)] text-red-500"
                    title="Delete"
                  >
                    🗑️
                  </button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
