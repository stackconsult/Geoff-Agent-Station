import { useState } from 'react';
import { open } from '@tauri-apps/plugin-dialog';
import { useVaultStore } from '../../stores/vaultStore';

interface VaultConfig {
  id: string;
  path: string;
  name: string;
  isActive: boolean;
}

export function VaultSwitcher() {
  const { vaultPath, loadNotes } = useVaultStore();
  const [vaults, setVaults] = useState<VaultConfig[]>([
    {
      id: '1',
      path: vaultPath || '',
      name: vaultPath?.split(/[\\/]/).pop() || 'Default',
      isActive: true,
    },
  ]);

  const handleSwitchVault = (vaultId: string) => {
    const vault = vaults.find(v => v.id === vaultId);
    if (vault) {
      loadNotes(vault.path);
      setVaults(vaults.map(v => ({ ...v, isActive: v.id === vaultId })));
    }
  };

  const handleAddVault = async () => {
    try {
      const selected = await open({
        directory: true,
        multiple: false,
        title: 'Select Vault Directory',
      });

      if (selected && typeof selected === 'string') {
        const vaultName = selected.split(/[\\/]/).pop() || 'New Vault';
        const newVault: VaultConfig = {
          id: `vault-${Date.now()}`,
          path: selected,
          name: vaultName,
          isActive: true,
        };

        setVaults(vaults.map(v => ({ ...v, isActive: false })));
        setVaults([...vaults, newVault]);

        loadNotes(selected);
      }
    } catch (error) {
      console.error('Failed to open vault selector:', error);
    }
  };

  return (
    <div className="p-4">
      <h3 className="text-sm font-semibold mb-3">Vault Switcher</h3>
      <div className="space-y-2">
        {vaults.map(vault => (
          <button
            key={vault.id}
            onClick={() => handleSwitchVault(vault.id)}
            className={`w-full text-left px-3 py-2 rounded border ${
              vault.isActive
                ? 'bg-[var(--color-accent)] border-[var(--color-accent)] text-white'
                : 'bg-[var(--color-bg-secondary)] border-[var(--color-border)] text-[var(--color-text-primary)]'
            }`}
          >
            <div className="font-medium">{vault.name}</div>
            <div className="text-xs opacity-70 mt-1">{vault.path}</div>
          </button>
        ))}
        <button
          onClick={handleAddVault}
          className="w-full px-3 py-2 rounded border border-dashed border-[var(--color-border)] text-[var(--color-text-secondary)] hover:bg-[var(--color-bg-hover)]"
        >
          + Add Vault
        </button>
      </div>
    </div>
  );
}
