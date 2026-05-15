import * as React from 'react';
import { cn } from '../../lib/utils';

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  error?: string;
  icon?: React.ReactNode;
}

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, type, error, icon, ...props }, ref) => {
    return (
      <div className="relative w-full">
        {icon && (
          <div className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--color-text-muted)]">
            {icon}
          </div>
        )}
        <input
          type={type}
          className={cn(
            'flex h-9 w-full rounded-md border border-[var(--color-border-primary)] bg-[var(--color-bg-secondary)] px-3 py-1 text-sm text-[var(--color-text-primary)] shadow-sm transition-colors',
            'placeholder:text-[var(--color-text-muted)]',
            'focus:outline-none focus:ring-2 focus:ring-[var(--color-accent-primary)] focus:border-[var(--color-accent-primary)]',
            'disabled:cursor-not-allowed disabled:opacity-50',
            'file:border-0 file:bg-transparent file:text-sm file:font-medium',
            error &&
              'border-[var(--color-error)] focus:ring-[var(--color-error)]',
            icon && 'pl-10',
            className
          )}
          ref={ref}
          {...props}
        />
        {error && (
          <p className="mt-1 text-xs text-[var(--color-error)]">{error}</p>
        )}
      </div>
    );
  }
);
Input.displayName = 'Input';

export { Input };
