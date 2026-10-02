import React, { useState } from 'react';
import { useTasks } from '@/hooks/useTasks';
import { useCategories } from '@/hooks/useCategories';
import { useSettings } from '@/hooks/useSettings';
import { TopPriorities } from '@/components/task/TopPriorities';
import { CategoryFilterChips } from '@/components/category/CategoryFilterChips';
import { QuickAddTask } from '@/components/task/QuickAddTask';
import { TaskList } from '@/components/task/TaskList';
import { TaskBoard } from '@/components/task/TaskBoard';
import { useToast } from '@/components/common/Toast';
import type { Task } from '@/types/database';
import type { TaskFilterOptions, TaskSortOptions } from '@/types/task';
import type { HomeViewMode } from '@/types/database';
import { getTodayDateString } from '@/lib/dateUtils';
import {
  List,
  LayoutGrid,
  Columns3,
  SlidersHorizontal,
  X,
  Plus,
  Flame,
} from 'lucide-react';

interface TodayPageProps {
  onOpenCreateTask: () => void;
  onOpenCategoryManager: () => void;
  onOpenSearch: () => void;
  onSelectTask: (task: Task) => void;
  onFocusTask: (task: Task) => void;
  filters: TaskFilterOptions;
  onUpdateFilters: (updates: Partial<TaskFilterOptions>) => void;
  sorting: TaskSortOptions;
}

export const TodayPage: React.FC<TodayPageProps> = ({
  onOpenCreateTask,
  onOpenCategoryManager,
  onOpenSearch,
  onSelectTask,
  onFocusTask,
  filters,
  onUpdateFilters,
  sorting,
}) => {
  const { settings, updateSettings } = useSettings();
  const { categories } = useCategories();
  const {
    tasks,
    createTask,
    updateTask,
    deleteTask,
    duplicateTask,
    restoreLastDeletedTask,
  } = useTasks(filters, sorting);
  const toast = useToast();

  const [viewMode, setViewMode] = useState<HomeViewMode>(
    settings.default_home_view || 'list'
  );

  const handleToggleComplete = async (task: Task) => {
    const isCompleted = task.status === 'completed';
    const nextStatus = isCompleted ? 'pending' : 'completed';

    await updateTask({
      taskId: task.id,
      updates: { status: nextStatus },
    });

    if (nextStatus === 'completed') {
      toast.success(`Completed "${task.title}"`, {
        label: 'Undo',
        onClick: () => {
          updateTask({
            taskId: task.id,
            updates: { status: 'pending' },
          });
        },
      });
    }
  };

  const handleDeleteTask = async (task: Task) => {
    if (settings.confirm_before_delete) {
      if (!window.confirm(`Delete task "${task.title}"?`)) {
        return;
      }
    }

    await deleteTask(task.id);
    toast.info(`Deleted "${task.title}"`, {
      label: 'Undo',
      onClick: () => {
        restoreLastDeletedTask();
      },
    });
  };

  const handleDuplicateTask = async (task: Task) => {
    await duplicateTask(task.id);
    toast.success(`Duplicated "${task.title}"`);
  };

  const handleQuickAdd = async (title: string, dueDate: string) => {
    await createTask({
      title,
      due_date: dueDate,
      priority: settings.default_priority,
      category_id: filters.categoryId || null,
    });
    toast.success('Task created for today');
  };

  const handleSelectCategory = (categoryId: string | null) => {
    onUpdateFilters({ categoryId });
  };

  // Streak calculation (completed tasks for today)
  const todayStr = getTodayDateString();
  const completedTodayCount = tasks.filter(
    (t) => t.due_date === todayStr && t.status === 'completed'
  ).length;

  return (
    <div className="flex flex-col gap-6 relative">
      {/* Category Filter Chips */}
      <div className="flex items-center justify-between gap-3">
        <CategoryFilterChips
          categories={categories}
          selectedCategoryId={filters.categoryId || null}
          onSelectCategory={handleSelectCategory}
          onAddCategoryClick={onOpenCategoryManager}
          totalTaskCount={tasks.length}
        />
      </div>

      {/* Top Controls: View Selector & Search/Filter info */}
      <div className="flex items-center justify-between gap-2 border-b border-[var(--border-subtle)] pb-3">
        {/* Productivity streak counter */}
        <div className="flex items-center gap-1.5 text-xs text-[var(--text-secondary)] font-medium">
          <Flame className="w-4 h-4 text-amber-500 fill-amber-500/20" />
          <span>
            {completedTodayCount > 0
              ? `${completedTodayCount} tasks accomplished today`
              : 'Begin your focus session today'}
          </span>
        </div>

        {/* View Mode Buttons (List, Compact, Board) */}
        <div className="flex items-center gap-2">
          {/* Active Filter Pill if search/filters active */}
          {(filters.searchQuery || filters.priority !== 'all' || filters.status !== 'all') && (
            <button
              type="button"
              onClick={onOpenSearch}
              className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-brand-50 text-brand-700 dark:bg-brand-950/60 dark:text-brand-300 text-xs font-semibold"
            >
              <SlidersHorizontal className="w-3 h-3" />
              <span>Filtered</span>
            </button>
          )}

          {/* View toggle */}
          <div className="flex items-center bg-[var(--bg-surface)] p-0.5 rounded-xl border border-[var(--border-subtle)] shadow-xs">
            <button
              type="button"
              onClick={() => {
                setViewMode('list');
                updateSettings({ default_home_view: 'list' });
              }}
              title="Standard List View"
              className={`p-1.5 rounded-lg transition-colors ${
                viewMode === 'list'
                  ? 'bg-[var(--bg-subtle)] text-[var(--text-primary)] font-semibold'
                  : 'text-[var(--text-muted)] hover:text-[var(--text-primary)]'
              }`}
            >
              <List className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={() => {
                setViewMode('compact');
                updateSettings({ default_home_view: 'compact' });
              }}
              title="Compact List View"
              className={`p-1.5 rounded-lg transition-colors ${
                viewMode === 'compact'
                  ? 'bg-[var(--bg-subtle)] text-[var(--text-primary)] font-semibold'
                  : 'text-[var(--text-muted)] hover:text-[var(--text-primary)]'
              }`}
            >
              <LayoutGrid className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={() => {
                setViewMode('board');
                updateSettings({ default_home_view: 'board' });
              }}
              title="Kanban Board View"
              className={`p-1.5 rounded-lg transition-colors ${
                viewMode === 'board'
                  ? 'bg-[var(--bg-subtle)] text-[var(--text-primary)] font-semibold'
                  : 'text-[var(--text-muted)] hover:text-[var(--text-primary)]'
              }`}
            >
              <Columns3 className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Top 3 Priorities Section */}
      <TopPriorities
        tasks={tasks}
        onToggleComplete={handleToggleComplete}
        onSelectTask={onSelectTask}
      />

      {/* Quick Add Task Input */}
      <div className="my-1">
        <QuickAddTask onQuickAdd={handleQuickAdd} />
      </div>

      {/* Main Task List or Board */}
      {viewMode === 'board' ? (
        <TaskBoard
          tasks={tasks}
          onToggleComplete={handleToggleComplete}
          onSelectTask={onSelectTask}
        />
      ) : (
        <TaskList
          tasks={tasks}
          onToggleComplete={handleToggleComplete}
          onSelectTask={onSelectTask}
          onDuplicate={handleDuplicateTask}
          onDelete={handleDeleteTask}
          onFocusMode={onFocusTask}
          onOpenCreateModal={onOpenCreateTask}
          isCompact={viewMode === 'compact'}
        />
      )}

      {/* Desktop Floating Action Button (FAB) */}
      <div className="hidden md:block fixed bottom-8 right-8 z-30">
        <button
          type="button"
          onClick={onOpenCreateTask}
          title="Create new task (N)"
          className="flex items-center gap-2 px-4 py-3 rounded-full bg-brand-600 hover:bg-brand-700 text-white shadow-modal hover:scale-105 active:scale-95 transition-all focus:outline-none focus:ring-4 focus:ring-brand-500/20 font-medium text-sm"
        >
          <Plus className="w-5 h-5 stroke-[2.5]" />
          <span>New Task</span>
          <kbd className="hidden lg:inline px-1.5 py-0.2 text-[10px] font-mono bg-white/20 rounded">
            N
          </kbd>
        </button>
      </div>
    </div>
  );
};
