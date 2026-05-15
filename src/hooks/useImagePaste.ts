export async function handleImagePaste(
  vaultPath: string,
  filename: string,
  data: Uint8Array
) {
  try {
    const { invoke } = await import('@tauri-apps/api/core');
    const path = await invoke('save_image', {
      vaultPath,
      filename,
      data: Array.from(data),
    });
    return path;
  } catch (error) {
    console.error('Failed to save image:', error);
    return null;
  }
}
