import React, { useState } from 'react';
import { Plus, CornerDownLeft } from 'lucide-react';
import { getTodayDateString } from '@/lib/dateUtils';
import { useSettings } from '@/hooks/useSettings';

interface QuickAddTaskProps {
  onQuickAdd: (title: string, dueDate: string) => Promise<void>;
  defaultDate?: string;
}

export const QuickAddTask: React.FC<QuickAddTaskProps> = ({
  onQuickAdd,
  defaultDate,
}) => {
  const [title, setTitle] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { settings } = useSettings();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = title.trim();
    if (!trimmed || isSubmitting) return;

    setIsSubmitting(true);
    try {
      const targetDate = defaultDate || getTodayDateString();
      await onQuickAdd(trimmed, targetDate);
      setTitle('');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="relative flex items-center w-full bg-[var(--bg-surface)] border border-[var(--border-subtle)] rounded-xl shadow-subtle focus-within:border-brand-500 focus-within:ring-2 focus-within:ring-brand-500/10 transition-all p-1.5"
    >
      <div className="pl-2.5 pr-1.5 text-[var(--text-muted)] flex items-center pointer-events-none">
        <Plus className="w-4 h-4" />
      </div>

      <input
        type="text"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        placeholder="Add a task and press Enter…"
        disabled={isSubmitting}
        className="flex-1 bg-transparent text-sm text-[var(--text-primary)] placeholder-[var(--text-muted)] py-1.5 px-2 focus:outline-none"
      />

      {title.trim().length > 0 && (
        <button
          type="submit"
          disabled={isSubmitting}
          className="flex items-center gap-1 px-2.5 py-1 text-xs font-medium text-brand-600 dark:text-brand-400 bg-brand-50 dark:bg-brand-950/40 rounded-lg hover:bg-brand-100 transition-colors shrink-0"
        >
          <span>Add</span>
          <CornerDownLeft className="w-3 h-3" />
        </button>
      )}
    </form>
  );
};
