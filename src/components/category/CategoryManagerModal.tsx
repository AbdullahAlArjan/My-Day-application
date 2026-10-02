import React, { useState } from 'react';
import { Modal } from '@/components/common/Modal';
import { Button } from '@/components/common/Button';
import { Input } from '@/components/common/Input';
import { IconRenderer, AVAILABLE_CATEGORY_ICONS } from '@/components/common/IconRenderer';
import type { Category } from '@/types/database';
import { Trash2, Edit2, Plus, AlertTriangle, Check } from 'lucide-react';

const PRESET_COLORS = [
  '#3B82F6', // Blue
  '#10B981', // Emerald
  '#EF4444', // Red
  '#8B5CF6', // Purple
  '#F59E0B', // Amber
  '#EC4899', // Pink
  '#06B6D4', // Cyan
  '#6366F1', // Indigo
];

interface CategoryManagerModalProps {
  isOpen: boolean;
  onClose: () => void;
  categories: Category[];
  onCreateCategory: (cat: { name: string; color: string; icon: string }) => Promise<Category>;
  onUpdateCategory: (id: string, updates: Partial<Category>) => Promise<Category>;
  onDeleteCategory: (
    id: string,
    action: 'unassign' | 'reassign',
    targetCategoryId?: string
  ) => Promise<void>;
}

export const CategoryManagerModal: React.FC<CategoryManagerModalProps> = ({
  isOpen,
  onClose,
  categories,
  onCreateCategory,
  onUpdateCategory,
  onDeleteCategory,
}) => {
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [name, setName] = useState('');
  const [color, setColor] = useState(PRESET_COLORS[0]);
  const [icon, setIcon] = useState('Folder');
  const [isCreating, setIsCreating] = useState(false);

  // Safe delete dialog state
  const [categoryToDelete, setCategoryToDelete] = useState<Category | null>(null);
  const [deleteAction, setDeleteAction] = useState<'unassign' | 'reassign'>('unassign');
  const [targetCatId, setTargetCatId] = useState<string>('');
  const [isDeleting, setIsDeleting] = useState(false);

  const startCreate = () => {
    setEditingCategory(null);
    setName('');
    setColor(PRESET_COLORS[0]);
    setIcon('Folder');
    setIsCreating(true);
  };

  const startEdit = (cat: Category) => {
    setEditingCategory(cat);
    setName(cat.name);
    setColor(cat.color);
    setIcon(cat.icon);
    setIsCreating(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    if (editingCategory) {
      await onUpdateCategory(editingCategory.id, {
        name: name.trim(),
        color,
        icon,
      });
    } else {
      await onCreateCategory({
        name: name.trim(),
        color,
        icon,
      });
    }

    setIsCreating(false);
    setEditingCategory(null);
    setName('');
  };

  const handleConfirmDelete = async () => {
    if (!categoryToDelete) return;
    setIsDeleting(true);
    try {
      await onDeleteCategory(categoryToDelete.id, deleteAction, targetCatId || undefined);
      setCategoryToDelete(null);
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <>
      <Modal
        isOpen={isOpen && !categoryToDelete}
        onClose={onClose}
        title="Manage Categories"
        description="Organize your responsibilities with custom colors and icons."
        maxWidth="md"
      >
        <div className="flex flex-col gap-4">
          {!isCreating ? (
            <>
              {/* Category List */}
              <div className="flex flex-col gap-2 max-h-72 overflow-y-auto pr-1">
                {categories.map((cat) => (
                  <div
                    key={cat.id}
                    className="flex items-center justify-between p-3 rounded-xl bg-[var(--bg-canvas)] border border-[var(--border-subtle)]"
                  >
                    <div className="flex items-center gap-2.5">
                      <div
                        className="w-7 h-7 rounded-lg flex items-center justify-center text-white shrink-0 shadow-xs"
                        style={{ backgroundColor: cat.color }}
                      >
                        <IconRenderer name={cat.icon} className="w-3.5 h-3.5" />
                      </div>
                      <div className="flex flex-col">
                        <span className="text-sm font-semibold text-[var(--text-primary)]">
                          {cat.name}
                        </span>
                        <span className="text-[11px] text-[var(--text-muted)]">
                          {cat.task_count || 0} tasks ({cat.completed_count || 0} completed)
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-1.5">
                      <button
                        type="button"
                        onClick={() => startEdit(cat)}
                        className="p-1.5 rounded-lg text-[var(--text-secondary)] hover:bg-[var(--bg-surface-hover)] hover:text-[var(--text-primary)]"
                        title="Edit category"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setCategoryToDelete(cat);
                          setTargetCatId(
                            categories.find((c) => c.id !== cat.id)?.id || ''
                          );
                        }}
                        className="p-1.5 rounded-lg text-[var(--text-muted)] hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/30"
                        title="Delete category"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>

              {/* Add New Category Button */}
              <Button
                variant="secondary"
                onClick={startCreate}
                leftIcon={<Plus className="w-4 h-4" />}
                className="w-full mt-2"
              >
                Create New Category
              </Button>
            </>
          ) : (
            /* Category Create / Edit Form */
            <form onSubmit={handleSave} className="flex flex-col gap-4">
              <Input
                label="Category Name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Health, Finance, Side Projects"
                autoFocus
                required
              />

              {/* Color Picker */}
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold uppercase tracking-wider text-[var(--text-secondary)]">
                  Color
                </label>
                <div className="flex items-center gap-2 flex-wrap">
                  {PRESET_COLORS.map((c) => (
                    <button
                      key={c}
                      type="button"
                      onClick={() => setColor(c)}
                      className="w-7 h-7 rounded-full flex items-center justify-center transition-transform hover:scale-110 shadow-xs"
                      style={{ backgroundColor: c }}
                    >
                      {color === c && <Check className="w-4 h-4 text-white stroke-[3]" />}
                    </button>
                  ))}
                </div>
              </div>

              {/* Icon Selector */}
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold uppercase tracking-wider text-[var(--text-secondary)]">
                  Icon
                </label>
                <div className="grid grid-cols-6 gap-2 max-h-36 overflow-y-auto p-1 border border-[var(--border-subtle)] rounded-xl">
                  {AVAILABLE_CATEGORY_ICONS.map((iconName) => (
                    <button
                      key={iconName}
                      type="button"
                      onClick={() => setIcon(iconName)}
                      className={`p-2 rounded-lg flex items-center justify-center transition-colors ${
                        icon === iconName
                          ? 'bg-brand-500 text-white shadow-xs'
                          : 'text-[var(--text-secondary)] hover:bg-[var(--bg-surface-hover)]'
                      }`}
                    >
                      <IconRenderer name={iconName} className="w-4 h-4" />
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-[var(--border-subtle)]">
                <Button
                  variant="secondary"
                  type="button"
                  onClick={() => setIsCreating(false)}
                >
                  Back
                </Button>
                <Button variant="primary" type="submit">
                  {editingCategory ? 'Update Category' : 'Create Category'}
                </Button>
              </div>
            </form>
          )}
        </div>
      </Modal>

      {/* Safe Category Deletion Modal (Requirement 15) */}
      {categoryToDelete && (
        <Modal
          isOpen={true}
          onClose={() => setCategoryToDelete(null)}
          title="Delete Category Safely"
          maxWidth="sm"
          mobileBottomSheet={false}
        >
          <div className="flex flex-col gap-4">
            <div className="flex items-start gap-3 p-3 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-900 text-amber-800 dark:text-amber-200 text-xs">
              <AlertTriangle className="w-5 h-5 shrink-0 text-amber-600 dark:text-amber-400 mt-0.5" />
              <div>
                <p className="font-semibold mb-0.5">
                  Category "{categoryToDelete.name}" has {categoryToDelete.task_count || 0} associated tasks.
                </p>
                <p>
                  To prevent losing tasks, please decide what should happen to them:
                </p>
              </div>
            </div>

            <div className="flex flex-col gap-2.5">
              <label className="flex items-start gap-2.5 text-xs text-[var(--text-primary)] cursor-pointer">
                <input
                  type="radio"
                  name="deleteAction"
                  checked={deleteAction === 'unassign'}
                  onChange={() => setDeleteAction('unassign')}
                  className="mt-0.5 text-brand-600 focus:ring-brand-500"
                />
                <div>
                  <span className="font-semibold block">Remove category from tasks</span>
                  <span className="text-[var(--text-muted)]">Keep tasks as unassigned without deleting them</span>
                </div>
              </label>

              {categories.filter((c) => c.id !== categoryToDelete.id).length > 0 && (
                <label className="flex items-start gap-2.5 text-xs text-[var(--text-primary)] cursor-pointer">
                  <input
                    type="radio"
                    name="deleteAction"
                    checked={deleteAction === 'reassign'}
                    onChange={() => setDeleteAction('reassign')}
                    className="mt-0.5 text-brand-600 focus:ring-brand-500"
                  />
                  <div className="w-full">
                    <span className="font-semibold block">Move tasks to another category</span>
                    {deleteAction === 'reassign' && (
                      <select
                        value={targetCatId}
                        onChange={(e) => setTargetCatId(e.target.value)}
                        className="mt-1.5 w-full bg-[var(--bg-surface)] text-xs rounded-lg border border-[var(--border-subtle)] p-1.5"
                      >
                        {categories
                          .filter((c) => c.id !== categoryToDelete.id)
                          .map((c) => (
                            <option key={c.id} value={c.id}>
                              {c.name}
                            </option>
                          ))}
                      </select>
                    )}
                  </div>
                </label>
              )}
            </div>

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-[var(--border-subtle)]">
              <Button
                variant="secondary"
                onClick={() => setCategoryToDelete(null)}
                disabled={isDeleting}
              >
                Cancel
              </Button>
              <Button
                variant="danger"
                onClick={handleConfirmDelete}
                isLoading={isDeleting}
              >
                Delete Category
              </Button>
            </div>
          </div>
        </Modal>
      )}
    </>
  );
};
