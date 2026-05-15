import { useState, useEffect, useCallback, useRef } from 'react';
import {
  Folder,
  Clock,
  AlertCircle,
  Check,
  FolderOpen,
  Search,
  X,
  RefreshCw,
} from 'lucide-react';

interface DetectedVault {
  path: string;
  name: string;
  note_count: number;
  last_modified: string;
}

interface RecentVault {
  path: string;
  name: string;
  opened_at: string;
}

interface VaultSelectorProps {
  onVaultSelect: (path: string) => void;
  isLoading?: boolean;
}

const RECENT_VAULTS_KEY = 'tolaria_recent_vaults';
const MAX_RECENT_VAULTS = 5;

// Skeleton card component for loading state
function VaultCardSkeleton() {
  return (
    <div className="vault-card skeleton">
      <div className="vault-card-icon skeleton-icon" />
      <div className="vault-card-info">
        <div className="skeleton-text skeleton-title" />
        <div className="skeleton-text skeleton-meta" />
        <div className="skeleton-text skeleton-path" />
      </div>
    </div>
  );
}

export function VaultSelector({
  onVaultSelect,
  isLoading,
}: VaultSelectorProps) {
  const [selectedPath, setSelectedPath] = useState('');
  const [inputPath, setInputPath] = useState('');
  const [detectedVaults, setDetectedVaults] = useState<DetectedVault[]>([]);
  const [recentVaults, setRecentVaults] = useState<RecentVault[]>([]);
  const [isDetecting, setIsDetecting] = useState(false);
  const [isOpeningDialog, setIsOpeningDialog] = useState(false);
  const [error, setError] = useState<{
    message: string;
    action?: { label: string; onClick: () => void };
  } | null>(null);
  const [activeTab, setActiveTab] = useState<'suggested' | 'recent'>(
    'suggested'
  );
  const [isInputFocused, setIsInputFocused] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  // Load recent vaults from localStorage
  useEffect(() => {
    const stored = localStorage.getItem(RECENT_VAULTS_KEY);
    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        setRecentVaults(parsed);
        // If we have recent vaults, start with that tab
        if (parsed.length > 0) {
          setActiveTab('recent');
        }
      } catch {
        console.error('Failed to parse recent vaults');
      }
    }
  }, []);

  // Detect vaults on mount
  useEffect(() => {
    detectVaults();
  }, []);

  const detectVaults = async () => {
    setIsDetecting(true);
    setError(null);
    try {
      const { invoke } = await import('@tauri-apps/api/core');
      const vaults: DetectedVault[] = await invoke('detect_obsidian_vaults');
      setDetectedVaults(vaults);
    } catch (err) {
      console.error('Failed to detect vaults:', err);
      setError({
        message: 'Could not scan for vaults automatically',
        action: { label: 'Try Again', onClick: detectVaults },
      });
    } finally {
      setIsDetecting(false);
    }
  };

  const openFolderDialog = async () => {
    setIsOpeningDialog(true);
    setError(null);
    try {
      const { invoke } = await import('@tauri-apps/api/core');
      const result: string | null = await invoke('pick_folder_dialog');
      if (result) {
        await validateAndSelect(result);
      }
    } catch (err) {
      console.error('Failed to open folder dialog:', err);
      setError({
        message: 'Could not open folder picker',
        action: { label: 'Retry', onClick: openFolderDialog },
      });
    } finally {
      setIsOpeningDialog(false);
    }
  };

  const validateAndSelect = async (path: string) => {
    setError(null);
    try {
      const { invoke } = await import('@tauri-apps/api/core');
      const isValid: boolean = await invoke('validate_vault_path', { path });

      if (!isValid) {
        setError({
          message: 'This folder does not contain any markdown files',
          action: { label: 'Browse Again', onClick: openFolderDialog },
        });
        return;
      }

      setSelectedPath(path);
      addToRecentVaults(path);
      onVaultSelect(path);
    } catch (err) {
      console.error('Failed to validate path:', err);
      setError({
        message: 'Could not verify vault contents',
        action: { label: 'Try Again', onClick: () => validateAndSelect(path) },
      });
    }
  };

  const addToRecentVaults = (path: string) => {
    const name = path.split(/[\\/]/).pop() || 'Unknown';
    const newVault: RecentVault = {
      path,
      name,
      opened_at: new Date().toISOString(),
    };

    setRecentVaults(prev => {
      const filtered = prev.filter(v => v.path !== path);
      const updated = [newVault, ...filtered].slice(0, MAX_RECENT_VAULTS);
      localStorage.setItem(RECENT_VAULTS_KEY, JSON.stringify(updated));
      return updated;
    });
  };

  const handleVaultClick = useCallback((path: string) => {
    validateAndSelect(path);
  }, []);

  const handleManualSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (inputPath.trim()) {
      await validateAndSelect(inputPath.trim());
    }
  };

  const clearError = () => setError(null);

  // Keyboard navigation
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      clearError();
    }
  };

  // Filter vaults for display based on active tab
  const displayedVaults =
    activeTab === 'recent'
      ? recentVaults.map(v => ({
          path: v.path,
          name: v.name,
          note_count: 0,
          last_modified: `Opened ${new Date(v.opened_at).toLocaleDateString()}`,
          isRecent: true,
        }))
      : detectedVaults.map(v => ({ ...v, isRecent: false }));

  const hasVaults = displayedVaults.length > 0;
  const hasAnyVaults = detectedVaults.length > 0 || recentVaults.length > 0;

  return (
    <div className="vault-selector" onKeyDown={handleKeyDown}>
      <div className="vault-selector-content">
        {/* Header */}
        <div className="vault-header">
          <div className="vault-logo">
            <FolderOpen size={48} strokeWidth={1.5} />
          </div>
          <h1>Open a Vault</h1>
          <p className="vault-subtitle">
            Select your Obsidian vault folder to continue
          </p>
        </div>

        {/* Primary CTA */}
        <button
          className="vault-primary-btn"
          onClick={openFolderDialog}
          disabled={isOpeningDialog || isLoading}
          aria-label="Browse for vault folder"
        >
          <FolderOpen size={20} aria-hidden="true" />
          <span>{isOpeningDialog ? 'Opening...' : 'Browse for Vault'}</span>
        </button>

        {/* Error with action */}
        {error && (
          <div className="vault-error" role="alert">
            <AlertCircle size={18} aria-hidden="true" />
            <div className="vault-error-content">
              <span className="vault-error-message">{error.message}</span>
              <div className="vault-error-actions">
                {error.action && (
                  <button
                    className="vault-error-action-btn"
                    onClick={error.action.onClick}
                    aria-label={error.action.label}
                  >
                    {error.action.label}
                  </button>
                )}
                <button
                  className="vault-error-dismiss"
                  onClick={clearError}
                  aria-label="Dismiss error"
                >
                  <X size={16} />
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Divider */}
        {hasAnyVaults && (
          <div className="vault-divider">
            <span>or choose from below</span>
          </div>
        )}

        {/* Tabs - only show if we have any vaults */}
        {hasAnyVaults && (
          <div
            className="vault-tabs"
            role="tablist"
            aria-label="Vault selection tabs"
          >
            {detectedVaults.length > 0 && (
              <button
                role="tab"
                aria-selected={activeTab === 'suggested'}
                aria-controls="suggested-panel"
                id="suggested-tab"
                className={`vault-tab ${activeTab === 'suggested' ? 'active' : ''}`}
                onClick={() => setActiveTab('suggested')}
              >
                <Search size={16} aria-hidden="true" />
                <span>Suggested</span>
                <span className="vault-tab-count">{detectedVaults.length}</span>
              </button>
            )}
            {recentVaults.length > 0 && (
              <button
                role="tab"
                aria-selected={activeTab === 'recent'}
                aria-controls="recent-panel"
                id="recent-tab"
                className={`vault-tab ${activeTab === 'recent' ? 'active' : ''}`}
                onClick={() => setActiveTab('recent')}
              >
                <Clock size={16} aria-hidden="true" />
                <span>Recent</span>
                <span className="vault-tab-count">{recentVaults.length}</span>
              </button>
            )}
          </div>
        )}

        {/* Vault List */}
        <div className="vault-list-wrapper">
          {isDetecting ? (
            // Skeleton loading state
            <div
              className="vault-grid"
              role="status"
              aria-label="Loading vaults"
            >
              <VaultCardSkeleton />
              <VaultCardSkeleton />
              <VaultCardSkeleton />
            </div>
          ) : hasVaults ? (
            <div
              className="vault-grid"
              role="tabpanel"
              id={
                activeTab === 'suggested' ? 'suggested-panel' : 'recent-panel'
              }
              aria-labelledby={
                activeTab === 'suggested' ? 'suggested-tab' : 'recent-tab'
              }
            >
              {displayedVaults.map((vault, index) => (
                <button
                  key={vault.path}
                  className={`vault-card ${selectedPath === vault.path ? 'selected' : ''}`}
                  onClick={() => handleVaultClick(vault.path)}
                  disabled={isLoading}
                  aria-label={`Open vault ${vault.name} at ${vault.path}`}
                  style={{ animationDelay: `${index * 50}ms` }}
                >
                  <div className="vault-card-icon" aria-hidden="true">
                    {vault.isRecent ? (
                      <Clock size={24} />
                    ) : (
                      <Folder size={24} />
                    )}
                  </div>
                  <div className="vault-card-info">
                    <div className="vault-card-name">{vault.name}</div>
                    <div className="vault-card-meta">
                      {!vault.isRecent && (
                        <>
                          <span>{vault.note_count} notes</span>
                          <span className="vault-meta-separator">•</span>
                        </>
                      )}
                      <span>{vault.last_modified}</span>
                    </div>
                    <div className="vault-card-path" title={vault.path}>
                      {vault.path}
                    </div>
                  </div>
                  {selectedPath === vault.path ? (
                    <div className="vault-card-indicator" aria-hidden="true">
                      <Check size={16} />
                    </div>
                  ) : (
                    <div
                      className="vault-card-indicator-placeholder"
                      aria-hidden="true"
                    />
                  )}
                </button>
              ))}
            </div>
          ) : (
            // Empty state
            <div className="vault-empty-state">
              <div className="vault-empty-icon" aria-hidden="true">
                <Folder size={40} />
              </div>
              <p className="vault-empty-title">
                {activeTab === 'suggested'
                  ? 'No vaults found'
                  : 'No recent vaults'}
              </p>
              <p className="vault-empty-subtitle">
                {activeTab === 'suggested'
                  ? 'We could not find any Obsidian vaults automatically'
                  : 'Vaults you open will appear here for quick access'}
              </p>
              {activeTab === 'suggested' && (
                <button
                  className="vault-empty-action"
                  onClick={detectVaults}
                  disabled={isDetecting}
                >
                  <RefreshCw
                    size={16}
                    className={isDetecting ? 'spinning' : ''}
                  />
                  Scan Again
                </button>
              )}
            </div>
          )}
        </div>

        {/* Manual entry - collapsible */}
        <div
          className={`vault-manual-section ${isInputFocused ? 'expanded' : ''}`}
        >
          <button
            className="vault-manual-toggle"
            onClick={() => {
              setIsInputFocused(!isInputFocused);
              if (!isInputFocused) {
                setTimeout(() => inputRef.current?.focus(), 100);
              }
            }}
            aria-expanded={isInputFocused}
            aria-controls="manual-input-form"
          >
            <span>Enter path manually</span>
            <span
              className={`vault-manual-chevron ${isInputFocused ? 'expanded' : ''}`}
            >
              ›
            </span>
          </button>

          {isInputFocused && (
            <form
              id="manual-input-form"
              onSubmit={handleManualSubmit}
              className="vault-manual-form"
            >
              <div className="vault-input-group">
                <input
                  ref={inputRef}
                  type="text"
                  value={inputPath}
                  onChange={e => setInputPath(e.target.value)}
                  placeholder="C:\Users\You\Documents\Obsidian Vault"
                  className="vault-path-input"
                  disabled={isLoading}
                  aria-label="Vault folder path"
                />
                <button
                  type="submit"
                  disabled={isLoading || !inputPath.trim()}
                  className="vault-load-btn"
                  aria-label="Load vault from path"
                >
                  {isLoading ? 'Opening...' : 'Open'}
                </button>
              </div>
              <p className="vault-input-hint">
                Tip: Your vault is any folder containing .md files
              </p>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
