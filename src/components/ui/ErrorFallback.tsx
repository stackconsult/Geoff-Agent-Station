import { AlertTriangle, RotateCcw } from 'lucide-react';
import { Button } from './Button';

interface ErrorFallbackProps {
  message?: string;
  onReset?: () => void;
}

export function ErrorFallback({
  message = 'Something went wrong',
  onReset,
}: ErrorFallbackProps) {
  return (
    <div className="flex flex-col items-center justify-center h-full p-6 text-center bg-[var(--color-bg-secondary)]">
      <div className="text-amber-400 mb-3">
        <AlertTriangle className="h-10 w-10" />
      </div>
      <h3 className="text-lg font-semibold text-[var(--color-text-primary)] mb-2">
        Error
      </h3>
      <p className="text-sm text-[var(--color-text-secondary)] max-w-sm mb-4">
        {message}
      </p>
      {onReset && (
        <Button onClick={onReset} variant="outline" size="sm">
          <RotateCcw className="h-4 w-4 mr-1" />
          Try Again
        </Button>
      )}
    </div>
  );
}
