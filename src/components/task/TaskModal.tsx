import React, { useState } from 'react';
import { useForm, useFieldArray, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Modal } from '@/components/common/Modal';
import { Button } from '@/components/common/Button';
import { Input } from '@/components/common/Input';
import { useCategories } from '@/hooks/useCategories';
import { useSettings } from '@/hooks/useSettings';
import { getTodayDateString } from '@/lib/dateUtils';
import type { PriorityLevel, RecurrenceRule } from '@/types/database';
import {
  Calendar,
  Clock,
  Repeat,
  Plus,
  Trash2,
  Tag,
  AlertCircle,
  FileText,
  ListTodo,
} from 'lucide-react';

const taskSchema = z.object({
  title: z.string().min(1, 'Task title is required').max(200, 'Title too long'),
  description: z.string().max(1000).optional(),
  notes: z.string().max(5000).optional(),
  category_id: z.string().optional(),
  priority: z.enum(['low', 'medium', 'high'] as const),
  due_date: z.string().optional(),
  due_time: z.string().optional(),
  reminder_at: z.string().optional(),
  recurrence_type: z.enum(['none', 'daily', 'weekdays', 'weekly', 'monthly', 'custom'] as const),
  recurrence_interval: z.number().min(1).optional(),
  subtasks: z.array(z.object({ title: z.string().min(1, 'Subtask title cannot be empty') })),
});

type TaskFormData = z.infer<typeof taskSchema>;

interface TaskModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: {
    title: string;
    description?: string | null;
    notes?: string | null;
    category_id?: string | null;
    priority: PriorityLevel;
    due_date?: string | null;
    due_time?: string | null;
    reminder_at?: string | null;
    recurrence_rule?: RecurrenceRule | null;
    subtasks?: string[];
  }) => Promise<void>;
  defaultDate?: string;
  defaultCategoryId?: string;
}

export const TaskModal: React.FC<TaskModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  defaultDate,
  defaultCategoryId,
}) => {
  const { categories } = useCategories();
  const { settings } = useSettings();
  const [newSubtaskInput, setNewSubtaskInput] = useState('');
  const [showUnsavedWarning, setShowUnsavedWarning] = useState(false);

  const {
    register,
    handleSubmit,
    control,
    reset,
    watch,
    formState: { errors, isSubmitting, isDirty },
  } = useForm<TaskFormData>({
    resolver: zodResolver(taskSchema),
    defaultValues: {
      title: '',
      description: '',
      notes: '',
      category_id: defaultCategoryId || '',
      priority: settings.default_priority || 'medium',
      due_date: defaultDate || getTodayDateString(),
      due_time: '',
      reminder_at: '',
      recurrence_type: 'none',
      recurrence_interval: 1,
      subtasks: [],
    },
  });

  const { fields, append, remove } = useFieldArray({
    control,
    name: 'subtasks',
  });

  const recurrenceType = watch('recurrence_type');

  const handleFormSubmit = async (values: TaskFormData) => {
    let recurrenceRule: RecurrenceRule | null = null;
    if (values.recurrence_type !== 'none') {
      recurrenceRule = {
        type: values.recurrence_type,
        interval: values.recurrence_interval || 1,
      };
    }

    await onSubmit({
      title: values.title.trim(),
      description: values.description?.trim() || null,
      notes: values.notes?.trim() || null,
      category_id: values.category_id || null,
      priority: values.priority,
      due_date: values.due_date || null,
      due_time: values.due_time || null,
      reminder_at: values.reminder_at || null,
      recurrence_rule: recurrenceRule,
      subtasks: values.subtasks.map((s) => s.title.trim()),
    });

    reset();
    onClose();
  };

  const handleClose = () => {
    if (isDirty) {
      if (window.confirm('You have unsaved changes. Are you sure you want to discard them?')) {
        reset();
        onClose();
      }
    } else {
      reset();
      onClose();
    }
  };

  const handleAddSubtask = () => {
    if (newSubtaskInput.trim()) {
      append({ title: newSubtaskInput.trim() });
      setNewSubtaskInput('');
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title="Create New Task"
      description="Plan a focused objective with priorities, dates, and subtasks."
      maxWidth="lg"
    >
      <form onSubmit={handleSubmit(handleFormSubmit)} className="flex flex-col gap-4">
        {/* Title input */}
        <Input
          label="Title *"
          placeholder="What do you want to accomplish?"
          autoFocus
          error={errors.title?.message}
          {...register('title')}
        />

        {/* Description */}
        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-semibold text-[var(--text-secondary)] uppercase tracking-wider">
            Description
          </label>
          <textarea
            rows={2}
            placeholder="Add relevant context or description..."
            className="w-full bg-[var(--bg-surface)] text-[var(--text-primary)] placeholder-[var(--text-muted)] text-sm rounded-xl border border-[var(--border-subtle)] focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20 p-3 focus:outline-none shadow-subtle transition-all resize-none"
            {...register('description')}
          />
        </div>

        {/* Priority & Category Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {/* Priority */}
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-semibold text-[var(--text-secondary)] uppercase tracking-wider">
              Priority
            </label>
            <select
              className="w-full bg-[var(--bg-surface)] text-[var(--text-primary)] text-sm rounded-xl border border-[var(--border-subtle)] focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20 py-2 px-3 focus:outline-none shadow-subtle"
              {...register('priority')}
            >
              <option value="low">Low Priority</option>
              <option value="medium">Medium Priority</option>
              <option value="high">High Priority</option>
            </select>
          </div>

          {/* Category */}
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-semibold text-[var(--text-secondary)] uppercase tracking-wider">
              Category
            </label>
            <select
              className="w-full bg-[var(--bg-surface)] text-[var(--text-primary)] text-sm rounded-xl border border-[var(--border-subtle)] focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20 py-2 px-3 focus:outline-none shadow-subtle"
              {...register('category_id')}
            >
              <option value="">No Category</option>
              {categories.map((cat) => (
                <option key={cat.id} value={cat.id}>
                  {cat.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Due Date & Due Time Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {/* Due Date */}
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-semibold text-[var(--text-secondary)] uppercase tracking-wider flex items-center gap-1.5">
              <Calendar className="w-3.5 h-3.5 text-[var(--text-muted)]" />
              <span>Due Date</span>
            </label>
            <input
              type="date"
              className="w-full bg-[var(--bg-surface)] text-[var(--text-primary)] text-sm rounded-xl border border-[var(--border-subtle)] focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20 py-2 px-3 focus:outline-none shadow-subtle"
              {...register('due_date')}
            />
          </div>

          {/* Due Time */}
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-semibold text-[var(--text-secondary)] uppercase tracking-wider flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5 text-[var(--text-muted)]" />
              <span>Due Time</span>
            </label>
            <input
              type="time"
              className="w-full bg-[var(--bg-surface)] text-[var(--text-primary)] text-sm rounded-xl border border-[var(--border-subtle)] focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20 py-2 px-3 focus:outline-none shadow-subtle"
              {...register('due_time')}
            />
          </div>
        </div>

        {/* Recurrence Selector */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-semibold text-[var(--text-secondary)] uppercase tracking-wider flex items-center gap-1.5">
              <Repeat className="w-3.5 h-3.5 text-[var(--text-muted)]" />
              <span>Repeat</span>
            </label>
            <select
              className="w-full bg-[var(--bg-surface)] text-[var(--text-primary)] text-sm rounded-xl border border-[var(--border-subtle)] focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20 py-2 px-3 focus:outline-none shadow-subtle"
              {...register('recurrence_type')}
            >
              <option value="none">Never</option>
              <option value="daily">Every day</option>
              <option value="weekdays">Every weekday (Mon-Fri)</option>
              <option value="weekly">Every week</option>
              <option value="monthly">Every month</option>
              <option value="custom">Custom interval</option>
            </select>
          </div>

          {recurrenceType === 'custom' && (
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-semibold text-[var(--text-secondary)] uppercase tracking-wider">
                Repeat Every (Days)
              </label>
              <input
                type="number"
                min="1"
                className="w-full bg-[var(--bg-surface)] text-[var(--text-primary)] text-sm rounded-xl border border-[var(--border-subtle)] py-2 px-3 focus:outline-none"
                {...register('recurrence_interval', { valueAsNumber: true })}
              />
            </div>
          )}
        </div>

        {/* Subtasks Section */}
        <div className="flex flex-col gap-2 pt-2 border-t border-[var(--border-subtle)]">
          <div className="flex items-center justify-between">
            <label className="text-xs font-semibold text-[var(--text-secondary)] uppercase tracking-wider flex items-center gap-1.5">
              <ListTodo className="w-3.5 h-3.5 text-[var(--text-muted)]" />
              <span>Subtasks ({fields.length})</span>
            </label>
          </div>

          {/* Subtask list */}
          {fields.map((field, index) => (
            <div key={field.id} className="flex items-center gap-2">
              <span className="text-xs text-[var(--text-muted)] w-4 text-center">
                {index + 1}.
              </span>
              <input
                className="flex-1 bg-[var(--bg-surface)] text-sm rounded-lg border border-[var(--border-subtle)] px-2.5 py-1 text-[var(--text-primary)] focus:outline-none focus:border-brand-500"
                {...register(`subtasks.${index}.title` as const)}
              />
              <button
                type="button"
                onClick={() => remove(index)}
                className="p-1 text-[var(--text-muted)] hover:text-red-500"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>
          ))}

          {/* Quick add subtask row */}
          <div className="flex items-center gap-2 mt-1">
            <input
              type="text"
              placeholder="Add a step and click '+' or press Enter"
              value={newSubtaskInput}
              onChange={(e) => setNewSubtaskInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  handleAddSubtask();
                }
              }}
              className="flex-1 bg-[var(--bg-surface)] text-xs rounded-lg border border-[var(--border-subtle)] px-3 py-1.5 text-[var(--text-primary)] placeholder-[var(--text-muted)] focus:outline-none focus:border-brand-500"
            />
            <button
              type="button"
              onClick={handleAddSubtask}
              disabled={!newSubtaskInput.trim()}
              className="p-1.5 rounded-lg bg-[var(--bg-subtle)] hover:bg-[var(--bg-surface-hover)] text-[var(--text-secondary)] disabled:opacity-40"
            >
              <Plus className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Notes */}
        <div className="flex flex-col gap-1.5 pt-2 border-t border-[var(--border-subtle)]">
          <label className="text-xs font-semibold text-[var(--text-secondary)] uppercase tracking-wider flex items-center gap-1.5">
            <FileText className="w-3.5 h-3.5 text-[var(--text-muted)]" />
            <span>Notes (Markdown or thoughts)</span>
          </label>
          <textarea
            rows={2}
            placeholder="Detailed notes, checklist points, links..."
            className="w-full bg-[var(--bg-surface)] text-[var(--text-primary)] placeholder-[var(--text-muted)] text-sm rounded-xl border border-[var(--border-subtle)] focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20 p-3 focus:outline-none shadow-subtle resize-none"
            {...register('notes')}
          />
        </div>

        {/* Modal Actions */}
        <div className="flex items-center justify-between pt-4 border-t border-[var(--border-subtle)] mt-2">
          <span className="text-[11px] text-[var(--text-muted)] hidden sm:inline">
            Tip: Press <kbd className="font-mono bg-[var(--bg-subtle)] px-1 py-0.5 rounded border border-[var(--border-subtle)]">Ctrl+Enter</kbd> to save
          </span>

          <div className="flex items-center gap-2.5 ml-auto">
            <Button variant="secondary" onClick={handleClose} type="button">
              Cancel
            </Button>
            <Button variant="primary" type="submit" isLoading={isSubmitting}>
              Create Task
            </Button>
          </div>
        </div>
      </form>
    </Modal>
  );
};
