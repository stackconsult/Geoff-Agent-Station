import { useState, useEffect } from 'react';
import { invoke } from '@tauri-apps/api/core';

interface AISettings {
  provider: 'ollama' | 'openai' | 'custom';
  model: string;
  baseUrl: string;
  temperature: number;
}

interface SettingsPanelProps {
  isOpen: boolean;
  onClose: () => void;
}

export function SettingsPanel({ isOpen, onClose }: SettingsPanelProps) {
  const [vaultPath, setVaultPath] = useState('');
  const [aiSettings, setAiSettings] = useState<AISettings>({
    provider: 'ollama',
    model: 'llama3.2',
    baseUrl: 'http://localhost:11434',
    temperature: 0.7,
  });

  useEffect(() => {
    // Load settings from localStorage
    const savedVaultPath = localStorage.getItem('tolaria_vault_path');
    if (savedVaultPath) setVaultPath(savedVaultPath);

    const savedAiSettings = localStorage.getItem('tolaria_ai_settings');
    if (savedAiSettings) {
      setAiSettings(JSON.parse(savedAiSettings));
    }
  }, []);

  const handleSave = () => {
    localStorage.setItem('tolaria_vault_path', vaultPath);
    localStorage.setItem('tolaria_ai_settings', JSON.stringify(aiSettings));
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-[var(--color-bg-secondary)] rounded-lg p-6 w-[500px] max-w-[90vw] border border-[var(--color-border-primary)]">
        <h2 className="text-xl font-semibold mb-4 text-[var(--color-text-primary)]">
          Settings
        </h2>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1 text-[var(--color-text-secondary)]">
              Vault Path
            </label>
            <input
              type="text"
              value={vaultPath}
              onChange={e => setVaultPath(e.target.value)}
              className="w-full px-3 py-2 bg-[var(--color-bg-primary)] border border-[var(--color-border-primary)] rounded text-[var(--color-text-primary)]"
              placeholder="/path/to/vault"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1 text-[var(--color-text-secondary)]">
              AI Provider
            </label>
            <select
              value={aiSettings.provider}
              onChange={e =>
                setAiSettings({
                  ...aiSettings,
                  provider: e.target.value as AISettings['provider'],
                })
              }
              className="w-full px-3 py-2 bg-[var(--color-bg-primary)] border border-[var(--color-border-primary)] rounded text-[var(--color-text-primary)]"
            >
              <option value="ollama">Ollama</option>
              <option value="openai">OpenAI</option>
              <option value="custom">Custom</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium mb-1 text-[var(--color-text-secondary)]">
              Model
            </label>
            <input
              type="text"
              value={aiSettings.model}
              onChange={e =>
                setAiSettings({ ...aiSettings, model: e.target.value })
              }
              className="w-full px-3 py-2 bg-[var(--color-bg-primary)] border border-[var(--color-border-primary)] rounded text-[var(--color-text-primary)]"
              placeholder="llama3.2"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1 text-[var(--color-text-secondary)]">
              Base URL
            </label>
            <input
              type="text"
              value={aiSettings.baseUrl}
              onChange={e =>
                setAiSettings({ ...aiSettings, baseUrl: e.target.value })
              }
              className="w-full px-3 py-2 bg-[var(--color-bg-primary)] border border-[var(--color-border-primary)] rounded text-[var(--color-text-primary)]"
              placeholder="http://localhost:11434"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1 text-[var(--color-text-secondary)]">
              Temperature: {aiSettings.temperature}
            </label>
            <input
              type="range"
              min="0"
              max="2"
              step="0.1"
              value={aiSettings.temperature}
              onChange={e =>
                setAiSettings({
                  ...aiSettings,
                  temperature: parseFloat(e.target.value),
                })
              }
              className="w-full"
            />
          </div>
        </div>

        <div className="flex justify-end gap-2 mt-6">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-[var(--color-bg-primary)] border border-[var(--color-border-primary)] rounded text-[var(--color-text-primary)]"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            className="px-4 py-2 bg-[var(--color-accent)] text-white rounded"
          >
            Save
          </button>
        </div>
      </div>
    </div>
  );
}
