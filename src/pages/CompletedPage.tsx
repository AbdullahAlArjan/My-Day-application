import React from 'react';
import { useTasks } from '@/hooks/useTasks';
import { TaskItem } from '@/components/task/TaskItem';
import { useToast } from '@/components/common/Toast';
import type { Task } from '@/types/database';
import { CheckCircle2, RotateCcw } from 'lucide-react';

interface CompletedPageProps {
  onSelectTask: (task: Task) => void;
}

export const CompletedPage: React.FC<CompletedPageProps> = ({ onSelectTask }) => {
  const { tasks, updateTask, deleteTask, duplicateTask } = useTasks({
    status: 'completed',
  });
  const toast = useToast();

  const handleToggleComplete = async (task: Task) => {
    await updateTask({
      taskId: task.id,
      updates: { status: 'pending' },
    });
    toast.success(`Reopened "${task.title}"`);
  };

  const handleDelete = async (task: Task) => {
    if (window.confirm(`Permanently delete "${task.title}"?`)) {
      await deleteTask(task.id);
      toast.info(`Deleted "${task.title}"`);
    }
  };

  const handleDuplicate = async (task: Task) => {
    await duplicateTask(task.id);
    toast.success(`Duplicated "${task.title}"`);
  };

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h2 className="text-xl font-bold text-[var(--text-primary)]">Completed Tasks</h2>
        <p className="text-xs sm:text-sm text-[var(--text-secondary)] mt-1">
          Review your accomplishments and recover or clear completed items.
        </p>
      </div>

      {tasks.length === 0 ? (
        <div className="flex flex-col items-center justify-center p-12 text-center bg-[var(--bg-surface)] border border-[var(--border-subtle)] rounded-2xl shadow-subtle my-4">
          <div className="w-12 h-12 rounded-2xl bg-[var(--bg-subtle)] text-[var(--text-muted)] flex items-center justify-center mb-3">
            <CheckCircle2 className="w-6 h-6" />
          </div>
          <h3 className="text-base font-semibold text-[var(--text-primary)]">
            No completed tasks yet.
          </h3>
          <p className="text-xs sm:text-sm text-[var(--text-secondary)] mt-1 max-w-xs">
            Complete tasks from your Today or Calendar views to see your history here.
          </p>
        </div>
      ) : (
        <div className="flex flex-col gap-2">
          {tasks.map((task) => (
            <TaskItem
              key={task.id}
              task={task}
              onToggleComplete={handleToggleComplete}
              onClick={onSelectTask}
              onDuplicate={handleDuplicate}
              onDelete={handleDelete}
            />
          ))}
        </div>
      )}
    </div>
  );
};
