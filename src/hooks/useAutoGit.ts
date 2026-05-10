import { useState, useEffect } from 'react';
import { invoke } from '@tauri-apps/api/tauri';

export function useAutoGit(vaultPath: string) {
  const [isIdle, setIsIdle] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);

  useEffect(() => {
    let idleTimer: NodeJS.Timeout;

    const checkIdleState = () => {
      // Check if user has been idle for 5 minutes
      setIsIdle(true);
    };

    const resetIdleTimer = () => {
      setIsIdle(false);
      clearTimeout(idleTimer);
      idleTimer = setTimeout(checkIdleState, 5 * 60 * 1000);
    };

    // Reset idle timer on user activity
    window.addEventListener('mousemove', resetIdleTimer);
    window.addEventListener('keydown', resetIdleTimer);

    resetIdleTimer();

    return () => {
      clearTimeout(idleTimer);
      window.removeEventListener('mousemove', resetIdleTimer);
      window.removeEventListener('keydown', resetIdleTimer);
    };
  }, []);

  useEffect(() => {
    if (isIdle && hasChanges) {
      // Trigger automatic checkpoint
      invoke('git_commit', {
        vaultPath,
        message: 'AutoGit checkpoint'
      });
    }
  }, [isIdle, hasChanges, vaultPath]);

  return { isIdle, hasChanges, setHasChanges };
}
