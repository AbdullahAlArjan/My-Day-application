import React from 'react';
import { Sparkles, Check, ArrowRight } from 'lucide-react';
import type { Task } from '@/types/database';
import { Badge } from '@/components/common/Badge';

interface TopPrioritiesProps {
  tasks: Task[];
  onToggleComplete: (task: Task) => void;
  onSelectTask: (task: Task) => void;
}

export const TopPriorities: React.FC<TopPrioritiesProps> = ({
  tasks,
  onToggleComplete,
  onSelectTask,
}) => {
  // Filter top priorities: pending tasks sorted by priority (high > medium > low)
  const priorityScore = { high: 3, medium: 2, low: 1 };
  const topTasks = [...tasks]
    .filter((t) => t.status === 'pending')
    .sort((a, b) => priorityScore[b.priority] - priorityScore[a.priority])
    .slice(0, 3);

  if (topTasks.length === 0) {
    return null;
  }

  return (
    <div className="mb-6">
      <div className="flex items-center gap-2 mb-3">
        <Sparkles className="w-4 h-4 text-amber-500" />
        <h2 className="text-xs font-semibold uppercase tracking-wider text-[var(--text-secondary)]">
          Top 3 Priorities
        </h2>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        {topTasks.map((task, index) => (
          <div
            key={task.id}
            onClick={() => onSelectTask(task)}
            className="group relative bg-[var(--bg-surface)] hover:bg-[var(--bg-surface-hover)] border border-[var(--border-subtle)] hover:border-brand-500/40 rounded-xl p-3.5 shadow-subtle flex flex-col justify-between cursor-pointer transition-all duration-150"
          >
            {/* Top row: Priority & Category */}
            <div className="flex items-center justify-between gap-2 mb-2">
              <span className="text-[11px] font-bold text-[var(--text-muted)]">
                #0{index + 1}
              </span>
              <div className="flex items-center gap-1.5">
                <Badge variant="priority" priority={task.priority} size="sm" />
                {task.category && (
                  <Badge variant="category" color={task.category.color} size="sm">
                    {task.category.name}
                  </Badge>
                )}
              </div>
            </div>

            {/* Task Title */}
            <div className="flex-1 my-1">
              <h3 className="text-sm font-semibold text-[var(--text-primary)] group-hover:text-brand-600 dark:group-hover:text-brand-400 line-clamp-2 transition-colors">
                {task.title}
              </h3>
              {task.description && (
                <p className="text-xs text-[var(--text-secondary)] mt-1 line-clamp-1">
                  {task.description}
                </p>
              )}
            </div>

            {/* Bottom action */}
            <div className="flex items-center justify-between mt-3 pt-2 border-t border-[var(--border-subtle)] text-xs">
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  onToggleComplete(task);
                }}
                className="flex items-center gap-1.5 text-xs font-medium text-[var(--text-secondary)] hover:text-emerald-600 dark:hover:text-emerald-400 active:scale-95 transition-all p-1 -m-1 rounded-md"
              >
                <div className="w-4 h-4 rounded-md border border-[var(--border-strong)] hover:border-emerald-500 hover:bg-emerald-50 dark:hover:bg-emerald-950/30 flex items-center justify-center transition-colors">
                  <Check className="w-2.5 h-2.5 text-emerald-600 dark:text-emerald-400 stroke-[3]" />
                </div>
                <span>Mark Done</span>
              </button>

              <span className="text-[var(--text-muted)] group-hover:text-[var(--text-primary)] transition-colors flex items-center gap-0.5">
                <span>View</span>
                <ArrowRight className="w-3 h-3 group-hover:translate-x-0.5 transition-transform" />
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
