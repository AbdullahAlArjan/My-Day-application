import React from 'react';
import type { Category } from '@/types/database';
import { Plus } from 'lucide-react';
import { IconRenderer } from '@/components/common/IconRenderer';

interface CategoryFilterChipsProps {
  categories: Category[];
  selectedCategoryId: string | null;
  onSelectCategory: (categoryId: string | null) => void;
  onAddCategoryClick: () => void;
  totalTaskCount: number;
}

export const CategoryFilterChips: React.FC<CategoryFilterChipsProps> = ({
  categories,
  selectedCategoryId,
  onSelectCategory,
  onAddCategoryClick,
  totalTaskCount,
}) => {
  return (
    <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none select-none">
      {/* "All" Chip */}
      <button
        type="button"
        onClick={() => onSelectCategory(null)}
        className={`flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-medium border transition-all shrink-0 ${
          selectedCategoryId === null
            ? 'bg-brand-600 text-white border-brand-600 shadow-sm'
            : 'bg-[var(--bg-surface)] text-[var(--text-secondary)] border-[var(--border-subtle)] hover:border-[var(--border-strong)] shadow-subtle'
        }`}
      >
        <span>All</span>
        <span
          className={`px-1.5 py-0.2 rounded-full text-[10px] font-semibold ${
            selectedCategoryId === null
              ? 'bg-white/20 text-white'
              : 'bg-[var(--bg-subtle)] text-[var(--text-muted)]'
          }`}
        >
          {totalTaskCount}
        </span>
      </button>

      {/* Category Chips */}
      {categories.map((cat) => {
        const isSelected = selectedCategoryId === cat.id;
        const count = cat.task_count || 0;

        return (
          <button
            key={cat.id}
            type="button"
            onClick={() => onSelectCategory(cat.id)}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-medium border transition-all shrink-0 ${
              isSelected
                ? 'shadow-sm text-white border-transparent'
                : 'bg-[var(--bg-surface)] text-[var(--text-secondary)] border-[var(--border-subtle)] hover:border-[var(--border-strong)] shadow-subtle'
            }`}
            style={{
              backgroundColor: isSelected ? cat.color : undefined,
              borderColor: isSelected ? cat.color : undefined,
            }}
          >
            <span
              className="w-2 h-2 rounded-full shrink-0"
              style={{
                backgroundColor: isSelected ? '#FFFFFF' : cat.color,
              }}
            />
            <span>{cat.name}</span>
            <span
              className={`px-1.5 py-0.2 rounded-full text-[10px] font-semibold ${
                isSelected
                  ? 'bg-black/20 text-white'
                  : 'bg-[var(--bg-subtle)] text-[var(--text-muted)]'
              }`}
            >
              {count}
            </span>
          </button>
        );
      })}

      {/* Add Custom Category Chip */}
      <button
        type="button"
        onClick={onAddCategoryClick}
        className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium bg-[var(--bg-canvas)] hover:bg-[var(--bg-surface-hover)] border border-dashed border-[var(--border-strong)] text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors shrink-0"
        title="Add Category"
      >
        <Plus className="w-3.5 h-3.5" />
        <span>New</span>
      </button>
    </div>
  );
};
