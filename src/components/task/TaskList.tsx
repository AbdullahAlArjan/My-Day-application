import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown, ChevronRight, CheckCircle2, AlertCircle, Calendar, Plus } from 'lucide-react';
import type { Task } from '@/types/database';
import { TaskItem } from './TaskItem';
import { isDateOverdue, getTodayDateString } from '@/lib/dateUtils';
import { useSettings } from '@/hooks/useSettings';

interface TaskListProps {
  tasks: Task[];
  onToggleComplete: (task: Task) => void;
  onSelectTask: (task: Task) => void;
  onDuplicate: (task: Task) => void;
  onDelete: (task: Task) => void;
  onFocusMode?: (task: Task) => void;
  onOpenCreateModal?: () => void;
  isCompact?: boolean;
}

export const TaskList: React.FC<TaskListProps> = ({
  tasks,
  onToggleComplete,
  onSelectTask,
  onDuplicate,
  onDelete,
  onFocusMode,
  onOpenCreateModal,
  isCompact = false,
}) => {
  const { settings } = useSettings();
  const [completedCollapsed, setCompletedCollapsed] = useState(false);
  const todayStr = getTodayDateString();

  // Partition tasks
  const overdueTasks: Task[] = [];
  const todayTasks: Task[] = [];
  const upcomingTasks: Task[] = [];
  const completedTasks: Task[] = [];

  tasks.forEach((task) => {
    if (task.status === 'completed') {
      completedTasks.push(task);
    } else if (isDateOverdue(task.due_date)) {
      overdueTasks.push(task);
    } else if (task.due_date === todayStr) {
      todayTasks.push(task);
    } else {
      upcomingTasks.push(task);
    }
  });

  const hasAnyTasks = tasks.length > 0;
  const hasPendingTasks = overdueTasks.length > 0 || todayTasks.length > 0 || upcomingTasks.length > 0;

  if (!hasAnyTasks) {
    return (
      <div className="flex flex-col items-center justify-center p-12 text-center bg-[var(--bg-surface)] border border-[var(--border-subtle)] rounded-2xl shadow-subtle my-4">
        <div className="w-12 h-12 rounded-2xl bg-brand-50 dark:bg-brand-950/40 text-brand-600 dark:text-brand-400 flex items-center justify-center mb-3">
          <CheckCircle2 className="w-6 h-6" />
        </div>
        <h3 className="text-base font-semibold text-[var(--text-primary)]">
          You're all clear for today.
        </h3>
        <p className="text-xs sm:text-sm text-[var(--text-secondary)] mt-1 max-w-xs">
          Take a deep breath or plan ahead by adding what matters next.
        </p>
        {onOpenCreateModal && (
          <button
            type="button"
            onClick={onOpenCreateModal}
            className="mt-4 inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-brand-600 text-white text-xs sm:text-sm font-medium hover:bg-brand-700 transition-colors shadow-sm"
          >
            <Plus className="w-4 h-4" />
            <span>Add your first task</span>
          </button>
        )}
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      {/* 1. OVERDUE SECTION */}
      {overdueTasks.length > 0 && (
        <section>
          <div className="flex items-center gap-2 mb-2.5 px-1">
            <AlertCircle className="w-4 h-4 text-red-500" />
            <h3 className="text-xs font-semibold uppercase tracking-wider text-red-600 dark:text-red-400">
              Overdue
            </h3>
            <span className="text-[11px] font-semibold text-red-600/80 px-1.5 py-0.2 rounded-full bg-red-50 dark:bg-red-950/40">
              {overdueTasks.length}
            </span>
          </div>
          <div className="flex flex-col gap-2">
            {overdueTasks.map((task) => (
              <TaskItem
                key={task.id}
                task={task}
                onToggleComplete={onToggleComplete}
                onClick={onSelectTask}
                onDuplicate={onDuplicate}
                onDelete={onDelete}
                onFocusMode={onFocusMode}
                isCompact={isCompact}
              />
            ))}
          </div>
        </section>
      )}

      {/* 2. TODAY SECTION */}
      {todayTasks.length > 0 && (
        <section>
          <div className="flex items-center gap-2 mb-2.5 px-1">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-[var(--text-secondary)]">
              Today
            </h3>
            <span className="text-[11px] font-semibold text-[var(--text-muted)] px-1.5 py-0.2 rounded-full bg-[var(--bg-subtle)]">
              {todayTasks.length}
            </span>
          </div>
          <div className="flex flex-col gap-2">
            {todayTasks.map((task) => (
              <TaskItem
                key={task.id}
                task={task}
                onToggleComplete={onToggleComplete}
                onClick={onSelectTask}
                onDuplicate={onDuplicate}
                onDelete={onDelete}
                onFocusMode={onFocusMode}
                isCompact={isCompact}
              />
            ))}
          </div>
        </section>
      )}

      {/* 3. UPCOMING / NO DUE DATE SECTION */}
      {upcomingTasks.length > 0 && (
        <section>
          <div className="flex items-center gap-2 mb-2.5 px-1">
            <Calendar className="w-4 h-4 text-[var(--text-muted)]" />
            <h3 className="text-xs font-semibold uppercase tracking-wider text-[var(--text-secondary)]">
              Upcoming & Later
            </h3>
            <span className="text-[11px] font-semibold text-[var(--text-muted)] px-1.5 py-0.2 rounded-full bg-[var(--bg-subtle)]">
              {upcomingTasks.length}
            </span>
          </div>
          <div className="flex flex-col gap-2">
            {upcomingTasks.map((task) => (
              <TaskItem
                key={task.id}
                task={task}
                onToggleComplete={onToggleComplete}
                onClick={onSelectTask}
                onDuplicate={onDuplicate}
                onDelete={onDelete}
                onFocusMode={onFocusMode}
                isCompact={isCompact}
              />
            ))}
          </div>
        </section>
      )}

      {/* If all pending tasks are done but there are completed tasks */}
      {!hasPendingTasks && completedTasks.length > 0 && (
        <div className="p-6 text-center bg-[var(--bg-surface)] border border-[var(--border-subtle)] rounded-xl my-2">
          <p className="text-sm font-medium text-[var(--text-primary)]">
            Everything for today has been accomplished! ✨
          </p>
        </div>
      )}

      {/* 4. COMPLETED SECTION (Collapsible) */}
      {completedTasks.length > 0 && settings.show_completed_tasks && (
        <section className="pt-2 border-t border-[var(--border-subtle)]">
          <button
            type="button"
            onClick={() => setCompletedCollapsed(!completedCollapsed)}
            className="flex items-center gap-2 mb-3 text-xs font-medium text-[var(--text-muted)] hover:text-[var(--text-secondary)] transition-colors select-none"
          >
            {completedCollapsed ? (
              <ChevronRight className="w-4 h-4" />
            ) : (
              <ChevronDown className="w-4 h-4" />
            )}
            <span>Completed ({completedTasks.length})</span>
          </button>

          <AnimatePresence>
            {!completedCollapsed && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.2 }}
                className="flex flex-col gap-2 overflow-hidden"
              >
                {completedTasks.map((task) => (
                  <TaskItem
                    key={task.id}
                    task={task}
                    onToggleComplete={onToggleComplete}
                    onClick={onSelectTask}
                    onDuplicate={onDuplicate}
                    onDelete={onDelete}
                    onFocusMode={onFocusMode}
                    isCompact={isCompact}
                  />
                ))}
              </motion.div>
            )}
          </AnimatePresence>
        </section>
      )}
    </div>
  );
};
