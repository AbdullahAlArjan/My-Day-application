import React from 'react';
import type { Task } from '@/types/database';
import { isDateOverdue, getTodayDateString, formatFriendlyDate } from '@/lib/dateUtils';
import { Badge } from '@/components/common/Badge';
import { Check, Calendar, CheckSquare } from 'lucide-react';

interface TaskBoardProps {
  tasks: Task[];
  onToggleComplete: (task: Task) => void;
  onSelectTask: (task: Task) => void;
}

export const TaskBoard: React.FC<TaskBoardProps> = ({
  tasks,
  onToggleComplete,
  onSelectTask,
}) => {
  const todayStr = getTodayDateString();

  const columns = [
    {
      id: 'overdue',
      title: 'Overdue',
      color: 'border-t-red-500',
      countBg: 'bg-red-50 text-red-700 dark:bg-red-950/40 dark:text-red-400',
      tasks: tasks.filter((t) => t.status !== 'completed' && isDateOverdue(t.due_date)),
    },
    {
      id: 'today',
      title: 'Today',
      color: 'border-t-brand-500',
      countBg: 'bg-brand-50 text-brand-700 dark:bg-brand-950/40 dark:text-brand-400',
      tasks: tasks.filter((t) => t.status !== 'completed' && t.due_date === todayStr),
    },
    {
      id: 'upcoming',
      title: 'Upcoming',
      color: 'border-t-amber-500',
      countBg: 'bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-400',
      tasks: tasks.filter(
        (t) => t.status !== 'completed' && (!t.due_date || (!isDateOverdue(t.due_date) && t.due_date !== todayStr))
      ),
    },
    {
      id: 'completed',
      title: 'Completed',
      color: 'border-t-emerald-500',
      countBg: 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400',
      tasks: tasks.filter((t) => t.status === 'completed'),
    },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 pb-6 overflow-x-auto">
      {columns.map((col) => (
        <div
          key={col.id}
          className={`flex flex-col rounded-2xl bg-[var(--bg-canvas)] border border-[var(--border-subtle)] border-t-4 ${col.color} p-3 min-h-[450px] shadow-subtle`}
        >
          {/* Column Header */}
          <div className="flex items-center justify-between mb-3 px-1">
            <h3 className="text-xs font-bold uppercase tracking-wider text-[var(--text-primary)]">
              {col.title}
            </h3>
            <span className={`text-[11px] font-bold px-2 py-0.5 rounded-full ${col.countBg}`}>
              {col.tasks.length}
            </span>
          </div>

          {/* Column Tasks */}
          <div className="flex-1 flex flex-col gap-2.5 overflow-y-auto">
            {col.tasks.length === 0 ? (
              <div className="h-28 border border-dashed border-[var(--border-subtle)] rounded-xl flex items-center justify-center text-xs text-[var(--text-muted)] italic">
                No tasks
              </div>
            ) : (
              col.tasks.map((task) => (
                <div
                  key={task.id}
                  onClick={() => onSelectTask(task)}
                  className="group bg-[var(--bg-surface)] hover:bg-[var(--bg-surface-hover)] border border-[var(--border-subtle)] hover:border-brand-500/40 rounded-xl p-3 shadow-subtle cursor-pointer transition-all duration-150 flex flex-col gap-2"
                >
                  <div className="flex items-start justify-between gap-2">
                    <span
                      className={`text-xs font-semibold leading-snug break-words ${
                        task.status === 'completed'
                          ? 'line-through text-[var(--text-muted)]'
                          : 'text-[var(--text-primary)]'
                      }`}
                    >
                      {task.title}
                    </span>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        onToggleComplete(task);
                      }}
                      className={`w-4 h-4 rounded border flex items-center justify-center shrink-0 transition-colors ${
                        task.status === 'completed'
                          ? 'bg-emerald-500 border-emerald-500 text-white'
                          : 'border-[var(--border-strong)] hover:border-brand-500'
                      }`}
                    >
                      {task.status === 'completed' && <Check className="w-3 h-3 stroke-[3]" />}
                    </button>
                  </div>

                  {task.description && (
                    <p className="text-[11px] text-[var(--text-secondary)] line-clamp-2">
                      {task.description}
                    </p>
                  )}

                  <div className="flex items-center gap-1.5 flex-wrap pt-1 text-[10px]">
                    {task.category && (
                      <Badge variant="category" color={task.category.color} size="sm">
                        {task.category.name}
                      </Badge>
                    )}
                    {task.priority !== 'medium' && (
                      <Badge variant="priority" priority={task.priority} size="sm" />
                    )}
                    {task.due_date && (
                      <span className="text-[var(--text-muted)] flex items-center gap-1">
                        <Calendar className="w-3 h-3" />
                        {formatFriendlyDate(task.due_date)}
                      </span>
                    )}
                    {task.subtasks && task.subtasks.length > 0 && (
                      <span className="text-[var(--text-muted)] flex items-center gap-0.5">
                        <CheckSquare className="w-3 h-3" />
                        {task.subtasks.filter((s) => s.is_completed).length}/{task.subtasks.length}
                      </span>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      ))}
    </div>
  );
};
