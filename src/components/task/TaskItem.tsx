import React from 'react';
import { motion } from 'framer-motion';
import {
  Check,
  Clock,
  Repeat,
  CheckSquare,
  MoreVertical,
  Calendar as CalendarIcon,
  Copy,
  Trash2,
  Edit2,
  Maximize2,
} from 'lucide-react';
import type { Task } from '@/types/database';
import { Badge } from '@/components/common/Badge';
import { Dropdown, DropdownItem } from '@/components/common/Dropdown';
import { formatFriendlyDate, isDateOverdue, formatTimeDisplay } from '@/lib/dateUtils';
import { useSettings } from '@/hooks/useSettings';

interface TaskItemProps {
  task: Task;
  onToggleComplete: (task: Task) => void;
  onClick: (task: Task) => void;
  onDuplicate: (task: Task) => void;
  onDelete: (task: Task) => void;
  onFocusMode?: (task: Task) => void;
  onMoveToDate?: (task: Task, newDate: string) => void;
  isCompact?: boolean;
}

export const TaskItem: React.FC<TaskItemProps> = ({
  task,
  onToggleComplete,
  onClick,
  onDuplicate,
  onDelete,
  onFocusMode,
  isCompact = false,
}) => {
  const { settings } = useSettings();
  const isCompleted = task.status === 'completed';
  const isOverdue = !isCompleted && isDateOverdue(task.due_date);

  const completedSubtasksCount = task.subtasks?.filter((s) => s.is_completed).length || 0;
  const totalSubtasksCount = task.subtasks?.length || 0;

  const moreMenuItems: DropdownItem[] = [
    {
      id: 'edit',
      label: 'Edit Details',
      icon: <Edit2 className="w-3.5 h-3.5" />,
      onClick: () => onClick(task),
    },
    {
      id: 'duplicate',
      label: 'Duplicate',
      icon: <Copy className="w-3.5 h-3.5" />,
      onClick: () => onDuplicate(task),
    },
    ...(onFocusMode
      ? [
          {
            id: 'focus',
            label: 'Focus on This Task',
            icon: <Maximize2 className="w-3.5 h-3.5" />,
            onClick: () => onFocusMode(task),
          },
        ]
      : []),
    {
      id: 'delete',
      label: 'Delete Task',
      icon: <Trash2 className="w-3.5 h-3.5" />,
      danger: true,
      divider: true,
      onClick: () => onDelete(task),
    },
  ];

  return (
    <motion.div
      layout={settings.animations_enabled}
      initial={{ opacity: 0, y: 4 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.98 }}
      transition={{ duration: 0.15 }}
      className={`group relative flex items-start gap-3 rounded-xl border transition-all duration-150 select-none ${
        isCompact ? 'p-2.5' : 'p-3.5'
      } ${
        isCompleted
          ? 'bg-[var(--bg-canvas)]/60 border-[var(--border-subtle)] opacity-70'
          : 'bg-[var(--bg-surface)] hover:bg-[var(--bg-surface-hover)] border-[var(--border-subtle)] shadow-subtle hover:border-[var(--border-strong)]'
      }`}
    >
      {/* Checkbox */}
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          onToggleComplete(task);
        }}
        className={`mt-0.5 w-5 h-5 rounded-lg border flex items-center justify-center shrink-0 transition-all duration-150 ${
          isCompleted
            ? 'bg-emerald-500 border-emerald-500 text-white'
            : 'border-[var(--border-strong)] hover:border-brand-500 hover:bg-brand-50/50 dark:hover:bg-brand-950/20'
        }`}
        aria-label={isCompleted ? 'Mark task pending' : 'Mark task complete'}
      >
        {isCompleted && (
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: 'spring', stiffness: 500, damping: 25 }}
          >
            <Check className="w-3.5 h-3.5 stroke-[3]" />
          </motion.div>
        )}
      </button>

      {/* Task Content */}
      <div
        className="flex-1 min-w-0 cursor-pointer"
        onClick={() => onClick(task)}
      >
        <div className="flex items-center gap-2 flex-wrap">
          {/* Priority indicator dot if not compact */}
          {task.priority === 'high' && !isCompleted && (
            <span className="w-2 h-2 rounded-full bg-red-500 shrink-0" title="High Priority" />
          )}

          {/* Title */}
          <span
            className={`text-sm font-medium leading-snug break-words ${
              isCompleted
                ? 'line-through text-[var(--text-muted)]'
                : 'text-[var(--text-primary)]'
            }`}
          >
            {task.title}
          </span>
        </div>

        {/* Optional Description */}
        {!isCompact && task.description && (
          <p className="text-xs text-[var(--text-secondary)] mt-1 line-clamp-1">
            {task.description}
          </p>
        )}

        {/* Task Metadata Row */}
        <div className="flex items-center gap-2 sm:gap-3 flex-wrap mt-2 text-xs">
          {/* Category Tag */}
          {task.category && (
            <Badge
              variant="category"
              color={task.category.color}
              size="sm"
            >
              {task.category.name}
            </Badge>
          )}

          {/* Due Date & Time */}
          {task.due_date && (
            <div
              className={`inline-flex items-center gap-1 font-medium ${
                isOverdue
                  ? 'text-red-600 dark:text-red-400 font-semibold'
                  : 'text-[var(--text-secondary)]'
              }`}
            >
              <CalendarIcon className="w-3.5 h-3.5 shrink-0" />
              <span>{formatFriendlyDate(task.due_date)}</span>
              {task.due_time && (
                <span className="opacity-80">
                  at {formatTimeDisplay(task.due_time, settings.time_format)}
                </span>
              )}
            </div>
          )}

          {/* Priority Badge */}
          {task.priority !== 'medium' && (
            <Badge variant="priority" priority={task.priority} size="sm" />
          )}

          {/* Subtasks Progress */}
          {totalSubtasksCount > 0 && (
            <div className="inline-flex items-center gap-1 text-[var(--text-muted)]">
              <CheckSquare className="w-3.5 h-3.5" />
              <span>
                {completedSubtasksCount}/{totalSubtasksCount}
              </span>
            </div>
          )}

          {/* Recurring Indicator */}
          {task.recurrence_rule && task.recurrence_rule.type !== 'none' && (
            <div className="inline-flex items-center gap-1 text-[var(--text-muted)]" title={`Repeats ${task.recurrence_rule.type}`}>
              <Repeat className="w-3.5 h-3.5" />
            </div>
          )}

          {/* Reminder Indicator */}
          {task.reminder_at && (
            <div className="inline-flex items-center gap-1 text-brand-600 dark:text-brand-400" title="Reminder set">
              <Clock className="w-3.5 h-3.5" />
            </div>
          )}
        </div>
      </div>

      {/* More Options Dropdown */}
      <div className="opacity-0 group-hover:opacity-100 focus-within:opacity-100 transition-opacity">
        <Dropdown
          trigger={
            <button
              type="button"
              className="p-1.5 rounded-lg text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-surface-hover)]"
              aria-label="Task options"
            >
              <MoreVertical className="w-4 h-4" />
            </button>
          }
          items={moreMenuItems}
        />
      </div>
    </motion.div>
  );
};
