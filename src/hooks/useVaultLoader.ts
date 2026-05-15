import { useEffect } from 'react';

export function useVaultLoader(vaultPath: string) {
  useEffect(() => {
    // Sync MCP bridge for selected vault
    const syncMcpBridge = async () => {
      try {
        const { invoke } = await import('@tauri-apps/api/core');
        await invoke('spawn_mcp_server', { vaultPath });
      } catch (error) {
        console.error('Failed to spawn MCP server:', error);
      }
    };

    syncMcpBridge();
  }, [vaultPath]);
}
