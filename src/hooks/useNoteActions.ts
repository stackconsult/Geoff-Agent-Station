export async function organizeSelectedNotes(noteIds: string[], metadata: any) {
  for (const noteId of noteIds) {
    try {
      const { invoke } = await import('@tauri-apps/api/tauri');
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
    const { invoke } = await import('@tauri-apps/api/tauri');
    const entries = await invoke('scan_vault', { vaultPath });
    // Filter notes with no outgoing links
    return entries.filter((entry: any) => entry.links.length === 0)
      .map((entry: any) => entry.id);
  } catch (error) {
    console.error('Failed to calculate inbox:', error);
    return [];
  }
}
