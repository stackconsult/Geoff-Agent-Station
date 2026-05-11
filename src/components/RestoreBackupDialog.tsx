import { useState } from 'react';
import { invoke } from '@tauri-apps/api/core';

interface BackupFile {
  path: string;
  originalPath: string;
  size: number;
  modified: number;
}

interface RestoreBackupDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onRestore: (originalPath: string) => void;
}

export function RestoreBackupDialog({ isOpen, onClose, onRestore }: RestoreBackupDialogProps) {
  const [backups, setBackups] = useState<BackupFile[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const loadBackups = async () => {
    setIsLoading(true);
    try {
      const files: BackupFile[] = await invoke('list_backup_files');
      setBackups(files);
    } catch (error) {
      console.error('Failed to load backups:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleRestore = async (backupPath: string, originalPath: string) => {
    try {
      await invoke('restore_from_backup', { backupPath, originalPath });
      onRestore(originalPath);
      onClose();
    } catch (error) {
      console.error('Failed to restore backup:', error);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-[var(--color-bg-secondary)] rounded-lg p-6 w-[600px] max-w-[90vw] border border-[var(--color-border-primary)]">
        <h2 className="text-xl font-semibold mb-4 text-[var(--color-text-primary)]">Restore from Backup</h2>
        
        {isLoading ? (
          <div className="text-center py-8 text-[var(--color-text-secondary)]">Loading backups...</div>
        ) : backups.length === 0 ? (
          <div className="text-center py-8 text-[var(--color-text-secondary)]">No backup files found</div>
        ) : (
          <div className="space-y-2 max-h-[400px] overflow-y-auto">
            {backups.map((backup) => (
              <div key={backup.path} className="flex items-center justify-between p-3 bg-[var(--color-bg-primary)] rounded border border-[var(--color-border-primary)]">
                <div className="flex-1">
                  <div className="font-medium text-[var(--color-text-primary)]">{backup.originalPath}</div>
                  <div className="text-sm text-[var(--color-text-secondary)]">
                    {new Date(backup.modified).toLocaleString()} • {(backup.size / 1024).toFixed(1)} KB
                  </div>
                </div>
                <button
                  onClick={() => handleRestore(backup.path, backup.originalPath)}
                  className="px-3 py-1 bg-[var(--color-accent)] text-white rounded text-sm"
                >
                  Restore
                </button>
              </div>
            ))}
          </div>
        )}

        <div className="flex justify-end gap-2 mt-6">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-[var(--color-bg-primary)] border border-[var(--color-border-primary)] rounded text-[var(--color-text-primary)]"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}
