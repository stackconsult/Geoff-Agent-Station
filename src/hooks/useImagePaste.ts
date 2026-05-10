import { invoke } from '@tauri-apps/api/tauri';

export async function handleImagePaste(vaultPath: String, filename: String, data: Uint8Array) {
  try {
    const path = await invoke('save_image', {
      vaultPath,
      filename,
      data: Array.from(data)
    });
    return path;
  } catch (error) {
    console.error('Failed to save image:', error);
    return null;
  }
}
