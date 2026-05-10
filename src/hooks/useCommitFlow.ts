import { invoke } from '@tauri-apps/api/tauri';

export async function runAutomaticCheckpoint(vaultPath: string) {
  const timestamp = new Date().toISOString();
  const message = `AutoGit checkpoint - ${timestamp}`;
  
  try {
    await invoke('git_commit', {
      vaultPath,
      message
    });
    return true;
  } catch (error) {
    console.error('Failed to create checkpoint:', error);
    return false;
  }
}

export async function getGitStatus(vaultPath: string): Promise<string> {
  try {
    return await invoke('git_status', { vaultPath });
  } catch (error) {
    console.error('Failed to get git status:', error);
    return '';
  }
}
