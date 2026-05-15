import { useState, useCallback } from 'react';
import type { VaultEntry } from '../types';

interface SearchBarProps {
  vaultPath: string;
  onResults: (results: VaultEntry[]) => void;
}

export function SearchBar({ vaultPath, onResults }: SearchBarProps) {
  const [query, setQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);

  const handleSearch = useCallback(
    async (searchQuery: string) => {
      if (!searchQuery.trim() || !vaultPath) {
        onResults([]);
        return;
      }

      setIsSearching(true);
      try {
        const { invoke } = await import('@tauri-apps/api/core');
        const results: string[] = await invoke('search_notes', {
          vaultPath,
          query: searchQuery,
        });

        // Results are note IDs - for now just return them as-is
        // In production, would fetch full note details
        onResults(
          results.map(
            (path): VaultEntry => ({
              path,
              filename: path.split(/[\\/]/).pop() ?? path,
              title: path.split(/[\\/]/).pop()?.replace(/\.md$/, '') ?? path,
              isA: null,
              aliases: [],
              belongsTo: [],
              relatedTo: [],
              status: null,
              archived: false,
              modifiedAt: null,
              createdAt: null,
              fileSize: 0,
              snippet: '',
              wordCount: 0,
              relationships: {},
              icon: null,
              color: null,
              order: null,
              sidebarLabel: null,
              template: null,
              sort: null,
              view: null,
              visible: null,
              organized: false,
              favorite: false,
              favoriteIndex: null,
              listPropertiesDisplay: [],
              outgoingLinks: [],
              properties: {},
              hasH1: false,
            })
          )
        );
      } catch (error) {
        console.error('Search failed:', error);
        onResults([]);
      } finally {
        setIsSearching(false);
      }
    },
    [vaultPath, onResults]
  );

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setQuery(value);

    // Debounce search
    const timeoutId = setTimeout(() => handleSearch(value), 300);
    return () => clearTimeout(timeoutId);
  };

  return (
    <div className="search-bar">
      <input
        type="text"
        value={query}
        onChange={handleChange}
        placeholder="Search notes..."
        disabled={isSearching}
      />
      {isSearching && <span className="search-spinner">...</span>}
    </div>
  );
}
