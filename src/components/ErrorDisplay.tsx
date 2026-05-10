import { useState } from 'react';

interface ErrorDisplayProps {
  error: string | null;
  onDismiss?: () => void;
}

export function ErrorDisplay({ error, onDismiss }: ErrorDisplayProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  if (!error) return null;

  return (
    <div className="error-display">
      <div className="error-header">
        <span className="error-icon">⚠️</span>
        <span className="error-title">Something went wrong</span>
        <button 
          className="error-dismiss" 
          onClick={() => {
            setIsExpanded(false);
            onDismiss?.();
          }}
        >
          ✕
        </button>
      </div>
      
      <div className="error-message">
        {error}
      </div>
      
      <button 
        className="error-toggle"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        {isExpanded ? 'Show less' : 'Show details'}
      </button>
      
      {isExpanded && (
        <div className="error-details">
          <p><strong>What to try:</strong></p>
          <ul>
            <li>Check that the vault path is correct</li>
            <li>Make sure the folder exists and contains .md files</li>
            <li>Try selecting a different vault folder</li>
            <li>Restart the application and try again</li>
          </ul>
        </div>
      )}
    </div>
  );
}
