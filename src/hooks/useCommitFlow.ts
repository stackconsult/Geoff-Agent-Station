export async function runAutomaticCheckpoint(vaultPath: string) {
  try {
    const { invoke } = await import('@tauri-apps/api/core');
    await invoke('git_commit', { vaultPath, message: 'Auto-saved checkpoint' });
  } catch (error) {
    console.error('Failed to run automatic checkpoint:', error);
  }
}

export async function getGitStatus(vaultPath: string) {
  try {
    const { invoke } = await import('@tauri-apps/api/core');
    return await invoke('git_status', { vaultPath });
  } catch (error) {
    console.error('Failed to get git status:', error);
    return null;
  }
}

