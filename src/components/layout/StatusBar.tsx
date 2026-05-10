import React from 'react';
import { cn } from '../../lib/utils';
import { Button } from '../ui/Button';
import {
  GitBranch,
  Check,
  AlertCircle,
  RefreshCw,
  FolderOpen,
  Settings,
} from 'lucide-react';

interface StatusBarProps {
  version?: string;
  branch?: string;
  syncStatus?: 'synced' | 'syncing' | 'error';
  lastSync?: string;
  vaultPath?: string;
  onSync?: () => void;
  onOpenVault?: () => void;
  onOpenSettings?: () => void;
  className?: string;
}

/**
 * StatusBar Component
 * 
 * Features:
 * - Version display
 * - Git branch info
 * - Sync status indicator
 * - Last sync time
 * - Vault path
 * - Quick actions
 */
export function StatusBar({
  version = '0.1.0',
  branch = 'main',
  syncStatus = 'synced',
  lastSync = '2m ago',
  vaultPath = '~/vault',
  onSync,
  onOpenVault,
  onOpenSettings,
  className,
}: StatusBarProps) {
  const statusConfig = {
    synced: {
      icon: Check,
      color: 'text-[var(--color-success)]',
      label: 'Synced',
    },
    syncing: {
      icon: RefreshCw,
      color: 'text-[var(--color-accent-primary)]',
      label: 'Syncing...',
    },
    error: {
      icon: AlertCircle,
      color: 'text-[var(--color-error)]',
      label: 'Error',
    },
  };

  const StatusIcon = statusConfig[syncStatus].icon;

  return (
    <div className={cn(
      "flex items-center justify-between px-3 py-1.5 bg-[var(--color-bg-secondary)] text-xs",
      className
    )}>
      {/* Left: Version & Branch */}
      <div className="flex items-center gap-3">
        <span className="text-[var(--color-text-muted)]">
          v{version}
        </span>
        <div className="flex items-center gap-1 text-[var(--color-text-secondary)]">
          <GitBranch className="h-3 w-3" />
          <span>{branch}</span>
        </div>
      </div>

      {/* Center: Sync Status */}
      <div className="flex items-center gap-3">
        <Button
          variant="ghost"
          size="sm"
          className={cn("h-6 px-2 gap-1.5", statusConfig[syncStatus].color)}
          onClick={onSync}
        >
          <StatusIcon className={cn("h-3 w-3", syncStatus === 'syncing' && 'animate-spin")} />
          <span>{statusConfig[syncStatus].label}</span>
          {lastSync && syncStatus === 'synced' && (
            <span className="text-[var(--color-text-muted)]">
              {lastSync}
            </span>
          )}
        </Button>
      </div>

      {/* Right: Vault & Actions */}
      <div className="flex items-center gap-2">
        <Button
          variant="ghost"
          size="sm"
          className="h-6 px-2 gap-1.5 text-[var(--color-text-muted)] hover:text-[var(--color-text-secondary)]"
          onClick={onOpenVault}
        >
          <FolderOpen className="h-3 w-3" />
          <span className="truncate max-w-[150px]">{vaultPath}</span>
        </Button>
        <Button
          variant="ghost"
          size="icon"
          className="h-6 w-6"
          onClick={onOpenSettings}
        >
          <Settings className="h-3 w-3" />
        </Button>
      </div>
    </div>
  );
}
