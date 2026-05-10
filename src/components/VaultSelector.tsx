import { useState, useEffect } from 'react';

interface DetectedVault {
  path: string;
  name: string;
  note_count: number;
  last_modified: string;
}

interface VaultSelectorProps {
  onVaultSelect: (path: string) => void;
  isLoading?: boolean;
}

export function VaultSelector({ onVaultSelect, isLoading }: VaultSelectorProps) {
  const [selectedPath, setSelectedPath] = useState('');
  const [inputPath, setInputPath] = useState('');
  const [detectedVaults, setDetectedVaults] = useState<DetectedVault[]>([]);
  const [isDetecting, setIsDetecting] = useState(false);
  const [showManualInput, setShowManualInput] = useState(false);

  useEffect(() => {
    detectVaults();
  }, []);

  const detectVaults = async () => {
    setIsDetecting(true);
    try {
      const { invoke } = await import('@tauri-apps/api/core');
      const vaults: DetectedVault[] = await invoke('detect_obsidian_vaults');
      setDetectedVaults(vaults);
    } catch (error) {
      console.error('Failed to detect vaults:', error);
    } finally {
      setIsDetecting(false);
    }
  };

  const handleVaultClick = (path: string) => {
    setSelectedPath(path);
    onVaultSelect(path);
  };

  const handleManualInput = () => {
    if (inputPath.trim()) {
      setSelectedPath(inputPath);
      onVaultSelect(inputPath);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    handleManualInput();
  };

  return (
    <div className="vault-selector">
      <div className="vault-selector-content">
        <h2>Select Your Obsidian Vault</h2>
        <p>Choose your vault from the detected options or enter a path manually.</p>
        
        {isDetecting ? (
          <div className="detecting-message">
            <div className="spinner"></div>
            <p>Detecting Obsidian vaults...</p>
          </div>
        ) : detectedVaults.length > 0 && !showManualInput ? (
          <div className="detected-vaults">
            <h3>Detected Vaults</h3>
            <div className="vault-list">
              {detectedVaults.map((vault) => (
                <div
                  key={vault.path}
                  className={`vault-item ${selectedPath === vault.path ? 'selected' : ''}`}
                  onClick={() => handleVaultClick(vault.path)}
                >
                  <div className="vault-name">{vault.name}</div>
                  <div className="vault-info">
                    <span className="vault-notes">{vault.note_count} notes</span>
                    <span className="vault-modified">• {vault.last_modified}</span>
                  </div>
                </div>
              ))}
            </div>
            <button
              className="manual-input-button"
              onClick={() => setShowManualInput(true)}
            >
              Or enter path manually
            </button>
          </div>
        ) : (
          <div className="manual-input-section">
            <form onSubmit={handleSubmit} className="vault-selector-actions">
              <div className="input-group">
                <input
                  type="text"
                  value={inputPath}
                  onChange={(e) => setInputPath(e.target.value)}
                  placeholder="C:\Users\YourName\Documents\Obsidian"
                  className="vault-path-input"
                  disabled={isLoading}
                />
                <button 
                  type="submit"
                  disabled={isLoading || !inputPath.trim()}
                  className="select-folder-button"
                >
                  {isLoading ? 'Loading...' : 'Load Vault'}
                </button>
              </div>
              
              {selectedPath && (
                <div className="selected-path">
                  <strong>Selected:</strong> {selectedPath}
                </div>
              )}
            </form>
            
            {detectedVaults.length > 0 && (
              <button
                className="back-to-detect-button"
                onClick={() => setShowManualInput(false)}
              >
                Back to detected vaults
              </button>
            )}
          </div>
        )}
        
        <div className="vault-selector-tips">
          <h3>Tips:</h3>
          <ul>
            <li>Your vault is typically a folder with .md files</li>
            <li>Common locations: Documents/Obsidian, Desktop/Notes, or any folder you use</li>
            <li>The app will remember your selection for next time</li>
            <li>Detected vaults are automatically scanned from common locations</li>
          </ul>
        </div>
      </div>
    </div>
  );
}

