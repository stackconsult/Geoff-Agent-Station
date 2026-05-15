import { useState, useEffect } from 'react';

export function useAutoGit(vaultPath: string) {
  const [isIdle, setIsIdle] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);

  useEffect(() => {
    let idleTimer: ReturnType<typeof setTimeout>;

    const checkIdleState = () => {
      // Check if user has been idle for 5 minutes
      setIsIdle(true);
    };

    const resetIdleTimer = () => {
      setIsIdle(false);
      clearTimeout(idleTimer);
      idleTimer = setTimeout(checkIdleState, 5 * 60 * 1000);
    };

    const runAutomaticCheckpoint = async () => {
      try {
        const { invoke } = await import('@tauri-apps/api/core');
        await invoke('git_commit', {
          vaultPath,
          message: 'Auto-saved changes',
        });
      } catch (error) {
        console.error('Failed to auto-commit:', error);
      }
    };

    // Check idle state every minute
    const interval = setInterval(() => {
      if (isIdle && hasChanges) {
        runAutomaticCheckpoint();
      }
    }, 60 * 1000);

    // Reset idle timer on user activity
    window.addEventListener('mousemove', resetIdleTimer);
    window.addEventListener('keydown', resetIdleTimer);

    resetIdleTimer();

    return () => {
      clearInterval(interval);
      clearTimeout(idleTimer);
      window.removeEventListener('mousemove', resetIdleTimer);
      window.removeEventListener('keydown', resetIdleTimer);
    };
  }, [vaultPath]);

  return { isIdle, hasChanges, setHasChanges };
}
