import { useEffect, useState } from 'react';
import { cn } from '../../lib/utils';
import { Button } from '../ui/Button';
import {
  GitBranch,
  Check,
  AlertCircle,
  RefreshCw,
  FolderOpen,
  Settings,
  GitMerge,
  Zap,
  Archive,
} from 'lucide-react';
import type { SyncStatus } from '../../types';
import { HealthIndicator, type HealthStatus } from '../HealthIndicator';

interface StatusBarProps {
  noteCount?: number;
  modifiedCount?: number;
  vaultPath?: string;
  branch?: string;
  syncStatus?: SyncStatus; // real Tolaria union type
  lastSyncTime?: number | null; // unix timestamp
  isVaultReloading?: boolean;
  onSync?: () => void;
  onOpenVault?: () => void;
  onOpenSettings?: () => void;
  onToggleAutomation?: () => void;
  onOpenBackups?: () => void;
  healthStatus?: HealthStatus | null;
  onHealthCheck?: () => void;
  className?: string;
}

// Mirrors real Tolaria useStatusBarTicker — re-renders every 30s for live relative time
function useStatusBarTicker() {
  const [, setTick] = useState(0);
  useEffect(() => {
    const id = setInterval(() => setTick(t => t + 1), 30_000);
    return () => clearInterval(id);
  }, []);
}

function formatLastSync(ts: number | null | undefined): string {
  if (!ts) return '';
  const diffSec = Math.floor((Date.now() - ts) / 1000);
  if (diffSec < 60) return 'just now';
  const diffMin = Math.floor(diffSec / 60);
  if (diffMin < 60) return `${diffMin}m ago`;
  return `${Math.floor(diffMin / 60)}h ago`;
}

const SYNC_CONFIG: Record<
  SyncStatus,
  { label: string; colorClass: string; spin?: boolean }
> = {
  idle: { label: 'Synced', colorClass: 'text-[var(--color-success)]' },
  syncing: {
    label: 'Syncing…',
    colorClass: 'text-[var(--color-accent-primary)]',
    spin: true,
  },
  error: { label: 'Sync error', colorClass: 'text-[var(--color-error)]' },
  conflict: { label: 'Conflict', colorClass: 'text-[var(--color-warning)]' },
  pull_required: {
    label: 'Pull required',
    colorClass: 'text-[var(--color-accent-secondary)]',
  },
};

/**
 * StatusBar — uses real Tolaria SyncStatus union and ticker pattern.
 * Re-renders every 30s to keep relative last-sync time fresh.
 */
export function StatusBar({
  noteCount,
  modifiedCount = 0,
  vaultPath = '',
  branch,
  syncStatus = 'idle',
  lastSyncTime,
  isVaultReloading,
  onSync,
  onOpenVault,
  onOpenSettings,
  onToggleAutomation,
  onOpenBackups,
  healthStatus,
  onHealthCheck,
  className,
}: StatusBarProps) {
  useStatusBarTicker();

  const cfg = SYNC_CONFIG[syncStatus];
  const SyncIcon =
    syncStatus === 'syncing' || isVaultReloading
      ? RefreshCw
      : syncStatus === 'error'
        ? AlertCircle
        : syncStatus === 'conflict'
          ? GitMerge
          : Check;

  const vaultLabel = vaultPath
    ? (vaultPath.split(/[\\/]/).pop() ?? vaultPath)
    : 'No vault';

  return (
    <div
      className={cn(
        'flex items-center justify-between px-3 h-7 bg-[var(--color-bg-secondary)]',
        'border-t border-[var(--color-border-primary)] text-xs',
        className
      )}
    >
      {/* Left: note count + modified */}
      <div className="flex items-center gap-3 text-[var(--color-text-muted)]">
        {noteCount !== undefined && <span>{noteCount} notes</span>}
        {modifiedCount > 0 && (
          <span className="text-[var(--color-warning)]">
            {modifiedCount} modified
          </span>
        )}
        {branch && (
          <span className="flex items-center gap-1">
            <GitBranch className="h-3 w-3" />
            {branch}
          </span>
        )}
      </div>

      {/* Center: sync status — clickable to trigger sync */}
      <Button
        variant="ghost"
        size="sm"
        className={cn('h-6 px-2 gap-1.5', cfg.colorClass)}
        onClick={onSync}
      >
        <SyncIcon
          className={cn(
            'h-3 w-3',
            (cfg.spin || isVaultReloading) && 'animate-spin'
          )}
        />
        <span>{cfg.label}</span>
        {lastSyncTime && syncStatus === 'idle' && (
          <span className="text-[var(--color-text-muted)]">
            {formatLastSync(lastSyncTime)}
          </span>
        )}
      </Button>

      {/* Right: vault path + settings */}
      <div className="flex items-center gap-1">
        <Button
          variant="ghost"
          size="sm"
          className="h-6 px-2 gap-1.5 text-[var(--color-text-muted)] hover:text-[var(--color-text-secondary)] max-w-[160px]"
          onClick={onOpenVault}
        >
          <FolderOpen className="h-3 w-3 flex-shrink-0" />
          <span className="truncate">{vaultLabel}</span>
        </Button>
        {onToggleAutomation && (
          <Button
            variant="ghost"
            size="icon"
            className="h-6 w-6"
            onClick={onToggleAutomation}
            title="Automation"
          >
            <Zap className="h-3 w-3" />
          </Button>
        )}
        {onOpenBackups && vaultPath && (
          <Button
            variant="ghost"
            size="icon"
            className="h-6 w-6"
            onClick={onOpenBackups}
            title="Restore from backup"
          >
            <Archive className="h-3 w-3" />
          </Button>
        )}
        {healthStatus && (
          <HealthIndicator status={healthStatus} onClick={onHealthCheck} />
        )}
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
