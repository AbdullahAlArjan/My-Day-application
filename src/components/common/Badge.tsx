import React from 'react';
import type { PriorityLevel } from '@/types/database';

interface BadgeProps {
  children?: React.ReactNode;
  variant?: 'default' | 'priority' | 'category' | 'status';
  priority?: PriorityLevel;
  color?: string; // hex or CSS color
  size?: 'sm' | 'md';
  className?: string;
}

export const Badge: React.FC<BadgeProps> = ({
  children,
  variant = 'default',
  priority,
  color,
  size = 'sm',
  className = '',
}) => {
  const sizeStyles = size === 'sm' ? 'text-[11px] px-2 py-0.5' : 'text-xs px-2.5 py-1';

  if (variant === 'priority' && priority) {
    const priorityConfig = {
      high: 'bg-red-50 text-red-700 border-red-200 dark:bg-red-950/40 dark:text-red-300 dark:border-red-900/60',
      medium: 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/40 dark:text-amber-300 dark:border-amber-900/60',
      low: 'bg-slate-100 text-slate-700 border-slate-200 dark:bg-slate-800/60 dark:text-slate-300 dark:border-slate-700/60',
    };

    return (
      <span
        className={`inline-flex items-center gap-1 font-medium rounded-md border ${sizeStyles} ${priorityConfig[priority]} ${className}`}
      >
        <span
          className={`w-1.5 h-1.5 rounded-full ${
            priority === 'high' ? 'bg-red-500' : priority === 'medium' ? 'bg-amber-500' : 'bg-slate-400'
          }`}
        />
        {priority.charAt(0).toUpperCase() + priority.slice(1)}
      </span>
    );
  }

  if (variant === 'category' && color) {
    return (
      <span
        className={`inline-flex items-center gap-1.5 font-medium rounded-md border border-transparent ${sizeStyles} ${className}`}
        style={{
          backgroundColor: `${color}18`,
          color: color,
        }}
      >
        <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: color }} />
        {children}
      </span>
    );
  }

  return (
    <span
      className={`inline-flex items-center font-medium rounded-md bg-[var(--bg-subtle)] text-[var(--text-secondary)] border border-[var(--border-subtle)] ${sizeStyles} ${className}`}
    >
      {children}
    </span>
  );
};
