import { useEffect } from 'react';
import { invoke } from '@tauri-apps/api/tauri';

export function useVaultLoader(vaultPath: string) {
  useEffect(() => {
    // Sync MCP bridge for selected vault
    const syncMcpBridge = async () => {
      try {
        await invoke('spawn_mcp_server', { vaultPath });
      } catch (error) {
        console.error('Failed to spawn MCP server:', error);
      }
    };

    syncMcpBridge();
  }, [vaultPath]);
}
