import React, { forwardRef } from 'react';
import { Loader2 } from 'lucide-react';

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger' | 'outline';
  size?: 'sm' | 'md' | 'lg' | 'icon';
  isLoading?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      children,
      variant = 'secondary',
      size = 'md',
      isLoading = false,
      leftIcon,
      rightIcon,
      className = '',
      disabled,
      ...props
    },
    ref
  ) => {
    const baseStyles =
      'inline-flex items-center justify-center font-medium transition-all duration-150 select-none disabled:opacity-50 disabled:cursor-not-allowed focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 active:scale-[0.98]';

    const variants = {
      primary:
        'bg-brand-600 hover:bg-brand-700 text-white shadow-sm border border-transparent',
      secondary:
        'bg-[var(--bg-surface)] hover:bg-[var(--bg-surface-hover)] text-[var(--text-primary)] border border-[var(--border-subtle)] shadow-subtle',
      ghost:
        'bg-transparent hover:bg-[var(--bg-surface-hover)] text-[var(--text-secondary)] hover:text-[var(--text-primary)]',
      outline:
        'bg-transparent border border-[var(--border-strong)] text-[var(--text-primary)] hover:bg-[var(--bg-surface-hover)]',
      danger:
        'bg-red-600 hover:bg-red-700 text-white shadow-sm border border-transparent',
    };

    const sizes = {
      sm: 'text-xs px-2.5 py-1.5 rounded-lg gap-1.5 h-8',
      md: 'text-sm px-3.5 py-2 rounded-xl gap-2 h-9',
      lg: 'text-base px-5 py-2.5 rounded-xl gap-2.5 h-11',
      icon: 'p-2 rounded-xl h-9 w-9 justify-center',
    };

    return (
      <button
        ref={ref}
        disabled={disabled || isLoading}
        className={`${baseStyles} ${variants[variant]} ${sizes[size]} ${className}`}
        {...props}
      >
        {isLoading ? (
          <Loader2 className="w-4 h-4 animate-spin text-current" />
        ) : (
          leftIcon
        )}
        {children}
        {!isLoading && rightIcon}
      </button>
    );
  }
);

Button.displayName = 'Button';
