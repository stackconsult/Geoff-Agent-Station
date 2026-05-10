import { invoke } from '@tauri-apps/api/tauri';

export async function organizeSelectedNotes(noteIds: string[], metadata: any) {
  for (const noteId of noteIds) {
    try {
      await invoke('update_frontmatter', {
        path: noteId,
        frontmatter: metadata
      });
    } catch (error) {
      console.error('Failed to organize note:', error);
    }
  }
}

export async function calculateInboxNotes(vaultPath: string): Promise<string[]> {
  try {
    const entries = await invoke('scan_vault', { vaultPath });
    // Filter notes with no outgoing links
    return entries.filter((entry: any) => entry.links.length === 0)
      .map((entry: any) => entry.id);
  } catch (error) {
    console.error('Failed to calculate inbox:', error);
    return [];
  }
}
