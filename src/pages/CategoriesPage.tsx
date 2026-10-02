import React from 'react';
import { useCategories } from '@/hooks/useCategories';
import { useTasks } from '@/hooks/useTasks';
import { IconRenderer } from '@/components/common/IconRenderer';
import { Button } from '@/components/common/Button';
import { Plus, Edit2, CheckCircle2, ListTodo } from 'lucide-react';
import type { Task, Category } from '@/types/database';

interface CategoriesPageProps {
  onOpenCategoryManager: () => void;
  onFilterByCategory: (categoryId: string) => void;
}

export const CategoriesPage: React.FC<CategoriesPageProps> = ({
  onOpenCategoryManager,
  onFilterByCategory,
}) => {
  const { categories } = useCategories();
  const { tasks } = useTasks();

  return (
    <div className="flex flex-col gap-6">
      {/* Top Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-[var(--text-primary)]">Categories</h2>
          <p className="text-xs sm:text-sm text-[var(--text-secondary)] mt-1">
            Organize tasks by domains of focus, work, and personal projects.
          </p>
        </div>

        <Button
          variant="primary"
          size="sm"
          onClick={onOpenCategoryManager}
          leftIcon={<Plus className="w-4 h-4" />}
        >
          Manage Categories
        </Button>
      </div>

      {/* Categories Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {categories.map((cat) => {
          const total = cat.task_count || 0;
          const completed = cat.completed_count || 0;
          const pending = total - completed;
          const percent = total > 0 ? Math.round((completed / total) * 100) : 0;

          return (
            <div
              key={cat.id}
              onClick={() => onFilterByCategory(cat.id)}
              className="group bg-[var(--bg-surface)] hover:bg-[var(--bg-surface-hover)] border border-[var(--border-subtle)] hover:border-brand-500/40 rounded-2xl p-4 shadow-subtle flex flex-col justify-between cursor-pointer transition-all duration-150"
            >
              <div>
                <div className="flex items-center justify-between mb-3">
                  <div
                    className="w-9 h-9 rounded-xl flex items-center justify-center text-white shadow-xs"
                    style={{ backgroundColor: cat.color }}
                  >
                    <IconRenderer name={cat.icon} className="w-4 h-4" />
                  </div>
                  <span className="text-xs font-semibold text-[var(--text-muted)]">
                    {pending} pending
                  </span>
                </div>

                <h3 className="text-base font-bold text-[var(--text-primary)] group-hover:text-brand-600 dark:group-hover:text-brand-400 transition-colors">
                  {cat.name}
                </h3>
                <span className="text-xs text-[var(--text-muted)] mt-0.5 block">
                  {total} total tasks
                </span>
              </div>

              {/* Progress bar */}
              <div className="mt-5 pt-3 border-t border-[var(--border-subtle)]">
                <div className="flex items-center justify-between text-[11px] text-[var(--text-secondary)] font-medium mb-1.5">
                  <span>Completion</span>
                  <span>{percent}%</span>
                </div>
                <div className="w-full h-1.5 bg-[var(--bg-subtle)] rounded-full overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all duration-300"
                    style={{
                      width: `${percent}%`,
                      backgroundColor: cat.color,
                    }}
                  />
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
