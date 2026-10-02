import React from 'react';
import { Modal } from '@/components/common/Modal';
import { Input } from '@/components/common/Input';
import { Button } from '@/components/common/Button';
import { useCategories } from '@/hooks/useCategories';
import type { TaskFilterOptions, TaskSortOptions, TaskSortField } from '@/types/task';
import type { PriorityLevel, TaskStatus } from '@/types/database';
import { Search, Filter, ArrowUpDown, X, Tag } from 'lucide-react';

interface SearchModalProps {
  isOpen: boolean;
  onClose: () => void;
  filters: TaskFilterOptions;
  onUpdateFilters: (updates: Partial<TaskFilterOptions>) => void;
  sorting: TaskSortOptions;
  onUpdateSorting: (sorting: TaskSortOptions) => void;
  onResetFilters: () => void;
}

export const SearchModal: React.FC<SearchModalProps> = ({
  isOpen,
  onClose,
  filters,
  onUpdateFilters,
  sorting,
  onUpdateSorting,
  onResetFilters,
}) => {
  const { categories } = useCategories();

  const hasActiveFilters =
    !!filters.categoryId ||
    (filters.priority && filters.priority !== 'all') ||
    (filters.status && filters.status !== 'all') ||
    (filters.dueRange && filters.dueRange !== 'all') ||
    !!filters.hasReminder ||
    !!filters.hasSubtasks ||
    !!filters.searchQuery;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Search & Filter Tasks"
      description="Refine your tasks by text, category, priority, status, and dates."
      maxWidth="md"
    >
      <div className="flex flex-col gap-4">
        {/* Realtime Search Input */}
        <Input
          placeholder="Search by title, description, or notes..."
          value={filters.searchQuery || ''}
          onChange={(e) => onUpdateFilters({ searchQuery: e.target.value })}
          leftIcon={<Search className="w-4 h-4" />}
          autoFocus
        />

        {/* Filters Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 border-t border-[var(--border-subtle)]">
          {/* Category Filter */}
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-semibold uppercase tracking-wider text-[var(--text-secondary)]">
              Category
            </label>
            <select
              value={filters.categoryId || ''}
              onChange={(e) => onUpdateFilters({ categoryId: e.target.value || null })}
              className="bg-[var(--bg-surface)] text-[var(--text-primary)] border border-[var(--border-subtle)] rounded-xl text-xs py-2 px-3 focus:outline-none"
            >
              <option value="">All Categories</option>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>

          {/* Priority Filter */}
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-semibold uppercase tracking-wider text-[var(--text-secondary)]">
              Priority
            </label>
            <select
              value={filters.priority || 'all'}
              onChange={(e) =>
                onUpdateFilters({ priority: e.target.value as PriorityLevel | 'all' })
              }
              className="bg-[var(--bg-surface)] text-[var(--text-primary)] border border-[var(--border-subtle)] rounded-xl text-xs py-2 px-3 focus:outline-none"
            >
              <option value="all">All Priorities</option>
              <option value="high">High Priority</option>
              <option value="medium">Medium Priority</option>
              <option value="low">Low Priority</option>
            </select>
          </div>

          {/* Status Filter */}
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-semibold uppercase tracking-wider text-[var(--text-secondary)]">
              Status
            </label>
            <select
              value={filters.status || 'all'}
              onChange={(e) =>
                onUpdateFilters({ status: e.target.value as TaskStatus | 'all' })
              }
              className="bg-[var(--bg-surface)] text-[var(--text-primary)] border border-[var(--border-subtle)] rounded-xl text-xs py-2 px-3 focus:outline-none"
            >
              <option value="all">All Statuses</option>
              <option value="pending">Pending</option>
              <option value="completed">Completed</option>
            </select>
          </div>

          {/* Due Date Range Filter */}
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-semibold uppercase tracking-wider text-[var(--text-secondary)]">
              Due Date
            </label>
            <select
              value={filters.dueRange || 'all'}
              onChange={(e) =>
                onUpdateFilters({ dueRange: e.target.value as any })
              }
              className="bg-[var(--bg-surface)] text-[var(--text-primary)] border border-[var(--border-subtle)] rounded-xl text-xs py-2 px-3 focus:outline-none"
            >
              <option value="all">Any Date</option>
              <option value="today">Today</option>
              <option value="overdue">Overdue</option>
              <option value="upcoming">Upcoming</option>
              <option value="no_date">No Due Date</option>
            </select>
          </div>
        </div>

        {/* Checkbox Toggles: Reminder & Subtasks */}
        <div className="flex items-center gap-4 pt-2">
          <label className="flex items-center gap-2 text-xs text-[var(--text-secondary)] cursor-pointer">
            <input
              type="checkbox"
              checked={!!filters.hasReminder}
              onChange={(e) => onUpdateFilters({ hasReminder: e.target.checked || undefined })}
              className="rounded text-brand-600 focus:ring-brand-500"
            />
            <span>Has Reminder</span>
          </label>
          <label className="flex items-center gap-2 text-xs text-[var(--text-secondary)] cursor-pointer">
            <input
              type="checkbox"
              checked={!!filters.hasSubtasks}
              onChange={(e) => onUpdateFilters({ hasSubtasks: e.target.checked || undefined })}
              className="rounded text-brand-600 focus:ring-brand-500"
            />
            <span>Has Subtasks</span>
          </label>
        </div>

        {/* Sorting Section */}
        <div className="flex flex-col gap-1.5 pt-3 border-t border-[var(--border-subtle)]">
          <label className="text-xs font-semibold uppercase tracking-wider text-[var(--text-secondary)] flex items-center gap-1.5">
            <ArrowUpDown className="w-3.5 h-3.5" />
            <span>Sort By</span>
          </label>
          <div className="grid grid-cols-2 gap-2">
            <select
              value={sorting.field}
              onChange={(e) =>
                onUpdateSorting({ ...sorting, field: e.target.value as TaskSortField })
              }
              className="bg-[var(--bg-surface)] text-[var(--text-primary)] border border-[var(--border-subtle)] rounded-xl text-xs py-2 px-3 focus:outline-none"
            >
              <option value="custom">Custom Order</option>
              <option value="due_date">Due Date</option>
              <option value="priority">Priority</option>
              <option value="created_at">Recently Created</option>
              <option value="title">Alphabetical (Title)</option>
            </select>

            <select
              value={sorting.direction}
              onChange={(e) =>
                onUpdateSorting({ ...sorting, direction: e.target.value as 'asc' | 'desc' })
              }
              className="bg-[var(--bg-surface)] text-[var(--text-primary)] border border-[var(--border-subtle)] rounded-xl text-xs py-2 px-3 focus:outline-none"
            >
              <option value="asc">Ascending (A-Z / Earliest)</option>
              <option value="desc">Descending (Z-A / Latest)</option>
            </select>
          </div>
        </div>

        {/* Modal Actions */}
        <div className="flex items-center justify-between pt-3 border-t border-[var(--border-subtle)] mt-2">
          {hasActiveFilters ? (
            <Button
              variant="ghost"
              size="sm"
              onClick={onResetFilters}
              leftIcon={<X className="w-3.5 h-3.5" />}
            >
              Clear Filters
            </Button>
          ) : (
            <div />
          )}

          <Button variant="primary" size="sm" onClick={onClose}>
            Apply & View Results
          </Button>
        </div>
      </div>
    </Modal>
  );
};
