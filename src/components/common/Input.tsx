import React, { forwardRef } from 'react';

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  hint?: string;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, hint, leftIcon, rightIcon, className = '', id, ...props }, ref) => {
    const inputId = id || (label ? label.toLowerCase().replace(/\s+/g, '-') : undefined);

    return (
      <div className="w-full flex flex-col gap-1.5">
        {label && (
          <label
            htmlFor={inputId}
            className="text-xs font-semibold text-[var(--text-secondary)] uppercase tracking-wider"
          >
            {label}
          </label>
        )}
        <div className="relative flex items-center w-full">
          {leftIcon && (
            <div className="absolute left-3 flex items-center pointer-events-none text-[var(--text-muted)]">
              {leftIcon}
            </div>
          )}
          <input
            id={inputId}
            ref={ref}
            className={`w-full bg-[var(--bg-surface)] text-[var(--text-primary)] placeholder-[var(--text-muted)] text-sm rounded-xl border transition-all duration-150 py-2 ${
              leftIcon ? 'pl-9' : 'pl-3.5'
            } ${rightIcon ? 'pr-9' : 'pr-3.5'} ${
              error
                ? 'border-red-500 focus:ring-2 focus:ring-red-500/20'
                : 'border-[var(--border-subtle)] focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20'
            } focus:outline-none shadow-subtle ${className}`}
            {...props}
          />
          {rightIcon && (
            <div className="absolute right-3 flex items-center text-[var(--text-muted)]">
              {rightIcon}
            </div>
          )}
        </div>
        {error && <span className="text-xs font-medium text-red-500">{error}</span>}
        {hint && !error && <span className="text-xs text-[var(--text-muted)]">{hint}</span>}
      </div>
    );
  }
);

Input.displayName = 'Input';
